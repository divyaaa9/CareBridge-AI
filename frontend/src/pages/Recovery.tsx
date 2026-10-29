import { useState } from 'react'
import { useI18n } from '../i18n'
import { useStore } from '../store'
import { A } from '../actions'
import { addDays, URG } from '../lib/format'
import { LineChart, PageHead, Pv } from '../components/ui'
import { TaskRow } from '../components/shared'

const MOODS = ['😞', '😕', '😐', '🙂', '😄'], SYM = ['Fever', 'Breathing difficulty', 'Pain at site', 'Dizzy', 'Tired', 'Nausea']
export default function Recovery() {
  const S = useStore(), { t, fmtDate } = useI18n(), cg = S.user?.role === 'caregiver', c = S.checks, td = c.find(x => x.d === addDays(0))
  const [pain, setPain] = useState(3), [mood, setMood] = useState(4), [sym, setSym] = useState<string[]>([]), [note, setNote] = useState(''), [concern, setConcern] = useState(false)
  const urgent = sym.some(s => URG.test(s)), rev = c.slice().reverse()
  return <>
    <PageHead h={t('Recovery')} p={t('Your own check-ins. This is patient-reported, not a medical exam.')}><Pv k="reported" /></PageHead>
    <div className="gr k2">
      <div className="card"><h2>📝 {t('Daily check-in')}</h2>
        {td ? <><div className="flag k" style={{ margin: 0 }}>✓ {t("Today's check-in is saved.")}</div><p style={{ marginTop: 10 }}>{t('Pain {n}/10', { n: td.pain })} · {t('Mood')} {MOODS[td.mood - 1]}</p></>
          : cg ? <p className="mut">{t('Only the patient can submit a check-in.')}</p> : <>
            <label>{t('Pain level')}: <b>{pain}</b>/10</label><input type="range" min={0} max={10} value={pain} onChange={e => setPain(+e.target.value)} aria-label={t('Pain level')} />
            <label style={{ marginTop: 12 }}>{t('How do you feel?')}</label>
            <div className="chips">{MOODS.map((m, i) => <button key={m} className="chip" aria-pressed={mood === i + 1} onClick={() => setMood(i + 1)}>{m}</button>)}</div>
            <label style={{ marginTop: 12 }}>{t('Any symptoms?')}</label>
            <div className="chips">{SYM.map(s => <button key={s} className="chip" aria-pressed={sym.includes(s)} onClick={() => setSym(x => x.includes(s) ? x.filter(y => y !== s) : [...x, s])}>{t(s)}</button>)}</div>
            {urgent && <div className="flag u" role="alert">🚨 {t('These can be urgent. Call 108 or go to the nearest emergency department now. Do not wait for the app.')} <a className="btn s d" href="tel:108">📞 108</a></div>}
            <label style={{ marginTop: 12 }} htmlFor="cn">{t('Notes or concerns')}</label><textarea id="cn" value={note} onChange={e => setNote(e.target.value)} placeholder={t('Anything to discuss with your doctor?')} />
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, color: 'var(--ink)' }}><input type="checkbox" checked={concern} onChange={e => setConcern(e.target.checked)} /> {t('Save as a concern for my doctor')}</label>
            <button className="btn" style={{ marginTop: 12, width: '100%' }} onClick={() => A.checkin({ d: addDays(0), pain, mood, sym, note: note.trim(), concern })}>{t('Save check-in')}</button></>}</div>
      <div className="gr" style={{ alignContent: 'start' }}>
        <div className="card"><h2>{t('Pain trend')}</h2><LineChart series={[rev.map(x => x.pain)]} colors={['#E66A4E']} lo={0} hi={10} ticks={5} labels={rev.map(x => fmtDate(x.d))} /></div>
        <div className="card"><h2>✅ {t('Recovery tasks')}</h2>{S.tasks.filter(x => x.k !== 'med').map(x => <TaskRow key={x.id} x={x} />)}</div></div></div>
    <div className="card" style={{ marginTop: 16 }}><h2>🧭 {t('Recovery timeline')}</h2><div className="tlv">
      {c.map((x, i) => <div key={i}><b>{fmtDate(x.d, { day: 'numeric', month: 'long' })}</b> · {t('Pain {n}/10', { n: x.pain })}{x.sym.length ? ' · ' + x.sym.map(s => t(s)).join(', ') : ''}{x.note && <p className="mut">{x.note}</p>}{x.concern && <span className="pill a">{t('Saved concern')}</span>}</div>)}
      <div><b>{fmtDate(S.ext.dd, { day: 'numeric', month: 'long' })}</b> · {t('Discharged from hospital')}</div></div></div></>
}
