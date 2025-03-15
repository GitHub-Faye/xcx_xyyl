import { request } from '../utils/request';

// API响应接口
interface ApiResponse<T = any> {
  data: T;
  statusCode: number;
  message?: string;
}

// 通知设置接口
export interface NotificationSettings {
  abnormalDataAlerts: boolean;
  healthReports: boolean;
  newsAndActivities: boolean;
  inAppNotifications: boolean;
  wechatServiceNotifications: boolean;
  smsNotifications: boolean;
  doNotDisturb: boolean;
  doNotDisturbStart: string;
  doNotDisturbEnd: string;
}

/**
 * 获取用户的通知设置
 * @returns 用户的通知设置
 */
export async function getNotificationSettings(): Promise<NotificationSettings> {
  try {
    console.log('正在获取用户通知设置...');
    
    // 尝试从服务器获取
    const response = await request<ApiResponse<NotificationSettings>>({
      url: '/user/notification-settings/',
      method: 'GET'
    });
    
    if (response && response.data) {
      console.log('成功获取通知设置:', response.data);
      return response.data;
    }
    
    throw new Error('获取通知设置失败: 服务器响应无效');
  } catch (error) {
    console.error('获取通知设置失败:', error);
    
    // 如果获取失败，返回默认设置
    return {
      abnormalDataAlerts: true,
      healthReports: true,
      newsAndActivities: false,
      inAppNotifications: true,
      wechatServiceNotifications: true,
      smsNotifications: false,
      doNotDisturb: false,
      doNotDisturbStart: '22:00',
      doNotDisturbEnd: '08:00'
    };
  }
}

/**
 * 更新用户的通知设置
 * @param settings 要更新的通知设置
 * @returns 更新结果
 */
export async function updateNotificationSettings(settings: NotificationSettings): Promise<boolean> {
  try {
    console.log('正在更新用户通知设置...');
    
    // 发送更新请求到服务器
    const response = await request<ApiResponse>({
      url: '/user/notification-settings/',
      method: 'POST',
      data: settings
    });
    
    console.log('通知设置更新结果:', response);
    return true;
  } catch (error) {
    console.error('更新通知设置失败:', error);
    throw error;
  }
}

/**
 * 获取用户个人信息
 * @returns 用户信息
 */
export async function getUserProfile() {
  try {
    console.log('正在获取用户个人信息...');
    
    const response = await request<ApiResponse>({
      url: '/user/profile/',
      method: 'GET'
    });
    
    if (response && response.data) {
      console.log('成功获取用户信息:', response.data);
      return response.data;
    }
    
    throw new Error('获取用户信息失败: 服务器响应无效');
  } catch (error) {
    console.error('获取用户信息失败:', error);
    throw error;
  }
}

/**
 * 更新用户个人信息
 * @param profileData 要更新的个人信息
 * @returns 更新结果
 */
export async function updateUserProfile(profileData: any): Promise<boolean> {
  try {
    console.log('正在更新用户个人信息...');
    
    const response = await request<ApiResponse>({
      url: '/user/profile/',
      method: 'POST',
      data: profileData
    });
    
    console.log('用户信息更新结果:', response);
    return true;
  } catch (error) {
    console.error('更新用户信息失败:', error);
    throw error;
  }
} 