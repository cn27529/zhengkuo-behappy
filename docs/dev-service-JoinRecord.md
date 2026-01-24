# 參加記錄服務開發規劃

## 1. 資料庫模型設計

### 1.1 主表：joinRecordDB

```sql
CREATE TABLE joinRecordDB (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  registrationId INTEGER NOT NULL,           -- 關聯祈福登記表ID
  activityId INTEGER NOT NULL,           -- 關聯活動ID
  registeredAt DATETIME NOT NULL,            -- 登記時間
  registeredBy VARCHAR(100) NOT NULL,        -- 登記人
  state VARCHAR(20) DEFAULT 'confirmed',     -- 狀態: confirmed/pending/canceled
  items JSON NOT NULL,                       -- 參加項目詳細資料
  totalAmount DECIMAL(10,2) NOT NULL,        -- 總金額
  discountAmount DECIMAL(10,2) DEFAULT 0,    -- 折扣金額
  finalAmount DECIMAL(10,2) NOT NULL,        -- 最終金額
  paidAmount DECIMAL(10,2) DEFAULT 0,        -- 已付金額
  needReceipt BOOLEAN DEFAULT false,         -- 需要收據
  receiptNumber VARCHAR(50),                 -- 收據號碼
  receiptIssued BOOLEAN DEFAULT false,       -- 收據已開立
  receiptIssuedAt DATETIME,                  -- 收據開立時間
  receiptIssuedBy VARCHAR(100),              -- 收據開立者
  accountingState VARCHAR(20) DEFAULT 'pending', -- 會計狀態: pending/reconciled
  accountingDate DATETIME,                   -- 沖帳日期
  accountingBy VARCHAR(100),                 -- 沖帳者
  accountingNotes TEXT,                      -- 沖帳備註
  paymentState VARCHAR(20) DEFAULT 'unpaid', -- 付款狀態: paid/partial/unpaid/waived
  paymentMethod VARCHAR(20),                 -- 付款方式: cash/transfer
  paymentDate DATETIME,                      -- 付款日期
  paymentNotes TEXT,                         -- 付款備註
  notes TEXT,                                -- 備註
  createdAt DATETIME NOT NULL,               -- 建立時間
  createdBy VARCHAR(100) NOT NULL,           -- 建立者
  updatedAt DATETIME NOT NULL,               -- 更新時間
  updatedBy VARCHAR(100)                     -- 更新者
);
```

### 1.2 items JSON 結構

```json
[
  {
    "type": "chaodu",
    "label": "超度/超薦",
    "price": 1000,
    "quantity": 1,
    "subtotal": 1000,
    "source": "salvation.ancestors",
    "sourceData": [
      {
        "id": 1,
        "surname": "王府",
        "notes": "歷代祖先"
      }
    ]
  },
  {
    "type": "diandeng",
    "label": "點燈",
    "price": 600,
    "quantity": 2,
    "subtotal": 1200,
    "source": "blessing.persons",
    "lampType": "guangming",
    "lampTypeLabel": "光明燈",
    "sourceData": [...]
  }
]
```

## 2. Service 實現規劃

### 2.1 基礎結構

參考 `monthlyDonateService.js` 的架構：

```javascript
export class JoinRecordService {
  constructor() {
    this.serviceName = "JoinRecordService";
    this.base = baseService;
    this.endpoint = `${this.base.apiBaseUrl}${this.base.apiEndpoints.itemsJoinRecord}`;
  }
}
```

### 2.2 核心 CRUD 方法

#### 2.2.1 創建參加記錄

```javascript
async createJoinRecord(recordData) {
  const processedData = {
    ...recordData,
    joinRecordId: await generateGitHashBrowser(),
    createdAt: DateUtils.getCurrentISOTime(),
    updatedAt: DateUtils.getCurrentISOTime()
  };

  // Mock/Directus 模式處理
  // 錯誤處理
  // 日誌記錄
}
```

