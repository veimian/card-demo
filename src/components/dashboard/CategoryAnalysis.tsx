import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface CategoryStats {
  name: string;
  count: number;
  dueCount: number;
  averageRetention: number;
  color: string;
}

export default function CategoryAnalysis() {
  const { user } = useAuth();
  
  const { data: categories = [], isLoading } = useQuery<CategoryStats[]>({
    queryKey: ['category-analysis', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .rpc('get_category_statistics', { query_user_id: user.id });
        
      if (error) throw error;
      if (!data) return [];
      
      return data.map((item) => ({
        name: item.name,
        count: item.count,
        dueCount: item.due_count,
        averageRetention: item.average_retention,
        color: item.color
      }));
    },
    enabled: !!user
  });
  
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];
  
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 h-[350px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 h-[350px] flex flex-col items-center justify-center text-gray-500">
        <p>暂无分类数据</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
        知识分类分析
      </h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[300px]">
        <div className="h-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categories}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="count"
              >
                {categories.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [value, '卡片数量']}
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  borderRadius: '0.75rem',
                  border: 'none',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Center Text */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {categories.reduce((acc, curr) => acc + curr.count, 0)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">总卡片</div>
          </div>
        </div>
        
        <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar h-full">
          {categories.map((category, index) => (
            <div key={category.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: category.color || COLORS[index % COLORS.length] }}
                />
                <div>
                  <div className="font-medium text-sm text-gray-900 dark:text-gray-100">{category.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    记忆保持率: {Math.round(category.averageRetention)}%
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-900 dark:text-gray-100">{category.count}</div>
                {category.dueCount > 0 && (
                  <div className="text-xs text-orange-500 font-medium">
                    待复习: {category.dueCount}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
