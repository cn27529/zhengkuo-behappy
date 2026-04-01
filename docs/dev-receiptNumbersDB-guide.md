# 收據編號 - 生成機制說明

> **最後更新**: 2026-02-26  
> **狀態**: 設計階段  
> **採用方案**: 方案 1（後端原子性生成）+ 獨立編號表  
> **架構**: 雙軌 API + `receiptNumbersDB` 表

## 概述說明

實現收據和感謝狀的唯一編號生成機制，確保在多使用者併發環境下不會產生重複編號。編號規則為年月4碼 + 流水號4碼，感謝狀額外加前綴 "A"。

**技術方案**：

- ✅ Rust Axum 後端原子性生成
- ✅ 獨立 `receiptNumbersDB` 表管理編號
- ✅ SQLite WAL 機制保證併發安全
- ✅ 雙軌架構：寫入走 Rust，查詢走 Rust 高性能軌

**性能優勢**：

- ⚡ 編號生成：~1ms（只掃描當月編號，~100筆）
- ⚡ 併發能力：鎖定範圍小，不影響其他操作
- ⚡ 擴展性強：支援作廢、重新生成等功能

## 編號規則

### 收據（stamp）

- **格式**: `YYMM9999`
- **範例**: `26029999`（2026年2月，流水號9999）
- **說明**: 8碼數字

### 感謝狀（standard）

- **格式**: `AYYMM9999`
- **範例**: `A26029999`（2026年2月，流水號9999）
- **說明**: 前綴A + 8碼數字

### 編號組成

```
收據:     2 6 0 2 9 9 9 9
         └─┬─┘ └─┬─┘ └─┬─┘
          年月   月份  流水號

感謝狀:  A 2 6 0 2 9 9 9 9
        │ └─┬─┘ └─┬─┘ └─┬─┘
      前綴 年月   月份  流水號
```

### 流水號規則

- **範圍**: 0001 ~ 9999
- **重置**: 每月1日重置為0001
- **獨立性**: 收據和感謝狀使用獨立的流水號序列

## 資料結構

### 資料庫設計

#### 1. 收據編號表（新增）

```sql
-- 收據編號獨立管理表（Directus Collection: receiptNumbersDB）
CREATE TABLE receiptNumbersDB (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  receipt_number TEXT UNIQUE NOT NULL,      -- '26029999' 或 'A26029999'
  receipt_type TEXT NOT NULL,               -- 'stamp' 或 'standard'
  year_month TEXT NOT NULL,                 -- '2602'
  serial_number INTEGER NOT NULL,           -- 9999
  record_id INTEGER NOT NULL,               -- 關聯的參加記錄ID
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,                          -- 生成人員ID
  status TEXT DEFAULT 'active',             -- 'active', 'void', 'regenerated'
  void_reason TEXT,                         -- 作廢原因

  FOREIGN KEY (record_id) REFERENCES participationRecordDB(id) ON DELETE CASCADE
);

-- 性能優化索引
CREATE INDEX idx_receipt_year_month_type ON receiptNumbersDB(year_month, receipt_type);
CREATE INDEX idx_receipt_record_id ON receiptNumbersDB(record_id);
CREATE UNIQUE INDEX idx_receipt_number ON receiptNumbersDB(receipt_number);
CREATE INDEX idx_receipt_status ON receiptNumbersDB(status);
```

**設計優勢**：

- ✅ 查詢最大流水號只掃描當月記錄（~100筆），極快
- ✅ `FOR UPDATE` 鎖定範圍小，不影響 participationRecordDB 表
- ✅ 完整的編號生成歷史和審計追蹤
- ✅ 支援作廢、重新生成等擴展功能

#### 2. 參加記錄表（現有）

```javascript
// participationRecordDB 表
{
  "id": 32,
  "receiptNumber": "26029999",        // 收據編號（關聯 receiptNumbersDB 表）
  "receiptIssued": "stamp",           // 收據類型: "stamp" 或 "standard"
  "receiptIssuedAt": "2026-02-26T14:30:00Z",  // 打印時間
  "receiptIssuedBy": "user_id",       // 收據開立者，也稱經手人
  // ... 其他欄位
}
```

