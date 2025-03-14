// pages/medication/list.ts
import enhancedPage from '../../../utils/page-enhancer';

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

interface DatasetOption {
  id: number;
  active: boolean;
}

interface ErrorResponse {
  message?: string;
  non_field_errors?: string[];
}

// 使用页面增强器
enhancedPage({
  data: {
    loading: false,
    reminders: [] as MedicationReminder[]
  },

  onLoad() {
    this.loadReminders();
  },

  onShow() {
    this.loadReminders();
  },

  // 获取健康提醒列表
  loadReminders() {
    this.setData({ loading: true });
    
    const app = getApp();
    wx.request({
      url: `${app.globalData.baseURL}/api/medication/reminders/`,
      method: 'GET' as WechatMiniprogram.RequestOption['method'],
      header: {
        'Authorization': `Bearer ${app.globalData.token}`
      },
      success: (res: WechatMiniprogram.RequestSuccessCallbackResult) => {
        if (res.statusCode === 200) {
          // 确保times字段是字符串
          const reminders = (res.data as MedicationReminder[]).map(reminder => ({
            ...reminder,
            times: Array.isArray(reminder.times) ? reminder.times.join(',') : reminder.times
          }));
          
          this.setData({
            reminders,
            loading: false
          });

          // 如果列表为空，显示空状态
          if (reminders.length === 0) {
            this.showEmptyState({
              title: '暂无健康提醒',
              message: '点击右下角按钮添加健康提醒',
              icon: 'medicine-box',
              actionText: '添加健康提醒',
              onAction: this.navigateToAdd
            });
          } else {
            this.hideEmptyState();
          }
        } else {
          this.setData({ loading: false });
          this.showToast('获取数据失败', 'error');
        }
      },
      fail: () => {
        this.setData({ loading: false });
        this.showToast('网络错误', 'error');
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
  navigateToDetail(e: WechatMiniprogram.TouchEvent<DatasetOption>) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/medication/detail?id=${id}`
    });
  },

  // 启用/禁用提醒
  toggleReminder(e: WechatMiniprogram.TouchEvent<DatasetOption>) {
    const { id, active } = e.currentTarget.dataset;
    const newStatus = !active;
    
    console.log('开始切换提醒状态:', { id, currentStatus: active, newStatus });
    
    // 找到当前提醒的完整信息
    const currentReminder = this.data.reminders.find(item => item.id === id);
    if (!currentReminder) {
      console.error('找不到提醒信息:', { id, reminders: this.data.reminders });
      this.showToast('找不到提醒信息', 'error');
      return;
    }

    console.log('当前提醒信息:', currentReminder);

    // 验证times字段
    if (!currentReminder.times) {
      console.error('服药时间为空:', currentReminder);
      this.showToast('服药时间不能为空', 'error');
      return;
    }
    
    // 确保times是字符串且格式正确
    const times = Array.isArray(currentReminder.times) 
      ? currentReminder.times.join(',') 
      : currentReminder.times;
    
    console.log('处理后的times字段:', times);
    
    // 验证times格式
    const timePattern = /^([0-9]{2}:[0-9]{2},)*([0-9]{2}:[0-9]{2})$/;
    if (!timePattern.test(times)) {
      console.error('服药时间格式错误:', { times, pattern: timePattern.source });
      this.showToast('服药时间格式错误', 'error');
      return;
    }
    
    this.showLoading(newStatus ? '启用中...' : '禁用中...');
    
    const app = getApp();
    const requestData = {
      is_active: newStatus
    };

    const apiUrl = `${app.globalData.baseURL}/api/medication/reminders/${id}/`;
    console.log('发送更新请求:', {
      url: apiUrl,
      method: 'PATCH',
      data: requestData,
      headers: {
        'Authorization': `Bearer ${app.globalData.token}`,
        'Content-Type': 'application/json'
      }
    });

    wx.request({
      url: apiUrl,
      method: 'PATCH' as WechatMiniprogram.RequestOption['method'],
      header: {
        'Authorization': `Bearer ${app.globalData.token}`,
        'Content-Type': 'application/json'
      },
      data: requestData,
      success: (res: WechatMiniprogram.RequestSuccessCallbackResult) => {
        console.log('请求响应:', {
          statusCode: res.statusCode,
          data: res.data
        });
        
        this.hideLoading();
        if (res.statusCode === 200) {
          // 更新本地数据
          const reminders = this.data.reminders.map(item => {
            if (item.id === id) {
              return { ...item, is_active: newStatus };
            }
            return item;
          });
          
          this.setData({ reminders });
          console.log('本地数据更新成功');
          
          this.showToast(newStatus ? '提醒已启用' : '提醒已禁用', 'success');
        } else {
          console.error('更新提醒状态失败:', {
            statusCode: res.statusCode,
            response: res.data
          });
          const errorData = res.data as ErrorResponse;
          this.showToast(errorData?.message || errorData?.non_field_errors?.[0] || '操作失败', 'error');
        }
      },
      fail: (err) => {
        console.error('网络请求失败:', err);
        this.hideLoading();
        this.showToast('网络错误', 'error');
      }
    });
  }
}); 