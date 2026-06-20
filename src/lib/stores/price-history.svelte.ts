// Copyright 2026 The Swarm Authors. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { fetchPriceUpdates } from '$lib/services/swarmscan'
import type { PostageEvent } from '$lib/types'

// Safety ceiling: ~600 pages * 100 ≈ 60k events ≈ ~1.4yr of ~12-min events.
const MAX_PAGES = 600

let events = $state<PostageEvent[]>([])
let cursor: string | undefined = undefined
let loading = $state(false)
let error = $state<string | undefined>(undefined)
let token = 0

export const priceHistoryStore = {
  get events() {
    return events
  },
  get loading() {
    return loading
  },
  get error() {
    return error
  },
  get oldestLoaded(): Date | undefined {
    return events[events.length - 1]?.blockTime
  },

  // Paginate backward until history reaches `cutoff` (or runs out). Accumulates
  // and caches, so a later shorter range never refetches. The latest call (by
  // `token`) always owns `loading`: a superseded loop bails without touching it,
  // and the newest call's `finally` resolves it — so rapid clicks can't get the
  // spinner stuck. A "covered" selection breaks immediately and still resolves.
  async ensureCovered(cutoff: Date) {
    const mine = ++token
    loading = true
    error = undefined
    let pages = 0

    try {
      while (mine === token && pages < MAX_PAGES) {
        const last = events[events.length - 1]?.blockTime
        if (last && last.getTime() <= cutoff.getTime()) break // cached: deep enough
        if (events.length > 0 && !cursor) break // no more history

        const result = await fetchPriceUpdates(cursor)
        if (mine !== token) return // superseded mid-flight; newer call owns loading
        events = events.length ? [...events, ...result.events] : result.events
        cursor = result.nextCursor
        pages++
      }
    } catch (e) {
      if (mine === token) error = e instanceof Error ? e.message : String(e)
    } finally {
      if (mine === token) loading = false
    }
  },
}
