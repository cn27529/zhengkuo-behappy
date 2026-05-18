## 分析

### CSV 欄位對應

CSV 的關鍵欄位：

- 蓮友編號(電話) → 可作為識別 key
- 姓名 → 人員姓名
- 生肖 → zodiac
- 行動電話 / 電話1 → mobile / phone
- 通訊地址 / 戶籍地址 / 連絡地址 → 地址（欄位名稱是類型，實際地址在後面
  欄位）
- 連絡人 → contact.name
- 備註 → notes
- 類別 → 核心識別欄位：超渡、消災、點燈
- 關係 → contact.relationship（本家/娘家/朋友/其他）

### 類別對應邏輯

| CSV 類別                             | JSON 目標位置                                                   |
| ------------------------------------ | --------------------------------------------------------------- |
| 消災                                 | blessing.persons[] → 人員填入 name, zodiac, notes；地址填入     |
| blessing.address                     |
| 超渡                                 | salvation.ancestors[] → 姓氏填入 surname；salvation.survivors[] |
| 填陽上人；地址填入 salvation.address |
| 點燈                                 | 目前 JSON 結構中**沒有點燈欄位**，需要確認                      |

### 超渡的難題

超渡需要區分「往生者（ancestors）」和「陽上人（survivors）」，但 CSV 只
有一個人員欄位，沒有明確標記誰是往生者、誰是陽上人。這是最大的模糊點。

### 分組邏輯

CSV 是**一人一行**，但 JSON 是**一份表單含多人**。需要決定如何分組：

- 依 連絡人 相同 → 同一份表單？
- 依 蓮友編號 前綴（如 3001, 3002 同屬一組）？
- 每人獨立一份表單？

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 需要你確認的問題

1. 點燈 要放到 JSON 哪個欄位？（目前結構沒有 lighting/點燈）
2. 超渡 的人員，如何判斷是 ancestors（往生者）還是 survivors（陽上人）？
3. 分組規則：多筆 CSV 資料如何合併成一份表單？還是每人一份？
4. 沒有 類別 的資料（如 00-001, 021-001）要怎麼處理？跳過？

## 我的見解

### 類別是消災 or 點燈

- 蓮友編號(電話) → 填入 formId
- "EXPORT" → formSource
- 姓名 → blessing.persons[0].name
- 生肖 → blessing.persons[0].zodiac
- 行動電話 / 電話1 → contact.mobile / contact.phone
- 通訊地址 → 如果這個欄位值是"連絡地址"我們就用"郵遞區號2+連絡地址"，如果這個欄位值是"戶籍地址"我們就用"郵遞區號1+戶籍地址" → blessing.address
  欄位）
- 連絡人 → contact.name
- 備註 → notes
- 關係 → contact.relationship（本家/娘家/朋友/其他）
- 異動人員 → 沒地方放XD → formName
- 異動時間 → updatedAt

### 類別是超渡

- 蓮友編號(電話) → 填入 formId
- "EXPORT" → formSource
- 姓名 → 取第一個字元 → salvation.ancestors[0].surname
- 姓名 → salvation.survivors[0].name
- 生肖 → salvation.survivors[0].zodiac
- 行動電話 / 電話1 → contact.mobile / contact.phone
- 通訊地址 → 如果這個欄位值是"連絡地址"我們就用"郵遞區號2+連絡地址"，如果這個欄位值是"戶籍地址"我們就用"郵遞區號1+戶籍地址" → salvation.address
- 連絡人 → contact.name
- 備註 → notes
- 關係 → contact.relationship（本家/娘家/朋友/其他）
- 異動人員 → 沒地方放XD → formName
- 異動時間 → updatedAt
