# mock_registrations.json 格式說明

檔案位置：`/src/data/mock_registrations.json`

## 概要
此檔為測試用的假資料陣列（array），每一筆代表一組完整的報名資料，對應應用程式中的 `registrationForm` 結構（參見 `Registration.vue` 與 `stores/registration.js`）。

## 最外層
- 格式：JSON Array
- 每個元素為一個 registration 物件

## registration 物件結構
- contact (object)
  - name: string（聯絡人姓名，必填）
  - phone: string（市話，可為空）
  - mobile: string（手機，可為空）
  - relationship: string（關係選項，例如 "本家"、"娘家"、"朋友"、"其它"）
  - otherRelationship: string（若 relationship 為 "其它"，可填寫補充文字）

- blessing (object)
  - address: string（消災地址，必填）
  - persons: array（消災人員清單）
    - person 物件欄位：
      - id: number（本清單內唯一 id）
      - name: string（姓名，若為空則視為未填寫）
      - zodiac: string（生肖，可為空，對應 zodiacOptions）
      - notes: string（備註，可為空）
      - isHouseholdHead: boolean（是否為戶長）

- salvation (object)
  - address: string（超度地址，必填）
  - ancestors: array（祖先清單）
    - ancestor 物件欄位：
      - id: number
      - surname: string（姓氏）
      - notes: string
  - survivors: array（陽上人清單）
    - survivor 物件欄位：
      - id: number
      - name: string
      - zodiac: string
      - notes: string

## 注意事項
- id：建議在同一種類別（persons / ancestors / survivors）內唯一即可，檔案中可從 1 開始。
- 戶長檢查：應用程式邏輯為「只有在至少有一筆已填姓名的消災人員時，才要求至少指定一位戶長」，並會檢查不超過 `config.maxHouseholdHeads`。
- 欄位必填檢查在 `stores/registration.js` 的 `validationDetails` 處理（例如聯絡人姓名、消災/超度地址等）。
- 若要匯入到應用程式，可使用 `fetch` 或 `import` 讀取此 JSON，然後把物件賦值給 store 的 `registrationForm` 或作為建立多筆測試資料使用。

## 範例（單筆註解）
- 檔案中的每筆資料已用真實感測試值填寫，可直接用於開發與測試。

---
若需我新增一個頁面按鈕以自動載入 `mock_registrations.json` 中某筆資料到表單，或提供匯入範例程式碼，請告訴我。