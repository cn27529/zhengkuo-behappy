#!/bin/bash
API_URL="http://0.0.0.0:3000/api"
RECORD_ID=42  # 使用您測試成功的 ID

echo "-----------------------------------------------"
echo "🔥 開始併發取號壓力測試 (同時模擬 10 人取號)"
echo "-----------------------------------------------"

# 使用背景執行 (&) 同時發出 10 個請求
for i in {1..10}
do
   curl -s -X POST "$API_URL/receipt-numbers/generate" \
     -H "Content-Type: application/json" \
     -d "{\"recordId\": $RECORD_ID, \"receiptType\": \"standard\", \"userId\": \"a4954ebc-8591-4288-8ebe-a4af19e718f7\"}" &
done

# 等待所有請求完成
wait

echo -e "\n\n✅ 測試完成！"
echo "請執行以下 SQL 驗證結果："
echo "SELECT receiptNumber, serialNumber FROM receiptNumbersDB ORDER BY serialNumber ASC;"