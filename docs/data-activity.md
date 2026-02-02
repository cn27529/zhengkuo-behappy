# Mock Activity 資料說明文件

## 概述

本文件說明 `client/src/data/mock_activities.json` 中的模擬活動資料結構和內容，用於寺廟管理系統中的活動管理模組測試和開發。

## 資料結構

### Activity 物件欄位說明

| 欄位名稱       | 類型   | 必填 | 說明                               |
| -------------- | ------ | ---- | ---------------------------------- |
| `id`           | number | 是   | 活動唯一識別碼                     |
| `user_created` | string | 否   | 建立者 UUID                        |
| `date_created` | string | 否   | 建立時間 (ISO 格式)                |
| `user_updated` | string | 否   | 最後更新者 UUID                    |
| `date_updated` | string | 否   | 最後更新時間 (ISO 格式)            |
| `activityId`   | string | 是   | 活動編號                           |
| `name`         | string | 是   | 活動名稱                           |
| `itemType`     | string | 是   | 活動類型 (目前為 "ceremony")       |
| `participants` | number | 是   | 參與人數                           |
| `date`         | string | 是   | 活動日期時間                       |
| `state`        | string | 是   | 活動狀態 ("upcoming", "completed") |
| `icon`         | string | 否   | 活動圖示 (emoji)                   |
| `description`  | string | 否   | 活動描述                           |
| `location`     | string | 否   | 活動地點                           |
| `createdAt`    | string | 否   | 系統建立時間                       |
| `updatedAt`    | string | 否   | 系統更新時間                       |

## 模擬資料內容

### 活動類型分析

目前所有活動的 `itemType` 都是 `"ceremony"`，表示法會類型活動。

### 活動狀態

- **upcoming**: 即將舉行的活動
- **completed**: 已完成的活動

### 活動範例

#### 1. 春季禪修營

```json
{
  "id": 18,
  "activityId": "5422708",
  "name": "mock2026年春季禪修營",
  "itemType": "ceremony",
  "participants": 0,
  "date": "2026-03-03 09:00",
  "state": "upcoming",
  "icon": "🧘",
  "description": "春季禪修活動",
  "location": "禪堂123"
}
```

#### 2. 新春禮懺法會

```json
{
  "id": 1,
  "activityId": "1q2w3e4",
  "name": "mock2026新春禮懺法會",
  "itemType": "ceremony",
  "participants": 0,
  "date": "2026-02-17 09:00",
  "state": "upcoming",
  "icon": "🧨",
  "description": "丙午年 ‧ 鎮國寺新春禮懺消災超度大法會",
  "location": "大雄寶殿"
}
```

#### 3. 世界念佛救地球大法會 (已完成)

```json
{
  "id": 6,
  "activityId": "78ba683",
  "name": "mock2025世界念佛救地球大法會",
  "itemType": "ceremony",
  "participants": 999,
  "date": "2025-05-24 09:00",
  "state": "completed",
  "icon": "🌎",
  "description": "2025鎮國寺．世界念佛救地球大法會",
  "location": "世界和平塔"
}
```

## 資料特點

### 時間範圍

- **已完成活動**: 2025年4-5月
- **即將舉行**: 2026年1-3月

### 參與人數

- 新活動: 0 人 (尚未開始報名)
- 已完成活動: 999 人 (滿額)
- Rust 測試活動: 100 人

### 地點分佈

- **大雄寶殿**: 傳統法會場所
- **禪堂123**: 禪修活動
- **世界和平塔**: 大型法會
- **阿里山**: 特殊活動地點

### 圖示使用

- 🧘 禪修活動
- 🧨 新春法會
- 🌎 世界性法會
- 🍚 超度法會
- 🥮 特殊活動
- 🦀 Rust 測試資料

## 搜尋功能支援

根據使用者故事，系統支援以下欄位的搜尋：

- **活動名稱** (`name`)
- **活動描述** (`description`)
- **活動地點** (`location`)

## 開發用途

此模擬資料用於：

1. 前端介面開發測試
2. CRUD 操作功能驗證
3. 分頁功能測試
4. 搜尋功能測試
5. 活動狀態管理測試

## 注意事項

1. 所有活動名稱都以 "mock" 開頭，表示為測試資料
2. UUID 格式的使用者 ID 用於追蹤建立者和更新者
3. 時間格式混合使用 ISO 8601 和自定義格式
4. 部分欄位可能為空值，需要在前端處理
