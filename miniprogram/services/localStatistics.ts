import { HealthRecord } from './healthRecords';

/**
 * 从本地存储获取健康记录
 * @returns 本地存储的健康记录数组
 */
export function getLocalHealthRecords(): any[] {
  try {
    const records = wx.getStorageSync('tempHealthRecords') || [];
    console.log('本地统计 - 原始健康记录:', records);
    return records;
  } catch (error) {
    console.error('获取本地健康记录失败:', error);
    return [];
  }
}

/**
 * 获取匿名模式下的本地健康统计数据
 * @param type 记录类型
 * @param period 时间周期
 * @returns 统计结果
 */
export function getLocalHealthStatistics(type: string, period: string): any {
  try {
    console.log(`获取本地健康统计数据: type=${type}, period=${period}`);
    
    // 获取本地健康记录
    let records = getLocalHealthRecords();
    
    // 根据类型过滤记录
    if (type !== 'all') {
      records = records.filter((record: any) => {
        if (type === 'weight' && (record.weight !== undefined && record.weight !== null)) return true;
        if (type === 'bloodPressure' && 
           ((record.systolicPressure && record.diastolicPressure) || 
            (record.systolic_pressure && record.diastolic_pressure))) return true;
        if (type === 'bloodSugar' && (record.bloodSugar !== undefined || record.blood_sugar !== undefined)) return true;
        if (type === 'heartRate' && (record.heartRate !== undefined || record.heart_rate !== undefined)) return true;
        return false;
      });
    }
    
    console.log('类型过滤后记录数:', records.length);
    
    // 根据时间周期过滤记录
    records = filterRecordsByPeriod(records, period);
    console.log('时间过滤后记录数:', records.length);
    
    // 计算统计数据
    const statistics = calculateStatistics(records, type);
    
    console.log('本地健康统计数据:', statistics);
    return statistics;
  } catch (error) {
    console.error('获取本地健康统计数据失败:', error);
    return {
      average: '--',
      max: '--',
      min: '--',
      count: 0,
      data: []
    };
  }
}

/**
 * 根据时间周期过滤记录
 * @param records 记录数组
 * @param period 时间周期
 * @returns 过滤后的记录数组
 */
function filterRecordsByPeriod(records: any[], period: string): any[] {
  const now = new Date();
  let startDate = new Date();
  
  switch (period) {
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'quarter':
      startDate.setMonth(now.getMonth() - 3);
      break;
    case 'all':
      // 不设限制
      return records;
    default:
      startDate.setDate(now.getDate() - 7);
  }
  
  return records.filter(record => {
    // 兼容多种字段命名
    const measureTime = record.measureTime || record.record_time || record.recordDate;
    if (!measureTime) {
      console.warn('记录缺少时间字段:', record);
      return false;
    }
    
    const recordDate = new Date(measureTime);
    return recordDate >= startDate && recordDate <= now;
  });
}

/**
 * 计算健康记录统计数据
 * @param records 健康记录数组
 * @param type 记录类型
 * @returns 统计结果
 */
function calculateStatistics(records: any[], type: string): any {
  if (!records || records.length === 0) {
    return {
      average: '--',
      max: '--',
      min: '--',
      count: 0,
      data: []
    };
  }
  
  // 根据类型处理不同的统计逻辑
  switch (type) {
    case 'weight':
      return calculateWeightStatistics(records);
    case 'bloodPressure':
      return calculateBloodPressureStatistics(records);
    case 'bloodSugar':
      return calculateBloodSugarStatistics(records);
    case 'heartRate':
      return calculateHeartRateStatistics(records);
    default:
      return {
        average: '--',
        max: '--',
        min: '--',
        count: 0,
        data: []
      };
  }
}

/**
 * 计算体重统计数据
 * @param records 健康记录数组
 * @returns 统计结果
 */
function calculateWeightStatistics(records: any[]): any {
  console.log('计算体重统计数据，记录数:', records.length);
  // 确保每个记录都有值
  records.forEach((record, index) => {
    console.log(`记录${index}:`, record);
  });
  
  const weights = records
    .filter(record => record.weight !== undefined && record.weight !== null)
    .map(record => {
      // 优先使用recordDate字段，其次是measureTime和record_time
      const dateStr = record.recordDate || record.measureTime || record.record_time;
      return {
        value: record.weight as number,
        originalDate: dateStr, // 保存原始日期字符串
        date: formatDateForChart(dateStr) // 格式化后的日期
      };
    })
    // 使用原始日期字符串进行排序，确保不同的日期被正确区分
    .sort((a, b) => new Date(a.originalDate).getTime() - new Date(b.originalDate).getTime());
  
  console.log('处理后的体重数据:', weights);
  
  if (weights.length === 0) {
    return {
      average: '--',
      max: '--',
      min: '--',
      count: 0,
      data: []
    };
  }
  
  const values = weights.map(item => item.value);
  const sum = values.reduce((acc: number, curr: number) => acc + curr, 0);
  const average = (sum / values.length).toFixed(1);
  const max = Math.max(...values).toFixed(1);
  const min = Math.min(...values).toFixed(1);
  
  return {
    average,
    max,
    min,
    count: weights.length,
    data: weights
  };
}

/**
 * 计算血压统计数据
 * @param records 健康记录数组
 * @returns 统计结果
 */
