<!--
  Copyright 2026 The Swarm Authors. All rights reserved.
  SPDX-License-Identifier: Apache-2.0
-->

<script lang="ts">
  import '../app.css'
  import Header from '$lib/components/layout/header.svelte'
  import Footer from '$lib/components/layout/footer.svelte'
  import { networkStatsStore } from '$lib/stores/network-stats.svelte'
  import { bzzPriceStore } from '$lib/stores/bzz-price.svelte'
  import { onMount } from 'svelte'
  import type { Snippet } from 'svelte'

  interface Props {
    children: Snippet
  }

  let { children }: Props = $props()

  onMount(() => {
    networkStatsStore.fetch()
    bzzPriceStore.fetch()
    const interval = setInterval(() => networkStatsStore.fetch(), 30000)
    return () => clearInterval(interval)
  })
</script>

<div class="flex min-h-screen flex-col">
  <Header />
  <main class="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
    {@render children()}
  </main>
  <Footer />
</div>
