// src/stores/menu.js.js
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useRouter } from "vue-router";

export const useMenuStore = defineStore("menu", () => {
  const router = useRouter();

  // 菜单数据状态
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
    },
    {
      id: 2,
      name: "祈福登記",
      path: "/registration", // 修改路徑
      icon: "📝",
      component: "Registration", // 修改組件名稱
      requiredAuth: true,
      order: 2,
      enabled: true,
    },
    {
      id: 3,
      name: "登記查詢",
      path: "/registration-list", //路徑
      icon: "📝",
      component: "RegistrationList",
      requiredAuth: true,
      order: 3,
      enabled: true,
    },
    {
      id: 4,
      name: "活動管理",
      path: "/activity-list",
      icon: "📅",
      component: "ActivityList",
      requiredAuth: true,
      order: 4,
      enabled: true,
    },
    {
      id: 5,
      name: "太歲分析",
      path: "/taisui",
      icon: "📥",
      component: "TaiSui",
      requiredAuth: true,
      order: 5,
      enabled: true,
    },
    {
      id: 99,
      name: "收据管理",
      path: "/receipts",
      icon: "🧾",
      component: "Receipts",
      requiredAuth: true,
      order: 99,
      enabled: true, // 暂时禁用，等后续开发
    },
    {
      id: 99,
      name: "收据查询",
      path: "/receipts-query",
      icon: "🔍",
      component: "ReceiptsQuery",
      requiredAuth: true,
      order: 99,
      enabled: true,
    },
    {
      id: 99,
      name: "数据导入",
      path: "/data-import",
      icon: "📥",
      component: "DataImport",
      requiredAuth: false,
      order: 99,
      enabled: true,
    },

    // {
    //   id: 7,
    //   name: "Mydata",
    //   path: "/mydata",
    //   icon: "📥",
    //   component: "MydataList",
    //   requiredAuth: true,
    //   order: 0,
    //   enabled: true,
    // },
  ]);

  // 当前激活的菜单项
  const activeMenuId = ref(1);

  // Getter - 获取可用的菜单项（按order排序）
  const availableMenuItems = computed(() => {
    return menuItems.value
      .filter((item) => item.enabled)
      .sort((a, b) => a.order - b.order);
  });

  // Getter - 根据路径获取菜单项
  const getMenuByPath = computed(() => {
    return (path) => menuItems.value.find((item) => item.path === path);
  });

  // Getter - 当前激活的菜单项
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

  // 初始化菜单激活状态
  const initializeActiveMenu = () => {
    const currentPath = router.currentRoute.value.path;
    setActiveMenuByPath(currentPath);
  };

  // 未来可以添加的API相关方法
  const fetchMenuItems = async () => {
    // 模拟API调用获取菜单数据
    try {
      // 这里将来可以替换为真实的API调用
      // const response = await api.get('/menu')
      // menuItems.value = response.data

      console.log("获取菜单数据成功");
      return menuItems.value;
    } catch (error) {
      console.error("获取菜单数据失败:", error);
      throw error;
    }
  };

  const updateMenuItem = async (menuId, updates) => {
    // 模拟API调用更新菜单项
    try {
      const index = menuItems.value.findIndex((item) => item.id === menuId);
      if (index !== -1) {
        menuItems.value[index] = { ...menuItems.value[index], ...updates };
      }
      return menuItems.value[index];
    } catch (error) {
      console.error("更新菜单项失败:", error);
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
