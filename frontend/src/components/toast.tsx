import { useEffect, useState } from 'react'
import { useI18n } from '../i18n'

type Msg = { s: string; v?: Record<string, string | number>; id: number }
let push: ((m: Msg) => void) | null = null
/** Pass the English key. It is translated when shown. */
export const toast = (s: string, v?: Record<string, string | number>) => push?.({ s, v, id: Date.now() })

export function ToastHost() {
  const { t } = useI18n()
  const [m, setM] = useState<Msg | null>(null)
  const [show, setShow] = useState(false)
  useEffect(() => { push = (x: Msg) => { setM(x); setShow(true) }; return () => { push = null } }, [])
  useEffect(() => { if (!show) return; const id = window.setTimeout(() => setShow(false), 3400); return () => clearTimeout(id) }, [m, show])
  return <div id="toast" className={show ? 's' : ''} role="status" aria-live="polite">{m ? t(m.s, m.v) : ''}</div>
}
export function confetti(x: number, y: number) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const c = ['#E66A4E', '#E9AA3B', '#6C9275', '#153C4A', '#EAE3F0'], f = document.createDocumentFragment()
  for (let i = 0; i < 26; i++) {
    const p = document.createElement('i'); p.className = 'cf'
    p.style.cssText = `left:${x}px;top:${y}px;background:${c[i % 5]};--dx:${(Math.random() - .5) * 320}px;--dy:${-90 - Math.random() * 220}px;--r:${Math.random() * 720}deg`
    f.appendChild(p); setTimeout(() => p.remove(), 1300)
  }
  document.body.appendChild(f)
}
