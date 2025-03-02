import { updateUserProfile, getUserProfile } from '../../../../services/user';

// 个人信息接口
interface PersonalInfo {
  avatarUrl: string;
  realName: string;
  gender: string;
  birthday: string;
  height: string;
  weight: string;
  phone: string;
  email: string;
  bloodType: string;
  allergies: string;
  chronicDiseases: string;
}

// 紧急联系人接口
interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
}

Page({
  data: {
    personalInfo: {
      avatarUrl: '',
      realName: '',
      gender: '',
      birthday: '',
      height: '',
      weight: '',
      phone: '',
      email: '',
      bloodType: '',
      allergies: '',
      chronicDiseases: ''
    } as PersonalInfo,
    emergencyContact: {
      name: '',
      relation: '',
      phone: ''
    } as EmergencyContact,
    bloodTypes: ['A型', 'B型', 'AB型', 'O型', '其他'],
    bloodTypeIndex: 0,
    currentDate: new Date().toISOString().split('T')[0] // 当前日期，格式为YYYY-MM-DD
  },

  onLoad() {
    this.loadUserProfile();
  },

  onShow() {
    // 页面显示时刷新数据
    this.loadUserProfile();
  },

  async loadUserProfile() {
    try {
      wx.showLoading({ title: '加载中' });
      
      // 从本地存储获取用户信息
      const storedInfo = wx.getStorageSync('personalInfo');
      const storedContact = wx.getStorageSync('emergencyContact');
      
      if (storedInfo) {
        this.setData({
          personalInfo: storedInfo
        });
        
        // 设置血型索引
        const index = this.data.bloodTypes.findIndex(type => type === storedInfo.bloodType);
        if (index >= 0) {
          this.setData({
            bloodTypeIndex: index
          });
        }
      } else {
        // 尝试从服务器获取用户信息
        try {
          const profileData = await getUserProfile();
          if (profileData) {
            this.setData({
              personalInfo: {
                ...this.data.personalInfo,
                ...profileData
              }
            });
            
            // 设置血型索引
            const index = this.data.bloodTypes.findIndex(type => type === profileData.bloodType);
            if (index >= 0) {
              this.setData({
                bloodTypeIndex: index
              });
            }
            
            // 存储到本地
            wx.setStorageSync('personalInfo', this.data.personalInfo);
          }
        } catch (error) {
          console.error('获取用户资料失败', error);
        }
      }
      
      // 加载紧急联系人
      if (storedContact) {
        this.setData({
          emergencyContact: storedContact
        });
      }
    } catch (error) {
      console.error('加载用户资料失败', error);
      wx.showToast({
        title: '加载用户资料失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  chooseAvatar() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        // 获取选择的图片临时路径
        const tempFilePath = res.tempFilePaths[0];
        
        // 更新头像
        this.setData({
          'personalInfo.avatarUrl': tempFilePath
        });
        
        // 上传图片到服务器的逻辑可以在保存时一并处理
      }
    });
  },

  onInputChange(e: any) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    
    this.setData({
      [`personalInfo.${field}`]: value
    });
  },

  selectGender(e: any) {
    const { gender } = e.currentTarget.dataset;
    
    this.setData({
      'personalInfo.gender': gender
    });
  },

  onBirthdayChange(e: any) {
    this.setData({
      'personalInfo.birthday': e.detail.value
    });
  },

  onBloodTypeChange(e: any) {
    const index = e.detail.value;
    
    this.setData({
      bloodTypeIndex: index,
      'personalInfo.bloodType': this.data.bloodTypes[index]
    });
  },

  onEmergencyInputChange(e: any) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    
    this.setData({
      [`emergencyContact.${field}`]: value
    });
  },

  async savePersonalInfo() {
    try {
      // 表单验证
      if (!this.data.personalInfo.realName) {
        wx.showToast({
          title: '请输入姓名',
          icon: 'none'
        });
        return;
      }
      
      wx.showLoading({ title: '保存中' });
      
      // 保存到本地存储
      wx.setStorageSync('personalInfo', this.data.personalInfo);
      wx.setStorageSync('emergencyContact', this.data.emergencyContact);
      
      // 调用API保存到服务器
      try {
        await updateUserProfile({
          ...this.data.personalInfo,
          emergencyContact: this.data.emergencyContact
        });
        
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        });
        
        // 返回上一页
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } catch (error) {
        console.error('保存用户资料失败', error);
        wx.showToast({
          title: '已保存到本地，但同步到服务器失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('保存用户资料失败', error);
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  }
});
