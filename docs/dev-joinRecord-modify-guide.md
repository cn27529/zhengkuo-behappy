# 活動參加功能修改指南

## 修改概述

基於現有的「活動參加」功能，需要添加聯絡人資訊和地址資訊到參加記錄中，以便日後查詢使用。

## 修改需求分析

### 1. 添加聯絡人資訊 (payload.contact)
- **來源**: `registration.contact`
- **目的**: 記錄當前登記表的聯絡人資訊，方便日後查詢
- **資料結構**: 
  ```json
  {
    "name": "唐建國999",
    "phone": "07-44556677", 
    "mobile": "0980-999-444",
    "relationship": "娘家",
    "otherRelationship": ""
  }
  ```

### 2. 添加地址資訊到 sourceData
- **祖先地址**: `registration.salvation.address` 
- **消災地址**: `registration.blessing.address`
- **目的**: 在各項目的 sourceData 中記錄對應地址，方便日後查詢
- **影響範圍**: 所有使用 sourceData 的活動項目

## 技術影響分析

### 1. joinRecordStore.js 修改點

#### A. payload 結構調整
```javascript
const payload = {
  registrationId: selectedRegistration.value.id,
  activityId: activityId || -1,
  contact: selectedRegistration.value.contact, // 新增聯絡人資訊
  items: selections.value,
  personLampTypes: personLampTypes.value,
  total: totalAmount.value,
  createdUser: getCurrentUser(),
  createdAt: createISOTime,
};
```

#### B. createParticipationItem 函數調整
需要修改此函數以添加 sourceAddress 欄位：

```javascript
const createParticipationItem = (type, sourceData) => {
  const config = activityConfigs.value[type];
  
  // 根據項目類型決定地址來源
  let sourceAddress = "";
  if (config.source === "salvation.ancestors" || config.source === "salvation.survivors") {
    sourceAddress = selectedRegistration.value?.salvation?.address || "";
  } else if (config.source === "blessing.persons") {
    sourceAddress = selectedRegistration.value?.blessing?.address || "";
  }
  
  return {
    type,
    label,
    price,
    quantity: sourceData.length,
    subtotal: price * sourceData.length,
    source: config.source,
    sourceData: sourceData, // 保持原有結構不變
    sourceAddress: sourceAddress, // 新增獨立的地址欄位
    // ... 其他屬性
  };
};
```

### 2. activityConfigs 影響評估

現有的 `activityConfigs` 結構不需要大幅修改，但需要確保：
- `source` 欄位正確對應到資料來源
- 地址資訊根據 `source` 類型自動添加到對應的 sourceData

### 3. 資料庫 Schema 調整

#### participationRecordDB 需要新增欄位：

```sql
-- 添加聯絡人資訊欄位
ALTER TABLE participation_records ADD COLUMN contact JSON;

-- 現有的 items 欄位中的 sourceData 將包含地址資訊
-- 不需要額外的資料庫結構調整，因為使用 JSON 格式存儲
```

## 實作步驟建議

### 階段一：Store 層修改
1. 修改 `submitRecord` 函數中的 `payload` 結構
2. 調整 `createParticipationItem` 函數以包含地址資訊
3. 確保地址資訊正確對應到不同的項目類型

### 階段二：資料驗證
1. 驗證聯絡人資訊完整性
2. 確保地址資訊正確添加到 sourceData
3. 測試不同項目類型的地址對應關係

### 階段三：資料庫調整
1. 更新 participationRecordDB schema
2. 調整相關的 API 接口
3. 更新 mock 資料格式

### 階段四：查詢功能調整
1. 更新 `joinRecordQueryStore.js` 以支援聯絡人和地址查詢
2. 調整查詢介面以顯示新增的資訊
3. 更新過濾和搜尋邏輯

## 資料結構變更

### 修改前的 payload
```json
{
  "registrationId": 105,
  "activityId": -1,
  "items": [...],
  "personLampTypes": {...},
  "total": 2000,
  "createdUser": "user123",
  "createdAt": "2026-01-26T21:26:08.031+08:00"
}
```

### 修改後的 payload
```json
{
  "registrationId": 105,
  "activityId": -1,
  "contact": {
    "name": "唐建國999",
    "phone": "07-44556677",
    "mobile": "0980-999-444", 
    "relationship": "娘家",
    "otherRelationship": ""
  },
  "items": [...],
  "personLampTypes": {...},
  "total": 2000,
  "createdUser": "user123",
  "createdAt": "2026-01-26T21:26:08.031+08:00"
}
```

### sourceData 結構變更

#### 修改前的 item 結構
```json
{
  "type": "qifu",
  "label": "消災祈福",
  "price": 300,
  "quantity": 2,
  "subtotal": 600,
  "source": "blessing.persons",
  "sourceData": [
    {
      "id": 1,
      "name": "唐建國999",
      "notes": "12312",
      "zodiac": "兔"
    }
  ]
}
```

#### 修改後的 item 結構
```json
{
  "type": "qifu",
  "label": "消災祈福",
  "price": 300,
  "quantity": 2,
  "subtotal": 600,
  "source": "blessing.persons",
  "sourceData": [
    {
      "id": 1,
      "name": "唐建國999",
      "notes": "12312",
      "zodiac": "兔"
    }
  ],
  "sourceAddress": "高雄市鳳山區光遠路700號"
}
```

## 注意事項

### 1. 向後相容性
- 確保修改不會影響現有的參加記錄查詢功能
- 考慮舊資料的處理方式（沒有聯絡人和地址資訊的記錄）

### 2. 效能考量
- 地址資訊會增加資料量，需要評估對查詢效能的影響
- 考慮是否需要為聯絡人和地址建立索引

### 3. 資料一致性
- 確保聯絡人資訊與原始登記表保持一致
- 地址資訊需要根據項目類型正確對應

### 4. 測試重點
- 測試不同項目類型的地址對應關係
- 驗證聯絡人資訊的完整性
- 確保查詢功能正常運作

## 相關檔案清單

### 需要修改的檔案
- `./client/src/stores/joinRecordStore.js` - 主要修改點
- `./client/src/stores/joinRecordQueryStore.js` - 查詢功能調整
- `./client/src/data/mock_participation_records.json` - 測試資料更新
- 資料庫 schema 檔案 - 新增聯絡人欄位

### 需要測試的檔案
- `./client/src/views/JoinRecord.vue` - 確保介面正常顯示
- `./client/src/views/JoinRecordList.vue` - 確保查詢功能正常

## 風險評估

### 低風險
- 添加聯絡人資訊到 payload（純新增，不影響現有邏輯）

### 中風險  
- 添加 sourceAddress 欄位（需要確保查詢功能能正確處理新欄位）
- 資料庫 schema 調整（需要考慮資料遷移）

### 建議
- 先在開發環境進行完整測試
- 考慮分階段部署，先部署 Store 層修改，再進行資料庫調整
- 保留舊資料的相容性處理機制
