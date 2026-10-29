import { useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useI18n } from '../i18n'
import { openModal } from '../components/ui'
import { LangMenu, TranslateBanner } from '../components/LangMenu'
import { ForgotSheet } from '../components/sheets'
import { toast } from '../components/toast'
import { signIn, signInWithGoogle, signUp } from '../auth'
import { audit, mutate } from '../store'
import { AuthSchema } from '../lib/schema'
import type { Role, User } from '../types'

const DEMO: Record<Role, string> = { patient: 'ravi@carebridge.demo', caregiver: 'lakshmi@carebridge.demo' }
function strength(p: string) { let s = 0; if (p.length >= 8) s++; if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++; if (/\d/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p)) s++; return s }
const SL = ['Too short', 'Weak', 'Okay', 'Good', 'Strong']

export default function Auth() {
  const { t } = useI18n(), nav = useNavigate(), [sp] = useSearchParams()
  const [mode, setMode] = useState<'in' | 'up'>(sp.get('m') === 'up' ? 'up' : 'in')
  const [role, setRole] = useState<Role>('patient'), [name, setName] = useState(''), [email, setEmail] = useState(localStorage.getItem('cb_email') || DEMO.patient), [pw, setPw] = useState('demo1234')
  const [show, setShow] = useState(false), [agree, setAgree] = useState(true), [remember, setRemember] = useState(true), [busy, setBusy] = useState(false), [err, setErr] = useState<Record<string, string>>({})
  const edited = useRef(!!localStorage.getItem('cb_email')), up = mode === 'up', st = strength(pw)
  const pickRole = (r: Role) => { setRole(r); if (!edited.current) setEmail(DEMO[r]) }
  const enter = (u: User) => { mutate(d => { d.user = u; audit(d, 'Signed in') }); nav('/app/home') }
  async function submit(e: FormEvent) {
    e.preventDefault(); if (busy) return
    const r = AuthSchema.safeParse({ name: up ? name : undefined, email, password: pw })
    const errs: Record<string, string> = {}
    if (!r.success) r.error.issues.forEach(i => { errs[String(i.path[0])] = i.message })
    setErr(errs); if (Object.keys(errs).length) return
    if (up && !agree) return toast('Please accept the consent to continue.')
    setBusy(true)
    try {
      const u = up ? await signUp(name.trim(), email.trim(), pw, role) : await signIn(email.trim(), pw, role)
      if (remember) localStorage.setItem('cb_email', email.trim()); else localStorage.removeItem('cb_email')
      enter(u)
    } catch (ex) { toast(ex instanceof Error ? ex.message : 'Sign in failed. Please try again.') } finally { setBusy(false) }
  }
  async function google() { setBusy(true); try { const u = await signInWithGoogle(role); if (u) enter(u) } catch { toast('Google sign-in is not available right now.') } finally { setBusy(false) } }
  const demo = async (r: Role) => { setBusy(true); try { enter(await signIn(DEMO[r], 'demo1234', r)) } finally { setBusy(false) } }
  return <div className="au">
    <div className="l"><Link className="logo" to="/"><i>♥</i><span>CARE<em>BRIDGE</em> <em>AI</em></span></Link>
      <div><h2 className="disp" style={{ fontSize: 'clamp(36px,4.4vw,58px)', lineHeight: 1.05 }}>{t('Every step of your recovery, made clear.')}</h2>
        <div className="feats">{[['📄', 'Upload once, understand everything'], ['🌐', 'Your plan in 40+ languages'], ['🔗', 'Every instruction linked to its source'], ['👪', 'Share with family. Stay in control.']].map((f, i) =>
          <div key={f[1]} className="fcard" data-tilt style={{ animationDelay: `${i * .7}s` }}><span>{f[0]}</span><b>{t(f[1])}</b></div>)}</div></div>
      <div className="card" style={{ maxWidth: 400 }}><b>🔒 {t('Privacy first')}</b><p className="mut" style={{ fontSize: 13 }}>{t('Encrypted in transit and at rest. Consent-based sharing, revocable anytime.')}</p></div></div>
    <div className="r"><form className="fm" noValidate onSubmit={submit}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}><LangMenu /><Link to="/" className="mut" style={{ fontSize: 13 }}>← {t('Home')}</Link></div>
      <TranslateBanner />
      <h1 className="disp">{t(up ? 'Create your account' : 'Welcome back')}</h1>
      <p className="mut" style={{ marginTop: -8 }}>{t(up ? 'Start your recovery plan in a minute.' : 'Sign in to continue your recovery.')}</p>
      <div className="seg" role="tablist"><button type="button" role="tab" aria-selected={!up} onClick={() => setMode('in')}>{t('Sign in')}</button><button type="button" role="tab" aria-selected={up} onClick={() => setMode('up')}>{t('Sign up')}</button></div>
      <button type="button" className="gbtn" onClick={google} disabled={busy}><svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" /><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" /><path fill="#FBBC05" d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.1z" /><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" /></svg> {t('Continue with Google')}</button>
      <div className="or"><span>{t('or')}</span></div>
      <div className="rc"><button type="button" aria-pressed={role === 'patient'} onClick={() => pickRole('patient')}><span>🧑</span><b>{t('Patient')}</b><small>{t('I am recovering')}</small></button>
        <button type="button" aria-pressed={role === 'caregiver'} onClick={() => pickRole('caregiver')}><span>👪</span><b>{t('Caregiver')}</b><small>{t('I help someone')}</small></button></div>
      {up && <div><label htmlFor="nm">{t('Full name')}</label><input id="nm" type="text" autoComplete="name" value={name} onChange={e => setName(e.target.value)} /><div className="err">{err.name && t(err.name)}</div></div>}
      <div><label htmlFor="em">{t('Email')}</label><input id="em" type="email" autoComplete="email" inputMode="email" value={email} onChange={e => { edited.current = true; setEmail(e.target.value) }} /><div className="err">{err.email && t(err.email)}</div></div>
      <div><label htmlFor="pw">{t('Password')}</label><div className="pw"><input id="pw" type={show ? 'text' : 'password'} autoComplete={up ? 'new-password' : 'current-password'} value={pw} onChange={e => setPw(e.target.value)} /><button type="button" onClick={() => setShow(s => !s)}>{t(show ? 'Hide' : 'Show')}</button></div>
        {up && <div className="meter" aria-live="polite"><div>{[1, 2, 3, 4].map(i => <i key={i} className={st >= i ? `on s${st}` : ''} />)}</div><small>{t(SL[st])}</small></div>}<div className="err">{err.password && t(err.password)}</div></div>
      {!up ? <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--ink)' }}><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} /> {t('Remember me')}</label>
        <button type="button" className="lnk" onClick={() => openModal(<ForgotSheet initial={email} />)}>{t('Forgot password?')}</button></div>
        : <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', color: 'var(--ink)' }}><input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} style={{ marginTop: 4 }} /><span style={{ fontSize: 13 }}>{t('I agree to the privacy terms and consent to processing my documents to create my care plan.')}</span></label>}
      <button className="btn" style={{ padding: 14 }} disabled={busy}>{busy && <span className="sp" />}{t(up ? 'Create account' : 'Sign in')}</button>
      <div className="demo"><span>{t('Just looking around?')}</span><button type="button" className="lnk" onClick={() => demo('patient')}>{t('Try demo as patient')}</button><button type="button" className="lnk" onClick={() => demo('caregiver')}>{t('Try demo as caregiver')}</button></div>
      <p className="mut" style={{ fontSize: 12.5, textAlign: 'center' }}>{t('Demo credentials are pre-filled. Synthetic data only.')}</p></form></div></div>
}
