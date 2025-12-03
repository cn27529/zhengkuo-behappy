// 頁面狀態保存，取代網址URL的暴露，防止使用者由URL直接更改參數據，使得URL簡潔
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

      //console.log("✅ 頁面狀態設置完成");
      resolve(stateData);
    });
  };

  const loadPageState = (pageName) => {
    const state = getPageState(pageName);    
    const pageState = null;

    if (state) {
      console.log("📋 頁面狀態數據:", pageState);

      pageState = {
        action: state.action || "create",
        formId: state.formId || "",
        id: state.id || -1,
        source: state.source || "",
        pageTitle: getPageTitle(state.action),
        isEdit: state.action === "edit" ? true : false,
        isCreate: state.action === "create" ? true : false,
      };
      return pageState;
    }

    // 如果没有保存的状态，回退到 URL 参数（兼容旧方式）
    pageState = {
      action: route.query.action || "create",
      formId: route.query.formId || "",
      id: route.query.id || -1,
      source: route.query.source || "",
      pageTitle: getPageTitle(route.query.action),
      isEdit: state.action === "edit" ? true : false,
      isCreate: state.action === "create" ? true : false,
    };
    console.log("📋 頁面狀態數據:", pageState);
    return pageState;
  };

  // 获取页面状态
  const getPageState = (pageName) => {
    console.log("📋 獲取頁面狀態");
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
      console.error("獲取頁面狀態失敗:", error);
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
    console.log("清除所有页面状态");
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
    loadPageState,
  };
});
