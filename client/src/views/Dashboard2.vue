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
          <div class="status-title">待開立收據</div>
          <div class="status-value">{{ receiptPendingCount }}</div>
          <div class="status-foot">需收據尚未開立</div>
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

    <el-row :gutter="24" class="summary-row">
      <el-col :xs="24" :sm="12" :lg="8">
        <el-card shadow="hover" class="finance-card">
          <div class="card-title">應收總額</div>
          <div class="card-value">
            {{ formatCurrency(paymentSummary.totalReceivable) }}
          </div>
          <div class="card-foot">含已收與未收款項</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="8">
        <el-card shadow="hover" class="finance-card">
          <div class="card-title">已收金額</div>
          <div class="card-value">
            {{ formatCurrency(paymentSummary.totalPaid) }}
          </div>
          <div class="card-foot">付款狀態已更新</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="8">
        <el-card shadow="hover" class="finance-card">
          <div class="card-title">未收金額</div>
          <div class="card-value">{{ formatCurrency(totalUnpaidAmount) }}</div>
          <div class="card-foot">仍需催收與追蹤</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="24" class="summary-row">
      <el-col :xs="24" :sm="12" :lg="12">
        <el-card shadow="hover" class="donate-card">
          <div class="card-title">本月贊助總額</div>
          <div class="card-value">
            {{ formatCurrency(currentMonthDonateSummary.total) }}
          </div>
          <div class="card-foot">
            活躍贊助者 {{ currentMonthDonateSummary.donors }} 人
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="12">
        <el-card shadow="hover" class="donate-card">
          <div class="card-title">未來 3 個月排定贊助</div>
          <div class="card-value">
            {{ formatCurrency(next3MonthsDonateTotal) }}
          </div>
          <div class="card-foot">提前掌握可預期收入</div>
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
          <div class="list-title">最近完成活動</div>
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
          <div class="list-title">最新祈福登記</div>
          <div v-if="recentRegistrations.length" class="list-body">
            <div
              v-for="registration in recentRegistrations"
              :key="registration.id"
              class="list-item"
            >
              <div class="list-main">
                <div class="list-label">
                  {{ registration.contact?.name || "未填聯絡人" }}
                </div>
                <div class="list-meta">
                  {{
                    registration.contact?.mobile || registration.contact?.phone
                  }}
                  {{ registration.contact?.relationship }}
                  ·
                  {{
                    formatDate(
                      registration.createdAt || registration.date_created,
                    )
                  }}
                </div>
              </div>
              <div class="list-value">{{ registration.state || "-" }}</div>
            </div>
          </div>
          <div v-else class="list-empty">暫無登記資料</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="list-card">
          <div class="list-title">最新參加記錄</div>
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
                  <span v-for="item in record.items">
                    
                    <el-badge
                      :value="item.quantity"
                      class="item"
                      color="lightblue"
                      size="small"
                      style="margin-right: 13px"
                      v-if="false"
                    >
                    <el-button
                      size="small"
                      type="primary"
                      
                      >{{ item.label }}</el-button
                    >
                  </el-badge>

                    <el-button v-if="item.label!=='陽上人'"
                      size="small"
                      type="warning"
                      style="margin-right: 13px"
                      >{{ item.label }}</el-button
                    >
                  </span>

                  {{ record.totalAmount }} 元 ·
                  {{ formatDate(record.createdAt || record.date_created) }}
                </div>
              </div>
              <div class="list-value">
                {{ formatCurrency(record.finalAmount) }}
              </div>
            </div>
          </div>
          <div v-else class="list-empty">暫無參加記錄</div>
        </el-card>
      </el-col>
    </el-row>
  </main>
</template>

<script setup>
import { computed, onMounted } from "vue";
import { useDashboardStore } from "../stores/dashboardStore.js";
import { DateUtils } from "../utils/dateUtils.js";
import AnimatedNumber from "../components/AnimatedNumber.vue";
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

const dashboardStore = useDashboardStore();

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
const next3MonthsDonateTotal = computed(
  () => dashboardStore.next3MonthsDonateTotal,
);
const paymentSummary = computed(() => dashboardStore.paymentSummary);
const totalUnpaidAmount = computed(() => dashboardStore.totalUnpaidAmount);
const receiptPendingCount = computed(() => dashboardStore.receiptPendingCount);
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

const formatDate = (value) => DateUtils.formatDate(value);
const formatDateTime = (value) => DateUtils.formatDateTime(value);
const formatCurrency = (value) =>
  new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

onMounted(async () => {
  await dashboardStore.initialize();
});
</script>

<style scoped>
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
  font-weight: 600;
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
}

.status-value {
  font-size: 1.8rem;
  font-weight: 600;
  color: #1f2937;
}

.status-foot {
  margin-top: 0.45rem;
  font-size: 0.85rem;
  color: #9aa0a6;
}

.finance-card,
.donate-card,
.list-card {
  border-radius: 12px;
}

.card-title {
  font-size: 0.95rem;
  color: #6b7280;
  margin-bottom: 0.35rem;
}

.card-value {
  font-size: 1.9rem;
  font-weight: 600;
  color: #1f2937;
}

.card-foot {
  margin-top: 0.45rem;
  font-size: 0.85rem;
  color: #9aa0a6;
}

.list-title {
  font-size: 1rem;
  font-weight: 600;
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
  padding-bottom: 0;
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
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.15rem;
}

.list-meta {
  font-size: 0.85rem;
  color: #9aa0a6;
}

.list-value {
  font-size: 0.95rem;
  font-weight: 600;
  color: #374151;
}

.list-empty {
  color: #9aa0a6;
  font-size: 0.9rem;
  padding: 0.5rem 0;
}

@media (max-width: 768px) {
  .dashboard2 {
    padding: 1.25rem 1rem 2rem;
  }

  .header-meta {
    text-align: left;
  }

  .summary-card,
  .status-card,
  .finance-card,
  .donate-card,
  .list-card {
    min-height: auto;
  }
}
</style>
