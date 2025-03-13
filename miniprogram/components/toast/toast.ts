// components/toast/toast.ts
Component({
  properties: {
    // 显示的消息
    message: {
      type: String,
      value: ''
    },
    // 类型（可选：success, error, warning, info）
    type: {
      type: String,
      value: 'info'
    },
    // 显示时长（毫秒）
    duration: {
      type: Number,
      value: 2000
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