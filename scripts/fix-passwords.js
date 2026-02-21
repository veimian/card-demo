import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yuspulrxjyeynmiifvni.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1c3B1bHJ4anlleW5taWlmdm5pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQ3NzYwMywiZXhwIjoyMDg3MDUzNjAzfQ.PCsuEkvXulH0Qa5GuvUgkEXta_jHXbk-K63zLP55Lc4'

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const users = [
  { email: '1405519648@qq.com', id: 'ba13df73-1f48-46f0-864e-395e9c4be244' },
  { email: 'sleepyaxin@163.com', id: '09f07a1d-27b8-47ff-a036-0c2b74a377c1' }
]

async function main() {
  for (const user of users) {
    console.log(`Updating password for ${user.email} (${user.id})...`)
    const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
      password: '12345678',
      email_confirm: true,
      user_metadata: { name: user.email.split('@')[0] }
    })

    if (error) {
      console.error('Update failed:', error)
    } else {
      console.log('Update success:', data.user.id)
    }
  }
}

main()
