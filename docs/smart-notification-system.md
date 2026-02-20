# 智能提醒系统设计方案

## 核心架构

### 1. 提醒服务核心类

```typescript
// src/services/SmartNotificationService.ts
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface UserActivityPattern {
  peakHours: number[];
  activeDays: number[];
  averageSessionLength: number;
  preferredNotificationTypes: string[];
}

interface SmartReminder {
  id: string;
  userId: string;
  type: 'review' | 'goal' | 'streak' | 'achievement';
  scheduledTime: Date;
  message: string;
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
  createdAt: Date;
}

class SmartNotificationService {
  private static instance: SmartNotificationService;
  
  private constructor() {}
  
  static getInstance(): SmartNotificationService {
    if (!SmartNotificationService.instance) {
      SmartNotificationService.instance = new SmartNotificationService();
    }
    return SmartNotificationService.instance;
  }
  
  // 基于用户行为模式计算最佳提醒时间
  async calculateOptimalReminderTime(
    userId: string,
    dueCardsCount: number,
    userPattern?: UserActivityPattern
  ): Promise<Date[]> {
    if (!userPattern) {
      userPattern = await this.getUserActivityPattern(userId);
    }
    
    const reminderTimes: Date[] = [];
    const now = new Date();
    
    // 紧急提醒：如果有大量待复习卡片
    if (dueCardsCount > 20) {
      const urgentTime = new Date(now);
      urgentTime.setHours(now.getHours() + 1);
      reminderTimes.push(urgentTime);
    }
    
    // 基于用户活跃时段的提醒
    userPattern.peakHours.forEach(hour => {
      const reminderTime = new Date(now);
      reminderTime.setHours(hour, 0, 0, 0);
      
      // 如果是今天已经过去的时段，则设为明天
      if (reminderTime <= now) {
        reminderTime.setDate(reminderTime.getDate() + 1);
      }
      
      reminderTimes.push(reminderTime);
    });
    
    // 连续性保护提醒
    if (await this.shouldProtectStreak(userId)) {
      const protectionTime = new Date(now);
      protectionTime.setHours(21, 0, 0, 0); // 晚上9点
      reminderTimes.push(protectionTime);
    }
    
    return reminderTimes.sort((a, b) => a.getTime() - b.getTime());
  }
  
  // 获取用户活动模式
  private async getUserActivityPattern(userId: string): Promise<UserActivityPattern> {
    const { data } = await supabase
      .rpc('analyze_user_activity_pattern', { user_id: userId });
    
    return data || {
      peakHours: [9, 14, 20], // 默认时段
      activeDays: [1, 2, 3, 4, 5], // 工作日
      averageSessionLength: 15,
      preferredNotificationTypes: ['review', 'streak']
    };
  }
  
  // 检查是否需要保护连续性
  private async shouldProtectStreak(userId: string): Promise<boolean> {
    const { data: streakData } = await supabase
      .from('user_stats')
      .select('current_streak, last_review_date')
      .eq('user_id', userId)
      .single();
    
    if (!streakData || streakData.current_streak < 3) {
      return false;
    }
    
    const lastReview = new Date(streakData.last_review_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 如果今天还没复习且连续天数>=3，需要保护
    return lastReview < today;
  }
  
  // 生成个性化提醒消息
  async generatePersonalizedMessage(
    userId: string,
    reminderType: string,
    context: any
  ): Promise<string> {
    const user = await this.getUserProfile(userId);
    const stats = await this.getUserStats(userId);
    
    const messageTemplates = {
      review: [
        `📚 ${user.name || '同学'}，你有${context.dueCount}张卡片需要复习哦！`,
        `🧠 记忆巩固时间到了！${context.dueCount}张卡片等待你的检阅`,
        `⚡ 高效复习时间！趁热打铁复习${context.dueCount}张卡片`
      ],
      streak: [
        `🔥 ${stats.currentStreak}天连续学习！今晚复习保持连胜`,
        `🏆 连续学习${stats.currentStreak}天，不要让努力白费`,
        `💪 距离打破最长连续记录还差一步，今晚加油！`
      ],
      goal: [
        `🎯 今日目标还差${context.remaining}个，冲刺一下吧！`,
        `⭐ 还需要${context.remaining}次复习就能达成今日目标`,
        `✨ 已完成${context.completed}/${context.total}，继续努力！`
      ]
    };
    
    const templates = messageTemplates[reminderType as keyof typeof messageTemplates] || [];
    return templates[Math.floor(Math.random() * templates.length)];
  }
  
  // 发送提醒
  async scheduleReminder(reminder: Omit<SmartReminder, 'id' | 'createdAt'>) {
    const { data, error } = await supabase
      .from('smart_reminders')
      .insert([{
        ...reminder,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  // 批量处理到期提醒
  async processPendingReminders() {
    const now = new Date().toISOString();
    
    const { data: pendingReminders } = await supabase
      .from('smart_reminders')
      .select('*')
      .eq('delivered', false)
      .lte('scheduled_time', now);
    
    if (!pendingReminders?.length) return;
    
    // 批量处理提醒
    for (const reminder of pendingReminders) {
      await this.deliverReminder(reminder);
    }
  }
  
  // 实际发送提醒（集成推送服务）
  private async deliverReminder(reminder: SmartReminder) {
    try {
      // 这里集成具体的推送服务
      // 如 Firebase Cloud Messaging, APNs, 或邮件服务
      
      // 示例：浏览器通知
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        await this.sendBrowserNotification(reminder);
      }
      
      // 标记为已送达
      await supabase
        .from('smart_reminders')
        .update({ delivered: true, delivered_at: new Date().toISOString() })
        .eq('id', reminder.id);
        
    } catch (error) {
      console.error('Failed to deliver reminder:', error);
      // 记录失败日志
      await supabase.from('reminder_delivery_logs').insert([{
        reminder_id: reminder.id,
        error_message: (error as Error).message,
        created_at: new Date().toISOString()
      }]);
    }
  }
  
  private async sendBrowserNotification(reminder: SmartReminder) {
    const registration = await navigator.serviceWorker.ready;
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      await registration.showNotification('记忆卡片提醒', {
        body: reminder.message,
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        tag: reminder.type,
        data: { reminderId: reminder.id },
        actions: [
          { action: 'review', title: '立即复习' },
          { action: 'snooze', title: '稍后提醒' }
        ]
      });
    }
  }
}

export default SmartNotificationService.getInstance();
```

