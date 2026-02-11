<template>
  <main class="main-content">
    <div class="page-header">
      <h2>系統資訊牆</h2>
    </div>

    <!-- 財務概覽 -->
    <el-row :gutter="24" class="stats-grid">
      <el-col :xs="24" :sm="12" :md="8" :lg="6">
        <el-card shadow="hover" class="stat-card financial">
          <div class="stat-icon">💰</div>
          <div class="stat-info">
            <h3>本月收入</h3>
            <div class="stat-number">{{ formatCurrency(monthlyIncome) }}</div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="8" :lg="6">
        <el-card shadow="hover" class="stat-card pending">
          <div class="stat-icon">⏳</div>
          <div class="stat-info">
            <h3>待收款項</h3>
            <div class="stat-number">{{ formatCurrency(pendingPayments) }}</div>
            <div class="stat-label">{{ pendingPaymentCount }} 筆</div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="8" :lg="6">
        <el-card shadow="hover" class="stat-card reconciled">
          <div class="stat-icon">✅</div>
          <div class="stat-info">
            <h3>已沖帳</h3>
            <div class="stat-number">{{ formatCurrency(reconciledAmount) }}</div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="8" :lg="6">
        <el-card shadow="hover" class="stat-card warning">
          <div class="stat-icon">📋</div>
          <div class="stat-info">
            <h3>待處理</h3>
            <div class="stat-number">{{ pendingAccountingCount }}</div>
            <div class="stat-label">待沖帳</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 業務統計 -->
    <el-row :gutter="24" class="stats-grid">
      <el-col :xs="24" :sm="12" :md="8" :lg="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon">📝</div>
          <div class="stat-info">
            <h3>本月登記</h3>
            <div class="stat-number">{{ monthlyRegistrations }}</div>
            <div class="stat-label">筆</div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="8" :lg="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon">🙏</div>
          <div class="stat-info">
            <h3>消災人數</h3>
            <div class="stat-number">{{ monthlyBlessingCount }}</div>
            <div class="stat-label">人</div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="8" :lg="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon">🕯️</div>
          <div class="stat-info">
            <h3>超度人數</h3>
            <div class="stat-number">{{ monthlySalvationCount }}</div>
            <div class="stat-label">人</div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="8" :lg="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon">🧾</div>
          <div class="stat-info">
            <h3>待開收據</h3>
            <div class="stat-number">{{ pendingReceiptCount }}</div>
            <div class="stat-label">筆</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 即將到來的活動 -->
    <el-card shadow="hover" class="section-card">
      <template #header>
        <div class="card-header">
          <span>📅 即將到來的活動</span>
        </div>
      </template>
      <el-empty v-if="upcomingActivities.length === 0" description="暫無活動" />
      <div v-else class="activity-list">
        <div
          v-for="activity in upcomingActivities"
          :key="activity.activityId"
          class="activity-item"
        >
          <div class="activity-icon">{{ activity.icon }}</div>
          <div class="activity-info">
            <div class="activity-name">{{ activity.name }}</div>
            <div class="activity-date">{{ formatDate(activity.date) }}</div>
          </div>
          <div class="activity-participants">{{ activity.participants }} 人</div>
        </div>
      </div>
    </el-card>

    <!-- 最新登記記錄 -->
    <el-card shadow="hover" class="section-card">
      <template #header>
        <div class="card-header">
          <span>📋 最新登記記錄</span>
        </div>
      </template>
      <el-empty v-if="recentRegistrations.length === 0" description="暫無記錄" />
      <div v-else class="record-list">
        <div
          v-for="reg in recentRegistrations"
          :key="reg.id"
          class="record-item"
        >
          <div class="record-info">
            <div class="record-name">{{ reg.contact?.name }}</div>
            <div class="record-date">{{ formatDateTime(reg.createdAt) }}</div>
          </div>
          <div class="record-stats">
            <span v-if="getBlessingCount(reg) > 0" class="stat-badge">
              消災 {{ getBlessingCount(reg) }}
            </span>
            <span v-if="getAncestorCount(reg) > 0" class="stat-badge">
              超度 {{ getAncestorCount(reg) }}
            </span>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 最新參加記錄 -->
    <el-card shadow="hover" class="section-card">
      <template #header>
        <div class="card-header">
          <span>💳 最新參加記錄</span>
        </div>
      </template>
      <el-empty v-if="recentJoinRecords.length === 0" description="暫無記錄" />
      <div v-else class="record-list">
        <div
          v-for="record in recentJoinRecords"
          :key="record.id"
          class="record-item"
        >
          <div class="record-info">
            <div class="record-name">{{ record.contact?.name }}</div>
            <div class="record-date">{{ formatDateTime(record.createdAt) }}</div>
          </div>
          <div class="record-amount">
            <span class="amount">{{ formatCurrency(record.finalAmount) }}</span>
            <span :class="['status', getPaymentStatusClass(record.paymentState)]">
              {{ getPaymentStatusText(record.paymentState) }}
            </span>
          </div>
        </div>
      </div>
    </el-card>
  </main>
