<!--
  Copyright 2026 The Swarm Authors. All rights reserved.
  SPDX-License-Identifier: Apache-2.0
-->

<script lang="ts">
  import { resolveRoute } from '$app/paths'
  import HexDisplay from '$lib/components/hex-display.svelte'
  import { GNOSISSCAN_BASE_URL } from '$lib/constants'
  import type {
    PostageEvent,
    BatchCreatedArgs,
    BatchTopUpArgs,
    BatchDepthIncreaseArgs,
    PriceUpdateArgs,
  } from '$lib/types'
  import { formatBzz, formatStorageCapacity, formatUsd } from '$lib/format'
  import EventBadge from './event-badge.svelte'
  import { networkStatsStore } from '$lib/stores/network-stats.svelte'
  import { bzzPriceStore } from '$lib/stores/bzz-price.svelte'

  interface Props {
    event: PostageEvent
  }

  let { event }: Props = $props()
  let batchDepth = $state<number | undefined>(undefined)

  // Track batch depth when we see a BatchCreated event
  $effect(() => {
    if (event.eventName === 'BatchCreated') {
      const args = event.args as BatchCreatedArgs
      batchDepth = args.depth
    }
  })

  function getBatchId(event: PostageEvent): string | undefined {
    if (event.eventName === 'PriceUpdate') return undefined
    const args = event.args as BatchCreatedArgs | BatchTopUpArgs | BatchDepthIncreaseArgs
    return args.batchId.slice(2)
  }

  function calculateBatchDuration(depth: number, totalAmount: bigint): string {
    // Calculate approximate duration based on depth and amount
    // This is a simplified calculation - in reality it depends on usage
    // For display purposes, we'll show an estimate based on typical usage

    const chunks = 2 ** depth
    const storageGB = (chunks * 4096) / (1024 * 1024 * 1024)

    // Use network stats price if available, otherwise use typical price
    const pricePerGBPerMonth = networkStatsStore.stats?.pricePerGBPerMonth ?? 0.1
    const bzzAmount = Number(totalAmount) / Number(10n ** 16n) // Convert PLUR to BZZ

    const months = bzzAmount / (storageGB * pricePerGBPerMonth)
    const days = Math.round(months * 30)

    if (days === 1) return '1 day'
    return `${days} days`
  }

  function calculateTopUpDuration(topupAmount: bigint): string {
    // Calculate additional duration from top-up amount
    // Use the tracked batch depth, or fallback to typical depth (16)
    const depth = batchDepth ?? 16

    const chunks = 2 ** depth
    const storageGB = (chunks * 4096) / (1024 * 1024 * 1024)

    // Use network stats price if available, otherwise use typical price
    const pricePerGBPerMonth = networkStatsStore.stats?.pricePerGBPerMonth ?? 0.1
    const bzzAmount = Number(topupAmount) / Number(10n ** 16n) // Convert PLUR to BZZ

    const months = bzzAmount / (storageGB * pricePerGBPerMonth)
    const days = Math.round(months * 30)

    if (days === 1) return '1 day'
    return `${days} days`
  }

  function formatRelativeTime(date: Date | undefined): string {
    if (!date) return 'Unknown'

    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMinutes < 1) return 'just now'
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
    if (diffDays < 30) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`

    return date.toLocaleDateString()
  }

  function getDetail(event: PostageEvent): { text: string; usd: string | undefined } {
    switch (event.eventName) {
      case 'BatchCreated': {
        const args = event.args as BatchCreatedArgs
        const duration = calculateBatchDuration(args.depth, args.totalAmount)
        return {
          text: `${formatStorageCapacity(args.depth)} for ${duration}, ${formatBzz(args.totalAmount)} BZZ`,
          usd: formatUsd(args.totalAmount, bzzPriceStore.price),
        }
      }
      case 'BatchTopUp': {
        const args = event.args as BatchTopUpArgs
        const duration = calculateTopUpDuration(args.topupAmount)
        return {
          text: `adds ${duration}, ${formatBzz(args.topupAmount)} BZZ`,
          usd: formatUsd(args.topupAmount, bzzPriceStore.price),
        }
      }
      case 'BatchDepthIncrease': {
        const args = event.args as BatchDepthIncreaseArgs
        return {
          text: `increase capacity to ${formatStorageCapacity(args.newDepth)}`,
          usd: undefined,
        }
      }
      case 'PriceUpdate': {
        const args = event.args as PriceUpdateArgs
        return { text: `price: ${args.price.toString()}`, usd: undefined }
      }
    }
  }

  const batchId = $derived(getBatchId(event))
  const detail = $derived(getDetail(event))
</script>

<div
  class="grid grid-cols-[1fr_7rem_6.5rem_1fr_2fr_1fr] items-center gap-4 border-b px-4 py-3 text-sm hover:bg-muted/50 transition-colors"
>
  <div>
    <HexDisplay
      value={event.transactionHash}
      showEnd={false}
      href={resolveRoute('/tx/[hash]', { hash: event.transactionHash })}
    />
  </div>

  <EventBadge {event} />

  <div class="text-muted-foreground text-xs">
    <a
      href="{GNOSISSCAN_BASE_URL}/block/{event.blockNumber}"
      target="_blank"
      rel="noopener noreferrer"
      class="hover:text-foreground"
    >
      #{event.blockNumber.toString()}
    </a>
  </div>

  <div class="text-muted-foreground truncate" title={event.blockTime?.toLocaleString()}>
    {formatRelativeTime(event.blockTime)}
  </div>

  <div class="text-muted-foreground truncate">
    {detail.text}
    {#if detail.usd}
      <span
        class="ml-1 inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground"
        >{detail.usd}</span
      >
    {/if}
  </div>

  <div class="min-w-0">
    {#if batchId}
      <HexDisplay
        value={batchId}
        showEnd={false}
        href={resolveRoute('/batch/[id]', { id: batchId })}
      />
    {:else}
      <span class="text-muted-foreground">-</span>
    {/if}
  </div>
</div>
