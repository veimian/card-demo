import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface DailyReviewData {
  date: string;
  reviews: number;
  newCards: number;
  retentionRate: number;
}

export default function ReviewTrendChart() {
  const { user } = useAuth();
  
  const { data: chartData = [], isLoading } = useQuery<DailyReviewData[]>({
    queryKey: ['review-trend', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data, error } = await supabase
        .rpc('get_daily_review_stats', {
          query_user_id: user.id,
          start_date: thirtyDaysAgo.toISOString()
        });
        
      if (error) throw error;
      if (!data) return [];
      
      return data.map((item) => ({
        date: item.date,
        reviews: item.reviews,
        newCards: item.new_cards,
        retentionRate: item.retention_rate
      }));
    },
    enabled: !!user
  });
  
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 h-[300px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        复习趋势 (近30天)
      </h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickFormatter={(date) => new Date(date).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
            />
            <YAxis yAxisId="reviews" orientation="left" />
            <YAxis yAxisId="rate" orientation="right" domain={[0, 100]} unit="%" />
            <Tooltip 
              labelFormatter={(date) => new Date(date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
              formatter={(value, name) => [
                value, 
                name === 'reviews' ? '复习次数' : 
                name === 'newCards' ? '新卡片' : '记忆保持率'
              ]}
            />
            <Line 
              yAxisId="reviews"
              type="monotone" 
              dataKey="reviews" 
              name="reviews"
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              yAxisId="reviews"
              type="monotone" 
              dataKey="newCards" 
              name="newCards"
              stroke="#10b981" 
              strokeWidth={2}
              strokeDasharray="5 5"
            />
            <Line 
              yAxisId="rate"
              type="monotone" 
              dataKey="retentionRate" 
              name="retentionRate"
              stroke="#f59e0b" 
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
