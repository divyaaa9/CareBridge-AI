import { useEffect, useRef, useState, type ReactNode, type MouseEvent as RME } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'
import { Pv } from '../components/ui'
import { LangMenu, TranslateBanner } from '../components/LangMenu'
import { IosInstallSheet } from '../components/sheets'
import { openModal } from '../components/ui'
import { LANGS } from '../i18n'
import { useInstall } from '../pwa'
import './landing.css'

type TFn = (s: string, v?: Record<string, string | number>) => string
const TAB = ['🏠', '📋', '💊', '🩺', '☰']
const Row = ({ ic, b, sub, pill, cls = 'l' }: { ic: string; b: string; sub?: ReactNode; pill?: string; cls?: string }) =>
  <div className="pm-r"><i>{ic}</i><div><b>{b}</b>{sub}</div>{pill && <span className={`pill ${cls}`}>{pill}</span>}</div>

const PHS: { k: string; ic: string; d: string; tab: number; h: (t: TFn) => ReactNode }[] = [
  { k: 'Home', ic: '🏠', d: "Today's medicines, tasks and next visit at a glance.", tab: 0, h: t => <div>
    <b className="pm-h">{t('Good morning')}, Ravi</b><span className="mut">{t('Day {n} of {m} · Your recovery plan', { n: 8, m: 14 })}</span>
    <div className="pm-r" style={{ background: 'var(--ink)', color: '#fff', border: 0, marginTop: 10 }}><div style={{ flex: 1 }}><b>{t('Recovery progress')} · 67%</b><div className="bar" style={{ background: '#fff3' }}><div style={{ width: '67%', background: 'var(--amb)' }} /></div></div></div>
    <Row ic="💊" b="Metformin 500 mg" sub="8:00 AM" pill={'✓ ' + t('Taken')} cls="g" /><Row ic="💊" b="Amlodipine 5 mg" sub="8:00 AM" pill={t('Due')} cls="a" /><Row ic="📅" b={t('Follow-up')} sub={t('Not Booked')} pill="!" cls="c" /></div> },
  { k: 'Upload & review', ic: '📄', d: 'We read your PDF or photo, then you check every detail.', tab: 1, h: t => <div>
    <b className="pm-h">{t('Review extracted details')}</b>
    <div className="scan">Tab. Pantoprazole 40 mg 1-0-1 a/f<br />Tab. Amlodipine 5 mg 1-0-0 a/f<br />f/u in 2 weeks<br />R/v if fever…</div>
    <Row ic="💊" b="Pantoprazole 40 mg" sub={<Pv k="extracted" />} pill="98%" cls="g" /><Row ic="💊" b="Metformin 500 mg" sub={<Pv k="uncertain" />} pill="64% ⚑" cls="a" /></div> },
  { k: 'Care plan', ic: '📋', d: 'Plain-language plan with validation status and sources.', tab: 1, h: t => <div>
    <b className="pm-h">{t('My Care Plan')}</b><div style={{ margin: '6px 0' }}><span className="pill a">⚑ {t('Needs Clarification')}</span> <span className="pill l">EN · తె</span></div>
    {['Medicines', 'Diet', 'Activity', 'Warning signs', 'Follow-up'].map((x, i) => <Row key={x} ic={['💊', '🥗', '🚶', '⚠️', '📅'][i]} b={t(x)} pill="📄" />)}</div> },
  { k: 'Medicines', ic: '💊', d: 'Log doses as taken, late, missed, skipped or unsure.', tab: 2, h: t => <div>
    <b className="pm-h">{t('Medicines')}</b><b style={{ display: 'block', marginTop: 8 }}>🌅 {t('Morning')}</b>
    <Row ic="💊" b="Pantoprazole 40 mg" sub={t('Before food')} pill="✓" cls="g" /><Row ic="💊" b="Amlodipine 5 mg" sub={t('Before food')} pill={t('Due')} cls="a" />
    <b style={{ display: 'block', marginTop: 8 }}>🌙 {t('Night')}</b><Row ic="💊" b="Pantoprazole 40 mg" sub="8:30 PM" pill={t('Due')} />
    <div className="pm-r" style={{ background: '#E66A4E14' }}><i>❓</i><div><b>{t('Missed a dose?')}</b>{t('Never double a dose')}</div></div></div> },
  { k: 'Ask CareBridge', ic: '💬', d: 'Questions answered only from your own summary, with the source shown.', tab: 4, h: t => <div>
    <b className="pm-h">{t('Ask CareBridge')}</b><div className="pm-b pm-u">{t('When is my next visit?')}</div>
    <div className="pm-b pm-a">{t('Your summary says follow-up is in 2 weeks. No exact date is given, so please confirm it with the hospital.')}<br /><span className="pill l" style={{ marginTop: 6 }}>📄 {t('Source')} · L6</span></div></div> },
  { k: 'Appointments', ic: '📅', d: "Find the hospital's booking page and track every visit status.", tab: 4, h: t => <div>
    <b className="pm-h">{t('Appointments')}</b>
    <div className="pm-r" style={{ display: 'block' }}><b>{t('Cardiology follow-up')}</b><span className="pill c">○ {t('Not Booked')}</span><div className="bar"><div style={{ width: '25%' }} /></div></div>
    <b style={{ display: 'block', marginTop: 8 }}>{t('Hospital sources')}</b>
    <Row ic="🏥" b="sunrise-hospital.example" pill={'✓ ' + t('Verified')} cls="g" /><Row ic="🔗" b="bookmydoc.example" pill={'? ' + t('Unverified')} cls="a" /></div> },
]
function Phone({ i }: { i: number }) {
  const { t } = useI18n()
  return <div className="ph"><div className="sbar"><span>9:41</span><span>●●● ▮</span></div><div className="scr" key={i}>{PHS[i].h(t)}</div>
    <div className="tb2">{['Home', 'Plan', 'Meds', 'Recovery', 'More'].map((x, j) => <div key={x} className={PHS[i].tab === j ? 'on' : ''}><b>{TAB[j]}</b>{t(x)}</div>)}</div></div>
}
const sc = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches

