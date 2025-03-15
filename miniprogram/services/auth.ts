// 用户认证服务
import { request, handleApiError } from '../utils/request';

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
export async function wxLogin(maxRetries = 1): Promise<LoginResponse> {
  // 在函数内部获取 app 实例，确保每次调用时都获取最新的实例
  const app = getApp<IAppOption>();
  
  let retryCount = 0;
  
  async function attemptLogin(): Promise<LoginResponse> {
    try {
      // 获取微信登录凭证
      const loginRes = await wxGetCode();
      console.log('获取到的微信登录凭证:', loginRes);
      
      if (!loginRes.code) {
        throw new Error('获取不到有效的微信登录code');
      }
      
      // 调用后端登录接口
      const data = {
        code: loginRes.code
      };
      console.log('发送到后端的数据:', data);
      
      // 使用正确的API路径
      const response = await request<LoginResponse>({
        url: '/auth/wx-login/',
        method: 'POST',
        data: data
      });
      
      console.log('从后端收到的登录响应:', response);
      
      if (!response || !response.token) {
        throw new Error('后端返回的登录数据不完整');
      }
      
      // 保存登录信息
      wx.setStorageSync('token', response.token);
      wx.setStorageSync('refreshToken', response.refreshToken);
      wx.setStorageSync('userInfo', response.userInfo);
      
      // 获取当前 app 实例，并添加安全检查
      if (app && app.globalData) {
        // 更新全局应用状态
        app.globalData.token = response.token;
        app.globalData.refreshToken = response.refreshToken;
        app.globalData.isLoggedIn = true;
        
        // 尝试设置匿名模式状态
        if ('isAnonymousMode' in app.globalData) {
          app.globalData.isAnonymousMode = false;
        }
      } else {
        console.warn('无法获取全局 app 实例或 globalData，登录状态将只保存在本地存储中');
      }
      
      // 打印当前存储的token，确认是否成功保存
      const savedToken = wx.getStorageSync('token');
      console.log('从存储中读取的token:', savedToken);
      
      return response;
    } catch (error) {
      console.error('登录失败', error);
      
      // 如果还有重试次数，进行重试
      if (retryCount < maxRetries) {
        retryCount++;
        console.log(`登录失败，进行第${retryCount}次重试...`);
        
        // 等待1秒后重试
        await new Promise(resolve => setTimeout(resolve, 1000));
        return attemptLogin();
      }
      
      const errorMsg = handleApiError(error);
      throw new Error(errorMsg);
    }
  }
  
  return attemptLogin();
}

// 获取微信登录凭证
function wxGetCode(): Promise<WechatMiniprogram.LoginSuccessCallbackResult> {
  return new Promise((resolve, reject) => {
    console.log('开始调用wx.login获取微信登录凭证...');
    wx.login({
      timeout: 10000, // 设置超时时间为10秒
      success: (res) => {
        console.log('wx.login成功，获取到code:', res.code);
        resolve(res);
      },
      fail: (err) => {
        console.error('微信登录失败:', JSON.stringify(err));
        // 提供更详细的错误信息
        let errorMessage = '获取微信登录凭证失败';
        if (err.errMsg) {
          errorMessage += `: ${err.errMsg}`;
        }
        
        // 显示错误提示
        wx.showModal({
          title: '登录错误',
          content: `登录失败: ${err.errMsg || '未知错误'}。请重启微信或开发者工具后重试。`,
          showCancel: false
        });
        
        reject(new Error(errorMessage));
      }
    });
  });
}

// 检查登录状态
export async function checkLoginStatus(): Promise<boolean> {
  // 在函数内部获取 app 实例
  const app = getApp<IAppOption>();
  
  try {
    const token = wx.getStorageSync('token');

    // 如果没有token，直接返回未登录
    if (!token) {
      return false;
    }

    // 验证token有效性- 使用正确的API路径
    await request<UserInfo>({
      url: '/auth/verify/',
      method: 'POST',
      data: { token }
    });

    // 如果能够获取 app 实例，更新全局状态
    if (app && app.globalData) {
      app.globalData.isLoggedIn = true;
      app.globalData.token = token;
      app.globalData.isAnonymousMode = false;
    }

    console.log('token验证成功，用户已登录');
    return true;
  } catch (error: any) {
    console.error('验证登录状态失败', error);
    // 如果是401错误，需要尝试刷新token
    if (error.statusCode === 401) {
      console.log('token已过期，尝试刷新token');
      // 这里可以调用刷新token的逻辑
      // 在app.ts中已有refreshTokenFunc方法
    }
    
    // 清除全局登录状态
    if (app && app.globalData) {
      app.globalData.isLoggedIn = false;
      app.globalData.token = '';
    }
    
    return false;
  }
}

// 更新用户信息
export async function updateUserInfo(userInfo: Partial<UserInfo>): Promise<UserInfo> {
  try {
    const response = await request<UserInfo>({
      url: '/users/me/',
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