import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { CardWithDetails, Category } from '../types/app'
import CardItem from '../components/CardItem'
import { Search, Filter, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Home() {
  const [cards, setCards] = useState<CardWithDetails[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [cardsRes, categoriesRes] = await Promise.all([
        supabase
          .from('cards')
          .select('*, categories(*), card_tags(tags(*))')
          .order('created_at', { ascending: false }),
        supabase
          .from('categories')
          .select('*')
          .order('order_index', { ascending: true }),
      ])

      if (cardsRes.error) throw cardsRes.error
      if (categoriesRes.error) throw categoriesRes.error

      setCards(cardsRes.data as CardWithDetails[])
      setCategories(categoriesRes.data)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCards = cards.filter((card) => {
    const matchesSearch =
      card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.card_tags.some(({ tags }) =>
        tags?.name.toLowerCase().includes(searchQuery.toLowerCase())
      )

    const matchesCategory =
      selectedCategory === 'all' || card.category_id === selectedCategory

    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full sm:max-w-lg group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl leading-5 bg-white/80 backdrop-blur-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 sm:text-sm transition-all duration-200 shadow-sm hover:shadow-md"
            placeholder="搜索卡片、标签或内容..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none min-w-[160px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-4 w-4 text-gray-400" />
            </div>
            <select
              className="block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl leading-5 bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 sm:text-sm appearance-none cursor-pointer shadow-sm hover:shadow-md transition-all duration-200"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">所有分类</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <Link
            to="/card/new"
            className="inline-flex items-center px-4 py-3 border border-transparent text-sm font-medium rounded-xl shadow-lg shadow-blue-500/30 text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-500/40 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:hidden transition-all duration-200"
          >
            <Plus className="h-5 w-5" />
          </Link>
        </div>
      </div>

      {/* Cards Grid */}
      {filteredCards.length === 0 ? (
        <div className="text-center py-20 bg-white/50 rounded-3xl border border-gray-100 border-dashed">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-tr from-blue-50 to-indigo-50 mb-6 shadow-inner">
            <Search className="h-8 w-8 text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">未找到相关卡片</h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            尝试调整搜索关键词、切换分类，或者创建一个新的知识卡片
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCards.map((card) => (
            <CardItem key={card.id} card={card} />
          ))}
        </div>
      )}
    </div>
  )
}