/* ---------- synthetic demo data (not a real patient) ---------- */
const DOC: [string, string][] = [
  ['Tab. Amlodipine 5 mg 1-0-0 a/f', 'Amlodipine 5 mg · morning, before food'],
  ['Tab. Metformin 500 mg 1-0-1 p/c', 'Metformin 500 mg · AM + PM, after food'],
  ['F/u Cardiology OPD in 2 wks.', 'Cardiology visit · in 2 weeks'],
  ['R/v if fever, black stools', 'Get help: fever, black stools'],
]
function DocCard() { // a discharge note that decodes itself, line by line
  const { t } = useI18n(), [s, setS] = useState(0)
  useEffect(() => {
    if (reduced()) { setS(DOC.length); return }
    const id = window.setInterval(() => setS(x => (x + 1) % (DOC.length + 3)), 1100)
    return () => clearInterval(id)
  }, [])
  return <div className="fl lp-doc"><div className="lp-dh"><b>discharge-summary.pdf</b><span className="pill l">{t('Demo')}</span></div>
    {DOC.map(([a, b], i) => <div key={a} className={`lp-dl${s > i ? ' ok' : ''}`}><span className="raw">{a}</span><span className="clr">{b}</span></div>)}
    <i className="lp-beam" /></div>
}

const CYC: [string, string, string][] = [ // [lang code, label, text]
  ['en', 'English', 'Your recovery plan'], ['te', 'తెలుగు', 'మీ రికవరీ ప్లాన్'], ['hi', 'हिन्दी', 'आपकी रिकवरी योजना'],
  ['ta', 'தமிழ்', 'உங்கள் மீட்பு திட்டம்'], ['kn', 'ಕನ್ನಡ', 'ನಿಮ್ಮ ಚೇತರಿಕೆ ಯೋಜನೆ'], ['bn', 'বাংলা', 'আপনার পুনরুদ্ধার পরিকল্পনা'], ['es', 'Español', 'Su plan de recuperación'],
]
function LangCycle() {
  const [i, setI] = useState(0)
  useEffect(() => {
    if (reduced()) return
    const id = window.setInterval(() => setI(x => (x + 1) % CYC.length), 2400)
    return () => clearInterval(id)
  }, [])
  const c = CYC[i]
  return <div className="lp-cyc" aria-hidden="true">🌐 <b key={i} lang={c[0]}>{c[2]}</b><i>{c[1]}</i></div>
}

