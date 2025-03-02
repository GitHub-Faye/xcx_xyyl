/// <reference path="./types/index.d.ts" />

interface IAppOption {
  globalData: {
    userInfo: UserInfo | null;
    token: string;
    refreshToken: string;
    apiBaseUrl: string;
    isLoggedIn: boolean;
  };
  getUserInfo(): Promise<void>;
  refreshTokenFunc(): Promise<boolean>;
  logout(): void;
  checkLoginStatusAndRedirect(): Promise<void>;
  checkCurrentPage(): void;
  redirectToLogin(): void;
}

// 用户信息
interface UserInfo {
  id: number;
  username: string;
  email: string;
  profile?: {
    name?: string;
    gender?: string;
    birth_date?: string;
    age?: number;
    phone?: string;
    height?: number;
    weight?: number;
  };
}

// 微信用户信息
interface WxUserInfo {
  nickName: string;
  avatarUrl: string;
  gender: number;
  city: string;
  province: string;
  country: string;
  language: string;
}

// 健康记录类型
interface HealthRecord {
  id?: number;
  user?: number;
  weight?: number;
  systolic_pressure?: number;
  diastolic_pressure?: number;
  heart_rate?: number;
  record_time: string;
  notes?: string;
}

// 健康统计数据
interface HealthStatistics {
  weight_avg: number;
  systolic_pressure_avg: number;
  diastolic_pressure_avg: number;
  heart_rate_avg: number;
  weight_trend: Array<{date: string, value: number}>;
  blood_pressure_trend: Array<{date: string, systolic: number, diastolic: number}>;
  heart_rate_trend: Array<{date: string, value: number}>;
}

// API响应类型
interface ApiResponse<T> {
  data: T;
  code: number;
  message: string;
} 