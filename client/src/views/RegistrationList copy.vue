<!-- src/views/RegistrationList.vue -->
<template>
  <div class="main-content">
    <div class="page-header">
      <h2>消災超度登記查詢</h2>
      <p class="page-subtitle" style="display: none;">查詢已提交的消災超度報名資料</p>
    </div>

    <!-- 查詢表單 -->
    <div class="search-section">
      <div class="search-form">
        <div class="form-group">
          <label style="display: none;" for="searchQuery">查詢條件</label>
          <div class="search-input-group">
            <input
              type="text"
              id="searchQuery"
              v-model="searchQuery"
              placeholder="表單名、聯絡人、手機、電話、消災人員、地址、陽上人"
              @keyup.enter="handleSearch"
              autocomplete="off"
            />
            <button
              type="button"
              class="btn btn-primary"
              @click="handleSearch"
              :disabled="searching"
            >
              {{ searching ? "查詢中..." : "查詢" }}
            </button>
            <button
              type="button"
              class="btn btn-outline"
              @click="handleClear"
              :disabled="searching">
              清空
            </button>
          </div>
          <p class="search-hint">
            💡 提示：搜尋關鍵字，系統會自動匹配相關欄位
          </p>
        </div>
      </div>
    </div>

    <!-- 查詢結果 -->
    <div class="results-section" v-if="searchResults.length > 0">
      <div class="results-header">
        <h3>查詢結果 (共 {{ totalItems }} 筆)</h3>
        
        <!-- 分頁控件 -->
        <div class="pagination" v-if="totalPages > 1">
          <div class="pagination-controls">
            <button
              class="pagination-btn"
              :disabled="currentPage === 1"
              @click="changePage(currentPage - 1)"
            >
              ←
            </button>

            <div class="page-numbers">
              <button
                v-for="page in visiblePages"
                :key="page"
                class="page-number"
                :class="{ active: page === currentPage }"
                @click="changePage(page)"
                :disabled="page === '...'"
              >
                {{ page }}
              </button>
            </div>

            <button
              class="pagination-btn"
              :disabled="currentPage === totalPages"
              @click="changePage(currentPage + 1)"
            >
              →
            </button>
          </div>

          <div class="pagination-info">
            <span>第 {{ currentPage }} 頁 / 共 {{ totalPages }} 頁</span>
            <span class="page-size-selector">
              <select v-model="pageSize" @change="handlePageSizeChange">
                <option value="10">10 筆</option>
                <option value="20">20 筆</option>
                <option value="50">50 筆</option>
                <option value="100">100 筆</option>
              </select>
            </span>
          </div>
        </div>

        <div style="display: none;" class="results-info">
          <span>顯示第 {{ startItem }} - {{ endItem }} 筆</span>
          <span class="results-summary">
            找到 {{ totalItems }} 筆符合「<strong>{{ lastSearchQuery }}</strong
            >」的資料
          </span>
        </div>
      </div>

      <!-- 資料表格 -->
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th style="display: none;">表單名稱</th>
              <th>聯絡人</th>
              <th>手機、電話</th>
              <th style="display: none;">關係</th>
              <th style="display: none;">超度地址</th>
              <th style="display: none;">狀態</th>
              <th>消災人員</th>
              <th>陽上人</th>
              <th>建立時間</th>
              <th style="text-align: center;">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in paginatedResults" :key="item.formName">
              <td style="display: none;">
                <span class="form-name">{{ item.formName }}</span>
                <br />
                <small class="form-source">{{ item.formSource }}</small>
              </td>
              <td>
                <strong>{{ item.contact.name }}</strong>
              </td>
              <td>
                <div>{{ item.contact.mobile || "-" }}</div>
                <div>{{ item.contact.phone || "-" }}</div>
              </td>
              <td style="display: none;">
                <span class="relationship">
                  {{ item.contact.relationship }}
                  <span
                    v-if="item.contact.otherRelationship"
                    class="other-relationship"
                  >
                    ({{ item.contact.otherRelationship }})
                  </span>
                </span>
              </td>
              <td style="display: none;">
                <div class="address-truncate" :title="item.salvation.address">
                  {{ truncateAddress(item.salvation.address) }}
                </div>
              </td>
              <td style="display: none;">
                <span class="status-badge" :class="item.state">
                  {{ getStatusText(item.state) }}
                </span>
              </td>
              <td>
                <div class="address-truncate" :title="item.blessing.address">
                  {{ truncateAddress(item.blessing.address) }}
                </div>
                <div v-for="person in item.blessing.persons" :key="person.id">
                  <p v-if="person.name">
                    {{ person.name }}({{ person.zodiac }})
                  </p>
                </div>
              </td>
              <td>
                 <div v-for="survivor in item.salvation.survivors" :key="survivor.id">
                  <p v-if="survivor.name">
                    {{ survivor.name }}({{ survivor.zodiac }})
                  </p>
                </div>
              </td>
              <td>
                <span class="date-time">{{ formatDate(item.createdAt) }}</span>
              </td>
              <td>
                <div class="action-buttons">
                  <button
                    type="button"
                    class="btn btn-outline btn-sm"
                    @click="viewDetails(item)"
                  >
                    詳情
                  </button>
                  <button style="display: none;"
                    type="button"
                    class="btn btn-outline btn-sm"
                    @click="handlePrint(item)"
                    title="列印表單"
                  >
                    🖨️
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      
    </div>

    <!-- 分頁控件 -->
    <div class="pagination" v-if="totalPages > 1">
        <div class="pagination-controls">
          <button
            class="pagination-btn"
            :disabled="currentPage === 1"
            @click="changePage(currentPage - 1)"
          >
            ←
          </button>

          <div class="page-numbers">
            <button
              v-for="page in visiblePages"
              :key="page"
              class="page-number"
              :class="{ active: page === currentPage }"
              @click="changePage(page)"
              :disabled="page === '...'"
            >
              {{ page }}
            </button>
          </div>

          <button
            class="pagination-btn"
            :disabled="currentPage === totalPages"
            @click="changePage(currentPage + 1)"
          >
            →
          </button>
        </div>

        <div class="pagination-info">
          <span>第 {{ currentPage }} 頁 / 共 {{ totalPages }} 頁</span>
          <span class="page-size-selector">
            <select v-model="pageSize" @change="handlePageSizeChange">
              <option value="10">10 筆</option>
              <option value="20">20 筆</option>
              <option value="50">50 筆</option>
              <option value="100">100 筆</option>
            </select>
          </span>
        </div>
    </div>

    <!-- 載入狀態 -->
    <div class="loading-state" v-if="searching">
      <div class="loading-spinner"></div>
      <p>搜尋中...</p>
    </div>

    <!-- 無結果提示 -->
    <div
      class="no-results" v-else-if="hasSearched && searchResults.length === 0">
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <h4>查無符合條件的資料</h4>
        <p class="empty-hint">請嘗試：</p>
        <ul class="empty-suggestions">
          <li>檢查關鍵字是否拼寫正確</li>
          <li>使用更簡單的關鍵字</li>
          <li>嘗試搜尋部分姓名或地址</li>
        </ul>
        <button class="btn btn-outline" @click="handleClear">重新搜尋</button>
      </div>
    </div>

    <!-- 詳情資訊彈窗 -->
    <div v-if="selectedItem" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>表單詳情資訊 - {{ selectedItem.formName }}</h3>
          <button class="modal-close" @click="closeModal">×</button>
        </div>
        <div class="modal-body">
          <!-- 詳細資訊內容保持不變 -->
          <div class="detail-section">
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
                <span>{{ selectedItem.formSource }}</span>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h4>聯絡人資訊</h4>
            <div class="detail-grid">
              <div class="detail-item">
                <label>姓名:</label>
                <span>{{ selectedItem.contact.name }}</span>
              </div>
              <div class="detail-item">
                <label>手機:</label>
                <span>{{ selectedItem.contact.mobile || "-" }}</span>
              </div>
              <div class="detail-item">
                <label>電話:</label>
                <span>{{ selectedItem.contact.phone || "-" }}</span>
              </div>
              <div class="detail-item">
                <label>關係:</label>
                <span>
                  {{ selectedItem.contact.relationship }}
                  <span v-if="selectedItem.contact.otherRelationship">
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
              <span>{{ selectedItem.blessing.address }}</span>
            </div>
            <div class="detail-item full-width">
              <label
                >消災人員 ({{
                  selectedItem.blessing.persons.length
                }}
                位):</label
              >
              <div class="persons-list">
                <div
                  v-for="person in selectedItem.blessing.persons"
                  :key="person.id"
                  class="person-tag"
                  :class="{ 'household-head-tag': person.isHouseholdHead }"
                >
                  {{ person.name }}
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
              <span>{{ selectedItem.salvation.address }}</span>
            </div>
            <div class="detail-item full-width">
              <label
                >祖先 ({{ selectedItem.salvation.ancestors.length }} 位):</label
              >
              <div class="persons-list">
                <div
                  v-for="ancestor in selectedItem.salvation.ancestors"
                  :key="ancestor.id"
                  class="person-tag ancestor-tag"
                >
                  {{ ancestor.surname }}氏歷代祖先
                  <span v-if="ancestor.notes" class="ancestor-notes"
                    >({{ ancestor.notes }})</span
                  >
                </div>
              </div>
            </div>
            <div class="detail-item full-width">
              <label
                >陽上人 ({{
                  selectedItem.salvation.survivors.length
                }}
                位):</label
              >
              <div class="persons-list">
                <div
                  v-for="survivor in selectedItem.salvation.survivors"
                  :key="survivor.id"
                  class="person-tag survivor-tag"
                >
                  {{ survivor.name }}
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
        <div class="modal-footer">
          <button class="btn btn-outline" @click="handlePrint(selectedItem)">
            🖨️ 列印表單
          </button>
          <button class="btn btn-primary" @click="closeModal">關閉</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";
