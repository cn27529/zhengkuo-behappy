// src/stores/priceConfigStore.js
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { serviceAdapter } from "../adapters/serviceAdapter.js";
import { authService } from "../services/authService.js";
import { DateUtils } from "../utils/dateUtils.js";
import mockPriceConfigs from "../data/mock_priceConfigs.json";

// 定義金額項目
export const PRICE_ITEMS = [
  { key: "chaodu", label: "超度/超薦", defaultPrice: 1000 },
  { key: "survivors", label: "陽上人", defaultPrice: 0 },
  { key: "diandeng", label: "點燈", defaultPrice: 600 },
  { key: "qifu", label: "消災祈福", defaultPrice: 300 },
  { key: "xiaozai", label: "固定消災", defaultPrice: 100 },
  { key: "pudu", label: "中元普度", defaultPrice: 1200 },
  { key: "support_triple_gem", label: "護持三寶", defaultPrice: 200 },
  { key: "food_offering", label: "供齋", defaultPrice: 200 },
  { key: "support_temple", label: "護持道場", defaultPrice: 200 },
  { key: "sutra_printing", label: "助印經書", defaultPrice: 200 },
  { key: "life_release", label: "放生", defaultPrice: 200 },
];

/**
 * 金額設定的 Pinia store，管理金額設定的狀態與操作。
 * @module stores/priceConfigStore
 */
