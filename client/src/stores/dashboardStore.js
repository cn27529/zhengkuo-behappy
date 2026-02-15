// src/stores/dashboardStore.js
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useActivityStore } from "./activityStore.js";
import { useJoinRecordStore } from "./joinRecordStore.js";
import { useMonthlyDonateStore } from "./monthlyDonateStore.js";
import { DateUtils } from "../utils/dateUtils.js";

// 安全解析日期字串，失敗回傳 null
const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

// 將數值字串轉為數字，非數字回傳 0
const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

// 將多種布林/數字字串規格統一為 boolean
const normalizeBool = (value) => {
  return value === true || value === 1 || value === "1" || value === "true";
};

// 付款狀態優先採用 record.paymentState，若無則以金額推導
const resolvePaymentState = (record) => {
  const normalized = String(record?.paymentState || "").toLowerCase();
  if (["paid", "partial", "unpaid", "waived"].includes(normalized)) {
    return normalized;
  }

  const finalAmount = toNumber(record?.finalAmount);
  const paidAmount = toNumber(record?.paidAmount);

  if (finalAmount <= 0) return "waived";
  if (paidAmount >= finalAmount) return "paid";
  if (paidAmount > 0) return "partial";
  return "unpaid";
};

// 取參加記錄建立時間（兼容多種欄位）
const getRecordDate = (record) => {
  return (
    parseDate(record?.createdAt) || parseDate(record?.date_created) || null
  );
};

// 取祈福登記建立時間（兼容多種欄位）
const getRegistrationDate = (registration) => {
  return (
    parseDate(registration?.createdAt) ||
    parseDate(registration?.date_created) ||
    null
  );
};

