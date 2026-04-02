<!--
  Copyright 2026 The Swarm Authors. All rights reserved.
  SPDX-License-Identifier: Apache-2.0
-->

<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card'
  import { Button } from '$lib/components/ui/button'
  import EventRow from '$lib/components/event-row.svelte'
  import LoadingSpinner from '$lib/components/loading-spinner.svelte'
  import { eventsStore } from '$lib/stores/events.svelte'

  let autoRefresh = $state(false)
  let refreshInterval: ReturnType<typeof setInterval> | undefined = undefined

  function toggleAutoRefresh() {
    autoRefresh = !autoRefresh
    if (autoRefresh) {
      refreshInterval = setInterval(() => {
        eventsStore.refresh()
      }, 30000)
    } else if (refreshInterval) {
      clearInterval(refreshInterval)
      refreshInterval = undefined
    }
  }
</script>

<Card>
  <CardHeader class="flex flex-row items-center justify-between">
    <CardTitle>Recent Events</CardTitle>
    <div class="flex items-center gap-2">
      <Button variant="outline" size="sm" onclick={() => eventsStore.refresh()}>Refresh</Button>
      <Button variant={autoRefresh ? 'default' : 'outline'} size="sm" onclick={toggleAutoRefresh}>
        {autoRefresh ? 'Auto: ON' : 'Auto: OFF'}
      </Button>
    </div>
  </CardHeader>
  <CardContent class="p-0">
    <div
      class="grid grid-cols-[9.5rem_1fr_1fr_1fr_6.5rem_11rem] gap-4 border-b bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground"
    >
      <span>Event</span>
      <span>Batch ID</span>
      <span>Details</span>
      <span>Date</span>
      <span>Block</span>
      <span>Tx Hash</span>
    </div>

    {#if eventsStore.events.length === 0 && !eventsStore.loading}
      <div class="py-12 text-center text-muted-foreground">
        No events found in the current block range.
      </div>
    {/if}

    {#each eventsStore.events as event (`${event.transactionHash}-${event.logIndex}`)}
      <EventRow {event} />
    {/each}

    {#if eventsStore.loading}
      <LoadingSpinner />
    {/if}

    {#if eventsStore.error}
      <div class="px-4 py-3 text-sm text-destructive">
        Error: {eventsStore.error}
      </div>
    {/if}

    {#if eventsStore.hasMore && !eventsStore.loading}
      <div class="flex justify-center p-4">
        <Button variant="outline" onclick={() => eventsStore.loadMore()}>Load more events</Button>
      </div>
    {/if}
  </CardContent>
</Card>
