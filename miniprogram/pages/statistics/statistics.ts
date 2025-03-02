import { getHealthStatistics } from '../../services/healthRecords';

// 获取应用实例
const app = getApp<IAppOption>();

// 定义数据类型接口
interface StatisticsData {
  average: number | string;
  max: number | string;
  min: number | string;
  count: number;
  unit: string;
  chartData?: Array<{
    date: string;
    value: number;
  }>;
}

// 图表数据类型
interface ChartDataItem {
  date: string;
  value: number;
}

// 页面数据接口
interface PageData {
  typeOptions: string[];
  typeIndex: number;
  periodOptions: string[];
  periodIndex: number;
  stats: {
    average: string;
    max: string;
    min: string;
    count: number;
    unit: string;
  };
  chartData: ChartDataItem[];
  chartSubtitle: string;
  healthTip: string;
  loading: boolean;
}

Page({
  data: {
    typeOptions: ['体重', '血压', '血糖', '心率'],
    typeIndex: 0,
    periodOptions: ['最近一周', '最近一月', '最近三月', '全部'],
    periodIndex: 0,
    stats: {
      average: '--',
      max: '--',
      min: '--',
      count: 0,
      unit: ''
    },
    chartData: [],
    chartSubtitle: '加载中...',
    healthTip: '保持规律测量，关注健康变化趋势',
    loading: false
  } as PageData,

  onLoad() {
    this.checkLoginAndLoadData();
  },

  onShow() {
    // 页面显示时刷新数据
    this.checkLoginAndLoadData();
  },

  onTypeChange(e: any) {
    this.setData({
      typeIndex: e.detail.value
    }, () => {
      this.loadStatisticsData();
    });
  },

  onPeriodChange(e: any) {
    this.setData({
      periodIndex: e.detail.value
    }, () => {
      this.loadStatisticsData();
    });
  },

  async loadStatisticsData() {
    const { typeIndex, periodIndex, typeOptions, periodOptions } = this.data;
    const typeMap = ['weight', 'bloodPressure', 'bloodSugar', 'heartRate'];
    const periodMap = ['week', 'month', 'quarter', 'all'];
    
    const type = typeMap[typeIndex];
    const period = periodMap[periodIndex];
    
    this.setData({
      loading: true,
      chartSubtitle: `${periodOptions[periodIndex]}趋势图`
    });
    
    try {
      const result = await getHealthStatistics(type, period);
      
      // 处理数据
      const stats: StatisticsData = {
        average: result.average || '--',
        max: result.max || '--',
        min: result.min || '--',
        count: result.count || 0,
        unit: this.getUnitByType(type),
        chartData: result.data || []
      };
      
      // 确保将数值转换为字符串以匹配接口类型
      this.setData({
        stats: {
          average: String(stats.average),
          max: String(stats.max),
          min: String(stats.min),
          count: stats.count,
          unit: stats.unit
        },
        chartData: stats.chartData || [],
        healthTip: this.getHealthTip(type, stats)
      });
      
    } catch (error) {
      console.error('获取健康统计数据失败:', error);
      wx.showToast({
        title: '获取数据失败',
        icon: 'none'
      });
    } finally {
      this.setData({
        loading: false
      });
    }
  },

  getUnitByType(type: string): string {
    switch (type) {
      case 'weight':
        return 'kg';
      case 'bloodPressure':
        return 'mmHg';
      case 'bloodSugar':
        return 'mmol/L';
      case 'heartRate':
        return '次/分';
      default:
        return '';
    }
  },

  getHealthTip(type: string, stats: StatisticsData): string {
    // 基于健康数据类型和统计值返回健康提示
    switch (type) {
      case 'weight':
        return '理想体重应稳定在合理范围内，剧烈波动可能反映健康问题。';
      case 'bloodPressure':
        return '正常血压应低于140/90 mmHg，保持规律测量，控制饮食和运动。';
      case 'bloodSugar':
        return '空腹血糖应在3.9-6.1 mmol/L之间，餐后血糖应低于7.8 mmol/L。';
      case 'heartRate':
        return '正常静息心率为60-100次/分，运动员可能更低，持续异常应咨询医生。';
      default:
        return '保持规律测量，关注健康变化趋势，异常情况请及时就医。';
    }
  },

  // 检查登录状态并加载数据
  checkLoginAndLoadData() {
    // 检查登录状态
    const token = wx.getStorageSync('token');
    console.log('统计页面获取到的token:', token);
    
    if (!token) {
      console.log('用户未登录，跳转到登录页面');
      wx.showToast({
        title: '请先登录',
        icon: 'none',
        duration: 2000
      });
      // 延迟跳转，确保用户看到提示
      setTimeout(() => {
        wx.navigateTo({
          url: '/pages/auth/auth'
        });
      }, 1000);
      return;
    }
    
    // 使用全局登录检查方法
    app.checkLoginStatusAndRedirect();
    
    console.log('用户已登录，加载统计数据');
    this.loadStatisticsData();
  }
});
