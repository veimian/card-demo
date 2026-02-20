import { useAchievements, Achievement } from '../../hooks/useAchievements';
import { Award, Lock, CheckCircle } from 'lucide-react';

export default function AchievementsList() {
  const { achievements, isLoading } = useAchievements();

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          成就系统
        </h3>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          成就系统
        </h3>
        <span className="text-xs font-medium px-2 py-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full">
          {achievements.filter(a => a.unlocked).length} / {achievements.length}
        </span>
      </div>
      
      <div className="space-y-4">
        {achievements.map((achievement) => (
          <AchievementItem key={achievement.id} achievement={achievement} />
        ))}
      </div>
    </div>
  );
}

function AchievementItem({ achievement }: { achievement: Achievement }) {
  return (
    <div className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${
      achievement.unlocked 
        ? 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 border-yellow-200 dark:border-yellow-800/30' 
        : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700 opacity-70'
    }`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 ${
        achievement.unlocked 
          ? 'bg-white dark:bg-gray-800 shadow-sm' 
          : 'bg-gray-200 dark:bg-gray-700 grayscale'
      }`}>
        {achievement.icon}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className={`font-semibold text-sm truncate ${
            achievement.unlocked ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'
          }`}>
            {achievement.name}
          </h4>
          {achievement.unlocked ? (
            <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />
          ) : (
            <Lock className="w-3 h-3 text-gray-400 shrink-0" />
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {achievement.description}
        </p>
      </div>
    </div>
  );
}
