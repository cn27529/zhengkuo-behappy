# Registration（祈福登記）開發指南

## 功能概述

Registration 是寺廟管理系統的核心功能，用於建立和管理信眾的祈福基本資料檔。系統設計目標是讓寺廟操作者能夠快速記錄信眾資料，並在後續法會活動中透過電話號碼快速查詢和使用這些資料。

## 評估多張表單

請評估多張表單的需求的可行性，registration.js是報名表單的 Pinia store，管理整個祈福登記表的狀態與操作。
使用者想加一個按鈕(增加表單)，可以填寫第2張表單。我的想法是這樣，將目前在填的表單在使用者按了(增加表單)之後，能將現有表單的registrationForm物件做(表單陣列formArray)存放起來，此時(表單陣列formArray)中會有1筆資料，表單頁面上能出現(表單張數)表示第n張...以此類推，表單陣列數字暫定在class="form-header"位置，這時頁面填寫的是第2張，這時除了會有(表單張數)，當使用者點擊(表單張數)如選擇第1張時這個時候頁面上就會返回(表單陣列formArray[0])的數據，反之使用者點擊(表單張數)如選擇第2張時這個時候頁面上就會返回(表單陣列formArray[1])的數據，使用者按了(增加表單)之後就再加一筆，如此規畫，分析看看以現在的registration.js是否可行？如做資料檢核 表單提交 多表單之間切換 會不會有問題，有沒有缺漏什麼考量的．

## 使用者故事分析

### 核心業務場景

1. **初次建檔**：信眾來寺廟拜拜或參與法會時，記錄完整基本資料
2. **快速查詢**：再次來訪時，透過電話號碼快速找到資料
3. **法會參與**：快速了解上次超度的祖先、消災人員等資訊
4. **收據列印**：參加法會活動時提供收據

### 資料關係複雜性

- **一人多檔**：一位信眾可能有多份資料
  - 自己家的祈福資料
  - 太太娘家的祈福資料
  - 朋友的祈福資料
  - 公司企業的祈福資料

### 核心資料類型

1. **聯絡人資訊**：姓名、電話、手機、關係
2. **消災人員**：需要祈福的在世人員（需地址、戶長）
3. **祖先資料**：需要超度的往生者
4. **陽上人**：超度祖先的在世遺族
5. **生肖資訊**：所有人員的生肖記錄

## 我理解的 Registration 功能重點：

### 🎯 核心業務邏輯（從使用者故事）

- **信眾資料建檔**：建立寺廟信眾的完整基本資料檔
- **電話快速查詢**：透過電話號碼快速找到信眾歷史資料
- **一人多檔案**：同一信眾可有多份資料（自己家、娘家、朋友、公司）
- **法會資料重用**：快速了解上次超度祖先、消災人員等資訊

### 📊 資料結構設計（從程式碼）

- **三大資料區塊**：
  - contact：聯絡人資訊（姓名、電話、關係）
  - blessing：消災人員（在世人員、需地址、戶長）
  - salvation：超度資訊（祖先 + 陽上人/遺族）
- **關係複雜性**：支援自己/配偶/子女/朋友/公司等多種關係
- **戶長邏輯**：消災人員中必須有且只有一位戶長

### 🏗️ 技術實作（從程式碼）

- **多表單管理**：支援同時管理多張登記表，標籤式切換
- **雙向同步**：表單編輯即時同步到表單陣列
- **狀態流程**：creating → saved → submitted → completed
- **JSON 儲存**：複雜的嵌套資料以 JSON 格式儲存

### 🔍 查詢功能（核心需求）

- **電話查詢**：主要查詢方式，支援手機和市話
- **多欄位搜尋**：姓名、地址、祖先、生肖等
- **快速重用**：查到資料後可快速了解歷史記錄

### 🎨 使用者體驗

- **表單切換器**：清楚顯示多張表單狀態
- **動態人員管理**：可新增/刪除消災人員、祖先、陽上人
- **智能驗證**：戶長邏輯、必填欄位、資料完整性檢查
- **收據列印**：參加法會時提供收據功能

這個功能的設計非常符合寺廟的實際業務需求，特別是「一人多檔」和「電話快速查詢」的設計，讓寺廟操作者能夠有效管理複雜的信眾關係和資料重用需求！

## 系統架構

### 核心組件

- **前端：** `Registration.vue` - 主要登記介面
- **狀態管理：** `registrationStore.js` - Pinia 狀態管理
- **服務層：** `registrationService.js` + `rustRegistrationService.js`
- **適配器：** `serviceAdapter.js` - 統一服務介面
- **後端：** Rust Axum API + Directus CMS

## 資料結構設計

### 核心資料模型 (Rust)

```rust
pub struct Registration {
    // 系統字段
    pub id: i64,
    pub user_created: Option<String>,
    pub date_created: Option<String>,
    pub user_updated: Option<String>,
    pub date_updated: Option<String>,

    // 業務字段
    pub state: Option<String>,           // 表單狀態
    pub form_id: Option<String>,         // 表單唯一ID
    pub form_name: Option<String>,       // 表單名稱
    pub form_source: Option<String>,     // 表單來源

    // JSON 結構化資料
    pub salvation: Option<String>,       // 超度資訊 (祖先+陽上人)
    pub contact: Option<String>,         // 聯絡人資訊
    pub blessing: Option<String>,        // 祈福資訊 (消災人員)

    // 自定義時間戳
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}
```

### 前端資料結構

