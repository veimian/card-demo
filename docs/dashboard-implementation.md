# Dashboard 统计仪表板设计方案

## 核心功能模块

### 1. 数据可视化组件

```typescript
// src/components/dashboard/ReviewTrendChart.tsx
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
      
      // 获取最近30天的复习数据
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data } = await supabase
        .rpc('get_daily_review_stats', {
          user_id: user.id,
          start_date: thirtyDaysAgo.toISOString()
        });
      
      return data || [];
    },
    enabled: !!user
  });
  
  if (isLoading) return <ChartSkeleton />;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        复习趋势
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            tickFormatter={(date) => new Date(date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
          />
          <YAxis yAxisId="reviews" orientation="left" />
          <YAxis yAxisId="rate" orientation="right" domain={[0, 100]} />
          <Tooltip 
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
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line 
            yAxisId="newCards"
            type="monotone" 
            dataKey="newCards" 
            stroke="#10b981" 
            strokeWidth={2}
            strokeDasharray="5 5"
          />
          <Line 
            yAxisId="rate"
            type="monotone" 
            dataKey="retentionRate" 
            stroke="#f59e0b" 
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// src/components/dashboard/RetentionHeatmap.tsx
export default function RetentionHeatmap() {
  const { data: heatmapData, isLoading } = useQuery({
    queryKey: ['retention-heatmap'],
    queryFn: async () => {
      // 生成过去一年的记忆强度热力图数据
      const data = [];
      const today = new Date();
      
      for (let i = 364; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        data.push({
          date: date.toISOString().split('T')[0],
          intensity: Math.random() * 100, // 模拟数据
          reviews: Math.floor(Math.random() * 20)
        });
      }
      
      return data;
    }
  });
  
  // 热力图渲染逻辑...
}
```

### 2. 核心统计指标

```typescript
// src/components/dashboard/StatsOverview.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Brain, Clock, Target } from 'lucide-react';

interface StatsData {
  totalCards: number;
  dueToday: number;
  averageRetention: number;
  studyTimeToday: number;
  currentStreak: number;
  masteryRate: number;
}

export default function StatsOverview() {
  const { data: stats, isLoading } = useQuery<StatsData>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      // 聚合各种统计数据
      const [
        totalCards,
        dueCards,
        avgRetention,
        todayStudyTime,
        streakData,
        masteryData
      ] = await Promise.all([
        getTotalCards(),
        getDueCards(),
        getAverageRetention(),
        getTodayStudyTime(),
        getCurrentStreak(),
        getMasteryRate()
      ]);
      
      return {
        totalCards,
        dueToday: dueCards,
        averageRetention: avgRetention,
        studyTimeToday: todayStudyTime,
        currentStreak: streakData.current,
        masteryRate: masteryData.rate
      };
    }
  });
  
  if (isLoading) return <StatsSkeleton />;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <StatCard
        title="总卡片数"
        value={stats.totalCards}
        icon={<Brain className="h-6 w-6 text-blue-500" />}
        trend="+12%"
      />
      <StatCard
        title="今日待复习"
        value={stats.dueToday}
        icon={<Target className="h-6 w-6 text-orange-500" />}
        trend="-3%"
      />
      <StatCard
        title="平均保持率"
        value={`${stats.averageRetention}%`}
        icon={<TrendingUp className="h-6 w-6 text-green-500" />}
        trend="+2.1%"
      />
      <StatCard
        title="今日学习时长"
        value={`${Math.floor(stats.studyTimeToday / 60)}分钟`}
        icon={<Clock className="h-6 w-6 text-purple-500" />}
        trend="+15分钟"
      />
      <StatCard
        title="连续学习"
        value={`${stats.currentStreak}天`}
        icon={<Flame className="h-6 w-6 text-red-500" />}
        trend="🔥 热力持续"
      />
      <StatCard
        title="掌握程度"
        value={`${stats.masteryRate}%`}
        icon={<Award className="h-6 w-6 text-yellow-500" />}
        trend="+5%"
      />
    </div>
  );
}
```

### 3. 分类分析模块

```typescript
// src/components/dashboard/CategoryAnalysis.tsx
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

interface CategoryStats {
  name: string;
  count: number;
  dueCount: number;
  averageRetention: number;
  color: string;
}

export default function CategoryAnalysis() {
  const { data: categories = [], isLoading } = useQuery<CategoryStats[]>({
    queryKey: ['category-analysis'],
    queryFn: async () => {
      const { data } = await supabase
        .rpc('get_category_statistics');
      return data || [];
    }
  });
  
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
        知识分类分析
      </h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-4">卡片分布</h4>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={categories}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {categories.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="space-y-4">
          {categories.map((category, index) => (
            <CategoryCard 
              key={category.name}
              category={category}
              color={COLORS[index % COLORS.length]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
```

### 4. 时间分析组件

