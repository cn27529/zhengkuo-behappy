<!-- src/components/MonthlyDonateList.vue -->
<template>
  <div class="main-content">
    <div class="page-header">
      <h2>每月贊助管理</h2>
      <p>管理每月贊助記錄，每月基本單位：{{ monthlyUnitPrice }}元</p>
    </div>

    <!-- 贊助設定 -->
    <div class="settings-section" style="margin-bottom: 1.5rem; display: none">
      <el-card>
        <template #header>
          <div class="settings-header">
            <span>💰 贊助設定</span>
            <el-button
              type="primary"
              size="small"
              @click="showSettingsModal = true"
            >
              設定
            </el-button>
          </div>
        </template>
        <div class="settings-content">
          <p>
            每月基本單位金額：<strong>{{ monthlyUnitPrice }}元</strong>
          </p>
          <p class="settings-hint">
            💡 提示：贊助金額必須是 {{ monthlyUnitPrice }} 元的倍數
          </p>
        </div>
      </el-card>
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
              style="display: none"
              type="success"
              @click="showAddDonatorModal = true"
              :disabled="loading"
              size="large"
              :icon="Plus"
            >
              新增贊助人
            </el-button>
          </div>
          <p class="search-hint">💡 提示：可搜尋贊助人姓名或備註</p>
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

    <!-- 贊助人列表 -->
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
                <div class="donate-icon">
                  <el-tooltip :content="row.donateId" placement="top">
                    {{ row.icon }}
                  </el-tooltip>
                </div>
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
      title="新增贊助人"
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
          <el-input
            v-model="newDonator.name"
            placeholder="請輸入贊助人姓名"
            style="width: 300px"
          />
        </el-form-item>

        <el-form-item label="登記編號">
          <el-input-number
            v-model="newDonator.registrationId"
            :min="-1"
            placeholder="登記編號"
          />
          <span class="form-hint">（-1表示未登記）</span>
        </el-form-item>

        <el-form-item label="贊助金額" prop="amount">
          <el-input-number
            v-model="newDonator.amount"
            :min="monthlyUnitPrice"
            :step="monthlyUnitPrice"
            placeholder="請輸入贊助金額"
            style="width: 200px"
          />
          <span class="form-hint"
            >（必須是 {{ monthlyUnitPrice }} 的倍數）</span
          >

          <div class="amount-info" v-if="newDonator.amount > 0">
            <p>
              可贊助月份數：<strong>{{
                calculateMonthCount(newDonator.amount)
              }}</strong>
              個月
            </p>
            <p>
              每月金額：<strong>{{ monthlyUnitPrice }}</strong> 元
            </p>
          </div>
        </el-form-item>

        <el-form-item label="選擇月份" prop="selectedMonths">
          <div class="month-selection">
            <div class="month-list">
              <div
                v-for="month in monthColumns"
                :key="month.yearMonth"
                class="month-checkbox"
                :class="{ 'disabled-month': isMonthDisabled(month.yearMonth) }"
              >
                <el-checkbox
                  :label="month.display"
                  :value="month.yearMonth"
                  v-model="newDonator.selectedMonths"
                  :disabled="isMonthDisabled(month.yearMonth)"
                  @change="handleMonthSelect"
                />
              </div>
            </div>

            <div class="month-selection-actions">
              <el-button @click="selectAllMonths" size="small">
                全選
              </el-button>
              <el-button @click="clearAllMonths" size="small"> 清空 </el-button>
              <el-button
                @click="autoSelectMonths"
                type="primary"
                size="small"
                :disabled="newDonator.amount < monthlyUnitPrice"
              >
                自動選擇
              </el-button>
            </div>

            <div class="selection-info">
              <p>
                已選擇：<strong>{{ newDonator.selectedMonths.length }}</strong>
                個月
              </p>
              <p>
                可選擇：<strong>{{
                  calculateMonthCount(newDonator.amount)
                }}</strong>
                個月
              </p>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="圖標">
          <IconSelector v-model="newDonator.icon" />
        </el-form-item>

        <el-form-item label="備註">
          <el-input
            v-model="newDonator.memo"
            type="textarea"
            :rows="3"
            placeholder="請輸入備註"
            style="width: 400px"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button
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
      :title="`新增贊助項目 - ${selectedDonator?.name}`"
      width="700px"
      :before-close="closeModal"
    >
      <el-form
        ref="addDonateItemFormRef"
        :model="newDonateItem"
        :rules="donateItemRules"
        label-width="120px"
      >
        <el-form-item label="贊助金額" prop="amount">
          <el-input-number
            v-model="newDonateItem.amount"
            :min="monthlyUnitPrice"
            :step="monthlyUnitPrice"
            placeholder="請輸入贊助金額"
            style="width: 200px"
          />
          <span class="form-hint"
            >（必須是 {{ monthlyUnitPrice }} 的倍數）</span
          >

          <div class="amount-info" v-if="newDonateItem.amount > 0">
            <p>
              可贊助月份數：<strong>{{
                calculateMonthCount(newDonateItem.amount)
              }}</strong>
              個月
            </p>
          </div>
        </el-form-item>

        <el-form-item label="選擇月份" prop="selectedMonths">
          <div class="month-selection">
            <div class="month-list">
              <div
                v-for="month in availableMonthsForDonator"
                :key="month.yearMonth"
                class="month-checkbox"
              >
                <el-checkbox
                  :label="month.display"
                  :value="month.yearMonth"
                  v-model="newDonateItem.selectedMonths"
                  @change="handleMonthSelectForItem"
                />
              </div>
            </div>

            <div class="month-selection-actions">
              <el-button @click="selectAllAvailableMonths" size="small">
                全選可用月份
              </el-button>
              <el-button @click="clearAllMonthsForItem" size="small">
                清空
              </el-button>
              <el-button
                @click="autoSelectAvailableMonths"
                type="primary"
                size="small"
                :disabled="newDonateItem.amount < monthlyUnitPrice"
              >
                自動選擇
              </el-button>
            </div>

            <div class="selection-info">
              <p>
                已選擇：<strong>{{
                  newDonateItem.selectedMonths.length
                }}</strong>
                個月
              </p>
              <p>
                可選擇：<strong>{{
                  calculateMonthCount(newDonateItem.amount)
                }}</strong>
                個月
              </p>
              <p>
                可用月份：<strong>{{
                  availableMonthsForDonator.length
                }}</strong>
                個
              </p>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="備註">
          <el-input
            v-model="newDonateItem.memo"
            type="textarea"
            :rows="3"
            placeholder="請輸入備註"
            style="width: 400px"
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
      :title="`贊助人詳情 - ${selectedDonator?.name}`"
      width="800px"
      :before-close="closeModal"
    >
      <div v-if="selectedDonator" class="donator-detail">
        <div class="detail-header">
          <div class="donator-info">
            <span class="donator-icon">{{ selectedDonator.icon }}</span>
            <h3>{{ selectedDonator.name }}</h3>
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
          <el-table :data="selectedDonator.donateItems" style="width: 100%">
            <el-table-column prop="donateItemsId" label="項目編號" width="90">
              <template #default="{ row }">
                <span class="font-mono">{{ row.donateItemsId }}</span>
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
            <el-table-column prop="months" label="月數" min-width="50">
              <template #default="{ row }">
                <div class="months-list">
                  {{ row.months.length }}
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
                  type="danger"
                  size="small"
                  @click="deleteDonateItem(selectedDonator, row)"
                >
                  刪除
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <h4 style="margin-top: 20px; display: none">📊 月份分佈</h4>
          <div class="month-distribution" style="display: none">
            <div class="month-grid">
              <div
                v-for="month in monthColumns"
                :key="month.yearMonth"
                class="month-cell-detail"
                :class="{
                  'has-donate':
                    selectedDonator.months[month.yearMonth]?.length > 0,
                }"
              >
                <div class="month-label">{{ month.display.substring(5) }}</div>
                <div class="month-status">
                  <template
                    v-if="selectedDonator.months[month.yearMonth]?.length > 0"
                  >
                    <el-tooltip
                      :content="
                        getMonthTooltip(selectedDonator.months[month.yearMonth])
                      "
                      placement="top"
                    >
                      <span class="donate-indicator">💰</span>
                    </el-tooltip>
                  </template>
                  <template v-else>
                    <span class="no-donate">-</span>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 設定 Dialog -->
    <el-dialog
      align-center
      v-model="showSettingsModal"
      title="贊助設定"
      width="500px"
      :before-close="closeModal"
    >
      <el-form
        ref="settingsFormRef"
        :model="settings"
        :rules="settingsRules"
        label-width="150px"
      >
        <el-form-item label="每月基本單位金額" prop="monthlyUnitPrice">
          <el-input-number
            v-model="settings.monthlyUnitPrice"
            :min="100"
            :step="100"
            placeholder="請輸入每月基本單位金額"
            style="width: 200px"
          />
          <span class="form-hint">元</span>
        </el-form-item>

        <el-alert
          title="注意"
          type="warning"
          description="修改每月基本單位金額不會影響已存在的贊助記錄，只會影響後續新增的贊助記錄。"
          show-icon
          style="margin-top: 20px"
        />
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeModal">取消</el-button>
          <el-button type="primary" @click="handleSaveSettings">
            儲存設定
          </el-button>
        </span>
      </template>
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

