import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n'
import { api } from '../api/client'
import { A } from '../actions'
import { getState, mutate, useStore } from '../store'
import { addDays, FD, freqTxt } from '../lib/format'
import { notifications, srcLines } from '../lib/plan'
import { session } from '../lib/session'
import { toast } from './toast'
import { resetPassword } from '../auth'
import { AS, closeModal, DS, openModal } from './ui'
import type { DoseStatus, Task } from '../types'

export function MissedSheet({ task }: { task?: Task }) {
  const { t } = useI18n()
  return <>
    <h2 className="disp" style={{ fontSize: 26 }}>{t('Missed or late a dose?')}</h2>
    {task && <p>{t('{m} is not marked as taken.', { m: task.t })}</p>}
    <div className="flag" style={{ margin: 0 }}><span>{t('Your summary has no missed-dose instruction. Please ask your pharmacist or doctor what to do.')}</span></div>
    <div className="flag r"><span>⚠️ {t('Do not take extra to catch up, and never double a dose.')}</span></div>
    <a className="btn" href="tel:+910000000000">📞 {t('Call hospital')}</a>
    <button className="btn o" onClick={closeModal}>{t('Got it')}</button></>
}
export function DoseSheet({ task }: { task: Task }) {
  const { t } = useI18n()
  const pick = (s: DoseStatus) => { A.setDose(task.id, s); closeModal(); if (s !== 'taken' && s !== 'late') openModal(<MissedSheet task={task} />) }
  return <>
    <h2 className="disp" style={{ fontSize: 26 }}>{task.k === 'med' ? task.t : t(task.t)}</h2>
    <p className="mut">{task.tm} · {t('How did it go?')}</p>
    <div className="opts">{(Object.keys(DS) as DoseStatus[]).map(s => <button key={s} className="opt" onClick={() => pick(s)}>{DS[s][2]} {t(DS[s][1])}</button>)}</div>
    <button className="btn o" onClick={closeModal}>{t('Cancel')}</button></>
}
export function SourceSheet({ line }: { line: number }) {
  const { t } = useI18n(), S = useStore()
  return <>
    <h2 className="disp" style={{ fontSize: 24 }}>📄 {t('Source in your summary')}</h2>
    <div className="doc">{srcLines(S.ext).map((l, i) => <span key={i} className={i === line ? 'hl' : ''}>{l}</span>)}</div>
    <button className="btn o" onClick={closeModal}>{t('Close')}</button></>
}
export function FollowUpSheet() {
  const { t } = useI18n(), S = useStore(), [d, setD] = useState(addDays(7))
  return <>
    <h2 className="disp" style={{ fontSize: 26 }}>{t('Confirm follow-up date')}</h2>
    <p className="mut">{t('Documented: follow-up {w}', { w: t(S.ext.fu) })}</p>
    <div><label htmlFor="fd">{t('Date from your hospital')}</label><input id="fd" type="date" min={addDays(0)} value={d} onChange={e => setD(e.target.value)} /></div>
    <div style={{ display: 'flex', gap: 8 }}><button className="btn" style={{ flex: 1 }} onClick={() => { A.setFuDate(d); closeModal() }}>{t('Save')}</button><button className="btn o" onClick={closeModal}>{t('Cancel')}</button></div></>
}
export function ApptDateSheet({ id, status }: { id: number; status: number }) {
  const { t } = useI18n(), a = getState().appts.find(x => x.id === id)!, [d, setD] = useState(a.d || addDays(7))
  return <>
    <h2 className="disp" style={{ fontSize: 26 }}>{t(status === 3 ? 'New date' : 'Appointment date')}</h2>
    <div><label htmlFor="nd">{t('Date')}</label><input id="nd" type="date" value={d} onChange={e => setD(e.target.value)} /></div>
    <button className="btn" onClick={() => { A.setApptStatus(id, status, d); closeModal() }}>{t('Save')}</button></>
}
export function AttendSheet() {
  const { t } = useI18n(), nav = useNavigate()
  return <>
    <h2 className="disp" style={{ fontSize: 26 }}>{t('Did you attend?')}</h2><p>{t('You can upload any new instructions from this visit.')}</p>
    <button className="btn" onClick={() => { closeModal(); nav('/app/upload') }}>⬆️ {t('Upload new document')}</button>
    <button className="btn o" onClick={closeModal}>{t('Not now')}</button></>
}
export function ApptStatusSheet({ id }: { id: number }) {
  const { t } = useI18n(), S = useStore(), a = S.appts.find(x => x.id === id)!
  const pick = (i: number) => {
    closeModal()
    if (i === 3 || (i === 2 && !a.d)) { openModal(<ApptDateSheet id={id} status={i} />); return }
    A.setApptStatus(id, i); if (i === 4) openModal(<AttendSheet />)
  }
  return <>
    <h2 className="disp" style={{ fontSize: 26 }}>{t(a.n)}</h2>
    <div className="opts">{AS.map((s, i) => <button key={i} className="opt" onClick={() => pick(i)}>{s[2]} {t(s[0])}{i === 2 && <small className="mut"> · {t('patient-reported')}</small>}</button>)}</div>
    <button className="btn o" onClick={closeModal}>{t('Cancel')}</button></>
}
export function ManualRequestSheet({ id }: { id: number }) {
  const { t } = useI18n(), S = useStore(), a = S.appts.find(x => x.id === id)!
  const [txt, setTxt] = useState(`Hello, I would like to book a ${a.n} at ${S.ext.dept}, ${S.ext.hosp}. Patient: ${S.ext.name}. Preferred dates: next week, morning. Please confirm. Thank you.`)
  return <>
    <h2 className="disp" style={{ fontSize: 26 }}>{t('Appointment request')}</h2>
    <p className="mut" style={{ fontSize: 13 }}>{t('Copy this and send it to the hospital by phone, WhatsApp or email.')}</p>
    <textarea value={txt} onChange={e => setTxt(e.target.value)} />
    <div style={{ display: 'flex', gap: 8 }}><button className="btn" style={{ flex: 1 }} onClick={() => { navigator.clipboard?.writeText(txt).catch(() => undefined); A.markPending(id); closeModal() }}>{t('Copy and mark pending')}</button><button className="btn o" onClick={closeModal}>{t('Close')}</button></div></>
}
export function LeavingSheet() {
  const { t } = useI18n()
  return <>
    <h2 className="disp" style={{ fontSize: 24 }}>{t('You are leaving CareBridge')}</h2>
    <p>{t('Opening a booking page is not a booking. We will keep this visit as Not Booked until you tell us otherwise.')}</p>
    <button className="btn" onClick={() => { closeModal(); toast('Demo only — no external page was opened.') }}>{t('Continue')} ↗</button>
    <button className="btn o" onClick={closeModal}>{t('Cancel')}</button></>
}
export function BookSheet() {
  const { t } = useI18n(), [n, setN] = useState('Lab test'), [d, setD] = useState(addDays(10))
  return <>
    <h2 className="disp" style={{ fontSize: 26 }}>{t('Add a visit')}</h2>
    <div><label htmlFor="bt">{t('Reason')}</label><input id="bt" type="text" value={n} onChange={e => setN(e.target.value)} /></div>
    <div><label htmlFor="bd">{t('Date')}</label><input id="bd" type="date" min={addDays(0)} value={d} onChange={e => setD(e.target.value)} /></div>
    <button className="btn" onClick={() => { A.addVisit(n.trim(), d); closeModal() }}>{t('Save')}</button></>
}
export function InviteSheet() {
  const { t } = useI18n(), [n, setN] = useState(''), [r, setR] = useState('')
  return <>
    <h2 className="disp" style={{ fontSize: 26 }}>{t('Invite caregiver')}</h2>
    <div><label htmlFor="in">{t('Name')}</label><input id="in" type="text" value={n} onChange={e => setN(e.target.value)} /></div>
    <div><label htmlFor="ir">{t('Relationship')}</label><input id="ir" type="text" value={r} onChange={e => setR(e.target.value)} /></div>
    <button className="btn" disabled={!n.trim()} onClick={() => { A.invite(n.trim(), r.trim()); closeModal() }}>{t('Send invite')}</button></>
}
export function PermSheet({ id }: { id: number }) {
  const { t } = useI18n(), S = useStore(), f = S.fam.find(x => x.id === id)
  const L: Record<string, string> = { meds: 'Medicines', appts: 'Appointments', prog: 'Recovery' }
  if (!f) return null
  return <>
    <h2 className="disp" style={{ fontSize: 26 }}>{f.n}</h2>
    {Object.keys(L).map(k => <div className="it" key={k}><div><h3>{t(L[k])}</h3></div><button className="sw x" role="switch" aria-checked={f.sc.includes(k)} aria-label={t(L[k])} onClick={() => A.togglePerm(id, k)} /></div>)}
    <button className="btn d" onClick={() => { A.revoke(id); closeModal() }}>{t('Revoke access')}</button>
    <button className="btn o" onClick={closeModal}>{t('Done')}</button></>
}
export function FridgeSheet() {
  const { t } = useI18n(), S = useStore(), e = S.ext
  return <>
    <div className="sheet1" id="psheet">
      <h3 className="disp" style={{ fontSize: 26 }}>CareBridge AI · {t('Fridge sheet')}</h3>
      <p><b>{e.name}</b> · {e.hosp} · v{S.ver}</p>
      <table><thead><tr><th>{t('Medicine')}</th><th>{t('When')}</th></tr></thead><tbody>
        {e.meds.map((m, i) => <tr key={i}><td>{m.n} {m.s}</td><td>{freqTxt(m.f, t)} · {t(FD[m.fd] || '')}</td></tr>)}
        <tr><td>{t('Follow-up')}</td><td>{t(e.fu)}{S.fuDate ? ' · ' + S.fuDate : ''}</td></tr></tbody></table>
      <div className="flag r"><span>⚠️ {t('Seek medical help immediately if you have: {w}', { w: t(e.warn) })}</span></div>
      <p className="mut" style={{ fontSize: 11, marginTop: 10 }}>{t('CareBridge AI explains instructions. It does not replace your doctor.')}</p></div>
    <div style={{ display: 'flex', gap: 8 }}><button className="btn" style={{ flex: 1 }} onClick={() => window.print()}>🖨️ {t('Print')}</button><button className="btn o" style={{ flex: 1 }} onClick={A.downloadPdf}>⬇️ {t('Download PDF')}</button><button className="btn o" onClick={closeModal}>{t('Close')}</button></div></>
}
export function WipeSheet() {
  const { t } = useI18n(), [v, setV] = useState('')
  return <>
    <h2 className="disp" style={{ fontSize: 26 }}>{t('Delete all my data?')}</h2>
    <p>{t('This permanently removes your plan, logs and translations. Type DELETE to confirm.')}</p>
    <input type="text" autoComplete="off" value={v} onChange={e => setV(e.target.value)} aria-label="DELETE" />
    <button className="btn d" disabled={v !== 'DELETE'} onClick={() => A.wipe()}>{t('Delete everything')}</button>
    <button className="btn o" onClick={closeModal}>{t('Cancel')}</button></>
}
export function GenerateSheet() {
  const { t } = useI18n(), nav = useNavigate(), [i, setI] = useState(0)
  const steps = ['Structuring your details', 'Writing in simple language', 'Checking against your document', 'Checking your language version', 'Setting plan status']
  useEffect(() => {
    let alive = true
    mutate(d => { d.generating = true })
    const timers = [1, 2, 3, 4].map(k => window.setTimeout(() => alive && setI(k), k * 700))
    Promise.all([api.generatePlan(session.docId, getState().ext), new Promise(r => setTimeout(r, 3600))])
      .then(([r]) => { if (!alive) return; A.finishGenerate(r.version); closeModal(); nav('/app/plan') })
      .catch(() => { mutate(d => { d.generating = false }); closeModal(); toast('Could not build the plan. Please try again.') })
    return () => { alive = false; timers.forEach(clearTimeout) }
  }, [nav])
  return <>
    <h2 className="disp" style={{ fontSize: 26 }}>{t('Building your care plan')}</h2>
    <div className="stg">{steps.map((s, k) => <div key={k} className={k === i ? 'on' : k < i ? 'dn' : ''}><span>{k + 1}</span>{t(s)}</div>)}</div></>
}

