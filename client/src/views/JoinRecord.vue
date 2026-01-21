<template>
  <div class="activity-registration-page">
    <div class="page-header">
      <h1>📝 活動參加記錄</h1>
      <p>請在右方選擇祈福登記資料，並在左方勾選參加項目</p>
    </div>

    <div class="layout-container">
      <!-- 左側：勾選項目區 (70%) -->
      <div class="left-section">
        <div class="selection-section">
          <h2>勾選參加項目</h2>
          <div v-if="selectedRegistration" class="selected-info">
            <h3>當前選擇的登記表：{{ selectedRegistration.formName }}</h3>
            <p>
              聯絡人：{{ selectedRegistration.contact.name }} ({{
                selectedRegistration.contact.relationship
              }})
            </p>
          </div>
          <div v-else class="no-selection">
            <p>請在右側選擇一筆祈福登記資料</p>
          </div>

          <div class="selection-options">
            <!-- 超度（祖先） -->
            <div class="option-group">
              <label class="option-header">
                <input
                  type="checkbox"
                  v-model="selectAllAncestors"
                  @change="toggleAllAncestors"
                />
                <span class="option-title">超度（祖先）</span>
                <span class="price-tag">每位 NT$ 1,000</span>
              </label>
              <div class="option-items">
                <div
                  v-for="ancestor in selectedRegistration?.salvation
                    ?.ancestors || []"
                  :key="ancestor.id"
                  class="option-item"
                >
                  <label>
                    <input
                      type="checkbox"
                      :value="ancestor"
                      v-model="selectedAncestors"
                    />
                    <span class="item-name">{{ ancestor.surname }}</span>
                    <span class="item-notes" v-if="ancestor.notes"
                      >({{ ancestor.notes }})</span
                    >
                  </label>
                </div>
                <div
                  v-if="!selectedRegistration?.salvation?.ancestors?.length"
                  class="no-items"
                >
                  無祖先資料
                </div>
              </div>
            </div>

            <!-- 點燈（消災） -->
            <div class="option-group">
              <label class="option-header">
                <input
                  type="checkbox"
                  v-model="selectAllBlessing"
                  @change="toggleAllBlessing"
                />
                <span class="option-title">點燈（消災）</span>
                <span class="price-tag">每位 NT$ 600</span>
              </label>
              <div class="option-items">
                <div
                  v-for="person in selectedRegistration?.blessing?.persons ||
                  []"
                  :key="person.id"
                  class="option-item"
                >
                  <label>
                    <input
                      type="checkbox"
                      :value="person"
                      v-model="selectedBlessing"
                    />
                    <span class="item-name">{{ person.name }}</span>
                    <span class="item-zodiac">({{ person.zodiac }})</span>
                    <span class="item-notes" v-if="person.notes"
                      >- {{ person.notes }}</span
                    >
                  </label>
                </div>
                <div
                  v-if="!selectedRegistration?.blessing?.persons?.length"
                  class="no-items"
                >
                  無消災人員資料
                </div>
              </div>
            </div>

            <!-- 祈福（陽上人） -->
            <div class="option-group">
              <label class="option-header">
                <input
                  type="checkbox"
                  v-model="selectAllSurvivors"
                  @change="toggleAllSurvivors"
                />
                <span class="option-title">祈福（陽上人）</span>
                <span class="price-tag">每位 NT$ 300</span>
              </label>
              <div class="option-items">
                <div
                  v-for="survivor in selectedRegistration?.salvation
                    ?.survivors || []"
                  :key="survivor.id"
                  class="option-item"
                >
                  <label>
                    <input
                      type="checkbox"
                      :value="survivor"
                      v-model="selectedSurvivors"
                    />
                    <span class="item-name">{{ survivor.name }}</span>
                    <span class="item-zodiac">({{ survivor.zodiac }})</span>
                  </label>
                </div>
                <div
                  v-if="!selectedRegistration?.salvation?.survivors?.length"
                  class="no-items"
                >
                  無陽上人資料
                </div>
              </div>
            </div>

            <!-- 固定消災 -->
            <div class="option-group">
              <label class="option-header">
                <input
                  type="checkbox"
                  v-model="selectAllFixedBlessing"
                  @change="toggleAllFixedBlessing"
                />
                <span class="option-title">固定消災</span>
                <span class="price-tag">每位 NT$ 100</span>
              </label>
              <div class="option-items">
                <div
                  v-for="person in selectedRegistration?.blessing?.persons ||
                  []"
                  :key="person.id + '_fixed'"
                  class="option-item"
                >
                  <label>
                    <input
                      type="checkbox"
                      :value="person"
                      v-model="selectedFixedBlessing"
                    />
                    <span class="item-name">{{ person.name }}</span>
                    <span class="item-zodiac">({{ person.zodiac }})</span>
                    <span class="item-notes" v-if="person.notes"
                      >- {{ person.notes }}</span
                    >
                  </label>
                </div>
                <div
                  v-if="!selectedRegistration?.blessing?.persons?.length"
                  class="no-items"
                >
                  無消災人員資料
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 金額統計 -->
        <div class="summary-section">
          <h3>費用統計</h3>
          <div class="summary-details">
            <div class="summary-row">
              <span>超度（祖先）</span>
              <span>{{ selectedAncestors.length }} 位 × NT$1,000</span>
              <span class="amount">NT$ {{ ancestorsTotal }}</span>
            </div>
            <div class="summary-row">
              <span>點燈（消災）</span>
              <span>{{ selectedBlessing.length }} 位 × NT$600</span>
              <span class="amount">NT$ {{ blessingTotal }}</span>
            </div>
            <div class="summary-row">
              <span>祈福（陽上人）</span>
              <span>{{ selectedSurvivors.length }} 位 × NT$300</span>
              <span class="amount">NT$ {{ survivorsTotal }}</span>
            </div>
            <div class="summary-row">
              <span>固定消災</span>
              <span>{{ selectedFixedBlessing.length }} 位 × NT$100</span>
              <span class="amount">NT$ {{ fixedBlessingTotal }}</span>
            </div>
            <div class="summary-divider"></div>
            <div class="summary-total">
              <span>總金額</span>
              <span class="total-amount">NT$ {{ totalAmount }}</span>
            </div>
          </div>
        </div>

        <!-- 儲存按鈕 -->
        <div class="action-section">
          <button
            class="save-btn"
            :disabled="!selectedRegistration || totalAmount === 0"
            @click="saveParticipationRecord"
          >
            💾 保存參加記錄
          </button>
          <button class="clear-btn" @click="clearSelection">🗑️ 清除選擇</button>
        </div>
      </div>

      <!-- 右側：查詢與預覽區 (30%) -->
      <div class="right-section">
        <div class="search-section">
          <h2>查詢祈福登記資料</h2>
          <div class="search-box">
            <input
              type="text"
              v-model="searchKeyword"
              placeholder="搜尋姓名、手機、電話、地址"
              class="search-input"
            />
            <button class="search-btn" @click="performSearch">🔍 搜尋</button>
          </div>
          <div class="search-options">
            <label>
              <input type="checkbox" v-model="showOnlySubmitted" />
              僅顯示已提交
            </label>
          </div>
        </div>

        <div class="results-section">
          <h3>查詢結果 ({{ filteredRegistrations.length }} 筆)</h3>
          <div class="registrations-list">
            <div
              v-for="reg in filteredRegistrations"
              :key="reg.id"
              class="registration-card"
              :class="{ selected: selectedRegistration?.id === reg.id }"
              @click="selectRegistration(reg)"
            >
              <div class="card-header">
                <span class="form-name">{{ reg.formName }}</span>
                <span class="form-source" v-if="reg.formSource"
                  >({{ reg.formSource }})</span
                >
              </div>
              <div class="card-body">
                <p><strong>聯絡人：</strong>{{ reg.contact.name }}</p>
                <p>
                  <strong>電話：</strong
                  >{{ reg.contact.mobile || reg.contact.phone }}
                </p>
                <p><strong>關係：</strong>{{ reg.contact.relationship }}</p>
                <div class="data-summary">
                  <span
                    >祖先：{{ reg.salvation?.ancestors?.length || 0 }} 位</span
                  >
                  <span>消災：{{ reg.blessing?.persons?.length || 0 }} 位</span>
                  <span
                    >陽上：{{ reg.salvation?.survivors?.length || 0 }} 位</span
                  >
                </div>
              </div>
              <div class="card-footer">
                <small>{{ formatDate(reg.createdAt) }}</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";

