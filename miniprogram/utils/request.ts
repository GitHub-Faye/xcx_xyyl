// 请求配置接口
export interface RequestOptions {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: any;
  header?: Record<string, string>;
  timeout?: number;
  enableCache?: boolean;
}

// 错误接口
export interface RequestError extends Error {
  code?: number;
  statusCode?: number;
  data?: any;
}

// 基础URL
// 不再硬编码BASE_URL，而是从app中获取
// const BASE_URL = 'http://localhost:8000/api'; // 本地开发环境
// const BASE_URL = 'https://your-api-domain.com/api'; // 生产环境

// 请求函数
export function request<T>(options: RequestOptions): Promise<T> {
  return new Promise((resolve, reject) => {
    const app = getApp<IAppOption>();
    const BASE_URL = 'https://wyw123.pythonanywhere.com/api';
    
    // 获取token
    const token = wx.getStorageSync('token') || '';
    console.log(`准备发送请求 ${options.method} ${options.url}`);
    console.log('当前token:', token);
    console.log('当前API基础URL:', BASE_URL);
    
    // 合并请求头
    const header = {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      ...options.header
    };
    
    console.log('请求头:', header);
    
    // 完整URL构建，确保路径连接正确
    let fullUrl = options.url;
    if (!options.url.startsWith('http')) {
      let urlPath = options.url;
      
      // 确保URL以/开头，但不要重复添加
      if (!urlPath.startsWith('/')) {
        urlPath = '/' + urlPath;
      }
      
      // 确保BASE_URL和urlPath之间连接正确
      if (BASE_URL.endsWith('/') && urlPath.startsWith('/')) {
        fullUrl = BASE_URL + urlPath.substring(1);
      } else if (!BASE_URL.endsWith('/') && !urlPath.startsWith('/')) {
        fullUrl = BASE_URL + '/' + urlPath;
      } else {
        fullUrl = BASE_URL + urlPath;
      }
    }
    console.log('请求完整URL:', fullUrl);
    
    // 显示加载中
    wx.showNavigationBarLoading();
    
    wx.request({
      url: fullUrl,
      method: options.method as any,
      data: options.data,
      header,
      timeout: options.timeout || 30000,
      enableCache: options.enableCache,
      success: (res: any) => {
        // 隐藏加载中
        wx.hideNavigationBarLoading();
        
        // 请求成功
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`请求成功: ${options.method} ${options.url}`, res.data);
          resolve(res.data as T);
        } 
        // 未授权
        else if (res.statusCode === 401) {
          console.error('未授权错误 401:', res.data);
          // 清除token
          wx.removeStorageSync('token');
          wx.removeStorageSync('refreshToken');
          
          // 获取app实例，使用全局方法跳转到登录页
          app.redirectToLogin();
          
          const error: RequestError = new Error('未授权，请重新登录');
          error.statusCode = res.statusCode;
          error.data = res.data;
          reject(error);
        } 
        // 其他错误
        else {
          console.error(`请求错误: 状态码 ${res.statusCode}，响应数据:`, res.data);
          
          // 构建错误信息
          let errorMessage = '请求失败';
          if (res.data && res.data.error) {
            errorMessage = res.data.error;
          } else if (res.data && res.data.message) {
            errorMessage = res.data.message;
          } else if (res.data && res.data.detail) {
            errorMessage = res.data.detail;
          }
          
          // 添加完整错误日志
          console.error(`错误详情: ${errorMessage}`, {
            url: fullUrl,
            method: options.method,
            statusCode: res.statusCode,
            response: res.data
          });
          
          const error: RequestError = new Error(errorMessage);
          error.statusCode = res.statusCode;
          error.data = res.data;
          reject(error);
        }
      },
      fail: (err: any) => {
        // 隐藏加载中
        wx.hideNavigationBarLoading();
        
        console.error('网络请求失败:', err);
        console.error('请求失败详情:', {url: fullUrl, method: options.method, error: err});
        
        // 判断错误类型
        let errorMessage = '网络请求失败';
        if (err.errMsg) {
          if (err.errMsg.includes('timeout')) {
            errorMessage = '请求超时，请检查网络连接';
          } else if (err.errMsg.includes('fail')) {
            if (fullUrl.includes('localhost')) {
              errorMessage = '无法连接到本地服务器，请确认后端服务是否已启动';
            } else {
              errorMessage = '网络连接失败，请检查网络设置或稍后重试';
            }
          }
        }
        
        // 显示错误提示
        wx.showModal({
          title: '连接错误',
          content: errorMessage,
          showCancel: false
        });
        
        const error = new Error(err.errMsg || '网络请求失败') as RequestError;
        error.code = err.code || -1;
        error.statusCode = err.statusCode || 0;
        error.data = err.data;
        
        reject(error);
      },
      complete: () => {
        // 确保导航条加载动画关闭
        wx.hideNavigationBarLoading();
      }
    });
  });
}

// 处理API错误
export function handleApiError(error: any): string {
  console.error('API错误:', error);
  
  if (error.statusCode === 401) {
    return '登录已过期，请重新登录';
  }
  
  if (error.data && error.data.message) {
    return error.data.message;
  }
  
  if (error.data && error.data.detail) {
    return error.data.detail;
  }
  
  if (error.message) {
    return error.message;
  }
  
  return '请求失败，请稍后重试';
} 