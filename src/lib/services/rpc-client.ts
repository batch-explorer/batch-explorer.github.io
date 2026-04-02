// Copyright 2026 The Swarm Authors. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { createPublicClient, http } from 'viem'
import { gnosis } from 'viem/chains'
import { DEFAULT_GNOSIS_RPC_URL } from '$lib/constants'

export const publicClient = createPublicClient({
  chain: gnosis,
  transport: http(DEFAULT_GNOSIS_RPC_URL),
})
