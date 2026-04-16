import type { Session, ProcessedResult } from '../../../src/types'

interface Env {
  SESSIONS_KV: KVNamespace
}

const MAX_SESSIONS = 20

function isSameDay(isoA: string, isoB: string): boolean {
  return isoA.slice(0, 10) === isoB.slice(0, 10)
}

function applyDedup(existing: Session[], newSession: Session): Session[] {
  const sameDayIdx = existing.findIndex((s) => isSameDay(s.id, newSession.id))
  return sameDayIdx >= 0
    ? [newSession, ...existing.filter((_, i) => i !== sameDayIdx)]
    : [newSession, ...existing]
}

export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  const tool = params.tool as string
  const raw = await env.SESSIONS_KV.get(`sessions:${tool}`)
  return Response.json(raw ? JSON.parse(raw) : [])
}

export const onRequestPost: PagesFunction<Env> = async ({ request, params, env }) => {
  const tool = params.tool as string
  const session = await request.json() as Session
  const raw = await env.SESSIONS_KV.get(`sessions:${tool}`)
  const existing: Session[] = raw ? JSON.parse(raw) : []
  const updated = applyDedup(existing, session).slice(0, MAX_SESSIONS)
  await env.SESSIONS_KV.put(`sessions:${tool}`, JSON.stringify(updated))
  return Response.json(updated)
}
