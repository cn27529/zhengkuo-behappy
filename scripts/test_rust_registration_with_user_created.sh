#!/bin/bash
# test_registration_with_user_created.sh

BASE_URL="http://127.0.0.1:3000"

echo "🧪 測試 Registration API - 包含 user_created 字段"
echo "=================================================="

# 測試 1: 不提供 user_created（應該使用默認值）
echo "1️⃣ 測試：不提供 user_created（使用默認值）"
curl -s -X POST "$BASE_URL/api/registrations" \
  -H "Content-Type: application/json" \
  -d '{
    "formId": "TEST-001",
    "formName": "測試登記表-001",
    "state": "draft",
    "contact": "{}",
    "blessing": "{}",
    "salvation": "{}"
  }' | jq .
echo -e "\n"

# 測試 2: 提供具體的 user_created
echo "2️⃣ 測試：提供具體的 user_created"
curl -s -X POST "$BASE_URL/api/registrations" \
  -H "Content-Type: application/json" \
  -d '{
    "formId": "TEST-002",
    "formName": "測試登記表-002",
    "state": "submitted",
    "userCreated": "ab11998d-27b1-4936-a437-324952ba3c1f",
    "contact": "{\"name\": \"測試用戶\"}",
    "blessing": "{\"address\": \"測試地址\"}",
    "salvation": "{\"ancestors\": []}"
  }' | jq .
echo -e "\n"

# 測試 3: 提供空的 user_created
echo "3️⃣ 測試：提供空的 user_created"
curl -s -X POST "$BASE_URL/api/registrations" \
  -H "Content-Type: application/json" \
  -d '{
    "formId": "TEST-003",
    "formName": "測試登記表-003",
    "state": "pending",
    "userCreated": "",
    "contact": "{}",
    "blessing": "{}",
    "salvation": "{}"
  }' | jq .
echo -e "\n"

echo "✅ 測試完成！"