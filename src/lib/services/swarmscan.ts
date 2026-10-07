// Copyright 2026 The Swarm Authors. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { fetchPostageLogs } from '$lib/services/event-fetcher'
import { SWARMSCAN_API_BASE, SWARMSCAN_STATS_URL, POSTAGE_STAMP_DEPLOY_BLOCK } from '$lib/constants'
import type {
  NetworkStats,
  PostageEvent,
  SwarmscanEvent,
  SwarmscanEventsResponse,
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
    txSender: raw.txSender as `0x${string}`,
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

export async function fetchSwarmscanStats(): Promise<NetworkStats> {
  const response = await fetch(SWARMSCAN_STATS_URL)
  if (!response.ok) {
    throw new Error(`Swarmscan API error: ${response.status}`)
  }
  const data: { pricePerGBPerMonth: number } = await response.json()
  return { pricePerGBPerMonth: data.pricePerGBPerMonth }
}

export const POSTAGE_EVENT_TYPES = [
  'batch-created',
  'batch-top-up',
  'batch-depth-increase',
] as const

export type PostageEventType = (typeof POSTAGE_EVENT_TYPES)[number]

export async function fetchEventsByType(
  eventType: string,
  cursor?: string,
): Promise<{ events: PostageEvent[]; nextCursor?: string }> {
  const url = new URL(`${SWARMSCAN_API_BASE}/events/postage-stamp/${eventType}`)
  if (cursor) {
    url.searchParams.set('start', cursor)
  }

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Swarmscan API error: ${response.status}`)
  }

  const data: SwarmscanEventsResponse = await response.json()
  const events = (data.events ?? []).map(mapSwarmscanEvent)

  return { events, nextCursor: data.next }
}

export async function fetchPriceUpdates(
  cursor?: string,
): Promise<{ events: PostageEvent[]; nextCursor?: string }> {
  return fetchEventsByType('price-update', cursor)
}

export async function fetchBatchEvents(batchId: string): Promise<PostageEvent[]> {
  const paddedId = (batchId.startsWith('0x') ? batchId : `0x${batchId}`) as `0x${string}`

  const events = await fetchPostageLogs([null, paddedId], POSTAGE_STAMP_DEPLOY_BLOCK)

  return events.sort((a, b) => {
    if (a.blockNumber !== b.blockNumber) return Number(a.blockNumber - b.blockNumber)
    return a.logIndex - b.logIndex
  })
}