```typescript
// src/components/dashboard/TimeAnalysis.tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TimeSlotData {
  hour: string;
  reviews: number;
  efficiency: number; // 基于评分的效率指标
}

export default function TimeAnalysis() {
  const { data: timeData = [], isLoading } = useQuery<TimeSlotData[]>({
    queryKey: ['time-analysis'],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_hourly_review_patterns');
      return data?.map(item => ({
        hour: `${item.hour}:00`,
        reviews: item.count,
        efficiency: item.avg_rating * 20 // 转换为百分比
      })) || [];
    }
  });
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
        学习时段分析
      </h3>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={timeData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" />
            <YAxis yAxisId="reviews" />
            <YAxis yAxisId="efficiency" orientation="right" domain={[0, 100]} />
            <Tooltip />
            <Bar 
              yAxisId="reviews"
              dataKey="reviews" 
              fill="#3b82f6" 
              name="复习次数"
            />
            <Bar 
              yAxisId="efficiency"
              dataKey="efficiency" 
              fill="#10b981" 
              name="效率指数"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <InsightCard 
          title="最佳学习时段"
          value="上午9-11点"
          description="平均效率最高"
        />
        <InsightCard 
          title="高峰时段"
          value="晚上7-9点"
          description="复习次数最多"
        />
        <InsightCard 
          title="建议时间段"
          value="根据个人习惯"
          description="AI推荐最优时段"
        />
        <InsightCard 
          title="避免时段"
          value="深夜11点后"
          description="记忆效果较差"
        />
      </div>
    </div>
  );
}
```

### 5. 主仪表板页面

```typescript
// src/pages/Dashboard.tsx
import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import StatsOverview from '@/components/dashboard/StatsOverview';
import ReviewTrendChart from '@/components/dashboard/ReviewTrendChart';
import CategoryAnalysis from '@/components/dashboard/CategoryAnalysis';
import TimeAnalysis from '@/components/dashboard/TimeAnalysis';
import RecentActivity from '@/components/dashboard/RecentActivity';
import GoalTracker from '@/components/dashboard/GoalTracker';

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  
  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">学习仪表板</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          洞察你的学习模式，优化记忆效果
        </p>
      </div>
      
      {/* 时间范围选择器 */}
      <div className="flex justify-end mb-6">
        <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-1">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                timeRange === range
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              {range === '7d' ? '近7天' : range === '30d' ? '近30天' : '近90天'}
            </button>
          ))}
        </div>
      </div>
      
      {/* 核心统计 */}
      <StatsOverview />
      
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 左侧主要图表 */}
        <div className="lg:col-span-2 space-y-8">
          <ReviewTrendChart timeRange={timeRange} />
          <TimeAnalysis timeRange={timeRange} />
        </div>
        
        {/* 右侧辅助信息 */}
        <div className="space-y-8">
          <CategoryAnalysis timeRange={timeRange} />
          <GoalTracker />
          <RecentActivity />
        </div>
      </div>
      
      {/* 深度洞察 */}
      <div className="mt-8">
        <Tabs defaultValue="insights" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="insights">智能洞察</TabsTrigger>
            <TabsTrigger value="recommendations">个性建议</TabsTrigger>
            <TabsTrigger value="predictions">未来预测</TabsTrigger>
          </TabsList>
          <TabsContent value="insights">
            <InsightsPanel />
          </TabsContent>
          <TabsContent value="recommendations">
            <RecommendationsPanel />
          </TabsContent>
          <TabsContent value="predictions">
            <PredictionsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
```

### 6. 数据库函数支持

```sql
-- 获取每日复习统计
CREATE OR REPLACE FUNCTION get_daily_review_stats(user_id UUID, start_date DATE)
RETURNS TABLE (
  date DATE,
  reviews INTEGER,
  new_cards INTEGER,
  retention_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.date::DATE,
    COALESCE(r.review_count, 0) as reviews,
    COALESCE(nc.new_count, 0) as new_cards,
    COALESCE(rt.retention_rate, 0) as retention_rate
  FROM generate_series(start_date, CURRENT_DATE, '1 day'::INTERVAL) d
  LEFT JOIN (
    SELECT 
      created_at::DATE as review_date,
      COUNT(*) as review_count
    FROM review_logs 
    WHERE user_id = $1
    GROUP BY created_at::DATE
  ) r ON d.date = r.review_date
  LEFT JOIN (
    SELECT 
      created_at::DATE as create_date,
      COUNT(*) as new_count
    FROM cards 
    WHERE user_id = $1
    GROUP BY created_at::DATE
  ) nc ON d.date = nc.create_date
  LEFT JOIN (
    SELECT 
      review_date::DATE as date,
      AVG(CASE WHEN rating >= 4 THEN 1.0 ELSE 0.0 END) * 100 as retention_rate
    FROM review_logs 
    WHERE user_id = $1
    GROUP BY review_date::DATE
  ) rt ON d.date = rt.date
  ORDER BY d.date;
END;
$$ LANGUAGE plpgsql;

-- 获取分类统计
CREATE OR REPLACE FUNCTION get_category_statistics(user_id UUID)
RETURNS TABLE (
  name TEXT,
  count INTEGER,
  due_count INTEGER,
  average_retention NUMERIC,
  color TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.name,
    COUNT(card.id)::INTEGER as count,
    COUNT(CASE WHEN card.next_review <= NOW() THEN 1 END)::INTEGER as due_count,
    COALESCE(AVG(CASE WHEN rl.rating >= 4 THEN 1.0 ELSE 0.0 END) * 100, 0) as average_retention,
    COALESCE(c.color, '#3b82f6') as color
  FROM categories c
  LEFT JOIN cards card ON c.id = card.category_id AND card.user_id = $1
  LEFT JOIN review_logs rl ON card.id = rl.card_id AND rl.user_id = $1
  WHERE c.user_id = $1
  GROUP BY c.id, c.name, c.color
  HAVING COUNT(card.id) > 0
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql;
```

这套仪表板系统提供了全面的学习数据分析，帮助用户更好地理解自己的学习模式并优化记忆效果。