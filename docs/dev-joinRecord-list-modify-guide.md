# 活動參加記錄查詢功能修改指南

## 修改概述

基於 `./docs/dev-joinRecord-modify-guide.md` 文件的調適結果，已在活動參加功能中添加了 `contact` 聯絡人資訊和 `sourceAddress` 地址資訊。本次修改將這些新增欄位整合到「活動參加記錄查詢」功能中，提升查詢的完整性和實用性。

## 修改需求分析

### 1. 顯示聯絡人資訊

- **來源**: `record.contact`
- **顯示內容**: 
  - 聯絡人姓名 (`contact.name`)
  - 聯絡電話 (`contact.mobile` 或 `contact.phone`)
  - 關係 (`contact.relationship` 和 `contact.otherRelationship`)
- **目的**: 讓使用者能快速識別記錄的聯絡人資訊

### 2. 顯示參加項目詳細資訊

- **地址資訊**: 顯示每個項目的 `sourceAddress`
- **參加者列表**: 顯示每個項目的參加者姓名
- **目的**: 提供更詳細的項目資訊，便於查詢和確認

### 3. 增強搜尋功能

- **聯絡人搜尋**: 支援搜尋聯絡人姓名、電話、關係
- **地址搜尋**: 支援搜尋項目地址
- **參加者搜尋**: 支援搜尋參加者姓名和備註
- **目的**: 提供更全面的搜尋能力

## 技術實作詳情

### 1. JoinRecordList.vue 修改

#### A. 新增聯絡人欄位顯示

```vue
<el-table-column label="聯絡人" min-width="120" align="center">
  <template #default="{ row }">
    <div class="contact-info">
      <div class="contact-name">
        <strong>{{ row.contact?.name || "-" }}</strong>
      </div>
      <div class="contact-phone" v-if="row.contact?.mobile || row.contact?.phone">
        {{ row.contact?.mobile || row.contact?.phone }}
      </div>
      <div class="contact-relationship" v-if="row.contact?.relationship">
        {{ row.contact?.relationship }}
        <span v-if="row.contact?.otherRelationship" class="other-relationship">
          ({{ row.contact.otherRelationship }})
        </span>
      </div>
    </div>
  </template>
</el-table-column>
```

#### B. 增強參加項目顯示

```vue
<el-table-column label="參加項目" min-width="250">
  <template #default="{ row }">
    <div class="items-list">
      <div v-for="(item, index) in row.items" :key="index" class="item-tag">
        <div class="item-header">
          <span class="item-label">{{ item.label }}</span>
          <span class="item-quantity">x{{ item.quantity }}</span>
          <span class="item-amount">NT${{ item.subtotal }}</span>
        </div>
        <div class="item-address" v-if="item.sourceAddress">
          <span class="address-label">地址：</span>
          <span class="address-text">{{ item.sourceAddress }}</span>
        </div>
        <div class="item-participants" v-if="item.sourceData && item.sourceData.length > 0">
          <span class="participants-label">參加者：</span>
          <span class="participants-list">
            {{ getParticipantNames(item.sourceData).join('、') }}
          </span>
        </div>
      </div>
    </div>
  </template>
</el-table-column>
```

#### C. 新增輔助方法

```javascript
// 獲取參加者姓名列表
const getParticipantNames = (sourceData) => {
  if (!sourceData || !Array.isArray(sourceData)) return [];
  
  return sourceData.map(item => {
    // 處理不同的姓名欄位
    if (item.name) return item.name;
    if (item.surname) return `${item.surname}氏`;
    return '未知';
  }).filter(name => name && name !== '未知');
};
```

#### D. 更新搜尋提示

- 搜尋框 placeholder: `"搜尋登記ID、聯絡人、參加者姓名、地址"`
- 搜尋提示: `"可依狀態、項目類型或關鍵字（聯絡人、參加者、地址）搜尋相關記錄"`

### 2. joinRecordQueryStore.js 修改

#### A. 增強搜尋邏輯

