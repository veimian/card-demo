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

// 中文技术概念库
const concepts = [
  { topic: 'React', title: '虚拟 DOM (Virtual DOM)', content: '虚拟 DOM 是一个编程概念。在这个概念里，一种理想的或者“虚拟的” UI 表达形式被保存在内存中，并通过 ReactDOM 等类库使之与“真实的” DOM 同步。这一过程被称为**协调 (Reconciliation)**。' },
  { topic: 'React', title: 'useEffect Hook', content: '`useEffect` 让你可以执行副作用操作。数据获取，设置订阅以及手动更改 React 组件中的 DOM 都属于副作用。\n\n```javascript\nuseEffect(() => {\n  document.title = `You clicked ${count} times`;\n});\n```' },
  { topic: 'Vue', title: '双向数据绑定', content: 'Vue 的双向绑定是基于数据劫持和发布-订阅模式实现的。Vue 2 使用 `Object.defineProperty`，Vue 3 使用 `Proxy` 来劫持数据。' },
  { topic: 'Node.js', title: '事件循环 (Event Loop)', content: '事件循环是 Node.js 处理非阻塞 I/O 操作的机制。它由六个阶段组成：\n1. Timers\n2. Pending callbacks\n3. Idle, prepare\n4. Poll\n5. Check\n6. Close callbacks' },
  { topic: 'Network', title: 'HTTP/2 多路复用', content: 'HTTP/2 引入了多路复用技术，允许通过单一的 HTTP/2 连接发起多重的请求-响应消息。这解决了 HTTP/1.x 中的队头阻塞问题。' },
  { topic: 'Algorithm', title: '快速排序 (Quick Sort)', content: '快速排序使用分治法策略来把一个序列分为两个子序列。步骤为：\n1. 从数列中挑出一个元素，称为“基准”（pivot）；\n2. 重新排序数列，所有元素比基准值小的摆放在基准前面，所有元素比基准值大的摆在基准的后面。' },
  { topic: 'SystemDesign', title: '负载均衡 (Load Balancing)', content: '负载均衡是指将网络流量高效地分发到多个服务器上。常见的算法有：\n- 轮询 (Round Robin)\n- 加权轮询\n- 最少连接\n- IP 哈希' },
  { topic: 'Database', title: 'ACID 特性', content: '事务的四个特性：\n- **Atomicity (原子性)**：事务是不可分割的工作单位。\n- **Consistency (一致性)**：事务必须使数据库从一个一致性状态变换到另一个一致性状态。\n- **Isolation (隔离性)**：多个用户并发访问数据库时，数据库为每一个用户开启的事务，不能被其他事务的操作数据所干扰。\n- **Durability (持久性)**：一个事务一旦被提交，它对数据库中数据的改变就是永久性的。' }
]

// Generate 200 random cards (Chinese content)
const generatedCards = []

for (let i = 0; i < 200; i++) {
  const concept = concepts[Math.floor(Math.random() * concepts.length)]
  const categoryIndex = Math.floor(Math.random() * sampleCategories.length)
  const tag = sampleTags[Math.floor(Math.random() * sampleTags.length)]
  
  generatedCards.push({
    title: `${concept.title} #${i + 1}`,
    content: `${concept.content}\n\n> 这是关于 **${concept.topic}** 的核心知识点复习卡片。`,
    categoryIndex,
    tags: [tag]
  })
}

async function main() {
  console.log(`Starting massive CHINESE mock data generation for ${targetEmail}...`)

  // 1. Get or Create User
  let userId
  const { data: { users } } = await supabase.auth.admin.listUsers()
  const existingUser = users.find(u => u.email === targetEmail)

  if (existingUser) {
    console.log(`User found: ${existingUser.id}`)
    userId = existingUser.id
  } else {
    console.error('User not found! Please run generate-mock-data.js first to create the user.')
    return
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
      // Fallback create
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

  // Insert in chunks of 50
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

  console.log('\nMassive CHINESE mock data generation complete!')
}

main()
