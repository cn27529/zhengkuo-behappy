<template>
  <div class="main-content">
    <div class="page-header">
      <h2>活動管理</h2>
      <p style="display: none">管理寺廟的各種活動，包括法會、講座、禪修等</p>
    </div>

    <!-- 查詢區 -->
    <div class="search-section">
      <div class="search-form">
        <div class="form-group">
          <label style="display: none" for="searchQuery">查詢條件</label>
          <div class="search-input-group">
            <el-input
              v-model="searchQuery"
              placeholder="活動名稱、描述、地點"
              @keyup.enter="handleSearch"
              :disabled="loading"
              clearable
              size="large"
            >
            </el-input>

            <el-select
              v-model="selectedItemTypes"
              multiple
              placeholder="請選擇活動類型"
              :disabled="loading"
              size="large"
              style="display: none"
            >
              <el-option
                v-for="item_type in availableActivityItemTypes"
                :key="item_type"
                :label="getLable_ItemType(item_type)"
                :value="item_type"
              />
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
          <p class="search-hint">💡 提示:搜尋關鍵字,系統會自動匹配相關欄位</p>
        </div>
      </div>
    </div>

    <!-- 調試信息 -->
    <div v-if="isDev" class="debug-panel">
      <h4>🔧 調試信息</h4>
      <hr />
      <div>filteredActivities.length: {{ filteredActivities.length }}</div>
      <div>upcomingActivities.length: {{ upcomingActivities.length }}</div>
      <div>completedActivities.length: {{ completedActivities.length }}</div>
      <div>currentPage: {{ currentPage }}</div>
      <div>pageSize: {{ pageSize }}</div>
      <div>selectedTab: {{ selectedTab }}</div>
      <div>selectedTypes: {{ selectedItemTypes }}</div>
      <div>所有活動數: {{ activities.length }}</div>
      <div>活動類型: {{ availableActivityItemTypes }}</div>
    </div>

    <!-- 統計卡片 -->
    <div class="stats-cards" style="display: none">
      <el-card class="stat-card">
        <template #header>
          <div class="stat-header">
            <span class="stat-icon">📅</span>
            <span class="stat-title">總活動數</span>
          </div>
        </template>
        <div class="stat-content">
          <h3>{{ activities.length }}</h3>
        </div>
      </el-card>

      <el-card class="stat-card">
        <template #header>
          <div class="stat-header">
            <span class="stat-icon">👥</span>
            <span class="stat-title">總參與人次</span>
          </div>
        </template>
        <div class="stat-content">
          <h3>{{ totalParticipants }}</h3>
        </div>
      </el-card>

      <el-card class="stat-card">
        <template #header>
          <div class="stat-header">
            <span class="stat-icon">⏳</span>
            <span class="stat-title">即將到來</span>
          </div>
        </template>
        <div class="stat-content">
          <h3>{{ upcomingActivities.length }}</h3>
        </div>
      </el-card>

      <el-card class="stat-card">
        <template #header>
          <div class="stat-header">
            <span class="stat-icon">✅</span>
            <span class="stat-title">已完成</span>
          </div>
        </template>
        <div class="stat-content">
          <h3>{{ completedActivities.length }}</h3>
        </div>
      </el-card>
    </div>

    <!-- 查詢列表 -->
    <div class="results-section">
      <!-- Tab 切換 -->
      <el-tabs v-model="selectedTab" @tab-change="handleTabChange">
        <el-tab-pane label="⏳&nbsp;即將到來" name="upcoming">
          <!-- 即將到來活動列表 -->
          <div
            v-if="loading && selectedTab === 'upcoming'"
            class="loading-state"
          >
            <el-result icon="info" title="載入中">
              <template #extra>
                <el-button type="primary" :loading="true">載入中</el-button>
              </template>
            </el-result>
          </div>

          <div
            v-else-if="error && selectedTab === 'upcoming'"
            class="error-state"
          >
            <el-result icon="error" title="載入失敗">
              <template #description>
                <p>{{ error }}</p>
              </template>
              <template #extra>
                <el-button type="primary" @click="initialize">重試</el-button>
              </template>
            </el-result>
          </div>

          <div v-else-if="upcomingFiltered.length === 0" class="no-results">
            <el-empty description="沒有即將到來的活動">
              <el-button type="primary" @click="showAddModal = true"
                >新增活動</el-button
              >
            </el-empty>
          </div>

          <div v-else>
            <div class="results-header">
              <h3>查詢結果 (共 {{ upcomingFiltered.length }} 筆)</h3>
              <el-button
                type="primary"
                @click="showAddModal = true"
                :icon="Plus"
              >
                新增活動
              </el-button>
            </div>

            <!-- 查詢列表 -->
            <el-table
              :data="upcomingPaginated"
              style="width: 100%"
              :default-sort="{ prop: 'date', order: 'ascending' }"
              stripe
              border
              :header-cell-style="{ background: '#f8f9fa', color: '#333' }"
              v-loading="loading && selectedTab === 'upcoming'"
            >
              <el-table-column
                label="圖標"
                min-width="50"
                prop="activityId"
                align="center"
              >
                <template #default="{ row }">
                  <el-tooltip :content="row.id" placement="top">
                    <div class="results-icon">
                      {{ row.icon }}
                    </div>
                  </el-tooltip>
                </template>
              </el-table-column>

              <el-table-column label="類型" min-width="80" v-if="false">
                <template #default="{ row }">
                  <el-tag :type="getTag_ItemType(row.item_type)">
                    {{ getLable_ItemType(row.item_type) }}
                  </el-tag>
                </template>
              </el-table-column>

              <el-table-column prop="name" label="活動名稱" min-width="180">
                <template #default="{ row }">
                  <div class="activity-title">
                    <strong>{{ row.name }}</strong>
                    <div class="activity-desc">
                      {{ row.description || "無描述" }}
                    </div>
                  </div>
                </template>
              </el-table-column>

              <el-table-column label="日期時間" min-width="130">
                <template #default="{ row }">
                  <div class="date-info">
                    <div>{{ formatDateLong(row.date) }}</div>
                  </div>
                </template>
              </el-table-column>

              <el-table-column prop="location" label="地點" min-width="100" />

              <el-table-column label="參與人次" min-width="80" align="center">
                <template #default="{ row }">
                  <div class="participants-cell">
                    <span class="count">{{ row.participants || 0 }}</span>
                    <el-tooltip content="更新參與人次" placement="top">
                      <el-button circle @click="showUpdateParticipants(row)">
                        🔄️
                      </el-button>
                    </el-tooltip>
                  </div>
                </template>
              </el-table-column>

              <el-table-column
                label="操作"
                width="180"
                fixed="right"
                align="center"
              >
                <template #default="{ row }">
                  <div class="action-buttons">
                    <el-tooltip content="編輯活動" placement="top">
                      <el-button
                        circle
                        @click="editActivity(row)"
                        type="primary"
                      >
                        📝
                      </el-button>
                    </el-tooltip>

                    <el-tooltip content="標記完成" placement="top">
                      <el-button
                        circle
                        @click="completeActivity(row.id)"
                        type="success"
                      >
                        <el-icon><Check /></el-icon>
                      </el-button>
                    </el-tooltip>

                    <el-tooltip content="刪除活動" placement="top">
                      <el-button
                        circle
                        @click="deleteActivity(row)"
                        type="danger"
                      >
                        刪
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
                :total="upcomingFiltered.length"
                :page-sizes="[10, 20, 50, 100]"
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="handleSizeChange"
                @current-change="handleCurrentChange"
                background
              />
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="✅&nbsp;已完成" name="completed">
          <!-- 已完成活動列表 -->
          <div
            v-if="loading && selectedTab === 'completed'"
            class="loading-state"
          >
            <el-result icon="info" title="載入中">
              <template #extra>
                <el-button type="primary" :loading="true">載入中</el-button>
              </template>
            </el-result>
          </div>

          <div
            v-else-if="error && selectedTab === 'completed'"
            class="error-state"
          >
            <el-result icon="error" title="載入失敗">
              <template #description>
                <p>{{ error }}</p>
              </template>
              <template #extra>
                <el-button type="primary" @click="initialize">重試</el-button>
              </template>
            </el-result>
          </div>

          <div v-else-if="completedFiltered.length === 0" class="no-results">
            <el-empty description="沒有已完成的活動">
              <template #image>
                <div class="empty-icon">✅</div>
              </template>
            </el-empty>
          </div>

          <div v-else>
            <div class="results-header">
              <h3>查詢結果 (共 {{ completedFiltered.length }} 筆)</h3>
            </div>
            <!-- 查詢列表 -->
            <el-table
              :data="completedPaginated"
              style="width: 100%"
              :default-sort="{ prop: 'date', order: 'descending' }"
              stripe
              border
              :header-cell-style="{ background: '#f8f9fa', color: '#333' }"
              v-loading="loading && selectedTab === 'completed'"
            >
              <el-table-column
                label="圖標"
                min-width="50"
                prop="activityId"
                align="center"
              >
                <template #default="{ row }">
                  <el-tooltip :content="row.activityId" placement="top">
                    <div class="results-icon">
                      {{ row.icon }}
                    </div>
                  </el-tooltip>
                </template>
              </el-table-column>

              <el-table-column label="類型" min-width="80" v-if="false">
                <template #default="{ row }">
                  <el-tag :type="getTag_ItemType(row.item_type)">
                    {{ getLable_ItemType(row.item_type) }}
                  </el-tag>
                </template>
              </el-table-column>

              <el-table-column prop="name" label="活動名稱" min-width="180">
                <template #default="{ row }">
                  <div class="activity-title">
                    <strong>{{ row.name }}</strong>
                    <div class="activity-desc">
                      {{ row.description || "無描述" }}
                    </div>
                  </div>
                </template>
              </el-table-column>

              <el-table-column label="日期時間" min-width="130">
                <template #default="{ row }">
                  <div class="date-info">
                    <div>{{ formatDateLong(row.date) }}</div>
                  </div>
                </template>
              </el-table-column>

              <el-table-column prop="location" label="地點" min-width="100" />

              <el-table-column label="參與人次" min-width="80" align="center">
                <template #default="{ row }">
                  <span class="count">{{ row.participants || 0 }}</span>
                </template>
              </el-table-column>

              <el-table-column
                label="操作"
                width="180"
                fixed="right"
                align="center"
              >
                <template #default="{ row }">
                  <div class="action-buttons">
                    <el-tooltip content="編輯活動" placement="top">
                      <el-button
                        circle
                        @click="editActivity(row)"
                        type="primary"
                      >
                        📝
                      </el-button>
                    </el-tooltip>

                    <el-tooltip v-if="false" content="刪除活動" placement="top">
                      <el-button
                        circle
                        @click="deleteActivity(row)"
                        type="danger"
                      >
                        刪
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
                :total="completedFiltered.length"
                :page-sizes="[10, 20, 50, 100]"
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="handleSizeChange"
                @current-change="handleCurrentChange"
                background
              />
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 新增活動 Dialog -->
    <el-dialog
      align-center
      v-model="showAddModal"
      title="新增活動"
      width="600px"
      :before-close="closeModal"
    >
      <el-form
        ref="addFormRef"
        :model="newActivity"
        :rules="activityRules"
        label-width="100px"
      >
        <el-form-item label="圖標" prop="icon">
          <IconSelector v-model="newActivity.icon" />
        </el-form-item>

        <el-form-item label="活動名稱" prop="name">
          <el-input v-model="newActivity.name" placeholder="請輸入活動名稱" />
        </el-form-item>

        <el-form-item label="活動類型" prop="item_type" style="display: none">
          <el-select
            v-model="newActivity.item_type"
            placeholder="請選擇類型"
            style="width: 100%"
          >
            <el-option
              v-for="item_type in availableActivityItemTypes"
              :key="item_type"
              :label="getLable_ItemType(item_type)"
              :value="item_type"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="活動描述">
          <el-input
            v-model="newActivity.description"
            type="textarea"
            :rows="3"
            placeholder="請輸入活動描述"
          />
        </el-form-item>

        <el-form-item label="活動日期" prop="date">
          <el-date-picker
            v-model="newActivity.date"
            type="datetime"
            placeholder="選擇日期時間"
            size="small"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm"
            :disabled-date="disabledDate"
          />
        </el-form-item>

        <el-form-item label="地點" prop="location">
          <el-input
            v-model="newActivity.location"
            placeholder="請輸入活動地點"
          />
        </el-form-item>

        <el-form-item label="參與人次">
          <el-input-number
            v-model="newActivity.participants"
            :min="0"
            :max="1000"
            placeholder="參與人次"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <!-- 載入 Mock 數據 -->
          <el-button
            style="display: none"
            type="success"
            class="dev-button"
            @click="handleLoadMockData"
            >🎲 載入 Mock 數據</el-button
          >
          <el-button @click="closeModal" :disabled="submitting">取消</el-button>
          <el-button
            type="primary"
            @click="handleNewActivity"
            :loading="submitting"
          >
            新增活動
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 編輯活動 Dialog -->
    <el-dialog
      align-center
      v-if="editingActivity"
      v-model="showEditModal"
      title="編輯活動"
      width="600px"
      :before-close="closeModal"
    >
      <el-form
        ref="editFormRef"
        :model="editingActivity"
        :rules="activityRules"
        label-width="100px"
      >
        <el-form-item label="圖標" prop="icon">
          <IconSelector v-model="editingActivity.icon" />
        </el-form-item>

        <el-form-item label="活動名稱" prop="name">
          <el-input
            v-model="editingActivity.name"
            placeholder="請輸入活動名稱"
          />
        </el-form-item>

        <el-form-item label="活動類型" prop="item_type" style="display: none">
          <el-select
            v-model="editingActivity.item_type"
            placeholder="請選擇類型"
            style="width: 100%"
          >
            <el-option
              v-for="item_type in availableActivityItemTypes"
              :key="item_type"
              :label="getLable_ItemType(item_type)"
              :value="item_type"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="活動描述">
          <el-input
            v-model="editingActivity.description"
            type="textarea"
            :rows="3"
            placeholder="請輸入活動描述"
          />
        </el-form-item>

        <el-form-item label="活動日期" prop="date">
          <el-date-picker
            v-model="editingActivity.date"
            type="datetime"
            placeholder="選擇日期時間"
            size="small"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm"
            :disabled-date="disabledDate"
          />
        </el-form-item>

        <el-form-item label="地點" prop="location">
          <el-input
            v-model="editingActivity.location"
            placeholder="請輸入活動地點"
          />
        </el-form-item>

        <el-form-item label="參與人次" style="display: none">
          <el-input-number
            v-model="editingActivity.participants"
            :min="0"
            :max="1000"
            placeholder="參與人次"
          />
        </el-form-item>

        <el-form-item label="狀態" prop="state">
          <el-select
            v-model="editingActivity.state"
            placeholder="請選擇狀態"
            style="width: 100%"
          >
            <el-option label="即將到來" value="upcoming" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeModal" :disabled="submitting">取消</el-button>
          <el-button
            type="primary"
            @click="handleEditActivity"
            :loading="submitting"
          >
            更新活動
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 更新參與人次 Dialog -->
    <el-dialog
      v-model="showParticipantsModal"
      :title="`更新參與人次 - ${selectedActivity?.name}`"
      width="400px"
      :before-close="closeModal"
    >
      <el-form>
        <el-form-item label="當前參與人次">
          <div class="current-count">
            {{ selectedActivity?.participants || 0 }}
          </div>
        </el-form-item>

        <el-form-item label="新的參與人次" required>
          <el-input-number
            v-model="newParticipants"
            :min="0"
            :max="1000"
            :step="1"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeModal" :disabled="submitting">取消</el-button>
          <el-button
            type="primary"
            @click="submitParticipantsUpdate"
            :loading="submitting"
          >
            更新人次
          </el-button>
          <!-- 依參加記錄更新人次，實現`submitByParticipantRecordsUpdate`方法，以`activity.id`取得`參加記錄查詢`的數量進行更新人次 -->
          <el-button
            type="success"
            @click="submitByParticipantRecordsUpdate"
            :loading="submitting"
            >依參加記錄
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from "vue";
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
import { useActivityStore } from "../stores/activityStore.js";
import { authService } from "../services/authService.js";
import { DateUtils } from "../utils/dateUtils.js";
import IconSelector from "../components/IconSelector.vue";
import { storeToRefs } from "pinia";
import { serviceAdapter } from "../adapters/serviceAdapter.js";
import { useJoinRecordQueryStore } from "../stores/joinRecordQueryStore.js";

