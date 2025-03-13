Component({
  properties: {
    // 图标类型
    icon: {
      type: String,
      value: ''
    },
    // 空状态标题
    title: {
      type: String,
      value: '暂无数据'
    },
    // 空状态描述信息
    message: {
      type: String,
      value: ''
    },
    // 操作按钮文本
    actionText: {
      type: String,
      value: ''
    },
    // 类型（可选：info, warning, error）
    type: {
      type: String,
      value: 'info'
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
  },

  methods: {
    onAction() {
      // 触发操作事件
      this.triggerEvent('action');
    }
  }
}); 