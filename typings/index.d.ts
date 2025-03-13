/// <reference path="./types/index.d.ts" />

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
  checkUpdate: () => void;
  compareVersion: (v1: string, v2: string) => number;
  initComponentInjection: () => void;
}