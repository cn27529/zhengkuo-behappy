import { defineStore } from "pinia";
import { ref, reactive, computed } from "vue";
import { useRegistrationStore } from "./registrationStore.js";

export const useCardStore = defineStore("card", () => {
  // 卡片設計狀態
  const droppedItems = ref([]);
  const registrationStore = useRegistrationStore();

  // 卡片模組列表
  const cardTemplates = ref([
    { id: "zk01b", name: "空白模版" },
    { id: "zk02b", name: "宗親模版" },
    { id: "zk03a", name: "合家模版" },
    // 未來可以繼續添加更多模組
  ]);

  // 當前選中的模組 ID
  const selectedTemplateId = ref("zk01b");

  const cardData = computed(() => {
    console.log("📡 表單數據：", formData.value);

    const data = {
      // 基礎資訊
      name: formData.value.contact?.name || "王小明",

      // 消災地址
      blessingAddress: formData.value.blessing?.address || "",
      // 消災人員，將表單數據轉換為卡片數據
      persons: formData.value.blessing?.persons?.map((p) => p.name) || [],

      // 超度地址
      salvationAddress: formData.value.salvation?.address || "",
      // 祖先
      ancestors:
        formData.value.salvation?.ancestors?.map((p) => p.surname) || [],
      // 陽上人
      survivors: formData.value.salvation?.survivors?.map((p) => p.name) || [],
    };

    return data;
  });

  /*
    表單結構
    {
        "state": "submitted",
        "createdAt": "2025-11-22T08:30:00.000Z",
        "updatedAt": "2025-01-15T09:45:00.000Z",
        "formName": "2025祈福登記表-001",
        "formSource": "",
        "formId": "a1b2c3d",
        "id": 1,
        "contact": {
            "name": "王大明",
            "phone": "02-12345678",
            "mobile": "0912-345-678",
            "relationship": "本家",
            "otherRelationship": ""
        },
        // 消災資料
        "blessing": {
            // 消災地址
            "address": "台北市中正區中山南路1號",
            // 消災人員
            "persons": [
                {
                    "id": 1,
                    "name": "王大明",
                    "zodiac": "龍",
                    "notes": "",
                    "isHouseholdHead": true
                },
                {
                    "id": 2,
                    "name": "李小華",
                    "zodiac": "蛇",
                    "notes": "妻子",
                    "isHouseholdHead": false
                }
            ]
        },
        //超度資料
        "salvation": {
            // 超度地址
            "address": "台北市中正區中山南路1號",
            // 祖先姓氏
            "ancestors": [
                {
                    "id": 1,
                    "surname": "王府",
                    "notes": "歷代祖先"
                }
            ],
            // 陽上人資料
            "survivors": [
                {
                    "id": 1,
                    "name": "王大明",
                    "zodiac": "龍",
                    "notes": ""
                },
                {
                    "id": 2,
                    "name": "李小華",
                    "zodiac": "蛇",
                    "notes": ""
                }
            ]
        }
    }
  */
  const formData = ref(registrationStore.getInitialFormData());

  const loadFormData = async (propsData) => {
    try {
      await registrationStore.loadConfig();
      const result = await registrationStore.loadFormData(propsData);
      if (result) {
        // 直接更新 formData
        formData.value = registrationStore.registrationForm;
        console.log("✅ 表單載入成功，卡片數據自動更新");

        // 不再需要手動調用 convertDataToCard
        // cardData 會自動通過 computed 更新
      }
    } catch (error) {
      console.error("載入表單數據失敗:", error);
      throw error;
    }
  };

  // 添加已放置項目
  const addDroppedItem = (item) => {
    droppedItems.value.push(item);
  };

  // 更新項目位置
  const updateItemPosition = (itemId, x, y) => {
    const itemIndex = droppedItems.value.findIndex(
      (item) => item.id === itemId
    );
    if (itemIndex !== -1) {
      droppedItems.value[itemIndex].x = x;
      droppedItems.value[itemIndex].y = y;
    }
  };

  // 刪除已放置項目
  const deleteDroppedItem = (itemId) => {
    const itemIndex = droppedItems.value.findIndex(
      (item) => item.id === itemId
    );
    if (itemIndex !== -1) {
      droppedItems.value.splice(itemIndex, 1);
    }
  };

  // 保存設計到本地存儲（模擬保存到數據庫）
  const saveDesign = () => {
    return new Promise((resolve) => {
      // 模擬 API 調用延遲
      setTimeout(() => {
        const designData = {
          selectedTemplateId: selectedTemplateId.value,
          items: droppedItems.value,
          lastUpdated: new Date().toISOString(),
        };
        // 保存到 sessionStorage（模擬保存到數據庫）
        sessionStorage.setItem("cardDesign", JSON.stringify(designData));
        console.log("設計已保存:", designData);
        resolve(designData);
      }, 500);
    });
  };

  // 從本地存儲加載設計
  const loadSavedDesign = () => {
    const savedDesign = sessionStorage.getItem("cardDesign");
    if (savedDesign) {
      try {
        const designData = JSON.parse(savedDesign);
        droppedItems.value = designData.items || [];
        selectedTemplateId.value = designData.selectedTemplateId || "zk01b";
        console.log("已加載保存的設計:", designData);
      } catch (error) {
        console.error("加載保存的設計時出錯:", error);
      }
    }
  };

  // 重置設計
  const resetDesign = () => {
    droppedItems.value = [];
    selectedTemplateId.value = "zk01b";
    sessionStorage.removeItem("cardDesign");
  };

  // 獲取完整的設計數據（用於 API 提交）
  const getDesignData = () => {
    return {
      selectedTemplateId: selectedTemplateId.value,
      cardData: { ...cardData },
      droppedItems: [...droppedItems.value],
      lastUpdated: new Date().toISOString(),
    };
  };

  return {
    droppedItems,
    cardData,
    cardTemplates,
    selectedTemplateId,
    addDroppedItem,
    updateItemPosition,
    deleteDroppedItem,
    saveDesign,
    loadSavedDesign,
    resetDesign,
    getDesignData,
    loadFormData,
    formData,
  };
});
