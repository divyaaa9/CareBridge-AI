import { useState } from 'react'
import { useI18n } from '../i18n'
import { useStore } from '../store'
import { A } from '../actions'
import { PageHead, Qr, openModal } from '../components/ui'
import { InviteSheet, PermSheet } from '../components/sheets'
import { toast } from '../components/toast'

const L: Record<string, string> = { meds: 'Medicines', appts: 'Appointments', prog: 'Recovery' }
const EXP: [string, string][] = [['1h', '1 hour'], ['24h', '24 hours'], ['7d', '7 days']]
export default function Family() {
  const S = useStore(), { t } = useI18n(), [exp, setExp] = useState('24h')
  const copy = (tk: string) => { navigator.clipboard?.writeText(`https://carebridge.app/s/${tk}`).catch(() => undefined); toast('Link copied') }
  return <>
    <PageHead h={t('Family and sharing')} p={t('You decide who sees what. Revoke anytime.')}><button className="btn s" onClick={() => openModal(<InviteSheet />)}>+ {t('Invite caregiver')}</button></PageHead>
    <div className="gr k2">
      <div className="card"><h2>👪 {t('Caregivers')}</h2>
        {S.fam.length ? S.fam.map(f => <div className="it" key={f.id}><div className="av" style={{ background: ['var(--coral)', 'var(--amb)', 'var(--sage)'][f.id % 3] }}>{f.n[0]}</div>
          <div><h3>{f.n} <small className="mut">· {f.rel}</small></h3><p>{f.st ? t('Can view') + ': ' + f.sc.map(k => t(L[k])).join(', ') : t('Invite pending')}</p></div>
          <button className="btn o s x" onClick={() => openModal(<PermSheet id={f.id} />)}>{t('Permissions')}</button></div>) : <p className="mut">{t('No caregivers yet.')}</p>}
        <p className="mut" style={{ fontSize: 12.5, marginTop: 8 }}>{t('Caregiver entries are labelled with their name.')}</p></div>
      <div className="card"><h2>🔳 {t('Secure share link')}</h2><p className="mut" style={{ fontSize: 13 }}>{t('The QR code holds only a secure link. No medical data is inside it.')}</p>
        <div className="seg" style={{ margin: '10px 0' }}>{EXP.map(([v, l]) => <button key={v} aria-pressed={exp === v} onClick={() => setExp(v)}>{t(l)}</button>)}</div>
        <button className="btn" style={{ width: '100%' }} onClick={() => A.share(exp)}>{t('Create share link')}</button></div></div>
    {S.shares.length > 0 && <div className="gr k2" style={{ marginTop: 16 }}>{S.shares.map(x => <div className="card" key={x.tk} style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
      <Qr token={x.tk} /><div style={{ flex: 1, minWidth: 150 }}><b>carebridge.app/s/{x.tk}</b><p className="mut" style={{ fontSize: 12.5 }}>{t('Expires in {e}', { e: x.e })}</p>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}><button className="btn s o" onClick={() => copy(x.tk)}>{t('Copy')}</button><button className="btn s d" onClick={() => A.unshare(x.tk)}>{t('Revoke')}</button></div></div></div>)}</div>}</>
}
