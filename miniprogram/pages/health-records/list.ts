import { 
  HealthRecord, 
  HealthRecordService
} from '../../api/health';
import { handleApiError } from '../../utils/request';

// 分页返回结果接口
interface PaginatedResult<T> {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results: T[];
}

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
  formattedDate?: string;
  formattedTime?: string;
}

// 健康记录列表页
Page({
  data: {
    records: [] as ExtendedHealthRecord[],
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
      today: HealthRecordService.formatDate(today),
      endDate: HealthRecordService.formatDate(today),
      startDate: HealthRecordService.formatDate(startDate)
    });
    
    this.loadHealthRecords();
  },

  onPullDownRefresh: function() {
    this.loadHealthRecords(true);
  },
  
  onShow: function() {
    // 页面显示时刷新列表，以显示编辑后的数据
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

      // 构建查询参数
      const params: any = {
        page: this.data.currentPage,
        page_size: this.data.pageSize,
        start_date: this.data.startDate,
        end_date: this.data.endDate
      };
      
      // 添加类型筛选
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

      // 使用服务类获取记录
      const result = await HealthRecordService.getList(params);
      console.log('健康记录API响应:', result);
      
      // 处理API响应数据
      let records: HealthRecord[] = [];
      let hasMore = false;
      
      if (Array.isArray(result)) {
        // API直接返回记录数组
        records = result;
        // 简单判断：如果返回的记录数等于请求的页大小，则认为可能有更多记录
        hasMore = records.length === this.data.pageSize;
      } else {
        // API返回包含results字段的对象（分页结果）
        const paginatedResult = result as unknown as PaginatedResult<HealthRecord>;
        records = paginatedResult.results || [];
        hasMore = !!paginatedResult.next;
      }
      
      // 格式化记录数据
      const formattedRecords = this.formatRecords(records);
      
      // 刷新或首次加载时替换数据，否则追加
      this.setData({
        records: refresh ? formattedRecords : [...this.data.records, ...formattedRecords],
        currentPage: this.data.currentPage + 1,
        hasMore,
        loading: false
      });
      
      // 停止下拉刷新
      wx.stopPullDownRefresh();
    } catch (error) {
      console.error('加载健康记录失败:', error);
      this.setData({ loading: false });
      wx.showToast({
        title: handleApiError(error),
        icon: 'none',
        duration: 2000
      });
      
      // 停止下拉刷新
      wx.stopPullDownRefresh();
    }
  },

  // 触底加载更多
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadHealthRecords();
    }
  },

  // 点击记录查看详情
  viewRecordDetail(e: WechatMiniprogram.TouchEvent) {
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

  // 编辑记录
  onEditRecord(e: WechatMiniprogram.TouchEvent) {
    // 使用catchtap代替阻止冒泡
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `./edit?id=${id}`
    });
  },

  // 删除记录
  async onDeleteRecord(e: WechatMiniprogram.TouchEvent) {
    // 使用catchtap代替阻止冒泡
    const { id } = e.currentTarget.dataset;
    
    try {
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
        loadingIds: [...this.data.loadingIds, id]
      });
      
      // 使用服务类删除记录
      await HealthRecordService.delete(id);
      
      // 删除成功更新列表
      this.setData({
        records: this.data.records.filter(record => record.id !== id),
        loadingIds: this.data.loadingIds.filter(loadingId => loadingId !== id)
      });
      
      wx.showToast({
        title: '删除成功',
        icon: 'success'
      });
    } catch (error) {
      console.error('删除记录失败:', error);
      
      this.setData({
        loadingIds: this.data.loadingIds.filter(loadingId => loadingId !== id)
      });
      
      wx.showToast({
        title: handleApiError(error),
        icon: 'none'
      });
    }
  },

  // 格式化记录数据，添加UI显示所需的附加字段
  formatRecords(records: HealthRecord[]): ExtendedHealthRecord[] {
    return records.map(record => {
      // 记录类型判断
      let recordType = 'other';
      let recordTypeName = '其他';
      
      if (record.systolic_pressure) {
        recordType = 'bloodPressure';
        recordTypeName = '血压';
      } else if (record.weight) {
        recordType = 'weight';
        recordTypeName = '体重';
      } else if (record.blood_sugar) {
        recordType = 'bloodSugar';
        recordTypeName = '血糖';
      } else if (record.temperature) {
        recordType = 'temperature';
        recordTypeName = '体温';
      }
      
      // 使用服务类格式化记录
      const formattedRecord = HealthRecordService.formatRecord(record);
      
      // 添加UI显示需要的字段
      const extendedRecord: ExtendedHealthRecord = {
        ...formattedRecord,
        typeIcon: this.data.typeIcons[recordType as keyof typeof this.data.typeIcons] || '/assets/icons/health.png',
        typeName: recordTypeName,
      };
      
      return extendedRecord;
    });
  },

  // 日期范围选择 - 开始日期
  onStartDateChange(e: WechatMiniprogram.CustomEvent): void {
    const startDate = e.detail.value as string;
    
    this.setData({ 
      startDate,
      currentPage: 1
    });
    
    // 更新后重新加载数据
    this.loadHealthRecords(true);
  },

  // 日期范围选择 - 结束日期
  onEndDateChange(e: WechatMiniprogram.CustomEvent): void {
    const endDate = e.detail.value as string;
    
    this.setData({ 
      endDate,
      currentPage: 1
    });
    
    // 更新后重新加载数据
    this.loadHealthRecords(true);
  },

  // 类型选择
  changeType(e: WechatMiniprogram.TouchEvent): void {
    const { type } = e.currentTarget.dataset;
    
    if (type !== this.data.currentType) {
      this.setData({ 
        currentType: type,
        currentPage: 1
      });
      
      // 更新后重新加载数据
      this.loadHealthRecords(true);
    }
  },

  // 点击加载更多按钮
  loadMoreRecords(): void {
    if (this.data.hasMore && !this.data.loading) {
      this.loadHealthRecords();
    }
  }
}); 