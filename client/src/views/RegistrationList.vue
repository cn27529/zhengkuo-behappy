<!-- src/views/RegistrationList.vue -->
<template>
  <div class="main-content">
    <div class="page-header">
      <h2>消災超度登記查詢</h2>
      <p class="page-subtitle" style="display: none">
        查詢已提交的消災超度報名資料
      </p>
    </div>

    <!-- 查詢表單 -->
    <div class="search-section">
      <div class="search-form">
        <div class="form-group">
          <label style="display: none" for="searchQuery">查詢條件</label>
          <div class="search-input-group">
            <el-input
              v-model="searchQuery"
              placeholder="表單名、聯絡人、手機、電話、消災人員、地址、陽上人"
              @keyup.enter="handleSearch"
              :disabled="isLoading"
              clearable
              size="large"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>

            <el-button
              type="primary"
              @click="handleSearch"
              :loading="isLoading"
              size="large"
            >
              {{ isLoading ? "查詢中..." : "查詢" }}
            </el-button>

            <el-button @click="handleClear" :disabled="isLoading" size="large">
              清空
            </el-button>
          </div>
          <p class="search-hint">💡 提示:搜尋關鍵字,系統會自動匹配相關欄位</p>
        </div>
      </div>
    </div>

    <!-- 在查詢表單後面添加調試信息 -->
    <div
      v-if="isDev"
      class="debug-info"
      style="
        background: #f8f9fa;
        padding: 10px;
        margin: 10px 0;
        border-radius: 4px;
        font-size: 12px;
      "
    >
      <div>調試信息:</div>
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

      <!-- Element Plus 表格 -->
      <el-table
        :data="paginatedResults"
        style="width: 100%"
        :default-sort="{ prop: 'createdAt', order: 'descending' }"
        stripe
        border
        :header-cell-style="{ background: '#f8f9fa', color: '#333' }"
        v-loading="isLoading"
      >
        <el-table-column label="表單資訊" min-width="150">
          <template #default="{ row }">
            <div>
              <div class="form-name">{{ row.formId }}</div>
              <el-tag size="small" type="info" class="form-source-tag">
                {{ row.formSource }}
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="contact.name" label="聯絡人" min-width="100">
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
          prop="createdAt"
          label="建立時間"
          min-width="150"
          sortable
        >
          <template #default="{ row }">
            <span class="date-time">{{ formatDate(row.createdAt) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="100" fixed="right" align="center">
          <template #default="{ row }">
            <el-tooltip content="列印表單" placement="top">
              <el-button
                type="primary"
                :icon="Printer"
                circle
                @click="handlePrintPage(row)"
              />
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

    <!-- 詳情資訊彈窗 -->
    <el-dialog
      v-model="showModal"
      :title="`表單詳情資訊 - ${selectedItem?.contact?.name || ''}`"
      width="70%"
      class="modal-header"
      :close-on-click-modal="false"
    >
      <div class="modal-body" v-if="selectedItem">
        <!-- 詳細資訊內容 -->
        <div style="display: none" class="detail-section">
          <h4>基本資訊</h4>
          <div class="detail-grid">
            <div class="detail-item">
              <label>表單名稱:</label>
              <span>{{ selectedItem.formName }}</span>
            </div>
            <div class="detail-item">
              <label>狀態:</label>
              <span class="status-badge" :class="selectedItem.state">
                {{ getStatusText(selectedItem.state) }}
              </span>
            </div>
            <div class="detail-item">
              <label>建立時間:</label>
              <span>{{ formatDate(selectedItem.createdAt) }}</span>
            </div>
            <div class="detail-item">
              <label>更新時間:</label>
              <span>{{ formatDate(selectedItem.updatedAt) }}</span>
            </div>
            <div class="detail-item">
              <label>來源:</label>
              <span>{{ selectedItem.formSource || "-" }}</span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h4>聯絡人資訊</h4>
          <div class="detail-grid">
            <div class="detail-item">
              <label>姓名:</label>
              <span>{{ selectedItem.contact?.name || "-" }}</span>
            </div>
            <div class="detail-item">
              <label>手機:</label>
              <span>{{ selectedItem.contact?.mobile || "-" }}</span>
            </div>
            <div class="detail-item">
              <label>電話:</label>
              <span>{{ selectedItem.contact?.phone || "-" }}</span>
            </div>
            <div class="detail-item">
              <label>關係:</label>
              <span>
                {{ selectedItem.contact?.relationship || "-" }}
                <span v-if="selectedItem.contact?.otherRelationship">
                  ({{ selectedItem.contact.otherRelationship }})
                </span>
              </span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h4>消災祈福</h4>
          <div class="detail-item full-width">
            <label>地址:</label>
            <span>{{ selectedItem.blessing?.address || "-" }}</span>
          </div>
          <div class="detail-item full-width">
            <label
              >消災人員 ({{
                selectedItem.blessing?.persons?.length || 0
              }}
              位):</label
            >
            <div class="persons-list">
              <div
                v-for="person in selectedItem.blessing?.persons || []"
                :key="person.id"
                class="person-tag"
                :class="{ 'household-head-tag': person.isHouseholdHead }"
              >
                {{ person.name || "未填寫" }}
                <span v-if="person.zodiac" class="zodiac"
                  >({{ person.zodiac }})</span
                >
                <span v-if="person.isHouseholdHead" class="household-head"
                  >戶長</span
                >
                <span v-if="person.notes" class="person-notes">{{
                  person.notes
                }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h4>超度祈福</h4>
          <div class="detail-item full-width">
            <label>地址:</label>
            <span>{{ selectedItem.salvation?.address || "-" }}</span>
          </div>
          <div class="detail-item full-width">
            <label
              >祖先 ({{
                selectedItem.salvation?.ancestors?.length || 0
              }}
              位):</label
            >
            <div class="persons-list">
              <div
                v-for="ancestor in selectedItem.salvation?.ancestors || []"
                :key="ancestor.id"
                class="person-tag ancestor-tag"
              >
                {{ ancestor.surname || "未填寫" }}氏歷代祖先
                <span v-if="ancestor.notes" class="ancestor-notes"
                  >({{ ancestor.notes }})</span
                >
              </div>
            </div>
          </div>
          <div class="detail-item full-width">
            <label
              >陽上人 ({{
                selectedItem.salvation?.survivors?.length || 0
              }}
              位):</label
            >
            <div class="persons-list">
              <div
                v-for="survivor in selectedItem.salvation?.survivors || []"
                :key="survivor.id"
                class="person-tag survivor-tag"
              >
                {{ survivor.name || "未填寫" }}
                <span v-if="survivor.zodiac" class="zodiac"
                  >({{ survivor.zodiac }})</span
                >
                <span v-if="survivor.notes" class="survivor-notes">{{
                  survivor.notes
                }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeModal">關閉</el-button>
          <el-button
            type="primary"
            :icon="Printer"
            @click="handlePrintPage(selectedItem)"
            v-if="selectedItem"
          >
            列印表單
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { Search, Printer } from "@element-plus/icons-vue";
import { storeToRefs } from "pinia";
import { authService } from "../services/authService";
import { useQueryStore } from "../stores/queryStore.js";
import { useRouter } from "vue-router";

export default {
  name: "RegistrationList",
  setup() {
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

    // 本地狀態
    const selectedItem = ref(null);
    const showModal = ref(false);

    // 計算屬性 - 添加防護檢查
    const totalItems = computed(() => {
      return Array.isArray(searchResults.value)
        ? searchResults.value.length
        : 0;
    });

    const paginatedResults = computed(() => {
      if (
        !Array.isArray(searchResults.value) ||
        searchResults.value.length === 0
      ) {
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
        console.log("Store 查詢完成,結果數量:", searchResults.value.length);
        console.log("searchResults 內容:", searchResults.value);

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

    const viewDetails = (item) => {
      selectedItem.value = item;
      showModal.value = true;
    };

    const closeModal = () => {
      showModal.value = false;
      selectedItem.value = null;
    };

    const handlePrintPage = (item) => {
      try {
        const formId = item.formId;
        const printData = JSON.stringify(item);

        console.log("準備列印數據:", { formId, printData });
        ElMessage.info(`準備列印表單: ${formId}`);

        const printId = `print_form_${formId}_${Math.floor(
          Math.random() * 1000
        )}`;
        console.log("列印表單 ID:", printId);

        sessionStorage.setItem(printId, printData);
        console.log("儲存列印數據:", {
          printId,
          data: JSON.parse(printData),
        });

        router.push({
          path: "/print-registration",
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

    const formatDate = (dateString) => {
      if (!dateString) return "-";
      try {
        const date = new Date(dateString);
        return date.toLocaleString("zh-TW", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch {
        return dateString;
      }
    };

    const truncateAddress = (address) => {
      if (!address) return "-";
      return address.length > 10 ? address.substring(0, 10) + "..." : address;
    };

    // 初始化
    onMounted(() => {
      console.log("RegistrationList 組件已載入");
      console.log("當前 searchResults:", searchResults.value);
      isDev.value = authService.getCurrentDev();
    });

    return {
      // 響應式數據(來自 Store)
      searchQuery,
      searchResults,
      isLoading,
      hasSearched,
      currentPage,
      pageSize,

      // 本地狀態
      selectedItem,
      showModal,

      // 計算屬性
      totalItems,
      paginatedResults,
      isDev,
      isMobile,

      // 方法
      handleSearch,
      handleClear,
      handleSizeChange,
      handleCurrentChange,
      viewDetails,
      closeModal,
      handlePrintPage,
      getStatusText,
      formatDate,
      truncateAddress,

      // Icons
      Search,
      Printer,
    };
  },
};
</script>

<style scoped>
/* 主要容器樣式 */
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

/* 搜尋區域 */
.search-section {
  background: white;
  padding: 1.5rem;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.search-input-group {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.search-hint {
  margin-top: 0.5rem;
  color: #666;
  font-size: 0.875rem;
}

/* 結果區域 */
.results-section {
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  padding: 1.5rem;
}

.results-header {
  margin-bottom: 1rem;
}

.results-header h3 {
  margin: 0;
  color: #333;
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

/* 響應式設計 */
@media (max-width: 768px) {
  .main-content {
    padding: 0.5rem;
  }

  .search-section {
    padding: 1rem;
  }

  .search-input-group {
    flex-direction: column;
  }

  .search-input-group .el-input {
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