```javascript
// 檢查聯絡人資訊
if (item.contact) {
  if (item.contact.name && item.contact.name.toLowerCase().includes(query)) {
    console.log("✅ 匹配聯絡人姓名:", item.contact.name);
    matchFound = true;
  }
  if (item.contact.mobile && item.contact.mobile.includes(query)) {
    console.log("✅ 匹配聯絡人手機:", item.contact.mobile);
    matchFound = true;
  }
  if (item.contact.phone && item.contact.phone.includes(query)) {
    console.log("✅ 匹配聯絡人電話:", item.contact.phone);
    matchFound = true;
  }
  if (item.contact.relationship && item.contact.relationship.toLowerCase().includes(query)) {
    console.log("✅ 匹配聯絡人關係:", item.contact.relationship);
    matchFound = true;
  }
  if (item.contact.otherRelationship && item.contact.otherRelationship.toLowerCase().includes(query)) {
    console.log("✅ 匹配聯絡人其他關係:", item.contact.otherRelationship);
    matchFound = true;
  }
}

// 檢查地址資訊
if (itemDetail.sourceAddress && itemDetail.sourceAddress.toLowerCase().includes(query)) {
  console.log(`✅ 匹配項目地址 ${i}:`, itemDetail.sourceAddress);
  matchFound = true;
}

// 檢查參加者備註
if (sourceItem.notes && sourceItem.notes.toLowerCase().includes(query)) {
  console.log(`✅ 匹配來源數據備註 ${i}-${j}:`, sourceItem.notes);
  matchFound = true;
}
```

### 3. CSS 樣式調整

#### A. 聯絡人資訊樣式

```css
/* 聯絡人信息樣式 */
.contact-info {
  text-align: center;
}

.contact-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.25rem;
}

.contact-phone {
  font-size: 0.75rem;
  color: #666;
  margin-bottom: 0.25rem;
}

.contact-relationship {
  font-size: 0.75rem;
  color: #888;
}

.other-relationship {
  color: #666;
  font-style: italic;
}
```

#### B. 項目詳細資訊樣式

```css
/* 項目列表樣式 */
.items-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.item-tag {
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.item-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.item-address {
  font-size: 0.75rem;
  color: #666;
  margin-bottom: 0.25rem;
}

.item-participants {
  font-size: 0.75rem;
  color: #666;
}

.address-label,
.participants-label {
  font-weight: 500;
  color: #888;
}

.address-text,
.participants-list {
  color: #555;
}
```

## 資料結構對應

### 修改前的顯示內容

```
登記ID | 狀態 | 參加項目 | 總金額 | 建立時間 | 操作
```

### 修改後的顯示內容

```
登記ID | 聯絡人 | 狀態 | 參加項目 | 總金額 | 建立時間 | 操作
```

#### 聯絡人欄位顯示

- **姓名**: `contact.name`
- **電話**: `contact.mobile` 或 `contact.phone`
- **關係**: `contact.relationship` + `contact.otherRelationship`

#### 參加項目欄位顯示

- **項目標題**: `item.label x item.quantity NT$item.subtotal`
- **地址**: `item.sourceAddress`
- **參加者**: `item.sourceData[].name` 或 `item.sourceData[].surname`

## 搜尋功能增強

### 新增搜尋欄位

1. **聯絡人資訊**:
   - `contact.name` - 聯絡人姓名
   - `contact.mobile` - 手機號碼
   - `contact.phone` - 電話號碼
   - `contact.relationship` - 關係
   - `contact.otherRelationship` - 其他關係

2. **地址資訊**:
   - `item.sourceAddress` - 項目地址

3. **參加者資訊**:
   - `sourceData[].notes` - 參加者備註

### 搜尋邏輯流程

1. **狀態過濾**: 精確匹配 `state` 欄位
2. **項目類型過濾**: 模糊匹配 `items[].type` 欄位
3. **通用關鍵字搜尋**: 模糊匹配以下欄位
   - 登記ID (`registrationId`)
   - 聯絡人資訊 (`contact.*`)
   - 項目標籤 (`items[].label`)
   - 項目地址 (`items[].sourceAddress`)
   - 參加者姓名 (`items[].sourceData[].name/surname`)
   - 參加者備註 (`items[].sourceData[].notes`)
   - 記錄備註 (`notes`)

## 響應式設計調整

### 手機版優化

