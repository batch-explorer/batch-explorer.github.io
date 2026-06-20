// Copyright 2026 The Swarm Authors. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { BLOCKS_PER_MONTH, CHUNK_SIZE, CHUNKS_PER_GB, PLUR_PER_BZZ } from './constants'

export function formatExpiry(date: Date | undefined, isExpired: boolean): string {
  if (isExpired) return 'Expired'
  if (!date) return 'Unknown'
  return date.toLocaleString()
}

export function formatBzz(plur: bigint): string {
  const whole = plur / PLUR_PER_BZZ
  const remainder = plur % PLUR_PER_BZZ
  if (remainder === 0n) return whole.toString()
  const decimals = remainder.toString().padStart(16, '0')
  const firstNonZero = decimals.search(/[1-9]/)
  const places = firstNonZero + 2
  const raw = Number(`${whole}.${decimals}`)
  return raw.toFixed(places)
}

export function formatUsd(plur: bigint, bzzPrice: number | undefined): string | undefined {
  if (bzzPrice === undefined) return undefined
  const bzz = Number(formatBzz(plur))
  const usd = bzz * bzzPrice
  if (usd < 0.01) return '<$0.01'
  return `$${usd.toFixed(2)}`
}

// Contract unit price (PLUR per chunk per block) → storage cost in PLUR per GB per month.
export function pricePerGbMonth(price: bigint): bigint {
  return price * BigInt(CHUNKS_PER_GB) * BigInt(BLOCKS_PER_MONTH)
}

export function formatStorageCapacity(depth: number, fractionDigits = 0): string {
  const chunks = 2 ** depth
  const bytes = chunks * CHUNK_SIZE
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)}MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(fractionDigits)}GB`
}
