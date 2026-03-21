#!/bin/bash

echo "🧪 測試 Participation Record API 端點"
echo "======================================="

# 基礎 URL
BASE_URL="http://127.0.0.1:3000"

echo ""
echo "📋 可用的 API 端點："
echo "GET    $BASE_URL/api/participation-records                     - 獲取所有參與記錄"
echo "POST   $BASE_URL/api/participation-records                     - 創建新參與記錄"
echo "GET    $BASE_URL/api/participation-records/{id}                - 根據 ID 獲取參與記錄"
echo "PATCH  $BASE_URL/api/participation-records/{id}                - 更新參與記錄"
echo "DELETE $BASE_URL/api/participation-records/{id}                - 刪除參與記錄"
echo "GET    $BASE_URL/api/participation-records/by-registration/{registration_id} - 根據 registrationId 獲取"
echo "GET    $BASE_URL/api/participation-records/by-activity/{activity_id}         - 根據 activityId 獲取"

echo ""
echo "💡 測試示例："
echo ""
echo "1. 創建新參與記錄："
echo 'curl -X POST $BASE_URL/api/participation-records \\'
echo '  -H "Content-Type: application/json" \\'
echo '  -d "{"'
echo '    "registrationId": 1,'
echo '    "activityId": 1,'
echo '    "state": "active",'
echo '    "items": [{"name": "祈福", "amount": 500}],'
echo '    "totalAmount": 500,'
echo '    "finalAmount": 500,'
echo '    "paymentState": "pending"'
echo '  }"'

echo ""
echo "2. 獲取所有參與記錄："
echo "curl $BASE_URL/api/participation-records"

echo ""
echo "3. 根據 registrationId 查詢："
echo "curl $BASE_URL/api/participation-records/by-registration/1"

echo ""
echo "4. 根據 activityId 查詢："
echo "curl $BASE_URL/api/participation-records/by-activity/1"

echo ""
echo "🚀 啟動服務器後，可以使用上述命令測試 API"
