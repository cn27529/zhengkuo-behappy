# zk-client-rustaxum 分支

## 概述說明

項目實現的歷程記錄

## 手記

### 2026-03-05

格式化為相對時間或完整時間，1小時內顯示分鐘，1天內顯示小時，1-3天內顯示天數，超過則顯示完整時間

### 2026-02-26

佛字第 XXXX 號編碼，實現收據和感謝狀的唯一編號生成機制，確保在多使用者併發環境下不會產生重複編號。編號規則為年月4碼 + 流水號4碼，感謝狀額外加前綴 "A"。

### 2026-01-29

實現將indexedDB logentry 與資料庫做雙軌併行，可以由env環境變數中做設置

### 2026-01-28

活動設置更名為`活動管理`
文件更名 `docs/*`

### 2026-01-27

修復祖先資料驗證邏輯

調適菜單生產環境的控制，詳見
`docs/dev-menu-guide.md`

創建部署文件，完成自動化部署腳本，一鍵部署，詳見
`docs/deploy-netlify-guide.md`
`scripts/deploy-netlify.sh`

### 2026-01-21

建構 活動參加 `/join-record`

### 2025-12-16

活動管理上版netlify

### 2025-12-10

建構 活動管理 `/activity-list`

### 2025-12-05

完成 祈福登記、登記查詢

### 2025-11-23

建構 祈福登記 `/registration`

### 2025-11-18 完成查詢功能

建構 登記查詢 `/registration-list`

### 2025-10-20

使用ElementPlus套件

### 2025-10-19

完成 登入功能 `/login`

完成 登出功能 `/logout`

仪表板 `/dashboard` 只有頁面，不能互動

完成 祈福登記表 `/registration`

完成 列印祈福登記表 `/registration-print`

完成 netlify部署

https://zkapp.netlify.app

## 部署 netlify

部署設定詳見 `netlify.toml`

## 测试

账号 test01@example.com

用户名: 測試人員(test01)

密码: zk!123456
