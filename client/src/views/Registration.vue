<!-- src/views/Registration.vue -->
<template>
  <div class="main-content">
    <div class="page-header">
      <h2>{{ pageTitle }}</h2>
    </div>
    <!-- 返回按鈕 -->
    <div class="print-controls" v-if="isEditMode">
      <div class="controls-left">
        <button @click="handleBack" class="back-btn">← 返回列表</button>
      </div>
    </div>

    <!-- 在 .form-header div 內新增表單切換區塊 -->
    <div class="form-header">
      <!-- 在 template 添加調試信息 -->
      <div
        v-if="isDev"
        style="
          background: #000000;
          color: #fff000;
          padding: 10px;
          margin-top: 20px;
          font-size: 12px;
        "
      >
        <!-- 添加 Mock 按钮 -->
        <div style="margin: 0 auto">
          <button
            @click="loadMockData"
            class="btn btn-outline btn-sm"
            style="
              margin-right: 10px;
              color: #fff000;
              border: #fff000 1px solid;
            "
          >
            🎲 載入 Mock 數據
          </button>
          <h4>調試信息: {{ isDev }}</h4>
          <p>
            表單陣列長度: {{ formArray.length }}, 當前索引:
            {{ currentFormIndex }}
          </p>
          <p>
            <span v-for="(form, idx) in formArray" :key="idx">
              <hr />
              第{{ idx + 1 }}張表單 [state={{ form.state }}, formId={{
                form.formId
              }}, formSource={{ form.formSource }}, id={{ form.id }}, contact={{
                JSON.stringify(form.contact)
              }}, blessing={{ JSON.stringify(form.blessing) }}]
            </span>
          </p>
        </div>
      </div>
      <!-- 表單切換器 -->
      <div class="form-switcher" v-if="formArray && formArray.length > 1">
        <div class="form-tabs">
          <div
            v-for="(form, index) in formArray"
            :key="index"
            class="form-tab"
            :class="{ active: currentFormIndex === index }"
            @click="handleSwitchForm(index)"
          >
            <span class="tab-number">表單{{ index + 1 }}</span>
            <span style="display: " class="tab-status" :class="form.state">{{
              getStatusText(form.state)
            }}</span>
            <button
              v-if="formArray.length > 1"
              class="tab-close"
              @click.stop="handleDeleteForm(index)"
              title="刪除此表單"
            >
              ×
            </button>
          </div>
        </div>

        <!-- 當前表單資訊 -->
        <div
          class="current-form-info"
          v-if="currentFormSummary"
          style="display: none"
        >
          <span>聯絡人: {{ currentFormSummary.contactName || "未填寫" }}</span>
          <span>消災人員: {{ currentFormSummary.personsCount }} 位</span>
          <span>祖先: {{ currentFormSummary.ancestorsCount }} 位</span>
          <span>狀態: {{ getStatusText(currentFormSummary.state) }}</span>
        </div>
      </div>
    </div>

    <!-- 顯示驗證錯誤訊息（若有） -->
    <div
      style="display: none"
      v-if="validationDetails && validationDetails.messages.length"
      class="validation-summary"
    >
      <ul>
        <li v-for="(msg, idx) in validationDetails.messages" :key="idx">
          {{ msg }}
        </li>
      </ul>
    </div>

    <div class="form-content">
      <!-- 聯絡人信息 -->
      <div class="form-section">
        <h2>聯絡人信息</h2>
        <div class="form-grid">
          <div class="form-group address-row">
            <label for="contactName"
              >聯絡人姓名<span class="required">*</span></label
            >
            <input
              type="text"
              id="contactName"
              v-model="registrationForm.contact.name"
              placeholder="請輸入聯絡人姓名"
              required
            />
          </div>

          <div class="form-group address-row">
            <label for="contactMobile"
              >手機號碼<span class="required">*</span></label
            >
            <input
              type="tel"
              id="contactMobile"
              v-model="registrationForm.contact.mobile"
              placeholder="請輸入手機號碼"
            />
          </div>

          <div class="form-group address-row">
            <label for="contactPhone"
              >家用電話<span class="required">*</span></label
            >
            <input
              type="tel"
              id="contactPhone"
              v-model="registrationForm.contact.phone"
              placeholder="請輸入家用電話"
              required
            />
          </div>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label>資料表屬性<span class="required">*</span></label>
            <div class="radio-group">
              <label
                v-for="option in relationshipOptions"
                :key="option"
                class="radio-label"
              >
                <input
                  type="radio"
                  :value="option"
                  v-model="registrationForm.contact.relationship"
                />
                <span class="radio-text">{{ option }}</span>
              </label>

              <input
                v-if="registrationForm.contact.relationship === '其它'"
                type="text"
                v-model="registrationForm.contact.otherRelationship"
                placeholder="請輸入其他關係"
                class="other-input"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 消災區塊 -->
      <div class="form-section">
        <h2>消災祈福</h2>

        <div class="form-group address-row">
          <label for="blessingAddress"
            >地址 <span class="required">*</span></label
          >
          <input
            type="text"
            id="blessingAddress"
            v-model="registrationForm.blessing.address"
            placeholder="請輸入地址"
            required
          />
        </div>

        <div class="persons-section">
          <div class="section-header">
            <h3>消災人員名單</h3>
            <div class="section-info">
              <span style="display: none" class="count-badge"
                >已填寫: {{ availableBlessingPersons.length }} 位</span
              >
              <span style="display: none" class="count-badge"
                >戶長: {{ currentHouseholdHeadsCount }}/{{
                  formConfig.maxHouseholdHeads
                }}
                位</span
              >
              <div style="display: flex; gap: 8px; align-items: center">
                <button
                  type="button"
                  class="btn btn-outline btn-sm"
                  @click="addBlessingPerson"
                >
                  ＋增加消災人員
                </button>
                <button
                  v-if="
                    registrationForm.contact.name &&
                    registrationForm.contact.name.trim()
                  "
                  type="button"
                  class="btn btn-outline btn-sm"
                  @click="addContactAsBlessing"
                >
                  同聯絡人
                </button>
              </div>
            </div>
          </div>

          <div v-if="householdHeadWarning" class="warning-message">
            {{ householdHeadWarning }}
          </div>

          <div class="persons-list">
            <div
              v-for="person in registrationForm.blessing.persons"
              :key="person.id"
              class="person-item"
            >
              <div class="person-header">
                <h4 style="display: none">人員 {{ person.id }}</h4>
                <button
                  type="button"
                  class="btn btn-danger btn-sm"
                  @click="removeBlessingPerson(person.id)"
                  :disabled="registrationForm.blessing.persons.length === 1"
                >
                  刪除
                </button>
                <label class="checkbox-label">
                  <input type="checkbox" v-model="person.isHouseholdHead" />
                  <span>設為戶長</span>
                </label>
              </div>

              <div class="person-form">
                <div class="form-grid compact">
                  <div class="form-group address-row">
                    <label>姓名</label>
                    <input
                      type="text"
                      v-model="person.name"
                      placeholder="請輸入姓名"
                    />
                  </div>

                  <div class="form-group address-row">
                    <label>生肖</label>
                    <select v-model="person.zodiac">
                      <option value="">請選擇生肖</option>
                      <option
                        v-for="zodiac in zodiacOptions"
                        :key="zodiac"
                        :value="zodiac"
                      >
                        {{ zodiac }}
                      </option>
                    </select>
                  </div>

                  <div class="form-group address-row">
                    <label>備註</label>
                    <input
                      type="text"
                      v-model="person.notes"
                      placeholder="備註信息"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 超度區塊 -->
      <div class="form-section">
        <h2>超度祈福</h2>
        <div class="form-group address-row">
          <label for="salvationAddress"
            >地址 <span class="required">*</span></label
          >
          <input
            type="text"
            id="salvationAddress"
            v-model="registrationForm.salvation.address"
            placeholder="請輸入地址"
            required
          />
        </div>

        <!-- 祖先資料 -->
        <div class="ancestors-section">
          <div class="section-header">
            <h3>歷代祖先</h3>
            <div class="section-info">
              <span style="display: none" class="count-badge"
                >已填寫: {{ currentAncestorsCount }}/{{
                  formConfig.maxAncestors
                }}
                位</span
              >
              <button
                style="display: none"
                type="button"
                class="btn btn-outline btn-sm"
                @click="addAncestor"
              >
                ＋增加祖先
              </button>

              <button
                v-if="
                  registrationForm.blessing.address &&
                  registrationForm.blessing.address.trim()
                "
                type="button"
                class="btn btn-outline btn-sm copy-address-btn"
                @click="copyBlessingAddress"
              >
                同消災地址
              </button>
            </div>
          </div>

          <div v-if="ancestorsWarning" class="warning-message">
            {{ ancestorsWarning }}
          </div>

          <div class="ancestors-list">
            <div
              v-for="ancestor in registrationForm.salvation.ancestors"
              :key="ancestor.id"
              class="ancestor-item"
            >
              <div class="person-header">
                <h4 style="display: none">祖先 {{ ancestor.id }}</h4>
                <button
                  style="display: none"
                  type="button"
                  class="btn btn-danger btn-sm"
                  @click="removeAncestor(ancestor.id)"
                  :disabled="registrationForm.salvation.ancestors.length === 1"
                >
                  刪除
                </button>
              </div>

              <div class="person-form">
                <div class="form-grid compact">
                  <div class="form-group address-row">
                    <label>祖先</label>
                    <input
                      type="text"
                      v-model="ancestor.surname"
                      placeholder="請輸入祖先姓氏"
                    />
                    <p class="ancestor">氏歷代祖先</p>
                  </div>

                  <div class="form-group address-row">
                    <label>備註</label>
                    <input
                      type="text"
                      v-model="ancestor.notes"
                      placeholder="備註信息"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 陽上人資料 -->
        <div class="survivors-section">
          <div class="section-header">
            <h3>陽上人</h3>
            <div class="section-info">
              <span style="display: none" class="count-badge"
                >已填寫: {{ currentSurvivorsCount }}/{{
                  formConfig.maxSurvivors
                }}
                位</span
              >
              <div style="display: flex; gap: 8px; align-items: center">
                <button
                  type="button"
                  class="btn btn-outline btn-sm"
                  @click="addSurvivor"
                >
                  ＋增加陽上人
                </button>
                <button
                  v-if="
                    registrationForm.contact.name &&
                    registrationForm.contact.name.trim()
                  "
                  type="button"
                  class="btn btn-outline btn-sm"
                  @click="addContactAsSurvivor"
                >
                  同聯絡人
                </button>
              </div>
            </div>
          </div>

          <div v-if="survivorsWarning" class="warning-message">
            {{ survivorsWarning }}
          </div>

          <!-- 從消災人員載入 -->
          <div
            v-if="
              registrationForm.blessing.persons &&
              registrationForm.blessing.persons.some(
                (p) => p.name && p.name.trim() !== ''
              )
            "
            class="import-section"
          >
            <h4>從消災人員載入</h4>
            <div class="import-buttons">
              <button
                v-for="person in registrationForm.blessing.persons"
                :key="person.id"
                type="button"
                class="btn btn-outline btn-sm"
                @click="importFromBlessing(person)"
                :disabled="
                  availableSurvivors &&
                  availableSurvivors.length >= formConfig.maxSurvivors
                "
              >
                {{ person.name }}
              </button>
            </div>
          </div>

          <div class="survivors-list">
            <div
              v-for="survivor in registrationForm.salvation.survivors"
              :key="survivor.id"
              class="survivor-item"
            >
              <div class="person-header">
                <h4 style="display: none">陽上人 {{ survivor.id }}</h4>
                <button
                  type="button"
                  class="btn btn-danger btn-sm"
                  @click="removeSurvivor(survivor.id)"
                  :disabled="registrationForm.salvation.survivors.length === 1"
                >
                  刪除
                </button>
              </div>

              <div class="person-form">
                <div class="form-grid compact">
                  <div class="form-group address-row">
                    <label>姓名</label>
                    <input
                      type="text"
                      v-model="survivor.name"
                      placeholder="請輸入姓名"
                    />
                  </div>

                  <div style="display: none" class="form-group address-row">
                    <label>生肖</label>
                    <select v-model="survivor.zodiac">
                      <option value="">請選擇生肖</option>
                      <option
                        v-for="zodiac in zodiacOptions"
                        :key="zodiac"
                        :value="zodiac"
                      >
                        {{ zodiac }}
                      </option>
                    </select>
                  </div>

                  <div class="form-group address-row">
                    <label>備註</label>
                    <input
                      type="text"
                      v-model="survivor.notes"
                      placeholder="備註信息"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 修正後的提交按鈕區塊 -->
      <div class="form-actions">
        <!-- 编辑模式：显示保存按钮 -->
        <button
          v-if="isEditMode"
          type="button"
          class="btn btn-outline"
          @click="handleBack"
        >
          返回列表
        </button>
        <button
          v-if="isEditMode"
          type="button"
          class="btn btn-primary"
          @click="handleUpdateForm"
          :disabled="submitting"
        >
          {{ submitting ? "保存中..." : "保存修改" }}
        </button>

        <button
          v-if="isCreateMode"
          type="button"
          class="btn btn-primary"
          @click="submitForm"
          :disabled="submitting"
        >
          {{ submitting ? "提交中..." : "提交報名" }}
        </button>

        <button
          v-if="isCreateMode"
          type="button"
          class="btn btn-outline capsule-btn"
          @click="handleAddNewForm"
        >
          📄 再填一張🆕
        </button>

        <button
          type="button"
          class="btn btn-outline capsule-btn"
          @click="handlePrintPage"
        >
          🖨️ 列印表單
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { useRegistrationStore } from "../stores/registrationStore.js";
import { ref, onMounted, computed, nextTick } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { authService } from "../services/authService";
import { useConfigStore } from "../stores/configStore.js";
import { useRouter, useRoute } from "vue-router";

