import { useQuery } from '@tanstack/react-query';
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
      
      const dailyGoal = stats?.daily_goal || 10;
      const todayCount = todayReviews?.length || 0;
      
      return {
        currentStreak: stats?.current_streak || 0,
        longestStreak: stats?.longest_streak || 0,
        todayReviewed: todayCount > 0,
        dailyGoal: dailyGoal,
        completionRate: Math.min(100, Math.round((todayCount / dailyGoal) * 100))
      };
    },
    enabled: !!user
  });

  if (isLoading || !streakData) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
      </div>
    );
  }

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
        current={streakData.todayReviewed ? streakData.dailyGoal * (streakData.completionRate / 100) : 0} // Approximate current count
        total={streakData.dailyGoal}
        streak={streakData.currentStreak}
        completionRate={streakData.completionRate}
      />
    </div>
  );
}

function StatCard({ icon, value, label, unit }: { icon: React.ReactNode, value: number | string, label: string, unit?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
      <div className="mb-2 p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm">
        {icon}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-bold text-gray-900 dark:text-gray-100">{value}</span>
        {unit && <span className="text-xs text-gray-500 dark:text-gray-400">{unit}</span>}
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</span>
    </div>
  );
}

function ProgressBar({ current, total, streak, completionRate }: { current: number; total: number; streak: number, completionRate: number }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">
          今日目标完成度
        </span>
        <span className="font-medium text-gray-900 dark:text-gray-100">
          🔥 {streak} 天
        </span>
      </div>
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${
            completionRate >= 100 
              ? 'bg-gradient-to-r from-green-400 to-emerald-500' 
              : 'bg-gradient-to-r from-blue-400 to-purple-500'
          }`}
          style={{ width: `${completionRate}%` }}
        />
      </div>
    </div>
  );
}
