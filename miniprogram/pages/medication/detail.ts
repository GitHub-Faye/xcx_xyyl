// 药物提醒详情
interface MedicationReminder {
  id: number;
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  weekdays?: string;
  month_days?: string;
  custom_interval?: number;
  times: string;  // 始终使用字符串类型，用逗号分隔的时间列表
  is_active: boolean;
  end_date?: string;
}

Page({
  data: {
    loading: true,
    error: false,
    errorMessage: '',
    reminderId: 0,
    reminder: {} as MedicationReminder
  },

  onLoad(options: any) {
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
  loadReminderDetail() {
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
      success: (res: any) => {
        if (res.statusCode === 200) {
          // 确保times字段是字符串
          const reminder = {
            ...res.data,
            times: Array.isArray(res.data.times) ? res.data.times.join(',') : res.data.times
          };
          
          this.setData({
            reminder,
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
      fail: (err: any) => {
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
  toggleReminder() {
    const reminder = this.data.reminder;
    const newStatus = !reminder.is_active;
    
    // 验证times字段
    if (!reminder.times) {
      wx.showToast({
        title: '服药时间不能为空',
        icon: 'none'
      });
      return;
    }
    
    // 确保times是字符串且格式正确
    const times = Array.isArray(reminder.times) 
      ? reminder.times.join(',') 
      : reminder.times;
    
    // 验证times格式
    const timePattern = /^([0-9]{2}:[0-9]{2},)*([0-9]{2}:[0-9]{2})$/;
    if (!timePattern.test(times)) {
      wx.showToast({
        title: '服药时间格式错误',
        icon: 'none'
      });
      return;
    }
    
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
      method: 'PATCH' as WechatMiniprogram.RequestOption['method'],
      header: {
        'Authorization': `Bearer ${globalApp.globalData.token}`,
        'Content-Type': 'application/json'
      },
      data: {
        is_active: newStatus,
        name: reminder.name,
        description: reminder.description,
        frequency: reminder.frequency,
        weekdays: reminder.weekdays,
        month_days: reminder.month_days,
        custom_interval: reminder.custom_interval,
        times: times,
        end_date: reminder.end_date
      },
      success: (res: any) => {
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
          console.error('更新提醒状态失败:', res.data);
          wx.showToast({
            title: res.data?.message || '操作失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('网络请求失败:', err);
        wx.hideLoading();
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        });
      }
    });
  },

  // 编辑提醒
  editReminder() {
    wx.navigateTo({
      url: `/pages/medication/edit?id=${this.data.reminderId}`
    });
  },

  // 删除提醒
  deleteReminder() {
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
  confirmDelete() {
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
      success: (res: any) => {
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