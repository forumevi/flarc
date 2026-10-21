import { useState } from 'react'
import { Sun, Moon, Menu, X } from 'lucide-react'
import { ConnectKitButton } from 'connectkit'
import Logo from './Logo'
import { useTheme } from './ThemeProvider'

interface NavbarProps {
  onCreateClick: () => void
  currentPage: string
  onNavigate: (page: string) => void
}

export default function Navbar({ onCreateClick, currentPage, onNavigate }: NavbarProps) {
  const { theme, toggle } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navLinks = [
    { id: 'home', label: 'Launches' },
    { id: 'how', label: 'How it works' },
  ]

  return (
    <header style={{ borderBottom: '1px solid var(--border)', background: 'rgba(10,8,18,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }} className="sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <button onClick={() => onNavigate('home')} className="flex-shrink-0">
          <Logo size={34} showText />
        </button>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(link => (
            <button
              key={link.id}
              onClick={() => onNavigate(link.id)}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                color: currentPage === link.id ? 'var(--accent)' : 'var(--muted)',
                background: currentPage === link.id ? 'var(--accent-glow)' : 'transparent',
              }}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={toggle}
            className="p-2 rounded-xl transition-all"
            style={{ color: 'var(--muted)', background: 'var(--surface)' }}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Launch button */}
          <button
            onClick={onCreateClick}
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all glow-purple"
            style={{
              background: 'linear-gradient(135deg, #9b6dff, #7c4dff)',
              color: 'white',
            }}
          >
            Launch token
          </button>

          {/* Wallet */}
          <ConnectKitButton />

          {/* Mobile menu */}
          <button
            className="md:hidden p-2 rounded-xl"
            style={{ color: 'var(--muted)', background: 'var(--surface)' }}
            onClick={() => setMobileOpen(o => !o)}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden px-4 pb-4 flex flex-col gap-2" style={{ borderTop: '1px solid var(--border)' }}>
          {navLinks.map(link => (
            <button
              key={link.id}
              onClick={() => { onNavigate(link.id); setMobileOpen(false) }}
              className="px-4 py-3 rounded-xl text-sm font-medium text-left transition-all"
              style={{ color: currentPage === link.id ? 'var(--accent)' : 'var(--muted)', background: currentPage === link.id ? 'var(--accent-glow)' : 'var(--surface)' }}
            >
              {link.label}
            </button>
          ))}
          <button
            onClick={() => { onCreateClick(); setMobileOpen(false) }}
            className="px-4 py-3 rounded-xl text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg, #9b6dff, #7c4dff)', color: 'white' }}
          >
            Launch token
          </button>
        </div>
      )}
    </header>
  )
}