const DEC: { raw: string; en: string; te: string }[] = [
  { raw: 'Dx: Acute gastritis; HTN; T2DM', en: 'Stomach lining inflammation (gastritis). You also have high blood pressure and type 2 diabetes.', te: 'కడుపు లోపలి పొర వాపు (గ్యాస్ట్రైటిస్). అధిక రక్తపోటు మరియు టైప్ 2 మధుమేహం కూడా ఉన్నాయి.' },
  { raw: 'Tab. Pantoprazole 40 mg 1-0-1 a/f', en: 'Pantoprazole 40 mg: morning and night, before food.', te: 'Pantoprazole 40 mg: ఉదయం మరియు రాత్రి, భోజనానికి ముందు.' },
  { raw: 'Tab. Metformin 500 mg 1-0-1 p/c', en: 'Metformin 500 mg: morning and night, after food.', te: 'Metformin 500 mg: ఉదయం మరియు రాత్రి, భోజనం తర్వాత.' },
  { raw: 'F/u Cardiology OPD in 2 wks.', en: 'See the cardiologist in 2 weeks. No date is given, so ask the hospital.', te: '2 వారాల్లో కార్డియాలజిస్ట్‌ను కలవండి. తేదీ ఇవ్వలేదు, ఆసుపత్రిని అడగండి.' },
  { raw: 'R/v immediately if fever, black stools, chest pain.', en: 'Get medical help right away for fever, black stools or chest pain.', te: 'జ్వరం, నల్లని మలం లేదా ఛాతీ నొప్పి ఉంటే వెంటనే వైద్య సహాయం తీసుకోండి.' },
]
function Decode() { // drag to turn clinical shorthand into a plain, source-linked plan
  const { t } = useI18n(), [p, setP] = useState(4), [lang, setLang] = useState<'en' | 'te'>('en'), [drag, setDrag] = useState(false)
  const ref = useRef<HTMLDivElement>(null), done = useRef(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const io = new IntersectionObserver(es => { if (es[0].isIntersecting && !done.current) { done.current = true; setP(58) } }, { threshold: 0.4 })
    io.observe(el); return () => io.disconnect()
  }, [])
  const L = lang === 'te' ? 'te' : undefined
  return <>
    <div className="lp-bar"><span>{t('Original note')} ⟷ {t('Plain language')}</span>
      <div className="lp-tg" role="group" aria-label={t('Language')}>
        <button type="button" aria-pressed={lang === 'en'} onClick={() => setLang('en')}>EN</button>
        <button type="button" lang="te" aria-pressed={lang === 'te'} onClick={() => setLang('te')}>తె</button></div></div>
    <div ref={ref} className={`lp-dec${drag ? ' drag' : ''}`} style={{ ['--p' as string]: `${p}%` }}>
      <div className="lp-raw" aria-hidden="true">{DEC.map((d, i) => <div className="lp-rr" key={i}><span>L{i + 1}</span><code>{d.raw}</code></div>)}</div>
      <div className="lp-clr">{DEC.map((d, i) => <div className="lp-cr" key={i}><p lang={L}>{d[lang]}</p><span className="lp-chip">📄 {t('Source')} · L{i + 1}</span></div>)}</div>
      <div className="lp-hdl" aria-hidden="true"><i /></div>
      <input type="range" min={0} max={100} value={p} aria-label={t('Drag to reveal the plain-language version')}
        onChange={e => setP(+e.target.value)} onPointerDown={() => setDrag(true)} onPointerUp={() => setDrag(false)} onPointerCancel={() => setDrag(false)} onBlur={() => setDrag(false)} />
    </div>
    <p className="lp-note3">{t('Demo with a synthetic note, not a real patient. Medicine names and doses are copied exactly as written; translation is automatic, so have a person check it before real use.')}</p></>
}