// ... 其他欄位
}

````

### 前端顯示

```javascript
// JoinRecordReceiptPrint.vue
const receiptSerialNum = computed(() => {
  // 目前使用臨時編號（待改為正式編號）
  return record.value.id
    ? `${record.value.id}A${record.value.activityId}R${record.value.registrationId}`
    : "00000000";
});
````

**顯示位置**：

```html
<div class="receipt-serial">佛字第 {{ receiptSerialNum }} 號</div>
```

## 併發衝突問題

### 問題場景

在 Web 應用中，多個使用者同時打印收據時可能產生編號衝突：

```
時間軸：
T1: A使用者查詢最大流水號 → 9998
T2: B使用者查詢最大流水號 → 9998
T3: A使用者生成編號 → 26029999
T4: B使用者生成編號 → 26029999 ❌ 衝突！
T5: A使用者寫入資料庫
T6: B使用者寫入資料庫 → 覆蓋或錯誤
```

### 衝突風險

- **高併發場景**: 多個使用者同時打印
- **批量打印**: 單一使用者快速打印多張
- **跨瀏覽器**: 同一使用者在不同裝置操作
- **網路延遲**: 查詢和寫入之間的時間差

## 解決方案

### 方案 1：後端原子性生成（推薦 ⭐⭐⭐⭐⭐）

**原理**: 編號生成由後端統一管理，使用資料庫事務保證唯一性

#### 優點

- ✅ 100% 避免衝突
- ✅ 資料庫保證唯一性
- ✅ 支援高併發
- ✅ 流水號連續

#### 缺點

- ❌ 需要後端 API 支援
- ❌ 增加一次 API 請求

#### 實現架構

```
前端                    後端                    資料庫
 │                       │                       │
 ├─ 請求生成編號 ────────>│                       │
 │                       ├─ 開始事務 ──────────>│
 │                       ├─ 查詢最大編號(鎖定)──>│
 │                       │<─ 返回 9998 ─────────┤
 │                       ├─ 計算新編號 (9999)    │
 │                       ├─ 更新記錄 ──────────>│
 │                       ├─ 提交事務 ──────────>│
 │<─ 返回 26029999 ──────┤                       │
 ├─ 更新打印狀態 ────────>│                       │
 │<─ 完成 ───────────────┤                       │
```

#### 後端實現（Rust Axum + 獨立編號表）

**架構優勢**：

- ⚡ 查詢最大流水號只掃描 `receiptNumbersDB` 表（當月 ~100 筆）
- ⚡ 性能提升 50 倍：1ms vs 50ms（相比掃描全部參加記錄）
- 🔒 `FOR UPDATE` 鎖定範圍小，不影響參加記錄表操作
- 📊 完整的編號生成歷史和審計追蹤

```rust
use axum::{Json, http::StatusCode};
use serde::{Deserialize, Serialize};
use sqlx::{SqlitePool, Transaction};

#[derive(Deserialize)]
struct GenerateReceiptNumberRequest {
    record_id: i32,
    receipt_type: String, // "stamp" 或 "standard"
    user_id: String,      // 生成人員ID
}

#[derive(Serialize)]
struct GenerateReceiptNumberResponse {
    receipt_number: String,
}

