<!--
  Copyright 2026 The Swarm Authors. All rights reserved.
  SPDX-License-Identifier: Apache-2.0
-->

<script lang="ts">
  import { resolveRoute } from '$app/paths'
  import SearchBar from '$lib/components/search-bar.svelte'
  import { networkStatsStore } from '$lib/stores/network-stats.svelte'
</script>

<header class="border-b bg-card shadow-sm">
  <div class="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3">
    <a
      href={resolveRoute('/')}
      class="flex items-center gap-2 font-semibold text-lg whitespace-nowrap"
    >
      Batch Explorer
    </a>

    <SearchBar class="max-w-xl" />

    <div class="ml-auto flex items-center gap-6">
      <a
        href={resolveRoute('/price')}
        class="flex items-center gap-1 text-sm whitespace-nowrap text-muted-foreground hover:text-foreground"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
          <polyline points="16 7 22 7 22 13" />
        </svg>
        Price
      </a>

      {#if networkStatsStore.currentBlock}
        <div
          class="hidden items-center gap-2 whitespace-nowrap text-xs text-muted-foreground md:flex"
        >
          <span class="inline-block h-2 w-2 rounded-full bg-success"></span>
          Block #{networkStatsStore.currentBlock.toString()}
        </div>
      {/if}
    </div>
  </div>
</header>
