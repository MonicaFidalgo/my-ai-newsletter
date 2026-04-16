export interface Update {
  titulo: string
  oque: string
  porque: string
  exemplo: string
  aviso: string | null
  fonte_url: string | null
}

export interface ProcessedResult {
  updates: Update[]
  resumo_geral: string
}

export interface PanelState {
  result: ProcessedResult | null
  lastUpdated: string | null
  loading: boolean
  error: string | null
}

export interface Session {
  id: string              // ISO timestamp
  date: string            // formatted for display, e.g. "16/04/2026, 10:00"
  language: 'pt' | 'en'
  result: ProcessedResult
}
