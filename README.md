# zhengkuo-behappy

寺廟管理系統 - 包含前端、雙後端、日誌服務器與文檔服務器

## 架構概覽

- **前端** (`/client`) - Vue.js 消災超度登記系統
- **Rust 後端** (`/rust-axum`) - 高效能 API 服務器
- **Node.js 後端** (`/server`) - Directus 資料串接 API
- **日誌服務器** (`/log-server`) - MongoDB 日誌收集服務
- **文檔服務器** (`/docs/docs-server.js`) - Markdown 文檔瀏覽系統

## 快速開始

### 完整開發環境

```bash
npm run dev:full
```

這會同時啟動：
- 前端開發服務器 (http://localhost:5173)
- Rust API 服務器 (http://localhost:3000)  
- 日誌服務器 (http://localhost:3002)

### 文檔服務器

```bash
npm run docs
```

文檔瀏覽界面：http://localhost:3001

## 上版

### 1. 切換到部署分支

git checkout zk-client-netlify

### 2. 重設為與 v?-?? 相同的分支內容

git reset --hard zk-client-rustaxum

### 3. 推送覆蓋遠端（⚠️ 小心使用）

git push origin zk-client-netlify --force

### 把分支移回 reset 前的 commit

git reset --hard 9ac12b1
這樣 zk-client-netlify 就會恢復成 reset 前的內容。
若遠端也被 force push 過，需要推回去
git push origin zk-client-netlify --force

## 日誌系統

### 檢查日誌服務器狀態
```bash
npm run check:logs
```

### 測試日誌系統
```bash
npm run test:logs
```

### 手動啟動日誌服務器
```bash
npm run start:logs
```

# axum-admin

https://github.com/orchid-admin/axum-admin/tree/main
https://github.com/lingdu1234/axum_admin?tab=readme-ov-file
https://docs.rs/axum-login/latest/axum_login/