// 假資料 - 之後可替換為 store 資料
const mockData = [
  {
    state: "submitted",
    createdAt: "2025-11-22T08:30:00.000Z",
    updatedAt: "2025-01-15T09:45:00.000Z",
    formName: "2025祈福登記表-001",
    formSource: "",
    formId: "a1b2c3d",
    id: 1,
    contact: {
      name: "王大明",
      phone: "02-12345678",
      mobile: "0912-345-678",
      relationship: "本家",
      otherRelationship: "",
    },
    blessing: {
      address: "台北市中正區中山南路1號",
      persons: [
        {
          id: 1,
          name: "王大明",
          zodiac: "龍",
          notes: "",
          isHouseholdHead: true,
        },
        {
          id: 2,
          name: "李小華",
          zodiac: "蛇",
          notes: "妻子",
          isHouseholdHead: false,
        },
      ],
    },
    salvation: {
      address: "台北市中正區中山南路1號",
      ancestors: [
        {
          id: 1,
          surname: "王府",
          notes: "歷代祖先",
        },
      ],
      survivors: [
        {
          id: 1,
          name: "王大明",
          zodiac: "龍",
          notes: "",
        },
        {
          id: 2,
          name: "李小華",
          zodiac: "蛇",
          notes: "",
        },
      ],
    },
  },
  {
    state: "submitted",
    createdAt: "2025-01-16T10:15:00.000Z",
    updatedAt: "2025-01-16T11:20:00.000Z",
    formName: "2025祈福登記表-002",
    formSource: "朝山法會",
    formId: "e4f5g6h",
    id: 2,
    contact: {
      name: "陳美玲",
      phone: "",
      mobile: "0923-456-789",
      relationship: "娘家",
      otherRelationship: "",
    },
    blessing: {
      address: "新北市板橋區文化路二段100號",
      persons: [
        {
          id: 1,
          name: "陳美玲",
          zodiac: "兔",
          notes: "",
          isHouseholdHead: true,
        },
        {
          id: 2,
          name: "陳志豪",
          zodiac: "虎",
          notes: "弟弟",
          isHouseholdHead: false,
        },
      ],
    },
    salvation: {
      address: "新北市板橋區文化路二段100號",
      ancestors: [
        {
          id: 1,
          surname: "陳氏",
          notes: "",
        },
      ],
      survivors: [
        {
          id: 1,
          name: "陳美玲",
          zodiac: "兔",
          notes: "",
        },
        {
          id: 2,
          name: "陳志豪",
          zodiac: "虎",
          notes: "",
        },
      ],
    },
  },
];

