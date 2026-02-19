import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { supabase } from '../lib/supabase'
import { Category, Tag } from '../types/app'
import { ArrowLeft, Save, Sparkles, X, Upload, Eye, Edit3 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { generateSummary } from '../lib/openai'
import { uploadFile, extractText } from '../lib/file-utils'
import ReactMarkdown from 'react-markdown'

interface CardForm {
  title: string
  content: string
  summary: string
  category_id: string
}

export default function CardEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isNew = !id
  
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [selectedTags, setSelectedTags] = useState<Tag[]>([])
  const [tagInput, setTagInput] = useState('')
  const [generatingSummary, setGeneratingSummary] = useState(false)
  const [isPreview, setIsPreview] = useState(false)

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CardForm>()
  const content = watch('content')

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      const toastId = toast.loading('正在上传并处理文件...')

      // 1. Upload file
      const publicUrl = await uploadFile(file)
      
      // 2. Extract text if supported
      let extractedText = ''
      try {
        extractedText = await extractText(file)
      } catch (err) {
        console.error('Text extraction failed:', err)
        // Continue even if extraction fails
      }

      // 3. Update content
      const currentContent = watch('content') || ''
      let newContent = currentContent

      // Add separator if content exists
      if (newContent) newContent += '\n\n'

      // Add file link/image
      if (file.type.startsWith('image/')) {
        newContent += `![${file.name}](${publicUrl})\n`
      } else {
        newContent += `[${file.name}](${publicUrl})\n`
      }

      // Add extracted text
      if (extractedText) {
        newContent += `\n--- ${file.name} 内容 ---\n${extractedText}\n--- 结束 ---\n`
      }

      setValue('content', newContent)
      toast.success('文件处理完成', { id: toastId })
    } catch (error: any) {
      console.error('File upload error:', error)
      toast.error('文件上传失败: ' + error.message)
    } finally {
      setUploading(false)
      // Reset input
      e.target.value = ''
    }
  }

  useEffect(() => {
    fetchInitialData()
  }, [id])

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      
      // Fetch categories and tags
      const [categoriesRes, tagsRes] = await Promise.all([
        supabase.from('categories').select('*').order('order_index'),
        supabase.from('tags').select('*').order('name')
      ])

      if (categoriesRes.data) setCategories(categoriesRes.data)
      if (tagsRes.data) setAvailableTags(tagsRes.data)

      // Fetch card data if editing
      if (!isNew && id) {
        const { data: card, error } = await supabase
          .from('cards')
          .select('*, card_tags(tags(*))')
          .eq('id', id)
          .single()

        if (error) throw error
        if (!card) throw new Error('Card not found')
        
        setValue('title', card.title)
        setValue('content', card.content)
        setValue('summary', card.summary || '')
        setValue('category_id', card.category_id || '')
        
        if (card.card_tags) {
          const tags = card.card_tags.map((ct: any) => ct.tags).filter(Boolean)
          setSelectedTags(tags)
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateSummary = async () => {
    if (!content) return toast.error('请先输入内容')
    
    try {
      setGeneratingSummary(true)
      const result = await generateSummary(content)
      
      // 1. Set Summary and Title
      setValue('summary', result.summary)
      if (result.title) {
        // Only set title if it's currently empty or user hasn't modified it much
        const currentTitle = watch('title')
        if (!currentTitle || currentTitle.trim() === '') {
          setValue('title', result.title)
        }
      }
      
      // 2. Handle Category
      let categoryId = ''
      if (result.category) {
        // Check if category exists
        const existingCategory = categories.find(c => c.name === result.category)
        
        if (existingCategory) {
          categoryId = existingCategory.id
          setValue('category_id', categoryId)
        } else {
          // Create new category
          try {
            const { data: newCategory, error } = await supabase
              .from('categories')
              .insert({ 
                name: result.category,
                user_id: user?.id,
                order_index: categories.length
              } as any)
              .select()
              .single()
              
            if (!error && newCategory) {
              setCategories(prev => [...prev, newCategory])
              categoryId = newCategory.id
              setValue('category_id', categoryId)
              toast.success(`自动创建分类: ${result.category}`)
            }
          } catch (err) {
            console.error('Failed to create category:', err)
          }
        }
      }

      // 3. Handle Tags
      if (result.tags && result.tags.length > 0) {
        const newSelectedTags = [...selectedTags]
        
        for (const tagName of result.tags) {
          // Skip if already selected
          if (newSelectedTags.some(t => t.name === tagName)) continue
          
          // Check available tags
          let tag = availableTags.find(t => t.name === tagName)
          
          if (!tag) {
            // Create new tag
            try {
              const { data: newTag, error } = await supabase
                .from('tags')
                .insert({ name: tagName } as any)
                .select()
                .single()
                
              if (!error && newTag) {
                tag = newTag
                setAvailableTags(prev => [...prev, newTag])
              }
            } catch (err) {
              console.error('Failed to create tag:', err)
            }
          }
          
          if (tag) {
            newSelectedTags.push(tag)
          }
        }
        
        setSelectedTags(newSelectedTags)
      }

      toast.success('AI 智能分析完成')
    } catch (error: any) {
      toast.error(error.message || 'AI 分析失败')
    } finally {
      setGeneratingSummary(false)
    }
  }

  const handleAddTag = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      const tagName = tagInput.trim()
      
      // Check if tag exists in selected
      if (selectedTags.some(t => t.name === tagName)) {
        setTagInput('')
        return
      }

      // Check if tag exists in available
      let tag = availableTags.find(t => t.name === tagName)
      
      if (!tag) {
        // Create new tag if not exists
        try {
          const { data, error } = await supabase
            .from('tags')
            .insert({ name: tagName } as any)
            .select()
            .single()
            
          if (error) throw error
          tag = data
          setAvailableTags([...availableTags, tag!])
        } catch (error) {
          console.error('Error creating tag:', error)
          toast.error('创建标签失败')
          return
        }
      }

      setSelectedTags([...selectedTags, tag!])
      setTagInput('')
    }
  }

  const removeTag = (tagId: string) => {
    setSelectedTags(selectedTags.filter(t => t.id !== tagId))
  }

  const onSubmit = async (data: CardForm) => {
    if (!user) return

    try {
      setSaving(true)
      
      const cardData = {
        title: data.title,
        content: data.content,
        summary: data.summary,
        category_id: data.category_id || null,
        user_id: user.id
      }

      let cardId = id

      if (isNew) {
        const { data: newCard, error } = await supabase
          .from('cards')
          .insert(cardData as any)
          .select()
          .single()
        
        if (error) throw error
        if (!newCard) throw new Error('Failed to create card')
        cardId = newCard.id
      } else {
        const { error } = await supabase
          .from('cards')
          .update(cardData as any)
          .eq('id', id)
        
        if (error) throw error
      }

      // Update tags
      if (cardId) {
        // Delete existing tags
        if (!isNew) {
          await supabase.from('card_tags').delete().eq('card_id', cardId)
        }

        // Insert new tags
        if (selectedTags.length > 0) {
          const tagInserts = selectedTags.map(tag => ({
            card_id: cardId,
            tag_id: tag.id
          }))
          
          const { error: tagError } = await supabase
            .from('card_tags')
            .insert(tagInserts as any)
          
          if (tagError) throw tagError
        }
      }

      toast.success(isNew ? '创建成功' : '保存成功')
      navigate('/')
    } catch (error) {
      console.error('Error saving card:', error)
      toast.error('保存失败')
    } finally {
      setSaving(false)
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
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 hover:bg-white hover:shadow-md rounded-xl transition-all duration-200 text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {isNew ? '新建卡片' : '编辑卡片'}
          </h1>
        </div>
        <button
          onClick={handleSubmit(onSubmit)}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          <Save className="w-4 h-4" />
          {saving ? '保存中...' : '保存卡片'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl border border-gray-200/60 shadow-sm hover:shadow-md transition-all duration-200">
            <input
              {...register('title', { required: '请输入标题' })}
              type="text"
              placeholder="卡片标题"
              className="w-full text-3xl font-bold border-none placeholder-gray-300 focus:ring-0 px-0 mb-6 bg-transparent"
            />
            {errors.title && (
              <p className="text-red-500 text-sm mb-4">{errors.title.message}</p>
            )}
            
            <div className="flex items-center gap-2 mb-6">
              <label className={`group flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-blue-50 rounded-xl cursor-pointer transition-all duration-200 border border-gray-100 hover:border-blue-100 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <Upload className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                <span className="text-sm font-medium text-gray-600 group-hover:text-blue-600 transition-colors">
                  {uploading ? '处理中...' : '上传文档/图片'}
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf,.txt,.md,.docx"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </label>
              
              <button
                type="button"
                onClick={() => setIsPreview(!isPreview)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-blue-50 rounded-xl cursor-pointer transition-all duration-200 border border-gray-100 hover:border-blue-100 group"
              >
                {isPreview ? (
                  <>
                    <Edit3 className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    <span className="text-sm font-medium text-gray-600 group-hover:text-blue-600 transition-colors">
                      编辑模式
                    </span>
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    <span className="text-sm font-medium text-gray-600 group-hover:text-blue-600 transition-colors">
                      预览内容
                    </span>
                  </>
                )}
              </button>
            </div>

            {isPreview ? (
              <div className="w-full min-h-[500px] prose prose-blue max-w-none bg-white/50 rounded-xl p-4 border border-transparent">
                <ReactMarkdown 
                  components={{
                    img: ({node, ...props}) => (
                      <img {...props} className="rounded-lg shadow-sm max-h-96 object-contain mx-auto" alt={props.alt || ''} />
                    )
                  }}
                >
                  {content || '*暂无内容*'}
                </ReactMarkdown>
              </div>
            ) : (
              <textarea
                {...register('content', { required: '请输入内容' })}
                placeholder="开始输入内容... 支持 Markdown 语法"
                className="w-full h-[500px] resize-none border-none placeholder-gray-300 focus:ring-0 px-0 text-gray-700 text-lg leading-relaxed bg-transparent font-mono"
              />
            )}
            {errors.content && (
              <p className="text-red-500 text-sm mt-2">{errors.content.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-gray-200/60 shadow-sm hover:shadow-md transition-all duration-200 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                分类
              </label>
              <div className="relative">
                <select
                  {...register('category_id')}
                  className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                >
                  <option value="">无分类</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                  <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                标签
              </label>
              <div className="flex flex-wrap gap-2 mb-3 min-h-[32px]">
                {selectedTags.map(tag => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 group"
                  >
                    {tag.name}
                    <button
                      type="button"
                      onClick={() => removeTag(tag.id)}
                      className="ml-1.5 text-blue-400 hover:text-blue-600 focus:outline-none"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="输入标签并回车"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <label className="flex items-center gap-2 text-sm font-semibold text-blue-900">
                <Sparkles className="w-4 h-4 text-blue-500" />
                AI 智能助手
              </label>
              <button
                type="button"
                onClick={handleGenerateSummary}
                disabled={generatingSummary || !content}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-blue-100 hover:shadow transition-all active:scale-95"
              >
                {generatingSummary ? '分析中...' : '一键生成'}
              </button>
            </div>
            <textarea
              {...register('summary')}
              rows={6}
              placeholder="AI 将自动生成摘要..."
              className="w-full bg-white/60 border border-blue-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-blue-300/50 text-blue-900"
            />
            <p className="mt-2 text-xs text-blue-400">
              点击生成按钮，AI 将自动分析内容，生成标题、摘要，并推荐分类和标签。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