/* ---------- Ask CareBridge: answers only from the note, urgent words first ---------- */
const CH_SRC: Record<number, string> = { 2: 'Tab. Pantoprazole 40 mg 1-0-1 a/f', 3: 'Tab. Metformin 500 mg 1-0-1 p/c', 4: 'Soft, low-salt diet. Avoid spicy food.', 5: 'F/u Cardiology OPD in 2 wks.', 6: 'R/v immediately if fever, black stools, chest pain.' }
type Ans = { text: string; src?: number[]; urgent?: boolean; none?: boolean }
function answer(q: string): Ans {
  const s = q.toLowerCase()
  if (/(chest pain|breath|fever|black stool|bleed|faint|unconscious|seizure)/.test(s)) return { urgent: true, src: [6], text: 'This may be urgent. Call 108 or go to the nearest emergency department now. Do not wait for an answer here.' }
  if (/(next visit|follow|appointment|cardiolog|when)/.test(s)) return { src: [5], text: 'Your summary says the cardiology follow-up is in 2 weeks. No exact date is given, so please confirm it with the hospital.' }
  if (/(double|miss|forgot|skip)/.test(s)) return { none: true, text: 'Your summary does not say what to do after a missed dose. Never double a dose. Please ask your doctor or pharmacist.' }
  if (/(diet|eat|salt|spicy|meal)/.test(s)) return { src: [4], text: 'Your summary says: soft, low-salt food, and avoid spicy food.' }
  if (/(metformin|pantoprazole|medicine|tablet|dose|pill|food)/.test(s)) return { src: [2, 3], text: 'Pantoprazole 40 mg: morning and night, before food. Metformin 500 mg: morning and night, after food.' }
  return { none: true, text: 'That is not in your summary, so I will not guess. Please ask your doctor.' }
}
const ASKS = ['When is my next visit?', 'Can I double a missed dose?', 'What should I eat?', 'Can I drink alcohol?', 'I have chest pain']
function Typed({ text, go }: { text: string; go: boolean }) {
  const [n, setN] = useState(go ? 0 : text.length)
  useEffect(() => {
    if (!go || reduced()) { setN(text.length); return }
    setN(0); const id = window.setInterval(() => setN(x => { if (x >= text.length) { clearInterval(id); return x } return x + 2 }), 18)
    return () => clearInterval(id)
  }, [text, go])
  return <>{text.slice(0, n)}</>
}
function Chat() {
  const { t } = useI18n()
  const [log, setLog] = useState<{ q: string; a: Ans }[]>([]), [q, setQ] = useState('')
  const end = useRef<HTMLDivElement>(null)
  const ask = (x: string) => { const v = x.trim(); if (!v) return; setLog(l => [...l.slice(-3), { q: v, a: answer(v) }]); setQ('') }
  useEffect(() => { const el = end.current; if (el && log.length) el.scrollTop = el.scrollHeight }, [log])
  return <div className="lp-chat">
    <div className="lp-ch"><b>💬 CareBridge</b><span className="pill l">{t('Answers only from your summary')}</span></div>
    <div className="lp-cm" ref={end} aria-live="polite">
      {!log.length && <p className="lp-empty">{t('Pick a question or type your own. Try one that is not in the note.')}</p>}
      {log.map((m, i) => <div key={i}><div className="pm-b pm-u lp-b">{m.q}</div>
        {m.a.urgent && <div className="lp-urg" role="alert">🚨 {t('Possible emergency')} · <a href="tel:108">{t('Call 108')}</a></div>}
        <div className={`pm-b pm-a lp-b${m.a.none ? ' none' : ''}`}><Typed text={t(m.a.text)} go={i === log.length - 1} />
          {m.a.src && <div className="lp-srcs">{m.a.src.map(n => <span key={n}><b className="pill l">📄 {t('Source')} · L{n}</b> <code>{CH_SRC[n]}</code></span>)}</div>}
          {m.a.none && <div className="lp-srcs"><b className="pill a">{t('Not in your summary')}</b></div>}</div></div>)}
    </div>
    <div className="lp-qs">{ASKS.map(a => <button key={a} type="button" onClick={() => ask(a)}>{t(a)}</button>)}</div>
    <form className="lp-in" onSubmit={e => { e.preventDefault(); ask(q) }}><input value={q} onChange={e => setQ(e.target.value)} placeholder={t('Ask about your summary…')} aria-label={t('Ask about your summary')} /><button className="btn s" type="submit">{t('Ask')}</button></form>
  </div>
}