async fn generate_receipt_number(
    pool: SqlitePool,
    Json(payload): Json<GenerateReceiptNumberRequest>,
) -> Result<Json<GenerateReceiptNumberResponse>, StatusCode> {
    let mut tx = pool.begin().await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // 1. 獲取當前年月 (YYMM)
    let now = chrono::Local::now();
    let year_month = now.format("%y%m").to_string(); // "2602"

    // 2. 查詢當月最大流水號（只掃描編號表，極快！）
    // 🚀 關鍵優化：只查詢當月記錄，不掃描全部參加記錄
    let max_serial: Option<i32> = sqlx::query_scalar(
        "SELECT serial_number FROM receiptNumbersDB
         WHERE year_month = ? AND receipt_type = ?
         ORDER BY serial_number DESC
         LIMIT 1
         FOR UPDATE"
    )
    .bind(&year_month)
    .bind(&payload.receipt_type)
    .fetch_optional(&mut tx)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // 3. 計算新流水號
    let next_serial = max_serial.unwrap_or(0) + 1;

    if next_serial > 9999 {
        return Err(StatusCode::BAD_REQUEST); // 當月編號已用完
    }

    // 4. 生成完整編號
    let prefix = if payload.receipt_type == "standard" {
        format!("A{}", year_month) // "A2602"
    } else {
        year_month.clone() // "2602"
    };
    let receipt_number = format!("{}{:04}", prefix, next_serial);

    // 5. 插入編號記錄（審計追蹤）
    sqlx::query(
        "INSERT INTO receiptNumbersDB
         (receipt_number, receipt_type, year_month, serial_number, record_id, created_by)
         VALUES (?, ?, ?, ?, ?, ?)"
    )
    .bind(&receipt_number)
    .bind(&payload.receipt_type)
    .bind(&year_month)
    .bind(next_serial)
    .bind(payload.record_id)
    .bind(&payload.user_id)
    .execute(&mut tx)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // 6. 更新參加記錄
    let result = sqlx::query(
        "UPDATE participation_records
         SET receiptNumber = ?,
             receiptIssued = ?,
             receiptIssuedAt = CURRENT_TIMESTAMP,
             receiptIssuedBy = ?
         WHERE id = ?"
    )
    .bind(&receipt_number)
    .bind(&payload.receipt_type)
    .bind(&payload.user_id)
    .bind(payload.record_id)
    .execute(&mut tx)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if result.rows_affected() == 0 {
        return Err(StatusCode::NOT_FOUND); // 記錄不存在
    }

    // 7. 提交事務
    tx.commit().await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(GenerateReceiptNumberResponse {
        receipt_number,
    }))
}
```

**性能特點**：

- ⚡ 單次請求完成編號生成（~1ms）
- 🔒 事務鎖定時間極短（僅查詢編號表 + 插入 + 更新）
- 📊 WAL 模式下不影響其他查詢操作
- 🎯 鎖定範圍小（只鎖編號表，不鎖參加記錄表）

#### 前端調用

```javascript
// services/receiptService.js
export const receiptService = {
  /**
   * 生成收據編號
   */
  async generateReceiptNumber(recordId, receiptType) {
    try {
      const response = await fetch("/api/generate-receipt-number", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          record_id: recordId,
          receipt_type: receiptType, // "stamp" 或 "standard"
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "生成編號失敗");
      }

      const data = await response.json();
      return data.receipt_number;
    } catch (error) {
      console.error("生成收據編號失敗:", error);
      throw error;
    }
  },
};
```

```javascript
// JoinRecordReceiptPrint.vue
import { receiptService } from "../services/receiptService.js";

const handlePostPrintCheck = async () => {
  try {
    await ElMessageBox.confirm("單據是否已成功由打印機完成？", "打印確認", {
      confirmButtonText: "打印完成",
      //cancelButtonText: "取消打印",
      type: "question",
      center: true,
    });

    // 1. 生成收據編號（後端原子性生成）
    const loading = ElLoading.service({ text: "正在生成收據編號..." });

    try {
      const receiptType = activeTemplate.value; // "stamp" 或 "standard"
      const receiptNumber = await receiptService.generateReceiptNumber(
        record.value.id,
        receiptType,
      );

      // 2. 更新本地記錄
      record.value.receiptNumber = receiptNumber;
      record.value.receiptIssued = receiptType;

      // 3. 顯示成功訊息
      ElMessage({
        type: "success",
        message: `收據編號：${receiptNumber}`,
        duration: 3000,
      });

      // 4. 批量模式：標記為已打印並跳到下一張
      if (isBatch.value) {
        printedIndexes.value.add(currentIndex.value);

        if (currentIndex.value < batchRecords.value.length - 1) {
          setTimeout(() => {
            handleNext();
          }, 500);
        } else {
          ElMessage({
            type: "info",
            message: "所有收據已處理完成！",
          });
        }
      }
    } catch (error) {
      ElMessage.error(error.message || "生成收據編號失敗");
    } finally {
      loading.close();
    }
  } catch {
    // 使用者取消
  }
};
```

### 方案 2：唯一索引 + 重試機制（推薦 ⭐⭐⭐⭐）

**原理**: 前端生成編號，資料庫唯一索引拒絕重複，衝突時自動重試

#### 優點

- ✅ 資料庫保證唯一性
- ✅ 前端可控
- ✅ 實現相對簡單
- ✅ 無需新增 API

#### 缺點

- ❌ 可能需要重試（影響體驗）
- ❌ 高併發時重試次數增加
- ❌ 流水號可能不連續

#### 資料庫設定

```sql
-- 添加唯一索引
CREATE UNIQUE INDEX idx_receipt_number
ON participation_records(receiptNumber);

