import { useState } from 'react'
import { Category, Tag } from '../types/app'
import { Plus, Edit2, Trash2, Save, X, Tag as TagIcon, FolderOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { 
  useCategories, 
  useTags, 
  useCreateCategory, 
  useUpdateCategory, 
  useDeleteCategory,
  useCreateTag,
  useUpdateTag,
  useDeleteTag
} from '../hooks/useQueries'

export default function Categories() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'categories' | 'tags'>('categories')
  
  // Queries
  const { data: categories = [], isLoading: loadingCategories } = useCategories()
  const { data: tags = [], isLoading: loadingTags } = useTags()

  // Mutations
  const createCategoryMutation = useCreateCategory()
  const updateCategoryMutation = useUpdateCategory()
  const deleteCategoryMutation = useDeleteCategory()
  
  const createTagMutation = useCreateTag()
  const updateTagMutation = useUpdateTag()
  const deleteTagMutation = useDeleteTag()

  // Categories Local State (for UI)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [editCategoryName, setEditCategoryName] = useState('')
  const [editCategoryColor, setEditCategoryColor] = useState('#2563eb')
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)

  // Tags Local State (for UI)
  const [editingTagId, setEditingTagId] = useState<string | null>(null)
  const [editTagName, setEditTagName] = useState('')
  const [isCreatingTag, setIsCreatingTag] = useState(false)

  // --- Category Handlers ---

  const handleCreateCategory = async () => {
    if (!editCategoryName.trim() || !user) return

    try {
      await createCategoryMutation.mutateAsync({
        name: editCategoryName.trim(),
        color: editCategoryColor,
        user_id: user.id
      })
      resetCategoryForm()
      toast.success('创建成功')
    } catch (error) {
      console.error('Error creating category:', error)
      toast.error('创建失败')
    }
  }

  const handleUpdateCategory = async () => {
    if (!editingCategoryId || !editCategoryName.trim()) return

    try {
      await updateCategoryMutation.mutateAsync({
        id: editingCategoryId,
        name: editCategoryName.trim(),
        color: editCategoryColor
      })
      resetCategoryForm()
      toast.success('更新成功')
    } catch (error) {
      console.error('Error updating category:', error)
      toast.error('更新失败')
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('确定要删除这个分类吗？相关卡片将变为无分类状态。')) return

    try {
      await deleteCategoryMutation.mutateAsync(id)
      toast.success('删除成功')
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error('删除失败')
    }
  }

  const startEditCategory = (category: Category) => {
    setEditingCategoryId(category.id)
    setEditCategoryName(category.name)
    setEditCategoryColor(category.color || '#2563eb')
    setIsCreatingCategory(false)
  }

  const resetCategoryForm = () => {
    setEditingCategoryId(null)
    setEditCategoryName('')
    setEditCategoryColor('#2563eb')
    setIsCreatingCategory(false)
  }

  // --- Tag Handlers ---

  const handleCreateTag = async () => {
    if (!editTagName.trim()) return

    try {
      await createTagMutation.mutateAsync({ name: editTagName.trim() })
      resetTagForm()
      toast.success('创建成功')
    } catch (error) {
      console.error('Error creating tag:', error)
      toast.error('创建失败')
    }
  }

  const handleUpdateTag = async () => {
    if (!editingTagId || !editTagName.trim()) return

    try {
      await updateTagMutation.mutateAsync({
        id: editingTagId,
        name: editTagName.trim()
      })
      resetTagForm()
      toast.success('更新成功')
    } catch (error) {
      console.error('Error updating tag:', error)
      toast.error('更新失败')
    }
  }

  const handleDeleteTag = async (id: string) => {
    if (!confirm('确定要删除这个标签吗？')) return

    try {
      await deleteTagMutation.mutateAsync(id)
      toast.success('删除成功')
    } catch (error) {
      console.error('Error deleting tag:', error)
      toast.error('删除失败')
    }
  }

  const startEditTag = (tag: Tag) => {
    setEditingTagId(tag.id)
    setEditTagName(tag.name)
    setIsCreatingTag(false)
  }

  const resetTagForm = () => {
    setEditingTagId(null)
    setEditTagName('')
    setIsCreatingTag(false)
  }

  const navigateToCategory = (categoryId: string) => {
    navigate(`/?category=${categoryId}`)
  }

  const navigateToTag = (tagName: string) => {
    navigate(`/?tag=${encodeURIComponent(tagName)}`)
  }

  if (loadingCategories && loadingTags) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-0">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">管理</h1>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 rounded-xl bg-blue-900/20 dark:bg-blue-900/40 p-1">
        <button
          onClick={() => setActiveTab('categories')}
          className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2 ${
            activeTab === 'categories'
              ? 'bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-400 shadow'
              : 'text-blue-100 dark:text-blue-300 hover:bg-white/[0.12] hover:text-white'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <FolderOpen className="w-4 h-4" />
            分类管理
          </div>
        </button>
        <button
          onClick={() => setActiveTab('tags')}
          className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2 ${
            activeTab === 'tags'
              ? 'bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-400 shadow'
              : 'text-blue-100 dark:text-blue-300 hover:bg-white/[0.12] hover:text-white'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <TagIcon className="w-4 h-4" />
            标签管理
          </div>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {/* Header Actions */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
          <h2 className="font-medium text-gray-900 dark:text-gray-100">
            {activeTab === 'categories' ? '所有分类' : '所有标签'}
          </h2>
          {((activeTab === 'categories' && !isCreatingCategory && !editingCategoryId) || 
            (activeTab === 'tags' && !isCreatingTag && !editingTagId)) && (
            <button
              onClick={() => activeTab === 'categories' ? setIsCreatingCategory(true) : setIsCreatingTag(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 dark:bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              新建{activeTab === 'categories' ? '分类' : '标签'}
            </button>
          )}
        </div>

        {/* Create/Edit Form */}
        {activeTab === 'categories' && (isCreatingCategory || editingCategoryId) && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={editCategoryColor}
                onChange={(e) => setEditCategoryColor(e.target.value)}
                className="h-9 w-9 p-1 rounded border border-gray-300 dark:border-gray-600 cursor-pointer bg-white dark:bg-gray-700"
              />
              <input
                type="text"
                value={editCategoryName}
                onChange={(e) => setEditCategoryName(e.target.value)}
                placeholder="分类名称"
                className="flex-1 border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                autoFocus
              />
              <button
                onClick={isCreatingCategory ? handleCreateCategory : handleUpdateCategory}
                className="p-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
              >
                <Save className="w-4 h-4" />
              </button>
              <button
                onClick={resetCategoryForm}
                className="p-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'tags' && (isCreatingTag || editingTagId) && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
            <div className="flex items-center gap-4">
              <input
                type="text"
                value={editTagName}
                onChange={(e) => setEditTagName(e.target.value)}
                placeholder="标签名称"
                className="flex-1 border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                autoFocus
              />
              <button
                onClick={isCreatingTag ? handleCreateTag : handleUpdateTag}
                className="p-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
              >
                <Save className="w-4 h-4" />
              </button>
              <button
                onClick={resetTagForm}
                className="p-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* List */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {activeTab === 'categories' ? (
            // Categories List
            categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
              >
                <div 
                  className="flex items-center gap-3 cursor-pointer flex-1"
                  onClick={() => navigateToCategory(category.id)}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                    style={{ backgroundColor: category.color || '#2563eb' }}
                  >
                    {category.name.slice(0, 1)}
                  </div>
                  <span className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {category.name}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); startEditCategory(category); }}
                    className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteCategory(category.id); }}
                    className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            // Tags List
            tags.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
              >
                <div 
                  className="flex items-center gap-3 cursor-pointer flex-1"
                  onClick={() => navigateToTag(tag.name)}
                >
                  <TagIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <span className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {tag.name}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); startEditTag(tag); }}
                    className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteTag(tag.id); }}
                    className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}

          {activeTab === 'categories' && categories.length === 0 && !isCreatingCategory && (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              暂无分类，点击右上角创建
            </div>
          )}

          {activeTab === 'tags' && tags.length === 0 && !isCreatingTag && (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              暂无标签，点击右上角创建
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
