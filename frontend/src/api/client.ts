import { z } from 'zod'
import { getToken } from '../auth'
import { mock } from '../mock'
import type { DoseEvent, Appt, Caregiver, Extraction } from '../types'
import { AskResultSchema, PlanResultSchema, TranslateSchema, UploadResultSchema } from '../lib/schema'

/** true → built-in demo data; false → call the FastAPI backend */
export const MOCK = import.meta.env.VITE_USE_MOCK !== 'false'
const BASE = import.meta.env.VITE_API_URL ?? ''

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message) }
}
async function raw(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await getToken()
  const headers: Record<string, string> = { ...(init.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Authorization: `Bearer ${token}` } : {}) }
  const res = await fetch(BASE + path, { ...init, headers: { ...headers, ...(init.headers as Record<string, string> | undefined) } })
  if (!res.ok) throw new ApiError(res.status, (await res.text().catch(() => '')) || res.statusText)
  return res
}
async function json<T>(path: string, schema: z.ZodType<T>, init?: RequestInit): Promise<T> {
  return schema.parse(await (await raw(path, init)).json())
}
const body = (m: string, b: unknown): RequestInit => ({ method: m, body: JSON.stringify(b) })
const ok = async () => undefined

/**
 * Every network call the UI makes lives here, so wiring the FastAPI backend is a one-file job.
 * Endpoint contract is documented in README.md.
 */
export const api = {
  uploadDocument: (file: File | null) => {
    if (MOCK) return mock.upload(file).then(r => UploadResultSchema.parse(r))
    const fd = new FormData(); if (file) fd.append('file', file)
    return json('/api/documents', UploadResultSchema, { method: 'POST', body: fd })
  },
  generatePlan: (documentId: string, extraction: Extraction) =>
    MOCK ? mock.generate(documentId, extraction).then(r => PlanResultSchema.parse(r)) : json('/api/plans', PlanResultSchema, body('POST', { documentId, extraction })),
  /** Backend returns { translations: { [english]: translated } } and must keep numbers, doses and drug names unchanged. */
  translate: async (strings: string[], target: string): Promise<Record<string, string>> =>
    MOCK ? mock.translate(strings, target) : TranslateSchema.parse(await (await raw('/api/translate', body('POST', { strings, target }))).json()).translations,
  ask: (question: string, lang: string) =>
    MOCK ? mock.ask(question).then(r => AskResultSchema.parse(r)) : json('/api/chat', AskResultSchema, body('POST', { question, lang })),
  pdf: async (): Promise<Blob | null> => (MOCK ? mock.pdf() : (await raw('/api/plans/current/pdf')).blob()),
  exportData: async (): Promise<Blob> => (MOCK ? mock.exportBlob() : (await raw('/api/account/export')).blob()),
  deleteAccount: async () => { if (!MOCK) await raw('/api/account', { method: 'DELETE' }) },
  // Fire-and-forget syncs. In demo mode they are no-ops because the store already holds the data.
  logDose: (e: DoseEvent) => (MOCK ? ok() : raw('/api/dose-events', body('POST', e)).then(() => undefined)),
  saveAppointment: (a: Appt) => (MOCK ? ok() : raw(`/api/appointments/${a.id}`, body('PUT', a)).then(() => undefined)),
  saveCaregiver: (c: Caregiver) => (MOCK ? ok() : raw(`/api/caregivers/${c.id}`, body('PUT', c)).then(() => undefined)),
  removeCaregiver: (id: number) => (MOCK ? ok() : raw(`/api/caregivers/${id}`, { method: 'DELETE' }).then(() => undefined)),
  createShare: async (expires: string): Promise<string> => (MOCK ? Math.random().toString(36).slice(2, 12) : ((await (await raw('/api/shares', body('POST', { expires }))).json()) as { token: string }).token),
  revokeShare: (tk: string) => (MOCK ? ok() : raw(`/api/shares/${tk}`, { method: 'DELETE' }).then(() => undefined)),
}
