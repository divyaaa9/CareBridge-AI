import { Capacitor } from '@capacitor/core'
import type { State } from './types'

export const isNative = () => { try { return Capacitor.isNativePlatform() } catch { return false } }
export const haptic = (ms = 12) => { try { navigator.vibrate?.(ms) } catch { /* not supported */ } }
const toHM = (tm: string) => { const m = tm.match(/(\d+):(\d+) (AM|PM)/); return m ? { hour: (+m[1] % 12) + (m[3] === 'PM' ? 12 : 0), minute: +m[2] } : null }
const hash = (s: string) => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 2147483000; return h + 1 }

/** Native app only: schedule repeating daily dose reminders with the OS (works when the app is closed). */
export async function scheduleDoseReminders(S: State, title: string, body: (m: string) => string) {
  if (!isNative()) return
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    const pending = await LocalNotifications.getPending()
    if (pending.notifications.length) await LocalNotifications.cancel({ notifications: pending.notifications })
    if (!S.notif.meds) return
    const perm = await LocalNotifications.checkPermissions()
    if (perm.display !== 'granted' && (await LocalNotifications.requestPermissions()).display !== 'granted') return
    const quiet = (h: number) => (S.notif.qs > S.notif.qe ? h >= S.notif.qs || h < S.notif.qe : h >= S.notif.qs && h < S.notif.qe)
    const notifications = S.tasks.filter(x => x.k === 'med').flatMap(x => {
      const hm = toHM(x.tm); if (!hm || quiet(hm.hour)) return []
      return [{ id: hash(x.id), title, body: body(x.t), schedule: { on: hm, repeats: true, allowWhileIdle: true } }]
    })
    if (notifications.length) await LocalNotifications.schedule({ notifications })
  } catch { /* plugin missing or permission denied: in-app reminders still work */ }
}
/** Android hardware back button. */
export async function onBackButton(handler: () => void): Promise<() => void> {
  if (!isNative()) return () => undefined
  try { const { App } = await import('@capacitor/app'); const h = await App.addListener('backButton', handler); return () => { h.remove() } } catch { return () => undefined }
}
