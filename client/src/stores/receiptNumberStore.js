// client/src/stores/receiptNumberStore.js
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { rustReceiptNumberService } from "../rustServices/rustReceiptNumberService.js";
import { receiptNumberService } from "../services/receiptNumberService.js";
import { authService } from "../services/authService.js";
import { DateUtils } from "../utils/dateUtils.js";

/**
 * 收據編號的 Pinia store，管理收據生成、歷史記錄與狀態。
 * @module stores/receiptNumberStore
 */
export const useReceiptNumberStore = defineStore("receiptNumber", () => {
  // ========== 狀態 (State) ==========
  const allReceiptNumbers = ref([]);
  const loading = ref(false);
  const error = ref(null);

  // 搜尋與過濾狀態
  const searchQuery = ref("");
  const selectedType = ref("all"); // stamp, standard, all
  const selectedYearMonth = ref("");

  // ========== Getter - 計算屬性 (Getters) ==========

  /**
   * 獲取過濾後的收據列表
   */
  const filteredReceiptNumbers = computed(() => {
    let filtered = allReceiptNumbers.value;

    if (selectedType.value !== "all") {
      filtered = filtered.filter((r) => r.receiptType === selectedType.value);
    }

    if (selectedYearMonth.value) {
      filtered = filtered.filter(
        (r) => r.yearMonth === selectedYearMonth.value,
      );
    }

    if (searchQuery.value) {
      const keyword = searchQuery.value.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.receiptNumber.toLowerCase().includes(keyword) ||
          r.recordId?.toString().includes(keyword),
      );
    }

    return filtered;
  });

  /**
   * 統計當月已生成的數量
   */
  const monthlyCount = computed(() => {
    return (type) => {
      const currentYM =
        DateUtils.getCurrentISOTime().slice(2, 4) +
        DateUtils.getCurrentISOTime().slice(5, 7);
      return allReceiptNumbers.value.filter(
        (r) =>
          r.yearMonth === currentYM &&
          r.receiptType === type &&
          r.state === "active",
      ).length;
    };
  });

  // ========== Actions - 方法 ==========

  /*
   * 作廢合併打印
   */
  const removeMergedReceiptNumber = async (
    receiptNumber,
    state,
    receiptType,
    voidReason,
    recordIds,
  ) => {
    loading.value = true;
    error.value = null;
    try {
      // 從 authService 獲取當前登入使用者的 UUID
      const currentUserId = authService.getCurrentUser();

      console.log(
        `🚀 開始作廢合併編號: receiptNumber=${receiptNumber}, state=${state}, receiptType=${receiptType}, voidReason=${voidReason}, recordIds=${recordIds}, userId=${currentUserId}`,
      );

      const result = await rustReceiptNumberService.removeMergedReceiptNumber(
        receiptNumber,
        state,
        receiptType,
        voidReason,
        recordIds,
        {
          userId: currentUserId,
        },
      );

      if (result.success) {
        // 從本地列表中移除作廢的合併編號
        allReceiptNumbers.value = allReceiptNumbers.value.filter(
          (r) => r.receiptNumber !== receiptNumber,
        );
        console.log("✅ 合併編號作廢成功:", receiptNumber);
        return result;
      } else {
        error.value = result.message;
        console.error("❌ 合併編號作廢失敗:", result.message);
        return result;
      }
    } catch (err) {
      error.value = err.message;
      console.error("❌ 合併編號作廢異常:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // ========== Actions - 方法 ==========

  /*
   * 生成合併打印編號
   */
  const generateMergedReceiptNumber = async (
    recordIds,
    receiptType,
    state,
    voidReason,
  ) => {
    loading.value = true;
    error.value = null;

    try {
      // 從 authService 獲取當前登入使用者的 UUID
      const currentUserId = authService.getCurrentUser();

      console.log(
        `🚀 開始生成合併打印編號: recordIds=${recordIds}, receiptType=${receiptType}, state=${state}, voidReason=${voidReason}, userId=${currentUserId}`,
      );

      // 將 userId 作为 additionalContext 傳遞給 Service
      const result = await rustReceiptNumberService.generateMergedReceiptNumber(
        recordIds,
        receiptType,
        state,
        voidReason,
        {
          userId: currentUserId,
        },
      );

      if (result.success) {
        // 更新本地列表快照
        allReceiptNumbers.value.unshift(result.data);
        console.log("✅ 合併打印編號生成成功:", result.data.receiptNumber);
        return result;
      } else {
        error.value = result.message;
        console.error("❌ 合併打印編號生成失敗:", result.message);
        return result;
      }
    } catch (err) {
      error.value = err.message;
      console.error("❌ 合併打印編號異常:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * ✅ 🔥 核心功能：原子性生成收據編號 (供 JoinRecordReceiptPrint.vue 使用)
   * 內部會自動代理至 Rust 高性能軌道
   */
  const generateReceiptNumber = async (recordId, receiptType) => {
    loading.value = true;
    error.value = null;

    try {
      // 從 authService 獲取當前登入使用者的 UUID
      const currentUserId = authService.getCurrentUser();

      console.log(
        `🚀 開始生成編號: RecordID=${recordId}, Type=${receiptType}, User=${currentUserId}`,
      );

      // 將 userId 作為 additionalContext 傳遞給 Service
      const result = await rustReceiptNumberService.generateReceiptNumber(
        recordId,
        receiptType,
        {
          userId: currentUserId,
        },
      );

      if (result.success) {
        // 更新本地列表快照
        allReceiptNumbers.value.unshift(result.data);
        console.log("✅ 編號生成成功:", result.data.receiptNumber);
        return result;
      } else {
        error.value = result.message;
        console.error("❌ 編號生成失敗:", result.message);
        return result;
      }
    } catch (err) {
      error.value = err.message;
      console.error("❌ 生成編號異常:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 獲取所有編號歷史
   */
  const fetchAllReceiptNumbers = async (params = {}) => {
    loading.value = true;
    error.value = null;

    try {
      // 這裡優先使用 Rust 軌道獲取數據 (高性能)
      const result =
        await rustReceiptNumberService.getAllReceiptNumbers(params);

      if (result.success) {
        allReceiptNumbers.value = result.data || [];
        return result;
      } else {
        error.value = result.message;
        return result;
      }
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  //
  const stateReceiptNumber = async (id, voidReason, state = "void") => {
    loading.value = true;
    error.value = null;

    try {
      const result = await receiptNumberService.stateReceiptNumber(
        id,
        voidReason,
        state,
      );

      if (result.success) {
        const index = allReceiptNumbers.value.findIndex((r) => r.id === id);
        if (index !== -1) {
          allReceiptNumbers.value[index].state = state;
          allReceiptNumbers.value[index].voidReason = voidReason;
        }
        return result;
      } else {
        error.value = result.message;
        return result;
      }
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 作廢收據編號
   */
  const voidReceiptNumber = async (id, voidReason, additionalContext = {}) => {
    loading.value = true;
    error.value = null;

    try {
      const result = await receiptNumberService.voidReceiptNumber(
        id,
        voidReason,
        { state: additionalContext.state || "void" }, // 允許外部指定狀態，默認為 "void"
      );

      if (result.success) {
        const index = allReceiptNumbers.value.findIndex((r) => r.id === id);
        if (index !== -1) {
          allReceiptNumbers.value[index].state = "void";
          allReceiptNumbers.value[index].voidReason = voidReason;
        }
        return result;
      } else {
        error.value = result.message;
        return result;
      }
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 初始化
   */
  const initialize = async () => {
    const currentYM =
      new Date().toISOString().slice(2, 4) +
      new Date().toISOString().slice(5, 7);
    selectedYearMonth.value = currentYM;
    await fetchAllReceiptNumbers({ yearMonth: currentYM });
  };

  // 獲取用戶信息
  const getCurrentUser = () => {
    return authService.getCurrentUser();
  };

  const getUserName = () => {
    return authService.getUserName() || "沒有名稱";
  };

  // ========== 返回 Store 接口 ==========
  return {
    // 狀態
    allReceiptNumbers,
    loading,
    error,
    searchQuery,
    selectedType,
    selectedYearMonth,

    // Getters
    filteredReceiptNumbers,
    monthlyCount,
    getCurrentUser,
    getUserName,

    // Actions
    generateReceiptNumber,
    fetchAllReceiptNumbers,
    voidReceiptNumber,
    initialize,
    stateReceiptNumber,
    generateMergedReceiptNumber,
    removeMergedReceiptNumber,
  };
});
