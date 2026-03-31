// src/stores/joinRecordStore.js
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { generateGitHashBrowser } from "../utils/generateGitHash.js";
import { DateUtils } from "../utils/dateUtils.js";
import { serviceAdapter } from "../adapters/serviceAdapter.js"; // R用適配器
import { joinRecordService } from "../services/joinRecordService.js"; // CUD用
import { authService } from "../services/authService.js";
import { priceConfigService } from "../services/priceConfigService.js";
import { useQueryStore } from "./registrationQueryStore.js";
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
   * 護持三寶、供齋、護持道場、助印經書、放生
   */
  const activityConfigs = ref({
    chaodu: {
      label: "超度/超薦",
      price: 1000, // 將從價格服務更新
      source: "salvation.ancestors", //祖先
    },
    survivors: {
      label: "陽上人",
      price: 0, // 將從價格服務更新
      source: "salvation.survivors", //陽上人
    },
    diandeng: {
      label: "點燈",
      price: 600, // 將從價格服務更新
      source: "blessing.persons", //消災人員
      lampTypes: {
        guangming: { label: "光明燈", price: 600 },
        taisui: { label: "太歲燈", price: 800 },
        yuanchen: { label: "元辰燈", price: 1000 },
      },
    },
    qifu: {
      label: "消災祈福",
      price: 300, // 將從價格服務更新
      source: "blessing.persons", //消災人員
    },
    xiaozai: {
      label: "固定消災",
      price: 100, // 將從價格服務更新
      source: "blessing.persons", //消災人員
    },
    pudu: {
      label: "中元普度",
      price: 1200, // 將從價格服務更新
      source: "blessing.persons", //消災人員
    },
    support_triple_gem: {
      label: "護持三寶",
      price: 200, // 將從價格服務更新
      source: "blessing.persons",
    },
    food_offering: {
      label: "供齋",
      price: 200, // 將從價格服務更新
      source: "blessing.persons",
    },
    support_temple: {
      label: "護持道場",
      price: 200, // 將從價格服務更新
      source: "blessing.persons",
    },
    sutra_printing: {
      label: "助印經書",
      price: 200, // 將從價格服務更新
      source: "blessing.persons",
    },
    life_release: {
      label: "放生",
      price: 200, // 將從價格服務更新
      source: "blessing.persons",
    },
  });

  /*
   * 存儲選中狀態的物件
   * key: 活動類型
   */
  const selections = ref({
    chaodu: [], //祖先
    survivors: [], //陽上人
    diandeng: [], //點燈
    qifu: [], //消災祈福
    xiaozai: [], //固定消災
    pudu: [], //中元普度
    support_triple_gem: [], //護持三寶
    food_offering: [], //供齋
    support_temple: [], //護持道場
    sutra_printing: [], //助印經書
    life_release: [], //放生
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

  /**
   * 從價格服務更新活動配置中的價格
   */
  const renewPricesByCurrentPriceConfig = async () => {
    try {
      console.log("💰 從價格服務更新活動價格...");

      // 獲取當前生效的價格配置
      const result = await priceConfigService.getCurrentPriceConfig();

      if (result.success && result.data && result.data.prices) {
        const prices = result.data.prices;

        // 更新各個活動類型的價格
        if (prices.chaodu !== undefined) {
          activityConfigs.value.chaodu.price = prices.chaodu;
        }
        if (prices.survivors !== undefined) {
          activityConfigs.value.survivors.price = prices.survivors;
        }
        if (prices.diandeng !== undefined) {
          activityConfigs.value.diandeng.price = prices.diandeng;

          // 如果有點燈的燈種價格配置，也一併更新
          if (prices.diandeng_guangming !== undefined) {
            activityConfigs.value.diandeng.lampTypes.guangming.price =
              prices.diandeng_guangming;
          }
          if (prices.diandeng_taisui !== undefined) {
            activityConfigs.value.diandeng.lampTypes.taisui.price =
              prices.diandeng_taisui;
          }
          if (prices.diandeng_yuanchen !== undefined) {
            activityConfigs.value.diandeng.lampTypes.yuanchen.price =
              prices.diandeng_yuanchen;
          }
        }
        if (prices.qifu !== undefined) {
          activityConfigs.value.qifu.price = prices.qifu;
        }
        if (prices.xiaozai !== undefined) {
          activityConfigs.value.xiaozai.price = prices.xiaozai;
        }
        if (prices.pudu !== undefined) {
          activityConfigs.value.pudu.price = prices.pudu;
        }
        if (prices.support_triple_gem !== undefined) {
          activityConfigs.value.support_triple_gem.price =
            prices.support_triple_gem;
        }
        if (prices.food_offering !== undefined) {
          activityConfigs.value.food_offering.price = prices.food_offering;
        }
        if (prices.support_temple !== undefined) {
          activityConfigs.value.support_temple.price = prices.support_temple;
        }
        if (prices.sutra_printing !== undefined) {
          activityConfigs.value.sutra_printing.price = prices.sutra_printing;
        }
        if (prices.life_release !== undefined) {
          activityConfigs.value.life_release.price = prices.life_release;
        }

        console.log("✅ 活動價格更新完成:", {
          chaodu: activityConfigs.value.chaodu.price,
          diandeng: activityConfigs.value.diandeng.price,
          qifu: activityConfigs.value.qifu.price,
          support_triple_gem: activityConfigs.value.support_triple_gem.price,
        });

        return true;
      } else {
        console.warn("⚠️ 無法獲取價格配置，使用默認價格");
        return false;
      }
    } catch (error) {
      console.error("❌ 更新活動價格失敗:", error);
      return false;
    }
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

    // 如果是點燈，計算總價格（每個人可能選擇不同燈種）
    if (type === "diandeng") {
      let totalPrice = 0;
      const lampDetails = [];

      sourceData.forEach((person) => {
        const lampType = getPersonLampType(person.id);
        const lampConfig = config.lampTypes[lampType];
        totalPrice += lampConfig.price;
        lampDetails.push({
          personId: person.id,
          personName: person.name,
          lampType: lampType,
          lampTypeLabel: lampConfig.label,
          price: lampConfig.price,
        });
      });

      price = totalPrice / sourceData.length; // 平均價格用於顯示
      label = `${config.label}`;

      return {
        type,
        label,
        price,
        quantity: sourceData.length,
        subtotal: totalPrice,
        source: config.source,
        sourceData: sourceData,
        sourceAddress: sourceAddress,
        lampDetails: lampDetails, // 詳細的燈種資訊
      };
    }

    return {
      type,
      label, // 超度/超薦、陽上人、點燈(光明燈)、祈福、固定消災、中元普度、護持三寶、供齋、護持道場、助印經書、放生
      price, // 金額
      quantity: sourceData.length, // 數量
      subtotal: price * sourceData.length, // 小計
      source: config.source, // 資料來源：registration
      sourceData: sourceData, // 當下選擇的：registration
      sourceAddress: sourceAddress, // 對應的地址
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
   * 生成佛字第
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
    record.receiptIssuedAt = DateUtils.getCurrentISOTime();
    record.receiptIssuedBy = getUserName();
    record.updatedAt = DateUtils.getCurrentISOTime();
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
    record.accountingDate = DateUtils.getCurrentISOTime();
    record.accountingBy = accountingBy;
    record.accountingNotes = notes;
    record.updatedAt = DateUtils.getCurrentISOTime();
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
    record.paymentDate = DateUtils.getCurrentISOTime();
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
  const searchKeyword = ref(""); // 搜尋關鍵字

  // 使用 registrationQueryStore 的過濾功能
  const filteredRegistrations = computed(() => {
    const queryStore = useQueryStore();
    return queryStore.getFilteredData(
      { query: searchKeyword.value },
      allRegistrations.value,
    );
  });

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
      }
    } catch (error) {
      console.error("取得所有祈福登記資料失敗:", error);
      return allRegistrations.value;
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

  // 活動參加，提交參加記錄
  const submitRecord = async (
    activityId = null, // 活動 ID
    notes = "", // 備註
    needReceipt = false, // 是否需要收據
  ) => {
    console.log("活動參加，送出存檔:", {
      activityId: activityId,
      notes: notes,
      needReceipt: needReceipt,
    });

    isLoading.value = true;
    error.value = null;

    if (!selectedRegistration.value) return;
    const createISOTime = DateUtils.getCurrentISOTime();
    try {
      // 獲取當前用戶信息

      // 將 selections 轉換為完整的 items 結構
      const processedItems = [];
      Object.keys(selections.value).forEach((activityType) => {
        const selectedItems = selections.value[activityType];
        if (selectedItems && selectedItems.length > 0) {
          const item = createParticipationItem(activityType, selectedItems);
          processedItems.push(item);
        }
      });

      const payload = {
        registrationId: selectedRegistration.value.id,
        activityId: activityId || -1, // 使用傳入的 activityId，如果沒有則使用 -1
        state: "confirmed", // confirmed=已確認，unconfirmed=未確認，canceled=已取消
        items: processedItems, // 使用處理過的完整 items
        contact: selectedRegistration.value.contact, // 新增聯絡人資訊
        personLampTypes: personLampTypes.value, // 每個人的燈種選擇
        total: totalAmount.value,
        totalAmount: totalAmount.value,
        notes: notes, // 新增備註欄位
        needReceipt: needReceipt, // 是否需要收據
        createdUser: getCurrentUser(),
        createdAt: createISOTime,
        user_created: getCurrentUser(),
      };
      console.log("submitRecord:", payload);
      if (serviceAdapter.getIsMock()) {
        console.warn("⚠️ 當前模式不是 directus，無法創建數據");
        const now = new Date();
        const mockPlayload = {
          id: DateUtils.getCurrentTimestamp(now), //mock id
          ...payload,
        };
        savedRecords.value.unshift(mockPlayload); // 將新記錄加入 savedRecords
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
        // forUI 頁面顯示用
        savedRecords.value.unshift(result.data); // 將新記錄加入 savedRecords

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

  // 獲取用戶名稱
  const getUserName = () => {
    return authService.getUserName();
  };

  // 初始化 - 在頁面使用前調用，更新價格配置
  const initializePrices = async () => {
    console.log("💰 初始化活動價格配置...");
    await renewPricesByCurrentPriceConfig();
    console.log("✅ 活動價格配置初始化完成");
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
    searchKeyword,

    // Getters
    totalAmount,
    filteredRegistrations,
    // Actions
    setRegistration,
    resetSelections,
    toggleGroup,
    setGroupSelection,
    setPersonLampType,
    getPersonLampType,
    submitRecord, // 提交參加記錄
    loadRegistrationData, // 載入祈福登記資料
    getAllRegistrations, // 獲取所有祈福登記
    getAllJoinRecords, // 獲取所有參加記錄
    renewPricesByCurrentPriceConfig, // 更新活動價格
    initializePrices, // 初始化價格配置

    // 獲取用戶信息
    getUserName,
    getCurrentUser,

    // 其他方法
    getItemsSummary, // 取得項目摘要
    getItemsDetail, // 取得項目詳細清單
    recordPayment, // 記錄付款
    issueReceipt, // 開立收據
    reconcileAccounting, // 會計沖帳
    getSourceData, // 獲取資料來源
  };
});