// 取得 YYYYMM 格式
const getYearMonth = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}${month}`;
};

// 取得未來 N 個月的 YYYYMM 清單
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

// 判斷登記表是否有缺漏或不一致（對應 business-logic 驗證規則）
const isRegistrationNeedsAttention = (registration) => {
  if (!registration) return false;

  const contact = registration.contact || {};
  const hasContactName = Boolean(contact.name && contact.name.trim());
  const hasContactPhone = Boolean(
    (contact.phone && contact.phone.trim()) ||
    (contact.mobile && contact.mobile.trim()),
  );
  const hasContactRelationship = Boolean(
    contact.relationship && contact.relationship.trim(),
  );
  const hasOtherRelationship =
    contact.relationship === "其它"
      ? Boolean(contact.otherRelationship && contact.otherRelationship.trim())
      : true;

  if (
    !hasContactName ||
    !hasContactPhone ||
    !hasContactRelationship ||
    !hasOtherRelationship
  ) {
    return true;
  }

  const blessing = registration.blessing || {};
  const blessingPersons = Array.isArray(blessing.persons)
    ? blessing.persons
    : [];
  const hasBlessingPerson = blessingPersons.some(
    (person) => person?.name || person?.zodiac || person?.notes,
  );
  const hasBlessingAddress = Boolean(
    blessing.address && blessing.address.trim(),
  );
  const hasIncompleteBlessingPerson = blessingPersons.some((person) => {
    if (!person) return false;
    if (!person.name && !person.zodiac && !person.notes) return false;
    return !person.name || !person.zodiac;
  });

  if (hasBlessingPerson && !hasBlessingAddress) return true;
  if (hasIncompleteBlessingPerson) return true;

  const salvation = registration.salvation || {};
  const ancestors = Array.isArray(salvation.ancestors)
    ? salvation.ancestors
    : [];
  const survivors = Array.isArray(salvation.survivors)
    ? salvation.survivors
    : [];

  const hasAncestor = ancestors.some(
    (ancestor) => ancestor?.surname || ancestor?.notes || ancestor?.zodiac,
  );
  const hasSurvivor = survivors.some(
    (survivor) => survivor?.name || survivor?.notes || survivor?.zodiac,
  );
  const hasSalvationAddress = Boolean(
    salvation.address && salvation.address.trim(),
  );

  const hasIncompleteAncestor = ancestors.some((ancestor) => {
    if (!ancestor) return false;
    if (!ancestor.surname && !ancestor.notes && !ancestor.zodiac) return false;
    return !ancestor.surname;
  });

  const hasIncompleteSurvivor = survivors.some((survivor) => {
    if (!survivor) return false;
    if (!survivor.name && !survivor.notes && !survivor.zodiac) return false;
    return !survivor.name;
  });

  if ((hasAncestor || hasSurvivor) && !hasSalvationAddress) return true;
  if (hasAncestor && !hasSurvivor) return true;
  if (hasIncompleteAncestor || hasIncompleteSurvivor) return true;

  const isSubmitted =
    registration.state && !["draft", "creating"].includes(registration.state);
  if (isSubmitted && !hasBlessingPerson && !hasAncestor) return true;

  return false;
};

export const useDashboardStore = defineStore("dashboard", () => {
  const activityStore = useActivityStore();
  const joinRecordStore = useJoinRecordStore();
  const monthlyDonateStore = useMonthlyDonateStore();

  // 全域載入狀態與錯誤
  const loading = ref(false);
  const error = ref(null);
  const lastUpdatedAt = ref("");

  // 來源資料（活動 / 參加記錄 / 贊助 / 登記）
  const allActivities = computed(() => activityStore.activities || []);
  const upcomingActivities = computed(
    () => activityStore.upcomingActivities || [],
  );
  const completedActivities = computed(
    () => activityStore.completedActivities || [],
  );

  // 參加記錄以 getAllJoinRecords() 回傳為主，避免 store 未同步
  const joinRecordsSource = ref([]);
  const joinRecords = computed(() => joinRecordsSource.value || []);
  // 登記資料以 getAllRegistrations() 回傳為主，避免 store 未同步
  const registrationsSource = ref([]);
  const registrations = computed(() => registrationsSource.value || []);
  // 贊助資料以 getAllDonates() 回傳為主，避免 store 未同步
  const allDonatesSource = ref([]);
  const allDonates = computed(() => allDonatesSource.value || []);

  // 入口指標
  const totalParticipants = computed(
    () => activityStore.totalParticipants || 0,
  );
  const totalRegistrations = computed(() => registrations.value.length);
  const totalJoinRecords = computed(() => joinRecords.value.length);
  const totalDonors = computed(() => allDonates.value.length);

  // 付款概覽（筆數 + 金額）
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

  // 未收金額 = 應收 - 已收
  const totalUnpaidAmount = computed(() => {
    const value =
      paymentSummary.value.totalReceivable - paymentSummary.value.totalPaid;
    return value > 0 ? value : 0;
  });

  // 需收據但尚未開立
  const receiptPendingCount = computed(() => {
    return joinRecords.value.filter(
      (record) =>
        normalizeBool(record?.needReceipt) &&
        !normalizeBool(record?.receiptIssued),
    ).length;
  });

  // 已付款但未沖帳
  const accountingPendingCount = computed(() => {
    return joinRecords.value.filter((record) => {
      const state = resolvePaymentState(record);
      return record?.accountingState !== "reconciled" && state === "paid";
    }).length;
  });

  // 需補件/資料不一致的登記表
  const formsNeedAttentionCount = computed(() => {
    return registrations.value.filter(isRegistrationNeedsAttention).length;
  });

  // 最新登記清單（最多 6 筆）
  const recentRegistrations = computed(() => {
    return [...registrations.value]
      .map((reg) => ({
        ...reg,
        _date: getRegistrationDate(reg),
      }))
      .filter((reg) => reg._date)
      .sort((a, b) => b._date - a._date)
      .slice(0, 6);
  });

  // 最新參加記錄（最多 6 筆）
  const recentJoinRecords = computed(() => {
    return [...joinRecords.value]
      .map((record) => ({
        ...record,
        _date: getRecordDate(record),
      }))
      .filter((record) => record._date)
      .sort((a, b) => b._date - a._date)
      .slice(0, 6);
  });

  // 近 7 日新增登記
  const registrationsInLast7Days = computed(() => {
    return registrations.value.filter((registration) =>
      DateUtils.isWithinDays(
        registration?.createdAt || registration?.date_created,
        7,
      ),
    ).length;
  });

  // 近 7 日新增參加記錄
  const joinRecordsInLast7Days = computed(() => {
    return joinRecords.value.filter((record) =>
      DateUtils.isWithinDays(record?.createdAt || record?.date_created, 7),
    ).length;
  });

  // 本月贊助總額與贊助者數
  const currentMonthDonateSummary = computed(() => {
    const currentMonth = getYearMonth(new Date());
    let total = 0;
    let donors = 0;

    allDonates.value.forEach((donate) => {
      const hasMonth = donate?.donateItems?.some((item) =>
        item?.months?.includes(currentMonth),
      );
      if (hasMonth) donors += 1;

      donate?.donateItems?.forEach((item) => {
        if (item?.months?.includes(currentMonth)) {
          total += toNumber(item?.price);
        }
      });
    });

    return { total, donors };
  });

  // 未來 3 個月已排定贊助總額
  const next3MonthsDonateTotal = computed(() => {
    const months = getNextYearMonths(3, { includeCurrent: false });
    let total = 0;
    allDonates.value.forEach((donate) => {
      donate?.donateItems?.forEach((item) => {
        const monthsMatch = item?.months?.some((month) =>
          months.includes(month),
        );
        if (monthsMatch) {
          total += toNumber(item?.price);
        }
      });
    });
    return total;
  });

  // 即將到來活動（依日期排序）
  const upcomingActivityHighlights = computed(() => {
    return [...upcomingActivities.value]
      .filter((activity) => activity?.date)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 4);
  });

  // 最近完成活動（依日期排序）
  const completedActivityHighlights = computed(() => {
    return [...completedActivities.value]
      .filter((activity) => activity?.date)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 4);
  });

  // 儀表板一次載入所需資料
  const initialize = async () => {
    loading.value = true;
    error.value = null;
    try {
      const [, joinRecordsResult, registrationsResult, donatesResult] =
        await Promise.all([
          activityStore.initialize(),
          joinRecordStore.getAllJoinRecords(),
          joinRecordStore.getAllRegistrations(),
          monthlyDonateStore.getAllDonates(),
        ]);

      if (Array.isArray(joinRecordsResult)) {
        joinRecordsSource.value = joinRecordsResult;
      } else if (Array.isArray(joinRecordsResult?.data)) {
        joinRecordsSource.value = joinRecordsResult.data;
      } else {
        joinRecordsSource.value = joinRecordStore.allJoinRecords || [];
      }

      if (Array.isArray(registrationsResult)) {
        registrationsSource.value = registrationsResult;
      } else if (Array.isArray(registrationsResult?.data)) {
        registrationsSource.value = registrationsResult.data;
      } else {
        registrationsSource.value = joinRecordStore.allRegistrations || [];
      }

      if (Array.isArray(donatesResult)) {
        allDonatesSource.value = donatesResult;
      } else if (Array.isArray(donatesResult?.data)) {
        allDonatesSource.value = donatesResult.data;
      } else if (Array.isArray(monthlyDonateStore.allDonates)) {
        allDonatesSource.value = monthlyDonateStore.allDonates;
      } else {
        allDonatesSource.value = [];
      }
      lastUpdatedAt.value = DateUtils.getCurrentISOTime();
    } catch (err) {
      console.error("Dashboard 初始化失敗:", err);
      error.value = err?.message || "初始化失敗";
    } finally {
      loading.value = false;
    }
  };

  return {
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
    accountingPendingCount,
    formsNeedAttentionCount,

    registrationsInLast7Days,
    joinRecordsInLast7Days,

    currentMonthDonateSummary,
    next3MonthsDonateTotal,

    upcomingActivities,
    completedActivities,
    upcomingActivityHighlights,
    completedActivityHighlights,
    recentRegistrations,
    recentJoinRecords,

    initialize,
  };
});
