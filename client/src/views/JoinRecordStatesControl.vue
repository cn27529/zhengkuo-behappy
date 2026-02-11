<!-- src/views/JoinRecordStatesControl.vue -->
<template>
  <div class="main-content">
    <div class="page-header">
      <h2>參加記錄狀態控制台</h2>
      <p class="page-subtitle">統一管理參加記錄的各項狀態</p>
    </div>

    <!-- 查詢區 -->
    <div class="search-section">
      <div class="search-form">
        <div class="form-group">
          <div class="search-input-group">
            <el-input
              v-model="searchQuery"
              placeholder="搜尋姓名、手機、電話、地址、關係、參加項目、備註"
              @keyup.enter="handleSearch"
              :disabled="isLoading"
              clearable
              size="large"
            >
            </el-input>

            <el-select
              v-model="itemsFilter"
              placeholder="選擇項目類型"
              size="large"
              style="width: 150px"
              clearable
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
        </div>
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
          <el-select
            v-model="batchUpdates.state"
            placeholder="批量設定記錄狀態"
            size="small"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="option in stateConfigs.state.options"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>

          <el-select
            v-model="batchUpdates.paymentState"
            placeholder="批量設定付款狀態"
            size="small"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="option in stateConfigs.paymentState.options"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>

          <el-select
            v-model="batchUpdates.receiptIssued"
            placeholder="批量設定收據狀態"
            size="small"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="option in stateConfigs.receiptIssued.options"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>

          <el-select
            v-model="batchUpdates.accountingState"
            placeholder="批量設定會計狀態"
            size="small"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="option in stateConfigs.accountingState.options"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>

          <el-select
            v-model="batchUpdates.paymentMethod"
            placeholder="批量設定付款方式"
            size="small"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="option in stateConfigs.paymentMethod.options"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>

          <el-button
            type="primary"
            size="small"
            @click="handleBatchUpdate"
            :disabled="!hasBatchUpdates"
          >
            批量保存
          </el-button>
        </div>
      </div>
    </div>

    <!-- 查詢結果 -->
    <div class="results-section" v-if="searchResults.length > 0">
      <div class="results-header">
        <h3>查詢結果 (共 {{ totalItems }} 筆)</h3>
      </div>

      <!-- 狀態控制表格 -->
      <el-table
        ref="tableRef"
        :data="paginatedResults"
        style="width: 100%"
        stripe
        border
        :header-cell-style="{ background: '#f8f9fa', color: '#333' }"
        v-loading="isLoading"
        @selection-change="handleSelectionChange"
      >
        <!-- 多選框 -->
        <el-table-column type="selection" width="55" align="center" />

        <!-- 記錄ID -->
        <el-table-column
          prop="id"
          label="記錄ID"
          width="80"
          align="center"
          fixed
        >
          <template #default="{ row }">
            <strong>{{ row.id }}</strong>
          </template>
        </el-table-column>

        <!-- 活動ID -->
        <el-table-column
          prop="activityId"
          label="活動ID"
          width="80"
          align="center"
        >
          <template #default="{ row }">
            <span>{{ row.activityId || "-" }}</span>
          </template>
        </el-table-column>

        <!-- 聯絡人 -->
        <el-table-column label="聯絡人" width="120" align="center">
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
            </div>
          </template>
        </el-table-column>

        <!-- 參加項目 -->
        <el-table-column label="參加項目" min-width="200">
          <template #default="{ row }">
            <div class="items-summary">
              <el-tag
                v-for="(item, index) in row.items"
                :key="index"
                size="small"
                style="margin: 2px"
              >
                {{ item.label }} x{{ item.quantity }}
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <!-- 記錄狀態 -->
        <el-table-column label="記錄狀態" width="130" align="center">
          <template #default="{ row }">
            <el-select
              v-model="row.state"
              size="small"
              @change="markAsModified(row.id, 'state')"
            >
              <el-option
                v-for="option in stateConfigs.state.options"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </template>
        </el-table-column>

        <!-- 付款狀態 -->
        <el-table-column label="付款狀態" width="130" align="center">
          <template #default="{ row }">
            <el-select
              v-model="row.paymentState"
              size="small"
              @change="markAsModified(row.id, 'paymentState')"
            >
              <el-option
                v-for="option in stateConfigs.paymentState.options"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </template>
        </el-table-column>

        <!-- 收據狀態 -->
        <el-table-column label="收據狀態" width="130" align="center">
          <template #default="{ row }">
            <el-select
              v-model="row.receiptIssued"
              size="small"
              @change="markAsModified(row.id, 'receiptIssued')"
            >
              <el-option
                v-for="option in stateConfigs.receiptIssued.options"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </template>
        </el-table-column>

        <!-- 會計狀態 -->
        <el-table-column label="會計狀態" width="130" align="center">
          <template #default="{ row }">
            <el-select
              v-model="row.accountingState"
              size="small"
              @change="markAsModified(row.id, 'accountingState')"
            >
              <el-option
                v-for="option in stateConfigs.accountingState.options"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </template>
        </el-table-column>

        <!-- 付款方式 -->
        <el-table-column label="付款方式" width="130" align="center">
          <template #default="{ row }">
            <el-select
              v-model="row.paymentMethod"
              size="small"
              @change="markAsModified(row.id, 'paymentMethod')"
            >
              <el-option
                v-for="option in stateConfigs.paymentMethod.options"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </template>
        </el-table-column>

        <!-- 操作 -->
        <el-table-column label="操作" width="100" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="handleSaveSingle(row)"
              :disabled="!isModified(row.id)"
            >
              {{ isModified(row.id) ? "保存" : "已保存" }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分頁控件 -->
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

    <!-- 初始提示 -->
    <div class="initial-state" v-else-if="!hasSearched">
      <el-empty description="請輸入查詢條件開始搜尋">
        <el-button type="primary" @click="handleSearch">查詢所有資料</el-button>
      </el-empty>
    </div>

    <!-- 無結果提示 -->
    <div
      class="no-results"
      v-else-if="hasSearched && searchResults.length === 0"
    >
      <el-empty description="查無符合條件的資料">
        <el-button type="primary" @click="handleClear">重新搜尋</el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Search } from "@element-plus/icons-vue";