const activityStore = useActivityStore();

// 狀態
const loading = ref(false);
const error = ref(null);
const showAddModal = ref(false);
const showEditModal = ref(false);
const showParticipantsModal = ref(false);
const submitting = ref(false);
const isDev = computed(() => authService.getCurrentDev());
const joinRecordQueryStore = useJoinRecordQueryStore();

// 查詢條件, 分頁
// 修改後 (從 store 取得，會保留)
const { searchQuery, selectedItemTypes, selectedTab, currentPage, pageSize } =
  storeToRefs(activityStore);

// 表單數據
const newActivity = reactive({
  name: "",
  item_type: "",
  description: "",
  date: "",
  location: "",
  participants: 0,
  organizer: "",
  state: "upcoming",
});

const editingActivity = ref(null);
const selectedActivity = ref(null);
const newParticipants = ref(0);

// 表單驗證規則
const activityRules = {
  name: [{ required: true, message: "請輸入活動名稱", trigger: "blur" }],
  item_type: [
    { required: false, message: "請選擇活動類型", trigger: "change" },
  ],
  date: [{ required: true, message: "請選擇活動日期", trigger: "change" }],
  location: [{ required: true, message: "請輸入活動地點", trigger: "blur" }],
  state: [{ required: true, message: "請選擇活動狀態", trigger: "change" }],
};

