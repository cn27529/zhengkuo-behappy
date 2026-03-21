# 文檔服務器

## 概述說明

前後端分離的文檔瀏覽系統，使用 Vue.js 前端 + Express 後端，支援即時搜尋功能。

**改版重點**：

- 從後端模版渲染改為前後端分離架構
- 使用 Vue 3 CDN 實現前端互動，無需打包工具
- 啟動時自動掃描 markdown 生成靜態 JSON 索引
- 前端即時過濾搜尋，無需後端查詢，提升使用體驗
- 提取文檔標題和「概述說明」區塊，方便快速定位文件
- 關鍵字高亮顯示，解決文檔多時難以查找的問題從後端模版渲染改為前後端分離架構，使用 Vue 前端讀取靜態 JSON 實現即時搜尋功能。

## 架構設計

- **前端**：Vue 3 CDN + 靜態 JSON 數據
- **後端**：Express.js 提供文檔查看服務
- **數據生成**：啟動時自動掃描 markdown 生成 `books.json`
- **搜尋功能**：前端即時過濾標題和概述內容

## 文件結構

```
docs/
├── *.md                    # 所有 markdown 文檔
├── generate-books.js       # 生成 books.json 腳本
├── docs-server.js          # 文檔服務器
├── public/
│   ├── books.json          # 自動生成的文檔索引
│   ├── index.html          # Vue 前端頁面
│   ├── document.html       # 文檔查看模版
│   └── styles.css          # 樣式表
```

## 核心腳本說明

### generate-books.js

自動掃描所有 `.md` 文件並生成 `books.json` 索引文件。

**功能**：

- 掃描 `docs/` 目錄下所有 markdown 文件
- 提取第一個 `#` 標題作為 `title`
- 提取 `## 概述說明` 區塊內容作為 `overview`
- 記錄檔案修改時間
- 按修改時間降序排列

**執行時機**：

- 每次 `npm start` 或 `npm run docs` 時自動執行
- 可手動執行：`node generate-books.js`

**輸出**：`public/books.json`

## 使用方式

### 啟動文檔服務器

```bash
npm run docs
```

服務器將在 http://127.0.0.1:3001 啟動

### 功能說明

1. **首頁**：顯示所有文檔列表，支援搜尋
2. **搜尋**：輸入關鍵字即時過濾標題、概述、檔名
3. **高亮顯示**：搜尋結果關鍵字會被標記
4. **文檔查看**：點擊任意文檔在線查看 markdown 渲染結果

## 技術實現

- **前端**：Vue 3 (CDN)、原生 CSS
- **後端**：Express.js
- **Markdown 解析**：marked
- **數據索引**：books.json (自動生成)

## books.json 結構

每次啟動時自動生成，包含：

- `title`：文檔第一個 `#` 標題
- `overview`：`## 概述說明` 區塊內容
- `filename`：檔案名稱
- `modifiedDate`：最後修改時間

## 路由端點

- `GET /` - 首頁（文檔列表 + 搜尋）
- `GET /doc/:filename` - 查看單個文檔
- `GET /static/*` - 靜態文件（CSS、books.json）

## 特色

- ✅ 前後端分離，易於維護
- ✅ 即時搜尋，無需後端查詢
- ✅ 關鍵字高亮顯示
- ✅ 自動提取標題和概述
- ✅ 響應式設計，支援手機瀏覽
- ✅ 啟動時自動更新索引

## 開發說明

### 添加新文檔

1. 在 `docs/` 目錄創建 `.md` 文件
2. 確保包含 `# 標題` 和 `## 概述說明`
3. 重啟服務器自動生成索引

### 修改樣式

編輯 `public/styles.css`，重新整理頁面即可看到效果

### 自定義搜尋邏輯

修改 `public/index.html` 中的 `filteredBooks` computed 屬性
