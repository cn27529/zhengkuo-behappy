<template>
  <div class="main-content">
    <!-- 頁面標題 -->
    <div class="page-header">
      <h2>📊 API 調用日誌查看器</h2>
      <!-- <p>查看和分析所有 Directus API 的調用記錄</p> -->
    </div>

    <!-- 統計卡片 -->
    <div class="stats-cards" style="display: none">
      <div class="stat-card">
        <div class="stat-value">{{ totalLogs }}</div>
        <div class="stat-label">總日誌數</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ successCount }}</div>
        <div class="stat-label">成功請求</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ errorCount }}</div>
        <div class="stat-label">錯誤請求</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ avgDuration }}ms</div>
        <div class="stat-label">平均響應時間</div>
      </div>
    </div>

    <LogViewer ref="logViewer" />
    <div class="log-view-page">
      <!-- 導航按鈕 -->
      <div class="navigation" style="display: none">
        <button @click="goBack" class="btn-back">← 返回上一頁</button>
        <button @click="exportLogs" class="btn-export" :disabled="isExporting">
          {{ isExporting ? "匯出中..." : "📥 匯出日誌" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import LogViewer from "../components/LogViewer.vue";
import { indexedDBLogger } from "../utils/indexedDB.js";
import { DateUtils } from "../utils/dateUtils.js";
import mock_logEntrys from "../data/mock_logEntrys.json";

const router = useRouter();
const logViewer = ref(null);
const logs = ref([]);
const isExporting = ref(false);

// 模擬數據（如果沒有真實日誌）
const mockLogs = mock_logEntrys;

// 計算屬性
const totalLogs = computed(() => logs.value.length);
const successCount = computed(
  () =>
    logs.value.filter((log) => log.status >= 200 && log.status < 300).length,
);
const errorCount = computed(
  () => logs.value.filter((log) => log.status >= 400).length,
);
const avgDuration = computed(() => {
  if (logs.value.length === 0) return 0;
  const sum = logs.value.reduce((total, log) => total + (log.duration || 0), 0);
  return Math.round(sum / logs.value.length);
});

// 生命週期
onMounted(async () => {
  await loadLogs();
});

// 加載日誌
async function loadLogs() {
  try {
    const dbLogs = await indexedDBLogger.getLogs({ limit: 100 });

    if (dbLogs.length === 0) {
      // 如果 IndexedDB 沒有數據，顯示模擬數據
      console.log("IndexedDB 中沒有日誌，顯示模擬數據");
      logs.value = mockLogs;

      // 可以選擇性地將模擬數據保存到 IndexedDB
      // for (const log of mockLogs) {
      //   await indexedDBLogger.addLog(log);
      // }
    } else {
      logs.value = dbLogs;
    }
  } catch (error) {
    console.error("加載日誌失敗:", error);
    logs.value = mockLogs; // 降級到模擬數據
  }
}

// 導航返回
function goBack() {
  router.back();
}

// 匯出日誌
async function exportLogs() {
  isExporting.value = true;
  try {
    const allLogs = await indexedDBLogger.getLogs();

    // 創建 JSON 文件
    const dataStr = JSON.stringify(allLogs, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });

    // 創建下載鏈接
    const downloadUrl = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `directus-logs-${
      DateUtils.getCurrentISOTime().split("T")[0]
    }.json`;

    // 觸發下載
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 清理 URL
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 100);

    alert(`已匯出 ${allLogs.length} 條日誌`);
  } catch (error) {
    console.error("匯出日誌失敗:", error);
    alert("匯出失敗: " + error.message);
  } finally {
    isExporting.value = false;
  }
}

// 重新加載日誌（暴露給子組件）
function reloadLogs() {
  loadLogs();
}

// 暴露方法給模版
defineExpose({
  reloadLogs,
});
</script>

<style scoped>
.log-view-page {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu,
    sans-serif;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e0e0e0;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 8px;
}

.stat-card:nth-child(1) .stat-value {
  color: #3498db;
}
.stat-card:nth-child(2) .stat-value {
  color: #2ecc71;
}
.stat-card:nth-child(3) .stat-value {
  color: #e74c3c;
}
.stat-card:nth-child(4) .stat-value {
  color: #9b59b6;
}

.stat-label {
  color: #7f8c8d;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.log-viewer-container {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e0e0e0;
  margin-bottom: 30px;
}

.navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-back {
  background: #f8f9fa;
  color: #6c757d;
  border: 1px solid #dee2e6;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-back:hover {
  background: #e9ecef;
  border-color: #ced4da;
}

.btn-export {
  background: #3498db;
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-export:hover:not(:disabled) {
  background: #2980b9;
  transform: translateY(-1px);
}

.btn-export:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .log-view-page {
    padding: 15px;
  }

  .navigation {
    flex-direction: column;
    gap: 15px;
  }

  .btn-back,
  .btn-export {
    width: 100%;
  }
}
</style>