const monthlyDonateStore = useMonthlyDonateStore();

// 狀態
const loading = ref(false);
const error = ref(null);
const showAddDonatorModal = ref(false);
const showAddDonateItemModal = ref(false);
const showDonatorDetailModal = ref(false);
const showSettingsModal = ref(false);
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

const newDonateItem = reactive({
  amount: monthlyUnitPrice.value,
  selectedMonths: [],
  memo: "",
});

const selectedDonator = ref(null);
const settings = reactive({
  monthlyUnitPrice: monthlyUnitPrice.value,
});

// 表單引用
const addDonatorFormRef = ref(null);
const addDonateItemFormRef = ref(null);
const settingsFormRef = ref(null);

// 表單驗證規則
const donatorRules = {
  name: [{ required: true, message: "請輸入贊助人姓名", trigger: "blur" }],
  amount: [
    { required: true, message: "請輸入贊助金額", trigger: "blur" },
    {
      validator: (rule, value, callback) => {
        if (value % monthlyUnitPrice.value !== 0) {
          callback(new Error(`金額必須是 ${monthlyUnitPrice.value} 的倍數`));
        } else {
          callback();
        }
      },
      trigger: "blur",
    },
  ],
  selectedMonths: [
    {
      validator: (rule, value, callback) => {
        const monthCount = calculateMonthCount(newDonator.amount);
        if (value.length !== monthCount) {
          callback(new Error(`請選擇 ${monthCount} 個月份`));
        } else {
          callback();
        }
      },
      trigger: "change",
    },
  ],
};

