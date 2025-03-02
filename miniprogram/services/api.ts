// API请求服务
const app = getApp<IAppOption>();

type RequestOptions = {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  header?: Record<string, string>;
  needAuth?: boolean;
};

// 请求队列
let requestQueue: Array<() => Promise<any>> = [];
let isRefreshing = false;

/**
 * 封装的网络请求方法
 */
export const request = async <T = any>(options: RequestOptions): Promise<T> => {
  const { url, method = 'GET', data, needAuth = true } = options;
  const header: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.header
  };

  // 如果需要认证，添加token到请求头
  if (needAuth && app.globalData.token) {
    header['Authorization'] = `Bearer ${app.globalData.token}`;
  }

  try {
    const res = await new Promise<WechatMiniprogram.RequestSuccessCallbackResult>((resolve, reject) => {
      wx.request({
        url: url.startsWith('http') ? url : `${app.globalData.apiBaseUrl}${url}`,
        method,
        data,
        header,
        success: resolve,
        fail: reject
      });
    });

    // 处理HTTP状态码
    if (res.statusCode >= 200 && res.statusCode < 300) {
      return res.data as T;
    } else if (res.statusCode === 401) {
      // Token可能失效，尝试刷新
      return await handleTokenRefresh<T>(options);
    } else {
      const error = new Error(`请求失败: ${res.statusCode}`);
      error.name = 'RequestError';
      // @ts-ignore
      error.statusCode = res.statusCode;
      // @ts-ignore
      error.data = res.data;
      throw error;
    }
  } catch (err) {
    console.error('请求出错:', err);
    
    // 检查是否是网络错误
    if (err instanceof Error && err.message.includes('request:fail')) {
      wx.showToast({
        title: '网络连接失败，请检查网络设置',
        icon: 'none',
        duration: 2000
      });
    }
    
    throw err;
  }
};

/**
 * 处理Token刷新
 */
async function handleTokenRefresh<T>(originalRequest: RequestOptions): Promise<T> {
  // 如果已经在刷新中，则将请求加入队列
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      requestQueue.push(() => 
        request<T>(originalRequest)
          .then(resolve)
          .catch(reject)
      );
    });
  }

  isRefreshing = true;

  try {
    // 尝试刷新Token
    const refreshed = await app.refreshTokenFunc();
    
    if (refreshed) {
      // 执行队列中的请求
      const queue = requestQueue;
      requestQueue = [];
      queue.forEach(callback => callback());
      
      // 重新发起原始请求
      return await request<T>(originalRequest);
    } else {
      // 刷新失败，清空队列
      requestQueue.forEach(callback => callback());
      requestQueue = [];
      
      // 跳转到登录页面
      wx.navigateTo({ url: '/pages/auth/auth' });
      throw new Error('登录已过期，请重新登录');
    }
  } finally {
    isRefreshing = false;
  }
}

/**
 * GET请求
 */
export const get = <T = any>(url: string, data?: any, needAuth = true): Promise<T> => {
  return request<T>({
    url,
    method: 'GET',
    data,
    needAuth
  });
};

/**
 * POST请求
 */
export const post = <T = any>(url: string, data?: any, needAuth = true): Promise<T> => {
  return request<T>({
    url,
    method: 'POST',
    data,
    needAuth
  });
};

/**
 * PUT请求
 */
export const put = <T = any>(url: string, data?: any, needAuth = true): Promise<T> => {
  return request<T>({
    url,
    method: 'PUT',
    data,
    needAuth
  });
};

/**
 * DELETE请求
 */
export const del = <T = any>(url: string, data?: any, needAuth = true): Promise<T> => {
  return request<T>({
    url,
    method: 'DELETE',
    data,
    needAuth
  });
}; 