// 环境配置文件
export const CURRENT_ENV = 'production' as const; // 使用 as const 来确保类型推断

// 环境类型
export enum EnvType {
  DEV = 'development',
  PROD = 'production'
}

// 环境配置
const ENV_CONFIG = {
  [EnvType.DEV]: {
    apiBaseUrl: 'http://localhost:8000/api',
    envName: '开发环境',
    timeout: 10000,
  },
  [EnvType.PROD]: {
    apiBaseUrl: 'https://wyw123.pythonanywhere.com/api',
    envName: '生产环境',
    timeout: 15000,
  }
};

// 导出当前环境的配置
export const config = ENV_CONFIG[CURRENT_ENV === 'development' ? EnvType.DEV : EnvType.PROD];

// 导出判断当前环境的辅助函数
export const isDev = () => CURRENT_ENV === 'development';
export const isProd = () => CURRENT_ENV === 'production'; 