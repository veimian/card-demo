import { TrendingUp, Brain, Clock, Target, Flame, Award } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface StatsData {
  totalCards: number;
  dueToday: number;
  averageRetention: number;
  studyTimeToday: number;
  currentStreak: number;
  masteryRate: number;
}

export default function StatsOverview() {
  const { user } = useAuth();
  
  const { data: stats, isLoading } = useQuery<StatsData>({
    queryKey: ['dashboard-stats', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('No user');
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // 并行获取所有统计数据
      const [
        { count: totalCards },
        { count: dueToday },
        { data: streakData },
        { data: todayLogs },
        { data: retentionData }
      ] = await Promise.all([
        // 总卡片数
        supabase.from('cards').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        
        // 今日待复习 (next_review <= now)
        supabase.from('cards').select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .lte('next_review', new Date().toISOString()),
          
        // 连续打卡数据
        supabase.from('user_stats').select('*').eq('user_id', user.id).single(),
        
        // 今日学习时长
        supabase.from('review_logs')
          .select('time_spent')
          .eq('user_id', user.id)
          .gte('review_date', today.toISOString()),
          
        // 平均保持率 (评分 >= 4 的比例)
        supabase.from('review_logs')
          .select('rating')
          .eq('user_id', user.id)
          .limit(100) // 仅计算最近100次
          .order('review_date', { ascending: false })
      ]);
      
      const studyTimeToday = todayLogs?.reduce((acc, log) => acc + (log.time_spent || 0), 0) || 0;
      
      const retentionRate = retentionData && retentionData.length > 0
        ? Math.round((retentionData.filter(r => (r.rating || 0) >= 4).length / retentionData.length) * 100)
        : 0;
        
      return {
        totalCards: totalCards || 0,
        dueToday: dueToday || 0,
        averageRetention: retentionRate,
        studyTimeToday,
        currentStreak: streakData?.current_streak || 0,
        masteryRate: retentionRate // 暂时用保持率代替掌握度
      };
    },
    enabled: !!user
  });
  
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 h-32 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <StatCard
        title="总卡片数"
        value={stats.totalCards}
        icon={<Brain className="h-6 w-6 text-blue-500" />}
        trend="积累知识"
      />
      <StatCard
        title="今日待复习"
        value={stats.dueToday}
        icon={<Target className="h-6 w-6 text-orange-500" />}
        trend={stats.dueToday === 0 ? "已完成" : "待完成"}
      />
      <StatCard
        title="记忆保持率"
        value={`${stats.averageRetention}%`}
        icon={<TrendingUp className="h-6 w-6 text-green-500" />}
        trend="近期表现"
      />
      <StatCard
        title="今日学习时长"
        value={`${Math.round(stats.studyTimeToday / 60)}分钟`}
        icon={<Clock className="h-6 w-6 text-purple-500" />}
        trend="专注投入"
      />
      <StatCard
        title="连续学习"
        value={`${stats.currentStreak}天`}
        icon={<Flame className="h-6 w-6 text-red-500" />}
        trend="🔥 保持热度"
      />
      <StatCard
        title="掌握程度"
        value={`${stats.masteryRate}%`}
        icon={<Award className="h-6 w-6 text-yellow-500" />}
        trend="学习质量"
      />
    </div>
  );
}

function StatCard({ title, value, icon, trend }: { title: string, value: string | number, icon: React.ReactNode, trend: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
        <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          {icon}
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</div>
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
          {trend}
        </div>
      </div>
    </div>
  );
}
