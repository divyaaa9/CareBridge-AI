import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { I18nProvider, useI18n } from './i18n'
import { ModalHost } from './components/ui'
import { ToastHost } from './components/toast'
import Shell, { More } from './components/Shell'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import Home from './pages/Home'
import Plan from './pages/Plan'
import Meds from './pages/Meds'
import Recovery from './pages/Recovery'
import Appts from './pages/Appts'
import Records from './pages/Records'
import Family from './pages/Family'
import Ask from './pages/Ask'
import Upload from './pages/Upload'
import Review from './pages/Review'
import Settings from './pages/Settings'
import { useStore } from './store'
import { restoreSession } from './auth'
import { mutate } from './store'

/** Global, passive, rAF-throttled 3D tilt + hero parallax. Transform-only for smooth 60fps. */
function useGlobalMotion() {
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let mx = 0, my = 0, tk = false, te: EventTarget | null = null
    const move = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      mx = e.clientX; my = e.clientY; te = e.target
      if (tk) return; tk = true
      requestAnimationFrame(() => {
        tk = false
        const el = (te as HTMLElement | null)?.closest?.('[data-tilt]') as HTMLElement | null
        if (el) { const r = el.getBoundingClientRect(), x = (mx - r.left) / r.width, y = (my - r.top) / r.height; el.style.transform = `perspective(900px) rotateX(${(.5 - y) * 9}deg) rotateY(${(x - .5) * 11}deg)` }
        const st = document.getElementById('stage')
        if (st && document.getElementById('scene')) { st.style.setProperty('--ry', `${-16 + (mx / innerWidth - .5) * 26}deg`); st.style.setProperty('--rx', `${5 - (my / innerHeight - .5) * 18}deg`) }
      })
    }
    const out = (e: PointerEvent) => { const el = (e.target as HTMLElement).closest?.('[data-tilt]') as HTMLElement | null; if (el && !el.contains(e.relatedTarget as Node)) el.style.transform = '' }
    addEventListener('pointermove', move, { passive: true }); addEventListener('pointerout', out, { passive: true })
    return () => { removeEventListener('pointermove', move); removeEventListener('pointerout', out) }
  }, [])
}
function Effects() {
  const S = useStore(), loc = useLocation()
  useGlobalMotion()
  useEffect(() => { document.documentElement.style.setProperty('--fs', String(S.size)); document.body.classList.toggle('hc', !!S.hc) }, [S.size, S.hc])
  useEffect(() => { // chart/ring entry animations only on navigation
    window.scrollTo(0, 0); document.body.classList.add('fresh')
    const id = window.setTimeout(() => document.body.classList.remove('fresh'), 1500)
    return () => clearTimeout(id)
  }, [loc.pathname])
  useEffect(() => { restoreSession().then(u => { if (u) mutate(d => { d.user = d.user ?? u }) }).catch(() => undefined) }, [])
  return null
}
function Busy() {
  const { busy } = useI18n()
  useEffect(() => { document.body.classList.toggle('tr-busy', busy) }, [busy])
  return <div className="trp" role="status" aria-live="polite"><span className="sp" /><span>Translating…</span></div>
}
export default function App() {
  return <I18nProvider><BrowserRouter><Effects />
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/app" element={<Shell />}>
        <Route index element={<Navigate to="home" replace />} />
        <Route path="home" element={<Home />} /><Route path="plan" element={<Plan />} /><Route path="meds" element={<Meds />} />
        <Route path="recovery" element={<Recovery />} /><Route path="appts" element={<Appts />} /><Route path="records" element={<Records />} />
        <Route path="family" element={<Family />} /><Route path="ask" element={<Ask />} /><Route path="upload" element={<Upload />} />
        <Route path="review" element={<Review />} /><Route path="settings" element={<Settings />} /><Route path="more" element={<More />} />
        <Route path="*" element={<Navigate to="home" replace />} /></Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes><ModalHost /><ToastHost /><Busy /></BrowserRouter></I18nProvider>
}
function LoginRoute() { const u = useStore().user; return u ? <Navigate to="/app/home" replace /> : <Auth /> }
