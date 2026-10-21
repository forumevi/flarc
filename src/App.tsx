import { useState } from 'react'
import { ThemeProvider } from './components/ThemeProvider'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import HomePage from './components/HomePage'
import TokenPage from './components/TokenPage'
import HowItWorksPage from './pages/HowItWorksPage'
import TermsPage from './pages/TermsPage'
import PrivacyPage from './pages/PrivacyPage'

type Page = 'home' | 'how' | 'terms' | 'privacy'

export default function App() {
  const [selectedToken, setSelectedToken] = useState<bigint | null>(null)
  const [page, setPage] = useState<Page>('home')
  const [showCreate, setShowCreate] = useState(false)

  const handleNavigate = (p: string) => {
    setSelectedToken(null)
    setPage(p as Page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Token detail view
  if (selectedToken !== null) {
    return (
      <ThemeProvider>
        <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
          <Navbar onCreateClick={() => setShowCreate(true)} currentPage="home" onNavigate={handleNavigate} />
          <TokenPage tokenId={selectedToken} onBack={() => setSelectedToken(null)} />
          <Footer onNavigate={handleNavigate} />
        </div>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider>
      <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
        <Navbar
          onCreateClick={() => { setPage('home'); setShowCreate(true) }}
          currentPage={page}
          onNavigate={handleNavigate}
        />

        <main>
          {page === 'home' && (
            <HomePage
              onSelectToken={(id) => setSelectedToken(id)}
              openCreate={showCreate}
              onCreateClose={() => setShowCreate(false)}
            />
          )}
          {page === 'how' && <HowItWorksPage />}
          {page === 'terms' && <TermsPage />}
          {page === 'privacy' && <PrivacyPage />}
        </main>

        <Footer onNavigate={handleNavigate} />
      </div>
    </ThemeProvider>
  )
}
