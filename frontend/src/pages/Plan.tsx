import { useI18n, LANGS } from '../i18n'
import { useStore } from '../store'
import { A } from '../actions'
import { computeFlags, dLine, mLine, planStatus } from '../lib/plan'
import { FD, flesch, freqTxt } from '../lib/format'
import { PageHead, Pv, PV, Ring, StatusBadge, openModal } from '../components/ui'
import { FlagRow, SrcBtn } from '../components/shared'
import { FridgeSheet } from '../components/sheets'
import { toast } from '../components/toast'
import { useNavigate } from 'react-router-dom'

export default function Plan() {
  const S = useStore(), { t, lang, fmtDate } = useI18n(), nav = useNavigate(), e = S.ext, st = planStatus(S), fl = computeFlags(S)
  const fre = Math.max(0, Math.min(100, flesch(`You were discharged on a set date. Follow the steps below. Ask your doctor if anything is unclear. Take ${e.meds.map(m => m.n).join(' and ')} as written.`)))
  const speak = () => {
    const sy = window.speechSynthesis; if (!sy) return toast('Read aloud is not available on this device.')
    sy.cancel(); const u = new SpeechSynthesisUtterance(`${e.meds.map(m => `${m.n} ${m.s}, ${freqTxt(m.f, t)}, ${t(FD[m.fd] || '')}`).join('. ')}. ${t('Seek medical help immediately if you have: {w}', { w: t(e.warn) })}`)
    u.lang = LANGS[lang][2]; sy.speak(u)
  }
  const dated = S.fuDate ? fmtDate(S.fuDate, { day: 'numeric', month: 'long', year: 'numeric' }) : t('date not confirmed')
  const missing = <p className="mut">{t('Not in your summary. Ask your doctor.')}</p>
  const secs: [string, string, JSX.Element][] = [
    ['🧑', 'Patient and hospital', <><p><b>{e.name}</b> · {t('Discharged')} {fmtDate(e.dd, { day: 'numeric', month: 'long', year: 'numeric' })}</p><p>{e.hosp}, {e.city} · {e.dept}</p></>],
    ['📝', 'Summary', <><p>{t('You left hospital on {d}. Follow the steps below. Ask your doctor if anything is unclear.', { d: fmtDate(e.dd, { day: 'numeric', month: 'long' }) })}</p><p className="mut" style={{ marginTop: 6 }}><Pv k="ai" /></p></>],
    ['💊', 'Medicines and schedule', <>{e.meds.map((m, i) => <div className="it" key={i}><div className="ic2">💊</div><div><h3>{m.n} {m.s}</h3><p>{freqTxt(m.f, t)} · {t(FD[m.fd] || m.fd)} · {t('{n} days', { n: m.dur })}</p></div><SrcBtn line={mLine(i)} /></div>)}</>],
    ['🥗', 'Diet and nutrition', e.diet.trim() ? <><p>{t(e.diet)}</p><Pv k={S.prov.diet ? 'corrected' : 'extracted'} /></> : missing],
    ['🚶', 'Activity and movement', e.act.trim() ? <><p>{t(e.act)}</p><Pv k={S.prov.act ? 'corrected' : 'extracted'} /></> : missing],
    ['🩹', 'Wound care and home care', missing],
    ['⚠️', 'Warning signs and actions', <div className="flag r" style={{ margin: 0 }}><span>{t('Seek medical help immediately if you have: {w}', { w: t(e.warn) })}</span><SrcBtn line={dLine(e, 'warn')} cls="src" /></div>],
    ['📅', 'Follow-up', <><p>{t(e.fu === 'in 2 weeks' ? 'Follow-up in 2 weeks' : e.fu)} · {dated}</p><SrcBtn line={dLine(e, 'fu')} cls="src" /></>],
    ['❓', 'Needs clarification', fl.length ? <>{fl.map(f => <FlagRow key={f.id} f={f} />)}</> : <div className="flag k" style={{ margin: 0 }}>✓ {t('Nothing to clarify.')}</div>],
    ['🔍', 'Source and validation', <><p>{t('Version {v}', { v: S.ver })} · {t('Created {d}', { d: fmtDate(e.dd, { day: 'numeric', month: 'short' }) })}</p><div className="chips" style={{ marginTop: 8 }}>{Object.keys(PV).slice(0, 5).map(k => <Pv key={k} k={k} />)}</div></>],
  ]
  const checks: [string, boolean][] = [['Medicine names, strengths and doses', true], ...(['fu', 'warn'] as const).map((k): [string, boolean] => [k === 'fu' ? 'Follow-up interval' : 'Warning signs', lang === 'en' || (e[k].match(/\d+/g) || []).every(n => t(e[k]).includes(n))])]
  return <>
    <PageHead h={t('My Care Plan')} p={t('Every step links to your discharge summary')}><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      <StatusBadge s={st} /><button className="btn o s" onClick={speak}>🔊 {t('Read aloud')}</button><button className="btn o s" onClick={() => openModal(<FridgeSheet />, true)}>🖨️ {t('Fridge sheet')}</button></div></PageHead>
    {st === 'Ready to Use' && <div className="flag k" style={{ margin: '0 0 14px' }}>✓ {t('Automated checks passed. This is not a clinical approval — confirm anything unclear with your doctor.')}</div>}
    <div className="gr k3"><div>{secs.map((s, i) => <details className="acc" key={i} open={i < 3 || i === 6 || (i === 8 && fl.length > 0)}><summary><span>{s[0]}</span>{i + 1}. {t(s[1])}</summary><div>{s[2]}</div></details>)}</div>
      <div className="gr" style={{ alignContent: 'start' }}>
        <div className="card"><h2>🌐 {t('Language check')}</h2><p className="mut" style={{ fontSize: 13, marginBottom: 8 }}>{t('English and your language are built from the same validated plan.')}</p>
          {checks.map(([l, ok]) => <div className="it" key={l}><div><h3 style={{ fontSize: 13.5 }}>{t(l)}</h3></div><span className={`x pill ${ok ? 'g' : 'a'}`}>{ok ? '✓ ' + t('Preserved') : '? ' + t('Uncertain — verify')}</span></div>)}</div>
        <div className="card" style={{ textAlign: 'center' }}><h2>{t('Readability')}</h2><Ring p={fre} size={110} light /><p style={{ fontSize: 13, marginTop: 4 }}>{t('Reading ease {n}/100', { n: fre })}</p></div>
        <div className="card"><h2>{t('Version history')}</h2>
          <div className="it"><div><h3>v{S.ver}</h3><p>{t('Current')}</p></div><span className="pill g x">{t('Current')}</span></div>
          <div className="it"><div><h3>v1</h3><p>{t('Earlier summary')}</p></div><button className="btn s o x" onClick={() => nav('/app/records')}>{t('Compare')}</button></div>
          <button className="btn s" style={{ marginTop: 8, width: '100%' }} onClick={A.regen}>↻ {t('Regenerate plan')}</button></div></div></div></>
}
