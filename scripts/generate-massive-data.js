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

// Generate 200 random cards
const generatedCards = []
const topics = ['React', 'Vue', 'Angular', 'Node.js', 'Python', 'Go', 'Rust', 'Docker', 'K8s', 'AWS']
const concepts = ['Component', 'Directive', 'Service', 'Module', 'Container', 'Pod', 'Cluster', 'Lambda', 'EC2', 'S3']

for (let i = 0; i < 200; i++) {
  const topic = topics[Math.floor(Math.random() * topics.length)]
  const concept = concepts[Math.floor(Math.random() * concepts.length)]
  const categoryIndex = Math.floor(Math.random() * sampleCategories.length)
  const tag = sampleTags[Math.floor(Math.random() * sampleTags.length)]
  
  generatedCards.push({
    title: `${topic} - ${concept} #${i + 1}`,
    content: `This is a detailed explanation about **${concept}** in the context of **${topic}**.\n\nIt is very important for understanding modern software architecture.\n\n\`\`\`javascript\nconsole.log("Hello ${topic}");\n\`\`\``,
    categoryIndex,
    tags: [tag]
  })
}

async function main() {
  console.log(`Starting massive mock data generation for ${targetEmail}...`)

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

  // 2. Get Category IDs
  console.log('Fetching category IDs...')
  const categoryMap = new Map() // index -> id
  
  for (let i = 0; i < sampleCategories.length; i++) {
    const cat = sampleCategories[i]
    const { data: existingCat } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', userId)
      .eq('name', cat.name)
      .single()

    if (existingCat) {
      categoryMap.set(i, existingCat.id)
    } else {
      // Fallback create if not exists (should exist from previous script)
      const { data } = await supabase.from('categories').insert({
        user_id: userId,
        name: cat.name,
        color: cat.color,
        order_index: i
      }).select().single()
      if (data) categoryMap.set(i, data.id)
    }
  }

  // 3. Get Tag IDs
  console.log('Fetching tag IDs...')
  const tagMap = new Map() // name -> id
  for (const tagName of sampleTags) {
    const { data: existingTag } = await supabase.from('tags').select('id').eq('name', tagName).single()
    if (existingTag) tagMap.set(tagName, existingTag.id)
  }

  // 4. Batch Create Cards
  console.log(`Creating ${generatedCards.length} cards...`)
  
  // Prepare all card inserts
  const cardInserts = generatedCards.map(card => ({
    user_id: userId,
    category_id: categoryMap.get(card.categoryIndex),
    title: card.title,
    content: card.content,
    next_review: new Date().toISOString(),
    interval: 0,
    ease_factor: 2.5,
    review_count: 0
  }))

  // Insert in chunks of 50 to avoid payload limits
  const chunkSize = 50
  for (let i = 0; i < cardInserts.length; i += chunkSize) {
    const chunk = cardInserts.slice(i, i + chunkSize)
    const { data: insertedCards, error } = await supabase
      .from('cards')
      .insert(chunk)
      .select()
    
    if (error) {
      console.error(`Error inserting chunk ${i}:`, error)
      continue
    }

    // Link Tags for inserted cards
    const tagLinks = []
    insertedCards.forEach((card, index) => {
      const originalCard = generatedCards[i + index]
      if (originalCard.tags) {
        originalCard.tags.forEach(tagName => {
          const tagId = tagMap.get(tagName)
          if (tagId) tagLinks.push({ card_id: card.id, tag_id: tagId })
        })
      }
    })

    if (tagLinks.length > 0) {
      const { error: linkError } = await supabase.from('card_tags').insert(tagLinks)
      if (linkError) console.error('Error linking tags:', linkError)
    }
    
    console.log(`Inserted ${i + chunk.length}/${cardInserts.length} cards`)
  }

  console.log('\nMassive mock data generation complete!')
}

main()
