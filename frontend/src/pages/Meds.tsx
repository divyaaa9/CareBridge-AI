import { useI18n } from '../i18n'
import { useStore } from '../store'
import { PageHead, Pv, DosePill, openModal } from '../components/ui'
import { TaskRow } from '../components/shared'
import { MissedSheet } from '../components/sheets'
import { toast } from '../components/toast'

const SL: [string, string][] = [['Morning', '🌅'], ['Afternoon', '☀️'], ['Evening', '🌇'], ['Night', '🌙']]
export default function Meds() {
  const S = useStore(), { t, fmtDate, fmtTime } = useI18n(), cg = S.user?.role === 'caregiver'
  const missed = S.log.filter(x => x.st === 'missed').length, name = S.ext.name.split(' ')[0]
  return <>
    <PageHead h={t('Medicines')} p={t('Your documented schedule · tap a dose to log it')}><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <button className="btn o s" onClick={() => openModal(<MissedSheet />)}>❓ {t('Missed a dose?')}</button>
      {cg && <button className="btn s" onClick={() => toast('Reminder sent to {n}', { n: name })}>🔔 {t('Remind {n}', { n: name })}</button>}</div></PageHead>
    {missed >= 2 && <div className="flag"><span>💛 {t('You have missed {n} doses recently. Is something making it hard — cost, side effects, or forgetting? Your pharmacist can help.', { n: missed })}</span></div>}
    <div className="gr k2 stag" style={{ marginTop: 12 }}>
      {SL.map(([s, ic]) => { const l = S.tasks.filter(x => x.sl === s && x.k === 'med'); return l.length ? <div className="card" key={s}><h2>{ic} {t(s)}</h2>{l.map(x => <TaskRow key={x.id} x={x} detail />)}</div> : null })}
      <div className="card"><h2>⏳ {t('Treatment duration')}</h2>{S.ext.meds.map((m, i) => <div className="it" key={i}><div><h3>{m.n}</h3><p>{t('Day {n} of {m}', { n: Math.min(S.day, m.dur), m: m.dur })}</p></div><div className="x" style={{ width: 90 }}><div className="bar"><div style={{ width: `${Math.min(100, S.day / m.dur * 100)}%` }} /></div></div></div>)}</div></div>
    <div className="card" style={{ marginTop: 16 }}><h2>🕘 {t('Dose history')} <Pv k="reported" /></h2>
      {S.log.slice(0, 8).map(x => <div className="it" key={x.id}><div className="ic2">💊</div><div><h3>{x.t}</h3><p>{fmtDate(x.at)} {fmtTime(x.at)} · {t('by')} {x.by === 'You' ? t('You') : x.by}</p></div><span className="x"><DosePill s={x.st} /></span></div>)}</div>
    <div className="flag r">⚠️ {t('We only show what your summary says. We never change a dose or suggest doubling one.')}</div></>
}
