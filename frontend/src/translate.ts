import { api } from './api/client'

/**
 * Automatic translation. Nothing is translated by hand.
 *  - "google" (default): the free Google Translate web endpoint, called from the browser, no API key.
 *  - "api": your own backend (/api/translate), e.g. Google Cloud Translation. Recommended for production traffic.
 * Set VITE_TRANSLATE_PROVIDER=api to switch.
 */
export const PROVIDER = (import.meta.env.VITE_TRANSLATE_PROVIDER || 'google') as 'google' | 'api'
const GT = 'https://translate.googleapis.com/translate_a/single'

/** {name} placeholders are swapped for [1], [2] … before translating, then restored. */
const protect = (s: string) => { const keys: string[] = []; const text = s.replace(/\{(\w+)\}/g, (_, k: string) => { keys.push(k); return `[${keys.length}]` }); return { text, keys } }
function restore(out: string, keys: string[], fallback: string): string {
  if (!keys.length) return out.trim() || fallback
  let seen = 0
  const r = out.replace(/\[\s*(\d+)\s*\]/g, (m, i: string) => { const k = keys[+i - 1]; if (!k) return m; seen++; return `{${k}}` })
  return seen === keys.length ? r.trim() : fallback   // if a placeholder got lost, keep the safe English text
}
async function gt(text: string, tl: string): Promise<string> {
  const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 9000)
  try {
    const r = await fetch(`${GT}?client=gtx&sl=en&tl=${encodeURIComponent(tl)}&dt=t&q=${encodeURIComponent(text)}`, { signal: ctl.signal })
    if (!r.ok) throw new Error('translate ' + r.status)
    const j = (await r.json()) as [string[][]]
    return j[0].map(x => x[0]).join('')
  } finally { clearTimeout(timer) }
}
async function googleFree(strings: string[], tl: string): Promise<Record<string, string>> {
  const prot = strings.map(protect), result: Record<string, string> = {}
  const chunks: number[][] = []; let cur: number[] = [], len = 0
  prot.forEach((p, i) => { const l = encodeURIComponent(p.text).length + 3; if (cur.length && (len + l > 3200 || cur.length >= 25)) { chunks.push(cur); cur = []; len = 0 } cur.push(i); len += l })
  if (cur.length) chunks.push(cur)
  let ok = 0
  const run = async (idx: number[]) => {
    // one request per chunk (strings joined by newlines); if the line count does not match, fall back to one request per string
    let lines: (string | null)[] | null = null
    try { const out = (await gt(idx.map(i => prot[i].text.replace(/\n/g, ' ')).join('\n'), tl)).split('\n'); if (out.length === idx.length) lines = out } catch { /* fall through */ }
    if (!lines) lines = await Promise.all(idx.map(i => gt(prot[i].text, tl).catch(() => null)))
    idx.forEach((i, k) => { const l = lines![k]; if (l) { result[strings[i]] = restore(l, prot[i].keys, strings[i]); ok++ } })
  }
  const queue = [...chunks]
  await Promise.all(Array.from({ length: 3 }, async () => { for (let c = queue.shift(); c; c = queue.shift()) await run(c) }))
  if (!ok && strings.length) throw new Error('translation unavailable')
  return result
}
export async function translateStrings(strings: string[], tl: string): Promise<Record<string, string>> {
  return PROVIDER === 'api' ? api.translate(strings, tl) : googleFree(strings, tl)
}
