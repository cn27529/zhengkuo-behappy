<!-- src/components/LogViewer.vue 增強版 -->
<script setup>
import { ref, onMounted, watch } from "vue";
import { indexedDBLogger } from "../utils/indexedDB.js";

// 響應式數據
const logs = ref([]);
const loading = ref(false);
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
  pageSize: 20,
  total: 0,
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
  { deep: true }
);

async function clearOldLogs() {
  if (confirm("確定要清理30天前的舊日誌嗎？")) {
    await indexedDBLogger.cleanupOldLogs(30);
    await loadLogs();
  }
}

// 加載日誌
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
  } finally {
    loading.value = false;
  }
}

// 搜尋
async function searchLogs() {
  await loadLogs();
}

// 重置過濾器
function resetFilters() {
  filter.value = {
    endpoint: "",
    status: "",
    dateFrom: "",
    dateTo: "",
    method: "",
    search: "",
  };
}

// 查看日誌詳情
function showLogDetail(log) {
  const detail = {
    時間: new Date(log.timestamp).toLocaleString(),
    端點: log.endpoint,
    方法: log.method,
    狀態碼: log.status,
    耗時: `${log.duration}ms`,
    服務: log.context?.service || "N/A",
    操作: log.context?.operation || "N/A",
  };

  if (log.errorText) {
    detail["錯誤信息"] = log.errorText;
  }

  if (log.requestBody) {
    detail["請求數據"] = JSON.stringify(log.requestBody, null, 2);
  }

  alert(
    Object.entries(detail)
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n")
  );
}

// 複製日誌 ID
async function copyLogId(id) {
  try {
    await navigator.clipboard.writeText(id);
    alert("已複製日誌 ID");
  } catch (error) {
    console.error("複製失敗:", error);
  }
}

// 分頁處理
function changePage(page) {
  if (
    page < 1 ||
    page > Math.ceil(pagination.value.total / pagination.value.pageSize)
  ) {
    return;
  }
  pagination.value.currentPage = page;
  loadLogs();
}

// 刷新日誌
function refreshLogs() {
  loadLogs();
}

// 獲取狀態顏色
function getStatusColor(status) {
  if (status >= 200 && status < 300) return "#2ecc71";
  if (status >= 300 && status < 400) return "#f39c12";
  if (status >= 400 && status < 500) return "#e74c3c";
  if (status >= 500) return "#c0392b";
  return "#7f8c8d";
}

// 獲取方法顏色
function getMethodColor(method) {
  const colors = {
    GET: "#3498db",
    POST: "#2ecc71",
    PUT: "#f39c12",
    PATCH: "#f1c40f",
    DELETE: "#e74c3c",
    OPTIONS: "#95a5a6",
    HEAD: "#9b59b6",
  };
  return colors[method?.toUpperCase()] || "#7f8c8d";
}
</script>

<template>
  <div class="log-viewer-enhanced">
    <!-- 過濾器 -->
    <div class="filter-section">
      <div class="filter-grid">
        <input
          v-model="filter.endpoint"
          placeholder="端點"
          class="filter-input"
        />
        <input
          v-model="filter.status"
          placeholder="狀態碼"
          class="filter-input"
        />
        <input
          v-model="filter.method"
          placeholder="方法"
          class="filter-input"
        />
        <input
          v-model="filter.search"
          placeholder="搜尋..."
          class="filter-input"
        />
      </div>
      <div class="date-filter">
        <label>從:</label>
        <input v-model="filter.dateFrom" type="date" class="date-input" />
        <label>到:</label>
        <input v-model="filter.dateTo" type="date" class="date-input" />
      </div>
      <div class="filter-actions">
        <button @click="searchLogs" class="btn-search">🔍 搜尋</button>
        <button @click="resetFilters" class="btn-reset">🔄 重置</button>
        <button @click="refreshLogs" class="btn-refresh">↻ 刷新</button>
        <button @click="clearOldLogs" class="btn-reset">清理舊日誌</button>
      </div>
    </div>

    <!-- 加載狀態 -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      加載中...
    </div>

    <!-- 日誌表格 -->
    <div v-else class="log-table-container">
      <table class="log-table">
        <thead>
          <tr>
            <th>時間</th>
            <th>方法</th>
            <th>端點</th>
            <th>狀態</th>
            <th>耗時</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="log in logs"
            :key="log.id"
            :class="{ 'error-row': log.status >= 400 }"
          >
            <td class="time-cell">
              {{ new Date(log.timestamp).toLocaleTimeString() }}
              <div class="date-sub">
                {{ new Date(log.timestamp).toLocaleDateString() }}
              </div>
            </td>
            <td>
              <span
                class="method-badge"
                :style="{ backgroundColor: getMethodColor(log.method) }"
              >
                {{ log.method }}
              </span>
            </td>
            <td class="endpoint-cell">
              <div class="endpoint-main">{{ log.endpoint }}</div>
              <div v-if="log.context?.service" class="context-info">
                {{ log.context.service }} / {{ log.context.operation }}
              </div>
            </td>
            <td>
              <span
                class="status-badge"
                :style="{ backgroundColor: getStatusColor(log.status) }"
              >
                {{ log.status }}
              </span>
            </td>
            <td>
              <span
                :class="{
                  'duration-fast': log.duration < 500,
                  'duration-medium': log.duration >= 500 && log.duration < 1000,
                  'duration-slow': log.duration >= 1000,
                }"
              >
                {{ log.duration }}ms
              </span>
            </td>
            <td class="action-cell">
              <button
                @click="showLogDetail(log)"
                class="btn-detail"
                title="查看詳情"
              >
                👁️
              </button>
              <button
                @click="copyLogId(log.id)"
                class="btn-copy"
                title="複製ID"
              >
                📋
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 空狀態 -->
      <div v-if="logs.length === 0" class="empty-state">
        📭 沒有找到日誌記錄
      </div>
    </div>

    <!-- 分頁 -->
    <div v-if="logs.length > 0" class="pagination">
      <button
        @click="changePage(pagination.currentPage - 1)"
        :disabled="pagination.currentPage === 1"
        class="page-btn"
      >
        ← 上一頁
      </button>

      <span class="page-info">
        第 {{ pagination.currentPage }} 頁 / 共
        {{ Math.ceil(pagination.total / pagination.pageSize) }} 頁 (共
        {{ pagination.total }} 條記錄)
      </span>

      <button
        @click="changePage(pagination.currentPage + 1)"
        :disabled="
          pagination.currentPage * pagination.pageSize >= pagination.total
        "
        class="page-btn"
      >
        下一頁 →
      </button>
    </div>
  </div>
