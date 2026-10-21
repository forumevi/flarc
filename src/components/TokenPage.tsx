import { useState, useEffect, useRef, useCallback, startTransition } from 'react'
import { ArrowLeft, ExternalLink, TrendingUp, TrendingDown, Users, BarChart3, Loader2 } from 'lucide-react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useSwitchChain, usePublicClient, useWatchContractEvent } from 'wagmi'
import { erc20Abi, parseAbiItem } from 'viem'
import { createChart, type IChartApi, type ISeriesApi, ColorType, type Time, type LineData, LineSeries } from 'lightweight-charts'
import { FLARE_ADDRESS, FLARE_ABI, ACTIVE_CHAIN_ID, IS_MAINNET, USDC_ADDRESS, type TokenInfo, formatUsdc, formatAddress, formatTokenAmount, graduationProgress, getMarketCap, formatMarketCap, formatPrice } from '../contract'
import { toast } from 'sonner'
import { buildTxExplorerUrl } from '@/onchain-facts'

const glass = {
  card: {
    background: 'var(--card-bg)',
    border: '1px solid var(--card-border)',
  } as React.CSSProperties,
  inner: { background: 'var(--surface)', border: '1px solid var(--border)' } as React.CSSProperties,
}

// Contract events ABI items
const BOUGHT_EVENT = parseAbiItem('event TokensPurchased(uint256 indexed tokenId, address indexed buyer, uint256 usdcAmount, uint256 tokensReceived, uint256 newPrice)')
const SOLD_EVENT = parseAbiItem('event TokensSold(uint256 indexed tokenId, address indexed seller, uint256 tokenAmount, uint256 usdcReceived, uint256 newPrice)')

interface LocalTrade {
  key: string
  side: 'buy' | 'sell'
  trader: string
  usdcAmount: bigint
  tokenAmount: bigint
  price: number
  blockNumber: bigint
  txHash: string
  ts: number
}

interface Metadata { description: string; twitter: string; telegram: string; website: string }

interface Props { tokenId: bigint; onBack: () => void }
type TradeTab = 'trades' | 'holders'
type TradeSide = 'buy' | 'sell'

