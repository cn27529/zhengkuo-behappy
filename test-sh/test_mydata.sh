#!/bin/bash

# Directus 配置
DIRECTUS_URL="http://localhost:8055"
EMAIL="admin@example.com"
PASSWORD="123456"

# 获取访问令牌
echo "获取访问令牌..."
TOKEN_RESPONSE=$(curl -s -X POST "$DIRECTUS_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\"
  }")

ACCESS_TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
  echo "获取令牌失败"
  echo "响应: $TOKEN_RESPONSE"
  exit 1
fi

echo "访问令牌: $ACCESS_TOKEN"
echo ""

# 获取所有 mydata 记录
echo "获取所有 mydata 记录:"
curl -s -X GET "$DIRECTUS_URL/items/mydata?fields=*,contact.*" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'

echo ""
echo "获取记录数量:"
curl -s -X GET "$DIRECTUS_URL/items/mydata?aggregate[count]=id" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'