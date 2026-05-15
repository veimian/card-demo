import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

function getLocalDateString(date = new Date()): string {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().split('T')[0];
}

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
      
      const today = getLocalDateString();
      
      // 记录复习日志
      const { error: logError } = await supabase.from('review_logs').insert([{
        user_id: user.id,
        card_id: reviewData.cardId,
        rating: reviewData.rating,
        time_spent: reviewData.timeSpent
      }]);
      if (logError) throw logError;
      
      // 获取当前统计
      const { data: currentStats, error: statsError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (statsError && statsError.code !== 'PGRST116') throw statsError;
      
      let newStreak = currentStats?.current_streak || 0;
      const lastReviewDate = currentStats?.last_review_date;
      
      // 检查是否需要更新连续天数
      // 如果上次复习是昨天，streak + 1
      // 如果上次复习是今天，streak 不变
      // 如果上次复习是更早，streak 重置为 1 (如果是今天第一次复习)
      
      if (lastReviewDate === today) {
        // 今天已经复习过了，保持不变
      } else {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = getLocalDateString(yesterday);
        
        if (lastReviewDate === yesterdayStr) {
          // 连续复习
          newStreak += 1;
        } else {
          // 断签或第一次复习
          newStreak = 1;
        }
      }
      
      // 更新统计数据
      const { error } = await supabase.from('user_stats').upsert({
        user_id: user.id,
        current_streak: newStreak,
        longest_streak: Math.max(newStreak, currentStats?.longest_streak || 0),
        total_reviews: (currentStats?.total_reviews || 0) + 1,
        last_review_date: today,
        updated_at: new Date().toISOString()
      });

      if (error) throw error;
    },
    
    onSuccess: () => {
      // 使相关查询失效以触发重新获取
      queryClient.invalidateQueries({ queryKey: ['streak'] });
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['review-trend'] });
      queryClient.invalidateQueries({ queryKey: ['time-analysis'] });
      queryClient.invalidateQueries({ queryKey: ['category-analysis'] });
    }
  });
}
