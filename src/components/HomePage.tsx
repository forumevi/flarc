import { useState, useEffect, useCallback } from 'react'
import { useReadContract } from 'wagmi'
import { Rocket, TrendingUp, Clock, Zap, GraduationCap, Flame, ArrowRight } from 'lucide-react'
import { FLARE_ADDRESS, FLARE_ABI, ACTIVE_CHAIN_ID, type TokenInfo, graduationProgress, formatMarketCap, formatPrice } from '../contract'
import CreateTokenSheet from './CreateTokenSheet'

type Filter = 'all' | 'new' | 'active' | 'near' | 'graduated'

interface Props {
  onSelectToken: (id: bigint) => void
  openCreate?: boolean
  onCreateClose?: () => void
}

function TokenCard({ token, onClick, stats }: { token: TokenInfo; onClick: () => void; stats?: { trade_count: number } }) {
  const progress = graduationProgress(token)
  const mcapStr = formatMarketCap(token)
  const price = formatPrice(token)

  return (
    <button
      onClick={onClick}
      className="w-full p-4 text-left transition-all hover:scale-[1.01] active:scale-[0.99] card"
      style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
    >
      <div className="flex items-start gap-3">
        {/* Token image or initials */}
        {token.imageUrl ? (
          <img src={token.imageUrl} alt={token.symbol} className="size-14 flex-shrink-0 rounded-xl object-cover" style={{ border: '1px solid var(--border)' }} />
        ) : (
          <div
            className="flex size-14 flex-shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white"
            style={{ background: `hsl(${Number(token.id) * 67 % 360}, 60%, 45%)` }}
          >
            {token.symbol.slice(0, 2)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold truncate" style={{ color: 'var(--ink)' }}>{token.name}</span>
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded-md flex-shrink-0"
                  style={{ background: 'var(--surface)', color: 'var(--muted)' }}>{token.symbol}</span>
                {token.graduated && (
                  <span className="text-xs font-semibold px-1.5 py-0.5 rounded-md flex-shrink-0"
                    style={{ background: 'rgba(34,197,94,0.15)', color: 'var(--success)' }}>Graduated</span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-xs mono" style={{ color: 'var(--muted)' }}>{price}</span>
                {stats && stats.trade_count > 0 && (
                  <span className="text-xs" style={{ color: 'var(--subtle)' }}>{stats.trade_count} trades</span>
                )}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-sm font-bold tabular-nums gradient-text">{mcapStr}</div>
              <div className="text-xs" style={{ color: 'var(--subtle)' }}>mkt cap</div>
            </div>
          </div>

          {/* Bonding curve progress */}
          <div className="mt-3">
            <div className="h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--surface-muted)' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: progress + '%',
                  background: token.graduated
                    ? 'var(--success)'
                    : progress > 70
                    ? 'linear-gradient(90deg, #f59e0b, #f97316)'
                    : 'linear-gradient(90deg, #9b6dff, #7c4dff)',
                }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs" style={{ color: 'var(--subtle)' }}>
                {token.graduated ? 'Graduated' : progress.toFixed(1) + '% of 69K USDC'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </button>
  )
}

export default function HomePage({ onSelectToken, openCreate = false, onCreateClose }: Props) {
  const [createOpen, setCreateOpen] = useState(openCreate)
  const [filter, setFilter] = useState<Filter>('all')
  const [refresh, setRefresh] = useState(0)
  const [statsMap, setStatsMap] = useState<Record<number, { trade_count: number }>>({})
  const [trending, setTrending] = useState<number[]>([])

  // Sync external open state — derive directly, no effect needed
  const isCreateOpen = createOpen || openCreate

  const handleClose = () => {
    setCreateOpen(false)
    onCreateClose?.()
  }

  const { data: tokenCount, refetch: refetchCount } = useReadContract({
    address: FLARE_ADDRESS, abi: FLARE_ABI, functionName: 'getTokenCount', chainId: ACTIVE_CHAIN_ID,
  })

  const count = Number(tokenCount ?? 0n)
  const tokenIds = Array.from({ length: count }, (_, i) => i + 1)

  useEffect(() => {
    fetch('/api/trending').then(r => r.json()).then((data: { token_id: number }[]) => {
      setTrending(data.map(d => d.token_id))
    }).catch(() => {})
  }, [refresh])

  const fetchStats = useCallback(() => {
    tokenIds.forEach(id => {
      fetch('/api/stats/' + id).then(r => r.json()).then((data: { trade_count: number }) => {
        setStatsMap(prev => ({ ...prev, [id]: data }))
      }).catch(() => {})
    })
  }, [count]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchStats() }, [fetchStats, refresh])

  const filters: { id: Filter; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All', icon: <Zap className="size-3" /> },
    { id: 'new', label: 'New', icon: <Clock className="size-3" /> },
    { id: 'active', label: 'Active', icon: <TrendingUp className="size-3" /> },
    { id: 'near', label: 'Near grad', icon: <Rocket className="size-3" /> },
    { id: 'graduated', label: 'Graduated', icon: <GraduationCap className="size-3" /> },
  ]

  return (
    <div style={{ minHeight: '100dvh' }}>
      {/* Hero section */}
      <div className="relative overflow-hidden" style={{ background: 'var(--gradient-hero)' }}>
        {/* Ambient glow orbs */}
        <div style={{ position: 'absolute', top: '-10%', left: '20%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(155,109,255,0.15) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '10%', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,77,255,0.10) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }} />

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6 animate-slide-up"
            style={{ background: 'var(--accent-glow)', color: 'var(--accent)', border: '1px solid var(--border-strong)' }}>
            <Flame size={12} />
            Arc Testnet — USDC as native gas
          </div>

          <h1 className="display text-5xl md:text-6xl font-bold mb-5 animate-slide-up" style={{ animationDelay: '0.05s' }}>
            <span style={{ color: 'var(--ink)' }}>Launch your</span>
            <br />
            <span className="gradient-text">meme token</span>
          </h1>

          <p className="text-lg md:text-xl max-w-xl mx-auto mb-8 animate-slide-up" style={{ color: 'var(--muted)', animationDelay: '0.10s' }}>
            The first USDC-native launchpad on Arc. Bonding curve trading, near-zero fees, instant settlement.
          </p>

          <div className="flex items-center justify-center gap-3 flex-wrap animate-slide-up" style={{ animationDelay: '0.15s' }}>
            <button
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-white transition-all hover:scale-[1.03] active:scale-[0.98] glow-purple"
              style={{ background: 'linear-gradient(135deg, #9b6dff 0%, #7c4dff 100%)', fontSize: '0.95rem' }}
            >
              <Flame size={16} />
              Launch a token — 1 USDC
            </button>
            <button
              onClick={() => {}}
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl font-semibold transition-all hover:scale-[1.02]"
              style={{ background: 'var(--surface)', color: 'var(--ink-2)', border: '1px solid var(--border)', fontSize: '0.95rem' }}
            >
              How it works <ArrowRight size={14} />
            </button>
          </div>

          {/* Stats bar */}
          <div className="flex items-center justify-center gap-8 mt-12 flex-wrap animate-slide-up" style={{ animationDelay: '0.20s' }}>
            {[
              { label: 'Launch fee', value: '1 USDC' },
              { label: 'Platform fee', value: '1%' },
              { label: 'Graduation', value: '69K USDC' },
              { label: 'Gas token', value: 'USDC' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="display text-xl font-bold gradient-text">{s.value}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--subtle)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Token list */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Trending */}
        {trending.length > 0 && (
          <div className="mb-6">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>Trending 24h</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {trending.map(id => (
                <TrendingChip key={id} tokenId={BigInt(id)} onClick={() => onSelectToken(BigInt(id))} />
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className="flex flex-shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-all"
              style={{
                background: filter === f.id ? 'linear-gradient(135deg, #9b6dff, #7c4dff)' : 'var(--surface)',
                color: filter === f.id ? 'white' : 'var(--muted)',
                border: `1px solid ${filter === f.id ? 'transparent' : 'var(--border)'}`,
              }}
            >
              {f.icon}{f.label}
            </button>
          ))}
        </div>

        {/* Token cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {count === 0 && (
            <div className="md:col-span-2 card p-12 text-center">
              <Flame className="mx-auto mb-4 size-10" style={{ color: 'var(--accent)' }} />
              <p className="display text-xl font-bold mb-2" style={{ color: 'var(--ink)' }}>No tokens yet</p>
              <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>Be the first to launch a meme token on Arc</p>
              <button
                onClick={() => setCreateOpen(true)}
                className="px-7 py-3 rounded-2xl font-semibold text-white glow-purple"
                style={{ background: 'linear-gradient(135deg, #9b6dff, #7c4dff)' }}
              >
                Launch first token
              </button>
            </div>
          )}
          {tokenIds.map(i => (
            <TokenCardLoader key={i} tokenId={BigInt(i)} filter={filter} stats={statsMap[i]} onClick={() => onSelectToken(BigInt(i))} />
          ))}
        </div>
      </div>

      <CreateTokenSheet
        open={isCreateOpen}
        onClose={handleClose}
        onCreated={() => { void refetchCount(); setRefresh(r => r + 1) }}
      />
    </div>
  )
}

function TokenCardLoader({ tokenId, filter, stats, onClick }: {
  tokenId: bigint; filter: Filter; stats?: { trade_count: number }; onClick: () => void
}) {
  const { data } = useReadContract({
    address: FLARE_ADDRESS, abi: FLARE_ABI, functionName: 'getToken',
    args: [tokenId], chainId: ACTIVE_CHAIN_ID,
  })
  if (!data) return null
  const token = data as unknown as TokenInfo
  const progress = graduationProgress(token)
  if (filter === 'graduated' && !token.graduated) return null
  if (filter === 'near' && (progress < 50 || token.graduated)) return null
  if (filter === 'new' && stats && stats.trade_count > 20) return null
  if (filter === 'active' && (!stats || stats.trade_count < 5)) return null
  return <TokenCard token={token} onClick={onClick} stats={stats} />
}

function TrendingChip({ tokenId, onClick }: { tokenId: bigint; onClick: () => void }) {
  const { data } = useReadContract({
    address: FLARE_ADDRESS, abi: FLARE_ABI, functionName: 'getToken',
    args: [tokenId], chainId: ACTIVE_CHAIN_ID,
  })
  if (!data) return null
  const token = data as unknown as TokenInfo
  return (
    <button
      onClick={onClick}
      className="flex flex-shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all hover:scale-[1.03]"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--ink)' }}
    >
      {token.imageUrl ? (
        <img src={token.imageUrl} alt="" className="size-5 rounded-md object-cover" />
      ) : (
        <div className="size-5 rounded-md text-center text-[9px] font-bold leading-5 text-white"
          style={{ background: `hsl(${Number(token.id) * 67 % 360}, 60%, 45%)` }}>
          {token.symbol.slice(0, 1)}
        </div>
      )}
      {token.symbol}
      <TrendingUp className="size-3" style={{ color: 'var(--success)' }} />
    </button>
  )
}
