<!--
  Copyright 2026 The Swarm Authors. All rights reserved.
  SPDX-License-Identifier: Apache-2.0
-->

<script lang="ts">
  import { page } from '$app/stores'
  import { base } from '$app/paths'
  import { onMount } from 'svelte'
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card'
  import { Badge } from '$lib/components/ui/badge'
  import { Button } from '$lib/components/ui/button'
  import HexDisplay from '$lib/components/hex-display.svelte'
  import LoadingSpinner from '$lib/components/loading-spinner.svelte'
  import { fetchTransactionDetail } from '$lib/services/event-fetcher'
  import { GNOSISSCAN_BASE_URL } from '$lib/constants'
  import type {
    TransactionDetail,
    BatchCreatedArgs,
    BatchTopUpArgs,
    BatchDepthIncreaseArgs,
    PriceUpdateArgs,
  } from '$lib/types'
  import EventBadge from '$lib/components/event-badge.svelte'

  let txHash = $derived($page.params.hash as `0x${string}`)
  let txDetail = $state<TransactionDetail | undefined>(undefined)
  let loading = $state(false)
  let error = $state<string | undefined>(undefined)

  async function loadTransaction(hash: `0x${string}`) {
    loading = true
    error = undefined
    txDetail = undefined

    try {
      txDetail = await fetchTransactionDetail(hash)
    } catch (e) {
      error = e instanceof Error ? e.message : String(e)
    } finally {
      loading = false
    }
  }

  onMount(() => {
    loadTransaction(txHash)
  })
</script>

<svelte:head>
  <title>Tx {txHash.slice(0, 12)}... - Batch Explorer</title>
</svelte:head>

<!-- eslint-disable svelte/no-navigation-without-resolve -- dynamic routes and external links -->
<div class="space-y-6">
  <div class="flex items-center gap-2">
    <a href="{base}/" class="text-sm text-muted-foreground hover:text-foreground">&larr; Back</a>
  </div>

  {#if loading}
    <LoadingSpinner />
  {:else if error}
    <Card>
      <CardContent class="py-12 text-center">
        <p class="text-destructive">{error}</p>
        <Button variant="outline" class="mt-4" onclick={() => loadTransaction(txHash)}>
          Retry
        </Button>
      </CardContent>
    </Card>
  {:else if txDetail}
    <Card>
      <CardHeader>
        <CardTitle>Transaction Details</CardTitle>
      </CardHeader>
      <CardContent>
        <dl class="grid gap-3">
          <div class="grid grid-cols-[200px_1fr] gap-4 border-b pb-3">
            <dt class="text-sm font-medium text-muted-foreground">Transaction Hash</dt>
            <dd class="text-sm font-mono break-all">
              <a
                href="{GNOSISSCAN_BASE_URL}/tx/{txDetail.hash}"
                target="_blank"
                rel="noopener noreferrer"
                class="text-primary hover:underline"
              >
                <HexDisplay value={txDetail.hash} truncate={false} />
              </a>
            </dd>
          </div>
          <div class="grid grid-cols-[200px_1fr] gap-4 border-b pb-3">
            <dt class="text-sm font-medium text-muted-foreground">Status</dt>
            <dd>
              <Badge variant={txDetail.status === 'success' ? 'success' : 'destructive'}>
                {txDetail.status}
              </Badge>
            </dd>
          </div>
          <div class="grid grid-cols-[200px_1fr] gap-4 border-b pb-3">
            <dt class="text-sm font-medium text-muted-foreground">Block</dt>
            <dd class="text-sm">
              <a
                href="{GNOSISSCAN_BASE_URL}/block/{txDetail.blockNumber}"
                target="_blank"
                rel="noopener noreferrer"
                class="text-primary hover:underline"
              >
                #{txDetail.blockNumber.toString()}
              </a>
            </dd>
          </div>
          <div class="grid grid-cols-[200px_1fr] gap-4 border-b pb-3">
            <dt class="text-sm font-medium text-muted-foreground">From</dt>
            <dd class="text-sm font-mono">
              <HexDisplay
                value={txDetail.from}
                href="{GNOSISSCAN_BASE_URL}/address/{txDetail.from}"
                truncate={false}
              />
            </dd>
          </div>
          {#if txDetail.to}
            <div class="grid grid-cols-[200px_1fr] gap-4 border-b pb-3">
              <dt class="text-sm font-medium text-muted-foreground">To</dt>
              <dd class="text-sm font-mono">
                <HexDisplay
                  value={txDetail.to}
                  href="{GNOSISSCAN_BASE_URL}/address/{txDetail.to}"
                  truncate={false}
                />
              </dd>
            </div>
          {/if}
          <div class="grid grid-cols-[200px_1fr] gap-4">
            <dt class="text-sm font-medium text-muted-foreground">Gas Used</dt>
            <dd class="text-sm font-mono">{txDetail.gasUsed.toString()}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>

    {#if txDetail.events.length > 0}
      <Card>
        <CardHeader>
          <CardTitle>PostageStamp Events ({txDetail.events.length})</CardTitle>
        </CardHeader>
        <CardContent class="p-0">
          {#each txDetail.events as event (`${event.transactionHash}-${event.logIndex}`)}
            <div class="flex items-start gap-4 border-b px-6 py-4 last:border-0">
              <EventBadge {event}/>

              <div class="flex-1 space-y-1 text-sm">
                {#if event.eventName === 'BatchCreated'}
                  {@const args = event.args as BatchCreatedArgs}
                  <div>
                    <span class="text-muted-foreground">Batch:</span>
                    <HexDisplay
                      value={args.batchId.slice(2)}
                      href="{base}/batch/{args.batchId.slice(2)}"
                    />
                  </div>
                  <div>
                    <span class="text-muted-foreground">Owner:</span>
                    <HexDisplay
                      value={args.owner}
                      href="{GNOSISSCAN_BASE_URL}/address/{args.owner}"
                    />
                  </div>
                  <div>
                    <span class="text-muted-foreground">Amount:</span>
                    {args.totalAmount.toString()},
                    <span class="text-muted-foreground">Depth:</span>
                    {args.depth}
                  </div>
                {:else if event.eventName === 'BatchTopUp'}
                  {@const args = event.args as BatchTopUpArgs}
                  <div>
                    <span class="text-muted-foreground">Batch:</span>
                    <HexDisplay
                      value={args.batchId.slice(2)}
                      href="{base}/batch/{args.batchId.slice(2)}"
                    />
                  </div>
                  <div>
                    <span class="text-muted-foreground">Top-up:</span>
                    {args.topupAmount.toString()}
                  </div>
                {:else if event.eventName === 'BatchDepthIncrease'}
                  {@const args = event.args as BatchDepthIncreaseArgs}
                  <div>
                    <span class="text-muted-foreground">Batch:</span>
                    <HexDisplay
                      value={args.batchId.slice(2)}
                      href="{base}/batch/{args.batchId.slice(2)}"
                    />
                  </div>
                  <div>
                    <span class="text-muted-foreground">New Depth:</span>
                    {args.newDepth}
                  </div>
                {:else if event.eventName === 'PriceUpdate'}
                  {@const args = event.args as PriceUpdateArgs}
                  <div>
                    <span class="text-muted-foreground">Price:</span>
                    {args.price.toString()}
                  </div>
                {/if}
              </div>
            </div>
          {/each}
        </CardContent>
      </Card>
    {:else}
      <Card>
        <CardContent class="py-8 text-center text-muted-foreground">
          No PostageStamp events found in this transaction.
        </CardContent>
      </Card>
    {/if}
  {/if}
</div>