//import { useRegistrationStore } from "../stores/registrationStore.js";
import { useQueryStore } from "../stores/queryStore.js";

export default {
  name: "RegistrationList",
  setup() {
    const registrationStore = useRegistrationStore();
    const queryStore = useQueryStore();
    // 響應式數據
    const searchQuery = ref("");
    const searchResults = ref([]);
    const searching = ref(false);
    const hasSearched = ref(false);
    const selectedItem = ref(null);
    const currentPage = ref(1);
    const pageSize = ref(10);
    const lastSearchQuery = ref("");

    // 計算屬性
    const totalItems = computed(() => searchResults.value.length);
    const totalPages = computed(() =>
      Math.ceil(totalItems.value / pageSize.value)
    );
    const startItem = computed(
      () => (currentPage.value - 1) * pageSize.value + 1
    );
    const endItem = computed(() => {
      const end = currentPage.value * pageSize.value;
      return end > totalItems.value ? totalItems.value : end;
    });

    const paginatedResults = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value;
      const end = start + pageSize.value;
      return searchResults.value.slice(start, end);
    });

    const visiblePages = computed(() => {
      const pages = [];
      const maxVisible = 5;

      if (totalPages.value <= maxVisible) {
        for (let i = 1; i <= totalPages.value; i++) {
          pages.push(i);
        }
      } else {
        const start = Math.max(1, currentPage.value - 2);
        const end = Math.min(totalPages.value, start + maxVisible - 1);

        if (start > 1) {
          pages.push(1);
          if (start > 2) pages.push("...");
        }

        for (let i = start; i <= end; i++) {
          pages.push(i);
        }

        if (end < totalPages.value) {
          if (end < totalPages.value - 1) pages.push("...");
          pages.push(totalPages.value);
        }
      }

      return pages;
    });

    // 方法
    const handleSearch = async () => {
      // if (!searchQuery.value.trim()) {
      //   ElMessage.warning("請輸入查詢條件");
      //   return;
      // }

      handleClear();


      searching.value = true;
      hasSearched.value = true;
      lastSearchQuery.value = searchQuery.value.trim();

      try {
        const queryData = {
          query: searchQuery.value.trim(),
          pageSize: pageSize.value,
        };

        const result = await queryStore.queryRegistrationData(queryData);

        if (result.success) {
          searchResults.value = result.data || [];

          console.log("查詢結果:", searchResults.value);

          currentPage.value = 1; // 重置到第一頁

          if (searchResults.value.length === 0) {
            ElMessage.info("查無符合條件的資料");
          } else {
            ElMessage.success(`找到 ${searchResults.value.length} 筆資料`);
          }
        } else {
          ElMessage.error(result.message || "查詢失敗");
          searchResults.value = [];
        }
      } catch (error) {
        console.error("查詢錯誤:", error);
        ElMessage.error("查詢過程中發生錯誤");
        searchResults.value = [];
      } finally {
        searching.value = false;
      }
    };

    const handleClear = () => {
      //searchQuery.value = "";
      searchResults.value = [];
      hasSearched.value = false;
      currentPage.value = 1;
      lastSearchQuery.value = "";
      console.log('✅ 狀態已清除，準備新查詢');
    };

    const changePage = (page) => {
      if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page;
        // 滾動到頂部
        //window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };

    const handlePageSizeChange = () => {
      currentPage.value = 1;
      if (hasSearched.value && searchResults.value.length > 0) {
        // 如果已經有搜尋結果，重新整理分頁
        // 這裡可以選擇是否要重新搜尋，或者只是重新分頁
      }
    };

    const viewDetails = (item) => {
      selectedItem.value = item;
    };

    const closeModal = () => {
      selectedItem.value = null;
    };

    const handlePrint = (item) => {
      // 這裡可以實現列印功能
      ElMessage.info(`準備列印表單: ${item.formName}`);
      console.log("列印表單:", item);
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
      // 可以在這裡載入預設資料或進行其他初始化操作

      // 示例：載入一些初始資料進行展示（可選）
      loadInitialData();
    });

    // 可選的初始化資料載入
    const loadInitialData = async () => {
      try {
        const result = await queryStore.queryRegistrationData({});
        if (result.success) {
          searchResults.value = result.data || [];
          console.log("初始資料載入完成", searchResults.value);
          hasSearched.value = true;
        } else {
          console.error("初始資料載入失敗:", result.message);
          searchResults.value = [];
        }
      } catch (error) {
        console.error("初始資料載入錯誤:", error);
        searchResults.value = [];
      }
    };

    return {
      // 響應式數據
      searchQuery,
      searchResults,
      searching,
      hasSearched,
      selectedItem,
      currentPage,
      pageSize,
      lastSearchQuery,
      
      // 計算屬性
      totalItems,
      totalPages,
      startItem,
      endItem,
      paginatedResults,
      visiblePages,

      // 方法
      handleSearch,
      handleClear,
      changePage,
      handlePageSizeChange,
      viewDetails,
      closeModal,
      handlePrint,
      getStatusText,
      formatDate,
      truncateAddress,
    };
  },
};
</script>

