#!/bin/bash

# 設定 API 基礎路徑
API_URL="http://localhost:3000/api"
TEST_ADMIN="a4954ebc-8591-4288-8ebe-a4af19e718f7"
TEST_STAFF="ab11998d-27b1-4936-a437-324952ba3c1f"

# 測試用的參加記錄 ID（從 mock_join_records.json 和 mock_receipt_numbers.json 選取）
# 這些是尚未有收據編號或適合合併的記錄
RECORD_IDS="[85,86,89]"  # 使用 id 85,86 的記錄進行合併測試
VOID_REASON="TEST合併打印" # 作廢原因
RECEIPT_TYPE="stamp" # 收據類型
STATE="merged" # 合併打印狀態（默認為 active）
RECEIPT_NUMBER=""  # 替換為實際的合併打印編號
RECEIPT_ISSUED_BY="sh測試"

echo "-----------------------------------------------"
echo "🚀 開始測試 Rust 合併打印編號生成 API"
echo "-----------------------------------------------"
echo ""

# 1. 測試生成合併打印 (stamp 類型)
echo "1. 測試生成合併打印 (stamp 類型，合併 IDs: $RECORD_IDS)..."
MERGED_STAMP_RES=$(curl -s -X POST "$API_URL/receipt-numbers/merge" \
  -H "Content-Type: application/json" \
  -d "{    
    \"receiptNumber\": \"$RECEIPT_NUMBER\",
    \"recordIds\": $RECORD_IDS,
    \"state\": \"$STATE\",
    \"receiptType\": \"$RECEIPT_TYPE\",
    \"voidReason\": \"$VOID_REASON\",
    \"receiptIssuedBy\": \"$RECEIPT_ISSUED_BY\",
    \"userId\": \"$TEST_ADMIN\"

  }")

echo "響應: $MERGED_STAMP_RES"
MERGED_STAMP_NUM=$(echo $MERGED_STAMP_RES | grep -oE '[0-9]{8}' | head -1)
if [ -n "$MERGED_STAMP_NUM" ]; then
    echo "✅ 生成合併打印編號: $MERGED_STAMP_NUM"
else
    echo "⚠️ 未能提取編號，檢查響應格式"
fi
echo ""

# # 2. 測試生成合併感謝狀 (standard 類型)
# echo "2. 測試生成合併感謝狀 (standard 類型，合併 IDs: $RECORD_IDS)..."
# MERGED_STD_RES=$(curl -s -X POST "$API_URL/receipt-numbers/merge" \
#   -H "Content-Type: application/json" \
#   -d "{
#     \"recordIds\": $RECORD_IDS,
#     \"receiptType\": \"standard\",
#     \"totalAmount\": $TOTAL_AMOUNT,
#     \"userId\": \"$TEST_STAFF\"
#   }")

# echo "響應: $MERGED_STD_RES"
# MERGED_STD_NUM=$(echo $MERGED_STD_RES | grep -oE 'A[0-9]{8}' | head -1)
# if [ -n "$MERGED_STD_NUM" ]; then
#     echo "✅ 生成合併感謝狀編號: $MERGED_STD_NUM"
# else
#     echo "⚠️ 未能提取編號，檢查響應格式"
# fi
# echo ""

# # 3. 測試合併 5 筆記錄
# echo "3. 測試合併 5 筆記錄 (stamp 類型)..."
# RECORD_IDS_5="[35,36,37,38,39]"
# TOTAL_AMOUNT_5=5000
# MERGED_5_RES=$(curl -s -X POST "$API_URL/receipt-numbers/merge" \
#   -H "Content-Type: application/json" \
#   -d "{
#     \"recordIds\": $RECORD_IDS_5,
#     \"receiptType\": \"stamp\",
#     \"totalAmount\": $TOTAL_AMOUNT_5,
#     \"userId\": \"$TEST_ADMIN\"
#   }")

