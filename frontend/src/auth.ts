import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Role, User } from './types'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY
/** Supabase is optional. Without env vars the app runs in demo mode with a fake session. */
export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null

export async function getToken(): Promise<string | null> {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}
const fromUser = (u: { email?: string; user_metadata?: Record<string, unknown> }, fallback: Role): User => {
  const m = u.user_metadata || {}
  return { name: String(m.name || (u.email || 'User').split('@')[0]), role: (m.role as Role) || fallback, email: u.email || '' }
}
export async function signIn(email: string, password: string, role: Role): Promise<User> {
  if (!supabase) return { name: role === 'caregiver' ? 'Lakshmi' : 'Ravi', role, email }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return fromUser(data.user, role)
}
export async function signUp(name: string, email: string, password: string, role: Role): Promise<User> {
  if (!supabase) return { name, role, email }
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name, role } } })
  if (error) throw error
  if (!data.user) throw new Error('Check your email to confirm your account.')
  return fromUser(data.user, role)
}
export async function signOutRemote() { await supabase?.auth.signOut() }
export async function restoreSession(): Promise<User | null> {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session ? fromUser(data.session.user, 'patient') : null
}
export async function signInWithGoogle(role: Role): Promise<User | null> {
  if (!supabase) return { name: role === 'caregiver' ? 'Lakshmi' : 'Ravi', role, email: 'demo@carebridge.demo' }
  const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${location.origin}/app/home` } })
  if (error) throw error
  return null // the browser redirects to Google; the session is restored on return
}
export async function resetPassword(email: string) {
  if (!supabase) return
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/login` })
  if (error) throw error
}
