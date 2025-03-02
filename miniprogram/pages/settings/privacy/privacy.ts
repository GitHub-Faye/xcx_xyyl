import { updatePrivacySettings, getPrivacySettings, deleteAccount } from '../../../../services/user';

// 隐私设置接口
interface PrivacySettings {
  shareHealthData: boolean;
  shareToDoctors: boolean;
  anonymousDataForResearch: boolean;
  loginAlert: boolean;
  biometricUnlock: boolean;
}

Page({
  data: {
    privacySettings: {
      shareHealthData: true,
      shareToDoctors: false,
      anonymousDataForResearch: true,
      loginAlert: true,
      biometricUnlock: false
    } as PrivacySettings
  },

  onLoad() {
    this.loadPrivacySettings();
  },

  onShow() {
    // 页面显示时刷新数据
    this.loadPrivacySettings();
  },

  async loadPrivacySettings() {
    try {
      wx.showLoading({ title: '加载中' });
      
      // 从本地存储获取隐私设置
      const storedSettings = wx.getStorageSync('privacySettings');
      
      if (storedSettings) {
        this.setData({
          privacySettings: storedSettings
        });
      } else {
        // 尝试从服务器获取隐私设置
        try {
          const settings = await getPrivacySettings();
          if (settings) {
            this.setData({
              privacySettings: settings
            });
            
            // 存储到本地
            wx.setStorageSync('privacySettings', settings);
          }
        } catch (error) {
          console.error('获取隐私设置失败', error);
          // 使用默认设置
        }
      }
    } catch (error) {
      console.error('加载隐私设置失败', error);
      wx.showToast({
        title: '加载隐私设置失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  onSwitchChange(e: any) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    
    this.setData({
      [`privacySettings.${field}`]: value
    });
  },

  changePassword() {
    // 导航到修改密码页面
    wx.navigateTo({
      url: '/pages/settings/password/password'
    });
  },

  exportData() {
    wx.showLoading({ title: '准备导出...' });
    
    // 这里应该调用导出数据的API
    // 由于小程序限制，通常是生成一个可下载链接或发送到邮箱
    
    setTimeout(() => {
      wx.hideLoading();
      wx.showModal({
        title: '数据导出',
        content: '我们将在24小时内将您的数据发送到您的注册邮箱，请注意查收。',
        showCancel: false
      });
    }, 1500);
  },

  clearCache() {
    wx.showModal({
      title: '清除缓存',
      content: '确定要清除本地缓存数据吗？这不会影响您的账号数据，但需要重新登录。',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '清除中...' });
          
          // 清除本地缓存
          try {
            wx.clearStorageSync();
            
            setTimeout(() => {
              wx.hideLoading();
              wx.showToast({
                title: '缓存已清除',
                icon: 'success'
              });
              
              // 重新加载页面
              setTimeout(() => {
                wx.reLaunch({
                  url: '/pages/auth/auth'
                });
              }, 1500);
            }, 1000);
          } catch (error) {
            console.error('清除缓存失败', error);
            wx.hideLoading();
            wx.showToast({
              title: '清除缓存失败',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  showDeleteAccountConfirm() {
    wx.showModal({
      title: '删除账号',
      content: '确定要删除您的账号吗？此操作不可恢复，所有数据将被永久删除。',
      confirmText: '删除',
      confirmColor: '#ff3b30',
      success: (res) => {
        if (res.confirm) {
          this.deleteUserAccount();
        }
      }
    });
  },

  async deleteUserAccount() {
    try {
      wx.showLoading({ title: '处理中...' });
      
      // 调用删除账号API
      await deleteAccount();
      
      // 清除本地数据
      wx.clearStorageSync();
      
      wx.hideLoading();
      wx.showToast({
        title: '账号已删除',
        icon: 'success'
      });
      
      // 返回登录页
      setTimeout(() => {
        wx.reLaunch({
          url: '/pages/auth/auth'
        });
      }, 1500);
    } catch (error) {
      console.error('删除账号失败', error);
      wx.hideLoading();
      wx.showToast({
        title: '删除账号失败',
        icon: 'none'
      });
    }
  },

  async savePrivacySettings() {
    try {
      wx.showLoading({ title: '保存中' });
      
      // 保存到本地存储
      wx.setStorageSync('privacySettings', this.data.privacySettings);
      
      // 调用API保存到服务器
      try {
        await updatePrivacySettings(this.data.privacySettings);
        
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        });
        
        // 返回上一页
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } catch (error) {
        console.error('保存隐私设置失败', error);
        wx.showToast({
          title: '已保存到本地，但同步到服务器失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('保存隐私设置失败', error);
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  }
});
