<!--
  Copyright 2026 The Swarm Authors. All rights reserved.
  SPDX-License-Identifier: Apache-2.0
-->

<script lang="ts">
  import SearchBar from '$lib/components/search-bar.svelte'
  import EventList from '$lib/components/event-list.svelte'
  import { eventsStore } from '$lib/stores/events.svelte'
  import { onMount } from 'svelte'

  onMount(() => {
    eventsStore.loadInitial()
  })
</script>

<svelte:head>
  <title>Batch Explorer - Swarm Postage Stamp Contract</title>
</svelte:head>

<div class="space-y-8">
  <div class="flex flex-col items-center gap-4 py-8">
    <h1 class="text-3xl font-bold">Swarm Batch Explorer</h1>
    <p class="text-muted-foreground">
      Explore postage batch events on the Swarm PostageStamp contract
    </p>
    <SearchBar size="lg" class="max-w-2xl" />
  </div>

  <EventList />
</div>
