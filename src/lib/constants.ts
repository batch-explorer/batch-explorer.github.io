// Copyright 2026 The Swarm Authors. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

export const POSTAGE_STAMP_ADDRESS = '0x45a1502382541cd610cc9068e88727426b696293' as const

export const DEFAULT_GNOSIS_RPC_URL = 'https://rpc.gnosis.gateway.fm'

export const SWARMSCAN_API_BASE = 'https://api.swarmscan.io/v1'

export const SWARMSCAN_STATS_URL = `${SWARMSCAN_API_BASE}/postage-stamps/stats`

export const BLOCKSCOUT_API_URL = 'https://gnosis.blockscout.com/api'

export const GNOSISSCAN_BASE_URL = 'https://gnosisscan.io'

export const BATCH_ID_LENGTH = 64

export const TX_HASH_LENGTH = 66

export const CHUNK_SIZE = 4096

export const GNOSIS_BLOCK_TIME_MS = 5000

export const PLUR_PER_BZZ = 10n ** 16n

// Derived for unit-price → storage-cost conversion.
// ponytail: "month" = 30 days; Swarmscan's own figure may differ slightly.
export const CHUNKS_PER_GB = 1024 ** 3 / CHUNK_SIZE // 262144
export const BLOCKS_PER_MONTH = (30 * 24 * 3600 * 1000) / GNOSIS_BLOCK_TIME_MS // 518400
