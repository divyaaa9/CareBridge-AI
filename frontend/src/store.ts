import { useSyncExternalStore } from 'react'
import type { State } from './types'
import { addDays } from './lib/format'
import { buildTasks } from './lib/plan'

const KEY = 'cb_state_v4'
export function DEF(): State {
  const ext = {
    name: 'Ravi Kumar', dd: addDays(-7), hosp: 'Sunrise General Hospital', city: 'Hyderabad', dept: 'Cardiology',
    meds: [{ n: 'Pantoprazole', s: '40 mg', f: '1-0-1', fd: 'a/f', dur: 14 }, { n: 'Amlodipine', s: '5 mg', f: '1-0-0', fd: 'a/f', dur: 30 }, { n: 'Metformin', s: '500 mg', f: '1-0-0', fd: 'p/c', dur: 14 }],
    diet: '', act: '', fu: 'in 2 weeks', warn: 'fever or breathing difficulty',
  }
  const tasks = buildTasks(ext, [])
  tasks[0].st = 'taken'; tasks[1].st = 'taken'
  const ago = (d: number) => new Date(Date.now() - d * 864e5).toISOString()
  return {
    user: null, day: 8, total: 14, size: 1, hc: 0, ver: 2, generating: false, ext,
    conf: { name: 99, dd: 96, hosp: 94, city: 97, dept: 71, m0: 98, m1: 93, m2: 64, diet: 0, act: 0, fu: 88, warn: 90 },
    prov: {}, ok: {}, fuDate: null, tasks,
    log: [{ id: 1, tid: 'x', t: 'Metformin 500 mg', st: 'taken', at: ago(1), by: 'You' }, { id: 2, tid: 'x', t: 'Pantoprazole 40 mg', st: 'missed', at: ago(2), by: 'You' }, { id: 3, tid: 'x', t: 'Amlodipine 5 mg', st: 'late', at: ago(3), by: 'Lakshmi (caregiver)' }],
    adh: [67, 83, 100, 83, 100, 100, 83, 100],
    checks: [{ d: addDays(-2), pain: 5, mood: 3, sym: [], note: '' }, { d: addDays(-1), pain: 4, mood: 4, sym: ['Tired'], note: 'Slept well' }],
    appts: [{ id: 1, n: 'Cardiology follow-up', d: null, w: 'Sunrise General Hospital', s: 0, src: '', r: 1 }, { id: 3, n: 'Wound review', d: addDays(-3), w: 'Dr. A. Kumar', s: 4, src: 'patient', r: 0 }],
    fam: [{ id: 1, n: 'Lakshmi', rel: 'Wife', st: 1, sc: ['meds', 'appts', 'prog'] }, { id: 2, n: 'Arjun', rel: 'Son', st: 1, sc: ['meds'] }],
    shares: [], chat: [], corr: [], audit: [{ at: new Date().toISOString(), e: 'Signed in' }],
    prof: { age: '20', tz: 'Asia/Kolkata', phone: '' },
    notif: { meds: 1, appts: 1, tips: 0, qs: 22, qe: 7, lead: '1d' },
    consent: { share: 1, ai: 1, stats: 0 }, notified: {},
  }
}
function load(): State {
  try { const v = localStorage.getItem(KEY); if (v) return { ...DEF(), ...JSON.parse(v) } } catch { /* ignore */ }
  return DEF()
}
let state: State = load()
const listeners = new Set<() => void>()
let timer: number | undefined
const persist = () => { clearTimeout(timer); timer = window.setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* quota */ } }, 200) }
export const getState = () => state
/** Immutable-style update: clone, mutate the draft, publish. */
export function mutate(fn: (d: State) => void) { const next = structuredClone(state); fn(next); state = next; listeners.forEach(l => l()); persist() }
export const audit = (d: State, e: string) => { d.audit.unshift({ at: new Date().toISOString(), e }); d.audit = d.audit.slice(0, 30) }
export function resetStore() { state = DEF(); listeners.forEach(l => l()); try { localStorage.removeItem(KEY) } catch { /* ignore */ } }
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }
export const useStore = (): State => useSyncExternalStore(subscribe, getState)
