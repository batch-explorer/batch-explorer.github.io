<!--
  Copyright 2026 The Swarm Authors. All rights reserved.
  SPDX-License-Identifier: Apache-2.0
-->

<script lang="ts">
  import { GNOSISSCAN_BASE_URL } from '$lib/constants'

  interface Props {
    blockNumber: bigint | number
  }

  let { blockNumber }: Props = $props()
</script>

<a
  href="{GNOSISSCAN_BASE_URL}/block/{blockNumber.toString()}"
  target="_blank"
  rel="noopener noreferrer"
  class="inline-flex items-center rounded border border-border px-1.5 py-0.5 text-[11px] font-semibold hover:bg-accent hover:text-accent-foreground transition-colors"
>
  #{blockNumber.toString()}
</a>
