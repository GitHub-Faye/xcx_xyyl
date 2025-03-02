import { 
  getHealthRecordDetail, 
  createHealthRecord, 
  updateHealthRecord, 
  HealthRecord 
} from '../../api/health';
import { handleApiError } from '../../utils/request';

// 页面使用的健康记录数据类型
interface HealthRecord {
  id?: string;
  userId?: string;
  measureTime: string; // 记录日期在服务中为 measureTime
  weight?: number;
  systolicPressure?: number;
  diastolicPressure?: number;
  bloodSugar?: number;
  heartRate?: number;
  sleepHours?: number; // 此字段可能需要在提交前转换
  note?: string; // 与服务中的字段名匹配
}

Page({
  data: {
    id: '',
    isEdit: false,
    record: {
      weight: '',
      systolic_pressure: '',
      diastolic_pressure: '',
      heart_rate: '',
      record_time: ''
    } as {
      weight: string,
      systolic_pressure: string,
      diastolic_pressure: string,
      heart_rate: string,
      record_time: string
    },
    currentTab: 'bp', // bp, weight 
    loading: false,
    saving: false,
    showDatePicker: false,
    showTimePicker: false
  },

  onLoad(options) {
    // 设置当前日期时间
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    // 初始化记录日期时间
    this.setData({
      ['record.record_time']: `${dateStr} ${timeStr}:00`
    });
    
    if (options.id) {
      this.setData({
        id: options.id,
        isEdit: true
      });
      
      // 获取记录详情
      this.loadRecordDetail(options.id);
    }
  },

  // 加载健康记录详情
  async loadRecordDetail(id: string) {
    try {
      this.setData({ loading: true });
      
      const record = await getHealthRecordDetail(id);
      
      // 格式化日期时间
      const recordTime = new Date(record.record_time);
      const dateStr = this.formatDate(recordTime);
      const timeStr = this.formatTime(recordTime);
      
      // 自动选择初始化Tab
      let currentTab = 'bp';
      if (record.weight && !record.systolic_pressure) {
        currentTab = 'weight';
      }
      
      this.setData({
        record,
        currentTab,
        loading: false
      });
    } catch (error) {
      this.setData({ loading: false });
      wx.showToast({
        title: handleApiError(error),
        icon: 'none'
      });
    }
  },

  // 切换选项卡
  switchTab(e: WechatMiniprogram.TouchEvent) {
    const { tab } = e.currentTarget.dataset;
    this.setData({
      currentTab: tab
    });
  },

  // 输入框变化
  onInputChange(e: WechatMiniprogram.Input) {
    const { field } = e.currentTarget.dataset;
    const value = e.detail.value;
    
    this.setData({
      [`record.${field}`]: value
    });
  },

  // 打开日期选择器
  openDatePicker() {
    this.setData({
      showDatePicker: true
    });
  },
  
  // 日期变化
  onDateChange(e: WechatMiniprogram.PickerChange) {
    const dateStr = e.detail.value;
    const recordTime = this.data.record.record_time || '';
    const timeStr = recordTime.split(' ')[1] || '00:00:00';
    
    this.setData({
      ['record.record_time']: `${dateStr} ${timeStr}`,
      showDatePicker: false
    });
  },
  
  // 打开时间选择器
  openTimePicker() {
    this.setData({
      showTimePicker: true
    });
  },
  
  // 时间变化
  onTimeChange(e: WechatMiniprogram.PickerChange) {
    const timeStr = e.detail.value;
    const recordTime = this.data.record.record_time || '';
    const dateStr = recordTime.split(' ')[0] || this.formatDate(new Date());
    
    this.setData({
      ['record.record_time']: `${dateStr} ${timeStr}:00`,
      showTimePicker: false
    });
  },
  
  // 取消选择
  onPickerCancel() {
    this.setData({
      showDatePicker: false,
      showTimePicker: false
    });
  },
  
  // 验证表单
  validateForm() {
    const { record, currentTab } = this.data;
    
    // 验证日期时间
    if (!record.record_time) {
      wx.showToast({
        title: '请选择记录时间',
        icon: 'none'
      });
      return false;
    }
    
    // 血压验证
    if (currentTab === 'bp') {
      if (!record.systolic_pressure) {
        wx.showToast({
          title: '请输入收缩压',
          icon: 'none'
        });
        return false;
      }
      if (!record.diastolic_pressure) {
        wx.showToast({
          title: '请输入舒张压',
          icon: 'none'
        });
        return false;
      }
      if (!record.heart_rate) {
        wx.showToast({
          title: '请输入心率',
          icon: 'none'
        });
        return false;
      }
    } 
    // 体重验证
    else if (currentTab === 'weight') {
      if (!record.weight) {
        wx.showToast({
          title: '请输入体重',
          icon: 'none'
        });
        return false;
      }
    }
    
    return true;
  },
  
  // 保存记录
  async saveRecord() {
    if (!this.validateForm()) return;
    if (this.data.saving) return;
    
    try {
      this.setData({ saving: true });
      
      // 准备提交的数据
      const recordData: Partial<HealthRecord> = {
        record_time: this.data.record.record_time
      };
      
      // 根据当前选项卡设置字段
      if (this.data.currentTab === 'bp') {
        recordData.systolic_pressure = Number(this.data.record.systolic_pressure);
        recordData.diastolic_pressure = Number(this.data.record.diastolic_pressure);
        recordData.heart_rate = Number(this.data.record.heart_rate);
      } else if (this.data.currentTab === 'weight') {
        recordData.weight = Number(this.data.record.weight);
      }
      
      // 创建或更新记录
      if (this.data.isEdit) {
        await updateHealthRecord(this.data.id, recordData);
      } else {
        await createHealthRecord(recordData);
      }
      
      wx.showToast({
        title: this.data.isEdit ? '更新成功' : '创建成功',
        icon: 'success'
      });
      
      // 返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } catch (error) {
      wx.showToast({
        title: handleApiError(error),
        icon: 'none'
      });
    } finally {
      this.setData({ saving: false });
    }
  },
  
  // 取消
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
