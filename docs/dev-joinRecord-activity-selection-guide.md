# JoinRecord 活動選擇功能開發指南

## 概述

本次修改在 JoinRecord.vue 的"已選擇的祈福登記"區塊中添加了活動選擇功能，允許用戶單選一個活動，並將活動的 id 綁定到 activityId。

## 修改的檔案

### 1. client/src/views/JoinRecord.vue

#### 新增功能：
- **活動選擇區塊**：在已選擇祈福登記下方添加活動選擇下拉選單
- **活動詳細信息顯示**：選中活動後顯示活動的詳細信息卡片
- **活動相關的計算屬性和方法**：處理活動數據的格式化和篩選

#### 主要修改：

**模板部分：**
```vue
<!-- 活動選擇區塊 -->
<div class="activity-selection-section">
  <h6>選擇活動</h6>
  <div class="activity-selector">
    <el-select
      v-model="selectedActivityId"
      placeholder="請選擇活動"
      size="large"
      style="width: 100%"
      clearable
      filterable
      @change="handleActivityChange"
    >
      <el-option
        v-for="activity in availableActivities"
        :key="activity.id"
        :label="`${activity.name} - ${formatActivityDate(activity.date)}`"
        :value="activity.id"
      >
        <!-- 活動選項詳細信息 -->
      </el-option>
    </el-select>
  </div>
  
  <!-- 選中活動的詳細信息卡片 -->
  <div v-if="selectedActivity" class="selected-activity-info">
    <!-- 活動信息卡片 -->
  </div>
</div>
```

**腳本部分新增：**
- 導入 `useActivityStore`
- 添加 `selectedActivityId` 狀態
- 添加活動相關的計算屬性和方法
- 修改提交邏輯以包含活動 ID

**樣式部分新增：**
- 活動選擇區塊樣式
- 活動選項樣式
- 活動信息卡片樣式

### 2. client/src/stores/joinRecordStore.js

#### 修改內容：
- **submitRecord 方法**：添加 `activityId` 參數，允許傳入選中的活動 ID
- **payload 結構**：將 `activityId` 從固定值改為動態傳入的參數

```javascript
// 修改前
const submitRecord = async () => {
  // ...
  const payload = {
    registrationId: selectedRegistration.value.id,
    activityId: selectedRegistration.value.activityId, // 固定值
    // ...
  };
}

// 修改後
const submitRecord = async (activityId = null) => {
  // ...
  const payload = {
    registrationId: selectedRegistration.value.id,
    activityId: activityId || -1, // 動態傳入的值
    // ...
  };
}
```

## 新增功能特色

### 1. 活動篩選
- 只顯示狀態為 `upcoming`（即將開始）或 `ongoing`（進行中）的活動
- 按日期排序，最近的活動排在前面
- 支援搜尋和篩選功能

### 2. 活動選擇界面
- **下拉選單**：使用 Element Plus 的 `el-select` 組件
- **可搜尋**：支援輸入關鍵字搜尋活動
- **可清空**：支援清空選擇
- **豐富的選項顯示**：顯示活動名稱、日期、類型、地點等信息

### 3. 活動詳細信息
- **信息卡片**：選中活動後顯示詳細信息
- **狀態標籤**：使用不同顏色的標籤顯示活動狀態
- **網格佈局**：使用響應式網格顯示活動詳細信息

### 4. 表單驗證
- 添加活動選擇的必填驗證
- 在提交前檢查是否已選擇活動

### 5. 調試信息
- 在開發模式下顯示活動相關的調試信息
- 包含活動總數、可用活動數、選中活動 ID 等

## 數據流程

1. **載入階段**：
   - 組件掛載時同時載入祈福登記資料和活動資料
   - 使用 `activityStore.getAllActivities()` 獲取所有活動

2. **篩選階段**：
   - 通過 `availableActivities` 計算屬性篩選可用活動
   - 只顯示即將開始或進行中的活動

3. **選擇階段**：
   - 用戶在下拉選單中選擇活動
   - `selectedActivityId` 更新，觸發 `selectedActivity` 計算屬性更新
   - 顯示選中活動的詳細信息

4. **提交階段**：
   - 驗證是否已選擇活動
   - 將 `selectedActivityId` 傳遞給 `joinRecordStore.submitRecord()`
   - 後端接收包含正確 `activityId` 的參加記錄

## 活動類型和狀態

### 活動類型 (item_type)
- `ceremony`: 法會
- `lecture`: 講座
- `meditation`: 禪修
- `festival`: 節慶
- `volunteer`: 志工
- `pudu`: 普度
- `other`: 其他

### 活動狀態 (state)
- `upcoming`: 即將開始（顯示為警告標籤）
- `ongoing`: 進行中（顯示為成功標籤）
- `completed`: 已完成（顯示為信息標籤）
- `cancelled`: 已取消（顯示為危險標籤）

## 響應式設計

- 活動選擇區塊在手機設備上會自動調整佈局
- 活動詳細信息使用響應式網格，在小螢幕上會自動換行
- 下拉選單在手機上會佔滿寬度

## 使用方式

1. **選擇祈福登記**：從右側列表選擇一筆祈福登記
2. **選擇活動**：在活動選擇下拉選單中選擇要參加的活動
3. **查看活動詳情**：選中活動後會顯示活動的詳細信息
4. **選擇參加項目**：在活動項目選擇區選擇要參加的項目
5. **提交記錄**：點擊"提交參加記錄"按鈕完成提交

## 錯誤處理

- 如果未選擇活動，提交時會顯示警告信息
- 如果活動載入失敗，會顯示錯誤信息
- 重置選擇時會同時清空活動選擇

## 後續開發建議

1. **活動狀態同步**：考慮添加活動狀態的實時更新
2. **活動容量限制**：添加活動參與人數限制檢查
3. **活動費用整合**：將活動本身的費用與參加項目費用整合
4. **活動提醒**：添加活動時間提醒功能
5. **批量操作**：支援為多個祈福登記選擇同一個活動