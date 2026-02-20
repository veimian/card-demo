# 连续打卡系统实现方案

## 核心组件设计

### 1. 数据模型扩展

```sql
-- 新增用户统计表
CREATE TABLE user_stats (
  user_id UUID REFERENCES users(id) PRIMARY KEY,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  last_review_date DATE,
  daily_goal INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 卡片复习记录表
CREATE TABLE review_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  card_id UUID REFERENCES cards(id),
  rating INTEGER, -- 1-5分
  review_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  time_spent INTEGER -- 秒
);
```

### 2. StreakTracker 组件

```typescript
// src/components/StreakTracker.tsx
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Flame, Calendar, Target, Award } from 'lucide-react';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  todayReviewed: boolean;
  dailyGoal: number;
  completionRate: number;
}

export default function StreakTracker() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const { data: streakData, isLoading } = useQuery<StreakData>({
    queryKey: ['streak', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('No user');
      
      // 获取今天的复习记录
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      const { data: todayReviews } = await supabase
        .from('review_logs')
        .select('id')
        .eq('user_id', user.id)
        .gte('review_date', todayStart.toISOString());
      
      // 获取用户统计
      const { data: stats } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      return {
        currentStreak: stats?.current_streak || 0,
        longestStreak: stats?.longest_streak || 0,
        todayReviewed: (todayReviews?.length || 0) > 0,
        dailyGoal: stats?.daily_goal || 10,
        completionRate: stats ? 
          Math(100, (todayReviews?.length || 0) / stats.daily_goal * 100) : 0
      };
    },
    enabled: !!user
  });

  if (isLoading || !streakData) return <LoadingSkeleton />;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          学习连续性
        </h3>
        <Flame className={`w-6 h-6 ${streakData.todayReviewed ? 'text-orange-500' : 'text-gray-300'}`} />
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard 
          icon={<Calendar className="w-5 h-5 text-blue-500" />}
          value={streakData.currentStreak}
          label="当前连续"
          unit="天"
        />
        <StatCard 
          icon={<Award className="w-5 h-5 text-purple-500" />}
          value={streakData.longestStreak}
          label="最长连续"
          unit="天"
        />
        <StatCard 
          icon={<Target className="w-5 h-5 text-green-500" />}
          value={`${streakData.completionRate}%`}
          label="今日进度"
        />
      </div>
      
      <ProgressBar 
        current={streakData.todayReviewed ? streakData.dailyGoal : 0}
        total={streakData.dailyGoal}
        streak={streakData.currentStreak}
      />
    </div>
  );
}

// 进度条组件
function ProgressBar({ current, total, streak }: { current: number; total: number; streak: number }) {
  const percentage = Math.min(100, (current / total) * 100);
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">
          今日复习: {current}/{total}
        </span>
        <span className="font-medium text-gray-900 dark:text-gray-100">
          🔥 {streak} 天
        </span>
      </div>
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${
            percentage >= 100 
              ? 'bg-gradient-to-r from-green-400 to-emerald-500' 
              : 'bg-gradient-to-r from-blue-400 to-purple-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
```

### 3. 成就系统 Hook

```typescript
// src/hooks/useAchievements.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
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
      const stats = await getUserStats(user.id);
      const logs = await getRecentLogs(user.id, 30); // 最近30天
      
      return ACHIEVEMENTS.map(achievement => ({
        ...achievement,
        unlocked: checkRequirement(achievement.requirement, stats, logs)
      }));
    },
    enabled: !!user
  });
  
  return { achievements, isLoading };
}

function checkRequirement(
  req: Achievement['requirement'], 
  stats: any, 
  logs: any[]
): boolean {
  switch (req.type) {
    case 'cards_created':
      return stats.cards_created >= req.value;
    case 'review_count':
      return stats.total_reviews >= req.value;
    case 'streak_days':
      return stats.current_streak >= req.value;
    case 'perfect_reviews':
      const perfectDays = logs.reduce((acc, day) => {
        return day.perfect_reviews >= day.total_reviews ? acc + 1 : acc;
      }, 0);
      return perfectDays >= req.value;
    default:
      return false;
  }
}
```