import { storeToRefs } from "pinia";
import { useJoinRecordQueryStore } from "../stores/joinRecordQueryStore.js";

const queryStore = useJoinRecordQueryStore();
const tableRef = ref(null);

// 使用 storeToRefs 保持響應性
const {
  searchResults,
  searchQuery,
  isLoading,
  hasSearched,
  currentPage,
  pageSize,
  itemsFilter,
  itemTypeOptions,
  stateConfigs,
} = storeToRefs(queryStore);

// 本地狀態
const selectedRecords = ref([]);
const modifiedRecords = ref(new Set());
const batchUpdates = ref({
  state: "",
  paymentState: "",
  receiptIssued: "",
  accountingState: "",
  paymentMethod: "",
});

// 計算屬性
const totalItems = computed(() => {
  return Array.isArray(searchResults.value) ? searchResults.value.length : 0;
});

const paginatedResults = computed(() => {
  if (!Array.isArray(searchResults.value) || searchResults.value.length === 0) {
    return [];
  }

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

const hasBatchUpdates = computed(() => {
  return Object.values(batchUpdates.value).some((v) => v !== "" && v !== null);
});

// 方法
const handleSearch = async () => {
  queryStore.resetPagination();
  modifiedRecords.value.clear();

  const query = searchQuery.value ? searchQuery.value.trim() : "";
  const items = itemsFilter.value ? itemsFilter.value.trim() : "";

  try {
    const queryData = {
      query: query,
      state: "",
      items: items,
    };

    const result = await queryStore.queryJoinRecordData(queryData);

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
  selectedRecords.value = [];
  modifiedRecords.value.clear();
  clearBatchUpdates();
};

const handleSizeChange = (newSize) => {
  if (isMobile.value) return;
  queryStore.setPageSize(newSize);
  queryStore.setCurrentPage(1);
};

const handleCurrentChange = (newPage) => {
  if (isMobile.value) return;
  queryStore.setCurrentPage(newPage);
};

// 選擇變更處理
const handleSelectionChange = (selection) => {
  selectedRecords.value = selection;
};

const clearSelection = () => {
  tableRef.value?.clearSelection();
  selectedRecords.value = [];
};

// 標記為已修改
const markAsModified = (recordId, field) => {
  modifiedRecords.value.add(recordId);
  console.log(`記錄 ${recordId} 的 ${field} 已修改`);
};

// 檢查是否已修改
const isModified = (recordId) => {
  return modifiedRecords.value.has(recordId);
};

// 保存單筆記錄
const handleSaveSingle = async (row) => {
  try {
    const updates = {
      state: row.state,
      paymentState: row.paymentState,
      receiptIssued: row.receiptIssued,
      accountingState: row.accountingState,
      paymentMethod: row.paymentMethod,
    };

    const result = await queryStore.updateRecordStates(row.id, updates);

    if (result.success) {
      modifiedRecords.value.delete(row.id);
      ElMessage.success(`記錄 ${row.id} 更新成功`);
    } else {
      ElMessage.error(result.message || "更新失敗");
    }
  } catch (error) {
    console.error("保存失敗:", error);
    ElMessage.error("保存過程中發生錯誤");
  }
};

// 批量更新
const handleBatchUpdate = async () => {
  if (selectedRecords.value.length === 0) {
    ElMessage.warning("請先選擇要更新的記錄");
    return;
  }

  if (!hasBatchUpdates.value) {
    ElMessage.warning("請至少選擇一個要更新的狀態");
    return;
  }

  try {
    await ElMessageBox.confirm(
      `確定要批量更新 ${selectedRecords.value.length} 筆記錄嗎？`,
      "確認批量更新",
      {
        confirmButtonText: "確定更新",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    // 過濾掉空值
    const updates = {};
    Object.keys(batchUpdates.value).forEach((key) => {
      if (batchUpdates.value[key] !== "" && batchUpdates.value[key] !== null) {
        updates[key] = batchUpdates.value[key];
      }
    });

    const recordIds = selectedRecords.value.map((r) => r.id);
    const result = await queryStore.batchUpdateRecordStates(recordIds, updates);

    if (result.success) {
      // 清除修改標記
      recordIds.forEach((id) => modifiedRecords.value.delete(id));
      clearSelection();
      clearBatchUpdates();
      ElMessage.success(result.message || "批量更新成功");
    } else {
      ElMessage.error(result.message || "批量更新失敗");
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("批量更新失敗:", error);
      ElMessage.error("批量更新過程中發生錯誤");
    }
  }
};

// 清空批量更新選項
const clearBatchUpdates = () => {
  batchUpdates.value = {
    state: "",
    paymentState: "",
    receiptIssued: "",
    accountingState: "",
    paymentMethod: "",
  };
};
</script>

<style scoped>
.page-subtitle {
  color: #666;
  margin-top: 0.5rem;
}

.search-section {
  background: white;
  padding: 1.5rem;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
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

/* 結果區 */
.results-section {
  background: white;
  padding: 1.5rem;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.results-header h3 {
  margin: 0;
  color: #333;
}

/* 聯絡人信息 */
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
}

/* 項目摘要 */
.items-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

/* 分頁 */
.pagination {
  display: flex;
  justify-content: center;
  padding: 1.5rem 0;
}

.mobile-total {
  display: flex;
  justify-content: center;
  padding: 1rem 0;
  color: #666;
  font-size: 0.875rem;
}

/* 空狀態 */
.initial-state,
.no-results {
  background: white;
  padding: 3rem;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

/* 響應式設計 */
@media (max-width: 768px) {
  .search-input-group {
    flex-direction: column;
  }

  .search-input-group .el-input,
  .search-input-group .el-select,
  .search-input-group .el-button {
    width: 100%;
  }

  .batch-controls {
    flex-direction: column;
  }

  .batch-controls .el-select,
  .batch-controls .el-button {
    width: 100%;
  }

  :deep(.el-table) {
    font-size: 0.875rem;
  }

  :deep(.el-table__cell) {
    padding: 8px 4px;
  }
}
</style>
