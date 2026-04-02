<!--
  Copyright 2026 The Swarm Authors. All rights reserved.
  SPDX-License-Identifier: Apache-2.0
-->

<script lang="ts">
  import { page } from '$app/stores'
  import { resolveRoute } from '$app/paths'
  import { onMount } from 'svelte'
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card'
  import { Button } from '$lib/components/ui/button'
  import HexDisplay from '$lib/components/hex-display.svelte'
  import BatchSummary from '$lib/components/batch-summary.svelte'
  import LoadingSpinner from '$lib/components/loading-spinner.svelte'
  import { batchDetailStore } from '$lib/stores/batch-detail.svelte'
  import { GNOSISSCAN_BASE_URL } from '$lib/constants'
  import type { BatchCreatedArgs, BatchTopUpArgs, BatchDepthIncreaseArgs } from '$lib/types'
  import EventBadge from '$lib/components/event-badge.svelte'
  import { formatBzz, formatUsd } from '$lib/format'
  import { bzzPriceStore } from '$lib/stores/bzz-price.svelte'

  let batchId = $derived($page.params.id ?? '')

  onMount(() => {
    if (batchId) batchDetailStore.loadBatch(batchId)
    return () => batchDetailStore.clear()
  })
</script>

<svelte:head>
  <title>Batch {batchId.slice(0, 12)}... - Batch Explorer</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center gap-2">
    <a href={resolveRoute('/')} class="text-sm text-muted-foreground hover:text-foreground"
      >&larr; Back</a
    >
  </div>

  {#if batchDetailStore.loading}
    <LoadingSpinner />
  {:else if batchDetailStore.error}
    <Card>
      <CardContent class="py-12 text-center">
        <p class="text-destructive">{batchDetailStore.error}</p>
        <Button variant="outline" class="mt-4" onclick={() => batchDetailStore.loadBatch(batchId)}>
          Retry
        </Button>
      </CardContent>
    </Card>
  {:else if batchDetailStore.batch}
    <BatchSummary
      batch={batchDetailStore.batch}
      expiryDate={batchDetailStore.expiryDate}
      expired={batchDetailStore.expired}
    />

    <Card>
      <CardHeader>
        <CardTitle>Event History</CardTitle>
      </CardHeader>
      <CardContent class="p-0">
        {#each batchDetailStore.batch.events as event, i (`${event.transactionHash}-${event.logIndex}`)}
          <div class="grid grid-cols-[7rem_1fr] items-start gap-4 border-b px-6 py-4 last:border-0">
            <div class="flex flex-col items-stretch gap-1">
              <EventBadge {event} />
              <span class="text-xs text-muted-foreground self-center">#{i + 1}</span>
            </div>

            <div class="flex-1 space-y-1 text-sm">
              {#if event.eventName === 'BatchCreated'}
                {@const args = event.args as BatchCreatedArgs}
                {@const createdUsd = formatUsd(args.totalAmount, bzzPriceStore.price)}
                <div>
                  <span class="text-muted-foreground">Owner:</span>
                  <HexDisplay
                    value={args.owner}
                    href="{GNOSISSCAN_BASE_URL}/address/{args.owner}"
                  />
                </div>
                <div>
                  <span class="text-muted-foreground">Amount:</span>
                  {formatBzz(args.totalAmount)} BZZ
                  {#if createdUsd}
                    <span
                      class="ml-1 inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground"
                      >{createdUsd}</span
                    >
                  {/if}
                </div>
                <div>
                  <span class="text-muted-foreground">Depth:</span>
                  {args.depth}
                  <span class="text-muted-foreground ml-2">Bucket Depth:</span>
                  {args.bucketDepth}
                </div>
              {:else if event.eventName === 'BatchTopUp'}
                {@const args = event.args as BatchTopUpArgs}
                {@const topupUsd = formatUsd(args.topupAmount, bzzPriceStore.price)}
                <div>
                  <span class="text-muted-foreground">Top-up Amount:</span>
                  {formatBzz(args.topupAmount)} BZZ
                  {#if topupUsd}
                    <span
                      class="ml-1 inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground"
                      >{topupUsd}</span
                    >
                  {/if}
                </div>
                <div>
                  <span class="text-muted-foreground">New Balance:</span>
                  {args.normalisedBalance.toString()}
                </div>
              {:else if event.eventName === 'BatchDepthIncrease'}
                {@const args = event.args as BatchDepthIncreaseArgs}
                <div>
                  <span class="text-muted-foreground">New Depth:</span>
                  {args.newDepth}
                </div>
                <div>
                  <span class="text-muted-foreground">New Balance:</span>
                  {args.normalisedBalance.toString()}
                </div>
              {/if}

              <div>
                <span class="text-muted-foreground">Block:</span>
                <a
                  href="{GNOSISSCAN_BASE_URL}/block/{event.blockNumber}"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="hover:text-muted-foreground"
                >
                  #{event.blockNumber.toString()}
                </a>
                {#if event.blockTime}
                  · {event.blockTime.toLocaleString()}
                {/if}
              </div>
              <div>
                <span class="text-muted-foreground">Transaction:</span>
                <HexDisplay
                  value={event.transactionHash}
                  href={resolveRoute('/tx/[hash]', { hash: event.transactionHash })}
                />
              </div>
            </div>
          </div>
        {/each}

        {#if batchDetailStore.batch.events.length === 0}
          <div class="py-12 text-center text-muted-foreground">No events found for this batch.</div>
        {/if}
      </CardContent>
    </Card>
  {/if}
</div>
