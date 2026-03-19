import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { type Profile } from '@/types'

/**
 * Returns the current user's profile, or null if not authenticated.
 * Use in server components and server actions.
 */
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (profile as Profile) ?? null
}

/**
 * Returns the current profile. Redirects to /login if not authenticated.
 */
export async function requireAuth(): Promise<Profile> {
  const profile = await getProfile()
  if (!profile) redirect('/login')
  return profile
}

/**
 * Returns the current profile. Redirects to /403 if not admin.
 */
export async function requireAdmin(): Promise<Profile> {
  const profile = await requireAuth()
  if (profile.role !== 'admin') redirect('/403')
  return profile
}

/**
 * Asserts the current user owns the resource (by owner_id).
 * Admins bypass ownership checks.
 * Redirects to /403 if not authorized.
 */
export function assertOwnership(profile: Profile, ownerId: string): void {
  if (profile.role === 'admin') return
  if (profile.id !== ownerId) redirect('/403')
}
