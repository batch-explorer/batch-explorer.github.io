<!--
  Copyright 2026 The Swarm Authors. All rights reserved.
  SPDX-License-Identifier: Apache-2.0
-->

<script lang="ts">
  import { type PostageEvent } from '$lib/types'
  import Badge from './ui/badge/badge.svelte'

  interface Props {
    event: PostageEvent
  }

  let { event }: Props = $props()

  const VARIANT_MAP = {
    BatchCreated: 'success',
    BatchTopUp: 'default',
    BatchDepthIncrease: 'warning',
    PriceUpdate: 'secondary',
  } as const

  const EVENT_NAME_MAP = {
    BatchCreated: 'Created',
    BatchTopUp: 'TopUp',
    BatchDepthIncrease: 'Increase Depth',
    PriceUpdate: 'Update',
  } as const
</script>

<Badge variant={VARIANT_MAP[event.eventName]}>
  {EVENT_NAME_MAP[event.eventName]}
</Badge>
