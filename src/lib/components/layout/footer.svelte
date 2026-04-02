<!--
  Copyright 2026 The Swarm Authors. All rights reserved.
  SPDX-License-Identifier: Apache-2.0
-->

<script lang="ts">
  import { networkStatsStore } from '$lib/stores/network-stats.svelte'
  import { bzzPriceStore } from '$lib/stores/bzz-price.svelte'
  import {
    GNOSISSCAN_BASE_URL,
    DEFAULT_GNOSIS_RPC_URL,
    PLUR_PER_BZZ,
    POSTAGE_STAMP_ADDRESS,
  } from '$lib/constants'
</script>

<footer class="border-t bg-card py-4 text-xs text-muted-foreground">
  <div class="mx-auto flex max-w-7xl items-start justify-between px-4">
    <div class="flex flex-col gap-1">
      <span>RPC: {DEFAULT_GNOSIS_RPC_URL}</span>
      {#if bzzPriceStore.price}
        <span>BZZ price: {bzzPriceStore.price.toFixed(2)} USD</span>
      {/if}
      {#if networkStatsStore.stats}
        <span>
          Storage price: {networkStatsStore.stats.pricePerGBPerMonth.toFixed(4)} BZZ/GB/mo ({(
            networkStatsStore.stats.pricePerGBPerMonth * (bzzPriceStore.price ?? 0)
          ).toFixed(4)} USD/GB/mo)
        </span>
      {/if}
      {#if networkStatsStore.contractBalance !== undefined}
        {@const balanceBzz = Number(networkStatsStore.contractBalance / PLUR_PER_BZZ)}
        {@const balanceUsd = bzzPriceStore.price ? balanceBzz * bzzPriceStore.price : undefined}
        <span>
          Contract balance TVL: {balanceBzz.toLocaleString()} BZZ
          {#if balanceUsd !== undefined}
            ({balanceUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })} USD)
          {/if}
        </span>
      {/if}
      <span
        >Contract:
        <a
          href={`${GNOSISSCAN_BASE_URL}/address/${POSTAGE_STAMP_ADDRESS}`}
          target="_blank"
          rel="noopener noreferrer external"
          class="hover:text-foreground"
        >
          {POSTAGE_STAMP_ADDRESS}
        </a>
      </span>
    </div>
    <div class="flex items-center gap-4">
      <a
        href={GNOSISSCAN_BASE_URL}
        target="_blank"
        rel="noopener noreferrer external"
        class="hover:text-foreground"
      >
        Gnosisscan
      </a>
      <a
        href="https://swarmscan.io"
        target="_blank"
        rel="noopener noreferrer"
        class="hover:text-foreground"
      >
        Swarmscan
      </a>
      <a
        href="https://github.com/batch-explorer/batch-explorer.github.io"
        target="_blank"
        rel="noopener noreferrer"
        class="hover:text-foreground"
      >
        GitHub
      </a>
    </div>
  </div>
</footer>
