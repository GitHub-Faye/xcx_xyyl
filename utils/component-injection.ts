/**
 * 组件注入工具类
 * 使用微信官方的用时注入机制实现组件懒加载
 * 官方文档：https://developers.weixin.qq.com/miniprogram/dev/framework/ability/lazyload.html
 */

// 类型引用
interface IAppOption {
  globalData: {
    userInfo?: WechatMiniprogram.UserInfo;
    systemInfo?: WechatMiniprogram.SystemInfo;
    baseURL: string;
    token: string;
    injectComponents: boolean;
    themeMode: 'light' | 'dark';
    [key: string]: any;
  };
}

// 获取全局App实例
const getAppInstance = (): IAppOption => {
  return getApp<IAppOption>();
};

/**
 * 检查组件注入功能是否可用
 * 需要基础库 2.11.1 及以上版本支持
 */
export const isComponentInjectionSupported = (): boolean => {
  return wx.canIUse('componentPlaceholder');
};

/**
 * 获取当前主题模式
 */
export const getCurrentTheme = (): 'light' | 'dark' => {
  const app = getAppInstance();
  return app.globalData.themeMode;
};

/**
 * 注入主题相关的组件样式
 * @param pageContext 页面上下文
 */
export const injectThemeStyles = (pageContext: any): void => {
  const theme = getCurrentTheme();
  pageContext.setData({
    themeVars: theme === 'dark' ? 'theme-dark' : 'theme-light'
  });
  
  // 监听系统主题变化，自动更新样式
  wx.onThemeChange((result) => {
    pageContext.setData({
      themeVars: result.theme === 'dark' ? 'theme-dark' : 'theme-light'
    });
  });
};

/**
 * 准备用时注入组件
 * 注意：这里不是实际注入，而是准备数据，真正的注入由框架自动完成
 * @param pageContext 页面上下文
 * @param componentName 组件名称
 * @param componentProps 组件属性
 */
export const prepareComponent = (
  pageContext: any,
  componentName: string,
  componentProps: Record<string, any>
): void => {
  if (!isComponentInjectionSupported()) {
    console.warn('当前环境不支持组件用时注入功能，请升级基础库到 2.11.2 及以上版本');
    return;
  }

  // 设置组件属性数据，使用$前缀区分
  const dataKey = `$${componentName}`;
  pageContext.setData({
    [dataKey]: componentProps
  });
  
  console.log(`组件 ${componentName} 数据已准备，等待渲染时注入`);
};

/**
 * 移除组件数据
 * @param pageContext 页面上下文
 * @param componentName 组件名称
 */
export const removeComponentData = (
  pageContext: any,
  componentName: string
): void => {
  const dataKey = `$${componentName}`;
  pageContext.setData({
    [dataKey]: null
  });
};

// 导出默认对象
export default {
  isComponentInjectionSupported,
  getCurrentTheme,
  prepareComponent,
  removeComponentData,
  injectThemeStyles
}; 