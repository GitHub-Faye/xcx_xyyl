// 用户认证服务
import { request, handleApiError } from '../utils/request';

const app = getApp<IAppOption>();

// 用户信息接口
export interface UserInfo {
  id: string;
  openId: string;
  nickName: string;
  avatarUrl: string;
  gender: number;
  country: string;
  province: string;
  city: string;
  createdAt: string;
  updatedAt: string;
}

// 登录响应接口
export interface LoginResponse {
  token: string;
  refreshToken: string;
  expiresIn: number;
  userInfo: UserInfo;
}

// 微信登录
export async function wxLogin(): Promise<LoginResponse> {
  try {
    // 获取微信登录凭证
    const loginRes = await wxGetCode();
    console.log('获取到的微信登录凭证:', loginRes);
    
    // 调用后端登录接口
    const data = {
      code: loginRes.code
    };
    console.log('发送到后端的数据:', data);
    
    const response = await request<LoginResponse>({
      url: '/auth/wx-login/',
      method: 'POST',
      data: data
    });
    
    console.log('从后端收到的登录响应:', response);
    
    // 保存登录信息
    wx.setStorageSync('token', response.token);
    wx.setStorageSync('refreshToken', response.refreshToken);
    wx.setStorageSync('userInfo', response.userInfo);
    
    // 打印当前存储的token，确认是否成功保存
    const savedToken = wx.getStorageSync('token');
    console.log('从存储中读取的token:', savedToken);
    
    return response;
  } catch (error) {
    console.error('登录失败', error);
    const errorMsg = handleApiError(error);
    throw new Error(errorMsg);
  }
}

// 获取微信登录凭证
function wxGetCode(): Promise<WechatMiniprogram.LoginSuccessCallbackResult> {
  return new Promise((resolve, reject) => {
    wx.login({
      success: resolve,
      fail: (err) => {
        console.error('微信登录失败:', err);
        reject(new Error('获取微信登录凭证失败'));
      }
    });
  });
}

// 检查登录状态
export async function checkLoginStatus(): Promise<boolean> {
  try {
    const token = wx.getStorageSync('token');
    
    // 如果没有token，直接返回未登录
    if (!token) {
      return false;
    }
    
    // 验证token有效性 - 使用users/me接口代替verify-token
    await request<UserInfo>({
      url: '/users/me/',
      method: 'GET'
    });
    
    console.log('token验证成功，用户已登录');
    return true;
  } catch (error: any) {
    console.error('验证登录状态失败:', error);
    // 如果是401错误，需要尝试刷新token
    if (error.statusCode === 401) {
      console.log('token已过期，尝试刷新token');
      // 这里可以调用刷新token的逻辑
      // 在app.ts中已有refreshTokenFunc方法
    }
    return false;
  }
}

// 更新用户信息
export async function updateUserInfo(userInfo: Partial<UserInfo>): Promise<UserInfo> {
  try {
    const response = await request<UserInfo>({
      url: '/user/profile/',
      method: 'PUT',
      data: userInfo
    });
    
    // 更新本地存储的用户信息
    const currentUserInfo = wx.getStorageSync('userInfo') || {};
    wx.setStorageSync('userInfo', { ...currentUserInfo, ...response });
    
    return response;
  } catch (error) {
    const errorMsg = handleApiError(error);
    throw new Error(errorMsg);
  }
}

// 退出登录
export function logout(): void {
  // 清除本地存储的登录信息
  wx.removeStorageSync('token');
  wx.removeStorageSync('refreshToken');
  wx.removeStorageSync('userInfo');
  
  // 跳转到登录页
  wx.redirectTo({
    url: '/pages/auth/auth'
  });
} 