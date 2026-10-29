import { useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n'
import { A } from '../actions'
import { useStore } from '../store'
import { isDone } from '../lib/plan'
import { DosePill, openModal } from './ui'
import { DoseSheet, FollowUpSheet, SourceSheet } from './sheets'
import type { Flag, Task } from '../types'

const IC = { med: '💊', food: '🥗', act: '🚶' }
export function TaskRow({ x, detail = false }: { x: Task; detail?: boolean }) {
  const { t } = useI18n(), cg = useStore().user?.role === 'caregiver', done = isDone(x)
  return <div className={`it ${done ? 'd' : ''} ${detail ? 'b' : ''}`} onClick={detail ? () => openModal(<DoseSheet task={x} />) : undefined}>
    <button className="ck" role="checkbox" aria-checked={done} aria-label={x.t} onClick={e => { e.stopPropagation(); A.toggleTask(x.id, e.currentTarget.getBoundingClientRect()) }}>{done ? '✓' : ''}</button>
    <div className="ic2">{IC[x.k]}</div><div><h3>{x.k === 'med' ? x.t : t(x.t)}</h3><p>{t(x.s)} · {x.tm}</p></div><span className="x"><DosePill s={x.st} /></span></div>
}
export function FlagRow({ f }: { f: Flag }) {
  const { t } = useI18n(), nav = useNavigate(), cg = useStore().user?.role === 'caregiver'
  const v = f.v && f.v.w ? { ...f.v, w: t(String(f.v.w)) } : f.v
  const fix = f.fix === 'date' ? <button className="btn s" onClick={() => openModal(<FollowUpSheet />)}>{t('Confirm date')}</button>
    : f.fix.startsWith('ok:') ? <button className="btn s o" onClick={() => A.okField(f.fix.slice(3))}>{t('Looks right')}</button>
    : <button className="btn s o" onClick={() => nav('/app/review')}>{t('Review')}</button>
  return <div className={`flag ${f.lvl === 'info' ? '' : 'r'}`}><span>{f.lvl === 'crit' ? '⚑' : f.lvl === 'fail' ? '✕' : 'ℹ️'} {t(f.x, v)}</span>{!cg && fix}</div>
}
export const SrcBtn = ({ line, cls = 'x src' }: { line: number; cls?: string }) => {
  const { t } = useI18n()
  return <button className={cls} onClick={() => openModal(<SourceSheet line={line} />)}>📄 {t('Source')}</button>
}
