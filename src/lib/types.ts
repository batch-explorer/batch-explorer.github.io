// Copyright 2026 The Swarm Authors. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

export interface BatchCreatedArgs {
  batchId: `0x${string}`
  totalAmount: bigint
  normalisedBalance: bigint
  owner: `0x${string}`
  depth: number
  bucketDepth: number
  immutableFlag: boolean
}

export interface BatchTopUpArgs {
  batchId: `0x${string}`
  topupAmount: bigint
  normalisedBalance: bigint
}

export interface BatchDepthIncreaseArgs {
  batchId: `0x${string}`
  newDepth: number
  normalisedBalance: bigint
}

export interface PriceUpdateArgs {
  price: bigint
}

export type PostageEventArgs =
  | BatchCreatedArgs
  | BatchTopUpArgs
  | BatchDepthIncreaseArgs
  | PriceUpdateArgs

export type PostageEventName = 'BatchCreated' | 'BatchTopUp' | 'BatchDepthIncrease' | 'PriceUpdate'

export interface PostageEvent {
  eventName: PostageEventName
  args: PostageEventArgs
  blockNumber: bigint
  blockTime?: Date
  transactionHash: `0x${string}`
  logIndex: number
}

export interface BatchDetail {
  batchId: `0x${string}`
  owner: `0x${string}`
  depth: number
  bucketDepth: number
  immutableFlag: boolean
  totalAmount: bigint
  normalisedBalance: bigint
  creationBlock: bigint
  creationTxHash: `0x${string}`
  events: PostageEvent[]
}

export interface NetworkStats {
  pricePerGBPerMonth: number
}

export interface TransactionDetail {
  hash: `0x${string}`
  blockNumber: bigint
  blockTime?: Date
  from: `0x${string}`
  to: `0x${string}` | undefined
  gasUsed: bigint
  status: 'success' | 'reverted'
  events: PostageEvent[]
}

export type SwarmscanEventName =
  | 'batch-created'
  | 'batch-top-up'
  | 'batch-depth-increase'
  | 'price-update'

export interface SwarmscanEvent {
  contract: string
  name: SwarmscanEventName
  address: string
  topics: string[]
  blockNumber: number
  blockTime: string
  txHash: string
  txIndex: number
  txSender: string
  blockHash: string
  index: number
  data: Record<string, unknown>
}

export interface SwarmscanEventsResponse {
  events: SwarmscanEvent[] | undefined
  next?: string
}

export interface BlockscoutLogEntry {
  address: string
  topics: string[]
  data: string
  blockNumber: string
  timeStamp: string
  logIndex: string
  transactionHash: string
  transactionIndex: string
}
