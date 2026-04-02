// Copyright 2026 The Swarm Authors. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

export const POSTAGE_STAMP_ABI = [
  {
    type: 'event',
    name: 'BatchCreated',
    inputs: [
      { name: 'batchId', type: 'bytes32', indexed: true },
      { name: 'totalAmount', type: 'uint256', indexed: false },
      { name: 'normalisedBalance', type: 'uint256', indexed: false },
      { name: 'owner', type: 'address', indexed: false },
      { name: 'depth', type: 'uint8', indexed: false },
      { name: 'bucketDepth', type: 'uint8', indexed: false },
      { name: 'immutableFlag', type: 'bool', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'BatchTopUp',
    inputs: [
      { name: 'batchId', type: 'bytes32', indexed: true },
      { name: 'topupAmount', type: 'uint256', indexed: false },
      { name: 'normalisedBalance', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'BatchDepthIncrease',
    inputs: [
      { name: 'batchId', type: 'bytes32', indexed: true },
      { name: 'newDepth', type: 'uint8', indexed: false },
      { name: 'normalisedBalance', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'PriceUpdate',
    inputs: [{ name: 'price', type: 'uint256', indexed: false }],
  },
  {
    type: 'function',
    name: 'lastPrice',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'currentTotalOutPayment',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const

export const BZZ_TOKEN_ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const

export const POSTAGE_STAMP_VIEWS_ABI = [
  ...POSTAGE_STAMP_ABI,
  {
    type: 'function',
    name: 'bzzToken',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
] as const
