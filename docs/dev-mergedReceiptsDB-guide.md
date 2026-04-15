# 合併打印功能 - 架構設計文件

> **文件路徑**：`./docs/dev-mergedReceiptsDB-guide.md`
> **最後更新**：2026-04-01 22:05
> **狀態**：設計確認

---

## 概述說明

合併打印（Merged Receipt）是指將多筆不同的參加記錄（participationRecordDB）合併，共同開立**一張收據**，使用**同一個收據編號**。

## 與現有「批量打印」的差異

|          | 批量打印（現有）                     | 合併打印（新功能）               |
| -------- | ------------------------------------ | -------------------------------- |
| 收據數量 | N 筆 → N 張收據                      | N 筆 → 1 張收據                  |
| 收據編號 | 每張各自獨立編號                     | 共用同一個編號                   |
| 使用場景 | 信眾各自需要一份收據                 | 同一人或同一家庭多筆一次結清     |
| 打印頁面 | `JoinRecordReceiptPrint.vue`（現有） | `MergedReceiptPrint.vue`（新增） |

---

## 資料庫設計

### 設計決策

- `mergedReceiptsDB.mergeIds`：以 **JSON 陣列字串**儲存各筆 `participationRecordDB.id`，例如 `'[1, 3, 7]'`
- `participationRecordDB.mergedReceiptId`：新增 FK 欄位，`NULL` 表示單筆收據，有值表示屬於某張合併打印
- 雙欄位互補，支援雙向查詢（詳見下方）

---

### mergedReceiptsDB（新增）

儲存合併打印的主要資訊，一筆記錄 = 一張合併打印。

```sql
CREATE TABLE mergedReceiptsDB (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_created char(36) NULL,
  date_created datetime NULL,
  user_updated char(36) NULL,
  date_updated datetime NULL,
  receiptNumber  TEXT    UNIQUE NOT NULL,    -- 佛字第 XXXX 號，由 receiptNumbersDB 原子生成
  receiptType    TEXT    NOT NULL,           -- 'stamp'（收據）或 'standard'（感謝狀）
  mergeIds       json NULL,                  -- JSON 陣列字串，例如 '[1, 3, 7]'
  totalAmount    INTEGER NOT NULL,           -- Σ 各筆 finalAmount，後端計算寫入
  issuedAt       TIMESTAMP,                  -- 收據開立時間
  issuedBy       TEXT,                       -- 經手人
  notes           TEXT,                       -- 備註（選填）
  createdAt      TEXT    NOT NULL,           -- 建立時間ISOTime
  updatedAt      TEXT    NOT NULL,           -- 更新時間ISOTime
);

CREATE INDEX idx_merged_receiptNumber ON mergedReceiptsDB(receiptNumber);
```

| 欄位            | 型別        | 說明                               |
| --------------- | ----------- | ---------------------------------- |
| `id`            | INTEGER PK  | 唯一識別碼                         |
| `receiptNumber` | TEXT UNIQUE | 收據編號，由 receiptNumbersDB 生成 |
| `receiptType`   | TEXT        | `"stamp"` 或 `"standard"`          |
| `mergeIds`      | TEXT        | JSON 陣列，例如 `'[1, 3, 7]'`      |
| `totalAmount`   | INTEGER     | Σ 各筆 `finalAmount`，後端計算     |
| `issuedAt`      | TIMESTAMP   | 開立時間                           |
| `issuedBy`      | TEXT        | 經手人                             |
| `notes`         | TEXT        | 備註（選填）                       |

---

### participationRecordDB（現有，新增一欄）

現有欄位**全部保留，不異動**，僅新增 `mergedReceiptId`。

```sql
ALTER TABLE participationRecordDB
  ADD COLUMN mergedReceiptId INTEGER
  REFERENCES mergedReceiptsDB(id) ON DELETE SET NULL;
```

| 欄位              | 說明                                                       |
| ----------------- | ---------------------------------------------------------- |
| `mergedReceiptId` | **新增**。`NULL` = 單筆收據；有值 = 屬於某張合併打印       |
| `receiptNumber`   | **現有保留**。合併打印後同步寫入，各筆填入相同的收據編號   |
| `receiptIssued`   | **現有保留**。合併打印後同步寫入 `"stamp"` 或 `"standard"` |
| `receiptIssuedAt` | **現有保留**。合併打印後同步寫入時間                       |
| `receiptIssuedBy` | **現有保留**。合併打印後同步寫入經手人                     |

> **說明**：`receiptNumber` 有值即代表「已開立」，列表頁顯示邏輯完全不需要修改。

---

### receiptNumbersDB（現有，不動）

合併打印的編號生成完全沿用現有 receiptNumbersDB 的原子生成流程（Rust Axum 事務 + `FOR UPDATE`），無需修改。調用時傳入的 `record_id` 改為 `mergedReceiptsDB.id` 即可。

---

## 雙向查詢