/* ---------- Recovery journey: scrub through 14 days ---------- */
const PAIN = [8, 8, 7, 7, 6, 6, 5, 5, 4, 4, 3, 3, 2, 2]
const DOSES = ['Amlodipine 5 mg · Morning', 'Pantoprazole 40 mg · Morning', 'Metformin 500 mg · Morning', 'Pantoprazole 40 mg · Night', 'Metformin 500 mg · Night']
const ODD: Record<number, [number, 'late' | 'missed' | 'unsure']> = { 4: [4, 'missed'], 7: [1, 'late'], 10: [3, 'unsure'], 12: [2, 'late'] }
const MILE: Record<number, string> = { 1: 'First day home. Plan and reminders are on.', 4: 'A missed dose was logged. It was never doubled.', 8: 'Halfway. Pain is trending down.', 14: 'Follow-up visit due. Confirm the date with the hospital.' }
function Journey() {
  const { t } = useI18n(), [d, setD] = useState(1), ref = useRef<HTMLDivElement>(null), done = useRef(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const io = new IntersectionObserver(es => {
      if (es[0].isIntersecting && !done.current) { done.current = true; if (reduced()) { setD(8); return } let x = 1; const id = window.setInterval(() => { x++; setD(x); if (x >= 8) clearInterval(id) }, 140) }
    }, { threshold: 0.4 }); io.observe(el); return () => io.disconnect()
  }, [])
  const st = (day: number, i: number) => ODD[day]?.[0] === i ? ODD[day][1] : 'taken'
  let ok = 0, tot = 0; for (let x = 1; x <= d; x++) for (let i = 0; i < 5; i++) { tot++; if (st(x, i) === 'taken' || st(x, i) === 'late') ok++ }
  const pct = Math.round(d / 14 * 100), R = 46, C = 2 * Math.PI * R
  const X = (i: number) => 24 + i * (512 / 13), Y = (v: number) => 20 + (8 - v) * 17
  const pts = PAIN.map((v, i) => `${X(i)},${Y(v)}`)
  const cls: Record<string, string> = { taken: 'g', late: 'a', missed: 'c', unsure: 'l' }
  const lab: Record<string, string> = { taken: '✓ Taken', late: 'Late', missed: 'Missed', unsure: '? Unsure' }
  const ms = MILE[Object.keys(MILE).map(Number).filter(k => k <= d).pop() ?? 1]
  return <div className="lp-jr" ref={ref}>
    <div className="lp-jt"><svg viewBox="0 0 560 190" role="img" aria-label={t('Pain trend over 14 days')}>
      {[0, 2, 4, 6, 8].map(v => <g key={v}><line x1="24" x2="536" y1={Y(v)} y2={Y(v)} stroke="var(--sand)" /><text x="0" y={Y(v) + 4} fontSize="10" fill="var(--mut)">{v}</text></g>)}
      <polyline points={pts.join(' ')} fill="none" stroke="var(--sand)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={pts.slice(0, d).join(' ')} fill="none" stroke="var(--coral)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      {ODD[d] && ODD[d][1] === 'missed' && <text x={X(d - 1)} y={Y(PAIN[d - 1]) - 14} fontSize="11" textAnchor="middle" fill="var(--coral)">⚑</text>}
      <circle cx={X(d - 1)} cy={Y(PAIN[d - 1])} r="9" fill="var(--coral)" opacity=".2" /><circle cx={X(d - 1)} cy={Y(PAIN[d - 1])} r="5.5" fill="var(--coral)" stroke="#fff" strokeWidth="2" />
      <text x="24" y="186" fontSize="10" fill="var(--mut)">{t('Day')} 1</text><text x="536" y="186" fontSize="10" textAnchor="end" fill="var(--mut)">{t('Day')} 14</text></svg>
      <div className="lp-pn">{t('Pain')} <b>{PAIN[d - 1]}/10</b></div></div>
    <div className="lp-jr2">
      <svg width="116" height="116" viewBox="0 0 116 116" aria-hidden="true"><circle cx="58" cy="58" r={R} fill="none" stroke="var(--lav)" strokeWidth="10" /><circle cx="58" cy="58" r={R} fill="none" stroke="var(--coral)" strokeWidth="10" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)} transform="rotate(-90 58 58)" style={{ transition: 'stroke-dashoffset .4s' }} />
        <text x="58" y="56" textAnchor="middle" fontSize="22" fontWeight="700" fill="var(--ink)">{pct}%</text><text x="58" y="73" textAnchor="middle" fontSize="10" fill="var(--mut)">{t('Day')} {d}/14</text></svg>
      <div><b className="lp-ms">{t(ms)}</b><div className="mut" style={{ fontSize: 13, marginTop: 4 }}>{t('Doses logged on time or late')}: <b>{ok}/{tot}</b></div></div></div>
    <ul className="lp-dl2">{DOSES.map((n, i) => { const k = st(d, i); return <li key={n}><span>{n}</span><span className={`pill ${cls[k]}`}>{t(lab[k])}</span></li> })}</ul>
    <input className="lp-rng" type="range" min={1} max={14} value={d} onChange={e => setD(+e.target.value)} aria-label={t('Scrub through your 14-day recovery')} style={{ ['--v' as string]: `${(d - 1) / 13 * 100}%` }} />
  </div>
}

