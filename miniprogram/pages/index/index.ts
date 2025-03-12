// index.ts
// 获取应用实例
// 使用declare让TypeScript知道这是一个声明而不是定义
// 如果已经在其他地方定义了app变量，这里只是声明它的类型
const globalApp = getApp<IAppOption>();

interface MedicationReminder {
  id: number;
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  weekdays?: string;
  month_days?: string;
  custom_interval?: number;
  times: string;
  is_active: boolean;
}

Page({
  data: {
    reminders: [] as MedicationReminder[],  // 指定类型为MedicationReminder数组
    loading: true,       // 加载状态
    error: false,        // 错误状态
    errorMessage: '',    // 错误信息
    userInfo: null,      // 用户信息
    hasToken: false      // 是否有token
  },

  onLoad() {
    console.log('首页onLoad');
    // 检查是否有token
    const token = wx.getStorageSync('token');
    this.setData({
      hasToken: !!token
    });
    
    this.checkLoginStatus();
  },

  onShow() {
    console.log('首页onShow');
    this.checkLoginStatus();
    
    if (this.data.hasToken) {
      this.loadReminders();
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    console.log('触发下拉刷新');
    if (this.data.hasToken) {
      this.loadReminders();
    }
    wx.stopPullDownRefresh();
  },

  // 检查登录状态
  checkLoginStatus() {
    const token = wx.getStorageSync('token');
    console.log('首页检查登录状态，当前token:', token ? '有token' : '无token');
    
    this.setData({
      hasToken: !!token
    });
    
    if (!token) {
      console.log('用户未登录，跳转到登录页');
      // 使用app的全局跳转方法，保持一致性
      globalApp.redirectToLogin();
    } else {
      // 使用全局登录检查方法
      globalApp.checkLoginStatusAndRedirect();
    }
  },
  
  // 加载药物提醒列表数据
  loadReminders() {
    this.setData({ loading: true });
    
    const token = wx.getStorageSync('token');
    if (!token) {
      console.log('无token，跳过加载药物提醒数据');
      return;
    }
    
    // 检查apiBaseUrl是否已经包含了/api前缀
    const baseUrl = globalApp.globalData.apiBaseUrl;
    // 移除末尾的斜杠，避免双斜杠
    const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
    const apiUrl = cleanBaseUrl.endsWith('/api') 
      ? `${cleanBaseUrl}/medication/reminders/`
      : `${cleanBaseUrl}/api/medication/reminders/`;
      
    console.log('请求药物提醒API：', apiUrl);
    
    wx.request({
      url: apiUrl,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res: any) => {
        console.log('获取药物提醒列表响应:', res);
        if (res.statusCode === 200 && res.data && Array.isArray(res.data.results)) {
          console.log('成功获取药物提醒列表:', res.data.results);
          this.setData({
            reminders: res.data.results as MedicationReminder[],  // 只取results数组
            loading: false,
            error: false
          });
        } else {
          console.error('获取药物提醒列表失败:', res);
          this.setData({ 
            loading: false,
            error: true,
            errorMessage: '获取数据失败，请重试'
          });
          wx.showToast({
            title: '获取数据失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('请求药物提醒列表失败:', err);
        this.setData({ 
          loading: false,
          error: true,
          errorMessage: '网络错误，请重试'
        });
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        });
      }
    });
  },
  
  // 跳转到添加页面
  navigateToAdd() {
    console.log('点击了添加按钮，准备导航到添加页面');
    
    // 检查页面是否存在
    const pages = getCurrentPages();
    console.log('当前页面栈:', pages);
    
    wx.navigateTo({
      url: '/pages/medication/add',
      success: () => {
        console.log('成功导航到添加页面');
      },
      fail: (err) => {
        console.error('导航到添加页面失败:', err);
        
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        });
      }
    });
  },

  // 跳转到详情页面
  navigateToDetail(e: any) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/medication/detail?id=${id}`
    });
  },

  // 跳转到编辑页面
  navigateToEdit(e: any) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/medication/edit?id=${id}`
    });
  },

  // 删除提醒
  deleteReminder(e: any) {
    const id = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '删除提醒',
      content: '确定要删除这个药物提醒吗？此操作不可撤销。',
      confirmText: '删除',
      confirmColor: '#f56c6c',
      success: (res) => {
        if (res.confirm) {
          this.confirmDelete(id);
        }
      }
    });
  },

  // 确认删除
  confirmDelete(id: number) {
    wx.showLoading({
      title: '正在删除...'
    });
    
    const token = wx.getStorageSync('token');
    
    // 构建正确的API URL，避免路径重复
    const baseUrl = globalApp.globalData.apiBaseUrl;
    // 移除末尾的斜杠，避免双斜杠
    const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
    const apiUrl = cleanBaseUrl.endsWith('/api') 
      ? `${cleanBaseUrl}/medication/reminders/${id}/`
      : `${cleanBaseUrl}/api/medication/reminders/${id}/`;
      
    wx.request({
      url: apiUrl,
      method: 'DELETE',
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res: any) => {
        wx.hideLoading();
        if (res.statusCode === 204) {
          // 从列表中移除已删除的提醒
          const reminders = this.data.reminders.filter(
            (item: MedicationReminder) => item.id !== id
          );
          
          this.setData({ reminders });
          
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
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
          title: '网络错误',
          icon: 'none'
        });
      }
    });
  },

  // 启用/禁用提醒
  toggleReminder(e: any) {
    const { id, active } = e.currentTarget.dataset;
    const newStatus = !active;
    
    wx.showLoading({
      title: newStatus ? '启用中...' : '禁用中...'
    });
    
    const token = wx.getStorageSync('token');
    
    // 构建正确的API URL，避免路径重复
    const baseUrl = globalApp.globalData.apiBaseUrl;
    // 移除末尾的斜杠，避免双斜杠
    const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
    const apiUrl = cleanBaseUrl.endsWith('/api') 
      ? `${cleanBaseUrl}/medication/reminders/${id}/`
      : `${cleanBaseUrl}/api/medication/reminders/${id}/`;
      
    wx.request({
      url: apiUrl,
      method: 'PATCH' as 'PUT',  // 类型转换以解决类型错误
      header: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: {
        is_active: newStatus
      },
      success: (res: any) => {
        wx.hideLoading();
        if (res.statusCode === 200) {
          // 更新本地数据
          const reminders = this.data.reminders.map((item: MedicationReminder) => {
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
  },
  
  // 重试加载数据
  retry() {
    console.log('用户点击重试按钮');
    this.loadReminders();
  }
});
