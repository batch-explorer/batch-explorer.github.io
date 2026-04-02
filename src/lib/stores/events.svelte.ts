// Copyright 2026 The Swarm Authors. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { fetchRecentEvents, type EventCursors } from '$lib/services/swarmscan'
import type { PostageEvent } from '$lib/types'

let events = $state<PostageEvent[]>([])
let loading = $state(false)
let error = $state<string | undefined>(undefined)
let cursors = $state<EventCursors | undefined>(undefined)

export const eventsStore = {
  get events() {
    return events
  },
  get loading() {
    return loading
  },
  get error() {
    return error
  },
  get hasMore() {
    return cursors !== undefined && Object.keys(cursors).length > 0
  },

  async loadInitial() {
    if (loading) return
    loading = true
    error = undefined

    try {
      const result = await fetchRecentEvents()
      events = result.events
      cursors = result.nextCursors
    } catch (e) {
      error = e instanceof Error ? e.message : String(e)
    } finally {
      loading = false
    }
  },

  async loadMore() {
    if (loading || !cursors || Object.keys(cursors).length === 0) return
    loading = true
    error = undefined

    try {
      const result = await fetchRecentEvents(cursors)
      events = [...events, ...result.events]
      cursors = result.nextCursors
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
      const result = await fetchRecentEvents()
      const existingKeys: Record<string, true> = {}
      for (const e of events) {
        existingKeys[`${e.transactionHash}-${e.logIndex}`] = true
      }
      const newEvents = result.events.filter(
        (e) => !existingKeys[`${e.transactionHash}-${e.logIndex}`],
      )
      if (newEvents.length > 0) {
        events = [...newEvents, ...events]
      }
    } catch (e) {
      error = e instanceof Error ? e.message : String(e)
    } finally {
      loading = false
    }
  },
}