</template>

<style scoped>
.log-viewer-enhanced {
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.filter-section {
  padding: 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
  margin-bottom: 15px;
}

.filter-input {
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.filter-input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.date-filter {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.date-filter label {
  color: #666;
  font-size: 14px;
}

.date-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.filter-actions {
  display: flex;
  gap: 10px;
}

.btn-search,
.btn-reset,
.btn-refresh {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-search {
  background: #3498db;
  color: white;
}

.btn-search:hover {
  background: #2980b9;
}

.btn-reset {
  background: #95a5a6;
  color: white;
}

.btn-reset:hover {
  background: #7f8c8d;
}

.btn-refresh {
  background: #2ecc71;
  color: white;
}

.btn-refresh:hover {
  background: #27ae60;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  color: #666;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.log-table-container {
  overflow-x: auto;
}

.log-table {
  width: 100%;
  border-collapse: collapse;
}

.log-table th {
  background: #2c3e50;
  color: white;
  padding: 15px;
  text-align: left;
  font-weight: 600;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.log-table td {
  padding: 12px 15px;
  border-bottom: 1px solid #eee;
  font-size: 14px;
}

.log-table tbody tr:hover {
  background: #f8f9fa;
}

.error-row {
  background: #fff5f5 !important;
}

.error-row:hover {
  background: #ffeaea !important;
}

.time-cell {
  min-width: 120px;
}

.date-sub {
  font-size: 12px;
  color: #7f8c8d;
  margin-top: 2px;
}

.method-badge,
.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  color: white;
  font-size: 12px;
  font-weight: bold;
  text-align: center;
  min-width: 60px;
}

.endpoint-cell {
  max-width: 300px;
  word-break: break-all;
}

.endpoint-main {
  font-family: "Courier New", monospace;
  font-size: 13px;
}

.context-info {
  font-size: 12px;
  color: #7f8c8d;
  margin-top: 2px;
}

.duration-fast {
  color: #2ecc71;
  font-weight: bold;
}

.duration-medium {
  color: #f39c12;
  font-weight: bold;
}

.duration-slow {
  color: #e74c3c;
  font-weight: bold;
}

.action-cell {
  display: flex;
  gap: 8px;
  min-width: 100px;
}

.btn-detail,
.btn-copy {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background: #f8f9fa;
  transition: all 0.2s;
}

.btn-detail:hover {
  background: #3498db;
  color: white;
}

.btn-copy:hover {
  background: #2ecc71;
  color: white;
}

.empty-state {
  text-align: center;
  padding: 60px;
  color: #95a5a6;
  font-size: 16px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  gap: 20px;
  background: #f8f9fa;
  border-top: 1px solid #e0e0e0;
}

.page-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #3498db;
  color: white;
  border-color: #3498db;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: #666;
  font-size: 14px;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .filter-grid {
    grid-template-columns: 1fr;
  }

  .log-table {
    font-size: 12px;
  }

  .log-table th,
  .log-table td {
    padding: 8px;
  }

  .method-badge,
  .status-badge {
    min-width: 50px;
    font-size: 11px;
    padding: 3px 6px;
  }

  .pagination {
    flex-direction: column;
    gap: 10px;
  }
}
</style>
