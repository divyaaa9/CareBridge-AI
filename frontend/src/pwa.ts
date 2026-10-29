import { useEffect, useState } from 'react'

interface BIPEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }
let deferred: BIPEvent | null = null
const subs = new Set<() => void>()
if (typeof window !== 'undefined') {
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e as BIPEvent; subs.forEach(f => f()) })
  addEventListener('appinstalled', () => { deferred = null; subs.forEach(f => f()) })
}
export const isStandalone = () => matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true
export const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent)
/** Install-as-app support (Android/desktop Chrome prompt, iOS instructions). */
export function useInstall() {
  const [, tick] = useState(0)
  useEffect(() => { const f = () => tick(x => x + 1); subs.add(f); return () => { subs.delete(f) } }, [])
  return {
    installed: isStandalone(), canPrompt: !!deferred, ios: isIOS() && !isStandalone(),
    install: async () => { if (!deferred) return false; await deferred.prompt(); const r = await deferred.userChoice; deferred = null; subs.forEach(f => f()); return r.outcome === 'accepted' },
  }
}
export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => undefined) })
}
