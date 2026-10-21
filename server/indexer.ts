import { createPublicClient, http, parseAbiItem } from 'viem'
import { insertTrade, getLastBlock, setLastBlock } from './db.ts'

const proxyChains = (process.env.RPC_PROXY_CHAINS || '').split(',').map((s: string) => s.trim())
const rpcUrl = process.env.RPC_PROXY_BASE_URL && proxyChains.includes('Arc_Testnet')
  ? process.env.RPC_PROXY_BASE_URL + '/api/rpc/Arc_Testnet?_rpc_token=' + process.env.RPC_PROXY_TOKEN
  : 'https://rpc.testnet.arc.io' // arc-studio-allow-onchain-literal

const CONTRACT_ADDRESS = (process.env.VITE_CONTRACT_ADDRESS || '') as `0x${string}`

if (!CONTRACT_ADDRESS) throw new Error('VITE_CONTRACT_ADDRESS not set in .env')

const client = createPublicClient({ transport: http(rpcUrl) })

const BOUGHT_EVENT = parseAbiItem('event TokensPurchased(uint256 indexed tokenId, address indexed buyer, uint256 usdcAmount, uint256 tokensReceived, uint256 newPrice)')
const SOLD_EVENT = parseAbiItem('event TokensSold(uint256 indexed tokenId, address indexed seller, uint256 tokenAmount, uint256 usdcReceived, uint256 newPrice)')

interface LogArgs {
  tokenId: bigint
  buyer?: string
  seller?: string
  usdcAmount?: bigint
  usdcReceived?: bigint
  tokensReceived?: bigint
  tokenAmount?: bigint
  newPrice: bigint
}

interface TypedLog {
  args: LogArgs
  blockNumber: bigint | null
  transactionHash: string | null
}

const CHUNK = 50n
const _POLL_INTERVAL = 30000 // 30s background poll — on-demand sync also available

async function processLog(log: TypedLog, side: 'buy' | 'sell') {
  const { args, blockNumber, transactionHash } = log
  if (!blockNumber || !transactionHash) return

  let ts: number
  try {
    const block = await client.getBlock({ blockNumber })
    ts = Number(block.timestamp)
  } catch {
    ts = Math.floor(Date.now() / 1000)
  }

  const tokenId = Number(args.tokenId)
  const newPrice = Number(args.newPrice) / 1e6

  if (side === 'buy') {
    insertTrade({
      token_id: tokenId,
      trader: args.buyer ?? '',
      side: 'buy',
      usdc_amount: Number(args.usdcAmount ?? 0n),
      token_amount: Number(args.tokensReceived ?? 0n),
      price_usdc: newPrice,
      block_number: Number(blockNumber),
      tx_hash: transactionHash,
      ts,
    })
  } else {
    insertTrade({
      token_id: tokenId,
      trader: args.seller ?? '',
      side: 'sell',
      usdc_amount: Number(args.usdcReceived ?? 0n),
      token_amount: Number(args.tokenAmount ?? 0n),
      price_usdc: newPrice,
      block_number: Number(blockNumber),
      tx_hash: transactionHash,
      ts,
    })
  }
}

async function sync() {
  try {
    const latest = await client.getBlockNumber()
    const from = getLastBlock()
    if (from >= latest) return

    const start = from === 0n ? (latest > 2000n ? latest - 2000n : 0n) : from + 1n
    const end = start + CHUNK > latest ? latest : start + CHUNK

    const [buyLogs, sellLogs] = await Promise.all([
      client.getLogs({ address: CONTRACT_ADDRESS, event: BOUGHT_EVENT, fromBlock: start, toBlock: end }),
      client.getLogs({ address: CONTRACT_ADDRESS, event: SOLD_EVENT, fromBlock: start, toBlock: end }),
    ])

    for (const log of buyLogs) await processLog(log as unknown as TypedLog, 'buy')
    for (const log of sellLogs) await processLog(log as unknown as TypedLog, 'sell')

    setLastBlock(end)
    if (buyLogs.length + sellLogs.length > 0) {
      console.log('[indexer] synced blocks ' + start + '-' + end + ': ' + buyLogs.length + ' buys, ' + sellLogs.length + ' sells')
    }
  } catch (err) {
    console.error('[indexer] sync error:', err)
  }
}

export async function syncNow() {
  await sync()
}

export function startIndexer() {
  console.log('[indexer] ready — contract:', CONTRACT_ADDRESS)
  // Background polling disabled: public RPC rate-limits eth_getLogs.
  // Sync is triggered on-demand via POST /sync after each trade.
  // On mainnet or with a private RPC, re-enable: setInterval(() => { void sync() }, POLL_INTERVAL)
}
