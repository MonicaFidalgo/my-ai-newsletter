import { useState } from 'react'
import type { Update } from '../types'
import { UI, type Lang } from '../i18n'

interface Props {
  update: Update
  index: number
  language: Lang
}

const CARD_STYLE: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  padding: '24px 28px',
  border: '1px solid #f0e4d8',
  boxShadow: '0 2px 12px rgba(180, 120, 80, 0.07)',
  marginBottom: '16px',
}

const LABEL_STYLE: React.CSSProperties = {
  display: 'block',
  fontSize: '10px',
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  color: '#e8785a',
  fontWeight: 600,
  marginBottom: '4px',
}

const BODY_TEXT_STYLE: React.CSSProperties = {
  fontSize: '14px',
  lineHeight: 1.65,
  color: '#3a2e28',
}

export function UpdateCard({ update, index, language }: Props) {
  const [copied, setCopied] = useState(false)
  const t = UI[language]

  function copyExample() {
    navigator.clipboard.writeText(update.exemplo).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const num = String(index + 1).padStart(2, '0')

  return (
    <article style={CARD_STYLE}>
      {/* Number */}
      <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#e8785a', opacity: 0.6, display: 'block', marginBottom: '6px', letterSpacing: '0.05em' }}>
        {num}
      </span>

      {/* Title */}
      <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', fontWeight: 700, color: '#1a1208', lineHeight: 1.3, marginBottom: '16px' }}>
        {update.titulo}
      </h3>

      {/* O que é */}
      <div>
        <span style={LABEL_STYLE}>{t.oque}</span>
        <p style={BODY_TEXT_STYLE}>{update.oque}</p>
      </div>

      {/* Porque importa */}
      <div style={{ marginTop: '16px' }}>
        <span style={LABEL_STYLE}>{t.porque}</span>
        <p style={BODY_TEXT_STYLE}>{update.porque}</p>
      </div>

      {/* Exemplo */}
      <div style={{ marginTop: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={LABEL_STYLE}>{t.exemplo}</span>
          <button
            onClick={copyExample}
            style={{
              fontSize: '10px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: copied ? '#3a2e28' : '#e8785a',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              fontWeight: 600,
              transition: 'color 0.15s',
            }}
          >
            {copied ? t.copiado : t.copiar}
          </button>
        </div>
        <div style={{
          backgroundColor: '#fdf4ee',
          borderLeft: '3px solid #e8785a',
          borderRadius: '0 8px 8px 0',
          padding: '12px 16px',
        }}>
          <p style={{ ...BODY_TEXT_STYLE, fontStyle: 'italic', color: '#3a2e28' }}>
            {update.exemplo}
          </p>
        </div>
      </div>

      {/* Aviso */}
      {update.aviso && (
        <div style={{
          marginTop: '16px',
          backgroundColor: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: '8px',
          padding: '10px 14px',
          display: 'flex',
          gap: '8px',
          alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: '14px', lineHeight: 1.65, flexShrink: 0 }}>⚠️</span>
          <p style={{ ...BODY_TEXT_STYLE, color: '#78530a' }}>{update.aviso}</p>
        </div>
      )}

      {/* Fonte */}
      {update.fonte_url && (
        <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #f5ece4' }}>
          <a
            href={update.fonte_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '12px',
              color: '#9a8070',
              textDecoration: 'none',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
          >
            {t.verFonte}
          </a>
        </div>
      )}
    </article>
  )
}