### 4. 每日提醒服务

```typescript
// src/services/notificationService.ts
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface NotificationPreferences {
  morningReminder: boolean;
  eveningReminder: boolean;
  deadlineWarning: boolean;
  customReminders: Array<{
    time: string;
    message: string;
  }>;
}

class NotificationService {
  static async scheduleDailyReminder(userId: string, time: string) {
    // 在实际应用中，这里会集成推送通知服务
    // 如 Firebase Cloud Messaging, APNs 等
    
    const notification = {
      user_id: userId,
      scheduled_time: time,
      type: 'daily_reminder',
      message: '该复习啦！保持你的学习连续性 🔥',
      created_at: new Date().toISOString()
    };
    
    // 保存到数据库
    await supabase.from('scheduled_notifications').insert([notification]);
  }
  
  static async checkAndSendReminders() {
    const now = new Date();
    const hour = now.getHours();
    
    // 查找需要发送的通知
    const { data: pendingNotifications } = await supabase
      .from('scheduled_notifications')
      .select('*')
      .eq('sent', false)
      .lte('scheduled_time', now.toISOString());
    
    // 发送通知逻辑...
  }
}

export default NotificationService;
```

### 5. 数据更新 Hook

```typescript
// src/hooks/useStreakUpdate.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useUpdateStreak() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (reviewData: { 
      cardId: string; 
      rating: number; 
      timeSpent: number 
    }) => {
      if (!user) throw new Error('No user');
      
      const today = new Date().toISOString().split('T')[0];
      
      // 记录复习日志
      await supabase.from('review_logs').insert([{
        user_id: user.id,
        card_id: reviewData.cardId,
        rating: reviewData.rating,
        time_spent: reviewData.timeSpent
      }]);
      
      // 更新用户统计
      const { data: currentStats } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      let newStreak = currentStats?.current_streak || 0;
      const lastReviewDate = currentStats?.last_review_date;
      
      // 检查是否需要更新连续天数
      if (!lastReviewDate || lastReviewDate < today) {
        // 新的一天，增加连续天数
        newStreak += 1;
      }
      
      // 更新统计数据
      await supabase.from('user_stats').upsert({
        user_id: user.id,
        current_streak: newStreak,
        longest_streak: Math.max(newStreak, currentStats?.longest_streak || 0),
        total_reviews: (currentStats?.total_reviews || 0) + 1,
        last_review_date: today,
        updated_at: new Date().toISOString()
      });
    },
    
    onSuccess: () => {
      // 使相关查询失效以触发重新获取
      queryClient.invalidateQueries({ queryKey: ['streak'] });
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    }
  });
}
```

## 集成到现有系统

### 在 Review 页面中集成

```typescript
// 修改 src/pages/Review.tsx
import StreakTracker from '../components/StreakTracker';
import { useUpdateStreak } from '../hooks/useStreakUpdate';

export default function Review() {
  const updateStreakMutation = useUpdateStreak();
  
  const handleRating = async (rating: Rating) => {
    // ... 现有逻辑 ...
    
    // 更新连续性数据
    await updateStreakMutation.mutateAsync({
      cardId: currentCard.id,
      rating: rating,
      timeSpent: getTimeSpent() // 计算本次复习耗时
    });
    
    // ... 继续原有逻辑 ...
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* 现有的复习界面 */}
      
      {/* 新增连续性追踪器 */}
      <div className="fixed bottom-4 right-4 z-50">
        <StreakTracker />
      </div>
    </div>
  );
}
```

这套连续打卡系统提供了完整的用户动机维持机制，通过可视化的连续天数、成就解锁和进度追踪来增强用户的学习动力。