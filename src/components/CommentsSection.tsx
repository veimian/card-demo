import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useComments, useCreateComment, useDeleteComment } from '../hooks/useQueries'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { MessageSquare, Send, Trash2, User } from 'lucide-react'
import toast from 'react-hot-toast'

interface CommentsSectionProps {
  cardId: string
}

export default function CommentsSection({ cardId }: CommentsSectionProps) {
  const { user } = useAuth()
  const { data: comments = [], isLoading } = useComments(cardId)
  const createCommentMutation = useCreateComment()
  const deleteCommentMutation = useDeleteComment()
  
  const [newComment, setNewComment] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast.error('请先登录以发表评论')
      return
    }
    if (!newComment.trim()) return

    try {
      await createCommentMutation.mutateAsync({
        card_id: cardId,
        content: newComment.trim(),
        user_id: user.id
      })
      setNewComment('')
      toast.success('评论已发布')
    } catch (error) {
      console.error('Failed to post comment:', error)
      toast.error('发布失败')
    }
  }

  const handleDelete = async (commentId: string) => {
    if (!confirm('确定要删除这条评论吗？')) return
    
    try {
      await deleteCommentMutation.mutateAsync(commentId)
      toast.success('评论已删除')
    } catch (error) {
      console.error('Failed to delete comment:', error)
      toast.error('删除失败')
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          评论 ({comments.length})
        </h2>
      </div>

      {/* Comment List */}
      <div className="space-y-6 mb-8">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700 border-dashed">
            暂无评论，快来抢沙发吧！
          </div>
        ) : (
          comments.map((comment: any) => (
            <div key={comment.id} className="flex gap-4 group">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold border border-white dark:border-gray-600 shadow-sm">
                  {comment.users?.name?.[0] || comment.users?.email?.[0]?.toUpperCase() || <User className="w-5 h-5" />}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {comment.users?.name || comment.users?.email?.split('@')[0] || '匿名用户'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: zhCN })}
                  </span>
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed break-words bg-gray-50 dark:bg-gray-700/50 p-3 rounded-tr-xl rounded-br-xl rounded-bl-xl">
                  {comment.content}
                </div>
                {user && (user.id === comment.user_id) && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="mt-1 text-xs text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> 删除
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Comment Form */}
      {user ? (
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="写下你的想法..."
            rows={3}
            className="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all resize-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
          />
          <div className="absolute bottom-3 right-3">
            <button
              type="submit"
              disabled={!newComment.trim() || createCommentMutation.isPending}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      ) : (
        <div className="text-center py-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-sm text-blue-800 dark:text-blue-200">
          请 <a href="/login" className="font-semibold underline">登录</a> 后参与讨论
        </div>
      )}
    </div>
  )
}