</template>

<script setup>
import { computed, onMounted } from "vue";
import { useDashboardStore3 } from "../stores/dashboardStore3.js";
import { DateUtils } from "../utils/dateUtils.js";

const store = useDashboardStore3();

const monthlyIncome = computed(() => store.monthlyIncome);
const pendingPayments = computed(() => store.pendingPayments);
const pendingPaymentCount = computed(() => store.pendingPaymentCount);
const reconciledAmount = computed(() => store.reconciledAmount);
const pendingAccountingCount = computed(() => store.pendingAccountingCount);
const monthlyRegistrations = computed(() => store.monthlyRegistrations);
const monthlyBlessingCount = computed(() => store.monthlyBlessingCount);
const monthlySalvationCount = computed(() => store.monthlySalvationCount);
const pendingReceiptCount = computed(() => store.pendingReceiptCount);
const upcomingActivities = computed(() => store.upcomingActivities);
const recentRegistrations = computed(() => store.recentRegistrations);
const recentJoinRecords = computed(() => store.recentJoinRecords);

const formatCurrency = (amount) => {
  return `$${amount.toLocaleString()}`;
};

const formatDate = (dateString) => {
  return DateUtils.formatDate(dateString);
};

const formatDateTime = (dateString) => {
  return DateUtils.formatDateTime(dateString);
};

const getBlessingCount = (reg) => {
  return reg.blessing?.persons?.filter((p) => p.name?.trim()).length || 0;
};

const getAncestorCount = (reg) => {
  return reg.salvation?.ancestors?.filter((a) => a.surname?.trim()).length || 0;
};

const getPaymentStatusText = (status) => {
  const map = {
    paid: "已付款",
    partial: "部分付款",
    unpaid: "未付款",
    waived: "免付",
  };
  return map[status] || status;
};

const getPaymentStatusClass = (status) => {
  const map = {
    paid: "success",
    partial: "warning",
    unpaid: "danger",
    waived: "info",
  };
  return map[status] || "";
};

onMounted(async () => {
  await store.initialize();
});
</script>

<style scoped>
.stats-grid {
  margin-bottom: 24px;
}

.stat-card {
  border-radius: 10px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  height: 100%;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
}

.stat-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  padding: 1.5rem;
}

.stat-card.financial {
  border-left: 4px solid #4caf50;
}

.stat-card.pending {
  border-left: 4px solid #ff9800;
}

.stat-card.reconciled {
  border-left: 4px solid #2196f3;
}

.stat-card.warning {
  border-left: 4px solid #f44336;
}

.stat-icon {
  font-size: 2.5rem;
  margin-right: 1rem;
  opacity: 0.8;
  flex-shrink: 0;
}

.stat-info {
  flex: 1;
}

.stat-info h3 {
  font-size: 1rem;
  color: #666;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: var(--primary-color);
  margin-bottom: 0.25rem;
  line-height: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: #888;
}

.section-card {
  margin-bottom: 24px;
  border-radius: 10px;
}

.card-header {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--primary-color);
}

.activity-list,
.record-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.activity-item,
.record-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
  transition: background 0.3s;
}

.activity-item:hover,
.record-item:hover {
  background: #f0f0f0;
}

.activity-icon {
  font-size: 1.5rem;
  margin-right: 12px;
}

.activity-info,
.record-info {
  flex: 1;
}

.activity-name,
.record-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.activity-date,
.record-date {
  font-size: 0.875rem;
  color: #888;
}

.activity-participants {
  font-weight: 600;
  color: var(--primary-color);
}

.record-stats {
  display: flex;
  gap: 8px;
}

.stat-badge {
  padding: 4px 8px;
  background: var(--primary-color);
  color: white;
  border-radius: 4px;
  font-size: 0.75rem;
}

.record-amount {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.amount {
  font-weight: 600;
  color: #333;
}

.status {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
}

.status.success {
  background: #4caf50;
  color: white;
}

.status.warning {
  background: #ff9800;
  color: white;
}

.status.danger {
  background: #f44336;
  color: white;
}

.status.info {
  background: #2196f3;
  color: white;
}

@media (max-width: 768px) {
  .stat-card :deep(.el-card__body) {
    flex-direction: column;
    text-align: center;
  }

  .stat-icon {
    margin-right: 0;
    margin-bottom: 0.5rem;
  }
}
</style>