// 響應式資料
const registrations = ref(mockData);
const selectedRegistration = ref(null);
const searchKeyword = ref("");
const showOnlySubmitted = ref(true);

// 選擇的項目
const selectedAncestors = ref([]);
const selectedBlessing = ref([]);
const selectedSurvivors = ref([]);
const selectedFixedBlessing = ref([]);

// 全選控制
const selectAllAncestors = ref(false);
const selectAllBlessing = ref(false);
const selectAllSurvivors = ref(false);
const selectAllFixedBlessing = ref(false);

// 金額計算
const ancestorsTotal = computed(() => selectedAncestors.value.length * 1000);
const blessingTotal = computed(() => selectedBlessing.value.length * 600);
const survivorsTotal = computed(() => selectedSurvivors.value.length * 300);
const fixedBlessingTotal = computed(
  () => selectedFixedBlessing.value.length * 100,
);
const totalAmount = computed(
  () =>
    ancestorsTotal.value +
    blessingTotal.value +
    survivorsTotal.value +
    fixedBlessingTotal.value,
);

// 搜尋過濾
const filteredRegistrations = computed(() => {
  let filtered = registrations.value;

  // 僅顯示已提交
  if (showOnlySubmitted.value) {
    filtered = filtered.filter((reg) => reg.state === "submitted");
  }

  // 關鍵字搜尋
  if (searchKeyword.value.trim()) {
    const query = searchKeyword.value.toLowerCase();
    filtered = filtered.filter(
      (reg) =>
        reg.contact.name.toLowerCase().includes(query) ||
        reg.contact.mobile?.toLowerCase().includes(query) ||
        reg.contact.phone?.toLowerCase().includes(query) ||
        reg.formName.toLowerCase().includes(query) ||
        reg.formSource?.toLowerCase().includes(query),
    );
  }

  return filtered;
});

