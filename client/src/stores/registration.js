// src/stores/registration.js
// 本檔為報名表單的 Pinia store，管理整個消災超度登記表的狀態與操作。
// 🔄 重構重點：實現 registrationForm 和 formArray[currentFormIndex] 的雙向實時同步
import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { generateGitHash } from "../utils/generateGitHash.js";
import { registrationService } from "../services/registrationService.js";
import { serviceConfig } from "../config/serviceConfig.js";
import mockRegistrations from "../data/mock_registrations.json";

export const useRegistrationStore = defineStore("registration", () => {
  // 支援多張表單的陣列
  const formArray = ref([]);
  // 當前編輯的表單索引
  const currentFormIndex = ref(0);

  // 提取為顶层共用函数（在 setupFormSync 之前定义）
  const loadFormToRegistration = (formData) => {
    Object.keys(formData).forEach((key) => {
      if (key !== "contact" && key !== "blessing" && key !== "salvation") {
        registrationForm.value[key] = formData[key];
      }
    });

    Object.keys(formData.contact).forEach((key) => {
      registrationForm.value.contact[key] = formData.contact[key];
    });

    registrationForm.value.blessing.address = formData.blessing.address;
    registrationForm.value.blessing.persons.length = 0;
    formData.blessing.persons.forEach((person) => {
      registrationForm.value.blessing.persons.push({ ...person });
    });

    registrationForm.value.salvation.address = formData.salvation.address;
    registrationForm.value.salvation.ancestors.length = 0;
    formData.salvation.ancestors.forEach((ancestor) => {
      registrationForm.value.salvation.ancestors.push({ ...ancestor });
    });
    registrationForm.value.salvation.survivors.length = 0;
    formData.salvation.survivors.forEach((survivor) => {
      registrationForm.value.salvation.survivors.push({ ...survivor });
    });
  };

  // 當用戶編輯頁面時，自動同步回 formArray
  let syncWatcher = null;

  const setupFormSync = () => {
    // 如果已有 watcher，先移除（防止重複監聽）
    if (syncWatcher) syncWatcher();

    // 這是解決「資料更新慢一步」的核心
    syncWatcher = watch(
      () => registrationForm.value,
      (newValue) => {
        // 只在有表單陣列且當前索引有效時同步
        if (
          formArray.value.length > 0 &&
          currentFormIndex.value >= 0 &&
          currentFormIndex.value < formArray.value.length
        ) {
          // 進行深拷貝，避免引用問題
          formArray.value[currentFormIndex.value] = JSON.parse(
            JSON.stringify(newValue)
          );
          console.log(
            `[v0] Sync: registrationForm → formArray[${currentFormIndex.value}]`
          );
        }
      },
      { deep: true } // 🔑 關鍵：deep: true 監聽所有深層屬性變化（包括嵌套物件和陣列）
    );
  };

  // 獲取初始表單資料（深拷貝）
  const getInitialFormData = () => {
    const createISOTime = new Date().toISOString();
    const timestamp = Date.now().toString();
    // 聯絡人
    const myContact = {
      name: "",
      phone: "",
      mobile: "",
      relationship: "",
      otherRelationship: "",
    };

    // 消災人員
    const myBlessing = {
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
    };
    // 祖先及陽上人
    const mySalvation = {
      address: "",
      ancestors: [
        {
          id: 1,
          surname: "",
          zodiac: "",
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
      ],
    };

    const initForm = {
      state: "creating",
      createdAt: createISOTime,
      createdUser: "",
      updatedAt: "",
      updatedUser: "",
      formName: "",
      formId: "",
      formSource: "",
      contact: myContact,
      blessing: myBlessing,
      salvation: mySalvation,
    };
    return JSON.parse(JSON.stringify(initForm));
  };

  const addNewForm = () => {
    try {
      console.log("🚀 開始新增表單...");

      const newForm = getInitialFormData();
      // 將新表單預設填入聯絡人資料
      newForm.state = "editing";
      newForm.contact = JSON.parse(
        JSON.stringify(registrationForm.value.contact)
      );
      // 將新表單推入陣列
      formArray.value.push(newForm);
      currentFormIndex.value = formArray.value.length - 1;

      setupFormSync();

      loadFormToRegistration(formArray.value[currentFormIndex.value]);
      console.log("✅ 新增表單完成，當前索引:", currentFormIndex.value);
      return currentFormIndex.value;
    } catch (error) {
      console.error("❌ 新增表單失敗:", error);
      return -1;
    }
  };

  const switchForm = (index) => {
    try {
      if (index < 0 || index >= formArray.value.length) {
        console.error("❌ 切換表單索引無效:", index);
        return false;
      }

      console.log("🔄 切換表單從", currentFormIndex.value, "到", index);

      // 如果formId存在，不切換狀態
      if (formArray.value[currentFormIndex.value].formId === "") {
        formArray.value[currentFormIndex.value].state = "saved";
      }

      // 切換目標表單
      const targetForm = formArray.value[index];
      // 如果formId存在，不切換狀態
      if (targetForm.formId === "") {
        targetForm.state = "editing";
      }
      loadFormToRegistration(targetForm);
      currentFormIndex.value = index;

      setupFormSync();

      console.log("表單切換完成，當前表單索引:", currentFormIndex.value);
      return currentFormIndex.value;
    } catch (error) {
      console.error("❌ 表單切換失敗:", error);
      return -1;
    }
  };

  // 刪除表單
  const deleteForm = (index) => {
    console.log("🗑️ 開始刪除表單，索引:", index);
    console.log("刪除前表單陣列長度:", formArray.value.length);
    console.log("刪除前當前索引:", currentFormIndex.value);

    if (formArray.value.length <= 1) {
      console.log("❌ 至少需要保留一張表單");
      return false;
    }

    if (formArray.value.length > 0 && currentFormIndex.value >= 0) {
      formArray.value[currentFormIndex.value] = JSON.parse(
        JSON.stringify(registrationForm.value)
      );
    }

    formArray.value.splice(index, 1);
    console.log("刪除後表單陣列長度:", formArray.value.length);

    if (currentFormIndex.value === index) {
      currentFormIndex.value = Math.max(0, index - 1);
    } else if (currentFormIndex.value > index) {
      currentFormIndex.value = currentFormIndex.value - 1;
    }

    console.log("刪除後調整的當前索引:", currentFormIndex.value);
    const resultIndex = switchForm(currentFormIndex.value);
    console.log("最終切換結果索引:", resultIndex);

    return true;
  };

  // 複製表單
  const duplicateForm = (index) => {
    const duplicated = JSON.parse(JSON.stringify(formArray.value[index]));
    duplicated.formName = `${duplicated.formName} - 複製`;
    formArray.value.push(duplicated);
    const resultIndex = switchForm(formArray.value.length - 1);
  };

  const getFormSummaries = computed(() => {
    if (currentFormIndex.value === 0 && formArray.value.length === 0) {
      return [];
    }
    return formArray.value.map((form, index) => ({
      index,
      formName: form.formName || `表單 ${index + 1}`,
      formId: form.formId,
      status: form.state,
      createdAt: form.createdAt,
      createdUser: form.createdUser,
      updatedAt: form.updatedAt,
      updatedUser: form.updatedUser,
      contactName: form.contact.name,
      personsCount: form.blessing.persons.filter((p) => p.name.trim()).length,
      ancestorsCount: form.salvation.ancestors.filter((a) => a.surname.trim())
        .length,
    }));
  });

  const currentFormSummary = computed(
    () => getFormSummaries.value[currentFormIndex.value]
  );

  const config = ref({
    maxHouseholdHeads: 1,
    maxAncestors: 1,
    maxSurvivors: 2,
    defaultSurvivors: 2,
  });

  const registrationForm = ref(getInitialFormData());

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
    return registrationForm.value.blessing.persons.filter((person) => {
      const name = (person.name || "").toString().trim();
      return name !== "";
    });
  });

  const availableAncestors = computed(() => {
    return registrationForm.value.salvation.ancestors.filter((a) => {
      const s = (a.surname || "").toString().trim();
      return s !== "";
    });
  });

  const availableSurvivors = computed(() => {
    return registrationForm.value.salvation.survivors.filter((s) => {
      const name = (s.name || "").toString().trim();
      return name !== "";
    });
  });

  const actionMessage = ref({ type: null, text: "" });
  const setActionMessage = (type, text) => {
    actionMessage.value = { type, text };
    return actionMessage.value;
  };

  const householdHeadWarning = computed(() => {
    const count = currentHouseholdHeadsCount.value;
    const max = config.value.maxHouseholdHeads;
    const filledCount = availableBlessingPersons.value.length;
    if (count > max) {
      return `戶長數量超過限制 (${count}/${max})`;
    } else if (filledCount > 0 && count === 0) {
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

  const validationDetails = computed(() => {
    const details = {
      valid: true,
      errors: {},
      messages: [],
    };

    const hhCount = currentHouseholdHeadsCount.value;
    if (hhCount > config.value.maxHouseholdHeads) {
      details.valid = false;
      details.errors.householdHead = `戶長數量超過限制 (${hhCount}/${config.value.maxHouseholdHeads})`;
      details.messages.push(details.errors.householdHead);
    } else if (availableBlessingPersons.value.length > 0 && hhCount === 0) {
      details.valid = false;
      details.errors.householdHead = "請至少指定一位戶長";
      details.messages.push(details.errors.householdHead);
    } else {
      details.errors.householdHead = null;
    }

    const ancCount = currentAncestorsCount.value;
    if (ancCount > config.value.maxAncestors) {
      details.valid = false;
      details.errors.ancestors = `祖先數量超過限制 (${ancCount}/${config.value.maxAncestors})`;
      details.messages.push(details.errors.ancestors);
    } else {
      details.errors.ancestors = null;
    }

    const svCount = currentSurvivorsCount.value;
    if (svCount > config.value.maxSurvivors) {
      details.valid = false;
      details.errors.survivors = `陽上人數量超過限制 (${svCount}/${config.value.maxSurvivors})`;
      details.messages.push(details.errors.survivors);
    } else {
      details.errors.survivors = null;
    }

    if (!registrationForm.value.contact.name.trim()) {
      details.valid = false;
      details.errors.contactName = "聯絡人姓名為必填";
      details.messages.push(details.errors.contactName);
    } else {
      details.errors.contactName = null;
    }

    if (!registrationForm.value.contact.relationship.trim()) {
      details.valid = false;
      details.errors.contactRelationship = "資料表屬性為必填";
      details.messages.push(details.errors.contactRelationship);
    } else {
      details.errors.contactRelationship = null;
    }

    if (
      !registrationForm.value.contact.phone.trim() &&
      !registrationForm.value.contact.mobile.trim()
    ) {
      details.valid = false;
      details.errors.contactPhone = "請填寫電話或手機其中之一";
      details.messages.push(details.errors.contactPhone);
    } else {
      details.errors.contactPhone = null;
    }

    if (
      registrationForm.value.contact.relationship === "其它" &&
      !registrationForm.value.contact.otherRelationship.trim()
    ) {
      details.valid = false;
      details.errors.otherRelationship = "選擇『其它』時，請填寫其他關係說明";
      details.messages.push(details.errors.otherRelationship);
    } else {
      details.errors.otherRelationship = null;
    }

    const blessingAddrFilled =
      registrationForm.value.blessing.address &&
      registrationForm.value.blessing.address.trim();
    const filledBlessingPersons = availableBlessingPersons.value.length;

    if (filledBlessingPersons > 0 && !blessingAddrFilled) {
      details.valid = false;
      details.errors.blessingAddress = "已填寫消災人員，消災地址為必填";
      details.messages.push(details.errors.blessingAddress);
    } else {
      details.errors.blessingAddress = null;
    }

    if (blessingAddrFilled && filledBlessingPersons === 0) {
      details.valid = false;
      details.errors.blessingPersons = "消災地址已填寫，請至少填寫一筆消災人員";
      details.messages.push(details.errors.blessingPersons);
    } else {
      details.errors.blessingPersons = null;
    }

    const allBlessingPersons = registrationForm.value.blessing.persons || [];

    if (filledBlessingPersons > 0 && blessingAddrFilled) {
      const hasIncompletePerson = allBlessingPersons.some(
        (p) => !p.zodiac || !p.zodiac.trim()
      );
      if (hasIncompletePerson) {
        details.valid = false;
        details.errors.blessingPersonIncomplete =
          "消災人員中有未填寫生肖的條目，請填寫或刪除空白條目";
        details.messages.push(details.errors.blessingPersonIncomplete);
      } else {
        details.errors.blessingPersonIncomplete = null;
      }
    }

    if (allBlessingPersons.length >= 2) {
      const hasIncompletePerson = allBlessingPersons.some(
        (p) => !p.name || !p.name.trim()
      );
      if (hasIncompletePerson) {
        details.valid = false;
        details.errors.blessingPersonIncomplete =
          "消災人員中有未填寫姓名的條目，請填寫或刪除空白條目";
        details.messages.push(details.errors.blessingPersonIncomplete);
      } else {
        details.errors.blessingPersonIncomplete = null;
      }
    }

    const allAncestors = registrationForm.value.salvation.ancestors || [];
    if (allAncestors.length >= 2) {
      const hasIncompleteAncestor = allAncestors.some(
        (a) => !a.surname || !a.surname.trim()
      );
      if (hasIncompleteAncestor) {
        details.valid = false;
        details.errors.ancestorIncomplete =
          "祖先名單中有未填寫姓氏的條目，請填寫或刪除空白條目";
        details.messages.push(details.errors.ancestorIncomplete);
      } else {
        details.errors.ancestorIncomplete = null;
      }
    } else {
      details.errors.ancestorIncomplete = null;
    }

    const allSurvivors = registrationForm.value.salvation.survivors || [];
    if (allSurvivors.length >= 2) {
      const hasIncompleteSurvivor = allSurvivors.some(
        (s) => !s.name || !s.name.trim()
      );
      if (hasIncompleteSurvivor) {
        details.valid = false;
        details.errors.survivorIncomplete =
          "陽上人名單中有未填寫姓名的條目，請填寫或刪除空白條目";
        details.messages.push(details.errors.survivorIncomplete);
      } else {
        details.errors.survivorIncomplete = null;
      }
    } else {
      details.errors.survivorIncomplete = null;
    }

    const salvationAddrFilled = (registrationForm.value.salvation.address || "")
      .toString()
      .trim();
    const filledAncestorsCount = availableAncestors.value.length;
    const filledSurvivorsCount = availableSurvivors.value.length;

    if (
      filledAncestorsCount + filledSurvivorsCount > 0 &&
      !salvationAddrFilled
    ) {
      details.valid = false;
      details.errors.salvationAddress = "已填寫祖先或陽上人，超度地址為必填";
      details.messages.push(details.errors.salvationAddress);
    } else if (salvationAddrFilled) {
      if (filledAncestorsCount === 0) {
        details.valid = false;
        details.errors.salvationAddress =
          "超度地址已填寫，請至少填寫一筆歷代祖先";
        details.messages.push(details.errors.salvationAddress);
      } else if (filledSurvivorsCount === 0) {
        details.valid = false;
        details.errors.survivorsRequiredForAncestors =
          "已填寫祖先，請至少填寫一位陽上人";
        details.messages.push(details.errors.survivorsRequiredForAncestors);
      } else {
        details.errors.salvationAddress = null;
      }
    } else {
      details.errors.salvationAddress = null;
    }

    if (filledAncestorsCount > 0 && filledSurvivorsCount === 0) {
      details.valid = false;
      details.errors.survivorsRequiredForAncestors =
        "已填寫祖先，請至少填寫一位陽上人";
      details.messages.push(details.errors.survivorsRequiredForAncestors);
    } else {
      details.errors.survivorsRequiredForAncestors = null;
    }

    const hasFilledBlessing = availableBlessingPersons.value.length > 0;
    const hasFilledAncestors = availableAncestors.value.length > 0;
    if (!hasFilledBlessing && !hasFilledAncestors) {
      details.valid = false;
      details.errors.blessingOrAncestorsRequired =
        "請至少填寫消災人員或歷代祖先其中一項";
      details.messages.push(details.errors.blessingOrAncestorsRequired);
    } else {
      details.errors.blessingOrAncestorsRequired = null;
    }

    return details;
  });

  const isFormValid = computed(() => validationDetails.value.valid);

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
        if (currentHouseholdHeadsCount.value < config.value.maxHouseholdHeads) {
          person.isHouseholdHead = true;
        }
      }
    }
  };

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
    const name = (person.name || "").trim();
    if (!name) {
      setActionMessage("warning", "此人資料無效，無法匯入");
      return { status: "invalid", message: "此人資料無效，無法匯入" };
    }

    const exists = registrationForm.value.salvation.survivors.some(
      (s) => s.name && s.name.trim() === name
    );
    if (exists) {
      setActionMessage("warning", "此人已在陽上人名單中");
      return { status: "duplicate", message: "此人已在陽上人名單中" };
    }

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

    setActionMessage("success", "已匯入陽上人");
    return { status: "ok", message: "已匯入陽上人" };
  };

  const addContactToBlessing = () => {
    const name = (registrationForm.value.contact.name || "").trim();
    if (!name) {
      setActionMessage("warning", "聯絡人姓名為空，無法加入消災人員");
      return { status: "invalid", message: "聯絡人姓名為空" };
    }

    const exists = registrationForm.value.blessing.persons.some(
      (p) => p.name && p.name.trim() === name
    );
    if (exists) {
      setActionMessage("warning", "聯絡人已在消災人員名單中");
      return { status: "duplicate", message: "聯絡人已在消災人員名單中" };
    }

    const newId =
      Math.max(...registrationForm.value.blessing.persons.map((p) => p.id), 0) +
      1;
    registrationForm.value.blessing.persons.push({
      id: newId,
      name: name,
      zodiac: "",
      notes: "",
      isHouseholdHead: false,
    });

    setActionMessage("success", "已將聯絡人加入消災人員");
    return { status: "ok", message: "已將聯絡人加入消災人員" };
  };

  const addContactToSurvivors = () => {
    const name = (registrationForm.value.contact.name || "").trim();
    if (!name) {
      setActionMessage("warning", "聯絡人姓名為空，無法加入陽上人");
      return { status: "invalid", message: "聯絡人姓名為空" };
    }

    if (currentSurvivorsCount.value >= config.value.maxSurvivors) {
      setActionMessage("warning", "陽上人名單已達上限");
      return { status: "max", message: "陽上人名單已達上限" };
    }

    const exists = registrationForm.value.salvation.survivors.some(
      (s) => s.name && s.name.trim() === name
    );
    if (exists) {
      setActionMessage("warning", "聯絡人已在陽上人名單中");
      return { status: "duplicate", message: "聯絡人已在陽上人名單中" };
    }

    const newId =
      Math.max(
        ...registrationForm.value.salvation.survivors.map((s) => s.id),
        0
      ) + 1;
    registrationForm.value.salvation.survivors.push({
      id: newId,
      name: name,
      zodiac: "",
      notes: "",
    });

    setActionMessage("success", "已將聯絡人加入陽上人名單");
    return { status: "ok", message: "已將聯絡人加入陽上人名單" };
  };

  const copyBlessingAddress = () => {
    const src = (registrationForm.value.blessing.address || "").trim();
    if (src) {
      registrationForm.value.salvation.address = src;
      return true;
    }
    return false;
  };

  const getCurrentUser = () => {
    const userInfo = sessionStorage.getItem("auth-user");
    console.log("獲取到的用戶信息:", userInfo);
    if (userInfo) {
      const user = JSON.parse(userInfo);
      return user.id || user.username || user.displayName || "unknown";
    }
    return "anonymous";
  };

  const submitRegistration = async () => {
    if (!isFormValid.value) {
      throw new Error("表單驗證失敗，請檢查所有必填欄位");
    }

    if (registrationForm.value.formId.trim() !== "") {
      throw new Error("當前表單已提交過，請勿重複提交");
    }

    try {
      const createISOTime = new Date().toISOString();
      const timestamp = Date.now().toString();
      console.log("ISO 時間:", createISOTime);
      console.log("時間戳:", timestamp);
      const hash = generateGitHash(createISOTime);
      console.log(`hash:${hash}`);

      const currentUser = getCurrentUser();
      registrationForm.value.createdUser = currentUser;
      registrationForm.value.formId = hash;
      registrationForm.value.createdAt = createISOTime;
      registrationForm.value.state = "submitted";

      if (serviceConfig.mode !== "directus") {
        console.warn(
          "報名提交成功！⚠️ 當前模式不是 directus，無法創建數據，請切換到 directus 模式"
        );

        return {
          success: true,
          message:
            "報名提交成功！⚠️ 當前模式不是 directus，無法創建數據，請切換到 directus 模式",
          data: {
            id: Date.now(),
            ...registrationForm.value,
          },
        };
      }

      const result = await registrationService.createRegistration(
        registrationForm.value
      );

      if (result.success) {
        console.log("報名提交成功！回傳數據:", result.data);

        return {
          success: result.success,
          message: "報名提交成功！",
          formId: result.formId,
          data: {
            dbName: "registrationDB",
            ...result.data,
          },
        };
      } else {
        console.error("報名提交失敗！", result.message);
        return { ...result };
      }
    } catch (error) {
      console.error("報名提交error", error);
      throw error;
    }
  };

  const loadConfig = async () => {
    try {
      console.log("加載配置成功");
      return config.value;
    } catch (error) {
      console.error("加載配置失敗:", error);
      throw error;
    }
  };

  const initializeFormArray = () => {
    if (formArray.value.length === 0) {
      formArray.value.push(JSON.parse(JSON.stringify(registrationForm.value)));
      console.log("✅ 表單陣列已初始化");
    }
    // 設定自動同步機制
    setupFormSync();
    console.log("✅ 自動同步已啟動");
  };

  // 載入 Mock 數據
  const loadMockData = async () => {
    try {
      // 動態導入 mock 數據
      //const mockModule = await import('../data/mock_registrations.json');
      //const mockRegistrations = mockModule.default || mockModule;

      if (!mockRegistrations || mockRegistrations.length === 0) {
        console.error("Mock 數據為空或未找到");
        return false;
      }

      // 隨機選擇一筆數據
      const randomIndex = Math.floor(Math.random() * mockRegistrations.length);
      const mockData = mockRegistrations[randomIndex];

      console.log("載入 Mock 數據:", mockData);

      // 更新當前表單數據，但保留表單的狀態和 ID
      //const currentForm = formArray[currentFormIndex.value];
      const currentForm = getInitialFormData();

      // 只更新數據字段，不改變表單狀態和 ID
      if (mockData.contact) {
        currentForm.contact = { ...mockData.contact };
        console.log("載入 Mock contact 數據:", currentForm.contact);
      }

      if (mockData.blessing) {
        currentForm.blessing = {
          ...mockData.blessing,
          persons: mockData.blessing.persons
            ? [...mockData.blessing.persons]
            : [],
        };
        console.log("載入 Mock blessing 數據:", currentForm.blessing);
      }

      if (mockData.salvation) {
        currentForm.salvation = {
          ...mockData.salvation,
          ancestors: mockData.salvation.ancestors
            ? [...mockData.salvation.ancestors]
            : [],
          survivors: mockData.salvation.survivors
            ? [...mockData.salvation.survivors]
            : [],
        };
        console.log("載入 Mock salvation 數據:", currentForm.salvation);
      }

      // 更新表單名稱（可選）
      if (mockData.formName) {
        currentForm.formName = mockData.formName;
      }

      // 設置表單狀態為編輯中
      currentForm.state = "editing";

      // 觸發響應式更新
      formArray.value[currentFormIndex.value] = JSON.parse(
        JSON.stringify(currentForm)
      );

      console.log("Mock 數據載入完成，當前表單:", currentForm);

      // 更新當前表單數據
      loadFormToRegistration(formArray.value[currentFormIndex.value]);

      return true;
    } catch (error) {
      console.error("載入 Mock 數據失敗:", error);
      return false;
    }
  };

  const queryRegistrationData = async (queryData) => {
    try {
      if (!mockRegistrations || mockRegistrations.length === 0) {
        console.error("Mock 數據為空或未找到");
        return false;
      }

      console.log("查詢 Mock 數據:", queryData);
      return mockRegistrations;
    } catch (error) {
      console.error("載入 Mock 數據失敗:", error);
      return false;
    }
  };

  return {
    config,
    registrationForm,
    relationshipOptions,
    zodiacOptions,
    formArray,
    currentFormIndex,
    getFormSummaries,
    currentFormSummary,
    currentHouseholdHeadsCount,
    currentAncestorsCount,
    currentSurvivorsCount,
    availableBlessingPersons,
    availableAncestors,
    availableSurvivors,
    actionMessage,
    householdHeadWarning,
    ancestorsWarning,
    survivorsWarning,
    isFormValid,
    validationDetails,
    addBlessingPerson,
    removeBlessingPerson,
    toggleHouseholdHead,
    addAncestor,
    removeAncestor,
    addSurvivor,
    removeSurvivor,
    importSurvivorFromBlessing,
    addContactToBlessing,
    addContactToSurvivors,
    copyBlessingAddress,
    submitRegistration,
    loadConfig,
    addNewForm,
    switchForm,
    deleteForm,
    duplicateForm,
    initializeFormArray, // 🆕 供 Vue 組件調用
    setupFormSync, // 🆕 供外部使用
    loadFormToRegistration, // 🆕 供外部使用
    loadMockData, // 🆕 供外部使用
    queryRegistrationData, // 🆕 供外部使用
  };
});
