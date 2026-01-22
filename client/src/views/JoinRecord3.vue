<template>
  <div class="activity-registration-page">
    <div class="page-header">
      <h1>📝 活動參加記錄系統</h1>
      <p>從右側選擇登記表，於左側勾選參加項目</p>
    </div>

    <div class="layout-container">
      <div class="left-section">
        <div v-if="selectedRegistration" class="selection-section">
          <div class="selected-header">
            <h2>登記表：{{ selectedRegistration.formName }}</h2>
            <div class="contact-pill">
              聯絡人：{{ selectedRegistration.contact.name }} ({{
                selectedRegistration.contact.mobile
              }})
            </div>
          </div>

          <div
            v-for="(config, key) in activityConfigs"
            :key="key"
            class="activity-group"
          >
            <label class="group-header">
              <div class="header-left">
                <input
                  type="checkbox"
                  :checked="isAllSelected(key)"
                  @change="toggleGroup(key)"
                />
                <span class="title">{{ config.label }}</span>
              </div>
              <span class="price-tag">每位 ${{ config.price }}</span>
            </label>

            <div class="item-list">
              <div
                v-for="item in getSourceData(key)"
                :key="item.id"
                class="item-row"
              >
                <label>
                  <input
                    type="checkbox"
                    :value="item"
                    v-model="selections[key]"
                  />
                  <span class="name">{{ item.name || item.surname }}</span>
                  <span v-if="item.zodiac" class="zodiac"
                    >({{ item.zodiac }})</span
                  >
                  <span v-if="item.notes" class="notes"
                    >- {{ item.notes }}</span
                  >
                </label>
              </div>
              <div v-if="!getSourceData(key).length" class="empty-hint">
                無相關資料
              </div>
            </div>
          </div>
        </div>

        <div v-else class="no-selection-placeholder">
          <p>⬅ 請先從右側列表選擇一筆祈福登記表</p>
        </div>

        <div class="bottom-sticky-bar" v-if="selectedRegistration">
          <div class="summary-info">
            <span class="total-label">金額統計：</span>
            <span class="total-amount">${{ totalAmount }}</span>
          </div>
          <div class="button-group">
            <button class="btn-clear" @click="handleReset">重置</button>
            <button
              class="btn-save"
              :disabled="totalAmount === 0"
              @click="handleSaveParticipationRecord"
            >
              💾 保存參加記錄
            </button>
          </div>
        </div>
      </div>

      <div class="right-section">
        <h3>查詢祈福登記資料</h3>
        <div class="search-panel">
          <input
            v-model="searchKeyword"
            placeholder="搜尋姓名、手機、電話、地址"
            class="search-input"
          />
        </div>

        <div class="reg-list">
          <div
            v-for="reg in filteredRegistrations"
            :key="reg.id"
            :class="[
              'reg-card',
              { active: selectedRegistration?.id === reg.id },
            ]"
            @click="handleSelectRegistration(reg)"
          >
            <div class="reg-card-title">{{ reg.formName }}</div>
            <div class="reg-card-desc">
              {{ reg.contact.name }} | {{ reg.contact.mobile }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import mockData from "../data/mock_registrations.json";

// 1. 活動配置定義 (未來增加新項目只需在此添加一筆)
const activityConfigs = {
  chaodu: { label: "超度/超薦", price: 1000, source: "salvation.ancestors" },
  diandeng: { label: "點燈", price: 600, source: "blessing.persons" },
  qifu: { label: "消災祈福", price: 300, source: "salvation.survivors" },
  xiaozai: { label: "固定消災", price: 100, source: "blessing.persons" },
};

// 2. 狀態管理
const searchKeyword = ref("");
// 選中的登記表
const selectedRegistration = ref(null);
// 存儲選中狀態的物件
const selections = ref({
  chaodu: [],
  diandeng: [],
  qifu: [],
  xiaozai: [],
});

// 模擬資料 (同前)
const mockRegistrations = ref(mockData);

// 3. 邏輯處理
const filteredRegistrations = computed(() => {
  const kw = searchKeyword.value.toLowerCase();
  return mockRegistrations.value.filter(
    (r) =>
      r.contact.name.includes(kw) ||
      r.contact.mobile.includes(kw) ||
      r.formName.includes(kw),
  );
});

// 根據配置路徑取得對應的人員列表
const getSourceData = (key) => {
  if (!selectedRegistration.value) return [];
  const path = activityConfigs[key].source.split(".");
  return path.reduce((obj, i) => obj[i], selectedRegistration.value);
};

// 計算總金額
const totalAmount = computed(() => {
  return Object.keys(selections.value).reduce((sum, key) => {
    return sum + selections.value[key].length * activityConfigs[key].price;
  }, 0);
});

// 全選邏輯
const isAllSelected = (key) => {
  const source = getSourceData(key);
  return source.length > 0 && selections.value[key].length === source.length;
};

const toggleGroup = (key) => {
  if (isAllSelected(key)) {
    selections.value[key] = [];
  } else {
    selections.value[key] = [...getSourceData(key)];
  }
};

const handleSelectRegistration = (reg) => {
  selectedRegistration.value = reg;
  handleReset();
};

const handleReset = () => {
  Object.keys(selections.value).forEach((k) => (selections.value[k] = []));
};

const handleSaveParticipationRecord = () => {
  const payload = {
    registrationId: selectedRegistration.value.id,
    formName: selectedRegistration.value.formName,
    saveTime: new Date().toISOString(),
    details: selections.value, // 直接儲存選中的物件陣列
    total: totalAmount.value,
  };
  console.log("保存完整資料包:", payload);
  alert("儲存成功！");
};
</script>

<style scoped>
/* 採現代化 Clean Design 佈局 */
.layout-container {
  display: flex;
  gap: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.left-section {
  flex: 7;
  position: relative;
}
.right-section {
  flex: 3;
}

.activity-group {
  background: white;
  border-radius: 10px;
  margin-bottom: 16px;
  border: 1px solid #eee;
  overflow: hidden;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: #fcfcfc;
  border-bottom: 1px solid #eee;
  cursor: pointer;
}

.price-tag {
  background: #e8f5e9;
  color: #2e7d32;
  padding: 4px 12px;
  border-radius: 100px;
  font-weight: bold;
}

.item-list {
  padding: 10px 20px;
}
.item-row {
  padding: 8px 0;
  border-bottom: 1px dashed #f0f0f0;
}

.bottom-sticky-bar {
  position: sticky;
  bottom: 20px;
  background: #2c3e50;
  color: white;
  padding: 20px;
  border-radius: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.total-amount {
  font-size: 24px;
  color: #f1c40f;
  font-weight: bold;
}

.reg-list {
  max-height: 400px;
  overflow-y: auto;
}

.reg-card {
  padding: 16px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: 0.2s;
}

.reg-card.active {
  border-color: #3498db;
  background: #ebf5fb;
  box-shadow: inset 4px 0 0 #3498db;
}

.btn-save {
  background: #3498db;
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
}

.btn-save:disabled {
  background: #7f8c8d;
  cursor: not-allowed;
}
</style>
