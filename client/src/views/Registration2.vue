<!-- src/views/Registration.vue -->
<template>
  <div class="main-content">
    <div class="page-header">
      <h2>消災超度登記表</h2>
    </div>

    <!-- 顯示驗證錯誤訊息（若有） -->
    <div style="display:none;" v-if="validationDetails && validationDetails.messages.length" class="validation-summary">
      <ul>
        <li v-for="(msg, idx) in validationDetails.messages" :key="idx">{{ msg }}</li>
      </ul>
    </div>

    <div class="registration-form">
      <!-- 聯絡人信息 -->
      <div class="form-section">
        <h2>聯絡人信息</h2>
        <div class="form-grid">
          <div class="form-group address-row">
            <label for="contactName">聯絡人姓名<span class="required">*</span></label>
            <input
              type="text"
              id="contactName"
              v-model="registrationForm.contact.name"
              placeholder="請輸入聯絡人姓名"
              required
            >
          </div>

          <div class="form-group address-row">
            <label for="contactMobile">手機號碼<span class="required">*</span></label>
            <input
              type="tel"
              id="contactMobile"
              v-model="registrationForm.contact.mobile"
              placeholder="請輸入手機號碼"
            >
          </div>

          <div class="form-group address-row">
            <label for="contactPhone">家用電話<span class="required">*</span></label>
            <input
              type="tel"
              id="contactPhone"
              v-model="registrationForm.contact.phone"
              placeholder="請輸入家用電話"
              required
            >
          </div>

          <div class="form-group">
            <label>資料表屬性<span class="required">*</span></label>
            <div class="radio-group">
              <label v-for="option in relationshipOptions" :key="option" class="radio-label">
                <input
                  type="radio"
                  :value="option"
                  v-model="registrationForm.contact.relationship"
                >
                <span class="radio-text">{{ option }}</span>
              </label>
              <input
                v-if="registrationForm.contact.relationship === '其它'"
                type="text"
                v-model="registrationForm.contact.otherRelationship"
                placeholder="請輸入其他關係"
                class="other-input"
              >
            </div>
          </div>
        </div>
      </div>

      <!-- 消災區塊 -->
      <BlessingSection
        :blessing-data="registrationForm.blessing"
        :zodiac-options="zodiacOptions"
        :contact-name="registrationForm.contact.name"
        :household-head-warning="householdHeadWarning"
        @update:blessing-data="updateBlessingData"
        @add-person="addBlessingPerson"
        @remove-person="removeBlessingPerson"
        @update-person-field="updateBlessingPersonField"
        @toggle-household-head="toggleHouseholdHead"
        @add-contact-as-person="addContactAsBlessing"
      />

      <!-- 超度區塊 -->
      <SalvationSection
        :salvation-data="registrationForm.salvation"
        :zodiac-options="zodiacOptions"
        :contact-name="registrationForm.contact.name"
        :blessing-address="registrationForm.blessing.address"
        :blessing-persons="availableBlessingPersons"
        :ancestors-warning="ancestorsWarning"
        :survivors-warning="survivorsWarning"
        :current-survivors-count="currentSurvivorsCount"
        :max-survivors="config.maxSurvivors"
        @update:salvation-data="updateSalvationData"
        @add-ancestor="addAncestor"
        @remove-ancestor="removeAncestor"
        @update-ancestor-field="updateAncestorField"
        @add-survivor="addSurvivor"
        @remove-survivor="removeSurvivor"
        @update-survivor-field="updateSurvivorField"
        @import-survivor="importSurvivorFromBlessing"
        @add-contact-as-survivor="addContactAsSurvivor"
        @copy-address="copyBlessingAddress"
      />

      <!-- 提交按鈕 -->
      <div class="form-actions">
        <button type="button" class="btn btn-secondary" @click="resetForm">
          清空表單重新填寫
        </button>
        <button 
          type="button" 
          class="btn btn-primary" 
          @click="submitForm"
          :disabled="submitting"
        >
          {{ submitting ? '提交中...' : '提交報名' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { useRegistrationStore } from '../stores/registration'
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus';
import BlessingSection from '../components/BlessingSection2.vue'
import SalvationSection from '../components/SalvationSection2.vue'

export default {
  name: 'Registration',
  components: {
    BlessingSection,
    SalvationSection
  },
  setup() {
    const registrationStore = useRegistrationStore()
    const submitting = ref(false)

    onMounted(async () => {
      await registrationStore.loadConfig()
    })

    // 處理消災區塊事件
    const updateBlessingData = (newData) => {
      registrationStore.registrationForm.blessing = newData
    }

    const updateBlessingPersonField = (id, field, value) => {
      const index = registrationStore.registrationForm.blessing.persons.findIndex(p => p.id === id)
      if (index !== -1) {
        registrationStore.registrationForm.blessing.persons[index][field] = value
      }
    }

    // 處理超度區塊事件
    const updateSalvationData = (newData) => {
      registrationStore.registrationForm.salvation = newData
    }

    const updateAncestorField = (id, field, value) => {
      const index = registrationStore.registrationForm.salvation.ancestors.findIndex(a => a.id === id)
      if (index !== -1) {
        registrationStore.registrationForm.salvation.ancestors[index][field] = value
      }
    }

    const updateSurvivorField = (id, field, value) => {
      const index = registrationStore.registrationForm.salvation.survivors.findIndex(s => s.id === id)
      if (index !== -1) {
        registrationStore.registrationForm.salvation.survivors[index][field] = value
      }
    }

    const submitForm = async () => {
      const details = registrationStore.validationDetails
      if (details && !details.valid) {
        ElMessage.error(details.messages[0] || '表單驗證失敗')
        return
      }

      submitting.value = true
      try {
        const result = await registrationStore.submitRegistration()
        ElMessage.success(result.message)
      } catch (error) {
        ElMessage.error('提交失敗: ' + error.message)
      } finally {
        submitting.value = false
      }
    }

    return {
      ...registrationStore,
      submitting,
      submitForm,
      updateBlessingData,
      updateSalvationData,
      updateBlessingPersonField,
      updateAncestorField,
      updateSurvivorField
    }
  }
}
</script>

<style scoped>

/* .registration-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  text-align: center;
  margin-bottom: 3rem;
}

.page-header h1 {
  color: var(--primary-color);
  margin-bottom: 0.5rem;
}

.page-header p {
  color: #666;
  font-size: 1.1rem;
} */

.ancestors-section{
  margin-bottom: 20px;
}

.form-section {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.form-section h2 {
  color: var(--primary-color);
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--light-color);
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

input, select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

input:focus, select:focus {
  border-color: var(--primary-color);
  outline: none;
  box-shadow: 0 0 0 2px rgba(139, 69, 19, 0.1);
}

.radio-group {
  display: flex;
  flex-wrap: wrap;
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
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1.5rem;
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

/* 響應式設計 */
@media (max-width: 768px) {
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
}
</style>