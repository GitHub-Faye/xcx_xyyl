import { 
  HealthRecord, 
  HealthRecordService 
} from '../../api/health';
import { handleApiError } from '../../utils/request';

// 健康记录表单类型
interface HealthRecordForm {
  id?: string;
  recordDate: string; // 只存储日期，不包含时间
  weight?: string;
  systolic_pressure?: string;
  diastolic_pressure?: string;
  heart_rate?: string;
  blood_sugar?: string;
}

Page({
  data: {
    isEdit: false,
    recordId: '',
    today: '',
    saving: false,
    record: {
      recordDate: '',
      weight: '',
      systolic_pressure: '',
      diastolic_pressure: '',
      heart_rate: '',
      blood_sugar: ''
    } as HealthRecordForm
  },

  onLoad(options) {
    // 设置当前日期
    const now = new Date();
    const dateStr = this.formatDate(now);
    
    // 初始化记录日期和今天日期
    this.setData({
      'record.recordDate': dateStr,
      today: dateStr
    });

    // 检查是否编辑模式
    if (options.id) {
      this.setData({
        isEdit: true,
        recordId: options.id
      });
      this.loadRecordDetail(options.id);
    }
  },

  // 加载健康记录详情
  async loadRecordDetail(id: string) {
    wx.showLoading({ title: '加载中...' });
    
    try {
      // 调用服务获取记录详情
      const record = await HealthRecordService.getDetail(id);
      console.log('获取到的健康记录:', record);
      
      // 将数字类型转为字符串用于表单显示
      const formRecord: HealthRecordForm = {
        id: record.id,
        recordDate: record.record_time.split(' ')[0], // 只取日期部分
        weight: record.weight?.toString() || '',
        systolic_pressure: record.systolic_pressure?.toString() || '',
        diastolic_pressure: record.diastolic_pressure?.toString() || '',
        heart_rate: record.heart_rate?.toString() || '',
        blood_sugar: record.blood_sugar?.toString() || ''
      };
      
      this.setData({
        record: formRecord
      });
      
    } catch (error) {
      console.error('加载健康记录详情失败:', error);
      wx.showToast({
        title: handleApiError(error),
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 表单输入变化
  onInputChange(e: WechatMiniprogram.Input) {
    const { field } = e.currentTarget.dataset;
    const value = e.detail.value;
    
    // 对于数字输入，进行格式验证
    if (['weight', 'systolic_pressure', 'diastolic_pressure', 'heart_rate', 'blood_sugar'].includes(field)) {
      // 整数部分不超过3位数
      const regex = /^\d{0,3}(\.\d{0,2})?$/;
      if (value && !regex.test(value)) {
        return;
      }
    }
    
    this.setData({
      [`record.${field}`]: value
    });
  },

  // 日期变化处理
  onDateChange(e: WechatMiniprogram.PickerChange) {
    const date = e.detail.value as string;
    
    this.setData({
      'record.recordDate': date
    });
  },

  // 验证数值的格式
  validateNumberField(value: string, fieldName: string, min = 0, max = 999): boolean {
    if (!value) return true; // 空值不验证，由其他逻辑判断是否必填
    
    const numValue = parseFloat(value);
    
    // 检查是否是有效数字
    if (isNaN(numValue)) {
      wx.showToast({
        title: `${fieldName}格式不正确`,
        icon: 'none'
      });
      return false;
    }
    
    // 检查数值范围
    if (numValue < min || numValue > max) {
      wx.showToast({
        title: `${fieldName}超出有效范围`,
        icon: 'none'
      });
      return false;
    }
    
    // 检查小数位数
    if (value.includes('.') && value.split('.')[1].length > 2) {
      wx.showToast({
        title: `${fieldName}最多支持两位小数`,
        icon: 'none'
      });
      return false;
    }
    
    // 检查整数位数
    if (value.split('.')[0].length > 3) {
      wx.showToast({
        title: `${fieldName}整数部分不能超过3位`,
        icon: 'none'
      });
      return false;
    }
    
    return true;
  },

  // 表单验证
  validateForm() {
    const { record } = this.data;
    
    // 检查记录日期
    if (!record.recordDate) {
      wx.showToast({
        title: '请选择记录日期',
        icon: 'none'
      });
      return false;
    }
    
    // 至少需要填写一项健康指标
    if (!record.systolic_pressure && 
        !record.diastolic_pressure && 
        !record.weight && 
        !record.blood_sugar && 
        !record.heart_rate) {
      wx.showToast({
        title: '请至少填写一项健康指标',
        icon: 'none'
      });
      return false;
    }
    
    // 检查成对填写
    if ((record.systolic_pressure && !record.diastolic_pressure) || 
        (!record.systolic_pressure && record.diastolic_pressure)) {
      wx.showToast({
        title: '收缩压和舒张压需要同时填写',
        icon: 'none'
      });
      return false;
    }
    
    // 验证数值字段格式
    if (record.weight && !this.validateNumberField(record.weight, '体重', 0, 500)) {
      return false;
    }
    
    if (record.systolic_pressure && !this.validateNumberField(record.systolic_pressure, '收缩压', 0, 300)) {
      return false;
    }
    
    if (record.diastolic_pressure && !this.validateNumberField(record.diastolic_pressure, '舒张压', 0, 200)) {
      return false;
    }
    
    if (record.heart_rate && !this.validateNumberField(record.heart_rate, '心率', 0, 300)) {
      return false;
    }
    
    if (record.blood_sugar && !this.validateNumberField(record.blood_sugar, '血糖', 0, 100)) {
      return false;
    }
    
    return true;
  },

  // 格式化数字为后端可接受的格式
  formatNumberForBackend(value: string | undefined): number | undefined {
    if (!value) return undefined;
    
    // 转换为浮点数，保留最多2位小数
    const numValue = parseFloat(parseFloat(value).toFixed(2));
    return isNaN(numValue) ? undefined : numValue;
  },

  // 保存记录
  async onSave() {
    // 表单验证
    if (!this.validateForm()) {
      return;
    }
    
    this.setData({ saving: true });
    
    try {
      // 准备记录数据
      const { record } = this.data;
      
      // 构建完整的日期时间字符串（使用当前时间）
      const now = new Date();
      const timeStr = this.formatTime(now);
      const record_time = `${record.recordDate} ${timeStr}`;
      
      const healthRecord: HealthRecord = {
        id: this.data.isEdit ? this.data.recordId : undefined,
        record_time: record_time
      };
      
      // 添加所有填写的健康指标，确保数值格式正确
      if (record.systolic_pressure) {
        healthRecord.systolic_pressure = this.formatNumberForBackend(record.systolic_pressure);
      }
      
      if (record.diastolic_pressure) {
        healthRecord.diastolic_pressure = this.formatNumberForBackend(record.diastolic_pressure);
      }
      
      if (record.heart_rate) {
        healthRecord.heart_rate = this.formatNumberForBackend(record.heart_rate);
      }
      
      if (record.weight) {
        healthRecord.weight = this.formatNumberForBackend(record.weight);
      }
      
      if (record.blood_sugar) {
        healthRecord.blood_sugar = this.formatNumberForBackend(record.blood_sugar);
      }
      
      console.log('准备发送的健康记录数据:', healthRecord);
      
      // 调用服务保存记录
      await HealthRecordService.save(healthRecord);
      
      wx.showToast({
        title: this.data.isEdit ? '更新成功' : '添加成功',
        icon: 'success'
      });
      
      // 返回到列表页
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      
    } catch (error) {
      console.error('保存健康记录失败:', error);
      wx.showToast({
        title: handleApiError(error),
        icon: 'none'
      });
    } finally {
      this.setData({ saving: false });
    }
  },

  // 取消操作
  onCancel() {
    wx.navigateBack();
  },

  // 格式化日期
  formatDate(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  },
  
  // 格式化时间
  formatTime(date: Date) {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }
});
