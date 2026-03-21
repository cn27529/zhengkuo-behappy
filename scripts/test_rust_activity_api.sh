#!/bin/bash
# test_api.sh - Activity API 測試腳本

BASE_URL="http://localhost:3000"

echo "🧪 開始測試 Activity API"
echo "================================"

# 1. 健康檢查
echo "1️⃣ 測試健康檢查"
curl -s "$BASE_URL/health" | jq .
echo -e "\n"

# 2. 數據庫連接測試
echo "2️⃣ 測試數據庫連接"
curl -s "$BASE_URL/db-test" | jq .
echo -e "\n"

# 3. 創建活動
echo "3️⃣ 創建新活動"
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/activities" \
  -H "Content-Type: application/json" \
  -d '{
    "activityId": "ACT-2024-001",
    "name": "RUST新春祈福法會",
    "itemType": "ceremony",
    "participants": 150,
    "date": "2024-02-10T10:00:00Z",
    "state": "upcoming",
    "icon": "🕯️",
    "description": "農曆新年祈福法會",
    "location": "大雄寶殿"
  }')
echo "$CREATE_RESPONSE" | jq .

# 提取 ID
ACTIVITY_ID=$(echo "$CREATE_RESPONSE" | jq -r '.data.id')
echo "✅ 創建的活動 ID: $ACTIVITY_ID"
echo -e "\n"

# 4. 獲取所有活動
echo "4️⃣ 獲取所有活動"
curl -s "$BASE_URL/api/activities" | jq .
echo -e "\n"

# 5. 根據 ID 獲取單個活動
echo "5️⃣ 根據 ID 獲取活動 (ID: $ACTIVITY_ID)"
curl -s "$BASE_URL/api/activities/$ACTIVITY_ID" | jq .
echo -e "\n"

# 6. 根據 activityId 獲取活動
echo "6️⃣ 根據 activityId 獲取活動"
curl -s "$BASE_URL/api/activities/by-activity-id/ACT-2024-001" | jq .
echo -e "\n"

# 7. 更新活動
echo "7️⃣ 更新活動 (ID: $ACTIVITY_ID)"
curl -s -X PATCH "$BASE_URL/api/activities/$ACTIVITY_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "participants": 200,
    "state": "ongoing",
    "description": "農曆新年祈福法會 - 已開始"
  }' | jq .
echo -e "\n"

# 8. 查詢特定狀態的活動
echo "8️⃣ 查詢進行中的活動"
curl -s "$BASE_URL/api/activities?state=ongoing" | jq .
echo -e "\n"

# # 9. 測試分頁
# echo "9️⃣ 測試分頁 (limit=5, offset=0)"
# curl -s "$BASE_URL/api/activities?limit=5&offset=0" | jq .
# echo -e "\n"

# # 10. 刪除活動
# echo "🔟 刪除活動 (ID: $ACTIVITY_ID)"
# curl -s -X DELETE "$BASE_URL/api/activities/$ACTIVITY_ID" | jq .
# echo -e "\n"

# # 11. 驗證刪除
# echo "1️⃣1️⃣ 驗證活動已刪除"
# curl -s "$BASE_URL/api/activities/$ACTIVITY_ID" | jq .
# echo -e "\n"

echo "✅ 測試完成！"