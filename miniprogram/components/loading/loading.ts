// components/loading/loading.ts
Component({
  properties: {
    // 加载提示文本
    title: {
      type: String,
      value: '加载中...'
    }
  },

  data: {
    themeClass: 'theme-light'
  },

  lifetimes: {
    attached() {
      // 尝试获取主题模式
      const app = getApp();
      if (app.globalData && app.globalData.themeMode) {
        this.setData({
          themeClass: app.globalData.themeMode === 'dark' ? 'theme-dark' : 'theme-light'
        });
      }
      
      // 监听系统主题变化
      wx.onThemeChange((result) => {
        this.setData({
          themeClass: result.theme === 'dark' ? 'theme-dark' : 'theme-light'
        });
      });
    }
  }
}); 