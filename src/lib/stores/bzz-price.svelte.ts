// Copyright 2026 The Swarm Authors. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

const COINGECKO_BZZ_PRICE_URL =
  'https://api.coingecko.com/api/v3/simple/price?ids=swarm-bzz&vs_currencies=usd'

let price = $state<number | undefined>(undefined)
let loading = $state(false)

export const bzzPriceStore = {
  get price() {
    return price
  },
  get loading() {
    return loading
  },

  async fetch() {
    if (loading) return
    loading = true

    try {
      const response = await fetch(COINGECKO_BZZ_PRICE_URL)
      if (!response.ok) return
      const data: { 'swarm-bzz': { usd: number } } = await response.json()
      price = data['swarm-bzz'].usd
    } catch {
      // Price is non-critical, fail silently
    } finally {
      loading = false
    }
  },
}
