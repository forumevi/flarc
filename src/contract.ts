import artifact from '../contracts/out/FlareLaunchpad.sol/FlareLaunchpad.json'

export const FLARE_ADDRESS = (import.meta.env.VITE_CONTRACT_ADDRESS || '0x0f69fa4e1dac3d32dbfb93556e8a075661b1480b') as `0x${string}`
export const FLARE_ABI = artifact.abi

export const ARC_TESTNET_CHAIN_ID = 5042002
export const ARC_MAINNET_CHAIN_ID = 5042
// Chain to use: mainnet if VITE_CHAIN_ID=5042, else testnet
export const ACTIVE_CHAIN_ID: number = import.meta.env.VITE_CHAIN_ID === '5042' ? ARC_MAINNET_CHAIN_ID : ARC_TESTNET_CHAIN_ID
export const IS_MAINNET = ACTIVE_CHAIN_ID === ARC_MAINNET_CHAIN_ID
export const USDC_ADDRESS = '0x3600000000000000000000000000000000000000' as const
export const USDC_DECIMALS = 6

export interface TokenInfo {
  id: bigint
  name: string
  symbol: string
  imageUrl: string
  creator: `0x${string}`
  createdAt: bigint
  virtualUsdcReserve: bigint
  virtualTokenReserve: bigint
  realUsdcCollected: bigint
  totalSupply: bigint
  graduated: boolean
}

export function formatUsdc(raw: bigint, decimals = 2): string {
  const n = Number(raw) / 1e6
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return n.toFixed(decimals)
}

export function formatTokenAmount(raw: bigint): string {
  const n = Number(raw) / 1e6
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return n.toFixed(0)
}

export function formatAddress(addr: string): string {
  return addr.slice(0, 6) + '...' + addr.slice(-4)
}

// Both reserves carry 6-decimal precision.
// price = virtualUsdcReserve / virtualTokenReserve  (USDC-units per token-unit)
// 1 whole token = 1e6 token-units, so pricePerWholeToken = price * 1e6
export function getCurrentPrice(token: TokenInfo): number {
  if (token.virtualTokenReserve === 0n) return 0
  return Number(token.virtualUsdcReserve) / Number(token.virtualTokenReserve)
}

// Returns USDC per 1 whole token (human readable)
export function getPricePerToken(token: TokenInfo): number {
  return getCurrentPrice(token) * 1e6
}

// Format price without scientific notation
export function formatPrice(token: TokenInfo): string {
  const p = getPricePerToken(token)
  if (p === 0) return '$0.00'
  if (p >= 1_000_000) return '$' + (p / 1_000_000).toFixed(2) + 'M'
  if (p >= 1_000) return '$' + (p / 1_000).toFixed(2) + 'K'
  if (p >= 1) return '$' + p.toFixed(4)
  if (p >= 0.001) return '$' + p.toFixed(6)
  // Very small values: fixed notation, trim trailing zeros
  const fixed = p.toFixed(12).replace(/0+$/, '').replace(/\.$/, '')
  return '$' + fixed
}

// Market cap in raw USDC (6 decimals): price * 1B token units
export function getMarketCap(token: TokenInfo): number {
  return getCurrentPrice(token) * 1_000_000_000
}

// Format market cap
export function formatMarketCap(token: TokenInfo): string {
  const mc = getMarketCap(token) / 1e6 // in human USDC
  if (mc >= 1_000_000) return '$' + (mc / 1_000_000).toFixed(1) + 'M'
  if (mc >= 1_000) return '$' + (mc / 1_000).toFixed(1) + 'K'
  if (mc >= 1) return '$' + mc.toFixed(2)
  return '$' + mc.toFixed(4)
}

export const GRADUATION_THRESHOLD = 69_000 * 1e6

export function graduationProgress(token: TokenInfo): number {
  return Math.min(100, (Number(token.realUsdcCollected) / GRADUATION_THRESHOLD) * 100)
}
