import { updateNotificationSettings, getNotificationSettings } from '../../../../services/user';

// 通知设置接口
interface NotificationSettings {
  healthReminders: boolean;
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

Page({
  data: {
    notificationSettings: {
      healthReminders: true,
      abnormalDataAlerts: true,
      healthReports: true,
      newsAndActivities: false,
      inAppNotifications: true,
      wechatServiceNotifications: true,
      smsNotifications: false,
      doNotDisturb: false,
      doNotDisturbStart: '22:00',
      doNotDisturbEnd: '08:00'
    } as NotificationSettings
  },

  onLoad() {
    this.loadNotificationSettings();
  },

  onShow() {
    // 页面显示时刷新数据
    this.loadNotificationSettings();
  },

  async loadNotificationSettings() {
    try {
      wx.showLoading({ title: '加载中' });
      
      // 从本地存储获取通知设置
      const storedSettings = wx.getStorageSync('notificationSettings');
      
      if (storedSettings) {
        this.setData({
          notificationSettings: storedSettings
        });
      } else {
        // 尝试从服务器获取通知设置
        try {
          const settings = await getNotificationSettings();
          if (settings) {
            this.setData({
              notificationSettings: settings
            });
            
            // 存储到本地
            wx.setStorageSync('notificationSettings', settings);
          }
        } catch (error) {
          console.error('获取通知设置失败', error);
          // 使用默认设置
        }
      }
    } catch (error) {
      console.error('加载通知设置失败', error);
      wx.showToast({
        title: '加载通知设置失败',
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
      [`notificationSettings.${field}`]: value
    });
    
    // 如果关闭免打扰，隐藏时间选择器
    if (field === 'doNotDisturb' && !value) {
      // 不需要额外操作，视图会根据 doNotDisturb 的值自动更新
    }
  },

  onTimeChange(e: any) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    
    this.setData({
      [`notificationSettings.${field}`]: value
    });
  },

  async saveNotificationSettings() {
    try {
      wx.showLoading({ title: '保存中' });
      
      // 保存到本地存储
      wx.setStorageSync('notificationSettings', this.data.notificationSettings);
      
      // 调用API保存到服务器
      try {
        await updateNotificationSettings(this.data.notificationSettings);
        
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        });
        
        // 返回上一页
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } catch (error) {
        console.error('保存通知设置失败', error);
        wx.showToast({
          title: '已保存到本地，但同步到服务器失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('保存通知设置失败', error);
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  }
});
