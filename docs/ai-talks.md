# ai talks records

## kiro ai

我要生成"活動參加的記錄查詢"，我們依照 ./client\src\views\RegistrationList.vue, ./client\src\stores\registrationQueryStore.js 的模版與代碼的建構的方式進行，命名為 JoinRecordList.vue, joinRecordQueryStore.js，列表的＂操作＂：列印表單，刪除，不用實作 等下一階段再實現，注意 分頁, storeToRefs, 調試信息 的實現。查詢條件是 state, items 欄位。列表的資料你可以參考 ./client\src\data\mock_participation_records.json 檔案，有問題可以與我討論。

## kiro ai

請查找 getIsMock() 方法，查看 ./client/src/stores/ 的全部檔案，確認是否都有套用 getIsMock()，並且 getIsMock() 是 true 的條件下所有資料都是來自 ./client/src/data/mock\_???.json 以及是 true 的條件下都不會往後端的 service層做調用。如果有請告訴我，我必須讓它們一致。

確認所有使用 import.meta.env.XXX 環境變數的檔案都有適當的使用，避免 truthy 陷阱。檔案有 ./client/src/adapters/serviceAdapter.js, ./client/src/components/DevTools.vue, ./client/src/config/serviceConfig.js, ./client/src/config/supabase.js, ./client/src/rustServices/baseRustService.js, ./client/src/services/baseService.js

接下來要調適 client\src\views\JoinRecord.vue，將　<!-- 已選擇的祈福登記 -->　區塊加入活動設置（）提供使用者單選一個"活動"，將"活動"的 id 綁定activityId，你能理解嗎。