// 選擇登記表
const selectRegistration = (reg) => {
  selectedRegistration.value = reg;
  // 清空之前的選擇
  clearSelection();
};

// 全選切換函數
const toggleAllAncestors = () => {
  if (selectAllAncestors.value) {
    selectedAncestors.value = [
      ...(selectedRegistration.value?.salvation?.ancestors || []),
    ];
  } else {
    selectedAncestors.value = [];
  }
};

const toggleAllBlessing = () => {
  if (selectAllBlessing.value) {
    selectedBlessing.value = [
      ...(selectedRegistration.value?.blessing?.persons || []),
    ];
  } else {
    selectedBlessing.value = [];
  }
};

const toggleAllSurvivors = () => {
  if (selectAllSurvivors.value) {
    selectedSurvivors.value = [
      ...(selectedRegistration.value?.salvation?.survivors || []),
    ];
  } else {
    selectedSurvivors.value = [];
  }
};

const toggleAllFixedBlessing = () => {
  if (selectAllFixedBlessing.value) {
    selectedFixedBlessing.value = [
      ...(selectedRegistration.value?.blessing?.persons || []),
    ];
  } else {
    selectedFixedBlessing.value = [];
  }
};

// 清除所有選擇
const clearSelection = () => {
  selectedAncestors.value = [];
  selectedBlessing.value = [];
  selectedSurvivors.value = [];
  selectedFixedBlessing.value = [];
  selectAllAncestors.value = false;
  selectAllBlessing.value = false;
  selectAllSurvivors.value = false;
  selectAllFixedBlessing.value = false;
};

// 搜尋功能
const performSearch = () => {
  // 搜尋邏輯已在 computed 中實現
  console.log("搜尋:", searchKeyword.value);
};

// 保存參加記錄
const saveParticipationRecord = () => {
  const record = {
    registrationId: selectedRegistration.value.id,
    formName: selectedRegistration.value.formName,
    contactName: selectedRegistration.value.contact.name,
    timestamp: new Date().toISOString(),
    selections: {
      ancestors: selectedAncestors.value,
      blessing: selectedBlessing.value,
      survivors: selectedSurvivors.value,
      fixedBlessing: selectedFixedBlessing.value,
    },
    totals: {
      ancestors: selectedAncestors.value.length,
      blessing: selectedBlessing.value.length,
      survivors: selectedSurvivors.value.length,
      fixedBlessing: selectedFixedBlessing.value.length,
    },
    amount: totalAmount.value,
  };

  // 這裡可以替換為實際的 API 呼叫或 store 儲存
  console.log("保存參加記錄:", record);
  alert(`參加記錄已儲存！\n總金額：NT$ ${totalAmount.value}`);

  // 儲存後可選擇清空或保持狀態
  // clearSelection()
};

// 格式化日期
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("zh-TW");
};

// 初始化時載入資料
onMounted(() => {
  // 這裡可以替換為從 store 載入資料
  console.log("頁面載入完成");
});
</script>

<style scoped>
.activity-registration-page {
  padding: 20px;
  font-family: "Segoe UI", "Microsoft JhengHei", sans-serif;
  background-color: #f8f9fa;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 30px;
  text-align: center;
}

.page-header h1 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.page-header p {
  color: #7f8c8d;
}

.layout-container {
  display: flex;
  gap: 30px;
  max-width: 1600px;
  margin: 0 auto;
}

