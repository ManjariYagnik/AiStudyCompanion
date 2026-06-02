// Client for the Python FastAPI RAG backend.
// Override the base URL with NEXT_PUBLIC_API_URL (defaults to local dev backend).

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:8000'

export type DocumentStatus = 'processing' | 'indexed' | 'failed'

export interface StudyDocument {
  id: string
  name: string
  size: string
  status: DocumentStatus
  chunks: number
  pages: number
  createdAt: string
  error?: string
}

export interface Citation {
  file: string
  page: number
  snippet: string
}

export interface AskResponse {
  answer: string
  citations: Citation[]
}

export interface HealthResponse {
  ok: boolean
  provider: string
  model: string
  xaiKeyConfigured: boolean
}

export interface KeyConcept {
  term: string
  definition: string
}

export interface DocumentSummary {
  title: string
  source: string
  bulletPoints: string[]
  keyConcepts: KeyConcept[]
  importantTakeaways: string[]
}

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface QuizQuestion {
  question: string
  options: string[]
  correct: number
  explanation: string
}

export interface Quiz {
  questions: QuizQuestion[]
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json()
    if (typeof data?.detail === 'string') return data.detail
    if (Array.isArray(data?.detail)) return data.detail.map((d: any) => d.msg).join(', ')
  } catch {
    /* fall through */
  }
  return `Request failed (${res.status})`
}

export async function getHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE}/api/health`)
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function listDocuments(): Promise<StudyDocument[]> {
  const res = await fetch(`${API_BASE}/api/documents`, { cache: 'no-store' })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function uploadDocument(file: File): Promise<StudyDocument> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${API_BASE}/api/documents`, {
    method: 'POST',
    body: form,
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function deleteDocument(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/documents/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(await parseError(res))
}

export async function askQuestion(
  question: string,
  documentId?: string,
): Promise<AskResponse> {
  const res = await fetch(`${API_BASE}/api/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, documentId: documentId ?? null }),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function generateSummary(documentId: string): Promise<DocumentSummary> {
  const res = await fetch(`${API_BASE}/api/summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ documentId }),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function generateQuiz(
  documentId: string,
  difficulty: Difficulty = 'medium',
  count = 5,
): Promise<Quiz> {
  const res = await fetch(`${API_BASE}/api/quiz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ documentId, difficulty, count }),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

// "2 days ago" style formatting from an ISO timestamp.
export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const seconds = Math.round((Date.now() - then) / 1000)
  if (seconds < 60) return 'Just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.round(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}
