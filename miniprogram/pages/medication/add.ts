// pages/medication/add.ts
Page({
  data: {
    // 健康提醒表单数据
    medicationForm: {
      name: '',
      description: '',
      frequency: 'daily', // 默认每天
      weekdays: [], // 每周选择的日期 [1,3,5]表示周一、三、五
      month_days: [], // 每月选择的日期 [1,15]表示每月1日和15日
      custom_interval: 1, // 自定义间隔天数
      times: ['08:00'], // 服药时间
      end_date: null, // 结束日期，null表示无结束日期
    },
    // 界面辅助数据
    frequencyOptions: [
      { value: 'daily', label: '每天' },
      { value: 'weekly', label: '每周' },
      { value: 'monthly', label: '每月' },
      { value: 'custom', label: '自定义' },
    ],
    frequencyIndex: 0, // 添加频率索引
    weekdayOptions: [
      { value: 1, label: '周一' },
      { value: 2, label: '周二' },
      { value: 3, label: '周三' },
      { value: 4, label: '周四' },
      { value: 5, label: '周五' },
      { value: 6, label: '周六' },
      { value: 7, label: '周日' },
    ],
    monthDayOptions: [] as Array<{value: number, label: string}>,
    today: new Date().toISOString().split('T')[0]
  },

  onLoad() {
    // 初始化月份天数选项
    const monthDays = Array.from({length: 31}, (_, i) => ({
      value: i + 1,
      label: `${i + 1}日`
    }));
    this.setData({
      monthDayOptions: monthDays,
      frequencyIndex: this.getFrequencyIndex(this.data.medicationForm.frequency)
    });
  },

  // 计算频率索引
  getFrequencyIndex(frequency: string): number {
    switch (frequency) {
      case 'daily': return 0;
      case 'weekly': return 1;
      case 'monthly': return 2;
      case 'custom': return 3;
      default: return 0;
    }
  },

  // 输入框事件处理
  onNameInput(e: any) {
    this.setData({
      'medicationForm.name': e.detail.value
    });
  },

  onDescriptionInput(e: any) {
    this.setData({
      'medicationForm.description': e.detail.value
    });
  },

  // 频率切换
  onFrequencyChange(e: any) {
    const index = e.detail.value;
    const frequency = this.data.frequencyOptions[index].value;
    this.setData({
      'medicationForm.frequency': frequency,
      frequencyIndex: index
    });
  },

  // 星期几选择 (多选)
  onWeekdayChange(e: any) {
    this.setData({
      'medicationForm.weekdays': e.detail.value
    });
  },

  // 每月日期选择 (多选)
  onMonthDayChange(e: any) {
    this.setData({
      'medicationForm.month_days': e.detail.value
    });
  },

  // 自定义间隔天数
  onIntervalChange(e: any) {
    this.setData({
      'medicationForm.custom_interval': Number(e.detail.value)
    });
  },

  // 添加服药时间
  addMedicationTime() {
    const times = this.data.medicationForm.times;
    times.push('12:00');
    this.setData({
      'medicationForm.times': times
    });
  },

  // 修改服药时间
  onTimeChange(e: any) {
    const { index } = e.currentTarget.dataset;
    const times = this.data.medicationForm.times;
    times[index] = e.detail.value;
    this.setData({
      'medicationForm.times': times
    });
  },

  // 删除服药时间
  removeTime(e: any) {
    const { index } = e.currentTarget.dataset;
    const times = this.data.medicationForm.times;
    times.splice(index, 1);
    this.setData({
      'medicationForm.times': times
    });
  },

  // 结束日期选择
  onEndDateChange(e: any) {
    this.setData({
      'medicationForm.end_date': e.detail.value || null
    });
  },

  // 提交表单
  saveReminder() {
    // 先请求订阅消息授权
    this.submitMedicationForm();
  },

  // 提交表单的逻辑
  submitMedicationForm() {
    const form = this.data.medicationForm;
    
    // 表单验证
    if (!form.name) {
      wx.showToast({
        title: '请输入药物名称',
        icon: 'none'
      });
      return;
    }

    // 根据频率验证数据
    if (form.frequency === 'weekly' && form.weekdays.length === 0) {
      wx.showToast({
        title: '请选择每周服药日',
        icon: 'none'
      });
      return;
    }

    if (form.frequency === 'monthly' && form.month_days.length === 0) {
      wx.showToast({
        title: '请选择每月服药日',
        icon: 'none'
      });
      return;
    }

    // 调用API保存数据
    wx.showLoading({
      title: '保存中...'
    });

    const token = wx.getStorageSync('token');
    const apiUrl = 'https://wyw123.pythonanywhere.com/api/medication/reminders/';
    console.log('提交表单到API:', apiUrl);
    
    wx.request({
      url: apiUrl,
      method: 'POST',
      header: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: {
        name: form.name,
        description: form.description,
        frequency: form.frequency,
        weekdays: form.frequency === 'weekly' ? form.weekdays.join(',') : '',
        month_days: form.frequency === 'monthly' ? form.month_days.join(',') : '',
        custom_interval: form.frequency === 'custom' ? form.custom_interval : null,
        times: form.times.join(','),
        end_date: form.end_date
      },
      success: (res: any) => {
        wx.hideLoading();
        if (res.statusCode === 201) {
          wx.showToast({
            title: '健康提醒已保存',
            icon: 'success'
          });
          
          // 返回到列表页
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        } else {
          wx.showToast({
            title: '保存失败，请重试',
            icon: 'none'
          });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
      }
    });
  }
}); 