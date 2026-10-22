/**
 * wagmi configuration
 * Built with Arc Studio — https://studio.arc.io
 */

import { http, createConfig } from 'wagmi'
import { defineChain } from 'viem'
import { injected } from 'wagmi/connectors'
import { registerChain } from './tracing'

// Use a same-origin proxy path so the RPC is never blocked by ad-blockers or
// network-level filters — Vercel rewrites /rpc → https://rpc.mainnet.arc.io
const RPC_URL = typeof window !== 'undefined'
  ? window.location.origin + '/rpc'
  : 'https://rpc.mainnet.arc.io'

export const arcMainnet = defineChain({
  id: 5042,
  name: 'Arc',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: { default: { http: [RPC_URL] } },
  blockExplorers: { default: { name: 'Arc Explorer', url: 'https://explorer.arc.io' } },
})

// Pre-register chain RPC URL so trace events show correct chain name immediately
registerChain(arcMainnet.id, 'https://rpc.mainnet.arc.io')

export const config = createConfig({
  chains: [arcMainnet],
  connectors: [injected()],
  transports: {
    [arcMainnet.id]: http(),
  },
})
