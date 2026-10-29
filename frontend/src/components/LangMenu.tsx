import { useMemo, useState } from 'react'
import { ENABLED, LANGS, useI18n } from '../i18n'
import { closeModal, openModal } from './ui'

/** Searchable picker for every supported language. */
export function LanguageSheet() {
  const { lang, setLang, t, busy } = useI18n(), [q, setQ] = useState('')
  const list = useMemo(() => ENABLED.filter(c => !q || (LANGS[c][0] + LANGS[c][1] + c).toLowerCase().includes(q.toLowerCase())), [q])
  return <>
    <h2 className="disp" style={{ fontSize: 26 }}>🌐 {t('Choose your language')}</h2>
    <input type="text" value={q} onChange={e => setQ(e.target.value)} placeholder={'🔎 ' + t('Search languages')} aria-label={t('Search languages')} style={{ margin: 0 }} />
    <div className="langs lscroll" role="listbox" aria-label={t('Language')}>
      {list.map(c => <button key={c} role="option" aria-selected={c === lang} aria-pressed={c === lang} onClick={() => { setLang(c); closeModal() }}><span>{LANGS[c][0]}</span>{c !== 'en' && <small>{LANGS[c][1]}</small>}</button>)}
      {!list.length && <p className="mut">{t('No matching language.')}</p>}</div>
    <p className="mut" style={{ fontSize: 12.5 }}>ℹ️ {t('Translated automatically with Google Translate. Medicine names and doses stay as written in your document.')}{busy ? ' …' : ''}</p>
    <button className="btn o" onClick={closeModal}>{t('Close')}</button></>
}
export function LangMenu({ compact = false }: { compact?: boolean }) {
  const { lang, t } = useI18n()
  return <button className="langbtn" onClick={() => openModal(<LanguageSheet />, true)} aria-label={t('Language')}>🌐 {compact ? lang.toUpperCase() : LANGS[lang][0]} ▾</button>
}
/** Shown whenever the app is not in English. Machine translation can be wrong, so we say so. */
export function TranslateBanner() {
  const { lang, setLang, t, busy } = useI18n()
  if (lang === 'en') return null
  return <div className="tbanner" role="note"><span>🌐 {busy ? t('Translating…') : t('Automatically translated. Confirm medicine details with your doctor.')}</span><button onClick={() => setLang('en')}>{t('Show English')}</button></div>
}
