# 參加記錄打印功能開發指南

## 概述說明

本文檔說明參加記錄打印功能的實現，包括 `JoinRecordPrint.vue` 組件的開發和 `JoinRecordList.vue` 中打印功能的整合。

## 功能特點

### 1. 打印頁面設計

- **簡約設計**: 參考 `RegistrationPrint.vue` 的設計模式，採用純粹的打印樣式
- **無多餘CSS**: 避免複雜的CSS影響打印品質，確保各種打印機的相容性
- **響應式設計**: 支援螢幕預覽和打印輸出兩種模式

### 2. 數據結構適配

- **聯絡人信息**: 顯示姓名、手機、電話、關係等基本信息
- **參加項目**: 展示項目名稱、數量、金額、地址等詳細信息
- **參加者資料**: 詳細列出每個項目的參加者姓名、生肖、備註等

### 3. 打印功能

- **瀏覽器原生打印**: 使用 `window.print()` 實現打印功能
- **PDF輸出**: 支援透過瀏覽器打印對話框輸出為PDF
- **圖片輸出**: 支援輸出為PNG圖片格式

## 文件結構

```
client/src/views/
├── JoinRecordPrint.vue     # 新建的打印頁面組件
├── JoinRecordList.vue      # 更新的列表頁面（新增打印功能）
└── RegistrationPrint.vue   # 參考的打印頁面模版
```

## 實現細節

### 1. JoinRecordPrint.vue 組件

#### 主要功能

- **數據載入**: 從 URL 參數和 sessionStorage 載入打印數據
- **頁面渲染**: 根據數據結構渲染打印內容
- **打印控制**: 提供返回和打印按鈕

#### 關鍵代碼片段

```javascript
// 載入打印數據
const loadPrintData = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const printId = urlParams.get("print_id");
  const storedData = sessionStorage.getItem(printId);
  printContent.value = JSON.parse(storedData);
};

// 打印處理
const handlePrint = () => {
  isPrinting.value = true;
  setTimeout(() => {
    window.print();
  }, 500);
};
```

#### 樣式設計

- **@media print**: 專門的打印樣式，隱藏控制按鈕，優化打印效果
- **@media screen**: 螢幕預覽樣式，提供良好的預覽體驗
- **響應式表格**: 自適應不同內容長度的表格設計

### 2. JoinRecordList.vue 更新

#### 打印功能整合

```javascript
const handlePrint = (item) => {
  const recordId = item.id;
  const printData = JSON.stringify(item);
  const isoStr = DateUtils.getCurrentISOTime();

  sessionStorage.setItem(printId, printData);

  router.push({
    path: "/join-record-print",
    query: {
      print_id: printId,
      print_data: printData,
      iso_str: isoStr,
    },
  });
};
```

#### 按鈕啟用

- 移除打印按鈕的 `disabled` 屬性
- 實現完整的打印流程

### 3. 路由配置

在 `router/index.js` 中新增路由：

```javascript
{
  path: "/join-record-print",
  title: "參加記錄打印",
  component: () => import("../views/JoinRecordPrint.vue"),
  meta: { requiresAuth: true },
}
```

## 數據流程

1. **用戶點擊打印**: 在 `JoinRecordList.vue` 中點擊打印按鈕
2. **數據準備**: 將記錄數據序列化並存儲到 sessionStorage
3. **路由跳轉**: 跳轉到 `/join-record-print` 頁面，攜帶打印ID
4. **數據載入**: `JoinRecordPrint.vue` 從 sessionStorage 載入數據
5. **頁面渲染**: 根據數據渲染打印頁面
6. **執行打印**: 用戶點擊打印按鈕執行打印操作

## 打印樣式優化

### 1. 頁面設置

- **紙張大小**: A4 (21cm x 29.7cm)
- **邊距**: 1cm
- **字體**: Microsoft JhengHei (微軟正黑體)

### 2. 表格設計

- **邊框**: 1pt 實線邊框
- **間距**: 適當的內邊距確保可讀性
- **對齊**: 文字居中，地址和備註靠左對齊

### 3. 分頁控制

- **避免分頁**: 使用 `page-break-inside: avoid` 避免表格被分頁切斷
- **內容分組**: 合理分組內容，確保相關信息在同一頁

## 使用方式

### 1. 基本打印流程

1. 進入「參加記錄查詢」頁面
2. 搜尋或瀏覽記錄列表
3. 點擊記錄右側的「🖨️」打印按鈕
4. 系統自動跳轉到打印預覽頁面
5. 檢查內容無誤後點擊「🖨️ 打印詳情」按鈕
6. 在瀏覽器打印對話框中選擇打印機或儲存為PDF

### 2. 返回操作

- 點擊「← 返回」按鈕回到記錄列表
- 系統會自動清理暫存的打印數據

## 技術特點

### 1. 數據安全

- 使用 sessionStorage 暫存打印數據
- 頁面離開時自動清理暫存數據
- 防止數據洩露和記憶體洩漏

### 2. 錯誤處理

- 完整的錯誤捕獲和用戶提示
- 數據格式驗證
- 載入失敗的回退機制

### 3. 性能優化

- 延遲載入組件
- 最小化CSS影響
- 高效的數據傳遞機制

## 擴展功能

### 1. 多格式輸出

- PDF下載
- Excel匯出
- 圖片輸出
- 純文字格式

### 2. 批量打印

- 支援選擇多筆記錄批量打印
- 自動分頁處理

### 3. 自定義樣式

- 可配置的打印樣式
- 企業標識和浮水印支援

## 注意事項

1. **瀏覽器相容性**: 確保在主流瀏覽器中測試打印功能
2. **打印機相容性**: 避免使用複雜的CSS效果，確保各種打印機都能正常輸出
3. **數據完整性**: 確保所有必要的數據都能正確顯示
4. **用戶體驗**: 提供清晰的操作指引和錯誤提示

## 維護建議

1. **定期測試**: 在不同瀏覽器和打印機上測試打印效果
2. **樣式更新**: 根據用戶反饋調整打印樣式
3. **功能擴展**: 根據需求添加新的輸出格式和功能
4. **性能監控**: 監控打印功能的使用情況和性能表現
