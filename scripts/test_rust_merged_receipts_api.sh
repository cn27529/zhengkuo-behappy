#!/bin/bash
# test_rust_merged_receipts_api.sh - Merged Receipts API 測試腳本

API_URL="http://localhost:3000/api"
TEST_ADMIN="a4954ebc-8591-4288-8ebe-a4af19e718f7"

# 測試用的參加記錄 ID 列表（請根據實際資料庫調整）
RECORD_IDS='[40, 41, 42]'  # 要合併的參加記錄 ID 陣列
MERGE_RECORD_IDS='[43, 44]'  # 另一組測試用的合併 ID

echo "🧪 開始測試 Merged Receipts API"
echo "================================"

# 1. 健康檢查
echo "1️⃣ 測試健康檢查"
curl -s "$BASE_URL/health" | jq .
echo -e "\n"

# 2. 數據庫連接測試
echo "2️⃣ 測試數據庫連接"
curl -s "$BASE_URL/db-test" | jq .
echo -e "\n"

# 3. 創建 Merged Receipt 記錄
echo "3️⃣ 創建新 Merged Receipt 記錄"
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/merged-receipts" \
  -H "Content-Type: application/json" \
  -d '{
    "receiptNumber": "MR-2026001",
    "receiptType": "stamp",
    "mergeIds": [1, 2, 3],
    "totalAmount": 1500,
    "issuedAt": "2026-04-04T03:00:00.000Z",
    "issuedBy": "釋測試",
    "notes": "測試合併收據",
    "createdAt": "2026-04-04T03:00:00.000Z",
    "updatedAt": "2026-04-04T03:00:00.000Z"
  }')
echo "$CREATE_RESPONSE" | jq .

# 提取 ID
MERGED_RECEIPT_ID=$(echo "$CREATE_RESPONSE" | jq -r '.data.id')
echo "✅ 創建的 Merged Receipt ID: $MERGED_RECEIPT_ID"
echo -e "\n"

# 4. 獲取所有 Merged Receipts
echo "4️⃣ 獲取所有 Merged Receipts"
curl -s "$BASE_URL/api/merged-receipts" | jq .
echo -e "\n"

# 5. 根據 ID 獲取單個 Merged Receipt
echo "5️⃣ 根據 ID 獲取 Merged Receipt (ID: $MERGED_RECEIPT_ID)"
curl -s "$BASE_URL/api/merged-receipts/$MERGED_RECEIPT_ID" | jq .
echo -e "\n"

# 6. 根據 receiptType 獲取 Merged Receipts
echo "6️⃣ 根據 receiptType 獲取 Merged Receipts (stamp)"
curl -s "$BASE_URL/api/merged-receipts/by-receipt-type/stamp" | jq .
echo -e "\n"

# 7. 更新 Merged Receipt
echo "7️⃣ 更新 Merged Receipt (ID: $MERGED_RECEIPT_ID)"
curl -s -X PATCH "$BASE_URL/api/merged-receipts/$MERGED_RECEIPT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "receiptNumber": "MR-2026001-UPDATED",
    "receiptType": "refund",
    "mergeIds": [1, 2, 3, 4, 5],
    "totalAmount": 2500,
    "issuedAt": "2026-04-04T06:00:00.000Z",
    "issuedBy": "釋測試-更新",
    "notes": "已更新合併收據資訊"
  }' | jq .
echo -e "\n"

# 8. 查詢特定類型的 Merged Receipts
echo "8️⃣ 查詢退款類型的 Merged Receipts"
curl -s "$BASE_URL/api/merged-receipts?receiptType=refund" | jq .
echo -e "\n"

# 9. 測試分頁
echo "9️⃣ 測試分頁 (limit=5, offset=0)"
curl -s "$BASE_URL/api/merged-receipts?limit=5&offset=0" | jq .
echo -e "\n"

# 10. 測試欄位過濾
echo "🔟 測試欄位過濾 (fields=*)"
curl -s "$BASE_URL/api/merged-receipts?fields=*" | jq .
echo -e "\n"

# 11. 測試排序
echo "1️⃣1️⃣ 測試排序 (sort=-id)"
curl -s "$BASE_URL/api/merged-receipts?sort=-id" | jq .
echo -e "\n"

# 12. 創建第二筆記錄用於測試刪除
echo "1️⃣2️⃣ 創建第二筆 Merged Receipt 記錄"
CREATE_RESPONSE2=$(curl -s -X POST "$BASE_URL/api/merged-receipts" \
  -H "Content-Type: application/json" \
  -d '{
    "receiptNumber": "MR-2026002",
    "receiptType": "invoice",
    "mergeIds": [10, 11, 12],
    "totalAmount": 3000,
    "issuedAt": "2026-04-04T04:00:00.000Z",
    "issuedBy": "測試人員",
    "notes": "測試用收據"
  }')
echo "$CREATE_RESPONSE2" | jq .
MERGED_RECEIPT_ID2=$(echo "$CREATE_RESPONSE2" | jq -r '.data.id')
echo "✅ 創建的第二筆 Merged Receipt ID: $MERGED_RECEIPT_ID2"
echo -e "\n"

# # 13. 刪除 Merged Receipt
# echo "1️⃣3️⃣ 刪除 Merged Receipt (ID: $MERGED_RECEIPT_ID2)"
# curl -s -X DELETE "$BASE_URL/api/merged-receipts/$MERGED_RECEIPT_ID2" | jq .
# echo -e "\n"

# # 14. 驗證刪除
# echo "1️⃣4️⃣ 驗證 Merged Receipt 已刪除"
# curl -s "$BASE_URL/api/merged-receipts/$MERGED_RECEIPT_ID2" | jq .
# echo -e "\n"

# # 15. 刪除第一筆記錄
# echo "1️⃣5️⃣ 刪除 Merged Receipt (ID: $MERGED_RECEIPT_ID)"
# curl -s -X DELETE "$BASE_URL/api/merged-receipts/$MERGED_RECEIPT_ID" | jq .
# echo -e "\n"

# 16. 最終驗證所有記錄
echo "1️⃣6️⃣ 最終獲取所有 Merged Receipts"
curl -s "$BASE_URL/api/merged-receipts" | jq .
echo -e "\n"

echo "✅ Merged Receipts API 測試完成！"