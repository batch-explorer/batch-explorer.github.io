# Swarm Postage Batch Contract Explorer

A web application for exploring postage batch events on the Swarm PostageStamp smart contract on Gnosis Chain.

**Live Site:** [https://batch-explorer.github.io](https://batch-explorer.github.io)

## Features

- **Batch Search** - Look up any postage batch by its ID
- **Transaction Lookup** - View batch events by transaction hash
- **Event History** - Browse the latest PostageStamp contract events
- **Batch Details** - View batch summary including owner, depth, and value

## Prerequisites

- Node.js >= 22
- pnpm

## Getting Started

```bash
# Clone the repository
git clone https://github.com/batch-explorer/batch-explorer.github.io.git
cd batch-explorer.github.io

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The app will be available at `http://localhost:5175`.

## Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start development server on port 5175 |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build |
| `pnpm check` | Run Svelte type checking |
| `pnpm lint` | Check code formatting and linting |
| `pnpm format` | Auto-fix formatting and lint issues |

## Tech Stack

- [SvelteKit 2](https://kit.svelte.dev/) with [Svelte 5](https://svelte.dev/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Viem](https://viem.sh/) for Ethereum interactions
- TypeScript

## License

Copyright 2026 The Swarm Authors. All rights reserved.

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) for details.
