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
        <div class="form-section" v-if="joinRecordStore.selectedRegistration">
          <h6>
            已選擇登記表：{{ joinRecordStore.selectedRegistration.formName }}
          </h6>
          <div class="selected-info">
            <span
              ><strong>聯絡人：</strong
              >{{ joinRecordStore.selectedRegistration.contact.name }}</span
            >
            <span
              ><strong style="display: none;" >手機/電話：</strong
              >{{ joinRecordStore.selectedRegistration.contact.mobile || joinRecordStore.selectedRegistration.contact.phone }}</span
            >
            <span
              ><strong>關係：</strong
              >{{
                joinRecordStore.selectedRegistration.contact.relationship
              }}</span
            >
            <span
              ><strong>祖先：</strong
              >{{
                joinRecordStore.selectedRegistration.salvation.ancestors.length
              }}</span
            >
            <span
              ><strong>陽上人：</strong
              >{{
                joinRecordStore.selectedRegistration.salvation.survivors.length
              }}</span
            >
            <span
              ><strong>消災祈福：</strong
              >{{
                joinRecordStore.selectedRegistration.blessing.persons.length
              }}</span
            >
          </div>
        </div>

        <div class="form-section" v-if="!joinRecordStore.selectedRegistration">
          <p class="no-selection">請從右側選擇祈福登記表</p>
        </div>

        <!-- 活動項目選擇區 - 全部可見 -->
        <div class="form-section" v-if="joinRecordStore.selectedRegistration">
          <h3>活動參加項目選擇</h3>

          <div class="activities-grid">
            <!-- 超度/超薦 -->
            <div
              class="activity-section"
              v-if="
                joinRecordStore.selectedRegistration.salvation.ancestors
                  .length > 0
              "
            >
              <div
                class="activity-header clickable"
                @click="toggleActivity('chaodu')"
                :title="isAllSelected('chaodu') ? '點擊取消全選' : '點擊全選'"
              >
                <input
                  style="display: none"
                  type="checkbox"
                  :checked="isAllSelected('chaodu')"
                  :indeterminate.prop="isIndeterminate('chaodu')"
                  @click.stop="toggleActivity('chaodu')"
                />
                <span class="activity-title">{{
                  joinRecordStore.activityConfigs.chaodu.label
                }}</span>
                <span
                  class="selected-count"
                  v-if="joinRecordStore.selections.chaodu.length > 0"
                >
                  (已選 {{ joinRecordStore.selections.chaodu.length }} 位)
                </span>
                <span class="price-tag"
                  >每位 ${{
                    joinRecordStore.activityConfigs.chaodu.price
                  }}</span
                >
              </div>
              {{ joinRecordStore.selectedRegistration.salvation.address }}
              <div class="person-list">
                <div
                  v-for="ancestor in getSourceData('chaodu')"
                  :key="'ancestor-' + ancestor.id"
                  class="person-item"
                >
                  <label class="checkbox-label">
                    <input
                      type="checkbox"
                      :value="ancestor"
                      v-model="joinRecordStore.selections.chaodu"
                    />
                    <span>{{ ancestor.surname }}</span>

                    氏歷代祖先
                    <span v-if="ancestor.notes"
                      >備註
                      <el-tag class="person-tag" type="info">{{
                        ancestor.notes
                      }}</el-tag></span
                    >
                  </label>
                </div>
              </div>
              <!-- 陽上人 -->
              <div class="person-list">
                <div
                  v-for="person in getSourceData('survivors')"
                  :key="'survivors-' + person.id"
                  class="person-item"
                >
                  <label class="checkbox-label">
                    <input
                      type="checkbox"
                      :value="person"
                      v-model="joinRecordStore.selections.survivors"
                    />
                    <span>陽上人 {{ person.name }}</span>
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

            <!-- 消災祈福 -->
            <div
              class="activity-section"
              v-if="
                joinRecordStore.selectedRegistration.salvation.ancestors
                  .length > 0
              "
            >
              <div
                class="activity-header clickable"
                @click="toggleActivity('qifu')"
                :title="isAllSelected('qifu') ? '點擊取消全選' : '點擊全選'"
              >
                <input
                  style="display: none"
                  type="checkbox"
                  :checked="isAllSelected('qifu')"
                  :indeterminate.prop="isIndeterminate('qifu')"
                  @click.stop="toggleActivity('qifu')"
                />
                <span class="activity-title">{{
                  joinRecordStore.activityConfigs.qifu.label
                }}</span>
                <span
                  class="selected-count"
                  v-if="joinRecordStore.selections.qifu.length > 0"
                >
                  (已選 {{ joinRecordStore.selections.qifu.length }} 位)
                </span>
                <span class="price-tag"
                  >每位 ${{ joinRecordStore.activityConfigs.qifu.price }}</span
                >
              </div>
              <div class="address">{{ joinRecordStore.selectedRegistration.blessing.address }}</div>
              <div class="person-list">
                <div
                  v-for="survivor in getSourceData('qifu')"
                  :key="'survivor-' + survivor.id"
                  class="person-item"
                >
                  <label class="checkbox-label">
                    <input
                      type="checkbox"
                      :value="survivor"
                      v-model="joinRecordStore.selections.qifu"
                    />
                    <span>{{ survivor.name }}</span>
                    <span class="zodiac">({{ survivor.zodiac }})</span>
                    <span v-if="survivor.notes" class="notes">{{
                      survivor.notes
                    }}</span>
                    <span v-if="survivor.isHouseholdHead" class="household-head"
                      >戶長</span
                    >
                  </label>
                </div>
              </div>
            </div>

            <!-- 點燈 -->
            <div class="activity-section">
              <div
                class="activity-header clickable"
                @click="toggleActivity('diandeng')"
                :title="isAllSelected('diandeng') ? '點擊取消全選' : '點擊全選'"
              >
                <input
                  style="display: none"
                  type="checkbox"
                  :checked="isAllSelected('diandeng')"
                  :indeterminate.prop="isIndeterminate('diandeng')"
                  @click.stop="toggleActivity('diandeng')"
                />
                <span class="activity-title">{{
                  joinRecordStore.activityConfigs.diandeng.label
                }}</span>
                <span
                  class="selected-count"
                  v-if="joinRecordStore.selections.diandeng.length > 0"
                >
                  (已選 {{ joinRecordStore.selections.diandeng.length }} 位)
                </span>

                <span class="price-tag"
                  >每位 ${{
                    joinRecordStore.activityConfigs.diandeng.price
                  }}</span
                >
              </div>

              <div class="person-list">
                <div
                  v-for="person in getSourceData('diandeng')"
                  :key="'blessing-' + person.id"
                  class="person-item"
                >
                  <label class="checkbox-label">
                    <input
                      type="checkbox"
                      :value="person"
                      v-model="joinRecordStore.selections.diandeng"
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

            <!-- 固定消災 -->
            <div class="activity-section">
              <div
                class="activity-header clickable"
                @click="toggleActivity('xiaozai')"
                :title="isAllSelected('xiaozai') ? '點擊取消全選' : '點擊全選'"
              >
                <input
                  style="display: none"
                  type="checkbox"
                  :checked="isAllSelected('xiaozai')"
                  :indeterminate.prop="isIndeterminate('xiaozai')"
                  @click.stop="toggleActivity('xiaozai')"
                />
                <span class="activity-title">{{
                  joinRecordStore.activityConfigs.xiaozai.label
                }}</span>
                <span
                  class="selected-count"
                  v-if="joinRecordStore.selections.xiaozai.length > 0"
                >
                  (已選 {{ joinRecordStore.selections.xiaozai.length }} 位)
                </span>

                <span class="price-tag"
                  >每位 ${{
                    joinRecordStore.activityConfigs.xiaozai.price
                  }}</span
                >
              </div>
              <div class="address">{{ joinRecordStore.selectedRegistration.blessing.address }}</div>
              <div class="person-list">
                <div
                  v-for="person in getSourceData('xiaozai')"
                  :key="'fixed-' + person.id"
                  class="person-item"
                >
                  <label class="checkbox-label">
                    <input
                      type="checkbox"
                      :value="person"
                      v-model="joinRecordStore.selections.xiaozai"
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

            <!-- 中元普度 -->
            <div class="activity-section" style="display: none;">
              <div
                class="activity-header clickable"
                @click="toggleActivity('pudu')"
                :title="isAllSelected('pudu') ? '點擊取消全選' : '點擊全選'"
              >
                <input
                  style="display: none"
                  type="checkbox"
                  :checked="isAllSelected('pudu')"
                  :indeterminate.prop="isIndeterminate('pudu')"
                  @click.stop="toggleActivity('pudu')"
                />
                <span class="activity-title">{{
                  joinRecordStore.activityConfigs.pudu.label
                }}</span>
                <span
                  class="selected-count"
                  v-if="joinRecordStore.selections.pudu.length > 0"
                >
                  (已選 {{ joinRecordStore.selections.pudu.length }} 位)
                </span>

                <span class="price-tag"
                  >每位 ${{ joinRecordStore.activityConfigs.pudu.price }}</span
                >
              </div>

              <div class="person-list">
                <div
                  v-for="person in getSourceData('pudu')"
                  :key="'fixed-' + person.id"
                  class="person-item"
                >
                  <label class="checkbox-label">
                    <input
                      type="checkbox"
                      :value="person"
                      v-model="joinRecordStore.selections.pudu"
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

            <!-- 其他 -->
          </div>
        </div>

        <!-- 操作按鈕 -->
        <div class="form-actions" v-if="joinRecordStore.selectedRegistration">
          <button type="button" class="btn btn-secondary" @click="handleReset">
            重置選擇
          </button>
          <button
            type="button"
            class="btn btn-primary"
            @click="handleSaveParticipationRecord"
            :disabled="
              joinRecordStore.isLoading || joinRecordStore.totalAmount === 0
            "
          >
            {{ joinRecordStore.isLoading ? "保存中..." : "保存參加記錄" }}
          </button>
        </div>
      </div>

      <!-- 右側區域 30% -->
      <div class="right-panel">
        <!-- 查詢區 -->
        <div class="search-section">
          <h3>查詢祈福登記資料</h3>
          <div class="search-input-group">
            <input
              type="text"
              v-model="searchKeyword"
              placeholder="搜尋姓名、手機、電話、地址"
            />
          </div>
        </div>

        <!-- 登記表列表 -->
        <div class="results-section">
          <div class="results-header">
            <h3>登記表列表</h3>
            <p class="search-hint">
              共 {{ filteredRegistrations.length }} 筆登記表
            </p>
          </div>
          <div class="registration-list">
            <div
              v-for="reg in filteredRegistrations"
              :key="reg.id"
              class="registration-item"
              :class="{
                active:
                  joinRecordStore.selectedRegistration &&
                  joinRecordStore.selectedRegistration.id === reg.id,
              }"
              @click="handleSelectRegistration(reg)"
            >
              <span class="reg-contact">{{ reg.contact.name }}</span>
              <span class="reg-phone">{{ reg.contact.mobile || reg.contact.phone }}</span>
              <div class="data-summary" style="display: none">
                <span
                  >祖先：{{ reg.salvation?.ancestors?.length || 0 }} 位</span
                >
                <span>消災：{{ reg.blessing?.persons?.length || 0 }} 位</span>
                <span
                  >陽上：{{ reg.salvation?.survivors?.length || 0 }} 位</span
                >
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
                <span class="record-name">{{ record.contactName }}</span>
                <span class="record-amount">${{ record.totalAmount }}</span>
              </div>
              <div class="record-time">{{ formatDate(record.savedAt) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 金額統計 - 現在可以使用多種 CSS class 來控制位置 -->
    <div
      class="total-float"
      data-position="bottom-right"
      v-if="
        joinRecordStore.selectedRegistration && joinRecordStore.totalAmount > 0
      "
    >
      <div class="total-header">
        <h3>金額統計</h3>
      </div>
      <div class="total-breakdown">
        <div
          class="total-item"
          v-for="(config, key) in joinRecordStore.activityConfigs"
          :key="key"
          v-show="joinRecordStore.selections[key].length > 0"
        >
          <span>{{ config.label }}：</span>
          <span
            >{{ joinRecordStore.selections[key].length }} 位 × ${{
              config.price
            }}
            = ${{ joinRecordStore.selections[key].length * config.price }}</span
          >
        </div>
        <div class="total-final">
          <span>總金額：</span>
          <span class="amount">${{ joinRecordStore.totalAmount }}</span>
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
//import mockData from "../data/mock_registrations.json";

const joinRecordStore = useJoinRecordStore();

// 狀態管理
const searchKeyword = ref("");
const showSuccess = ref(false);
const successMessage = ref("");
const savedRecords = ref([]);

// 模擬資料
const mockRegistrations = ref([]);

// 載入模擬資料
const loadMockData = () => {
  try {
    const mockData = joinRecordStore.mockRegistrations;
    if (mockData) {
      mockRegistrations.value = mockData;
    }
  } catch (error) {
    console.error("載入模擬資料失敗:", error);
  }
};

// 計算篩選後的登記表
const filteredRegistrations = computed(() => {
  if (!searchKeyword.value) {
    return mockRegistrations.value;
  }

  const keyword = searchKeyword.value.toLowerCase();
  return mockRegistrations.value.filter((reg) => {
    return (
      reg.formSource.toLowerCase().includes(keyword) ||
      reg.formName.toLowerCase().includes(keyword) ||
      reg.contact.name.toLowerCase().includes(keyword) ||
      reg.contact.mobile.includes(keyword) ||
      (reg.contact.phone && reg.contact.phone.includes(keyword)) ||
      reg.contact.relationship.toLowerCase().includes(keyword) ||
      // 消災地址
      reg.blessing.address.toLowerCase().includes(keyword) ||
      reg.blessing.persons.some(
        (person) =>
          person.name.toLowerCase().includes(keyword) ||
          person.zodiac.toLowerCase().includes(keyword) ||
          person.notes.toLowerCase().includes(keyword),
      ) ||
      // 超度地址
      reg.salvation.address.toLowerCase().includes(keyword) ||
      reg.salvation.survivors.some(
        (survivor) =>
          survivor.name.toLowerCase().includes(keyword) ||
          survivor.zodiac.toLowerCase().includes(keyword) ||
          survivor.notes.toLowerCase().includes(keyword),
      )
    );
  });
});

// 獲取資料來源
const getSourceData = (activityKey) => {
  if (!joinRecordStore.selectedRegistration) return [];

  const sourcePath = joinRecordStore.activityConfigs[activityKey].source;
  const [mainKey, subKey] = sourcePath.split(".");

  return joinRecordStore.selectedRegistration[mainKey]?.[subKey] || [];
};

// 檢查是否全選
const isAllSelected = (activityKey) => {
  const sourceData = getSourceData(activityKey);
  if (sourceData.length === 0) return false;
  return joinRecordStore.selections[activityKey].length === sourceData.length;
};

// 檢查是否部分選中
const isIndeterminate = (activityKey) => {
  const count = joinRecordStore.selections[activityKey].length;
  const total = getSourceData(activityKey).length;
  return count > 0 && count < total;
};

// 切換活動全選
const toggleActivity = (activityKey) => {
  const sourceData = getSourceData(activityKey);
  joinRecordStore.toggleGroup(activityKey, sourceData);
};

// 選擇登記表
const handleSelectRegistration = (reg) => {
  joinRecordStore.selectRegistration(reg);
};

// 重置選擇
const handleReset = () => {
  if (confirm("確定要重置所有選擇嗎？")) {
    joinRecordStore.resetSelections();
  }
};

// 保存記錄
const handleSaveParticipationRecord = async () => {
  if (!joinRecordStore.selectedRegistration) {
    alert("請選擇祈福登記表");
    return;
  }

  if (joinRecordStore.totalAmount === 0) {
    alert("請至少選擇一個活動項目");
    return;
  }

  const success = await joinRecordStore.submitRecord();

  if (success) {
    // 建立簡化記錄用於顯示
    const record = {
      contactName: joinRecordStore.selectedRegistration.contact.name,
      totalAmount: joinRecordStore.totalAmount,
      savedAt: new Date().toISOString(),
    };

    savedRecords.value.unshift(record);

    // 顯示成功訊息
    successMessage.value = "參加記錄已保存！";
    showSuccess.value = true;
    setTimeout(() => {
      showSuccess.value = false;
    }, 3000);

    // 重置選擇
    joinRecordStore.resetSelections();
  } else {
    alert("保存失敗，請稍後再試");
  }
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
onMounted(() => {
  console.log("活動參加記錄頁面已載入");
  console.log("Store 狀態:", joinRecordStore);
  loadMockData();
});
</script>

<style scoped>

.form-section, .search-section, .results-section {
  margin-bottom: 5px;
}

.search-section, .results-section {
  margin-bottom: 11px;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0 0.5rem;
  min-width: 100%;
}

.results-header h3 {
  margin: 0;
  color: #333;
}

.activity-record-container {
  display: flex;
  gap: 1.2rem;
  min-height: calc(100vh - 200px);
  padding-bottom: 200px; /* 為浮動金額統計留空間 */
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

/* 活動項目容器 - 使用 Grid 佈局 */
.activities-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr); /* 桌面版 2 列 */
  gap: 1rem;
}

/* 活動區塊 */
.activity-section {
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 0rem;
  background: #fafafa;
}

.activity-header {
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e9ecef;
  transition: background-color 0.2s;

  display: flex;
  align-items: center;
  justify-content: space-between;
}

.activity-header.clickable {
  cursor: pointer;
  padding: 0.5rem;
  margin: -0.5rem -0.5rem 0.75rem -0.5rem;
  border-radius: 4px;

  display: flex;
  align-items: center;
  justify-content: space-between;
}

.activity-header.clickable:hover {
  background: rgba(139, 69, 19, 0.05);
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

.price-tag {
  background: #e8f5e9;
  color: #2e7d32;
  padding: 4px 12px;
  border-radius: 100px;
  font-weight: bold;
  margin-left: auto; /* 推到右側 */
}

.selected-count {
  color: var(--success-color);
  font-weight: 600;
  font-size: 0.9rem;
  margin-left: 0.5rem;
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

/* 浮動金額統計 - 基礎樣式 */
.total-float {
  position: fixed;
  max-width: 300px;
  max-height: 400px;
  overflow-y: auto;
  background: white;
  border: 2px solid var(--primary-color);
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  bottom: 20px;
}

/* 方法一：使用不同的 CSS class */

/* 左下方位置 */
.total-position-bottom-left {
  left: 20px;
  right: auto;
}

/* 中間正下方位置 */
.total-position-bottom-center {
  left: 50%;
  transform: translateX(-50%);
  right: auto;
}

/* 右下方位置 */
.total-position-bottom-right {
  right: 20px;
  left: auto;
}

/* 方法二：使用 data-attribute (更推薦) */

/* 使用 data-position 屬性來控制位置 */
.total-float[data-position="bottom-left"] {
  left: 20px;
  right: auto;
}

.total-float[data-position="bottom-center"] {
  left: 50%;
  transform: translateX(-50%);
  right: auto;
}

.total-float[data-position="bottom-right"] {
  right: 20px;
  left: auto;
}

/* 方法三：使用 CSS 變數 (最彈性) */

/* 在一個全域的 CSS 檔案中，您可以這樣設定：*/
:root {
  --total-float-position: bottom-right; /* 預設左下 */
}

.total-float {
  position: fixed;
  width: 350px;
  max-height: 400px;
  overflow-y: auto;
  background: white;
  border: 2px solid var(--primary-color);
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  bottom: 20px;
}

/* 位置控制：  */
.total-float.bottom-left {
  left: 20px;
  right: auto;
}

.total-float.bottom-center {
  left: 50%;
  transform: translateX(-50%);
  right: auto;
}

.total-float.bottom-right {
  right: 20px;
  left: auto;
}

.total-header {
  background: linear-gradient(
    135deg,
    var(--primary-color),
    var(--secondary-color)
  );
  color: white;
  padding: 0.75rem 1rem;
  border-radius: 8px 8px 0 0;
  position: sticky;
  top: 0;
  z-index: 1;
}

.total-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: white;
  border: none;
  padding: 0;
}

.total-breakdown {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
}

.total-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 4px;
  font-size: 0.9rem;
}

.total-final {
  display: flex;
  justify-content: space-between;
  padding: 1rem;
  background: var(--primary-color);
  color: white;
  border-radius: 6px;
  font-size: 1.1rem;
  font-weight: bold;
  margin-top: 0.5rem;
}

.amount {
  font-size: 1.3rem;
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

.data-summary {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #eee;
}

.data-summary span {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.9em;
}

.reg-name {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.reg-contact {
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
  margin-right: 0.5rem;
}

.reg-phone {
  font-size: 0.85rem;
  color: #666;
  margin-right: 0.5rem;
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
  .results-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .results-header .el-button {
    width: 100%;
  }

  .activity-record-container {
    flex-direction: column;
    padding-bottom: 220px;
  }

  .left-panel,
  .right-panel {
    flex: 1 1 100%;
  }

  .total-float {
    width: calc(100% - 40px);
  }

  /* 響應式時都置中顯示比較好 */
  .total-float,
  .total-position-bottom-left,
  .total-position-bottom-center,
  .total-position-bottom-right {
    left: 50%;
    transform: translateX(-50%);
    right: auto;
  }
}

@media (max-width: 768px) {
  /* 手機模式 - 改為單列 */
  .activities-grid {
    grid-template-columns: 1fr; /* 手機版 1 列 */
  }

  .activity-section {
    margin-bottom: 1rem; /* 手機版 1 列 */
  }

  .selected-info {
    flex-direction: column;
    gap: 0.5rem;
  }

  .activity-title {
    font-size: 1rem;
  }

  .total-float {
    width: calc(100% - 20px);
    bottom: 10px;
  }

  .total-float,
  .total-position-bottom-left,
  .total-position-bottom-center,
  .total-position-bottom-right {
    left: 50%;
    transform: translateX(-50%);
    right: auto;
  }

  .total-final {
    font-size: 1rem;
  }

  .amount {
    font-size: 1.2rem;
  }
}
</style>
