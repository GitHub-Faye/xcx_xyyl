import { 
  getHealthRecords, 
  deleteHealthRecord, 
  HealthRecord 
} from '../../api/health';
import { handleApiError } from '../../utils/request';

// 图标映射
const iconMap = {
  bloodPressure: '/assets/icons/blood-pressure.png',
  bloodSugar: '/assets/icons/blood-sugar.png',
  weight: '/assets/icons/weight.png',
  temperature: '/assets/icons/temperature.png'
};

// 扩展的健康记录类型（前端使用）
interface ExtendedHealthRecord extends HealthRecord {
  typeIcon?: string;
  typeName?: string;
  measureTimeFormatted?: string;
  formattedDate?: string;
  formattedTime?: string;
  icon?: string;
  systolicPressure?: number;
  diastolicPressure?: number;
  bloodSugar?: number;
  weight?: number;
  temperature?: number;
  heartRate?: number; // 添加心率字段
  measureTime?: string;
  createdAt?: string;
}

// 健康记录列表页
Page({
  data: {
    records: [] as HealthRecord[],
    loading: false,
    currentPage: 1,
    pageSize: 10,
    hasMore: true,
    iconMap,
    showActionSheet: false,
    currentRecordId: '',
    loadingIds: [] as string[],
    startDate: '',
    endDate: '',
    today: '',
    currentType: 'all',
    typeIcons: {
      bloodPressure: '/assets/icons/blood-pressure.png',
      bloodSugar: '/assets/icons/blood-sugar.png',
      weight: '/assets/icons/weight.png',
      temperature: '/assets/icons/temperature.png'
    },
    typeNames: {
      bloodPressure: '血压',
      bloodSugar: '血糖',
      weight: '体重',
      temperature: '体温'
    }
  },

  onLoad: function() {
    // 初始化日期范围（默认为最近30天）
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - 30);
    
    this.setData({
      today: this.formatDate(today),
      endDate: this.formatDate(today),
      startDate: this.formatDate(startDate)
    });
    
    this.loadHealthRecords();
  },

  onPullDownRefresh: function() {
    this.loadHealthRecords(true);
  },

  // 加载健康记录列表
  async loadHealthRecords(refresh = false) {
    if (this.data.loading) return;

    try {
      this.setData({ loading: true });
      
      // 刷新时重置页码
      if (refresh) {
        this.setData({ currentPage: 1, hasMore: true });
      }

      // 构建查询参数，添加日期范围和类型过滤
      const params: any = {
        page: this.data.currentPage,
        page_size: this.data.pageSize,
        start_date: this.data.startDate,
        end_date: this.data.endDate
      };
      
      // 添加类型过滤
      if (this.data.currentType !== 'all') {
        if (this.data.currentType === 'bloodPressure') {
          params.has_blood_pressure = true;
        } else if (this.data.currentType === 'bloodSugar') {
          params.has_blood_sugar = true;
        } else if (this.data.currentType === 'weight') {
          params.has_weight = true;
        } else if (this.data.currentType === 'temperature') {
          params.has_temperature = true;
        }
      }
      
      console.log('健康记录请求参数:', params);

      const res = await getHealthRecords(params);
      console.log('健康记录API响应:', res);
      
      // 处理API响应数据，兼容直接返回数组和返回包含results字段的对象两种情况
      let records = [];
      let hasMore = false;
      
      if (Array.isArray(res)) {
        // API直接返回记录数组
        records = res;
        // 简单判断：如果返回的记录数等于请求的页大小，则认为可能有更多记录
        hasMore = records.length === this.data.pageSize;
      } else {
        // API返回包含results字段的对象
        records = res.results || [];
        hasMore = !!res.next;
      }
      
      console.log('处理后的记录数组:', records);
      
      // 格式化记录数据
      const formattedRecords = this.formatRecords(records);
      console.log('格式化后的记录:', formattedRecords);
      
      // 刷新或首次加载时替换数据，否则追加
      this.setData({
        records: refresh ? formattedRecords : [...this.data.records, ...formattedRecords],
        currentPage: this.data.currentPage + 1,
        hasMore,
        loading: false
      });
    } catch (error) {
      console.error('加载健康记录失败:', error);
      this.setData({ loading: false });
      wx.showToast({
        title: handleApiError(error),
        icon: 'none',
        duration: 2000
      });
    }
  },

  // 触底加载更多
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadHealthRecords();
    }
  },

  // 点击记录
  onRecordTap(e: any) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `./edit?id=${id}`
    });
  },

  // 添加记录
  navigateToAdd(): void {
    wx.navigateTo({
      url: './edit'
    });
  },

  // 打开操作菜单
  onMoreTap(e: any) {
    const { id } = e.currentTarget.dataset;
    this.setData({
      showActionSheet: true,
      currentRecordId: id
    });
  },

  // 关闭操作菜单
  onCloseActionSheet() {
    this.setData({
      showActionSheet: false
    });
  },

  // 编辑记录
  onEditRecord() {
    wx.navigateTo({
      url: `./edit?id=${this.data.currentRecordId}`
    });
    this.onCloseActionSheet();
  },

  // 删除记录
  async onDeleteRecord() {
    try {
      const recordId = this.data.currentRecordId;
      
      // 确认删除
      const { confirm } = await wx.showModal({
        title: '确认删除',
        content: '确定要删除这条健康记录吗？',
        confirmText: '删除',
        confirmColor: '#ff4d4f'
      });
      
      if (!confirm) return;
      
      // 更新加载状态
      this.setData({
        loadingIds: [...this.data.loadingIds, recordId]
      });
      
      // 调用删除API
      await deleteHealthRecord(recordId);
      
      // 删除成功更新列表
      this.setData({
        records: this.data.records.filter(record => record.id !== recordId),
        loadingIds: this.data.loadingIds.filter(id => id !== recordId)
      });
      
      wx.showToast({
        title: '删除成功',
        icon: 'success'
      });
    } catch (error) {
      this.setData({
        loadingIds: this.data.loadingIds.filter(id => id !== this.data.currentRecordId)
      });
      
      wx.showToast({
        title: handleApiError(error),
        icon: 'none'
      });
    } finally {
      this.onCloseActionSheet();
    }
  },
  
  // 格式化日期
  formatDate(dateString: string | Date): string {
    let date: Date;
    
    if (dateString instanceof Date) {
      date = dateString;
    } else {
      date = new Date(dateString);
    }
    
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  },
  
  // 格式化时间
  formatTime(dateString: string | Date): string {
    let date: Date;
    
    if (dateString instanceof Date) {
      date = dateString;
    } else {
      date = new Date(dateString);
    }
    
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  },

  // 格式化记录数据
  formatRecords(records: HealthRecord[]): ExtendedHealthRecord[] {
    const { typeIcons, typeNames } = this.data;
    
    console.log('开始格式化记录数据:', records);
    
    return records.map(record => {
      const extendedRecord = record as ExtendedHealthRecord;
      
      // 映射字段名称（后端到前端）
      extendedRecord.systolicPressure = record.systolic_pressure;
      extendedRecord.diastolicPressure = record.diastolic_pressure;
      extendedRecord.bloodSugar = record.blood_sugar;
      extendedRecord.measureTime = record.record_time;
      extendedRecord.createdAt = record.created_at;
      
      // 确保数值字段为数字类型（处理字符串类型的数值）
      if (typeof record.weight === 'string') {
        extendedRecord.weight = parseFloat(record.weight);
      } else {
        extendedRecord.weight = record.weight;
      }
      
      // 处理心率字段
      if (typeof record.heart_rate === 'string') {
        extendedRecord.heartRate = parseFloat(record.heart_rate);
      } else {
        extendedRecord.heartRate = record.heart_rate;
      }
      
      // 确定记录类型
      let recordType = '';
      if (extendedRecord.systolicPressure && extendedRecord.diastolicPressure) {
        recordType = 'bloodPressure';
      } else if (extendedRecord.bloodSugar !== undefined && extendedRecord.bloodSugar !== null) {
        recordType = 'bloodSugar';
      } else if (record.weight !== undefined && record.weight !== null) {
        recordType = 'weight';
      } else if (extendedRecord.temperature !== undefined && extendedRecord.temperature !== null) {
        recordType = 'temperature';
      }
      
      console.log('记录类型判断:', record.id, recordType, '体重值:', record.weight, typeof record.weight, '心率:', record.heart_rate);
      
      const formattedRecord = {
        ...extendedRecord,
        typeIcon: typeIcons[recordType as keyof typeof typeIcons] || '',
        typeName: typeNames[recordType as keyof typeof typeNames] || '未知',
        measureTimeFormatted: this.formatDateTime(extendedRecord.measureTime || extendedRecord.createdAt || ''),
        formattedDate: this.formatDate(record.record_time),
        formattedTime: this.formatTime(record.record_time),
        icon: this.getRecordIcon(record)
      };
      
      console.log('格式化后的记录:', formattedRecord);
      return formattedRecord;
    });
  },

  // 获取记录图标
  getRecordIcon(record: HealthRecord) {
    if (record.systolic_pressure && record.diastolic_pressure) {
      return iconMap.bloodPressure;
    } else if (record.weight) {
      return iconMap.weight;
    } else {
      return iconMap.temperature;
    }
  },

  // 开始日期变化
  onStartDateChange(e: WechatMiniprogram.CustomEvent): void {
    this.setData({
      startDate: e.detail.value,
      currentPage: 1,
      records: [],
      hasMore: true
    });
    
    this.loadHealthRecords();
  },

  // 结束日期变化
  onEndDateChange(e: WechatMiniprogram.CustomEvent): void {
    this.setData({
      endDate: e.detail.value,
      currentPage: 1,
      records: [],
      hasMore: true
    });
    
    this.loadHealthRecords();
  },

  // 切换记录类型
  changeType(e: WechatMiniprogram.TouchEvent): void {
    const type = e.currentTarget.dataset.type as string;
    
    if (type !== this.data.currentType) {
      this.setData({
        currentType: type,
        currentPage: 1,
        records: [],
        hasMore: true
      });
      
      this.loadHealthRecords();
    }
  },

  // 查看记录详情
  viewRecordDetail(e: WechatMiniprogram.TouchEvent): void {
    const id = e.currentTarget.dataset.id as string;
    wx.navigateTo({
      url: `/pages/health-records/detail?id=${id}`
    });
  },

  // 格式化日期时间
  formatDateTime(dateString: string | Date): string {
    let date: Date;
    
    if (dateString instanceof Date) {
      date = dateString;
    } else {
      date = new Date(dateString);
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hour}:${minute}`;
  },

  // 加载更多记录
  loadMoreRecords(): void {
    if (this.data.hasMore && !this.data.loading) {
      this.loadHealthRecords();
    }
  }
}); 