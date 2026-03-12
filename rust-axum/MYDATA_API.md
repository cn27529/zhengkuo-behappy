# MyData CRUD API 實現說明

## 已生成的文件

### 1. Model 層 (`src/models/my_data.rs`)
- `MyData` - 資料庫模型，對應 `mydata` 表
- `CreateMyDataRequest` - 創建請求 DTO
- `UpdateMyDataRequest` - 更新請求 DTO
- `MyDataQuery` - 查詢參數
- `MyDataResponse` - API 響應 DTO
- JSON 字段處理：`contact` 字段使用自定義序列化/反序列化函數

### 2. Handler 層 (`src/handlers/my_data.rs`)
實現的 CRUD 操作：
- `get_all_my_data` - 獲取所有記錄（支持分頁、過濾、排序）
- `get_my_data_by_id` - 根據 ID 獲取單筆記錄
- `create_my_data` - 創建新記錄（自動生成 UUID）
- `update_my_data` - 更新記錄
- `delete_my_data` - 刪除記錄

### 3. Route 層 (`src/routes/my_data.rs`)
API 端點：
- `GET /api/my-data` - 獲取所有記錄
- `POST /api/my-data` - 創建記錄
- `GET /api/my-data/{id}` - 獲取單筆記錄
- `PATCH /api/my-data/{id}` - 更新記錄
- `DELETE /api/my-data/{id}` - 刪除記錄

## 關鍵特性

### JSON 字段處理
`contact` 字段使用與 `monthly_donate.rs` 相同的處理方式：
- 資料庫存儲：JSON 字符串
- API 輸入：接收 JSON 對象
- API 輸出：返回 JSON 對象
- 使用自定義 `serialize_json_string` 和 `deserialize_json_string` 函數

### UUID 主鍵
- 使用 `uuid::Uuid::new_v4()` 生成 36 字符的 UUID
- 符合 SQL schema 中的 `char(36)` 定義

### 查詢功能
支持的查詢參數：
- `state` - 狀態過濾
- `formName` - 表單名稱模糊搜索
- `limit` - 分頁限制（默認 100）
- `offset` - 分頁偏移（默認 0）
- `sort` - 排序（支持 `-` 前綴表示降序）

### 時間戳處理
- `date_created` 和 `date_updated` 從 Unix 毫秒時間戳轉換為 ISO 8601 格式
- 使用 SQLite 的 `datetime()` 函數進行轉換

## 已完成的集成

✅ 在 `src/models/mod.rs` 中註冊模組
✅ 在 `src/handlers/mod.rs` 中註冊模組
✅ 在 `src/routes/mod.rs` 中註冊模組
✅ 在 `src/main.rs` 中添加路由
✅ 代碼編譯通過

## 使用範例

### 創建記錄
```bash
curl -X POST http://localhost:3000/api/my-data \
  -H "Content-Type: application/json" \
  -d '{
    "state": "active",
    "formName": "聯絡表單",
    "contact": {
      "name": "張三",
      "phone": "0912345678",
      "email": "test@example.com"
    }
  }'
```

### 查詢記錄
```bash
# 獲取所有記錄
curl http://localhost:3000/api/my-data

# 帶查詢參數
curl "http://localhost:3000/api/my-data?state=active&limit=10&offset=0&sort=-date_created"

# 獲取單筆記錄
curl http://localhost:3000/api/my-data/{uuid}
```

### 更新記錄
```bash
curl -X PATCH http://localhost:3000/api/my-data/{uuid} \
  -H "Content-Type: application/json" \
  -d '{
    "state": "completed",
    "contact": {
      "name": "張三",
      "phone": "0987654321"
    }
  }'
```

### 刪除記錄
```bash
curl -X DELETE http://localhost:3000/api/my-data/{uuid}
```

## 注意事項

1. **UUID 格式**：ID 為 36 字符的 UUID（包含連字符）
2. **JSON 字段**：`contact` 字段在 API 中為 JSON 對象，資料庫中為字符串
3. **時間戳**：Directus 系統字段的時間戳會自動轉換為 ISO 8601 格式
4. **錯誤處理**：所有操作都有完整的錯誤處理和日誌記錄