<style scoped>
/* 樣式部分保持不變，但添加一些新的樣式類別 */
.search-hint {
  margin-top: 0.5rem;
  color: #666;
  font-size: 0.875rem;
}

.results-summary {
  color: #666;
  font-size: 0.875rem;
}

.form-name {
  font-weight: 600;
}

.form-source {
  color: #666;
  font-size: 0.75rem;
}

.relationship {
  font-size: 0.875rem;
}

.other-relationship {
  color: #666;
  font-size: 0.75rem;
}

.address-truncate {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.date-time {
  font-size: 0.875rem;
  color: #666;
}

.action-buttons {
  display: flex;
  gap: 0.25rem;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.page-numbers {
  display: flex;
  gap: 0.25rem;
}

.page-number {
  padding: 0.5rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.3s;
}

.page-number:hover:not(:disabled) {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.page-number.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.page-number:disabled {
  cursor: default;
}

.page-size-selector {
  font-size: 0.875rem;
}

.page-size-selector select {
  margin-left: 0.5rem;
  padding: 0.25rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 80px;
}

.loading-state {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.loading-spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid var(--primary-color);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-suggestions {
  text-align: left;
  max-width: 300px;
  margin: 1rem auto;
}

.household-head-tag {
  border-left: 3px solid var(--primary-color);
  
}

.ancestor-tag {
  background: #e7f3ff;
}

.survivor-tag {
  background: #f0f9ff;
}

.zodiac,
.person-notes,
.ancestor-notes,
.survivor-notes {
  font-size: 0.75rem;
  color: #666;
  margin-left: 0.25rem;
}

/* 查詢區域樣式 */
.search-section {
  background: white;
  padding: 1.5rem;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.search-form .form-group {
  margin-bottom: 0;
}

.search-input-group {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.search-input-group input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
}

.search-input-group input:focus {
  border-color: var(--primary-color);
  outline: none;
  box-shadow: 0 0 0 2px rgba(139, 69, 19, 0.1);
}

/* 結果區域樣式 */
.results-section {
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.results-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8f9fa;
}

.results-header h3 {
  margin: 0;
  color: #333;
}

.results-info {
  color: #666;
  font-size: 0.875rem;
}

/* 表格樣式 */
.table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid #e9ecef;
}

.data-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #333;
  position: sticky;
  top: 0;
}

.data-table tbody tr:hover {
  background: #f8f9fa;
}

/* 狀態標籤 */
.status-badge {
  padding: 0.5rem 0.5rem;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 50;
}

.status-badge.creating {
  background: #fff3cd;
  color: #856404;
}

.status-badge.editing {
  background: #d1ecf1;
  color: #0c5460;
}

.status-badge.saved {
  background: #d4edda;
  color: #155724;
}

.status-badge.submitted {
  background: #cce7ff;
  color: #004085;
}

.status-badge.completed {
  background: #d1ecf1;
  color: #0c5460;
}

/* 分頁樣式 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  /* border-top: 1px solid #e9ecef; */
}

.pagination-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  color: #333;
  cursor: pointer;
  transition: all 0.3s;
}

.pagination-btn:hover:not(:disabled) {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.pagination-btn:disabled {
  color: #ccc;
  cursor: not-allowed;
}

.pagination-info {
  color: #666;
  font-size: 0.875rem;
}

/* 空狀態樣式 */
.no-results {
  background: white;
  padding: 3rem;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.empty-state p {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.1rem;
}

.empty-hint {
  color: #666;
  font-size: 0.9rem;
}

/* 彈窗樣式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 10px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8f9fa;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  color: #333;
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e9ecef;
  text-align: right;
  background: #f8f9fa;
}

/* 詳細資訊樣式 */
.detail-section {
  margin-bottom: 2rem;
}

.detail-section h4 {
  color: var(--primary-color);
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
  padding: 0.25rem 0.75rem;
  border-radius: 50px;
  font-size: 0.875rem;
  border: 1px solid #e9ecef;
}

.household-head {
  background: var(--household-color);
  color: white;
  padding: 0.125rem 0.5rem;
  border-radius: 50px;
  font-size: 0.75rem;
  margin-left: 0.5rem;
}

/* 響應式設計 */
@media (max-width: 768px) {

  .main-content {
    padding: 1rem;
  }

  .search-input-group {
    flex-direction: column;
  }

  .results-header {
    flex-direction: column;
    gap: 1rem;
  }

  .pagination {
    flex-direction: column;
    gap: 0.5rem;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .data-table {
    font-size: 0.875rem;
  }

  .data-table th,
  .data-table td {
    padding: 0.5rem;
  }
}
</style>
