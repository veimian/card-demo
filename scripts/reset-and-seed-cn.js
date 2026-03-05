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

const categories = [
  { name: '前端开发', color: '#3b82f6' },  // Blue
  { name: '后端技术', color: '#10b981' },  // Green
  { name: '计算机基础', color: '#f59e0b' }, // Amber
  { name: '人工智能', color: '#8b5cf6' },   // Purple
  { name: '英语词汇', color: '#ec4899' }    // Pink
]

const tags = ['React', 'Vue', 'Node.js', 'Go', 'Python', 'Network', 'OS', 'Algorithm', 'AI', 'English']

// Sample content library
const contentLibrary = {
  '前端开发': [
    { title: 'React Virtual DOM', content: '虚拟 DOM 是 UI 的一种内存表示形式，与真实的 DOM 同步。' },
    { title: 'Vue 双向绑定', content: 'Vue 使用数据劫持结合发布者-订阅者模式实现双向绑定。' },
    { title: 'CSS Flexbox', content: 'Flexbox 是一种一维布局模型，用于在容器中分配空间并对齐内容。' },
    { title: 'JavaScript 闭包', content: '闭包是指有权访问另一个函数作用域中变量的函数。' }
  ],
  '后端技术': [
    { title: 'RESTful API', content: 'REST 是一种软件架构风格，基于 HTTP 协议，使用标准动词 (GET, POST...)。' },
    { title: 'Docker 容器', content: 'Docker 容器是轻量级的、可执行的软件包，包含运行所需的所有内容。' },
    { title: 'Redis 缓存', content: 'Redis 是一个开源的内存数据结构存储，用作数据库、缓存和消息代理。' },
    { title: '微服务架构', content: '微服务将应用构建为一组小型服务，每个服务运行在自己的进程中。' }
  ],
  '计算机基础': [
    { title: 'TCP 三次握手', content: '建立 TCP 连接时，客户端和服务器总共发送 3 个包。' },
    { title: '进程与线程', content: '进程是资源分配的最小单位，线程是 CPU 调度的最小单位。' },
    { title: 'HTTP/2', content: 'HTTP/2 引入了多路复用、头部压缩和服务器推送等特性。' },
    { title: '死锁', content: '死锁是指两个或两个以上的进程在执行过程中，因争夺资源而造成的一种互相等待的现象。' }
  ],
  '人工智能': [
    { title: 'Transformer 模型', content: 'Transformer 是一种基于注意力机制的深度学习模型，广泛用于 NLP。' },
    { title: '梯度下降', content: '梯度下降是一种优化算法，用于最小化损失函数。' },
    { title: '卷积神经网络 (CNN)', content: 'CNN 是一类包含卷积计算且具有深度结构的前馈神经网络，常用于图像处理。' },
    { title: '强化学习', content: '强化学习通过智能体与环境的交互，通过奖励机制来学习最优策略。' }
  ],
  '英语词汇': [
    { title: 'ephemeral', content: '**adj.** 短暂的；朝生暮死的。\n\nFashions are ephemeral, changing with every season.' },
    { title: 'ubiquitous', content: '**adj.** 无所不在的；普遍存在的。\n\nMobile phones are now ubiquitous.' },
    { title: 'serendipity', content: '**n.** 意外发现珍奇事物的本领；机缘凑巧。\n\nIt was pure serendipity that we met.' },
    { title: 'resilience', content: '**n.** 恢复力；弹力；顺应力。\n\nShe showed great resilience in the face of adversity.' }
  ]
}

