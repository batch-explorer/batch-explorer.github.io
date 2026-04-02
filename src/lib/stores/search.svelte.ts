// Copyright 2026 The Swarm Authors. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { goto } from '$app/navigation'
import { resolveRoute } from '$app/paths'
import { BATCH_ID_LENGTH, TX_HASH_LENGTH } from '$lib/constants'

type SearchType = 'batch' | 'tx' | undefined

const HEX_PATTERN = /^(0x)?[0-9a-fA-F]+$/

let query = $state('')

function detectType(input: string): SearchType {
  const trimmed = input.trim()
  if (!HEX_PATTERN.test(trimmed)) return undefined

  if (trimmed.startsWith('0x') && trimmed.length === TX_HASH_LENGTH) return 'tx'
  if (!trimmed.startsWith('0x') && trimmed.length === BATCH_ID_LENGTH) return 'batch'
  if (trimmed.startsWith('0x') && trimmed.length === BATCH_ID_LENGTH + 2) return 'batch'

  return undefined
}

export const searchStore = {
  get query() {
    return query
  },
  set query(v: string) {
    query = v
  },

  get searchType(): SearchType {
    return detectType(query)
  },

  async navigate() {
    const trimmed = query.trim()
    const type = detectType(trimmed)

    if (type === 'batch') {
      const batchId = trimmed.startsWith('0x') ? trimmed.slice(2) : trimmed
      await goto(resolveRoute('/batch/[id]', { id: batchId }))
    } else if (type === 'tx') {
      await goto(resolveRoute('/tx/[hash]', { hash: trimmed }))
    }
  },
}
