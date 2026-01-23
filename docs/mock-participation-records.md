# 參加記錄資料結構說明

## 概述

參加記錄 (Participation Records) 是寺廟管理系統中記錄信眾參加各種宗教活動的核心資料結構，包含活動項目選擇、費用計算、付款狀態、收據開立及會計處理等完整資訊。

## 主要資料結構

### ParticipationRecord (參加記錄)

```json
{
  "id": 1,                                    // 記錄唯一識別碼
  "registrationId": 1,                        // 對應的祈福登記表ID
  "activityId": 6,                           // 活動ID
  "registeredAt": "2025-01-16T09:00:00.000Z", // 登記時間
  "registeredBy": "王大明",                   // 登記者
  "state": "confirmed",                       // 記錄狀態
  "items": [...],                            // 參加項目清單
  "totalAmount": 2200,                       // 總金額
  "discountAmount": 200,                     // 折扣金額
  "finalAmount": 2000,                       // 最終金額
  "paidAmount": 2000,                        // 已付金額
  "needReceipt": true,                       // 是否需要收據
  "receiptNumber": "R2025010001",            // 收據號碼
  "receiptIssued": true,                     // 收據是否已開立
  "receiptIssuedAt": "2025-01-16T10:00:00.000Z", // 收據開立時間
  "receiptIssuedBy": "櫃台小姐",              // 收據開立人員
  "accountingState": "reconciled",           // 會計狀態
  "accountingDate": "2025-01-16T15:00:00.000Z", // 會計處理日期
  "accountingBy": "會計王小姐",               // 會計處理人員
  "accountingNotes": "老信徒折扣200元",       // 會計備註
  "paymentState": "paid",                    // 付款狀態
  "paymentMethod": "transfer",               // 付款方式
  "paymentDate": "2025-01-16T09:30:00.000Z", // 付款日期
  "paymentNotes": "銀行轉帳，後五碼12345",    // 付款備註
  "notes": "祈福與超度都參加",                // 記錄備註
  "createdAt": "2025-01-16T09:00:00.000Z",   // 建立時間
  "createdBy": "admin",                      // 建立者
  "updatedAt": "2025-01-16T15:00:00.000Z",   // 更新時間
  "updatedUser": "accounting"                // 更新者
}
```

### ParticipationItem (參加項目)

```json
{
  "type": "diandeng",                        // 項目類型代碼
  "label": "點燈",                           // 項目顯示名稱
  "price": 600,                            // 統一單價
  "quantity": 1,                            // 數量
  "subtotal": 600,                         // 小計金額
  "source": "blessing.persons",            // 資料來源
  "sourceData": [                          // 具體選擇的人員資料
    {
      "id": 1,
      "name": "林志明",
      "zodiac": "鼠", 
      "lampType": "guangming",             // 該人員選擇的燈種
      "lampTypeLabel": "光明燈"            // 燈種名稱
    }
  ]
}
```

### SourceData (來源資料)

#### 祖先資料 (salvation.ancestors)
```json
{
  "id": 1,
  "surname": "王府",                         // 姓氏/門第
  "notes": "歷代祖先"                        // 備註
}
```

#### 陽上人資料 (salvation.survivors)
```json
{
  "id": 1,
  "name": "王大明",                          // 姓名
  "zodiac": "龍",                           // 生肖
  "notes": "二哥"                           // 備註/關係
}
```

#### 祈福人員資料 (blessing.persons)
```json
{
  "id": 1,
  "name": "王大明",                          // 姓名
  "zodiac": "龍",                           // 生肖
  "notes": "二哥",                          // 備註/關係
  "isHouseholdHead": true                   // 是否為戶長
}
```

## 狀態定義

### 記錄狀態 (state)
- `pending`: 待處理
- `confirmed`: 已確認
- `completed`: 已完成

### 付款狀態 (paymentState)
- `unpaid`: 未付款
- `paid`: 已付款

### 會計狀態 (accountingState)
- `pending`: 待處理
- `reconciled`: 已對帳

### 付款方式 (paymentMethod)
- `cash`: 現金
- `transfer`: 銀行轉帳
- `card`: 信用卡

## 活動項目類型

| 項目代碼 | 項目名稱 | 單價 | 資料來源 | 說明 |
|---------|---------|------|----------|------|
| `chaodu` | 超度/超薦 | 1000 | salvation.ancestors | 祖先超度 |
| `survivors` | 陽上人 | 300 | salvation.survivors | 陽上人登記 |
| `qifu` | 消災祈福 | 300 | blessing.persons | 消災祈福 |
| `diandeng` | 點燈 | 600 | blessing.persons | 點燈祈福 |
| `xiaozai` | 固定消災 | 100 | blessing.persons | 固定消災 |
| `pudu` | 中元普度 | 1200 | blessing.persons | 中元普度法會 |

## 資料範例

### 範例1：完整參加記錄
包含超度、陽上人、消災祈福三個項目，已付款並開立收據，會計已對帳。

### 範例2：中元普度記錄
包含中元普度和超度項目，現金付款，不需收據，會計已對帳。

### 範例3：待處理記錄
僅固定消災項目，尚未付款，需要收據，會計待處理。

### 範例4：點燈與超度記錄
包含點燈和超度項目，現金付款，已開立收據，會計已對帳。

## 業務規則

### 金額計算
- `totalAmount` = 所有項目 subtotal 總和
- `finalAmount` = `totalAmount` - `discountAmount`
- `subtotal` = `price` × `quantity`

### 收據處理
- `needReceipt` 為 true 時，必須填寫 `receiptNumber`
- 收據開立後，`receiptIssued` 設為 true，並記錄開立時間和人員

### 會計處理
- 付款完成後才能進行會計對帳
- 會計對帳完成後，`accountingState` 設為 "reconciled"

### 資料關聯
- `registrationId` 對應祈福登記表
- `activityId` 對應活動資訊
- `sourceData` 來自對應的登記表中的人員或祖先資料

## 檔案位置

- 模擬資料：`./client/src/data/mock_participation_records.json`
- 開發指南：`./docs/dev-joinRecord-guide.md`
- 用戶故事：`./docs/user-story-參加記錄.md`
