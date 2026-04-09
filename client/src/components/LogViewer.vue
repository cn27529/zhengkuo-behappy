<template>
  <!-- 查詢區 -->
  <div class="search-section" style="display: none">
    <div class="search-form">
      <div class="form-group">
        <label style="display: none" for="searchQuery">查詢條件</label>
        <div class="search-input-group">
          <el-input
            v-model="filter.search"
            placeholder="搜尋日誌內容..."
            @keyup.enter="searchLogs"
            :disabled="loading"
            clearable
            size="large"
          />

          <el-input
            v-model="filter.endpoint"
            placeholder="端點路徑"
            :disabled="loading"
            clearable
            size="large"
            style="max-width: 200px"
          />

          <el-select
            v-model="filter.method"
            placeholder="請求方法"
            :disabled="loading"
            clearable
            size="large"
            style="max-width: 150px"
          >
            <el-option label="GET" value="GET" />
            <el-option label="POST" value="POST" />
            <el-option label="PUT" value="PUT" />
            <el-option label="PATCH" value="PATCH" />
            <el-option label="DELETE" value="DELETE" />
          </el-select>

          <el-input
            v-model="filter.status"
            placeholder="狀態碼"
            :disabled="loading"
            clearable
            size="large"
            style="max-width: 120px"
          />

          <el-button
            type="primary"
            @click="searchLogs"
            :loading="loading"
            size="large"
            :icon="Search"
          >
            {{ loading ? "查詢中..." : "查詢" }}
          </el-button>

          <el-button @click="resetFilters" :disabled="loading" size="large">
            清空
          </el-button>
        </div>

        <div class="date-filter-row">
          <label>日期範圍:</label>
          <el-date-picker
            v-model="filter.dateFrom"
            type="date"
            placeholder="開始日期"
            size="small"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            :disabled="loading"
          />
          <span>至</span>
          <el-date-picker
            v-model="filter.dateTo"
            type="date"
            placeholder="結束日期"
            size="small"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            :disabled="loading"
          />
        </div>

        <p class="search-hint">💡 提示:搜尋關鍵字系統會自動匹配相關欄位</p>
      </div>
    </div>
  </div>

  <!-- 統計卡片 -->
  <div class="stats-cards" style="display: none">
    <el-card class="stat-card">
      <template #header>
        <div class="stat-header">
          <span class="stat-icon">📊</span>
          <span class="stat-title">總日誌數</span>
        </div>
      </template>
      <div class="stat-content">
        <h3>{{ pagination.total }}</h3>
      </div>
    </el-card>

    <el-card class="stat-card">
      <template #header>
        <div class="stat-header">
          <span class="stat-icon">✅</span>
          <span class="stat-title">成功請求</span>
        </div>
      </template>
      <div class="stat-content">
        <h3>{{ successCount }}</h3>
      </div>
    </el-card>

    <el-card class="stat-card">
      <template #header>
        <div class="stat-header">
          <span class="stat-icon">❌</span>
          <span class="stat-title">失敗請求</span>
        </div>
      </template>
      <div class="stat-content">
        <h3>{{ errorCount }}</h3>
      </div>
    </el-card>

    <el-card class="stat-card">
      <template #header>
        <div class="stat-header">
          <span class="stat-icon">⚡</span>
          <span class="stat-title">平均耗時</span>
        </div>
      </template>
      <div class="stat-content">
        <h3>{{ averageDuration }}ms</h3>
      </div>
    </el-card>
  </div>

  <!-- 查詢列表 -->
  <div class="results-section">
    <!-- 載入狀態 -->
    <div v-if="loading" class="loading-state">
      <el-result icon="info" title="載入中">
        <template #extra>
          <el-button type="primary" :loading="true">載入中</el-button>
        </template>
      </el-result>
    </div>

    <!-- 空狀態 -->
    <div v-else-if="logs.length === 0" class="no-results">
      <el-empty description="沒有找到日誌記錄">
        <el-button type="primary" @click="refreshLogs">重新載入</el-button>
      </el-empty>
    </div>

    <!-- 日誌列表 -->
    <div v-else>
      <div class="results-header">
        <h3>查詢結果 (共 {{ pagination.total }} 筆)</h3>
        <div class="header-actions">
          <el-button @click="refreshLogs" :icon="Refresh" size="large">
            刷新
          </el-button>
          <el-button
            @click="clearOldLogs"
            type="warning"
            :icon="Delete"
            size="large"
          >
            清理舊日誌
          </el-button>
          <el-button
            @click="clearAllLogs"
            type="danger"
            :icon="DeleteFilled"
            size="large"
          >
            清理全部
          </el-button>
        </div>
      </div>

      <!-- 日誌表格 -->
      <el-table
        :data="logs"
        style="width: 100%"
        :default-sort="{ prop: 'timestamp', order: 'descending' }"
        stripe
        border
        :header-cell-style="{ background: '#f8f9fa', color: '#333' }"
        :row-class-name="getRowClassName"
      >
        <el-table-column label="時間" min-width="70" prop="timestamp">
          <template #default="{ row }">
            <div class="date-info">
              <div>{{ formatTime(row.timestamp) }}</div>
              <div class="time">{{ formatDate(row.timestamp) }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="方法" min-width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="getMethodTagType(row.method)" size="small">
              {{ row.method }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="endpoint" label="端點" min-width="200">
          <template #default="{ row }">
            <div class="activity-title">
              <strong class="font-mono">{{ row.endpoint }}</strong>
              <div class="activity-desc" v-if="row.context?.service">
                {{ row.context.service }} / {{ row.context.operation }}
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="狀態" min-width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" size="small">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="耗時" min-width="80" align="center">
          <template #default="{ row }">
            <span :class="getDurationClass(row.duration)">
              {{ row.duration }}ms
            </span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <div class="action-buttons-group">
              <el-tooltip content="查看詳情" placement="top">
                <el-button circle @click="showLogDetail(row)" type="primary" size="small">
                  👁️
                </el-button>
              </el-tooltip>

              <el-tooltip content="複製ID" placement="top">
                <el-button circle @click="copyLogId(row.id)" type="info" size="small">
                  📋
                </el-button>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分頁控件 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          background
        />
      </div>
    </div>
  </div>

  <!-- 日誌詳情 Dialog -->
  <el-dialog
    v-model="showDetailModal"
    title="日誌詳情"
    width="700px"
    align-center
  >
    <el-descriptions v-if="selectedLog" :column="1" border>
      <el-descriptions-item label="時間">
        {{ formatFullTime(selectedLog.timestamp) }}
      </el-descriptions-item>
      <el-descriptions-item label="端點">
        <span class="font-mono">{{ selectedLog.endpoint }}</span>
      </el-descriptions-item>
      <el-descriptions-item label="方法">
        <el-tag :type="getMethodTagType(selectedLog.method)">
          {{ selectedLog.method }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="狀態碼">
        <el-tag :type="getStatusTagType(selectedLog.status)">
          {{ selectedLog.status }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="耗時">
        <span :class="getDurationClass(selectedLog.duration)">
          {{ selectedLog.duration }}ms
        </span>
      </el-descriptions-item>
      <el-descriptions-item label="服務" v-if="selectedLog.context?.service">
        {{ selectedLog.context.service }}
      </el-descriptions-item>
      <el-descriptions-item label="操作" v-if="selectedLog.context?.operation">
        {{ selectedLog.context.operation }}
      </el-descriptions-item>
      <el-descriptions-item label="錯誤信息" v-if="selectedLog.errorText">
        <el-alert
          :title="selectedLog.errorText"
          type="error"
          :closable="false"
        />
      </el-descriptions-item>
      <el-descriptions-item
        label="請求數據"
        v-if="selectedLog.context.requestBody"
      >
        <el-input
          v-model="requestBodyText"
          type="textarea"
          :rows="6"
          readonly
        />
      </el-descriptions-item>
    </el-descriptions>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="showDetailModal = false">關閉</el-button>
        <el-button type="primary" @click="copyLogId(selectedLog.id)">
          複製 ID
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Refresh,
  Plus,
  Edit,
  Check,
  Delete,
  View,
  Search,
} from "@element-plus/icons-vue";
import { indexedDBLogger } from "../utils/indexedDB.js";
import { DateUtils } from "../utils/dateUtils.js";

// 響應式數據
const logs = ref([]);
const loading = ref(false);
const showDetailModal = ref(false);
const selectedLog = ref(null);

const filter = ref({
  endpoint: "",
  status: "",
  dateFrom: "",
  dateTo: "",
  method: "",
  search: "",
});

// 分頁
const pagination = ref({
  currentPage: 1,
  pageSize: 10,
  total: 0,
});

// 計算屬性
const successCount = computed(() => {
  return logs.value.filter((log) => log.status >= 200 && log.status < 300)
    .length;
});

const errorCount = computed(() => {
  return logs.value.filter((log) => log.status >= 400).length;
});

const averageDuration = computed(() => {
  if (logs.value.length === 0) return 0;
  const total = logs.value.reduce((sum, log) => sum + log.duration, 0);
  return Math.round(total / logs.value.length);
});

const requestBodyText = computed(() => {
  if (!selectedLog.value.context?.requestBody) return "";
  return JSON.stringify(selectedLog.value.context.requestBody, null, 2);
});

// 初始化
onMounted(() => {
  loadLogs();
});

// 監聽過濾條件變化
watch(
  filter,
  () => {
    pagination.value.currentPage = 1;
    loadLogs();
  },
  { deep: true },
);

// 方法
async function loadLogs() {
  loading.value = true;
  try {
    const allLogs = await indexedDBLogger.queryLogs(filter.value);
    pagination.value.total = allLogs.length;

    // 分頁處理
    const start =
      (pagination.value.currentPage - 1) * pagination.value.pageSize;
    const end = start + pagination.value.pageSize;
    logs.value = allLogs.slice(start, end);
  } catch (error) {
    console.error("加載日誌失敗:", error);
    ElMessage.error("加載日誌失敗");
  } finally {
    loading.value = false;
  }
}

async function searchLogs() {
  await loadLogs();
  ElMessage.info(`找到 ${pagination.value.total} 條日誌`);
}

function resetFilters() {
  filter.value = {
    endpoint: "",
    status: "",
    dateFrom: "",
    dateTo: "",
    method: "",
    search: "",
  };
  ElMessage.success("搜尋條件已清空");
}

function refreshLogs() {
  loadLogs();
  ElMessage.success("已刷新日誌列表");
}

async function clearOldLogs() {
  try {
    await ElMessageBox.confirm(
      "確定要清理30天前的舊日誌嗎？⚠️ 此操作無法復原。",
      "確認清理",
      {
        confirmButtonText: "確定",
        //cancelButtonText: "取消",
        type: "warning",
      },
    );

    await indexedDBLogger.cleanupOldLogs(30);
    await loadLogs();
    ElMessage.success("舊日誌清理成功");
  } catch (err) {
    if (err !== "cancel") {
      ElMessage.error("清理日誌失敗");
    }
  }
}

// 添加清理全部日誌的函數
async function clearAllLogs() {
  try {
    // 先獲取當前日誌數量
    const count = await indexedDBLogger.countLogs();
    if (count === 0) {
      ElMessage.info("目前沒有日誌數據");
      return;
    }

    // 確認對話框
    await ElMessageBox.confirm(
      `確定要清理全部 ${count} 條日誌記錄嗎？⚠️ 此操作無法復原。`,
      "確認清理全部日誌",
      {
        confirmButtonText: "確定清理",
        //cancelButtonText: "取消",
        type: "error",
        confirmButtonClass: "el-button--danger",
        beforeClose: async (action, instance, done) => {
          if (action === "confirm") {
            instance.confirmButtonLoading = true;
            try {
              await indexedDBLogger.clearAllLogs();
              await loadLogs();
              ElMessage.success("已成功清理全部日誌");
            } catch (err) {
              ElMessage.error("清理日誌失敗");
            } finally {
              instance.confirmButtonLoading = false;
              done();
            }
          } else {
            done();
          }
        },
      },
    );
  } catch (err) {
    if (err !== "cancel") {
      ElMessage.error("清理日誌失敗");
    }
  }
}

function showLogDetail(log) {
  selectedLog.value = log;
  showDetailModal.value = true;
}

async function copyLogId(id) {
  try {
    await navigator.clipboard.writeText(id);
    ElMessage.success("已複製日誌 ID");
  } catch (error) {
    console.error("複製失敗:", error);
    ElMessage.error("複製失敗");
  }
}

function handleSizeChange(newSize) {
  pagination.value.pageSize = newSize;
  pagination.value.currentPage = 1;
  loadLogs();
}

function handleCurrentChange(newPage) {
  pagination.value.currentPage = newPage;
  loadLogs();
}

// 格式化函數
function formatTime(timestamp) {
  return DateUtils.formatTime(timestamp);
}

function formatDate(timestamp) {
  return DateUtils.formatDate(timestamp);
}

function formatFullTime(timestamp) {
  return DateUtils.formatFullTime(timestamp);
}

// 樣式函數
function getRowClassName({ row }) {
  return row.status >= 400 ? "error-row" : "";
}

function getMethodTagType(method) {
  const typeMap = {
    GET: "primary",
    POST: "success",
    PUT: "warning",
    PATCH: "warning",
    DELETE: "danger",
  };
  return typeMap[method?.toUpperCase()] || "";
}

function getStatusTagType(status) {
  if (status >= 200 && status < 300) return "success";
  if (status >= 300 && status < 400) return "warning";
  if (status >= 400 && status < 500) return "danger";
  if (status >= 500) return "danger";
  return "";
}

function getDurationClass(duration) {
  if (duration < 500) return "duration-fast";
  if (duration < 1000) return "duration-medium";
  return "duration-slow";
}
</script>

<style scoped>
.search-input-group {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.search-input-group .el-input {
  flex: 1;
  min-width: 200px;
}

.date-filter-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  flex-wrap: wrap;
}

.date-filter-row label {
  color: #666;
  font-size: 0.875rem;
  white-space: nowrap;
}

.search-hint {
  margin-top: 0.5rem;
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
  font-size: 2rem;
  margin: 0;
  color: var(--primary-color);
}

/* 結果區域 */
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

.header-actions {
  display: flex;
  gap: 0.5rem;
}

/* 活動標題 */
.activity-title {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.activity-desc {
  font-size: 0.75rem;
  color: #666;
}

/* 日期時間信息 */
.date-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.time {
  font-size: 0.75rem;
  color: #666;
}

/* 分頁 */
.pagination {
  display: flex;
  justify-content: center;
  padding: 1.5rem 0;
}

/* 狀態提示 */
.loading-state,
.no-results {
  padding: 3rem 1rem;
  text-align: center;
}

/* 錯誤行樣式 */
:deep(.error-row) {
  background: #fff5f5 !important;
}

:deep(.error-row:hover) {
  background: #ffeaea !important;
}

/* 耗時樣式 */
.duration-fast {
  color: #67c23a;
  font-weight: bold;
}

.duration-medium {
  color: #e6a23c;
  font-weight: bold;
}

.duration-slow {
  color: #f56c6c;
  font-weight: bold;
}

/* 字體樣式 */
.font-mono {
  font-family: "Courier New", Courier, monospace;
  font-size: 0.9rem;
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
}

:deep(.el-dialog__body) {
  padding: 1.5rem;
}

:deep(.el-dialog__footer) {
  border-top: 1px solid #eee;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

/* 操作按鈕 */
.action-buttons-group {
  display: flex;
  justify-content: center;
  gap: 8px; /* 統一設定按鈕間距 */
  flex-wrap: wrap; /* 如果縮到很窄，允許按鈕自動換行而不溢出 */
}

/* 移除 Element Plus 按鈕預設的左邊距，改用 gap 控制 */
.action-buttons-group .el-button + .el-button {
  margin-left: 0;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .search-input-group .el-input,
  .search-input-group .el-select {
    width: 100%;
    min-width: auto;
  }

  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .results-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .header-actions {
    width: 100%;
  }

  .header-actions .el-button {
    flex: 1;
  }

  :deep(.el-table) {
    font-size: 0.875rem;
  }

  :deep(.el-table__cell) {
    padding: 8px 4px;
  }

  .action-buttons-group {
    flex-wrap: wrap;
  }
}

@media (max-width: 480px) {
  .stats-cards {
    grid-template-columns: 1fr;
  }

  :deep(.el-table) {
    font-size: 0.75rem;
  }

  :deep(.el-pagination__sizes),
  :deep(.el-pagination__jump) {
    display: none;
  }
}
</style>