/* ---------- Language lab: same instruction, many languages, drug name untouched ---------- */
const LAB: [string, string, string][] = [
  ['en', 'English', 'Take after food, morning and night.'], ['te', 'తెలుగు', 'భోజనం తర్వాత, ఉదయం మరియు రాత్రి తీసుకోండి.'], ['hi', 'हिन्दी', 'खाने के बाद, सुबह और रात को लें।'],
  ['ta', 'தமிழ்', 'உணவுக்குப் பிறகு, காலை மற்றும் இரவு எடுத்துக்கொள்ளுங்கள்.'], ['kn', 'ಕನ್ನಡ', 'ಊಟದ ನಂತರ, ಬೆಳಿಗ್ಗೆ ಮತ್ತು ರಾತ್ರಿ ತೆಗೆದುಕೊಳ್ಳಿ.'], ['bn', 'বাংলা', 'খাওয়ার পরে, সকালে ও রাতে খান।'], ['es', 'Español', 'Tómelo después de comer, por la mañana y por la noche.'],
]
function LangLab() {
  const { t } = useI18n(), [i, setI] = useState(0), [auto, setAuto] = useState(true)
  useEffect(() => {
    if (!auto || reduced()) return
    const id = window.setInterval(() => setI(x => (x + 1) % LAB.length), 3200); return () => clearInterval(id)
  }, [auto])
  const c = LAB[i]
  return <div className="lp-lab">
    <div className="lp-lt" role="tablist" aria-label={t('Language')}>{LAB.map((l, j) => <button key={l[0]} role="tab" aria-selected={j === i} lang={l[0]} onClick={() => { setI(j); setAuto(false) }}>{l[1]}</button>)}</div>
    <div className="lp-lc"><div className="lp-med">💊 Metformin 500 mg <span className="pill g">{t('never translated')}</span></div>
      <p key={i} lang={c[0]}>{c[2]}</p><small>{t('Machine-translated demo. A person should check translated medical text before real use.')}</small></div></div>
}

