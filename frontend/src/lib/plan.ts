import type { Appt, Extraction, Flag, PlanStatus, State, Task } from '../types'
import { FD, SLOT } from './format'

export const isDone = (x: Task) => x.st === 'taken' || x.st === 'late'
export const mLine = (i: number) => 3 + i
export const dLine = (e: Extraction, k: 'diet' | 'act' | 'fu' | 'warn') => ({ diet: 3, act: 4, fu: 5, warn: 6 }[k] + e.meds.length)
export const srcLines = (e: Extraction): string[] => [
  'DISCHARGE SUMMARY · sample',
  `Patient: ${e.name} | Discharged: ${e.dd}`,
  `Hospital: ${e.hosp}, ${e.city} — ${e.dept}`,
  ...e.meds.map((m, i) => `${i + 1}. Tab. ${m.n} ${m.s} — ${m.f} — ${m.fd} — ${m.dur} days`),
  `Diet: ${e.diet || '(not stated)'}`, `Activity: ${e.act || '(not stated)'}`, `f/u: ${e.fu}`, `R/v immediately if ${e.warn}`,
]
/** Rule-based validation. Mirrors the backend "Pydantic + safety rules" step. It never claims clinical approval. */
export function computeFlags(S: State): Flag[] {
  const e = S.ext, f: Flag[] = []
  e.meds.forEach((m, i) => {
    if (!m.n.trim() || !m.s.trim() || !m.f.trim()) f.push({ id: 'v' + i, lvl: 'fail', x: 'A medicine is missing a name, strength or frequency.', fix: 'review' })
    else if (S.conf['m' + i] < 75 && !S.ok['m' + i] && !S.prov['m' + i]) f.push({ id: 'm' + i, lvl: 'crit', x: 'Please check {n} {s} — the scan was hard to read.', v: { n: m.n, s: m.s }, fix: 'ok:m' + i })
  })
  if (!S.fuDate) f.push({ id: 'fu', lvl: 'crit', x: 'Your summary says follow-up {w}, but gives no exact date. Please confirm it.', v: { w: e.fu }, fix: 'date' })
  if (S.conf.dept < 75 && !S.ok.dept && !S.prov.dept) f.push({ id: 'dept', lvl: 'info', x: 'Department was hard to read. Please check it.', fix: 'ok:dept' })
  if (!e.diet.trim()) f.push({ id: 'diet', lvl: 'info', x: 'Diet instructions are not in your summary. Ask your doctor.', fix: 'review' })
  if (!e.act.trim()) f.push({ id: 'act', lvl: 'info', x: 'Activity instructions are not in your summary. Ask your doctor.', fix: 'review' })
  return f
}
export function planStatus(S: State): PlanStatus {
  if (S.generating) return 'Draft'
  const f = computeFlags(S)
  return f.some(x => x.lvl === 'fail') ? 'Validation Failed' : f.some(x => x.lvl === 'crit') ? 'Needs Clarification' : 'Ready to Use'
}
export function buildTasks(e: Extraction, old: Task[]): Task[] {
  const prev = Object.fromEntries(old.map(x => [x.id, x.st])) as Record<string, Task['st']>
  const o: Task[] = []
  e.meds.forEach((m, mi) => m.f.split('-').forEach((c, i) => {
    if (+c > 0 && SLOT[i]) o.push({ id: `m${mi}${i}`, k: 'med', t: `${m.n} ${m.s}`, s: FD[m.fd] || '', tm: SLOT[i][1], sl: SLOT[i][0], st: prev[`m${mi}${i}`] ?? null })
  }))
  o.push({ id: 'f1', k: 'food', t: e.diet || 'Light, low-salt lunch', s: 'Diet', tm: '1:00 PM', sl: 'Afternoon', st: prev.f1 ?? null })
  o.push({ id: 'a1', k: 'act', t: e.act || '10-minute gentle walk', s: 'Activity', tm: '6:00 PM', sl: 'Evening', st: prev.a1 ?? null })
  const ord: Record<string, number> = { Morning: 0, Afternoon: 1, Evening: 2, Night: 3 }
  return o.sort((a, b) => ord[a.sl] - ord[b.sl])
}
export const nextAppt = (S: State): Appt | undefined =>
  S.appts.filter(a => [0, 1, 2, 3].includes(a.s)).sort((a, b) => (a.d || '9').localeCompare(b.d || '9'))[0]
export const avgAdh = (S: State) => Math.round(S.adh.reduce((a, b) => a + b, 0) / S.adh.length)

export const toMin = (tm: string) => { const m = tm.match(/(\d+):(\d+) (AM|PM)/); return m ? ((+m[1] % 12) + (m[3] === 'PM' ? 12 : 0)) * 60 + +m[2] : -1 }
export interface Note { id: string; ic: string; x: string; v?: Record<string, string | number>; to: string; lvl: 'crit' | 'info' }
/** Things that need the patient's attention right now. Powers the bell. */
export function notifications(S: State): Note[] {
  const n: Note[] = []
  computeFlags(S).filter(f => f.lvl === 'crit').forEach(f => n.push({ id: f.id, ic: '⚑', x: f.x, v: f.v, to: f.fix === 'date' ? '/app/appts' : '/app/review', lvl: 'crit' }))
  const now = new Date(), cur = now.getHours() * 60 + now.getMinutes()
  S.tasks.filter(x => x.k === 'med' && !x.st).forEach(x => { const d = cur - toMin(x.tm); if (d >= 0 && d < 120) n.push({ id: 'd' + x.id, ic: '💊', x: 'Time to take {m}', v: { m: x.t }, to: '/app/meds', lvl: 'info' }) })
  if (S.log.filter(x => x.st === 'missed').length >= 2) n.push({ id: 'miss', ic: '💛', x: 'You missed some doses recently. Tap for help.', to: '/app/meds', lvl: 'info' })
  const ap = nextAppt(S); if (ap && ap.s === 0) n.push({ id: 'ap', ic: '📅', x: 'Your {n} is not booked yet.', v: { n: ap.n }, to: '/app/appts', lvl: 'info' })
  return n
}
export const streak = (S: State) => { let c = 0; for (let i = S.adh.length - 1; i >= 0 && S.adh[i] >= 80; i--) c++; return c }
