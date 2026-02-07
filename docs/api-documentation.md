# API 文檔

## 概述

本系統採用「實用主義優先」的 API 設計理念，提供雙軌並行的後端支援：

### 🚄 雙軌 API 架構

#### 性能軌：Rust Axum API (讀取專用)

- **端點**: `http://localhost:3000`
- **職責**: 高性能數據查詢 (Read Operations)
- **優勢**: 極速響應、零開銷、內存安全
- **適用**: 列表查詢、搜索、統計、報表

#### 管理軌：Directus API (寫入與管理)

- **端點**: `http://localhost:8055`
- **職責**: 數據寫入與系統管理 (CUD + Auth + Admin)
- **優勢**: 完整認證、審計日誌、管理界面
- **適用**: 新增、修改、刪除、用戶管理

**一石二鳥效果：**

- 🐦 獲得管理便利性 (Directus 的完整功能)
- 🐦 獲得查詢高性能 (Rust 的極速響應)

所有 API 回應都遵循統一的格式規範。

## 通用 API 規範

### 請求格式

- **Content-Type**: `application/json`
- **認證**: Bearer Token (部分端點需要)

### 回應格式

```json
{
  "success": true,
  "message": "操作成功",
  "data": { ... },
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10
  }
}
```

### 錯誤回應

```json
{
  "success": false,
  "message": "錯誤描述",
  "error": "詳細錯誤信息"
}
```

### HTTP 狀態碼

- `200` - 成功
- `201` - 創建成功
- `400` - 請求錯誤
- `401` - 未認證
- `403` - 權限不足
- `404` - 資源不存在
- `500` - 服務器錯誤

---

## 系統 API

### 健康檢查

#### GET `/health`

檢查系統健康狀態

**回應：**

```json
{
  "success": true,
  "message": "系統運行正常",
  "data": {
    "status": "healthy",
    "timestamp": "2026-01-21T15:00:00Z",
    "uptime": 3600,
    "database": "connected"
  }
}
```

#### GET `/ping`

簡單的連通性測試

**回應：**

```json
{
  "success": true,
  "message": "pong",
  "data": {
    "timestamp": "2026-01-21T15:00:00Z"
  }
}
```

#### GET `/info`

獲取服務器信息

**回應：**

```json
{
  "success": true,
  "data": {
    "version": "1.0.0",
    "environment": "development",
    "start_time": "2026-01-21T14:00:00Z",
    "architecture": "x86_64-apple-darwin"
  }
}
```

---

## 報名系統 API

### 獲取所有報名記錄

#### GET `/api/registrations`

**查詢參數：**

- `state` (string, optional) - 狀態篩選 (`draft`, `submitted`, `completed`)
- `form_id` (string, optional) - 表單 ID 篩選
- `user_created` (string, optional) - 創建者篩選
- `sort` (string, optional) - 排序欄位 (前綴 `-` 表示降序)
- `limit` (integer, optional) - 每頁數量 (預設: 100)
- `offset` (integer, optional) - 偏移量 (預設: 0)

