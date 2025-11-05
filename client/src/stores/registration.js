// src/stores/registration.js
// 本檔為報名表單的 Pinia store，管理整個消災超度登記表的狀態與操作。
// 註解會說明每個變數與方法在 Registration.vue 中的用途與對應位置。
import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useRegistrationStore = defineStore("registration", () => {
  // 支援多張表單的陣列
  const formArray = ref([]);
  // 當前編輯的表單索引
  const currentFormIndex = ref(0);

  // addNewForm：安全的新增表單方法
  const addNewForm = () => {
    try {
      console.log("🚀 開始新增表單...");

      //當前表單標記為已保存
      registrationForm.value.state = "saved";

      // 🎯 關鍵：先確保當前表單已保存到陣列
      if (formArray.value.length === 0) {
        // 第一次新增，保存初始表單
        formArray.value.push(
          JSON.parse(JSON.stringify(registrationForm.value))
        );
      } else {
        // 保存當前編輯的表單
        formArray.value[currentFormIndex.value] = JSON.parse(
          JSON.stringify(registrationForm.value)
        );
      }

      // 建立新表單
      const newForm = getInitialFormData();
      formArray.value.push(newForm);

      // 切換到新表單
      currentFormIndex.value = formArray.value.length - 1;

      // 🎯 關鍵：安全地載入新表單數據到當前響應式物件
      const loadFormToRegistration = (formData) => {
        // 重置當前表單
        const initialData = getInitialFormData();

        // 1. 載入頂層屬性
        Object.keys(formData).forEach((key) => {
          if (key !== "contact" && key !== "blessing" && key !== "salvation") {
            registrationForm.value[key] = formData[key];
          }
        });

        // 2. 載入 contact
        Object.keys(formData.contact).forEach((key) => {
          registrationForm.value.contact[key] = formData.contact[key];
        });

        // 3. 載入 blessing
        registrationForm.value.blessing.address = formData.blessing.address;
        registrationForm.value.blessing.persons.length = 0;
        formData.blessing.persons.forEach((person) => {
          registrationForm.value.blessing.persons.push({ ...person });
        });

        // 4. 載入 salvation
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

      // 載入新表單
      loadFormToRegistration(newForm);

      console.log("✅ 新增表單完成，當前索引:", currentFormIndex.value);
      return currentFormIndex.value;
    } catch (error) {
      console.error("❌ 新增表單失敗:", error);
      return -1;
    }
  };

  // switchForm：安全的表單切換方法
  const switchForm = (index) => {
    try {
      if (index < 0 || index >= formArray.value.length) {
        console.error("❌ 切換表單索引無效:", index);
        return false;
      }

      console.log("🔄 切換表單從", currentFormIndex.value, "到", index);

      // 🎯 關鍵：先保存當前表單
      if (formArray.value.length > 0) {
        formArray.value[currentFormIndex.value] = JSON.parse(
          JSON.stringify(registrationForm.value)
        );
      }

      // 載入目標表單
      const targetForm = formArray.value[index];

      // 使用相同的載入邏輯
      const loadFormToRegistration = (formData) => {
        // 重置當前表單
        const initialData = getInitialFormData();

        // 載入所有屬性...
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

      loadFormToRegistration(targetForm);
      currentFormIndex.value = index;

      // 如果表單已提交，不更新狀態
      if(registrationForm.value.state !== "submitted") {
// 更新狀態
      registrationForm.value.state = "editing";
      }
      
      registrationForm.value.lastModified = new Date().toISOString();

      console.log("傳入的索引:", index);
      console.log("表單切換完成，當前表單索引:", currentFormIndex.value);

      return currentFormIndex.value;
    } catch (error) {
      console.error("❌ 表單切換失敗:", error);
      return -1;
    }
  };

  // 刪除表單
  const deleteForm = (index) => {
    if (formArray.value.length <= 1) return false; // 至少保留一張

    formArray.value.splice(index, 1);
    if (currentFormIndex.value >= index) {
      currentFormIndex.value = Math.max(0, currentFormIndex.value - 1);
    }
    const resultIndex = switchForm(currentFormIndex.value);
  };

  // 複製表單
  const duplicateForm = (index) => {
    const duplicated = JSON.parse(JSON.stringify(formArray.value[index]));
    duplicated.createDate = new Date().toISOString();
    duplicated.formName = `${duplicated.formName} - 複本`;

    formArray.value.push(duplicated);
    const resultIndex = switchForm(formArray.value.length - 1);
  };

  // 獲取多筆表單摘要
  const getFormSummaries = computed(() => {
    if (currentFormIndex.value === 0 && formArray.value.length === 0) {
      return [];
    }
    return formArray.value.map((form, index) => ({
      index,
      formName: form.formName || `表單 ${index + 1}`,
      status: form.state,
      createDate: form.createDate,
      lastModified: form.lastModified,
      contactName: form.contact.name,
      personsCount: form.blessing.persons.filter((p) => p.name.trim()).length,
      ancestorsCount: form.salvation.ancestors.filter((a) => a.surname.trim())
        .length,
    }));
  });

  // 當前表單摘要
  const currentFormSummary = computed(
    () => getFormSummaries.value[currentFormIndex.value]
  );

  // 獲取初始表單資料（深拷貝）
  const getInitialFormData = () => {
    return JSON.parse(
      JSON.stringify({
        state: "creating", // saved, creating, editing, completed, submitted
        createDate: new Date().toISOString(),
        lastModified: null,
        formName: "", // 2025消災超度報名表
        formSource: "", // 來源說明，例如「來自哪個活動」
        contact: {
          name: "",
          phone: "",
          mobile: "",
          relationship: "本家", // 本家、娘家、朋友、其它（對應畫面上的 radio）
          otherRelationship: "",
        },
        blessing: {
          // 消災地址
          address: "",
          // 消災人員
          persons: [
            {
              id: 1,
              name: "",
              zodiac: "",
              notes: "",
              isHouseholdHead: true, // 是否為戶長，畫面用 checkbox 控制
            },
          ],
        },
        salvation: {
          // 超度地址
          address: "",
          // 祖先清單
          ancestors: [
            {
              id: 1,
              surname: "",
              notes: "",
            },
          ],
          // 陽上人清單
          survivors: [
            {
              id: 1,
              name: "",
              zodiac: "",
              notes: "",
            },
          ],
        },
      })
    );
  };

  // config：全域配置，決定表單的限制值（例如最大戶長數、最大祖先數等）。
  // 在 Registration.vue 中會用到 config.maxHouseholdHeads、config.maxAncestors、config.maxSurvivors
  // 來顯示上限或決定按鈕是否 disabled。
  const config = ref({
    maxHouseholdHeads: 1, // 最大戶長數
    maxAncestors: 1, // 最大祖先數
    maxSurvivors: 2, // 最大陽上人數
    defaultSurvivors: 2, // 預設陽上人數（用於初始化）
  });

  // registrationForm：整個表單的核心資料結構，對應 Registration.vue 裡各輸入欄位的 v-model。
  // - contact: 聯絡人資訊（name, phone, mobile, relationship, otherRelationship）
  // - blessing: 消災區塊（address, persons[]）
  // - salvation: 超度區塊（address, ancestors[], survivors[]）
  // 在畫面上會直接使用 registrationForm.contact.name、registrationForm.blessing.address 等。
  const registrationForm = ref(getInitialFormData());

  // UI 選項資料（對應 Registration.vue 的下拉/選項）
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

  // --- computed getters ---
  // currentHouseholdHeadsCount：計算目前被標記為戶長的人數（用於限制戶長數量）
  const currentHouseholdHeadsCount = computed(() => {
    return registrationForm.value.blessing.persons.filter(
      (person) => person.isHouseholdHead
    ).length;
  });

  // currentAncestorsCount：目前祖先條目數，用於顯示與限制
  const currentAncestorsCount = computed(() => {
    return registrationForm.value.salvation.ancestors.length;
  });

  // currentSurvivorsCount：目前陽上人數，用於顯示與限制
  const currentSurvivorsCount = computed(() => {
    return registrationForm.value.salvation.survivors.length;
  });

  // availableBlessingPersons：過濾出已填寫姓名的消災人員，畫面可用這個來 "從消災人員載入" 陽上人
  const availableBlessingPersons = computed(() => {
    return registrationForm.value.blessing.persons.filter((person) => {
      const name = (person.name || "").toString().trim();
      return name !== "";
    });
  });

  // availableAncestors：過濾出已填寫姓氏的祖先，供驗證使用（只有有填寫祖先時才要求超度地址）
  const availableAncestors = computed(() => {
    return registrationForm.value.salvation.ancestors.filter((a) => {
      const s = (a.surname || "").toString().trim();
      return s !== "";
    });
  });

  // availableSurvivors：過濾出已填寫姓名的陽上人，供驗證使用
  const availableSurvivors = computed(() => {
    return registrationForm.value.salvation.survivors.filter((s) => {
      const name = (s.name || "").toString().trim();
      return name !== "";
    });
  });

  // actionMessage：store 內部提供的單一訊息物件，供 UI 讀取並顯示
  const actionMessage = ref({ type: null, text: "" });
  const setActionMessage = (type, text) => {
    actionMessage.value = { type, text };
    return actionMessage.value;
  };

  // 提示訊息 computed：如果超出限制或缺少必要戶長，回傳警告字串，供畫面顯示
  const householdHeadWarning = computed(() => {
    const count = currentHouseholdHeadsCount.value;
    const max = config.value.maxHouseholdHeads; // 最大戶長數
    const filledCount = availableBlessingPersons.value.length; // 已填姓名的人數
    if (count > max) {
      return `戶長數量超過限制 (${count}/${max})`;
    } else if (filledCount > 0 && count === 0) {
      // 只有當至少有一筆已填寫的消災人員時，才提示需指定戶長
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

  // validationDetails：回傳完整的驗證結果物件，包含每個欄位的狀態與錯誤訊息
  // 這樣 Registration.vue 可以顯示更細的錯誤內容，例如提示哪個欄位未通過驗證
  const validationDetails = computed(() => {
    const details = {
      valid: true,
      errors: {},
      messages: [],
    };

    // 戶長相關檢查
    const hhCount = currentHouseholdHeadsCount.value;
    if (hhCount > config.value.maxHouseholdHeads) {
      details.valid = false;
      details.errors.householdHead = `戶長數量超過限制 (${hhCount}/${config.value.maxHouseholdHeads})`;
      details.messages.push(details.errors.householdHead);
    } else if (availableBlessingPersons.value.length > 0 && hhCount === 0) {
      // 只有當有已填寫的消災人員時，才要求至少指定一位戶長
      details.valid = false;
      details.errors.householdHead = "請至少指定一位戶長";
      details.messages.push(details.errors.householdHead);
    } else {
      details.errors.householdHead = null;
    }

    // 祖先檢查
    const ancCount = currentAncestorsCount.value;
    if (ancCount > config.value.maxAncestors) {
      details.valid = false;
      details.errors.ancestors = `祖先數量超過限制 (${ancCount}/${config.value.maxAncestors})`;
      details.messages.push(details.errors.ancestors);
    } else {
      details.errors.ancestors = null;
    }

    // 陽上人檢查
    const svCount = currentSurvivorsCount.value;
    if (svCount > config.value.maxSurvivors) {
      details.valid = false;
      details.errors.survivors = `陽上人數量超過限制 (${svCount}/${config.value.maxSurvivors})`;
      details.messages.push(details.errors.survivors);
    } else {
      details.errors.survivors = null;
    }

    // 聯絡人姓名
    if (!registrationForm.value.contact.name.trim()) {
      details.valid = false;
      details.errors.contactName = "聯絡人姓名為必填";
      details.messages.push(details.errors.contactName);
    } else {
      details.errors.contactName = null;
    }

    // 電話或手機至少一個
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

    // 當 relationship 選擇為 '其它' 時，otherRelationship 必填
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

    // 消災地址
    const blessingAddrFilled =
      registrationForm.value.blessing.address &&
      registrationForm.value.blessing.address.trim();
    const filledBlessingPersons = availableBlessingPersons.value.length;

    // 若已填寫至少一筆消災人員，則消災地址為必填
    if (filledBlessingPersons > 0 && !blessingAddrFilled) {
      details.valid = false;
      details.errors.blessingAddress = "已填寫消災人員，消災地址為必填";
      details.messages.push(details.errors.blessingAddress);
    } else {
      details.errors.blessingAddress = null;
    }

    // 當消災地址有填寫時，至少要有一筆已填寫的消災人員（保留對稱檢查）
    if (blessingAddrFilled && filledBlessingPersons === 0) {
      details.valid = false;
      details.errors.blessingPersons = "消災地址已填寫，請至少填寫一筆消災人員";
      details.messages.push(details.errors.blessingPersons);
    } else {
      details.errors.blessingPersons = null;
    }

    // 檢查消災人員是否有未填寫必要欄位（姓名）
    const allBlessingPersons = registrationForm.value.blessing.persons || [];
    // 只有當清單中有 2 筆或以上時，才提示未填空白條目（避免預設一筆造成誤報）
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
    } else {
      details.errors.blessingPersonIncomplete = null;
    }

    // 檢查祖先名單是否有未填寫必要欄位（姓氏）
    const allAncestors = registrationForm.value.salvation.ancestors || [];
    // 只有當祖先清單多於或等於 2 筆時才檢查
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

    // 檢查陽上人名單是否有未填寫必要欄位（姓名）
    const allSurvivors = registrationForm.value.salvation.survivors || [];
    // 只有當陽上人清單多於或等於 2 筆時才檢查
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

    // 超度地址驗證：若已填寫祖先或陽上人，超度地址必填；若超度地址有填時，要求至少有祖先，且有祖先時需有陽上人
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
      // 超度地址已填情況：必須至少填寫一筆祖先
      if (filledAncestorsCount === 0) {
        details.valid = false;
        details.errors.salvationAddress =
          "超度地址已填寫，請至少填寫一筆歷代祖先";
        details.messages.push(details.errors.salvationAddress);
      } else if (filledSurvivorsCount === 0) {
        // 有祖先但沒有陽上人
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

    // 新規則：若有已填寫的祖先，但沒有任何已填寫的陽上人，視為不完整
    if (filledAncestorsCount > 0 && filledSurvivorsCount === 0) {
      details.valid = false;
      details.errors.survivorsRequiredForAncestors =
        "已填寫祖先，請至少填寫一位陽上人";
      details.messages.push(details.errors.survivorsRequiredForAncestors);
    } else {
      details.errors.survivorsRequiredForAncestors = null;
    }

    // 新增檢查：消災人員或祖先必須至少有一項被填寫，避免兩邊都為空
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

  // isFormValid：維持布林值，但改由 validationDetails 計算，便於向下相容
  const isFormValid = computed(() => validationDetails.value.valid);

  // --- Actions: 消災區塊相關操作 ---
  // addBlessingPerson：新增一個消災人員條目（對應畫面上的 + 增加人員）
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

  // removeBlessingPerson：刪除消災人員（畫面有刪除按鈕），保護至少保留一筆
  const removeBlessingPerson = (id) => {
    const index = registrationForm.value.blessing.persons.findIndex(
      (p) => p.id === id
    );
    if (index !== -1) {
      registrationForm.value.blessing.persons.splice(index, 1);
    }
  };

  // toggleHouseholdHead：切換某人是否為戶長，並檢查不超過限制
  // 當畫面上 checkbox 變動時會呼叫此函式
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

  // --- Actions: 超度區塊相關操作 ---
  // addAncestor / removeAncestor：管理祖先清單（畫面上的 + 增加祖先 / 刪除）
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

  // addSurvivor / removeSurvivor：管理陽上人名單
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

  // importSurvivorFromBlessing：將已填寫的消災人員匯入為陽上人（畫面上有載入按鈕）
  // 會檢查目前陽上人數是否已達上限，並避免重複匯入
  const importSurvivorFromBlessing = (person) => {
    const name = (person.name || "").trim();
    if (!name) {
      setActionMessage("warning", "此人資料無效，無法匯入");
      return { status: "invalid", message: "此人資料無效，無法匯入" };
    }
    // if (currentSurvivorsCount.value >= config.value.maxSurvivors) {
    //   setActionMessage("warning", "陽上人名單已達上限");
    //   return { status: "max", message: "陽上人名單已達上限" };
    // }
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

  // 將聯絡人加入消災人員（避免重複）
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

  // 將聯絡人加入陽上人（避免重複，並檢查上限）
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

  // 複製消災地址到超度地址（回傳 boolean，供 UI 顯示訊息）
  const copyBlessingAddress = () => {
    const src = (registrationForm.value.blessing.address || "").trim();
    if (src) {
      registrationForm.value.salvation.address = src;
      return true;
    }
    return false;
  };

  // 提交表單（此處為模擬，實際可呼叫 API）
  // 在 Registration.vue 中 submitForm 會呼叫此方法並顯示結果
  const submitRegistration = async () => {
    if (!isFormValid.value) {
      throw new Error("表單驗證失敗，請檢查所有必填欄位");
    }

    try {

      registrationForm.value.state = "submitted"; // 更新狀態為已提交
      registrationForm.value.lastModified = new Date().toISOString(); // 更新最後修改時間

      

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

  // resetForm：重置整個表單為初始狀態（畫面上的重置按鈕呼叫）使用響應式安全的重置方法
  const resetForm = () => {
    try {
      console.log("開始重置表單...");

      const initialData = getInitialFormData();

      // 方法：逐個屬性重置，保持響應性
      // 1. 重置頂層屬性
      registrationForm.value.state = initialData.status;
      registrationForm.value.createDate = initialData.createDate;
      registrationForm.value.lastModified = initialData.lastModified;
      registrationForm.value.formName = initialData.formName;
      registrationForm.value.formSource = initialData.formSource;

      // 2. 重置 contact 物件
      registrationForm.value.contact.name = initialData.contact.name;
      registrationForm.value.contact.phone = initialData.contact.phone;
      registrationForm.value.contact.mobile = initialData.contact.mobile;
      registrationForm.value.contact.relationship =
        initialData.contact.relationship;
      registrationForm.value.contact.otherRelationship =
        initialData.contact.otherRelationship;

      // 3. 重置 blessing 物件
      registrationForm.value.blessing.address = initialData.blessing.address;
      // 重置 persons 陣列 - 重要：重新賦值整個陣列
      registrationForm.value.blessing.persons =
        initialData.blessing.persons.map((person) => ({
          ...person,
        }));

      // 4. 重置 salvation 物件
      registrationForm.value.salvation.address = initialData.salvation.address;
      registrationForm.value.salvation.ancestors =
        initialData.salvation.ancestors.map((ancestor) => ({
          ...ancestor,
        }));
      registrationForm.value.salvation.survivors =
        initialData.salvation.survivors.map((survivor) => ({
          ...survivor,
        }));

      // 5. 重置表單陣列
      formArray.value = [{ ...initialData }];
      currentFormIndex.value = 0;

      console.log("表單重置完成", registrationForm.value);
      return true;
    } catch (error) {
      console.error("重置表單失敗:", error);
      return false;
    }
  };

  // loadConfig：模擬從遠端加載配置，未來可改成真正的 API 請求
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
    formArray, // 必須導出
    currentFormIndex, // 必須導出
    getFormSummaries, // 必須導出
    currentFormSummary, // 必須導出

    // Getter
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

    // Actions
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
    resetForm,
    addNewForm,
    switchForm,
    deleteForm,
  };
});
