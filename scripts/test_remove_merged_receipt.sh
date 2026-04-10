#!/bin/bash
# scripts/test_remove_merged_receipt.sh

API_URL="http://localhost:3000/api"
TEST_ADMIN="a4954ebc-8591-4288-8ebe-a4af19e718f7"
TEST_STAFF="ab11998d-27b1-4936-a437-324952ba3c1f"

# 需要先有一個合併打印編號（從之前的測試取得）
RECEIPT_NUMBER="26040008"  # 替換為實際的合併打印編號
RECORD_IDS="[85,86,89]"  # 使用 id 85,86 的記錄進行合併測試
VOID_REASON="作廢合併打印TEST" # 作廢原因
STATE="remove merged" # 作廢狀態

echo "-----------------------------------------------"
echo "🚀 測試作廢合併打印 API"
echo "-----------------------------------------------"
echo ""

echo "1. 作廢合併打印: $RECEIPT_NUMBER"
REMOVE_RES=$(curl -s -X POST "$API_URL/receipt-numbers/merge/remove" \
  -H "Content-Type: application/json" \
  -d "{
     \"receiptNumber\": \"$RECEIPT_NUMBER\",
    \"userId\": \"$TEST_ADMIN\",
    \"voidReason\": \"$VOID_REASON\",
    \"state\": \"$STATE\",
    \"receiptType\": \"$RECEIPT_TYPE\",
    \"recordIds\": $RECORD_IDS
  }")

echo "響應: $REMOVE_RES"
echo ""

echo "2. 驗證解除結果..."
echo ""
echo "請執行以下 SQL 確認："
echo "-----------------------------------------------"
echo "-- 檢查 receiptNumbersDB 狀態"
echo "SELECT id, receiptNumber, state, voidReason FROM receiptNumbersDB WHERE receiptNumber = '$RECEIPT_NUMBER';"
echo ""
echo "-- 檢查 mergedReceiptsDB（應保留不變）"
echo "SELECT id, receiptNumber, mergeIds FROM mergedReceiptsDB WHERE receiptNumber = '$RECEIPT_NUMBER';"
echo ""
echo "-- 檢查 participationRecordDB（收據欄位應為 NULL）"
echo "SELECT id, receiptNumber, receiptIssued, receiptIssuedAt, receiptIssuedBy, receiptId FROM participationRecordDB WHERE receiptId = (SELECT id FROM mergedReceiptsDB WHERE receiptNumber = '$RECEIPT_NUMBER');"
echo "-----------------------------------------------"

echo ""
echo "🎉 測試完成！"