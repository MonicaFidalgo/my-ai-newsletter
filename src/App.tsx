import { useCallback, useState } from 'react'
import { usePanel } from './usePanel'
import { Panel } from './components/Panel'
import { fetchLovable, fetchClaude, processWithAI } from './api'
import { UI, type Lang } from './i18n'

type Tab = 'lovable' | 'claude'

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('lovable')
  const [language, setLanguage] = useState<Lang>('pt')

  const t = UI[language]

  const lovableFetcher = useCallback(() => fetchLovable(), [])
  const lovableProcessor = useCallback(
    (content: string) => processWithAI(content, 'Lovable'),
    []
  )
  const claudeFetcher = useCallback(() => fetchClaude(), [])
  const claudeProcessor = useCallback(
    (content: string) => processWithAI(content, 'Claude/Anthropic'),
    []
  )

  const lovable = usePanel('lovable', language, lovableFetcher, lovableProcessor)
  const claude = usePanel('claude', language, claudeFetcher, claudeProcessor)

  async function refreshAll() {
    await Promise.all([lovable.refresh(), claude.refresh()])
  }

  const isLoading = lovable.state.loading || claude.state.loading

  const tabs = [
    { id: 'lovable' as Tab, label: 'Lovable', state: lovable.state },
    { id: 'claude' as Tab, label: 'Claude / Anthropic', state: claude.state },
  ]

  function toggleLanguage(lang: Lang) {
    setLanguage(lang)
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fdf6f0' }}>
      <div style={{ maxWidth: '896px', margin: '0 auto', padding: '48px 32px 64px' }}>

        {/* ── Header ── */}
        <header style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', marginBottom: '40px' }}>
          <div>
            <p style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#b09080', marginBottom: '8px' }}>
              {t.privado}
            </p>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '48px', fontWeight: 700, color: '#1a1208', lineHeight: 1, letterSpacing: '-0.5px' }}>
              backstage
            </h1>
            <p style={{ fontSize: '13px', color: '#7a6558', marginTop: '6px', fontWeight: 300 }}>
              {t.subtitulo}
            </p>
          </div>

          {/* Right side: language toggle + refresh all */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: '4px' }}>
            {/* PT / EN toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px', border: '1px solid #e8d5c8', borderRadius: '8px', padding: '2px', backgroundColor: 'white' }}>
              {(['pt', 'en'] as Lang[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => toggleLanguage(lang)}
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s, color 0.15s',
                    backgroundColor: language === lang ? '#e8785a' : 'transparent',
                    color: language === lang ? 'white' : '#9a8070',
                  }}
                >
                  {lang}
                </button>
              ))}
            </div>

            {/* Refresh all */}
            <button
              onClick={refreshAll}
              disabled={isLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                color: '#7a6558',
                background: 'none',
                border: 'none',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.6 : 1,
                padding: 0,
                transition: 'color 0.2s',
                flexShrink: 0,
              }}
              onMouseEnter={e => { if (!isLoading) (e.currentTarget as HTMLButtonElement).style.color = '#e8785a' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#7a6558' }}
            >
              <svg
                style={{ width: '14px', height: '14px', animation: isLoading ? 'spin 1s linear infinite' : 'none', flexShrink: 0 }}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {isLoading ? t.aActualizar : t.actualizarTudo}
            </button>
          </div>
        </header>

        {/* ── Tabs ── */}
        <div style={{ borderBottom: '1px solid #e8d5c8', width: '100%', marginBottom: '32px' }}>
          <div style={{ display: 'flex', gap: '32px' }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  position: 'relative',
                  paddingBottom: '14px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: activeTab === tab.id ? '#1a1208' : '#b09080',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'color 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {tab.label}
                {tab.state.loading && (
                  <span style={{ display: 'inline-block', width: '6px', height: '6px', backgroundColor: '#e8785a', borderRadius: '50%', animation: 'pulse 1.5s ease-in-out infinite' }} />
                )}
                {activeTab === tab.id && (
                  <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', backgroundColor: '#e8785a', borderRadius: '2px' }} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Active panel ── */}
        <div style={{ marginTop: '32px' }}>
          {activeTab === 'lovable' ? (
            <Panel
              name="Lovable"
              state={lovable.state}
              language={language}
              onRefresh={lovable.refresh}
              sessions={lovable.sessions}
              viewingSession={lovable.viewingSession}
              onLoadSession={lovable.loadSession}
              onClearSessionView={lovable.clearSessionView}
            />
          ) : (
            <Panel
              name="Claude / Anthropic"
              state={claude.state}
              language={language}
              onRefresh={claude.refresh}
              sessions={claude.sessions}
              viewingSession={claude.viewingSession}
              onLoadSession={claude.loadSession}
              onClearSessionView={claude.clearSessionView}
            />
          )}
        </div>
      </div>

      <footer style={{ textAlign: 'center', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#c8b0a0', paddingBottom: '48px' }}>
        {t.guardado}
      </footer>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes shimmer { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
      `}</style>
    </div>
  )
}

export default App
