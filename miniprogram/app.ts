// app.ts
import { checkLoginStatus } from './services/auth';
import { request } from './utils/request';
import { UserInfo } from './services/auth';

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
  };
  getUserInfo(): Promise<UserInfo | null>;
  refreshTokenFunc(): Promise<boolean>;
  logout(): void;
  checkLoginStatusAndRedirect(): Promise<void>;
  checkCurrentPage(): void;
  redirectToLogin(): void;
}

App<IAppOption>({
  globalData: {
    userInfo: null,
    token: '',
    refreshToken: '',
    apiBaseUrl: 'http://localhost:8000/api',
    isLoggedIn: false  // 新增登录状态标记
  },
  onLaunch() {
    // 启动时检查登录状态
    console.log('应用启动，开始检查登录状态');
    
    // 微信开发工具环境判断
    if (wx.getSystemInfoSync().platform === 'devtools') {
      console.log('当前是开发者工具环境');
    }
    
    this.checkLoginStatusAndRedirect();
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
          url: '/pages/index/index'
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
    
    // 重定向到登录页
    wx.redirectTo({
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
  }
})