// el-dialog 添加表單引用
const addFormRef = ref(null);
const editFormRef = ref(null);
// el-date-picker 禁用過去的日期（可選）
const disabledDate = (time) => {
  // 如果需要禁用過去的日期
  return time.getTime() < Date.now() - 24 * 60 * 60 * 1000;
  //return false;
};

// 計算屬性
const activities = computed(() => activityStore.activities); // 已經是近一年資料
const upcomingActivities = computed(() => activityStore.upcomingActivities);
const completedActivities = computed(() => activityStore.completedActivities);
const totalParticipants = computed(() => activityStore.totalParticipants);

const availableActivityItemTypes = computed(
  () => activityStore.allActivityItemTypes,
);

// 根據選中的tab和篩選條件過濾活動
const upcomingFiltered = computed(() => {
  let filtered = upcomingActivities.value;

  // 類型篩選
  if (selectedItemTypes.value.length > 0) {
    filtered = filtered.filter((activity) =>
      selectedItemTypes.value.includes(activity.item_type),
    );
  }

  // 關鍵字搜尋
  if (searchQuery.value) {
    const keyword = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (activity) =>
        activity.name.toLowerCase().includes(keyword) ||
        activity.description?.toLowerCase().includes(keyword) ||
        activity.location.toLowerCase().includes(keyword) ||
        activity.createdUser?.toLowerCase().includes(keyword),
    );
  }

  return filtered;
});

