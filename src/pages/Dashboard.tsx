import { useState } from 'react';
import StatsOverview from '../components/dashboard/StatsOverview';
import ReviewTrendChart from '../components/dashboard/ReviewTrendChart';
import CategoryAnalysis from '../components/dashboard/CategoryAnalysis';
import TimeAnalysis from '../components/dashboard/TimeAnalysis';
import StreakTracker from '../components/StreakTracker';
import AchievementsList from '../components/dashboard/AchievementsList';

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState<'30d'>('30d'); // Currently only 30d supported by backend
  
  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">学习仪表板</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            洞察你的学习模式，优化记忆效果
          </p>
        </div>
      </div>
      
      {/* 核心统计 */}
      <StatsOverview />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 左侧主要图表 */}
        <div className="lg:col-span-2 space-y-8">
          <ReviewTrendChart />
          <TimeAnalysis />
        </div>
        
        {/* 右侧辅助信息 */}
        <div className="space-y-8">
          <StreakTracker />
          <AchievementsList />
          <CategoryAnalysis />
        </div>
      </div>
    </div>
  );
}
