#!/bin/bash
# test_registration_api.sh - Registration API 測試腳本

BASE_URL="http://localhost:3000"

echo "🧪 開始測試 Registration API"
echo "================================"

# 1. 創建報名記錄
echo "1️⃣ 創建新報名記錄"
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/registrations" \
  -H "Content-Type: application/json" \
  -d '{
    "formId": "RUST-2024-001",
    "formName": "2026祈福rust axum登記表-001",
    "formSource": "RUST朝山sh表單",
    "state": "submitted",
    "contact": "{\"name\": \"RUST張三\", \"phone\": \"02-12345678\", \"mobile\": \"0912-345-678\", \"relationship\": \"本家\", \"otherRelationship\": \"\"}",
    "blessing": "{\"address\": \"台北市中正區中山南路1號\", \"persons\": [{\"id\": 1, \"name\": \"張三\", \"zodiac\": \"龍\", \"notes\": \"\", \"isHouseholdHead\": true}, {\"id\": 2, \"name\": \"李四\", \"zodiac\": \"蛇\", \"notes\": \"妻子\", \"isHouseholdHead\": false}]}",
    "salvation": "{\"address\": \"台北市中正區中山南路1號\", \"ancestors\": [{\"id\": 1, \"surname\": \"張府\", \"notes\": \"歷代祖先\"}], \"survivors\": [{\"id\": 1, \"name\": \"張三\", \"zodiac\": \"龍\", \"notes\": \"\"}, {\"id\": 2, \"name\": \"李四\", \"zodiac\": \"蛇\", \"notes\": \"\"}]}"
  }')
echo "$CREATE_RESPONSE" | jq .

# 提取 ID
REGISTRATION_ID=$(echo "$CREATE_RESPONSE" | jq -r '.data.id')
echo "✅ 創建的報名記錄 ID: $REGISTRATION_ID"
echo -e "\n"

# 2. 創建第二筆報名記錄（用於測試多筆查詢）
echo "2️⃣ 創建第二筆報名記錄"
curl -s -X POST "$BASE_URL/api/registrations" \
  -H "Content-Type: application/json" \
  -d '{
    "formId": "RUST-2024-002",
    "formName": "2026祈福rust axum登記表-002",
    "formSource": "朝山法會",
    "state": "pending",
    "contact": "{\"name\": \"RUST王五\", \"phone\": \"\", \"mobile\": \"0923-456-789\", \"relationship\": \"娘家\", \"otherRelationship\": \"\"}",
    "blessing": "{\"address\": \"新北市板橋區文化路二段100號\", \"persons\": [{\"id\": 1, \"name\": \"王五\", \"zodiac\": \"兔\", \"notes\": \"\", \"isHouseholdHead\": true}, {\"id\": 2, \"name\": \"趙六\", \"zodiac\": \"虎\", \"notes\": \"弟弟\", \"isHouseholdHead\": false}]}",
    "salvation": "{\"address\": \"新北市板橋區文化路二段100號\", \"ancestors\": [{\"id\": 1, \"surname\": \"王府\", \"notes\": \"\"}], \"survivors\": [{\"id\": 1, \"name\": \"王五\", \"zodiac\": \"兔\", \"notes\": \"\"}, {\"id\": 2, \"name\": \"趙六\", \"zodiac\": \"虎\", \"notes\": \"\"}]}"
  }' | jq .
echo -e "\n"

# # 3. 獲取所有報名記錄
# echo "3️⃣ 獲取所有報名記錄"
# curl -s "$BASE_URL/api/registrations" | jq .
# echo -e "\n"

# # 4. 根據 ID 獲取單個報名記錄
# echo "4️⃣ 根據 ID 獲取報名記錄 (ID: $REGISTRATION_ID)"
# curl -s "$BASE_URL/api/registrations/$REGISTRATION_ID" | jq .
# echo -e "\n"

# 5. 根據 formId 查詢報名記錄
echo "5️⃣ 根據 formId 查詢報名記錄"
curl -s "$BASE_URL/api/registrations?formId=RUST-2024-001" | jq .
echo -e "\n"

