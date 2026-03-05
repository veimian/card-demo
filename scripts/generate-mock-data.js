import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yuspulrxjyeynmiifvni.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1c3B1bHJ4anlleW5taWlmdm5pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQ3NzYwMywiZXhwIjoyMDg3MDUzNjAzfQ.PCsuEkvXulH0Qa5GuvUgkEXta_jHXbk-K63zLP55Lc4'

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const targetEmail = 'moyu23212@gmail.com'

const sampleCategories = [
  { name: '前端开发', color: '#3b82f6' },
  { name: '算法基础', color: '#10b981' },
  { name: '英语词汇', color: '#f59e0b' },
  { name: '系统设计', color: '#8b5cf6' }
]

const sampleTags = ['React', 'TypeScript', 'LeetCode', 'SystemDesign', 'Vocabulary']

const sampleCards = [
  {
    title: 'React Hooks 的规则',
    content: '1. 只能在函数组件的最外层调用 Hook。\n2. 只能在 React 函数组件中调用 Hook。\n\n**为什么？**\n为了确保 Hook 在每次渲染中都按照同样的顺序被调用。',
    categoryIndex: 0,
    tags: ['React']
  },
  {
    title: 'TCP 三次握手',
    content: '1. 第一次握手：客户端发送 SYN 包，进入 SYN_SEND 状态。\n2. 第二次握手：服务器收到 SYN 包，发送 SYN+ACK 包，进入 SYN_RECV 状态。\n3. 第三次握手：客户端收到 SYN+ACK 包，发送 ACK 包，客户端和服务器进入 ESTABLISHED 状态。',
    categoryIndex: 1,
    tags: ['SystemDesign']
  },
  {
    title: 'ephemeral',
    content: '**Definition**: lasting for a very short time.\n\n**Example**: Fashions are ephemeral, changing with every season.',
    categoryIndex: 2,
    tags: ['Vocabulary']
  },
  {
    title: 'CAP 定理',
    content: '在一个分布式系统中，Consistency（一致性）、Availability（可用性）、Partition tolerance（分区容错性），三者不可兼得。\n\n通常在 P 必须满足的情况下，在 C 和 A 之间做权衡。',
    categoryIndex: 3,
    tags: ['SystemDesign']
  },
  {
    title: 'TypeScript 泛型',
    content: '泛型（Generics）是指在定义函数、接口或类的时候，不预先指定具体的类型，而在使用的时候再指定类型的一种特性。\n\n```typescript\nfunction identity<T>(arg: T): T {\n    return arg;\n}\n```',
    categoryIndex: 0,
    tags: ['TypeScript']
  }
]

async function main() {
  console.log(`Starting mock data generation for ${targetEmail}...`)

  // 1. Get or Create User
  let userId
  const { data: { users } } = await supabase.auth.admin.listUsers()
  const existingUser = users.find(u => u.email === targetEmail)

  if (existingUser) {
    console.log(`User found: ${existingUser.id}`)
    userId = existingUser.id
  } else {
    console.log('User not found, creating...')
    const { data, error } = await supabase.auth.admin.createUser({
      email: targetEmail,
      password: 'password123',
      email_confirm: true,
      user_metadata: { name: 'Moyu' }
    })
    if (error) {
      console.error('Failed to create user:', error)
      return
    }
    userId = data.user.id
    console.log(`User created: ${userId}`)
  }

  // 2. Create Categories
  console.log('Creating categories...')
  const categoryMap = new Map() // index -> id
  
  for (let i = 0; i < sampleCategories.length; i++) {
    const cat = sampleCategories[i]
    // Check if exists
    const { data: existingCats } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', userId)
      .eq('name', cat.name)
      .single()

    if (existingCats) {
      categoryMap.set(i, existingCats.id)
    } else {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          user_id: userId,
          name: cat.name,
          color: cat.color,
          order_index: i
        })
        .select()
        .single()
      
      if (error) console.error(`Failed to create category ${cat.name}:`, error)
      else categoryMap.set(i, data.id)
    }
  }

  // 3. Create Tags (Global/Shared in current schema, but filtered by usage in frontend)
  // We just ensure they exist in the `tags` table
  console.log('Creating tags...')
  const tagMap = new Map() // name -> id

  for (const tagName of sampleTags) {
    // Try insert, ignore conflict
    const { data: existingTag } = await supabase
      .from('tags')
      .select('id')
      .eq('name', tagName)
      .single()

    if (existingTag) {
      tagMap.set(tagName, existingTag.id)
    } else {
      const { data, error } = await supabase
        .from('tags')
        .insert({ name: tagName })
        .select()
        .single()
      
      if (error && error.code !== '23505') { // Ignore unique violation
        console.error(`Failed to create tag ${tagName}:`, error)
      } else if (data) {
        tagMap.set(tagName, data.id)
      } else {
        // Retry fetch if concurrent insert happened
        const { data: retryTag } = await supabase.from('tags').select('id').eq('name', tagName).single()
        if (retryTag) tagMap.set(tagName, retryTag.id)
      }
    }
  }

  // 4. Create Cards
  console.log('Creating cards...')
  for (const card of sampleCards) {
    const categoryId = categoryMap.get(card.categoryIndex)
    
    // Create card
    const { data: cardData, error: cardError } = await supabase
      .from('cards')
      .insert({
        user_id: userId,
        category_id: categoryId,
        title: card.title,
        content: card.content,
        next_review: new Date().toISOString(), // Due now
        interval: 0,
        ease_factor: 2.5,
        review_count: 0
      })
      .select()
      .single()

    if (cardError) {
      console.error(`Failed to create card ${card.title}:`, cardError)
      continue
    }

    // Link Tags
    if (card.tags && card.tags.length > 0) {
      const tagLinks = card.tags.map(tagName => {
        const tagId = tagMap.get(tagName)
        if (!tagId) return null
        return { card_id: cardData.id, tag_id: tagId }
      }).filter(Boolean)

      if (tagLinks.length > 0) {
        const { error: linkError } = await supabase
          .from('card_tags')
          .insert(tagLinks)
        
        if (linkError) console.error(`Failed to link tags for ${card.title}:`, linkError)
      }
    }
  }

  // 5. Create Mock User Stats
  console.log('Creating user stats...')
  const { error: statsError } = await supabase
    .from('user_stats')
    .upsert({
      user_id: userId,
      current_streak: 3,
      longest_streak: 5,
      total_reviews: 42,
      last_review_date: new Date().toISOString(),
      daily_goal: 20
    })
  
  if (statsError) console.error('Failed to create user stats:', statsError)

  // 6. Create Mock Review Logs (Past 7 days)
  console.log('Creating review logs...')
  const logs = []
  const now = new Date()
  for (let i = 0; i < 7; i++) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    
    // Random reviews per day
    const count = Math.floor(Math.random() * 10) + 5
    for (let j = 0; j < count; j++) {
      logs.push({
        user_id: userId,
        // We don't link to specific cards for aggregate stats, 
        // or we could pick a random card ID if we tracked them all.
        // For heatmap, just having the record is enough usually.
        rating: Math.floor(Math.random() * 3) + 3, // 3-5
        review_date: date.toISOString(),
        time_spent: Math.floor(Math.random() * 30) + 5
      })
    }
  }
  
  const { error: logError } = await supabase.from('review_logs').insert(logs)
  if (logError) console.error('Failed to create review logs:', logError)

  console.log('\nMock data generation complete!')
  console.log(`Email: ${targetEmail}`)
  console.log('Password: password123')
}

main()