**回應：**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "formId": "REG001",
      "formName": "消災超度報名",
      "formSource": "web",
      "state": "submitted",
      "contact": {
        "name": "王小明",
        "phone": "02-12345678",
        "mobile": "0912345678",
        "relationship": "本家"
      },
      "blessing": {
        "address": "台北市信義區",
        "persons": [
          {
            "id": 1,
            "name": "王小明",
            "zodiac": "龍",
            "isHouseholdHead": true,
            "notes": ""
          }
        ]
      },
      "salvation": {
        "address": "台北市信義區",
        "ancestors": [
          {
            "id": 1,
            "surname": "王",
            "notes": "祖父"
          }
        ],
        "survivors": [
          {
            "id": 1,
            "name": "王小明",
            "zodiac": "龍",
            "notes": ""
          }
        ]
      },
      "user_created": "admin",
      "date_created": "2026-01-21T14:00:00Z",
      "user_updated": null,
      "date_updated": null
    }
  ],
  "meta": {
    "total": 1,
    "limit": 100,
    "offset": 0
  }
}
```

### 獲取單一報名記錄

#### GET `/api/registrations/{id}`

**路徑參數：**

- `id` (integer) - 報名記錄 ID

**回應：** 同上單一記錄格式

### 創建報名記錄

#### POST `/api/registrations`

**請求體：**

```json
{
  "formId": "REG001",
  "formName": "消災超度報名",
  "formSource": "web",
  "state": "draft",
  "contact": {
    "name": "王小明",
    "phone": "02-12345678",
    "mobile": "0912345678",
    "relationship": "本家"
  },
  "blessing": {
    "address": "台北市信義區",
    "persons": [...]
  },
  "salvation": {
    "address": "台北市信義區",
    "ancestors": [...],
    "survivors": [...]
  }
}
```

**回應：** 創建的記錄 (201 Created)

### 更新報名記錄

#### PUT `/api/registrations/{id}`

**請求體：** 同創建格式 (部分欄位可選)

**回應：** 更新後的記錄

### 刪除報名記錄

#### DELETE `/api/registrations/{id}`

**回應：**

```json
{
  "success": true,
  "message": "報名記錄已刪除"
}
```

### 按用戶獲取報名記錄

#### GET `/api/registrations/user/{user_id}`

**路徑參數：**

- `user_id` (string) - 用戶 ID

**回應：** 該用戶的所有報名記錄

### 按狀態獲取報名記錄

#### GET `/api/registrations/state/{state}`

**路徑參數：**

- `state` (string) - 狀態 (`draft`, `submitted`, `completed`)

**回應：** 指定狀態的所有報名記錄

---

## 每月贊助 API

### 獲取所有贊助記錄

#### GET `/api/monthly-donates`

**查詢參數：**

- `donate_type` (string, optional) - 贊助類型篩選
- `registration_id` (integer, optional) - 關聯報名 ID
- `sort` (string, optional) - 排序欄位
- `limit` (integer, optional) - 每頁數量
- `offset` (integer, optional) - 偏移量

**回應：**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "王小明",
      "registrationId": 10,
      "donateId": "DON001",
      "donateType": "monthly",
      "donateItems": [
        {
          "donateItemsId": "ITEM001",
          "price": 400,
          "months": ["202512", "202601", "202602"],
          "createdAt": "2025-10-01T08:00:00Z",
          "createdUser": "admin",
          "updatedAt": "",
          "updatedUser": ""
        }
      ],
      "memo": "2025年十二月贊助",
      "icon": "🈷️",
      "createdAt": "2024-10-01T08:00:00Z",
      "createdUser": "admin",
      "updatedAt": "2024-11-16T10:00:00Z",
      "updatedUser": "admin"
    }
  ],
  "meta": {
    "total": 1,
    "limit": 100,
    "offset": 0
  }
}
```

### 創建贊助記錄

#### POST `/api/monthly-donates`

**請求體：**

```json
{
  "name": "王小明",
  "registrationId": 10,
  "donateId": "DON001",
  "donateType": "monthly",
  "donateItems": [
    {
      "price": 400,
      "months": ["202512", "202601", "202602"]
    }
  ],
  "memo": "2025年十二月贊助",
  "icon": "🈷️"
}
```

### 其他贊助 API

- `GET /api/monthly-donates/{id}` - 獲取單一記錄
- `PUT /api/monthly-donates/{id}` - 更新記錄
- `DELETE /api/monthly-donates/{id}` - 刪除記錄
- `GET /api/monthly-donates/registration/{registration_id}` - 按報名 ID 獲取
- `GET /api/monthly-donates/donate/{donate_id}` - 按贊助 ID 獲取

---

## 活動管理 API

### 獲取所有活動

#### GET `/api/activities`

**查詢參數：**

- `state` (string, optional) - 活動狀態 (`planning`, `active`, `completed`, `cancelled`)
- `item_type` (string, optional) - 活動類型
- `activity_id` (string, optional) - 活動 ID 篩選
- `sort` (string, optional) - 排序欄位
- `limit` (integer, optional) - 每頁數量
- `offset` (integer, optional) - 偏移量

