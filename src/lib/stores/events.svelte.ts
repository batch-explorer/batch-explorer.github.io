// Copyright 2026 The Swarm Authors. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import {
  fetchEventsByType,
  POSTAGE_EVENT_TYPES,
  type PostageEventType,
} from '$lib/services/swarmscan'
import type { PostageEvent } from '$lib/types'

interface Buffer {
  events: PostageEvent[]
  cursor?: string
}

function emptyBuffers(): Record<PostageEventType, Buffer> {
  const out = {} as Record<PostageEventType, Buffer>
  for (const t of POSTAGE_EVENT_TYPES) out[t] = { events: [] }
  return out
}

const keyOf = (e: PostageEvent) => `${e.transactionHash}-${e.logIndex}`

let bufs = $state<Record<PostageEventType, Buffer>>(emptyBuffers())
let loading = $state(false)
let error = $state<string | undefined>(undefined)

// The three event types arrive newest-first but at very different densities, so
// the merged feed is only *complete* down to the shallowest page's floor. The
// boundary is the highest "oldest fetched block" among types that still have more
// below (a cursor) — below it some type is missing, so we hide it. This yields a
// true reverse-chronological window instead of a per-type clump.
const merged = $derived.by(() => {
  let boundary = 0n
  for (const t of POSTAGE_EVENT_TYPES) {
    const b = bufs[t]
    if (b.cursor && b.events.length) {
      const oldest = b.events[b.events.length - 1].blockNumber
      if (oldest > boundary) boundary = oldest
    }
  }

  const all = POSTAGE_EVENT_TYPES.flatMap((t) => bufs[t].events).filter(
    (e) => e.blockNumber >= boundary,
  )
  all.sort((a, b) => {
    if (a.blockNumber !== b.blockNumber) return Number(b.blockNumber - a.blockNumber)
    return b.logIndex - a.logIndex
  })
  return all
})

// The type that defines the current boundary — loading its next page extends the
// window with the least fetching.
function bindingType(): PostageEventType | undefined {
  let binding: PostageEventType | undefined
  let max = 0n
  for (const t of POSTAGE_EVENT_TYPES) {
    const b = bufs[t]
    if (b.cursor && b.events.length && b.events[b.events.length - 1].blockNumber > max) {
      max = b.events[b.events.length - 1].blockNumber
      binding = t
    }
  }
  // Fallback: a type with a cursor but no events yet (shouldn't happen post-load).
  return binding ?? POSTAGE_EVENT_TYPES.find((t) => bufs[t].cursor)
}

export const eventsStore = {
  get events() {
    return merged
  },
  get loading() {
    return loading
  },
  get error() {
    return error
  },
  get hasMore() {
    return POSTAGE_EVENT_TYPES.some((t) => bufs[t].cursor)
  },

  async loadInitial() {
    if (loading) return
    loading = true
    error = undefined
    try {
      const results = await Promise.all(POSTAGE_EVENT_TYPES.map((t) => fetchEventsByType(t)))
      const next = emptyBuffers()
      POSTAGE_EVENT_TYPES.forEach((t, i) => {
        next[t] = { events: results[i].events, cursor: results[i].nextCursor }
      })
      bufs = next
    } catch (e) {
      error = e instanceof Error ? e.message : String(e)
    } finally {
      loading = false
    }
  },

  async loadMore() {
    const t = bindingType()
    if (loading || !t) return
    loading = true
    error = undefined
    try {
      const result = await fetchEventsByType(t, bufs[t].cursor)
      bufs = {
        ...bufs,
        [t]: { events: [...bufs[t].events, ...result.events], cursor: result.nextCursor },
      }
    } catch (e) {
      error = e instanceof Error ? e.message : String(e)
    } finally {
      loading = false
    }
  },

  async refresh() {
    if (loading) return
    loading = true
    error = undefined
    try {
      const results = await Promise.all(POSTAGE_EVENT_TYPES.map((t) => fetchEventsByType(t)))
      const next = { ...bufs }
      POSTAGE_EVENT_TYPES.forEach((t, i) => {
        const seen: Record<string, true> = {}
        for (const e of bufs[t].events) seen[keyOf(e)] = true
        const fresh = results[i].events.filter((e) => !seen[keyOf(e)])
        if (fresh.length > 0) next[t] = { ...bufs[t], events: [...fresh, ...bufs[t].events] }
      })
      bufs = next
    } catch (e) {
      error = e instanceof Error ? e.message : String(e)
    } finally {
      loading = false
    }
  },
}
