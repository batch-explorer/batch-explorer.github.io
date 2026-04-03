// Copyright 2026 The Swarm Authors. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { parseEventLogs } from 'viem'
import { publicClient } from './rpc-client'
import { POSTAGE_STAMP_ABI } from '$lib/abi'
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