# # 6. 根據狀態查詢報名記錄
# echo "6️⃣ 根據狀態查詢報名記錄 (state=submitted)"
# curl -s "$BASE_URL/api/registrations?state=submitted" | jq .
# echo -e "\n"

# # 7. 根據狀態查詢待處理的報名記錄
# echo "7️⃣ 根據狀態查詢待處理的報名記錄 (state=pending)"
# curl -s "$BASE_URL/api/registrations?state=pending" | jq .
# echo -e "\n"

# 8. 更新報名記錄
echo "8️⃣ 更新報名記錄 (ID: $REGISTRATION_ID)"
UPDATE_RESPONSE=$(curl -s -X PATCH "$BASE_URL/api/registrations/$REGISTRATION_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "state": "approved",
    "formName": "2026祈福rust axum登記表-001（已審核）"
  }')
echo "$UPDATE_RESPONSE" | jq .
echo -e "\n"

# 9. 更新 JSON 字段（contact）
echo "9️⃣ 更新 contact JSON 字段"
curl -s -X PATCH "$BASE_URL/api/registrations/$REGISTRATION_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "contact": "{\"name\": \"RUST張三RUST\", \"phone\": \"02-87654321\", \"mobile\": \"0988-765-432\", \"relationship\": \"本家\", \"otherRelationship\": \"\", \"email\": \"zhangsan@example.com\"}",
    "blessing": "{\"address\": \"台北市中正區中山南路1號\", \"persons\": [{\"id\": 1, \"name\": \"張三\", \"zodiac\": \"龍\", \"notes\": \"\", \"isHouseholdHead\": true}, {\"id\": 2, \"name\": \"李四\", \"zodiac\": \"蛇\", \"notes\": \"妻子\", \"isHouseholdHead\": false}, {\"id\": 3, \"name\": \"張小寶\", \"zodiac\": \"馬\", \"notes\": \"兒子\", \"isHouseholdHead\": false}]}"
  }' | jq .
echo -e "\n"

# 10. 驗證更新後的記錄
echo "🔟 驗證更新後的記錄 (ID: $REGISTRATION_ID)"
curl -s "$BASE_URL/api/registrations/$REGISTRATION_ID" | jq .
echo -e "\n"

# # 11. 測試分頁功能
# echo "1️⃣1️⃣ 測試分頁功能 (limit=1, offset=0)"
# curl -s "$BASE_URL/api/registrations?limit=1&offset=0" | jq .
# echo -e "\n"

# echo "1️⃣2️⃣ 測試分頁功能 (limit=1, offset=1)"
# curl -s "$BASE_URL/api/registrations?limit=1&offset=1" | jq .
# echo -e "\n"

# # 12. 測試排序功能
# echo "1️⃣3️⃣ 測試排序功能 (按 createdAt 降序)"
# curl -s "$BASE_URL/api/registrations?sort=-createdAt" | jq .
# echo -e "\n"

# echo "1️⃣4️⃣ 測試排序功能 (按 formName 升序)"
# curl -s "$BASE_URL/api/registrations?sort=formName" | jq .
# echo -e "\n"

# # 13. 刪除報名記錄
# echo "1️⃣5️⃣ 刪除報名記錄 (ID: $REGISTRATION_ID)"
# DELETE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/api/registrations/$REGISTRATION_ID")
# echo "$DELETE_RESPONSE" | jq .
# echo -e "\n"

# # 14. 驗證刪除
# echo "1️⃣6️⃣ 驗證報名記錄已刪除"
# curl -s "$BASE_URL/api/registrations/$REGISTRATION_ID" | jq .
# echo -e "\n"

# # 15. 獲取刪除後的記錄列表
# echo "1️⃣7️⃣ 獲取刪除後的記錄列表"
# curl -s "$BASE_URL/api/registrations" | jq .
# echo -e "\n"

echo "✅ Registration API 測試完成！"