// src/stores/menu.js.js
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useRouter } from "vue-router";

export const useMenuStore = defineStore("menu", () => {
  const router = useRouter();

  // 菜單數據状态
  const menuItems = ref([
    {
      id: 1,
      name: "儀表板",
      path: "/dashboard",
      icon: "📊",
      component: "Dashboard",
      requiredAuth: true,
      order: 1,
      enabled: true,
      publish: true,
    },
    {
      id: 2,
      name: "祈福登記",
      path: "/registration", // 修改路徑
      icon: "🧧",
      component: "Registration", // 修改組件名稱
      requiredAuth: true,
      order: 2,
      enabled: true,
      publish: true,
    },
    {
      id: 3,
      name: "登記查詢",
      path: "/registration-list", //路徑
      icon: "🔍",
      component: "RegistrationList",
      requiredAuth: true,
      order: 3,
      enabled: true,
      publish: true,
    },
    {
      id: 4,
      name: "活動設置",
      path: "/activity-list",
      icon: "📅",
      component: "ActivityList",
      requiredAuth: true,
      order: 4,
      enabled: true,
      publish: true,
    },
    {
      id: 5,
      name: "太歲點燈",
      path: "/dotlamp",
      icon: "🐯",
      component: "TaisuiDotLamp",
      requiredAuth: true,
      order: 5,
      enabled: true,
      publish: true,
    },
    {
      id: 6,
      name: "卡片設計",
      path: "/card-design",
      icon: "💳",
      component: "CardDesign",
      requiredAuth: true,
      order: 6,
      enabled: false,
      publish: false,
    },
    {
      id: 7,
      name: "每月贊助",
      path: "/monthly-donate",
      icon: "🈷️",
      component: "MonthlyDonate",
      requiredAuth: true,
      order: 7,
      enabled: true,
      publish: true,
    },
    {
      id: 8,
      name: "系統日誌",
      path: "/logs",
      icon: "📋",
      component: "LogViewPage",
      requiredAuth: true,
      order: 8,
      enabled: true,
      publish: false,
    },
    {
      id: 9,
      name: "活動參加",
      path: "/join-record",
      icon: "📋",
      component: "JoinRecord",
      requiredAuth: true,
      order: 9,
      enabled: true,
      publish: false,
    },
    {
      id: 10,
      name: "參加記錄查詢",
      path: "/join-record-list",
      icon: "🔍",
      component: "JoinRecordList",
      requiredAuth: true,
      order: 10,
      enabled: true,
      publish: false,
    },
    {
      id: 11,
      name: "天干地支時鐘",
      path: "/td-clock",
      icon: "🕰️",
      component: "TianganDizhiClock",
      requiredAuth: false,
      order: 11,
      enabled: true,
      publish: false,
    },
    {
      id: 99,
      name: "收据管理",
      path: "/receipts",
      icon: "🧾",
      component: "Receipts",
      requiredAuth: true,
      order: 99,
      enabled: false,
      publish: false,
    },
    {
      id: 99,
      name: "收据查询",
      path: "/receipts-query",
      icon: "🔍",
      component: "ReceiptsQuery",
      requiredAuth: true,
      order: 99,
      enabled: false,
      publish: false,
    },
    {
      id: 99,
      name: "數據导入",
      path: "/data-import",
      icon: "📥",
      component: "DataImport",
      requiredAuth: false,
      order: 99,
      enabled: false,
      publish: false,
    },
  ]);

  // 当前激活的菜單项
  const activeMenuId = ref(1);

  // Getter - 获取可用的菜單项（按order排序）
  const availableMenuItems = computed(() => {
    const isProduction = process.env.NODE_ENV === "production";

    // 过滤掉未启用或未发布的菜單项
    return menuItems.value
      .filter((item) => {
        if (!item.enabled) return false; // 过滤未启用项
        if (isProduction && item.publish === false) return false; // 生产环境过滤未发布项
        return true;
      })
      .sort((a, b) => a.order - b.order);
  });

  // Getter - 根据路径获取菜單项
  const getMenuByPath = computed(() => {
    return (path) => menuItems.value.find((item) => item.path === path);
  });

  // Getter - 当前激活的菜單项
  const activeMenuItem = computed(() => {
    return menuItems.value.find((item) => item.id === activeMenuId.value);
  });

  // Actions
  const setActiveMenu = (menuId) => {
    const menuItem = menuItems.value.find((item) => item.id === menuId);
    if (menuItem && menuItem.enabled) {
      activeMenuId.value = menuId;
    }
  };

  const setActiveMenuByPath = (path) => {
    const menuItem = menuItems.value.find((item) => item.path === path);
    if (menuItem && menuItem.enabled) {
      activeMenuId.value = menuItem.id;
    }
  };

  const navigateToMenu = (menuItem) => {
    if (menuItem.enabled) {
      setActiveMenu(menuItem.id);
      router.push(menuItem.path);
    }
  };

  // 初始化菜單激活状态
  const initializeActiveMenu = () => {
    const currentPath = router.currentRoute.value.path;
    setActiveMenuByPath(currentPath);
  };

  // 未来可以添加的API相关方法
  const fetchMenuItems = async () => {
    // 模拟API调用获取菜單數據
    try {
      // 这里将来可以替换为真实的API调用
      // const response = await api.get('/menu')
      // menuItems.value = response.data

      console.log("获取菜單數據成功");
      return menuItems.value;
    } catch (error) {
      console.error("获取菜單數據失败:", error);
      throw error;
    }
  };

  const updateMenuItem = async (menuId, updates) => {
    // 模拟API调用更新菜單项
    try {
      const index = menuItems.value.findIndex((item) => item.id === menuId);
      if (index !== -1) {
        menuItems.value[index] = { ...menuItems.value[index], ...updates };
      }
      return menuItems.value[index];
    } catch (error) {
      console.error("更新菜單项失败:", error);
      throw error;
    }
  };

  return {
    // 状态
    menuItems,
    activeMenuId,

    // Getter
    availableMenuItems,
    getMenuByPath,
    activeMenuItem,

    // Actions
    setActiveMenu,
    setActiveMenuByPath,
    navigateToMenu,
    initializeActiveMenu,
    fetchMenuItems,
    updateMenuItem,
  };
});
