import { request } from '../utils/request';

// 健康记录类型
export interface HealthRecord {
  id: string;
  userId: string;
  measureTime: string;
  createdAt: string;
  updatedAt: string;
  note?: string;
  
  // 血压相关字段
  systolicPressure?: number;
  diastolicPressure?: number;
  heartRate?: number;
  
  // 血糖相关字段
  bloodSugar?: number;
  measurePeriod?: string;
  
  // 体重相关字段
  weight?: number;
  height?: number;
  bmi?: number;
  
  // 体温相关字段
  temperature?: number;
}

// 健康记录查询参数
export interface HealthRecordQueryParams {
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
  type?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
  limit?: number;
}

// 健康记录响应
export interface HealthRecordResponse {
  records: HealthRecord[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// 获取健康记录列表
export async function getHealthRecords(params: HealthRecordQueryParams = {}): Promise<HealthRecordResponse> {
  // 转换参数名称以匹配后端API
  const apiParams: any = {};
  if (params.startDate) apiParams.start_date = params.startDate;
  if (params.endDate) apiParams.end_date = params.endDate;
  if (params.page) apiParams.page = params.page;
  if (params.pageSize) apiParams.page_size = params.pageSize;
  if (params.limit) apiParams.limit = params.limit;
  
  return request<HealthRecordResponse>({
    url: '/health-records/',
    method: 'GET',
    data: apiParams
  });
}

// 获取最近的健康记录
export async function getRecentHealthRecords(params: HealthRecordQueryParams = {}): Promise<HealthRecord[]> {
  const defaultParams: any = {
    limit: 5,
    sort_by: 'record_time',
    order: 'desc'
  };
  
  // 转换参数
  if (params.startDate) defaultParams.start_date = params.startDate;
  if (params.endDate) defaultParams.end_date = params.endDate;
  if (params.limit) defaultParams.limit = params.limit;
  
  const response = await request<any>({
    url: '/health-records/',
    method: 'GET',
    data: defaultParams
  });
  
  return response.results || [];
}

// 获取健康记录详情
export async function getHealthRecordDetail(id: string): Promise<HealthRecord> {
  return request<HealthRecord>({
    url: `/health-records/${id}/`,
    method: 'GET'
  });
}

// 创建健康记录
export async function createHealthRecord(data: Partial<HealthRecord>): Promise<HealthRecord> {
  // 转换字段名称以匹配后端API
  const apiData: any = {
    record_time: data.measureTime
  };
  
  if (data.systolicPressure) apiData.systolic_pressure = data.systolicPressure;
  if (data.diastolicPressure) apiData.diastolic_pressure = data.diastolicPressure;
  if (data.heartRate) apiData.heart_rate = data.heartRate;
  if (data.bloodSugar) apiData.blood_sugar = data.bloodSugar;
  if (data.weight) apiData.weight = data.weight;
  if (data.note) apiData.note = data.note;
  
  return request<HealthRecord>({
    url: '/health-records/',
    method: 'POST',
    data: apiData
  });
}

// 更新健康记录
export async function updateHealthRecord(id: string, data: Partial<HealthRecord>): Promise<HealthRecord> {
  // 转换字段名称以匹配后端API
  const apiData: any = {};
  
  if (data.measureTime) apiData.record_time = data.measureTime;
  if (data.systolicPressure) apiData.systolic_pressure = data.systolicPressure;
  if (data.diastolicPressure) apiData.diastolic_pressure = data.diastolicPressure;
  if (data.heartRate) apiData.heart_rate = data.heartRate;
  if (data.bloodSugar) apiData.blood_sugar = data.bloodSugar;
  if (data.weight) apiData.weight = data.weight;
  if (data.note) apiData.note = data.note;
  
  return request<HealthRecord>({
    url: `/health-records/${id}/`,
    method: 'PUT',
    data: apiData
  });
}

// 删除健康记录
export async function deleteHealthRecord(id: string): Promise<void> {
  return request<void>({
    url: `/health-records/${id}/`,
    method: 'DELETE'
  });
}

// 获取健康统计数据
export async function getHealthStatistics(type: string, period: string): Promise<any> {
  console.log(`正在请求健康统计数据: type=${type}, period=${period}`);
  
  try {
    const result = await request<any>({
      url: `/health-records/statistics/?type=${type}&period=${period}`,
      method: 'GET'
    });
    console.log('健康统计数据请求成功:', result);
    return result;
  } catch (error) {
    console.error('健康统计数据请求失败:', error);
    throw error;
  }
}

// 获取模拟统计数据
function getMockStatistics(type: string, period: string): any {
  // 生成过去n天的日期数组
  const getDays = (n: number) => {
    const days = [];
    const today = new Date();
    for (let i = n; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      days.push(date.toISOString().split('T')[0]); // 格式：YYYY-MM-DD
    }
    return days;
  };
  
  // 根据周期获取天数
  let days = [];
  switch (period) {
    case 'week':
      days = getDays(7);
      break;
    case 'month':
      days = getDays(30);
      break;
    case 'quarter':
      days = getDays(90);
      break;
    default:
      days = getDays(7); // 默认一周
  }
  
  // 根据类型生成不同的模拟数据
  switch (type) {
    case 'weight': {
      // 生成体重数据：70-75kg之间波动
      const baseWeight = 72;
      const data = days.map(date => ({
        date,
        value: +(baseWeight + (Math.random() * 5 - 2.5)).toFixed(1)
      }));
      
      // 计算统计值
      const values = data.map(item => item.value);
      const average = values.reduce((sum, val) => sum + val, 0) / values.length;
      
      return {
        average: +average.toFixed(1),
        max: +Math.max(...values).toFixed(1),
        min: +Math.min(...values).toFixed(1),
        count: values.length,
        data
      };
    }
    
    case 'bloodPressure': {
      // 生成血压数据：收缩压120-140，舒张压70-90
      const data = days.map(date => ({
        date,
        systolic: Math.floor(120 + Math.random() * 20),
        diastolic: Math.floor(70 + Math.random() * 20)
      }));
      
      // 计算统计值
      const systolicValues = data.map(item => item.systolic);
      const diastolicValues = data.map(item => item.diastolic);
      const systolicAvg = systolicValues.reduce((sum, val) => sum + val, 0) / systolicValues.length;
      const diastolicAvg = diastolicValues.reduce((sum, val) => sum + val, 0) / diastolicValues.length;
      
      return {
        average: `${Math.floor(systolicAvg)}/${Math.floor(diastolicAvg)}`,
        max: `${Math.max(...systolicValues)}/${Math.max(...diastolicValues)}`,
        min: `${Math.min(...systolicValues)}/${Math.min(...diastolicValues)}`,
        count: data.length,
        data
      };
    }
    
    case 'heartRate': {
      // 生成心率数据：60-100次/分
      const data = days.map(date => ({
        date,
        value: Math.floor(60 + Math.random() * 40)
      }));
      
      // 计算统计值
      const values = data.map(item => item.value);
      const average = values.reduce((sum, val) => sum + val, 0) / values.length;
      
      return {
        average: Math.floor(average),
        max: Math.max(...values),
        min: Math.min(...values),
        count: values.length,
        data
      };
    }
    
    case 'bloodSugar': {
      // 生成血糖数据：4.0-7.0 mmol/L
      const data = days.map(date => ({
        date,
        value: +(4 + Math.random() * 3).toFixed(1)
      }));
      
      // 计算统计值
      const values = data.map(item => item.value);
      const average = values.reduce((sum, val) => sum + val, 0) / values.length;
      
      return {
        average: +average.toFixed(1),
        max: +Math.max(...values).toFixed(1),
        min: +Math.min(...values).toFixed(1),
        count: values.length,
        data
      };
    }
    
    default:
      return {
        average: 0,
        max: 0,
        min: 0,
        count: 0,
        data: []
      };
  }
}

// 获取模拟健康记录数据
function getMockHealthRecords(params: HealthRecordQueryParams = {}): HealthRecordResponse {
  const { page = 1, pageSize = 10, limit = 20 } = params;
  
  // 生成过去30天的模拟记录
  const records: HealthRecord[] = [];
  const today = new Date();
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const isoDate = date.toISOString();
    
    records.push({
      id: `mock-${i}`,
      userId: '1',
      measureTime: isoDate,
      createdAt: isoDate,
      updatedAt: isoDate,
      weight: Math.round((70 + Math.random() * 5) * 10) / 10,
      systolicPressure: Math.floor(120 + Math.random() * 20),
      diastolicPressure: Math.floor(70 + Math.random() * 20),
      heartRate: Math.floor(60 + Math.random() * 40),
      bloodSugar: Math.round((5 + Math.random() * 2) * 10) / 10,
      note: i % 5 === 0 ? '今天感觉良好' : '',
    });
  }
  
  // 排序
  if (params.sortBy) {
    const sortField = params.sortBy as keyof HealthRecord;
    const sortOrder = params.order === 'desc' ? -1 : 1;
    
    // 排序函数
    const sortFn = (a: any, b: any) => {
      // 使用更兼容的写法，替换??运算符
      const aValue = (a[sortField] !== undefined && a[sortField] !== null) ? a[sortField] : '';
      const bValue = (b[sortField] !== undefined && b[sortField] !== null) ? b[sortField] : '';
      
      // 升序
      if (sortOrder === 1) {
        return aValue > bValue ? 1 : -1;
      }
      // 降序
      return aValue < bValue ? 1 : -1;
    };
    
    records.sort(sortFn);
  }
  
  // 分页或限制数量
  let result = records;
  if (limit && limit < records.length) {
    result = records.slice(0, limit);
  } else if (page && pageSize) {
    const start = (page - 1) * pageSize;
    result = records.slice(start, start + pageSize);
  }
  
  return {
    records: result,
    total: records.length,
    page: page || 1,
    pageSize: pageSize || result.length,
    hasMore: result.length < records.length
  };
} 