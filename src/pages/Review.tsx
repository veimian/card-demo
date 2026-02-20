import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, X, RotateCcw, Clock, Brain } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { calculateNextReview, Rating } from '../lib/srs'
import { ContentObfuscator } from '../lib/content-obfuscation'
import { Card } from '../types/app'
import StreakTracker from '../components/StreakTracker'
import { useUpdateStreak } from '../hooks/useStreakUpdate'
import { useMobileOptimization } from '../hooks/useMobileOptimization'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'

interface ReviewCard extends Card {
  next_review: string
  interval: number
  ease_factor: number
  review_count: number
}

export default function Review() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const updateStreakMutation = useUpdateStreak()
  const [loading, setLoading] = useState(true)
  const [cards, setCards] = useState<ReviewCard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [startTime, setStartTime] = useState(Date.now())

  const { isMobile } = useMobileOptimization()

  useKeyboardShortcuts([
    {
      key: ' ', // Space
      action: () => {
        if (!showAnswer) setShowAnswer(true)
      },
      description: 'Show Answer'
    },
    {
      key: 'h',
      action: () => setShowHint(prev => !prev),
      description: 'Toggle Hint'
    },
    {
      key: '1',
      action: () => showAnswer && handleRating(1),
      description: 'Rate: Forgot'
    },
    {
      key: '2',
      action: () => showAnswer && handleRating(2), // We don't have a button for 2, mapping to Hard? No, 2 is "Hard" in SM-2 but we only have 1, 3, 4, 5 buttons.
      // Wait, the UI has: 1 (Forget), 3 (Hard), 4 (Good), 5 (Easy).
      // Let's map 1->1, 2->3, 3->4, 4->5 for easier typing? Or 1, 3, 4, 5 directly?
      // Let's map 1, 3, 4, 5 directly to avoid confusion.
      description: 'Rate: Hard (mapped to 2 for convenience)'
    },
    {
      key: '3',
      action: () => showAnswer && handleRating(3),
      description: 'Rate: Hard'
    },
    {
      key: '4',
      action: () => showAnswer && handleRating(4),
      description: 'Rate: Good'
    },
    {
      key: '5',
      action: () => showAnswer && handleRating(5),
      description: 'Rate: Easy'
    }
  ])

  const fetchDueCards = useCallback(async () => {
    try {
      setLoading(true)
      const now = new Date().toISOString()
      
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('user_id', user!.id)
        .lte('next_review', now)
        .order('next_review', { ascending: true })
        .limit(50) // Limit session size

      if (error) throw error

      // Initialize SRS fields if they are null (for old cards)
      const initializedCards = data?.map(card => ({
        ...card,
        interval: card.interval || 0,
        ease_factor: card.ease_factor || 2.5,
        review_count: card.review_count || 0
      })) as ReviewCard[]

      setCards(initializedCards)
    } catch (error) {
      console.error('Error fetching due cards:', error)
      toast.error('获取复习卡片失败')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchDueCards()
    }
  }, [user, fetchDueCards])

  useEffect(() => {
    setStartTime(Date.now())
  }, [currentIndex])

  const handleRating = async (rating: Rating) => {
    const currentCard = cards[currentIndex]
    if (!currentCard || !user) return

    // Calculate new schedule
    const nextSchedule = calculateNextReview(
      currentCard.interval,
      currentCard.ease_factor,
      rating,
      currentCard.review_count
    )

    try {
      // Optimistic update
      const { error } = await supabase
        .from('cards')
        .update({
          next_review: nextSchedule.next_review,
          interval: nextSchedule.interval,
          ease_factor: nextSchedule.ease_factor,
          review_count: nextSchedule.review_count
        })
        .eq('id', currentCard.id)

      if (error) throw error

      // Update stats
      // setSessionStats(prev => ({
      //   reviewed: prev.reviewed + 1,
      //   correct: rating >= 3 ? prev.correct + 1 : prev.correct
      // }))

      // Update streak
      const timeSpent = Math.round((Date.now() - startTime) / 1000)
      updateStreakMutation.mutate({
        cardId: currentCard.id,
        rating,
        timeSpent
      })

      // Move to next card
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(prev => prev + 1)
        setShowAnswer(false)
        setShowHint(false)
      } else {
        // Session complete
        toast.success(`复习完成！共复习 ${cards.length} 张卡片`)
        navigate('/')
      }

    } catch (error) {
      console.error('Error updating card:', error)
      toast.error('保存进度失败')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
        <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
          <Check className="w-12 h-12 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">太棒了！</h1>
        <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-8">
          您已经完成了所有的待复习卡片。休息一下，稍后再来吧！
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
        >
          返回首页
        </button>
      </div>
    )
  }

  const currentCard = cards[currentIndex]
  const progress = ((currentIndex) / cards.length) * 100

  return (
    <div className="max-w-3xl mx-auto min-h-screen flex flex-col pb-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900 pt-4 pb-2 px-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {currentIndex + 1} / {cards.length}
          </div>
          <div className="w-9"></div> {/* Spacer */}
        </div>
        
        {/* Progress Bar */}
        <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Card Area */}
      <div className="flex-1 flex flex-col px-4">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 flex-1 flex flex-col min-h-[400px] overflow-hidden relative">
          
          {/* Question Side (Always Visible) */}
          <div className="p-8 flex-1 flex flex-col justify-center items-center text-center border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {currentCard.title}
            </h2>
            {currentCard.summary && (
              <p className="text-gray-500 dark:text-gray-400 max-w-lg">
                {currentCard.summary}
              </p>
            )}
          </div>

          {/* Answer Side (Hidden initially) */}
          {showAnswer ? (
            <div className="p-8 flex-1 bg-gray-50 dark:bg-gray-800/50 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="prose dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap">{currentCard.content}</div>
              </div>
            </div>
          ) : showHint ? (
            <div className="p-8 flex-1 bg-gray-50 dark:bg-gray-800/50 flex flex-col animate-in fade-in duration-300 border-t-4 border-yellow-400/30">
              <div className="flex items-center gap-2 mb-4 text-yellow-600 dark:text-yellow-500">
                <Brain className="w-5 h-5" />
                <span className="font-medium text-sm">提示模式 (部分遮挡)</span>
              </div>
              <div className="prose dark:prose-invert max-w-none opacity-80">
                <div className="whitespace-pre-wrap tracking-wide">
                  {ContentObfuscator.obfuscateContent(currentCard.content || '', 0.6)}
                </div>
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 top-[50%] flex items-center justify-center pointer-events-none">
              {/* Optional: Add a subtle hint or icon here */}
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className={`mt-6 px-4 ${isMobile ? 'pb-20' : ''}`}>
        {!showAnswer ? (
          <div className="flex gap-3">
            <button
              onClick={() => setShowHint(!showHint)}
              className={`px-6 py-4 rounded-2xl font-semibold text-lg transition-all transform active:scale-[0.98] border-2 ${
                showHint 
                  ? 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800' 
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
              }`}
            >
              {showHint ? '隐藏提示' : '提示'}
            </button>
            <button
              onClick={() => setShowAnswer(true)}
              className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold text-lg shadow-lg shadow-blue-500/20 transition-all transform active:scale-[0.98]"
            >
              显示答案
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            <button
              onClick={() => handleRating(1)}
              className="flex flex-col items-center justify-center p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
            >
              <X className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">忘记</span>
              <span className="text-[10px] opacity-70 mt-0.5">重置</span>
            </button>

            <button
              onClick={() => handleRating(3)}
              className="flex flex-col items-center justify-center p-3 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-xl hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors"
            >
              <Clock className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">困难</span>
              <span className="text-[10px] opacity-70 mt-0.5">&lt; 1天</span>
            </button>

            <button
              onClick={() => handleRating(4)}
              className="flex flex-col items-center justify-center p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-xl hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
            >
              <RotateCcw className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">一般</span>
              <span className="text-[10px] opacity-70 mt-0.5">3天</span>
            </button>

            <button
              onClick={() => handleRating(5)}
              className="flex flex-col items-center justify-center p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-xl hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
            >
              <Brain className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">简单</span>
              <span className="text-[10px] opacity-70 mt-0.5">7天</span>
            </button>
          </div>
        )}
      </div>

      <div className="fixed bottom-6 right-6 z-40 w-80 shadow-2xl hidden lg:block transition-all hover:scale-105">
        <StreakTracker />
      </div>

      {!isMobile && (
        <div className="fixed bottom-6 left-6 text-xs text-gray-400 pointer-events-none">
          <p>快捷键: 空格=显示答案/ H=提示 / 1,3,4,5=评分</p>
        </div>
      )}
    </div>
  )
}
