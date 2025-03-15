// 在app.ts顶部添加全局Trace函数
// 定义全局的Trace函数，用于解决可能的引用错误
// @ts-ignore
globalThis.Trace = globalThis.Trace || function(...args: any[]) {
  console.log('Trace:', ...args);
};

// app.ts
import { checkLoginStatus } from './services/auth';
import { request } from './utils/request';
import { UserInfo } from './services/auth';
import { config } from './config/env'; // 导入环境配置

// Token类型定义
interface TokenResponse {
  access: string;
  refresh?: string;
}

// 扩展IAppOption接口，添加getUserInfo方法的正确返回类型
interface IAppOption {
  globalData: {
    userInfo: UserInfo | null;
    token: string;
    refreshToken: string;
    apiBaseUrl: string;
    isLoggedIn: boolean;
    isAnonymousMode: boolean; // 新增：匿名模式标志
    temporaryData: Record<string, any>; // 新增：临时数据
    useMockData: boolean;  // 是否使用模拟数据
  };
  getUserInfo(): Promise<UserInfo | null>;
  refreshTokenFunc(): Promise<boolean>;
  logout(): void;
  checkLoginStatusAndRedirect(): Promise<void>;
  checkCurrentPage(): void;
  redirectToLogin(): void;
  setApiBaseUrl(): void;
  testApiEndpoints(defaultUrl: string): Promise<string | null>;
  showLoginTips: (options?: {
    title?: string;
    content?: string;
    cancelText?: string;
    confirmText?: string;
    success?: (result: WechatMiniprogram.ShowModalSuccessCallbackResult) => void;
  }) => void;
}

