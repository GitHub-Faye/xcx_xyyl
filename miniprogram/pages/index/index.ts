// index.ts
// 获取应用实例
const app = getApp<IAppOption>()

Component({
  data: {
    loading: true,      // 加载状态
    error: false,       // 错误状态
    errorMessage: '',   // 错误信息
    userInfo: null,     // 用户信息
    hasToken: false     // 是否有token
  },
  
  lifetimes: {
    attached() {
      // 在组件实例进入页面节点树时执行
      console.log('首页组件attached');
      
      // 检查是否有token
      const token = wx.getStorageSync('token');
      this.setData({
        hasToken: !!token
      });
      
      this.checkLoginStatus();
    },
    
    ready() {
      // 在组件在视图层布局完成后执行
      console.log('首页组件ready');
    }
  },
  
  pageLifetimes: {
    show() {
      // 页面被展示时执行
      console.log('首页show');
      this.checkLoginStatus();
      
      // 如果已加载过数据并且没有错误，不重新加载
      if (!this.data.loading && !this.data.error) {
        console.log('页面已加载，无需重新获取数据');
        return;
      }
      
      this.loadInitialData();
    }
  },
  
  methods: {
    // 检查登录状态
    checkLoginStatus() {
      const token = wx.getStorageSync('token');
      console.log('首页检查登录状态，当前token:', token ? '有token' : '无token');
      
      this.setData({
        hasToken: !!token
      });
      
      if (!token) {
        console.log('用户未登录，跳转到登录页');
        wx.redirectTo({
          url: '/pages/auth/auth'
        });
      } else {
        // 使用全局登录检查方法
        app.checkLoginStatusAndRedirect();
      }
    },
    
    // 加载初始数据
    async loadInitialData() {
      try {
        const token = wx.getStorageSync('token');
        if (!token) {
          console.log('无token，跳过加载首页数据');
          return;
        }
        
        this.setData({
          loading: true,
          error: false,
          errorMessage: ''
        });
        
        console.log('开始加载首页数据');
        
        // 获取用户信息
        const userInfo = wx.getStorageSync('userInfo');
        if (userInfo) {
          this.setData({
            userInfo: userInfo
          });
          console.log('从缓存读取到用户信息');
        } else {
          console.log('缓存中无用户信息，尝试从服务器获取');
          try {
            // 这里调用app.getUserInfo()但不判断其返回值，避免类型错误
            await app.getUserInfo();
            
            // 获取调用后缓存中的用户信息
            const updatedUserInfo = wx.getStorageSync('userInfo');
            if (updatedUserInfo) {
              this.setData({
                userInfo: updatedUserInfo
              });
              console.log('成功获取用户信息');
            }
          } catch (err) {
            console.error('获取用户信息失败:', err);
          }
        }
                
        // 延迟设置loading状态以避免闪烁
        setTimeout(() => {
          this.setData({
            loading: false
          });
          console.log('首页数据加载完成');
        }, 300);
      } catch (error: any) {
        console.error('加载首页数据失败:', error);
        
        this.setData({
          loading: false,
          error: true,
          errorMessage: error.message || '数据加载失败，请重试'
        });
      }
    },
    
    // 重试加载数据
    retry() {
      console.log('用户点击重试按钮');
      this.loadInitialData();
    }
  },
})
