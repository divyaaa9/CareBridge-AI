import { useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n'
import { useStore } from '../store'
import { A } from '../actions'
import { avgAdh, computeFlags, isDone, nextAppt, planStatus, streak, toMin } from '../lib/plan'
import { useNow } from '../lib/useNow'
import { haptic } from '../native'
import { ApptPill, BarChart, LineChart, PageHead, Pv, Ring, StatusBadge } from '../components/ui'
import { FlagRow } from '../components/shared'

export default function Home() {
  const S = useStore(), { t, fmtDate } = useI18n(), go = useNavigate(), cg = S.user?.role === 'caregiver', now = useNow()
  const h = now.getHours(), cur = h * 60 + now.getMinutes(), g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  const st = planStatus(S), fl = computeFlags(S).filter(x => x.lvl !== 'info')
  const meds = S.tasks.filter(x => x.k === 'med'), md = meds.filter(isDone).length, na = nextAppt(S), ci = S.checks[0]
  const done = S.tasks.filter(isDone).length, pct = Math.round(done / S.tasks.length * 100), sk = streak(S)
  const next = S.tasks.filter(x => x.k === 'med' && !x.st).sort((a, b) => toMin(a.tm) - toMin(b.tm))[0]
  const diff = next ? toMin(next.tm) - cur : 0
  const when = diff > 90 ? t('in {h} h', { h: Math.round(diff / 60) }) : diff > 0 ? t('in {m} min', { m: diff }) : diff === 0 ? t('now') : -diff <= 90 ? t('{m} min overdue', { m: -diff }) : t('Overdue')
  const days = Array.from({ length: 7 }, (_, i) => S.day - 6 + i), rev = S.checks.slice().reverse()
  const timeline = S.tasks.slice().sort((a, b) => toMin(a.tm) - toMin(b.tm))
  const quick: [string, string, string][] = cg ? [['💊', 'Medicines', '/app/meds'], ['🩺', 'Recovery', '/app/recovery'], ['📅', 'Appointments', '/app/appts'], ['💬', 'Ask CareBridge', '/app/ask']]
    : [['💊', 'Log a dose', '/app/meds'], ['📝', 'Check-in', '/app/recovery'], ['💬', 'Ask CareBridge', '/app/ask'], ['⬆️', 'Upload', '/app/upload'], ['👪', 'Share', '/app/family']]
  return <>
    <PageHead h={`${t(g)}, ${cg ? S.user!.name : S.ext.name.split(' ')[0]}`} p={`${new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })} · ${t('Day {n} of {m} · Your recovery plan', { n: S.day, m: S.total })}`}>
      <StatusBadge s={st} /></PageHead>
    {cg && <div className="flag k" style={{ margin: '0 0 16px' }}>👁️ {t("Viewing {n}'s shared records", { n: S.ext.name.split(' ')[0] })}</div>}
    <div className="qa stag" role="list">{quick.map(q => <button key={q[1]} role="listitem" className="qbtn" onClick={() => { haptic(); go(q[2]) }}><span>{q[0]}</span>{t(q[1])}</button>)}</div>
    <div className="gr k3 stag" style={{ marginTop: 16 }}>
      <div className="hero2" data-tilt><Ring p={pct} size={140} color="#E9AA3B" />
        <div style={{ flex: 1, minWidth: 190 }}><div className="tag" style={{ color: '#F6B9A8' }}>{t('Current care plan')}</div><h2 className="disp">{pct}% {t('done today')}</h2>
          <p style={{ margin: '6px 0 10px' }}>{t('{a} of {b} tasks done today', { a: done, b: S.tasks.length })}</p>
          <div className="chips"><span className="pill" style={{ background: '#fff', color: 'var(--ink)' }}>🔥 {t('{n}-day streak', { n: sk })}</span><button className="btn s o" onClick={() => go('/app/plan')} style={{ background: '#fff3', color: '#fff', borderColor: '#fff4' }}>{t('Open plan')} →</button></div></div></div>
      <div className={`card nextdose ${next && diff < 0 ? 'late' : ''}`}>
        {next ? <><div className="tag">{t('Next dose')}</div><h2 className="disp" style={{ fontSize: 28 }}>{next.t}</h2>
          <p><b>{next.tm}</b> · {when} · {t(next.s)}</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}><button className="btn" onClick={e => { haptic(20); A.toggleTask(next.id, e.currentTarget.getBoundingClientRect()) }}>✓ {t('Mark as taken')}</button>
            <button className="btn o" onClick={() => go('/app/meds')}>{t('Other options')}</button></div></>
          : <><div className="tag">{t('Next dose')}</div><h2 className="disp" style={{ fontSize: 28 }}>🎉 {t('All doses done')}</h2><p className="mut">{t('Nothing else due today. Well done.')}</p></>}</div></div>
    <div className="gr k4 stag" style={{ marginTop: 16 }}>
      <div className="card kp" data-tilt><small>💊 {t("Today's doses")}</small><h3>{md}/{meds.length}</h3></div>
      <div className="card kp" data-tilt><small>📈 {t('Adherence')}</small><h3>{avgAdh(S)}%</h3></div>
      <div className="card kp" data-tilt><small>📅 {t('Next visit')}</small><h3>{na?.d ? fmtDate(na.d) : t('Not Booked')}</h3></div>
      <div className="card kp" data-tilt><small>🩺 {t('Latest check-in')}</small><h3>{ci ? t('Pain {n}/10', { n: ci.pain }) : '—'}</h3></div></div>
    <div className="gr k3" style={{ marginTop: 16 }}>
      <div className="gr" style={{ alignContent: 'start' }}>
        <div className="card"><h2>🕘 {t("Today's timeline")}<button className="btn s o" onClick={() => go('/app/meds')}>{t('All')}</button></h2>
          <div className="tlv">{timeline.map(x => { const late = !x.st && toMin(x.tm) < cur; return <div key={x.id} className={isDone(x) ? 'ok' : late ? 'lt' : ''}>
            <b>{x.tm}</b> · {x.k === 'med' ? x.t : t(x.t)} <span className={`pill ${isDone(x) ? 'g' : late ? 'c' : 'l'}`}>{isDone(x) ? '✓ ' + t('Taken') : late ? t(x.k === 'med' ? 'Overdue' : 'Pending') : t('Upcoming')}</span></div> })}</div></div>
        <div className="gr k2"><div className="card"><h2>{t('Adherence this week')} <Pv k="reported" /></h2><BarChart data={S.adh.slice(-7)} labels={days} /></div>
          <div className="card"><h2>{t('Pain trend')} <Pv k="reported" /></h2><LineChart series={[rev.map(x => x.pain)]} colors={['#E66A4E']} lo={0} hi={10} ticks={5} labels={rev.map(x => fmtDate(x.d))} /></div></div></div>
      <div className="gr" style={{ alignContent: 'start' }}>
        <div className="card"><h2>📅 {t('Upcoming appointment')}</h2>{na ? <>
          <div className="it" style={{ border: 0 }}><div className="ic2">🏥</div><div><h3>{t(na.n)}</h3><p>{na.d ? fmtDate(na.d, { day: 'numeric', month: 'long' }) : t('Date not set')} · {na.w}</p></div></div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}><ApptPill s={na.s} /><button className="btn s" onClick={() => go('/app/appts')}>{t('Manage')}</button><a className="btn s o" href="tel:+910000000000">📞</a></div></> : <p className="mut">{t('No upcoming visits.')}</p>}</div>
        <div className="card"><h2>❓ {t('Needs your attention')}</h2>{fl.length ? fl.map(f => <FlagRow key={f.id} f={f} />) : <div className="flag k" style={{ margin: 0 }}>✓ {t('No unresolved questions.')}</div>}</div>
        <div className="flag r" style={{ margin: 0 }}><span>⚠️ <b>{t('Warning signs')}:</b> {t('Seek medical help immediately if you have: {w}', { w: t(S.ext.warn) })} <a href="tel:108"><b>📞 108</b></a></span></div></div></div></>
}
