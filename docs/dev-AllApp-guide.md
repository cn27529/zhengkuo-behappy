# AllApp.vue 開發指南

## 概述

AllApp.vue 是一個服務入口總覽頁面，提供系統中所有服務的統一訪問入口。這個頁面採用卡片式佈局，每個服務都有自己的特色風格和顏色主題。

## 功能特點

### 🎨 視覺設計
- **漸層背景**: 使用紫色漸層背景營造專業感
- **卡片式佈局**: 每個服務都有獨立的卡片展示
- **響應式設計**: 支援桌面和移動設備
- **懸停效果**: 卡片懸停時有動畫效果

### 🏛️ 服務展示
包含以下服務的入口：

1. **前端主應用** (localhost:5173)
   - Vue.js 主要管理界面
   - 消災超度、每月贊助、活動管理功能

2. **Rust API 後端** (localhost:3000)
   - 高效能 Axum 後端服務
   - RESTful API 文檔

3. **Directus 後端** (localhost:8055)
   - 內容管理與數據管理界面
   - CMS 功能

4. **日誌服務器** (localhost:3002)
   - 系統日誌收集與監控
   - MongoDB 日誌分析

5. **文檔服務器** (localhost:3001)
   - 專案文檔與開發指南
   - Markdown 文檔瀏覽

6. **開發工具**
   - 內部路由到開發工具頁面
   - DevTools、測試腳本、Mock 數據

## 技術實現

### 組件結構
```vue
<template>
  <div class="all-app-container">
    <div class="header">...</div>
    <div class="services-grid">...</div>
    <div class="footer">...</div>
  </div>
</template>
```

### 樣式特色
- **服務卡片**: 每個服務都有獨特的顏色主題
  - 前端: 綠色 (#4CAF50)
  - Rust: 橘紅色 (#CE422B)
  - Directus: 紫色 (#6644FF)
  - 日誌: 橘色 (#FF9800)
  - 文檔: 藍色 (#2196F3)
  - 工具: 紫紅色 (#9C27B0)

- **動畫效果**: 
  - 卡片懸停上升效果
  - 按鈕縮放效果
  - 平滑過渡動畫

### 響應式設計
- 桌面: 3列網格佈局
- 平板: 2列網格佈局  
- 手機: 1列網格佈局

## 路由配置

### 路由設定
```javascript
{
  path: "/all-app", 
  title: "所有服務入口",
  name: "AllApp",
  component: () => import("../views/AllApp.vue") 
}
```

### 菜單配置
```javascript
{
  id: 0,
  name: "所有服務",
  path: "/all-app",
  icon: "🏛️",
  component: "AllApp",
  requiredAuth: false,  // 不需要登入認證
  order: 0,
  enabled: true,
  publish: true,
}
```

## 使用方式

### 訪問頁面
- 直接訪問: `http://localhost:5173/all-app`
- 通過菜單: 點擊左側菜單的"所有服務"

### 功能操作
1. **查看服務**: 每個卡片顯示服務的基本信息和特色功能
2. **訪問服務**: 點擊"訪問應用"按鈕跳轉到對應服務
3. **快速連結**: 底部提供常用文檔的快速連結

## 頁面結構

### 頭部區域
- 主標題: "🏛️ 正覺寺管理系統"
- 副標題: "所有服務入口總覽"

### 服務網格
- 6個服務卡片的網格佈局
- 每個卡片包含圖標、標題、描述、功能標籤、訪問按鈕

### 底部區域
- **系統架構**: 顯示技術架構流程
- **快速連結**: 提供重要文檔的直接連結

## 開發注意事項

### 無需認證
- 此頁面設定為 `requiredAuth: false`
- 任何人都可以訪問，方便開發和演示

### 外部連結
- 所有服務連結都使用 `target="_blank"` 在新視窗開啟
- 內部工具頁面使用 `router-link` 進行路由跳轉

### 維護更新
- 如果添加新服務，需要在 `services-grid` 中添加對應卡片
- 更新服務端口或地址時，需要同步更新連結
- 可以根據需要調整卡片的顏色主題和圖標

## 相關文件

- **組件文件**: `client/src/views/AllApp.vue`
- **路由配置**: `client/src/router/index.js`
- **菜單配置**: `client/src/stores/menu.js`
- **架構文檔**: `docs/architecture-overview.md`

## 未來擴展

可以考慮添加的功能：
- 服務狀態檢測（在線/離線）
- 服務健康檢查
- 使用統計信息
- 服務版本信息
- 快速搜索功能