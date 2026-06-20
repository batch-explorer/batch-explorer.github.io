// Copyright 2026 The Swarm Authors. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { publicClient } from '$lib/services/rpc-client'
import { mapBlockscoutLog } from '$lib/services/swarmscan'
import {
  BLOCKSCOUT_API_URL,
  FIRST_PRICE_BLOCK,
  FIRST_PRICE_TIME_MS,
  POSTAGE_STAMP_ADDRESS,
  PRICE_UPDATE_TOPIC,
} from '$lib/constants'
import type { BlockscoutLogEntry, PostageEvent } from '$lib/types'

const WINDOW_BLOCKS = 250 // ±250 blocks ≈ ±21 min; price events fire every ~13 min.
const CONCURRENCY = 6
const MAX_RETRIES = 4 // for Blockscout 429s

// Primary rate limiter — lower this if Blockscout returns 429s, raise for speed.
// At 10/s a ~150-request 1y run takes ~15s.
const REQUESTS_PER_SECOND = 10
const MIN_REQUEST_INTERVAL_MS = 1000 / REQUESTS_PER_SECOND

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// Global gate: space out request starts across all in-flight runs so bursts
// (and rapid timeframe clicks) stay under the rate limit.
let nextSlot = 0
async function throttle() {
  const now = Date.now()
  const slot = Math.max(now, nextSlot)
  nextSlot = slot + MIN_REQUEST_INTERVAL_MS
  if (slot > now) await sleep(slot - now)
}

async function fetchWindow(
  fromBlock: number,
  toBlock: number,
  signal: AbortSignal,
): Promise<PostageEvent[]> {
  const params = new URLSearchParams({
    module: 'logs',
    action: 'getLogs',
    address: POSTAGE_STAMP_ADDRESS,
    topic0: PRICE_UPDATE_TOPIC,
    fromBlock: String(Math.max(0, fromBlock)),
    toBlock: String(toBlock),
  })
  const url = `${BLOCKSCOUT_API_URL}?${params}`

  // Retry on 429 with exponential backoff — also self-throttles under load.
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (signal.aborted) return []
    await throttle()
    if (signal.aborted) return [] // superseded while queued
    let response: Response
    try {
      response = await fetch(url, { signal })
    } catch {
      return [] // aborted or network error — drop this sample
    }
    if (response.status === 429) {
      await sleep(300 * 2 ** attempt)
      continue
    }
    if (!response.ok) return []
    const data: { status: string; result: BlockscoutLogEntry[] | string } = await response.json()
    if (data.status !== '1' || !Array.isArray(data.result)) return []
    return data.result.map(mapBlockscoutLog)
  }
  return []
}

// Sample ~`samples` price points by reading a small block window at evenly-spaced
// *block positions* across [startBlock, latest]. Block-spacing (not time) avoids
// the unreliable time→block estimation: Gnosis block production is irregular, so
// estimating a block from a target time can be off by thousands of blocks. We
// plot each event at its real timestamp, so non-uniform time spacing is correct.
// Bounded to ~`samples` requests regardless of timeframe.
export async function samplePrices(
  cutoff: Date,
  samples = 150,
  signal: AbortSignal = new AbortController().signal,
  onProgress?: (done: number) => void,
): Promise<PostageEvent[]> {
  const latest = await publicClient.getBlock()
  if (signal.aborted) return []
  const latestNum = Number(latest.number)
  const tNow = Number(latest.timestamp) * 1000

  // Start block: exact for "All" (cutoff at/before first event), else a rough
  // estimate from the average block time — a few-days error at the left edge is
  // only cosmetic, and the chart x-axis uses each event's real timestamp.
  const avgBlockTimeMs = (tNow - FIRST_PRICE_TIME_MS) / (latestNum - FIRST_PRICE_BLOCK)
  const startBlock =
    cutoff.getTime() <= FIRST_PRICE_TIME_MS
      ? FIRST_PRICE_BLOCK
      : Math.max(
          FIRST_PRICE_BLOCK,
          Math.round(latestNum - (tNow - cutoff.getTime()) / avgBlockTimeMs),
        )

  const step = (latestNum - startBlock) / (samples - 1)
  const targets = Array.from({ length: samples }, (_, i) => Math.round(startBlock + step * i))

  const picked = new Map<string, PostageEvent>()
  let done = 0
  for (let i = 0; i < targets.length && !signal.aborted; i += CONCURRENCY) {
    const batch = targets.slice(i, i + CONCURRENCY)
    const results = await Promise.all(
      batch.map(async (target) => {
        const logs = await fetchWindow(target - WINDOW_BLOCKS, target + WINDOW_BLOCKS, signal)
        onProgress?.(++done)
        if (logs.length === 0) return undefined
        // event whose block is closest to the target position
        return logs.reduce((best, e) =>
          Math.abs(Number(e.blockNumber) - target) < Math.abs(Number(best.blockNumber) - target)
            ? e
            : best,
        )
      }),
    )
    for (const e of results) {
      if (e) picked.set(`${e.transactionHash}-${e.logIndex}`, e)
    }
  }

  return [...picked.values()].sort((a, b) => {
    const d = (a.blockTime?.getTime() ?? 0) - (b.blockTime?.getTime() ?? 0)
    return d !== 0 ? d : Number(a.blockNumber - b.blockNumber)
  })
}