App<IAppOption>({
  globalData: {
    userInfo: null,
    token: '',
    refreshToken: '',
    apiBaseUrl: config.apiBaseUrl, // 使用环境配置
    isLoggedIn: false,
    isAnonymousMode: true, // 新增：匿名模式标志
    temporaryData: {}, // 新增：临时数据对象
    useMockData: false
  },
  
  onLaunch() {
    // 初始化全局数据
    this.globalData.apiBaseUrl = config.apiBaseUrl; // 使用环境配置
    this.globalData.isLoggedIn = false;
    this.globalData.isAnonymousMode = true; // 默认为匿名模式
    this.globalData.temporaryData = {}; // 初始化临时数据对象
    
    // 尝试读取token
    this.globalData.token = wx.getStorageSync('token') || '';
    this.globalData.refreshToken = wx.getStorageSync('refreshToken') || '';
    
    if (this.globalData.token) {
      // 检查登录状态
      checkLoginStatus().then(isLoggedIn => {
        console.log('登录状态检查结果:', isLoggedIn);
        this.globalData.isLoggedIn = isLoggedIn;
        
        // 如果已登录，关闭匿名模式
        if (isLoggedIn) {
          this.globalData.isAnonymousMode = false;
        }
      }).catch(error => {
        console.error('检查登录状态时出错:', error);
        this.globalData.isLoggedIn = false;
      });
    } else {
      console.log('未发现登录凭证，处于未登录状态');
      this.globalData.isLoggedIn = false;
    }
  },
  
  // 设置API基础URL，使用环境配置
  setApiBaseUrl() {
    this.globalData.apiBaseUrl = config.apiBaseUrl;
    console.log(`使用${config.envName}API基础URL:`, this.globalData.apiBaseUrl);
  },
  
  // 测试多个可能的API端点格式
  testApiEndpoints(defaultUrl: string): Promise<string | null> {
    // 可能的API格式列表
    const possibleUrls = [
      'http://localhost:8000/api',
      'http://localhost:8000/api/',
      'http://localhost:8000',
      'http://localhost:8000/'
    ];
    
    return new Promise((resolve) => {
      let checkedCount = 0;
      let foundValidUrl = false;
      
      // 测试每个可能的URL格式
      possibleUrls.forEach(url => {
        console.log('测试API路径:', url);
        
        wx.request({
          url: url,
          method: 'GET',
          timeout: 5000,
          success: (res) => {
            console.log(`API路径 ${url} 测试成功:`, res);
            
            if (!foundValidUrl) {
              foundValidUrl = true;
              resolve(url);
            }
          },
          fail: () => {
            console.log(`API路径 ${url} 测试失败`);
          },
          complete: () => {
            checkedCount++;
            if (checkedCount === possibleUrls.length && !foundValidUrl) {
              console.log('所有API路径测试失败，使用默认路径');
              resolve(defaultUrl);
            }
          }
        });
      });
    });
  },

  // 检查登录状态并重定向
  async checkLoginStatusAndRedirect() {
    try {
      const token = wx.getStorageSync('token');
      if (!token) {
        console.log('本地无token，跳转到登录页');
        this.redirectToLogin();
        return;
      }
      
      this.globalData.token = token;
      this.globalData.refreshToken = wx.getStorageSync('refreshToken') || '';
      
      console.log('正在验证token有效性');
      
      try {
        const isLoggedIn = await checkLoginStatus();
        this.globalData.isLoggedIn = isLoggedIn;
        
        if (isLoggedIn) {
          console.log('登录有效，获取用户信息');
          await this.getUserInfo();
          this.checkCurrentPage();
        } else {
          console.log('登录验证失败，跳转到登录页');
          this.redirectToLogin();
        }
      } catch (loginError) {
        console.error('登录验证过程中出错:', loginError);
        
        // 尝试刷新token
        console.log('尝试刷新token');
        const refreshSuccess = await this.refreshTokenFunc();
        
        if (refreshSuccess) {
          console.log('token刷新成功，重新验证登录');
          await this.checkLoginStatusAndRedirect();
        } else {
          console.log('token刷新失败，跳转到登录页');
          this.redirectToLogin();
        }
      }
    } catch (error) {
      console.error('检查登录状态出错', error);
      this.redirectToLogin();
    }
  },

  // 检查当前页面并决定是否重定向
  checkCurrentPage() {
    const pages = getCurrentPages();
    
    if (pages.length === 0) {
      // 应用刚刚启动，尚未加载任何页面
      return;
    }
    
    const currentPage = pages[pages.length - 1];
    const route = currentPage.route;
    
    console.log('当前页面路径:', route);
    
    if (route === 'pages/auth/auth') {
      // 如果当前已经在登录页，且已登录，则跳转到首页
      if (this.globalData.isLoggedIn) {
        console.log('已登录状态下在登录页，跳转到首页');
        wx.switchTab({
          url: '/pages/health-records/list'
        });
      }
    }
  },

  // 重定向到登录页
  redirectToLogin() {
    // 清除登录状态
    this.globalData.isLoggedIn = false;
    
    // 获取当前页面
    const pages = getCurrentPages();
    
    if (pages.length === 0 || pages[pages.length - 1].route === 'pages/auth/auth') {
      // 如果当前没有页面或已在登录页，不执行跳转
      return;
    }
    
    console.log('登录验证失败，跳转到登录页');
    
    // 使用reLaunch而不是redirectTo，确保清除所有页面栈
    wx.reLaunch({
      url: '/pages/auth/auth'
    });
  },

  // 获取用户信息
  async getUserInfo(): Promise<UserInfo | null> {
    if (!this.globalData.token) {
      console.log('无token，跳过获取用户信息');
      return null;
    }
    
    try {
      console.log('开始获取用户信息');
      
      const userData = await request<UserInfo>({
        url: '/users/me/',
        method: 'GET'
      });
      
      console.log('获取用户信息成功:', userData);
      this.globalData.userInfo = userData;
      
      // 保存到本地存储
      wx.setStorageSync('userInfo', userData);
      
      return userData;
    } catch (error: any) {
      console.error('获取用户信息失败', error);
      
      // 判断是否需要刷新token
      if (error.statusCode === 401) {
        console.log('用户信息获取失败(401)，尝试刷新token');
        const refreshSuccess = await this.refreshTokenFunc();
        if (refreshSuccess) {
          // 重新获取用户信息
          return this.getUserInfo();
        }
      }
      
      return null;
    }
  },

  // 刷新Token
  async refreshTokenFunc(): Promise<boolean> {
    if (!this.globalData.refreshToken) {
      console.log('无刷新令牌，无法刷新token');
      this.logout();
      return false;
    }
    
    try {
      console.log('开始刷新token');
      
      const refreshResult = await request<TokenResponse>({
        url: '/auth/refresh/',
        method: 'POST',
        data: {
          refresh: this.globalData.refreshToken
        }
      });
      
      if (refreshResult && refreshResult.access) {
        console.log('token刷新成功');
        this.globalData.token = refreshResult.access;
        wx.setStorageSync('token', refreshResult.access);
        return true;
      } else {
        console.error('token刷新失败: 响应缺少access字段');
        this.logout();
        return false;
      }
    } catch (error) {
      console.error('刷新Token失败', error);
      this.logout();
      return false;
    }
  },

  // 登出
  logout() {
    console.log('执行登出操作');
    
    this.globalData.token = '';
    this.globalData.refreshToken = '';
    this.globalData.userInfo = null;
    this.globalData.isLoggedIn = false;
    
    wx.removeStorageSync('token');
    wx.removeStorageSync('refreshToken');
    wx.removeStorageSync('userInfo');
    
    wx.reLaunch({
      url: '/pages/auth/auth'
    });
  },

  // 新增：全局登录提示方法
  showLoginTips(options = {}) {
    const { 
      title = '需要登录', 
      content = '该功能需要登录后才能使用，是否立即登录？', 
      cancelText = '稍后再说',
      confirmText = '立即登录',
      success = () => {}
    } = options;
    
    wx.showModal({
      title,
      content,
      cancelText,
      confirmText,
      success: (res) => {
        if (res.confirm) {
          // 记录当前页面，登录后可以返回
          const pages = getCurrentPages();
          if (pages.length > 0) {
            const currentPage = pages[pages.length - 1];
            wx.setStorageSync('loginCallbackPage', currentPage.route);
          }
          
          // 跳转到登录页
          wx.navigateTo({
            url: '/pages/auth/auth?required=true'
          });
        }
        
        // 调用自定义回调
        if (typeof success === 'function') {
          success(res);
        }
      }
    });
  }
})

// 声明全局类型以支持TypeScript
declare global {
  interface UserInfo {
    id: number;
    username: string;
    nickname?: string;
    avatar?: string;
    // 根据实际用户信息结构添加更多字段
  }
}

export {};