```javascript
// 完整的祈福登記資料結構
const registrationForm = {
  // 基本資訊
  id: -1, // -1 表示新表單
  state: "creating", // 表單狀態
  formName: "", // 表單名稱
  formId: "", // 唯一識別碼
  formSource: "", // 表單來源

  // 聯絡人資訊
  contact: {
    name: "", // 聯絡人姓名
    phone: "", // 電話
    mobile: "", // 手機 (主要查詢欄位)
    relationship: "", // 關係 (自己/配偶/子女/朋友/其他)
    otherRelationship: "", // 其他關係說明
  },

  // 祈福資訊（消災人員）
  blessing: {
    address: "", // 地址 (必填)
    persons: [
      {
        // 消災人員列表
        id: 1,
        name: "", // 姓名
        zodiac: "", // 生肖
        notes: "", // 備註
        isHouseholdHead: true, // 是否為戶長 (必須有一位)
      },
    ],
  },

  // 超度資訊
  salvation: {
    address: "", // 地址
    // 祖先列表 (往生者)
    ancestors: [
      {
        id: 1,
        surname: "", // 姓氏
        zodiac: "", // 生肖
        notes: "", // 備註
      },
    ],
    // 陽上人列表 (在世遺族)
    survivors: [
      {
        id: 1,
        name: "", // 姓名
        zodiac: "", // 生肖
        notes: "", // 備註
      },
    ],
  },
};
```

## 核心功能實作

### 1. 多表單管理系統

#### 表單陣列管理

```javascript
// 支援同時管理多張登記表
const formArray = ref([]); // 表單陣列
const currentFormIndex = ref(0); // 當前編輯索引

// 表單狀態流程
const stateFlow = {
  creating: "建立中", // 初始狀態
  saved: "已儲存", // 草稿狀態
  submitted: "已提交", // 提交狀態
  completed: "已完成", // 完成狀態
};
```

#### 雙向資料同步

```javascript
// 監聽表單變化，自動同步到表單陣列
const setupFormSync = () => {
  syncWatcher = watch(
    () => registrationForm.value,
    (newValue) => {
      if (
        formArray.value.length > 0 &&
        currentFormIndex.value >= 0 &&
        currentFormIndex.value < formArray.value.length
      ) {
        // 深拷貝避免引用問題
        formArray.value[currentFormIndex.value] = JSON.parse(
          JSON.stringify(newValue),
        );
      }
    },
    { deep: true }, // 深度監聽所有屬性變化
  );
};
```

### 2. 快速查詢系統

#### 電話號碼查詢 (核心功能)

```javascript
// 根據電話號碼快速查詢信眾資料
const searchByPhone = async (phoneNumber) => {
  const results = await serviceAdapter.registrationService.getAllRegistrations({
    filter: {
      $or: [
        { "contact.phone": { _contains: phoneNumber } },
        { "contact.mobile": { _contains: phoneNumber } },
      ],
    },
  });

  return results.data || [];
};

// 多欄位搜尋功能
const searchRegistrations = async (searchQuery) => {
  return await serviceAdapter.registrationService.getAllRegistrations({
    filter: {
      $or: [
        { "contact.name": { _contains: searchQuery } },
        { "contact.phone": { _contains: searchQuery } },
        { "contact.mobile": { _contains: searchQuery } },
        { "blessing.address": { _contains: searchQuery } },
        { "salvation.address": { _contains: searchQuery } },
      ],
    },
  });
};
```

### 3. 人員管理系統

#### 消災人員管理

```javascript
// 新增消災人員
const addBlessingPerson = () => {
  const newPerson = {
    id: Date.now(), // 臨時ID
    name: "",
    zodiac: "",
    notes: "",
    isHouseholdHead: false, // 新增的不是戶長
  };

  registrationForm.value.blessing.persons.push(newPerson);
};

// 戶長驗證 (必須有且只有一位戶長)
const validateHouseholdHead = () => {
  const heads = registrationForm.value.blessing.persons.filter(
    (p) => p.isHouseholdHead,
  );

  if (heads.length === 0) {
    return "必須指定一位戶長";
  }
  if (heads.length > 1) {
    return "只能有一位戶長";
  }
  return null;
};
```

#### 祖先與陽上人管理

```javascript
// 新增祖先
const addAncestor = () => {
  const newAncestor = {
    id: Date.now(),
    surname: "",
    zodiac: "",
    notes: "",
  };

  registrationForm.value.salvation.ancestors.push(newAncestor);
};

// 新增陽上人
const addSurvivor = () => {
  const newSurvivor = {
    id: Date.now(),
    name: "",
    zodiac: "",
    notes: "",
  };

  registrationForm.value.salvation.survivors.push(newSurvivor);
};
```

### 4. 關係管理系統

#### 關係類型定義

```javascript
const relationshipOptions = [
  { value: "self", label: "自己" },
  { value: "spouse", label: "配偶" },
  { value: "child", label: "子女" },
  { value: "parent", label: "父母" },
  { value: "sibling", label: "兄弟姊妹" },
  { value: "friend", label: "朋友" },
  { value: "company", label: "公司企業" },
  { value: "other", label: "其他" },
];

// 關係驗證邏輯
const validateRelationship = (contact) => {
  if (!contact.relationship) {
    return "請選擇關係";
  }

  if (contact.relationship === "other" && !contact.otherRelationship) {
    return "請說明其他關係";
  }

  return null;
};
```

---

_此文件基於使用者故事和程式碼分析生成，涵蓋 Registration 功能的完整開發指南。_
