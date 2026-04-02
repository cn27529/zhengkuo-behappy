<!-- src/views/PriceConfig.vue -->
<template>
  <div class="main-content">
    <div class="page-header">
      <h2>金額設定管理</h2>
      <p>管理各類項目的金額設定，每次更新會產生新的版本記錄</p>
    </div>

    <!-- 調試信息 -->
    <div v-if="isDev" class="debug-panel">
      <h4>🔧 調試信息</h4>
      <hr />
      <div>總記錄數: {{ allPriceConfigs.length }}</div>
      <div>當前有效記錄: {{ currentConfig ? currentConfig.id : "無" }}</div>
      <div>歷史記錄數: {{ historyConfigs.length }}</div>
      <div>當前模式: {{ currentMode }}</div>
      <div>加載狀態: {{ loading ? "加載中" : "就緒" }}</div>
    </div>

    <!-- 當前有效設定卡片 -->
    <div class="current-config-card" v-if="currentConfig" style="display: none">
      <div class="card-header">
        <h3>📌 當前版本 {{ currentConfig.version || "v1.0" }}</h3>
      </div>
      <div class="card-body">
        <div class="config-info">
          <div class="info-item">
            <span class="label">版本號：</span>
            <span class="value">{{ currentConfig.version || "v1.0" }}</span>
          </div>
          <div class="info-item">
            <span class="label">生效時間：</span>
            <span class="value">{{
              formatRelativeOrDateTime(currentConfig.enableDate) ||
              formatRelativeOrDateTime(currentConfig.createdAt)
            }}</span>
          </div>
          <div class="info-item">
            <span class="label">資料人員：</span>
            <span class="value">{{
              currentConfig.createdBy || currentConfig.user_created || "系統"
            }}</span>
          </div>
        </div>
        <el-button type="primary" @click="showAddModal = true" :icon="Plus">
          新增設定
        </el-button>
      </div>
    </div>

    <!-- 無當前設定時顯示提示 -->
    <div v-else class="no-current-config" v-if="!loading && hasData">
      <el-alert
        title="尚未設定有效金額"
        type="warning"
        description="請點擊下方按鈕新增設定"
        show-icon
        :closable="false"
      >
        <template #default>
          <el-button type="primary" @click="showAddModal = true" size="small">
            立即設定
          </el-button>
        </template>
      </el-alert>
    </div>

    <!-- 查詢區 -->
    <div class="search-section" style="display: none">
      <div class="search-form">
        <div class="form-group">
          <div class="search-input-group">
            <el-input
              v-model="searchQuery"
              placeholder="搜尋版本號、資料人員、備註..."
              @keyup.enter="handleSearch"
              :disabled="loading"
              clearable
              size="large"
            >
            </el-input>

            <el-select
              v-model="selectedState"
              placeholder="請選擇狀態"
              :disabled="loading"
              size="large"
              clearable
            >
              <el-option label="全部" value="" />
              <el-option label="生效中" value="now" />
              <el-option label="歷史記錄" value="history" />
            </el-select>

            <el-button
              type="primary"
              @click="handleSearch"
              :loading="loading"
              size="large"
              :icon="Search"
            >
              {{ loading ? "查詢中..." : "查詢" }}
            </el-button>

            <el-button @click="handleClear" :disabled="loading" size="large">
              清空
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 結果區域 -->
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

      <div v-else-if="filteredConfigs.length === 0" class="no-results">
        <el-empty
          :description="
            hasData ? '沒有符合條件的金額設定記錄' : '尚無金額設定記錄'
          "
        >
          <el-button type="primary" @click="showAddModal = true" v-if="hasData">
            新增設定
          </el-button>
          <el-button type="primary" @click="showAddModal = true" v-else>
            建立第一個金額設定
          </el-button>
        </el-empty>
      </div>

      <div v-else>
        <div class="results-header">
          <h3>金額設定列表 (共 {{ filteredConfigs.length }} 筆)</h3>
          <el-button type="primary" @click="showAddModal = true" :icon="Plus">
            新增設定
          </el-button>
        </div>

        <!-- 表格列表 -->
        <el-table
          :data="paginatedConfigs"
          style="width: 100%"
          :default-sort="{ prop: 'createdAt', order: 'descending' }"
          stripe
          border
          :header-cell-style="{ background: '#f8f9fa', color: '#333' }"
          v-loading="loading"
        >
          <el-table-column
            label="資料時間"
            prop="createdAt"
            width="110"
            align="center"
          >
            <template #default="{ row }">
              {{ formatRelativeOrDateTime(row.createdAt) }}
            </template>
          </el-table-column>

          <el-table-column
            label="版本"
            prop="version"
            width="60"
            align="center"
          >
            <template #default="{ row }">
              <div class="version-cell">
                <span>{{ `v${row.id}` }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="金額設定內容" width="400" align="center">
            <template #default="{ row }">
              <div class="price-config-grid">
                <div
                  class="config-row"
                  v-for="item in getConfigItemsList(row)"
                  :key="item.key"
                >
                  <span class="config-label">{{ item.label }}</span>
                  <span class="item-amount" v-if="row.state === 'now'">
                    {{ item.price }}
                  </span>
                  <span class="config-price" v-else>
                    {{ item.price }}
                  </span>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="備註" align="center">
            <template #default="{ row }">
              <span v-if="row.notes" :title="row.notes">
                {{ row.notes }}
              </span>
              <span v-else class="no-notes">無</span>
            </template>
          </el-table-column>

          <el-table-column label="狀態" width="100" align="center">
            <template #default="{ row }">
              <el-tag
                :type="row.state === 'now' ? 'success' : 'info'"
                size="layge"
                effect="dark"
              >
                {{ row.state === "now" ? "生效中" : "歷史記錄" }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="生效日期" width="110" align="center">
            <template #default="{ row }">
              {{
                formatRelativeOrDateTime(row.enableDate) ||
                formatRelativeOrDateTime(row.createdAt)
              }}
            </template>
          </el-table-column>

          <el-table-column
            prop="user_created"
            label="資料人員"
            width="100"
            align="center"
          >
            <template #default="{ row }">
              {{ recordUserName(row.user_created) }}
            </template>
          </el-table-column>

          <el-table-column
            label="操作"
            width="150"
            fixed="right"
            align="center"
            v-if="false"
          >
            <template #default="{ row }">
              <div class="action-buttons-group">
                <el-tooltip content="查看詳情" placement="top">
                  <el-button
                    circle
                    @click="handleViewDetail(row)"
                    size="small"
                    type="info"
                  >
                    👁️
                  </el-button>
                </el-tooltip>

                <el-tooltip
                  content="編輯"
                  placement="top"
                  v-if="row.state === 'history'"
                >
                  <el-button
                    circle
                    @click="handleEdit(row)"
                    size="small"
                    type="primary"
                  >
                    📝
                  </el-button>
                </el-tooltip>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分頁控件 -->
        <div class="pagination">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :total="filteredConfigs.length"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
            background
          />
        </div>
      </div>
    </div>

    <!-- 新增/編輯金額設定 Dialog -->
    <el-dialog
      align-center
      v-model="showAddModal"
      :title="isEditing ? '編輯金額設定' : '新增金額設定'"
      width="700px"
      :before-close="closeModal"
    >
      <el-form
        ref="priceFormRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
      >
        <el-divider content-position="left">金額設定項目</el-divider>

        <!-- 使用網格佈局，比照詳情頁面的明細樣式 -->
        <div class="price-items-grid-form">
          <div
            v-for="item in priceItems"
            :key="item.key"
            class="price-item-row"
          >
            <span class="price-item-label">{{ item.label }}</span>
            <el-input-number
              v-model="formData.prices[item.key]"
              :min="0"
              :max="100000"
              :step="100"
              placeholder="請輸入金額"
              controls-position="right"
              class="price-item-input"
            />
            <span class="unit-suffix"></span>
          </div>
        </div>

        <el-form-item label="備註" prop="notes">
          <el-input
            v-model="formData.notes"
            type="textarea"
            :rows="2"
            placeholder="請輸入備註說明（選填）"
          />
        </el-form-item>

        <el-form-item label="版本號" prop="version" style="display: none">
          <el-input
            v-model="formData.version"
            placeholder="請輸入版本號（如：v2.0）"
          />
          <div class="form-hint">
            💡 版本號用於標識不同的設定版本，如不填寫將自動生成
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeModal" :disabled="submitting">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            {{ isEditing ? "保存設定" : "保存設定" }}
          </el-button>
          <el-button
            v-if="!isEditing && currentConfig"
            type="warning"
            @click="handleLoadCurrentConfig"
            :disabled="submitting"
          >
            載入當前設定
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 查看詳情 Dialog -->
    <el-dialog
      align-center
      v-model="showDetailModal"
      title="金額設定詳情"
      width="600px"
    >
      <div class="detail-content" v-if="selectedConfig">
        <div class="detail-info">
          <div class="detail-row">
            <span class="detail-label">版本號：</span>
            <span class="detail-value">{{
              selectedConfig.version || `v${selectedConfig.id}`
            }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">狀態：</span>
            <span class="detail-value">
              <el-tag
                :type="selectedConfig.state === 'now' ? 'success' : 'info'"
              >
                {{ selectedConfig.state === "now" ? "生效中" : "歷史記錄" }}
              </el-tag>
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">生效日期：</span>
            <span class="detail-value">{{
              formatRelativeOrDateTime(selectedConfig.enableDate) ||
              formatRelativeOrDateTime(selectedConfig.createdAt)
            }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">資料人員：</span>
            <span class="detail-value">{{
              selectedConfig.createdBy || selectedConfig.user_created || "系統"
            }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">資料時間：</span>
            <span class="detail-value">{{
              formatRelativeOrDateTime(selectedConfig.createdAt)
            }}</span>
          </div>
          <div class="detail-row" v-if="selectedConfig.updatedAt">
            <span class="detail-label">更新時間：</span>
            <span class="detail-value">{{
              formatRelativeOrDateTime(selectedConfig.updatedAt)
            }}</span>
          </div>
          <div class="detail-row" v-if="selectedConfig.notes">
            <span class="detail-label">備註：</span>
            <span class="detail-value">{{ selectedConfig.notes }}</span>
          </div>
        </div>

        <el-divider>金額設定明細</el-divider>

        <div class="detail-price-grid">
          <div
            class="detail-price-row"
            v-for="item in getConfigItemsList(selectedConfig)"
            :key="item.key"
          >
            <span class="price-label">{{ item.label }}</span>
            <span class="price-value">{{
              appConfig.formatCurrency(item.price)
            }}</span>
          </div>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showDetailModal = false">關閉</el-button>
          <el-button
            v-if="selectedConfig?.state === 'history'"
            type="primary"
            @click="handleEdit(selectedConfig)"
          >
            編輯此版本
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Search } from "@element-plus/icons-vue";
import { authService } from "../services/authService.js";
import { serviceAdapter } from "../adapters/serviceAdapter.js";
import {
  usePriceConfigStore,
  PRICE_ITEMS,
} from "../stores/priceConfigStore.js";
import { DateUtils } from "../utils/dateUtils.js";
import { appConfig } from "../config/appConfig.js";
import { BoolUtils } from "../utils/boolUtils.js";

// ==================== 使用 Store ====================
const priceConfigStore = usePriceConfigStore();

// ==================== 狀態定義 ====================
const submitting = ref(false);
const showAddModal = ref(false);
const showDetailModal = ref(false);
const isEditing = ref(false);
const selectedConfig = ref(null);
const editingConfigId = ref(null);
const priceFormRef = ref(null);

// 從 Store 獲取狀態
const loading = computed(() => priceConfigStore.loading);
const error = computed(() => priceConfigStore.error);
const allPriceConfigs = computed(() => priceConfigStore.allPriceConfigs);
const currentConfig = computed(() => priceConfigStore.currentConfig);
const historyConfigs = computed(() => priceConfigStore.historyConfigs);
const filteredConfigs = computed(() => priceConfigStore.filteredConfigs);
const paginatedConfigs = computed(() => priceConfigStore.paginatedConfigs);
const hasData = computed(() => priceConfigStore.hasData);

// 搜尋與分頁（雙向綁定）
const searchQuery = computed({
  get: () => priceConfigStore.searchQuery,
  set: (val) => priceConfigStore.setSearchQuery(val),
});
const selectedState = computed({
  get: () => priceConfigStore.selectedState,
  set: (val) => priceConfigStore.setSelectedState(val),
});
const currentPage = computed({
  get: () => priceConfigStore.currentPage,
  set: (val) => priceConfigStore.setCurrentPage(val),
});
const pageSize = computed({
  get: () => priceConfigStore.pageSize,
  set: (val) => priceConfigStore.setPageSize(val),
});

// 開發模式
const isDev = computed(() => authService.getCurrentDev());
const currentMode = computed(
  () => serviceAdapter.getCurrentMode?.() || "directus",
);

// 金額項目列表（用於模板）
const priceItems = ref(PRICE_ITEMS);

// 表單數據
const formData = reactive({
  version: "",
  prices: {},
  notes: "",
  enableDate: null,
});

// 表單驗證規則
const formRules = {
  version: [{ required: false, message: "請輸入版本號", trigger: "blur" }],
};

// ==================== 輔助方法 ====================

const currentAllUsers = computed(() => authService.getCurrentUsers());

// 取得資料列名稱顯示用
const recordUserName = (recordUserId) => {
  const user = currentAllUsers.value.find((item) => item.id === recordUserId);
  return `${user?.firstName}${user?.lastName}` || "??";
};

/**
 * 獲取設定項目的列表（用於表格顯示）
 */
const getConfigItemsList = (config) => {
  if (!config || !config.prices) return [];
  return PRICE_ITEMS.map((item) => ({
    key: item.key,
    label: item.label,
    price:
      config.prices[item.key] !== undefined
        ? config.prices[item.key]
        : item.defaultPrice,
  }));
};

/**
 * 格式化日期時間
 */
const formatRelativeOrDateTime = (value) =>
  DateUtils.formatRelativeOrDateTime(value);

/**
 * 重置表單
 */
const resetForm = () => {
  const defaultPrices = priceConfigStore.getDefaultPrices();
  formData.version = "";
  formData.prices = { ...defaultPrices };
  formData.notes = "";
  formData.enableDate = null;
  isEditing.value = false;
  editingConfigId.value = null;
};

/**
 * 載入當前設定到表單
 */
const handleLoadCurrentConfig = () => {
  if (currentConfig.value) {
    formData.version = currentConfig.value.version || `v${Date.now()}`;
    formData.prices = { ...currentConfig.value.prices };
    formData.notes = currentConfig.value.notes || "";
    formData.enableDate = null;
    ElMessage.info("已載入當前金額設定，修改後將建立新版本");
  } else {
    ElMessage.warning("尚無當前有效設定");
  }
};

// ==================== UI 事件處理 ====================

/**
 * 初始化數據
 */
const initialize = async () => {
  await priceConfigStore.initialize();
  ElMessage.success("金額設定數據加載成功");
};

/**
 * 搜尋
 */
const handleSearch = () => {
  priceConfigStore.resetPagination();
  ElMessage.info(`找到 ${filteredConfigs.value.length} 筆記錄`);
};

/**
 * 清空搜尋條件
 */
const handleClear = () => {
  priceConfigStore.clearSearch();
  ElMessage.success("搜尋條件已清空");
};

/**
 * 分頁大小改變
 */
const handleSizeChange = (newSize) => {
  priceConfigStore.setPageSize(newSize);
  priceConfigStore.resetPagination();
};

/**
 * 當前頁改變
 */
const handleCurrentChange = (newPage) => {
  priceConfigStore.setCurrentPage(newPage);
};

/**
 * 查看詳情
 */
const handleViewDetail = (config) => {
  selectedConfig.value = config;
  showDetailModal.value = true;
};

/**
 * 編輯（僅歷史記錄可編輯）
 */
const handleEdit = (config) => {
  if (config.state === "now") {
    ElMessage.warning(
      "當前生效的設定無法編輯，請使用「新增設定」功能建立新版本",
    );
    return;
  }

  isEditing.value = true;
  editingConfigId.value = config.id;
  formData.version = config.version || "";
  formData.prices = { ...config.prices };
  formData.notes = config.notes || "";
  formData.enableDate = config.enableDate || null;
  showAddModal.value = true;
};

/**
 * 關閉對話框
 */
const closeModal = () => {
  showAddModal.value = false;
  showDetailModal.value = false;
  resetForm();
  submitting.value = false;
};

/**
 * 提交表單
 */
const handleSubmit = async () => {
  submitting.value = true;

  try {
    // 表單驗證
    if (priceFormRef.value) {
      const isValid = await priceFormRef.value.validate().catch(() => false);
      if (!isValid) {
        ElMessage.warning("請填寫完整資訊");
        submitting.value = false;
        return;
      }
    }

    // 準備提交數據
    const submitData = {
      version: formData.version || undefined,
      prices: { ...formData.prices },
      notes: formData.notes,
      enableDate: formData.enableDate || DateUtils.getCurrentISOTime(),
    };

    let result;

    if (isEditing.value) {
      // 編輯歷史記錄
      result = await priceConfigStore.updatePriceConfig(
        editingConfigId.value,
        submitData,
      );
      if (result.success) {
        ElMessage.success("✅ 金額設定更新成功");
      }
    } else {
      // 新增設定
      result = await priceConfigStore.createPriceConfig(submitData);
      if (result.success) {
        ElMessage.success("✅ 金額設定新增成功，已生效");
      }
    }

    if (result.success) {
      closeModal();
    } else {
      throw new Error(result.message || "操作失敗");
    }
  } catch (err) {
    ElMessage.error(err.message || (isEditing.value ? "更新失敗" : "新增失敗"));
    console.error("提交失敗:", err);
  } finally {
    submitting.value = false;
  }
};

// ==================== 生命週期 ====================

onMounted(() => {
  console.log("✅ PriceConfig 組件已載入");
  initialize();
});
</script>

<style scoped>
/* 當前設定卡片 */
.current-config-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
  color: white;
}

.current-config-card .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.current-config-card .card-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.current-config-card .card-body {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.current-config-card .config-info {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.current-config-card .info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.current-config-card .info-item .label {
  opacity: 0.8;
  font-size: 0.875rem;
}

.current-config-card .info-item .value {
  font-weight: 500;
}

.no-current-config {
  margin-bottom: 1.5rem;
}

/* 搜尋區域 */
.search-section {
  margin-bottom: 1.5rem;
}

.search-input-group {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: center;
}

.search-input-group .el-input {
  flex: 2;
  min-width: 200px;
}

.search-input-group .el-select {
  width: 150px;
}

/* 結果區域 */
.results-section {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0 0.5rem;
}

.results-header h3 {
  margin: 0;
  color: #333;
}

/* 版本單元格 */
.version-cell {
  display: grid;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

/* 金額設定網格 */
.price-config-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.1rem 0.1rem;
  padding: 1.1rem;
}

.config-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  margin: 0 2rem;
}

.config-label {
  color: #666;
}

.config-price {
  font-weight: 500;
  color: #333;
}

.item-amount {
  color: var(--el-color-primary);
  font-weight: 600;
  margin-left: auto;
  text-align: right;
}

/* 操作按鈕組 */
.action-buttons-group {
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}

.action-buttons-group .el-button + .el-button {
  margin-left: 0;
}

/* 表單區域 */
.price-items-grid {
  max-height: 400px;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.price-items-grid .el-form-item {
  margin-bottom: 0.75rem;
}

.unit-suffix {
  margin-left: 0.5rem;
  color: #666;
}

.form-hint {
  font-size: 0.75rem;
  color: #999;
  margin-top: 0.25rem;
}

/* 詳情對話框 */
.detail-content {
  max-height: 500px;
  overflow-y: auto;
}

.detail-info {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
}

.detail-row {
  display: flex;
  margin-bottom: 0.75rem;
}

.detail-label {
  width: 80px;
  color: #666;
  flex-shrink: 0;
}

.detail-value {
  color: #333;
  font-weight: 500;
}

.detail-price-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.detail-price-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 4px;
}

.detail-price-row .price-label {
  color: #666;
}

.detail-price-row .price-value {
  font-weight: 600;
  color: var(--primary-color, #409eff);
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

/* 新增/編輯表單中的金額項目網格佈局 */
.price-items-grid-form {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem 1.5rem;
  margin-bottom: 1rem;
  padding: 0.5rem 0;
}

.price-item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: #f8f9fa;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.price-item-row:hover {
  /* background: #f0f2f5; */
  background: var(--secondary-color);
}

.price-item-label {
  font-size: 0.875rem;
  color: #333;
  font-weight: 500;
  min-width: 85px;
  flex-shrink: 0;
}

.price-item-input {
  flex: 1;
  min-width: 120px;
}

.unit-suffix {
  margin-left: 0.25rem;
  color: #666;
  font-size: 0.875rem;
  flex-shrink: 0;
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

/* 響應式設計 */
@media (max-width: 768px) {
  /* 響應式設計 - 小螢幕改為單列 */
  .price-items-grid-form {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .price-item-row {
    padding: 0.5rem;
  }

  .search-input-group .el-input,
  .search-input-group .el-select,
  .search-input-group .el-button {
    width: 100%;
  }

  .current-config-card .card-body {
    flex-direction: column;
    align-items: stretch;
  }

  .current-config-card .config-info {
    flex-direction: column;
    gap: 0.5rem;
  }

  .price-config-grid {
    grid-template-columns: 1fr;
  }

  .detail-price-grid {
    grid-template-columns: 1fr;
  }

  .results-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .results-header .el-button {
    width: 100%;
  }

  :deep(.el-table) {
    font-size: 0.75rem;
  }

  :deep(.el-table__cell) {
    padding: 8px 4px;
  }
}

@media (max-width: 480px) {
  .price-config-grid {
    font-size: 0.7rem;
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
