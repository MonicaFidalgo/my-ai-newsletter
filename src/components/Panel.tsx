import { useState, useRef, useEffect } from 'react'
import type { PanelState, Session } from '../types'
import { UI, type Lang } from '../i18n'
import { UpdateCard } from './UpdateCard'
import { SkeletonCard } from './SkeletonCard'

interface Props {
  name: string
  state: PanelState
  language: Lang
  onRefresh: () => void
  sessions: Session[]
  viewingSession: Session | null
  onLoadSession: (s: Session) => void
  onClearSessionView: () => void
}

function formatTimestamp(iso: string | null, lang: Lang): string {
  if (!iso) return lang === 'pt' ? 'nunca actualizado' : 'never updated'
  const d = new Date(iso)
  const formatted = d.toLocaleString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  return `${formatted} · ${lang.toUpperCase()}`
}

function generateDraft(name: string, state: PanelState): string {
  if (!state.result) return ''
  const lines: string[] = [`## ${name}\n`, `${state.result.resumo_geral}\n`]
  state.result.updates.forEach((u) => {
    lines.push(`### ${u.titulo}`)
    lines.push(u.oque)
    lines.push(`\n**Porque importa:** ${u.porque}`)
    lines.push(`\n**Exemplo:** ${u.exemplo}`)
    if (u.aviso) lines.push(`\n> ⚠️ ${u.aviso}`)
    if (u.fonte_url) lines.push(`\n${u.fonte_url}`)
    lines.push('')
  })
  return lines.join('\n')
}

