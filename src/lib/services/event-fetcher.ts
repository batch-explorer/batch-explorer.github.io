// Copyright 2026 The Swarm Authors. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { decodeEventLog, numberToHex, parseEventLogs } from 'viem'
import { publicClient } from './rpc-client'
import { POSTAGE_STAMP_ABI } from '$lib/abi'
import { POSTAGE_STAMP_ADDRESS } from '$lib/constants'
import type { PostageEvent, TransactionDetail } from '$lib/types'

export async function fetchTransactionDetail(hash: `0x${string}`): Promise<TransactionDetail> {
  const [tx, receipt] = await Promise.all([
    publicClient.getTransaction({ hash }),
    publicClient.getTransactionReceipt({ hash }),
  ])

  const block = await publicClient.getBlock({ blockNumber: receipt.blockNumber })
  const blockTime = new Date(Number(block.timestamp) * 1000)

  const parsed = parseEventLogs({
    abi: POSTAGE_STAMP_ABI,
    logs: receipt.logs,
  })

  const events: PostageEvent[] = parsed.map((log) => ({
    eventName: log.eventName as PostageEvent['eventName'],
    args: log.args as PostageEvent['args'],
    blockNumber: receipt.blockNumber,
    transactionHash: hash,
    logIndex: log.logIndex ?? 0,
  }))

  return {
    hash,
    blockNumber: receipt.blockNumber,
    blockTime,
    from: tx.from,
    to: tx.to ?? undefined,
    gasUsed: receipt.gasUsed,
    status: receipt.status === 'success' ? 'success' : 'reverted',
    events,
  }
}

type Hex = `0x${string}`

interface RpcLog {
  topics: [Hex, ...Hex[]]
  data: Hex
  blockNumber: Hex
  blockTimestamp?: Hex
  transactionHash: Hex
  logIndex: Hex
}

// Raw eth_getLogs (not publicClient.getLogs) to keep `blockTimestamp`, which the
// Gnosis nodes return and saves a getBlock call per event.
export async function fetchPostageLogs(
  topics: (Hex | null)[],
  fromBlock: number,
  toBlock?: number,
): Promise<PostageEvent[]> {
  const logs = (await publicClient.request({
    method: 'eth_getLogs',
    params: [
      {
        address: POSTAGE_STAMP_ADDRESS,
        topics,
        fromBlock: numberToHex(Math.max(0, fromBlock)),
        toBlock: toBlock === undefined ? 'latest' : numberToHex(toBlock),
      },
    ],
  })) as unknown as RpcLog[]

  return logs.map((log) => {
    const decoded = decodeEventLog({ abi: POSTAGE_STAMP_ABI, data: log.data, topics: log.topics })
    return {
      eventName: decoded.eventName as PostageEvent['eventName'],
      args: decoded.args as PostageEvent['args'],
      blockNumber: BigInt(log.blockNumber),
      blockTime: log.blockTimestamp ? new Date(Number(log.blockTimestamp) * 1000) : undefined,
      transactionHash: log.transactionHash,
      logIndex: Number(log.logIndex),
    }
  })
}
