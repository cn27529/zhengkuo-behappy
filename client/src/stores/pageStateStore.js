// src/stores/pageStateStore.js
import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const usePageStateStore = defineStore("pageState", () => {
  // 页面状态存储
  const pageStates = ref({});

  // 设置页面状态
  const setPageState = (pageName, state) => {
    pageStates.value[pageName] = {
      ...state,
      timestamp: Date.now(),
    };
    // 可选：同步到 sessionStorage 以防页面刷新
    sessionStorage.setItem(
      `pageState_${pageName}`,
      JSON.stringify(pageStates.value[pageName])
    );
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
