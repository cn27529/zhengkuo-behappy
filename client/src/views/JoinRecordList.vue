<!-- src/views/JoinRecordList.vue -->
<template>
  <div class="main-content">
    <div class="page-header">
      <h2>活動參加記錄查詢</h2>
      <p class="page-subtitle" style="display: none">
        查詢已提交的活動參加記錄資料
      </p>
    </div>

    <!-- 查詢區 -->
    <div class="search-section">
      <div class="search-form">
        <div class="form-group">
          <label style="display: none" for="searchQuery">查詢條件</label>
          <div class="search-input-group">
            <el-input
              v-model="searchQuery"
              placeholder="搜尋姓名、手機、電話、地址、關係、備註"
              @keyup.enter="handleSearch"
              :disabled="isLoading"
              clearable
              size="large"
            >
            </el-input>

            <!-- 狀態篩選 -->
            <el-select
              v-model="stateFilter"
              placeholder="選擇狀態"
              size="large"
              style="width: 150px"
              clearable
              v-show="false"
            >
              <el-option
                v-for="option in stateOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>

            <!-- 項目類型篩選 -->
            <el-select
              v-model="itemsFilter"
              placeholder="選擇項目類型"
              size="large"
              style="width: 150px"
              clearable
              v-if="false"
            >
              <el-option
                v-for="option in itemTypeOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>

            <el-button
              type="primary"
              @click="handleSearch"
              :loading="isLoading"
              size="large"
              :icon="Search"
            >
              {{ isLoading ? "查詢中..." : "查詢" }}
            </el-button>

            <el-button @click="handleClear" :disabled="isLoading" size="large">
              清空
            </el-button>
          </div>
          <p class="search-hint">
            💡 提示:
            可依項目類型或關鍵字（聯絡人、參加者、地址、備註）搜尋相關記錄
          </p>
        </div>
      </div>
    </div>

    <!-- 調試信息 -->
    <div v-if="isDev" class="debug-panel">
      <h4>🔧 調試信息</h4>
      <hr />
      <div>searchResults.length: {{ searchResults.length }}</div>
      <div>paginatedResults.length: {{ paginatedResults.length }}</div>
      <div>hasSearched: {{ hasSearched }}</div>
      <div>isLoading: {{ isLoading }}</div>
      <div>currentPage: {{ currentPage }}</div>
      <div>pageSize: {{ pageSize }}</div>
      <div>isMobile: {{ isMobile }}</div>
      <div>stateFilter: {{ stateFilter }}</div>
      <div>itemsFilter: {{ itemsFilter }}</div>
    </div>

    <!-- 查詢結果 -->
    <div class="results-section" v-if="searchResults.length > 0">
      <div class="results-header">
        <h3>查詢結果 (共 {{ totalItems }} 筆)</h3>
      </div>

      <!-- 批量操作區 -->
      <div class="batch-actions" v-if="selectedRecords.length > 0">
        <div class="batch-info">
          <span class="selected-count">
            已選擇 <strong>{{ selectedRecords.length }}</strong> 筆記錄
          </span>
          <el-button size="small" @click="clearSelection">取消選擇</el-button>
        </div>
        <div class="batch-controls">
          <el-button
            type="success"
            size="small"
            @click="handleBatchReceiptPrint"
          >
            🖨️ 批量打印
          </el-button>
        </div>
      </div>

      <!-- 查詢列表 -->
      <el-table
        ref="tableRef"
        :data="paginatedResults"
        style="width: 100%"
        :default-sort="{ prop: 'createdAt', order: 'descending' }"
        stripe
        border
        :header-cell-style="{ background: '#f8f9fa', color: '#333' }"
        v-loading="isLoading"
        @selection-change="handleSelectionChange"
      >
        <!-- 多選框 -->
        <el-table-column
          type="selection"
          width="50"
          align="center"
          v-if="false"
        />
        <el-table-column
          v-if="false"
          prop="activityId"
          label="活動ID"
          min-width="50"
          align="center"
        >
          <template #default="{ row }">
            <strong>{{ row.activityId || "-" }}</strong>
          </template>
        </el-table-column>

        <el-table-column
          prop="createdAt"
          label="資料時間"
          width="110"
          sortable
          align="center"
        >
          <template #default="{ row }">
            <el-tooltip :content="row.id" placement="top">
              <span class="date-time">{{
                formatRelativeOrDateTime(row.createdAt)
              }}</span>
            </el-tooltip>
          </template>
        </el-table-column>

        <el-table-column label="聯絡人" min-width="100" align="center">
          <template #default="{ row }">
            <div class="contact-info">
              <div class="contact-name">
                <strong>{{ row.contact?.name || "-" }}</strong>
              </div>
              <div
                class="contact-phone"
                v-if="row.contact?.mobile || row.contact?.phone"
              >
                {{ row.contact?.mobile || row.contact?.phone }}
              </div>
              <div v-if="false" class="contact-relationship">
                {{ row.contact?.relationship }}
                <span
                  v-if="row.contact?.otherRelationship"
                  class="other-relationship"
                >
                  ({{ row.contact.otherRelationship }})
                </span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="參加項目" min-width="120" align="center">
          <template #default="{ row }">
            <div class="items-summary">
              <el-tag
                v-for="(item, index) in row.items"
                :key="index"
                class="stat-badge"
              >
                {{ item.label }} {{ item.quantity }}
              </el-tag>

              <div
                v-if="false"
                v-for="(item, index) in row.items"
                :key="index"
                class="item-tag"
              >
                <div class="item-header">
                  <el-tag class="stat-badge">
                    {{ item.label }} {{ item.quantity }}
                  </el-tag>

                  <!-- <span class="item-label">{{ item.label }}</span>
                  <span class="item-quantity">x{{ item.quantity }}</span> -->
                  <span v-if="false" class="item-amount">{{
                    appConfig.formatCurrency(item.subtotal)
                  }}</span>
                </div>
                <div v-if="false" class="item-address">
                  <!-- <span class="address-label">地址：</span> -->
                  <span v-if="item.sourceAddress" class="address-text">{{
                    item.sourceAddress
                  }}</span>
                </div>
                <div v-if="false" class="item-participants">
                  <!-- <span class="participants-label">參加者：</span> -->
                  <span
                    v-if="item.sourceData && item.sourceData.length > 0"
                    class="participants-list"
                  >
                    {{ getParticipantNames(item.sourceData).join("、") }}
                  </span>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- 備註 -->
        <el-table-column label="備註" min-width="80" align="center">
          <template #default="{ row }">
            <div class="receipt-notes">
              {{ row.notes }}
            </div>
          </template>
        </el-table-column>

        <el-table-column
          prop="totalAmount"
          label="總金額"
          min-width="50"
          align="center"
        >
          <template #default="{ row }">
            <div class="item-amount">
              {{ appConfig.formatCurrency(row.totalAmount) || 0 }}
            </div>
          </template>
        </el-table-column>

        <!-- 佛字第 -->
        <el-table-column label="佛字第 | 經手人" min-width="80" align="center">
          <template #default="{ row }">
            <div class="receipt-number">
              <el-tag
                v-if="row.receiptNumber"
                type="danger"
                size="small"
                style="margin-top: 4px"
              >
                {{ row.receiptNumber || "" }}
              </el-tag>
              <!-- 收據開立者經手人 -->
              <span class="receipt-by" v-if="row.receiptIssuedBy">
                <el-tooltip
                  :content="`經手人：${row.receiptIssuedBy}`"
                  placement="top"
                >
                  📝
                  <el-button type="danger" size="small" circle>
                    {{ row.receiptIssuedBy.substring(1, 2) }}
                  </el-button>
                </el-tooltip>
              </span>
            </div>
          </template>
        </el-table-column>

        <el-table-column
          prop="user_created"
          label="資料人員"
          min-width="50"
          align="center"
        >
          <template #default="{ row }">
            <span class="user-created">{{
              recordUserName(row.user_created)
            }}</span>
          </template>
        </el-table-column>

        <el-table-column
          label="操作"
          min-width="100"
          fixed="right"
          align="center"
        >
          <template #default="{ row }">
            <el-tooltip content="查看詳情" placement="top">
              <el-button type="primary" circle @click="handlePrint(row)">
                👁️
              </el-button>
            </el-tooltip>

            <!-- 需要打印 -->
            <el-tooltip
              content="收據打印"
              placement="top"
              v-if="BoolUtils.normalizeBool(row.needReceipt)"
            >
              <el-button type="success" circle @click="handleReceiptPrint(row)">
                🖨️
              </el-button>
            </el-tooltip>

            <el-tooltip content="刪除記錄" placement="top">
              <el-button type="danger" circle @click="handleDelete(row)">
                🗑️
              </el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分頁控件 - 只在非手機設備顯示 -->
      <div class="pagination" v-if="!isMobile">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="totalItems"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          background
        />
      </div>

      <!-- 手機設備顯示總筆數 -->
      <div class="mobile-total" v-else>
        <el-text type="info" size="small">
          顯示全部 {{ totalItems }} 筆資料
        </el-text>
      </div>
    </div>

    <!-- 載入狀態 -->
    <div class="loading-state" v-if="isLoading && !searchResults.length">
      <el-result icon="info" title="搜尋中">
        <template #extra>
          <el-button type="primary" :loading="true">載入中</el-button>
        </template>
      </el-result>
    </div>

    <!-- 無結果提示 -->
    <div
      class="no-results"
      v-else-if="hasSearched && searchResults.length === 0"
    >
      <el-empty description="查無符合條件的資料">
        <template #image>
          <div class="empty-icon">🔍</div>
        </template>
        <template #description>
          <div class="empty-content">
            <p class="empty-hint">請嘗試:</p>
            <ul class="empty-suggestions">
              <li>檢查關鍵字是否拼寫正確</li>
              <li>調整狀態或項目類型篩選條件</li>
              <li>使用更簡單的關鍵字</li>
            </ul>
          </div>
        </template>
        <el-button type="primary" @click="handleClear">重新搜尋</el-button>
      </el-empty>
    </div>

    <!-- 初始提示 -->
    <div class="initial-state" v-else-if="!hasSearched">
      <el-empty description="請輸入查詢條件開始搜尋">
        <el-button type="primary" @click="handleSearch">查詢所有資料</el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onActivated } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Search } from "@element-plus/icons-vue";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";
