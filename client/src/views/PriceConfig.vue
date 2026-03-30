<!-- src/views/PriceConfig.vue -->
<template>
  <div class="main-content">
    <div class="page-header">
      <h2>金額設定管理</h2>
      <p>管理各類活動項目的金額設定，每次更新會產生新的版本記錄</p>
    </div>

    <!-- 調試信息 -->
    <div v-if="isDev" class="debug-panel">
      <h4>🔧 調試信息</h4>
      <hr />
      <div>總記錄數: {{ priceConfigs.length }}</div>
      <div>當前有效記錄: {{ currentConfig ? currentConfig.id : '無' }}</div>
      <div>歷史記錄數: {{ historyConfigs.length }}</div>
      <div>當前模式: {{ currentMode }}</div>
    </div>

    <!-- 當前有效設定卡片 -->
    <div class="current-config-card" v-if="currentConfig">
      <div class="card-header">
        <h3>📌 當前有效金額設定</h3>
        <el-tag type="success" size="large">生效中</el-tag>
      </div>
      <div class="card-body">
        <div class="config-info">
          <div class="info-item">
            <span class="label">版本號：</span>
            <span class="value">{{ currentConfig.version || 'v1.0' }}</span>
          </div>
          <div class="info-item">
            <span class="label">生效時間：</span>
            <span class="value">{{ formatDateTime(currentConfig.effectiveDate) || formatDateTime(currentConfig.createdAt) }}</span>
          </div>
          <div class="info-item">
            <span class="label">建立者：</span>
            <span class="value">{{ currentConfig.createdBy || currentConfig.user_created || '系統' }}</span>
          </div>
        </div>
        <el-button type="primary" @click="showAddModal = true" :icon="Plus">
          新增金額設定
        </el-button>
      </div>
    </div>

    <!-- 查詢區 -->
    <div class="search-section">
      <div class="search-form">
        <div class="form-group">
          <div class="search-input-group">
            <el-input
              v-model="searchQuery"
              placeholder="搜尋版本號、建立者..."
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
        <el-empty description="沒有金額設定記錄">
          <el-button type="primary" @click="showAddModal = true"
            >新增金額設定</el-button
          >
        </el-empty>
      </div>

      <div v-else>
        <div class="results-header">
          <h3>金額設定列表 (共 {{ filteredConfigs.length }} 筆)</h3>
          <el-button
            type="primary"
            @click="showAddModal = true"
            :icon="Plus"
            v-if="!showAddButtonInHeader"
          >
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
          <el-table-column label="版本" min-width="100" prop="version">
            <template #default="{ row }">
              <div class="version-cell">
                <span>{{ row.version || `v${row.id}` }}</span>
                <el-tag v-if="row.state === 'now'" type="success" size="small" effect="dark">
                  生效中
                </el-tag>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="金額設定內容" min-width="400">
            <template #default="{ row }">
              <div class="price-config-grid">
                <div class="config-row" v-for="item in getConfigItemsList(row)" :key="item.key">
                  <span class="config-label">{{ item.label }}：</span>
                  <span class="config-price">NT$ {{ formatPrice(item.price) }}</span>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="生效日期" min-width="120">
            <template #default="{ row }">
              {{ formatDateTime(row.effectiveDate) || formatDateTime(row.createdAt) }}
            </template>
          </el-table-column>

          <el-table-column label="建立者" min-width="100" prop="createdBy">
            <template #default="{ row }">
              {{ row.createdBy || row.user_created || '系統' }}
            </template>
          </el-table-column>

          <el-table-column label="建立時間" min-width="140">
            <template #default="{ row }">
              {{ formatDateTime(row.createdAt) }}
            </template>
          </el-table-column>

          <el-table-column label="狀態" min-width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="row.state === 'now' ? 'success' : 'info'">
                {{ row.state === 'now' ? '生效中' : '歷史記錄' }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="120" fixed="right" align="center">
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

                <el-tooltip content="編輯" placement="top" v-if="row.state === 'history'">
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
        <el-form-item label="版本號" prop="version">
          <el-input
            v-model="formData.version"
            placeholder="請輸入版本號（如：v2.0）"
          />
          <div class="form-hint">💡 版本號用於標識不同的設定版本</div>
        </el-form-item>

        <el-divider content-position="left">金額設定項目</el-divider>

        <div class="price-items-grid">
          <el-form-item
            v-for="item in priceItems"
            :key="item.key"
            :label="item.label"
            :prop="`prices.${item.key}`"
          >
            <el-input-number
              v-model="formData.prices[item.key]"
              :min="0"
              :max="100000"
              :step="100"
              placeholder="請輸入金額"
              style="width: 200px"
            />
            <span class="unit-suffix">元</span>
          </el-form-item>
        </div>

        <el-form-item label="備註" prop="notes">
          <el-input
            v-model="formData.notes"
            type="textarea"
            :rows="2"
            placeholder="請輸入備註說明（選填）"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeModal" :disabled="submitting">取消</el-button>
          <el-button
            type="primary"
            @click="handleSubmit"
            :loading="submitting"
          >
            {{ isEditing ? '更新設定' : '新增設定' }}
          </el-button>
          <el-button
            v-if="!isEditing"
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
            <span class="detail-value">{{ selectedConfig.version || `v${selectedConfig.id}` }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">狀態：</span>
            <span class="detail-value">
              <el-tag :type="selectedConfig.state === 'now' ? 'success' : 'info'">
                {{ selectedConfig.state === 'now' ? '生效中' : '歷史記錄' }}
              </el-tag>
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">生效日期：</span>
            <span class="detail-value">{{ formatDateTime(selectedConfig.effectiveDate) || formatDateTime(selectedConfig.createdAt) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">建立者：</span>
            <span class="detail-value">{{ selectedConfig.createdBy || selectedConfig.user_created || '系統' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">建立時間：</span>
            <span class="detail-value">{{ formatDateTime(selectedConfig.createdAt) }}</span>
          </div>
          <div class="detail-row" v-if="selectedConfig.updatedAt">
            <span class="detail-label">更新時間：</span>
            <span class="detail-value">{{ formatDateTime(selectedConfig.updatedAt) }}</span>
          </div>
          <div class="detail-row" v-if="selectedConfig.notes">
            <span class="detail-label">備註：</span>
            <span class="detail-value">{{ selectedConfig.notes }}</span>
          </div>
        </div>

        <el-divider>金額設定明細</el-divider>

        <div class="detail-price-grid">
          <div class="detail-price-row" v-for="item in getConfigItemsList(selectedConfig)" :key="item.key">
            <span class="price-label">{{ item.label }}</span>
            <span class="price-value">NT$ {{ formatPrice(item.price) }}</span>
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
import { DateUtils } from "../utils/dateUtils.js";
import { serviceAdapter } from "../adapters/serviceAdapter.js";

// ==================== 定義金額項目 ====================
const PRICE_ITEMS = [
  { key: "chaodu", label: "超度/超薦", defaultPrice: 1000 },
  { key: "survivors", label: "陽上人", defaultPrice: 0 },
  { key: "diandeng", label: "點燈", defaultPrice: 600 },
  { key: "qifu", label: "消災祈福", defaultPrice: 300 },
  { key: "xiaozai", label: "固定消災", defaultPrice: 100 },
  { key: "pudu", label: "中元普度", defaultPrice: 1200 },
  { key: "support_triple_gem", label: "護持三寶", defaultPrice: 200 },
  { key: "food_offering", label: "供齋", defaultPrice: 200 },
  { key: "support_temple", label: "護持道場", defaultPrice: 200 },
  { key: "sutra_printing", label: "助印經書", defaultPrice: 200 },
  { key: "life_release", label: "放生", defaultPrice: 200 }
];

// ==================== 狀態定義 ====================
const loading = ref(false);
const error = ref(null);
const submitting = ref(false);
const showAddModal = ref(false);
const showDetailModal = ref(false);
const isEditing = ref(false);
const showAddButtonInHeader = ref(false);

// 查詢條件
const searchQuery = ref("");
const selectedState = ref("");

// 分頁
const currentPage = ref(1);
const pageSize = ref(10);

// 數據
const priceConfigs = ref([]);
const selectedConfig = ref(null);
const editingConfigId = ref(null);

// 開發模式
const isDev = computed(() => authService.getCurrentDev());
const currentMode = computed(() => serviceAdapter.getCurrentMode?.() || "directus");

// 表單數據
const priceFormRef = ref(null);
const formData = reactive({
  version: "",
  prices: {},
  notes: "",
  effectiveDate: null
});

// 金額項目列表（用於模板）
const priceItems = ref(PRICE_ITEMS);

// 表單驗證規則
const formRules = {
  version: [
    { required: false, message: "請輸入版本號", trigger: "blur" }
  ]
};

// ==================== 計算屬性 ====================

// 當前有效的設定
const currentConfig = computed(() => {
  return priceConfigs.value.find(config => config.state === "now");
});

// 歷史設定列表
const historyConfigs = computed(() => {
  return priceConfigs.value.filter(config => config.state === "history");
});

// 過濾後的設定列表
const filteredConfigs = computed(() => {
  let filtered = [...priceConfigs.value];

  // 狀態篩選
  if (selectedState.value) {
    filtered = filtered.filter(config => config.state === selectedState.value);
  }

  // 關鍵字搜尋
  if (searchQuery.value) {
    const keyword = searchQuery.value.toLowerCase();
    filtered = filtered.filter(config =>
      (config.version && config.version.toLowerCase().includes(keyword)) ||
      (config.createdBy && config.createdBy.toLowerCase().includes(keyword)) ||
      (config.user_created && config.user_created.toLowerCase().includes(keyword))
    );
  }

  // 按建立時間倒序排列
  return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
});

// 分頁後的數據
const paginatedConfigs = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredConfigs.value.slice(start, end);
});

// ==================== 輔助方法 ====================

/**
 * 獲取設定項目的列表（用於表格顯示）
 */
const getConfigItemsList = (config) => {
  if (!config || !config.prices) return [];
  return PRICE_ITEMS.map(item => ({
    key: item.key,
    label: item.label,
    price: config.prices[item.key] !== undefined ? config.prices[item.key] : item.defaultPrice
  }));
};

/**
 * 格式化金額
 */
const formatPrice = (price) => {
  if (price === undefined || price === null) return "0";
  return price.toLocaleString();
};

/**
 * 格式化日期時間
 */
const formatDateTime = (dateString) => {
  if (!dateString) return "";
  return DateUtils.formatDateTime(dateString);
};

/**
 * 獲取默認金額設定
 */
const getDefaultPrices = () => {
  const prices = {};
  PRICE_ITEMS.forEach(item => {
    prices[item.key] = item.defaultPrice;
  });
  return prices;
};

/**
 * 重置表單
 */
const resetForm = () => {
  formData.version = "";
  formData.prices = getDefaultPrices();
  formData.notes = "";
  formData.effectiveDate = null;
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
    formData.effectiveDate = null;
    ElMessage.info("已載入當前金額設定，修改後將建立新版本");
  } else {
    ElMessage.warning("尚無當前有效設定");
  }
};

// ==================== CRUD 操作方法 ====================

/**
 * 初始化數據（從服務器獲取）
 */
const initialize = async () => {
  loading.value = true;
  error.value = null;

  try {
    await loadPriceConfigs();
    ElMessage.success("金額設定數據加載成功");
  } catch (err) {
    error.value = err.message || "加載數據失敗";
    ElMessage.error("加載金額設定數據失敗");
    console.error("初始化失敗:", err);
  } finally {
    loading.value = false;
  }
};

/**
 * 加載金額設定列表
 */
const loadPriceConfigs = async () => {
  try {
    // 使用 serviceAdapter 獲取數據
    // 注意：這裡需要根據實際的 API endpoint 調整
    let result;
    
    if (serviceAdapter.getIsMock()) {
      // Mock 模式：返回模擬數據
      console.warn("⚠️ 當前模式為 Mock，返回模擬金額設定數據");
      priceConfigs.value = getMockPriceConfigs();
      return priceConfigs.value;
    }

    // 實際 API 調用
    // TODO: 需要確認後端 API endpoint
    const baseService = serviceAdapter.base;
    const endpoint = `${baseService.apiBaseUrl}/items/price_configs`;
    const myHeaders = await baseService.getAuthJsonHeaders();
    const response = await fetch(endpoint, {
      method: "GET",
      headers: myHeaders
    });
    
    if (response.ok) {
      const data = await response.json();
      priceConfigs.value = data.data || [];
    } else {
      throw new Error(`獲取數據失敗: ${response.status}`);
    }
    
    return priceConfigs.value;
  } catch (err) {
    console.error("加載金額設定失敗:", err);
    // 發生錯誤時返回空數組
    priceConfigs.value = [];
    throw err;
  }
};

/**
 * 創建新的金額設定（會自動將當前有效設定改為歷史）
 */
const createPriceConfig = async (data) => {
  const createISOTime = DateUtils.getCurrentISOTime();
  const currentUser = authService.getCurrentUser() || "system";
  const userName = authService.getUserName() || currentUser;

  // 準備要創建的數據
  const newConfig = {
    ...data,
    state: "now",
    createdAt: createISOTime,
    createdBy: userName,
    user_created: currentUser,
    effectiveDate: data.effectiveDate || createISOTime
  };

  // 如果當前有生效中的設定，需要將其改為歷史
  if (currentConfig.value) {
    await updateConfigState(currentConfig.value.id, "history");
  }

  // 創建新設定
  if (serviceAdapter.getIsMock()) {
    console.warn("⚠️ Mock 模式：模擬創建金額設定");
    const mockId = Date.now();
    const mockConfig = { id: mockId, ...newConfig };
    priceConfigs.value.unshift(mockConfig);
    return { success: true, data: mockConfig };
  }

  try {
    const baseService = serviceAdapter.base;
    const endpoint = `${baseService.apiBaseUrl}/items/price_configs`;
    const myHeaders = await baseService.getAuthJsonHeaders();
    
    const response = await fetch(endpoint, {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(newConfig)
    });
    
    if (response.ok) {
      const result = await response.json();
      priceConfigs.value.unshift(result.data);
      return { success: true, data: result.data };
    } else {
      throw new Error(`創建失敗: ${response.status}`);
    }
  } catch (err) {
    console.error("創建金額設定失敗:", err);
    throw err;
  }
};

/**
 * 更新金額設定的狀態
 */
const updateConfigState = async (configId, newState) => {
  const updateData = {
    state: newState,
    updatedAt: DateUtils.getCurrentISOTime()
  };

  if (serviceAdapter.getIsMock()) {
    const index = priceConfigs.value.findIndex(c => c.id === configId);
    if (index !== -1) {
      priceConfigs.value[index] = { ...priceConfigs.value[index], ...updateData };
    }
    return { success: true };
  }

  try {
    const baseService = serviceAdapter.base;
    const endpoint = `${baseService.apiBaseUrl}/items/price_configs/${configId}`;
    const myHeaders = await baseService.getAuthJsonHeaders();
    
    const response = await fetch(endpoint, {
      method: "PATCH",
      headers: myHeaders,
      body: JSON.stringify(updateData)
    });
    
    if (response.ok) {
      const index = priceConfigs.value.findIndex(c => c.id === configId);
      if (index !== -1) {
        priceConfigs.value[index] = { ...priceConfigs.value[index], ...updateData };
      }
      return { success: true };
    } else {
      throw new Error(`更新狀態失敗: ${response.status}`);
    }
  } catch (err) {
    console.error("更新狀態失敗:", err);
    throw err;
  }
};

/**
 * 編輯歷史設定（僅更新，不會影響當前生效設定）
 */
const updatePriceConfig = async (configId, data) => {
  const updateData = {
    ...data,
    updatedAt: DateUtils.getCurrentISOTime(),
    updatedBy: authService.getUserName() || authService.getCurrentUser()
  };

  if (serviceAdapter.getIsMock()) {
    const index = priceConfigs.value.findIndex(c => c.id === configId);
    if (index !== -1) {
      priceConfigs.value[index] = { ...priceConfigs.value[index], ...updateData };
    }
    return { success: true, data: priceConfigs.value[index] };
  }

  try {
    const baseService = serviceAdapter.base;
    const endpoint = `${baseService.apiBaseUrl}/items/price_configs/${configId}`;
    const myHeaders = await baseService.getAuthJsonHeaders();
    
    const response = await fetch(endpoint, {
      method: "PATCH",
      headers: myHeaders,
      body: JSON.stringify(updateData)
    });
    
    if (response.ok) {
      const result = await response.json();
      const index = priceConfigs.value.findIndex(c => c.id === configId);
      if (index !== -1) {
        priceConfigs.value[index] = { ...priceConfigs.value[index], ...result.data };
      }
      return { success: true, data: result.data };
    } else {
      throw new Error(`更新失敗: ${response.status}`);
    }
  } catch (err) {
    console.error("更新金額設定失敗:", err);
    throw err;
  }
};

// ==================== Mock 數據 ====================

/**
 * 生成 Mock 金額設定數據
 */
const getMockPriceConfigs = () => {
  const now = DateUtils.getCurrentISOTime();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 30);
  
  return [
    {
      id: 1,
      version: "v1.0",
      state: "history",
      prices: {
        chaodu: 800,
        survivors: 0,
        diandeng: 500,
        qifu: 200,
        xiaozai: 80,
        pudu: 1000,
        support_triple_gem: 150,
        food_offering: 150,
        support_temple: 150,
        sutra_printing: 150,
        life_release: 150
      },
      notes: "初始版本",
      createdAt: yesterday.toISOString(),
      createdBy: "admin",
      effectiveDate: yesterday.toISOString()
    },
    {
      id: 2,
      version: "v2.0",
      state: "now",
      prices: {
        chaodu: 1000,
        survivors: 0,
        diandeng: 600,
        qifu: 300,
        xiaozai: 100,
        pudu: 1200,
        support_triple_gem: 200,
        food_offering: 200,
        support_temple: 200,
        sutra_printing: 200,
        life_release: 200
      },
      notes: "2024年調整版本",
      createdAt: now,
      createdBy: "admin",
      effectiveDate: now
    }
  ];
};

// ==================== UI 事件處理 ====================

/**
 * 搜尋
 */
const handleSearch = () => {
  currentPage.value = 1;
  ElMessage.info(`找到 ${filteredConfigs.value.length} 筆記錄`);
};

/**
 * 清空搜尋條件
 */
const handleClear = () => {
  searchQuery.value = "";
  selectedState.value = "";
  currentPage.value = 1;
  ElMessage.success("搜尋條件已清空");
};

/**
 * 分頁大小改變
 */
const handleSizeChange = (newSize) => {
  pageSize.value = newSize;
  currentPage.value = 1;
};

/**
 * 當前頁改變
 */
const handleCurrentChange = (newPage) => {
  currentPage.value = newPage;
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
    ElMessage.warning("當前生效的設定無法編輯，請使用「新增設定」功能建立新版本");
    return;
  }
  
  isEditing.value = true;
  editingConfigId.value = config.id;
  formData.version = config.version || "";
  formData.prices = { ...config.prices };
  formData.notes = config.notes || "";
  formData.effectiveDate = config.effectiveDate || null;
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
      version: formData.version || `v${Date.now()}`,
      prices: { ...formData.prices },
      notes: formData.notes,
      effectiveDate: formData.effectiveDate || DateUtils.getCurrentISOTime()
    };

    let result;
    
    if (isEditing.value) {
      // 編輯歷史記錄
      result = await updatePriceConfig(editingConfigId.value, submitData);
      if (result.success) {
        ElMessage.success("✅ 金額設定更新成功");
      }
    } else {
      // 新增設定
      result = await createPriceConfig(submitData);
      if (result.success) {
        ElMessage.success("✅ 金額設定新增成功，已生效");
      }
    }

    if (result.success) {
      closeModal();
      await loadPriceConfigs(); // 重新加載數據
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
.main-content {
  padding: 1rem;
}

.page-header {
  margin-bottom: 1.5rem;
}

.page-header h2 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.page-header p {
  margin: 0;
  color: #666;
  font-size: 0.875rem;
}

/* 調試面板 */
.debug-panel {
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 0.75rem;
  margin-bottom: 1rem;
  font-size: 0.75rem;
  font-family: monospace;
}

.debug-panel h4 {
  margin: 0 0 0.5rem 0;
}

.debug-panel hr {
  margin: 0.5rem 0;
}

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
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

/* 金額設定網格 */
.price-config-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.25rem 1rem;
}

.config-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.8125rem;
  line-height: 1.4;
}

.config-label {
  color: #666;
}

.config-price {
  font-weight: 500;
  color: #333;
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

/* 響應式設計 */
@media (max-width: 768px) {
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