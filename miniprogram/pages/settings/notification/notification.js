// 注意: 此文件是为了满足微信小程序的文件结构要求
// 实际代码在 notification.ts 文件中，会被编译到此文件
// 此文件仅作为占位符

Page({
  data: {
    notificationSettings: {
      healthReminders: true,
      abnormalDataAlerts: true,
      healthReports: true,
      newsAndActivities: false,
      inAppNotifications: true,
      wechatServiceNotifications: true,
      smsNotifications: false,
      doNotDisturb: false,
      doNotDisturbStart: '22:00',
      doNotDisturbEnd: '08:00'
    }
  },

  onLoad() {
    // TS 编译结果将替换此文件
  },

  onShow() {
    // TS 编译结果将替换此文件
  },

  onSwitchChange() {
    // TS 编译结果将替换此文件
  },

  onTimeChange() {
    // TS 编译结果将替换此文件
  },

  saveNotificationSettings() {
    // TS 编译结果将替换此文件
  }
});