const completedFiltered = computed(() => {
  let filtered = completedActivities.value;

  // 類型篩選
  if (selectedItemTypes.value.length > 0) {
    filtered = filtered.filter((activity) =>
      selectedItemTypes.value.includes(activity.item_type),
    );
  }

  // 關鍵字搜尋
  if (searchQuery.value) {
    const keyword = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (activity) =>
        activity.name.toLowerCase().includes(keyword) ||
        activity.description?.toLowerCase().includes(keyword) ||
        activity.location.toLowerCase().includes(keyword) ||
        activity.createdUser?.toLowerCase().includes(keyword),
    );
  }

  return filtered;
});

// 分頁數據
const upcomingPaginated = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return upcomingFiltered.value.slice(start, end);
});

const completedPaginated = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return completedFiltered.value.slice(start, end);
});

const filteredActivities = computed(() => {
  if (selectedTab.value === "upcoming") {
    return upcomingFiltered.value;
  } else {
    return completedFiltered.value;
  }
});

// 方法
const initialize = async () => {
  loading.value = true;
  error.value = null;

  try {
    await activityStore.initialize();
    ElMessage.success("活動數據加載成功");
  } catch (err) {
    error.value = err.message || "加載數據失敗";
    ElMessage.error("加載活動數據失敗");
  } finally {
    loading.value = false;
  }
};

