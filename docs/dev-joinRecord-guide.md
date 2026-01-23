# 參加記錄功能開發指南

## 功能概述

「參加記錄」是寺廟管理系統中的核心功能，用於記錄信眾參加各種宗教活動的詳細資訊，包括超度、消災、點燈等項目的選擇、費用計算、收據開立及帳務處理。

## 業務流程

### 主要使用情境
1. **選擇祈福登記表**: 寺廟操作者從已提交的祈福登記表中選擇特定信眾的資料
2. **活動項目選擇**: 根據信眾需求選擇參加的活動項目（超度、消災、點燈等）
3. **費用計算**: 系統自動計算各項目費用並統計總金額
4. **記錄保存**: 保存參加記錄，包含所有選擇項目和費用資訊
5. **收據開立**: 根據需要開立收據給信眾
6. **帳務處理**: 後續與會計系統進行帳務串接或沖帳

## 資料結構

### 參加記錄 (Participation Record)
```json
{
  "id": 1,
  "registrationId": 1,           // 對應的祈福登記表ID
  "activityId": "w4x5y6z",       // 活動ID
  "registeredAt": "2025-01-16T09:00:00.000Z",
  "registeredBy": "王大明",       // 登記者
  "state": "confirmed",          // 狀態: confirmed/pending/completed
  "items": [...],                // 參加項目清單
  "totalAmount": 2200,           // 總金額
  "discountAmount": 200,         // 折扣金額
  "finalAmount": 2000,           // 最終金額
  "paidAmount": 2000,            // 已付金額
  "needReceipt": true,           // 是否需要收據
  "receiptNumber": "R2025010001", // 收據號碼
  "paymentState": "paid",        // 付款狀態
  "accountingState": "reconciled" // 會計狀態
}
```

### 參加項目 (Participation Item)
```json
{
  "type": "chaodu",              // 項目類型
  "label": "超度/超薦",           // 項目名稱
  "price": 1000,                 // 單價
  "quantity": 1,                 // 數量
  "subtotal": 1000,              // 小計
  "source": "salvation.ancestors", // 資料來源
  "sourceData": [...]            // 具體選擇的人員/祖先資料
}
```

## 活動項目類型

系統支援以下活動項目：

| 項目代碼 | 項目名稱 | 單價 | 資料來源 | 說明 |
|---------|---------|------|----------|------|
| chaodu | 超度/超薦 | 1000 | salvation.ancestors | 祖先超度 |
| survivors | 陽上人 | 0 | salvation.survivors | 陽上人登記 |
| qifu | 消災祈福 | 300 | blessing.persons | 消災祈福 |
| diandeng | 點燈 | 600 | blessing.persons | 點燈祈福 |
| xiaozai | 固定消災 | 100 | blessing.persons | 固定消災 |
| pudu | 中元普度 | 1200 | blessing.persons | 中元普度法會 |

## 技術架構

### 前端組件結構
```
JoinRecord.vue (主要視圖)
├── 左側面板 (70%)
│   ├── 已選擇登記表資訊
│   ├── 活動項目選擇區
│   └── 操作按鈕
└── 右側面板 (30%)
    ├── 查詢區
    ├── 登記表列表
    └── 已保存記錄
```

### 狀態管理 (Pinia Store)
- **joinRecordStore.js**: 管理參加記錄的所有狀態和業務邏輯
  - `activityConfigs`: 活動項目配置
  - `selections`: 當前選擇狀態
  - `selectedRegistration`: 已選擇的登記表
  - `totalAmount`: 計算總金額

### 服務層
- **joinRecordService.js**: 處理參加記錄相關的API調用
  - `saveRecord()`: 保存參加記錄
  - 支援多種模式：mock/backend/directus

## 核心功能實現

### 1. 登記表選擇
- 從右側列表選擇祈福登記表
- 支援姓名、手機、電話、地址搜尋
- 顯示登記表基本資訊（聯絡人、祖先數量、消災人數等）

### 2. 活動項目選擇
- 根據登記表資料動態顯示可選項目
- 支援單項選擇和全選功能
- 即時計算費用並顯示統計

### 3. 費用計算
- 自動計算各項目小計
- 支援折扣功能
- 浮動顯示總金額統計

### 4. 記錄保存
- 驗證必要欄位
- 生成完整的參加記錄資料
- 支援收據開立和帳務處理

## 用戶介面特色

### 響應式設計
- 桌面版：左右分欄佈局 (70%/30%)
- 平板版：垂直堆疊佈局
- 手機版：單欄顯示，活動項目改為單列

### 浮動金額統計
- 固定在頁面右下角
- 即時顯示選擇項目和總金額
- 支援多種位置配置

### 互動體驗
- 點擊活動標題可全選/取消全選
- 選擇狀態即時反饋
- 載入狀態提示

## 搜尋功能

支援以下欄位的模糊搜尋：
- 聯絡人姓名
- 手機號碼
- 電話號碼
- 地址
- 人員姓名
- 生肖
- 備註

## 資料驗證

### 必要檢查
- 必須選擇祈福登記表
- 至少選擇一個活動項目
- 金額計算正確性

### 業務規則
- 超度項目僅在有祖先資料時顯示
- 陽上人項目價格為0（免費）
- 各項目根據對應的人員資料動態生成

## 開發注意事項

### 資料同步
- Store狀態與UI保持同步
- 選擇變更時即時更新金額
- 重置功能清空所有選擇

### 效能考量
- 大量資料時使用虛擬滾動
- 搜尋功能防抖處理
- 適當的資料快取策略

### 錯誤處理
- 網路請求失敗處理
- 資料格式驗證
- 用戶友好的錯誤提示

## 未來擴展

### 計劃功能
- 批量處理多筆記錄
- 更多付款方式支援
- 詳細的報表功能
- 與會計系統深度整合

### 技術優化
- 更好的快取策略
- 離線功能支援
- 更豐富的統計圖表
- 行動端專用介面

## 相關檔案

### 核心檔案
- `./client/src/views/JoinRecord.vue` - 主要視圖組件
- `./client/src/stores/joinRecordStore.js` - 狀態管理
- `./client/src/services/joinRecordService.js` - 服務層
- `./client/src/data/mock_participation_records.json` - 模擬資料

### 配置檔案
- `./client/src/router/index.js` - 路由配置
- `./client/src/stores/menu.js` - 選單配置

### 文件
- `./docs/user-story-參加記錄.md` - 用戶故事
- `./docs/dev-joinRecord-guide.md` - 本開發指南
