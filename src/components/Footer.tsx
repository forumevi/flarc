import Logo from './Logo'

interface FooterProps {
  onNavigate: (page: string) => void
}

export default function Footer({ onNavigate }: FooterProps) {
  return (
    <footer style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)' }} className="mt-24">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <Logo size={32} showText />
            <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
              The first USDC-native meme token launchpad on Arc. Launch, trade, and graduate tokens with near-zero fees.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <a href="https://x.com/flarc_fun" target="_blank" rel="noopener noreferrer"
                className="p-2 rounded-lg transition-all hover:scale-105"
                style={{ background: 'var(--surface)', color: 'var(--muted)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a href="https://t.me/flarc_fun" target="_blank" rel="noopener noreferrer"
                className="p-2 rounded-lg transition-all hover:scale-105"
                style={{ background: 'var(--surface)', color: 'var(--muted)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.317 13.52 4.35 12.582c-.66-.206-.67-.66.138-.978l10.98-4.232c.549-.199 1.03.131.852.849z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-sm font-semibold mb-4" style={{ color: 'var(--ink)' }}>Platform</h4>
            <ul className="space-y-2">
              {[
                { label: 'Launches', page: 'home' },
                { label: 'How it works', page: 'how' },
              ].map(item => (
                <li key={item.page}>
                  <button
                    onClick={() => onNavigate(item.page)}
                    className="text-sm transition-colors hover:text-[var(--accent)]"
                    style={{ color: 'var(--muted)' }}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold mb-4" style={{ color: 'var(--ink)' }}>Legal</h4>
            <ul className="space-y-2">
              {[
                { label: 'Terms of Use', page: 'terms' },
                { label: 'Privacy Policy', page: 'privacy' },
              ].map(item => (
                <li key={item.page}>
                  <button
                    onClick={() => onNavigate(item.page)}
                    className="text-sm transition-colors hover:text-[var(--accent)]"
                    style={{ color: 'var(--muted)' }}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="p-4 rounded-xl mb-6" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--subtle)' }}>
            Flarc is a noncustodial software interface. Flarc does not hold your assets or keys, does not execute or reverse transactions, and is not a bank, broker, exchange, custodian, or investment adviser. Nothing on this site is financial, legal, or tax advice. Tokens are created by their respective creators, not by Flarc. They are highly volatile, may lose all value, and may have no liquidity. Listing or displaying a token is not an endorsement. You are solely responsible for your decisions, your wallet, and compliance with all applicable local laws. Not available in restricted regions.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <p className="text-xs" style={{ color: 'var(--subtle)' }}>
            © 2026 Flarc. Built on Arc — USDC as native gas.
          </p>
          <p className="text-xs" style={{ color: 'var(--subtle)' }}>
            Powered by{' '}
            <a href="https://arc.io" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--accent)] transition-colors">Arc</a>
            {' '}+{' '}
            <a href="https://circle.com" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--accent)] transition-colors">Circle USDC</a>
          </p>
        </div>
      </div>
    </footer>
  )
}
