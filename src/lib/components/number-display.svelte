<!--
  Copyright 2026 The Swarm Authors. All rights reserved.
  SPDX-License-Identifier: Apache-2.0
-->

<script lang="ts">
  interface Props {
    value: bigint | number
    sans?: boolean
  }

  let { value, sans = false }: Props = $props()

  // Group with en-US separators, then render each group in its own span with a
  // CSS-margin gap (not a space character) so the copied text stays the raw
  // number, e.g. "2233070266613760" instead of "2 233 070 266 613 760".
  const groups = $derived(value.toLocaleString('en-US').split(','))
</script>

<!-- prettier-ignore -->
<span class={sans ? 'tabular-nums' : 'font-mono tabular-nums'}>{#each groups as g, i (i)}<span class={i ? 'ml-[0.2em]' : ''}>{g}</span>{/each}</span>
