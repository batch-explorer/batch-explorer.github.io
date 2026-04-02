<!--
  Copyright 2026 The Swarm Authors. All rights reserved.
  SPDX-License-Identifier: Apache-2.0
-->

<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card'
  import { Badge } from '$lib/components/ui/badge'
  import HexDisplay from '$lib/components/hex-display.svelte'
  import NumberDisplay from '$lib/components/number-display.svelte'
  import { GNOSISSCAN_BASE_URL } from '$lib/constants'
  import { bzzPriceStore } from '$lib/stores/bzz-price.svelte'
  import type { BatchDetail } from '$lib/types'
  import { formatBzz, formatExpiry, formatStorageCapacity } from '$lib/format'

  interface Props {
    batch: BatchDetail
    expiryDate?: Date
    expired?: boolean
  }

  let { batch, expiryDate, expired = false }: Props = $props()

  const creationEvent = $derived(batch.events.find((e) => e.eventName === 'BatchCreated'))
  const creationDate = $derived(creationEvent?.blockTime?.toLocaleString() ?? '')

  const rows = $derived([
    { label: 'Batch ID', value: batch.batchId.slice(2) },
    { label: 'Owner', value: batch.owner, link: `${GNOSISSCAN_BASE_URL}/address/${batch.owner}` },
    {
      label: 'Total Amount',
      value: (() => {
        const bzz = formatBzz(batch.totalAmount)
        const plur = batch.totalAmount.toString()
        if (!bzzPriceStore.price) return `${bzz} BZZ · ${plur} PLUR`
        const usd = (Number(bzz) * bzzPriceStore.price).toFixed(2)
        return `${usd} USD · ${bzz} BZZ · ${plur} PLUR`
      })(),
    },
    { label: 'Storage Capacity', value: formatStorageCapacity(batch.depth) },
    {
      label: 'Created',
      value: creationDate
        ? `${creationDate} · Block #${batch.creationBlock.toString()}`
        : `Block #${batch.creationBlock.toString()}`,
    },
    { label: 'Expiry', value: formatExpiry(expiryDate, expired) },
    { label: 'Immutable', value: batch.immutableFlag ? 'Yes' : 'No' },
    { label: 'Depth', value: batch.depth.toString() },
    { label: 'Bucket Depth', value: batch.bucketDepth.toString() },
    { label: 'Normalised Balance', value: batch.normalisedBalance.toString(), numeric: true },
    { label: 'Event Count', value: batch.events.length.toString() },
  ])
</script>

<Card>
  <CardHeader>
    <div class="flex items-center gap-3">
      <CardTitle>Batch Details</CardTitle>
      <Badge variant={batch.immutableFlag ? 'secondary' : 'outline'}>
        {batch.immutableFlag ? 'Immutable' : 'Mutable'}
      </Badge>
    </div>
  </CardHeader>
  <CardContent>
    <dl class="grid gap-3">
      {#each rows as row (row.label)}
        <div class="grid grid-cols-[200px_1fr] gap-4 border-b pb-3 last:border-0">
          <dt class="text-sm font-medium text-muted-foreground">{row.label}</dt>
          <dd class="text-sm font-mono break-all">
            {#if row.label === 'Batch ID'}
              <HexDisplay value={row.value} truncate={false} />
            {:else if row.label === 'Owner'}
              <HexDisplay value={row.value} href={row.link} truncate={false} />
            {:else if row.numeric}
              <NumberDisplay value={row.value} />
            {:else}
              {row.value}
            {/if}
          </dd>
        </div>
      {/each}
    </dl>
  </CardContent>
</Card>
