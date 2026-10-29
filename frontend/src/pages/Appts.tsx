import { useI18n } from '../i18n'
import { useStore } from '../store'
import { A } from '../actions'
import { ApptPill, PageHead, Pv, openModal } from '../components/ui'
import { ApptStatusSheet, BookSheet, LeavingSheet, ManualRequestSheet } from '../components/sheets'
import { useNavigate } from 'react-router-dom'

export default function Appts() {
  const S = useStore(), { t, fmtDate } = useI18n(), nav = useNavigate(), cg = S.user?.role === 'caregiver'
  const slug = S.ext.hosp.toLowerCase().replace(/\W+/g, '')
  const hs: [string, string, string, string, string, string][] = [['Official website', `${slug}.example`, 'Verified', 'Matches name and city in a trusted directory.', 'g', '🌐'], ['Appointment page', `${slug}.example/book`, 'Verified', 'Linked from the official website.', 'g', '🗓️'], ['Third-party booking site', 'bookmydoc.example', 'Unverified', "Not confirmed as the hospital's service.", 'a', '🔗']]
  return <>
    <PageHead h={t('Appointments')} p={t('Track every visit from booking to completion')}>{!cg && <button className="btn s" onClick={() => openModal(<BookSheet />)}>+ {t('Add a visit')}</button>}</PageHead>
    <div className="gr k2">{S.appts.map(a => <article className="card" key={a.id} data-tilt>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><div><h2 style={{ margin: 0 }}>{t(a.n)}</h2><p className="mut" style={{ fontSize: 13.5 }}>{a.d ? fmtDate(a.d, { day: 'numeric', month: 'long', year: 'numeric' }) : t('Date not set')} · {a.w}</p></div><ApptPill s={a.s} /></div>
      {a.src && <p style={{ marginTop: 8 }}>{a.src === 'patient' ? <Pv k="reported" /> : <Pv k="confirmed" />}</p>}
      {a.s === 5 && <div className="flag" style={{ marginTop: 10 }}>💛 {t('It happens. Rebook as soon as you can, and ask your doctor if the delay matters.')}</div>}
      {a.s === 0 && a.n.includes('follow-up') && <div className="flag"><span>📋 {t('Documented: follow-up {w}', { w: t(S.ext.fu) })}</span></div>}
      {!cg && <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="btn s" onClick={() => openModal(<ApptStatusSheet id={a.id} />)}>{t('Update status')}</button>
        <button className="btn s o" onClick={() => openModal(<ManualRequestSheet id={a.id} />)}>✉️ {t('Prepare request')}</button>
        <span style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>🔔<button className="sw" role="switch" aria-checked={!!a.r} aria-label={t('Reminders')} onClick={() => A.toggleRemind(a.id)} /></span></div>}</article>)}</div>
    <div className="card" style={{ marginTop: 16 }}><h2>🏥 {t('Find the hospital booking page')}</h2>
      <div className="gr k2"><div><label>{t('Hospital')}</label>
        <div className="it" style={{ border: 0 }}><div><h3>{S.ext.hosp}</h3><p>{S.ext.city} · {S.ext.dept}</p></div>{!cg && <button className="btn s o x" onClick={() => nav('/app/review')}>{t('Edit')}</button>}</div>
        <p className="mut" style={{ fontSize: 12.5 }}>🔒 {t('We search with only the hospital name, city and department. Never your medical details.')}</p>
        <a className="btn s" style={{ marginTop: 10 }} href="tel:+910000000000">📞 {t('Call hospital')}</a></div>
        <div>{hs.map(h => <div className="it" key={h[0]}><div className="ic2">{h[5]}</div><div><h3>{t(h[0])}</h3><p>{h[1]}<br />{t(h[3])}</p></div><span className={`x pill ${h[4]}`}>{h[2] === 'Verified' ? '✓' : '?'} {t(h[2])}</span></div>)}
          <button className="btn s" style={{ marginTop: 10 }} onClick={() => openModal(<LeavingSheet />)}>{t('Open booking page')} ↗</button></div></div>
      <div className="flag" style={{ marginTop: 12 }}>ℹ️ {t('Opening a booking page is not a booking. Sending a request is not a confirmation.')}</div></div></>
}