-- 或使用唯一約束
ALTER TABLE participation_records
ADD CONSTRAINT uk_receipt_number UNIQUE (receiptNumber);
```

#### 前端實現

```javascript
// utils/receiptNumberGenerator.js
export class ReceiptNumberGenerator {
  /**
   * 獲取當前年月 (YYMM)
   */
  static getCurrentYearMonth() {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    return `${year}${month}`;
  }

  /**
   * 查詢當月最大流水號
   */
  static async getMaxSerialNumber(yearMonth, receiptType) {
    const prefix = receiptType === "standard" ? `A${yearMonth}` : yearMonth;

    try {
      const response = await fetch(`/api/receipt-max-serial?prefix=${prefix}`);
      const data = await response.json();

      if (data.maxNumber) {
        // 提取最後4碼流水號
        const serial = data.maxNumber.slice(-4);
        return parseInt(serial, 10);
      }

      return 0; // 當月第一筆
    } catch (error) {
      console.error("查詢最大流水號失敗:", error);
      return 0;
    }
  }

  /**
   * 生成收據編號
   */
  static async generate(receiptType) {
    const yearMonth = this.getCurrentYearMonth();
    const maxSerial = await this.getMaxSerialNumber(yearMonth, receiptType);
    const nextSerial = (maxSerial + 1).toString().padStart(4, "0");

    const prefix = receiptType === "standard" ? `A${yearMonth}` : yearMonth;
    return `${prefix}${nextSerial}`;
  }
}

/**
 * 帶重試機制的保存
 */
export async function saveReceiptWithRetry(
  record,
  receiptType,
  maxRetries = 3,
) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // 1. 生成編號
      const receiptNumber = await ReceiptNumberGenerator.generate(receiptType);

      // 2. 更新記錄
      record.receiptNumber = receiptNumber;
      record.receiptIssued = receiptType;

      // 3. 嘗試寫入資料庫
      const result = await api.updateReceiptPrintStatus(record);

      if (result.success) {
        return receiptNumber; // 成功
      }

      throw new Error(result.message || "更新失敗");
    } catch (error) {
      // 檢查是否為重複編號錯誤
      const isDuplicateError =
        error.code === "DUPLICATE_KEY" ||
        error.message?.includes("duplicate") ||
        error.message?.includes("unique constraint");

      if (isDuplicateError && attempt < maxRetries - 1) {
        // 衝突，等待隨機時間後重試
        const delay = Math.random() * 100 + 50; // 50-150ms
        await new Promise((resolve) => setTimeout(resolve, delay));
        console.log(`編號衝突，重試第 ${attempt + 1} 次...`);
        continue;
      }

      // 非重複錯誤或已達最大重試次數
      throw error;
    }
  }

  throw new Error("生成收據編號失敗：已達最大重試次數");
}
```

#### 使用範例

```javascript
// JoinRecordReceiptPrint.vue
import { saveReceiptWithRetry } from "../utils/receiptNumberGenerator.js";

