import { getHealthStatistics } from '../../services/healthRecords';
const wxCharts = require('../../utils/wxcharts.js');

// 获取应用实例
const app = getApp<IAppOption>();

// 定义数据类型接口
interface StatisticsData {
  average: string;
  max: string;
  min: string;
  count: number;
  unit: string;
}

// 图表数据类型
interface ChartDataItem {
  date: string;
  value: number;
  systolic?: number;
  diastolic?: number;
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
    chartData: [] as ChartDataItem[],
    chartSubtitle: '加载中...',
    healthTip: '保持规律测量，关注健康变化趋势',
    loading: false
  },

  lineChart: null as any,

  onLoad() {
    this.checkLoginAndLoadData();
  },

  onShow() {
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

  createChart(chartData: ChartDataItem[]) {
    const { typeIndex, typeOptions } = this.data;
    const windowWidth = wx.getSystemInfoSync().windowWidth;
    const windowHeight = wx.getSystemInfoSync().windowHeight;
    
    try {
      // 准备图表数据
      const categories = chartData.map(item => item.date);
      let series = [];
      
      if (typeOptions[typeIndex] === '血压') {
        // 血压需要显示两条线
        series = [
          {
            name: '收缩压',
            data: chartData.map(item => item.systolic || 0),
            format: (val: number) => val + 'mmHg',
            color: '#ff4d4f',  // 红色代表收缩压
            type: 'line'
          },
          {
            name: '舒张压',
            data: chartData.map(item => item.diastolic || 0),
            format: (val: number) => val + 'mmHg',
            color: '#1890ff',  // 蓝色代表舒张压
            type: 'line'
          }
        ];

        // 创建血压图表
        this.lineChart = new wxCharts({
          canvasId: 'lineChart',
          type: 'line',
          categories: categories,
          series: series,
          width: windowWidth - 40,
          height: 300,
          dataLabel: true,
          dataPointShape: true,
          enableScroll: true,
          legend: true,
          extra: {
            lineStyle: 'curve',
            legendTextColor: '#666666',
            gridColor: '#cccccc'
          },
          xAxis: {
            disableGrid: true,
            gridColor: '#cccccc',
            fontColor: '#666666',
            rotateLabel: true,
            titleFontColor: '#666666',
            titleFontSize: 24
          },
          yAxis: {
            format: (val: number) => val.toFixed(0),
            min: 40,
            max: 180,
            gridColor: '#cccccc',
            fontColor: '#666666',
            titleFontColor: '#666666',
            title: 'mmHg',
            disabled: false,
            disableGrid: false,
            splitLine: true
          }
        });
      } else if (typeOptions[typeIndex] === '血糖') {
        // 血糖图表配置
        series = [{
          name: '血糖',
          data: chartData.map(item => item.value),
          format: (val: number) => val.toFixed(1) + 'mmol/L',
          color: '#722ed1'  // 紫色代表血糖
        }];

        // 创建血糖图表
        this.lineChart = new wxCharts({
          canvasId: 'lineChart',
          type: 'line',
          categories: categories,
          series: series,
          width: windowWidth - 40,
          height: 300,
          dataLabel: true,
          dataPointShape: true,
          enableScroll: true,
          legend: true,
          extra: {
            lineStyle: 'curve',
            legendTextColor: '#666666',
            gridColor: '#cccccc'
          },
          xAxis: {
            disableGrid: true,
            gridColor: '#cccccc',
            fontColor: '#666666',
            rotateLabel: true,
            titleFontColor: '#666666',
            titleFontSize: 24
          },
          yAxis: {
            format: (val: number) => val.toFixed(1),
            min: 3.0,
            max: 11.0,
            gridColor: '#cccccc',
            fontColor: '#666666',
            titleFontColor: '#666666',
            title: 'mmol/L',
            disabled: false,
            disableGrid: false,
            splitLine: true
          }
        });
      } else if (typeOptions[typeIndex] === '心率') {
        // 心率图表配置
        series = [{
          name: '心率',
          data: chartData.map(item => item.value),
          format: (val: number) => val + '次/分',
          color: '#f5222d'  // 红色代表心率
        }];

        // 创建心率图表
        this.lineChart = new wxCharts({
          canvasId: 'lineChart',
          type: 'line',
          categories: categories,
          series: series,
          width: windowWidth - 40,
          height: 300,
          dataLabel: true,
          dataPointShape: true,
          enableScroll: true,
          legend: true,
          extra: {
            lineStyle: 'curve',
            legendTextColor: '#666666',
            gridColor: '#cccccc'
          },
          xAxis: {
            disableGrid: true,
            gridColor: '#cccccc',
            fontColor: '#666666',
            rotateLabel: true,
            titleFontColor: '#666666',
            titleFontSize: 24
          },
          yAxis: {
            format: (val: number) => val.toFixed(0),
            min: 40,  // 心率正常范围最低值
            max: 120,  // 心率正常范围最高值
            gridColor: '#cccccc',
            fontColor: '#666666',
            titleFontColor: '#666666',
            title: '次/分',
            disabled: false,
            disableGrid: false,
            splitLine: true
          }
        });
      } else {
        // 其他指标显示单条线
        series = [{
          name: typeOptions[typeIndex],
          data: chartData.map(item => item.value),
          format: (val: number) => val + this.getUnitByType(this.getTypeKey()),
          color: '#1890ff'
        }];

        // 创建普通图表
        this.lineChart = new wxCharts({
          canvasId: 'lineChart',
          type: 'line',
          categories: categories,
          series: series,
          width: windowWidth - 40,
          height: 200,
          dataLabel: false,
          dataPointShape: true,
          enableScroll: true,
          extra: {
            lineStyle: 'curve'
          },
          xAxis: {
            disableGrid: false,
            gridColor: '#cccccc',
            fontColor: '#666666'
          },
          yAxis: {
            format: (val: number) => val.toFixed(1),
            min: 0,
            gridColor: '#cccccc',
            fontColor: '#666666'
          }
        });
      }
    } catch (error) {
      console.error('创建图表失败:', error);
      wx.showToast({
        title: '图表渲染失败',
        icon: 'none'
      });
    }
  },

  getTypeKey(): string {
    const typeMap = ['weight', 'bloodPressure', 'bloodSugar', 'heartRate'];
    return typeMap[this.data.typeIndex];
  },

  async loadStatisticsData() {
    const { periodIndex, periodOptions } = this.data;
    const periodMap = ['week', 'month', 'quarter', 'all'];
    
    const type = this.getTypeKey();
    const period = periodMap[periodIndex];
    
    this.setData({
      loading: true,
      chartSubtitle: `${periodOptions[periodIndex]}趋势图`
    });
    
    try {
      const result = await getHealthStatistics(type, period);
      
      // 处理数据
      const stats: StatisticsData = {
        average: String(result.average || '--'),
        max: String(result.max || '--'),
        min: String(result.min || '--'),
        count: result.count || 0,
        unit: this.getUnitByType(type)
      };
      
      let chartData = result.data || [];
      
      // 对日期进行格式化处理
      if (chartData && chartData.length > 0) {
        chartData = chartData.map((item: any) => {
          if (type === 'bloodPressure') {
            return {
              ...item,
              date: this.formatDate(item.date),
              systolic: Number(item.systolic) || 0,
              diastolic: Number(item.diastolic) || 0
            };
          } else if (type === 'bloodSugar') {
            return {
              ...item,
              date: this.formatDate(item.date),
              value: Number(item.value) || 0
            };
          } else {
            return {
              ...item,
              date: this.formatDate(item.date),
              value: Number(item.value) || 0
            };
          }
        });

        // 创建图表
        this.createChart(chartData);
      }
      
      // 设置健康提示
      const healthTip = this.getHealthTip(type, stats);
      
      this.setData({
        stats,
        chartData,
        healthTip
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
    if (!stats || !stats.average || stats.average === '--') {
      return '保持规律测量，关注健康变化趋势';
    }

    const avgValue = parseFloat(stats.average);
    
    switch (type) {
      case 'bloodPressure':
        if (avgValue > 140) {
          return '您的平均血压偏高，请注意控制饮食和运动';
        } else if (avgValue < 90) {
          return '您的平均血压偏低，请注意补充营养';
        }
        return '您的血压控制良好，请继续保持';
        
      case 'bloodSugar':
        if (avgValue > 7.0) {
          return '您的平均血糖偏高，建议控制碳水摄入，规律运动';
        } else if (avgValue < 3.9) {
          return '您的平均血糖偏低，请注意及时补充糖分';
        }
        return '您的血糖控制在理想范围，请继续保持良好的生活习惯';
        
      case 'weight':
        return '保持健康的体重对身体很重要';
        
      case 'heartRate':
        if (avgValue > 100) {
          return '您的平均心率偏快，建议放松心情，适当运动';
        } else if (avgValue < 60) {
          return '您的平均心率偏慢，建议咨询医生';
        }
        return '您的心率在正常范围内，请继续保持';
        
      default:
        return '保持规律测量，关注健康变化趋势';
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
  },

  // 格式化日期的辅助函数
  formatDate(dateStr: string): string {
    try {
      // 如果日期已经是 YYYY-MM-DD 格式则直接返回
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
      }
      
      // 否则尝试解析并格式化
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch (e) {
      console.error('日期格式化失败:', e);
      return dateStr; // 出错时返回原始字符串
    }
  },
});
