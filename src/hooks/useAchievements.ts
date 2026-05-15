import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type UserStats = {
  current_streak?: number | null;
  total_reviews?: number | null;
  cards_created?: number | null;
};

type ReviewLog = {
  rating: number | null;
  review_date: string;
};

function getLocalDateString(date = new Date()): string {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().split('T')[0];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  requirement: {
    type: 'review_count' | 'streak_days' | 'cards_created' | 'perfect_reviews';
    value: number;
  };
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_card',
    name: '第一步',
    description: '创建第一张知识卡片',
    icon: '📝',
    unlocked: false,
    requirement: { type: 'cards_created', value: 1 }
  },
  {
    id: 'first_review',
    name: '初学者',
    description: '完成第一次复习',
    icon: '🧠',
    unlocked: false,
    requirement: { type: 'review_count', value: 1 }
  },
  {
    id: 'week_streak',
    name: '坚持不懈',
    description: '连续学习7天',
    icon: '🔥',
    unlocked: false,
    requirement: { type: 'streak_days', value: 7 }
  },
  {
    id: 'perfect_week',
    name: '完美一周',
    description: '一周内所有复习都评为"简单"',
    icon: '⭐',
    unlocked: false,
    requirement: { type: 'perfect_reviews', value: 7 }
  }
];

export function useAchievements() {
  const { user } = useAuth();
  
  const { data: achievements = [], isLoading } = useQuery<Achievement[]>({
    queryKey: ['achievements', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // 获取用户统计数据
      const { data: stats } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      // 获取卡片数量
      const { count: cardsCount } = await supabase
        .from('cards')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
        
      // 获取最近30天日志
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: logs } = await supabase
        .from('review_logs')
        .select('rating, review_date')
        .eq('user_id', user.id)
        .gte('review_date', thirtyDaysAgo.toISOString());
      
      const combinedStats = {
        ...stats,
        cards_created: cardsCount || 0
      };

      return ACHIEVEMENTS.map(achievement => ({
        ...achievement,
        unlocked: checkRequirement(achievement.requirement, combinedStats, logs || [])
      }));
    },
    enabled: !!user
  });
  
  return { achievements, isLoading };
}

function checkRequirement(
  req: Achievement['requirement'], 
  stats: UserStats, 
  logs: ReviewLog[]
): boolean {
  if (!stats) return false;

  switch (req.type) {
    case 'cards_created':
      return (stats.cards_created || 0) >= req.value;
    case 'review_count':
      return (stats.total_reviews || 0) >= req.value;
    case 'streak_days':
      return (stats.current_streak || 0) >= req.value;
    case 'perfect_reviews':
      return hasPerfectRecentDays(logs, req.value);
    default:
      return false;
  }
}

function hasPerfectRecentDays(logs: ReviewLog[], days: number): boolean {
  const logsByDay = logs.reduce<Record<string, ReviewLog[]>>((acc, log) => {
    const day = getLocalDateString(new Date(log.review_date));
    acc[day] = [...(acc[day] || []), log];
    return acc;
  }, {});

  return Array.from({ length: days }).every((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - index);
    const dayLogs = logsByDay[getLocalDateString(date)] || [];
    return dayLogs.length > 0 && dayLogs.every(log => log.rating === 5);
  });
}
