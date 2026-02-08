#!/bin/bash
# test_rust_mydata_api.sh - MyData API 測試腳本

BASE_URL="http://localhost:3000"

echo "🧪 開始測試 MyData API"
echo "================================"

# 1. 健康檢查
echo "1️⃣ 測試健康檢查"
curl -s "$BASE_URL/health" | jq .
echo -e "\n"

# 2. 數據庫連接測試
echo "2️⃣ 測試數據庫連接"
curl -s "$BASE_URL/db-test" | jq .
echo -e "\n"

# 3. 創建 MyData 記錄
echo "3️⃣ 創建新 MyData 記錄"
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/my-data" \
  -H "Content-Type: application/json" \
  -d '{
    "state": "active",
    "formName": "聯絡表單",
    "contact": {
      "name": "張三",
      "phone": "0912345678",
      "email": "test@example.com",
      "address": "台北市信義區"
    }
  }')
echo "$CREATE_RESPONSE" | jq .

# 提取 ID
MY_DATA_ID=$(echo "$CREATE_RESPONSE" | jq -r '.data.id')
echo "✅ 創建的 MyData ID: $MY_DATA_ID"
echo -e "\n"

# 4. 獲取所有 MyData
echo "4️⃣ 獲取所有 MyData"
curl -s "$BASE_URL/api/my-data" | jq .
echo -e "\n"

# 5. 根據 ID 獲取單個 MyData
echo "5️⃣ 根據 ID 獲取 MyData (ID: $MY_DATA_ID)"
curl -s "$BASE_URL/api/my-data/$MY_DATA_ID" | jq .
echo -e "\n"

# 6. 根據 state 獲取 MyData
echo "6️⃣ 根據 state 獲取 MyData"
curl -s "$BASE_URL/api/my-data/by-state/active" | jq .
echo -e "\n"

# 7. 更新 MyData
echo "7️⃣ 更新 MyData (ID: $MY_DATA_ID)"
curl -s -X PATCH "$BASE_URL/api/my-data/$MY_DATA_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "state": "completed",
    "contact": {
      "name": "張三",
      "phone": "0987654321",
      "email": "updated@example.com",
      "address": "台北市大安區",
      "note": "已更新"
    }
  }' | jq .
echo -e "\n"

# 8. 查詢特定狀態的 MyData
echo "8️⃣ 查詢已完成的 MyData"
curl -s "$BASE_URL/api/my-data?state=completed" | jq .
echo -e "\n"

# 9. 測試分頁
echo "9️⃣ 測試分頁 (limit=5, offset=0)"
curl -s "$BASE_URL/api/my-data?limit=5&offset=0" | jq .
echo -e "\n"

# 10. 刪除 MyData
echo "🔟 刪除 MyData (ID: $MY_DATA_ID)"
curl -s -X DELETE "$BASE_URL/api/my-data/$MY_DATA_ID" | jq .
echo -e "\n"

# 11. 驗證刪除
echo "1️⃣1️⃣ 驗證 MyData 已刪除"
curl -s "$BASE_URL/api/my-data/$MY_DATA_ID" | jq .
echo -e "\n"

echo "✅ 測試完成！"
