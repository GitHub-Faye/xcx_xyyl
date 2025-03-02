import { request } from '../utils/request';

// 健康提醒接口
export interface HealthReminder {
  id: string;
  userId: string;
  title: string;
  description?: string;
  reminderTime: string; // 格式: HH:MM
  repeatDays: number[]; // 0-6 表示周日到周六
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// 健康提醒查询参数
export interface HealthReminderQueryParams {
  enabled?: boolean;
}

// 获取健康提醒列表
export async function getHealthReminders(params: HealthReminderQueryParams = {}): Promise<HealthReminder[]> {
  const response = await request<{ reminders: HealthReminder[] }>({
    url: '/health-reminders',
    method: 'GET',
    data: params
  });
  
  return response.reminders || [];
}

// 获取健康提醒详情
export async function getHealthReminderDetail(id: string): Promise<HealthReminder> {
  return request<HealthReminder>({
    url: `/health-reminders/${id}`,
    method: 'GET'
  });
}

// 创建健康提醒
export async function createHealthReminder(data: Partial<HealthReminder>): Promise<HealthReminder> {
  return request<HealthReminder>({
    url: '/health-reminders',
    method: 'POST',
    data
  });
}

// 更新健康提醒
export async function updateHealthReminder(id: string, data: Partial<HealthReminder>): Promise<HealthReminder> {
  return request<HealthReminder>({
    url: `/health-reminders/${id}`,
    method: 'PUT',
    data
  });
}

// 删除健康提醒
export async function deleteHealthReminder(id: string): Promise<void> {
  return request<void>({
    url: `/health-reminders/${id}`,
    method: 'DELETE'
  });
}

// 切换健康提醒状态
export async function toggleHealthReminder(id: string, enabled: boolean): Promise<HealthReminder> {
  return updateHealthReminder(id, { enabled });
}

// 设置本地提醒
export function setLocalNotification(reminder: HealthReminder): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!reminder.enabled) {
      // 如果提醒被禁用，取消本地通知
      // 使用微信小程序的定时器API来模拟通知
      // 实际应用中可能需要使用第三方插件或原生组件
      console.log('取消提醒:', reminder.id);
      resolve();
      return;
    }
    
    // 解析提醒时间
    const [hour, minute] = reminder.reminderTime.split(':').map(Number);
    
    // 设置通知内容
    console.log('设置提醒:', {
      id: reminder.id,
      title: reminder.title,
      description: reminder.description || '健康提醒',
      time: `${hour}:${minute}`,
      repeatDays: reminder.repeatDays
    });
    
    // 注意：微信小程序没有原生的本地通知API
    // 这里只是模拟通知功能，实际应用中可能需要使用服务端推送或第三方插件
    wx.showToast({
      title: '提醒已设置',
      icon: 'success'
    });
    
    resolve();
  });
} 