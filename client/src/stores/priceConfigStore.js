// src/stores/priceConfigStore.js
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { generateGitHashBrowser } from "../utils/generateGitHash.js";
import { serviceAdapter } from "../adapters/serviceAdapter.js"; // R用適配器
import { priceConfigService } from "../services/priceConfigService.js"; // CUD用
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
          (config.createdUser &&
            config.createdUser.toLowerCase().includes(keyword)) ||
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
   * 獲取 Mock 數據
   */
  const loadMockData = async () => {
    try {
      if (!mockPriceConfigs || mockPriceConfigs.length === 0) {
        console.error("Mock 價格配置數據為空或未找到");
        return [];
      }
      const processedConfigs = mockPriceConfigs.map((config) =>
        normalizePriceConfig(config),
      );
      return processedConfigs;
    } catch (error) {
      console.error("載入 Mock 價格配置數據失敗:", error);
      return [];
    }
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
        const processedConfigs = await loadMockData();
        allPriceConfigs.value = processedConfigs;
        return {
          success: true,
          data: processedConfigs,
          message: "成功加載 Mock 金額設定數據",
        };
      }

      console.log("📄 從服務器獲取金額設定數據...");
      //const result = await serviceAdapter.getAllPriceConfigs(params);
      const result = await serviceAdapter.getAllPriceConfigs({
        sort: "-id",
        ...params,
      });

      if (result.success) {
        // 確保 result.data 是數組
        const dataArray = Array.isArray(result.data)
          ? result.data
          : [result.data];
        const processedConfigs = dataArray.map((config) =>
          normalizePriceConfig(config),
        );
        allPriceConfigs.value = processedConfigs;
        console.log(`✅ 成功獲取 ${allPriceConfigs.value.length} 筆金額設定`);
        return result;
      } else {
        error.value = result.message;
        console.error("❌ 獲取金額設定數據失敗:", result.message);
        const processedConfigs = await loadMockData();
        allPriceConfigs.value = processedConfigs;
        return result;
      }
    } catch (err) {
      error.value = err.message;
      console.error("❌ 獲取金額設定數據異常:", err);
      const processedConfigs = await loadMockData();
      allPriceConfigs.value = processedConfigs;
      throw err;
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

    const createISOTime = DateUtils.getCurrentISOTime();
    const newVersionId = await generateGitHashBrowser(createISOTime);

    try {
      const createISOTime = DateUtils.getCurrentISOTime();

      // 準備新設定數據
      const newConfig = {
        version: newVersionId || configData.version || `v${Date.now()}`,
        state: "now",
        prices: { ...configData.prices },
        notes: configData.notes || "",
        enableDate: configData.enableDate || createISOTime,
        createdAt: createISOTime,
        createdUser: getCurrentUser(),
      };

      console.log("📦 創建新金額設定:", newConfig);

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

      // 調用 priceConfigService 的 activateNewPriceConfig 方法
      // 這個方法會自動處理將當前生效的配置改為歷史
      const result = await priceConfigService.activateNewPriceConfig(newConfig);

      if (result.success) {
        // 重新加載所有配置以更新 store 狀態
        await getAllPriceConfigs();
        console.log("✅ 成功創建金額設定:", result.data.version);
        return result;
      } else {
        error.value = result.message;
        console.error("❌ 創建金額設定失敗:", result.message);
        return result;
      }
    } catch (err) {
      error.value = err.message;
      console.error("❌ 創建金額設定異常:", err);
      throw err;
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

      const updateData = {
        version: configData.version,
        prices: configData.prices,
        notes: configData.notes,
        enableDate: configData.enableDate,
      };

      console.log("📝 更新金額設定:", configId, updateData);

      if (serviceAdapter.getIsMock()) {
        const index = allPriceConfigs.value.findIndex((c) => c.id === configId);
        if (index !== -1) {
          allPriceConfigs.value[index] = {
            ...allPriceConfigs.value[index],
            ...updateData,
            updatedAt: DateUtils.getCurrentISOTime(),
          };
        }
        console.warn("⚠️ 當前模式不為 Directus，金額設定已更新(Mock 模式)");
        return {
          success: true,
          data: allPriceConfigs.value[index],
          message: "金額設定已更新(Mock 模式)",
        };
      }

      // 調用 priceConfigService 更新配置
      const result = await priceConfigService.updatePriceConfig(
        configId,
        updateData,
      );

      if (result.success) {
        // 更新本地 store 中的數據
        const index = allPriceConfigs.value.findIndex((c) => c.id === configId);
        if (index !== -1) {
          allPriceConfigs.value[index] = normalizePriceConfig(result.data);
        }

        console.log("✅ 成功更新金額設定");
        return result;
      } else {
        error.value = result.message;
        console.error("❌ 更新金額設定失敗:", result.message);
        return result;
      }
    } catch (err) {
      error.value = err.message;
      console.error("❌ 更新金額設定異常:", err);
      throw err;
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

      // 調用 priceConfigService 刪除配置
      const result = await priceConfigService.deletePriceConfig(configId);

      if (result.success) {
        // 從本地 store 中移除
        const index = allPriceConfigs.value.findIndex((c) => c.id === configId);
        if (index !== -1) {
          allPriceConfigs.value.splice(index, 1);
        }

        console.log("✅ 成功刪除金額設定");
        return result;
      } else {
        error.value = result.message;
        console.error("❌ 刪除金額設定失敗:", result.message);
        return result;
      }
    } catch (err) {
      error.value = err.message;
      console.error("❌ 刪除金額設定異常:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 獲取當前生效的價格配置（直接從服務器獲取最新數據）
   */
  const fetchCurrentPriceConfig = async () => {
    loading.value = true;
    error.value = null;

    try {
      if (serviceAdapter.getIsMock()) {
        const current = allPriceConfigs.value.find((c) => c.state === "now");
        console.warn("⚠️ 當前模式不為 Directus，使用本地當前配置");
        return {
          success: true,
          data: current || null,
          message: current
            ? "成功獲取當前價格配置(Mock 模式)"
            : "找不到當前生效的價格配置",
        };
      }

      const result = await serviceAdapter.getCurrentPriceConfig();

      if (result.success && result.data) {
        const processedConfig = normalizePriceConfig(result.data);

        // 更新或添加當前配置到 store
        const existingIndex = allPriceConfigs.value.findIndex(
          (c) => c.id === processedConfig.id,
        );

        if (existingIndex !== -1) {
          allPriceConfigs.value[existingIndex] = processedConfig;
        } else {
          allPriceConfigs.value.push(processedConfig);
        }

        return result;
      } else {
        error.value = result.message;
        console.error("❌ 獲取當前價格配置失敗:", result.message);
        return result;
      }
    } catch (err) {
      error.value = err.message;
      console.error("❌ 獲取當前價格配置異常:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 獲取指定日期的價格配置
   */
  const fetchPriceConfigByDate = async (date) => {
    loading.value = true;
    error.value = null;

    try {
      if (serviceAdapter.getIsMock()) {
        // Mock 模式下，根據日期查找合適的配置
        const sortedConfigs = [...allPriceConfigs.value].sort(
          (a, b) => new Date(b.enableDate) - new Date(a.enableDate),
        );
        const config = sortedConfigs.find(
          (c) => new Date(c.enableDate) <= new Date(date),
        );
        console.warn("⚠️ 當前模式不為 Directus，使用本地查找配置");
        return {
          success: true,
          data: config || null,
          message: config
            ? "成功獲取指定日期價格配置(Mock 模式)"
            : "找不到指定日期的價格配置",
        };
      }

      const result = await serviceAdapter.getPriceConfigByDate(date);

      if (result.success && result.data) {
        const processedConfig = normalizePriceConfig(result.data);
        return {
          success: true,
          data: processedConfig,
          message: result.message,
        };
      } else {
        error.value = result.message;
        console.error("❌ 獲取指定日期價格配置失敗:", result.message);
        return result;
      }
    } catch (err) {
      error.value = err.message;
      console.error("❌ 獲取指定日期價格配置異常:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 獲取特定價格項目的歷史
   */
  const fetchPriceHistory = async (priceKey) => {
    loading.value = true;
    error.value = null;

    try {
      if (serviceAdapter.getIsMock()) {
        // Mock 模式下，從所有配置中提取歷史
        const history = allPriceConfigs.value
          .filter((c) => c.state !== "disabled")
          .map((config) => ({
            version: config.version,
            price: config.prices?.[priceKey] || null,
            enableDate: config.enableDate,
            notes: config.notes,
          }))
          .filter((item) => item.price !== null)
          .sort((a, b) => new Date(a.enableDate) - new Date(b.enableDate));

        console.warn("⚠️ 當前模式不為 Directus，使用本地歷史數據");
        return {
          success: true,
          data: history,
          message: "成功獲取價格歷史(Mock 模式)",
        };
      }

      const result = await serviceAdapter.getPriceHistory(priceKey);
      return result;
    } catch (err) {
      error.value = err.message;
      console.error("❌ 獲取價格歷史失敗:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 比較兩個版本的價格差異
   */
  const compareVersions = async (versionId1, versionId2) => {
    loading.value = true;
    error.value = null;

    try {
      if (serviceAdapter.getIsMock()) {
        // Mock 模式下，從本地數據中查找
        const config1 = allPriceConfigs.value.find((c) => c.id === versionId1);
        const config2 = allPriceConfigs.value.find((c) => c.id === versionId2);

        if (!config1 || !config2) {
          throw new Error("無法獲取指定版本的價格配置");
        }

        const prices1 = config1.prices || {};
        const prices2 = config2.prices || {};

        const differences = {};
        const allKeys = new Set([
          ...Object.keys(prices1),
          ...Object.keys(prices2),
        ]);

        allKeys.forEach((key) => {
          const price1 = prices1[key];
          const price2 = prices2[key];

          if (price1 !== price2) {
            differences[key] = {
              old: price1 || null,
              new: price2 || null,
              change: price1 && price2 ? price2 - price1 : null,
              changePercent:
                price1 && price2
                  ? (((price2 - price1) / price1) * 100).toFixed(2)
                  : null,
            };
          }
        });

        console.warn("⚠️ 當前模式不為 Directus，使用本地比較");
        return {
          success: true,
          data: {
            version1: config1,
            version2: config2,
            differences: differences,
          },
          message: "成功比較版本差異(Mock 模式)",
        };
      }

      const result = await priceConfigService.comparePriceVersions(
        versionId1,
        versionId2,
      );
      return result;
    } catch (err) {
      error.value = err.message;
      console.error("❌ 比較版本差異失敗:", err);
      throw err;
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

  /**
   * 模式管理
   */
  const getCurrentMode = () => {
    return serviceAdapter.getCurrentMode();
  };

  const setMode = (mode) => {
    serviceAdapter.setMode(mode);
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
    fetchCurrentPriceConfig,
    fetchPriceConfigByDate,
    fetchPriceHistory,
    compareVersions,
    initialize,
    clearError,
    reset,
    getCurrentMode,
    setMode,
    loadMockData,

    // 搜尋與分頁方法
    setSearchQuery,
    setSelectedState,
    setCurrentPage,
    setPageSize,
    resetPagination,
    clearSearch,
  };
});
