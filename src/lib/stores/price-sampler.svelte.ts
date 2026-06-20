// Copyright 2026 The Swarm Authors. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { samplePrices } from '$lib/services/price-sampler'
import type { PostageEvent } from '$lib/types'

export const SAMPLE_COUNT = 150

let events = $state<PostageEvent[]>([])
let progress = $state(0)
let loading = $state(false)
let error = $state<string | undefined>(undefined)
let token = 0
let controller: AbortController | undefined

// Cache by timeframe label — each label has fixed sample times, so re-selecting
// a range is instant. Plain object: it's not reactive state, just a memo.
const cache: Record<string, PostageEvent[]> = {}

export const priceSamplerStore = {
  get events() {
    return events
  },
  get progress() {
    return progress
  },
  get loading() {
    return loading
  },
  get error() {
    return error
  },

  // Latest token owns `loading` (same pattern as price-history): a superseded
  // run aborts and bails, the newest run resolves the spinner.
  async sample(label: string, cutoff: Date) {
    const cached = cache[label]
    if (cached) {
      events = cached
      progress = cached.length
      loading = false
      return
    }

    const mine = ++token
    controller?.abort() // cancel a superseded run's in-flight requests
    controller = new AbortController()
    const signal = controller.signal
    progress = 0
    loading = true
    error = undefined

    try {
      const result = await samplePrices(cutoff, SAMPLE_COUNT, signal, (n) => {
        if (mine === token) progress = n
      })
      if (mine !== token) return // superseded
      cache[label] = result
      events = result
    } catch (e) {
      if (mine === token) error = e instanceof Error ? e.message : String(e)
    } finally {
      if (mine === token) loading = false
    }
  },
}
