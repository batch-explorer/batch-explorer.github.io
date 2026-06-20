<!--
  Copyright 2026 The Swarm Authors. All rights reserved.
  SPDX-License-Identifier: Apache-2.0
-->

<script lang="ts">
  import { formatBzz, pricePerGbMonth } from '$lib/format'

  interface Point {
    blockTime: Date | undefined
    price: bigint
  }

  interface Props {
    points: Point[]
  }

  let { points }: Props = $props()

  // viewBox space; scales responsively via w-full.
  const W = 1000
  const H = 300
  const PAD = 8

  let clientWidth = $state(0)
  let clientHeight = $state(0)
  let hovered = $state<number | undefined>(undefined)

  const chart = $derived.by(() => {
    const pts = points
      .filter((p): p is { blockTime: Date; price: bigint } => p.blockTime !== undefined)
      .sort((a, b) => a.blockTime.getTime() - b.blockTime.getTime())
    if (pts.length < 2) return undefined

    const times = pts.map((p) => p.blockTime.getTime())
    const prices = pts.map((p) => Number(p.price))
    const tMin = Math.min(...times)
    const tMax = Math.max(...times)
    const pMin = Math.min(...prices)
    const pMax = Math.max(...prices)
    const tSpan = tMax - tMin || 1
    const pSpan = pMax - pMin || 1

    const x = (t: number) => PAD + ((t - tMin) / tSpan) * (W - 2 * PAD)
    const y = (p: number) => PAD + (1 - (p - pMin) / pSpan) * (H - 2 * PAD)

    // fx/fy are 0..1 fractions of the viewBox; under preserveAspectRatio="none"
    // they map linearly to client pixels, so the HTML overlay lines up with the SVG.
    const nodes = pts.map((p) => ({
      blockTime: p.blockTime,
      price: p.price,
      fx: x(p.blockTime.getTime()) / W,
      fy: y(Number(p.price)) / H,
    }))

    return {
      nodes,
      polyline: nodes.map((n) => `${n.fx * W},${n.fy * H}`).join(' '),
      pMin,
      pMax,
      first: pts[0].blockTime,
      last: pts[pts.length - 1].blockTime,
    }
  })

  // ponytail: mouse-only; touch hover isn't worth the complexity here.
  function onmove(e: MouseEvent) {
    if (!chart) return
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const f = (e.clientX - rect.left) / rect.width
    let best = 0
    let bestDist = Infinity
    for (let i = 0; i < chart.nodes.length; i++) {
      const d = Math.abs(chart.nodes[i].fx - f)
      if (d < bestDist) {
        bestDist = d
        best = i
      }
    }
    hovered = best
  }

  const active = $derived(hovered !== undefined && chart ? chart.nodes[hovered] : undefined)
</script>

{#if chart}
  <div class="rounded-lg border bg-card p-4">
    <div class="mb-2 flex justify-between text-xs text-muted-foreground">
      <span>{chart.pMax.toLocaleString()} (high)</span>
      <span>{chart.pMin.toLocaleString()} (low)</span>
    </div>

    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="relative"
      bind:clientWidth
      bind:clientHeight
      onmousemove={onmove}
      onmouseleave={() => (hovered = undefined)}
    >
      <svg viewBox="0 0 {W} {H}" class="block h-auto w-full" preserveAspectRatio="none" role="img">
        <polyline
          points={chart.polyline}
          fill="none"
          class="stroke-primary"
          stroke-width="2"
          vector-effect="non-scaling-stroke"
        />
      </svg>

      {#if active}
        <div
          class="pointer-events-none absolute top-0 bottom-0 w-px bg-border"
          style="left: {active.fx * clientWidth}px"
        ></div>
        <div
          class="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-card"
          style="left: {active.fx * clientWidth}px; top: {active.fy * clientHeight}px"
        ></div>
        <div
          class="pointer-events-none absolute z-10 rounded-md border bg-card px-2 py-1 text-xs whitespace-nowrap shadow-md"
          style="left: {active.fx * clientWidth}px; top: {active.fy * clientHeight}px;
            transform: translate({active.fx > 0.8
            ? '-100%'
            : active.fx < 0.2
              ? '0'
              : '-50%'}, -130%)"
        >
          <div class="font-medium">{active.blockTime.toLocaleString()}</div>
          <div class="text-muted-foreground">
            {active.price.toLocaleString()} · {formatBzz(pricePerGbMonth(active.price))} BZZ/GB·mo
          </div>
        </div>
      {/if}
    </div>

    <div class="mt-2 flex justify-between text-xs text-muted-foreground">
      <span>{chart.first.toLocaleDateString()}</span>
      <span>{chart.last.toLocaleDateString()}</span>
    </div>
  </div>
{:else}
  <div class="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
    Not enough price history to chart yet.
  </div>
{/if}
