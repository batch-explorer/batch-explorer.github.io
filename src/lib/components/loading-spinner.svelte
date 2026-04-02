<!--
  Copyright 2026 The Swarm Authors. All rights reserved.
  SPDX-License-Identifier: Apache-2.0
-->

<script lang="ts">
  import { cn } from '$lib/utils'

  interface Props {
    class?: string
  }

  let { class: className }: Props = $props()
</script>

<div class={cn('flex items-center justify-center py-8', className)}>
  <div class="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary"></div>
</div>
