// src/stores/pageStateStore.js
import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const usePageStateStore = defineStore("pageState", () => {
  // 页面状态存储
  const pageStates = ref({});

  // 设置页面状态
  const setPageState = async (pageName, state) => {
    return new Promise((resolve) => {
      console.log("🔄 開始設置頁面狀態");

      const stateData = {
        ...state,
        timestamp: Date.now(),
      };

      pageStates.value[pageName] = stateData;

      // 如果有 sessionStorage 操作，確保它是同步的
      try {
        sessionStorage.setItem(
          `pageState_${pageName}`,
          JSON.stringify(stateData)
        );
      } catch (error) {
        console.warn("sessionStorage 操作失敗:", error);
      }

      console.log("✅ 頁面狀態設置完成");
      resolve(stateData);
    });
  };

  // 获取页面状态
  const getPageState = (pageName) => {
    // 先从内存中获取
    if (pageStates.value[pageName]) {
      return pageStates.value[pageName];
    }

    // 如果内存中没有，尝试从 sessionStorage 恢复
    try {
      const stored = sessionStorage.getItem(`pageState_${pageName}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        pageStates.value[pageName] = parsed;
        return parsed;
      }
    } catch (error) {
      console.error("恢复页面状态失败:", error);
    }

    return null;
  };

  // 清除页面状态
  const clearPageState = (pageName) => {
    delete pageStates.value[pageName];
    sessionStorage.removeItem(`pageState_${pageName}`);
  };

  // 清除所有页面状态
  const clearAllPageStates = () => {
    pageStates.value = {};
    Object.keys(sessionStorage)
      .filter((key) => key.startsWith("pageState_"))
      .forEach((key) => sessionStorage.removeItem(key));
  };

  return {
    pageStates,
    setPageState,
    getPageState,
    clearPageState,
    clearAllPageStates,
  };
});
