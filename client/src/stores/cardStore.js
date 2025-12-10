import { defineStore } from "pinia";
import { ref, reactive } from "vue";

export const useCardStore = defineStore("card", () => {
  // 卡片設計狀態
  const droppedItems = ref([]);

  // 硬編碼的卡片數據（之後會替換為 API 獲取）
  const cardData = reactive({
    name: "王小明",
    nickname: "王氏歷代祖先",
    blessings: ["屏東縣屏東市自由路1000號", "高雄市左營區博愛三路500號"],
  });

  // 添加已放置項目
  const addDroppedItem = (item) => {
    droppedItems.value.push(item);
  };

  // 更新項目位置
  const updateItemPosition = (itemId, x, y) => {
    const itemIndex = droppedItems.value.findIndex(
      (item) => item.id === itemId
    );
    if (itemIndex !== -1) {
      droppedItems.value[itemIndex].x = x;
      droppedItems.value[itemIndex].y = y;
    }
  };

  // 刪除已放置項目
  const deleteDroppedItem = (itemId) => {
    const itemIndex = droppedItems.value.findIndex(
      (item) => item.id === itemId
    );
    if (itemIndex !== -1) {
      droppedItems.value.splice(itemIndex, 1);
    }
  };

  // 保存設計到本地存儲（模擬保存到數據庫）
  const saveDesign = () => {
    return new Promise((resolve) => {
      // 模擬 API 調用延遲
      setTimeout(() => {
        const designData = {
          items: droppedItems.value,
          lastUpdated: new Date().toISOString(),
        };
        // 保存到 localStorage（模擬保存到數據庫）
        sessionStorage.setItem("cardDesign", JSON.stringify(designData));
        console.log("設計已保存:", designData);
        resolve(designData);
      }, 500);
    });
  };

  // 從本地存儲加載設計
  const loadSavedDesign = () => {
    const savedDesign = sessionStorage.getItem("cardDesign");
    if (savedDesign) {
      try {
        const designData = JSON.parse(savedDesign);
        droppedItems.value = designData.items || [];
        console.log("已加載保存的設計:", designData);
      } catch (error) {
        console.error("加載保存的設計時出錯:", error);
      }
    }
  };

  // 重置設計
  const resetDesign = () => {
    droppedItems.value = [];
    sessionStorage.removeItem("cardDesign");
  };

  // 獲取完整的設計數據（用於 API 提交）
  const getDesignData = () => {
    return {
      cardData: { ...cardData },
      droppedItems: [...droppedItems.value],
      lastUpdated: new Date().toISOString(),
    };
  };

  return {
    droppedItems,
    cardData,
    addDroppedItem,
    updateItemPosition,
    deleteDroppedItem,
    saveDesign,
    loadSavedDesign,
    resetDesign,
    getDesignData,
  };
});