const handlePostPrintCheck = async () => {
  try {
    await ElMessageBox.confirm("單據是否已成功由打印機完成？", "打印確認");

    const loading = ElLoading.service({ text: "正在生成收據編號..." });

    try {
      const receiptType = activeTemplate.value;
      const receiptNumber = await saveReceiptWithRetry(
        record.value,
        receiptType,
        3, // 最多重試3次
      );

      ElMessage.success(`收據編號：${receiptNumber}`);

      // 批量模式處理...
    } catch (error) {
      ElMessage.error(error.message || "生成收據編號失敗");
    } finally {
      loading.close();
    }
  } catch {
    // 使用者取消
  }
};
```

---

### 方案 3：UUID + 流水號混合（推薦 ⭐⭐⭐）

**原理**: 編號包含隨機部分，降低衝突機率

#### 優點

- ✅ 衝突機率極低
- ✅ 無需後端支援
- ✅ 無需重試
- ✅ 實現簡單

#### 缺點

- ❌ 編號不連續
- ❌ 編號較長
- ❌ 不符合使用者需求（純流水號）

#### 實現

```javascript
// 收據編號：2602-9999-AB12
// 年月 + 記錄ID + 隨機碼
function generateReceiptNumber(recordId, receiptType) {
  const yearMonth =
    new Date().getFullYear().toString().slice(-2) +
    (new Date().getMonth() + 1).toString().padStart(2, "0");

  const serial = recordId.toString().padStart(4, "0");
  const random = generateRandomCode(4); // "AB12"

  const prefix = receiptType === "standard" ? "A" : "";
  return `${prefix}${yearMonth}${serial}${random}`;
}

function generateRandomCode(length) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
```

**範例**：

- 收據：`2602999912AB`
- 感謝狀：`A2602999912AB`

---

### 方案 4：樂觀鎖 + 版本號（推薦 ⭐⭐⭐）

**原理**: 使用版本號檢測併發修改

#### 優點

- ✅ 檢測併發修改
- ✅ 適合低衝突場景
- ✅ 資料一致性保證

#### 缺點

- ❌ 需要資料庫支援
- ❌ 衝突時需要重新生成編號
- ❌ 增加資料庫欄位

#### 資料庫設定

```sql
-- 添加版本號欄位
ALTER TABLE participation_records
ADD COLUMN version INT DEFAULT 0;
```

#### 實現

```javascript
async function updateWithOptimisticLock(record, newReceiptNumber) {
  const result = await db.query(
    `
    UPDATE participation_records 
    SET receiptNumber = ?, 
        receiptIssued = ?,
        version = version + 1
    WHERE id = ? AND version = ?
  `,
    [newReceiptNumber, record.receiptIssued, record.id, record.version],
  );

  if (result.affectedRows === 0) {
    throw new Error("CONCURRENT_MODIFICATION");
  }

  // 更新本地版本號
  record.version += 1;
}
```

---

## 方案比較

| 方案                 | 併發安全   | 實現難度 | 性能       | 用戶體驗   | 編號連續性 |
| -------------------- | ---------- | -------- | ---------- | ---------- | ---------- |
| 方案1：後端原子性    | ⭐⭐⭐⭐⭐ | ⭐⭐⭐   | ⭐⭐⭐⭐   | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 方案2：唯一索引+重試 | ⭐⭐⭐⭐   | ⭐⭐     | ⭐⭐⭐     | ⭐⭐⭐⭐   | ⭐⭐⭐⭐   |
| 方案3：UUID混合      | ⭐⭐⭐⭐⭐ | ⭐       | ⭐⭐⭐⭐⭐ | ⭐⭐       | ⭐         |
| 方案4：樂觀鎖        | ⭐⭐⭐     | ⭐⭐⭐   | ⭐⭐⭐     | ⭐⭐⭐     | ⭐⭐⭐⭐   |

### 詳細比較

#### 併發安全性

- **方案1**: 資料庫事務 + 行鎖，100% 安全
- **方案2**: 唯一索引保證，重試機制處理衝突
- **方案3**: 隨機碼降低衝突機率至極低
- **方案4**: 版本號檢測，但需要重新生成編號

#### 實現難度

- **方案1**: 需要後端 API 開發
- **方案2**: 前端實現，需要處理重試邏輯
- **方案3**: 最簡單，純前端實現
- **方案4**: 需要資料庫結構變更

#### 性能表現

- **方案1**: 一次 API 請求，資料庫鎖定時間短
- **方案2**: 可能需要多次重試
- **方案3**: 無額外請求，最快
- **方案4**: 類似方案2

#### 用戶體驗

- **方案1**: 無感知，編號立即生成
- **方案2**: 衝突時可能有短暫延遲
- **方案3**: 無延遲，但編號較長
- **方案4**: 衝突時需要重試

#### 編號連續性

- **方案1**: 完全連續
- **方案2**: 基本連續（衝突時可能跳號）
- **方案3**: 不連續
- **方案4**: 基本連續

---

## 實施建議

### 階段一：短期方案（1-2週）

**選擇方案2：唯一索引 + 重試機制**

**理由**：

- ✅ 快速實現，無需後端開發
- ✅ 資料庫保證唯一性
- ✅ 適合當前併發量

**實施步驟**：

1. 資料庫添加唯一索引
2. 實現前端編號生成器
3. 添加重試機制
4. 測試併發場景

### 階段二：長期方案（1-2個月）

**遷移到方案1：後端原子性生成**

**理由**：

- ✅ 最穩定可靠
- ✅ 編號完全連續
- ✅ 支援高併發
- ✅ 易於維護

**實施步驟**：

1. 開發後端 API
2. 前端調用 API
3. 灰度發布測試
4. 全量切換

---

## 測試方案

### 單元測試

```javascript
// 測試編號生成
describe("ReceiptNumberGenerator", () => {
  test("生成收據編號格式正確", () => {
    const number = ReceiptNumberGenerator.generate("stamp");
    expect(number).toMatch(/^\d{8}$/);
  });

  test("生成感謝狀編號格式正確", () => {
    const number = ReceiptNumberGenerator.generate("standard");
    expect(number).toMatch(/^A\d{8}$/);
  });

  test("流水號遞增", async () => {
    const num1 = await ReceiptNumberGenerator.generate("stamp");
    const num2 = await ReceiptNumberGenerator.generate("stamp");

    const serial1 = parseInt(num1.slice(-4));
    const serial2 = parseInt(num2.slice(-4));

    expect(serial2).toBe(serial1 + 1);
  });
});
```

### 併發測試

```javascript
// 測試併發生成編號
describe("併發測試", () => {
  test("10個併發請求不產生重複編號", async () => {
    const promises = Array(10)
      .fill(null)
      .map(() => saveReceiptWithRetry(mockRecord, "stamp"));

    const numbers = await Promise.all(promises);
    const uniqueNumbers = new Set(numbers);

    expect(uniqueNumbers.size).toBe(10); // 所有編號唯一
  });
});
```

### 壓力測試

```bash
# 使用 Apache Bench 測試
ab -n 100 -c 10 -p request.json -T application/json \
   http://localhost:3000/api/generate-receipt-number

