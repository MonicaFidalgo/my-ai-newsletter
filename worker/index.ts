import Anthropic from '@anthropic-ai/sdk'
import type { ProcessedResult, Session } from '../src/types'

interface Env {
  SESSIONS_KV: KVNamespace
  ANTHROPIC_API_KEY: string
}

const MAX_SESSIONS = 20

const SYSTEM_PROMPT = `És uma assistente editorial que extrai e resume updates de ferramentas de desenvolvimento.
Respondes APENAS com JSON válido, sem backticks, sem markdown, sem texto extra antes ou depois.
O JSON deve seguir exatamente este schema:
{
  "updates": [
    {
      "titulo": "string",
      "oque": "string — o que é, em 1-2 frases simples",
      "porque": "string — porque importa na prática",
      "exemplo": "string — exemplo concreto de uso",
      "aviso": "string | null — limitação ou catch importante, null se não houver",
      "fonte_url": "string | null — URL mais relevante para este update (página do changelog, post, docs), null se não encontrares"
    }
  ],
  "resumo_geral": "string — 1 frase sobre o estado geral desta ferramenta"
}
Tom: português europeu informal, perspetiva de uma frontend dev que usa as ferramentas no dia a dia.
Sem marketing fluff. Máximo 4 updates. Foca nos mais recentes e relevantes.`

function extractText(html: string): string {
  // Strip HTML tags and normalize whitespace — no DOM available in Worker
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 8000)
}

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  if (!res.ok) throw new Error(`HTTP ${res.status} ao buscar ${url}`)
  const html = await res.text()
  return extractText(html)
}

async function processWithAI(content: string, tool: string, apiKey: string): Promise<ProcessedResult> {
  const client = new Anthropic({ apiKey })
  const message = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Aqui está o conteúdo mais recente de ${tool}. Extrai e processa os updates mais relevantes:\n\n${content}`,
      },
    ],
  })
  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  try {
    return JSON.parse(text) as ProcessedResult
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0]) as ProcessedResult
    throw new Error('Resposta da API não é JSON válido')
  }
}

function isSameDay(isoA: string, isoB: string): boolean {
  return isoA.slice(0, 10) === isoB.slice(0, 10)
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function refreshTool(
  toolKey: string,
  toolLabel: string,
  content: string,
  env: Env
): Promise<void> {
  const result = await processWithAI(content, toolLabel, env.ANTHROPIC_API_KEY)
  const id = new Date().toISOString()
  const newSession: Session = { id, date: formatDate(id), language: 'pt', result }

  const raw = await env.SESSIONS_KV.get(`sessions:${toolKey}`)
  const existing: Session[] = raw ? JSON.parse(raw) : []

  const sameDayIdx = existing.findIndex((s) => isSameDay(s.id, id))
  const updated = sameDayIdx >= 0
    ? [newSession, ...existing.filter((_, i) => i !== sameDayIdx)]
    : [newSession, ...existing]

  await env.SESSIONS_KV.put(`sessions:${toolKey}`, JSON.stringify(updated.slice(0, MAX_SESSIONS)))
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext): Promise<void> {
    const [lovableContent, anthropicNews, anthropicDocs] = await Promise.all([
      fetchPage('https://docs.lovable.dev/changelog'),
      fetchPage('https://www.anthropic.com/news'),
      fetchPage('https://docs.anthropic.com/en/release-notes/overview'),
    ])

    const claudeContent = `=== anthropic.com/news ===\n${anthropicNews}\n\n=== release-notes ===\n${anthropicDocs}`

    await Promise.all([
      refreshTool('lovable', 'Lovable', lovableContent, env),
      refreshTool('claude', 'Claude/Anthropic', claudeContent, env),
    ])
  },
}