### 2. 用户偏好设置组件

```typescript
// src/components/settings/NotificationPreferences.tsx
import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Clock, Target, Calendar } from 'lucide-react';

interface NotificationPreferences {
  enabled: boolean;
  morningReminder: boolean;
  eveningReminder: boolean;
  deadlineWarning: boolean;
  streakProtection: boolean;
  achievementNotifications: boolean;
  quietHours: {
    start: string;  // HH:MM
    end: string;    // HH:MM
  };
  customReminders: Array<{
    time: string;
    message: string;
    enabled: boolean;
  }>;
}

export default function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    enabled: true,
    morningReminder: true,
    eveningReminder: true,
    deadlineWarning: true,
    streakProtection: true,
    achievementNotifications: true,
    quietHours: { start: '22:00', end: '07:00' },
    customReminders: []
  });
  
  const [testSending, setTestSending] = useState(false);
  
  const handlePreferenceChange = (key: keyof NotificationPreferences, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  const sendTestNotification = async () => {
    setTestSending(true);
    try {
      // 调用测试通知接口
      await SmartNotificationService.sendTestNotification();
    } finally {
      setTestSending(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          智能提醒设置
        </CardTitle>
        <CardDescription>
          根据你的学习习惯定制个性化提醒
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 主开关 */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base font-medium">启用智能提醒</Label>
            <p className="text-sm text-gray-500">
              基于你的学习模式提供个性化提醒
            </p>
          </div>
          <Switch
            checked={preferences.enabled}
            onCheckedChange={(checked) => handlePreferenceChange('enabled', checked)}
          />
        </div>
        
        {preferences.enabled && (
          <>
            {/* 时段提醒 */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                时段提醒
              </h3>
              
              <div className="space-y-3 pl-6">
                <div className="flex items-center justify-between">
                  <Label>早晨提醒 (9:00)</Label>
                  <Switch
                    checked={preferences.morningReminder}
                    onCheckedChange={(checked) => handlePreferenceChange('morningReminder', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>晚间提醒 (19:00)</Label>
                  <Switch
                    checked={preferences.eveningReminder}
                    onCheckedChange={(checked) => handlePreferenceChange('eveningReminder', checked)}
                  />
                </div>
              </div>
            </div>
            
            {/* 特殊提醒 */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Target className="h-4 w-4" />
                特殊提醒
              </h3>
              
              <div className="space-y-3 pl-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>截止前提醒</Label>
                    <p className="text-sm text-gray-500">复习截止前2小时提醒</p>
                  </div>
                  <Switch
                    checked={preferences.deadlineWarning}
                    onCheckedChange={(checked) => handlePreferenceChange('deadlineWarning', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>连续性保护</Label>
                    <p className="text-sm text-gray-500">防止中断学习连续性</p>
                  </div>
                  <Switch
                    checked={preferences.streakProtection}
                    onCheckedChange={(checked) => handlePreferenceChange('streakProtection', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>成就通知</Label>
                    <p className="text-sm text-gray-500">解锁新成就时通知</p>
                  </div>
                  <Switch
                    checked={preferences.achievementNotifications}
                    onCheckedChange={(checked) => handlePreferenceChange('achievementNotifications', checked)}
                  />
                </div>
              </div>
            </div>
            
            {/* 免打扰时段 */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                免打扰时段
              </h3>
              
              <div className="grid grid-cols-2 gap-4 pl-6">
                <div>
                  <Label htmlFor="quiet-start">开始时间</Label>
                  <input
                    id="quiet-start"
                    type="time"
                    value={preferences.quietHours.start}
                    onChange={(e) => handlePreferenceChange('quietHours', {
                      ...preferences.quietHours,
                      start: e.target.value
                    })}
                    className="w-full mt-1 p-2 border rounded-md"
                  />
                </div>
                <div>
                  <Label htmlFor="quiet-end">结束时间</Label>
                  <input
                    id="quiet-end"
                    type="time"
                    value={preferences.quietHours.end}
                    onChange={(e) => handlePreferenceChange('quietHours', {
                      ...preferences.quietHours,
                      end: e.target.value
                    })}
                    className="w-full mt-1 p-2 border rounded-md"
                  />
                </div>
              </div>
            </div>
            
            {/* 测试按钮 */}
            <div className="pt-4">
              <Button 
                onClick={sendTestNotification} 
                disabled={testSending}
                variant="outline"
              >
                {testSending ? '发送中...' : '发送测试提醒'}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
```

