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

## 分析結果

CSV 非空資料行：3036，JSON 輸出：3015，差異：21 筆

差異完全來自 EXPORT.js 最後的 else { continue; } — 遇到**未知類別直接略
過**。

### 被略過的類別分布

| 類別                                    | 筆數 |
| --------------------------------------- | ---- |
| 會員                                    | 4    |
| 其它                                    | 2    |
| 確定不需要法訊                          | 7    |
| undefined（欄位不足，row[22] 取不到值） | 5    |
| 劃撥                                    | 1    |
| 立牌                                    | 1    |
| 索取                                    | 1    |
| 合計                                    | 21   |

### 根本原因

1. 類別值不在白名單內：消災 / 點燈 / 超度 / 超渡 / 空字串 以外的值都被
   else { continue } 丟掉。

2. undefined 的 5 筆：這些行的欄位數不足 23 欄（row[22] 取不到），代表那
   幾行 CSV 資料本身欄位有缺，是真正的資料問題。

### 不是「欄位缺資料」造成的

空白類別（''，845 筆）已被程式碼當作超渡處理，**不會被略過**。真正缺資料
的只有 5 筆 undefined，其餘 16 筆是有值但不在預期類別內。

### 建議修法

js
// 在 else { continue } 前加 log，或改為歸入預設類別
} else {
console.warn(`Line ${i+1}: 未知類別 "${category}"，略過`);
continue;
}

或者，如果這 21 筆也需要匯入，需決定它們要對應到哪個 record 結構（
blessing 或 salvation）。

## 看過了，欄位有換行問題，己修正，驗證一下 db/EXPORT.csv 還有欄位數不足問題嗎

Header 欄位數: 25
欄位不足筆數: 0

- Completed in 0.110s

> 欄位不足問題已完全修正，所有資料行都達到 25 欄，沒有任何缺欄的行了。