| 查詢方向                       | 使用欄位                                      | 說明                                |
| ------------------------------ | --------------------------------------------- | ----------------------------------- |
| 合併打印 → 含哪幾筆 record     | `mergedReceiptsDB.mergeIds`                   | JSON 解析後取得 ID 陣列，再批次查詢 |
| 某筆 record → 屬於哪張合併打印 | `participationRecordDB.mergedReceiptId`（FK） | 直接 JOIN 或 subquery               |

```sql
-- 查詢某張合併打印含哪幾筆（前端 JSON.parse 後再 IN 查詢）
SELECT mergeIds FROM mergedReceiptsDB WHERE id = 88;
-- 結果：'[1, 3, 7]'

-- 查詢某筆 record 屬於哪張合併打印
SELECT m.*
FROM mergedReceiptsDB m
JOIN participationRecordDB r ON r.mergedReceiptId = m.id
WHERE r.id = 1;
```

> **說明**：SQLite 無原生陣列型別，`mergeIds` 存 JSON 字串。Rust 端透過 `serde_json` 序列化/反序列化，前端透過 `JSON.parse()` 讀取，操作無障礙。不需以 SQL WHERE 直接篩選 `mergeIds` 內容，反向查詢靠 FK 即可完成。

---

## 金額統計規則

各筆 `participationRecord` 已各自計算完成 `finalAmount`（含各自折扣），合併打印的金額計算如下：

```
mergedReceiptsDB.totalAmount = Σ ( 各筆 participationRecord.finalAmount )
```

後端在建立合併打印的 API 中計算並寫入，前端不做計算。

### 範例

| 登記筆次            | 項目                           | 折扣 | finalAmount   |
| ------------------- | ------------------------------ | ---- | ------------- |
| record #1（林志明） | 消災祈福×2、點燈×1，小計 1,400 | -200 | NT$ 1,200     |
| record #3（王大明） | 超度×1、陽上人×2，小計 1,000   | 0    | NT$ 1,000     |
| record #7（陳小花） | 中元普度×1，小計 1,200         | -200 | NT$ 1,000     |
| **合計**            |                                |      | **NT$ 3,200** |

> **注意**：各筆折扣已內含於 `finalAmount`，合併層不需再做折扣處理。

---

## 收據紙面呈現

紙張尺寸維持現有規格：128mm × 182mm（JIS B6），中文直書排版。

合併打印顯示**各筆登記人姓名 + 各筆 finalAmount**，不展開 items 明細。

```
┌─────────────────────────────┐
│   佛字第 A26030031 號        │
│   合併打印  共 3 筆           │
│ -------------------------   │
│ 林志明              1,200   │
│ 王大明              1,000   │
│ 陳小花              1,000   │
│ ─────────────────────────   │
│ 合計               3,200   │
│                             │
│ 經手人：櫃台小姐             │
│ 開立日期：2026-04-01         │
└─────────────────────────────┘
```

- 信眾姓名從各筆對應的 `registrationDB.contact.name` 取得
- 各筆金額顯示 `finalAmount`（已含折扣）
- 末行顯示 `mergedReceiptsDB.totalAmount`
- 收據標題加「合併打印 共 N 筆」字樣，便於對帳

---

## 後端 API 設計

### POST /api/merged-receipt

建立合併打印，原子生成收據編號，並同步寫回各筆 participationRecord。

**Request Body**

```json
{
  "record_ids": [1, 3, 7],
  "receiptType": "stamp",
  "user_id": "staff_001"
}
```

**處理流程（單一事務內完成）**

1. 驗證各筆 record 存在且 `paymentState = 'paid'`
2. 檢查各筆 `mergedReceiptId` 是否已有值（已合併過則警告）
3. 檢查各筆 `receiptNumber` 是否已有值（已單獨開立則警告）
4. 計算 `totalAmount = Σ finalAmount`
5. 呼叫 `receiptNumbersDB` 原子生成收據編號（現有邏輯不變，傳入 `mergedReceiptsDB.id`）
6. `INSERT mergedReceiptsDB`（寫入 `mergeIds` JSON、`totalAmount`、`receiptNumber`）
7. `UPDATE participationRecordDB`：批次寫回 `mergedReceiptId`、`receiptNumber`、`receiptIssued`、`receiptIssuedAt`、`receiptIssuedBy`
8. 回傳完整資料給前端

**Response Body**

```json
{
  "id": 88,
  "receiptNumber": "A26030031",
  "receiptType": "stamp",
  "mergeIds": [1, 3, 7],
  "totalAmount": 3200,
  "issuedAt": "2026-04-01T10:00:00Z",
  "records": [
    { "id": 1, "name": "林志明", "finalAmount": 1200 },
    { "id": 3, "name": "王大明", "finalAmount": 1000 },
    { "id": 7, "name": "陳小花", "finalAmount": 1000 }
  ]
}
```

---

## 前端操作流程

### JoinRecordList.vue（現有，小幅修改）

