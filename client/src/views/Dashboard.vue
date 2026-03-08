<template>
  <main class="dashboard2">
    <section class="page-header">
      <div>
        <h2>資訊牆</h2>
        <p class="sub-title">即時掌握登記、金流與活動概況</p>
      </div>
      <div class="header-meta">
        <span class="meta-label">更新時間</span>
        <span class="meta-value">{{ formatDateTime(lastUpdatedAt) }}</span>
      </div>
    </section>

    <el-row :gutter="24" class="summary-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card shadow="hover" class="summary-card">
          <div class="summary-label">總參與人次</div>
          <AnimatedNumber :value="totalParticipants" :duration="2000" />
          <div class="summary-foot">啟用至今</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card shadow="hover" class="summary-card">
          <div class="summary-label">祈福登記總數</div>
          <AnimatedNumber :value="totalRegistrations" :duration="2000" />
          <div class="summary-foot">
            近 7 日新增 {{ registrationsInLast7Days }} 筆
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card shadow="hover" class="summary-card">
          <div class="summary-label">參加記錄總數</div>
          <AnimatedNumber :value="totalJoinRecords" :duration="2000" />
          <div class="summary-foot">
            近 7 日新增 {{ joinRecordsInLast7Days }} 筆
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card shadow="hover" class="summary-card">
          <div class="summary-label">贊助者人數</div>
          <AnimatedNumber :value="totalDonors" :duration="2000" />
          <div class="summary-foot">
            本月活躍 {{ currentMonthDonateSummary.donors }} 人
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="24" class="summary-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card shadow="hover" class="status-card warning">
          <div class="status-title">待處理付款</div>
          <div class="status-value">{{ paymentSummary.unpaid }}</div>
          <div class="status-foot">含未付款與未收尾款</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card shadow="hover" class="status-card danger">
          <div class="status-title">待開立收據/感謝狀</div>
          <div class="status-value">{{ receiptPendingCount }}</div>
          <div class="status-foot">
            <el-button
              v-for="id in receiptPendingIds"
              :key="id"
              type="success"
              size="small"
              circle
              @click="handleReceiptPrint(id)"
              >🖨</el-button
            >
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card shadow="hover" class="status-card info">
          <div class="status-title">待沖帳</div>
          <div class="status-value">{{ accountingPendingCount }}</div>
          <div class="status-foot">已付款仍未沖帳</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card shadow="hover" class="status-card warning">
          <div class="status-title">待補齊資料</div>
          <div class="status-value">{{ formsNeedAttentionCount }}</div>
          <div class="status-foot">聯絡/消災/超度不完整</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row v-if="expiringDonorsCount > 0" class="summary-row">
      <el-col :span="24">
        <el-alert
          title="每月贊助到期提醒"
          type="warning"
          show-icon
          :closable="false"
        >
          <p>
            目前有
            <b>{{ expiringDonorsCount }}</b> 位信眾贊助將於本月或下月到期。
          </p>
          <el-button
            type="warning"
            size="small"
            plain
            @click="showExpiringModal = true"
            >查看名單</el-button
          >
        </el-alert>
      </el-col>
    </el-row>

    <el-row :gutter="24" class="summary-row">
      <el-col :xs="24" :sm="12" :lg="12">
        <el-card shadow="hover" class="donate-card">
          <div class="card-title">本月贊助總額</div>
          <div class="card-value">
            {{ appConfig.formatCurrency(currentMonthDonateSummary.total) }}
          </div>
          <div class="card-foot">
            活躍贊助者 {{ currentMonthDonateSummary.donors }} 人
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="12">
        <el-card shadow="hover" class="donate-card">
          <div class="card-title">未來 6 個月排定贊助</div>
          <div class="card-value">
            {{ appConfig.formatCurrency(next6MonthsDonateTotal) }}
          </div>
          <div class="card-foot">提前掌握可預期月贊助額</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="24" class="summary-row">
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="list-card">
          <div class="list-title">即將到來活動</div>
          <div v-if="upcomingActivityHighlights.length" class="list-body">
            <div
              v-for="activity in upcomingActivityHighlights"
              :key="activity.id"
              class="list-item"
            >
              <div class="list-main">
                <span class="list-icon">{{ activity.icon }}</span>
                <div>
                  <div class="list-label">{{ activity.name }}</div>
                  <div class="list-meta">{{ formatDate(activity.date) }}</div>
                </div>
              </div>
              <div class="list-value">
                {{ activity.participants || 0 }} 人次
              </div>
            </div>
          </div>
          <div v-else class="list-empty">暫無即將到來活動</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="list-card">
          <div class="list-title">巳經完成活動</div>
          <div v-if="completedActivityHighlights.length" class="list-body">
            <div
              v-for="activity in completedActivityHighlights"
              :key="activity.id"
              class="list-item"
            >
              <div class="list-main">
                <span class="list-icon">{{ activity.icon }}</span>
                <div>
                  <div class="list-label">{{ activity.name }}</div>
                  <div class="list-meta">{{ formatDate(activity.date) }}</div>
                </div>
              </div>
              <div class="list-value">
                {{ activity.participants || 0 }} 人次
              </div>
            </div>
          </div>
          <div v-else class="list-empty">暫無完成活動</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="24" class="summary-row">
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="list-card">
          <div class="list-title">近期祈福登記</div>
          <div v-if="recentRegistrations.length" class="list-body">
            <div
              v-for="reg in recentRegistrations"
              :key="reg.id"
              class="list-item"
            >
              <div class="list-main">
                <div class="list-label">
                  {{ reg.contact?.name || "未填聯絡人" }}
                </div>
                <div class="list-meta">
                  {{ reg.contact?.mobile || reg.contact?.phone }}，{{
                    formatRelativeOrDateTime(reg.createdAt || reg.date_created)
                  }}
                </div>
              </div>
            </div>
          </div>
          <div v-else class="list-empty">暫無登記資料</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="list-card">
          <div class="list-title">近期參加記錄</div>
          <div v-if="recentJoinRecords.length" class="list-body">
            <div
              v-for="record in recentJoinRecords"
              :key="record.id"
              class="list-item"
            >
              <div class="list-main">
                <div class="list-label">
                  {{ record.contact?.name || "未填聯絡人" }}
                </div>
                <div class="list-meta">
                  {{ appConfig.formatCurrency(record.totalAmount) }} 元，{{
                    formatRelativeOrDateTime(
                      record.createdAt || record.date_created,
                    )
                  }}
                </div>
              </div>
            </div>
          </div>
          <div v-else class="list-empty">暫無參加記錄</div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog
      v-model="showExpiringModal"
      title="即將到期贊助者名單"
      width="450px"
    >
      <el-table :data="expiringDonors" stripe size="small">
        <el-table-column prop="name" label="贊助者姓名" />
        <el-table-column
          prop="lastMonth"
          label="最後月份"
          width="120"
          align="center"
        >
          <template #default="{ row }">
            <el-tag
              :type="row.isExpiringThisMonth ? 'danger' : 'warning'"
              size="small"
              >{{ row.lastMonth }}</el-tag
            >
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </main>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useDashboardStore } from "../stores/dashboardStore.js";
import { DateUtils } from "../utils/dateUtils.js";
import AnimatedNumber from "../components/AnimatedNumber.vue";
import appConfig from "../config/appConfig.js";
import { ElMessage } from "element-plus";
import { useRouter } from "vue-router";

