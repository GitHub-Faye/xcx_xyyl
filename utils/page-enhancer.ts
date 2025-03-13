/**
 * 页面增强器
 * 使用微信官方的用时注入机制为所有页面提供统一的组件注入能力
 * 官方文档：https://developers.weixin.qq.com/miniprogram/dev/framework/ability/lazyload.html
 */
import componentInjection from './component-injection';

interface PageOptions {
  data?: Record<string, any>;
  onLoad?: (options?: Record<string, any>) => void;
  onShow?: () => void;
  onHide?: () => void;
  onUnload?: () => void;
  onPullDownRefresh?: () => void;
  onReachBottom?: () => void;
  onShareAppMessage?: () => object;
  onShareTimeline?: () => object;
  onAddToFavorites?: () => object;
  onTabItemTap?: (item: any) => void;
  [key: string]: any;
}

/**
 * 增强Page对象，添加组件注入功能
 * @param pageOptions 页面配置选项
 */
export default function enhancedPage(pageOptions: PageOptions): void {
  // 处理默认数据
  if (!pageOptions.data) {
    pageOptions.data = {};
  }
  
  // 注入主题相关数据和组件占位数据
  pageOptions.data.themeVars = 'theme-light';
  pageOptions.data.$toast = null;
  pageOptions.data.$modal = null;
  pageOptions.data.$loading = null;
  pageOptions.data.$emptyState = null;
  
  // 保存原始的生命周期函数
  const originalOnLoad = pageOptions.onLoad;
  const originalOnShow = pageOptions.onShow;
  const originalOnHide = pageOptions.onHide;
  const originalOnUnload = pageOptions.onUnload;
  
  // 增强onLoad生命周期
  pageOptions.onLoad = function(options?: Record<string, any>) {
    console.log('页面加载: 用时注入增强已启用');
    
    // 设置主题样式
    componentInjection.injectThemeStyles(this);
    
    // 调用原始onLoad
    if (originalOnLoad) {
      originalOnLoad.call(this, options);
    }
  };
  
  // 增强onShow生命周期
  pageOptions.onShow = function() {
    // 调用原始onShow
    if (originalOnShow) {
      originalOnShow.call(this);
    }
  };
  
  // 增强onHide生命周期
  pageOptions.onHide = function() {
    // 调用原始onHide
    if (originalOnHide) {
      originalOnHide.call(this);
    }
  };
  
  // 增强onUnload生命周期
  pageOptions.onUnload = function() {
    // 清理组件数据
    componentInjection.removeComponentData(this, 'toast');
    componentInjection.removeComponentData(this, 'modal');
    componentInjection.removeComponentData(this, 'loading');
    componentInjection.removeComponentData(this, 'emptyState');
    
    // 调用原始onUnload
    if (originalOnUnload) {
      originalOnUnload.call(this);
    }
  };
  
  // 添加工具方法
  
  // 显示Toast提示
  pageOptions.showToast = function(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', duration: number = 2000) {
    const toastConfig = {
      type,
      message,
      duration
    };
    
    componentInjection.prepareComponent(this, 'toast', toastConfig);
    
    // 自动关闭
    setTimeout(() => {
      componentInjection.removeComponentData(this, 'toast');
    }, duration);
  };
  
  // 显示Modal对话框
  pageOptions.showModal = function(options: {
    title: string;
    content: string;
    showCancel?: boolean;
    cancelText?: string;
    confirmText?: string;
    success?: (result: { confirm: boolean, cancel: boolean }) => void;
  }) {
    const modalConfig = {
      title: options.title,
      content: options.content,
      showCancel: options.showCancel !== false,
      cancelText: options.cancelText || '取消',
      confirmText: options.confirmText || '确定'
    };
    
    // 保存回调函数
    this._modalCallback = options.success;
    
    componentInjection.prepareComponent(this, 'modal', modalConfig);
  };
  
  // Modal回调处理
  pageOptions.handleModalAction = function(e: any) {
    const action = e.currentTarget.dataset.action;
    
    if (this._modalCallback) {
      if (action === 'confirm') {
        this._modalCallback({ confirm: true, cancel: false });
      } else {
        this._modalCallback({ confirm: false, cancel: true });
      }
    }
    
    componentInjection.removeComponentData(this, 'modal');
  };
  
  // 显示Loading
  pageOptions.showLoading = function(title: string = '加载中...') {
    const loadingConfig = {
      title
    };
    
    componentInjection.prepareComponent(this, 'loading', loadingConfig);
  };
  
  // 隐藏Loading
  pageOptions.hideLoading = function() {
    componentInjection.removeComponentData(this, 'loading');
  };
  
  // 显示空状态
  pageOptions.showEmptyState = function(config: {
    title?: string;
    message?: string;
    icon?: string;
    actionText?: string;
    onAction?: () => void;
  }) {
    const emptyStateConfig = {
      title: config.title || '暂无数据',
      message: config.message || '',
      icon: config.icon || '',
      type: 'info'
    };
    
    // 保存回调函数
    if (config.actionText) {
      emptyStateConfig['actionText'] = config.actionText;
      this._emptyStateCallback = config.onAction;
    }
    
    componentInjection.prepareComponent(this, 'emptyState', emptyStateConfig);
  };
  
  // 空状态回调处理
  pageOptions.handleEmptyStateAction = function() {
    if (this._emptyStateCallback) {
      this._emptyStateCallback();
    }
  };
  
  // 隐藏空状态
  pageOptions.hideEmptyState = function() {
    componentInjection.removeComponentData(this, 'emptyState');
  };
  
  // 注册页面
  Page(pageOptions);
} 