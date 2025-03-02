# 小艺医疗微信小程序

## 项目介绍

小艺医疗微信小程序是一款健康管理应用，帮助用户记录和管理个人健康数据，包括血压、血糖、体重和体温等指标。通过数据可视化和健康提醒功能，用户可以更好地了解自己的健康状况，养成良好的健康习惯。

## 功能特点

- **健康记录**：记录血压、血糖、体重、体温等健康数据
- **数据统计**：通过图表直观展示健康数据趋势
- **健康提醒**：设置定时提醒，帮助用户按时测量和记录健康数据
- **微信登录**：一键登录，无需繁琐注册

## 项目结构

```
xcx_xyyl/
├── miniprogram/             # 小程序源码
│   ├── pages/               # 页面文件
│   │   ├── auth/            # 登录认证页面
│   │   ├── index/           # 首页
│   │   ├── health-records/  # 健康记录相关页面
│   │   ├── health-statistics/ # 健康统计页面
│   │   ├── health-reminders/ # 健康提醒页面
│   │   └── user/            # 用户相关页面
│   ├── services/            # 服务层，API接口封装
│   ├── utils/               # 工具函数
│   ├── assets/              # 静态资源
│   └── ec-canvas/           # 图表组件
├── typings/                 # 类型定义文件
├── app.js                   # 小程序入口文件
├── app.json                 # 小程序配置文件
├── app.wxss                 # 全局样式文件
└── project.config.json      # 项目配置文件
```

## 开发环境

- 微信开发者工具
- Node.js
- TypeScript

## 安装和运行

1. 克隆项目到本地
2. 使用微信开发者工具打开项目
3. 在微信开发者工具中点击"编译"按钮

## API接口

小程序通过以下API接口与后端服务交互：

- 用户认证：`/api/auth/wx-login`
- 健康记录：`/api/health-records`
- 健康提醒：`/api/health-reminders`
- 用户信息：`/api/user/profile`

## 贡献指南

欢迎贡献代码或提出建议，请遵循以下步骤：

1. Fork 项目
2. 创建新分支 (`git checkout -b feature/your-feature`)
3. 提交更改 (`git commit -m 'Add some feature'`)
4. 推送到分支 (`git push origin feature/your-feature`)
5. 创建 Pull Request

## 许可证

MIT 