- 現有「批量打印」按鈕**保留，行為不變**
- 新增「合併打印」按鈕，勾選 **2 筆以上**記錄後才啟用
- 點擊「合併打印」→ 呼叫 `POST /api/merged-receipt`
- API 成功 → 帶資料跳轉至 `MergedReceiptPrint.vue`
- API 失敗（未付款、已開立）→ `ElMessage` 顯示錯誤原因，不跳轉

```javascript
const handleMergedReceiptPrint = async () => {
  if (selectedRecords.value.length < 2) {
    ElMessage.warning("請至少勾選兩筆記錄進行合併打印");
    return;
  }

  // 只過濾需要打印收據的記錄
  const printableRecords = selectedRecords.value.filter((r) =>
    BoolUtils.normalizeBool(r.needReceipt),
  );

  if (printableRecords.length === 0) {
    ElMessage.warning("已勾選的記錄中，沒有任何一筆標記為「需要打印收據」");
    return;
  }

  if (printableRecords.length < 2) {
    ElMessage.warning("需要打印收據的記錄不足兩筆，無法進行合併打印");
    return;
  }

  // 標記導航來源
  pageStateStore.setPageState("receiptPrint", {
    from: "joinRecordStatesControl",
  });

  try {
    const isoStr = DateUtils.getCurrentISOTime();
    const ids = printableRecords.map((r) => r.id).join(",");
    const printDatas = JSON.stringify(printableRecords);
    const printId = `print_receipt_${ids}`;

    // 存儲多筆資料
    sessionStorage.setItem(printId, printDatas);

    router.push({
      path: "/merged-print",
      query: {
        print_id: printId,
        ids: ids,
        iso_str: isoStr,        
        print_type: appConfig.PRINT_TYPE.MERGED,
      },
    });
  } catch (error) {
    console.error("導航到合併打印頁面失敗:", error);
    ElMessage.error("導航到合併打印頁面失敗");
  }
};
```

> **UI 注意**：「合併打印」與「批量打印」為兩個獨立按鈕，需明確區隔，建議加 tooltip 說明：「將多筆記錄合併為一張收據，共用同一收據編號」。

---

### MergedReceiptPrint.vue（新增）

- 接收來自列表頁的 mergedReceipt 資料（sessionStorage）
- 顯示各筆登記人姓名 + `finalAmount` 明細
- 顯示 `totalAmount` 合計
- 支援雙模版切換（感謝狀 / 收據），與現有收據頁相同
- 打印確認後無需再呼叫 API（狀態已在建立時一併更新）

---

## 邊界情況與驗證規則

| 情況                                              | 行為                                                                   | 提示訊息                                     |
| ------------------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------- |
| 勾選記錄中有 `paymentState ≠ 'paid'`              | 阻止，不呼叫 API                                                       | 「含有未付款記錄，請先完成付款」             |
| 勾選記錄中有 `mergedReceiptId` 已有值             | 警告，由使用者確認是否繼續                                             | 「部分記錄已開立合併打印，確定要重新合併？」 |
| 勾選記錄中有 `receiptNumber` 已有值（單筆已開立） | 警告，由使用者確認是否繼續                                             | 「部分記錄已單獨開立收據，確定要合併？」     |
| 只勾選 1 筆                                       | 「合併打印」按鈕不啟用（disable）                                      | —                                            |
| 合併後其中一筆 record 被刪除                      | `mergedReceiptId ON DELETE SET NULL`，不影響 `mergedReceiptsDB` 主記錄 | —                                            |

---

## 實施步驟

| 階段     | 工期       | 工作項目                                                                                                |
| -------- | ---------- | ------------------------------------------------------------------------------------------------------- |
| 一       | 1 天       | 資料庫：`CREATE TABLE mergedReceiptsDB`、`ALTER TABLE participationRecordDB ADD COLUMN mergedReceiptId` |
| 二       | 2–3 天     | 後端：實作 `POST /api/merged-receipt`（Rust Axum + 事務 + receiptNumbersDB 整合）                       |
| 三       | 2–3 天     | 前端：`JoinRecordList.vue` 加「合併打印」按鈕、新增 `MergedReceiptPrint.vue`                            |
| 四       | 1 天       | 測試：金額計算、邊界情況、雙模版打印                                                                    |
| **合計** | **6–8 天** |                                                                                                         |

---

## 相關文件

- [收據打印功能說明](./dev-joinRecord-receipt-print-guide.md)
- [收據編號生成機制說明](./dev-joinRecord-receiptNumber-guide.md)
- [參加記錄資料結構說明](./dev-joinRecord-guide.md)

---

## 更新日誌

- **2026-04-01**：初版發布，設計確認
  - 確認採用 `mergedReceiptsDB.mergeIds`（JSON 陣列）+ `participationRecordDB.mergedReceiptId`（FK）雙欄位設計
  - 收據紙面顯示各筆總額（不展開 items 明細）
  - receiptNumbersDB 生成流程完全不動
  - 批量打印功能完全不受影響
