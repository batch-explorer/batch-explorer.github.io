<!--
  Copyright 2026 The Swarm Authors. All rights reserved.
  SPDX-License-Identifier: Apache-2.0
-->

<script lang="ts">
  import { base } from '$app/paths'
  import { Badge } from '$lib/components/ui/badge'
  import HexDisplay from '$lib/components/hex-display.svelte'
  import { GNOSISSCAN_BASE_URL } from '$lib/constants'
  import type {
    PostageEvent,
    BatchCreatedArgs,
    BatchTopUpArgs,
    BatchDepthIncreaseArgs,
    PriceUpdateArgs,
  } from '$lib/types'
  import { formatBzz, formatStorageCapacity } from '$lib/format'

  interface Props {
    event: PostageEvent
  }

  let { event }: Props = $props()

  const VARIANT_MAP = {
    BatchCreated: 'success',
    BatchTopUp: 'default',
    BatchDepthIncrease: 'warning',
    PriceUpdate: 'secondary',
  } as const

  function formatAmount(value: bigint): string {
    const str = value.toString()
    if (str.length <= 16) return str
    return `${str.slice(0, 6)}...${str.slice(-4)}`
  }

  function getBatchId(event: PostageEvent): string | undefined {
    if (event.eventName === 'PriceUpdate') return undefined
    const args = event.args as BatchCreatedArgs | BatchTopUpArgs | BatchDepthIncreaseArgs
    return args.batchId.slice(2)
  }

  function getDetail(event: PostageEvent): string {
    switch (event.eventName) {
      case 'BatchCreated': {
        const args = event.args as BatchCreatedArgs
        // return `depth: ${args.depth}, amount: ${formatAmount(args.totalAmount)}`
        return `${formatBzz(args.totalAmount)} BZZ, ${formatStorageCapacity(args.depth)}`
      }
      case 'BatchTopUp': {
        const args = event.args as BatchTopUpArgs
        return `topup: ${formatAmount(args.topupAmount)}`
      }
      case 'BatchDepthIncrease': {
        const args = event.args as BatchDepthIncreaseArgs
        return `new depth: ${args.newDepth}`
      }
      case 'PriceUpdate': {
        const args = event.args as PriceUpdateArgs
        return `price: ${args.price.toString()}`
      }
    }
  }

  const batchId = $derived(getBatchId(event))
  const detail = $derived(getDetail(event))
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- external links and dynamic routes with base path -->
<div
  class="grid grid-cols-[9.5rem_1fr_1fr_1fr_6.5rem_11rem] items-center gap-4 border-b px-4 py-3 text-sm hover:bg-muted/50 transition-colors"
>
  <Badge variant={VARIANT_MAP[event.eventName]}>
    {event.eventName}
  </Badge>

  <div class="min-w-0">
    {#if batchId}
      <HexDisplay value={batchId} href="{base}/batch/{batchId}" />
    {:else}
      <span class="text-muted-foreground">-</span>
    {/if}
  </div>

  <div class="text-muted-foreground truncate">
    {detail}
  </div>

  <div class="text-muted-foreground truncate">
    {event.blockTime?.toLocaleString()}
  </div>

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

  <div>
    <HexDisplay value={event.transactionHash} href="{base}/tx/{event.transactionHash}" />
  </div>
</div>
