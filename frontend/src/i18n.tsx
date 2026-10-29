import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { toast } from './components/toast'
import { translateStrings } from './translate'
import STRINGS from './strings.json'

/** code → [native name, English name, BCP-47 locale for dates, right-to-left?, Google code if different] */
export const LANGS: Record<string, [string, string, string, boolean?, string?]> = {
  en: ['English', 'English', 'en-IN'],
  hi: ['हिन्दी', 'Hindi', 'hi-IN'], te: ['తెలుగు', 'Telugu', 'te-IN'], ta: ['தமிழ்', 'Tamil', 'ta-IN'], kn: ['ಕನ್ನಡ', 'Kannada', 'kn-IN'], ml: ['മലയാളം', 'Malayalam', 'ml-IN'],
  mr: ['मराठी', 'Marathi', 'mr-IN'], bn: ['বাংলা', 'Bengali', 'bn-IN'], gu: ['ગુજરાતી', 'Gujarati', 'gu-IN'], pa: ['ਪੰਜਾਬੀ', 'Punjabi', 'pa-IN'], or: ['ଓଡ଼ିଆ', 'Odia', 'or-IN'],
  as: ['অসমীয়া', 'Assamese', 'as-IN'], ur: ['اردو', 'Urdu', 'ur-IN', true], ne: ['नेपाली', 'Nepali', 'ne-NP'], si: ['සිංහල', 'Sinhala', 'si-LK'],
  ar: ['العربية', 'Arabic', 'ar', true], fa: ['فارسی', 'Persian', 'fa-IR', true], he: ['עברית', 'Hebrew', 'he-IL', true, 'iw'], tr: ['Türkçe', 'Turkish', 'tr-TR'],
  es: ['Español', 'Spanish', 'es-ES'], fr: ['Français', 'French', 'fr-FR'], de: ['Deutsch', 'German', 'de-DE'], pt: ['Português', 'Portuguese', 'pt-PT'], it: ['Italiano', 'Italian', 'it-IT'],
  nl: ['Nederlands', 'Dutch', 'nl-NL'], pl: ['Polski', 'Polish', 'pl-PL'], ru: ['Русский', 'Russian', 'ru-RU'], uk: ['Українська', 'Ukrainian', 'uk-UA'], el: ['Ελληνικά', 'Greek', 'el-GR'], sv: ['Svenska', 'Swedish', 'sv-SE'],
  id: ['Bahasa Indonesia', 'Indonesian', 'id-ID'], ms: ['Bahasa Melayu', 'Malay', 'ms-MY'], th: ['ไทย', 'Thai', 'th-TH'], vi: ['Tiếng Việt', 'Vietnamese', 'vi-VN'], tl: ['Filipino', 'Filipino', 'fil-PH'],
  ja: ['日本語', 'Japanese', 'ja-JP'], ko: ['한국어', 'Korean', 'ko-KR'], 'zh-CN': ['简体中文', 'Chinese (Simplified)', 'zh-CN'], 'zh-TW': ['繁體中文', 'Chinese (Traditional)', 'zh-TW'], sw: ['Kiswahili', 'Swahili', 'sw-KE'],
}
const env = (import.meta.env.VITE_ENABLED_LANGS || 'all').trim()
export const ENABLED = env === 'all' ? Object.keys(LANGS) : env.split(',').map(s => s.trim()).filter(c => LANGS[c])
const safeLocale = (c: string) => { try { return Intl.DateTimeFormat.supportedLocalesOf(LANGS[c][2]).length ? LANGS[c][2] : 'en-IN' } catch { return 'en-IN' } }

type Vars = Record<string, string | number>
interface I18n {
  lang: string; setLang: (c: string) => void; busy: boolean
  /** English source text → current language. {placeholders} are filled from vars. */
  t: (s: string, v?: Vars) => string
  fmtDate: (d: string | null, o?: Intl.DateTimeFormatOptions) => string
  fmtTime: (d: string) => string
}
const Ctx = createContext<I18n>(null as unknown as I18n)
export const useI18n = () => useContext(Ctx)
const fill = (s: string, v?: Vars) => (v ? s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? '')) : s)
const cacheKey = (c: string) => 'cb_tr2_' + c

/**
 * English is the only language written in the code. Every other language is translated automatically,
 * in batches, cached in localStorage, and all known screen text is pre-fetched in the background.
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState(() => { const l = localStorage.getItem('cb_lang') || 'en'; return ENABLED.includes(l) ? l : 'en' })
  const [cache, setCache] = useState<Record<string, string>>(() => { try { return JSON.parse(localStorage.getItem(cacheKey(localStorage.getItem('cb_lang') || 'en')) || '{}') } catch { return {} } })
  const [busy, setBusy] = useState(false)
  const queue = useRef(new Set<string>()), skip = useRef(new Set<string>()), timer = useRef<number>(), failed = useRef(false), langRef = useRef(lang), running = useRef(false)
  langRef.current = lang

  const flush = useCallback(async () => {
    if (running.current || !queue.current.size || langRef.current === 'en' || failed.current) return
    running.current = true; setBusy(true)
    const L = langRef.current, batch = [...queue.current].slice(0, 80)
    batch.forEach(s => queue.current.delete(s))
    try {
      const out = await translateStrings(batch, LANGS[L][4] || L)
      if (L === langRef.current) setCache(c => {
        const n = { ...c }; batch.forEach(s => { if (out[s]) n[s] = out[s]; else skip.current.add(s) })
        try { localStorage.setItem(cacheKey(L), JSON.stringify(n)) } catch { /* quota */ } return n
      })
    } catch {
      if (L === langRef.current) { failed.current = true; queue.current.clear(); toast('Translation is unavailable right now. Showing English.') }
    }
    running.current = false; setBusy(false)
    if (queue.current.size) timer.current = window.setTimeout(flush, 30)
  }, [])

  const t = useCallback((s: string, v?: Vars) => {
    if (lang === 'en') return fill(s, v)
    const c = cache[s]
    if (c) return fill(c, v)
    if (!failed.current && s.trim() && !skip.current.has(s)) { queue.current.add(s); clearTimeout(timer.current); timer.current = window.setTimeout(flush, 60) }
    return fill(s, v)
  }, [lang, cache, flush])

  const setLang = useCallback((c: string) => {
    localStorage.setItem('cb_lang', c); failed.current = false; queue.current.clear(); skip.current.clear()
    try { setCache(JSON.parse(localStorage.getItem(cacheKey(c)) || '{}')) } catch { setCache({}) }
    setLangState(c)
  }, [])
  useEffect(() => { document.documentElement.lang = lang; document.documentElement.dir = LANGS[lang][3] ? 'rtl' : 'ltr' }, [lang])
  // after the current screen is translated, pre-fetch every other known string so the rest of the app is instant
  useEffect(() => {
    if (lang === 'en') return
    const id = window.setTimeout(() => { (STRINGS as string[]).forEach(s => { if (!cache[s] && !skip.current.has(s)) queue.current.add(s) }); flush() }, 1500)
    return () => clearTimeout(id)
  }, [lang]) // eslint-disable-line react-hooks/exhaustive-deps

  const loc = safeLocale(lang)
  const fmtDate = useCallback((d: string | null, o: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }) => (d ? new Date(d).toLocaleDateString(loc, o) : '—'), [loc])
  const fmtTime = useCallback((d: string) => new Date(d).toLocaleTimeString(loc, { hour: 'numeric', minute: '2-digit' }), [loc])
  const value = useMemo(() => ({ lang, setLang, busy, t, fmtDate, fmtTime }), [lang, setLang, busy, t, fmtDate, fmtTime])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