export function ForgotSheet({ initial }: { initial: string }) {
  const { t } = useI18n(), [e, setE] = useState(initial), [busy, setBusy] = useState(false), [err, setErr] = useState('')
  const send = async () => {
    if (!/^\S+@\S+\.\S+$/.test(e.trim())) return setErr('Enter a valid email address.')
    setBusy(true); setErr('')
    try { await resetPassword(e.trim()); closeModal(); toast('If this email has an account, a reset link is on its way.') } catch { setErr('Could not send the email. Please try again.') } finally { setBusy(false) }
  }
  return <>
    <h2 className="disp" style={{ fontSize: 26 }}>{t('Reset your password')}</h2>
    <p className="mut">{t("Enter your email and we'll send you a reset link.")}</p>
    <div><label htmlFor="fe">{t('Email')}</label><input id="fe" type="email" value={e} onChange={x => setE(x.target.value)} /><div className="err">{err && t(err)}</div></div>
    <button className="btn" disabled={busy} onClick={send}>{busy && <span className="sp" />}{t('Send reset link')}</button>
    <button className="btn o" onClick={closeModal}>{t('Cancel')}</button></>
}
export function NotificationSheet() {
  const S = useStore(), { t } = useI18n(), nav = useNavigate(), list = notifications(S)
  return <>
    <h2 className="disp" style={{ fontSize: 26 }}>🔔 {t('Notifications')}</h2>
    {list.length ? list.map(n => <button key={n.id} className="opt" onClick={() => { closeModal(); nav(n.to) }}>{n.ic} {t(n.x, n.v && n.v.w ? { ...n.v, w: t(String(n.v.w)) } : n.v)}</button>) : <div className="flag k" style={{ margin: 0 }}>✓ {t("You're all caught up.")}</div>}
    <button className="btn o" onClick={closeModal}>{t('Close')}</button></>
}
export function IosInstallSheet() {
  const { t } = useI18n()
  return <>
    <h2 className="disp" style={{ fontSize: 26 }}>📲 {t('Install on iPhone')}</h2>
    <p>{t('1. Tap the Share button in Safari.')}</p><p>{t('2. Choose "Add to Home Screen".')}</p><p>{t('3. Tap Add. CareBridge opens like an app.')}</p>
    <button className="btn" onClick={closeModal}>{t('Got it')}</button></>
}