**回應：**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "activityId": "ACT001",
      "activityName": "新春祈福法會",
      "itemType": "prayer",
      "state": "active",
      "icon": "🙏",
      "participants": [
        {
          "id": 1,
          "name": "王小明",
          "registrationId": 10,
          "joinDate": "2026-01-01T00:00:00Z",
          "status": "confirmed"
        }
      ],
      "monthlyStats": {
        "2026-01": {
          "totalParticipants": 50,
          "newParticipants": 10,
          "revenue": 25000
        }
      },
      "createdAt": "2026-01-01T00:00:00Z",
      "createdUser": "admin",
      "updatedAt": "2026-01-15T00:00:00Z",
      "updatedUser": "admin"
    }
  ],
  "meta": {
    "total": 1,
    "limit": 100,
    "offset": 0
  }
}
```

### 創建活動

#### POST `/api/activities`

**請求體：**

```json
{
  "activityId": "ACT001",
  "activityName": "新春祈福法會",
  "itemType": "prayer",
  "state": "planning",
  "icon": "🙏",
  "participants": [],
  "monthlyStats": {}
}
```

### 其他活動 API

- `GET /api/activities/{id}` - 獲取單一活動
- `PUT /api/activities/{id}` - 更新活動
- `DELETE /api/activities/{id}` - 刪除活動
- `GET /api/activities/activity/{activity_id}` - 按活動 ID 獲取

---

## 參加記錄 API

### 獲取所有參加記錄

#### GET `/api/participation-records`

**查詢參數：**

- `registration_id` (integer, optional) - 關聯報名 ID
- `activity_id` (string, optional) - 活動 ID 篩選
- `state` (string, optional) - 狀態篩選 (`confirmed`, `pending`, `cancelled`)
- `payment_state` (string, optional) - 付款狀態 (`paid`, `partial`, `unpaid`, `waived`)
- `sort` (string, optional) - 排序欄位
- `limit` (integer, optional) - 每頁數量
- `offset` (integer, optional) - 偏移量

**回應：**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "registrationId": 1,
      "activityId": "w4x5y6z",
      "state": "confirmed",
      "items": [
        {
          "type": "chaodu",
          "label": "超度/超薦",
          "price": 1000,
          "quantity": 2,
          "subtotal": 2000,
          "source": "salvation.ancestors",
          "sourceData": [
            { "id": 1, "surname": "王", "notes": "祖父" },
            { "id": 2, "surname": "王", "notes": "祖母" }
          ],
          "sourceAddress": "台北市信義區"
        },
        {
          "type": "diandeng",
          "label": "點燈",
          "price": 600,
          "quantity": 1,
          "subtotal": 600,
          "source": "blessing.persons",
          "sourceData": [
            { "id": 1, "name": "王小明", "zodiac": "龍" }
          ],
          "sourceAddress": "台北市信義區",
          "lampDetails": [
            {
              "personId": 1,
              "personName": "王小明",
              "lampType": "guangming",
              "lampTypeLabel": "光明燈",
              "price": 600
            }
          ]
        }
      ],
      "contact": {
        "name": "王小明",
        "phone": "02-12345678",
        "mobile": "0912345678"
      },
      "totalAmount": 2600,
      "discountAmount": 0,
      "finalAmount": 2600,
      "paidAmount": 2600,
      "needReceipt": true,
      "receiptNumber": "R2025010001",
      "receiptIssued": true,
      "receiptIssuedAt": "2026-01-21T10:00:00Z",
      "receiptIssuedBy": "admin",
      "paymentState": "paid",
      "paymentMethod": "cash",
      "paymentDate": "2026-01-21T09:30:00Z",
      "accountingState": "reconciled",
      "accountingDate": "2026-01-21T15:00:00Z",
      "accountingBy": "admin",
      "notes": "",
      "createdAt": "2026-01-21T09:00:00Z",
      "createdUser": "admin"
    }
  ],
  "meta": {
    "total": 1,
    "limit": 100,
    "offset": 0
  }
}
```