export default function TokenPage({ tokenId, onBack }: Props) {
  const { address, chainId } = useAccount()
  const { switchChain } = useSwitchChain()
  const wrongChain = chainId !== ACTIVE_CHAIN_ID
  const publicClient = usePublicClient({ chainId: ACTIVE_CHAIN_ID })

  const [side, setSide] = useState<TradeSide>('buy')
  const [amount, setAmount] = useState('')
  const [tab, setTab] = useState<TradeTab>('trades')
  const [trades, setTrades] = useState<LocalTrade[]>([])
  const [loadingTrades, setLoadingTrades] = useState(false)
  const [metadata, setMetadata] = useState<Metadata>({ description: '', twitter: '', telegram: '', website: '' })

  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Line'> | null>(null)

  const { data: tokenData, refetch: refetchToken } = useReadContract({
    address: FLARE_ADDRESS, abi: FLARE_ABI, functionName: 'getToken',
    args: [tokenId], chainId: ACTIVE_CHAIN_ID,
  })
  const { data: usdcBalance } = useReadContract({
    address: USDC_ADDRESS, abi: erc20Abi, functionName: 'balanceOf',
    args: address ? [address] : undefined, chainId: ACTIVE_CHAIN_ID,
    query: { enabled: !!address },
  })
  const { data: tokenBalance, refetch: refetchTokenBalance } = useReadContract({
    address: FLARE_ADDRESS, abi: FLARE_ABI, functionName: 'tokenBalances',
    args: address ? [tokenId, address] : undefined, chainId: ACTIVE_CHAIN_ID,
    query: { enabled: !!address },
  })
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS, abi: erc20Abi, functionName: 'allowance',
    args: address ? [address, FLARE_ADDRESS] : undefined, chainId: ACTIVE_CHAIN_ID,
    query: { enabled: !!address },
  })

  const token = tokenData as TokenInfo | undefined

  const { writeContract: approve, data: approveTx, isPending: approvePending } = useWriteContract()
  const { isLoading: approveConfirming, isSuccess: approveSuccess } = useWaitForTransactionReceipt({ hash: approveTx })
  const { writeContract: trade, data: tradeTx, isPending: tradePending } = useWriteContract()
  const { isLoading: tradeConfirming, isSuccess: tradeSuccess } = useWaitForTransactionReceipt({ hash: tradeTx })

  // Fetch trades from contract events directly — last 2000 blocks only to avoid rate-limit
  const fetchTrades = useCallback(async () => {
    if (!publicClient) return
    setLoadingTrades(true)
    try {
      const latest = await publicClient.getBlockNumber()
      const from = latest > 2000n ? latest - 2000n : 0n

      const [buyLogs, sellLogs] = await Promise.all([
        publicClient.getLogs({ address: FLARE_ADDRESS, event: BOUGHT_EVENT, args: { tokenId }, fromBlock: from, toBlock: latest }),
        publicClient.getLogs({ address: FLARE_ADDRESS, event: SOLD_EVENT, args: { tokenId }, fromBlock: from, toBlock: latest }),
      ])

      const allTrades: LocalTrade[] = []

      for (const log of buyLogs) {
        const a = log.args
        allTrades.push({
          key: log.transactionHash + log.logIndex,
          side: 'buy',
          trader: (a.buyer as string) ?? '',
          usdcAmount: (a.usdcAmount as bigint) ?? 0n,
          tokenAmount: (a.tokensReceived as bigint) ?? 0n,
          price: Number((a.newPrice as bigint) ?? 0n) / 1e6,
          blockNumber: log.blockNumber ?? 0n,
          txHash: log.transactionHash ?? '',
          ts: 0,
        })
      }
      for (const log of sellLogs) {
        const a = log.args
        allTrades.push({
          key: log.transactionHash + log.logIndex,
          side: 'sell',
          trader: (a.seller as string) ?? '',
          usdcAmount: (a.usdcReceived as bigint) ?? 0n,
          tokenAmount: (a.tokenAmount as bigint) ?? 0n,
          price: Number((a.newPrice as bigint) ?? 0n) / 1e6,
          blockNumber: log.blockNumber ?? 0n,
          txHash: log.transactionHash ?? '',
          ts: 0,
        })
      }

      // Sort by block descending
      allTrades.sort((a, b) => Number(b.blockNumber - a.blockNumber))
      startTransition(() => setTrades(allTrades))
    } catch (err) {
      console.error('[trades] fetch error:', err)
    } finally {
      startTransition(() => setLoadingTrades(false))
    }
  }, [publicClient, tokenId])

  // Initial fetch — queueMicrotask avoids synchronous setState-in-effect lint warning
  useEffect(() => { queueMicrotask(() => { void fetchTrades() }) }, [fetchTrades])

  // Fetch metadata from backend (non-critical)
  useEffect(() => {
    fetch('/api/metadata/' + Number(tokenId))
      .then(r => r.json()).then((d: Metadata) => setMetadata(d)).catch(() => {})
  }, [tokenId])

  // Watch for new buy events in real-time
  useWatchContractEvent({
    address: FLARE_ADDRESS,
    abi: FLARE_ABI,
    eventName: 'TokensPurchased',
    args: { tokenId },
    onLogs: () => { void fetchTrades(); void refetchToken() },
    chainId: ACTIVE_CHAIN_ID,
  })

  // Watch for new sell events in real-time
  useWatchContractEvent({
    address: FLARE_ADDRESS,
    abi: FLARE_ABI,
    eventName: 'TokensSold',
    args: { tokenId },
    onLogs: () => { void fetchTrades(); void refetchToken() },
    chainId: ACTIVE_CHAIN_ID,
  })

  // Chart setup
  useEffect(() => {
    if (!chartContainerRef.current) return
    const chart = createChart(chartContainerRef.current, {
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: '#8a849c' },
      grid: { vertLines: { color: 'rgba(18,45,69,0.06)' }, horzLines: { color: 'rgba(18,45,69,0.06)' } },
      width: chartContainerRef.current.clientWidth,
      height: 200,
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false },
    })
    const series = chart.addSeries(LineSeries, { color: '#122d45', lineWidth: 2 })
    chartRef.current = chart
    seriesRef.current = series
    const observer = new ResizeObserver(() => {
      if (chartContainerRef.current) chart.applyOptions({ width: chartContainerRef.current.clientWidth })
    })
    observer.observe(chartContainerRef.current)
    return () => { chart.remove(); observer.disconnect() }
  }, [])

  // Update chart when trades change
  useEffect(() => {
    if (!seriesRef.current || trades.length === 0) return
    const sorted = [...trades].sort((a, b) => Number(a.blockNumber - b.blockNumber))
    const now = Math.floor(Date.now() / 1000)
    const data: LineData<Time>[] = sorted.map((t, i) => ({
      time: (now - (sorted.length - 1 - i) * 12) as Time, // ~12s per block estimate
      value: t.price,
    }))
    // Deduplicate by time (lightweight-charts requires unique times)
    const seen = new Set<number>()
    const deduped = data.filter(d => {
      if (seen.has(d.time as number)) return false
      seen.add(d.time as number)
      return true
    })
    seriesRef.current.setData(deduped)
    chartRef.current?.timeScale().fitContent()
  }, [trades])

  const parsedAmount = amount && !isNaN(parseFloat(amount))
    ? BigInt(Math.round(parseFloat(amount) * 1e6))
    : 0n

  const needsApprove = side === 'buy' && (!allowance || (allowance) < parsedAmount)

  const setQuick = useCallback((pct: number) => {
    if (side === 'buy' && usdcBalance) {
      setAmount(((Number(usdcBalance) * pct / 100) / 1e6).toFixed(2))
    } else if (side === 'sell' && tokenBalance) {
      setAmount(((Number(tokenBalance) * pct / 100) / 1e6).toFixed(2))
    }
  }, [side, usdcBalance, tokenBalance])

  const doTrade = useCallback(() => {
    if (!parsedAmount || parsedAmount === 0n) return
    if (side === 'buy') {
      trade({ address: FLARE_ADDRESS, abi: FLARE_ABI, functionName: 'buyTokens', args: [tokenId, parsedAmount, 0n] })
    } else {
      trade({ address: FLARE_ADDRESS, abi: FLARE_ABI, functionName: 'sellTokens', args: [tokenId, parsedAmount, 0n] })
    }
  }, [parsedAmount, side, trade, tokenId])

  const handleTrade = useCallback(() => {
    if (!address) return
    if (wrongChain) { switchChain({ chainId: ACTIVE_CHAIN_ID }); return }
    if (!parsedAmount || parsedAmount === 0n) { toast.error('Enter an amount'); return }
    if (needsApprove) {
      approve({ address: USDC_ADDRESS, abi: erc20Abi, functionName: 'approve', args: [FLARE_ADDRESS, parsedAmount * 100n] })
    } else {
      doTrade()
    }
  }, [address, wrongChain, switchChain, parsedAmount, needsApprove, approve, doTrade])

  const displayAmount = tradeSuccess ? '' : amount

  useEffect(() => {
    if (!tradeSuccess) return
    toast.success(side === 'buy' ? 'Bought!' : 'Sold!')
    void refetchToken()
    void refetchAllowance()
    void refetchTokenBalance()
    setTimeout(() => void fetchTrades(), 2000)
  }, [tradeSuccess]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!approveSuccess) return
    void refetchAllowance().then(() => doTrade())
  }, [approveSuccess]) // eslint-disable-line react-hooks/exhaustive-deps

  const mcap = token ? getMarketCap(token) : 0
  const progress = token ? graduationProgress(token) : 0

  // Compute holders from local trades
  const holdersMap = new Map<string, bigint>()
  for (const t of trades) {
    const cur = holdersMap.get(t.trader) ?? 0n
    if (t.side === 'buy') holdersMap.set(t.trader, cur + t.tokenAmount)
    else holdersMap.set(t.trader, cur > t.tokenAmount ? cur - t.tokenAmount : 0n)
  }
  const holders = [...holdersMap.entries()]
    .filter(([, bal]) => bal > 0n)
    .sort((a, b) => Number(b[1] - a[1]))

  // ERC-20 USDC is always 6 decimals
  const formattedUsdcBalance = usdcBalance
    ? (Number(usdcBalance) / 1e6).toFixed(2)
    : '0'
  const rawTokenBalance = tokenBalance as bigint | undefined
  const formattedTokenBalance = rawTokenBalance ? formatTokenAmount(rawTokenBalance) : '0'
  const isBusy = approvePending || approveConfirming || tradePending || tradeConfirming

  return (
    <div className="relative min-h-dvh" style={{ background: 'var(--bg-gradient)' }}>
      <div className="relative z-10 mx-auto max-w-5xl px-4 pb-10 pt-5">
        <button onClick={onBack} className="mb-4 flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-70" style={{ color: 'var(--muted)' }}>
          <ArrowLeft className="size-4" /> Launches
        </button>

        {token ? (
          <>
            <div className="mb-5 flex items-start justify-between">
              <div className="flex items-center gap-3">
                {token.imageUrl ? (
                  <img src={token.imageUrl} alt={token.symbol} className="size-14 rounded-2xl object-cover" />
                ) : (
                  <div className="flex size-14 items-center justify-center rounded-2xl text-xl font-bold text-white"
                    style={{ background: 'hsl(' + (Number(token.id) * 47 % 360) + ', 65%, 50%)' }}>
                    {token.symbol.slice(0, 2)}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="display text-2xl font-bold" style={{ color: 'var(--ink)' }}>{token.name}</h1>
                    <span className="text-sm font-semibold" style={{ color: 'var(--muted)' }}>{token.symbol}</span>
                    {token.graduated && (
                      <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: 'rgba(26,128,71,0.12)', color: 'var(--success)' }}>Graduated</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--subtle)' }}>
                    <span>by {formatAddress(token.creator)}</span>
                    {metadata.twitter && <a href={'https://x.com/' + metadata.twitter.replace('@', '')} target="_blank" rel="noreferrer" className="hover:underline">X</a>}
                    {metadata.telegram && <a href={metadata.telegram.startsWith('http') ? metadata.telegram : 'https://t.me/' + metadata.telegram} target="_blank" rel="noreferrer" className="hover:underline">Telegram</a>}
                    {metadata.website && <a href={metadata.website} target="_blank" rel="noreferrer" className="flex items-center gap-0.5 hover:underline">Site <ExternalLink className="size-2.5" /></a>}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="display text-3xl font-bold tabular-nums" style={{ color: 'var(--ink)' }}>{formatMarketCap(token)}</div>
                <div className="text-xs" style={{ color: 'var(--subtle)' }}>market cap</div>
              </div>
            </div>

            {metadata.description && (
              <p className="mb-4 text-sm" style={{ color: 'var(--muted)' }}>{metadata.description}</p>
            )}

            <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
              <div className="space-y-4">
                {/* Chart */}
                <div className="overflow-hidden rounded-2xl p-4" style={glass.card}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="display text-xl font-bold tabular-nums" style={{ color: 'var(--ink)' }}>
                      {formatPrice(token)}
                    </span>
                    <BarChart3 className="size-4" style={{ color: 'var(--subtle)' }} />
                  </div>
                  {loadingTrades && trades.length === 0 && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="size-5 animate-spin" style={{ color: 'var(--subtle)' }} />
                    </div>
                  )}
                  {!loadingTrades && trades.length === 0 && (
                    <p className="py-4 text-center text-xs" style={{ color: 'var(--subtle)' }}>No trades yet — be the first buyer</p>
                  )}
                  <div ref={chartContainerRef} style={{ display: trades.length > 0 ? 'block' : 'none' }} />
                </div>

                {/* Bonding curve */}
                <div className="rounded-2xl p-4" style={glass.card}>
                  <div className="mb-2 flex justify-between text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                    <span>Bonding curve</span>
                    <span>{progress.toFixed(1)}% of 69,000 USDC</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full" style={{ background: 'var(--surface-muted)' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: progress + '%', background: progress > 70 ? '#f59e0b' : 'var(--accent)' }} />
                  </div>
                  <p className="mt-1.5 text-xs" style={{ color: 'var(--subtle)' }}>
                    {formatUsdc(token.realUsdcCollected)} USDC collected · graduates at 69K
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Market cap', value: '$' + formatUsdc(BigInt(Math.round(mcap))) },
                    { label: 'Holders', value: holders.length.toString() },
                    { label: 'Trades', value: trades.length.toString() },
                  ].map(s => (
                    <div key={s.label} className="rounded-xl p-3 text-center" style={glass.card}>
                      <div className="display text-lg font-bold tabular-nums" style={{ color: 'var(--ink)' }}>{s.value}</div>
                      <div className="text-xs" style={{ color: 'var(--subtle)' }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Trades / Holders */}
                <div className="overflow-hidden rounded-2xl" style={glass.card}>
                  <div className="flex border-b" style={{ borderColor: 'var(--border)' }}>
                    {(['trades', 'holders'] as TradeTab[]).map(t => (
                      <button key={t} onClick={() => setTab(t)}
                        className="flex-1 py-3 text-sm font-semibold capitalize transition-colors"
                        style={{ color: tab === t ? 'var(--ink)' : 'var(--subtle)', borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent' }}
                      >
                        {t === 'trades' ? 'Trades (' + trades.length + ')' : 'Holders (' + holders.length + ')'}
                      </button>
                    ))}
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {tab === 'trades' ? (
                      trades.length === 0 ? (
                        <p className="py-6 text-center text-sm" style={{ color: 'var(--subtle)' }}>No trades yet</p>
                      ) : (
                        <table className="w-full text-xs">
                          <thead>
                            <tr style={{ color: 'var(--subtle)' }}>
                              <th className="px-4 py-2 text-left">Side</th>
                              <th className="px-4 py-2 text-left">Trader</th>
                              <th className="px-4 py-2 text-right">USDC</th>
                              <th className="px-4 py-2 text-right">{token.symbol}</th>
                              <th className="px-4 py-2 text-right">Price</th>
                            </tr>
                          </thead>
                          <tbody>
                            {trades.map(tr => (
                              <tr key={tr.key} className="border-t" style={{ borderColor: 'var(--border)' }}>
                                <td className="px-4 py-2">
                                  <span className="font-semibold" style={{ color: tr.side === 'buy' ? 'var(--success)' : 'var(--danger)' }}>
                                    {tr.side === 'buy' ? <TrendingUp className="inline size-3" /> : <TrendingDown className="inline size-3" />} {tr.side}
                                  </span>
                                </td>
                                <td className="mono px-4 py-2" style={{ color: 'var(--muted)' }}>
                                  <a href={buildTxExplorerUrl(ACTIVE_CHAIN_ID, tr.txHash as `0x${string}`)} target="_blank" rel="noreferrer" className="hover:underline">
                                    {formatAddress(tr.trader)}
                                  </a>
                                </td>
                                <td className="px-4 py-2 text-right tabular-nums" style={{ color: 'var(--ink)' }}>{formatUsdc(tr.usdcAmount)}</td>
                                <td className="px-4 py-2 text-right tabular-nums" style={{ color: 'var(--ink)' }}>{formatTokenAmount(tr.tokenAmount)}</td>
                                <td className="px-4 py-2 text-right tabular-nums" style={{ color: 'var(--subtle)' }}>${tr.price.toExponential(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )
                    ) : (
                      holders.length === 0 ? (
                        <p className="py-6 text-center text-sm" style={{ color: 'var(--subtle)' }}>No holders yet</p>
                      ) : (
                        <table className="w-full text-xs">
                          <thead>
                            <tr style={{ color: 'var(--subtle)' }}>
                              <th className="px-4 py-2 text-left">#</th>
                              <th className="px-4 py-2 text-left">Holder</th>
                              <th className="px-4 py-2 text-right">{token.symbol}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {holders.map(([addr, bal], i) => (
                              <tr key={addr} className="border-t" style={{ borderColor: 'var(--border)' }}>
                                <td className="px-4 py-2" style={{ color: 'var(--subtle)' }}>{i + 1}</td>
                                <td className="px-4 py-2" style={{ color: 'var(--muted)' }}>
                                  <Users className="mr-1 inline size-3" />{formatAddress(addr)}
                                </td>
                                <td className="px-4 py-2 text-right tabular-nums" style={{ color: 'var(--ink)' }}>{formatTokenAmount(bal)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Trade panel */}
              <div>
                <div className="sticky top-4 rounded-3xl p-5" style={glass.card}>
                  <div className="mb-4 flex rounded-xl p-1" style={{ background: 'var(--surface-muted)' }}>
                    {(['buy', 'sell'] as TradeSide[]).map(s => (
                      <button key={s} onClick={() => { setSide(s); setAmount('') }}
                        className="flex-1 rounded-lg py-2 text-sm font-semibold capitalize transition-all"
                        style={{ background: side === s ? 'var(--surface-strong)' : 'transparent', color: side === s ? 'var(--ink)' : 'var(--subtle)', boxShadow: side === s ? '0 1px 4px rgba(0,0,0,0.25)' : 'none', border: side === s ? '1px solid var(--border-strong)' : '1px solid transparent' }}
                      >{s}</button>
                    ))}
                  </div>

                  <div className="mb-3 rounded-2xl p-4" style={glass.inner}>
                    <div className="mb-1 flex items-center justify-between text-xs" style={{ color: 'var(--subtle)' }}>
                      <span>Pay</span>
                      <span>{side === 'buy' ? formattedUsdcBalance + ' USDC' : formattedTokenBalance + ' ' + token.symbol}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <input
                        inputMode="decimal"
                        value={displayAmount}
                        onChange={e => { const v = e.target.value.replace(/[^0-9.]/g, ''); if (v === '' || /^\d*\.?\d*$/.test(v)) setAmount(v) }}
                        placeholder="0"
                        className="display w-full bg-transparent text-3xl font-bold tabular-nums outline-none placeholder:text-slate-200"
                        style={{ color: 'var(--ink)' }}
                      />
                      <span className="text-sm font-semibold" style={{ color: 'var(--subtle)' }}>{side === 'buy' ? 'USDC' : token.symbol}</span>
                    </div>
                  </div>

                  <div className="mb-4 flex gap-2">
                    {[25, 50, 75, 100].map(pct => (
                      <button key={pct} onClick={() => setQuick(pct)}
                        className="flex-1 rounded-xl py-1.5 text-xs font-semibold transition-all hover:scale-[1.03]"
                        style={{ background: 'var(--surface-muted)', color: 'var(--muted)' }}
                      >{pct === 100 ? 'Max' : pct + '%'}</button>
                    ))}
                  </div>

                  <div className="mb-4 space-y-1.5 text-xs" style={{ color: 'var(--muted)' }}>
                    <div className="flex justify-between"><span>Slippage</span><span className="font-medium" style={{ color: 'var(--ink)' }}>1%</span></div>
                    <div className="flex justify-between"><span>Protocol fee</span><span className="font-medium" style={{ color: 'var(--ink)' }}>1%</span></div>
                  </div>

                  <button
                    disabled={!address || isBusy || token.graduated}
                    onClick={handleTrade}
                    className="w-full rounded-2xl py-3.5 text-sm font-semibold text-white transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
                    style={{ background: side === 'buy' ? 'var(--accent)' : 'var(--danger)' }}
                  >
                    {token.graduated ? 'Trading closed — graduated'
                      : !address ? 'Connect wallet'
                      : wrongChain ? ('Switch to Arc ' + (IS_MAINNET ? 'Mainnet' : 'Testnet'))
                      : isBusy ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="size-4 animate-spin" />
                          {approvePending || approveConfirming ? 'Approving...' : tradePending ? 'Confirm in wallet...' : 'Confirming...'}
                        </span>
                      )
                      : needsApprove ? 'Approve USDC'
                      : (side === 'buy' ? 'Buy ' : 'Sell ') + token.symbol}
                  </button>

                  {tradeSuccess && tradeTx && (
                    <a href={buildTxExplorerUrl(ACTIVE_CHAIN_ID, tradeTx)} target="_blank" rel="noreferrer"
                      className="mt-2 flex items-center justify-center gap-1 text-xs" style={{ color: 'var(--success)' }}>
                      Confirmed <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-6 animate-spin" style={{ color: 'var(--muted)' }} />
          </div>
        )}
      </div>
    </div>
  )
}
