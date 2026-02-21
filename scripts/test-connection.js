import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yuspulrxjyeynmiifvni.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1c3B1bHJ4anlleW5taWlmdm5pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQ3NzYwMywiZXhwIjoyMDg3MDUzNjAzfQ.PCsuEkvXulH0Qa5GuvUgkEXta_jHXbk-K63zLP55Lc4'

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function main() {
  console.log('Testing connection...')
  try {
    const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 5 })
    if (error) {
      console.error('List users error:', error)
    } else {
      console.log('List users success. Count:', data.users.length)
      data.users.forEach(u => console.log(`- ${u.email} (${u.id})`))
    }
  } catch (e) {
    console.error('Exception:', e)
  }
}

main()
