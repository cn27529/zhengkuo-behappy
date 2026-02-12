// src/stores/joinRecordQueryStore.js
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { serviceAdapter } from "../adapters/serviceAdapter.js";
import { joinRecordService } from "../services/joinRecordService.js"; // CUD用
import mockParticipationRecords from "../data/mock_participation_records.json";
import { useConfigStore } from "./configStore.js";
import { useAuthStore } from "./authStore.js";
import { PhoneMatch } from "../utils/phoneMatchUtils.js";

// 活動參加記錄查詢的 Pinia store，管理查詢狀態與操作。
export const useJoinRecordQueryStore = defineStore("joinRecordQuery", () => {
  const configStore = useConfigStore();
  const authStore = useAuthStore();

  // 狀態定義 - Pinia 會自動保持這些狀態
  const searchResults = ref([]);
  const searchQuery = ref("");
  const isLoading = ref(false);
  const hasSearched = ref(false);

  // 分頁狀態
  const currentPage = ref(1);
  const pageSize = ref(10);

  // 查詢條件狀態
  const stateFilter = ref("");
  const itemsFilter = ref("");

  // 使用 computed 保持響應式
  const stateOptions = computed(() => [
    { value: "", label: "全部狀態" },
    { value: "confirmed", label: "已確認" },
    { value: "pending", label: "待處理" },
    { value: "cancelled", label: "已取消" },
  ]);

  const itemTypeOptions = computed(() => [
    { value: "", label: "全部項目" },
    { value: "chaodu", label: "超度/超薦" },
    { value: "diandeng", label: "點燈" },
    { value: "qifu", label: "消災祈福" },
    { value: "xiaozai", label: "固定消災" },
    { value: "survivors", label: "陽上人" },
    { value: "pudu", label: "中元普度" },
  ]);

  const queryJoinRecordData = async (queryData) => {
    isLoading.value = true;
    try {
      // 檢查是否為 mock 模式
      if (serviceAdapter.getIsMock()) {
        console.warn("⚠️ 當前模式不是 directus，使用 Mock 數據");

        if (
          !mockParticipationRecords ||
          mockParticipationRecords.length === 0
        ) {
          console.error("Mock 數據為空或未找到");
          return {
            success: false,
            message: "Mock 數據為空或未找到",
            data: [],
          };
        }

        let filteredData = getFilteredData(queryData, mockParticipationRecords);

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
      console.log("開始查詢參加記錄數據...", queryData);

      const params = {
        sort: "-createdAt",
      };

      // 使用 serviceAdapter 的參加記錄查詢方法
      const result = await serviceAdapter.getAllParticipationRecords(params);

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
      console.error("參加記錄查詢錯誤:", error);

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

  // 刪除參加記錄
  const deleteParticipationRecord = async (recordId) => {
    if (!recordId) {
      return { success: false, message: "缺少記錄 ID" };
    }

    try {
      const result =
        await joinRecordService.deleteParticipationRecord(recordId);

      if (result?.success) {
        searchResults.value = searchResults.value.filter(
          (record) => record.id !== recordId,
        );
        resetPagination();
      }

      return result;
    } catch (error) {
      console.error("刪除參加記錄失敗:", error);
      return {
        success: false,
        message: error?.message || "刪除參加記錄失敗",
      };
    }
  };

  const getFilteredData = (queryData, data) => {
    console.log("🎯 開始過濾參加記錄數據...");

    if (!data || !Array.isArray(data)) {
      console.warn("⚠️ 數據不是陣列或為空");
      return [];
    }

    let filteredData = [...data];

    if (
      queryData.activityId &&
      (typeof queryData.activityId === "number" || queryData.activityId > 0)
    ) {
      const activityIdQuery = parseInt(queryData.activityId);
      console.log("🔍 activityId過濾:", activityIdQuery);
      filteredData = filteredData.filter((item) => {
        return item.activityId && item.activityId === activityIdQuery;
      });
      console.log("activityId過濾後筆數:", filteredData.length);
    }

    // 1. 狀態過濾
    if (queryData.state && queryData.state.trim()) {
      const stateQuery = queryData.state.trim().toLowerCase();
      console.log("🔍 狀態過濾:", stateQuery);
      filteredData = filteredData.filter((item) => {
        return item.state && item.state.toLowerCase() === stateQuery;
      });
      console.log("狀態過濾後筆數:", filteredData.length);
    }

    // 2. 項目類型過濾
    if (queryData.items && queryData.items.trim()) {
      const itemsQuery = queryData.items.trim().toLowerCase();
      console.log("🔍 項目類型過濾:", itemsQuery);
      filteredData = filteredData.filter((item) => {
        if (!item.items || !Array.isArray(item.items)) return false;

        return item.items.some((itemDetail) => {
          return (
            itemDetail.type &&
            itemDetail.type.toLowerCase().includes(itemsQuery)
          );
        });
      });
      console.log("項目類型過濾後筆數:", filteredData.length);
    }

    // 3. 通用搜尋過濾
    if (queryData.query && queryData.query.trim()) {
      const query = queryData.query.trim().toLowerCase();
      console.log("🔍 通用搜索關鍵字:", query);

      filteredData = filteredData.filter((item, index) => {
        console.log(`--- 檢查第 ${index} 筆資料 ---`);
        let matchFound = false;

        // 檢查 registrationId
        if (
          item.registrationId &&
          item.registrationId.toString().includes(query)
        ) {
          console.log("✅ 匹配登記ID");
          matchFound = true;
        }

        // 檢查聯絡人資訊
        if (item.contact) {
          if (
            item.contact.name &&
            item.contact.name.toLowerCase().includes(query)
          ) {
            console.log("✅ 匹配聯絡人姓名:", item.contact.name);
            matchFound = true;
          }
          if (
            item.contact.mobile &&
            //item.contact.mobile.includes(query)
            PhoneMatch.fuzzyPhoneMatch(item.contact.mobile, query)
          ) {
            console.log("✅ 匹配聯絡人手機:", item.contact.mobile);
            matchFound = true;
          }
          if (
            item.contact.phone &&
            //item.contact.phone.includes(query)
            PhoneMatch.fuzzyPhoneMatch(item.contact.phone, query)
          ) {
            console.log("✅ 匹配聯絡人電話:", item.contact.phone);
            matchFound = true;
          }
          if (
            item.contact.relationship &&
            item.contact.relationship.toLowerCase().includes(query)
          ) {
            console.log("✅ 匹配聯絡人關係:", item.contact.relationship);
            matchFound = true;
          }
          if (
            item.contact.otherRelationship &&
            item.contact.otherRelationship.toLowerCase().includes(query)
          ) {
            console.log(
              "✅ 匹配聯絡人其他關係:",
              item.contact.otherRelationship,
            );
            matchFound = true;
          }
        }

        // 檢查項目內容
        if (item.items && Array.isArray(item.items)) {
          item.items.forEach((itemDetail, i) => {
            // 檢查項目標籤
            if (
              itemDetail.label &&
              itemDetail.label.toLowerCase().includes(query)
            ) {
              console.log(`✅ 匹配項目標籤 ${i}:`, itemDetail.label);
              matchFound = true;
            }

            // 檢查地址資訊
            if (
              itemDetail.sourceAddress &&
              itemDetail.sourceAddress.toLowerCase().includes(query)
            ) {
              console.log(`✅ 匹配項目地址 ${i}:`, itemDetail.sourceAddress);
              matchFound = true;
            }

            // 檢查來源數據中的姓名
            if (itemDetail.sourceData && Array.isArray(itemDetail.sourceData)) {
              itemDetail.sourceData.forEach((sourceItem, j) => {
                if (
                  sourceItem.name &&
                  sourceItem.name.toLowerCase().includes(query)
                ) {
                  console.log(
                    `✅ 匹配來源數據姓名 ${i}-${j}:`,
                    sourceItem.name,
                  );
                  matchFound = true;
                }
                if (
                  sourceItem.surname &&
                  sourceItem.surname.toLowerCase().includes(query)
                ) {
                  console.log(
                    `✅ 匹配來源數據姓氏 ${i}-${j}:`,
                    sourceItem.surname,
                  );
                  matchFound = true;
                }
                if (
                  sourceItem.notes &&
                  sourceItem.notes.toLowerCase().includes(query)
                ) {
                  console.log(
                    `✅ 匹配來源數據備註 ${i}-${j}:`,
                    sourceItem.notes,
                  );
                  matchFound = true;
                }
              });
            }
          });
        }

        // 檢查備註
        if (item.notes && item.notes.toLowerCase().includes(query)) {
          console.log("✅ 匹配備註");
          matchFound = true;
        }

        console.log(
          `第 ${index} 筆資料匹配結果:`,
          matchFound ? "✅ 匹配" : "❌ 不匹配",
        );
        return matchFound;
      });
    }

    // 4. 過濾掉 "陽上人" 項目（price 為 0）
    filteredData = filteredData
      .map((record) => {
        if (record.items && Array.isArray(record.items)) {
          const filteredItems = record.items.filter(
            (item) => item.label !== "陽上人",
          );
          return { ...record, items: filteredItems };
        }
        return record;
      })
      .filter((record) => record.items && record.items.length > 0);

    console.log("🎯 過濾完成，結果:", filteredData);
    return filteredData;
  };

  // 狀態管理方法
  const clearSearch = () => {
    searchResults.value = [];
    searchQuery.value = "";
    stateFilter.value = "";
    itemsFilter.value = "";
    hasSearched.value = false;
    isLoading.value = false;
  };

  const setSearchQuery = (query) => {
    searchQuery.value = query;
  };

  const setStateFilter = (state) => {
    stateFilter.value = state;
  };

  const setItemsFilter = (items) => {
    itemsFilter.value = items;
  };

  const resetPagination = () => {
    currentPage.value = 1;
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

  // ===== 狀態控制台相關 =====

  // 狀態欄位配置
  const stateConfigs = computed(() => ({
    state: {
      label: "記錄狀態",
      options: [
        { value: "pending", label: "待處理" },
        { value: "confirmed", label: "已確認" },
        { value: "completed", label: "已完成" },
      ],
    },
    paymentState: {
      label: "付款狀態",
      options: [
        { value: "unpaid", label: "未付款" },
        { value: "paid", label: "已付款" },
      ],
    },
    receiptIssued: {
      label: "收據狀態",
      options: [
        { value: "false", label: "未開立" },
        { value: "true", label: "已開立" },
      ],
    },
    accountingState: {
      label: "會計狀態",
      options: [
        { value: "pending", label: "待處理" },
        { value: "reconciled", label: "已對帳" },
      ],
    },
    paymentMethod: {
      label: "付款方式",
      options: [
        { value: "", label: "未選擇" },
        { value: "cash", label: "現金" },
        { value: "transfer", label: "銀行轉帳" },
        { value: "card", label: "信用卡" },
      ],
    },
  }));

  // 批量更新單筆記錄狀態
  const updateRecordStates = async (recordId, updates) => {
    try {
      if (serviceAdapter.getIsMock()) {
        console.warn("⚠️ Mock 模式：模擬更新狀態", { recordId, updates });

        // 更新本地數據
        const index = searchResults.value.findIndex((r) => r.id === recordId);
        if (index !== -1) {
          searchResults.value[index] = {
            ...searchResults.value[index],
            ...updates,
            updatedAt: new Date().toISOString(),
          };
        }

        return {
          success: true,
          message: "狀態更新成功 (Mock 模式)",
          data: searchResults.value[index],
        };
      }

      // TODO: 實際 API 調用
      const result = await joinRecordService.updateParticipationRecord(
        recordId,
        updates,
      );

      if (result.success) {
        // 更新本地數據
        const index = searchResults.value.findIndex((r) => r.id === recordId);
        if (index !== -1) {
          searchResults.value[index] = {
            ...searchResults.value[index],
            ...updates,
            updatedAt: new Date().toISOString(),
          };
        }
      }

      return result;
    } catch (error) {
      console.error("更新記錄狀態失敗:", error);
      return {
        success: false,
        message: error.message || "更新失敗",
      };
    }
  };

  // 批量更新多筆記錄狀態
  const batchUpdateRecordStates = async (recordIds, updates) => {
    try {
      if (serviceAdapter.getIsMock()) {
        console.warn("⚠️ Mock 模式：批量更新狀態", { recordIds, updates });

        // 批量更新本地數據
        recordIds.forEach((recordId) => {
          const index = searchResults.value.findIndex((r) => r.id === recordId);
          if (index !== -1) {
            searchResults.value[index] = {
              ...searchResults.value[index],
              ...updates,
              updatedAt: new Date().toISOString(),
            };
          }
        });

        return {
          success: true,
          message: `成功更新 ${recordIds.length} 筆記錄 (Mock 模式)`,
          data: { count: recordIds.length },
        };
      }

      // TODO: 實際 API 批量調用
      const results = await Promise.all(
        recordIds.map((id) =>
          joinRecordService.updateParticipationRecord(id, updates),
        ),
      );

      const successCount = results.filter((r) => r.success).length;

      // 更新本地數據
      recordIds.forEach((recordId) => {
        const index = searchResults.value.findIndex((r) => r.id === recordId);
        if (index !== -1) {
          searchResults.value[index] = {
            ...searchResults.value[index],
            ...updates,
            updatedAt: new Date().toISOString(),
          };
        }
      });

      return {
        success: successCount === recordIds.length,
        message: `成功更新 ${successCount}/${recordIds.length} 筆記錄`,
        data: { count: successCount },
      };
    } catch (error) {
      console.error("批量更新記錄狀態失敗:", error);
      return {
        success: false,
        message: error.message || "批量更新失敗",
      };
    }
  };

  return {
    // 狀態
    searchResults,
    searchQuery,
    isLoading,
    hasSearched,
    currentPage,
    pageSize,
    stateFilter,
    itemsFilter,

    // 計算屬性
    stateOptions,
    itemTypeOptions,
    stateConfigs,

    // 方法
    queryJoinRecordData,
    deleteParticipationRecord,
    clearSearch,
    setSearchQuery,
    setStateFilter,
    setItemsFilter,
    getFilteredData,
    isMobile,

    // 狀態控制台方法
    updateRecordStates,
    batchUpdateRecordStates,

    // 分頁方法
    setCurrentPage: (page) => {
      currentPage.value = page;
    },
    setPageSize: (size) => {
      pageSize.value = size;
    },
    resetPagination,
  };
});
