<!-- src/views/Registration.vue -->
<template>
    
  <div class="main-content">
    <div class="page-header">
      <h2>消災超度登記表</h2>
      <p>請填寫以下信息完成活動報名</p>
    </div>

    <div class="registration-form">
      <!-- 聯絡人信息 -->
      <div class="form-section">
        <h2>聯絡人信息</h2>
        <div class="form-grid">

          <div class="form-group">
            <label for="contactName">聯絡人姓名 <span class="required">*</span></label>
            <input
              type="text"
              id="contactName"
              v-model="registrationForm.contact.name"
              placeholder="請輸入聯絡人姓名"
              required
            >
          </div>

          <div class="form-group">
            <label for="contactPhone">家用電話 <span class="required">*</span></label>
            <input
              type="tel"
              id="contactPhone"
              v-model="registrationForm.contact.phone"
              placeholder="請輸入家用電話"
              required
            >
          </div>

          <div class="form-group">
            <label for="contactMobile">手機號碼</label>
            <input
              type="tel"
              id="contactMobile"
              v-model="registrationForm.contact.mobile"
              placeholder="請輸入手機號碼"
            >
          </div>

          <div class="form-group">
            <label>資料表屬性 <span class="required">*</span></label>
            <div class="radio-group">
              <label v-for="option in relationshipOptions" :key="option" class="radio-label">
                <input
                  type="radio"
                  :value="option"
                  v-model="registrationForm.contact.relationship"
                >
                <span class="radio-text">{{ option }}</span>
              </label>
              
            </div>
            
            <input
              v-if="registrationForm.contact.relationship === '其它'"
              type="text"
              v-model="registrationForm.contact.otherRelationship"
              placeholder="請輸入其他關係"
              class="other-input"
            >
          </div>
          <div class="form-group">
            
          </div>
        </div>
      </div>

      <!-- 消災區塊 -->
      <div class="form-section">
        <h2>消災祈福</h2>
        
        <div class="form-group">
          <label for="blessingAddress">地址 <span class="required">*</span></label>
          <input
            type="text"
            id="blessingAddress"
            v-model="registrationForm.blessing.address"
            placeholder="請輸入地址"
            required
          >
        </div>

        <div class="persons-section">
          <div class="section-header">
            <h3>消災人員名單</h3>
            <div class="section-info">
              <span class="count-badge">已填寫: {{ availableBlessingPersons.length }} 位</span>
              <span class="count-badge">戶長: {{ currentHouseholdHeadsCount }}/{{ config.maxHouseholdHeads }} 位</span>
              <button type="button" class="btn btn-outline btn-sm" @click="addBlessingPerson">
                + 增加人員
              </button>
            </div>
          </div>

          <div v-if="householdHeadWarning" class="warning-message">
            {{ householdHeadWarning }}
          </div>

          <div class="persons-list">
            <div v-for="person in registrationForm.blessing.persons" :key="person.id" class="person-item">
              <div class="person-header">
                <h4>人員 {{ person.id }}</h4>
                <button
                  type="button"
                  class="btn btn-danger btn-sm"
                  @click="removeBlessingPerson(person.id)"
                  :disabled="registrationForm.blessing.persons.length === 1"
                >
                  刪除
                </button>
              </div>
              
              <div class="person-form">
                <div class="form-grid compact">
                  <div class="form-group">
                    <label>姓名</label>
                    <input
                      type="text"
                      v-model="person.name"
                      placeholder="請輸入姓名"
                    >
                  </div>

                  <div class="form-group">
                    <label>生肖</label>
                    <select v-model="person.zodiac">
                      <option value="">請選擇生肖</option>
                      <option v-for="zodiac in zodiacOptions" :key="zodiac" :value="zodiac">
                        {{ zodiac }}
                      </option>
                    </select>
                  </div>

                  <div class="form-group">
                    <label>備註</label>
                    <input
                      type="text"
                      v-model="person.notes"
                      placeholder="備註信息"
                    >
                  </div>

                  <div class="form-group">
                    <label class="checkbox-label">
                      <input
                        type="checkbox"
                        v-model="person.isHouseholdHead"
                        @change="toggleHouseholdHead(person.id)"
                        :disabled="!person.isHouseholdHead && currentHouseholdHeadsCount >= config.maxHouseholdHeads"
                      >
                      <span>設為戶長</span>
                    </label>
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
        
        <div class="form-group">
          <label for="salvationAddress">地址 <span class="required">*</span></label>
          <input
            type="text"
            id="salvationAddress"
            v-model="registrationForm.salvation.address"
            placeholder="請輸入地址"
            required
          >
        </div>

        <!-- 祖先資料 -->
        <div class="ancestors-section">
          <div class="section-header">
            <h3>歷代祖先</h3>
            <div class="section-info">
              <span class="count-badge">已填寫: {{ currentAncestorsCount }}/{{ config.maxAncestors }} 位</span>
              <button type="button" class="btn btn-outline btn-sm" @click="addAncestor">
                + 增加祖先
              </button>
            </div>
          </div>

          <div v-if="ancestorsWarning" class="warning-message">
            {{ ancestorsWarning }}
          </div>

          <div class="ancestors-list">
            <div v-for="ancestor in registrationForm.salvation.ancestors" :key="ancestor.id" class="ancestor-item">
              <div class="person-header">
                <h4>祖先 {{ ancestor.id }}</h4>
                <button
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
                  <div class="form-group">
                    <label>姓氏</label>
                    <input
                      type="text"
                      v-model="ancestor.surname"
                      placeholder="請輸入祖先姓氏"
                    >
                  </div>

                  <div class="form-group">
                    <label>備註</label>
                    <input
                      type="text"
                      v-model="ancestor.notes"
                      placeholder="備註信息"
                    >
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
              <span class="count-badge">已填寫: {{ currentSurvivorsCount }}/{{ config.maxSurvivors }} 位</span>
              <button type="button" class="btn btn-outline btn-sm" @click="addSurvivor">
                + 增加陽上人
              </button>
            </div>
          </div>

          <div v-if="survivorsWarning" class="warning-message">
            {{ survivorsWarning }}
          </div>

          <!-- 從消災人員導入 -->
          <div v-if="availableBlessingPersons.length > 0" class="import-section">
            <h4>從消災人員導入</h4>
            <div class="import-buttons">
              <button
                v-for="person in availableBlessingPersons"
                :key="person.id"
                type="button"
                class="btn btn-outline btn-sm"
                @click="importSurvivorFromBlessing(person)"
                :disabled="currentSurvivorsCount >= config.maxSurvivors"
              >
                導入 {{ person.name }}
              </button>
            </div>
          </div>

          <div class="survivors-list">
            <div v-for="survivor in registrationForm.salvation.survivors" :key="survivor.id" class="survivor-item">
              <div class="person-header">
                <h4>陽上人 {{ survivor.id }}</h4>
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
                  <div class="form-group">
                    <label>姓名</label>
                    <input
                      type="text"
                      v-model="survivor.name"
                      placeholder="請輸入姓名"
                    >
                  </div>

                  <div class="form-group">
                    <label>生肖</label>
                    <select v-model="survivor.zodiac">
                      <option value="">請選擇生肖</option>
                      <option v-for="zodiac in zodiacOptions" :key="zodiac" :value="zodiac">
                        {{ zodiac }}
                      </option>
                    </select>
                  </div>

                  <div class="form-group">
                    <label>備註</label>
                    <input
                      type="text"
                      v-model="survivor.notes"
                      placeholder="備註信息"
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 提交按鈕 -->
      <div class="form-actions">
        <button type="button" class="btn btn-secondary" @click="resetForm">
          重置表單
        </button>
        <button 
          type="button" 
          class="btn btn-primary" 
          @click="submitForm"
          :disabled="!isFormValid || submitting"
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

export default {
  name: 'Registration',
  setup() {
    const registrationStore = useRegistrationStore()
    const submitting = ref(false)

    onMounted(async () => {
      await registrationStore.loadConfig()
    })

    const submitForm = async () => {
      submitting.value = true
      try {
        const result = await registrationStore.submitRegistration()
        alert(result.message)
        registrationStore.resetForm()
      } catch (error) {
        alert('提交失敗: ' + error.message)
      } finally {
        submitting.value = false
      }
    }

    return {
      ...registrationStore,
      submitting,
      submitForm
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