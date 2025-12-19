<!-- src/components/MonthlyDonateList.vue -->
<template>
  <div class="main-content">
    <div class="page-header">
      <h2>每月贊助</h2>
    </div>

    <!-- 查詢區 -->
    <div class="search-section">
      <div class="search-form">
        <div class="form-group">
          <div class="search-input-group">
            <el-input
              v-model="searchQuery"
              placeholder="搜尋贊助人姓名"
              @keyup.enter="handleSearch"
              :disabled="loading"
              clearable
              size="large"
            >
              <template #prepend>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>

            <el-button
              type="primary"
              @click="handleSearch"
              :loading="loading"
              size="large"
            >
              {{ loading ? "查詢中..." : "查詢" }}
            </el-button>

            <el-button @click="handleClear" :disabled="loading" size="large">
              清空
            </el-button>

            <el-button
              type="success"
              @click="showAddDonatorModal = true"
              :disabled="loading"
              size="large"
              :icon="Plus"
            >
              新增贊助人
            </el-button>
          </div>
          <p class="search-hint">💡 提示：可搜尋贊助人姓名或備註。</p>
        </div>
      </div>
    </div>

    <!-- 調試信息 -->
    <div v-if="isDev" class="debug-panel">
      <h4>🔧 調試信息</h4>
      <hr />
      <div>總贊助記錄數: {{ allDonates.length }}</div>
      <div>合併後贊助人數: {{ donateSummary.length }}</div>
      <div>過濾後人數: {{ filteredDonates.length }}</div>
      <div>當前頁碼: {{ currentPage }}</div>
      <div>每頁數量: {{ pageSize }}</div>
      <div>每月單位金額: {{ monthlyUnitPrice }}</div>
    </div>

    <!-- 統計卡片 -->
    <div class="stats-cards" style="display: none">
      <el-card class="stat-card">
        <template #header>
          <div class="stat-header">
            <span class="stat-icon">👤</span>
            <span class="stat-title">贊助人數</span>
          </div>
        </template>
        <div class="stat-content">
          <h3>{{ stats.totalDonators }}</h3>
        </div>
      </el-card>

      <el-card class="stat-card">
        <template #header>
          <div class="stat-header">
            <span class="stat-icon">💰</span>
            <span class="stat-title">總贊助金額</span>
          </div>
        </template>
        <div class="stat-content">
          <h3>{{ stats.totalAmount.toLocaleString() }}</h3>
        </div>
      </el-card>

      <el-card class="stat-card">
        <template #header>
          <div class="stat-header">
            <span class="stat-icon">📅</span>
            <span class="stat-title">總贊助月份</span>
          </div>
        </template>
        <div class="stat-content">
          <h3>{{ stats.totalMonths }}</h3>
        </div>
      </el-card>

      <el-card class="stat-card" style="display: none">
        <template #header>
          <div class="stat-header">
            <span class="stat-icon">📊</span>
            <span class="stat-title">人均贊助</span>
          </div>
        </template>
        <div class="stat-content">
          <h3>{{ stats.averagePerDonator.toLocaleString() }}</h3>
        </div>
      </el-card>
    </div>

    <!-- 查詢列表 -->
    <div class="results-section">
      <div v-if="loading" class="loading-state">
        <el-result icon="info" title="載入中">
          <template #extra>
            <el-button type="primary" :loading="true">載入中</el-button>
          </template>
        </el-result>
      </div>

      <div v-else-if="error" class="error-state">
        <el-result icon="error" title="載入失敗">
          <template #description>
            <p>{{ error }}</p>
          </template>
          <template #extra>
            <el-button type="primary" @click="initialize">重試</el-button>
          </template>
        </el-result>
      </div>

      <div v-else-if="filteredDonates.length === 0" class="no-results">
        <el-empty description="沒有找到贊助記錄">
          <el-button type="primary" @click="showAddDonatorModal = true">
            新增贊助人
          </el-button>
        </el-empty>
      </div>

      <div v-else>
        <div class="results-header">
          <h3>贊助人列表 (共 {{ filteredDonates.length }} 人)</h3>
        </div>

        <!-- 贊助人列表 -->
        <div class="table-container">
          <el-table
            :data="paginatedDonates"
            style="width: 100%"
            :default-sort="{ prop: 'name', order: 'ascending' }"
            stripe
            border
            :header-cell-style="{ background: '#f8f9fa', color: '#333' }"
            v-loading="loading"
          >
            <el-table-column label="圖標" width="60" align="center">
              <template #default="{ row }">
                <el-tooltip :content="row.donateId" placement="top">
                  <div class="donate-icon">
                    {{ row.icon }}
                  </div>
                </el-tooltip>
              </template>
            </el-table-column>

            <el-table-column prop="name" label="贊助人" width="90">
              <template #default="{ row }">
                <div class="donator-name">
                  <strong>{{ row.name }}</strong>
                  <div class="donator-id" v-if="row.registrationId > 0">
                    編號: {{ row.registrationId }}
                  </div>
                </div>
              </template>
            </el-table-column>

            <!-- 動態生成24個月份的欄位 -->
            <el-table-column
              v-for="month in monthColumns"
              :key="month.yearMonth"
              :label="month.display"
              width="50"
              align="center"
            >
              <template #default="{ row }">
                <div
                  class="month-cell"
                  :class="{
                    'has-donate': row.months[month.yearMonth]?.length > 0,
                  }"
                >
                  <template v-if="row.months[month.yearMonth]?.length > 0">
                    <el-tooltip
                      :content="getMonthTooltip(row.months[month.yearMonth])"
                      placement="top"
                    >
                      <span class="donate-indicator">💰</span>
                    </el-tooltip>
                  </template>
                  <template v-else>
                    <span class="no-donate">-</span>
                  </template>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="統計" width="55" align="center">
              <template #default="{ row }">
                <div class="donate-stats">
                  <div class="stat-item">
                    <span class="stat-label" style="display: none">金額:</span>
                    <span class="stat-value">{{ row.totalAmount }}</span>
                  </div>
                  <div class="stat-item" style="display: none">
                    <span class="stat-label">月份:</span>
                    <span class="stat-value">{{ row.totalMonths }}</span>
                  </div>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="操作" fixed="right" align="center">
              <template #default="{ row }">
                <div class="action-buttons">
                  <el-tooltip content="查看詳細" placement="top">
                    <el-button
                      circle
                      @click="handleViewDonatorDetail(row)"
                      type="info"
                    >
                      <el-icon><View /></el-icon>
                    </el-button>
                  </el-tooltip>

                  <el-tooltip content="新增贊助" placement="top">
                    <el-button
                      circle
                      @click="handleAddDonateToDonator(row)"
                      type="primary"
                    >
                      <el-icon><Plus /></el-icon>
                    </el-button>
                  </el-tooltip>

                  <el-tooltip content="編輯" placement="top">
                    <el-button
                      style="display: none"
                      circle
                      @click="handleEditDonator(row)"
                      type="warning"
                    >
                      <el-icon><Edit /></el-icon>
                    </el-button>
                  </el-tooltip>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 分頁控件 -->
        <div class="pagination">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :total="filteredDonates.length"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
            background
          />
        </div>
      </div>
    </div>

    <!-- 新增贊助人 Dialog -->
    <el-dialog
      align-center
      v-model="showAddDonatorModal"
      :title="`新增贊助人 - 👤${newDonator.name}`"
      width="700px"
      :before-close="closeModal"
    >
      <el-form
        ref="addDonatorFormRef"
        :model="newDonator"
        :rules="donatorRules"
        label-width="120px"
      >
        <el-form-item label="贊助人姓名" prop="name">
          <el-input v-model="newDonator.name" placeholder="請輸入贊助人姓名" />
        </el-form-item>

        <el-form-item label="登記編號" style="display: none">
          <el-input-number
            v-model="newDonator.registrationId"
            :min="-1"
            placeholder="登記編號"
          />
          <span class="form-hint">（-1表示未登記）</span>
        </el-form-item>

        <el-form-item label="選擇月份" prop="selectedMonths" required>
          <div class="month-selection">
            <div class="month-list">
              <div
                v-for="month in monthColumns"
                :key="month.yearMonth"
                class="month-checkbox"
              >
                <el-checkbox
                  :label="month.display"
                  :value="month.yearMonth"
                  v-model="newDonator.selectedMonths"
                  @change="handleMonthSelectForNewDonator"
                >
                  {{ month.display }}
                </el-checkbox>
              </div>
            </div>

            <div class="month-selection-actions">
              <el-button @click="selectAllMonthsForNewDonator" size="small">
                全選可用月份
              </el-button>
              <el-button @click="clearAllMonthsForNewDonator" size="small">
                清空選擇
              </el-button>
              <el-tag
                v-if="newDonator.selectedMonths.length > 0"
                type="info"
                size="small"
                style="margin-left: 10px"
              >
                {{ newDonator.selectedMonths.length }} 個月×
                {{ monthlyUnitPrice }} 元
              </el-tag>
            </div>

            <div class="selection-info"></div>
          </div>
        </el-form-item>

        <el-form-item label="贊助金額" prop="amount">
          <div class="amount-display"></div>
          <div class="amount-value">
            {{ newDonator.amount.toLocaleString() }} 元
          </div>
          <div class="amount-breakdown"></div>
        </el-form-item>

        <el-form-item label="圖標" style="display: none">
          <IconSelector v-model="newDonator.icon" />
        </el-form-item>

        <el-form-item label="備註">
          <el-input
            v-model="newDonator.memo"
            type="textarea"
            :rows="3"
            placeholder="請輸入備註"
            style="width: 500px"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button
            v-if="isDev"
            type="success"
            class="dev-button"
            @click="handleLoadMockData"
          >
            🎲 載入 Mock 數據
          </el-button>
          <el-button @click="closeModal" :disabled="submitting">取消</el-button>
          <el-button
            type="primary"
            @click="handleAddDonator"
            :loading="submitting"
            :disabled="newDonator.selectedMonths.length === 0"
          >
            新增贊助人
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 新增贊助項目 Dialog -->
    <el-dialog
      align-center
      v-model="showAddDonateItemModal"
      :title="`新增贊助項目 - 👤${selectedDonator?.name}`"
      width="700px"
      :before-close="closeModal"
    >
      <el-form
        ref="addDonateItemFormRef"
        :model="newDonateItem"
        :rules="donateItemRules"
        label-width="100px"
      >
        <el-form-item label="選擇月份" prop="selectedMonths" required>
          <div class="month-selection">
            <div class="month-list">
              <!-- 將新增贊助項目 monthColumns 改為 donationMonthColumns -->
              <div
                v-for="month in donationMonthColumns"
                :key="month.yearMonth"
                class="month-checkbox"
                :class="{ 'disabled-month': isMonthOccupied(month.yearMonth) }"
              >
                <el-checkbox
                  :label="month.display"
                  :value="month.yearMonth"
                  v-model="newDonateItem.selectedMonths"
                  :disabled="isMonthOccupied(month.yearMonth)"
                  @change="handleMonthSelectionChange"
                >
                  <span
                    :class="{
                      'occupied-month': isMonthOccupied(month.yearMonth),
                    }"
                  >
                    {{ month.display }}
                    <!-- <span
                      v-if="isMonthOccupied(month.yearMonth)"
                      class="occupied-badge"
                      >己贊助</span
                    > -->
                  </span>
                </el-checkbox>
              </div>
            </div>

            <!-- 將新增贊助項目 monthColumns 改為 donationMonthColumns -->

            <div class="month-selection-actions">
              <el-button @click="selectAllAvailableMonths" size="small">
                全選可用月份
              </el-button>
              <el-button @click="clearAllMonthsForItem" size="small">
                清空選擇
              </el-button>
              <el-tag
                v-if="newDonateItem.selectedMonths.length > 0"
                type="info"
                size="small"
                style="margin-left: 10px"
              >
                {{ newDonateItem.selectedMonths.length }} 個月×
                {{ monthlyUnitPrice }} 元
              </el-tag>
            </div>
            <div class="month-selection-actions">
              <el-button
                @click="toggleExtendedMode"
                :type="isExtendedMode ? 'success' : 'primary'"
                size="small"
              >
                {{ isExtendedMode ? "取消擴展" : "擴展月份" }}
              </el-button>
            </div>

            <div class="selection-info"></div>
          </div>
        </el-form-item>

        <el-form-item label="贊助金額" prop="amount">
          <div class="amount-display"></div>
          <div class="amount-value">
            {{ newDonateItem.amount.toLocaleString() }} 元
          </div>
          <div class="amount-breakdown"></div>
        </el-form-item>

        <el-form-item label="備註">
          <el-input
            v-model="newDonateItem.memo"
            type="textarea"
            :rows="3"
            placeholder="請輸入備註"
            style="width: 500px"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeModal" :disabled="submitting">取消</el-button>
          <el-button
            type="primary"
            @click="handleAddDonateItem"
            :loading="submitting"
            :disabled="newDonateItem.selectedMonths.length === 0"
          >
            新增贊助項目
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 贊助人詳情 Dialog -->
    <el-dialog
      align-center
      v-model="showDonatorDetailModal"
      :title="`贊助人詳情 - 👤${selectedDonator?.name}`"
      width="800px"
      :before-close="closeModal"
    >
      <div v-if="selectedDonator" class="donator-detail">
        <div class="detail-header">
          <div class="donator-info">
            <span class="donator-icon"></span>
            <h3></h3>
            <el-tag v-if="selectedDonator.registrationId > 0">
              編號: {{ selectedDonator.registrationId }}
            </el-tag>
          </div>
          <div class="donator-stats">
            <el-statistic
              title="總贊助金額"
              :value="selectedDonator.totalAmount"
              suffix="元"
            />
            <el-statistic
              title="總贊助月份"
              :value="selectedDonator.totalMonths"
              suffix="個月"
            />
          </div>
        </div>

        <div class="detail-content">
          <h4>📋 贊助項目列表</h4>
          <el-table
            :data="selectedDonator.donateItems"
            style="width: 100%"
            max-height="400px"
          >
            <el-table-column prop="donateItemsId" label="圖標" width="90">
              <template #default="{ row }">
                <el-tooltip :content="row.donateItemsId" placement="top">
                  <span class="font-mono">💰</span>
                </el-tooltip>
              </template>
            </el-table-column>
            <el-table-column
              prop="price"
              label="金額"
              width="90"
              align="center"
            >
              <template #default="{ row }">
                {{ row.price.toLocaleString() }}
              </template>
            </el-table-column>
            <el-table-column
              prop="months"
              label="贊助月份"
              min-width="200"
              align="left"
            >
              <template #default="{ row }">
                <div class="months-list">
                  <el-tag v-for="month in row.months" :key="month" size="small">
                    {{ formatMonth(month) }}
                  </el-tag>
                </div>
              </template>
            </el-table-column>

            <el-table-column prop="createdAt" label="建立時間" width="150">
              <template #default="{ row }">
                {{ formatDate(row.createdAt) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" align="center">
              <template #default="{ row }">
                <el-button
                  circle
                  type="danger"
                  size="small"
                  @click="deleteDonateItem(selectedDonator, row)"
                >
                  刪
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Edit, View, Search } from "@element-plus/icons-vue";
import { useMonthlyDonateStore } from "../stores/monthlyDonateStore.js";
import { authService } from "../services/authService.js";
import { DateUtils } from "../utils/dateUtils.js";
import IconSelector from "../components/IconSelector.vue";
import { storeToRefs } from "pinia";
import { baseService } from "../services/baseService.js";

const monthlyDonateStore = useMonthlyDonateStore();

// 狀態
const loading = ref(false);
const error = ref(null);
const showAddDonatorModal = ref(false);
const showAddDonateItemModal = ref(false);
const showDonatorDetailModal = ref(false);
const submitting = ref(false);
const isDev = ref(false);

// 從 store 取得狀態
const {
  searchQuery,
  selectedTab,
  currentPage,
  pageSize,
  monthlyUnitPrice,
  allDonates,
  monthColumns,
  donateSummary,
  filteredDonates,
  paginatedDonates,
  stats,
} = storeToRefs(monthlyDonateStore);

// 表單數據
const newDonator = reactive({
  name: "",
  registrationId: -1,
  amount: monthlyUnitPrice.value,
  selectedMonths: [],
  icon: "💰",
  memo: "",
});

// 修改表單數據 - 簡化結構
const newDonateItem = reactive({
  selectedMonths: [],
  amount: 0,
  memo: "",
});

const selectedDonator = ref(null);
const settings = reactive({
  monthlyUnitPrice: monthlyUnitPrice.value,
});

// 擴展月份功能 - 清空版本
const isExtendedMode = ref(false);
const extendedFutureMonths = ref(24); // 擴展2年

// 將新增贊助項目 monthColumns 改為 donationMonthColumns，生成24個月份的欄位
const donationMonthColumns = computed(() => {
  return monthlyDonateStore.generateStandardMonthRange(
    0,
    isExtendedMode.value ? extendedFutureMonths.value : 12
  );
});

// 切換擴展月份（每次切換都清空選擇）
const toggleExtendedMode = () => {
  // 先清空所有選擇
  newDonateItem.selectedMonths = [];
  newDonateItem.amount = 0;

  // 切換模式
  isExtendedMode.value = !isExtendedMode.value;

  // 提示用戶
  if (isExtendedMode.value) {
    ElMessage.success(
      `已擴展顯示未來${extendedFutureMonths.value}個月，請重新選擇月份`
    );
  } else {
    ElMessage.info("已恢復標準月份範圍，請重新選擇月份");
  }
};

// 計算屬性：獲取被佔用的月份
const occupiedMonths = computed(() => {
  if (!selectedDonator.value || !selectedDonator.value.id) {
    return [];
  }
  return monthlyDonateStore.getOccupiedMonths(selectedDonator.value.id);
});

// 計算屬性：被佔用的月份數量
const occupiedMonthsCount = computed(() => {
  return occupiedMonths.value.length;
});

// 方法：檢查月份是否已被佔用
const isMonthOccupied = (yearMonth) => {
  return occupiedMonths.value.includes(yearMonth);
};

// 方法：月份選擇變化時的處理（新增贊助人）
const handleMonthSelectForNewDonator = () => {
  // 自動計算金額
  newDonator.amount = newDonator.selectedMonths.length * monthlyUnitPrice.value;
};

// 方法：為新增贊助人選擇所有月份
const selectAllMonthsForNewDonator = () => {
  newDonator.selectedMonths = monthColumns.value.map(
    (month) => month.yearMonth
  );
  handleMonthSelectForNewDonator();
};

// 方法：為新增贊助人清空選擇
const clearAllMonthsForNewDonator = () => {
  newDonator.selectedMonths = [];
  handleMonthSelectForNewDonator();
};

// 方法：月份選擇變化時的處理
const handleMonthSelectionChange = () => {
  // 自動計算金額
  newDonateItem.amount =
    newDonateItem.selectedMonths.length * monthlyUnitPrice.value;
};

// 表單引用
const addDonatorFormRef = ref(null);
const addDonateItemFormRef = ref(null);

// 表單驗證規則 - 修改為更簡潔的驗證
const donatorRules = {
  name: [{ required: true, message: "請輸入贊助人姓名", trigger: "blur" }],
  selectedMonths: [
    {
      validator: (rule, value, callback) => {
        if (value.length === 0) {
          callback(new Error("請至少選擇一個月份"));
        } else {
          callback();
        }
      },
      trigger: "change",
    },
  ],
  amount: [
    {
      validator: (rule, value, callback) => {
        if (value === 0 || value % monthlyUnitPrice.value !== 0) {
          callback(
            new Error(`金額必須是 ${monthlyUnitPrice.value} 的倍數且大於 0`)
          );
        } else {
          callback();
        }
      },
      trigger: "blur",
    },
  ],
};

// 修改表單驗證規則
const donateItemRules = {
  selectedMonths: [
    {
      validator: (rule, value, callback) => {
        if (value.length === 0) {
          callback(new Error("請至少選擇一個月份"));
        } else {
          callback();
        }
      },
      trigger: "change",
    },
  ],
};

const settingsRules = {
  monthlyUnitPrice: [
    { required: true, message: "請輸入每月基本單位金額", trigger: "blur" },
    {
      validator: (rule, value, callback) => {
        if (value < 100) {
          callback(new Error("金額不能低於 100 元"));
        } else if (value % 100 !== 0) {
          callback(new Error("金額必須是 100 的倍數"));
        } else {
          callback();
        }
      },
      trigger: "blur",
    },
  ],
};

// 計算屬性
// 計算屬性 - 移除不再需要的方法
const availableMonthsForDonator = computed(() => {
  // 防禦性檢查
  if (!selectedDonator.value) {
    console.log("⚠️ selectedDonator.value 為空");
    return monthColumns.value || [];
  }

  if (!monthColumns.value || monthColumns.value.length === 0) {
    console.warn("⚠️ monthColumns.value 為空");
    return [];
  }

  try {
    const recordId = selectedDonator.value.id;
    console.log("- 傳遞給 getDonatorMonths 的 ID:", recordId);

    // 調用 store 方法獲取已占用的月份
    const occupiedMonths = monthlyDonateStore.getOccupiedMonths(recordId);
    console.log("- 已占用的月份:", occupiedMonths);

    // 過濾出可用的月份
    const result = monthColumns.value.filter(
      (month) => !occupiedMonths.includes(month.yearMonth)
    );

    console.log("- 可用月份:", result.length);
    return result;
  } catch (error) {
    console.error("❌ 獲取可用月份時出錯:", error);
    return monthColumns.value || [];
  }
});

// 方法
const initialize = async () => {
  loading.value = true;
  error.value = null;

  try {
    console.log("🚀 開始初始化贊助數據...");

    // 初始化 store
    await monthlyDonateStore.initialize();

    // 驗證數據加載
    console.log("📊 驗證數據狀態:", {
      allDonatesExists: !!allDonates.value,
      allDonatesIsArray: Array.isArray(allDonates.value),
      allDonatesLength: allDonates.value?.length,
      donateSummaryLength: donateSummary.value?.length,
      monthColumnsLength: monthColumns.value?.length,
    });

    if (!allDonates.value || !Array.isArray(allDonates.value)) {
      throw new Error("贊助數據加載失敗:allDonates 不是有效的數組");
    }

    ElMessage.success(
      `贊助數據加載成功 (共 ${allDonates.value.length} 筆記錄)`
    );
    console.log("✅ allDonates 初始化完成");
  } catch (err) {
    error.value = err.message || "加載數據失敗";
    console.error("❌ 初始化失敗:", err);
    ElMessage.error(`加載贊助數據失敗: ${err.message}`);
  } finally {
    loading.value = false;
  }
};

const calculateMonthCount = (amount) => {
  return Math.floor(amount / monthlyUnitPrice.value);
};

const isMonthDisabled = (yearMonth) => {
  // 檢查月份是否已被選擇
  return (
    newDonator.selectedMonths.includes(yearMonth) &&
    newDonator.selectedMonths.length >= calculateMonthCount(newDonator.amount)
  );
};

const getMonthTooltip = (monthItems) => {
  if (!monthItems || monthItems.length === 0) return "無贊助";

  const totalAmount = monthItems.reduce((sum, item) => sum + item.price, 0);
  const itemCount = monthItems.length;

  return `贊助金額: ${totalAmount.toLocaleString()}元\n項目數: ${itemCount}個`;
};

const formatMonth = (yearMonth) => {
  const year = yearMonth.substring(0, 4);
  const month = yearMonth.substring(4, 6);
  //return `${year}年${parseInt(month)}月`;
  return `${year.toString().slice(-2)}年${parseInt(month)}`; //縮小為"25年9"字樣
};

const formatDate = (dateString) => {
  return DateUtils.formatDateLong(dateString);
};

const handleSearch = () => {
  currentPage.value = 1;
  ElMessage.info(`找到 ${filteredDonates.value.length} 個贊助人`);
};

const handleClear = () => {
  monthlyDonateStore.clearSearch();
  ElMessage.success("搜尋條件已清空");
};

const handleSizeChange = (newSize) => {
  pageSize.value = newSize;
  currentPage.value = 1;
};

const handleCurrentChange = (newPage) => {
  currentPage.value = newPage;
};

// 方法：選擇所有可用月份（新增贊助項目）
const selectAllAvailableMonths = () => {
  //將新增贊助項目 monthColumns 改為 donationMonthColumns
  newDonateItem.selectedMonths = donationMonthColumns.value
    .filter((month) => !isMonthOccupied(month.yearMonth))
    .map((month) => month.yearMonth);
  // 觸發金額計算
  handleMonthSelectionChange();
};

// 方法：清空選擇（新增贊助項目）
const clearAllMonthsForItem = () => {
  newDonateItem.selectedMonths = [];
  handleMonthSelectionChange();
};

const handleViewDonatorDetail = (donator) => {
  selectedDonator.value = donator;
  showDonatorDetailModal.value = true;
};

// 修改：打開新增贊助項目對話框時初始化
const handleAddDonateToDonator = (donator) => {
  selectedDonator.value = donator;
  // 重置表單
  Object.assign(newDonateItem, {
    selectedMonths: [],
    amount: 0,
    memo: selectedDonator.value.memo || "",
  });
  showAddDonateItemModal.value = true;
};

const handleEditDonator = (donator) => {
  // TODO: 實現編輯功能
  ElMessage.info("編輯功能開發中");
};

// 修改：關閉對話框時重置
const closeModal = () => {
  showAddDonatorModal.value = false;
  showAddDonateItemModal.value = false;
  showDonatorDetailModal.value = false;

  // 重置表單（新增贊助人）
  Object.assign(newDonator, {
    name: "",
    registrationId: -1,
    selectedMonths: [],
    amount: 0,
    icon: "💰",
    memo: "",
  });

  // 重置表單（新增贊助項目）
  Object.assign(newDonateItem, {
    selectedMonths: [],
    amount: 0,
    memo: "",
  });

  selectedDonator.value = null;
  submitting.value = false;
};

// 新增贊助人
const handleAddDonator = async () => {
  submitting.value = true;

  try {
    // 表單驗證
    if (!addDonatorFormRef.value) {
      ElMessage.error("表單未正確初始化");
      return;
    }

    const isValid = await addDonatorFormRef.value.validate().catch((error) => {
      console.error("表單驗證失敗:", error);
      return false;
    });

    if (!isValid) {
      ElMessage.warning("請填寫所有必填欄位");
      submitting.value = false;
      return;
    }

    // 準備提交數據
    const donateData = {
      name: newDonator.name,
      registrationId: newDonator.registrationId,
      amount: newDonator.amount,
      selectedMonths: newDonator.selectedMonths,
      //icon: newDonator.icon,
      memo: newDonator.memo,
    };

    const result = await monthlyDonateStore.submitDonate(donateData);

    if (result.success) {
      ElMessage.success("贊助人新增成功");
      closeModal();
    } else {
      throw new Error(result.message);
    }
  } catch (err) {
    ElMessage.error(err.message || "新增贊助人失敗");
  } finally {
    submitting.value = false;
  }
};

const handleAddDonateItem = async () => {
  if (!selectedDonator.value) return;

  submitting.value = true;

  try {
    // 表單驗證
    if (!addDonateItemFormRef.value) {
      ElMessage.error("表單未正確初始化");
      return;
    }

    const isValid = await addDonateItemFormRef.value
      .validate()
      .catch((error) => {
        console.error("表單驗證失敗:", error);
        return false;
      });

    if (!isValid) {
      ElMessage.warning("請填寫所有必填欄位");
      submitting.value = false;
      return;
    }

    // 準備提交數據
    const donateData = {
      amount: newDonateItem.amount,
      selectedMonths: newDonateItem.selectedMonths,
      memo: newDonateItem.memo,
    };

    // 新增贊助項目
    const result = await monthlyDonateStore.addDonateItem(
      selectedDonator.value.donateId,
      donateData
    );

    if (result.success) {
      ElMessage.success("贊助項目新增成功");
      closeModal();
    } else {
      throw new Error(result.message);
    }
  } catch (err) {
    ElMessage.error(err.message || "新增贊助項目失敗");
  } finally {
    submitting.value = false;
  }
};

const deleteDonateItem = async (donator, item) => {
  try {
    await ElMessageBox.confirm(
      `確定要刪除這個贊助項目嗎？\n金額：${item.price}元\n月份：${item.months.length}個月`,
      "確認刪除",
      {
        confirmButtonText: "確定",
        cancelButtonText: "取消",
        type: "error",
      }
    );

    // 在 mock 模式下，直接從本地數據刪除
    const donate = allDonates.value.find(
      (d) =>
        d.name === donator.name &&
        d.donateItems.some((i) => i.donateItemsId === item.donateItemsId)
    );

    if (donate) {
      const itemIndex = donate.donateItems.findIndex(
        (i) => i.donateItemsId === item.donateItemsId
      );
      if (itemIndex !== -1) {
        donate.donateItems.splice(itemIndex, 1);

        // 如果沒有其他贊助項目，刪除整個贊助記錄
        if (donate.donateItems.length === 0) {
          const donateIndex = allDonates.value.findIndex(
            (d) => d.donateId === donate.donateId
          );
          if (donateIndex !== -1) {
            allDonates.value.splice(donateIndex, 1);
          }
        }

        // 刪除贊助項目
        const result = await monthlyDonateStore.deleteDonateItem(
          donate.donateId,
          item.donateItemsId
        );

        if (result.success) {
          ElMessage.success("贊助項目刪除成功");

          // 重新整理詳情視窗 - 從 computed 屬性中找到更新後的贊助人
          const updatedDonator = donateSummary.value.find(
            (d) => d.donateId === donator.donateId
          );

          if (updatedDonator) {
            selectedDonator.value = updatedDonator;
          } else {
            // 如果找不到(可能是最後一個項目被刪除),關閉詳情視窗
            closeModal();
            selectedDonator.value = null;
          }

          
        } else {
          throw new Error(result.message);
        }
      }
    }
  } catch (err) {
    if (err !== "cancel") {
      ElMessage.error(err.message || "刪除贊助項目失敗");
    }
  }
};

const handleLoadMockData = () => {
  // 載入 Mock 數據到表單
  Object.assign(newDonator, {
    name: "測試贊助人",
    registrationId: 999,
    amount: monthlyUnitPrice.value * 6, // 6個月
    selectedMonths: monthColumns.value.slice(0, 6).map((m) => m.yearMonth),
    icon: "🙏",
    memo: "測試贊助數據",
  });
  // 觸發金額計算
  handleMonthSelectForNewDonator();
  ElMessage.success("Mock 數據已載入到表單");
};

// 監聽 monthlyUnitPrice 變化
watch(monthlyUnitPrice, (newValue) => {
  settings.monthlyUnitPrice = newValue;
  // 更新表單中的金額限制
  if (newDonator.amount < newValue) {
    newDonator.amount = newValue;
  }
  if (newDonateItem.amount < newValue) {
    newDonateItem.amount = newValue;
  }
});

// 生命週期
onMounted(() => {
  console.log("✅ MonthlyDonateList 組件已載入");
  initialize();
  isDev.value = authService.getCurrentDev();
});
</script>

<style scoped>
.settings-section {
  margin-bottom: 1.5rem;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.settings-content {
  padding: 10px 0;
}

.settings-hint {
  margin-top: 5px;
  color: #666;
  font-size: 0.875rem;
}

/* 統計卡片 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  text-align: center;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-header {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: var(--dark-color);
}

.stat-icon {
  font-size: 1rem;
  text-align: center;
}

.stat-content h3 {
  font-size: 1.8rem;
  margin: 0;
  color: var(--primary-color);
}

/* 搜尋區 */

.search-input-group .el-input {
  flex: 1;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 1rem 1rem 0;
}

.results-header h3 {
  margin: 0;
  color: #333;
}

.table-container {
  overflow-x: auto;
  /* padding: 0 1rem; */
}

.donate-icon {
  font-size: 1rem;
  text-align: center;
}

.donator-name {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.donator-id {
  font-size: 0.75rem;
  color: #666;
}

.month-cell {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.month-cell.has-donate {
  /* background-color: #f0f9ff; */
}

.donate-indicator {
  font-size: 1rem;
  cursor: pointer;
}

.no-donate {
  color: #ccc;
}

.donate-stats {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  font-size: 0.8rem;
  color: #666;
}

.stat-value {
  font-weight: 600;
  color: var(--primary-color);
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
}

/* 月份選擇器 */
.month-selection {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 1rem;
  background: #fafafa;
}

.month-checkbox {
  display: flex;
  align-items: center;
}

.month-checkbox.disabled-month :deep(.el-checkbox) {
  opacity: 0.5;
  cursor: not-allowed;
}

.month-selection-actions {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.selection-info {
  display: flex;
  /* gap: 1rem;
  font-size: 0.9rem;
  color: #666; */
}

.selection-info p {
  margin: 0;
}

.amount-info {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: #f0f9ff;
  border-radius: 4px;
  font-size: 0.9rem;
}

.amount-info p {
  margin: 0.25rem 0;
}

.form-hint {
  margin-left: 0.5rem;
  color: #666;
  font-size: 0.875rem;
}

/* 詳情視窗 */
.donator-detail {
  padding: 0.5rem;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e4e7ed;
}

.donator-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.donator-icon {
  font-size: 1rem;
}

.donator-stats {
  display: flex;
  gap: 2rem;
}

.months-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.month-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 0.5rem;
}

.month-cell-detail {
  text-align: center;
  padding: 0.5rem;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background: white;
}

.month-cell-detail.has-donate {
  background: #f0f9ff;
  border-color: #91caff;
}

.month-label {
  font-size: 0.75rem;
  color: #666;
  margin-bottom: 0.25rem;
}

.month-status {
  font-size: 1rem;
}

/* 分頁 */
.pagination {
  display: flex;
  justify-content: center;
  padding: 1.5rem 0;
}

/* 狀態提示 */
.loading-state,
.error-state,
.no-results {
  padding: 3rem 1rem;
  text-align: center;
}

.font-mono {
  font-family: "Courier New", Courier, monospace;
  font-size: 0.9rem;
}

/* 新增樣式 */
.occupied-month {
  color: #999;
  /* text-decoration: line-through; */
}

.occupied-badge {
  background-color: #f56c6c;
  color: white;
  font-size: 0.7rem;
  padding: 1px 5px;
  border-radius: 3px;
  margin-left: 5px;
}

.month-checkbox.disabled-month :deep(.el-checkbox__label) {
  cursor: not-allowed;
}

.amount-display {
  padding: 1px;
  background: #f5f7fa;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.amount-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #409eff;
}

.amount-breakdown {
  font-size: 0.9rem;
  color: #666;
  margin-top: 5px;
}

.month-list {
  display: grid;
  grid-template-rows: repeat(1, 40px);
  grid-template-columns: repeat(6, 1fr);
  gap: 5px;
  margin-bottom: 1rem;
  max-height: 300px;
  overflow-y: auto;
  padding: 1px;
  background: #fafafa;
  border-radius: 4px;
  border: 0px solid #e4e7ed;
}

.month-checkbox {
  display: flex;
  align-items: center;
}

.selection-info {
  display: flex;
  /* gap: 20px;
  margin-top: 10px;
  padding: 10px;
  background: #f0f9ff;
  border-radius: 4px;
  border: 1px solid #91caff; */
}

.selection-info p {
  margin: 0;
  font-size: 0.9rem;
}

.selection-info strong {
  color: #409eff;
  /* font-size: 1rem; */
}

/* 對話框樣式優化 */
:deep(.el-dialog) {
  border-radius: 8px;
}

:deep(.el-dialog__header) {
  /* padding: 1.5rem 1.5rem 1rem;*/
  border-bottom: 1px solid #eee;
}

:deep(.el-dialog__title) {
  font-size: 1.25rem;
  color: #eee;
}

:deep(.el-dialog__body) {
  padding: 0.75rem;
}

:deep(.el-dialog__footer) {
  /* padding: 1rem 1.5rem 1.5rem;*/
  border-top: 1px solid #eee;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  /* width: 100%; */
}

/* Tab 樣式優化 */
:deep(.el-tabs__nav-wrap) {
  padding: 0 1.5rem;
  background: #f8f9fa;
}

:deep(.el-tabs__header) {
  margin: 0;
}

:deep(.el-tabs__content) {
  padding: 1.5rem;
}

/* 響應式設計 */

@media (max-width: 768px) {
  .search-input-group {
    flex-direction: column;
  }

  .search-input-group .el-input,
  .search-input-group .el-button {
    width: 100%;
  }

  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .detail-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .donator-stats {
    width: 100%;
    justify-content: space-between;
  }

  .month-list {
    grid-template-columns: repeat(3, 1fr);
  }

  .month-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 480px) {
  .stats-cards {
    grid-template-columns: 1fr;
  }

  .month-list {
    grid-template-columns: repeat(2, 1fr);
  }

  .month-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  :deep(.el-table) {
    font-size: 0.75rem;
  }

  :deep(.el-pagination) {
    padding: 0.5rem 0;
  }

  :deep(.el-pagination__sizes),
  :deep(.el-pagination__jump) {
    display: none;
  }
}
</style>