async function main() {
  console.log(`Starting CLEAN reset and generation for ${targetEmail}...`)

  // 1. Get User
  const { data: { users } } = await supabase.auth.admin.listUsers()
  const user = users.find(u => u.email === targetEmail)

  if (!user) {
    console.error('User not found! Please create the user first.')
    return
  }
  const userId = user.id
  console.log(`Target User ID: ${userId}`)

  // 2. WIPE DATA (Cascade delete from Categories should handle Cards, Tags might be shared but card_tags will go)
  // Actually, `cards` delete cascades to `card_tags`, `review_logs`, `comments`.
  // `categories` delete cascades to `cards`.
  // `user_stats` is separate.
  
  console.log('Deleting existing data...')
  
  // Delete Categories (Cascades to Cards -> CardTags, Reviews, Comments)
  const { error: catDelError } = await supabase.from('categories').delete().eq('user_id', userId)
  if (catDelError) console.error('Error deleting categories:', catDelError)
  
  // Delete User Stats
  const { error: statDelError } = await supabase.from('user_stats').delete().eq('user_id', userId)
  if (statDelError) console.error('Error deleting stats:', statDelError)

  // Delete Review Logs (Just in case)
  const { error: logDelError } = await supabase.from('review_logs').delete().eq('user_id', userId)
  if (logDelError) console.error('Error deleting logs:', logDelError)

  // Note: We don't delete Tags because they might be global/shared in the schema, 
  // but since we filter by usage, it's fine. 
  // Or if we want to be thorough, we delete tags that are ONLY used by this user? Too complex.
  // We'll just start fresh with new links.

  console.log('Data wiped. Starting regeneration...')

  // 3. Create Categories
  const categoryMap = new Map() // name -> id
  for (let i = 0; i < categories.length; i++) {
    const { data, error } = await supabase.from('categories').insert({
      user_id: userId,
      name: categories[i].name,
      color: categories[i].color,
      order_index: i
    }).select().single()
    
    if (error) console.error('Error creating category:', error)
    else categoryMap.set(categories[i].name, data.id)
  }

  // 4. Create/Get Tags
  const tagMap = new Map()
  for (const tagName of tags) {
    // Try insert, ignore conflict
    await supabase.from('tags').insert({ name: tagName }).select()
    // Fetch ID
    const { data } = await supabase.from('tags').select('id').eq('name', tagName).single()
    if (data) tagMap.set(tagName, data.id)
  }

  // 5. Generate 200 Cards
  const cardsToInsert = []
  
  for (let i = 0; i < 200; i++) {
    const catName = categories[i % categories.length].name
    const catId = categoryMap.get(catName)
    const templates = contentLibrary[catName]
    const template = templates[i % templates.length]
    
    // Determine random SRS state
    // 30% New (No review)
    // 50% Learning/Reviewing
    // 20% Mastered (Long interval)
    
    const rand = Math.random()
    let nextReview = new Date()
    let interval = 0
    let reviewCount = 0
    let easeFactor = 2.5
    
    if (rand > 0.3) {
      // Reviewed at least once
      reviewCount = Math.floor(Math.random() * 10) + 1
      interval = Math.floor(Math.random() * 30) + 1
      easeFactor = 2.5 + (Math.random() * 0.5 - 0.2)
      
      // Randomize next review date: some due, some future
      const offset = Math.floor(Math.random() * 10) - 5 // -5 to +5 days from now
      nextReview.setDate(nextReview.getDate() + offset)
    }

    cardsToInsert.push({
      user_id: userId,
      category_id: catId,
      title: `${template.title} #${Math.floor(i / categories.length) + 1}`,
      content: `${template.content}\n\n> 自动生成的测试数据 #${i + 1}`,
      next_review: nextReview.toISOString(),
      interval,
      ease_factor: easeFactor,
      review_count: reviewCount
    })
  }

  // Batch Insert Cards
  const chunkSize = 50
  for (let i = 0; i < cardsToInsert.length; i += chunkSize) {
    const chunk = cardsToInsert.slice(i, i + chunkSize)
    const { data: insertedCards, error } = await supabase.from('cards').insert(chunk).select()
    
    if (error) {
      console.error(`Error inserting cards chunk ${i}:`, error)
      continue
    }

    // Link random tags
    const tagLinks = []
    insertedCards.forEach(card => {
      // Pick 1-2 random tags
      const numTags = Math.floor(Math.random() * 2) + 1
      for (let t = 0; t < numTags; t++) {
        const randomTag = tags[Math.floor(Math.random() * tags.length)]
        const tagId = tagMap.get(randomTag)
        if (tagId) tagLinks.push({ card_id: card.id, tag_id: tagId })
      }
    })
    
    // Insert unique tag links (simple dedup)
    const uniqueLinks = [...new Map(tagLinks.map(v => [`${v.card_id}-${v.tag_id}`, v])).values()]
    await supabase.from('card_tags').insert(uniqueLinks)
    
    console.log(`Inserted ${i + chunk.length}/200 cards`)
  }

  // 6. Generate Review Logs (User Stats)
  console.log('Generating review logs...')
  const logs = []
  const now = new Date()
  let totalReviews = 0
  
  // Simulate 14 days of history
  for (let d = 14; d >= 0; d--) {
    const date = new Date(now)
    date.setDate(date.getDate() - d)
    
    // Random activity: 80% chance to study on a day
    if (Math.random() > 0.2) {
      const dailyCount = Math.floor(Math.random() * 20) + 5
      totalReviews += dailyCount
      
      for (let r = 0; r < dailyCount; r++) {
        logs.push({
          user_id: userId,
          rating: Math.floor(Math.random() * 3) + 3, // 3-5
          review_date: new Date(date.getTime() + Math.random() * 3600000 * 12).toISOString(), // Random time in day
          time_spent: Math.floor(Math.random() * 60) + 5
        })
      }
    }
  }
  
  await supabase.from('review_logs').insert(logs)

  // 7. Update User Stats
  await supabase.from('user_stats').insert({
    user_id: userId,
    current_streak: 5, // Fake it
    longest_streak: 12,
    total_reviews: totalReviews,
    last_review_date: now.toISOString(),
    daily_goal: 20
  })

  console.log('\nReset and regeneration complete!')
  console.log('Summary:')
  console.log(`- 5 Categories: ${categories.map(c => c.name).join(', ')}`)
  console.log('- 200 Cards (Chinese content)')
  console.log(`- ${logs.length} Review Logs`)
  console.log(`- User Stats updated`)
}

main()
