import type { Extraction } from '../types'
import { getState } from '../store'
import { FD, URG } from '../lib/format'
import { dLine } from '../lib/plan'
import { TE } from './te'

const wait = (ms: number) => new Promise(r => setTimeout(r, ms))
const freq = (f: string) => f.split('-').map((c, i) => (+c > 0 ? ['Morning', 'Afternoon', 'Night'][i] : '')).filter(Boolean).join(' + ')

/** Local stand-ins for the FastAPI endpoints so the UI runs without a server. */
export const mock = {
  async upload(file: File | null) { await wait(500); return { documentId: 'demo-doc', blurry: /blur/i.test(file?.name || '') } },
  async generate(_documentId: string, _ext: Extraction) { await wait(300); return { version: getState().ver + 1 } },
  async translate(strings: string[], target: string) {
    await wait(150)
    const out: Record<string, string> = {}
    for (const s of strings) out[s] = target === 'te' && TE[s] ? TE[s] : s
    return out
  },
  async ask(question: string) {
    await wait(700)
    const S = getState(), e = S.ext, s = question.toLowerCase()
    if (URG.test(question)) return { answer: 'This may be urgent. Please call 108 or go to the nearest emergency department now. Do not wait for this app.', line: dLine(e, 'warn') }
    if (/visit|appoint|follow|next|doctor/.test(s))
      return { answer: S.fuDate ? `Your summary says follow-up ${e.fu}. Date: ${S.fuDate}.` : 'Your summary says follow-up is in 2 weeks. No exact date is given, so please confirm it with the hospital.', line: dLine(e, 'fu') }
    if (/medic|tablet|pill|dose|pantop|amlod|metf/.test(s))
      return { answer: e.meds.map(m => `${m.n} ${m.s}: ${freq(m.f)}, ${FD[m.fd] || ''}`).join('. '), line: 3 }
    if (/warn|sign|fever|breath/.test(s)) return { answer: `Seek medical help immediately if you have: ${e.warn}`, line: dLine(e, 'warn') }
    if (/diet|food|eat|drink/.test(s)) return { answer: e.diet || 'Not in your summary. Ask your doctor.', line: dLine(e, 'diet') }
    if (/activity|walk|exercise|work/.test(s)) return { answer: e.act || 'Not in your summary. Ask your doctor.', line: dLine(e, 'act') }
    return { answer: 'This is not in your summary. Please ask your doctor or pharmacist.', line: null }
  },
  async exportBlob() { await wait(200); return new Blob([JSON.stringify({ exported: new Date().toISOString(), data: { ...getState(), user: undefined } }, null, 2)], { type: 'application/json' }) },
  async pdf(): Promise<Blob | null> { return null }, // null → caller falls back to the browser print dialog
}
