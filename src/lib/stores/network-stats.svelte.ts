// Copyright 2026 The Swarm Authors. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { fetchSwarmscanStats } from '$lib/services/swarmscan'
import { publicClient } from '$lib/services/rpc-client'
import { BZZ_TOKEN_ABI, POSTAGE_STAMP_VIEWS_ABI } from '$lib/abi'
import { POSTAGE_STAMP_ADDRESS } from '$lib/constants'
import type { NetworkStats } from '$lib/types'

let stats = $state<NetworkStats | undefined>(undefined)
let currentBlock = $state<bigint | undefined>(undefined)
let contractBalance = $state<bigint | undefined>(undefined)
let loading = $state(false)

export const networkStatsStore = {
  get stats() {
    return stats
  },
  get currentBlock() {
    return currentBlock
  },
  get contractBalance() {
    return contractBalance
  },
  get loading() {
    return loading
  },

  async fetch() {
    if (loading) return
    loading = true

    try {
      const [swarmscanStats, blockNumber] = await Promise.all([
        fetchSwarmscanStats(),
        publicClient.getBlockNumber(),
      ])
      stats = swarmscanStats
      currentBlock = blockNumber
    } catch {
      // Stats are non-critical, fail silently
    }

    try {
      const tokenAddress = await publicClient.readContract({
        address: POSTAGE_STAMP_ADDRESS,
        abi: POSTAGE_STAMP_VIEWS_ABI,
        functionName: 'bzzToken',
      })
      contractBalance = await publicClient.readContract({
        address: tokenAddress,
        abi: BZZ_TOKEN_ABI,
        functionName: 'balanceOf',
        args: [POSTAGE_STAMP_ADDRESS],
      })
    } catch {
      // Balance is non-critical, fail silently
    }

    loading = false
  },
}