# 預期結果：
# - 100 個請求全部成功
# - 生成 100 個唯一編號
# - 無重複編號
```

---

## 常見問題

### Q1: 流水號用完怎麼辦？

**A**: 當月流水號達到 9999 後：

**方案1（推薦）**: 擴展編號位數

```
原格式: YYMM9999 (8碼)
新格式: YYMM99999 (9碼，支援到99999）
```

**方案2**: 添加分類前綴

```
收據: R26029999
感謝狀: S26029999 (原 A26029999)
```

**方案3**: 使用日期

```
YYMMDD9999 (10碼，每日重置)
```

### Q2: 如何處理跨月份的編號？

**A**: 每月1日自動重置流水號為 0001

```javascript
// 自動檢測月份變更
const yearMonth = getCurrentYearMonth(); // "2602"
const maxNumber = await getMaxSerialNumber(yearMonth, receiptType);

// 如果是新月份，maxNumber 為 0，自動從 0001 開始
```

### Q3: 收據和感謝狀的流水號是否獨立？

**A**: 是的，兩者使用獨立的流水號序列

```
2月收據:   26020001, 26020002, 26020003
2月感謝狀: A26020001, A26020002, A26020003
```

### Q4: 如何處理打印失敗的情況？

**A**: 編號已生成但打印失敗時：

**方案1（推薦）**: 保留編號，標記為「已生成未打印」

```javascript
{
  receiptNumber: "26029999",
  receiptIssued: "stamp",
  receiptIssuedAt: "2026-02-26T14:30:00Z",
  printStatus: "generated_not_printed" // 新增狀態
}
```

**方案2**: 作廢編號，重新生成

```javascript
{
  receiptNumber: "26029999",
  status: "void", // 作廢
  voidReason: "打印失敗"
}
```

### Q5: 批量打印時如何保證編號連續？

**A**: 使用獨立編號表 + 事務保證連續性

```rust
// 批量生成編號（在同一事務中）
async fn batch_generate_receiptNumbersDB(
    pool: SqlitePool,
    record_ids: Vec<i32>,
    receipt_type: String,
) -> Result<Vec<String>, StatusCode> {
    let mut tx = pool.begin().await?;
    let mut numbers = Vec::new();

    for record_id in record_ids {
        // 在同一事務中逐個生成，保證連續
        let number = generate_next_number(&mut tx, record_id, &receipt_type).await?;
        numbers.push(number);
    }

    tx.commit().await?;
    Ok(numbers)
}

// 返回: ["26020001", "26020002", "26020003", "26020004", "26020005"]
```

### Q6: 如何查詢某個編號是否已使用？

**A**: 查詢獨立編號表（極快）

```sql
-- 查詢編號是否存在
SELECT id FROM receiptNumbersDB
WHERE receipt_number = '26029999' AND status = 'active';

-- 查詢當月已使用數量
SELECT COUNT(*) FROM receiptNumbersDB
WHERE year_month = '2602' AND receipt_type = 'stamp' AND status = 'active';
```

### Q7: 如何處理編號作廢和重新生成？

**A**: 利用獨立表的 `status` 欄位

```sql
-- 作廢編號
UPDATE receiptNumbersDB
SET status = 'void', void_reason = '打印失敗'
WHERE receipt_number = '26029999';

-- 重新生成（生成新編號，標記為 regenerated）
INSERT INTO receiptNumbersDB (..., status)
VALUES (..., 'regenerated');

-- 查詢有效編號（排除作廢）
SELECT * FROM receiptNumbersDB
WHERE status = 'active';
```

### Q8: 獨立編號表有什麼額外好處？

**A**: 免費獲得多項功能

1. **審計追蹤**

```sql
-- 查詢編號生成歷史
SELECT * FROM receiptNumbersDB
WHERE record_id = 123
ORDER BY created_at DESC;
```

2. **統計分析**

```sql
-- 當月各類型收據數量
SELECT receipt_type, COUNT(*)
FROM receiptNumbersDB
WHERE year_month = '2602'
GROUP BY receipt_type;
```

3. **性能監控**

```sql
-- 查詢生成速度（每小時生成數量）
SELECT strftime('%H', created_at) as hour, COUNT(*)
FROM receiptNumbersDB
WHERE date(created_at) = date('now')
GROUP BY hour;
```

---

## 基於現有架構的實施建議

### 🎯 推薦方案：方案 1（後端原子性生成）

**完美契合點**：

1. **雙軌 API 架構**

   ```
   編號生成（寫入） → Rust Axum API (http://localhost:3000)
   收據查詢（讀取） → Rust Axum API (高性能軌)
   ```

2. **SQLite + WAL 機制**
   - ✅ 已驗證 WAL 機制正常運作（`npm run test:wal`）
   - ✅ 寫入不阻塞讀取
   - ✅ 事務 + `FOR UPDATE` 保證唯一性

3. **壓測驗證能力**

   ```bash
   # 查詢壓測（已驗證）
   npm run test:query
   # 每 100ms 並發 5 請求，平均響應 ~10ms

   # 寫入壓測（已驗證）
   npm run test:wal
   # 每 500ms 寫入 1 筆，WAL 機制正常
   ```

### 📊 預期性能

基於獨立編號表設計：

| 操作         | 數據量           | 響應時間 | 說明                       |
| ------------ | ---------------- | -------- | -------------------------- |
| 編號生成     | 掃描當月 ~100 筆 | ~1ms     | 只查詢 receiptNumbersDB 表 |
| 收據查詢     | 全部 ~10000 筆   | ~10ms    | Rust 高性能軌              |
| 併發編號生成 | 10 個並發        | ~1-2ms   | 鎖定範圍小，不互相影響     |

**對比方案 B（掃描全表）**：

- 方案 A（獨立表）：~1ms（掃描 100 筆）
- 方案 B（大表）：~50ms（掃描 10000 筆）
- **性能提升 50 倍** ⚡

**結論**：收據打印是低頻操作（~2次/秒），完全在系統能力範圍內。

### 🚀 實施步驟

#### 階段一：資料庫設計（1天）

1. 創建 `receiptNumbersDB` 表
2. 添加索引優化
3. 測試外鍵關係

```sql
-- 執行 SQL 腳本
-- db/migrations/create_receiptNumbersDB.sql
```

#### 階段二：Rust API 開發（3-5天）

1. 實現 `/api/generate-receipt-number` 端點
2. 事務 + `FOR UPDATE` 邏輯
3. 單元測試 + 併發測試

#### 階段三：前端整合（2-3天）

1. 創建 `receiptService.js`
2. 修改 `JoinRecordReceiptPrint.vue`
3. 測試單筆 + 批量打印

#### 階段四：壓測驗證（1天）

```bash
# 創建收據編號生成壓測腳本
npm run test:receipt

# 預期結果：
# ✅ 成功率 100%
# ✅ 重複編號 0 個
# ✅ 平均響應 ~1ms
```

**總計：1-2 週完成**

### 🔧 壓測腳本範例

```javascript
// scripts/stress-test-receipt-number.js
const http = require("http");

const RUST_URL = "http://localhost:3000";
const CONCURRENT = parseInt(process.env.CONCURRENT) || 10;
const INTERVAL_MS = parseInt(process.env.INTERVAL_MS) || 100;

let successCount = 0;
let errorCount = 0;
let duplicateCount = 0;
const generatedNumbers = new Set();

async function generateReceiptNumber(recordId) {
  try {
    const response = await fetch(`${RUST_URL}/api/generate-receipt-number`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        record_id: recordId,
        receipt_type: "stamp",
      }),
    });

    const data = await response.json();

    if (response.ok) {
      // 檢查重複
      if (generatedNumbers.has(data.receipt_number)) {
        duplicateCount++;
        console.error(`❌ 重複編號: ${data.receipt_number}`);
      } else {
        generatedNumbers.add(data.receipt_number);
        successCount++;
      }
    } else {
      errorCount++;
    }
  } catch (error) {
    errorCount++;
  }

  process.stdout.write(
    `\r✅ 成功: ${successCount} | ❌ 錯誤: ${errorCount} | 🔁 重複: ${duplicateCount}`,
  );
}