export function Panel({
  name, state, language, onRefresh,
  sessions, viewingSession, onLoadSession, onClearSessionView,
}: Props) {
  const [draftCopied, setDraftCopied] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const historyRef = useRef<HTMLDivElement>(null)
  const t = UI[language]

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!showHistory) return
    function handleClick(e: MouseEvent) {
      if (historyRef.current && !historyRef.current.contains(e.target as Node)) {
        setShowHistory(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showHistory])

  function copyDraft() {
    const text = generateDraft(name, state)
    navigator.clipboard.writeText(text).then(() => {
      setDraftCopied(true)
      setTimeout(() => setDraftCopied(false), 2500)
    })
  }

  return (
    <div>
      {/* ── Top bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: sessions.length > 0 ? '6px' : '24px' }}>
        <span style={{ fontSize: '12px', color: '#b09080' }}>
          {state.loading ? t.aActualizar : formatTimestamp(state.lastUpdated, language)}
        </span>
        <button
          onClick={onRefresh}
          disabled={state.loading}
          style={{
            fontSize: '12px',
            color: '#7a6558',
            backgroundColor: 'transparent',
            border: '1px solid #e8d5c8',
            borderRadius: '20px',
            padding: '6px 16px',
            cursor: state.loading ? 'not-allowed' : 'pointer',
            opacity: state.loading ? 0.5 : 1,
            transition: 'border-color 0.2s, color 0.2s',
          }}
          onMouseEnter={e => { if (!state.loading) { (e.currentTarget as HTMLButtonElement).style.borderColor = '#e8785a'; (e.currentTarget as HTMLButtonElement).style.color = '#e8785a' } }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#e8d5c8'; (e.currentTarget as HTMLButtonElement).style.color = '#7a6558' }}
        >
          {state.loading ? t.aBuscar : t.actualizar}
        </button>
      </div>

      {/* ── History button + dropdown ── */}
      {sessions.length > 0 && (
        <div ref={historyRef} style={{ marginBottom: '20px', position: 'relative' }}>
          <button
            onClick={() => setShowHistory((v) => !v)}
            style={{
              fontSize: '12px',
              color: '#9a8070',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              textDecoration: showHistory ? 'underline' : 'none',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#e8785a')}
            onMouseLeave={e => (e.currentTarget.style.color = '#9a8070')}
          >
            {t.historico} ({sessions.length})
          </button>

          {showHistory && (
            <div style={{
              marginTop: '6px',
              border: '1px solid #f0e4d8',
              borderRadius: '8px',
              backgroundColor: 'white',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(180,120,80,0.08)',
            }}>
              {sessions.map((s) => {
                const isActive = viewingSession?.id === s.id
                return (
                  <button
                    key={s.id}
                    onClick={() => { onLoadSession(s); setShowHistory(false) }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      textAlign: 'left',
                      padding: '9px 14px',
                      fontSize: '13px',
                      color: isActive ? '#e8785a' : '#3a2e28',
                      backgroundColor: isActive ? '#fff8f4' : 'transparent',
                      border: 'none',
                      borderBottom: '1px solid #f8ede4',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s',
                    }}
                    onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#fdf6f0' }}
                    onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent' }}
                  >
                    <span>{s.date}</span>
                    <span style={{ fontSize: '11px', color: '#b09080', letterSpacing: '0.06em' }}>
                      · {s.language.toUpperCase()}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Viewing-session banner ── */}
      {viewingSession && (
        <div style={{
          backgroundColor: '#fff8f4',
          border: '1px solid #f0e4d8',
          borderRadius: '8px',
          padding: '10px 16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          fontSize: '13px',
          color: '#7a6558',
        }}>
          <span>
            {t.aVerSessaoDe} <strong style={{ color: '#3a2e28', fontWeight: 500 }}>{viewingSession.date}</strong>
            {' '}<span style={{ color: '#b09080', fontSize: '11px', letterSpacing: '0.06em' }}>· {viewingSession.language.toUpperCase()}</span>
          </span>
          <button
            onClick={onClearSessionView}
            style={{
              fontSize: '12px',
              color: '#e8785a',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
            onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
          >
            {t.voltarActual}
          </button>
        </div>
      )}

      {/* ── Resumo geral ── */}
      {state.result && !state.loading && (
        <div style={{
          backgroundColor: '#fff8f4',
          borderLeft: '4px solid #e8785a',
          borderRadius: '8px',
          padding: '16px 20px',
          marginBottom: '24px',
        }}>
          <p style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '17px',
            fontStyle: 'italic',
            color: '#3a2e28',
            lineHeight: 1.6,
          }}>
            {state.result.resumo_geral}
          </p>
        </div>
      )}

      {/* ── Error ── */}
      {state.error && (
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px', fontSize: '14px', color: '#b91c1c' }}>
          <strong>{t.erro}:</strong> {state.error}
        </div>
      )}

      {/* ── Loading skeletons ── */}
      {state.loading && (
        <div>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {/* ── Cards ── */}
      {!state.loading && state.result && (
        <div>
          {state.result.updates.map((u, i) => (
            <UpdateCard key={i} update={u} index={i} language={language} />
          ))}
        </div>
      )}

      {/* ── Empty state ── */}
      {!state.loading && !state.result && !state.error && (
        <div style={{ textAlign: 'center', padding: '80px 0', userSelect: 'none' }}>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '32px', fontStyle: 'italic', color: '#d4c0b4', marginBottom: '12px' }}>
            {t.nadaAinda}
          </p>
          <p style={{ fontSize: '13px', color: '#b09080' }}>{t.instrucao}</p>
        </div>
      )}

      {/* ── Copy draft ── */}
      {state.result && !state.loading && (
        <button
          onClick={copyDraft}
          style={{
            width: '100%',
            backgroundColor: draftCopied ? '#e8785a' : 'white',
            color: draftCopied ? 'white' : '#3a2e28',
            border: `1.5px solid ${draftCopied ? '#e8785a' : '#e8d8cc'}`,
            borderRadius: '10px',
            padding: '14px',
            marginTop: '24px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background-color 0.2s, color 0.2s, border-color 0.2s',
            letterSpacing: '0.02em',
          }}
          onMouseEnter={e => { if (!draftCopied) { (e.currentTarget as HTMLButtonElement).style.borderColor = '#e8785a'; (e.currentTarget as HTMLButtonElement).style.color = '#e8785a' } }}
          onMouseLeave={e => { if (!draftCopied) { (e.currentTarget as HTMLButtonElement).style.borderColor = '#e8d8cc'; (e.currentTarget as HTMLButtonElement).style.color = '#3a2e28' } }}
        >
          {draftCopied ? t.rascunhoCopiado : t.copiarRascunho}
        </button>
      )}
    </div>
  )
}
