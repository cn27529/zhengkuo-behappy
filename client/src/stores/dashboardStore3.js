import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { serviceAdapter } from "../adapters/serviceAdapter.js";
import mockRegistrations from "../data/mock_registrations.json";
import mockJoinRecords from "../data/mock_participation_records.json";
import mockActivities from "../data/mock_activities.json";

export const useDashboardStore3 = defineStore("dashboard3", () => {
  const registrations = ref([]);
  const joinRecords = ref([]);
  const activities = ref([]);
  const isLoading = ref(false);

  // 初始化數據
  const initialize = async () => {
    isLoading.value = true;
    try {
      if (serviceAdapter.getIsMock()) {
        registrations.value = mockRegistrations;
        joinRecords.value = mockJoinRecords;
        activities.value = mockActivities;
      } else {
        const [regResult, joinResult, actResult] = await Promise.all([
          serviceAdapter.getAllRegistrations(),
          serviceAdapter.getAllParticipationRecords(),
          serviceAdapter.getAllActivities(),
        ]);
        registrations.value = regResult.success ? regResult.data : [];
        joinRecords.value = joinResult.success ? joinResult.data : [];
        activities.value = actResult.success ? actResult.data : [];
      }
    } catch (error) {
      console.error("初始化數據失敗:", error);
    } finally {
      isLoading.value = false;
    }
  };

  // 本月日期範圍
  const getCurrentMonthRange = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return { start, end };
  };

  // 本月新增登記數
  const monthlyRegistrations = computed(() => {
    const { start, end } = getCurrentMonthRange();
    return registrations.value.filter((r) => {
      const date = new Date(r.createdAt);
      return date >= start && date <= end;
    }).length;
  });

  // 本月消災人數
  const monthlyBlessingCount = computed(() => {
    const { start, end } = getCurrentMonthRange();
    return registrations.value
      .filter((r) => {
        const date = new Date(r.createdAt);
        return date >= start && date <= end;
      })
      .reduce((sum, r) => {
        return sum + (r.blessing?.persons?.filter((p) => p.name?.trim()).length || 0);
      }, 0);
  });

  // 本月超度人數
  const monthlySalvationCount = computed(() => {
    const { start, end } = getCurrentMonthRange();
    return registrations.value
      .filter((r) => {
        const date = new Date(r.createdAt);
        return date >= start && date <= end;
      })
      .reduce((sum, r) => {
        return sum + (r.salvation?.ancestors?.filter((a) => a.surname?.trim()).length || 0);
      }, 0);
  });

  // 本月收入
  const monthlyIncome = computed(() => {
    const { start, end } = getCurrentMonthRange();
    return joinRecords.value
      .filter((r) => {
        const date = new Date(r.createdAt);
        return date >= start && date <= end && r.paymentState === "paid";
      })
      .reduce((sum, r) => sum + (r.finalAmount || 0), 0);
  });

  // 待收款項
  const pendingPayments = computed(() => {
    return joinRecords.value
      .filter((r) => r.paymentState === "unpaid" || r.paymentState === "partial")
      .reduce((sum, r) => sum + (r.finalAmount - r.paidAmount || 0), 0);
  });

  // 待收款記錄數
  const pendingPaymentCount = computed(() => {
    return joinRecords.value.filter(
      (r) => r.paymentState === "unpaid" || r.paymentState === "partial"
    ).length;
  });

  // 待開收據數
  const pendingReceiptCount = computed(() => {
    return joinRecords.value.filter((r) => r.needReceipt && !r.receiptIssued).length;
  });

  // 待沖帳數
  const pendingAccountingCount = computed(() => {
    return joinRecords.value.filter(
      (r) => r.paymentState === "paid" && r.accountingState === "pending"
    ).length;
  });

  // 已沖帳金額
  const reconciledAmount = computed(() => {
    return joinRecords.value
      .filter((r) => r.accountingState === "reconciled")
      .reduce((sum, r) => sum + (r.finalAmount || 0), 0);
  });

  // 即將到來的活動
  const upcomingActivities = computed(() => {
    const now = new Date();
    return activities.value
      .filter((a) => new Date(a.date) > now && a.state === "active")
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 3);
  });

  // 最新登記記錄
  const recentRegistrations = computed(() => {
    return [...registrations.value]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
  });

  // 最新參加記錄
  const recentJoinRecords = computed(() => {
    return [...joinRecords.value]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
  });

  return {
    isLoading,
    initialize,
    monthlyRegistrations,
    monthlyBlessingCount,
    monthlySalvationCount,
    monthlyIncome,
    pendingPayments,
    pendingPaymentCount,
    pendingReceiptCount,
    pendingAccountingCount,
    reconciledAmount,
    upcomingActivities,
    recentRegistrations,
    recentJoinRecords,
  };
});
