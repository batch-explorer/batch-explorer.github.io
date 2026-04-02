<!--
  Copyright 2026 The Swarm Authors. All rights reserved.
  SPDX-License-Identifier: Apache-2.0
-->

<script lang="ts">
  interface Props {
    value: string
    truncate?: boolean
    href?: string
  }

  let { value, truncate = true, href }: Props = $props()

  let copied = $state(false)

  const displayValue = $derived(
    truncate && value.length > 16 ? `${value.slice(0, 10)}...${value.slice(-6)}` : value,
  )

  async function copy() {
    await navigator.clipboard.writeText(value)
    copied = true
    setTimeout(() => {
      copied = false
    }, 1500)
  }
</script>

<span class="inline-flex items-center gap-1 font-mono text-sm">
  {#if href}
    <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- dynamic hrefs with base path -->
    <a {href} class="text-primary hover:underline">{displayValue}</a>
  {:else}
    <span title={value}>{displayValue}</span>
  {/if}
  <button
    onclick={copy}
    class="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
    title="Copy to clipboard"
  >
    {#if copied}
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"
        ></path>
      </svg>
    {:else}
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
        ></path>
      </svg>
    {/if}
  </button>
</span>
