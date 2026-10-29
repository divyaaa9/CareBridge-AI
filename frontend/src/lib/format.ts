export const addDays = (n: number): string => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10) }
export const FD: Record<string, string> = { 'a/f': 'Before food', 'p/c': 'After food', 'w/f': 'With food' }
export const SLOT: [string, string][] = [['Morning', '8:00 AM'], ['Afternoon', '1:00 PM'], ['Night', '8:30 PM']]
/** Urgent wording is always checked on the client first. Never wait for a network call. */
export const URG = /fever|breath|chest|bleed|faint|unconscious|seizure|severe|suicid|can.?t breathe/i
export function flesch(txt: string): number {
  const w = txt.match(/[A-Za-z']+/g) || []
  const s = (txt.match(/[.!?]/g) || []).length || 1
  const sy = w.reduce((a, x) => a + Math.max(1, (x.toLowerCase().replace(/e$/, '').match(/[aeiouy]+/g) || []).length), 0)
  return Math.round(206.835 - 1.015 * (w.length / s) - 84.6 * (sy / Math.max(1, w.length)))
}
export const freqTxt = (f: string, t: (s: string) => string) => f.split('-').map((c, i) => (+c > 0 && SLOT[i] ? t(SLOT[i][0]) : null)).filter(Boolean).join(' + ')
