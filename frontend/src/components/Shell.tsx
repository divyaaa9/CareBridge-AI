import { useEffect, useRef, useState } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n'
import { LangMenu, TranslateBanner } from './LangMenu'
import { IosInstallSheet, NotificationSheet } from './sheets'
import { openModal } from './ui'
import { toast } from './toast'
import { audit, getState, mutate, useStore } from '../store'
import { signOutRemote } from '../auth'
import { notifications, toMin } from '../lib/plan'
import { onBackButton, scheduleDoseReminders } from '../native'
import { useInstall } from '../pwa'

export const NAVP: [string, string, string][] = [['home', '🏠', 'Home'], ['plan', '📋', 'My Care Plan'], ['meds', '💊', 'Medicines'], ['recovery', '🩺', 'Recovery'], ['appts', '📅', 'Appointments'], ['records', '🗂️', 'Records'], ['ask', '💬', 'Ask CareBridge'], ['upload', '⬆️', 'Upload'], ['family', '👪', 'Family & sharing'], ['settings', '⚙️', 'Profile & Settings']]
export const NAVC: [string, string, string][] = [['home', '🏠', 'Home'], ['meds', '💊', 'Medicines'], ['recovery', '🩺', 'Recovery'], ['appts', '📅', 'Appointments'], ['ask', '💬', 'Ask CareBridge'], ['settings', '⚙️', 'Settings']]
const BLOCKED = ['plan', 'upload', 'review', 'records', 'family']
const TITLES: Record<string, string> = { review: 'Review extracted details', more: 'More' }

