// src/stores/registration.js
import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useRegistrationStore = defineStore("registration", () => {
  // 配置參數
  const config = ref({
    maxHouseholdHeads: 1, // 最大戶長數
    maxAncestors: 5, // 最大祖先數
    maxSurvivors: 2, // 最大陽上人數
    defaultSurvivors: 2, // 預設陽上人數
  });

  // 表單數據
  const registrationForm = ref({
    // 聯絡人信息
    contact: {
      name: "",
      phone: "",
      mobile: "",
      relationship: "本家", // 本家、娘家、朋友、其它
      otherRelationship: "",
    },
    // 消災區塊
    blessing: {
      address: "",
      persons: [
        {
          id: 1,
          name: "",
          zodiac: "",
          notes: "",
          isHouseholdHead: true,
        },
      ],
    },
    // 超度區塊
    salvation: {
      address: "",
      ancestors: [
        {
          id: 1,
          surname: "",
          notes: "",
        },
      ],
      survivors: [
        {
          id: 1,
          name: "",
          zodiac: "",
          notes: "",
        },
        {
          id: 2,
          name: "",
          zodiac: "",
          notes: "",
        },
      ],
    },
  });

  // 關係選項
  const relationshipOptions = ref(["本家", "娘家", "朋友", "其它"]);

  // 生肖選項
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

  // Getter - 計算屬性
  const currentHouseholdHeadsCount = computed(() => {
    return registrationForm.value.blessing.persons.filter(
      (person) => person.isHouseholdHead
    ).length;
  });

  const currentAncestorsCount = computed(() => {
    return registrationForm.value.salvation.ancestors.length;
  });

  const currentSurvivorsCount = computed(() => {
    return registrationForm.value.salvation.survivors.length;
  });

  const availableBlessingPersons = computed(() => {
    return registrationForm.value.blessing.persons.filter(
      (person) => person.name.trim() !== ""
    );
  });

  const householdHeadWarning = computed(() => {
    const count = currentHouseholdHeadsCount.value;
    const max = config.value.maxHouseholdHeads;
    if (count > max) {
      return `戶長數量超過限制 (${count}/${max})`;
    } else if (count === 0) {
      return "請至少指定一位戶長";
    }
    return null;
  });

  const ancestorsWarning = computed(() => {
    const count = currentAncestorsCount.value;
    const max = config.value.maxAncestors;
    if (count > max) {
      return `祖先數量超過限制 (${count}/${max})`;
    }
    return null;
  });

  const survivorsWarning = computed(() => {
    const count = currentSurvivorsCount.value;
    const max = config.value.maxSurvivors;
    if (count > max) {
      return `陽上人數量超過限制 (${count}/${max})`;
    }
    return null;
  });

  const isFormValid = computed(() => {
    return (
      !householdHeadWarning.value &&
      !ancestorsWarning.value &&
      !survivorsWarning.value &&
      registrationForm.value.contact.name.trim() !== "" &&
      (registrationForm.value.contact.phone.trim() !== "" ||
        registrationForm.value.contact.mobile.trim() !== "") &&
      registrationForm.value.blessing.address.trim() !== "" &&
      registrationForm.value.salvation.address.trim() !== ""
    );
  });

  // Actions - 消災區塊方法
  const addBlessingPerson = () => {
    const newId =
      Math.max(...registrationForm.value.blessing.persons.map((p) => p.id), 0) +
      1;
    registrationForm.value.blessing.persons.push({
      id: newId,
      name: "",
      zodiac: "",
      notes: "",
      isHouseholdHead: false,
    });
  };

  const removeBlessingPerson = (id) => {
    const index = registrationForm.value.blessing.persons.findIndex(
      (p) => p.id === id
    );
    if (index !== -1) {
      registrationForm.value.blessing.persons.splice(index, 1);
    }
  };

  const toggleHouseholdHead = (id) => {
    const person = registrationForm.value.blessing.persons.find(
      (p) => p.id === id
    );
    if (person) {
      if (person.isHouseholdHead) {
        person.isHouseholdHead = false;
      } else {
        // 確保不超過最大戶長數
        if (currentHouseholdHeadsCount.value < config.value.maxHouseholdHeads) {
          person.isHouseholdHead = true;
        }
      }
    }
  };

  // Actions - 超度區塊方法
  const addAncestor = () => {
    const newId =
      Math.max(
        ...registrationForm.value.salvation.ancestors.map((a) => a.id),
        0
      ) + 1;
    registrationForm.value.salvation.ancestors.push({
      id: newId,
      surname: "",
      notes: "",
    });
  };

  const removeAncestor = (id) => {
    const index = registrationForm.value.salvation.ancestors.findIndex(
      (a) => a.id === id
    );
    if (index !== -1) {
      registrationForm.value.salvation.ancestors.splice(index, 1);
    }
  };

  const addSurvivor = () => {
    const newId =
      Math.max(
        ...registrationForm.value.salvation.survivors.map((s) => s.id),
        0
      ) + 1;
    registrationForm.value.salvation.survivors.push({
      id: newId,
      name: "",
      zodiac: "",
      notes: "",
    });
  };

  const removeSurvivor = (id) => {
    const index = registrationForm.value.salvation.survivors.findIndex(
      (s) => s.id === id
    );
    if (index !== -1) {
      registrationForm.value.salvation.survivors.splice(index, 1);
    }
  };

  const importSurvivorFromBlessing = (person) => {
    if (currentSurvivorsCount.value < config.value.maxSurvivors) {
      const newId =
        Math.max(
          ...registrationForm.value.salvation.survivors.map((s) => s.id),
          0
        ) + 1;
      registrationForm.value.salvation.survivors.push({
        id: newId,
        name: person.name,
        zodiac: person.zodiac,
        notes: person.notes,
      });
    }
  };

  // 表單提交
  const submitRegistration = async () => {
    if (!isFormValid.value) {
      throw new Error("表單驗證失敗，請檢查所有必填欄位");
    }

    try {
      // 模擬API調用
      // 這裡將來可以替換為真實的API調用
      // const response = await api.post('/registrations', registrationForm.value)

      console.log(
        "提交的報名數據:",
        JSON.parse(JSON.stringify(registrationForm.value))
      );

      // 模擬成功響應
      return {
        success: true,
        message: "報名提交成功！",
        data: {
          id: Date.now(),
          ...registrationForm.value,
        },
      };
    } catch (error) {
      console.error("提交報名失敗:", error);
      throw error;
    }
  };

  // 重置表單
  const resetForm = () => {
    registrationForm.value = {
      contact: {
        name: "",
        phone: "",
        mobile: "",
        relationship: "本家",
        otherRelationship: "",
      },
      blessing: {
        address: "",
        persons: [
          {
            id: 1,
            name: "",
            zodiac: "",
            notes: "",
            isHouseholdHead: true,
          },
        ],
      },
      salvation: {
        address: "",
        ancestors: [
          {
            id: 1,
            surname: "",
            notes: "",
          },
        ],
        survivors: [
          {
            id: 1,
            name: "",
            zodiac: "",
            notes: "",
          },
          {
            id: 2,
            name: "",
            zodiac: "",
            notes: "",
          },
        ],
      },
    };
  };

  // 加載配置
  const loadConfig = async () => {
    try {
      // 模擬從API加載配置
      // const response = await api.get('/registration-config')
      // config.value = response.data

      console.log("加載配置成功");
      return config.value;
    } catch (error) {
      console.error("加載配置失敗:", error);
      throw error;
    }
  };

  return {
    // 狀態
    config,
    registrationForm,
    relationshipOptions,
    zodiacOptions,

    // Getter
    currentHouseholdHeadsCount,
    currentAncestorsCount,
    currentSurvivorsCount,
    availableBlessingPersons,
    householdHeadWarning,
    ancestorsWarning,
    survivorsWarning,
    isFormValid,

    // Actions
    addBlessingPerson,
    removeBlessingPerson,
    toggleHouseholdHead,
    addAncestor,
    removeAncestor,
    addSurvivor,
    removeSurvivor,
    importSurvivorFromBlessing,
    submitRegistration,
    resetForm,
    loadConfig,
  };
});
