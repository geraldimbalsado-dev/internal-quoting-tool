'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const clientSchema = z.object({
  company_name: z.string().min(1, 'Company name is required').max(200),
  contact_name: z.string().min(1, 'Contact name is required').max(200),
  email: z.string().email('Invalid email address'),
  phone: z.string().max(50).optional().or(z.literal('')),
})

export async function createClientAction(formData: FormData) {
  const profile = await requireAuth()

  const raw = {
    company_name: formData.get('company_name') as string,
    contact_name: formData.get('contact_name') as string,
    email: formData.get('email') as string,
    phone: formData.get('phone') as string,
  }

  const parsed = clientSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clients')
    .insert({
      company_name: parsed.data.company_name,
      contact_name: parsed.data.contact_name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      owner_id: profile.id,
    })
    .select('id')
    .single()

  if (error) {
    console.error('createClient error:', error)
    return { error: 'Failed to create client. Please try again.' }
  }

  revalidatePath('/clients')
  redirect(`/clients/${data.id}`)
}

export async function updateClientAction(id: string, formData: FormData) {
  const profile = await requireAuth()

  const raw = {
    company_name: formData.get('company_name') as string,
    contact_name: formData.get('contact_name') as string,
    email: formData.get('email') as string,
    phone: formData.get('phone') as string,
  }

  const parsed = clientSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()

  // RLS enforces ownership, but verify explicitly for clear error messaging
  const { data: existing } = await supabase
    .from('clients')
    .select('owner_id')
    .eq('id', id)
    .single()

  if (!existing) return { error: 'Client not found.' }
  if (profile.role !== 'admin' && existing.owner_id !== profile.id) {
    return { error: 'You do not have permission to edit this client.' }
  }

  const { error } = await supabase
    .from('clients')
    .update({
      company_name: parsed.data.company_name,
      contact_name: parsed.data.contact_name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
    })
    .eq('id', id)

  if (error) {
    console.error('updateClient error:', error)
    return { error: 'Failed to update client. Please try again.' }
  }

  revalidatePath('/clients')
  revalidatePath(`/clients/${id}`)
  redirect(`/clients/${id}`)
}

export async function deleteClientAction(id: string) {
  const profile = await requireAuth()
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('clients')
    .select('owner_id')
    .eq('id', id)
    .single()

  if (!existing) return { error: 'Client not found.' }
  if (profile.role !== 'admin' && existing.owner_id !== profile.id) {
    return { error: 'You do not have permission to delete this client.' }
  }

  // Check if client has quotes — block deletion to preserve history
  const { count } = await supabase
    .from('quotes')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', id)

  if (count && count > 0) {
    return { error: `Cannot delete client with ${count} existing quote(s). Archive them first.` }
  }

  const { error } = await supabase.from('clients').delete().eq('id', id)
  if (error) return { error: 'Failed to delete client.' }

  revalidatePath('/clients')
  redirect('/clients')
}
