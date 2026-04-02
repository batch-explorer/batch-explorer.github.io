<!--
  Copyright 2026 The Swarm Authors. All rights reserved.
  SPDX-License-Identifier: Apache-2.0
-->

<script lang="ts">
  interface Props {
    value: string
  }

  let { value }: Props = $props()

  function splitDigitGroups(str: string): string[] {
    const result: string[] = []
    for (let i = str.length; i > 0; i -= 3) {
      result.unshift(str.slice(Math.max(0, i - 3), i))
    }
    return result
  }

  const groups = $derived(splitDigitGroups(value))
</script>

<span class="digit-groups">
  {#each groups as group, i (i)}
    <span class="digit-group">{group}</span>
  {/each}
</span>

<style>
  .digit-groups {
    display: inline;
  }
  .digit-group + .digit-group {
    margin-left: 0.3em;
  }
</style>
