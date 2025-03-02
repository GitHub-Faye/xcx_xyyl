// 用户协议与隐私政策页面逻辑
Page({
  data: {
    // 当前选中的选项卡
    activeTab: 'terms'
  },

  onLoad() {
    // 页面加载时的逻辑
  },

  // 切换选项卡
  switchTab(e: WechatMiniprogram.TouchEvent) {
    const tab = e.currentTarget.dataset.tab as string;
    this.setData({
      activeTab: tab
    });
  }
});
