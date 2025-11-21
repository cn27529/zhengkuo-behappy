// src/stores/configStore.js
import { defineStore } from "pinia";
import { ref } from "vue";

export const useConfigStore = defineStore("config", () => {
  const formConfig = ref({
    maxHouseholdHeads: 1, // 限制戶長數量
    maxAncestors: 1, // 限制祖先數量
    maxSurvivors: 2, // 限制遺族數量
    defaultSurvivors: 2, // 預設遺族數量
  });

  const relationshipOptions = ref(["本家", "娘家", "朋友", "其它"]);

  const zodiacOptions = ref([
    "鼠",
    "牛",
    "虎",
    "兔",
    "龍",
    "蛇",
    "馬",
    "羊",
    "猴",
    "雞",
    "狗",
    "豬",
  ]);

  const loadConfig = async () => {
    try {
      console.log("加載配置成功");
      return formConfig.value; // ✅ 修正為 formConfig
    } catch (error) {
      console.error("加載配置失敗:", error);
      throw error;
    }
  };

  return {
    formConfig,
    relationshipOptions,
    zodiacOptions,
    loadConfig,
  };
});