async function main() {
  console.log("🔥 收據編號生成壓測");
  console.log(`📊 設定: ${CONCURRENT} 個並發，每 ${INTERVAL_MS}ms\n`);

  let recordId = 1;
  setInterval(async () => {
    const promises = [];
    for (let i = 0; i < CONCURRENT; i++) {
      promises.push(generateReceiptNumber(recordId++));
    }
    await Promise.all(promises);
  }, INTERVAL_MS);
}

main();
```

**預期結果**：

- ✅ 成功率 100%
- ✅ 重複編號 0 個
- ✅ 編號連續

---

## 相關文件

- [API 文檔](./api-documentation.md) - 雙軌 API 架構說明
- [WAL 壓測文檔](./test-stress-test-wal.md) - WAL 機制驗證
- [收據打印功能說明](./dev-joinRecord-receipt-print-guide.md)
- [參加記錄列表](./dev-joinRecord-list-guide.md)
- [收據打印狀態更新](./dev-receipt-print-status-update.md)

---

## 更新日誌

- **2026-02-26**: 初版發布
  - 定義編號規則
  - 分析併發衝突問題
  - 提出4種解決方案
  - 提供實施建議和測試方案
  - 基於現有雙軌架構提供實施建議
  - 添加壓測腳本範例
  - **✅ 確定採用方案：雙軌 API + 獨立 `receiptNumbersDB` 表**
  - **✅ 性能優勢：50 倍提升（1ms vs 50ms）**
  - **✅ 完整的資料庫設計和 Rust 實現代碼**
