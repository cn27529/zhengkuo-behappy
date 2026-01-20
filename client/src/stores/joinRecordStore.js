// src/stores/joinActivityRecordStore.js
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { joinRecordService } from "../services/joinRecordService.js";
import mockDatas from "../data/mock_registrations.json";

export const useJoinRecordStore = defineStore("joinActivityRecord", () => {
  // --- State (等同於 ref) ---
  const activityConfigs = ref({
    chaodu: {
      label: "超度/超薦",
      price: 1000,
      source: "salvation.ancestors", //祖先
    },
    survivors: { label: "陽上人", price: 300, source: "salvation.survivors" }, //陽上人
    diandeng: { label: "點燈", price: 600, source: "blessing.persons" }, //消災人員
    qifu: { label: "祈福", price: 300, source: "blessing.persons" }, //消災人員
    xiaozai: { label: "固定消災", price: 100, source: "blessing.persons" }, //消災人員
    pudu: { label: "中元普渡", price: 1200, source: "blessing.persons" },  //消災人員
  });

  
  // 存儲選中狀態的物件
  const selections = ref({
    chaodu: [], //祖先
    survivors: [], //陽上人
    diandeng: [], //消災人員
    qifu: [], //消災人員
    xiaozai: [], //消災人員
    pudu: [], //消災人員    
  });

  const loadMockData = async () => {
    try {
      if (!mockDatas || mockDatas.length === 0) {
        console.error("Mock 數據為空或未找到");
        return false;
      }
      let mockData = null;
      const randomIndex = Math.floor(Math.random() * mockDatas.length);
      mockData = mockDatas[randomIndex];
      return mockData;
    } catch (error) {
      console.error("載入 Mock 數據失敗:", error);
      return null;
    }
  };

  const selectedRegistration = ref(null);
  const isLoading = ref(false);


  // --- Getters (等同於 computed) ---
  const totalAmount = computed(() => {
    return Object.keys(selections.value).reduce((sum, key) => {
      const price = activityConfigs.value[key]?.price || 0;
      return sum + selections.value[key].length * price;
    }, 0);
  });

  // --- Actions (等同於 function) ---

  // 初始化選取項目
  const resetSelections = () => {
    Object.keys(selections.value).forEach((key) => {
      selections.value[key] = [];
    });
  };

  // 選擇某一筆登記表
  const selectRegistration = (reg) => {
    selectedRegistration.value = reg;
    resetSelections();
  };

  // 處理全選切換
  const toggleGroup = (key, sourceData) => {
    if (selections.value[key].length === sourceData.length) {
      selections.value[key] = [];
    } else {
      selections.value[key] = [...sourceData];
    }
  };

  // 送出存檔
  const submitRecord = async () => {
    if (!selectedRegistration.value) return;

    isLoading.value = true;
    try {
      const payload = {
        registrationId: selectedRegistration.value.id,
        items: selections.value,
        total: totalAmount.value,
        createdAt: new Date().toISOString(),
      };

      const result = await joinRecordService.saveRecord(payload);
      if (result.success) {
        console.log("儲存成功");
        return true;
      }

      return false;
    } catch (error) {
      console.error("儲存過程出錯");
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  // 暴露給元件使用的變數與方法
  return {
    // State
    activityConfigs,
    selectedRegistration,
    selections,
    isLoading,
    // Getters
    totalAmount,
    // Actions
    selectRegistration,
    resetSelections,
    toggleGroup,
    submitRecord,
    loadMockData,
  };
});