const dashboardStore = useDashboardStore();
const router = useRouter();
const showExpiringModal = ref(false);

const totalParticipants = computed(() => dashboardStore.totalParticipants);
const totalRegistrations = computed(() => dashboardStore.totalRegistrations);
const totalJoinRecords = computed(() => dashboardStore.totalJoinRecords);
const totalDonors = computed(() => dashboardStore.totalDonors);
const registrationsInLast7Days = computed(
  () => dashboardStore.registrationsInLast7Days,
);
const joinRecordsInLast7Days = computed(
  () => dashboardStore.joinRecordsInLast7Days,
);
const currentMonthDonateSummary = computed(
  () => dashboardStore.currentMonthDonateSummary,
);
const next6MonthsDonateTotal = computed(
  () => dashboardStore.next6MonthsDonateTotal,
);
const paymentSummary = computed(() => dashboardStore.paymentSummary);
const receiptPendingCount = computed(() => dashboardStore.receiptPendingCount);
const receiptPendingIds = computed(() => dashboardStore.receiptPendingIds);
const accountingPendingCount = computed(
  () => dashboardStore.accountingPendingCount,
);
const formsNeedAttentionCount = computed(
  () => dashboardStore.formsNeedAttentionCount,
);
const upcomingActivityHighlights = computed(
  () => dashboardStore.upcomingActivityHighlights,
);
const completedActivityHighlights = computed(
  () => dashboardStore.completedActivityHighlights,
);
const recentRegistrations = computed(() => dashboardStore.recentRegistrations);
const recentJoinRecords = computed(() => dashboardStore.recentJoinRecords);
const lastUpdatedAt = computed(() => dashboardStore.lastUpdatedAt);
const expiringDonors = computed(() => dashboardStore.expiringDonors);
const expiringDonorsCount = computed(() => dashboardStore.expiringDonorsCount);

