import { request } from '../utils/request';

// 健康记录类型
export interface HealthRecord {
  id?: string;
  weight?: number;
  systolic_pressure?: number;
  diastolic_pressure?: number;
  heart_rate?: number;
  blood_sugar?: number;
  record_time: string;
  created_at?: string;
  updated_at?: string;
}

// 健康记录查询参数
export interface HealthRecordQueryParams {
  start_date?: string;
  end_date?: string;
  page?: number;
  page_size?: number;
}

// 健康统计数据接口
export interface HealthStatistics {
  weight_avg: number;
  systolic_pressure_avg: number;
  diastolic_pressure_avg: number;
  heart_rate_avg: number;
  blood_sugar_avg: number;
  weight_trend: Array<{date: string, value: number}>;
  blood_pressure_trend: Array<{date: string, systolic: number, diastolic: number}>;
  heart_rate_trend: Array<{date: string, value: number}>;
  blood_sugar_trend: Array<{date: string, value: number}>;
}

/**
 * 获取健康记录列表
 */
export function getHealthRecords(params: HealthRecordQueryParams = {}): Promise<any> {
  return request<any>({
    url: '/health-records/',
    method: 'GET',
    data: params
  });
}

/**
 * 获取健康记录详情
 * @param id 记录ID
 */
export function getHealthRecordDetail(id: string): Promise<HealthRecord> {
  return request<HealthRecord>({
    url: `/health-records/${id}/`,
    method: 'GET'
  });
}

/**
 * 创建健康记录
 * @param data 健康记录数据
 */
export function createHealthRecord(data: Partial<HealthRecord>): Promise<HealthRecord> {
  return request<HealthRecord>({
    url: '/health-records/',
    method: 'POST',
    data
  });
}

/**
 * 更新健康记录
 * @param id 记录ID
 * @param data 健康记录数据
 */
export function updateHealthRecord(id: string, data: Partial<HealthRecord>): Promise<HealthRecord> {
  return request<HealthRecord>({
    url: `/health-records/${id}/`,
    method: 'PUT',
    data
  });
}

/**
 * 删除健康记录
 * @param id 记录ID
 */
export function deleteHealthRecord(id: string): Promise<void> {
  return request<void>({
    url: `/health-records/${id}/`,
    method: 'DELETE'
  });
}

/**
 * 获取健康统计数据
 * @param params 查询参数
 */
export function getHealthStatistics(params: HealthRecordQueryParams = {}): Promise<HealthStatistics> {
  return request<HealthStatistics>({
    url: '/health-records/statistics/',
    method: 'GET',
    data: params
  });
} 