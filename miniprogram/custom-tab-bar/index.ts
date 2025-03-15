Component({
  data: {
    active: 0
  },
  lifetimes: {
    attached() {
      console.log('[TabBar] 组件已挂载');
      this.setActive();
    }
  },
  pageLifetimes: {
    show() {
      console.log('[TabBar] 页面显示，重新计算激活状态');
      this.setActive();
    }
  },
  methods: {
    setActive() {
      const pages = getCurrentPages();
      if (!pages || pages.length === 0) {
        console.log('[TabBar] 没有可用页面');
        return;
      }
      
      const currentPage = pages[pages.length - 1];
      const url = `/${currentPage.route}`;
      
      console.log('[TabBar] 当前页面路径:', url);
      console.log('[TabBar] 当前激活状态(更新前):', this.data.active);
      
      // 用于激活状态的标记，初始为-1表示未设置
      let newActive = -1;
      
      // 健康记录页面
      if (url.includes('health-records/list')) {
        newActive = 0;
        console.log('[TabBar] 匹配到健康记录页面，设置active=0');
      } 
      // 数据统计页面
      else if (url.includes('statistics/statistics')) {
        newActive = 1;
        console.log('[TabBar] 匹配到数据统计页面，设置active=1');
      } 
      else {
        console.log('[TabBar] 未匹配到任何已知页面，保持当前激活状态');
      }
      
      // 只有在激活状态有变化时才更新
      if (newActive !== -1 && newActive !== this.data.active) {
        console.log('[TabBar] 更新激活状态:', newActive);
        this.setData({ active: newActive });
      }
    },
    
    switchTab(e: any) {
      const index = e.currentTarget.dataset.index;
      const path = e.currentTarget.dataset.path;
      
      console.log('[TabBar] 点击选项卡:', index, '路径:', path);
      
      if (this.data.active === index) {
        console.log('[TabBar] 已经是当前选项卡，不进行跳转');
        return;
      }
      
      console.log('[TabBar] 准备跳转到页面:', path);
      wx.switchTab({
        url: path,
        success: () => console.log('[TabBar] 跳转成功'),
        fail: (err) => console.error('[TabBar] 跳转失败:', err)
      });
    }
  }
}); 