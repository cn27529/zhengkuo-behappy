# 操作記錄資料結構說明
檔案位置：`/src/data/mock_logentrys.json`

## 概要

操作記錄 (Log Entries) 是寺廟管理系統中記錄所有 API 操作的核心資料結構，用於追蹤系統中的所有資料變更、API 呼叫狀態、錯誤處理及效能監控。當資料誤刪除時，可以從 `context.requestBody` 中找回完整的資料內容。

## 主要資料結構

### LogEntry (操作記錄)

```json
{
  "timestamp": "2026-01-29T06:14:26.821Z",           // 操作時間戳記
  "endpoint": "http://localhost:8055/items/activityDB/51", // API 端點
  "method": "DELETE",                                 // HTTP 方法
  "status": 204,                                      // HTTP 狀態碼
  "statusText": "No Content",                         // 狀態文字
  "context": {...},                                   // 操作上下文（核心資料）
  "duration": 76,                                     // 請求持續時間（毫秒）
  "success": false,                                   // 操作是否成功
  "jsonParseError": false,                           // JSON 解析是否錯誤
  "parseError": "",                                   // 解析錯誤訊息
  "error": false,                                     // 是否發生錯誤
  "errorText": "",                                    // 錯誤文字
  "errorMessage": "",                                 // 錯誤訊息
  "noContent": true,                                  // 是否無回應內容
  "id": "19fcb367-b6cb-4107-ab29-ec60828d3880",      // 記錄唯一識別碼
  "userAgent": "Mozilla/5.0...",                      // 使用者代理字串
  "url": "http://localhost:5173/activity-list"       // 前端頁面 URL
}
```

### Context (操作上下文) - 核心欄位

```json
{
  "service": "ActivityService",                       // 服務名稱
  "operation": "deleteActivity",                      // 操作名稱（方法名稱）
  "startTime": 1769667266718,                        // 操作開始時間戳記
  "method": "DELETE",                                 // HTTP 方法
  "endpoint": "http://localhost:8055/items/activityDB/51", // API 端點
  "requestBody": {...},                              // 請求資料內容（重要：資料恢復來源）
  "duration": 76                                      // 操作持續時間（毫秒）
}
```

### RequestBody (請求資料)

請求資料的結構會根據不同的服務和操作而有所不同：

#### ActivityDB (活動資料)
```json
{
  "id": 51,
  "user_created": "a4954ebc-8591-4288-8ebe-a4af19e718f7",
  "date_created": "2026-01-29T06:12:36.255Z",
  "user_updated": null,
  "date_updated": null,
  "activityId": "baee208",                           // 活動識別碼
  "name": "1341234",                                 // 活動名稱
  "item_type": "ceremony",                           // 活動類型
  "participants": 666,                               // 參加人數
  "date": "2026-01-31 00:00",                       // 活動日期
  "state": "upcoming",                               // 活動狀態
  "icon": "🕯️",                                     // 活動圖示
  "description": "1234123412",                       // 活動描述
  "location": "1234123412",                          // 活動地點
  "createdAt": "2026-01-29T06:12:36.083Z",          // 建立時間
  "updatedAt": null,                                 // 更新時間
  "deletedAt": "2026-01-29T06:14:26.718Z",          // 刪除時間
  "deletedUser": "a4954ebc-8591-4288-8ebe-a4af19e718f7" // 刪除者
}
```

#### RegistrationDB (登記資料)
```json
{
  "id": 108,
  "state": "updated",                                // 登記狀態
  "createdAt": "2026-01-27T12:33:48.689Z",
  "createdUser": "",
  "updatedAt": "2026-01-29T04:17:52.361Z",
  "updatedUser": "d7fe9cb7-26cd-419a-96f5-3dce505844bf",
  "formName": "消災超度報名表OnService",             // 表單名稱
  "formId": "183be03",                               // 表單識別碼
  "formSource": "",                                  // 表單來源
  "contact": {...},                                  // 聯絡資訊
  "blessing": {...},                                 // 祈福資訊
  "salvation": {...},                                // 超度資訊
  "user_created": "a4954ebc-8591-4288-8ebe-a4af19e718f7",
  "date_created": "2026-01-23 20:33:48",
  "user_updated": "d7fe9cb7-26cd-419a-96f5-3dce505844bf",
  "date_updated": "2026-01-29 04:17:24"
}
```

##### Contact (聯絡資訊)
```json
{
  "name": "BK123",                                   // 姓名
  "phone": "048-353868",                             // 電話
  "mobile": "0928230520",                            // 手機
  "relationship": "娘家",                            // 關係
  "otherRelationship": "BK"                          // 其他關係說明
}
```

##### Blessing (祈福資訊)
```json
{
  "address": "台北市永和區永福路二段111巷3弄10號4,5樓",
  "persons": [                                       // 祈福人員清單
    {
      "id": 1,
      "isHouseholdHead": true,                       // 是否為戶長
      "name": "陳一書",                              // 姓名
      "notes": "爸爸👨",                             // 備註
      "zodiac": "虎"                                 // 生肖
    }
  ]
}
```

