import { request } from '../utils/request';

// 添加更明确的类型声明
interface HealthRecord {
  id?: string;
  record_time?: string;
  [key: string]: any;
}

/**
 * 同步临时健康记录到云端
 * @param records 临时健康记录数组
 * @returns 同步结果
 */
export const syncTempHealthRecords = async (records: any[]) => {
  if (!records || records.length === 0) {
    console.log('没有需要同步的临时健康记录');
    return { success: true, syncedCount: 0 };
  }
  
  try {
    console.log('开始同步临时健康记录:', records.length, '条');
    console.log('临时健康记录数据示例:', JSON.stringify(records[0]).substring(0, 300));
    
    // 准备要同步的记录
    const recordsToSync = records.map(record => {
      // 移除临时数据特有的字段
      const { id, ...recordData } = record;
      
      // 构造API所需的记录格式
      const apiRecord: any = {
        ...recordData,
        // 确保日期时间字段存在
        record_time: record.record_time || record.measureTime || record.recordDate || new Date().toISOString()
      };
      
      // 处理字段名格式差异（API使用蛇形命名，本地使用驼峰命名）
      if (record.systolicPressure !== undefined) apiRecord.systolic_pressure = record.systolicPressure;
      if (record.diastolicPressure !== undefined) apiRecord.diastolic_pressure = record.diastolicPressure;
      if (record.heartRate !== undefined) apiRecord.heart_rate = record.heartRate;
      if (record.bloodSugar !== undefined) apiRecord.blood_sugar = record.bloodSugar;
      
      return apiRecord;
    });
    
    console.log('处理后的同步数据示例:', JSON.stringify(recordsToSync[0]).substring(0, 300));
    
    // 调用批量创建API，使用 ViewSet 动作路由
    const result = await request({
      url: '/health-records/batch/',
      method: 'POST',
      data: recordsToSync  // 直接发送数组，不再包装
    });
    
    console.log('临时健康记录同步结果:', result);
    return {
      success: true,
      syncedCount: recordsToSync.length,
      result
    };
  } catch (error) {
    console.error('同步临时健康记录失败:', error);
    return {
      success: false,
      error
    };
  }
};

/**
 * 同步所有临时数据到云端
 */
export async function syncAllTempData(): Promise<{
  success: boolean;
  healthRecords?: any;
}> {
  const getLocalHealthRecords = async (): Promise<HealthRecord[]> => {
    try {
      const records = wx.getStorageSync('tempHealthRecords') || [];
      return Array.isArray(records) ? records : [];
    } catch (error) {
      console.error('获取本地临时健康记录失败:', error);
      return [];
    }
  };

  // 获取本地健康记录
  const localHealthRecords = await getLocalHealthRecords();
  
  // 同步健康记录
  const healthRecordsResult = await syncTempHealthRecords(localHealthRecords);
  
  return {
    success: healthRecordsResult.success,
    healthRecords: healthRecordsResult
  };
}

/**
 * 当用户登录后调用此方法同步所有临时数据
 */
export const syncDataAfterLogin = async () => {
  const app = getApp<IAppOption>();
  
  // 检查是否已登录
  if (!app || !app.globalData || !app.globalData.token) {
    console.log('用户未登录，无法同步数据');
    return { success: false, reason: 'not_logged_in' };
  }
  
  try {
    // 同步所有临时数据
    const result = await syncAllTempData();
    
    // 如果同步成功，清理本地数据
    if (result.success && result.healthRecords && result.healthRecords.syncedCount > 0) {
      console.log(`成功同步了${result.healthRecords.syncedCount}条健康记录，清理本地数据`);
      wx.setStorageSync('tempHealthRecords', []);
    }
    
    // 更新全局临时数据状态
    if (app.globalData && 'temporaryData' in app.globalData) {
      // @ts-ignore - 忽略类型检查，因为临时数据属性可能不在类型定义中
      app.globalData.temporaryData = {};
    }
    
    return {
      success: true,
      result
    };
  } catch (error) {
    console.error('登录后同步数据失败:', error);
    return {
      success: false,
      error
    };
  }
}; 