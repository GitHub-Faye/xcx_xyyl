import { getUserProfile, logout } from '../../services/auth';

// 获取全局应用实例
const app = getApp<IAppOption>();

// 用户信息接口
interface UserInfo {
  avatarUrl: string;
  nickName: string;
  userId: string;
}

Page({
  data: {
    userInfo: {
      avatarUrl: '',
      nickName: '',
      userId: ''
    } as UserInfo
  },

  onLoad() {
    // 检查登录状态
    this.checkLoginStatus();
  },

  onShow() {
    // 页面显示时检查登录状态
    this.checkLoginStatus();
  },
  
  // 检查登录状态
  checkLoginStatus() {
    const token = wx.getStorageSync('token');
    console.log('个人资料页面检查登录状态，当前token:', token);
    
    if (!token) {
      console.log('用户未登录，跳转到登录页');
      wx.redirectTo({
        url: '/pages/auth/auth'
      });
      return;
    }
    
    // 使用全局登录检查方法
    app.checkLoginStatusAndRedirect();
    
    // 加载用户信息
    this.getUserInfo();
  },

  getUserInfo() {
    // 尝试获取本地存储的用户信息
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({
        userInfo
      });
    }
  },

  async getUserProfile() {
    try {
      wx.showLoading({ title: '加载中' });
      
      // 调用获取用户信息接口
      const userProfile = await getUserProfile();
      if (userProfile) {
        // 更新用户信息
        this.setData({
          userInfo: {
            avatarUrl: userProfile.avatarUrl,
            nickName: userProfile.nickName,
            userId: userProfile.userId
          }
        });
        
        // 存储到本地
        wx.setStorageSync('userInfo', this.data.userInfo);
      }
    } catch (error) {
      console.error('获取用户信息失败', error);
      wx.showToast({
        title: '获取用户信息失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  navigateTo(e: any) {
    const url = e.currentTarget.dataset.url;
    if (!url) return;
    
    wx.navigateTo({
      url
    });
  },

  showFeedback() {
    // 打开反馈页面或者收集反馈
    wx.showModal({
      title: '意见反馈',
      content: '感谢您使用小艺医疗小程序，如有任何建议或问题，请联系我们的客服人员。',
      confirmText: '联系客服',
      cancelText: '关闭',
      success(res) {
        if (res.confirm) {
          // 如果微信小程序已经关联了客服，可以直接打开客服会话
          wx.openCustomerServiceChat({
            extInfo: { url: '' },
            corpId: '',
            success() {},
            fail() {
              wx.showToast({
                title: '暂时无法连接客服',
                icon: 'none'
              });
            }
          });
        }
      }
    });
  },

  async logout() {
    try {
      wx.showLoading({ title: '退出中' });
      
      // 调用退出登录接口
      await logout();
      
      // 清除本地存储的用户信息
      wx.removeStorageSync('userInfo');
      wx.removeStorageSync('token');
      
      // 重置用户信息
      this.setData({
        userInfo: {
          avatarUrl: '',
          nickName: '',
          userId: ''
        }
      });
      
      // 返回首页或登录页
      wx.reLaunch({
        url: '/pages/auth/auth'
      });
    } catch (error) {
      console.error('退出登录失败', error);
      wx.showToast({
        title: '退出登录失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  }
});
