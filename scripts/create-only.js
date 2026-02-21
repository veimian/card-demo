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
  console.log('Attempting to create user 1405519648@qq.com...')
  
  const { data, error } = await supabase.auth.admin.createUser({
    email: '1405519648@qq.com',
    password: '12345678',
    email_confirm: true
  })

  if (error) {
    console.error('Create failed:', error)
  } else {
    console.log('Create success:', data.user.id)
  }

  console.log('\nAttempting to create user sleepyaxin@163.com...')
  const { data: data2, error: error2 } = await supabase.auth.admin.createUser({
    email: 'sleepyaxin@163.com',
    password: '12345678',
    email_confirm: true
  })

  if (error2) {
    console.error('Create failed:', error2)
  } else {
    console.log('Create success:', data2.user.id)
  }
}

main()
