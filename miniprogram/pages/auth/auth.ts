import { wxLogin, checkLoginStatus } from '../../services/auth';

Page({
  data: {
    loading: false
  },
  
  onLoad() {
    this.checkAuth();
  },
  
  // 检查是否已经登录
  async checkAuth() {
    try {
      const isLoggedIn = await checkLoginStatus();
      if (isLoggedIn) {
        // 已登录，跳转到首页
        wx.switchTab({
          url: '/pages/index/index'
        });
      }
    } catch (error) {
      console.error('检查登录状态失败', error);
    }
  },
  
  // 处理微信登录点击
  async handleLogin() {
    if (this.data.loading) return;
    
    try {
      this.setData({ loading: true });
      console.log('开始微信登录流程');
      
      // 检查网络状态
      const networkType = await this.checkNetworkStatus();
      if (networkType === 'none') {
        wx.showToast({
          title: '网络连接不可用，请检查网络设置',
          icon: 'none',
          duration: 2000
        });
        this.setData({ loading: false });
        return;
      }
      
      // 测试后端服务器连接
      const isServerAvailable = await this.testServerConnection();
      if (!isServerAvailable) {
        wx.showModal({
          title: '服务器连接失败',
          content: '无法连接到服务器，请确保后端服务已启动或联系管理员检查服务器状态',
          showCancel: false
        });
        this.setData({ loading: false });
        return;
      }
      
      // 尝试登录，设置最大重试次数为2
      const response = await wxLogin(2);
      console.log('登录成功，收到响应数据:', response);
      
      // 检查用户信息是否正确
      if (!response.userInfo) {
        console.error('登录响应中缺少用户信息');
        throw new Error('登录响应中缺少用户信息');
      }
      
      // 显示登录成功信息
      wx.showToast({
        title: '登录成功',
        icon: 'success'
      });
      
      // 登录成功，跳转到首页
      wx.switchTab({
        url: '/pages/index/index'
      });
    } catch (error) {
      console.error('登录失败', error);
      
      // 根据错误类型显示不同的错误信息
      let errorMessage = '登录失败，请重试';
      if (error instanceof Error) {
        if (error.message.includes('INVALID_LOGIN') || error.message.includes('access_token expired')) {
          errorMessage = '微信登录凭证已过期，请重启微信或开发者工具后重试';
        } else if (error.message.includes('网络')) {
          errorMessage = '网络连接不稳定，请检查网络后重试';
        }
      }
      
      wx.showModal({
        title: '登录失败',
        content: errorMessage,
        confirmText: '重试',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            // 用户点击重试，重新尝试登录
            setTimeout(() => {
              this.handleLogin();
            }, 1000);
          }
        }
      });
    } finally {
      this.setData({ loading: false });
    }
  },
  
  // 检查网络状态
  checkNetworkStatus(): Promise<string> {
    return new Promise((resolve) => {
      wx.getNetworkType({
        success: (res) => {
          resolve(res.networkType);
        },
        fail: () => {
          resolve('unknown');
        }
      });
    });
  },
  
  // 测试服务器连接
  testServerConnection(): Promise<boolean> {
    return new Promise((resolve) => {
      const apiBaseUrl = 'https://wyw123.pythonanywhere.com/api';
      
      console.log('测试服务器连接:', apiBaseUrl);
      
      // 尝试发送一个简单的请求测试连接性
      wx.request({
        url: apiBaseUrl,
        method: 'GET',
        timeout: 10000,
        success: (res) => {
          console.log('服务器连接测试成功:', res);
          resolve(true);
        },
        fail: (err) => {
          console.error('服务器连接测试失败:', err);
          resolve(false);
        }
      });
    });
  },
  
  // 显示隐私政策
  showPrivacyPolicy() {
    wx.showModal({
      title: '用户协议与隐私政策',
      content: '小艺心数日志小程序尊重并保护用户隐私。我们会收集您的健康数据，仅用于为您提供健康管理服务。您的数据将被安全存储，未经您的许可，我们不会向任何第三方分享您的个人信息。',
      showCancel: false,
      confirmText: '我知道了'
    });
  }
}); 