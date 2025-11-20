
# zk-client-v0-13 版本
## 手記
2025-10-20

使用ElementPlus套件

2025-10-19

完成 登入功能 /login

完成 登出功能 /logout

仪表板 /dashboard 只有頁面，不能互動

完成 消災超度登記表 /registration

完成 列印消災超度登記表 /print-registration

完成 netlify的部署計劃 詳見netlify.toml

https://zkapp.netlify.app

2025-11-18
完成查詢功能


## user guide 
請評估多張表單的需求的可行性，registration.js是報名表單的 Pinia store，管理整個消災超度登記表的狀態與操作。
使用者想加一個按鈕(增加表單)，可以填寫第2張表單。我的想法是這樣，將目前在填的表單在使用者按了(增加表單)之後，能將現有表單的registrationForm物件做(表單陣列formArray)存放起來，此時(表單陣列formArray)中會有1筆資料，表單頁面上能出現(表單張數)表示第n張...以此類推，表單陣列數字暫定在class="form-header"位置，這時頁面填寫的是第2張，這時除了會有(表單張數)，當使用者點擊(表單張數)如選擇第1張時這個時候頁面上就會返回(表單陣列formArray[0])的數據，反之使用者點擊(表單張數)如選擇第2張時這個時候頁面上就會返回(表單陣列formArray[1])的數據，使用者按了(增加表單)之後就再加一筆，如此規畫，分析看看以現在的registration.js是否可行？如做資料檢核 表單提交 多表單之間切換 會不會有問題，有沒有缺漏什麼考量的．

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

# 共用組件
src/components/registration/
├── BlessingSection.vue      # 消災祈福區塊
├── SalvationSection.vue     # 超度祈福區塊
└── PersonForm.vue          # 共用的人員表單組件

# 使用说明

将以上文件按照项目结构创建

在项目根目录下运行 npm install 安装依赖

运行 npm run dev 启动开发服务器

访问 http://localhost:8055 查看应用

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