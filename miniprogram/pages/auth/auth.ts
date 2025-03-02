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
      
      const response = await wxLogin();
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
      
      wx.showToast({
        title: '登录失败，请重试',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },
  
  // 显示隐私政策
  showPrivacyPolicy() {
    wx.showModal({
      title: '用户协议与隐私政策',
      content: '小艺医疗小程序尊重并保护用户隐私。我们会收集您的健康数据，仅用于为您提供健康管理服务。您的数据将被安全存储，未经您的许可，我们不会向任何第三方分享您的个人信息。',
      showCancel: false,
      confirmText: '我知道了'
    });
  }
}); 