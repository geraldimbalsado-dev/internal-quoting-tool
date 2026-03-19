/**
 * Seed demo users for development/demo purposes.
 *
 * Usage:
 *   npx tsx scripts/seed-demo-users.ts
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const demoUsers = [
  {
    email: 'admin@demo.com',
    password: 'demo1234',
    full_name: 'Admin User',
    role: 'admin',
  },
  {
    email: 'sarah@demo.com',
    password: 'demo1234',
    full_name: 'Sarah Sales',
    role: 'sales',
  },
  {
    email: 'mike@demo.com',
    password: 'demo1234',
    full_name: 'Mike Sales',
    role: 'sales',
  },
]

async function seedUsers() {
  console.log('Seeding demo users...\n')

  for (const user of demoUsers) {
    // Check if user already exists
    const { data: existing } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', user.email)
      .single()

    if (existing) {
      console.log(`  ⏭  ${user.email} already exists, skipping`)
      continue
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: {
        full_name: user.full_name,
        role: user.role,
      },
    })

    if (error) {
      console.error(`  ✗  Failed to create ${user.email}:`, error.message)
      continue
    }

    console.log(`  ✓  Created ${user.role}: ${user.email} (id: ${data.user?.id})`)
  }

  console.log('\nDone.')
}

seedUsers().catch(console.error)
