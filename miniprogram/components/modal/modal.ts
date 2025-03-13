// components/modal/modal.ts
Component({
  properties: {
    // 标题
    title: {
      type: String,
      value: '提示'
    },
    // 内容
    content: {
      type: String,
      value: ''
    },
    // 是否显示取消按钮
    showCancel: {
      type: Boolean,
      value: true
    },
    // 取消按钮文本
    cancelText: {
      type: String,
      value: '取消'
    },
    // 确认按钮文本
    confirmText: {
      type: String,
      value: '确定'
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
    // 处理按钮点击
    handleAction(e: any) {
      const action = e.currentTarget.dataset.action;
      this.triggerEvent('action', { action });
    }
  }
}); 