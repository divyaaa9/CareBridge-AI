import { useState } from 'react'
import { useI18n } from '../i18n'
import { useStore } from '../store'
import { A } from '../actions'
import { AS, DS, PageHead, openModal } from '../components/ui'
import { SourceSheet } from '../components/sheets'

export default function Records() {
  const S = useStore(), { t, fmtDate } = useI18n(), [q, setQ] = useState('')
  const rows: [string, string, string, string][] = [['🏥', `${S.ext.hosp} · ${S.ext.dept}`, `${t('Admission')} · ${fmtDate(S.ext.dd)}`, 'adm'], ['📄', 'Discharge summary (PDF)', `${t('Source document')} · ${fmtDate(S.ext.dd)}`, 'doc'],
    ['📋', `Care plan v${S.ver}`, t('Plan version'), 'plan'], ['📋', 'Care plan v1', t('Plan version'), 'plan'],
    ...S.log.slice(0, 4).map((x): [string, string, string, string] => ['💊', x.t, `${t('Medicine event')} · ${t(DS[x.st][1])}`, 'ev']),
    ...S.appts.map((a): [string, string, string, string] => ['📅', t(a.n), `${t('Appointment')} · ${t(AS[a.s][0])}`, 'ap'])]
  const f = rows.filter(r => !q || (r[1] + r[2]).toLowerCase().includes(q.toLowerCase()))
  return <>
    <PageHead h={t('Records')} p={t('Your admissions, documents, plan versions and history')}><button className="btn o s" onClick={A.exportData}>⬇️ {t('Export my records')}</button></PageHead>
    <div className="card"><input type="text" placeholder={'🔎 ' + t('Search records')} value={q} onChange={e => setQ(e.target.value)} aria-label={t('Search records')} />
      <div style={{ marginTop: 8 }}>{f.length ? f.map((r, i) => <div className="it" key={i}><div className="ic2">{r[0]}</div><div><h3>{r[1]}</h3><p>{r[2]}</p></div>{r[3] === 'doc' && <button className="btn s o x" onClick={() => openModal(<SourceSheet line={0} />)}>{t('View')}</button>}</div>) : <p className="mut">{t('No matching records.')}</p>}</div></div>
    <div className="card" style={{ marginTop: 16 }}><h2>🔀 {t('Compare plan versions')}</h2><div style={{ overflowX: 'auto' }}>
      <table className="tbl"><thead><tr><th>{t('Item')}</th><th>v1</th><th>v{S.ver}</th></tr></thead><tbody>
        <tr><td>Amlodipine</td><td className="df">2.5 mg</td><td className="df">{S.ext.meds[1]?.s || '5 mg'}</td></tr>
        <tr><td>{t('Follow-up')}</td><td className="df">{t('in 1 week')}</td><td className="df">{t(S.ext.fu)}</td></tr>
        <tr><td>Pantoprazole</td><td>40 mg · 1-0-1</td><td>40 mg · 1-0-1</td></tr></tbody></table></div>
      <p className="mut" style={{ fontSize: 12.5, marginTop: 8 }}>ℹ️ {t('We highlight differences only. We do not decide which version is correct — ask your doctor.')}</p></div>
    <div className="card" style={{ marginTop: 16 }}><h2>✏️ {t('Correction history')}</h2>
      {S.corr.length ? S.corr.map((c, i) => <div className="it" key={i}><div><h3>{t(c.k)}</h3><p>{c.a} → {c.b} · {fmtDate(c.at)}</p></div></div>) : <p className="mut">{t('No corrections yet.')}</p>}</div></>
}
