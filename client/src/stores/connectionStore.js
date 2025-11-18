// src/stores/connectionStore.js
import { defineStore } from "pinia";
import { ref } from "vue";
import { registrationService } from "../services/registrationService.js";

export const useConnectionStore = defineStore("connection", () => {
  const isOnline = ref(true);
  const lastChecked = ref(null);
  const connectionError = ref("");

  const checkConnection = async () => {
    try {
      const result = await registrationService.checkConnection();
      
      isOnline.value = result.online;
      lastChecked.value = new Date();
      connectionError.value = result.online ? "" : result.message;
      
      return result;
    } catch (error) {
      isOnline.value = false;
      connectionError.value = error.message;
      return {
        success: false,
        online: false,
        message: error.message
      };
    }
  };

  const ensureOnline = async (operation = "操作") => {
    const connection = await checkConnection();
    
    if (!connection.online) {
      throw new Error(`無法執行 ${operation}，網路連線異常: ${connection.message}`);
    }
    
    return true;
  };

  return {
    isOnline,
    lastChecked,
    connectionError,
    checkConnection,
    ensureOnline
  };
});