export default {
  name: "Registration",
  setup() {
    const configStore = useConfigStore();
    const registrationStore = useRegistrationStore();
    const submitting = ref(false);
    const isDev = ref(false);
    const router = useRouter();
    const route = useRoute();

    // 新增：模式判断
    const pageTitle = ref("消災超度登記");
    const isCreateMode = computed(() =>
      route.query.action || "create" === "create" ? true : false
    );

    const isEditMode = computed(() =>
      route.query.action || "edit" === "edit" ? true : false
    );
    const actionMode = computed(() => route.query.action);
    const formId = computed(() => route.query.formId);
    const id = computed(() => route.query.id);
    const actionResult = ref({});
    // 新增：模式判断
    const handleActionResult = () => {
      if (isEditMode.value && formId.value && id.value) {
        // 编辑模式
        pageTitle.value = "編輯表單";
      } else if (isCreateMode.value) {
        pageTitle.value = "消災超度登記";
      }

      const result = {
        editMode: isEditMode.value,
        createMode: isCreateMode.value,
        formId: formId.value,
        id: id.value,
        pageTitle: pageTitle.value,
      };
      console.log("路由參數調試信息:", result);
      return result;
    };

    onMounted(async () => {
      await registrationStore.loadConfig();

      actionResult.value = handleActionResult();
      if (actionResult.value.editMode || actionResult.value.viewMode) {
        await registrationStore.loadFormData(
          formId.value,
          id.value,
          actionMode.value
        );
      }
      if (actionResult.value.createMode) {
        // 啟動自動同步機制
        //registrationStore.initializeFormArray();
        registrationStore.resetRegistrationForm();

        console.log("[v0] 表單同步已啟動 - 創建模式");
      }

      isDev.value = authService.getCurrentDev();
    });

    // 載入測試 Mock 數據，進行快速測試
    const loadMockData = async () => {
      try {
        const success = await registrationStore.loadMockData();
        if (success) {
          ElMessage.success("Mock 數據載入成功");
        } else {
          ElMessage.error("載入 Mock 數據失敗");
        }
      } catch (error) {
        console.error("載入 Mock 數據錯誤:", error);
        ElMessage.error("載入 Mock 數據時發生錯誤");
      }
    };

    // 🎯 關鍵：添加計算屬性來獲取正確的 currentFormIndex
    const currentFormIndex = computed(() => registrationStore.currentFormIndex);
    const formArray = computed(() => registrationStore.formArray);
    const currentFormSummary = computed(
      () => registrationStore.currentFormSummary
    );
    const formSummaries = computed(() => registrationStore.getFormSummaries);

    // 新增：表單切換處理
    const handleSwitchForm = async (index) => {
      console.log("🔍 切換表單調試信息:");
      console.log("🔄 使用者觸發表單切換至索引:", index);
      console.log("當前索引 (store):", registrationStore.currentFormIndex);
      console.log("當前索引 (computed):", currentFormIndex.value);

      if (index === currentFormIndex.value) {
        console.log("已經是當前表單，不處理");
        //return;
      }

      const resultIndex = registrationStore.switchForm(index);
      if (resultIndex >= 0) {
        await nextTick(); // 等待 DOM 更新
        ElMessage.success(`已切換到第 ${index + 1} 張表單`);
      } else {
        ElMessage.error("切換表單失敗");
      }
    };

    // 新增：刪除表單處理
    const handleDeleteForm = (index) => {
      console.log("🔍 刪除表單調試信息:");
      console.log("傳入的索引:", index);
      console.log("當前表單陣列:", formArray.value);
      console.log("當前表單索引:", currentFormIndex.value);

      if (registrationStore.formArray.length <= 1) {
        ElMessage.warning("至少需要保留一張表單");
        return;
      }

      if (
        registrationStore.formArray.length >= 2 &&
        index === currentFormIndex.value
      ) {
        ElMessage.warning("編輯中的檔案己經鎖定，請先切換其它表單再做刪除！");
        return;
      }

      const formToDelete = registrationStore.formArray[index];

      ElMessageBox.confirm(
        `確定要刪除「第${index + 1}張表單」嗎？此操作無法復原！`,
        "確認刪除",
        {
          confirmButtonText: "確定刪除",
          cancelButtonText: "取消",
          type: "warning",
        }
      )
        .then(() => {
          console.log("執行刪除，索引:", index);
          registrationStore.deleteForm(index);
          ElMessage.success("表單已刪除");

          // 添加刪除後的調試
          setTimeout(() => {
            console.log("刪除後的表單陣列:", formArray.value);
            console.log("刪除後的當前索引:", currentFormIndex.value);
          }, 100);
        })
        .catch(() => {
          ElMessage.info("已取消刪除操作");
        });
    };

    // 新增：狀態文字轉換
    // const getStatusText = (state) => {
    //   const statusMap = {
    //     creating: "建立中",
    //     editing: "編輯中",
    //     saved: "已儲存",
    //     submitted: "已提交",
    //   };
    //   return statusMap[state] || state;
    // };

    // 狀態圖標（Emoji版）轉換
    const getStatusText = (state) => {
      const statusMap = {
        creating: "🛠️", // 建立中
        editing: "✍🏽", // 編輯中
        saved: "💾", // 已儲存
        submitted: "✔︎", // 已提交
      };
      return statusMap[state] || "❓";
    };

    // 新增：複製表單處理
    const handleDuplicateForm = (index) => {
      registrationStore.duplicateForm(index);
      ElMessage.success("表單已複製");
    };

    // 新增表單處理
    const handleAddNewForm = () => {
      const details = registrationStore.validationDetails;
      if (details && !details.valid) {
        ElMessage.error(details.messages[0] || "表單驗證失敗，無法新增表單");
        return;
      }

      const newFormIndex = registrationStore.addNewForm();
      if (newFormIndex !== -1) {
        ElMessage.success(`已新增第 ${newFormIndex + 1} 張表單`);
      } else {
        ElMessage.error("新增表單失敗");
      }
    };

    const handleBack = () => {
      // 返回上一頁或指定頁面
      router.back();
      // 或者使用 router.push('/registration') 導航到特定頁面
    };

    // 更新表单
    const handleUpdateForm = async () => {
      console.log("更新表單調試信息:");
      console.log("當前表單陣列:", formArray.value);
      console.log("當前表單索引:", currentFormIndex.value);

      const details = registrationStore.validationDetails;
      if (details && !details.valid) {
        ElMessage.error(details.messages[0] || "表單驗證失敗");
        return;
      }

      submitting.value = true;
      try {
        const result = await registrationStore.updateFormData();
        if (result.success) {
          ElMessage.success(result.message);
          // 更新成功后返回列表
          setTimeout(() => {
            goBack();
          }, 1500);
        } else {
          ElMessage.error(result.message);
        }
      } catch (error) {
        ElMessage.error("更新失敗: " + error.message);
      } finally {
        submitting.value = false;
      }
    };

    // 提交表單處理
    const submitForm = async () => {
      // 先檢查 validationDetails
      const details = registrationStore.validationDetails;
      if (details && !details.valid) {
        // 顯示第一則錯誤為訊息，並同時在畫面上列出所有錯誤
        ElMessage.error(details.messages[0] || "表單驗證失敗");
        return;
      }

      submitting.value = true;

      try {
        const result = await registrationStore.submitRegistration();

        console.log("提交結果調試信息:", JSON.stringify(result));

        if (result.success) {
          ElMessage.success(result.message);
        } else {
          ElMessage.error(result.message);
        }

        console.log(result);
      } catch (error) {
        ElMessage.error("提交失敗: " + error.message);
      } finally {
        submitting.value = false;
      }
    };

    // wrapper: 將聯絡人加入消災人員（呼叫 store）
    const addContactAsBlessing = () => {
      const res = registrationStore.addContactToBlessing();
      if (res && res.status) {
        if (res.status === "ok") {
          ElMessage.success(res.message);
        } else if (
          res.status === "invalid" ||
          res.status === "warning" ||
          res.status === "duplicate" ||
          res.status === "max"
        ) {
          ElMessage.warning(res.message);
        }
      }
      return res;
    };

    // wrapper: 將聯絡人加入陽上人（呼叫 store）
    const addContactAsSurvivor = () => {
      const res = registrationStore.addContactToSurvivors();
      if (res && res.status) {
        if (res.status === "ok") {
          ElMessage.success(res.message);
        } else if (
          res.status === "invalid" ||
          res.status === "warning" ||
          res.status === "duplicate" ||
          res.status === "max"
        ) {
          ElMessage.warning(res.message);
        }
      }
      return res;
    };

    // wrapper: 從消災人員載入陽上人（呼叫 store）
    const importFromBlessing = (person) => {
      const res = registrationStore.importSurvivorFromBlessing(person);
      if (res && res.status) {
        if (res.status === "ok") {
          ElMessage.success(res.message);
        } else if (
          res.status === "invalid" ||
          res.status === "warning" ||
          res.status === "duplicate" ||
          res.status === "max"
        ) {
          ElMessage.warning(res.message);
        }
      }
      return res;
    };

    const handlePrintPage = () => {
      const details = registrationStore.validationDetails;
      if (details && !details.valid) {
        // 顯示第一則錯誤為訊息，並同時在畫面上列出所有錯誤
        ElMessage.error(details.messages[0] || "表單驗證失敗");
        return;
      }

      try {
        const printData = JSON.stringify(registrationStore.registrationForm);
        const formId = registrationStore.registrationForm.formId;

        if (formId === null || formId === undefined || formId === "") {
          ElMessage.error("表單尚未提交，無法列印");
          return;
        }

        console.log("準備列印數據:", { formId, printData });
        ElMessage.info(`準備列印表單: ${formId}`);

        // 生成唯一列印 ID
        //const printId = `print_form_${formId}`;
        const printId = `print_form_${formId}_${Math.floor(
          Math.random() * 1000
        )}`;
        console.log("列印表單 ID:", printId);

        // 儲存到 sessionStorage
        sessionStorage.setItem(printId, printData);
        console.log("儲存列印數據:", {
          printId,
          data: JSON.parse(printData),
        });

        // 開啟列印頁面
        const printUrl = `${window.location.origin}/print-registration?print_id=${printId}&print_data=${printData}`;
        console.log("開啟列印頁面:", printUrl);
        //window.open( printUrl, "_blank",  "noopener,noreferrer"); // 安全性最佳實踐

        // 使用 router.push 導航到列印頁面
        router.push({
          path: "/print-registration",
          query: {
            print_id: printId,
            print_data: printData,
          },
        });
      } catch (error) {
        console.error("導航到列印頁面失敗:", error);
        ElMessage.error("導航到列印頁面失敗");
      }
    };

    // 修改後：
    return {
      // 本地變數、方法、計算屬性
      submitForm,
      addContactAsBlessing,
      addContactAsSurvivor,
      importFromBlessing,
      handlePrintPage,
      handleAddNewForm,
      handleSwitchForm,
      handleDeleteForm,
      handleDuplicateForm,
      handleBack,
      handleUpdateForm,
      getStatusText,
      loadMockData, // 載入測試 Mock 數據，進行快速測試

      // 計算屬性
      currentFormIndex,
      submitting,
      formArray,
      currentFormSummary,
      formSummaries,
      isDev,
      pageTitle,
      isEditMode,
      isCreateMode,
      actionMode,
      formId,
      id,
      actionResult,

      // store 中只暴露需要的屬性和方法，不要使用展開運算符
      registrationForm: registrationStore.registrationForm,
      formConfig: configStore.formConfig,
      currentFormIndex: registrationStore.currentFormIndex,
      formArray: registrationStore.formArray,
      currentFormSummary: registrationStore.currentFormSummary,
      formSummaries: registrationStore.formSummaries,
      validationDetails: registrationStore.validationDetails,
      // store 中方法
      addBlessingPerson: registrationStore.addBlessingPerson,
      removeBlessingPerson: registrationStore.removeBlessingPerson,
      addAncestor: registrationStore.addAncestor,
      removeAncestor: registrationStore.removeAncestor,
      addSurvivor: registrationStore.addSurvivor,
      removeSurvivor: registrationStore.removeSurvivor,
      copyBlessingAddress: registrationStore.copyBlessingAddress,

      // store 中其他計算屬性...
      availableBlessingPersons: registrationStore.availableBlessingPersons,
      currentHouseholdHeadsCount: registrationStore.currentHouseholdHeadsCount,
      householdHeadWarning: registrationStore.householdHeadWarning,
      currentAncestorsCount: registrationStore.currentAncestorsCount,
      ancestorsWarning: registrationStore.ancestorsWarning,
      currentSurvivorsCount: registrationStore.currentSurvivorsCount,
      survivorsWarning: registrationStore.survivorsWarning,
      availableSurvivors: registrationStore.availableSurvivors,
      relationshipOptions: configStore.relationshipOptions,
      zodiacOptions: configStore.zodiacOptions,
    };
  },
};
</script>

