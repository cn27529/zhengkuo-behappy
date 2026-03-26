<!-- src/views/RegistrationList.vue -->
<template>
  <div class="main-content">
    <div class="page-header">
      <h2>登記查詢</h2>
      <p class="page-subtitle" style="display: none">
        查詢已提交的消災超度報名資料
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
              placeholder="搜尋姓名、手機、電話、地址"
              @keyup.enter="handleSearch"
              :disabled="isLoading"
              clearable
              size="large"
            >
            </el-input>

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
            <el-button
              type="primary"
              @click="handleNewRegistration"
              :icon="Plus"
              size="large"
            >
              祈福登記
            </el-button>
          </div>
          <p class="search-hint">💡 提示:搜尋關鍵字,系統會自動匹配相關欄位</p>
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
      <div>isMoile: {{ isMobile }}</div>
    </div>

    <!-- 查詢結果 -->
    <div class="results-section" v-if="searchResults.length > 0">
      <div class="results-header">
        <h3>查詢結果 (共 {{ totalItems }} 筆)</h3>
      </div>

      <!-- 查詢列表 -->
      <el-table
        :data="paginatedResults"
        style="width: 100%"
        :default-sort="{ prop: 'createdAt', order: 'descending' }"
        stripe
        border
        :header-cell-style="{ background: '#f8f9fa', color: '#333' }"
        v-loading="isLoading"
      >
        <el-table-column
          label="圖標"
          min-width="50"
          align="center"
          v-if="false"
        >
          <template #default="{ row }">
            <div>
              <el-tooltip :content="row.id" placement="top">
                <span class="form-icon">👤</span>
              </el-tooltip>
              <div class="form-name"></div>
            </div>
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

        <el-table-column
          prop="contact.name"
          label="聯絡人"
          min-width="100"
          align="center"
        >
          <template #default="{ row }">
            <strong>{{ row.contact?.name || "-" }}</strong>
          </template>
        </el-table-column>

        <el-table-column prop="contact.mobile" label="手機" min-width="120">
          <template #default="{ row }">
            {{ row.contact?.mobile || "-" }}
          </template>
        </el-table-column>

        <el-table-column prop="contact.phone" label="電話" min-width="120">
          <template #default="{ row }">
            {{ row.contact?.phone || "-" }}
          </template>
        </el-table-column>

        <el-table-column
          prop="contact.relationship"
          label="關係"
          min-width="100"
        >
          <template #default="{ row }">
            <div>
              {{ row.contact?.relationship || "-" }}
              <span
                v-if="row.contact?.otherRelationship"
                class="other-relationship"
              >
                ({{ row.contact.otherRelationship }})
              </span>
            </div>
          </template>
        </el-table-column>

        <el-table-column
          prop="user_created"
          label="資料人員"
          min-width="80"
          align="center"
        >
          <template #default="{ row }">
            <span class="user-created">{{
              recordUserName(row.user_created)
            }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <div class="action-buttons-group">
              <el-tooltip content="查看詳情" placement="top">
                <el-button
                  type="primary"
                  circle
                  @click="handlePrint(row)"
                  size="small"
                >
                  👁️
                </el-button>
              </el-tooltip>

              <el-tooltip content="編輯表單" placement="top">
                <el-button
                  circle
                  @click="handleEdit(row)"
                  type="info"
                  size="small"
                >
                  📝
                </el-button>
              </el-tooltip>

              <el-tooltip content="卡片設計" placement="right">
                <el-button circle @click="handleCardDesign(row)" size="small"
                  >💳</el-button
                >
              </el-tooltip>
            </div>
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
              <li>使用更簡單的關鍵字</li>
              <li>嘗試搜尋部分姓名或地址</li>
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
import { ref, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";
import {
  Refresh,
  Plus,
  Edit,
  Check,
  Delete,
  View,
  Search,
  User,
} from "@element-plus/icons-vue";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";
import { authService } from "../services/authService";
import { useQueryStore } from "../stores/registrationQueryStore.js";
import { usePageStateStore } from "../stores/pageStateStore.js";
import { DateUtils } from "../utils/dateUtils.js";

const pageStateStore = usePageStateStore();
const queryStore = useQueryStore();
const isDev = ref(false);
const router = useRouter();

// 使用 storeToRefs 保持響應性 - 包含分頁狀態
const {
  searchResults,
  searchQuery,
  isLoading,
  hasSearched,
  currentPage,
  pageSize,
} = storeToRefs(queryStore);

// 取得資料列名稱顯示用
const recordUserName = (recordUserId) => {
  const user = currentAllUsers.value.find((item) => item.id === recordUserId);
  return `${user?.firstName}${user?.lastName}` || "??";
};

const currentAllUsers = computed(() => authService.getCurrentUsers());

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
  console.log("開始搜尋,查詢條件:", query);

  try {
    const queryData = {
      query: query,
    };

    const result = await queryStore.queryRegistrationData(queryData);
    console.log("查詢結果筆數:", searchResults.value.length);
    //console.log("searchResults 內容:", searchResults.value);

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

// 將某筆資料傳遞給表單編輯
const handleEdit = async (item) => {
  try {
    console.group("🔧 編輯操作調試信息");
    console.log("1. 開始處理編輯操作", item);

    // 檢查必要的數據
    if (!item.formId) {
      throw new Error("表單ID不存在");
    }

    console.log("2. 準備保存狀態到 Store");
    // 儲存狀態
    const pageState = new Promise(async () => {
      await pageStateStore.setPageState("registration", {
        action: "edit",
        formId: item.formId,
        id: item.id,
        source: "list",
      });
    });
    pageState.then(() => {
      console.log("🚪 3. 頁面狀態重建完成");
    });

    console.log("4. 開始導航到表單頁面");
    console.groupEnd();

    router.push("/registration-edit");
  } catch (error) {
    console.error("❌ 編輯操作失敗:", error);
    ElMessage.error("編輯操作失敗，請重試");
  }
};

// 列印表單
const handlePrint = (item) => {
  try {
    const formId = item.formId;
    const recordId = item.id;
    const printData = JSON.stringify(item);

    console.log("準備列印數據:", { formId, printData });
    ElMessage.info(`準備列印表單: ${formId}`);

    const printId = `print_registration_${recordId}`;
    console.log("列印表單 ID:", printId);

    sessionStorage.setItem(printId, printData);
    console.log("儲存列印數據:", {
      printId,
      data: JSON.parse(printData),
    });

    router.push({
      path: "/registration-print",
      query: {
        print_id: printId,
        print_data: printData,
      },
    });
  } catch (error) {
    console.error("導航到列印頁面失敗:", error);
    ElMessage.error("導航到列印頁面失敗");
  }
};

// 卡片設計
const handleCardDesign = (item) => {
  try {
    console.group("🔧 卡片設計操作調試信息");
    console.log("1. 開始處理卡片設計操作", item);

    // 檢查必要的數據
    if (!item.formId) {
      throw new Error("表單ID不存在");
    }

    console.log("2. 準備保存狀態到 Store");
    // 儲存狀態
    const pageState = new Promise(async () => {
      await pageStateStore.setPageState("registration", {
        action: "edit",
        formId: item.formId,
        id: item.id,
        source: "list",
      });
    });
    pageState.then(() => {
      console.log("🚪 3. 頁面狀態重建完成");
    });

    console.log("4. 開始導航到卡片設計頁面");
    console.groupEnd();
    router.push("/card-design");
  } catch (error) {
    console.error("❌ 卡片設計操作失敗:", error);
    ElMessage.error("卡片設計操作失敗，請重試");
  }
};

const handleNewRegistration = () => {
  router.push("/registration");
};

const getStatusText = (state) => {
  const statusMap = {
    creating: "建立中",
    editing: "編輯中",
    saved: "已儲存",
    submitted: "已提交",
    completed: "已完成",
  };
  return statusMap[state] || state;
};

const formatDateLong = (dateString) => {
  return DateUtils.formatDateLong(dateString);
};
const formatRelativeOrDateTime = (value) =>
  DateUtils.formatRelativeOrDateTime(value);

const truncateAddress = (address) => {
  if (!address) return "-";
  return address.length > 10 ? address.substring(0, 10) + "..." : address;
};

onMounted(() => {
  console.log("✅ RegistrationList 組件已載入");
  console.log("清除頁面狀態");
  pageStateStore.clearPageState("registration");
  //console.log("當前 searchResults:", searchResults.value);
  isDev.value = authService.getCurrentDev();
  //handleSearch();
});
</script>

<style scoped>
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

.search-input-group .el-input {
  flex: 1;
  /* min-width: 300px; */
}

.form-icon {
  font-size: 1rem;
  text-align: center;
}

/* 表單標籤 */
.form-name {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.form-source-tag {
  margin-top: 0.25rem;
}

.other-relationship {
  color: #666;
  font-size: 0.75rem;
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

/* 詳情區域 */
.detail-section {
  margin-bottom: 2rem;
}

.detail-section h4 {
  color: var(--el-color-primary);
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e9ecef;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-item.full-width {
  grid-column: 1 / -1;
}

.detail-item label {
  font-weight: 600;
  color: #333;
  font-size: 0.875rem;
}

.detail-item span {
  color: #666;
}

.persons-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.person-tag {
  background: #f8f9fa;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  border: 1px solid #e9ecef;
}

.household-head-tag {
  border-left: 3px solid var(--el-color-primary);
}

.ancestor-tag {
  background: #e7f3ff;
}

.survivor-tag {
  background: #f0f9ff;
}

.household-head {
  background: var(--el-color-primary);
  color: white;
  padding: 0.125rem 0.5rem;
  border-radius: 50px;
  font-size: 0.75rem;
  margin-left: 0.5rem;
}

.zodiac,
.person-notes,
.ancestor-notes,
.survivor-notes {
  font-size: 0.75rem;
  color: #666;
  margin-left: 0.25rem;
}

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
  .results-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .results-header .el-button {
    width: 100%;
  }

  .search-input-group .el-button {
    width: 100%;
  }

  .results-section {
    padding: 1rem;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  /* 手機版表格樣式調整 */
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
