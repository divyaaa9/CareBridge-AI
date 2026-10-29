import { useI18n, LANGS, ENABLED } from '../i18n'
import { LanguageSheet } from '../components/LangMenu'
import { IosInstallSheet } from '../components/sheets'
import { useInstall } from '../pwa'
import { useStore } from '../store'
import { A } from '../actions'
import { PageHead, PV, Pv, openModal } from '../components/ui'
import { WipeSheet } from '../components/sheets'
import { toast } from '../components/toast'
import { signOutRemote } from '../auth'
import { useNavigate } from 'react-router-dom'
import { audit, mutate } from '../store'

const Sw = ({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) => <button className="sw x" role="switch" aria-checked={on} aria-label={label} onClick={onClick} />
export default function Settings() {
  const S = useStore(), { t, lang, fmtDate, fmtTime } = useI18n(), ins = useInstall(), nav = useNavigate(), n = S.notif
  const perm = typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  const out = () => { signOutRemote().catch(() => undefined); mutate(d => { audit(d, 'Signed out'); d.user = null }); nav('/') }
  const ask = () => { if (typeof Notification === 'undefined') return toast('Notifications are not supported here.'); Notification.requestPermission().then(() => toast('Saved')).catch(() => toast('Permission could not be requested.')) }
  const test = () => { toast('⏰ Time for {m}', { m: 'Pantoprazole 40 mg' }); try { if (perm === 'granted') new Notification('CareBridge AI', { body: 'Time for Pantoprazole 40 mg' }) } catch { /* ignore */ } }
  return <>
    <PageHead h={t('Profile and settings')} p={t('Language, reminders, privacy and your data')} />
    <div className="gr k2">
      <div className="card gr" style={{ gap: 10 }}><h2>🧑 {t('Profile')}</h2>
        <div><label htmlFor="pn">{t('Name')}</label><input id="pn" type="text" defaultValue={S.user?.name} onBlur={e => e.target.value !== S.user?.name && A.setProfile('name', e.target.value)} /></div>
        <div className="gr k2" style={{ gap: 10 }}><div><label htmlFor="pa">{t('Age')}</label><input id="pa" type="number" min={0} max={120} defaultValue={S.prof.age} onBlur={e => A.setProfile('age', e.target.value)} /></div>
          <div><label htmlFor="pt">{t('Time zone')}</label><select id="pt" value={S.prof.tz} onChange={e => A.setProfile('tz', e.target.value)}>{['Asia/Kolkata', 'Asia/Dubai', 'Europe/London', 'America/New_York'].map(z => <option key={z}>{z}</option>)}</select></div></div></div>
      <div className="card"><h2>🌐 {t('Language')}</h2><button className="btn o" style={{ width: '100%', justifyContent: 'space-between' }} onClick={() => openModal(<LanguageSheet />, true)}><span>{LANGS[lang][0]}</span><span>{ENABLED.length} {t('languages')} ▾</span></button>
        <p className="mut" style={{ fontSize: 12.5, marginTop: 10 }}>{t('Translated automatically with Google Translate. Medicine names and doses stay as written in your document.')}</p></div>
      <div className="card"><h2>📲 {t('Install the app')}</h2>{ins.installed ? <div className="flag k" style={{ margin: 0 }}>✓ {t('Installed')}</div> : <><p className="mut" style={{ fontSize: 13.5, marginBottom: 10 }}>{t('Add CareBridge to your home screen for faster access and offline use.')}</p>{ins.canPrompt ? <button className="btn" onClick={() => void ins.install()}>{t('Install app')}</button> : ins.ios ? <button className="btn" onClick={() => openModal(<IosInstallSheet />)}>{t('Install on iPhone')}</button> : <p className="mut" style={{ fontSize: 12.5 }}>{t('Use your browser menu: "Install app" or "Add to Home Screen".')}</p>}</>}</div>
      <div className="card"><h2>🔔 {t('Reminders')}</h2>
        {([['meds', 'Medicine reminders'], ['appts', 'Appointment reminders'], ['tips', 'Daily recovery tips']] as const).map(([k, l]) => <div className="it" key={k}><div><h3>{t(l)}</h3></div><Sw on={!!n[k]} label={t(l)} onClick={() => A.toggleNotif(k)} /></div>)}
        <div className="gr k2" style={{ gap: 10, marginTop: 8 }}>
          <div><label htmlFor="qs">{t('Quiet hours from')}</label><select id="qs" value={n.qs} onChange={e => A.setNotif('qs', e.target.value)}>{[20, 21, 22, 23].map(h => <option key={h} value={h}>{h}:00</option>)}</select></div>
          <div><label htmlFor="qe">{t('until')}</label><select id="qe" value={n.qe} onChange={e => A.setNotif('qe', e.target.value)}>{[5, 6, 7, 8].map(h => <option key={h} value={h}>{h}:00</option>)}</select></div></div>
        <div style={{ marginTop: 10 }}><label htmlFor="ld">{t('Remind me before visits')}</label><select id="ld" value={n.lead} onChange={e => A.setNotif('lead', e.target.value)}><option value="1d">{t('1 day before')}</option><option value="2h">{t('2 hours before')}</option></select></div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}><button className="btn s o" onClick={ask}>{t('Allow browser notifications')}</button><button className="btn s o" onClick={test}>{t('Send test reminder')}</button></div>
        <p className="mut" style={{ fontSize: 12.5, marginTop: 8 }}>ℹ️ {t('Browser notifications may not work if permission is denied or your device is offline. In-app reminders always work while the app is open.')} ({perm})</p></div>
      <div className="card"><h2>🛡️ {t('Privacy and consent')}</h2>
        {([['share', 'Allow sharing with caregivers I invite'], ['ai', 'Allow AI to read my summary to build my plan'], ['stats', 'Share anonymous usage statistics']] as const).map(([k, l]) => <div className="it" key={k}><div><h3 style={{ fontSize: 13.5 }}>{t(l)}</h3></div><Sw on={!!S.consent[k]} label={t(l)} onClick={() => A.toggleConsent(k)} /></div>)}</div>
      <div className="card"><h2>♿ {t('Accessibility')}</h2><label>{t('Text size')}</label>
        <div className="seg">{([[0.9, 'A−'], [1, 'A'], [1.15, 'A+'], [1.3, 'A++']] as const).map(([v, l]) => <button key={l} aria-pressed={S.size === v} onClick={() => A.setSize(v)}>{l}</button>)}</div>
        <div className="it"><div><h3>{t('High contrast')}</h3></div><Sw on={!!S.hc} label={t('High contrast')} onClick={A.toggleContrast} /></div></div>
      <div className="card"><h2>🧾 {t('Activity log')}</h2>{S.audit.slice(0, 6).map((a, i) => <div className="it" key={i} style={{ padding: '8px 0' }}><div><h3 style={{ fontSize: 13 }}>{t(a.e)}</h3><p>{fmtDate(a.at)} {fmtTime(a.at)}</p></div></div>)}</div>
      <div className="card"><h2>🗑️ {t('Your data')}</h2><p className="mut" style={{ fontSize: 13.5, marginBottom: 10 }}>{t('Export or permanently delete everything stored in this app.')}</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><button className="btn o s" onClick={A.exportData}>{t('Export data')}</button><button className="btn d s" onClick={() => openModal(<WipeSheet />)}>{t('Delete all my data')}</button><button className="btn s" onClick={out}>{t('Sign out')}</button></div>
        <div className="chips" style={{ marginTop: 12 }}>{Object.keys(PV).map(k => <Pv key={k} k={k} />)}</div></div></div></>
}
