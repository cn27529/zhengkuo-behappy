<!-- src/components/registration/SalvationSection.vue -->
<template>
  <div class="form-section">
    <h2>超度祈福</h2>
    
    <div class="form-group address-row">
      <label for="salvationAddress">地址 <span class="required">*</span></label>
      <input
        type="text"
        id="salvationAddress"
        :value="salvationData.address"
        @input="updateAddress($event.target.value)"
        placeholder="請輸入地址"
        required
      >
      <button
        v-if="blessingAddress && blessingAddress.trim()"
        type="button"
        class="btn btn-outline btn-sm copy-address-btn"
        @click="copyAddress"
      >
        同消災地址
      </button>
    </div>

    <!-- 祖先資料 -->
    <div class="ancestors-section">
      <div class="section-header">
        <h3>歷代祖先</h3>
        <div class="section-info">
          <button type="button" class="btn btn-outline btn-sm" @click="addAncestor">
            + 增加祖先
          </button>
        </div>
      </div>

      <div v-if="ancestorsWarning" class="warning-message">
        {{ ancestorsWarning }}
      </div>

      <div class="ancestors-list">
        <div v-for="ancestor in salvationData.ancestors" :key="ancestor.id" class="ancestor-item">
          <div class="person-header">
            <h4>祖先 {{ ancestor.id }}</h4>
            <button
              type="button"
              class="btn btn-danger btn-sm"
              @click="removeAncestor(ancestor.id)"
              :disabled="salvationData.ancestors.length === 1"
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
                  :value="ancestor.surname"
                  @input="updateAncestorField(ancestor.id, 'surname', $event.target.value)"
                  placeholder="請輸入祖先姓氏"
                >
                <p>氏歷代祖先</p>
              </div>

              <div class="form-group address-row">
                <label>備註</label>
                <input
                  type="text"
                  :value="ancestor.notes"
                  @input="updateAncestorField(ancestor.id, 'notes', $event.target.value)"
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
          <button type="button" class="btn btn-outline btn-sm" @click="addSurvivor">
            + 增加陽上人
          </button>
          <button 
            v-if="contactName && contactName.trim()" 
            type="button" 
            class="btn btn-outline btn-sm" 
            @click="addContactAsSurvivor"
          >
            同聯絡人
          </button>
        </div>
      </div>

      <div v-if="survivorsWarning" class="warning-message">
        {{ survivorsWarning }}
      </div>

      <!-- 從消災人員載入 -->
      <div v-if="blessingPersons && blessingPersons.some(p => p.name && p.name.trim() !== '')" class="import-section">
        <h4>從消災人員載入</h4>
        <div class="import-buttons">
          <button
            v-for="person in blessingPersons"
            :key="person.id"
            type="button"
            class="btn btn-outline btn-sm"
            @click="importSurvivor(person)"
            :disabled="currentSurvivorsCount >= maxSurvivors"
          >
            載入 {{ person.name }}
          </button>
        </div>
      </div>

      <div class="survivors-list">
        <div v-for="survivor in salvationData.survivors" :key="survivor.id" class="survivor-item">
          <div class="person-header">
            <h4>陽上人 {{ survivor.id }}</h4>
            <button
              type="button"
              class="btn btn-danger btn-sm"
              @click="removeSurvivor(survivor.id)"
              :disabled="salvationData.survivors.length === 1"
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
                  :value="survivor.name"
                  @input="updateSurvivorField(survivor.id, 'name', $event.target.value)"
                  placeholder="請輸入姓名"
                >
              </div>

              <div class="form-group address-row">
                <label>生肖</label>
                <select :value="survivor.zodiac" @change="updateSurvivorField(survivor.id, 'zodiac', $event.target.value)">
                  <option value="">請選擇生肖</option>
                  <option v-for="zodiac in zodiacOptions" :key="zodiac" :value="zodiac">
                    {{ zodiac }}
                  </option>
                </select>
              </div>

              <div class="form-group address-row">
                <label>備註</label>
                <input
                  type="text"
                  :value="survivor.notes"
                  @input="updateSurvivorField(survivor.id, 'notes', $event.target.value)"
                  placeholder="備註信息"
                >
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SalvationSection',
  props: {
    salvationData: {
      type: Object,
      required: true
    },
    zodiacOptions: {
      type: Array,
      default: () => []
    },
    contactName: {
      type: String,
      default: ''
    },
    blessingAddress: {
      type: String,
      default: ''
    },
    blessingPersons: {
      type: Array,
      default: () => []
    },
    ancestorsWarning: {
      type: String,
      default: ''
    },
    survivorsWarning: {
      type: String,
      default: ''
    },
    currentSurvivorsCount: {
      type: Number,
      default: 0
    },
    maxSurvivors: {
      type: Number,
      default: 2
    }
  },
  emits: [
    'update:salvation-data',
    'add-ancestor',
    'remove-ancestor',
    'update-ancestor-field',
    'add-survivor',
    'remove-survivor',
    'update-survivor-field',
    'import-survivor',
    'add-contact-as-survivor',
    'copy-address'
  ],
  methods: {
    updateAddress(address) {
      this.$emit('update:salvation-data', {
        ...this.salvationData,
        address
      })
    },

    addAncestor() {
      this.$emit('add-ancestor')
    },
    
    removeAncestor(id) {
      this.$emit('remove-ancestor', id)
    },
    
    updateAncestorField(id, field, value) {
      this.$emit('update-ancestor-field', id, field, value)
    },
    
    addSurvivor() {
      this.$emit('add-survivor')
    },
    
    removeSurvivor(id) {
      this.$emit('remove-survivor', id)
    },
    
    updateSurvivorField(id, field, value) {
      this.$emit('update-survivor-field', id, field, value)
    },
    
    importSurvivor(person) {
      this.$emit('import-survivor', person)
    },
    
    addContactAsSurvivor() {
      this.$emit('add-contact-as-survivor')
    },
    
    copyAddress() {
      this.$emit('copy-address')
    }
  }
}
</script>

<style scoped>
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

.ancestors-section {
  margin-bottom: 20px;
}

.copy-address-btn {
  margin-left: 8px;
  align-self: center;
  height: 36px;
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

/* 其他共用樣式與 BlessingSection 相同 */
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

.address-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.address-row label {
  width: 120px;
  margin-bottom: 0;
}

.address-row input,
.address-row select {
  flex: 1;
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

.warning-message {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  color: #856404;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1rem;
}

.ancestors-list,
.survivors-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

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

.person-form {
  width: 100%;
}

.form-grid.compact {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.8rem;
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
</style>