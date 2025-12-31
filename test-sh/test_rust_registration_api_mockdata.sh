#!/bin/bash
# test_registration_api_simple.sh - 使用真實數據的 Registration API 測試腳本

BASE_URL="http://localhost:3000"

echo "🧪 開始測試 Registration API (使用真實數據)"
echo "=============================================="

# 讀取測試數據
echo "📋 讀取測試數據..."
DATA1='{
  "state": "submitted",
  "formName": "2025祈福rust axum登記表-001",
  "formSource": "RUST朝山法會",
  "formId": "a1b2c3d",
  "contact": "{\"name\": \"王大明\", \"phone\": \"02-12345678\", \"mobile\": \"0912-345-678\", \"relationship\": \"本家\", \"otherRelationship\": \"\"}",
  "blessing": "{\"address\": \"台北市中正區中山南路1號\", \"persons\": [{\"id\": 1, \"name\": \"王大明\", \"zodiac\": \"龍\", \"notes\": \"\", \"isHouseholdHead\": true}, {\"id\": 2, \"name\": \"李小華\", \"zodiac\": \"蛇\", \"notes\": \"妻子\", \"isHouseholdHead\": false}]}",
  "salvation": "{\"address\": \"台北市中正區中山南路1號\", \"ancestors\": [{\"id\": 1, \"surname\": \"王府\", \"notes\": \"歷代祖先\"}], \"survivors\": [{\"id\": 1, \"name\": \"王大明\", \"zodiac\": \"龍\", \"notes\": \"\"}, {\"id\": 2, \"name\": \"李小華\", \"zodiac\": \"蛇\", \"notes\": \"\"}]}"
}'

DATA2='{
  "state": "submitted",
  "formName": "2025祈福rust axum登記表-002",
  "formSource": "RUST朝山法會",
  "formId": "e4f5g6h",
  "contact": "{\"name\": \"陳美玲\", \"phone\": \"\", \"mobile\": \"0923-456-789\", \"relationship\": \"娘家\", \"otherRelationship\": \"\"}",
  "blessing": "{\"address\": \"新北市板橋區文化路二段100號\", \"persons\": [{\"id\": 1, \"name\": \"陳美玲\", \"zodiac\": \"兔\", \"notes\": \"\", \"isHouseholdHead\": true}, {\"id\": 2, \"name\": \"陳志豪\", \"zodiac\": \"虎\", \"notes\": \"弟弟\", \"isHouseholdHead\": false}]}",
  "salvation": "{\"address\": \"新北市板橋區文化路二段100號\", \"ancestors\": [{\"id\": 1, \"surname\": \"陳氏\", \"notes\": \"\"}], \"survivors\": [{\"id\": 1, \"name\": \"陳美玲\", \"zodiac\": \"兔\", \"notes\": \"\"}, {\"id\": 2, \"name\": \"陳志豪\", \"zodiac\": \"虎\", \"notes\": \"\"}]}"
}'

# 1. 創建第一筆報名記錄
echo "1️⃣ 創建第一筆報名記錄"
CREATE1_RESPONSE=$(curl -s -X POST "$BASE_URL/api/registrations" \
  -H "Content-Type: application/json" \
  -d "$DATA1")
echo "$CREATE1_RESPONSE" | jq .

REG_ID1=$(echo "$CREATE1_RESPONSE" | jq -r '.data.id')
echo "✅ 創建的報名記錄 ID: $REG_ID1"
echo -e "\n"

# 2. 創建第二筆報名記錄
echo "2️⃣ 創建第二筆報名記錄"
CREATE2_RESPONSE=$(curl -s -X POST "$BASE_URL/api/registrations" \
  -H "Content-Type: application/json" \
  -d "$DATA2")
echo "$CREATE2_RESPONSE" | jq .

REG_ID2=$(echo "$CREATE2_RESPONSE" | jq -r '.data.id')
echo "✅ 創建的報名記錄 ID: $REG_ID2"
echo -e "\n"

# # 3. 獲取所有報名記錄
# echo "3️⃣ 獲取所有報名記錄"
# curl -s "$BASE_URL/api/registrations" | jq .
# echo -e "\n"

# # 4. 測試查詢功能
# echo "4️⃣ 測試查詢功能 - 根據 formId 查詢"
# curl -s "$BASE_URL/api/registrations?formId=a1b2c3d" | jq .
# echo -e "\n"

# echo "5️⃣ 測試查詢功能 - 根據 formSource 查詢"
# curl -s "$BASE_URL/api/registrations?formSource=RUST朝山法會" | jq .
# echo -e "\n"

# # 5. 測試更新功能
# echo "6️⃣ 測試更新功能 - 更新第一筆記錄"
# curl -s -X PATCH "$BASE_URL/api/registrations/$REG_ID1" \
#   -H "Content-Type: application/json" \
#   -d '{
#     "state": "approved",
#     "formSource": "網站登記"
#   }' | jq .
# echo -e "\n"

# # 6. 驗證更新
# echo "7️⃣ 驗證更新結果"
# curl -s "$BASE_URL/api/registrations/$REG_ID1" | jq .
# echo -e "\n"

# # 7. 測試刪除功能
# echo "8️⃣ 測試刪除功能 - 刪除第一筆記錄"
# curl -s -X DELETE "$BASE_URL/api/registrations/$REG_ID1" | jq .
# echo -e "\n"

# # 8. 最終驗證
# echo "9️⃣ 最終驗證 - 檢查剩餘記錄"
# curl -s "$BASE_URL/api/registrations" | jq .
# echo -e "\n"

echo "✅ 真實數據測試完成！"