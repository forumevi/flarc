import { Flame, TrendingUp, Zap, Shield, Coins, ArrowRight } from 'lucide-react'

const steps = [
  {
    icon: Flame,
    title: 'Launch your token',
    description: 'Pay 1 USDC to create your meme token. Set a name, ticker, image, and description. Your token is live on Arc in seconds.',
    color: '#9b6dff',
  },
  {
    icon: TrendingUp,
    title: 'Bonding curve trading',
    description: 'Every token starts on a bonding curve. The price automatically rises as more people buy. Early buyers get the lowest price.',
    color: '#7c4dff',
  },
  {
    icon: Zap,
    title: 'Near-zero fees',
    description: "Arc uses USDC as native gas. Transactions cost fractions of a cent. No ETH, no SOL — just USDC.",
    color: '#a855f7',
  },
  {
    icon: Shield,
    title: 'Noncustodial',
    description: 'You always control your wallet and assets. Flarc is a pure interface — no keys, no accounts, no custody.',
    color: '#9b6dff',
  },
  {
    icon: Coins,
    title: 'Graduation',
    description: 'When a token collects 69,000 USDC on the bonding curve, it graduates. Holders can claim their pro-rata USDC share.',
    color: '#7c4dff',
  },
]

export default function HowItWorksPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 animate-slide-up">
      {/* Hero */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-6"
          style={{ background: 'var(--accent-glow)', color: 'var(--accent)', border: '1px solid var(--border-strong)' }}>
          <Flame size={12} />
          How Flarc works
        </div>
        <h1 className="display text-4xl md:text-5xl font-bold mb-4" style={{ color: 'var(--ink)' }}>
          Launch. Trade. Graduate.
        </h1>
        <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--muted)' }}>
          Flarc is the first USDC-native meme token launchpad on Arc. Powered by bonding curves, secured by smart contracts, open to everyone.
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-4 mb-16">
        {steps.map((step, i) => (
          <div key={i} className="card p-6 flex gap-5 items-start transition-all hover:scale-[1.01]">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: `${step.color}20`, border: `1px solid ${step.color}40` }}>
              <step.icon size={22} style={{ color: step.color }} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--surface)', color: 'var(--muted)' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="display text-base font-semibold" style={{ color: 'var(--ink)' }}>{step.title}</h3>
              </div>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Bonding curve explanation */}
      <div className="card p-8 mb-8">
        <h2 className="display text-2xl font-bold mb-4" style={{ color: 'var(--ink)' }}>What is a bonding curve?</h2>
        <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--muted)' }}>
          A bonding curve is a mathematical formula that determines token price based on supply. As more tokens are purchased, the price increases automatically. When tokens are sold, the price decreases.
        </p>
        <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--muted)' }}>
          This means early buyers pay less, and the curve provides instant liquidity without needing a traditional order book or market maker.
        </p>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Starting price', value: '~$0.000001', desc: 'Per token at launch' },
            { label: 'Supply', value: '1,000,000,000', desc: 'Fixed 1B tokens' },
            { label: 'Graduation', value: '69,000 USDC', desc: 'Total collected' },
          ].map((stat, i) => (
            <div key={i} className="text-center p-4 rounded-xl" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}>
              <div className="display text-lg font-bold mb-1 gradient-text">{stat.value}</div>
              <div className="text-xs font-medium mb-0.5" style={{ color: 'var(--ink)' }}>{stat.label}</div>
              <div className="text-xs" style={{ color: 'var(--subtle)' }}>{stat.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>Ready to launch your token?</p>
        <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm glow-purple"
          style={{ background: 'linear-gradient(135deg, #9b6dff, #7c4dff)', color: 'white' }}>
          It costs 1 USDC <ArrowRight size={14} />
        </div>
      </div>
    </div>
  )
}
