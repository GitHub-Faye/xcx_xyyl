import { request } from '../utils/request';

// 健康记录接口类型定义
export interface HealthRecord {
  id?: string;
  user?: string;
  weight?: number | string;
  systolic_pressure?: number | string;
  diastolic_pressure?: number | string;
  heart_rate?: number | string;
  blood_sugar?: number | string;
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
 * 健康记录API
 * 提供健康记录的增删查改功能
 */

// 获取健康记录列表
export const getHealthRecords = (params?: any) => {
  return request<HealthRecord[]>({
    url: '/health-records/',
    method: 'GET',
    data: params
  });
};

// 获取健康记录详情
export const getHealthRecordDetail = (id: string) => {
  return request<HealthRecord>({
    url: `/health-records/${id}/`,
    method: 'GET'
  });
};

// 创建健康记录
export const createHealthRecord = (data: HealthRecord) => {
  return request<HealthRecord>({
    url: '/health-records/',
    method: 'POST',
    data
  });
};

// 更新健康记录
export const updateHealthRecord = (id: string, data: HealthRecord) => {
  return request<HealthRecord>({
    url: `/health-records/${id}/`,
    method: 'PATCH',
    data
  });
};

// 删除健康记录
export const deleteHealthRecord = (id: string) => {
  return request({
    url: `/health-records/${id}/`,
    method: 'DELETE'
  });
};

// 健康记录服务类 - 统一处理健康记录的增删查改
export class HealthRecordService {
  // 获取健康记录列表 - 支持分页和筛选
  static async getList(params: {
    page?: number;
    page_size?: number;
    start_date?: string;
    end_date?: string;
    has_blood_pressure?: boolean;
    has_weight?: boolean;
    has_blood_sugar?: boolean;
  } = {}) {
    try {
      return await getHealthRecords(params);
    } catch (error) {
      console.error('获取健康记录列表失败:', error);
      throw error;
    }
  }

  // 获取单条健康记录详情
  static async getDetail(id: string) {
    try {
      return await getHealthRecordDetail(id);
    } catch (error) {
      console.error(`获取健康记录详情失败 (ID: ${id}):`, error);
      throw error;
    }
  }

  // 保存健康记录 - 统一处理创建和更新逻辑
  static async save(record: HealthRecord) {
    try {
      // 确保数值字段为数字类型
      const processedRecord = this.processNumericFields(record);
      
      if (record.id) {
        // 更新已有记录
        return await updateHealthRecord(record.id, processedRecord);
      } else {
        // 创建新记录
        return await createHealthRecord(processedRecord);
      }
    } catch (error) {
      console.error('保存健康记录失败:', error);
      throw error;
    }
  }

  // 删除健康记录
  static async delete(id: string) {
    try {
      return await deleteHealthRecord(id);
    } catch (error) {
      console.error(`删除健康记录失败 (ID: ${id}):`, error);
      throw error;
    }
  }

  // 处理数值字段 - 将字符串转换为数字
  private static processNumericFields(record: HealthRecord): HealthRecord {
    const numericFields = [
      'weight', 'systolic_pressure', 'diastolic_pressure',
      'heart_rate', 'blood_sugar'
    ];
    
    const processed = { ...record };
    
    // 转换字符串为数字，并确保格式正确
    for (const field of numericFields) {
      if (processed[field as keyof HealthRecord] !== undefined && 
          processed[field as keyof HealthRecord] !== null && 
          processed[field as keyof HealthRecord] !== '') {
        let value = processed[field as keyof HealthRecord];
        
        if (typeof value === 'string') {
          // 确保数字格式正确，最多3位整数，2位小数
          const numValue = parseFloat(value);
          if (!isNaN(numValue)) {
            // 使用toFixed确保最多两位小数
            processed[field as keyof HealthRecord] = parseFloat(numValue.toFixed(2)) as any;
          } else {
            // 无效数字则删除
            delete processed[field as keyof HealthRecord];
          }
        } else if (typeof value === 'number') {
          // 如果已经是数字，仍然确保格式正确
          processed[field as keyof HealthRecord] = parseFloat((value as number).toFixed(2)) as any;
        }
      } else {
        // 如果字段为空，删除它，避免发送空字符串到后端
        delete processed[field as keyof HealthRecord];
      }
    }
    
    return processed;
  }

  // 格式化健康记录，添加UI显示所需的字段
  static formatRecord(record: HealthRecord) {
    // 建立记录类型和名称的映射
    let recordType = '';
    let recordName = '';
    
    if (record.systolic_pressure) {
      recordType = 'bloodPressure';
      recordName = '血压';
    } else if (record.weight) {
      recordType = 'weight';
      recordName = '体重';
    } else if (record.blood_sugar) {
      recordType = 'bloodSugar';
      recordName = '血糖';
    }
    
    // 格式化日期和时间
    const recordDate = record.record_time ? new Date(record.record_time) : new Date();
    const formattedDate = this.formatDate(recordDate);
    const formattedTime = this.formatTime(recordDate);
    
    return {
      ...record,
      recordType,
      recordName,
      formattedDate,
      formattedTime,
      formattedDateTime: `${formattedDate} ${formattedTime}`
    };
  }

  // 格式化日期 YYYY-MM-DD
  static formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // 格式化时间 HH:MM
  static formatTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }
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