import { wxLogin, checkLoginStatus } from '../../services/auth';
import { syncDataAfterLogin } from '../../services/sync';
import { config } from '../../config/env';

Page({
  data: {
    loading: false,
    isOptionalLogin: true, // 新增：标记登录是可选的
    redirectUrl: '', // 新增：登录后重定向地址
    showFeatures: true // 显示功能介绍
  },
  
  onLoad(options) {
    // 检查是否有回调页面信息
    const callbackPage = wx.getStorageSync('loginCallbackPage');
    if (callbackPage) {
      this.setData({
        redirectUrl: callbackPage,
        showFeatures: false
      });
    }
    
    // 检查是否从需要登录的功能点进入
    if (options && options.required === 'true') {
      this.setData({
        isOptionalLogin: false
      });
    } else {
      // 默认情况下是可选登录
      this.checkAuth();
    }
  },
  
  // 检查是否已经登录
  async checkAuth() {
    try {
      const isLoggedIn = await checkLoginStatus();
      if (isLoggedIn) {
        // 已登录，跳转到健康记录页面
        wx.switchTab({
          url: '/pages/health-records/list'
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
      
      // 合并临时数据（如果有）
      await this.mergeTempData();
      
      // 根据来源决定跳转行为
      setTimeout(() => {
        if (this.data.redirectUrl) {
          // 有指定页面则跳回该页面
          wx.removeStorageSync('loginCallbackPage');
          wx.navigateBack();
        } else {
          // 否则跳到健康记录页面
          wx.switchTab({
            url: '/pages/health-records/list'
          });
        }
      }, 1500);
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
      const { apiBaseUrl } = config;
      
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
  },
  
  // 新增：跳过登录，返回上一页或进入健康记录页面
  skipLogin() {
    if (this.data.redirectUrl) {
      // 如果是从某个页面跳转过来的，返回该页面
      wx.navigateBack();
    } else {
      // 否则直接进入健康记录页面
      wx.switchTab({
        url: '/pages/health-records/list'
      });
    }
  },
  
  // 新增：合并临时数据方法
  async mergeTempData() {
    try {
      console.log('开始合并临时数据...');
      
      // 检查本地是否有临时数据
      const tempRecords = wx.getStorageSync('tempHealthRecords') || [];
      console.log('本地临时健康记录数:', Array.isArray(tempRecords) ? tempRecords.length : '非数组');
      
      // 使用同步服务同步所有临时数据
      const syncResult = await syncDataAfterLogin();
      console.log('同步临时数据结果:', syncResult);
      
      if (syncResult && syncResult.success) {
        // 同步健康记录
        if (syncResult.result && syncResult.result.healthRecords && syncResult.result.healthRecords.syncedCount > 0) {
          console.log(`成功同步${syncResult.result.healthRecords.syncedCount}条健康记录`);
          
          // 手动清理本地数据
          wx.setStorageSync('tempHealthRecords', []);
          console.log('已清理本地临时健康记录');
          
          wx.showToast({
            title: `成功同步${syncResult.result.healthRecords.syncedCount}条记录`,
            icon: 'success'
          });
        } else {
          console.log('没有需要同步的健康记录');
        }
      } else {
        console.error('同步临时数据失败:', syncResult ? (syncResult.error || syncResult.reason) : '未知错误');
      }
    } catch (error) {
      console.error('合并临时数据时出错:', error);
    }
  }
}); 