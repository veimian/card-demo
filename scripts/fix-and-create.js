import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yuspulrxjyeynmiifvni.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1c3B1bHJ4anlleW5taWlmdm5pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQ3NzYwMywiZXhwIjoyMDg3MDUzNjAzfQ.PCsuEkvXulH0Qa5GuvUgkEXta_jHXbk-K63zLP55Lc4'

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const usersToDelete = [
  'ba13df73-1f48-46f0-864e-395e9c4be244',
  '09f07a1d-27b8-47ff-a036-0c2b74a377c1'
]

async function main() {
  console.log('Attempting to delete broken users by ID...')
  
  for (const id of usersToDelete) {
    console.log(`Deleting ${id}...`)
    const { error } = await supabase.auth.admin.deleteUser(id)
    if (error) {
      console.error(`Delete failed for ${id}:`, error)
    } else {
      console.log(`Delete success for ${id}`)
    }
  }

  console.log('\nNow attempting to recreate users correctly via API...')
  
  const usersToCreate = [
    { email: '1405519648@qq.com', password: '12345678' },
    { email: 'sleepyaxin@163.com', password: '12345678' }
  ]

  for (const user of usersToCreate) {
    console.log(`Creating ${user.email}...`)
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { name: user.email.split('@')[0] }
    })
    
    if (error) {
      console.error(`Create failed for ${user.email}:`, error)
    } else {
      console.log(`Create success for ${user.email}. ID: ${data.user.id}`)
    }
  }
}

main()
