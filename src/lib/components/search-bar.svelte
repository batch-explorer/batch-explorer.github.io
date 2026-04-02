<!--
  Copyright 2026 The Swarm Authors. All rights reserved.
  SPDX-License-Identifier: Apache-2.0
-->

<script lang="ts">
  import { cn } from '$lib/utils'
  import { searchStore } from '$lib/stores/search.svelte'

  interface Props {
    class?: string
    size?: 'default' | 'lg'
  }

  let { class: className, size = 'default' }: Props = $props()

  function handleSubmit(e: Event) {
    e.preventDefault()
    if (searchStore.searchType) {
      searchStore.navigate()
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      handleSubmit(e)
    }
  }
</script>

<form onsubmit={handleSubmit} class={cn('flex w-full gap-2', className)}>
  <div class="relative flex-1">
    <input
      type="text"
      placeholder="Search by batch ID or transaction hash..."
      bind:value={searchStore.query}
      onkeydown={handleKeydown}
      class={cn(
        'w-full rounded-lg border border-input bg-card px-4 font-mono text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        size === 'lg' ? 'h-12 text-base' : 'h-9',
      )}
    />
    {#if searchStore.query && searchStore.searchType}
      <span
        class="absolute right-3 top-1/2 -translate-y-1/2 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
      >
        {searchStore.searchType === 'batch' ? 'Batch ID' : 'Tx Hash'}
      </span>
    {/if}
  </div>
  <button
    type="submit"
    disabled={!searchStore.searchType}
    class={cn(
      'rounded-lg bg-primary px-4 font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50',
      size === 'lg' ? 'h-12 px-6' : 'h-9',
    )}
  >
    Search
  </button>
</form>
