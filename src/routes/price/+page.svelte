<!--
  Copyright 2026 The Swarm Authors. All rights reserved.
  SPDX-License-Identifier: Apache-2.0
-->

<script lang="ts">
  import { resolveRoute } from '$app/paths'
  import { onMount } from 'svelte'
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card'
  import { Button } from '$lib/components/ui/button'
  import HexDisplay from '$lib/components/hex-display.svelte'
  import BlockBadge from '$lib/components/block-badge.svelte'
  import LoadingSpinner from '$lib/components/loading-spinner.svelte'
  import PriceChart from '$lib/components/price-chart.svelte'
  import { priceHistoryStore } from '$lib/stores/price-history.svelte'
  import { bzzPriceStore } from '$lib/stores/bzz-price.svelte'
  import { bucketSeries, changePoints } from '$lib/price-sample'
  import { formatBzz, formatUsd, pricePerGbMonth } from '$lib/format'
  import type { PriceUpdateArgs } from '$lib/types'

  const DAY = 24 * 60 * 60 * 1000
  const RANGES = [
    { label: '24h', ms: DAY },
    { label: '7d', ms: 7 * DAY },
    { label: '30d', ms: 30 * DAY },
    { label: '90d', ms: 90 * DAY },
    { label: '180d', ms: 180 * DAY },
    { label: '1y', ms: 365 * DAY },
  ] as const

  const TABLE_CAP = 250

  let selected = $state<(typeof RANGES)[number]>(RANGES[1]) // 7d

  // Anchor "now" once per load so cutoff/buckets are stable across re-renders.
  let now = $state(new Date())

  function select(range: (typeof RANGES)[number]) {
    selected = range
    now = new Date()
    priceHistoryStore.ensureCovered(new Date(now.getTime() - range.ms))
  }

  onMount(() => select(selected))

  const cutoff = $derived(new Date(now.getTime() - selected.ms))
  const windowEvents = $derived(
    priceHistoryStore.events.filter((e) => e.blockTime && e.blockTime >= cutoff),
  )
  const points = $derived(bucketSeries(windowEvents, cutoff, now))
  const changes = $derived(changePoints(windowEvents))
  const rows = $derived(changes.slice(0, TABLE_CAP))

  const loadedDays = $derived.by(() => {
    const oldest = priceHistoryStore.oldestLoaded
    return oldest ? Math.round((Date.now() - oldest.getTime()) / DAY) : 0
  })
</script>

<svelte:head>
  <title>Price History - Batch Explorer</title>
</svelte:head>

<div class="space-y-8">
  <div class="flex flex-col items-center gap-2 py-6">
    <h1 class="text-3xl font-bold">Unit Price History</h1>
    <p class="text-muted-foreground">
      Historical PostageStamp contract unit price (PLUR per chunk per block)
    </p>
  </div>

  <div class="flex items-center justify-center gap-2">
    {#each RANGES as range (range.label)}
      <Button
        variant={selected.label === range.label ? 'default' : 'outline'}
        size="sm"
        onclick={() => select(range)}
      >
        {range.label}
      </Button>
    {/each}
  </div>

  <PriceChart {points} />

  {#if priceHistoryStore.loading}
    <div class="flex items-center justify-center gap-3 text-sm text-muted-foreground">
      <LoadingSpinner />
      Loaded {priceHistoryStore.events.length} events (~{loadedDays} days)…
    </div>
  {/if}

  {#if priceHistoryStore.error}
    <div class="px-4 py-3 text-center text-sm text-destructive">
      Error: {priceHistoryStore.error}
    </div>
  {/if}

  <Card>
    <CardHeader class="flex flex-row items-center justify-between">
      <CardTitle>Price Changes</CardTitle>
      <span class="text-xs text-muted-foreground">
        {#if changes.length > TABLE_CAP}
          showing latest {TABLE_CAP} of {changes.length} changes
        {:else}
          {changes.length} changes
        {/if}
      </span>
    </CardHeader>
    <CardContent class="p-0">
      <div
        class="grid grid-cols-[6.5rem_1fr_8rem_1fr_1fr] gap-4 border-b bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground"
      >
        <span>Block</span>
        <span>Time</span>
        <span>Unit price</span>
        <span>BZZ / GB·month</span>
        <span>Tx</span>
      </div>

      {#each rows as event (`${event.transactionHash}-${event.logIndex}`)}
        {@const price = (event.args as PriceUpdateArgs).price}
        {@const gbMonth = pricePerGbMonth(price)}
        <div
          class="grid grid-cols-[6.5rem_1fr_8rem_1fr_1fr] items-center gap-4 border-b px-4 py-3 text-sm hover:bg-muted/50 transition-colors"
        >
          <div><BlockBadge blockNumber={event.blockNumber} /></div>
          <div class="text-muted-foreground truncate">
            {event.blockTime?.toLocaleString() ?? 'Unknown'}
          </div>
          <div class="font-mono">{price.toLocaleString()}</div>
          <div class="text-muted-foreground">
            {formatBzz(gbMonth)}
            {#if formatUsd(gbMonth, bzzPriceStore.price)}
              <span
                class="ml-1 inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground"
                >{formatUsd(gbMonth, bzzPriceStore.price)}</span
              >
            {/if}
          </div>
          <div>
            <HexDisplay
              value={event.transactionHash}
              showEnd={false}
              href={resolveRoute('/tx/[hash]', { hash: event.transactionHash })}
            />
          </div>
        </div>
      {/each}

      {#if rows.length === 0 && !priceHistoryStore.loading}
        <div class="py-12 text-center text-muted-foreground">
          No price changes in this timeframe.
        </div>
      {/if}
    </CardContent>
  </Card>
</div>
