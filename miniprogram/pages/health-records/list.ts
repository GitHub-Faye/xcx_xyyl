import { 
  HealthRecord as ApiHealthRecord, 
  HealthRecordService
} from '../../api/health';
import { handleApiError } from '../../utils/request';
import { 
  getLocalHealthRecords, 
  deleteLocalHealthRecord,
  HealthRecord as ServiceHealthRecord
} from '../../services/healthRecords';

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
interface ExtendedHealthRecord {
  id: string;
  typeIcon?: string;
  typeName?: string;
  formattedDate?: string;
  formattedTime?: string;
  recordTimeFormatted?: string;
  [key: string]: any; // 允许任意其他属性
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
    isAnonymousMode: true, // 匿名模式标志
    loginTipVisible: false, // 是否显示登录提示
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

  onLoad() {
    // 检查是否为匿名模式
    const app = getApp<IAppOption>();
    // 用isLoggedIn的反值确定匿名模式
    const isAnonymousMode = !app.globalData.isLoggedIn;
    
    console.log('当前登录状态:', app.globalData.isLoggedIn ? '已登录' : '未登录');
    console.log('匿名模式状态:', isAnonymousMode);
    
    // 设置初始日期
    const today = new Date();
    const todayStr = this.formatDate(today);
    
    // 设置默认起始日期为一个月前
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    const startDateStr = this.formatDate(startDate);
    
    this.setData({
      startDate: startDateStr,
      endDate: todayStr,
      today: todayStr,
      isAnonymousMode
    });
    
    // 加载健康记录
    this.loadHealthRecords(true);
  },

  onPullDownRefresh: function() {
    this.loadHealthRecords(true);
  },
  
