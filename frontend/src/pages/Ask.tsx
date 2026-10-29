import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useI18n } from '../i18n'
import { useStore } from '../store'
import { A } from '../actions'
import { PageHead, openModal } from '../components/ui'
import { SourceSheet } from '../components/sheets'

const Q = ['When is my next visit?', 'What medicines do I take?', 'Can I eat normally?', 'What are the warning signs?']
export default function Ask() {
  const S = useStore(), { t, lang } = useI18n(), [q, setQ] = useState(''), [typing, setTyping] = useState(false), box = useRef<HTMLDivElement>(null)
  useEffect(() => { box.current?.scrollTo({ top: box.current.scrollHeight }) }, [S.chat.length, typing])
  const send = async (text: string) => { if (!text.trim() || typing) return; setQ(''); setTyping(true); try { await A.ask(text, lang) } finally { setTyping(false) } }
  const submit = (e: FormEvent) => { e.preventDefault(); void send(q) }
  return <>
    <PageHead h={t('Ask CareBridge')} p={t('Answers come only from your own discharge summary.')} />
    <div className="card"><div className="chat" ref={box} aria-live="polite">
      {S.chat.length === 0 && <div className="bub a">{t('Hi! Ask me about your medicines, diet, activity, warning signs or follow-up. I only use your own summary.')}</div>}
      {S.chat.map((m, i) => <div key={i} className={`bub ${m.r}`}>{m.key ? t(m.t) : m.t}{m.src != null && <><br /><button className="src" onClick={() => openModal(<SourceSheet line={m.src as number} />)}>📄 {t('Source')} · L{(m.src as number) + 1}</button></>}</div>)}
      {typing && <div className="bub a dots"><i /><i /><i /></div>}</div>
      <div className="chips" style={{ margin: '12px 0' }}>{Q.map(x => <button key={x} className="chip" onClick={() => void send(x)}>{t(x)}</button>)}</div>
      <form onSubmit={submit} style={{ display: 'flex', gap: 8 }}><input type="text" value={q} onChange={e => setQ(e.target.value)} placeholder={t('Type your question…')} aria-label={t('Your question')} autoComplete="off" style={{ margin: 0 }} /><button className="btn" disabled={typing}>➤</button></form></div>
    <div className="flag r" style={{ marginTop: 12 }}>⚠️ {t('This is an explanation tool, not a doctor. In an emergency call 108 or go to the nearest hospital.')}</div></>
}
