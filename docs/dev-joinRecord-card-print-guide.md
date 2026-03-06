# 活動參加記錄 - 牌位打印功能說明

> **最後更新**: 2026-03-06
> **測試狀態**: ⏳ 待開發與環境驗證

## 概述說明

實現特殊長條尺寸牌位打印功能，支援三種主要尺寸規格，採用中文直書排版（writing-mode: vertical-rl），並透過 `html-to-image` 與 `pixelRatio: 6` 生成高清圖像，確保長條牌位文字清晰不模糊。

## 文件位置

- **牌位打印頁面**: `client/src/views/JoinRecordCardPrint.vue`
- **數據源**: `client/src/data/mock_participation_records.json`
- **技術參考**: `docs/dev-joinRecord-receipt-print-guide.md`

## 技術規格

### 1. 紙張尺寸規格 (長條型)

牌位因應法會需求，提供三種微調尺寸切換，預設邊距為 0 (None)。

| 規格編號   | 寬度 (Width) | 高度 (Height) | 建議用途   |
| ---------- | ------------ | ------------- | ---------- |
| **Type A** | 93mm         | 257mm         | 標準長牌位 |
| **Type B** | 92mm         | 258mm         | 窄型長牌位 |
| **Type C** | 95mm         | 258mm         | 寬型長牌位 |

### 2. 核心技術選型

- **佈局**: CSS `writing-mode: vertical-rl`（由右至左直書）。
- **生成**: `html-to-image` (pixelRatio: 6)。
- **驅動**: `print-js`。
- **字體**: 標楷體系統 (Kaiti TC, DFKai-SB) 為主，模擬傳統書法美感。

## 數據結構對應 (Data Mapping)

根據 `mock_participation_records.json`，牌位打印需提取以下核心資訊：

### A. 超度牌位 (Salvation Card)

- **主要對象 (往生者)**：提取 `items` 中 `type: "chaodu"` 的 `sourceData.surname` (如：劉府)。
- **副標註**：`sourceData.notes` (如：歷代祖先、外祖父母)。
- **陽上人 (Survivors)**：提取 `items` 中 `type: "survivors"` 的 `sourceData.name` 列表。

### B. 消災/祈福牌位 (Blessing Card)

- **主要對象**：提取 `items` 中 `type: "qifu"` 或 `type: "diandeng"` 的 `sourceData.name`。
- **屬性標示**：顯示人員的 `zodiac` (生肖)。
- **住址**：使用 `items.sourceAddress`。

## 頁面佈局設計 (JoinRecordCardPrint.vue)

### 1. 左側：牌位顯示區 (Preview Section)

- **動態畫布**：根據選擇的尺寸 (A/B/C) 自動調整 `.card-canvas` 的 CSS 寬高。
- **直書內容**：
- **中心軸**：大字顯示受法對象（如：劉府歷代祖先）。
- **左側下角**：小字顯示陽上人名單。
- **右側上角**：法會名稱或特定經文。

### 2. 右側：🖨️ 打印配置 (Config Sidebar)

- **批量導航**：同收據功能，顯示數字按鈕及已打印狀態 (綠色/藍框/灰色)。
- **尺寸切換**：提供 Radio 群組切換 93x257, 92x258, 95x258 三種規格。
- **模版切換**：
- 📜 **延生/消災模版** (紅色風格)
- 🛡️ **超薦/往生模版** (黃色/白色風格)

- **手動微調**：提供輸入框允許在打印前暫時修改「受法對象」或「陽上人」姓名。

## 打印流程 (Logic Flow)

1. **進入頁面**：

- 單筆：`handleCardPrint` 傳遞單個對象。
- 批量：`handleBatchCardPrint` 透過 `sessionStorage` 傳遞 ID 集合與數據。

2. **領取號碼**：點擊「開始打印」前，需向伺服器領取「牌位編號」（若業務邏輯需要）。
3. **高清生成**：

- 調用 `htmlToImage.toPng`。
- 注入對應尺寸的 `@page { size: W mm H mm }`。

4. **狀態回傳**：

- 確認打印成功後，更新 `participation_records` 的 `cardIssued: true` (自定義擴充欄位)。
- 批量模式下自動跳轉下一張。

## 未來優化 (Future Optimizations)

- [ ] 支援牌位二維碼 (QR Code) 自動生成。
- [ ] 支援背景花紋底圖上傳。
- [ ] 自動分組功能：同一家人的消災項目自動併入同一張大牌位。

---

**您對這份文檔的「數據對應」與「尺寸規格」是否有需要調整的地方？如果沒問題，接下來我們可以開始實作 `JoinRecordCardPrint.vue` 的 Template 與尺寸切換邏輯。**
