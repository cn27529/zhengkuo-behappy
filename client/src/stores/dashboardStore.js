// src/stores/dashboardStore.js
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useActivityStore } from "./activityStore.js";
import { useJoinRecordStore } from "./joinRecordStore.js";
import { useMonthlyDonateStore } from "./monthlyDonateStore.js";
import { DateUtils } from "../utils/dateUtils.js";
import { BoolUtils } from "../utils/boolUtils.js";

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const resolvePaymentState = (record) => {
  const normalized = String(record?.paymentState || "").toLowerCase();
  if (["paid", "partial", "unpaid", "waived"].includes(normalized))
    return normalized;
  const finalAmount = toNumber(record?.finalAmount);
  const paidAmount = toNumber(record?.paidAmount);
  if (finalAmount <= 0) return "waived";
  if (paidAmount >= finalAmount) return "paid";
  if (paidAmount > 0) return "partial";
  return "unpaid";
};

const getRecordDate = (record) =>
  parseDate(record?.createdAt) || parseDate(record?.date_created) || null;
const getRegistrationDate = (registration) =>
  parseDate(registration?.createdAt) ||
  parseDate(registration?.date_created) ||
  null;

const getYearMonth = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}${month}`;
};

const getNextYearMonths = (count, { includeCurrent = false } = {}) => {
  const months = [];
  const base = new Date();
  for (let i = 0; i < count; i += 1) {
    const offset = includeCurrent ? i : i + 1;
    const date = new Date(base.getFullYear(), base.getMonth() + offset, 1);
    months.push(getYearMonth(date));
  }
  return months;
};

const isRegistrationNeedsAttention = (registration) => {
  if (!registration) return false;
  const contact = registration.contact || {};
  if (
    !contact.name?.trim() ||
    !(contact.phone?.trim() || contact.mobile?.trim()) ||
    !contact.relationship?.trim()
  )
    return true;
  const blessing = registration.blessing || {};
  if (
    blessing.persons?.some((p) => p?.name || p?.zodiac) &&
    !blessing.address?.trim()
  )
    return true;
  const salvation = registration.salvation || {};
  if (
    (salvation.ancestors?.length || salvation.survivors?.length) &&
    !salvation.address?.trim()
  )
    return true;
  return false;
};

export const useDashboardStore = defineStore("dashboard", () => {
  const activityStore = useActivityStore();
  const joinRecordStore = useJoinRecordStore();
  const monthlyDonateStore = useMonthlyDonateStore();

  const loading = ref(false);
  const error = ref(null);
  const lastUpdatedAt = ref("");

  const joinRecordsSource = ref([]);
  const registrationsSource = ref([]);
  const allDonatesSource = ref([]);

  const joinRecords = computed(() => joinRecordsSource.value || []);
  const registrations = computed(() => registrationsSource.value || []);
  const allDonates = computed(() => allDonatesSource.value || []);

  const totalParticipants = computed(
    () => activityStore.totalParticipants || 0,
  );
  const totalRegistrations = computed(() => registrations.value.length);
  const totalJoinRecords = computed(() => joinRecords.value.length);
  const totalDonors = computed(() => allDonates.value.length);

  // --- 流失預警計算 ---
  const expiringDonors = computed(() => {
    const currentMonth = getYearMonth(new Date());
    const nextMonth = getNextYearMonths(1, { includeCurrent: false })[0];
    const latestMonthMap = new Map();

    allDonates.value.forEach((donate) => {
      const name = donate.name;
      if (!name) return;
      donate.donateItems?.forEach((item) => {
        item.months?.forEach((m) => {
          const currentMax = latestMonthMap.get(name);
          if (!currentMax || m > currentMax) latestMonthMap.set(name, m);
        });
      });
    });

    const list = [];
    latestMonthMap.forEach((lastMonth, name) => {
      if (lastMonth === currentMonth || lastMonth === nextMonth) {
        const info = allDonates.value.find((d) => d.name === name);
        list.push({
          name,
          lastMonth,
          isExpiringThisMonth: lastMonth === currentMonth,
          donateId: info?.donateId,
        });
      }
    });
    return list;
  });

  const expiringDonorsCount = computed(() => expiringDonors.value.length);

  const paymentSummary = computed(() => {
    return joinRecords.value.reduce(
      (acc, record) => {
        const state = resolvePaymentState(record);
        acc[state] = (acc[state] || 0) + 1;
        acc.totalReceivable += toNumber(record?.finalAmount);
        acc.totalPaid += toNumber(record?.paidAmount);
        return acc;
      },
      {
        paid: 0,
        partial: 0,
        unpaid: 0,
        waived: 0,
        totalReceivable: 0,
        totalPaid: 0,
      },
    );
  });

  const totalUnpaidAmount = computed(() =>
    Math.max(
      0,
      paymentSummary.value.totalReceivable - paymentSummary.value.totalPaid,
    ),
  );
  const receiptPendingCount = computed(
    () =>
      joinRecords.value.filter(
        (r) => BoolUtils.normalizeBool(r?.needReceipt) && !r?.receiptIssuedAt,
      ).length,
  );
  const receiptPendingIds = computed(() =>
    joinRecords.value
      .filter(
        (r) => BoolUtils.normalizeBool(r?.needReceipt) && !r?.receiptIssuedAt,
      )
      .map((r) => r.id),
  );
  const accountingPendingCount = computed(
    () =>
      joinRecords.value.filter(
        (r) =>
          resolvePaymentState(r) === "paid" &&
          r?.accountingState !== "reconciled",
      ).length,
  );
  const formsNeedAttentionCount = computed(
    () => registrations.value.filter(isRegistrationNeedsAttention).length,
  );

  const recentRegistrations = computed(() =>
    [...registrations.value]
      .map((reg) => ({ ...reg, _date: getRegistrationDate(reg) }))
      .filter((r) => r._date)
      .sort((a, b) => b._date - a._date)
      .slice(0, 6),
  );
  const recentJoinRecords = computed(() =>
    [...joinRecords.value]
      .map((rec) => ({ ...rec, _date: getRecordDate(rec) }))
      .filter((r) => r._date)
      .sort((a, b) => b._date - a._date)
      .slice(0, 6),
  );

  const registrationsInLast7Days = computed(
    () =>
      registrations.value.filter((r) =>
        DateUtils.isWithinDays(r?.createdAt || r?.date_created, 7),
      ).length,
  );
  const joinRecordsInLast7Days = computed(
    () =>
      joinRecords.value.filter((r) =>
        DateUtils.isWithinDays(r?.createdAt || r?.date_created, 7),
      ).length,
  );

  const currentMonthDonateSummary = computed(() => {
    const currentMonth = getYearMonth(new Date());
    let total = 0,
      donors = 0;
    allDonates.value.forEach((d) => {
      if (d?.donateItems?.some((i) => i?.months?.includes(currentMonth)))
        donors++;
      d?.donateItems?.forEach((i) => {
        if (i?.months?.includes(currentMonth)) total += toNumber(i?.price);
      });
    });
    return { total, donors };
  });

  const next6MonthsDonateTotal = computed(() => {
    const months = getNextYearMonths(6, { includeCurrent: false });
    let total = 0;
    allDonates.value.forEach((d) =>
      d?.donateItems?.forEach((i) => {
        if (i?.months?.some((m) => months.includes(m)))
          total += toNumber(i?.price);
      }),
    );
    return total;
  });

  const upcomingActivityHighlights = computed(() =>
    [...activityStore.upcomingActivities]
      .filter((a) => a?.date)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 4),
  );
  const completedActivityHighlights = computed(() =>
    [...activityStore.completedActivities]
      .filter((a) => a?.date)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 4),
  );

  const initialize = async () => {
    loading.value = true;
    try {
      const [, jrRes, regRes, donRes] = await Promise.all([
        activityStore.initialize(),
        joinRecordStore.getAllJoinRecords(),
        joinRecordStore.getAllRegistrations(),
        monthlyDonateStore.getAllDonates(),
      ]);
      joinRecordsSource.value = Array.isArray(jrRes)
        ? jrRes
        : jrRes?.data || [];
      registrationsSource.value = Array.isArray(regRes)
        ? regRes
        : regRes?.data || [];
      allDonatesSource.value = Array.isArray(donRes)
        ? donRes
        : donRes?.data || [];
      lastUpdatedAt.value = DateUtils.getCurrentISOTime();
    } catch (err) {
      error.value = err?.message || "初始化失敗";
    } finally {
      loading.value = false;
    }
  };

  return {
    getJoinRecordById: (id) => joinRecords.value.find((r) => r.id === id),
    loading,
    error,
    lastUpdatedAt,
    totalParticipants,
    totalRegistrations,
    totalJoinRecords,
    totalDonors,
    paymentSummary,
    totalUnpaidAmount,
    receiptPendingCount,
    receiptPendingIds,
    accountingPendingCount,
    formsNeedAttentionCount,
    registrationsInLast7Days,
    joinRecordsInLast7Days,
    currentMonthDonateSummary,
    next6MonthsDonateTotal,
    expiringDonors,
    expiringDonorsCount,
    upcomingActivityHighlights,
    completedActivityHighlights,
    recentRegistrations,
    recentJoinRecords,
    initialize,
  };
});
