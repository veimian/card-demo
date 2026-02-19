import { useParams } from 'react-router-dom'
import { useCard } from '../hooks/useQueries'
import ReactMarkdown from 'react-markdown'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Sparkles, Calendar, Tag as TagIcon, Folder } from 'lucide-react'
import CommentsSection from '../components/CommentsSection'

export default function SharedCard() {
  const { token } = useParams<{ token: string }>()
  const { data: card, isLoading, error } = useCard(token || '')

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !card) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
        <div className="text-6xl mb-4">😕</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">无法访问此卡片</h1>
        <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
          该卡片可能已被删除、设为私有，或者您访问的链接不正确。
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 md:py-12">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Card Content */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-blue-900/5 dark:shadow-none border border-gray-100 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="p-6 md:p-10 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/50">
            <div className="flex flex-wrap gap-3 mb-6">
              {card.categories && (
                <span 
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide"
                  style={{ 
                    backgroundColor: `${card.categories.color || '#2563eb'}15`, 
                    color: card.categories.color || '#2563eb' 
                  }}
                >
                  <Folder className="w-3 h-3" />
                  {card.categories.name}
                </span>
              )}
              {card.card_tags.map(({ tags }) => (
                tags && (
                  <span key={tags.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    <TagIcon className="w-3 h-3" />
                    {tags.name}
                  </span>
                )
              ))}
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 leading-tight mb-4">
              {card.title}
            </h1>
            
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>最后更新于 {format(new Date(card.updated_at), 'yyyy年MM月dd日', { locale: zhCN })}</span>
            </div>
          </div>

          {/* AI Summary */}
          {card.summary && (
            <div className="px-6 md:px-10 py-6 bg-blue-50/50 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-800/30">
              <div className="flex gap-3">
                <Sparkles className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm md:text-base text-blue-900 dark:text-blue-100 leading-relaxed italic">
                  {card.summary}
                </p>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="p-6 md:p-10 prose prose-lg prose-blue dark:prose-invert max-w-none">
            <ReactMarkdown
              components={{
                img: ({node, ...props}) => (
                  <img {...props} className="rounded-xl shadow-lg my-8 max-h-[600px] object-contain mx-auto" alt={props.alt || ''} />
                ),
                a: ({node, ...props}) => (
                  <a {...props} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors" target="_blank" rel="noopener noreferrer" />
                )
              }}
            >
              {card.content}
            </ReactMarkdown>
          </div>
        </div>

        {/* Comments Section */}
        <CommentsSection cardId={card.id} />
        
        {/* Footer */}
        <div className="text-center pb-8">
          <p className="text-sm text-gray-400 dark:text-gray-500 flex items-center justify-center gap-2">
            <span>🧠</span> Powered by Knowledge Cards
          </p>
        </div>
      </div>
    </div>
  )
}