const formatDate = (v) => DateUtils.formatDate(v);
const formatDateTime = (v) => DateUtils.formatDateTime(v);
const formatRelativeOrDateTime = (v) => DateUtils.formatRelativeOrDateTime(v);

const handleReceiptPrint = (id) => {
  const record = dashboardStore.getJoinRecordById(id);
  if (!record) return ElMessage.error("找不到紀錄");
  const isoStr = DateUtils.getCurrentISOTime();
  const printId = `print_receipt_${record.id}`;
  sessionStorage.setItem(printId, JSON.stringify(record));
  router.push({
    path: "/join-record-receipt-print",
    query: { print_id: printId, iso_str: isoStr },
  });
};

onMounted(() => dashboardStore.initialize());
</script>

<style scoped>
/* 原有樣式保持不變 */
.dashboard2 {
  padding: 1.5rem 2rem 2.5rem;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}
.page-header h2 {
  margin: 0;
  font-size: 1.8rem;
  color: var(--primary-color);
}
.sub-title {
  margin: 0.35rem 0 0;
  color: #6c757d;
  font-size: 0.95rem;
}
.header-meta {
  text-align: right;
  font-size: 0.85rem;
  color: #888;
}
.meta-label {
  margin-right: 0.5rem;
  color: #9aa0a6;
}
.meta-value {
  font-weight: 700;
  color: #3c3c3c;
}
.summary-row {
  margin-bottom: 1.5rem;
}
.summary-card {
  border-radius: 12px;
  padding: 0.5rem 0;
  min-height: 130px;
}
.summary-label {
  font-weight: 700;
  font-size: 0.95rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}
.summary-foot {
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: #9aa0a6;
}
.status-card {
  border-radius: 12px;
  min-height: 120px;
}
.status-card.warning {
  border-left: 4px solid #f2b24c;
}
.status-card.danger {
  border-left: 4px solid #ef6c6c;
}
.status-card.info {
  border-left: 4px solid #5a9cfb;
}
.status-title {
  font-size: 0.95rem;
  color: #6b7280;
  margin-bottom: 0.35rem;
  font-weight: 700;
}
.status-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: #1f2937;
}
.status-foot {
  margin-top: 0.45rem;
  font-size: 0.85rem;
  color: #9aa0a6;
}
.donate-card,
.list-card {
  border-radius: 12px;
}
.card-title {
  font-size: 0.95rem;
  color: #6b7280;
  margin-bottom: 0.35rem;
  font-weight: 700;
}
.card-value {
  font-size: 1.9rem;
  font-weight: 700;
  color: #1f2937;
}
.card-foot {
  margin-top: 0.45rem;
  font-size: 0.85rem;
  color: #9aa0a6;
}
.list-title {
  font-size: 1rem;
  font-weight: 700;
  color: #374151;
  margin-bottom: 0.75rem;
}
.list-body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 0.65rem;
  border-bottom: 1px solid #eef1f4;
}
.list-item:last-child {
  border-bottom: none;
}
.list-main {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.list-icon {
  font-size: 1.4rem;
}
.list-label {
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.15rem;
}
.list-meta {
  font-size: 0.85rem;
  color: #9aa0a6;
}
.list-value {
  font-size: 0.95rem;
  font-weight: 700;
  color: #374151;
}
.list-empty {
  color: #9aa0a6;
  font-size: 0.9rem;
  padding: 0.5rem 0;
}
</style>