const donateItemRules = {
  amount: [
    { required: true, message: "請輸入贊助金額", trigger: "blur" },
    {
      validator: (rule, value, callback) => {
        if (value % monthlyUnitPrice.value !== 0) {
          callback(new Error(`金額必須是 ${monthlyUnitPrice.value} 的倍數`));
        } else {
          callback();
        }
      },
      trigger: "blur",
    },
  ],
  selectedMonths: [
    {
      validator: (rule, value, callback) => {
        const monthCount = calculateMonthCount(newDonateItem.amount);
        if (value.length !== monthCount) {
          callback(new Error(`請選擇 ${monthCount} 個月份`));
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
const availableMonthsForDonator = computed(() => {
  if (!selectedDonator.value) {
    console.log("⚠️ selectedDonator.value 為空");
    return monthColumns.value;
  }

  console.log("🔍 計算 availableMonthsForDonator:");
  console.log("- 選中的贊助人:", selectedDonator.value.name);
  console.log("- 資料庫 ID:", selectedDonator.value.id);
  console.log("- donateId:", selectedDonator.value.donateId);

  try {
    const recordId = selectedDonator.value.id;
    console.log("- 傳遞給 getDonatorMonths 的 ID:", recordId);

    const occupiedMonths = monthlyDonateStore.getDonatorMonths(recordId);
    console.log("- 已佔用的月份:", occupiedMonths);
    console.log("- 總月份列:", monthColumns.value.length);

    const result = monthColumns.value.filter(
      (month) => !occupiedMonths.includes(month.yearMonth)
    );

    console.log("- 可用月份:", result.length);
    return result;
  } catch (error) {
    console.error("❌ 獲取可用月份時出錯:", error);
    return monthColumns.value;
  }
});

// 方法
const initialize = async () => {
  loading.value = true;
  error.value = null;

  try {
    await monthlyDonateStore.initialize();
    ElMessage.success("贊助數據加載成功");
  } catch (err) {
    error.value = err.message || "加載數據失敗";
    ElMessage.error("加載贊助數據失敗");
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

const handleMonthSelect = () => {
  // 確保選擇的月份數量不超過可贊助的月份數
  const maxMonths = calculateMonthCount(newDonator.amount);
  if (newDonator.selectedMonths.length > maxMonths) {
    newDonator.selectedMonths = newDonator.selectedMonths.slice(0, maxMonths);
    ElMessage.warning(`最多只能選擇 ${maxMonths} 個月份`);
  }
};

const handleMonthSelectForItem = () => {
  const maxMonths = calculateMonthCount(newDonateItem.amount);
  if (newDonateItem.selectedMonths.length > maxMonths) {
    newDonateItem.selectedMonths = newDonateItem.selectedMonths.slice(
      0,
      maxMonths
    );
    ElMessage.warning(`最多只能選擇 ${maxMonths} 個月份`);
  }
};

const selectAllMonths = () => {
  const maxMonths = calculateMonthCount(newDonator.amount);
  newDonator.selectedMonths = monthColumns.value
    .slice(0, maxMonths)
    .map((month) => month.yearMonth);
};

const clearAllMonths = () => {
  newDonator.selectedMonths = [];
};

const autoSelectMonths = () => {
  const maxMonths = calculateMonthCount(newDonator.amount);
  // 選擇最早的可用月份
  newDonator.selectedMonths = monthColumns.value
    .filter((month) => !isMonthDisabled(month.yearMonth))
    .slice(0, maxMonths)
    .map((month) => month.yearMonth);
};

const selectAllAvailableMonths = () => {
  const maxMonths = calculateMonthCount(newDonateItem.amount);
  newDonateItem.selectedMonths = availableMonthsForDonator.value
    .slice(0, maxMonths)
    .map((month) => month.yearMonth);
};

const clearAllMonthsForItem = () => {
  newDonateItem.selectedMonths = [];
};

const autoSelectAvailableMonths = () => {
  const maxMonths = calculateMonthCount(newDonateItem.amount);
  newDonateItem.selectedMonths = availableMonthsForDonator.value
    .slice(0, maxMonths)
    .map((month) => month.yearMonth);
};

const handleViewDonatorDetail = (donator) => {
  selectedDonator.value = donator;
  showDonatorDetailModal.value = true;
};

const handleAddDonateToDonator = (donator) => {
  selectedDonator.value = donator;
  // 重置表單
  Object.assign(newDonateItem, {
    amount: monthlyUnitPrice.value,
    selectedMonths: [],
    memo: selectedDonator.value.memo, // 複製贊助人的備註, 以便快速填寫
  });
  showAddDonateItemModal.value = true;
};

const handleEditDonator = (donator) => {
  // TODO: 實現編輯功能
  ElMessage.info("編輯功能開發中");
};

const closeModal = () => {
  showAddDonatorModal.value = false;
  showAddDonateItemModal.value = false;
  showDonatorDetailModal.value = false;
  showSettingsModal.value = false;

  // 重置表單
  Object.assign(newDonator, {
    name: "",
    registrationId: -1,
    amount: monthlyUnitPrice.value,
    selectedMonths: [],
    icon: "💰",
    memo: "",
  });

  Object.assign(newDonateItem, {
    amount: monthlyUnitPrice.value,
    selectedMonths: [],
    memo: "",
  });

  selectedDonator.value = null;
  submitting.value = false;
};

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
      icon: newDonator.icon,
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

        ElMessage.success("贊助項目刪除成功");
        // 重新整理詳情視窗
        selectedDonator.value = monthlyDonateStore.donateSummary.value.find(
          (d) => d.donateId === donator.donateId
        );
      }
    }
  } catch (err) {
    if (err !== "cancel") {
      ElMessage.error(err.message || "刪除贊助項目失敗");
    }
  }
};

const handleSaveSettings = async () => {
  try {
    // 表單驗證
    if (!settingsFormRef.value) {
      ElMessage.error("表單未正確初始化");
      return;
    }

    const isValid = await settingsFormRef.value.validate().catch((error) => {
      console.error("表單驗證失敗:", error);
      return false;
    });

    if (!isValid) {
      ElMessage.warning("請填寫正確的設定值");
      return;
    }

    await monthlyDonateStore.setMonthlyUnitPrice(settings.monthlyUnitPrice);
    ElMessage.success("設定已儲存");
    closeModal();
  } catch (err) {
    ElMessage.error(err.message || "儲存設定失敗");
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
  font-size: 1.5rem;
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
  font-size: 1.5rem;
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

.month-list {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.5rem;
  margin-bottom: 1rem;
  max-height: 200px;
  overflow-y: auto;
  padding: 0.5rem;
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
  gap: 1rem;
  font-size: 0.9rem;
  color: #666;
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
  font-size: 2rem;
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

.month-distribution {
  margin-top: 1rem;
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

/* 響應式設計 */
@media (max-width: 1200px) {
  .month-list {
    grid-template-columns: repeat(4, 1fr);
  }

  .month-grid {
    grid-template-columns: repeat(6, 1fr);
  }
}

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

/* 對話框樣式優化 */
:deep(.el-dialog) {
  border-radius: 8px;
}

:deep(.el-dialog__header) {
  border-bottom: 1px solid #eee;
}

:deep(.el-dialog__title) {
  font-size: 1.25rem;
  color: #eee;
}

:deep(.el-dialog__body) {
  padding: 1rem;
}

:deep(.el-dialog__footer) {
  border-top: 1px solid #eee;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
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
</style>
