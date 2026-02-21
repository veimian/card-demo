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
  const users = []
  
  // Create 15 test users
  for (let i = 1; i <= 15; i++) {
    users.push({
      email: `test_user_${i}@example.com`,
      password: 'password123',
      name: `测试用户${i}`
    })
  }

  console.log('Starting batch creation of test users...')
  
  for (const user of users) {
    // Check if user exists
    const { data: { users: existingUsers } } = await supabase.auth.admin.listUsers()
    const exists = existingUsers.find(u => u.email === user.email)
    
    if (exists) {
      console.log(`User ${user.email} already exists. Skipping.`)
      continue
    }

    console.log(`Creating ${user.email}...`)
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { name: user.name }
    })

    if (error) {
      console.error(`Failed to create ${user.email}:`, error.message)
    } else {
      console.log(`Created ${user.email} (ID: ${data.user.id})`)
    }
  }
  
  console.log('\nAll done! You can login with these accounts.')
  console.log('Password for all accounts: password123')
}

main()