### 創建參加記錄

#### POST `/api/participation-records`

**請求體：**

```json
{
  "registrationId": 1,
  "activityId": "w4x5y6z",
  "state": "confirmed",
  "items": [
    {
      "type": "chaodu",
      "label": "超度/超薦",
      "price": 1000,
      "quantity": 2,
      "subtotal": 2000,
      "source": "salvation.ancestors",
      "sourceData": [...],
      "sourceAddress": "台北市信義區"
    }
  ],
  "contact": {
    "name": "王小明",
    "phone": "02-12345678"
  },
  "totalAmount": 2000,
  "notes": ""
}
```

### 其他參加記錄 API

- `GET /api/participation-records/{id}` - 獲取單一記錄
- `PUT /api/participation-records/{id}` - 更新記錄
- `DELETE /api/participation-records/{id}` - 刪除記錄
- `GET /api/participation-records/registration/{registration_id}` - 按報名 ID 獲取
- `POST /api/participation-records/{id}/payment` - 記錄付款
- `POST /api/participation-records/{id}/receipt` - 開立收據
- `POST /api/participation-records/{id}/accounting` - 會計沖帳

---

## 認證 API

### 登入

#### POST `/api/auth/login`

**請求體：**

```json
{
  "username": "admin",
  "password": "password123"
}
```

**回應：**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "role": "admin"
    },
    "expires_at": "2026-01-22T15:00:00Z"
  }
}
```

### 登出

#### POST `/api/auth/logout`

**標頭：**

```
Authorization: Bearer <token>
```

**回應：**

```json
{
  "success": true,
  "message": "登出成功"
}
```

### 驗證 Token

#### GET `/api/auth/verify`

**標頭：**

```
Authorization: Bearer <token>
```

**回應：**

```json
{
  "success": true,
  "data": {
    "valid": true,
    "user": {
      "id": 1,
      "username": "admin",
      "role": "admin"
    }
  }
}
```

---

## 錯誤處理

### 常見錯誤碼

| 錯誤碼             | 說明           | 解決方案             |
| ------------------ | -------------- | -------------------- |
| `VALIDATION_ERROR` | 輸入驗證失敗   | 檢查請求參數格式     |
| `NOT_FOUND`        | 資源不存在     | 確認資源 ID 正確     |
| `UNAUTHORIZED`     | 未認證         | 提供有效的認證 Token |
| `FORBIDDEN`        | 權限不足       | 檢查用戶權限         |
| `DATABASE_ERROR`   | 資料庫錯誤     | 聯繫系統管理員       |
| `INTERNAL_ERROR`   | 內部服務器錯誤 | 聯繫系統管理員       |

### 錯誤回應範例

```json
{
  "success": false,
  "message": "驗證失敗",
  "error": "VALIDATION_ERROR",
  "details": {
    "field": "contact.name",
    "message": "聯絡人姓名為必填欄位"
  }
}
```

---

## 測試工具

### API 測試腳本

專案提供了完整的 API 測試腳本：

```bash
# 測試報名 API
./scripts/test_rust_registration_api.sh

# 測試活動 API
./scripts/test_rust_activity_api.sh

# 使用模擬數據測試
./scripts/test_rust_registration_api_mockdata.sh
```

### Postman Collection

可以使用以下 curl 命令測試 API：

```bash
# 健康檢查
curl -X GET http://localhost:3000/health

# 獲取所有報名記錄
curl -X GET http://localhost:3000/api/registrations

# 創建報名記錄
curl -X POST http://localhost:3000/api/registrations \
  -H "Content-Type: application/json" \
  -d '{"formName": "測試報名", "state": "draft", ...}'
```

---

## 版本更新

### API 版本控制

- 當前版本: `v1`
- 向後兼容性保證
- 重大變更會提前通知

### 更新日誌

請參考 `CHANGELOG.md` 了解 API 變更歷史。

---

## 支援與聯繫

如有 API 使用問題，請：

1. 查看本文檔
2. 檢查測試腳本範例
3. 查看系統日誌
4. 聯繫開發團隊