##### Salvation (超度資訊)
```json
{
  "address": "",
  "ancestors": [                                     // 祖先清單
    {
      "id": 1,
      "notes": "",
      "surname": "",                                 // 姓氏/門第
      "zodiac": ""
    }
  ],
  "survivors": [                                     // 陽上人清單
    {
      "id": 1,
      "name": "",
      "notes": "",
      "zodiac": ""
    }
  ]
}
```

## 服務與操作對照表

| 服務名稱 (Service) | 操作名稱 (Operation) | HTTP 方法 | 說明 |
|-------------------|---------------------|----------|------|
| `ActivityService` | `createActivity` | POST | 建立活動 |
| `ActivityService` | `updateActivity` | PATCH | 更新活動 |
| `ActivityService` | `deleteActivity` | DELETE | 刪除活動 |
| `RegistrationService` | `createRegistration` | POST | 建立登記 |
| `RegistrationService` | `updateRegistration` | POST | 更新登記 |
| `RegistrationService` | `deleteRegistration` | DELETE | 刪除登記 |

## HTTP 狀態碼定義

| 狀態碼 | 狀態文字 | 說明 | Success 值 |
|-------|---------|------|-----------|
| `200` | OK | 請求成功 | true |
| `201` | Created | 資源建立成功 | true |
| `204` | No Content | 請求成功但無回應內容（通常用於刪除） | false* |
| `400` | Bad Request | 請求錯誤 | false |
| `404` | Not Found | 資源不存在 | false |
| `500` | Internal Server Error | 伺服器錯誤 | false |

*註：DELETE 操作回傳 204 時，`success` 為 false 但 `noContent` 為 true，表示刪除成功但無回應內容。

## 資料範例

### 範例1：刪除活動記錄
刪除活動操作，HTTP 204 狀態，無回應內容但操作成功。完整的活動資料保存在 `context.requestBody` 中，包含刪除時間和刪除者資訊。

### 範例2：建立活動記錄
建立新活動操作，HTTP 200 狀態，包含完整的活動資料和建立者資訊。

### 範例3：更新登記記錄
更新登記表操作，包含完整的表單資料、聯絡資訊、祈福人員和超度資訊。記錄了更新時間和更新者。

## 業務規則

### 資料恢復機制
- 所有操作的完整資料都儲存在 `context.requestBody` 中
- 刪除操作會記錄 `deletedAt` 和 `deletedUser`
- 可透過 `requestBody` 完整還原被刪除的資料

### 時間戳記
- `timestamp`: 記錄產生時間（ISO 8601 格式）
- `startTime`: 操作開始時間（Unix 時間戳記，毫秒）
- `duration`: 操作執行時間（毫秒）

### 追蹤資訊
- `id`: 每筆記錄的唯一識別碼（UUID）
- `userAgent`: 記錄使用者的瀏覽器資訊
- `url`: 記錄前端頁面位置

### 錯誤處理
- `error`: 是否發生錯誤
- `jsonParseError`: JSON 解析是否失敗
- `parseError` / `errorText` / `errorMessage`: 詳細錯誤訊息

## 使用場景

### 1. 資料恢復
當資料被誤刪除時，可從對應的 DELETE 操作記錄中取得完整資料：
```javascript
// 找到刪除記錄
const deleteLog = logEntries.find(log => 
  log.method === 'DELETE' && 
  log.context.requestBody.id === targetId
);

// 從 requestBody 恢復資料
const recoveredData = deleteLog.context.requestBody;
```

### 2. 操作審計
追蹤特定使用者或時間範圍內的所有操作：
```javascript
// 查詢特定使用者的所有操作
const userOperations = logEntries.filter(log => 
  log.context.requestBody.user_created === userId ||
  log.context.requestBody.user_updated === userId
);
```

### 3. 效能監控
分析 API 操作的執行效能：
```javascript
// 找出執行時間超過 100ms 的操作
const slowOperations = logEntries.filter(log => 
  log.duration > 100
);
```

### 4. 錯誤追蹤
快速定位系統錯誤：
```javascript
// 找出所有失敗的操作
const failedOperations = logEntries.filter(log => 
  log.error === true || log.success === false
);
```

## 檔案位置

- 模擬資料：`.client/src/data/mock_logentrys.json`
- 記錄管理服務：`.client/src/services/loEntryService.js`
- 操作記錄介面：`.client/src/views/LogViewPage.vue`

## 注意事項

1. **資料保護**：`requestBody` 包含完整的業務資料，需注意存取權限控制
2. **儲存容量**：長期運作會累積大量記錄，需定期歸檔或清理
3. **敏感資訊**：記錄中可能包含使用者個人資訊，需符合隱私保護規範
4. **效能考量**：記錄查詢應建立適當的索引（timestamp, service, operation）
5. **時區處理**：所有時間戳記使用 UTC 時區（ISO 8601 格式）
