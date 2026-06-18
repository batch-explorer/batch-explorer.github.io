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

  const formatted = $derived(value.toLocaleString('en-US').replaceAll(',', ' '))
</script>

<span class={sans ? 'tabular-nums' : 'font-mono tabular-nums'}>{formatted}</span>
