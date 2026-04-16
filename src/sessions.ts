import type { Session, ProcessedResult } from './types'
import type { Lang } from './i18n'

const STORAGE_KEY_PREFIX = 'backstage_v2_sessions_'
const MAX_SESSIONS = 20

export function loadSessions(toolKey: string): Session[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + toolKey)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveSessions(toolKey: string, sessions: Session[]) {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + toolKey, JSON.stringify(sessions))
  } catch {
    // ignore storage errors
  }
}

function isSameDay(isoA: string, isoB: string): boolean {
  return isoA.slice(0, 10) === isoB.slice(0, 10)
}

export function formatSessionDate(iso: string): string {
  return new Date(iso).toLocaleString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Add or replace a session (same-day dedup), enforce max 20, return updated list. */
export function pushSession(
  toolKey: string,
  result: ProcessedResult,
  language: Lang
): Session[] {
  const existing = loadSessions(toolKey)
  const id = new Date().toISOString()
  const newSession: Session = { id, date: formatSessionDate(id), language, result }

  // Replace same-day session if it exists, otherwise prepend
  const sameDayIdx = existing.findIndex((s) => isSameDay(s.id, id))
  const updated = sameDayIdx >= 0
    ? [newSession, ...existing.filter((_, i) => i !== sameDayIdx)]
    : [newSession, ...existing]

  const trimmed = updated.slice(0, MAX_SESSIONS)
  saveSessions(toolKey, trimmed)
  return trimmed
}
