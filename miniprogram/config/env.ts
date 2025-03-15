// 环境配置文件 - 只需修改这一行来切换环境
export const CURRENT_ENV = 'development'; // 改为 'production' 即可切换到生产环境

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
export const config = ENV_CONFIG[CURRENT_ENV as EnvType];

// 导出判断当前环境的辅助函数
export const isDev = () => CURRENT_ENV === EnvType.DEV;
export const isProd = () => CURRENT_ENV === EnvType.PROD as unknown as string; 