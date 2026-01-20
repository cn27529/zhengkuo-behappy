// src/stores/registrationQueryStore.js
import { defineStore } from "pinia";
import { ref, computed, h } from "vue";
import { serviceAdapter } from "../adapters/serviceAdapter.js"; // 使用適配器
//import { registrationService } from "../services/registrationService.js"; // 移除舊的導入
import mockRegistrations from "../data/mock_registrations.json";
import { useConfigStore } from "./configStore.js";
import { useAuthStore } from "./authStore.js";

// 祈福登記查詢表單的 Pinia store，管理查詢表單的狀態與操作。
export const useQueryStore = defineStore("registrationQuery", () => {
  const configStore = useConfigStore();
  const authStore = useAuthStore();

  // 狀態定義 - Pinia 會自動保持這些狀態
  const searchResults = ref([]);
  const searchQuery = ref("");
  const isLoading = ref(false);
  const hasSearched = ref(false);

  // ✅ 新增分頁狀態
  const currentPage = ref(1);
  const pageSize = ref(10);

  // ✅ 使用 computed 保持響應式
  const relationshipOptions = computed(() => configStore.relationshipOptions);
  const zodiacOptions = computed(() => configStore.zodiacOptions);

  const queryRegistrationData = async (queryData) => {
    isLoading.value = true;
    try {
      // 檢查是否為 directus 模式
      if (serviceAdapter.getIsMock()) {
        console.warn("⚠️ 當前模式不是 directus，使用 Mock 數據");

        if (!mockRegistrations || mockRegistrations.length === 0) {
          console.error("Mock 數據為空或未找到");
          return {
            success: false,
            message: "Mock 數據為空或未找到",
            data: [],
          };
        }

        let filteredData = getFilteredData(queryData, mockRegistrations);

        console.log("🔍 Mock 模式最終 filteredData:", filteredData);
        console.log("🔍 filteredData 類型:", typeof filteredData);
        console.log("🔍 filteredData 是陣列嗎?", Array.isArray(filteredData));
        console.log("Mock 查詢結果:", filteredData.length, "筆資料");

        // 更新狀態
        searchResults.value = filteredData;
        hasSearched.value = true;

        console.log("🔍 Store 更新後 searchResults:", searchResults.value);
        console.log("🔍 Store searchResults 長度:", searchResults.value.length);

        return {
          success: true,
          message: `找到 ${filteredData.length} 筆資料 (Mock 模式)`,
          data: filteredData,
        };
      }

      // Directus 模式
      console.log("開始查詢報名表數據...", queryData);

      // 先檢查連接 ✅ 修正：正確的健康檢查邏輯
      // 在健康檢查後添加詳細日誌
      // const healthCheck = await baseService.healthCheck();
      // if (healthCheck.online) {
      //   console.log("✅ 後端服務健康檢查通過");
      // } else {
      //   const message = `❌ 服務連接失敗，無法查詢表單: ${healthCheck.message}`;
      //   console.error(message);
      //   return {
      //     success: false,
      //     online: false,
      //     message: message,
      //     data: null,
      //   };
      // }

      const params = {
        //sort: "-date_created",
        sort: "-createdAt",
      };

      const result = await serviceAdapter.getAllRegistrations(params);

      if (result.success) {
        console.log("後端查詢成功:", result.data?.length || 0, "筆資料");

        let filteredData = getFilteredData(queryData, result.data);

        // 更新狀態
        searchResults.value = filteredData;
        hasSearched.value = true;

        return {
          success: true,
          message: result.message || `找到 ${filteredData?.length || 0} 筆資料`,
          data: filteredData || [],
        };
      } else {
        console.error("後端查詢失敗:", result.message);

        // 清空結果
        searchResults.value = [];
        hasSearched.value = true;

        return {
          success: false,
          message: result.message || "查詢失敗",
          data: [],
        };
      }
    } catch (error) {
      console.error("報名查詢錯誤:", error);

      // 清空結果
      searchResults.value = [];
      hasSearched.value = true;

      return {
        success: false,
        message: "查詢過程中發生錯誤",
        data: [],
      };
    } finally {
      isLoading.value = false;
    }
  };

  const getFilteredData = (queryData, data) => {
    console.log("🎯 開始過濾數據...");
    //console.log("查詢條件:", queryData);
    //console.log("原始數據:", data);

    if (!queryData || !queryData.query || !queryData.query.trim()) {
      console.log("🔍 無查詢條件，返回所有數據");
      return data;
    }

    const query = queryData.query.trim().toLowerCase();
    console.log("🔍 搜索關鍵字:", query);

    if (!data || !Array.isArray(data)) {
      console.warn("⚠️ 數據不是陣列或為空");
      return [];
    }

    let filteredData = data.filter((item, index) => {
      console.log(`--- 檢查第 ${index} 筆資料 ---`);
      console.log("資料內容:", item);

      let matchFound = false;

      // 檢查聯絡人
      if (item.contact) {
        console.log("檢查聯絡人:", item.contact);
        if (
          item.contact.name &&
          item.contact.name.toLowerCase().includes(query)
        ) {
          console.log("✅ 匹配聯絡人姓名");
          matchFound = true;
        }
        if (
          item.contact.mobile &&
          item.contact.mobile.toLowerCase().includes(query)
        ) {
          console.log("✅ 匹配聯絡人手機");
          matchFound = true;
        }
        if (
          item.contact.phone &&
          item.contact.phone.toLowerCase().includes(query)
        ) {
          console.log("✅ 匹配聯絡人電話");
          matchFound = true;
        }
      }

      // 檢查消災信息
      if (item.blessing && !matchFound) {
        console.log("檢查消災信息:", item.blessing);
        if (
          item.blessing.address &&
          item.blessing.address.toLowerCase().includes(query)
        ) {
          console.log("✅ 匹配消災地址");
          matchFound = true;
        }
        if (item.blessing.persons) {
          console.log("檢查消災人員:", item.blessing.persons);
          item.blessing.persons.forEach((person, i) => {
            if (
              person &&
              person.name &&
              person.name.toLowerCase().includes(query)
            ) {
              console.log(`✅ 匹配消災人員 ${i}:`, person.name);
              matchFound = true;
            }
          });
        }
      }

      // 檢查超度信息
      if (item.salvation && !matchFound) {
        console.log("檢查超度信息:", item.salvation);
        if (
          item.salvation.address &&
          item.salvation.address.toLowerCase().includes(query)
        ) {
          console.log("✅ 匹配超度地址");
          matchFound = true;
        }
        if (item.salvation.ancestors) {
          console.log("檢查祖先:", item.salvation.ancestors);
          item.salvation.ancestors.forEach((ancestor, i) => {
            if (
              ancestor &&
              ancestor.surname &&
              ancestor.surname.toLowerCase().includes(query)
            ) {
              console.log(`✅ 匹配祖先 ${i}:`, ancestor.surname);
              matchFound = true;
            }
          });
        }
        if (item.salvation.survivors) {
          console.log("檢查陽上人:", item.salvation.survivors);
          item.salvation.survivors.forEach((survivor, i) => {
            if (
              survivor &&
              survivor.name &&
              survivor.name.toLowerCase().includes(query)
            ) {
              console.log(`✅ 匹配陽上人 ${i}:`, survivor.name);
              matchFound = true;
            }
          });
        }
      }

      console.log(
        `第 ${index} 筆資料匹配結果:`,
        matchFound ? "✅ 匹配" : "❌ 不匹配",
      );
      return matchFound;
    });

    console.log("🎯 過濾完成，結果:", filteredData);
    return filteredData;
  };

  // 狀態管理方法
  const clearSearch = () => {
    searchResults.value = [];
    searchQuery.value = "";
    hasSearched.value = false;
    isLoading.value = false;
  };

  const setSearchQuery = (query) => {
    searchQuery.value = query;
  };

  const advancedSearch = async (criteria) => {
    // 在這裡實現高級查詢的邏輯，可以使用 criteria 來檢索數據
    return {}; // 尚未實作
  };

  const isMobile = () => {
    if (
      authStore.isMobileDevice() ||
      authStore.detectDeviceType() === "mobile"
    ) {
      console.log("手機裝置");
      return true;
    } else {
      console.log("非手機裝置");
      return false;
    }
  };

  return {
    // 狀態
    searchResults,
    searchQuery,
    isLoading,
    hasSearched,
    currentPage, // 新增
    pageSize, // 新增

    // 計算屬性
    relationshipOptions,
    zodiacOptions,

    // 方法
    queryRegistrationData,
    clearSearch,
    setSearchQuery,
    getFilteredData,
    isMobile,

    // ✅ 新增分頁方法
    setCurrentPage: (page) => {
      currentPage.value = page;
    },
    setPageSize: (size) => {
      pageSize.value = size;
    },
    resetPagination: () => {
      currentPage.value = 1;
    },
  };
});
