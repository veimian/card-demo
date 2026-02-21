import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yuspulrxjyeynmiifvni.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1c3B1bHJ4anlleW5taWlmdm5pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQ3NzYwMywiZXhwIjoyMDg3MDUzNjAzfQ.PCsuEkvXulH0Qa5GuvUgkEXta_jHXbk-K63zLP55Lc4'

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const targetUsers = [
  { email: '1405519648@qq.com', password: '12345678' },
  { email: 'sleepyaxin@163.com', password: '12345678' }
]

async function main() {
  console.log('Starting user setup...')

  // Get all users (assuming < 1000 for this demo, otherwise need pagination)
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  
  if (listError) {
    console.error('Error listing users:', listError)
    return
  }

  console.log(`Found ${users.length} total users in project.`)

  for (const target of targetUsers) {
    console.log(`\nProcessing ${target.email}...`)
    
    // Find existing user
    const existingUser = users.find(u => u.email === target.email)

    // Delete if exists
    if (existingUser) {
      console.log(`User exists (ID: ${existingUser.id}). Deleting...`)
      const { error: deleteError } = await supabase.auth.admin.deleteUser(existingUser.id)
      
      if (deleteError) {
        console.error(`Failed to delete user: ${deleteError.message}`)
        continue
      }
      console.log('User deleted.')
    }

    // Create user
    console.log('Creating user...')
    const { data, error: createError } = await supabase.auth.admin.createUser({
      email: target.email,
      password: target.password,
      email_confirm: true,
      user_metadata: { name: target.email.split('@')[0] }
    })

    if (createError) {
      console.error(`Failed to create user: ${createError.message}`)
    } else {
      console.log(`User created successfully! ID: ${data.user.id}`)
      console.log(`Email: ${target.email}`)
      console.log(`Password: ${target.password}`)
    }
  }
  
  console.log('\nAll done.')
}

main()