function calculateBloodPressureStatistics(records: any[]): any {
  const bloodPressures = records
    .filter(record => 
      ((record.systolicPressure !== undefined && record.systolicPressure !== null) || 
       (record.systolic_pressure !== undefined && record.systolic_pressure !== null)) &&
      ((record.diastolicPressure !== undefined && record.diastolicPressure !== null) || 
       (record.diastolic_pressure !== undefined && record.diastolic_pressure !== null))
    )
    .map(record => {
      // 优先使用recordDate字段
      const dateStr = record.recordDate || record.measureTime || record.record_time;
      return {
        systolic: record.systolicPressure || record.systolic_pressure as number,
        diastolic: record.diastolicPressure || record.diastolic_pressure as number,
        originalDate: dateStr, // 保存原始日期字符串
        date: formatDateForChart(dateStr) // 格式化后的日期
      };
    })
    // 使用原始日期字符串排序
    .sort((a, b) => new Date(a.originalDate).getTime() - new Date(b.originalDate).getTime());
  
  if (bloodPressures.length === 0) {
    return {
      average: '--',
      max: '--',
      min: '--',
      count: 0,
      data: []
    };
  }
  
  const systolicValues = bloodPressures.map(item => item.systolic);
  const diastolicValues = bloodPressures.map(item => item.diastolic);
  
  const systolicSum = systolicValues.reduce((acc: number, curr: number) => acc + curr, 0);
  const diastolicSum = diastolicValues.reduce((acc: number, curr: number) => acc + curr, 0);
  
  const systolicAvg = Math.round(systolicSum / systolicValues.length);
  const diastolicAvg = Math.round(diastolicSum / diastolicValues.length);
  
  const systolicMax = Math.max(...systolicValues);
  const diastolicMax = Math.max(...diastolicValues);
  
  const systolicMin = Math.min(...systolicValues);
  const diastolicMin = Math.min(...diastolicValues);
  
  return {
    average: `${systolicAvg}/${diastolicAvg}`,
    max: `${systolicMax}/${diastolicMax}`,
    min: `${systolicMin}/${diastolicMin}`,
    count: bloodPressures.length,
    data: bloodPressures
  };
}

/**
 * 计算血糖统计数据
 * @param records 健康记录数组
 * @returns 统计结果
 */
function calculateBloodSugarStatistics(records: any[]): any {
  const bloodSugars = records
    .filter(record => 
      (record.bloodSugar !== undefined && record.bloodSugar !== null) || 
      (record.blood_sugar !== undefined && record.blood_sugar !== null)
    )
    .map(record => {
      // 优先使用recordDate字段
      const dateStr = record.recordDate || record.measureTime || record.record_time;
      return {
        value: (record.bloodSugar || record.blood_sugar) as number,
        originalDate: dateStr, // 保存原始日期字符串
        date: formatDateForChart(dateStr) // 格式化后的日期
      };
    })
    // 使用原始日期字符串排序
    .sort((a, b) => new Date(a.originalDate).getTime() - new Date(b.originalDate).getTime());
  
  if (bloodSugars.length === 0) {
    return {
      average: '--',
      max: '--',
      min: '--',
      count: 0,
      data: []
    };
  }
  
  const values = bloodSugars.map(item => item.value);
  const sum = values.reduce((acc: number, curr: number) => acc + curr, 0);
  const average = (sum / values.length).toFixed(1);
  const max = Math.max(...values).toFixed(1);
  const min = Math.min(...values).toFixed(1);
  
  return {
    average,
    max,
    min,
    count: bloodSugars.length,
    data: bloodSugars
  };
}

/**
 * 计算心率统计数据
 * @param records 健康记录数组
 * @returns 统计结果
 */
function calculateHeartRateStatistics(records: any[]): any {
  const heartRates = records
    .filter(record => 
      (record.heartRate !== undefined && record.heartRate !== null) || 
      (record.heart_rate !== undefined && record.heart_rate !== null)
    )
    .map(record => {
      // 优先使用recordDate字段
      const dateStr = record.recordDate || record.measureTime || record.record_time;
      return {
        value: (record.heartRate || record.heart_rate) as number,
        originalDate: dateStr, // 保存原始日期字符串
        date: formatDateForChart(dateStr) // 格式化后的日期
      };
    })
    // 使用原始日期字符串排序
    .sort((a, b) => new Date(a.originalDate).getTime() - new Date(b.originalDate).getTime());
  
  if (heartRates.length === 0) {
    return {
      average: '--',
      max: '--',
      min: '--',
      count: 0,
      data: []
    };
  }
  
  const values = heartRates.map(item => item.value);
  const sum = values.reduce((acc: number, curr: number) => acc + curr, 0);
  const average = Math.round(sum / values.length);
  const max = Math.max(...values);
  const min = Math.min(...values);
  
  return {
    average,
    max,
    min,
    count: heartRates.length,
    data: heartRates
  };
}

/**
 * 格式化日期为图表使用的格式，确保 iOS 兼容性
 * @param dateStr 日期字符串
 * @returns 格式化后的日期字符串
 */
function formatDateForChart(dateStr: string): string {
  try {
    console.log('格式化日期:', dateStr);
    // 如果输入的日期已经是ISO格式如"2025-03-14"，则不需要再处理
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      console.log(`日期已经是ISO格式: ${dateStr}`);
      return dateStr; // 直接返回原始日期，不添加时间部分
    }
    
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      console.error(`无效的日期字符串: ${dateStr}`);
      return dateStr; // 返回原始字符串
    }
    
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    // 只返回日期部分，不包含时间
    const formattedDate = `${year}-${month}-${day}`;
    console.log(`原始日期: ${dateStr}, 格式化后: ${formattedDate}`);
    return formattedDate;
  } catch (error) {
    console.error('日期格式化错误:', error);
    return dateStr; // 返回原始字符串，避免崩溃
  }
} 