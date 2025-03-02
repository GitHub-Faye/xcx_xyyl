<think>我需要为小艺医疗系统的微信小程序版本创建一个设计和流程文档。这个微信小程序需要实现与Web版相同的健康数据统计和趋势图表功能，但使用微信用户登录系统。

基于提供的信息，我可以看到：
1. 微信小程序 (xcx_xyyl) 已经有基本的项目结构
2. Web版 (frontend_xyyl) 已经实现了健康数据统计和趋势图表功能
3. 微信小程序需要使用微信用户进行登录，这与Web版的登录方式不同

我需要设计的内容包括：
1. 微信小程序的架构
2. 用户认证流程（微信登录）
3. 数据同步机制
4. UI/UX设计
5. 健康数据统计和趋势图表的实现方式
6. 开发和部署流程

我将创建一个全面的Markdown文档，作为后续开发的指南。</think># 小艺医疗微信小程序设计文档

## 项目概述

小艺医疗微信小程序是小艺医疗系统的移动端延伸，旨在通过微信平台提供个人健康数据记录和分析服务。该小程序将复用现有Web版的健康数据统计与趋势图表功能，同时利用微信生态提供更便捷的用户体验。

## 技术架构

### 开发框架
- **微信小程序原生框架**：基于WXML、WXSS、JS/TS
- **TypeScript**：提供类型安全和开发效率
- **微信云开发**：可选，用于简化后端开发

### 数据可视化
- **echarts-for-weixin**：图表组件，用于展示健康数据趋势
- **wxCharts**：备选图表库

### 网络请求
- **wx.request API**：与后端API通信
- **Promise封装**：简化异步请求处理

## 核心功能模块

### 1. 微信用户认证

#### 认证流程
1. 用户授权获取微信信息
2. 将微信用户信息发送至后端
3. 后端生成/匹配用户账号并返回JWT令牌
4. 小程序存储令牌用于后续请求

#### 关键技术点
- **wx.login**：获取用户临时登录凭证code
- **wx.getUserInfo**：获取用户信息（头像、昵称等）
- **JWT令牌管理**：存储、刷新、验证

### 2. 健康数据管理

#### 数据记录
- 体重记录（kg）
- 血压记录（mmHg，包括收缩压和舒张压）
- 心率记录（次/分钟）
- 记录时间和备注

#### 核心功能
- 一键添加当前数据
- 历史记录查询与筛选
- 数据编辑与删除

### 3. 健康数据统计与趋势分析

#### 统计指标
- 平均值计算（体重、血压、心率）
- 最大/最小值记录
- 数据变化趋势

#### 图表展示
- 日/周/月/年趋势图表
- 多指标对比分析
- 自定义时间区间分析

## 页面设计

### 1. 欢迎页
- 微信快捷登录按钮
- 产品功能简介
- 隐私政策说明

### 2. 首页仪表盘
- 用户概览信息
- 最近健康数据摘要
- 快捷记录入口
- 功能模块入口

### 3. 数据记录页
- 数据输入表单
- 快速预设选项
- 历史记录显示
- 日期筛选器

### 4. 数据统计页
- 图表切换标签页（体重/血压/心率）
- 时间范围选择器
- 统计数据卡片
- 趋势图表展示区域

### 5. 个人中心
- 用户信息展示
- 个人健康目标设置
- 历史记录管理
- 系统设置

## 微信小程序与Web版集成

### 数据同步机制
1. 使用相同的后端API
2. JWT令牌身份验证
3. 数据格式统一处理

### API适配
1. 微信用户到系统用户的映射
2. 请求头适配（Authorization）
3. 响应数据处理

## 开发流程

### 1. 初始化与配置
- 创建小程序项目
- 配置TypeScript
- 设置项目结构

### 2. 用户认证实现
- 微信登录接口对接
- JWT管理服务
- 用户状态维护

### 3. 页面与组件开发
- 页面布局设计
- 表单组件开发
- 图表组件集成

### 4. API接口对接
- 封装请求模块
- 实现健康数据CRUD
- 对接统计分析接口

### 5. 测试与优化
- 功能测试
- 性能优化
- UI/UX优化

## 后端API调整

### 新增API
1. **微信用户登录**
   ```
   POST /api/auth/wx-login/
   请求体: {code: string, userInfo: WxUserInfo}
   响应: {token: string, refresh_token: string, user: UserInfo}
   ```

2. **微信用户信息更新**
   ```
   PUT /api/users/wx-profile/
   请求体: {nickName?: string, avatarUrl?: string, ...}
   响应: {success: boolean, user: UserInfo}
   ```

### 现有API复用
- 健康记录CRUD API
- 健康统计API

## 技术难点与解决方案

### 1. 微信登录与系统用户关联
**解决方案**：使用微信OpenID作为唯一标识，后端自动创建或关联系统用户

### 2. 图表组件适配
**解决方案**：使用echarts-for-weixin重新实现图表，保持数据结构一致

### 3. 小程序网络请求限制
**解决方案**：实现请求队列管理，避免并发请求过多

### 4. 离线数据支持
**解决方案**：本地存储最近数据，网络恢复后自动同步

## 项目计划

### 阶段一：基础框架（1周）
- 项目初始化配置
- 微信登录实现
- 全局状态管理

### 阶段二：核心功能（2周）
- 健康数据录入页面
- 历史记录管理
- 基本统计功能

### 阶段三：图表实现（1周）
- 集成图表组件
- 实现趋势分析
- 时间区间筛选

### 阶段四：完善与测试（1周）
- 用户体验优化
- 错误处理完善
- 全面测试

## 部署与发布

### 测试发布
- 内部测试版本
- 开发者工具调试

### 正式发布
- 小程序审核准备
- 提交微信审核
- 正式上线

## 附录

### 关键技术参考
- [微信小程序开发文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [ECharts for 微信小程序](https://github.com/ecomfe/echarts-for-weixin)
- [微信小程序登录流程](https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/login.html)

### 数据结构参考
```typescript
// 健康记录数据结构
interface HealthRecord {
  id?: number;
  user?: number;
  weight?: number;
  systolic_pressure?: number;
  diastolic_pressure?: number;
  heart_rate?: number;
  record_time: string;
  notes?: string;
}

// 统计数据结构
interface HealthStatistics {
  weight_avg: number;
  systolic_pressure_avg: number;
  diastolic_pressure_avg: number;
  heart_rate_avg: number;
  weight_trend: Array<{date: string, value: number}>;
  blood_pressure_trend: Array<{date: string, systolic: number, diastolic: number}>;
  heart_rate_trend: Array<{date: string, value: number}>;
}
```
