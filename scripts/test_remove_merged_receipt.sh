#!/bin/bash
# scripts/test_remove_merged_receipt.sh

API_URL="http://localhost:3000/api"
TEST_ADMIN="a4954ebc-8591-4288-8ebe-a4af19e718f7"
TEST_STAFF="ab11998d-27b1-4936-a437-324952ba3c1f"

# 需要先有一個合併收據編號（從之前的測試取得）
MERGED_RECEIPT_NUMBER="26040004"  # 替換為實際的合併收據編號
RECORD_IDS="[85,86,89]"  # 使用 id 85,86 的記錄進行合併測試
MERGED_REF=16 # 用於參加記錄的合併參考 ID
VOID_REASON="解除合併收據123" # 作廢原因

echo "-----------------------------------------------"
echo "🚀 測試解除合併收據 API"
echo "-----------------------------------------------"
echo ""

echo "1. 解除合併收據: $MERGED_RECEIPT_NUMBER"
REMOVE_RES=$(curl -s -X POST "$API_URL/receipt-numbers/merge/remove" \
  -H "Content-Type: application/json" \
  -d "{
    \"receiptNumber\": \"$MERGED_RECEIPT_NUMBER\",
    \"userId\": \"$TEST_ADMIN\",
    \"voidReason\": \"$VOID_REASON\"
  }")

echo "響應: $REMOVE_RES"
echo ""

echo "2. 驗證解除結果..."
echo ""
echo "請執行以下 SQL 確認："
echo "-----------------------------------------------"
echo "-- 檢查 receiptNumbersDB 狀態"
echo "SELECT id, receiptNumber, state, voidReason FROM receiptNumbersDB WHERE receiptNumber = '$MERGED_RECEIPT_NUMBER';"
echo ""
echo "-- 檢查 mergedReceiptsDB（應保留不變）"
echo "SELECT id, receiptNumber, mergeIds FROM mergedReceiptsDB WHERE receiptNumber = '$MERGED_RECEIPT_NUMBER';"
echo ""
echo "-- 檢查 participationRecordDB（收據欄位應為 NULL）"
echo "SELECT id, receiptNumber, receiptIssued, receiptIssuedAt, receiptIssuedBy, mergedRef FROM participationRecordDB WHERE mergedRef = (SELECT id FROM mergedReceiptsDB WHERE receiptNumber = '$MERGED_RECEIPT_NUMBER');"
echo "-----------------------------------------------"

echo ""
echo "🎉 測試完成！"