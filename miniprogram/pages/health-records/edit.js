// 注意: 此文件是为了满足微信小程序的文件结构要求
// 实际代码在 edit.ts 文件中，会被编译到此文件
// 此文件仅作为占位符

Page({
  data: {
    isEdit: false,
    recordId: '',
    record: {
      measureTime: '',
      weight: undefined,
      systolicPressure: undefined,
      diastolicPressure: undefined,
      bloodSugar: undefined,
      heartRate: undefined,
      sleepHours: undefined,
      note: ''
    },
    today: '',
    loading: false
  },

  onLoad(options) {
    // TS 编译结果将替换此文件
  },

  fetchRecordData(id) {
    // TS 编译结果将替换此文件
  },

  onDateChange(e) {
    // TS 编译结果将替换此文件
  },

  onInputChange(e) {
    // TS 编译结果将替换此文件
  },

  validateForm() {
    // TS 编译结果将替换此文件
    return true;
  },

  onSave() {
    // TS 编译结果将替换此文件
  },

  onCancel() {
    // TS 编译结果将替换此文件
  }
});