const formatDateLong = (dateString) => {
  return DateUtils.formatDateLong(dateString);
};

const getTag_ItemType = (item_type) => {
  const typeMap = {
    ceremony: "warning",
    法會: "warning",
    lecture: "success",
    講座: "success",
    meditation: "info",
    禪修: "info",
    festival: "danger",
    節慶: "danger",
    volunteer: "primary",
    志工: "primary",
    pudu: "warning",
    普度: "warning",
    other: "",
    其他: "",
  };
  return typeMap[item_type] || "ceremony";
};

const getLable_ItemType = (item_type) => {
  const labelMap = {
    ceremony: "法會",
    lecture: "講座",
    meditation: "禪修",
    festival: "節慶",
    volunteer: "志工",
    pudu: "普度",
    other: "其他",
  };
  return labelMap[item_type] || item_type || "法會";
};

const handleSearch = () => {
  //initialize();
  currentPage.value = 1;
  // 搜尋邏輯已經在計算屬性中實現
  ElMessage.info(`找到 ${filteredActivities.value.length} 個活動`);
};

const handleClear = () => {
  searchQuery.value = "";
  selectedItemTypes.value = [];
  currentPage.value = 1;
  ElMessage.success("搜尋條件已清空");
};

const handleTabChange = (tabName) => {
  currentPage.value = 1;
  console.log(`切換到 ${tabName} 標籤`);
};

