import { useRef, useState, type DragEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n'
import { api } from '../api/client'
import { audit, mutate } from '../store'
import { PageHead } from '../components/ui'
import { session } from '../lib/session'

const OK = /^(application\/pdf|image\/(jpeg|png))$/, STEPS = ['Checking file', 'Reading text with OCR', 'Looking for unclear parts', 'Preparing your review']
export default function Upload() {
  const { t } = useI18n(), nav = useNavigate(), [err, setErr] = useState(''), [step, setStep] = useState(-1), [over, setOver] = useState(false), [name, setName] = useState(''), [blur, setBlur] = useState(false), busy = useRef(false)
  async function scan(file: File | null) {
    if (busy.current) return
    setErr('')
    if (file) { if (!OK.test(file.type)) return setErr('Only PDF, JPG or PNG files are allowed.'); if (file.size > 10 * 1048576) return setErr('This file is larger than 10 MB.') }
    busy.current = true; setName(file?.name || ''); setStep(0)
    const timers = [1, 2, 3].map(k => window.setTimeout(() => setStep(k), k * 800))
    try {
      const [r] = await Promise.all([api.uploadDocument(file), new Promise(res => setTimeout(res, 3300))])
      session.docId = r.documentId; setBlur(r.blurry)
      mutate(d => { if (r.extraction) { d.ext = r.extraction; d.prov = {}; d.ok = {}; if (r.confidence) d.conf = { ...d.conf, ...r.confidence } } audit(d, 'Document uploaded') })
      setStep(4)
    } catch { timers.forEach(clearTimeout); setStep(-1); setErr('We could not read this file. Please try again.') } finally { busy.current = false }
  }
  const drop = (e: DragEvent) => { e.preventDefault(); setOver(false); void scan(e.dataTransfer.files[0] ?? null) }
  return <>
    <PageHead h={t('Upload discharge summary')} p={t('PDF, JPG or PNG up to 10 MB. Use synthetic data only in this demo.')} />
    <div className={`drop ${over ? 'ov' : ''}`} onDragOver={e => { e.preventDefault(); setOver(true) }} onDragLeave={() => setOver(false)} onDrop={drop}>
      <div style={{ fontSize: 46 }}>📄</div><h2 className="disp" style={{ fontSize: 28 }}>{t('Drop your file here')}</h2>
      <p className="mut" style={{ margin: '6px 0 18px' }}>{t('We read it, then you review everything before a plan is made.')}</p>
      <label className="btn" style={{ cursor: 'pointer' }}>{t('Choose file')}<input type="file" accept="application/pdf,image/jpeg,image/png" className="hide" onChange={e => void scan(e.target.files?.[0] ?? null)} /></label> <button className="btn o" onClick={() => void scan(null)}>{t('Use sample summary')}</button>
      <div className="err" role="alert" style={{ marginTop: 10 }}>{err && t(err)}</div></div>
    {step >= 0 && <div className="stg" aria-live="polite">{STEPS.map((s, i) => <div key={s} className={i === step ? 'on' : i < step ? 'dn' : ''}><span>{i + 1}</span>{t(s)}{name && i === 0 ? ' · ' + name : ''}</div>)}
      {step === 4 && <><div className="flag" style={{ display: 'flex' }}>{blur ? '⚠️ ' + t('Part of the image looks blurry. Please check the details carefully.') : 'ℹ️ ' + t('2 fields need a closer look.')}</div><button className="btn" onClick={() => nav('/app/review')}>{t('Review details')} →</button></>}</div>}</>
}
