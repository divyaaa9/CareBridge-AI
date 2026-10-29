export type Role = 'patient' | 'caregiver'
export interface User { name: string; role: Role; email: string }
export interface Med { n: string; s: string; f: string; fd: string; dur: number }
export interface Extraction {
  name: string; dd: string; hosp: string; city: string; dept: string
  meds: Med[]; diet: string; act: string; fu: string; warn: string
}
export type DoseStatus = 'taken' | 'late' | 'missed' | 'skipped' | 'unsure'
export interface Task { id: string; k: 'med' | 'food' | 'act'; t: string; s: string; tm: string; sl: string; st: DoseStatus | null }
export interface DoseEvent { id: number; tid: string; t: string; st: DoseStatus; at: string; by: string }
export interface Appt { id: number; n: string; d: string | null; w: string; s: number; src: '' | 'patient' | 'service'; r: 0 | 1 }
export interface Caregiver { id: number; n: string; rel: string; st: 0 | 1; sc: string[] }
export interface Share { tk: string; e: string }
export interface Checkin { d: string; pain: number; mood: number; sym: string[]; note: string; concern?: boolean }
export interface ChatMsg { r: 'u' | 'a'; t: string; src?: number | null; key?: boolean }
export interface Flag { id: string; lvl: 'fail' | 'crit' | 'info'; x: string; v?: Record<string, string | number>; fix: string }
export type PlanStatus = 'Draft' | 'Needs Clarification' | 'Validation Failed' | 'Ready to Use'
export interface Correction { k: string; a: string; b: string; at: string }
export interface State {
  user: User | null
  day: number; total: number; size: number; hc: 0 | 1; ver: number; generating: boolean
  ext: Extraction
  conf: Record<string, number>        // OCR confidence per field (0-100)
  prov: Record<string, 1>             // fields corrected by the user
  ok: Record<string, 1>               // low-confidence fields the user confirmed
  fuDate: string | null
  tasks: Task[]; log: DoseEvent[]; adh: number[]; checks: Checkin[]
  appts: Appt[]; fam: Caregiver[]; shares: Share[]; chat: ChatMsg[]; corr: Correction[]
  audit: { at: string; e: string }[]
  prof: { age: string; tz: string; phone: string }
  notif: { meds: 0 | 1; appts: 0 | 1; tips: 0 | 1; qs: number; qe: number; lead: string }
  consent: { share: 0 | 1; ai: 0 | 1; stats: 0 | 1 }
  notified: Record<string, 1>
}