<style scoped>
.print-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  /* 
  padding: 15px;
  background: #f5f5f5; */
  border-radius: 5px;
  gap: 10px;
}

.controls-left {
  display: flex;
  align-items: center;
}

.controls-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.back-btn {
  padding: 10px 20px;
  border: 1px solid #ddd;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  background: white;
  color: #333;
}

.back-btn:hover {
  background: #f0f0f0;
}

.ancestors-section {
  margin-bottom: 20px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.form-grid.compact {
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.required {
  color: #e74c3c;
}

input,
select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

input:focus,
select:focus {
  border-color: var(--primary-color);
  outline: none;
  box-shadow: 0 0 0 2px rgba(139, 69, 19, 0.1);
}

.radio-group {
  display: flex;
  gap: 1rem;
}

.radio-label {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.radio-text {
  margin-left: 0.5rem;
}

.other-input {
  margin-top: 0.5rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.section-header h3 {
  color: #333;
  margin: 0;
}

.section-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.count-badge {
  background: var(--light-color);
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  color: var(--primary-color);
  font-weight: 500;
}

.warning-message {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  color: #856404;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1rem;
}

.persons-list,
.ancestors-list,
.survivors-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.person-item,
.ancestor-item,
.survivor-item {
  border: 0px solid #e9ecef;
  border-radius: 8px;
  padding: 1rem;
  background: #f8f9fa;
}

.person-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.person-header h4 {
  margin: 0;
  color: #333;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  text-decoration: none;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.8rem;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--secondary-color);
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

.btn-outline {
  background: transparent;
  border: 1px solid var(--primary-color);
  color: var(--primary-color);
}

.btn-outline:hover:not(:disabled) {
  background: var(--primary-color);
  color: white;
}

.btn-outline:disabled {
  border-color: #ccc;
  color: #ccc;
  cursor: not-allowed;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
}

.btn-danger:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.import-section {
  background: #e7f3ff;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1.5rem;
}

.import-section h4 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.import-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.checkbox-label input {
  width: auto;
  margin-right: 0.5rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e9ecef;
}

.address-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.address-row label {
  flex: 0 0 100px;
  margin: 0;
}

.address-row input {
  flex: 1;
}

.form-group.address-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.form-group.address-row label {
  width: 120px;
  margin-bottom: 0; /* 取消 label 的底部間距，讓其與 input 水平對齊 */
}

.form-group.address-row input {
  flex: 1;
}

.copy-address-btn {
  margin-left: 8px;
  align-self: center;
  height: 36px;
}

/* 表單切換器樣式 */
.form-switcher {
  background: #f8f9fa;
  border: 0px solid #e9ecef;
  border-radius: 8px;
  padding: 0rem;
  margin-bottom: 0rem;
}

.form-tabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.form-tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid #ddd;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s;
}

.form-tab:hover {
  border-color: var(--primary-color);
}

.form-tab.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.tab-number {
  font-weight: bold;
}

.tab-name {
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tab-status {
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  border-radius: 50px;
  background: #e9ecef;
}

.tab-status.creating {
  background: #fff3cd;
  color: #856404;
}
.tab-status.editing {
  background: #d1ecf1;
  color: #0c5460;
}
.tab-status.saved {
  background: #d4edda;
  color: #155724;
}
.tab-status.submitted {
  background: #d1ecf1;
  color: #0c5460;
}

.tab-close {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 1.2rem;
  line-height: 1;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tab-close:hover {
  color: #dc3545;
}

.form-tab-add {
  background: transparent;
  border: 1px dashed #ddd;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  color: #666;
  transition: all 0.3s;
}

.form-tab-add:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.current-form-info {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
  font-size: 0.875rem;
  color: #666;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .print-controls {
    /* flex-direction: column;
    gap: 10px; */
  }

  .controls-left,
  .controls-right {
    /* width: 100%; */
    justify-content: center;
  }

  .print-tips {
    text-align: center;
    order: -1;
  }

  .registration-container {
    padding: 1rem;
  }

  .form-section {
    padding: 1.5rem;
  }
  .form-grid {
    grid-template-columns: 1fr;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .section-info {
    width: 100%;
    justify-content: space-between;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }

  .tab-number {
    min-width: 50px;
    font-size: 0.8rem;
    padding: 3px 8px;
  }

  .tab-name {
    max-width: 80px;
    font-size: 0.8rem;
    padding: 3px 12px;
  }

  /* 手機版取消樣式*/
  .address-row label {
    margin: 0;
  }
  /* 手機版取消樣式*/
  .form-group.address-row label {
    margin-bottom: 0;
  }
  .ancestor {
    display: none;
  }

  .radio-group {
    display: flex;
    flex-wrap: wrap; /*手機版就換行*/
    gap: 1rem;
  }
}
</style>
