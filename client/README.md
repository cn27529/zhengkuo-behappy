
# zk-client-v0-13 版本
## 手記
2025-10-20

Ant Design Vue整合

https://antdv.com/components/overview

2025-10-19

完成 登入功能 /login

完成 登出功能 /logout

仪表板 /dashboard 只有頁面，不能互動

完成 消災超度登記表 /registration

完成 列印消災超度登記表 /print-registration

完成 netlify的部署計劃 詳見netlify.toml

https://zkapp.netlify.app

## user guide 

# 部署
## netlify
假设你的项目结构檔案建在這，其它都不用理

my-project/
├── backend/
├── frontend/
│   ├── package.json
│   ├── src/
│   └── dist/
├── netlify.toml
└── README.md

部署設定詳見netlify.toml

# 使用说明

将以上文件按照项目结构创建

在项目根目录下运行 npm install 安装依赖

运行 npm run dev 启动开发服务器

访问 http://localhost:3000 查看应用

功能特点
使用Vue 3 Composition API

使用Pinia进行状态管理

使用Vue Router进行路由管理

响应式设计，适配移动设备

表单验证和错误处理

模拟API调用

测试账号
用户名: admin

密码: password

这个Vue 3 + Vite项目结构更加现代化，易于扩展和维护，适合后续添加更多功能模块。