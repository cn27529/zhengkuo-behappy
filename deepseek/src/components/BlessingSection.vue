<!-- src/components/registration/BlessingSection.vue -->
<template>
  <div class="form-section">
    <h2>消災祈福</h2>
    
    <div class="form-group address-row">
      <label for="blessingAddress">地址 <span class="required">*</span></label>
      <input
        type="text"
        id="blessingAddress"
        :value="blessingData.address"
        @input="updateAddress($event.target.value)"
        placeholder="請輸入地址"
        required
      >
    </div>

    <div class="persons-section">
      <div class="section-header">
        <h3>消災人員名單</h3>
        <div class="section-info">
          <div style="display:flex; gap:8px; align-items:center;">
            <button type="button" class="btn btn-outline btn-sm" @click="addPerson">
              + 增加消災人員
            </button>
            <button 
              v-if="contactName && contactName.trim()" 
              type="button" 
              class="btn btn-outline btn-sm" 
              @click="addContactAsPerson"
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
        <div v-for="person in blessingData.persons" :key="person.id" class="person-item">
          <div class="person-header">
            <h4>人員 {{ person.id }}</h4>
            <button
              type="button"
              class="btn btn-danger btn-sm"
              @click="removePerson(person.id)"
              :disabled="blessingData.persons.length === 1"
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
                  :value="person.name"
                  @input="updatePersonField(person.id, 'name', $event.target.value)"
                  placeholder="請輸入姓名"
                >
              </div>

              <div class="form-group address-row">
                <label>生肖</label>
                <select :value="person.zodiac" @change="updatePersonField(person.id, 'zodiac', $event.target.value)">
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
                  :value="person.notes"
                  @input="updatePersonField(person.id, 'notes', $event.target.value)"
                  placeholder="備註信息"
                >
              </div>

              <div class="form-group">
                <label class="checkbox-label">
                  <input
                    type="checkbox"
                    :checked="person.isHouseholdHead"
                    @change="toggleHouseholdHead(person.id)"
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
</template>

<script>
export default {
  name: 'BlessingSection',
  props: {
    blessingData: {
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
    householdHeadWarning: {
      type: String,
      default: ''
    }
  },
  emits: [
    'update:blessing-data',
    'add-person',
    'remove-person',
    'update-person-field',
    'toggle-household-head',
    'add-contact-as-person'
  ],
  methods: {
    updateAddress(address) {
      this.$emit('update:blessing-data', {
        ...this.blessingData,
        address
      })
    },

    
    addPerson() {
      this.$emit('add-person')
    },
    
    removePerson(id) {
      this.$emit('remove-person', id)
    },
    
    updatePersonField(id, field, value) {
      this.$emit('update-person-field', id, field, value)
    },
    
    toggleHouseholdHead(id) {
      this.$emit('toggle-household-head', id)
    },
    
    addContactAsPerson() {
      this.$emit('add-contact-as-person')
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

.persons-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.person-item {
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

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.checkbox-label input {
  width: auto;
  margin-right: 0.5rem;
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