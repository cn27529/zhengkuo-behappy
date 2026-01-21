# mock_monthlyDonates.json 格式說明

檔案位置：`/src/data/mock_monthlyDonates.json`

## 概要

此檔為測試用的假資料陣列（array），每一筆代表一組完整的每月贊助資料，對應應用程式中的每月贊助功能結構。

## 最外層

- 格式：JSON Array
- 每個元素為一個 monthlyDonate 物件

## monthlyDonate 物件結構

- id: number（每月贊助記錄的唯一識別碼）
- name: string（贊助者姓名，必填）
- registrationId: number（關聯的報名記錄 ID，-1 表示無關聯報名）
- donateId: string（贊助記錄的唯一識別碼）
- donateType: string（贊助類型，可為空）
- donateItems: array（贊助項目清單）
  - donateItem 物件欄位：
    - donateItemsId: string（贊助項目的唯一識別碼）
    - price: number（贊助金額）
    - months: array（贊助月份清單，格式為 "YYYYMM"）
    - createdAt: string（建立時間，ISO 8601 格式）
    - createdUser: string（建立者）
    - updatedAt: string（更新時間，可為空）
    - updatedUser: string（更新者，可為空）
- memo: string（備註說明）
- icon: string（顯示圖示）
- createdAt: string（記錄建立時間，ISO 8601 格式）
- createdUser: string（記錄建立者）
- updatedAt: string（記錄更新時間，ISO 8601 格式）
- updatedUser: string（記錄更新者）

## 注意事項

- id：每筆記錄的唯一識別碼，建議從 1 開始遞增
- registrationId：若為 -1 表示此贊助記錄未關聯任何報名記錄
- months：月份格式為 "YYYYMM"，例如 "202512" 表示 2025 年 12 月
- price：贊助金額為數字型態，單位為新台幣
- 時間格式：統一使用 ISO 8601 格式（例如 "2025-10-01T08:00:00.000Z"）
- 若要匯入到應用程式，可使用 `fetch` 或 `import` 讀取此 JSON

## 範例（單筆註解）

- 檔案中的每筆資料已用真實感測試值填寫，可直接用於開發與測試
- 每個贊助者可有多個贊助項目（donateItems），每個項目可涵蓋多個月份
- 支援不同金額的贊助項目，以及不同時間區間的贊助計畫

---
