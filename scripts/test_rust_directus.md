# 1. 啟動 Directus（假設在 port 8055）

cd server
npx directus start

# 2. 在另一個終端啟動 Rust Axum（port 3000）

cd rust-axum
cargo run

# 3. 測試 Rust API

curl http://localhost:3000/db-test

# 應該看到 Directus 數據庫中的記錄數量

# 4. 創建一筆活動（通過 Rust）

curl -X POST http://localhost:3000/api/activities \
 -H "Content-Type: application/json" \
 -d '{
"activityId": "ACT-RUST-001",
"name": "Rust 創建的活動",
"itemType": "ceremony",
"participants": 100,
"date": "2024-02-10T10:00:00Z",
"state": "upcoming",
"icon": "🦀"
}'

# 5. 到 Directus Admin 查看

# 打開 http://localhost:8055/admin

# 應該能看到剛創建的記錄

```

## 📊 完整的數據流
```

前端創建活動
│
├─→ 需要認證? → Directus (POST /auth/login)
│ ↓
│ 返回 JWT Token
│
└─→ CRUD 操作? → Rust Axum (POST /api/activities)
↓
寫入 SQLite (activityDB 表)
↓
Directus Admin 可即時看到新記錄