import { authService } from "../services/authService";
import { useJoinRecordQueryStore } from "../stores/joinRecordQueryStore.js";
import { usePageStateStore } from "../stores/pageStateStore.js";
import { DateUtils } from "../utils/dateUtils.js";
import { appConfig } from "../config/appConfig.js";
import { BoolUtils } from "../utils/boolUtils.js";

const pageStateStore = usePageStateStore();
const queryStore = useJoinRecordQueryStore();
const isDev = computed(() => authService.getCurrentDev());
const router = useRouter();
const tableRef = ref(null);
const currentAllUsers = computed(() => authService.getCurrentUsers());

// 多選相關
const selectedRecords = ref([]);

// 使用 storeToRefs 保持響應性 - 包含分頁狀態
const {
  searchResults,
  searchQuery,
  isLoading,
  hasSearched,
  currentPage,
  pageSize,
  stateFilter,
  itemsFilter,
  stateOptions,
  itemTypeOptions,
} = storeToRefs(queryStore);

// 取得資料列名稱顯示用
const recordUserName = (recordUserId) => {
  const user = currentAllUsers.value.find((item) => item.id === recordUserId);
  return `${user?.firstName}${user?.lastName}` || "??";
};

// 計算屬性 - 添加防護檢查
const totalItems = computed(() => {
  return Array.isArray(searchResults.value) ? searchResults.value.length : 0;
});