export const usePriceConfigStore = defineStore("priceConfig", () => {
  // ========== 狀態 ==========
  const allPriceConfigs = ref([]);
  const loading = ref(false);
  const error = ref(null);

  // 搜尋與分頁狀態
  const searchQuery = ref("");
  const selectedState = ref("");
  const currentPage = ref(1);
  const pageSize = ref(10);

  // ========== 工具函數 ==========

  /**
   * 獲取默認金額設定
   */
  const getDefaultPrices = () => {
    const prices = {};
    PRICE_ITEMS.forEach((item) => {
      prices[item.key] = item.defaultPrice;
    });
    return prices;
  };

  /**
   * 處理從 API 獲取的數據，確保價格欄位完整
   */
  const normalizePriceConfig = (config) => {
    const defaultPrices = getDefaultPrices();
    return {
      ...config,
      prices: {
        ...defaultPrices,
        ...(config.prices || {}),
      },
    };
  };

  // ========== Getter - 計算屬性 ==========

  /**
   * 當前有效的金額設定
   */
  const currentConfig = computed(() => {
    return allPriceConfigs.value.find((config) => config.state === "now");
  });

  /**
   * 歷史設定列表
   */
  const historyConfigs = computed(() => {
    return allPriceConfigs.value.filter((config) => config.state === "history");
  });

  /**
   * 獲取當前有效的價格配置（用於其他服務調用）
   */
  const currentPrices = computed(() => {
    if (currentConfig.value && currentConfig.value.prices) {
      return currentConfig.value.prices;
    }
    return getDefaultPrices();
  });

  /**
   * 根據活動類型獲取價格
   * @param {string} activityType - 活動類型 key
   * @returns {number} 價格
   */
  const getPriceByActivityType = (activityType) => {
    const prices = currentPrices.value;
    return prices[activityType] !== undefined ? prices[activityType] : 0;
  };

  /**
   * 獲取所有活動類型的價格配置（用於前端顯示）
   */
  const getAllPricesWithLabels = computed(() => {
    const prices = currentPrices.value;
    return PRICE_ITEMS.map((item) => ({
      key: item.key,
      label: item.label,
      price:
        prices[item.key] !== undefined ? prices[item.key] : item.defaultPrice,
      defaultPrice: item.defaultPrice,
    }));
  });

  /**
   * 過濾後的設定列表
   */
  const filteredConfigs = computed(() => {
    let filtered = [...allPriceConfigs.value];

    // 狀態篩選
    if (selectedState.value) {
      filtered = filtered.filter(
        (config) => config.state === selectedState.value,
      );
    }

    // 關鍵字搜尋
    if (searchQuery.value) {
      const keyword = searchQuery.value.toLowerCase();
      filtered = filtered.filter(
        (config) =>
          (config.version && config.version.toLowerCase().includes(keyword)) ||
          (config.createdBy &&
            config.createdBy.toLowerCase().includes(keyword)) ||
          (config.user_created &&
            config.user_created?.toLowerCase().includes(keyword)) ||
          (config.notes && config.notes.toLowerCase().includes(keyword)),
      );
    }

    // 按建立時間倒序排列
    return filtered.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );
  });

  /**
   * 分頁後的設定列表
   */
  const paginatedConfigs = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value;
    const end = start + pageSize.value;
    return filteredConfigs.value.slice(start, end);
  });

  /**
   * 是否有數據
   */
  const hasData = computed(() => allPriceConfigs.value.length > 0);

  /**
   * 是否可以新增設定（避免重複創建生效中設定）
   */
  const canAddNewConfig = computed(() => {
    // 如果沒有當前生效設定，或者有但允許新增
    return true;
  });

  // ========== Actions - 方法 ==========

  /**
   * 設置搜尋條件
   */
  const setSearchQuery = (query) => {
    searchQuery.value = query;
  };

  /**
   * 設置狀態篩選
   */
  const setSelectedState = (state) => {
    selectedState.value = state;
  };

  /**
   * 設置當前頁碼
   */
  const setCurrentPage = (page) => {
    currentPage.value = page;
  };

  /**
   * 設置每頁數量
   */
  const setPageSize = (size) => {
    pageSize.value = size;
  };

  /**
   * 重置分頁
   */
  const resetPagination = () => {
    currentPage.value = 1;
  };

  /**
   * 清空搜尋條件
   */
  const clearSearch = () => {
    searchQuery.value = "";
    selectedState.value = "";
    resetPagination();
  };

  /**
   * 從服務器或 Mock 數據獲取金額設定列表
   */
  const getAllPriceConfigs = async (params = {}) => {
    loading.value = true;
    error.value = null;

    try {
      if (serviceAdapter.getIsMock()) {
        console.warn("⚠️ 當前模式不為 Directus，將使用 Mock 金額設定數據");
        const processedConfigs = mockPriceConfigs.map((config) =>
          normalizePriceConfig(config),
        );
        allPriceConfigs.value = processedConfigs;
        return {
          success: true,
          data: processedConfigs,
          message: "成功加載 Mock 金額設定數據",
        };
      }

      console.log("📄 從服務器獲取金額設定數據...");

      // 獲取 API endpoint - 需要根據實際後端調整
      const baseService = serviceAdapter.base;
      const endpoint = `${baseService.apiBaseUrl}/items/price_configs`;
      const myHeaders = await baseService.getAuthJsonHeaders();

      const response = await fetch(endpoint, {
        method: "GET",
        headers: myHeaders,
      });

      if (!response.ok) {
        throw new Error(`獲取數據失敗: ${response.status}`);
      }

      const result = await response.json();
      const processedData = (result.data || []).map((config) =>
        normalizePriceConfig(config),
      );
      allPriceConfigs.value = processedData;

      console.log(`✅ 成功獲取 ${allPriceConfigs.value.length} 筆金額設定`);
      return {
        success: true,
        data: processedData,
        message: "成功獲取金額設定數據",
      };
    } catch (err) {
      error.value = err.message;
      console.error("❌ 獲取金額設定數據失敗:", err);

      // 發生錯誤時返回 Mock 數據作為後備
      const processedConfigs = mockPriceConfigs.map((config) =>
        normalizePriceConfig(config),
      );
      allPriceConfigs.value = processedConfigs;

      return {
        success: false,
        data: processedConfigs,
        message: err.message || "獲取金額設定失敗，使用 Mock 數據",
      };
    } finally {
      loading.value = false;
    }
  };

  /**
   * 獲取用戶信息
   */
  const getCurrentUser = () => {
    return authService.getCurrentUser();
  };

  const getUserName = () => {
    return authService.getUserName();
  };

  /**
   * 創建新的金額設定
   * 會自動將當前的有效設定改為歷史記錄
   */
  const createPriceConfig = async (configData) => {
    loading.value = true;
    error.value = null;

    try {
      const createISOTime = DateUtils.getCurrentISOTime();
      const currentUserName = getUserName() || getCurrentUser() || "system";

      // 準備新設定數據
      const newConfig = {
        version: configData.version || `v${Date.now()}`,
        state: "now",
        prices: { ...configData.prices },
        notes: configData.notes || "",
        effectiveDate: configData.effectiveDate || createISOTime,
        createdAt: createISOTime,
        createdBy: currentUserName,
        user_created: getCurrentUser(),
        updatedAt: null,
        updatedBy: null,
      };

      console.log("📦 創建新金額設定:", newConfig);

      // Mock 模式處理
      if (serviceAdapter.getIsMock()) {
        // 將當前有效設定改為歷史
        const currentNowIndex = allPriceConfigs.value.findIndex(
          (c) => c.state === "now",
        );
        if (currentNowIndex !== -1) {
          allPriceConfigs.value[currentNowIndex] = {
            ...allPriceConfigs.value[currentNowIndex],
            state: "history",
            updatedAt: createISOTime,
            updatedBy: currentUserName,
          };
        }

        // 添加新設定
        const mockId =
          Math.max(...allPriceConfigs.value.map((c) => c.id), 0) + 1;
        const mockConfig = {
          id: mockId,
          ...newConfig,
        };
        allPriceConfigs.value.push(mockConfig);

        console.warn("⚠️ 當前模式不為 Directus，金額設定已創建(Mock 模式)");
        return {
          success: true,
          data: mockConfig,
          message: "金額設定創建成功！⚠️ 當前模式不是 directus，無法創建數據",
        };
      }

      // 實際 API 調用
      const baseService = serviceAdapter.base;
      const endpoint = `${baseService.apiBaseUrl}/items/price_configs`;
      const myHeaders = await baseService.getAuthJsonHeaders();

      // 先將當前有效設定改為歷史
      const currentNow = allPriceConfigs.value.find((c) => c.state === "now");
      if (currentNow) {
        const updateResponse = await fetch(`${endpoint}/${currentNow.id}`, {
          method: "PATCH",
          headers: myHeaders,
          body: JSON.stringify({
            state: "history",
            updatedAt: createISOTime,
            updatedBy: currentUserName,
          }),
        });

        if (updateResponse.ok) {
          const updateResult = await updateResponse.json();
          const index = allPriceConfigs.value.findIndex(
            (c) => c.id === currentNow.id,
          );
          if (index !== -1) {
            allPriceConfigs.value[index] = {
              ...allPriceConfigs.value[index],
              ...updateResult.data,
            };
          }
        }
      }

      // 創建新設定
      const response = await fetch(endpoint, {
        method: "POST",
        headers: myHeaders,
        body: JSON.stringify(newConfig),
      });

      if (!response.ok) {
        throw new Error(`創建失敗: ${response.status}`);
      }

      const result = await response.json();
      const processedConfig = normalizePriceConfig(result.data);
      allPriceConfigs.value.push(processedConfig);

      console.log("✅ 成功創建金額設定:", processedConfig.version);
      return {
        success: true,
        data: processedConfig,
        message: "金額設定創建成功",
      };
    } catch (err) {
      error.value = err.message;
      console.error("❌ 創建金額設定失敗:", err);
      return {
        success: false,
        message: err.message || "創建金額設定失敗",
      };
    } finally {
      loading.value = false;
    }
  };

  /**
   * 更新金額設定（僅限歷史記錄）
   */
  const updatePriceConfig = async (configId, configData) => {
    loading.value = true;
    error.value = null;

    try {
      const config = allPriceConfigs.value.find((c) => c.id === configId);
      if (!config) {
        throw new Error(`找不到 ID 為 ${configId} 的金額設定`);
      }

      if (config.state === "now") {
        throw new Error("當前生效的設定無法編輯，請使用新增功能建立新版本");
      }

      const updateISOTime = DateUtils.getCurrentISOTime();
      const currentUserName = getUserName() || getCurrentUser() || "system";

      const updateData = {
        version: configData.version,
        prices: configData.prices,
        notes: configData.notes,
        effectiveDate: configData.effectiveDate,
        updatedAt: updateISOTime,
        updatedBy: currentUserName,
        user_updated: getCurrentUser(),
      };

      console.log("📝 更新金額設定:", configId, updateData);

      // Mock 模式處理
      if (serviceAdapter.getIsMock()) {
        const index = allPriceConfigs.value.findIndex((c) => c.id === configId);
        if (index !== -1) {
          allPriceConfigs.value[index] = {
            ...allPriceConfigs.value[index],
            ...updateData,
          };
        }
        console.warn("⚠️ 當前模式不為 Directus，金額設定已更新(Mock 模式)");
        return {
          success: true,
          data: allPriceConfigs.value[index],
          message: "金額設定已更新(Mock 模式)",
        };
      }

      // 實際 API 調用
      const baseService = serviceAdapter.base;
      const endpoint = `${baseService.apiBaseUrl}/items/price_configs/${configId}`;
      const myHeaders = await baseService.getAuthJsonHeaders();

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: myHeaders,
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error(`更新失敗: ${response.status}`);
      }

      const result = await response.json();
      const processedConfig = normalizePriceConfig(result.data);

      const index = allPriceConfigs.value.findIndex((c) => c.id === configId);
      if (index !== -1) {
        allPriceConfigs.value[index] = processedConfig;
      }

      console.log("✅ 成功更新金額設定");
      return {
        success: true,
        data: processedConfig,
        message: "金額設定更新成功",
      };
    } catch (err) {
      error.value = err.message;
      console.error("❌ 更新金額設定失敗:", err);
      return {
        success: false,
        message: err.message || "更新金額設定失敗",
      };
    } finally {
      loading.value = false;
    }
  };

  /**
   * 刪除金額設定（僅限歷史記錄）
   */
  const deletePriceConfig = async (configId) => {
    loading.value = true;
    error.value = null;

    try {
      const config = allPriceConfigs.value.find((c) => c.id === configId);
      if (!config) {
        throw new Error(`找不到 ID 為 ${configId} 的金額設定`);
      }

      if (config.state === "now") {
        throw new Error("當前生效的設定無法刪除");
      }

      console.log("🗑️ 刪除金額設定:", configId);

      // Mock 模式處理
      if (serviceAdapter.getIsMock()) {
        const index = allPriceConfigs.value.findIndex((c) => c.id === configId);
        if (index !== -1) {
          allPriceConfigs.value.splice(index, 1);
        }
        console.warn("⚠️ 當前模式不為 Directus，金額設定已刪除(Mock 模式)");
        return {
          success: true,
          message: "金額設定已刪除(Mock 模式)",
        };
      }

      // 實際 API 調用
      const baseService = serviceAdapter.base;
      const endpoint = `${baseService.apiBaseUrl}/items/price_configs/${configId}`;
      const myHeaders = await baseService.getAuthJsonHeaders();

      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: myHeaders,
      });

      if (!response.ok) {
        throw new Error(`刪除失敗: ${response.status}`);
      }

      const index = allPriceConfigs.value.findIndex((c) => c.id === configId);
      if (index !== -1) {
        allPriceConfigs.value.splice(index, 1);
      }

      console.log("✅ 成功刪除金額設定");
      return {
        success: true,
        message: "金額設定刪除成功",
      };
    } catch (err) {
      error.value = err.message;
      console.error("❌ 刪除金額設定失敗:", err);
      return {
        success: false,
        message: err.message || "刪除金額設定失敗",
      };
    } finally {
      loading.value = false;
    }
  };

  /**
   * 初始化 - 加載金額設定數據
   */
  const initialize = async () => {
    console.log("🚀 初始化金額設定 Store...");
    await getAllPriceConfigs();
    console.log("✅ 金額設定 Store 初始化完成");
  };

  /**
   * 清空錯誤信息
   */
  const clearError = () => {
    error.value = null;
  };

  /**
   * 重置所有狀態
   */
  const reset = () => {
    allPriceConfigs.value = [];
    loading.value = false;
    error.value = null;
    searchQuery.value = "";
    selectedState.value = "";
    currentPage.value = 1;
    pageSize.value = 10;
  };

  // ========== 返回 Store 接口 ==========
  return {
    // 狀態
    allPriceConfigs,
    loading,
    error,

    // 搜尋與分頁狀態
    searchQuery,
    selectedState,
    currentPage,
    pageSize,

    // Getters
    currentConfig,
    historyConfigs,
    currentPrices,
    getPriceByActivityType,
    getAllPricesWithLabels,
    filteredConfigs,
    paginatedConfigs,
    hasData,
    canAddNewConfig,

    // Actions
    getDefaultPrices,
    getAllPriceConfigs,
    createPriceConfig,
    updatePriceConfig,
    deletePriceConfig,
    initialize,
    clearError,
    reset,

    // 搜尋與分頁方法
    setSearchQuery,
    setSelectedState,
    setCurrentPage,
    setPageSize,
    resetPagination,
    clearSearch,
  };
});
