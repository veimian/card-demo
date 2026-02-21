import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Check, X, RotateCcw, Clock, Brain, Shuffle, ListChecks } from 'lucide-react'
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
  const [searchParams] = useSearchParams()
  const isActiveMode = searchParams.get('mode') === 'active' // 主动复习：不限制到期，可选随机或自选
  const updateStreakMutation = useUpdateStreak()
  const [loading, setLoading] = useState(true)
  const [cards, setCards] = useState<ReviewCard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [startTime, setStartTime] = useState(Date.now())
  // 主动复习时的选择步骤：null=选择方式, random=已选随机, custom=自选卡片列表
  const [activeChoice, setActiveChoice] = useState<'random' | 'custom' | null>(null)
  const [allCardsForPick, setAllCardsForPick] = useState<ReviewCard[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

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
        .limit(50)
      if (error) throw error
      const initializedCards = (data || []).map(card => ({
        ...card,
        interval: card.interval || 0,
        ease_factor: card.ease_factor || 2.5,
        review_count: card.review_count || 0
      })) as ReviewCard[]
      setCards(initializedCards)
    } catch (error) {
      console.error('Error fetching cards:', error)
      toast.error('获取复习卡片失败')
    } finally {
      setLoading(false)
    }
  }, [user])

  const fetchRandomCards = useCallback(async () => {
    try {
      setLoading(true)
      const { data: allData, error } = await supabase
        .from('cards')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(200)
      if (error) throw error
      const list = (allData || []) as ReviewCard[]
      const shuffled = [...list].sort(() => Math.random() - 0.5).slice(0, 50)
      const initialized = shuffled.map(card => ({
        ...card,
        interval: card.interval || 0,
        ease_factor: card.ease_factor || 2.5,
        review_count: card.review_count || 0
      })) as ReviewCard[]
      setCards(initialized)
    } catch (error) {
      console.error('Error fetching cards:', error)
      toast.error('获取复习卡片失败')
    } finally {
      setLoading(false)
    }
  }, [user])

  const fetchAllForPick = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      const list = (data || []).map(card => ({
        ...card,
        interval: card.interval || 0,
        ease_factor: card.ease_factor || 2.5,
        review_count: card.review_count || 0
      })) as ReviewCard[]
      setAllCardsForPick(list)
      setSelectedIds(new Set())
    } catch (error) {
      console.error('Error fetching cards:', error)
      toast.error('获取卡片列表失败')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!user) return
    if (isActiveMode && activeChoice === null) {
      setLoading(false)
      return
    }
    if (isActiveMode && activeChoice === 'random') {
      fetchRandomCards()
      return
    }
    if (isActiveMode && activeChoice === 'custom') {
      fetchAllForPick()
      return
    }
    if (!isActiveMode) {
      fetchDueCards()
    }
  }, [user, isActiveMode, activeChoice, fetchDueCards, fetchRandomCards, fetchAllForPick])

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

  // 主动复习：选择方式（随机 / 自选），仅当尚未开始复习时显示
  if (isActiveMode && activeChoice === null && cards.length === 0) {
    return (
      <div className="max-w-lg mx-auto min-h-screen flex flex-col justify-center px-4 py-8">
        <button
          onClick={() => navigate('/')}
          className="absolute top-4 left-4 p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">主动复习</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">选择本次要复习的卡片来源</p>
        <div className="space-y-3">
          <button
            onClick={() => setActiveChoice('random')}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 bg-white dark:bg-gray-800 text-left transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Shuffle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="font-semibold text-gray-900 dark:text-gray-100">随机抽取</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">从全部卡片中随机约 50 张</div>
            </div>
          </button>
          <button
            onClick={() => setActiveChoice('custom')}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 bg-white dark:bg-gray-800 text-left transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <ListChecks className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <div className="font-semibold text-gray-900 dark:text-gray-100">自选卡片</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">勾选要复习的卡片后开始</div>
            </div>
          </button>
        </div>
      </div>
    )
  }

  // 主动复习：自选卡片列表
  if (isActiveMode && activeChoice === 'custom') {
    if (allCardsForPick.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
          <p className="text-gray-500 dark:text-gray-400 mb-6">还没有卡片，去首页创建吧</p>
          <button onClick={() => navigate('/')} className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700">
            返回首页
          </button>
        </div>
      )
    }
    const toggleId = (id: string) => {
      setSelectedIds(prev => {
        const next = new Set(prev)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        return next
      })
    }
    const selectAll = () => setSelectedIds(new Set(allCardsForPick.map(c => c.id)))
    const clearAll = () => setSelectedIds(new Set())
    const startWithSelected = () => {
      if (selectedIds.size === 0) {
        toast.error('请至少选择一张卡片')
        return
      }
      const list = allCardsForPick.filter(c => selectedIds.has(c.id))
      setCards(list)
      setActiveChoice(null) // 进入复习状态（cards.length > 0 后会渲染下方复习 UI）
    }
    return (
      <div className="max-w-2xl mx-auto min-h-screen flex flex-col px-4 py-6 pb-24">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setActiveChoice(null)} className="p-2 -ml-2 text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">自选卡片</h1>
          <div className="w-9" />
        </div>
        <div className="flex gap-2 mb-4">
          <button onClick={selectAll} className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
            全选
          </button>
          <button onClick={clearAll} className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
            取消全选
          </button>
          <span className="ml-auto text-sm text-gray-500 dark:text-gray-400 self-center">已选 {selectedIds.size} 张</span>
        </div>
        <ul className="space-y-2 flex-1 overflow-y-auto">
          {allCardsForPick.map(card => (
            <li key={card.id}>
              <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedIds.has(card.id)}
                  onChange={() => toggleId(card.id)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600"
                />
                <span className="flex-1 text-gray-900 dark:text-gray-100 truncate">{card.title}</span>
              </label>
            </li>
          ))}
        </ul>
        <button
          onClick={startWithSelected}
          className="mt-4 py-3 w-full rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
          disabled={selectedIds.size === 0}
        >
          开始复习 ({selectedIds.size} 张)
        </button>
      </div>
    )
  }

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
        <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
          <Check className="w-12 h-12 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {isActiveMode ? '还没有卡片' : '太棒了！'}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-8">
          {isActiveMode
            ? '主动复习需要至少一张卡片。去首页创建或从「待复习」进入吧。'
            : '您已经完成了所有的待复习卡片。可到首页选择「主动复习」继续巩固。'}
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
            {isActiveMode && <span className="text-blue-600 dark:text-blue-400 mr-1">主动复习</span>}
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
          
          {/* Question Side：开始时仅显示标题 */}
          <div className="p-8 flex-1 flex flex-col justify-center items-center text-center border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {currentCard.title}
            </h2>
          </div>

          {/* Answer Side (Hidden initially) */}
          {showAnswer ? (
            <div className="p-8 flex-1 bg-gray-50 dark:bg-gray-800/50 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="prose dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap">{currentCard.content || currentCard.summary}</div>
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
                  {ContentObfuscator.obfuscateContent(currentCard.content || currentCard.summary || '', 0.6)}
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
