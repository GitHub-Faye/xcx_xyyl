// app.ts
App<IAppOption>({
  globalData: {
    baseURL: 'https://wyw123.pythonanywhere.com/api',
    token: '',
    userInfo: null,
    systemInfo: null,
    // 组件注入相关配置
    injectComponents: true,
    themeMode: 'light',
    // 添加匿名模式标志
    isAnonymousMode: true,
    // 临时存储数据
    temporaryData: {}
  },

  onLaunch() {
    // 检查更新
    this.checkUpdate();
    
    // 获取系统信息
    const systemInfo = wx.getSystemInfoSync();
    this.globalData.systemInfo = systemInfo;
    
    // 设置基础库版本检查
    if (this.compareVersion(systemInfo.SDKVersion, '2.16.0') < 0) {
      wx.showModal({
        title: '提示',
        content: '当前微信版本过低，部分功能可能无法使用。请升级微信版本后重试。',
        showCancel: false
      });
    }

    // 初始化组件注入
    this.initComponentInjection();
    
    // 清理旧的提醒数据
    this.cleanupReminderData();

    // 从本地缓存获取用户令牌但不强制登录
    const token = wx.getStorageSync('token');
    if (token) {
      this.globalData.token = token;
      // 静默检查登录状态，不影响用户体验
      this.silentCheckLoginStatus();
    } else {
      console.log('本地无token，启用匿名模式');
      this.globalData.isAnonymousMode = true;
    }
  },
  
  // 清理所有提醒相关的本地存储数据
  cleanupReminderData() {
    try {
      console.log('清理本地提醒数据...');
      const reminderStorageKeys = [
        'local_health_reminders',
        'temp_medication_reminders',
        'unified_health_reminders'
      ];
      
      reminderStorageKeys.forEach(key => {
        try {
          if (wx.getStorageSync(key)) {
            wx.removeStorageSync(key);
            console.log(`已清理本地存储: ${key}`);
          }
        } catch (err) {
          console.error(`清理本地存储 ${key} 时出错:`, err);
        }
      });
      
      console.log('本地提醒数据清理完成');
    } catch (error) {
      console.error('清理本地提醒数据失败:', error);
    }
  },
  
  // 新增：静默检查登录状态，不跳转
  async silentCheckLoginStatus() {
    try {
      const token = wx.getStorageSync('token');
      if (!token) {
        this.globalData.isAnonymousMode = true;
        return;
      }
      
      // 使用token，但不强制跳转
      this.globalData.token = token;
      console.log('发现本地token，检查有效性');
      
      // 执行登录检查，但不强制跳转
      checkLoginStatus().then(isLoggedIn => {
        console.log('登录状态检查结果：', isLoggedIn ? '已登录' : '未登录');
        this.globalData.isAnonymousMode = !isLoggedIn;
        
        if (isLoggedIn) {
          // 更新全局状态但不跳转
          this.getUserInfo();
        }
      }).catch(err => {
        console.error('登录检查失败:', err);
        this.globalData.isAnonymousMode = true;
      });
    } catch (error) {
      console.error('静默检查登录状态出错', error);
      this.globalData.isAnonymousMode = true;
    }
  },
  
  // 初始化组件注入功能
  initComponentInjection() {
    if (wx.canIUse('styleIsolation') && wx.canIUse('componentPlaceholder')) {
      console.log('组件注入功能已启用');
      this.globalData.injectComponents = true;
    } else {
      console.log('当前环境不支持组件注入功能');
      this.globalData.injectComponents = false;
    }

    // 监听系统主题变化
    wx.onThemeChange((result) => {
      this.globalData.themeMode = result.theme;
      console.log('系统主题已切换为:', result.theme);
    });
  },
  
  // 检查小程序更新
  checkUpdate() {
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager();
      
      updateManager.onCheckForUpdate((res) => {
        if (res.hasUpdate) {
          console.log('有新版本可用');
        }
      });
      
      updateManager.onUpdateReady(() => {
        wx.showModal({
          title: '更新提示',
          content: '新版本已经准备好，是否重启应用？',
          success: (res) => {
            if (res.confirm) {
              updateManager.applyUpdate();
            }
          }
        });
      });
      
      updateManager.onUpdateFailed(() => {
        wx.showModal({
          title: '更新提示',
          content: '新版本下载失败，请检查网络后重试',
          showCancel: false
        });
      });
    }
  },
  
  // 版本比较
  compareVersion(v1: string, v2: string): number {
    const v1Parts = v1.split('.').map(Number);
    const v2Parts = v2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;
      
      if (v1Part > v2Part) {
        return 1;
      }
      
      if (v1Part < v2Part) {
        return -1;
      }
    }
    
    return 0;
  },
  
  // 修改：不再强制跳转到登录页
  checkLoginStatusAndRedirect() {
    // 移除强制跳转逻辑，允许未登录状态下使用
    this.silentCheckLoginStatus();
  },
  
  // 重定向到登录页
  redirectToLogin() {
    // 修改为不再强制跳转到登录页
    console.log('登录验证失败，但不强制跳转');
    this.globalData.isAnonymousMode = true;
  },
  
  // 新增：当用户触发需要登录的功能时调用
  showLoginTips(requiredFeature: string): Promise<boolean> {
    return new Promise((resolve) => {
      wx.showModal({
        title: '需要登录',
        content: `"${requiredFeature}"功能需要登录后才能使用，是否现在登录？`,
        confirmText: '去登录',
        cancelText: '暂不登录',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/auth/auth',
              success: () => {
                // 传递回调信息，以便登录成功后返回当前页面
                const currentPages = getCurrentPages();
                const currentPage = currentPages[currentPages.length - 1];
                const currentRoute = currentPage.route;
                wx.setStorageSync('loginCallbackPage', currentRoute);
              }
            });
            resolve(true);
          } else {
            resolve(false);
          }
        }
      });
    });
  },
  
  // 设置API基础URL，根据环境调整
  setApiBaseUrl() {
    // 直接使用线上环境
    const apiBaseUrl = 'https://wyw123.pythonanywhere.com/api';
    this.globalData.baseURL = apiBaseUrl;
    console.log('使用线上API基础URL:', apiBaseUrl);
  }
}); 