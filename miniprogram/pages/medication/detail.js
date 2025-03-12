// detail.js
Page({
  data: {
    loading: true,
    error: false,
    errorMessage: '',
    reminderId: 0,
    reminder: {}
  },

  onLoad: function(options) {
    if (options.id) {
      this.setData({
        reminderId: parseInt(options.id)
      });
      this.loadReminderDetail();
    } else {
      this.setData({
        error: true,
        errorMessage: '未找到提醒ID',
        loading: false
      });
    }
  },

  // 加载提醒详情
  loadReminderDetail: function() {
    this.setData({
      loading: true,
      error: false
    });

    const globalApp = getApp();
    
    // 修复API URL路径问题
    const baseUrl = globalApp.globalData.apiBaseUrl || globalApp.globalData.baseURL;
    const apiUrl = baseUrl.endsWith('/api') || baseUrl.endsWith('/api/') 
      ? `${baseUrl}/medication/reminders/${this.data.reminderId}/`
      : `${baseUrl}/api/medication/reminders/${this.data.reminderId}/`;
      
    console.log('请求提醒详情:', apiUrl);
    
    wx.request({
      url: apiUrl,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${globalApp.globalData.token}`
      },
      success: (res) => {
        if (res.statusCode === 200) {
          this.setData({
            reminder: res.data,
            loading: false
          });
        } else {
          this.setData({
            error: true,
            errorMessage: res.data.message || '获取提醒详情失败',
            loading: false
          });
        }
      },
      fail: (err) => {
        console.error('请求提醒详情失败:', err);
        this.setData({
          error: true,
          errorMessage: '网络请求失败',
          loading: false
        });
      }
    });
  },

  // 切换提醒状态
  toggleReminder: function() {
    const reminder = this.data.reminder;
    const newStatus = !reminder.is_active;
    
    wx.showLoading({
      title: newStatus ? '正在启用...' : '正在停用...'
    });
    
    const globalApp = getApp();
    
    // 修复API URL路径问题
    const baseUrl = globalApp.globalData.apiBaseUrl || globalApp.globalData.baseURL;
    const apiUrl = baseUrl.endsWith('/api') || baseUrl.endsWith('/api/') 
      ? `${baseUrl}/medication/reminders/${this.data.reminderId}/`
      : `${baseUrl}/api/medication/reminders/${this.data.reminderId}/`;
      
    console.log('更新提醒状态:', apiUrl);
    
    wx.request({
      url: apiUrl,
      method: 'PUT',
      header: {
        'Authorization': `Bearer ${globalApp.globalData.token}`,
        'Content-Type': 'application/json'
      },
      data: {
        is_active: newStatus
      },
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode === 200) {
          this.setData({
            'reminder.is_active': newStatus
          });
          wx.showToast({
            title: newStatus ? '已启用提醒' : '已停用提醒',
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
          title: '网络请求失败',
          icon: 'none'
        });
      }
    });
  },

  // 编辑提醒
  editReminder: function() {
    wx.navigateTo({
      url: `/pages/medication/edit?id=${this.data.reminderId}`
    });
  },

  // 删除提醒
  deleteReminder: function() {
    wx.showModal({
      title: '删除提醒',
      content: '确定要删除这个药物提醒吗？此操作不可撤销。',
      confirmText: '删除',
      confirmColor: '#f44336',
      success: (res) => {
        if (res.confirm) {
          this.confirmDelete();
        }
      }
    });
  },

  // 确认删除
  confirmDelete: function() {
    wx.showLoading({
      title: '正在删除...'
    });
    
    const globalApp = getApp();
    
    // 修复API URL路径问题
    const baseUrl = globalApp.globalData.apiBaseUrl || globalApp.globalData.baseURL;
    const apiUrl = baseUrl.endsWith('/api') || baseUrl.endsWith('/api/') 
      ? `${baseUrl}/medication/reminders/${this.data.reminderId}/`
      : `${baseUrl}/api/medication/reminders/${this.data.reminderId}/`;
      
    console.log('删除提醒:', apiUrl);
    
    wx.request({
      url: apiUrl,
      method: 'DELETE',
      header: {
        'Authorization': `Bearer ${globalApp.globalData.token}`
      },
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode === 204) {
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
          // 返回上一页并刷新
          setTimeout(() => {
            const pages = getCurrentPages();
            const prevPage = pages[pages.length - 2];
            // 通知上一页刷新数据
            if (prevPage && prevPage.loadReminders) {
              prevPage.loadReminders();
            }
            wx.navigateBack();
          }, 1000);
        } else {
          wx.showToast({
            title: '删除失败',
            icon: 'none'
          });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        });
      }
    });
  }
}); 