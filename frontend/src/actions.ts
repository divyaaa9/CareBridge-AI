import { api, MOCK } from './api/client'
import { audit, getState, mutate } from './store'
import { confetti, toast } from './components/toast'
import { buildTasks, isDone, planStatus } from './lib/plan'
import { URG, addDays } from './lib/format'
import type { Checkin, DoseEvent, DoseStatus, Extraction } from './types'

const me = () => { const u = getState().user; return u?.role === 'caregiver' ? `${u.name} (caregiver)` : 'You' }
const syncErr = () => toast('Could not sync. Saved on this device.')
/** Celebrate the moment a plan becomes "Ready to Use". */
function afterChange(prev: string) {
  if (prev !== 'Ready to Use' && planStatus(getState()) === 'Ready to Use') { confetti(innerWidth / 2, 200); toast('✅ Your plan is now Ready to Use') }
}
export function download(b: Blob, name: string) {
  const u = URL.createObjectURL(b), a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 1000)
}
type Rect = { left: number; top: number }

export const A = {
  toggleTask(id: string, r?: Rect) {
    const was = isDone(getState().tasks.find(q => q.id === id)!)
    let ev: DoseEvent | undefined
    mutate(d => { const x = d.tasks.find(q => q.id === id)!; x.st = isDone(x) ? null : 'taken'; if (x.k === 'med') { ev = { id: Date.now(), tid: id, t: x.t, st: x.st || 'unsure', at: new Date().toISOString(), by: me() }; d.log.unshift(ev) } })
    if (ev) api.logDose(ev).catch(syncErr)
    if (!was) { confetti(r ? r.left + 14 : innerWidth / 2, r ? r.top : 300); if (getState().tasks.every(isDone)) toast('🎉 All done for today!') }
  },
  setDose(id: string, st: DoseStatus) {
    let ev: DoseEvent | undefined
    mutate(d => { const x = d.tasks.find(q => q.id === id)!; x.st = st; ev = { id: Date.now(), tid: id, t: x.t, st, at: new Date().toISOString(), by: me() }; d.log.unshift(ev) })
    if (ev) api.logDose(ev).catch(syncErr)
    if (st === 'taken' || st === 'late') confetti(innerWidth / 2, innerHeight / 2)
  },
  okField(k: string) { const p = planStatus(getState()); mutate(d => { d.ok[k] = 1 }); toast('Marked as checked'); afterChange(p) },
  setFuDate(date: string) {
    const p = planStatus(getState())
    mutate(d => { d.fuDate = date; const a = d.appts.find(x => x.id === 1); if (a) { a.d = date; if (a.s === 0) a.s = 1; a.src = 'patient' } audit(d, 'Follow-up date confirmed') })
    const a = getState().appts.find(x => x.id === 1); if (a) api.saveAppointment(a).catch(syncErr)
    afterChange(p)
  },
  checkin(c: Checkin) { mutate(d => { d.checks.unshift(c); audit(d, 'Check-in saved') }); toast('Check-in saved'); if (c.sym.some(s => URG.test(s))) setTimeout(() => toast('🚨 Please seek urgent medical help.'), 1500) },
  setApptStatus(id: number, s: number, date?: string) {
    const p = planStatus(getState())
    mutate(d => { const a = d.appts.find(x => x.id === id)!; a.s = s; if (date) { a.d = date; if (id === 1) d.fuDate = date } if (s === 2 || s === 4 || date) a.src = 'patient'; audit(d, 'Appointment status updated') })
    const a = getState().appts.find(x => x.id === id)!; api.saveAppointment(a).catch(syncErr); afterChange(p)
  },
  markPending(id: number) { mutate(d => { const a = d.appts.find(x => x.id === id)!; a.s = 1 }); toast('Request marked as pending. It is not confirmed yet.') },
  toggleRemind(id: number) { mutate(d => { const a = d.appts.find(x => x.id === id)!; a.r = a.r ? 0 : 1 }) },
  addVisit(n: string, date: string) {
    mutate(d => { d.appts.unshift({ id: Date.now(), n: n || 'Visit', d: date, w: d.ext.hosp, s: 1, src: 'patient', r: 1 }) })
    api.saveAppointment(getState().appts[0]).catch(syncErr); toast('Visit added')
  },
  invite(n: string, rel: string) {
    mutate(d => { d.fam.push({ id: Date.now() % 100000, n, rel: rel || 'Family', st: 0, sc: [] }); audit(d, 'Caregiver invited') })
    api.saveCaregiver(getState().fam.at(-1)!).catch(syncErr); toast('Invite sent')
  },
  togglePerm(id: number, k: string) {
    mutate(d => { const f = d.fam.find(x => x.id === id)!; f.st = 1; f.sc = f.sc.includes(k) ? f.sc.filter(x => x !== k) : [...f.sc, k] })
    api.saveCaregiver(getState().fam.find(x => x.id === id)!).catch(syncErr)
  },
  revoke(id: number) { mutate(d => { d.fam = d.fam.filter(f => f.id !== id); audit(d, 'Caregiver access revoked') }); api.removeCaregiver(id).catch(syncErr); toast('Access revoked') },
  async share(exp: string) {
    try { const tk = await api.createShare(exp); mutate(d => { d.shares.unshift({ tk, e: exp }); audit(d, 'Share link created') }); toast('Share link created') } catch { syncErr() }
  },
  unshare(tk: string) { mutate(d => { d.shares = d.shares.filter(x => x.tk !== tk); audit(d, 'Share link revoked') }); api.revokeShare(tk).catch(syncErr); toast('Link revoked') },
  edit(k: 'name' | 'hosp' | 'city' | 'dept' | 'diet' | 'act' | 'fu' | 'warn', v: string) {
    mutate(d => { if (!d.prov[k]) d.corr.unshift({ k: 'Corrected ' + k, a: '…', b: v.slice(0, 30), at: new Date().toISOString() }); d.ext[k] = v; d.prov[k] = 1 })
  },
  editMed(i: number, f: 'n' | 's' | 'f', v: string) { mutate(d => { d.ext.meds[i][f] = v; d.prov['m' + i] = 1 }) },
  finishGenerate(version: number) { const p = planStatus(getState()); mutate(d => { d.generating = false; d.ver = version; d.tasks = buildTasks(d.ext, d.tasks); audit(d, 'Care plan generated') }); setTimeout(() => afterChange(p), 300) },
  regen() { mutate(d => { d.ver++; d.tasks = buildTasks(d.ext, d.tasks); audit(d, 'Plan regenerated') }); toast('Plan regenerated from your reviewed details') },
  setProfile(k: 'name' | 'age' | 'tz', v: string) { mutate(d => { if (k === 'name' && d.user) d.user.name = v; else if (k !== 'name') d.prof[k] = v }); toast('Saved') },
  toggleNotif(k: 'meds' | 'appts' | 'tips') { mutate(d => { d.notif[k] = d.notif[k] ? 0 : 1 }) },
  setNotif(k: 'qs' | 'qe' | 'lead', v: string) { mutate(d => { if (k === 'lead') d.notif.lead = v; else d.notif[k] = +v }) },
  toggleConsent(k: 'share' | 'ai' | 'stats') { mutate(d => { d.consent[k] = d.consent[k] ? 0 : 1 }) },
  setSize(v: number) { mutate(d => { d.size = v }) },
  toggleContrast() { mutate(d => { d.hc = d.hc ? 0 : 1 }) },
  async ask(q: string, lang: string) {
    q = q.trim(); if (!q) return
    mutate(d => { d.chat.push({ r: 'u', t: q }) })
    let t: string, src: number | null = null, key = MOCK
    if (URG.test(q)) { t = 'This may be urgent. Please call 108 or go to the nearest emergency department now. Do not wait for this app.'; key = true }
    else if (!getState().consent.ai) { t = 'AI answers are turned off in your privacy settings.'; key = true }
    else try { const r = await api.ask(q, lang); t = r.answer; src = r.line } catch { t = 'Sorry, I could not answer right now. Please ask your doctor or pharmacist.'; key = true }
    mutate(d => { d.chat.push({ r: 'a', t, src, key }) })
  },
  async exportData() { try { download(await api.exportData(), 'carebridge-records.json'); mutate(d => audit(d, 'Data exported')); toast('Export ready') } catch { toast('Export failed. Please try again.') } },
  async downloadPdf() { try { const b = await api.pdf(); if (b) download(b, 'carebridge-plan.pdf'); else window.print() } catch { toast('Could not create the PDF. Use Print instead.') } },
  async wipe() { try { await api.deleteAccount() } catch { toast('Could not delete the account. Please try again.'); return } Object.keys(localStorage).filter(k => k.startsWith('cb_')).forEach(k => localStorage.removeItem(k)); location.href = '/' },
}
export { addDays }
export type { Extraction }
