# 活動參加記錄查詢功能開發指南

## 概述

本功能實現了"活動參加記錄查詢"，允許用戶查詢和管理已提交的活動參加記錄。

## 新增檔案

### 1. JoinRecordList.vue

- **路徑**: `client/src/views/JoinRecordList.vue`
- **功能**: 活動參加記錄查詢頁面
- **特色**:
  - 支援多條件查詢（狀態、項目類型、關鍵字）
  - 響應式設計，支援手機和桌面設備
  - 分頁功能（桌面版）
  - 調試信息顯示（開發模式）
  - 列印和刪除操作（預留接口）

### 2. joinRecordQueryStore.js

- **路徑**: `client/src/stores/joinRecordQueryStore.js`
- **功能**: 參加記錄查詢的 Pinia store
- **特色**:
  - 支援 Mock 和 Directus 模式
  - 智能過濾邏輯
  - 分頁狀態管理
  - 響應式狀態更新

## 修改檔案

### 1. 路由配置

- **檔案**: `client/src/router/index.js`
- **新增路由**: `/join-record-list`
- **包含**: 路由守衛和頁面狀態清理

### 2. 選單配置

- **檔案**: `client/src/stores/menu.js`
- **新增選單項**: "參加記錄查詢"
- **圖標**: 🔍
- **順序**: 10

## 查詢功能

### 查詢條件

1. **通用搜尋**: 支援登記ID、姓名、項目等關鍵字搜尋
2. **狀態篩選**:
   - 全部狀態
   - 已確認 (confirmed)
   - 待處理 (pending)
   - 已取消 (cancelled)
3. **項目類型篩選**:
   - 全部項目
   - 超度/超薦 (chaodu)
   - 點燈 (diandeng)
   - 消災祈福 (qifu)
   - 固定消災 (xiaozai)
   - 陽上人 (survivors)
   - 中元普度 (pudu)

### 過濾邏輯

- **狀態過濾**: 精確匹配記錄的 `state` 欄位
- **項目過濾**: 檢查 `items` 陣列中的 `type` 欄位
- **關鍵字搜尋**: 模糊匹配以下欄位：
  - registrationId
  - items[].label
  - items[].sourceData[].name
  - items[].sourceData[].surname
  - notes

## 資料結構

### 參加記錄格式

```json
{
  "id": 4,
  "registrationId": 199,
  "activityId": -1,
  "state": "confirmed",
  "items": [
    {
      "type": "diandeng",
      "label": "點燈",
      "price": 600,
      "quantity": 2,
      "subtotal": 1200,
      "source": "blessing.persons",
      "sourceData": [...]
    }
  ],
  "totalAmount": 1400,
  "finalAmount": 1400,
  "createdAt": "2026-01-24T06:09:42.037Z"
}
```

## 響應式設計

### 桌面版

- 完整的表格顯示
- 分頁控制器
- 多欄位顯示

### 手機版

- 簡化的表格顯示
- 無分頁（顯示全部）
- 優化的觸控操作

## 調試功能

開發模式下顯示調試信息：

- searchResults.length
- paginatedResults.length
- hasSearched
- isLoading
- currentPage / pageSize
- isMobile
- stateFilter / itemsFilter

## 預留功能

### 列印功能

- 按鈕已預留
- 目前顯示提示信息
- 可在後續階段實現

### 刪除功能

- 按鈕已預留
- 包含確認對話框
- 目前顯示提示信息
- 可在後續階段實現

## 使用方式

1. **訪問頁面**: 導航到 "參加記錄查詢" 選單項
2. **設定查詢條件**:
   - 輸入關鍵字（可選）
   - 選擇狀態篩選（可選）
   - 選擇項目類型篩選（可選）
3. **執行查詢**: 點擊 "查詢" 按鈕
4. **查看結果**: 瀏覽查詢結果列表
5. **分頁導航**: 使用分頁控制器（桌面版）

## 技術特色

### storeToRefs 使用

- 正確使用 `storeToRefs` 保持響應性
- 避免解構賦值導致的響應性丟失

### 分頁實現

- 桌面版：完整分頁功能
- 手機版：顯示全部資料
- 智能設備檢測

### 錯誤處理

- 完善的錯誤提示
- 載入狀態顯示
- 空結果處理

### 性能優化

- 計算屬性緩存
- 條件渲染
- 智能過濾

## 後續開發建議

1. **實現列印功能**: 整合現有的列印模組
2. **實現刪除功能**: 添加後端 API 調用
3. **添加匯出功能**: Excel/PDF 匯出
4. **優化搜尋**: 添加高級搜尋選項
5. **添加統計**: 顯示金額統計和數量統計

## 測試建議

1. **功能測試**: 測試各種查詢條件組合
2. **響應式測試**: 在不同設備尺寸下測試
3. **性能測試**: 測試大量資料的載入和過濾
4. **錯誤測試**: 測試網路錯誤和資料錯誤情況