const paginatedResults = computed(() => {
  if (!Array.isArray(searchResults.value) || searchResults.value.length === 0) {
    return [];
  }

  // 如果是手機設備，返回所有結果不分頁
  if (isMobile.value) {
    return searchResults.value;
  }

  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return searchResults.value.slice(start, end);
});

const isMobile = computed(() => {
  return queryStore.isMobile();
});

// 方法
const handleSearch = async () => {
  queryStore.resetPagination();

  const query = searchQuery.value ? searchQuery.value.trim() : "";
  const state = stateFilter.value ? stateFilter.value.trim() : "";
  const items = itemsFilter.value ? itemsFilter.value.trim() : "";

  console.log("開始搜尋參加記錄,查詢條件:", { query, state, items });

  try {
    const queryData = {
      query: query,
      state: state,
      items: items,
    };

    const result = await queryStore.queryJoinRecordData(queryData);
    console.log("查詢結果筆數:", searchResults.value.length);

    if (result.success) {
      if (!result.data || result.data.length === 0) {
        ElMessage.info("查無符合條件的資料");
      } else {
        ElMessage.success(`找到 ${result.data.length} 筆資料`);
      }
    } else {
      ElMessage.error(result.message || "查詢失敗");
    }
  } catch (error) {
    console.error("查詢錯誤:", error);
    ElMessage.error("查詢過程中發生錯誤");
  }
};

const handleClear = () => {
  queryStore.clearSearch();
  queryStore.resetPagination();
};

const handleSizeChange = (newSize) => {
  // 手機設備不需要分頁處理
  if (isMobile.value) return;

  queryStore.setPageSize(newSize);
  queryStore.setCurrentPage(1);
};

