# 文檔服務器架構說明

## 概述

文檔服務器已重構，將 HTML 內容從主服務器文件中分離出來，採用模板化架構，類似於 `log-server/mongoDBLogger.js` 的結構。

## 文件結構

```
docs/
├── docs-server.js          # 主服務器文件
├── templates.js            # 模板引擎
├── public/                 # 靜態文件和模板目錄
│   ├── index.html         # 首頁模板
│   ├── document.html      # 文檔頁面模板
│   └── styles.css         # 樣式文件
├── *.md                   # Markdown 文檔文件
└── README-docs-server.md  # 本說明文件
```

## 主要改進

### 1. 模板分離
- **之前**: HTML 內容直接寫在 JavaScript 字符串中
- **現在**: HTML 模板存放在 `public/` 目錄中，通過模板引擎載入

### 2. 模板引擎
- 支援變數替換 `{{variable}}`
- 模板緩存機制
- 支援模板重新載入

### 3. API 化
- 提供 RESTful API 端點
- 前後端分離架構
- 支援 JSON 數據交換

## API 端點

### 頁面端點
- `GET /` - 首頁
- `GET /doc/:filename` - 查看文檔

### API 端點
- `GET /api/documents` - 獲取文檔列表
- `GET /api/document/:filename` - 獲取單個文檔內容
- `POST /api/reload-templates` - 重新載入模板緩存
- `GET /health` - 健康檢查

### 靜態文件
- `/static/*` - 靜態文件服務（CSS、圖片等）

## 模板語法

模板使用簡單的變數替換語法：

```html
<title>{{filename}} - 專案文檔</title>
<div class="content">{{content}}</div>
```

## 使用方式

### 啟動服務器
```bash
cd docs
node docs-server.js
```

### 開發模式
在開發過程中，如果修改了模板文件，可以通過以下方式重新載入：

```bash
curl -X POST http://localhost:3001/api/reload-templates
```

### 添加新模板
1. 在 `public/` 目錄中創建新的 HTML 文件
2. 使用 `{{variable}}` 語法定義變數
3. 在 `docs-server.js` 中使用 `templateEngine.render()` 渲染

## 模板引擎功能

### TemplateEngine 類
```javascript
const { templateEngine } = require("./templates");

// 渲染模板
const html = templateEngine.render("index.html", {
  title: "我的標題",
  content: "我的內容"
});

// 清除緩存
templateEngine.clearCache();

// 重新載入特定模板
templateEngine.reloadTemplate("index.html");
```

### 緩存機制
- 模板首次載入時會被緩存
- 提高後續渲染性能
- 支援手動清除緩存

## 響應式設計

CSS 樣式支援響應式設計：
- 桌面版：網格佈局，多欄顯示
- 平板版：適中的間距和字體
- 手機版：單欄佈局，優化觸控

## 錯誤處理

### 模板載入失敗
- 返回錯誤提示頁面
- 記錄詳細錯誤日誌

### 文檔不存在
- 返回 404 狀態碼
- 提供友好的錯誤頁面

### 服務器錯誤
- 統一的錯誤處理中間件
- JSON 格式的錯誤響應

## 性能優化

### 模板緩存
- 避免重複讀取文件
- 提高渲染速度

### 靜態文件服務
- 使用 Express 靜態文件中間件
- 支援瀏覽器緩存

### 文檔列表緩存
- 可考慮添加文檔列表緩存
- 監聽文件變化自動更新

## 擴展建議

### 1. 文檔搜索
```javascript
app.get("/api/search", (req, res) => {
  const { q } = req.query;
  // 實現全文搜索
});
```

### 2. 文檔分類
```javascript
// 支援文檔分類和標籤
const categories = extractCategories(files);
```

### 3. 實時更新
```javascript
// 使用 WebSocket 實現實時更新
const WebSocket = require('ws');
```

### 4. 文檔編輯
```javascript
// 添加在線編輯功能
app.post("/api/document/:filename", (req, res) => {
  // 保存文檔內容
});
```

## 與 log-server 的相似性

本架構參考了 `log-server/mongoDBLogger.js` 的設計：

1. **靜態文件分離**: 使用 `public/` 目錄存放 HTML 和 CSS
2. **模板化**: 將 HTML 內容從 JavaScript 中分離
3. **API 化**: 提供 RESTful API 端點
4. **錯誤處理**: 統一的錯誤處理機制
5. **健康檢查**: 提供服務狀態監控

## 總結

重構後的文檔服務器具有以下優勢：

- **可維護性**: HTML 和 JavaScript 分離，易於維護
- **可擴展性**: 模板化架構便於添加新功能
- **性能**: 模板緩存提高渲染性能
- **用戶體驗**: 響應式設計和友好的錯誤處理
- **開發體驗**: API 化架構便於前後端分離開發

這種架構為未來的功能擴展奠定了良好的基礎。