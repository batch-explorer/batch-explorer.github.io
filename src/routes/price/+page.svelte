<!--
  Copyright 2026 The Swarm Authors. All rights reserved.
  SPDX-License-Identifier: Apache-2.0
-->

<script lang="ts">
  import { resolveRoute } from '$app/paths'
  import { browser } from '$app/environment'
  import { replaceState } from '$app/navigation'
  import { onMount } from 'svelte'
  import { Button } from '$lib/components/ui/button'
  import HexDisplay from '$lib/components/hex-display.svelte'
  import BlockBadge from '$lib/components/block-badge.svelte'
  import LoadingSpinner from '$lib/components/loading-spinner.svelte'
  import PriceChart from '$lib/components/price-chart.svelte'
  import { priceHistoryStore } from '$lib/stores/price-history.svelte'
  import { priceSamplerStore, SAMPLE_COUNT } from '$lib/stores/price-sampler.svelte'
  import { bzzPriceStore } from '$lib/stores/bzz-price.svelte'
  import { bucketSeries, changePoints } from '$lib/price-sample'
  import { formatBzz, formatUsd, pricePerGbMonth } from '$lib/format'
  import { FIRST_PRICE_TIME_MS } from '$lib/constants'
  import type { PriceUpdateArgs } from '$lib/types'

  const DAY = 24 * 60 * 60 * 1000
  const YEAR = 365 * DAY
  const RANGES = [
    { label: '24h', ms: DAY },
    { label: '7d', ms: 7 * DAY },
    { label: '30d', ms: 30 * DAY },
    { label: '90d', ms: 90 * DAY },
    { label: '180d', ms: 180 * DAY },
    { label: '1y', ms: YEAR },
    { label: '2Y', ms: 2 * YEAR },
    { label: 'All', ms: Infinity },
  ] as const

  const TABLE_CAP = 250
  // Auto mode uses Estimated above this; Full ≤ this. Full is cheaper up to
  // ~135 days (Estimated always ~150 requests), so the cutoff sits at 90d.
  const ESTIMATED_ABOVE_MS = 90 * DAY

  let selected = $state<(typeof RANGES)[number]>(RANGES[1]) // 7d

  // Anchor "now" once per load so cutoff/buckets are stable across re-renders.
  let now = $state(new Date())

  // Never request before the first price event exists (All clamps to first event).
  const cutoffFor = (ms: number) => new Date(Math.max(now.getTime() - ms, FIRST_PRICE_TIME_MS))

  // Auto method (toggle hidden): Full ≤ threshold (cheaper), Estimated above.
  const methodFor = (range: (typeof RANGES)[number]) =>
    range.ms > ESTIMATED_ABOVE_MS ? 'estimated' : 'full'

  function load(range: (typeof RANGES)[number]) {
    const cutoffDate = cutoffFor(range.ms)
    if (methodFor(range) === 'full') priceHistoryStore.ensureCovered(cutoffDate)
    else priceSamplerStore.sample(range.label, cutoffDate)
  }

  const rangeByLabel = (label: string) =>
    RANGES.find((r) => r.label.toLowerCase() === label.toLowerCase())

  function select(range: (typeof RANGES)[number], writeHash = true) {
    selected = range
    now = new Date()
    load(range)
    // Keep the timeframe in the URL hash so it can be linked/bookmarked.
    if (writeHash && browser) replaceState(`#${range.label}`, {})
  }

  onMount(() => {
    const fromHash = browser ? rangeByLabel(decodeURIComponent(location.hash.slice(1))) : undefined
    select(fromHash ?? selected, false)

    const onHashChange = () => {
      const r = rangeByLabel(decodeURIComponent(location.hash.slice(1)))
      if (r && r.label !== selected.label) select(r, false)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  })

  const effectiveMethod = $derived(methodFor(selected))
  const store = $derived(effectiveMethod === 'full' ? priceHistoryStore : priceSamplerStore)
  const cutoff = $derived(cutoffFor(selected.ms))
  const windowEvents = $derived(store.events.filter((e) => e.blockTime && e.blockTime >= cutoff))
  // Full events are dense → bucket; estimated events are already sparse → plot directly.
  const points = $derived(
    effectiveMethod === 'full'
      ? bucketSeries(windowEvents, cutoff, now)
      : windowEvents
          .filter((e) => e.blockTime)
          .map((e) => ({ blockTime: e.blockTime, price: (e.args as PriceUpdateArgs).price })),
  )
  const changes = $derived(changePoints(windowEvents))
  const rows = $derived(changes.slice(0, TABLE_CAP))

  // High/low of the visible series (bigint prices) for the header.
  const prices = $derived(points.map((p) => p.price))
  const pMax = $derived(prices.length ? prices.reduce((a, b) => (b > a ? b : a)) : undefined)
  const pMin = $derived(prices.length ? prices.reduce((a, b) => (b < a ? b : a)) : undefined)

  const loadedDays = $derived.by(() => {
    const oldest = priceHistoryStore.oldestLoaded
    return oldest ? Math.round((Date.now() - oldest.getTime()) / DAY) : 0
  })
</script>

<svelte:head>
  <title>Price History - Batch Explorer</title>
</svelte:head>

<section class="flex h-[calc(100svh-5.5rem)] flex-col gap-3">
  <div class="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
    <div class="flex flex-col gap-0.5">
      <h1 class="text-lg leading-tight font-bold">Unit Price History</h1>
      <p class="text-xs text-muted-foreground">
        PostageStamp contract unit price (PLUR per chunk per block)
      </p>
      {#if pMax !== undefined && pMin !== undefined}
        <div class="mt-0.5 flex gap-4 text-xs">
          <span>
            <span class="text-muted-foreground">High</span>
            <span class="font-mono">{pMax.toLocaleString()}</span>
            <span class="text-muted-foreground">· {formatBzz(pricePerGbMonth(pMax))} BZZ/GB·mo</span
            >
          </span>
          <span>
            <span class="text-muted-foreground">Low</span>
            <span class="font-mono">{pMin.toLocaleString()}</span>
            <span class="text-muted-foreground">· {formatBzz(pricePerGbMonth(pMin))} BZZ/GB·mo</span
            >
          </span>
        </div>
      {/if}
    </div>

    <div class="flex flex-wrap justify-end gap-1">
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
  </div>

  <div class="relative min-h-0 flex-1">
    <PriceChart {points} />

    {#if store.loading}
      <div
        class="absolute top-2 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-md border bg-card px-3 py-1 text-xs text-muted-foreground shadow-sm"
      >
        <LoadingSpinner />
        {#if effectiveMethod === 'full'}
          Loaded <span class="inline-block w-[5ch] text-right tabular-nums"
            >{priceHistoryStore.events.length}</span
          >
          events (~<span class="inline-block w-[3ch] text-right tabular-nums">{loadedDays}</span> days)…
        {:else}
          Sampling… <span class="inline-block w-[3ch] text-right tabular-nums"
            >{priceSamplerStore.progress}</span
          >/{SAMPLE_COUNT}
        {/if}
      </div>
    {:else if store.error}
      <div
        class="absolute top-2 left-1/2 -translate-x-1/2 rounded-md border bg-card px-3 py-1 text-xs text-destructive shadow-sm"
      >
        Error: {store.error}
      </div>
    {/if}
  </div>
</section>

<details class="mt-4 rounded-lg border bg-card">
  <summary class="cursor-pointer px-4 py-2 select-none">
    <span class="text-sm font-medium">
      {effectiveMethod === 'full' ? 'Price Changes' : 'Sampled Prices'}
    </span>
    <span class="ml-2 text-xs text-muted-foreground">
      {#if changes.length > TABLE_CAP}
        showing latest {TABLE_CAP} of {changes.length}
      {:else}
        {changes.length} {effectiveMethod === 'full' ? 'changes' : 'points'}
      {/if}
    </span>
  </summary>

  <div class="max-h-[60vh] overflow-y-auto border-t">
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

    {#if rows.length === 0 && !store.loading}
      <div class="py-12 text-center text-muted-foreground">No price data in this timeframe.</div>
    {/if}
  </div>
</details>