const handleCurrentChange = (newPage) => {
  // 手機設備不需要分頁處理
  if (isMobile.value) return;

  queryStore.setCurrentPage(newPage);

  // 可選:滾動到表格頂部
  const tableContainer = document.querySelector(".el-table");
  if (tableContainer) {
    //tableContainer.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

// 列印表單
const handlePrint = (item) => {
  try {
    const recordId = item.id;
    const printData = JSON.stringify(item);
    const isoStr = DateUtils.getCurrentISOTime();

    console.log("準備列印數據:", { recordId, printData });
    ElMessage.info(`準備列印表單: ${recordId}`);

    const printId = `print_join_record_${recordId}`;
    console.log("列印表單 ID:", printId);

    sessionStorage.setItem(printId, printData);
    console.log("儲存列印數據:", {
      printId,
      data: JSON.parse(printData),
    });

    router.push({
      path: "/join-record-print",
      query: {
        print_id: printId,
        print_data: printData,
        iso_str: isoStr,
      },
    });
  } catch (error) {
    console.error("導航到列印頁面失敗:", error);
    ElMessage.error("導航到列印頁面失敗");
  }
};

// 單筆收據打印
const handleReceiptPrint = (item) => {
  try {
    const isoStr = DateUtils.getCurrentISOTime();
    const printData = JSON.stringify(item);
    const printId = `print_receipt_${item.id}`;

    sessionStorage.setItem(printId, printData);

    router.push({
      path: "/join-record-receipt-print",
      query: { print_id: printId, print_data: printData, iso_str: isoStr },
    });
  } catch (error) {
    console.error("導航到收據頁面失敗:", error);
    ElMessage.error("導航到收據頁面失敗");
  }
};

// 批量打印
const handleBatchReceiptPrint = () => {
  if (selectedRecords.value.length === 0) {
    ElMessage.warning("請先選擇要打印的記錄");
    return;
  }

  try {
    const isoStr = DateUtils.getCurrentISOTime();
    const ids = selectedRecords.value.map((r) => r.id).join(",");
    const printDatas = selectedRecords.value.map((r) => r);
    const printId = `print_receipt_ids_${ids}`;

    // 存儲多筆資料
    sessionStorage.setItem(printId, JSON.stringify(printDatas));

    router.push({
      path: "/join-record-receipt-print",
      query: {
        print_id: printId,
        ids: ids,
        iso_str: isoStr,
        is_batch: "true",
      },
    });
  } catch (error) {
    console.error("導航到批量收據頁面失敗:", error);
    ElMessage.error("導航到批量收據頁面失敗");
  }
};

// 選擇變更處理
const handleSelectionChange = (selection) => {
  selectedRecords.value = selection;
};

// 清除選擇
const clearSelection = () => {
  tableRef.value?.clearSelection();
  selectedRecords.value = [];
};

const handleDelete = async (item) => {
  try {
    await ElMessageBox.confirm(
      `確定要刪除記錄ID ${item.id} 嗎？此操作無法復原。`,
      "確認刪除",
      {
        confirmButtonText: "確定刪除",
        //cancelButtonText: "取消",
        type: "warning",
      },
    );

    const result = await queryStore.deleteParticipationRecord(item.id);

    if (result?.success) {
      searchResults.value = searchResults.value.filter(
        (record) => record.id !== item.id,
      );
      queryStore.resetPagination();
      ElMessage.success("✅ 記錄已刪除");
    } else {
      throw new Error(result?.message || "刪除失敗");
    }
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error(error?.message || "刪除失敗");
    }
  }
};

const getStateText = (state) => {
  const statusMap = {
    confirmed: "已確認",
    pending: "待處理",
    cancelled: "已取消",
  };
  return statusMap[state] || state;
};

const getStateTagType = (state) => {
  const typeMap = {
    confirmed: "success",
    pending: "warning",
    cancelled: "danger",
  };
  return typeMap[state] || "info";
};

const formatDateLong = (dateString) => {
  return DateUtils.formatDateLong(dateString);
};
const formatRelativeOrDateTime = (value) =>
  DateUtils.formatRelativeOrDateTime(value);

// 獲取參加者姓名列表
const getParticipantNames = (sourceData) => {
  if (!sourceData || !Array.isArray(sourceData)) return [];

  return sourceData
    .map((item) => {
      // 處理不同的姓名欄位
      if (item.name) return item.name;
      if (item.surname) return `${item.surname}氏`;
      return "未知";
    })
    .filter((name) => name && name !== "未知");
};

// 封裝重新查詢邏輯（可共用）
const refreshIfNeeded = () => {
  const needsRefresh = sessionStorage.getItem("joinRecordListNeedsRefresh");
  if (needsRefresh === "true") {
    sessionStorage.removeItem("joinRecordListNeedsRefresh");
    console.log("偵測到收據打印完成，自動重新查詢...");
    handleSearch();
  }
};

// 如果有用 <keep-alive> 包裹，用 onActivated
// onActivated(() => {
//   refreshIfNeeded();
// });

onMounted(() => {
  console.log("✅ JoinRecordList 組件已載入");
  console.log("清除頁面狀態");
  pageStateStore.clearPageState("joinRecord");
  refreshIfNeeded(); // 加這一行
  console.log("currentAllUsers:", currentAllUsers.value);
});
</script>

<style scoped>
/* 佛字第 | 經手人 */
.receipt-number {
  text-align: right;
}

/* 收據開立者經手人 */
.receipt-by {
  margin-left: 0px;
}
/* 批量操作區 */
.batch-actions {
  margin-top: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px solid #e9ecef;
}

.batch-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.selected-count {
  color: #333;
  font-size: 0.875rem;
}

.selected-count strong {
  color: var(--el-color-primary);
  font-size: 1rem;
}

.batch-controls {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  align-items: center;
}

/* 項目摘要 */
.items-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.stat-badge {
  padding: 4px 8px;
  background: var(--primary-color);
  color: white;
  border-radius: 4px;
  font-size: 0.75rem;
  margin-right: 10px;
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

.search-input-group {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.search-input-group .el-input {
  flex: 1;
  min-width: 200px;
}

.record-icon {
  font-size: 1rem;
  text-align: center;
}

/* 項目列表樣式 */
.items-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.item-tag {
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.item-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.item-label {
  font-weight: 600;
  color: #333;
}

.item-quantity {
  color: #666;
  font-size: 0.75rem;
}

.item-amount {
  color: var(--el-color-primary);
  font-weight: 600;
  margin-left: auto;
  text-align: right;
}

.item-address {
  font-size: 0.75rem;
  color: #666;
  margin-bottom: 0.25rem;
}

.address-label {
  font-weight: 500;
  color: #888;
}

.address-text {
  color: #555;
}

.item-participants {
  font-size: 0.75rem;
  color: #666;
}

.participants-label {
  font-weight: 500;
  color: #888;
}

.participants-list {
  color: #555;
}

/* 聯絡人信息樣式 */
.contact-info {
  text-align: center;
}

.contact-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.25rem;
}

.contact-phone {
  font-size: 0.75rem;
  color: #666;
  margin-bottom: 0.25rem;
}

.contact-relationship {
  font-size: 0.75rem;
  color: #888;
}

.other-relationship {
  color: #666;
  font-style: italic;
  margin-left: 4px;
}

.amount {
  color: var(--el-color-primary);
  font-size: 1rem;
  text-align: right;
}

.date-time {
  font-size: 0.875rem;
  color: #666;
}

/* 分頁 */
.pagination {
  display: flex;
  justify-content: center;
  padding: 1.5rem 0;
}

/* 手機總筆數顯示 */
.mobile-total {
  display: flex;
  justify-content: center;
  padding: 1rem 0;
  color: #666;
  font-size: 0.875rem;
}

/* 空狀態 */
.loading-state,
.no-results,
.initial-state {
  background: white;
  padding: 3rem;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-suggestions {
  text-align: left;
  max-width: 300px;
  margin: 1rem auto;
  list-style: none;
  padding: 0;
}

.empty-suggestions li {
  padding: 0.25rem 0;
  color: #666;
}

.empty-suggestions li::before {
  content: "• ";
  color: var(--el-color-primary);
  font-weight: bold;
  margin-right: 0.5rem;
}

/* 調試面板 */
/* .debug-panel {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  font-family: monospace;
  font-size: 0.875rem;
}

.debug-panel h4 {
  margin: 0 0 0.5rem 0;
  color: #495057;
}

.debug-panel div {
  margin: 0.25rem 0;
  color: #6c757d;
} */

/* 響應式設計 */
@media (max-width: 768px) {
  .results-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .search-input-group {
    flex-direction: column;
  }

  .search-input-group .el-input,
  .search-input-group .el-select,
  .search-input-group .el-button {
    width: 100%;
  }

  .results-section {
    padding: 1rem;
  }

  /* 手機版表格樣式調整 */
  :deep(.el-table) {
    font-size: 0.875rem;
  }

  :deep(.el-table__cell) {
    padding: 8px 4px;
  }

  .items-list {
    max-width: 200px;
  }

  .item-tag {
    padding: 0.25rem;
  }

  .item-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.125rem;
  }

  .contact-info {
    text-align: left;
  }
}

@media (max-width: 480px) {
  /* 極小螢幕優化 */
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
