#!/bin/bash

# 設定 API 基礎路徑
API_URL="http://0.0.0.0:3000/api"
RECORD_ID=40  # 測試用的參加記錄 ID
RECORD_ID2=41  # 第二筆測試用的參加記錄 ID
TEST_ADMIN="a4954ebc-8591-4288-8ebe-a4af19e718f7"


echo "-----------------------------------------------"
echo "🚀 開始測試 Rust 收據編號生成 API (第一階段)"
echo "-----------------------------------------------"

# 1. 測試生成收據 (stamp)
echo "1. 測試生成一般收據 (stamp)..."
STAMP_RES=$(curl -s -X POST "$API_URL/receipt-numbers/generate" \
  -H "Content-Type: application/json" \
  -d "{\"recordId\": $RECORD_ID, \"receiptType\": \"standard\", \"userId\": \"$TEST_ADMIN\"}")

echo "響應: $STAMP_RES"
STAMP_NUM=$(echo $STAMP_RES | grep -oE '[0-9]{8}')
echo "✅ 生成收據編號: $STAMP_NUM"
echo ""

# 2. 測試生成感謝狀 (standard)
echo "2. 測試生成感謝狀 (standard)..."
STD_RES=$(curl -s -X POST "$API_URL/receipt-numbers/generate" \
  -H "Content-Type: application/json" \
  -d "{\"recordId\": $RECORD_ID2, \"receiptType\": \"standard\", \"userId\": \"$TEST_ADMIN\"}")

echo "響應: $STD_RES"
STD_NUM=$(echo $STD_RES | grep -oE 'A[0-9]{8}')
echo "✅ 生成感謝狀編號: $STD_NUM"
echo ""

# 3. 測試查詢所有編號記錄
echo "3. 查詢 receiptNumbersDB 記錄列表..."
LIST_RES=$(curl -s -X GET "$API_URL/receipt-numbers")
TOTAL=$(echo $LIST_RES | grep -oP '(?<="total":)[0-9]+')
echo "✅ 目前編號表總數: $TOTAL"
echo ""

# 4. 驗證格式
echo "4. 驗證編號格式..."
CURRENT_YM=$(date +'%y%m')
if [[ $STAMP_NUM == "$CURRENT_YM"* ]]; then
    echo "✅ 收據格式正確 (符合年月 $CURRENT_YM)"
else
    echo "❌ 收據格式錯誤"
fi

if [[ $STD_NUM == "A$CURRENT_YM"* ]]; then
    echo "✅ 感謝狀格式正確 (符合 A + 年月 $CURRENT_YM)"
else
    echo "❌ 感謝狀格式錯誤"
fi

echo "-----------------------------------------------"
echo "🎉 第一階段單筆測試完成！"
echo "請檢查資料庫中的 receiptNumbersDB 與 participationRecordDB 是否同步。"
echo "確認無誤後，即可進行第二階段：高併發流水號壓力測試。"
echo "-----------------------------------------------"