const handleSizeChange = (newSize) => {
  pageSize.value = newSize;
  currentPage.value = 1;
};

const handleCurrentChange = (newPage) => {
  currentPage.value = newPage;
};

const showUpdateParticipants = (activity) => {
  selectedActivity.value = activity;
  newParticipants.value = activity.participants || 0;
  showParticipantsModal.value = true;
};

const editActivity = (activity) => {
  // 處理 mock 數據的類型轉換
  editingActivity.value = {
    ...activity,
    item_type: activity.item_type, // 確保 type 欄位存在
  };
  showEditModal.value = true;
};

const completeActivity = async (activityId) => {
  try {
    await ElMessageBox.confirm("確定要標記此活動為已完成嗎？", "確認操作", {
      confirmButtonText: "確定",
      cancelButtonText: "取消",
      type: "warning",
    });

    const result = await activityStore.completeActivity(activityId);

    if (result.success) {
      ElMessage.success("活動已標記為完成");
      //await initialize(); // 重新加載數據
    } else {
      throw new Error(result.message);
    }
  } catch (err) {
    if (err !== "cancel") {
      ElMessage.error(err.message || "標記活動完成失敗");
    }
  }
};

const deleteActivity = async (activity) => {
  try {
    await ElMessageBox.confirm(
      `確定要刪除活動 "${activity.name}" 嗎？⚠️ 此操作無法復原。`,
      "確認刪除",
      {
        confirmButtonText: "確定",
        cancelButtonText: "取消",
        type: "error",
      },
    );

    const result = await activityStore.deleteActivity(activity.id);

    if (result.success) {
      ElMessage.success("✅ 活動刪除成功");
      //await initialize(); // 重新加載數據
    } else {
      throw new Error(result.message);
    }
  } catch (err) {
    if (err !== "cancel") {
      ElMessage.error(err.message || "刪除活動失敗");
    }
  }
};

