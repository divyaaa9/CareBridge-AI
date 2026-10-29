import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useI18n } from '../i18n'
import type { DoseStatus, PlanStatus } from '../types'

export const DS: Record<DoseStatus, [string, string, string]> = { taken: ['g', 'Taken', '✓'], late: ['a', 'Late', '⏰'], missed: ['c', 'Missed', '✕'], skipped: ['l', 'Skipped', '⤼'], unsure: ['a', 'Unsure', '?'] }
export const AS: [string, string, string][] = [['Not Booked', 'c', '○'], ['Request Pending', 'a', '⏳'], ['Confirmed', 'g', '✓'], ['Rescheduled', 'a', '↻'], ['Completed', 'g', '✔'], ['Missed', 'c', '✕'], ['Cancelled', 'l', '⊘']]
export const SB: Record<PlanStatus, [string, string]> = { 'Draft': ['l', '✎'], 'Needs Clarification': ['a', '⚑'], 'Validation Failed': ['c', '✕'], 'Ready to Use': ['g', '✓'] }
export const PV: Record<string, [string, string]> = { extracted: ['📄', 'Extracted from document'], corrected: ['✏️', 'Corrected by you'], ai: ['✨', 'AI-simplified'], reported: ['🧑', 'Reported by you'], uncertain: ['❓', 'Uncertain'], confirmed: ['✅', 'Confirmed by service'] }

export const Pv = ({ k }: { k: string }) => { const { t } = useI18n(); return <span className="pv">{PV[k][0]} {t(PV[k][1])}</span> }
export const DosePill = ({ s }: { s: DoseStatus | null }) => { const { t } = useI18n(); return s ? <span className={`pill ${DS[s][0]}`}>{DS[s][2]} {t(DS[s][1])}</span> : <span className="pill l">{t('Due')}</span> }
export const ApptPill = ({ s }: { s: number }) => { const { t } = useI18n(); return <span className={`pill ${AS[s][1]}`}>{AS[s][2]} {t(AS[s][0])}</span> }
export const StatusBadge = ({ s }: { s: PlanStatus }) => { const { t } = useI18n(); return <span className={`pill ${SB[s][0]}`}>{SB[s][1]} {t(s)}</span> }
export const PageHead = ({ h, p, children }: { h: ReactNode; p?: ReactNode; children?: ReactNode }) => (
  <div className="hd"><div><h1 className="disp">{h}</h1><p>{p}</p></div>{children}</div>)

export function Ring({ p, size = 130, light = false, color = '#6C9275' }: { p: number; size?: number; light?: boolean; color?: string }) {
  const r = 46, C = 2 * Math.PI * r
  return <svg className={`ring ${light ? 'lt' : ''}`} viewBox="0 0 120 120" width={size} height={size} role="img" aria-label={`${p}%`}>
    <circle className="bg" cx="60" cy="60" r={r} /><circle className="fg" cx="60" cy="60" r={r} stroke={color} style={{ '--c': (C * p) / 100 } as CSSProperties} /></svg>
}
export function LineChart({ series, colors, lo, hi, labels, ticks = 4 }: { series: number[][]; colors: string[]; lo: number; hi: number; labels: string[]; ticks?: number }) {
  const w = 520, h = 190, p = 30, n = Math.max(1, series[0].length - 1)
  const X = (i: number) => p + (i * (w - 2 * p)) / n, Y = (v: number) => h - p - ((v - lo) / (hi - lo)) * (h - 2 * p)
  return <svg viewBox={`0 0 ${w} ${h}`} width="100%" role="img">
    {Array.from({ length: ticks + 1 }, (_, i) => i).map(i => { const v = lo + ((hi - lo) * i) / ticks, y = Y(v); return <g key={i}><line x1={p} x2={w - p} y1={y} y2={y} stroke="#E7DED2" /><text x="2" y={y + 3}>{Math.round(v)}</text></g> })}
    {series.map((s, k) => <g key={k}><polyline className="ln" pathLength={1} fill="none" stroke={colors[k]} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" points={s.map((v, i) => `${X(i)},${Y(v)}`).join(' ')} />
      {s.map((v, i) => <circle key={i} cx={X(i)} cy={Y(v)} r="4.5" fill="#fff" stroke={colors[k]} strokeWidth="2.5"><title>{v}</title></circle>)}</g>)}
    {labels.map((l, i) => <text key={i} x={X(i) - 6} y={h - 8}>{l}</text>)}</svg>
}
export function BarChart({ data, labels }: { data: number[]; labels: (string | number)[] }) {
  const w = 520, h = 190, p = 30, bw = (w - 2 * p) / data.length
  return <svg viewBox={`0 0 ${w} ${h}`} width="100%" role="img">
    {[0, 50, 100].map(v => { const y = h - p - (v / 100) * (h - 2 * p); return <g key={v}><line x1={p} x2={w - p} y1={y} y2={y} stroke="#E7DED2" /><text x="2" y={y + 3}>{v}</text></g> })}
    {data.map((v, i) => { const bh = (v / 100) * (h - 2 * p); return <g key={i}><rect className="bx" style={{ animationDelay: `${i * 60}ms` }} x={p + i * bw + 9} y={h - p - bh} width={bw - 18} height={bh} rx="8" fill={v < 80 ? '#E9AA3B' : '#6C9275'}><title>{v}%</title></rect><text x={p + i * bw + bw / 2 - 5} y={h - 10}>{labels[i]}</text></g> })}</svg>
}
/** Decorative QR-style pattern derived from the token. The real QR should be generated server-side. */
export function Qr({ token }: { token: string }) {
  let h = 0; for (const c of token) h = (h * 31 + c.charCodeAt(0)) >>> 0
  const cells: boolean[] = []
  for (let y = 0; y < 21; y++) for (let x = 0; x < 21; x++) {
    if ((x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12)) { const lx = x > 12 ? x - 13 : x, ly = y > 12 ? y - 13 : y, a = Math.max(Math.abs(lx - 3), Math.abs(ly - 3)); cells.push(a === 3 || a <= 1) }
    else { h = (h * 1103515245 + 12345) >>> 0; cells.push((h >>> 16) % 2 === 0) }
  }
  return <div className="qr" aria-label="QR">{cells.map((on, i) => <i key={i} className={on ? '' : 'o'} />)}</div>
}

/* ---- global modal host: openModal(<Sheet/>) from anywhere ---- */
let host: ((n: ReactNode | null, wide?: boolean) => void) | null = null
export const openModal = (n: ReactNode, wide = false) => host?.(n, wide)
export const closeModal = () => host?.(null)
export function ModalHost() {
  const [m, setM] = useState<{ n: ReactNode; wide: boolean } | null>(null)
  const last = useRef<HTMLElement | null>(null)
  useEffect(() => {
    host = (n, wide = false) => { if (n) last.current = document.activeElement as HTMLElement; else last.current?.focus?.(); setM(n ? { n, wide } : null) }
    return () => { host = null }
  }, [])
  useEffect(() => {
    if (!m) return
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal() }
    addEventListener('keydown', k)
    const id = window.setTimeout(() => document.querySelector<HTMLElement>('.mod input,.mod select,.mod textarea,.mod button')?.focus(), 0)
    return () => { removeEventListener('keydown', k); clearTimeout(id) }
  }, [m])
  if (!m) return null
  return <div className={`mod ${m.wide ? 'wide' : ''}`} role="dialog" aria-modal="true" onClick={e => { if (e.target === e.currentTarget) closeModal() }}><div className="card">{m.n}</div></div>
}