/** In-app reminders while the app is open. On the native app the OS also schedules them (see native.ts). */
function useReminders(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return
    const id = window.setInterval(() => {
      const S = getState(), n = S.notif, now = new Date(), h = now.getHours(), cur = h * 60 + now.getMinutes()
      const quiet = n.qs > n.qe ? h >= n.qs || h < n.qe : h >= n.qs && h < n.qe
      if (quiet || !n.meds) return
      S.tasks.forEach(x => {
        const key = now.toDateString() + x.id, diff = cur - toMin(x.tm)
        if (x.k !== 'med' || x.st || S.notified[key] || diff < 0 || diff >= 10) return
        mutate(d => { d.notified[key] = 1 }); toast('⏰ Time for {m}', { m: x.t })
        try { if (typeof Notification !== 'undefined' && Notification.permission === 'granted') new Notification('CareBridge AI', { body: `Time for ${x.t}` }) } catch { /* ignore */ }
      })
    }, 30000)
    return () => clearInterval(id)
  }, [enabled])
}
export function useSignOut() {
  const nav = useNavigate()
  return () => { signOutRemote().catch(() => undefined); mutate(d => { audit(d, 'Signed out'); d.user = null }); nav('/') }
}
function AvatarMenu() {
  const S = useStore(), { t } = useI18n(), nav = useNavigate(), out = useSignOut(), ins = useInstall(), ref = useRef<HTMLDetailsElement>(null)
  useEffect(() => { const f = (e: MouseEvent) => { if (ref.current?.open && !ref.current.contains(e.target as Node)) ref.current.open = false }; addEventListener('click', f); return () => removeEventListener('click', f) }, [])
  const close = () => { if (ref.current) ref.current.open = false }
  return <details className="avmenu" ref={ref}><summary aria-label={t('Account')}><span className="av">{S.user!.name[0]}</span></summary>
    <ul><li className="who"><b>{S.user!.name}</b><small className="mut">{t(S.user!.role === 'caregiver' ? 'Caregiver' : 'Patient')}</small></li>
      <li><button onClick={() => { close(); nav('/app/settings') }}>⚙️ {t('Settings')}</button></li>
      {!ins.installed && (ins.canPrompt || ins.ios) && <li><button onClick={() => { close(); if (ins.canPrompt) void ins.install(); else openModal(<IosInstallSheet />) }}>📲 {t('Install app')}</button></li>}
      <li><button onClick={() => { close(); out() }}>⎋ {t('Sign out')}</button></li></ul></details>
}
function TopBar({ title }: { title: string }) {
  const S = useStore(), { t } = useI18n(), n = notifications(S).length
  return <div className="topbar"><span className="logo mob"><i>♥</i></span><h2>{t(title)}</h2>
    <button className="iconbtn" onClick={() => openModal(<NotificationSheet />)} aria-label={t('Notifications')}>🔔{n > 0 && <span className="dot">{n}</span>}</button>
    <LangMenu compact /><AvatarMenu /></div>
}
export default function Shell() {
  const S = useStore(), { t, lang } = useI18n(), loc = useLocation(), nav = useNavigate(), out = useSignOut()
  const seg = loc.pathname.split('/')[2] || 'home', cg = S.user?.role === 'caregiver'
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => { const a = () => setOnline(true), b = () => setOnline(false); addEventListener('online', a); addEventListener('offline', b); return () => { removeEventListener('online', a); removeEventListener('offline', b) } }, [])
  useEffect(() => { let off = () => undefined as void; onBackButton(() => history.back()).then(f => { off = f as () => void }); return () => off() }, [])
  useEffect(() => { if (S.user && !cg) void scheduleDoseReminders(S, 'CareBridge AI', m => t('Time for {m}', { m })) }, [S.tasks.length, S.notif.meds, S.notif.qs, S.notif.qe, lang]) // eslint-disable-line react-hooks/exhaustive-deps
  useReminders(!!S.user && !cg)
  if (!S.user) return <Navigate to="/login" replace />
  if (cg && BLOCKED.includes(seg)) return <Navigate to="/app/home" replace />
  const items = cg ? NAVC : NAVP, mob = cg ? ['home', 'meds', 'recovery', 'appts'] : ['home', 'plan', 'meds', 'recovery']
  const title = TITLES[seg] || items.find(x => x[0] === seg)?.[2] || 'Home'
  return <div className="app">
    <aside className="sb" aria-label="Main"><a className="logo" href="/app/home" onClick={e => { e.preventDefault(); nav('/app/home') }}><i>♥</i><span>CARE<em>BRIDGE</em> <em>AI</em></span></a>
      {items.map((x, i) => <span key={x[0]} style={{ display: 'contents' }}>{i === 7 && !cg && <hr />}<button className="ni" aria-current={seg === x[0] ? 'page' : undefined} onClick={() => nav('/app/' + x[0])}><span aria-hidden="true">{x[1]}</span>{t(x[2])}</button></span>)}
      <div className="me"><div className="av">{S.user.name[0]}</div><div style={{ flex: 1, minWidth: 0 }}><b>{S.user.name}</b><br /><small className="mut">{t(cg ? 'Caregiver' : 'Patient')}</small></div><button className="btn o s" onClick={out} aria-label={t('Sign out')}>⎋</button></div></aside>
    <main className="mn" id="main">
      {!online && <div className="offl">{t("You're offline. Showing your saved plan.")}</div>}
      <TopBar title={title} /><TranslateBanner />
      <div className="pg" key={loc.pathname}><Outlet /></div></main>
    <nav className="tabs" aria-label="Main">
      {mob.map(k => { const x = items.find(y => y[0] === k)!; return <button key={k} aria-current={seg === k ? 'page' : undefined} onClick={() => nav('/app/' + k)}><span aria-hidden="true">{x[1]}</span>{t(x[2].replace('My ', ''))}</button> })}
      <button aria-current={!mob.includes(seg) ? 'page' : undefined} onClick={() => nav('/app/more')}><span aria-hidden="true">☰</span>{t('More')}</button></nav>
    {seg !== 'ask' && <button className="fab" onClick={() => nav('/app/ask')} aria-label={t('Ask CareBridge')}>💬</button>}</div>
}
export function More() {
  const { t } = useI18n(), nav = useNavigate(), cg = useStore().user?.role === 'caregiver', out = useSignOut()
  const mob = cg ? ['home', 'meds', 'recovery', 'appts'] : ['home', 'plan', 'meds', 'recovery']
  return <><div className="hd"><div><h1 className="disp">{t('More')}</h1></div></div>
    <div className="card">{(cg ? NAVC : NAVP).filter(x => !mob.includes(x[0])).map(x => <button key={x[0]} className="ni" onClick={() => nav('/app/' + x[0])}><span>{x[1]}</span>{t(x[2])}</button>)}<button className="ni" onClick={out}><span>⎋</span>{t('Sign out')}</button></div></>
}
