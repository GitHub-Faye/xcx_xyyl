// app.ts
App<IAppOption>({
  globalData: {
    baseURL: 'http://localhost:8000',
    token: '',
    userInfo: null,
    systemInfo: null,
    // 组件注入相关配置
    injectComponents: true,
    themeMode: 'light'
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

    // 从本地缓存获取用户令牌
    const token = wx.getStorageSync('token');
    if (token) {
      this.globalData.token = token;
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
  }
}); 