  onShow: function() {
    // 检查匿名模式状态可能已变化
    const app = getApp<IAppOption>();
    const isAnonymousMode = app.globalData.isAnonymousMode;
    
    this.setData({
      isAnonymousMode: isAnonymousMode
    });
    
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

      if (this.data.isAnonymousMode) {
        // 匿名模式，从本地加载
        this.loadLocalRecords();
      } else {
        // 已登录模式，从服务器加载
        await this.loadServerRecords();
      }
      
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
  
  // 从本地加载记录
  loadLocalRecords() {
    try {
      // 输出本地健康记录的原始数据，用于调试
      const tempRecords = wx.getStorageSync('tempHealthRecords');
      console.log('原始本地健康记录数据:', JSON.stringify(tempRecords));
      console.log('本地健康记录数量:', Array.isArray(tempRecords) ? tempRecords.length : '非数组');
      
      // 构建查询参数
      const params: any = {
        pageSize: this.data.pageSize,
        sortBy: 'measureTime',
        order: 'desc'
      };
      
      // 添加日期过滤条件
      if (this.data.startDate) {
        params.startDate = this.data.startDate;
      }
      
      if (this.data.endDate) {
        params.endDate = this.data.endDate;
      }
      
      // 使用getLocalHealthRecords方法获取本地记录
      const result = getLocalHealthRecords(params);
      console.log('从本地加载记录:', result.records.length, '条');
      
      // 格式化记录
      const formattedRecords = this.formatRecords(result.records);
      
      // 更新数据
      this.setData({
        records: formattedRecords,
        loading: false,
        hasMore: result.hasMore
      });
    } catch (error) {
      console.error('从本地加载记录失败:', error);
      this.setData({
        loading: false,
        hasMore: false
      });
    }
  },
  
  // 从服务器加载记录
  async loadServerRecords() {
    // 构建查询参数
    const params: any = {
      page: this.data.currentPage,
      page_size: this.data.pageSize,
      start_date: this.data.startDate,
      end_date: this.data.endDate
    };
    
    console.log('健康记录请求参数:', params);

    // 使用服务类获取记录
    try {
      const result = await HealthRecordService.getList(params);
      console.log('健康记录API响应:', result);
      
      // 处理API响应数据
      let records: ApiHealthRecord[] = [];
      let hasMore = false;
      
      if (Array.isArray(result)) {
        // API直接返回记录数组
        records = result;
        // 简单判断：如果返回的记录数等于请求的页大小，则认为可能有更多记录
        hasMore = records.length === this.data.pageSize;
      } else {
        // API返回包含results字段的对象（分页结果）
        const paginatedResult = result as unknown as PaginatedResult<ApiHealthRecord>;
        records = paginatedResult.results || [];
        hasMore = !!paginatedResult.next;
      }
      
      // 格式化记录数据
      const formattedRecords = this.formatRecords(records);
      
      // 刷新或首次加载时替换数据，否则追加
      this.setData({
        records: this.data.currentPage === 1 ? formattedRecords : [...this.data.records, ...formattedRecords],
        currentPage: this.data.currentPage + 1,
        hasMore,
        loading: false
      });
    } catch (error) {
      console.error('从服务器加载记录失败:', error);
      this.setData({ loading: false });
      throw error;
    }
  },

  // 触底加载更多
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading && !this.data.isAnonymousMode) {
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
      
      if (this.data.isAnonymousMode && id.toString().startsWith('temp_')) {
        // 匿名模式，从本地删除
        this.deleteLocalRecord(id);
      } else {
        // 已登录模式，从服务器删除
        await HealthRecordService.delete(id);
        
        // 删除成功更新列表
        this.setData({
          records: this.data.records.filter(record => record.id !== id),
          loadingIds: this.data.loadingIds.filter(loadingId => loadingId !== id)
        });
      }
      
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
  
  // 删除本地记录
  deleteLocalRecord(id: string) {
    try {
      // 使用deleteLocalHealthRecord方法删除本地记录
      deleteLocalHealthRecord(id);
      
      // 删除成功后更新列表
      this.setData({
        records: this.data.records.filter(record => record.id !== id),
        loadingIds: this.data.loadingIds.filter(loadingId => loadingId !== id)
      });
    } catch (error) {
      console.error('删除本地记录失败:', error);
      
      this.setData({
        loadingIds: this.data.loadingIds.filter(loadingId => loadingId !== id)
      });
      
      wx.showToast({
        title: '删除记录失败',
        icon: 'none'
      });
    }
  },

  // 跳转到登录页
  goToLogin() {
    // 使用app的redirectToLogin方法
    const app = getApp<IAppOption>();
    app.redirectToLogin();
  },

  // 格式化记录的方法
  formatRecords(records: any[]): ExtendedHealthRecord[] {
    console.log('开始格式化记录:', records);
    return records.map(record => {
      // 处理不同的日期字段，优先使用recordDate
      const measureTime = record.recordDate || record.measureTime || record.record_time;
      if (!measureTime) {
        console.warn('记录缺少时间字段:', record);
      }
      
      const dateObj = new Date(measureTime || new Date());
      
      // 格式化日期和时间
      const year = dateObj.getFullYear();
      const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
      const day = dateObj.getDate().toString().padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      
      const hours = dateObj.getHours().toString().padStart(2, '0');
      const minutes = dateObj.getMinutes().toString().padStart(2, '0');
      const formattedTime = `${hours}:${minutes}`;
      
      // 确定记录类型和图标
      let recordType = 'unknown';
      
      // 支持两种字段命名方式（API和Service）
      if ((record.systolicPressure && record.diastolicPressure) || 
          (record.systolic_pressure && record.diastolic_pressure)) {
        recordType = 'bloodPressure';
      } else if (record.bloodSugar !== undefined || record.blood_sugar !== undefined) {
        recordType = 'bloodSugar';
      } else if (record.weight !== undefined) {
        recordType = 'weight';
      } else if (record.temperature !== undefined) {
        recordType = 'temperature';
      }
      
      // 记录没有预期字段，尝试打印以便调试
      if (recordType === 'unknown') {
        console.warn('无法确定记录类型:', record);
      }
      
      // 安全访问typeIcons
      const typeIcon = recordType && this.data.typeIcons && this.data.typeIcons[recordType as keyof typeof this.data.typeIcons]
        ? this.data.typeIcons[recordType as keyof typeof this.data.typeIcons]
        : '/assets/icons/default.png';
      
      // 根据是否有recordDate决定如何格式化显示时间
      let recordTimeFormatted;
      if (record.recordDate) {
        // 只显示日期，不显示时间
        recordTimeFormatted = record.recordDate;
      } else {
        // 如果没有recordDate，则使用完整的日期时间格式
        recordTimeFormatted = `${formattedDate} ${formattedTime}`;
      }
      
      return {
        ...record,
        recordTimeFormatted,
        formattedDate,
        formattedTime,
        typeIcon,
        typeName: this.getTypeName(recordType)
      };
    });
  },

  // 格式化日期
  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
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

  // 点击加载更多按钮
  loadMoreRecords(): void {
    if (this.data.hasMore && !this.data.loading) {
      this.loadHealthRecords();
    }
  },
  
  // 显示登录提示
  showLoginTip(): void {
    this.setData({
      loginTipVisible: true
    });
    
    setTimeout(() => {
      this.setData({
        loginTipVisible: false
      });
    }, 3000);
  },

  // 获取类型名称
  getTypeName(type: string): string {
    const typeNames = {
      bloodPressure: '血压',
      bloodSugar: '血糖',
      weight: '体重',
      temperature: '体温'
    };
    return typeNames[type as keyof typeof typeNames] || '其他';
  }
}); 