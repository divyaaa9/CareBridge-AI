import { useState } from 'react'
import { useI18n } from '../i18n'
import { useStore } from '../store'
import { A } from '../actions'
import { dLine, mLine, srcLines } from '../lib/plan'
import { PageHead, Pv, openModal } from '../components/ui'
import { GenerateSheet } from '../components/sheets'

type Key = 'name' | 'hosp' | 'city' | 'dept' | 'diet' | 'act' | 'fu' | 'warn'
export default function Review() {
  const S = useStore(), { t } = useI18n(), e = S.ext, [hl, setHl] = useState(-1)
  const badge = (key: string) => { const cf = S.conf[key] ?? 0; return <span>{<Pv k={S.prov[key] ? 'corrected' : cf < 75 ? 'uncertain' : 'extracted'} />}{cf > 0 && <span className={`conf ${cf < 75 ? 'lo' : ''}`}> {cf < 75 ? '⚑ ' : ''}{cf}%</span>}</span> }
  const F = ({ k, l, ln }: { k: Key; l: string; ln: number }) => <div className="fld"><div className="top"><label htmlFor={'f-' + k}>{t(l)}</label>{badge(k)}</div>
    <input id={'f-' + k} type="text" value={e[k]} onFocus={() => setHl(ln)} onChange={ev => A.edit(k, ev.target.value)} /></div>
  return <>
    <PageHead h={t('Review extracted details')} p={t("We don't blindly trust OCR. Check each field, especially flagged ones.")}><button className="btn" onClick={() => openModal(<GenerateSheet />)}>{t('Generate care plan')} →</button></PageHead>
    <div className="gr k3"><div className="card gr" style={{ gap: 12 }}>
      <h2>{t('Patient and hospital')}</h2>{F({ k: 'name', l: 'Patient name', ln: 1 })}{F({ k: 'hosp', l: 'Hospital', ln: 2 })}
      <div className="gr k2" style={{ gap: 12 }}>{F({ k: 'city', l: 'City', ln: 2 })}{F({ k: 'dept', l: 'Department', ln: 2 })}</div>
      <h2 style={{ marginTop: 6 }}>{t('Medicines')}</h2>
      {e.meds.map((m, i) => <div className="fld" key={i}><div className="top"><label>{t('Medicine')} {i + 1}</label>{badge('m' + i)}</div>
        <div className="gr" style={{ gridTemplateColumns: '2fr 1fr 1fr', gap: 8 }}>{(['n', 's', 'f'] as const).map((f, j) => <input key={f} type="text" aria-label={t(['Name', 'Strength', 'Frequency'][j])} value={m[f]} onFocus={() => setHl(mLine(i))} onChange={ev => A.editMed(i, f, ev.target.value)} />)}</div></div>)}
      <h2 style={{ marginTop: 6 }}>{t('Instructions')}</h2>
      {F({ k: 'diet', l: 'Diet', ln: dLine(e, 'diet') })}{F({ k: 'act', l: 'Activity', ln: dLine(e, 'act') })}{F({ k: 'fu', l: 'Follow-up', ln: dLine(e, 'fu') })}{F({ k: 'warn', l: 'Warning signs', ln: dLine(e, 'warn') })}</div>
      <div className="card" style={{ alignSelf: 'start', position: 'sticky', top: 12 }}><h2>📄 {t('Original document')}</h2>
        <div className="doc">{srcLines(e).map((l, i) => <span key={i} className={i === hl ? 'hl' : ''}>{l}</span>)}</div>
        <p className="mut" style={{ fontSize: 12.5, marginTop: 8 }}>{t('The original stays next to the extracted data.')}</p></div></div></>
}