const closeModal = () => {
  showAddModal.value = false;
  showEditModal.value = false;
  showParticipantsModal.value = false;

  // 重置表單
  Object.assign(newActivity, {
    name: "",
    item_type: "",
    description: "",
    date: "",
    location: "",
    participants: 0,
    organizer: "",
    state: "upcoming",
  });

  editingActivity.value = null;
  selectedActivity.value = null;
  newParticipants.value = 0;
  submitting.value = false;
};

const handleNewActivity = async () => {
  submitting.value = true;

  try {
    // 1. 先進行表單驗證
    if (!addFormRef.value) {
      ElMessage.error("表單未正確初始化");
      return;
    }

    // 2. 調用 Element Plus 的表單驗證方法
    const isValid = await addFormRef.value.validate().catch((error) => {
      console.error("表單驗證失敗:", error);
      return false;
    });

    // 3. 如果驗證失敗，不提交
    if (!isValid) {
      ElMessage.warning("請填寫所有必填欄位");
      submitting.value = false;
      return;
    }

    // 4. 準備提交數據（確保日期格式正確）
    const activityData = {
      ...newActivity,
      date: newActivity.date ? `${newActivity.date}` : null,
    };

    const result = await activityStore.submitActivity(activityData);

    if (result.success) {
      ElMessage.success("✅ 活動新增成功");
      closeModal();
      //await initialize(); // 重新加載數據
    } else {
      throw new Error(result.message);
    }
  } catch (err) {
    ElMessage.error(err.message || "新增活動失敗");
  } finally {
    submitting.value = false;
  }
};

const handleEditActivity = async () => {
  if (!editingActivity.value) return;

  submitting.value = true;

  try {
    // 1. 先進行表單驗證
    if (!editFormRef.value) {
      ElMessage.error("表單未正確初始化");
      return;
    }

    // 2. 調用 Element Plus 的表單驗證方法
    const isValid = await editFormRef.value.validate().catch((error) => {
      console.error("表單驗證失敗:", error);
      return false;
    });

    // 3. 如果驗證失敗，不提交
    if (!isValid) {
      ElMessage.warning("請填寫所有必填欄位");
      submitting.value = false;
      return;
    }

    // 4. 準備提交數據（確保日期格式正確）
    const activityData = {
      ...editingActivity.value,
      date: editingActivity.value.date
        ? `${editingActivity.value.date}`
        : editingActivity.value.date,
    };

    const result = await activityStore.updateActivity(
      editingActivity.value.id,
      activityData,
    );

    if (result.success) {
      ElMessage.success("✅ 活動更新成功");
      closeModal();
      //await initialize(); // 重新加載數據
    } else {
      throw new Error(result.message);
    }
  } catch (err) {
    ElMessage.error(err.message || "更新活動失敗");
  } finally {
    submitting.value = false;
  }
};

const submitParticipantsUpdate = async () => {
  if (!selectedActivity.value) return;

  submitting.value = true;

  try {
    const result = await activityStore.updateActivityParticipants(
      selectedActivity.value.id,
      parseInt(newParticipants.value),
    );

    if (result.success) {
      ElMessage.success("✅ 參與人次更新成功");
      closeModal();
      //await initialize(); // 重新加載數據
    } else {
      throw new Error(result.message);
    }
  } catch (err) {
    ElMessage.error(err.message || "更新參與人次失敗");
  } finally {
    submitting.value = false;
  }
};