export default function Landing() {
  const { t } = useI18n(), ins = useInstall()
  const [pi, setPi] = useState(0), [tick, setTick] = useState(0), visible = useRef(false), box = useRef<HTMLDivElement>(null), prog = useRef<HTMLDivElement>(null)
  const set = (i: number) => { setPi(i); setTick(x => x + 1) }
  const mv = (e: RME<HTMLElement>) => { const r = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`); e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`) }
  useEffect(() => { // reveal on scroll
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('vis'); io.unobserve(e.target) } }), { threshold: 0.12 })
    document.querySelectorAll('.rv').forEach(el => io.observe(el)); return () => io.disconnect()
  }, [])
  useEffect(() => { // autoplay only while the phone is on screen
    const el = box.current; if (!el) return
    const io = new IntersectionObserver(es => { visible.current = es[0].isIntersecting }, { threshold: 0.3 }); io.observe(el)
    const id = window.setInterval(() => { if (visible.current && !reduced()) { setPi(p => (p + 1) % PHS.length); setTick(x => x + 1) } }, 5500)
    return () => { io.disconnect(); clearInterval(id) }
  }, [])
  useEffect(() => { // thin reading-progress line
    const on = () => { const h = document.documentElement, m = h.scrollHeight - h.clientHeight; if (prog.current) prog.current.style.transform = `scaleX(${m > 0 ? h.scrollTop / m : 0})` }
    on(); addEventListener('scroll', on, { passive: true }); return () => removeEventListener('scroll', on)
  }, [])
  useEffect(() => { // card spotlight + magnetic hero buttons
    if (reduced()) return
    const on = (e: PointerEvent) => { const el = (e.target as HTMLElement).closest<HTMLElement>('.stp,.lp-spot'); if (el) { const r = el.getBoundingClientRect(); el.style.setProperty('--mx', `${e.clientX - r.left}px`); el.style.setProperty('--my', `${e.clientY - r.top}px`) } }
    addEventListener('pointermove', on, { passive: true })
    const bs = Array.from(document.querySelectorAll<HTMLElement>('.hin .btn')), offs: (() => void)[] = []
    bs.forEach(b => {
      const mm = (e: MouseEvent) => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px,${(e.clientY - r.top - r.height / 2) * 0.28}px)` }
      const ml = () => { b.style.transform = '' }
      b.addEventListener('mousemove', mm); b.addEventListener('mouseleave', ml); offs.push(() => { b.removeEventListener('mousemove', mm); b.removeEventListener('mouseleave', ml) })
    })
    return () => { removeEventListener('pointermove', on); offs.forEach(f => f()) }
  }, [])
  const rv = 'rv'
  return <>
    <div className="lp-prog" ref={prog} aria-hidden="true" />
    <nav className="top" aria-label="Main"><Link className="logo" to="/"><i>♥</i><span>CARE<em>BRIDGE</em> <em>AI</em></span></Link>
      <div className="nl"><button onClick={() => sc('decode')}>{t('See it decode')}</button><button onClick={() => sc('app')}>{t('See the app')}</button><button onClick={() => sc('how')}>{t('How it works')}</button><button onClick={() => sc('why')}>{t('Why CareBridge')}</button></div>
      <div className="nr"><LangMenu /><Link className="btn s o" to="/login">{t('Sign in')}</Link><Link className="btn s" to="/login?m=up">{t('Get started')}</Link></div></nav>
    <TranslateBanner />
    <main id="main">
      <header className="hero" onMouseMove={mv}><i className="blob b1" /><i className="blob b2" /><i className="blob b3" /><i className="lp-glow" aria-hidden="true" /><i className="lp-dots" aria-hidden="true" />
        <div className="hin"><div>
          <div className="tag">{t('Your recovery companion')}</div>
          <h1 style={{ marginTop: 12 }}>{t('From hospital discharge to')}<span>{t('confident recovery.')}</span></h1>
          <p className="lead">{t('Upload your discharge summary. Get a clear, source-linked daily plan in your own language — medicines, meals, activity and follow-ups.')}</p>
          <LangCycle />
          <div><Link className="btn" to="/login?m=up">{t('Start your recovery plan')} →</Link> <button className="btn o" onClick={() => sc('decode')}>{t('See it decode')}</button></div>
          <div className="trust"><span>🔗 <b>{t('Source-linked')}</b></span><span>🌐 <b>{t('40+ languages')}</b></span><span>🛡️ <b>{t('You control sharing')}</b></span></div></div>
          <div className="scene" id="scene" aria-hidden="true"><div className="sway"><div className="stage" id="stage"><Phone i={0} />
            <DocCard /><div className="fl f2">🌐 {t('Your language')}</div><div className="fl f3">🔗 {t('Source-linked')}</div><div className="fl" style={{ right: -70, top: 70, ['--z' as string]: '170px' }}>💊 {t('Dose taken')} ✓</div></div></div></div></div></header>
      <section className="sec" id="decode"><div className={`tag ${rv}`}>{t('Try it')}</div><h2 className={`disp big ${rv}`}>{t('Drag to decode your discharge note.')}</h2>
        <Decode /></section>
      <section className="sec" id="ask"><div className={`tag ${rv}`}>{t('Safe by design')}</div><h2 className={`disp big ${rv}`}>{t('Ask anything. It only answers from your note.')}</h2>
        <Chat /></section>
      <section className="sec" id="journey" style={{ paddingTop: 0 }}><div className={`tag ${rv}`}>{t('Your 14 days')}</div><h2 className={`disp big ${rv}`}>{t('Drag through your recovery.')}</h2>
        <Journey /><p className="lp-note3">{t('Synthetic data for illustration only.')}</p></section>
      <section className="sec" id="app"><div className="show"><div>
        <div className={`tag ${rv}`}>{t('The mobile app')}</div><h2 className={`disp big ${rv}`}>{t('Your whole recovery, in your pocket.')}</h2>
        <div className="ftabs" role="tablist">{PHS.map((p, i) => <button key={p.k} className={`ftab ${rv}`} role="tab" aria-selected={i === pi} onClick={() => set(i)} style={{ transitionDelay: `${i * 60}ms` }}>
          <span className="ic">{p.ic}</span><span><h3>{t(p.k)}</h3><p>{t(p.d)}</p></span><i key={i === pi ? tick : 'n'} /></button>)}</div></div>
        <div className="scene" style={{ height: 640, perspective: 1400 }} ref={box}><div className="stage" style={{ ['--rx' as string]: '4deg', ['--ry' as string]: '-10deg', animation: 'none' }}><Phone i={pi} /></div></div></div></section>
      <section className="sec" id="how"><div className={`tag ${rv}`}>{t('How it works')}</div><h2 className={`disp big ${rv}`}>{t('One document. A clearer recovery.')}</h2>
        <div className="steps">{[['1', '📄', 'var(--lav)', 'Upload', 'Add your discharge summary as a PDF or photo.'], ['2', '✨', '#E9AA3B44', 'Understand', 'We read it, explain the terms and flag anything unclear.'], ['3', '✅', '#6C927544', 'Follow', 'Get reminders, a daily checklist and a visit tracker.']].map((s, i) =>
          <div key={s[0]} className={`stp ${rv}`} data-tilt style={{ transitionDelay: `${i * 120}ms` }}><div className="n">{s[0]}</div><div className="ic" style={{ background: s[2] }}>{s[1]}</div><h3 className="disp" style={{ fontSize: 28 }}>{t(s[3])}</h3><p>{t(s[4])}</p></div>)}</div></section>
      <section className="sec" id="why" style={{ paddingTop: 0 }}><div className={`tag ${rv}`}>{t('Why CareBridge')}</div><h2 className={`disp big ${rv}`}>{t('Clear. Safe. In your language.')}</h2>
        <div className="steps">{[['🔗', 'Source-linked', 'Every instruction points back to your summary.'], ['🌐', 'Multilingual', 'One validated plan, shown in your own language.'], ['🛡️', 'You stay in control', 'We never invent medical advice. Share only what you choose.']].map((s, i) =>
          <div key={s[1]} className={`stp ${rv}`} data-tilt style={{ transitionDelay: `${i * 120}ms` }}><div className="ic" style={{ background: 'var(--peach)' }}>{s[0]}</div><h3>{t(s[1])}</h3><p>{t(s[2])}</p></div>)}</div></section>
      <section className="sec" id="langs"><div className={`tag ${rv}`}>{t('Your language')}</div><h2 className={`disp big ${rv}`}>{t('Understand your care in 40+ languages.')}</h2>
        <LangLab />
        <div className="marq" aria-hidden="true" style={{ marginTop: 28 }}><div>{[...Object.keys(LANGS), ...Object.keys(LANGS)].map((c, i) => <span key={i}>{LANGS[c][0]}</span>)}</div></div>
        <p className="mut" style={{ marginTop: 14 }}>{t('Translated automatically with Google Translate. Medicine names and doses stay as written in your document.')}</p></section>
      <section className="sec" id="install" style={{ paddingTop: 0 }}><div className={`card instcard ${rv}`} data-tilt><div><div className="tag">{t('Web and mobile')}</div><h2 className="disp" style={{ fontSize: 'clamp(28px,4vw,42px)', margin: '6px 0' }}>{t('Use it on the web, or install it as an app.')}</h2>
        <p className="mut">{t('Works offline for your saved plan. Reminders keep working on your phone.')}</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
          {ins.installed ? <span className="pill g">✓ {t('Installed')}</span> : ins.canPrompt ? <button className="btn" onClick={() => void ins.install()}>📲 {t('Install app')}</button> : ins.ios ? <button className="btn" onClick={() => openModal(<IosInstallSheet />)}>📲 {t('Install on iPhone')}</button> : null}
          <Link className="btn o" to="/login?m=up">{t('Open web app')}</Link>
          <span className="store" aria-disabled="true">▶ Google Play · {t('Coming soon')}</span><span className="store" aria-disabled="true"> App Store · {t('Coming soon')}</span></div></div>
        <div className="mini3d" aria-hidden="true"><div className="ph" style={{ position: 'relative', width: 150, height: 290, borderWidth: 6 }} /></div></div></section>
      <section className={`cta ${rv}`}><h2 className="disp">{t('Go home with a plan, not a pile of paper.')}</h2><p>{t('CareBridge AI explains your instructions. It does not replace your doctor.')}</p><Link className="btn" to="/login?m=up">{t('Create free account')} →</Link></section>
    </main>
    <footer className="ft"><span>© 2026 CareBridge AI · BroCoders</span><span>{t('Demo uses synthetic data. Not medical advice.')}</span></footer></>
}
