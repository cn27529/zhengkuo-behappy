// src/stores/joinRecordStore.js
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { joinRecordService } from "../services/joinRecordService.js";
import { authService } from "../services/authService.js";
import mockData from "../data/mock_registrations.json";

/**
 * 參與記錄的 Pinia store，管理參與記錄的狀態與操作。
 * @module stores/joinRecordStore
 */
export const useJoinRecordStore = defineStore("joinRecord", () => {
  /**
   * 活動類型
   * key: 活動類型
   */
  const activityConfigs = ref({
    chaodu: {
      label: "超度/超薦",
      price: 1000,
      source: "salvation.ancestors", //祖先
    },
    survivors: { label: "陽上人", price: 0, source: "salvation.survivors" }, //陽上人
    diandeng: { label: "點燈", price: 600, source: "blessing.persons" }, //消災人員
    qifu: { label: "消災祈福", price: 300, source: "blessing.persons" }, //消災人員
    xiaozai: { label: "固定消災", price: 100, source: "blessing.persons" }, //消災人員
    pudu: { label: "中元普度", price: 1200, source: "blessing.persons" }, //消災人員
  });

  /*
   * 存儲選中狀態的物件
   * key: 活動類型
   */
  const selections = ref({
    chaodu: [], //祖先
    survivors: [], //陽上人
    diandeng: [], //消災人員
    qifu: [], //消災人員
    xiaozai: [], //消災人員
    pudu: [], //消災人員
  });

  /*
   * 獲取資料來源
   * registration: 註冊資料
   * source: 資料來源
   */
  const getSourceData = (registration, source) => {
    const [section, field] = source.split(".");
    return registration[section][field] || [];
  };

  /*
   * 建立參與記錄的項目
   * type: 活動類型
   * sourceData: 資料來源
   */
  const createParticipationItem = (type, sourceData) => {
    const config = activityConfigs[type];
    return {
      type,
      label: config.label, // 超度/超薦、陽上人、點燈、祈福、固定消災、中元普度
      price: config.price, // 金額
      quantity: sourceData.length, // 數量
      subtotal: config.price * sourceData.length, // 小計
      source: config.source, // 資料來源：registration
      sourceData: sourceData, // 當下選擇的：registration
    };
  };

  /**
   * 計算總金額
   * @param {} items
   * @returns
   */
  const calculateTotalAmount = (items) => {
    // 計算總金額
    return items.reduce((sum, item) => sum + item.subtotal, 0);
  };

  /**
   * 建立完整的參與記錄
   * @param {*} registration
   * @param {*} activity
   * @param {*} selectedItems
   * @returns
   */
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

    // 計算總金額
    const totalAmount = calculateTotalAmount(items);

    // 建立完整的參與記錄
    return {
      registrationId: registration.id, // registration.id
      activityId: activity.activityId, // activity.activityId
      registeredAt: new Date().toISOString(),
      registeredBy: registration.contact.name,
      state: "confirmed", // confirmed=已確認，unconfirmed=未確認，canceled=已取消
      items, // 超度/超薦、陽上人、點燈、祈福、固定消災、中元普度。資料來源：createParticipationItem
      totalAmount, // 總金額
      discountAmount: 0, // 折扣金額
      finalAmount: totalAmount, // 最終金額
      paidAmount: 0, // 付款金額
      needReceipt: false, // 需要收據
      receiptNumber: "", // 收據號碼
      receiptIssued: false, // 收據已開立
      receiptIssuedAt: "", // 收據開立日期
      receiptIssuedBy: "", // 收據開立者
      accountingState: "pending", // pending=未沖帳,reconciled=已沖帳
      accountingDate: "", // 沖帳日期
      accountingBy: "", // 沖帳者
      accountingNotes: "", // 沖帳備註
      paymentState: "unpaid", // paid=已付款，partial=部分付款，unpaid=未付款，waived=免付
      paymentMethod: "", // cash=現金，transfer=轉帳
      paymentDate: "", // 付款日期
      paymentNotes: "", // 付款備註
      notes: "", // 備註
      createdAt: new Date().toISOString(),
      createdBy: getCurrentUser(),
      updatedAt: new Date().toISOString(),
      //updatedUser: getCurrentUser(),
    };
  };

  /**
   * 生成收據號碼
   * @returns
   */
  const generateReceiptNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    // 這裡需要從資料庫取得當月的流水號
    const counter = String(getMonthlyCounter()).padStart(4, "0");
    return `R${year}${month}${counter}`;
  };

  /**
   * 開立收據
   * @param {*} record
   */
  const issueReceipt = (record) => {
    record.receiptNumber = generateReceiptNumber();
    record.receiptIssued = true;
    record.receiptIssuedAt = new Date().toISOString();
    record.receiptIssuedBy = getCurrentUser();
    record.updatedAt = new Date().toISOString();
    record.updatedUser = getCurrentUser();
  };

  /**
   * 會計沖帳
   * @param {*} record
   * @param {*} accountingBy
   * @param {*} notes
   */
  const reconcileAccounting = (record, accountingBy, notes = "") => {
    record.accountingState = "reconciled";
    record.accountingDate = new Date().toISOString();
    record.accountingBy = accountingBy;
    record.accountingNotes = notes;
    record.updatedAt = new Date().toISOString();
    record.updatedUser = accountingBy;
  };

  /**
   * 記錄付款
   * @param {*} record
   * @param {*} method
   * @param {*} amount
   * @param {*} notes
   */
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

  /**
   * 取得項目摘要（用於顯示）
   * @param {*} items
   * @returns
   */
  const getItemsSummary = (items) => {
    return items.map((item) => `${item.label} x${item.quantity}`).join("、");
  };

  /**
   * 取得項目詳細清單（用於收據）
   * @param {*} items
   * @returns
   */
  const getItemsDetail = (items) => {
    return items.map((item) => ({
      name: item.label,
      unitPrice: item.price,
      quantity: item.quantity,
      subtotal: item.subtotal,
      persons: item.sourceData.map((d) => d.name || d.surname).join("、"),
    }));
  };

  const mockRegistrations = ref(mockData || []);

  // 載入 Mock 數據
  const loadMockData = async () => {
    try {
      if (!mockData || mockData.length === 0) {
        console.error("Mock 數據為空或未找到");
        return false;
      }
      let mockData = null;
      const randomIndex = Math.floor(Math.random() * mockData.length);
      mockData = mockData[randomIndex];
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

  // 獲取用戶信息
  const getCurrentUser = () => {
    return authService.getCurrentUser();
  };

  // 暴露給元件使用的變數與方法
  return {
    // State
    activityConfigs,
    selectedRegistration,
    selections,
    isLoading,
    mockRegistrations,
    // Getters
    totalAmount,
    // Actions
    selectRegistration,
    resetSelections,
    toggleGroup,
    submitRecord,
    loadMockData,
    // 獲取用戶信息
    getCurrentUser,
    // 其他方法
    getItemsSummary, // 取得項目摘要
    getItemsDetail, // 取得項目詳細清單
    recordPayment, // 記錄付款
    issueReceipt, // 開立收據
    createParticipationRecord, // 建立完整的參與記錄
    reconcileAccounting, // 會計沖帳
    getSourceData, // 獲取資料來源
  };
});
