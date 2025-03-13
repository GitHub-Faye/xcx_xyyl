// @ts-ignore
Component({
  data: {
    active: 0
  },
  lifetimes: {
    attached() {
      this.setActive();
    }
  },
  pageLifetimes: {
    show() {
      this.setActive();
    }
  },
  methods: {
    setActive() {
      // @ts-ignore
      const pages = getCurrentPages();
      if (!pages || pages.length === 0) return;
      
      const currentPage = pages[pages.length - 1];
      const url = `/${currentPage.route}`;
      
      let active = 0;
      if (url.indexOf('/pages/index/index') !== -1) {
        active = 0;
      } else if (url.indexOf('/pages/health-records/list') !== -1) {
        active = 1;
      } else if (url.indexOf('/pages/health-statistics/index') !== -1) {
        active = 2;
      } else if (url.indexOf('/pages/user/profile') !== -1) {
        active = 3;
      }
      
      this.setData({ active });
    },
    
    switchTab(e: any) {
      const index = e.currentTarget.dataset.index;
      const path = e.currentTarget.dataset.path;
      
      if (this.data.active === index) return;
      
      // @ts-ignore
      wx.switchTab({
        url: path
      });
    }
  }
}); 