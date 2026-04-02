// Copyright 2026 The Swarm Authors. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { decodeEventLog } from 'viem'
import { POSTAGE_STAMP_ABI } from '$lib/abi'
import {
  SWARMSCAN_API_BASE,
  SWARMSCAN_STATS_URL,
  BLOCKSCOUT_API_URL,
  POSTAGE_STAMP_ADDRESS,
} from '$lib/constants'
import type {
  NetworkStats,
  PostageEvent,
  SwarmscanEvent,
  SwarmscanEventsResponse,
  BlockscoutLogEntry,
} from '$lib/types'

const SWARMSCAN_EVENT_NAME_MAP: Record<string, PostageEvent['eventName']> = {
  'batch-created': 'BatchCreated',
  'batch-top-up': 'BatchTopUp',
  'batch-depth-increase': 'BatchDepthIncrease',
  'price-update': 'PriceUpdate',
}

function mapSwarmscanEvent(raw: SwarmscanEvent): PostageEvent {
  const eventName = SWARMSCAN_EVENT_NAME_MAP[raw.name]
  if (!eventName) {
    throw new Error(`Unknown Swarmscan event name: ${raw.name}`)
  }

  const data = raw.data
  const common = {
    blockNumber: BigInt(raw.blockNumber),
    blockTime: new Date(raw.blockTime),
    transactionHash: raw.txHash as `0x${string}`,
    logIndex: raw.index,
  }

  switch (eventName) {
    case 'BatchCreated':
      return {
        eventName,
        args: {
          batchId: data.batchId as `0x${string}`,
          totalAmount: BigInt(data.totalAmount as number | string),
          normalisedBalance: BigInt(data.normalisedBalance as number | string),
          owner: data.owner as `0x${string}`,
          depth: data.depth as number,
          bucketDepth: data.bucketDepth as number,
          immutableFlag: data.immutableFlag as boolean,
        },
        ...common,
      }
    case 'BatchTopUp':
      return {
        eventName,
        args: {
          batchId: data.batchId as `0x${string}`,
          topupAmount: BigInt(data.topupAmount as number | string),
          normalisedBalance: BigInt(data.normalisedBalance as number | string),
        },
        ...common,
      }
    case 'BatchDepthIncrease':
      return {
        eventName,
        args: {
          batchId: data.batchId as `0x${string}`,
          newDepth: data.newDepth as number,
          normalisedBalance: BigInt(data.normalisedBalance as number | string),
        },
        ...common,
      }
    case 'PriceUpdate':
      return {
        eventName,
        args: {
          price: BigInt(data.price as number | string),
        },
        ...common,
      }
  }
}

function mapBlockscoutLog(log: BlockscoutLogEntry): PostageEvent {
  const decoded = decodeEventLog({
    abi: POSTAGE_STAMP_ABI,
    data: log.data as `0x${string}`,
    topics: log.topics as [`0x${string}`, ...`0x${string}`[]],
  })

  return {
    eventName: decoded.eventName as PostageEvent['eventName'],
    args: decoded.args as PostageEvent['args'],
    blockNumber: BigInt(log.blockNumber),
    blockTime: new Date(Number(log.timeStamp) * 1000),
    transactionHash: log.transactionHash as `0x${string}`,
    logIndex: Number(log.logIndex),
  }
}

export async function fetchSwarmscanStats(): Promise<NetworkStats> {
  const response = await fetch(SWARMSCAN_STATS_URL)
  if (!response.ok) {
    throw new Error(`Swarmscan API error: ${response.status}`)
  }
  const data: { pricePerGBPerMonth: number } = await response.json()
  return { pricePerGBPerMonth: data.pricePerGBPerMonth }
}

const POSTAGE_EVENT_TYPES = ['batch-created', 'batch-top-up', 'batch-depth-increase'] as const

export interface EventCursors {
  'batch-created'?: string
  'batch-top-up'?: string
  'batch-depth-increase'?: string
}

async function fetchEventsByType(
  eventType: string,
  cursor?: string,
): Promise<{ events: PostageEvent[]; nextCursor?: string }> {
  const url = new URL(`${SWARMSCAN_API_BASE}/events/postage-stamp/${eventType}`)
  if (cursor) {
    url.searchParams.set('next', cursor)
  }

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Swarmscan API error: ${response.status}`)
  }

  const data: SwarmscanEventsResponse = await response.json()
  const events = (data.events ?? []).map(mapSwarmscanEvent)

  return { events, nextCursor: data.next }
}

export async function fetchRecentEvents(cursors?: EventCursors): Promise<{
  events: PostageEvent[]
  nextCursors: EventCursors
}> {
  const results = await Promise.all(
    POSTAGE_EVENT_TYPES.map((type) => fetchEventsByType(type, cursors?.[type])),
  )

  const nextCursors: EventCursors = {}
  const allEvents: PostageEvent[] = []

  for (let i = 0; i < POSTAGE_EVENT_TYPES.length; i++) {
    allEvents.push(...results[i].events)
    if (results[i].nextCursor) {
      nextCursors[POSTAGE_EVENT_TYPES[i]] = results[i].nextCursor
    }
  }

  allEvents.sort((a, b) => {
    if (a.blockNumber !== b.blockNumber) return Number(b.blockNumber - a.blockNumber)
    return b.logIndex - a.logIndex
  })

  return { events: allEvents, nextCursors }
}

export async function fetchBatchEvents(batchId: string): Promise<PostageEvent[]> {
  const paddedId = batchId.startsWith('0x') ? batchId : `0x${batchId}`

  const params = new URLSearchParams({
    module: 'logs',
    action: 'getLogs',
    address: POSTAGE_STAMP_ADDRESS,
    topic1: paddedId,
    fromBlock: '0',
    toBlock: 'latest',
  })

  const response = await fetch(`${BLOCKSCOUT_API_URL}?${params}`)
  if (!response.ok) {
    throw new Error(`Blockscout API error: ${response.status}`)
  }

  const data: { status: string; result: BlockscoutLogEntry[] | string } = await response.json()

  if (data.status !== '1' || !Array.isArray(data.result)) {
    return []
  }

  return data.result.map(mapBlockscoutLog).sort((a, b) => {
    if (a.blockNumber !== b.blockNumber) return Number(a.blockNumber - b.blockNumber)
    return a.logIndex - b.logIndex
  })
}
