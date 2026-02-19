import { useState, useMemo } from 'react'
import CardItem from '../components/CardItem'
import { Search, Filter, Plus, ChevronDown, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCards, useCategories, useDeleteCard } from '../hooks/useQueries'
import Fuse from 'fuse.js'
import { pinyin } from 'pinyin-pro'
import { Listbox, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'

export default function Home() {
  const { user } = useAuth()
  const { data: cards = [], isLoading: loadingCards } = useCards()
  const { data: categories = [], isLoading: loadingCategories } = useCategories()
  const deleteCardMutation = useDeleteCard()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set())

  const loading = loadingCards || loadingCategories

  // Prepare data for search - include pinyin for better Chinese search experience
  const searchableCards = useMemo(() => {
    return cards.map(card => ({
      ...card,
      // Add pinyin fields for search
      titlePinyin: pinyin(card.title || '', { toneType: 'none', type: 'string', separator: '' }),
      tagNames: card.card_tags.map(ct => ct.tags?.name).join(' '),
      categoryName: card.categories?.name || ''
    }))
  }, [cards])

  const fuse = useMemo(() => {
    return new Fuse(searchableCards, {
      keys: [
        { name: 'title', weight: 2 },
        { name: 'titlePinyin', weight: 1.5 }, // Pinyin match
        { name: 'content', weight: 1 },
        { name: 'summary', weight: 1.2 },
        { name: 'tagNames', weight: 1.5 },
        { name: 'categoryName', weight: 1 }
      ],
      threshold: 0.4, // Fuzzy match threshold
      includeScore: true
    })
  }, [searchableCards])

  const filteredCards = useMemo(() => {
    let result = cards

    // 0. Filter by User
    if (user) {
      result = result.filter(card => card.user_id === user.id)
    }

    // 1. Filter by Search
    if (searchQuery.trim()) {
      const searchResults = fuse.search(searchQuery)
      result = searchResults.map(res => {
        return res.item
      })
    }

    // 2. Filter by Category
    if (selectedCategory !== 'all') {
      result = result.filter(card => card.category_id === selectedCategory)
    }

    return result
  }, [cards, searchQuery, selectedCategory, fuse])

  const selectedCategoryData = useMemo(() => {
    if (selectedCategory === 'all') return { name: '所有分类', color: null }
    const cat = categories.find(c => c.id === selectedCategory)
    return cat || { name: '未知分类', color: null }
  }, [selectedCategory, categories])

  const toggleSelectCard = (id: string) => {
    const newSelected = new Set(selectedCards)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedCards(newSelected)
  }

  const handleBatchDelete = async () => {
    if (selectedCards.size === 0) return
    if (!confirm(`确定要删除选中的 ${selectedCards.size} 张卡片吗？此操作不可恢复。`)) return

    const toastId = toast.loading('正在删除...')
    try {
      await Promise.all(Array.from(selectedCards).map(id => deleteCardMutation.mutateAsync(id)))
      toast.success('删除成功', { id: toastId })
      setSelectedCards(new Set())
      setIsEditMode(false)
    } catch (error) {
      console.error('Batch delete failed:', error)
      toast.error('部分卡片删除失败', { id: toastId })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 md:space-y-8 pb-20 md:pb-0">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full sm:max-w-lg group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400 dark:text-gray-500 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400 transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl leading-5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 focus:border-blue-500 dark:focus:border-blue-400 sm:text-sm transition-all duration-200 shadow-sm hover:shadow-md"
            placeholder="搜索卡片、标签或内容（支持拼音）..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto z-20 justify-between sm:justify-end">
           {isEditMode ? (
             <div className="flex items-center gap-2">
               <span className="text-sm text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">
                 已选 {selectedCards.size} 项
               </span>
               <button
                 onClick={handleBatchDelete}
                 disabled={selectedCards.size === 0}
                 className="flex items-center gap-1 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-50 transition-colors"
               >
                 <Trash2 className="w-4 h-4" />
                 删除
               </button>
               <button
                 onClick={() => {
                   setIsEditMode(false)
                   setSelectedCards(new Set())
                 }}
                 className="px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
               >
                 取消
               </button>
             </div>
           ) : (
             <button
               onClick={() => setIsEditMode(true)}
               className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors whitespace-nowrap shadow-sm"
             >
               批量管理
             </button>
           )}

          <div className="relative flex-1 sm:flex-none min-w-[140px] max-w-[180px]">
            <Listbox value={selectedCategory} onChange={setSelectedCategory}>
              <div className="relative mt-1">
                <Listbox.Button className="relative w-full cursor-default rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm py-3 pl-3 pr-8 text-left border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md focus:outline-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-300 sm:text-sm transition-all duration-200 text-gray-900 dark:text-gray-100">
                  <span className="flex items-center gap-2 truncate">
                    {selectedCategory !== 'all' && (
                       <span 
                         className="flex items-center justify-center w-5 h-5 rounded text-[10px] text-white font-bold shrink-0"
                         style={{ backgroundColor: selectedCategoryData.color || '#94a3b8' }}
                       >
                         {selectedCategoryData.name.slice(0, 1)}
                       </span>
                    )}
                    <span className="block truncate">{selectedCategoryData.name}</span>
                  </span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronDown
                      className="h-4 w-4 text-gray-400"
                      aria-hidden="true"
                    />
                  </span>
                </Listbox.Button>
                <Transition
                  as={Fragment}
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-50">
                    <Listbox.Option
                      key="all"
                      className={({ active }) =>
                        `relative cursor-default select-none py-2 pl-4 pr-4 ${
                          active ? 'bg-blue-50 dark:bg-gray-700 text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-gray-100'
                        }`
                      }
                      value="all"
                    >
                      {({ selected }) => (
                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                          所有分类
                        </span>
                      )}
                    </Listbox.Option>
                    {categories.map((category) => (
                      <Listbox.Option
                        key={category.id}
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-4 pr-4 ${
                            active ? 'bg-blue-50 dark:bg-gray-700 text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-gray-100'
                          }`
                        }
                        value={category.id}
                      >
                        {({ selected }) => (
                          <div className="flex items-center gap-2">
                            <span 
                              className="flex items-center justify-center w-5 h-5 rounded text-[10px] text-white font-bold shrink-0"
                              style={{ backgroundColor: category.color || '#2563eb' }}
                            >
                              {category.name.slice(0, 1)}
                            </span>
                            <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                              {category.name}
                            </span>
                          </div>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </Transition>
              </div>
            </Listbox>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      {filteredCards.length === 0 ? (
        <div className="text-center py-20 bg-white/50 dark:bg-gray-800/50 rounded-3xl border border-gray-100 dark:border-gray-700 border-dashed">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-tr from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 mb-6 shadow-inner">
            <Search className="h-8 w-8 text-blue-400 dark:text-blue-300" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">未找到相关卡片</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            尝试调整搜索关键词、切换分类，或者创建一个新的知识卡片
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
          {filteredCards.map((card) => (
            <div key={card.id} className="relative group">
              {isEditMode && (
                <div className="absolute top-2 right-2 z-10">
                  <input
                    type="checkbox"
                    checked={selectedCards.has(card.id)}
                    onChange={() => toggleSelectCard(card.id)}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer shadow-sm"
                  />
                </div>
              )}
              <div className={isEditMode ? 'pointer-events-none' : ''}>
                <CardItem card={card} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
