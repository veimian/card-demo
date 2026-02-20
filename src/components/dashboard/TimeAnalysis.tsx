import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface TimeSlotData {
  hour: string;
  reviews: number;
  efficiency: number;
}

export default function TimeAnalysis() {
  const { user } = useAuth();

  const { data: timeData = [], isLoading } = useQuery<TimeSlotData[]>({
    queryKey: ['time-analysis', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      const { data, error } = await supabase
        .rpc('get_hourly_review_patterns', { 
          query_user_id: user.id,
          user_timezone: userTimezone
        });
        
      if (error) throw error;
      if (!data) return [];
      
      // Initialize all 24 hours with 0
      const hours = Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        count: 0,
        avg_rating: 0
      }));
      
      // Merge with data
      data.forEach((item) => {
        if (hours[item.hour]) {
          hours[item.hour] = item;
        }
      });
      
      return hours.map(item => ({
        hour: `${item.hour}:00`,
        reviews: item.count,
        efficiency: Math.round((item.avg_rating / 5) * 100) || 0 // Normalize 1-5 rating to 0-100%
      }));
    },
    enabled: !!user
  });
  
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
        学习时段分析
      </h3>
      
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={timeData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="hour" 
              tick={{ fontSize: 10 }} 
              interval={2} // Show every 3rd label
            />
            <YAxis yAxisId="reviews" orientation="left" />
            <YAxis yAxisId="efficiency" orientation="right" domain={[0, 100]} unit="%" />
            <Tooltip />
            <Bar 
              yAxisId="reviews"
              dataKey="reviews" 
              fill="#3b82f6" 
              name="复习次数"
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              yAxisId="efficiency"
              dataKey="efficiency" 
              fill="#10b981" 
              name="效率指数"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">最活跃时段</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {timeData.length > 0 
              ? timeData.reduce((max, curr) => curr.reviews > max.reviews ? curr : max, timeData[0]).hour 
              : '暂无数据'}
          </div>
        </div>
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">最高效时段</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {timeData.length > 0 
              ? timeData.reduce((max, curr) => curr.efficiency > max.efficiency ? curr : max, timeData[0]).hour 
              : '暂无数据'}
          </div>
        </div>
      </div>
    </div>
  );
}