### 3. 后台任务处理器

```typescript
// src/workers/notification-worker.ts
/// <reference lib="webworker" />

import { supabase } from '../lib/supabase';

const worker: Worker = self as any;

worker.addEventListener('message', async (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'PROCESS_REMINDERS':
      await processPendingReminders();
      break;
      
    case 'ANALYZE_PATTERNS':
      await analyzeUserPatterns(payload.userId);
      break;
      
    case 'SEND_IMMEDIATE':
      await sendImmediateNotification(payload);
      break;
  }
});

async function processPendingReminders() {
  const now = new Date().toISOString();
  
  try {
    const { data: pendingReminders } = await supabase
      .from('smart_reminders')
      .select('*')
      .eq('delivered', false)
      .lte('scheduled_time', now);
    
    if (pendingReminders?.length) {
      // 批量处理提醒
      const promises = pendingReminders.map(reminder => 
        deliverNotification(reminder)
      );
      await Promise.all(promises);
    }
    
    // 通知主线程处理完成
    worker.postMessage({ type: 'REMINDERS_PROCESSED', count: pendingReminders?.length || 0 });
    
  } catch (error) {
    console.error('Error processing reminders:', error);
    worker.postMessage({ type: 'ERROR', error: (error as Error).message });
  }
}

async function deliverNotification(reminder: any) {
  try {
    // 发送浏览器通知
    const registration = await (self as ServiceWorkerGlobalScope).registration;
    
    await registration.showNotification('记忆卡片', {
      body: reminder.message,
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      tag: reminder.type,
      data: { 
        reminderId: reminder.id,
        url: reminder.action_url || '/'
      },
      actions: [
        { action: 'review', title: '立即复习' },
        { action: 'later', title: '稍后提醒' }
      ]
    });
    
    // 标记为已送达
    await supabase
      .from('smart_reminders')
      .update({ 
        delivered: true, 
        delivered_at: new Date().toISOString() 
      })
      .eq('id', reminder.id);
      
  } catch (error) {
    console.error('Failed to deliver notification:', error);
    // 记录错误
    await supabase.from('notification_errors').insert([{
      reminder_id: reminder.id,
      error_message: (error as Error).message,
      created_at: new Date().toISOString()
    }]);
  }
}

async function analyzeUserPatterns(userId: string) {
  // 分析用户学习模式并更新偏好设置
  const analysis = await performPatternAnalysis(userId);
  
  await supabase
    .from('user_notification_preferences')
    .upsert({
      user_id: userId,
      analysis_result: analysis,
      updated_at: new Date().toISOString()
    });
}

// 导出worker
export default {} as typeof worker;
```

### 4. 数据库支持函数

```sql
-- 分析用户活动模式
CREATE OR REPLACE FUNCTION analyze_user_activity_pattern(user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'peak_hours', (
      SELECT array_agg(extract(hour from review_date)::INTEGER)
      FROM (
        SELECT review_date, COUNT(*) as frequency
        FROM review_logs 
        WHERE user_id = $1
        GROUP BY extract(hour from review_date)
        ORDER BY frequency DESC
        LIMIT 3
      ) hourly_stats
    ),
    'active_days', (
      SELECT array_agg(extract(dow from review_date)::INTEGER)
      FROM (
        SELECT review_date, COUNT(*) as frequency
        FROM review_logs 
        WHERE user_id = $1
        GROUP BY extract(dow from review_date)
        ORDER BY frequency DESC
      ) daily_stats
    ),
    'average_session_length', (
      SELECT AVG(time_spent) 
      FROM review_logs 
      WHERE user_id = $1
    ),
    'preferred_types', ARRAY['review', 'streak', 'goal']
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 获取待发送的智能提醒
CREATE OR REPLACE FUNCTION get_pending_smart_reminders()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  type TEXT,
  scheduled_time TIMESTAMPTZ,
  message TEXT,
  priority TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sr.id,
    sr.user_id,
    sr.type,
    sr.scheduled_time,
    sr.message,
    sr.priority
  FROM smart_reminders sr
  WHERE sr.delivered = false 
    AND sr.scheduled_time <= NOW()
    AND sr.user_id IN (
      SELECT user_id 
      FROM user_notification_preferences 
      WHERE enabled = true
    );
END;
$$ LANGUAGE plpgsql;
```

这套智能提醒系统通过分析用户行为模式，提供个性化的提醒时机和内容，有效提升用户的学习连续性和参与度。