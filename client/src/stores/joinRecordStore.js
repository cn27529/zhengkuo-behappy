// src/stores/joinActivityRecordStore.js
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { joinRecordService } from "../services/joinRecordService.js";
import { authService } from "../services/authService.js";
import mockDatas from "../data/mock_registrations.json";

export const useJoinRecordStore = defineStore("joinActivityRecord", () => {
  // 獲取用戶信息
  const getCurrentUser = () => {
    return authService.getCurrentUser();
  };

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
    pudu: { label: "中元普渡", price: 1200, source: "blessing.persons" }, //消災人員
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

  const getSourceData = (registration, source) => {
    const [section, field] = source.split(".");
    return registration[section][field] || [];
  };

  // 建立參與記錄的項目
  const createParticipationItem = (type, sourceData) => {
    const config = activityConfigs[type];
    return {
      type,
      label: config.label,
      price: config.price,
      quantity: sourceData.length,
      subtotal: config.price * sourceData.length,
      source: config.source,
      sourceData: sourceData,
    };
  };

  // 計算總金額
  const calculateTotalAmount = (items) => {
    return items.reduce((sum, item) => sum + item.subtotal, 0);
  };

  // 建立完整的參與記錄
  const createParticipationRecord = (registration, activity, selectedItems) => {
    const items = selectedItems.map((item) => {
      const sourceData = getSourceData(
        registration,
        activityConfigs[item.type].source,
      );
      return createParticipationItem(
        item.type,
        item.selectedData || sourceData,
      );
    });

    const totalAmount = calculateTotalAmount(items);

    return {
      registrationId: registration.id,
      activityId: activity.activityId,
      registeredAt: new Date().toISOString(),
      registeredBy: registration.contact.name,
      state: "pending",
      items,
      totalAmount,
      discountAmount: 0,
      finalAmount: totalAmount,
      paidAmount: 0,
      needReceipt: false,
      receiptNumber: "",
      receiptIssued: false,
      receiptIssuedAt: "",
      receiptIssuedBy: "",
      accountingState: "pending",
      accountingDate: "",
      accountingBy: "",
      accountingNotes: "",
      paymentState: "unpaid",
      paymentMethod: "",
      paymentDate: "",
      paymentNotes: "",
      notes: "",
      createdAt: new Date().toISOString(),
      createdBy: getCurrentUser(),
      updatedAt: new Date().toISOString(),
      //updatedUser: getCurrentUser(),
    };
  };

  // 生成收據號碼
  const generateReceiptNumber = () => {
    const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  // 這裡需要從資料庫取得當月的流水號
  const counter = String(getMonthlyCounter()).padStart(4, '0');
  return `R${year}${month}${counter}`;
  };

  // 開立收據
  const issueReceipt = (record) => {
     record.receiptNumber = generateReceiptNumber();
  record.receiptIssued = true;
  record.receiptIssuedAt = new Date().toISOString();
  record.receiptIssuedBy = getCurrentUser();
  record.updatedAt = new Date().toISOString();
  record.updatedUser = getCurrentUser();
  };

  // 會計沖帳
  const reconcileAccounting = (record, accountingBy, notes = "") => {
    record.accountingState = "reconciled";
    record.accountingDate = new Date().toISOString();
    record.accountingBy = accountingBy;
    record.accountingNotes = notes;
    record.updatedAt = new Date().toISOString();
    record.updatedUser = accountingBy;
  };

  // 記錄付款
  const recordPayment = (record, method, amount, notes = "") => {
    record.paidAmount += amount;
    record.paymentMethod = method;
    record.paymentDate = new Date().toISOString();
    record.paymentNotes = notes;

    // 更新付款狀態
    if (record.paidAmount >= record.finalAmount) {
      record.paymentState = "paid";
    } else if (record.paidAmount > 0) {
      record.paymentState = "partial";
    }

    record.updatedAt = new Date().toISOString();
    record.updatedUser = getCurrentUser();
  };

  // 取得項目摘要（用於顯示）
const getItemsSummary = (items) => {
  return items.map(item => 
    `${item.label} x${item.quantity}`
  ).join('、');
}

// 取得項目詳細清單（用於收據）
const getItemsDetail = (items) => {
  return items.map(item => ({
    name: item.label,
    unitPrice: item.price,
    quantity: item.quantity,
    subtotal: item.subtotal,
    persons: item.sourceData.map(d => d.name || d.surname).join('、')
  }));
}

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
