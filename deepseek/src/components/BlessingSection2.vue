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
              class="btn btn-icon btn-danger"
              @click="removePerson(person.id)"
            >
              <i class="fa fa-times"></i>
            </button>
          </div>

          <div class="person-form">
            <div class="form-grid compact">
              <div class="form-group">
                <label>姓名 <span class="required">*</span></label>
                <input
                  type="text"
                  :value="person.name"
                  @input="updatePerson(person.id, 'name', $event.target.value)"
                  placeholder="請輸入姓名"
                  required
                >
              </div>
              
              <div class="form-group">
                <label>生肖</label>
                <input
                  type="text"
                  :value="person.zodiac"
                  @input="updatePerson(person.id, 'zodiac', $event.target.value)"
                  placeholder="請輸入生肖"
                >
              </div>

              <div class="form-group">
                <label>備註</label>
                <input
                  type="text"
                  :value="person.notes"
                  @input="updatePerson(person.id, 'notes', $event.target.value)"
                  placeholder="備註資訊"
                >
              </div>
              
              <div class="form-group">
                <label class="checkbox-label">
                  <input 
                    type="checkbox" 
                    :checked="person.isHouseholdHead" 
                    @change="updatePerson(person.id, 'isHouseholdHead', $event.target.checked)"
                  >
                  設為戶長 (僅一位)
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  blessingData: {
    type: Object,
    required: true
  },
  contactName: {
    type: String,
    default: ''
  },
  householdHeadWarning: {
    type: String,
    default: ''
  }
});

// 確保 emit 能夠發送更新事件
const emit = defineEmits(['update:blessingData']);

// **修正核心：深度複製輔助函數**
const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

// 1. 修正 Address 更新邏輯：發送新的物件
const updateAddress = (newAddress) => {
  const newData = deepClone(props.blessingData);
  newData.address = newAddress;
  emit('update:blessingData', newData);
};

// 2. 修正 Person 資料更新邏輯：發送新的物件
const updatePerson = (personId, key, value) => {
  const newData = deepClone(props.blessingData);
  const person = newData.persons.find(p => p.id === personId);
  if (person) {
    person[key] = value;
    
    // **處理戶長切換邏輯**：確保同一時間只有一個戶長 (在子組件中處理並發送更新)
    if (key === 'isHouseholdHead' && value) {
      newData.persons.forEach(p => {
        if (p.id !== personId) {
          p.isHouseholdHead = false;
        }
      });
    }

    emit('update:blessingData', newData); // 發送新的物件
  }
};

// 3. 修正 移除人員 邏輯：發送新的物件
const removePerson = (personId) => {
  const newData = deepClone(props.blessingData);
  newData.persons = newData.persons.filter(p => p.id !== personId);
  emit('update:blessingData', newData);
};

// 4. 修正 增加人員 邏輯：發送新的物件
const addPerson = () => {
  const newData = deepClone(props.blessingData);
  // 假設一個簡易的 ID 生成器：取現有最大 ID + 1
  const maxId = newData.persons.reduce((max, p) => Math.max(max, p.id), 0);
  const newId = maxId + 1;

  const newPerson = {
    id: newId,
    name: '',
    zodiac: '',
    isHouseholdHead: false,
    notes: ''
  };

  newData.persons.push(newPerson);
  emit('update:blessingData', newData);
};

// 5. 修正 同聯絡人 邏輯：發送新的物件
const addContactAsPerson = () => {
  if (!props.contactName) return;

  const newData = deepClone(props.blessingData);
  const maxId = newData.persons.reduce((max, p) => Math.max(max, p.id), 0);
  const newId = maxId + 1;

  const newPerson = {
    id: newId,
    name: props.contactName,
    zodiac: '',
    isHouseholdHead: false,
    notes: '同聯絡人'
  };

  // 避免重複添加
  const alreadyAdded = newData.persons.some(p => p.name === props.contactName && p.notes === '同聯絡人');
  if (alreadyAdded) {
    alert('聯絡人資訊已添加！');
    return;
  }

  newData.persons.push(newPerson);
  emit('update:blessingData', newData);
};
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