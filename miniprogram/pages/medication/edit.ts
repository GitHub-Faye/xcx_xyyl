const globalApp = getApp<IAppOption>();

Page({
  data: {
    reminder: {} as any,
    frequencies: ['每天', '每周'],
    frequencyIndex: 0,
    weekdays: ['日', '一', '二', '三', '四', '五', '六'],
    selectedWeekdays: [false, false, false, false, false, false, false],
    times: [] as string[],
    endDate: '',
    today: new Date().toISOString().split('T')[0],
    reminderId: 0
  },

  onLoad(options: any) {
    if (options.id) {
      this.setData({ reminderId: parseInt(options.id) });
      this.loadReminderData();
    }
  },

  // 加载提醒数据
  loadReminderData() {
    wx.showLoading({ title: '加载中...' });
    
    const token = wx.getStorageSync('token');
    const apiUrl = `https://wyw123.pythonanywhere.com/api/medication/reminders/${this.data.reminderId}/`;

    wx.request({
      url: apiUrl,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res: any) => {
        if (res.statusCode === 200) {
          const reminder = res.data;
          this.setData({
            reminder,
            frequencyIndex: reminder.frequency === 'daily' ? 0 : 1,
            selectedWeekdays: reminder.weekdays.split('').map((day: string) => day === '1'),
            times: reminder.times,
            endDate: reminder.end_date
          });
        } else {
          wx.showToast({
            title: '加载失败',
            icon: 'none'
          });
        }
      },
      fail: () => {
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },

  // 频率选择改变
  onFrequencyChange(e: any) {
    this.setData({
      frequencyIndex: e.detail.value
    });
  },

  // 切换星期选择
  toggleWeekday(e: any) {
    const index = e.currentTarget.dataset.index;
    const selectedWeekdays = [...this.data.selectedWeekdays];
    selectedWeekdays[index] = !selectedWeekdays[index];
    this.setData({ selectedWeekdays });
  },

  // 时间选择改变
  onTimeChange(e: any) {
    const index = e.currentTarget.dataset.index;
    const times = [...this.data.times];
    times[index] = e.detail.value;
    this.setData({ times });
  },

  // 添加时间
  addTime() {
    if (this.data.times.length < 5) {
      const times = [...this.data.times, '12:00'];
      this.setData({ times });
    }
  },

  // 删除时间
  deleteTime(e: any) {
    const index = e.currentTarget.dataset.index;
    const times = this.data.times.filter((_, i) => i !== index);
    this.setData({ times });
  },

  // 结束日期改变
  onEndDateChange(e: any) {
    this.setData({
      endDate: e.detail.value
    });
  },

  // 表单验证
  validateForm() {
    if (!this.data.reminder.name) {
      wx.showToast({
        title: '请输入药物名称',
        icon: 'none'
      });
      return false;
    }

    if (this.data.frequencyIndex === 1 && 
        !this.data.selectedWeekdays.some(day => day)) {
      wx.showToast({
        title: '请选择至少一个星期',
        icon: 'none'
      });
      return false;
    }

    if (this.data.times.length === 0) {
      wx.showToast({
        title: '请添加提醒时间',
        icon: 'none'
      });
      return false;
    }

    return true;
  },

  // 保存提醒
  saveReminder(e: any) {
    const formData = e.detail.value;
    this.data.reminder.name = formData.name;
    this.data.reminder.description = formData.description;

    if (!this.validateForm()) {
      return;
    }

    wx.showLoading({ title: '保存中...' });

    const token = wx.getStorageSync('token');
    const baseUrl = globalApp.globalData.apiBaseUrl;
    const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
    const apiUrl = cleanBaseUrl.endsWith('/api') 
      ? `${cleanBaseUrl}/medication/reminders/${this.data.reminderId}/`
      : `${cleanBaseUrl}/api/medication/reminders/${this.data.reminderId}/`;

    const data = {
      name: this.data.reminder.name,
      description: this.data.reminder.description,
      frequency: this.data.frequencyIndex === 0 ? 'daily' : 'weekly',
      weekdays: this.data.selectedWeekdays.map(day => day ? '1' : '0').join(''),
      times: this.data.times,
      end_date: this.data.endDate
    };

    wx.request({
      url: apiUrl,
      method: 'PUT',
      header: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: data,
      success: (res: any) => {
        wx.hideLoading();
        if (res.statusCode === 200) {
          wx.showToast({
            title: '保存成功',
            icon: 'success'
          });
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        } else {
          wx.showToast({
            title: '保存失败',
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