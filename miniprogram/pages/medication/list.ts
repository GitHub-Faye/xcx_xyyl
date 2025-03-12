// pages/medication/list.ts
Page({
  data: {
    reminders: [],
    loading: true
  },

  onLoad() {
    this.loadReminders();
  },

  onShow() {
    this.loadReminders();
  },

  // 获取药物提醒列表
  loadReminders() {
    this.setData({ loading: true });
    
    const app = getApp();
    wx.request({
      url: `${app.globalData.baseURL}/api/medication/reminders/`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${app.globalData.token}`
      },
      success: (res) => {
        if (res.statusCode === 200) {
          this.setData({
            reminders: res.data,
            loading: false
          });
        } else {
          this.setData({ loading: false });
          wx.showToast({
            title: '获取数据失败',
            icon: 'none'
          });
        }
      },
      fail: () => {
        this.setData({ loading: false });
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        });
      }
    });
  },

  // 跳转到添加页面
  navigateToAdd() {
    wx.navigateTo({
      url: '/pages/medication/add'
    });
  },

  // 跳转到详情页面
  navigateToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/medication/detail?id=${id}`
    });
  },

  // 启用/禁用提醒
  toggleReminder(e) {
    const { id, active } = e.currentTarget.dataset;
    const newStatus = !active;
    
    wx.showLoading({
      title: newStatus ? '启用中...' : '禁用中...'
    });
    
    const app = getApp();
    wx.request({
      url: `${app.globalData.baseURL}/api/medication/reminders/${id}/`,
      method: 'PATCH',
      header: {
        'Authorization': `Bearer ${app.globalData.token}`,
        'Content-Type': 'application/json'
      },
      data: {
        is_active: newStatus
      },
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode === 200) {
          // 更新本地数据
          const reminders = this.data.reminders.map(item => {
            if (item.id === id) {
              return { ...item, is_active: newStatus };
            }
            return item;
          });
          
          this.setData({ reminders });
          
          wx.showToast({
            title: newStatus ? '提醒已启用' : '提醒已禁用',
            icon: 'success'
          });
        } else {
          wx.showToast({
            title: '操作失败',
            icon: 'none'
          });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        });
      }
    });
  }
}); 