# echo "響應: $MERGED_5_RES"
# MERGED_5_NUM=$(echo $MERGED_5_RES | grep -oE '[0-9]{8}' | head -1)
# if [ -n "$MERGED_5_NUM" ]; then
#     echo "✅ 生成 5 筆合併打印編號: $MERGED_5_NUM"
# else
#     echo "⚠️ 未能提取編號"
# fi
# echo ""

# # 4. 測試查詢所有收據編號記錄（確認合併記錄已寫入）
# echo "4. 查詢 receiptNumbersDB 記錄列表（確認合併記錄）..."
# LIST_RES=$(curl -s -X GET "$API_URL/receipt-numbers")
# TOTAL=$(echo $LIST_RES | grep -oP '(?<="total":)[0-9]+')
# echo "✅ 目前編號表總數: $TOTAL"
# echo ""

# # 5. 測試查詢特定類型的收據
# echo "5. 查詢 stamp 類型的收據記錄..."
# STAMP_LIST=$(curl -s -X GET "$API_URL/receipt-numbers?receiptType=stamp")
# STAMP_COUNT=$(echo $STAMP_LIST | grep -oP '(?<="total":)[0-9]+')
# echo "✅ stamp 類型收據數量: $STAMP_COUNT"
# echo ""

# echo "6. 查詢 standard 類型的收據記錄..."
# STD_LIST=$(curl -s -X GET "$API_URL/receipt-numbers?receiptType=standard")
# STD_COUNT=$(echo $STD_LIST | grep -oP '(?<="total":)[0-9]+')
# echo "✅ standard 類型收據數量: $STD_COUNT"
# echo ""

# # 7. 測試錯誤情況：空的 record_ids
# echo "7. 測試錯誤情況：空的 record_ids..."
# ERROR_EMPTY_RES=$(curl -s -X POST "$API_URL/receipt-numbers/merge" \
#   -H "Content-Type: application/json" \
#   -d "{
#     \"recordIds\": [],
#     \"receiptType\": \"stamp\",
#     \"totalAmount\": 1000,
#     \"userId\": \"$TEST_ADMIN\"
#   }")
# echo "響應: $ERROR_EMPTY_RES"
# echo ""

# # 8. 測試錯誤情況：缺少 record_ids
# echo "8. 測試錯誤情況：缺少 record_ids..."
# ERROR_MISSING_RES=$(curl -s -X POST "$API_URL/receipt-numbers/merge" \
#   -H "Content-Type: application/json" \
#   -d "{
#     \"receiptType\": \"stamp\",
#     \"totalAmount\": 1000,
#     \"userId\": \"$TEST_ADMIN\"
#   }")
# echo "響應: $ERROR_MISSING_RES"
# echo ""

# # 9. 驗證編號格式
# echo "9. 驗證編號格式..."
# CURRENT_YM=$(date +'%y%m')
# if [[ $MERGED_STAMP_NUM == "$CURRENT_YM"* ]] 2>/dev/null; then
#     echo "✅ 合併打印格式正確 (符合年月 $CURRENT_YM)"
# else
#     echo "⚠️ 合併打印格式驗證跳過（可能尚未生成）"
# fi

# if [[ $MERGED_STD_NUM == "A$CURRENT_YM"* ]] 2>/dev/null; then
#     echo "✅ 合併感謝狀格式正確 (符合 A + 年月 $CURRENT_YM)"
# else
#     echo "⚠️ 合併感謝狀格式驗證跳過（可能尚未生成）"
# fi

echo ""
echo "-----------------------------------------------"
echo "🎉 合併打印 API 測試完成！"
echo "-----------------------------------------------"
echo ""
echo "📋 驗證檢查項目："
echo "  1. receiptNumbersDB 是否新增合併打印記錄"
echo "  2. mergedReceiptNumbersDB 是否新增合併記錄"
echo "  3. joinRecordDB 中對應記錄的 receiptNumber 是否更新"
echo "  4. joinRecordDB 中對應記錄的 receiptId 是否指向 mergedReceiptNumbersDB 的 id"
echo "  5. 流水號是否正確遞增（按月份和類型分別計算）"
echo "  6. 跨年月合併是否正確（當前年月為準）"
echo "-----------------------------------------------"