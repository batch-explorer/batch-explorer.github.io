// Copyright 2026 The Swarm Authors. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { fetchBatchEvents } from '$lib/services/swarmscan'
import { publicClient } from '$lib/services/rpc-client'
import { POSTAGE_STAMP_ABI } from '$lib/abi'
import { POSTAGE_STAMP_ADDRESS, GNOSIS_BLOCK_TIME_MS } from '$lib/constants'
import type { BatchDetail, PostageEvent, BatchCreatedArgs, BatchTopUpArgs } from '$lib/types'

let batch = $state<BatchDetail | undefined>(undefined)
let expiryDate = $state<Date | undefined>(undefined)
let expired = $state(false)
let loading = $state(false)
let error = $state<string | undefined>(undefined)

function reconstructBatch(batchId: `0x${string}`, events: PostageEvent[]): BatchDetail | undefined {
  const creationEvent = events.find((e) => e.eventName === 'BatchCreated')
  if (!creationEvent) return undefined

  const created = creationEvent.args as BatchCreatedArgs
  let totalAmount = created.totalAmount
  let normalisedBalance = created.normalisedBalance
  let depth = created.depth

  for (const event of events) {
    if (event.eventName === 'BatchTopUp') {
      const args = event.args as BatchTopUpArgs
      totalAmount += args.topupAmount
      normalisedBalance = args.normalisedBalance
    } else if (event.eventName === 'BatchDepthIncrease') {
      const args = event.args as { newDepth: number; normalisedBalance: bigint }
      depth = args.newDepth
      normalisedBalance = args.normalisedBalance
    }
  }

  return {
    batchId,
    owner: created.owner,
    depth,
    bucketDepth: created.bucketDepth,
    immutableFlag: created.immutableFlag,
    totalAmount,
    normalisedBalance,
    creationBlock: creationEvent.blockNumber,
    creationTxHash: creationEvent.transactionHash,
    events,
  }
}

async function computeExpiry(
  normalisedBalance: bigint,
): Promise<{ date?: Date; expired: boolean }> {
  const [lastPrice, totalOutPayment] = await Promise.all([
    publicClient.readContract({
      address: POSTAGE_STAMP_ADDRESS,
      abi: POSTAGE_STAMP_ABI,
      functionName: 'lastPrice',
    }),
    publicClient.readContract({
      address: POSTAGE_STAMP_ADDRESS,
      abi: POSTAGE_STAMP_ABI,
      functionName: 'currentTotalOutPayment',
    }),
  ])

  if (normalisedBalance <= totalOutPayment) {
    return { expired: true }
  }

  if (lastPrice === 0n) {
    return { expired: false }
  }

  const remainingBlocks = (normalisedBalance - totalOutPayment) / lastPrice
  const remainingMs = Number(remainingBlocks) * GNOSIS_BLOCK_TIME_MS
  return { date: new Date(Date.now() + remainingMs), expired: false }
}

export const batchDetailStore = {
  get batch() {
    return batch
  },
  get expiryDate() {
    return expiryDate
  },
  get expired() {
    return expired
  },
  get loading() {
    return loading
  },
  get error() {
    return error
  },

  async loadBatch(batchId: string) {
    loading = true
    error = undefined
    batch = undefined
    expiryDate = undefined
    expired = false

    try {
      const normalizedId = (batchId.startsWith('0x') ? batchId : `0x${batchId}`) as `0x${string}`
      const events = await fetchBatchEvents(normalizedId)
      batch = reconstructBatch(normalizedId, events)

      if (!batch) {
        error = 'No BatchCreated event found for this batch ID'
        return
      }

      // Expiry is best-effort — don't fail the page if RPC call errors
      try {
        const expiry = await computeExpiry(batch.normalisedBalance)
        expiryDate = expiry.date
        expired = expiry.expired
      } catch {
        // Expiry will show as "Unknown"
      }
    } catch (e) {
      error = e instanceof Error ? e.message : String(e)
    } finally {
      loading = false
    }
  },

  clear() {
    batch = undefined
    expiryDate = undefined
    expired = false
    error = undefined
    loading = false
  },
}
