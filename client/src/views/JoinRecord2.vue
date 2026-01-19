<!-- src/views/JoinRecord.vue -->
<template>
  <div class="main-content">
    <div class="page-header">
      <h2>活動參加記錄</h2>
    </div>

    <div class="activity-record-container">
      <!-- 左側區域 70% -->
      <div class="left-panel">
        <!-- 已選擇的祈福登記表 -->
        <div class="form-section" v-if="selectedRegistration">
          <h3>已選擇登記表：{{ selectedRegistration.formName }}</h3>
          <div class="selected-info">
            <span
              ><strong>聯絡人：</strong
              >{{ selectedRegistration.contact.name }}</span
            >
            <span
              ><strong>電話：</strong
              >{{ selectedRegistration.contact.mobile }}</span
            >
            <span
              ><strong>關係：</strong
              >{{ selectedRegistration.contact.relationship }}</span
            >
          </div>
        </div>

        <div class="form-section" v-if="!selectedRegistration">
          <p class="no-selection">請從右側選擇祈福登記表</p>
        </div>

        <!-- 活動項目選擇區 -->
        <div class="form-section" v-if="selectedRegistration">
          <h2>活動項目選擇</h2>

          <!-- 超度/超薦 -->
          <div class="activity-section">
            <div class="activity-header">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  v-model="activities.chaodu.enabled"
                  @change="updateSelections"
                />
                <span class="activity-title">超度/超薦</span>
                <span class="activity-price">每位 $1,000</span>
              </label>
            </div>

            <div v-if="activities.chaodu.enabled" class="person-list">
              <div
                v-for="ancestor in selectedRegistration.salvation.ancestors"
                :key="'ancestor-' + ancestor.id"
                class="person-item"
              >
                <label class="checkbox-label">
                  <input
                    type="checkbox"
                    :value="ancestor.id"
                    v-model="activities.chaodu.selectedIds"
                    @change="calculateTotal"
                  />
                  <span>{{ ancestor.surname }}</span>
                  <span v-if="ancestor.notes" class="notes">{{
                    ancestor.notes
                  }}</span>
                </label>
              </div>
            </div>
          </div>

          <!-- 點燈 -->
          <div class="activity-section">
            <div class="activity-header">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  v-model="activities.diandeng.enabled"
                  @change="updateSelections"
                />
                <span class="activity-title">點燈</span>
                <span class="activity-price">每位 $600</span>
              </label>
            </div>

            <div v-if="activities.diandeng.enabled" class="person-list">
              <div
                v-for="person in selectedRegistration.blessing.persons"
                :key="'blessing-' + person.id"
                class="person-item"
              >
                <label class="checkbox-label">
                  <input
                    type="checkbox"
                    :value="person.id"
                    v-model="activities.diandeng.selectedIds"
                    @change="calculateTotal"
                  />
                  <span>{{ person.name }}</span>
                  <span class="zodiac">({{ person.zodiac }})</span>
                  <span v-if="person.notes" class="notes">{{
                    person.notes
                  }}</span>
                  <span v-if="person.isHouseholdHead" class="household-head"
                    >戶長</span
                  >
                </label>
              </div>
            </div>
          </div>

          <!-- 祈福 -->
          <div class="activity-section">
            <div class="activity-header">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  v-model="activities.qifu.enabled"
                  @change="updateSelections"
                />
                <span class="activity-title">祈福</span>
                <span class="activity-price">每位 $300</span>
              </label>
            </div>

            <div v-if="activities.qifu.enabled" class="person-list">
              <div
                v-for="survivor in selectedRegistration.salvation.survivors"
                :key="'survivor-' + survivor.id"
                class="person-item"
              >
                <label class="checkbox-label">
                  <input
                    type="checkbox"
                    :value="survivor.id"
                    v-model="activities.qifu.selectedIds"
                    @change="calculateTotal"
                  />
                  <span>{{ survivor.name }}</span>
                  <span class="zodiac">({{ survivor.zodiac }})</span>
                  <span v-if="survivor.notes" class="notes">{{
                    survivor.notes
                  }}</span>
                </label>
              </div>
            </div>
          </div>

          <!-- 固定消災 -->
          <div class="activity-section">
            <div class="activity-header">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  v-model="activities.gudingxiaozai.enabled"
                  @change="updateSelections"
                />
                <span class="activity-title">固定消災</span>
                <span class="activity-price">每位 $100</span>
              </label>
            </div>

            <div v-if="activities.gudingxiaozai.enabled" class="person-list">
              <div
                v-for="person in selectedRegistration.blessing.persons"
                :key="'fixed-' + person.id"
                class="person-item"
              >
                <label class="checkbox-label">
                  <input
                    type="checkbox"
                    :value="person.id"
                    v-model="activities.gudingxiaozai.selectedIds"
                    @change="calculateTotal"
                  />
                  <span>{{ person.name }}</span>
                  <span class="zodiac">({{ person.zodiac }})</span>
                  <span v-if="person.notes" class="notes">{{
                    person.notes
                  }}</span>
                  <span v-if="person.isHouseholdHead" class="household-head"
                    >戶長</span
                  >
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- 金額統計 -->
        <div class="form-section total-section" v-if="selectedRegistration">
          <h2>金額統計</h2>
          <div class="total-breakdown">
            <div
              class="total-item"
              v-if="
                activities.chaodu.enabled &&
                activities.chaodu.selectedIds.length > 0
              "
            >
              <span>超度/超薦：</span>
              <span
                >{{ activities.chaodu.selectedIds.length }} 位 × $1,000 = ${{
                  activities.chaodu.selectedIds.length * 1000
                }}</span
              >
            </div>
            <div
              class="total-item"
              v-if="
                activities.diandeng.enabled &&
                activities.diandeng.selectedIds.length > 0
              "
            >
              <span>點燈：</span>
              <span
                >{{ activities.diandeng.selectedIds.length }} 位 × $600 = ${{
                  activities.diandeng.selectedIds.length * 600
                }}</span
              >
            </div>
            <div
              class="total-item"
              v-if="
                activities.qifu.enabled &&
                activities.qifu.selectedIds.length > 0
              "
            >
              <span>祈福：</span>
              <span
                >{{ activities.qifu.selectedIds.length }} 位 × $300 = ${{
                  activities.qifu.selectedIds.length * 300
                }}</span
              >
            </div>
            <div
              class="total-item"
              v-if="
                activities.gudingxiaozai.enabled &&
                activities.gudingxiaozai.selectedIds.length > 0
              "
            >
              <span>固定消災：</span>
              <span
                >{{ activities.gudingxiaozai.selectedIds.length }} 位 × $100 =
                ${{ activities.gudingxiaozai.selectedIds.length * 100 }}</span
              >
            </div>
            <div class="total-final">
              <span>總金額：</span>
              <span class="amount">${{ totalAmount }}</span>
            </div>
          </div>
        </div>

        <!-- 操作按鈕 -->
        <div class="form-actions" v-if="selectedRegistration">
          <button
            type="button"
            class="btn btn-secondary"
            @click="resetSelections"
          >
            重置
          </button>
          <button type="button" class="btn btn-primary" @click="saveRecord">
            保存參加記錄
          </button>
        </div>
      </div>

      <!-- 右側區域 30% -->
      <div class="right-panel">
        <!-- 查詢區 -->
        <div class="search-section">
          <h3>查詢祈福登記表</h3>
          <div class="search-input-group">
            <input
              type="text"
              v-model="searchKeyword"
              placeholder="輸入姓名、表單名稱或電話"
              @input="searchRegistrations"
            />
          </div>
          <p class="search-hint">
            共 {{ filteredRegistrations.length }} 筆登記表
          </p>
        </div>

        <!-- 登記表列表 -->
        <div class="results-section">
          <div class="results-header">
            <h3>登記表列表</h3>
          </div>
          <div class="registration-list">
            <div
              v-for="reg in filteredRegistrations"
              :key="reg.id"
              class="registration-item"
              :class="{
                active:
                  selectedRegistration && selectedRegistration.id === reg.id,
              }"
              @click="selectRegistration(reg)"
            >
              <div class="reg-name">{{ reg.formName }}</div>
              <div class="reg-contact">{{ reg.contact.name }}</div>
              <div class="reg-phone">{{ reg.contact.mobile }}</div>
              <div class="reg-source" v-if="reg.formSource">
                {{ reg.formSource }}
              </div>
            </div>
          </div>
        </div>

        <!-- 已保存記錄 -->
        <div class="results-section" v-if="savedRecords.length > 0">
          <div class="results-header">
            <h3>已保存記錄 ({{ savedRecords.length }})</h3>
          </div>
          <div class="saved-records-list">
            <div
              v-for="(record, index) in savedRecords"
              :key="index"
              class="saved-record-item"
            >
              <div class="record-header">
                <span class="record-name">{{ record.formName }}</span>
                <span class="record-amount">${{ record.totalAmount }}</span>
              </div>
              <div class="record-time">{{ formatDate(record.savedAt) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 成功提示 -->
    <div v-if="showSuccess" class="success-message">
      {{ successMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useJoinRecordStore } from "../stores/joinRecordStore.js";
import mockDatas from "../data/mock_registrations.json";

const joinRecordStore = useJoinRecordStore();

// 狀態管理
const searchKeyword = ref("");
const selectedRegistration = ref(null);
const showSuccess = ref(false);
const successMessage = ref("");
const savedRecords = ref([]);

// 活動項目狀態
const activities = ref({
  chaodu: {
    enabled: false,
    selectedIds: [],
    price: 1000,
  },
  diandeng: {
    enabled: false,
    selectedIds: [],
    price: 600,
  },
  qifu: {
    enabled: false,
    selectedIds: [],
    price: 300,
  },
  gudingxiaozai: {
    enabled: false,
    selectedIds: [],
    price: 100,
  },
});

// 模擬資料 (同前)
const mockRegistrations = ref(mockDatas);

const getMockRegistrations = async () => {
  const mockData = await joinRecordStore.loadMockData();
  mockRegistrations.value = mockData;
  return mockData;
};

// 計算篩選後的登記表
const filteredRegistrations = computed(() => {
  if (!searchKeyword.value) {
    return mockRegistrations.value;
  }

  const keyword = searchKeyword.value.toLowerCase();
  return mockRegistrations.value.filter((reg) => {
    return (
      reg.formName.toLowerCase().includes(keyword) ||
      reg.contact.name.toLowerCase().includes(keyword) ||
      reg.contact.mobile.includes(keyword) ||
      reg.contact.phone.includes(keyword)
    );
  });
});

// 計算總金額
const totalAmount = computed(() => {
  let total = 0;

  if (activities.value.chaodu.enabled) {
    total += activities.value.chaodu.selectedIds.length * 1000;
  }
  if (activities.value.diandeng.enabled) {
    total += activities.value.diandeng.selectedIds.length * 600;
  }
  if (activities.value.qifu.enabled) {
    total += activities.value.qifu.selectedIds.length * 300;
  }
  if (activities.value.gudingxiaozai.enabled) {
    total += activities.value.gudingxiaozai.selectedIds.length * 100;
  }

  return total;
});

// 搜尋登記表
const searchRegistrations = () => {
  // 搜尋功能已由 computed 處理
};

// 選擇登記表
const selectRegistration = (reg) => {
  selectedRegistration.value = reg;
  resetSelections();
};

// 更新選擇項目
const updateSelections = () => {
  // 當取消勾選活動時，清空該活動的選擇
  if (!activities.value.chaodu.enabled) {
    activities.value.chaodu.selectedIds = [];
  }
  if (!activities.value.diandeng.enabled) {
    activities.value.diandeng.selectedIds = [];
  }
  if (!activities.value.qifu.enabled) {
    activities.value.qifu.selectedIds = [];
  }
  if (!activities.value.gudingxiaozai.enabled) {
    activities.value.gudingxiaozai.selectedIds = [];
  }
};

// 計算總金額（觸發重新計算）
const calculateTotal = () => {
  // 由 computed 自動處理
};

// 重置選擇
const resetSelections = () => {
  activities.value = {
    chaodu: { enabled: false, selectedIds: [], price: 1000 },
    diandeng: { enabled: false, selectedIds: [], price: 600 },
    qifu: { enabled: false, selectedIds: [], price: 300 },
    gudingxiaozai: { enabled: false, selectedIds: [], price: 100 },
  };
};

// 保存參加記錄
const saveRecord = () => {
  if (!selectedRegistration.value) {
    alert("請選擇祈福登記表");
    return;
  }

  if (totalAmount.value === 0) {
    alert("請至少選擇一個活動項目");
    return;
  }

  // 建立參加記錄
  const record = {
    registrationId: selectedRegistration.value.id,
    formName: selectedRegistration.value.formName,
    contact: selectedRegistration.value.contact,
    activities: {
      chaodu: {
        enabled: activities.value.chaodu.enabled,
        selectedIds: [...activities.value.chaodu.selectedIds],
        count: activities.value.chaodu.selectedIds.length,
        amount: activities.value.chaodu.selectedIds.length * 1000,
      },
      diandeng: {
        enabled: activities.value.diandeng.enabled,
        selectedIds: [...activities.value.diandeng.selectedIds],
        count: activities.value.diandeng.selectedIds.length,
        amount: activities.value.diandeng.selectedIds.length * 600,
      },
      qifu: {
        enabled: activities.value.qifu.enabled,
        selectedIds: [...activities.value.qifu.selectedIds],
        count: activities.value.qifu.selectedIds.length,
        amount: activities.value.qifu.selectedIds.length * 300,
      },
      gudingxiaozai: {
        enabled: activities.value.gudingxiaozai.enabled,
        selectedIds: [...activities.value.gudingxiaozai.selectedIds],
        count: activities.value.gudingxiaozai.selectedIds.length,
        amount: activities.value.gudingxiaozai.selectedIds.length * 100,
      },
    },
    totalAmount: totalAmount.value,
    savedAt: new Date().toISOString(),
  };

  // 保存到記錄列表
  savedRecords.value.unshift(record);

  // 顯示成功訊息
  successMessage.value = "參加記錄已保存！";
  showSuccess.value = true;
  setTimeout(() => {
    showSuccess.value = false;
  }, 3000);

  // 重置選擇
  resetSelections();

  console.log("已保存參加記錄：", record);
};

// 格式化日期
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// 組件掛載
onMounted(async () => {
  console.log("活動參加記錄頁面已載入");  
});
</script>

<style scoped>
.activity-record-container {
  display: flex;
  gap: 1.5rem;
  min-height: calc(100vh - 200px);
}

.left-panel {
  flex: 0 0 70%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.right-panel {
  flex: 0 0 calc(30% - 1.5rem);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* 選中資訊 */
.selected-info {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 6px;
  margin-top: 0.5rem;
}

.no-selection {
  text-align: center;
  color: #999;
  padding: 2rem;
  font-size: 1.1rem;
}

/* 活動區塊 */
.activity-section {
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  background: #fafafa;
}

.activity-header {
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e9ecef;
}

.activity-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--primary-color);
  margin-right: 1rem;
}

.activity-price {
  color: #666;
  font-size: 0.9rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
  cursor: pointer;
}

/* 人員列表 */
.person-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.5rem;
  background: white;
  border-radius: 6px;
}

.person-item {
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.person-item:hover {
  background: #f8f9fa;
}

.zodiac {
  color: #666;
  font-size: 0.9rem;
}

.notes {
  color: #999;
  font-size: 0.85rem;
  margin-left: 0.5rem;
}

.household-head {
  background: var(--household-color);
  color: white;
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  margin-left: 0.5rem;
}

/* 金額統計 */
.total-section {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border: 2px solid var(--primary-color);
}

.total-breakdown {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.total-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem;
  background: white;
  border-radius: 4px;
}

.total-final {
  display: flex;
  justify-content: space-between;
  padding: 1rem;
  background: var(--primary-color);
  color: white;
  border-radius: 6px;
  font-size: 1.2rem;
  font-weight: bold;
  margin-top: 0.5rem;
}

.amount {
  font-size: 1.5rem;
}

/* 登記表列表 */
.registration-list {
  max-height: 400px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.registration-item {
  padding: 1rem;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  background: white;
}

.registration-item:hover {
  border-color: var(--primary-color);
  box-shadow: 0 2px 8px rgba(139, 69, 19, 0.1);
}

.registration-item.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.reg-name {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.reg-contact {
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.reg-phone {
  font-size: 0.85rem;
  color: #666;
}

.registration-item.active .reg-phone {
  color: rgba(255, 255, 255, 0.8);
}

.reg-source {
  margin-top: 0.5rem;
  padding: 0.25rem 0.5rem;
  background: #e9ecef;
  border-radius: 4px;
  font-size: 0.8rem;
  display: inline-block;
}

.registration-item.active .reg-source {
  background: rgba(255, 255, 255, 0.2);
}

/* 已保存記錄 */
.saved-records-list {
  max-height: 300px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.saved-record-item {
  padding: 0.75rem;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  background: #f8f9fa;
}

.record-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.record-name {
  font-weight: 600;
  font-size: 0.9rem;
}

.record-amount {
  color: var(--primary-color);
  font-weight: bold;
}

.record-time {
  font-size: 0.8rem;
  color: #666;
}

/* 響應式設計 */
@media (max-width: 1024px) {
  .activity-record-container {
    flex-direction: column;
  }

  .left-panel,
  .right-panel {
    flex: 1 1 100%;
  }
}

@media (max-width: 768px) {
  .selected-info {
    flex-direction: column;
    gap: 0.5rem;
  }

  .activity-title {
    font-size: 1rem;
  }

  .total-final {
    font-size: 1rem;
  }

  .amount {
    font-size: 1.2rem;
  }
}
</style>
