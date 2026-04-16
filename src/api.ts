import Anthropic from '@anthropic-ai/sdk'
import type { ProcessedResult } from './types'
import type { Lang } from './i18n'

const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
})

function extractMainContent(html: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  const remove = ['nav', 'footer', 'script', 'style', 'header', 'aside', '.sidebar', '.menu', '.nav']
  remove.forEach((sel) => {
    doc.querySelectorAll(sel).forEach((el) => el.remove())
  })

  const main =
    doc.querySelector('main') ||
    doc.querySelector('article') ||
    doc.querySelector('[class*="content"]') ||
    doc.querySelector('[class*="changelog"]') ||
    doc.body

  const text = main?.innerText || main?.textContent || ''
  return text.replace(/\s+/g, ' ').trim().slice(0, 8000)
}

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} ao buscar ${url}`)
  const html = await res.text()
  return extractMainContent(html)
}

export async function fetchLovable(): Promise<string> {
  return fetchPage('/proxy/lovable/changelog')
}

export async function fetchClaude(): Promise<string> {
  const [news, docs] = await Promise.all([
    fetchPage('/proxy/anthropic-news/news'),
    fetchPage('/proxy/anthropic-docs/en/release-notes/overview'),
  ])
  return `=== anthropic.com/news ===\n${news}\n\n=== release-notes ===\n${docs}`
}

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

export async function processWithAI(
  content: string,
  tool: 'Lovable' | 'Claude/Anthropic'
): Promise<ProcessedResult> {
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

// ── Translation — only text fields, fonte_url is preserved by the caller ──

interface TranslatablePayload {
  resumo_geral: string
  updates: Array<{
    titulo: string
    oque: string
    porque: string
    exemplo: string
    aviso: string | null
  }>
}

export async function translateResult(
  result: ProcessedResult,
  targetLang: Lang
): Promise<ProcessedResult> {
  const langName = targetLang === 'en' ? 'English' : 'European Portuguese'

  const payload: TranslatablePayload = {
    resumo_geral: result.resumo_geral,
    updates: result.updates.map((u) => ({
      titulo: u.titulo,
      oque: u.oque,
      porque: u.porque,
      exemplo: u.exemplo,
      aviso: u.aviso,
    })),
  }

  const message = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 2000,
    system: `You are a translator. Translate all string values in the JSON to ${langName}.
Return ONLY valid JSON with the exact same structure. No backticks, no markdown, no extra text.
Preserve null values as null. Keep brand names, proper nouns, and technical terms untranslated.`,
    messages: [
      {
        role: 'user',
        content: JSON.stringify(payload),
      },
    ],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''

  let translated: TranslatablePayload
  try {
    translated = JSON.parse(text)
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) translated = JSON.parse(match[0])
    else throw new Error('Resposta de tradução não é JSON válido')
  }

  // Reconstruct full result — merge translated text fields, preserve fonte_url
  return {
    resumo_geral: translated.resumo_geral,
    updates: result.updates.map((original, i) => ({
      ...original,
      ...translated.updates[i],
      fonte_url: original.fonte_url, // never translate URLs
    })),
  }
}