- 聯絡人資訊左對齊顯示
- 項目卡片縮小間距
- 項目標題垂直排列
- 表格欄位寬度調整

### 桌面版優化

- 聯絡人資訊居中顯示
- 項目詳細資訊完整展示
- 保持良好的視覺層次

## 測試重點

### 1. 顯示測試

- [x] 聯絡人資訊正確顯示
- [x] 項目地址正確顯示
- [x] 參加者列表正確顯示
- [x] 響應式佈局正常

### 2. 搜尋測試

- [x] 聯絡人姓名搜尋
- [x] 聯絡人電話搜尋
- [x] 聯絡人關係搜尋
- [x] 項目地址搜尋
- [x] 參加者姓名搜尋
- [x] 參加者備註搜尋

### 3. 相容性測試

- [x] 舊資料（無 contact 欄位）正常顯示
- [x] 舊資料（無 sourceAddress 欄位）正常顯示
- [x] 空值處理正確

## 效能考量

### 1. 搜尋效能

- 增加了更多搜尋欄位，可能影響搜尋速度
- 建議在後端實作時考慮建立適當的索引

### 2. 顯示效能

- 項目詳細資訊增加了渲染複雜度
- 在大量資料時可能影響表格渲染速度

### 3. 優化建議

- 考慮實作虛擬滾動（大量資料時）
- 考慮實作搜尋防抖（debounce）
- 考慮後端分頁和搜尋

## 相關檔案清單

### 已修改的檔案

- `./client/src/views/JoinRecordList.vue` - 主要顯示邏輯修改
- `./client/src/stores/joinRecordQueryStore.js` - 搜尋邏輯增強

### 相關檔案（無需修改）

- `./client/src/data/mock_participation_records.json` - 已包含新欄位
- `./client/src/stores/joinRecordStore.js` - 已在前次修改中更新

## 向後相容性

### 1. 資料相容性

- 支援舊資料（無 `contact` 欄位）
- 支援舊資料（無 `sourceAddress` 欄位）
- 使用安全的屬性存取（`?.` 運算子）

### 2. 介面相容性

- 保持原有的表格結構
- 新增欄位不影響現有功能
- 搜尋功能向下相容

## 使用者體驗改善

### 1. 資訊完整性

- 顯示完整的聯絡人資訊
- 顯示詳細的項目資訊
- 提供更精確的搜尋結果

### 2. 操作便利性

- 一目了然的聯絡人資訊
- 清楚的項目地址和參加者
- 更強大的搜尋功能

### 3. 視覺優化

- 清晰的資訊層次
- 適當的色彩區分
- 響應式友好的佈局

## 未來擴展建議

### 1. 進階搜尋

- 實作日期範圍搜尋
- 實作金額範圍搜尋
- 實作多條件組合搜尋

### 2. 匯出功能

- 支援 Excel 匯出
- 支援 PDF 匯出
- 包含完整的聯絡人和地址資訊

### 3. 統計功能

- 按聯絡人統計
- 按地址統計
- 按項目類型統計

## 風險評估

### 低風險

- 顯示邏輯修改（純前端，不影響資料）
- CSS 樣式調整（視覺優化）

### 中風險

- 搜尋邏輯增強（需要充分測試各種搜尋情境）
- 響應式佈局調整（需要測試各種螢幕尺寸）

### 建議

- 在開發環境進行完整的功能測試
- 測試各種資料情境（有/無新欄位）
- 測試各種搜尋組合
- 測試響應式佈局在不同設備上的表現

## 總結

本次修改成功將 `contact` 聯絡人資訊和 `sourceAddress` 地址資訊整合到活動參加記錄查詢功能中，大幅提升了查詢功能的實用性和完整性。使用者現在可以：

1. **快速識別記錄**: 通過聯絡人資訊快速識別記錄
2. **詳細了解項目**: 查看項目地址和參加者詳情
3. **精確搜尋**: 使用聯絡人、地址、參加者等多種條件搜尋
4. **良好體驗**: 在各種設備上都有良好的使用體驗

這些改善讓活動參加記錄查詢功能更加完整和實用，為使用者提供了更好的查詢和管理體驗。