import { useState, useCallback, useEffect, useRef } from 'react'
import type { PanelState, ProcessedResult, Session } from './types'
import { translateResult } from './api'
import { loadSessions, pushSession } from './sessions'
import type { Lang } from './i18n'

const STORAGE_KEY_PREFIX = 'backstage_v2_'

interface StoredData {
  resultPT: ProcessedResult
  resultEN: ProcessedResult | null
  lastUpdated: string
}

function loadFromStorage(key: string): Partial<StoredData> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + key)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function patchStorage(key: string, patch: Partial<StoredData>) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + key)
    const existing: Partial<StoredData> = raw ? JSON.parse(raw) : {}
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify({ ...existing, ...patch }))
  } catch {
    // ignore
  }
}

export function usePanel(
  storageKey: string,
  language: Lang,
  fetcher: () => Promise<string>,
  processor: (content: string) => Promise<ProcessedResult>
) {
  const saved = loadFromStorage(storageKey)

  const [resultPT, setResultPT] = useState<ProcessedResult | null>(saved.resultPT ?? null)
  const [resultEN, setResultEN] = useState<ProcessedResult | null>(saved.resultEN ?? null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(saved.lastUpdated ?? null)
  const [loading, setLoading] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isTranslatingRef = useRef(false)

  // ── History ──
  const [sessions, setSessions] = useState<Session[]>(() => loadSessions(storageKey))
  const [viewingSession, setViewingSession] = useState<Session | null>(null)

  // Auto-translate to EN when language switches and EN cache is empty
  useEffect(() => {
    if (language !== 'en' || !resultPT || resultEN !== null || isTranslatingRef.current) return

    isTranslatingRef.current = true
    setTranslating(true)
    setError(null)

    translateResult(resultPT, 'en')
      .then((translated) => {
        setResultEN(translated)
        patchStorage(storageKey, { resultEN: translated })
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Erro ao traduzir')
      })
      .finally(() => {
        isTranslatingRef.current = false
        setTranslating(false)
      })
  }, [language, resultPT, resultEN, storageKey])

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    setViewingSession(null) // exit history view on refresh
    try {
      const content = await fetcher()
      const result = await processor(content)
      const ts = new Date().toISOString()
      setResultPT(result)
      setResultEN(null) // clear EN cache — will re-translate on demand
      setLastUpdated(ts)
      patchStorage(storageKey, { resultPT: result, resultEN: null, lastUpdated: ts })
      // Save to history
      const updated = pushSession(storageKey, result, 'pt')
      setSessions(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [fetcher, processor, storageKey])

  const loadSession = useCallback((session: Session) => {
    setViewingSession(session)
  }, [])

  const clearSessionView = useCallback(() => {
    setViewingSession(null)
  }, [])

  // When on EN tab and EN is not ready yet, show PT as fallback (no flash)
  const currentResult = language === 'en' ? (resultEN ?? resultPT) : resultPT
  // History overrides current result when viewing a past session
  const displayResult = viewingSession?.result ?? currentResult

  const state: PanelState = {
    result: displayResult,
    lastUpdated,
    loading: loading || translating,
    error,
  }

  return { state, refresh, sessions, viewingSession, loadSession, clearSessionView }
}