// 依參加記錄更新人次，實現`submitByParticipantRecordsUpdate`方法，以`activity.id`取得`參加記錄查詢`的數量進行更新人次
const submitByParticipantRecordsUpdate = async () => {
  if (!selectedActivity.value) return;

  submitting.value = true;

  try {
    // 使用 joinRecordQueryStore 查詢參加記錄（支援 mock 模式）
    const queryData = {
      query: "", // 不需要關鍵字搜尋，查詢該活動的所有記錄
      activityId: selectedActivity.value.id,
    };

    const result = await joinRecordQueryStore.queryJoinRecordData(queryData);

    if (result.success) {
      let totalParticipants = 0;

      // 遍歷所有參加記錄，計算 sourceData 中的實際參與人數
      result.data?.forEach((record) => {
        record.items?.forEach((item) => {
          // 每個項目的 sourceData 包含實際參與的人員資料
          if (item.sourceData && Array.isArray(item.sourceData)) {
            totalParticipants += item.sourceData.length;
          }
        });
      });

      // 更新活動的參與人次
      const updateResult = await activityStore.updateActivityParticipants(
        selectedActivity.value.id,
        totalParticipants,
      );

      if (updateResult.success) {
        ElMessage.success(`依參加記錄更新成功，共 ${totalParticipants} 人次`);
        closeModal();
      } else {
        throw new Error(updateResult.message);
      }
    } else {
      throw new Error(result.message || "查詢參加記錄失敗");
    }
  } catch (err) {
    ElMessage.error(err.message || "依參加記錄更新失敗");
  } finally {
    submitting.value = false;
  }
};

const handleLoadMockData = async () => {
  try {
    const mockData = await activityStore.loadMockData();

    Object.assign(newActivity, {
      name: mockData.name,
      item_type: mockData.item_type,
      description: mockData.description,
      date: mockData.date,
      location: mockData.location,
      icon: mockData.icon || "🕯️",
      participants: 0,
      organizer: "",
      state: "upcoming",
    });

    if (mockData) {
      ElMessage.success("Mock 數據載入成功");
    } else {
      ElMessage.error("載入 Mock 數據失敗");
    }
  } catch (error) {
    console.error("載入 Mock 數據錯誤:", error);
    ElMessage.error("載入 Mock 數據時發生錯誤");
  }
};

// 生命週期
onMounted(() => {
  console.log("✅ ActivityList 組件已載入");
  initialize();
});
</script>

<style scoped>
.search-input-group .el-input {
  flex: 1;
  /* min-width: 300px; */
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
.results-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
  text-align: center;
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

/* 活動標題 */
.activity-title {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.activity-desc {
  font-size: 0.65rem;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* 日期時間信息 */
.date-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.time {
  font-size: 0.85rem;
  color: #666;
}

/* 參與人次單元格 */
.participants-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.count {
  font-weight: 600;
  color: var(--primary-color);
  min-width: 2rem;
  text-align: center;
}

/* 操作按鈕 */
.action-buttons {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
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

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

/* 當前人次顯示 */
.current-count {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--primary-color);
  text-align: center;
  padding: 1rem;
  background: var(--light-color);
  border-radius: 4px;
}

/* 字體樣式 */
.font-mono {
  font-family: "Courier New", Courier, monospace;
  font-size: 0.9rem;
}

/* Tab 樣式優化 */
:deep(.el-tabs__nav-wrap) {
  padding: 0 1.5rem;
  background: #f8f9fa;
}

:deep(.el-tabs__header) {
  margin: 0;
}

:deep(.el-tabs__content) {
  padding: 1.5rem 0rem 0rem 0rem;
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
  .search-input-group .el-input,
  .search-input-group .el-select {
    width: 100%;
    min-width: auto;
  }

  .search-input-group .el-button {
    width: 100%;
  }

  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .results-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .results-header .el-button {
    width: 100%;
  }

  /* 手機版表格調整 */
  :deep(.el-table) {
    font-size: 0.875rem;
  }

  :deep(.el-table__cell) {
    padding: 8px 4px;
  }

  .action-buttons {
    flex-wrap: wrap;
  }
}

@media (max-width: 480px) {
  .stats-cards {
    grid-template-columns: 1fr;
  }

  /* 極小螢幕表格調整 */
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
