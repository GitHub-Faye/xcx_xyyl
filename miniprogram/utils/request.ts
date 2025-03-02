// 请求配置接口
export interface RequestOptions {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
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
// 修改为真实的API地址（本地测试用localhost，生产环境应使用实际服务器地址）
// 注意：微信小程序只能访问https域名或特定的开发环境域名
const BASE_URL = 'http://localhost:8000/api'; // 本地开发环境
// const BASE_URL = 'https://your-api-domain.com/api'; // 生产环境

// 请求函数
export function request<T>(options: RequestOptions): Promise<T> {
  return new Promise((resolve, reject) => {
    // 获取token
    const token = wx.getStorageSync('token') || '';
    console.log(`准备发送请求 ${options.method} ${options.url}`);
    console.log('当前token:', token);
    
    // 合并请求头
    const header = {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      ...options.header
    };
    
    console.log('请求头:', header);
    
    // 完整URL
    let fullUrl = options.url;
    if (!options.url.startsWith('http')) {
      fullUrl = BASE_URL + (options.url.startsWith('/') ? options.url : `/${options.url}`);
    }
    console.log('请求完整URL:', fullUrl);
    
    // 显示加载中
    wx.showNavigationBarLoading();
    
    wx.request({
      url: fullUrl,
      method: options.method,
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
          
          // 跳转到登录页
          wx.redirectTo({
            url: '/pages/auth/auth'
          });
          
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
      fail: (err) => {
        // 隐藏加载中
        wx.hideNavigationBarLoading();
        
        console.error('网络请求失败:', err);
        
        // 添加更详细的错误日志
        console.error('请求失败详情:', {
          url: fullUrl,
          method: options.method,
          error: err
        });
        
        // 显示网络错误提示
        wx.showToast({
          title: '网络连接失败，请检查网络设置',
          icon: 'none',
          duration: 2000
        });
        
        const error: RequestError = new Error(err.errMsg || '网络请求失败');
        error.code = -1;  // 默认错误码
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