.left-section {
  flex: 7;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.right-section {
  flex: 3;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.selection-section,
.search-section,
.results-section,
.summary-section {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid #eaeaea;
}

.selection-section h2,
.search-section h2,
.results-section h3,
.summary-section h3 {
  color: #34495e;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #3498db;
}

.selected-info {
  background: #e8f4fc;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  border-left: 4px solid #3498db;
}

.no-selection {
  background: #f8f9fa;
  padding: 20px;
  text-align: center;
  border-radius: 8px;
  color: #7f8c8d;
  border: 2px dashed #ddd;
}

.option-group {
  margin-bottom: 25px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.option-header {
  display: flex;
  align-items: center;
  padding: 15px;
  background: #f8f9fa;
  cursor: pointer;
  border-bottom: 1px solid #e0e0e0;
}

.option-header input[type="checkbox"] {
  margin-right: 12px;
  transform: scale(1.2);
}

.option-title {
  font-weight: 600;
  color: #2c3e50;
  flex-grow: 1;
}

.price-tag {
  background: #27ae60;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.9em;
  font-weight: 500;
}

.option-items {
  padding: 15px;
  background: white;
}

.option-item {
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.option-item:last-child {
  border-bottom: none;
}

.option-item label {
  display: flex;
  align-items: center;
  cursor: pointer;
  width: 100%;
}

.option-item input[type="checkbox"] {
  margin-right: 10px;
}

.item-name {
  font-weight: 500;
  margin-right: 8px;
}

.item-zodiac {
  color: #7f8c8d;
  margin-right: 8px;
}

.item-notes {
  color: #e74c3c;
  font-style: italic;
}

.no-items {
  color: #95a5a6;
  font-style: italic;
  text-align: center;
  padding: 10px;
}

.summary-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.summary-section h3 {
  color: white;
  border-bottom: 2px solid rgba(255, 255, 255, 0.3);
}

.summary-details {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 15px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.summary-row:last-child {
  border-bottom: none;
}

.amount {
  font-weight: 600;
}

.summary-divider {
  height: 2px;
  background: rgba(255, 255, 255, 0.3);
  margin: 15px 0;
}

.summary-total {
  display: flex;
  justify-content: space-between;
  font-size: 1.3em;
  font-weight: 700;
  padding-top: 10px;
}

.total-amount {
  color: #f1c40f;
}

.action-section {
  display: flex;
  gap: 15px;
}

.save-btn,
.clear-btn {
  flex: 1;
  padding: 16px;
  border: none;
  border-radius: 8px;
  font-size: 1.1em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.save-btn {
  background: #3498db;
  color: white;
}

.save-btn:hover:not(:disabled) {
  background: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
}

.save-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.clear-btn {
  background: #e74c3c;
  color: white;
}

.clear-btn:hover {
  background: #c0392b;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
}

/* 右側樣式 */
.search-box {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.search-input {
  flex: 1;
  padding: 12px 15px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 1em;
  transition: border-color 0.3s;
}

.search-input:focus {
  outline: none;
  border-color: #3498db;
}

.search-btn {
  padding: 12px 20px;
  background: #2ecc71;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.3s;
}

.search-btn:hover {
  background: #27ae60;
}

.search-options {
  margin-bottom: 20px;
}

.search-options label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #555;
  cursor: pointer;
}

.registrations-list {
  max-height: 600px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.registration-card {
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  padding: 18px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.registration-card:hover {
  border-color: #3498db;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.2);
}

.registration-card.selected {
  border-color: #3498db;
  background: #e8f4fc;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.form-name {
  font-weight: 700;
  color: #2c3e50;
}

.form-source {
  background: #f1c40f;
  color: #2c3e50;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.9em;
}

.card-body p {
  margin: 5px 0;
  color: #555;
}

.data-summary {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #eee;
}

.data-summary span {
  background: #ecf0f1;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.9em;
}

.card-footer {
  margin-top: 10px;
  color: #95a5a6;
  font-size: 0.85em;
}

/* 響應式設計 */
@media (max-width: 1200px) {
  .layout-container {
    flex-direction: column;
  }

  .left-section,
  .right-section {
    width: 100%;
  }
}
</style>
