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
              class="btn btn-icon btn-danger"
              @click="removeAncestor(ancestor.id)"
            >
              <i class="fa fa-times"></i>
            </button>
          </div>

          <div class="person-form">
            <div class="form-grid compact">
              <div class="form-group">
                <label>姓氏 <span class="required">*</span></label>
                <input
                  type="text"
                  :value="ancestor.surname"
                  @input="updateAncestor(ancestor.id, 'surname', $event.target.value)"
                  placeholder="請輸入姓氏"
                  required
                >
              </div>

              <div class="form-group" style="grid-column: span 2;">
                <label>備註 (如：祖上三代、九玄七祖、先父/母姓名等)</label>
                <input
                  type="text"
                  :value="ancestor.notes"
                  @input="updateAncestor(ancestor.id, 'notes', $event.target.value)"
                  placeholder="備註資訊"
                >
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="survivors-section">
      <div class="section-header">
        <h3>陽上人 (現世子孫)</h3>
        <div class="section-info">
          <button type="button" class="btn btn-outline btn-sm" @click="addSurvivor">
            + 增加陽上人
          </button>
        </div>
      </div>
      
      <div v-if="survivorsWarning" class="warning-message">
        {{ survivorsWarning }}
      </div>

      <div class="survivors-list">
        <div v-for="survivor in salvationData.survivors" :key="survivor.id" class="survivor-item">
          <div class="person-header">
            <h4>陽上人 {{ survivor.id }}</h4>
            <button
              type="button"
              class="btn btn-icon btn-danger"
              @click="removeSurvivor(survivor.id)"
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
                  :value="survivor.name"
                  @input="updateSurvivor(survivor.id, 'name', $event.target.value)"
                  placeholder="請輸入姓名"
                  required
                >
              </div>
              
              <div class="form-group">
                <label>生肖</label>
                <input
                  type="text"
                  :value="survivor.zodiac"
                  @input="updateSurvivor(survivor.id, 'zodiac', $event.target.value)"
                  placeholder="請輸入生肖"
                >
              </div>

              <div class="form-group">
                <label>備註</label>
                <input
                  type="text"
                  :value="survivor.notes"
                  @input="updateSurvivor(survivor.id, 'notes', $event.target.value)"
                  placeholder="備註資訊"
                >
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
  salvationData: {
    type: Object,
    required: true
  },
  blessingAddress: { // 用於「同消災地址」按鈕
    type: String,
    default: ''
  },
  ancestorsWarning: {
    type: String,
    default: ''
  },
  survivorsWarning: {
    type: String,
    default: ''
  }
});

// 確保 emit 能夠發送更新事件
const emit = defineEmits(['update:salvationData']);

// **修正核心：深度複製輔助函數**
const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

// 1. 修正 Address 更新邏輯：發送新的物件
const updateAddress = (newAddress) => {
  const newData = deepClone(props.salvationData);
  newData.address = newAddress;
  emit('update:salvationData', newData);
};

// 2. 修正 複製地址 邏輯：發送新的物件
const copyAddress = () => {
  if (!props.blessingAddress) return;
  const newData = deepClone(props.salvationData);
  newData.address = props.blessingAddress;
  emit('update:salvationData', newData);
};

// 3. 修正 祖先資料更新 邏輯：發送新的物件
const updateAncestor = (ancestorId, key, value) => {
  const newData = deepClone(props.salvationData);
  const ancestor = newData.ancestors.find(a => a.id === ancestorId);
  if (ancestor) {
    ancestor[key] = value;
    emit('update:salvationData', newData);
  }
};

// 4. 修正 移除祖先 邏輯：發送新的物件
const removeAncestor = (ancestorId) => {
  const newData = deepClone(props.salvationData);
  newData.ancestors = newData.ancestors.filter(a => a.id !== ancestorId);
  emit('update:salvationData', newData);
};

// 5. 修正 陽上人資料更新 邏輯：發送新的物件
const updateSurvivor = (survivorId, key, value) => {
  const newData = deepClone(props.salvationData);
  const survivor = newData.survivors.find(s => s.id === survivorId);
  if (survivor) {
    survivor[key] = value;
    emit('update:salvationData', newData);
  }
};

// 6. 修正 移除陽上人 邏輯：發送新的物件
const removeSurvivor = (survivorId) => {
  const newData = deepClone(props.salvationData);
  newData.survivors = newData.survivors.filter(s => s.id !== survivorId);
  emit('update:salvationData', newData);
};

// 7. 修正 增加祖先 邏輯：發送新的物件
const addAncestor = () => {
  const newData = deepClone(props.salvationData);
  const maxId = newData.ancestors.reduce((max, a) => Math.max(max, a.id), 0);
  const newId = maxId + 1;

  const newAncestor = {
    id: newId,
    surname: '',
    notes: '',
  };

  newData.ancestors.push(newAncestor);
  emit('update:salvationData', newData);
};

// 8. 修正 增加陽上人 邏輯：發送新的物件
const addSurvivor = () => {
  const newData = deepClone(props.salvationData);
  const maxId = newData.survivors.reduce((max, s) => Math.max(max, s.id), 0);
  const newId = maxId + 1;

  const newSurvivor = {
    id: newId,
    name: '',
    zodiac: '',
    notes: '',
  };

  newData.survivors.push(newSurvivor);
  emit('update:salvationData', newData);
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