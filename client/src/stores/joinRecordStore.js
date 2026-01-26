// src/stores/joinRecordStore.js
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { generateGitHashBrowser } from "../utils/generateGitHash.js";
import { DateUtils } from "../utils/dateUtils.js";
import { serviceAdapter } from "../adapters/serviceAdapter.js"; // R用適配器
import { joinRecordService } from "../services/joinRecordService.js"; // CUD用
import { authService } from "../services/authService.js";
import mockRegistrationData from "../data/mock_registrations.json";
import mockJoinRecordData from "../data/mock_participation_records.json";

/**
 * 參加記錄的 Pinia store，管理參加記錄的狀態與操作。
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
    diandeng: {
      label: "點燈",
      price: 600,
      source: "blessing.persons", //消災人員
      lampTypes: {
        guangming: { label: "光明燈", price: 600 },
        taisui: { label: "太歲燈", price: 800 },
        yuanchen: { label: "元辰燈", price: 1000 },
      },
    },
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

  // 每個人員的燈種選擇 { personId: lampType }
  const personLampTypes = ref({});

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
    const config = activityConfigs.value[type];
    let price = config.price;
    let label = config.label;

    // 根據項目類型決定地址來源
    let sourceAddress = "";
    if (
      config.source === "salvation.ancestors" ||
      config.source === "salvation.survivors"
    ) {
      sourceAddress = selectedRegistration.value?.salvation?.address || "";
    } else if (config.source === "blessing.persons") {
      sourceAddress = selectedRegistration.value?.blessing?.address || "";
    }

    // 如果是點燈且有選擇燈種，使用燈種價格和標籤
    if (type === "diandeng" && lampTypeSelection.value) {
      const lampType = config.lampTypes[lampTypeSelection.value];
      price = lampType.price;
      label = `${config.label}(${lampType.label})`;
    }

    return {
      type,
      label, // 超度/超薦、陽上人、點燈(光明燈)、祈福、固定消災、中元普度
      price, // 金額
      quantity: sourceData.length, // 數量
      subtotal: price * sourceData.length, // 小計
      source: config.source, // 資料來源：registration
      sourceData: sourceData, // 當下選擇的：registration
      sourceAddress: sourceAddress, // 對應的地址
      ...(type === "diandeng" &&
        lampTypeSelection.value && {
          lampType: lampTypeSelection.value,
          lampTypeLabel: config.lampTypes[lampTypeSelection.value].label,
        }),
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
    const createISOTime = DateUtils.getCurrentISOTime();
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
      createdAt: createISOTime,
      createdUser: getCurrentUser(),
      updatedAt: "",
      updatedUser: "",
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
    const createISOTime = DateUtils.getCurrentISOTime();

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

    record.updatedAt = createISOTime;
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

  const allRegistrations = ref(mockRegistrationData || []); // 所有祈福登記
  const selectedRegistration = ref(null); // 選擇的祈福登記
  const isLoading = ref(false);
  const error = ref(null);
  const allJoinRecords = ref(mockJoinRecordData || []); // 所有參加記錄
  const savedRecords = ref([]); // 獲取已保存的參加記錄

  // 取得所有參加記錄
  const getAllJoinRecords = async (params) => {
    isLoading.value = true;
    error.value = null;
    try {
      if (serviceAdapter.getIsMock()) {
        console.warn("⚠️ 當前模式不為 Directus，成功加載 Mock 資料");
        allJoinRecords.value = mockJoinRecordData;
        return {
          success: true,
          data: mockJoinRecordData,
          message: "成功加載 Mock 資料",
        };
      }

      // TODO: 未來串接 API
      console.log("📄 從服務器獲取參加記錄資料...");
      const result = await serviceAdapter.getAllParticipationRecords(params);
      if (result.success) {
        allJoinRecords.value = result.data || [];
        console.log(`✅ 成功獲取 ${allJoinRecords.value.length} 筆參加記錄`);
        return result.data;
      } else {
        error.value = result.message;
        allJoinRecords.value = mockJoinRecordData;
        return result;
      }
    } catch (err) {
      error.value = err.message;
      console.error("取得所有參加記錄資料失敗:", err);
      allJoinRecords.value = mockJoinRecordData;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // 獲取所有祈福登記
  const getAllRegistrations = async () => {
    try {
      isLoading.value = true;

      if (serviceAdapter.getIsMock()) {
        console.warn("⚠️ 當前模式不為 Directus，成功加載 Mock 資料");
        allRegistrations.value = mockRegistrationData;
        return mockRegistrationData;
      }

      const result = await serviceAdapter.getAllRegistrations();
      if (result.success) {
        console.log(`✅ 成功獲取 ${result.data.length} 筆祈福登記資料`);
        return result.data;
      } else {
        console.warn("獲取祈福登記資料失敗，使用 Mock 資料");
        allRegistrations.value = mockRegistrationData;
        return mockRegistrationData;
      }
    } catch (error) {
      console.error("取得所有祈福登記資料失敗:", error);
      allRegistrations.value = mockRegistrationData; // 失敗時回退到 Mock 資料
      return mockRegistrationData; // 失敗時回退到 Mock 資料
    } finally {
      isLoading.value = false;
    }
  };

  // 載入祈福登記資料
  const loadRegistrationData = async () => {
    console.log("載入祈福登記資料...");
    try {
      isLoading.value = true;
      const registrations = await getAllRegistrations();
      allRegistrations.value = registrations;
      return registrations;
    } catch (error) {
      console.error("載入祈福登記資料失敗:", error);
    } finally {
      isLoading.value = false;
    }
  };

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
    personLampTypes.value = {};
  };

  // 選擇某一筆祈福登記
  const setRegistration = (reg) => {
    console.log("選擇登記表:", reg);
    selectedRegistration.value = reg;
    resetSelections();
  };

  // 設置人員燈種選擇
  const setPersonLampType = (personId, lampType) => {
    personLampTypes.value[personId] = lampType;
  };

  // 獲取人員燈種
  const getPersonLampType = (personId) => {
    return personLampTypes.value[personId] || "guangming";
  };

  // 處理全選切換
  const toggleGroup = (key, sourceData) => {
    if (selections.value[key].length === sourceData.length) {
      selections.value[key] = [];
    } else {
      selections.value[key] = [...sourceData];
    }
  };

  // 設置群組選擇狀態
  const setGroupSelection = (key, data) => {
    selections.value[key] = [...data];
  };

  // 送出存檔
  const submitRecord = async (activityId = null) => {
    isLoading.value = true;
    error.value = null;

    if (!selectedRegistration.value) return;
    const createISOTime = DateUtils.getCurrentISOTime();
    try {
      // 獲取當前用戶信息

      const payload = {
        registrationId: selectedRegistration.value.id,
        activityId: activityId || -1, // 使用傳入的 activityId，如果沒有則使用 -1
        contact: selectedRegistration.value.contact, // 新增聯絡人資訊
        items: selections.value,
        personLampTypes: personLampTypes.value, // 每個人的燈種選擇
        total: totalAmount.value,
        totalAmount: totalAmount.value,
        createdUser: getCurrentUser(),
        createdAt: createISOTime,
      };
      console.log("submitRecord:", payload);

      if (serviceAdapter.getIsMock()) {
        // 頁面顯示用----------------------
        const forUI = {
          contactName:
            selectedRegistration.value?.contact?.name || "未知聯絡人",
          totalAmount: totalAmount.value,
          savedAt: createISOTime,
        };
        savedRecords.value.unshift(payload);
        // 頁面顯示用----------------------

        console.warn("⚠️ 當前模式不是 directus，無法創建數據");
        return {
          success: true,
          data: payload,
          message: "參加記錄創建成功！⚠️ 當前模式不是 directus，無法創建數據",
        };
      }

      // TODO: 未來串接 API
      const result = await joinRecordService.saveRecord(payload);
      if (result.success) {
        console.log("✅ 成功創建參加記錄:", result.data);

        // 頁面顯示用----------------------
        const forUI = {
          contactName:
            selectedRegistration.value?.contact?.name || "未知聯絡人",
          totalAmount: totalAmount.value,
          savedAt: createISOTime,
        };
        savedRecords.value.unshift(result.data);
        // 頁面顯示用----------------------

        return result;
      } else {
        error.value = result.message;
        console.error("❌ 創建參加記錄失敗:", result.message);
        return result;
      }
    } catch (err) {
      error.value = err.message;
      console.error("❌ 創建參加記錄異常:", err);
      throw err;
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
    personLampTypes,
    isLoading,
    allRegistrations,
    allJoinRecords,
    savedRecords,

    // Getters
    totalAmount,
    // Actions
    setRegistration,
    resetSelections,
    toggleGroup,
    setGroupSelection,
    setPersonLampType,
    getPersonLampType,
    submitRecord,
    loadRegistrationData, // 載入祈福登記資料
    getAllRegistrations, // 獲取所有祈福登記
    getAllJoinRecords, // 獲取所有參加記錄
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