#### 2.2.2 查詢方法

```javascript
async getAllJoinRecords(params = {})
async getJoinRecordById(recordId)
async getJoinRecordsByRegistrationId(registrationId)
async getJoinRecordsByActivityId(activityId)
async getJoinRecordsByState(state)
async getJoinRecordsByDateRange(startDate, endDate)
```

#### 2.2.3 更新方法

```javascript
async updateJoinRecord(recordId, updateData)
async updatePaymentStatus(recordId, paymentData)
async updateAccountingStatus(recordId, accountingData)
async issueReceipt(recordId, receiptData)
```

#### 2.2.4 統計方法

```javascript
async getJoinRecordStats()
async getActivityStats(activityId)
async getPaymentStats()
async getReceiptStats()
```

### 2.3 業務邏輯方法

#### 2.3.1 收據管理

```javascript
generateReceiptNumber()
async issueReceipt(recordId)
async cancelReceipt(recordId)
```

#### 2.3.2 付款管理

```javascript
async recordPayment(recordId, paymentData)
async refundPayment(recordId, refundData)
```

#### 2.3.3 會計管理

```javascript
async reconcileAccounting(recordId, accountingData)
async generateAccountingReport(dateRange)
```

## 3. 實現步驟

### 步驟 1: 建立基礎 Service 結構

- [ ] 建立 JoinRecordService 類別
- [ ] 設定 endpoint 和基礎配置
- [ ] 實現 Mock 模式支援

### 步驟 2: 實現核心 CRUD

- [ ] createJoinRecord - 創建參加記錄
- [ ] getAllJoinRecords - 獲取所有記錄
- [ ] getJoinRecordById - 根據ID獲取記錄
- [ ] updateJoinRecord - 更新記錄
- [ ] deleteJoinRecord - 刪除記錄

### 步驟 3: 實現查詢方法

- [ ] getJoinRecordsByRegistrationId
- [ ] getJoinRecordsByActivityId
- [ ] getJoinRecordsByState
- [ ] getJoinRecordsByDateRange

### 步驟 4: 實現業務邏輯

- [ ] 收據管理功能
- [ ] 付款管理功能
- [ ] 會計管理功能
- [ ] 統計報表功能

### 步驟 5: 錯誤處理和日誌

- [ ] handleJoinRecordError 方法
- [ ] 完整的日誌記錄
- [ ] 模式切換支援

### 步驟 6: 測試和優化

- [ ] Mock 資料測試
- [ ] Directus 整合測試
- [ ] 效能優化
- [ ] 錯誤處理測試

## 4. 資料流程

### 4.1 創建流程

1. 前端收集選擇的活動項目
2. Store 整理資料並計算金額
3. Service 處理資料並呼叫 API
4. 後端驗證並儲存到資料庫
5. 返回結果給前端

### 4.2 查詢流程

1. 前端發起查詢請求
2. Service 構建查詢參數
3. 後端執行查詢並返回資料
4. 前端更新 UI 顯示

### 4.3 更新流程

1. 前端修改資料
2. Service 驗證並發送更新請求
3. 後端更新資料庫
4. 返回更新結果

## 5. 注意事項

### 5.1 資料一致性

- 確保 registrationId 存在
- 驗證活動項目的有效性
- 金額計算的準確性

### 5.2 安全性

- 輸入資料驗證
- 權限檢查
- SQL 注入防護

### 5.3 效能考量

- 分頁查詢大量資料
- 索引優化
- 快取策略

### 5.4 錯誤處理

- 網路錯誤處理
- 資料驗證錯誤
- 業務邏輯錯誤

## 6. 後續擴展

### 6.1 報表功能

- 活動參與統計
- 收入統計報表
- 會計對帳報表

### 6.2 通知功能

- 付款提醒
- 收據開立通知
- 活動提醒

### 6.3 整合功能

- 與其他系統整合
- 匯出功能
- 批次處理功能
