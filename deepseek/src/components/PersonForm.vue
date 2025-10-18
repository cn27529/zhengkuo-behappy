<!-- src/components/registration/PersonForm.vue -->
<template>
  <div class="person-form">
    <div class="form-grid compact">
      <div class="form-group address-row">
        <label>姓名</label>
        <input
          type="text"
          :value="person.name"
          @input="updateField('name', $event.target.value)"
          placeholder="請輸入姓名"
        >
      </div>

      <div class="form-group address-row">
        <label>生肖</label>
        <select :value="person.zodiac" @change="updateField('zodiac', $event.target.value)">
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
          @input="updateField('notes', $event.target.value)"
          placeholder="備註信息"
        >
      </div>

      <div v-if="showHouseholdHead" class="form-group">
        <label class="checkbox-label">
          <input
            type="checkbox"
            :checked="person.isHouseholdHead"
            @change="$emit('toggle-household-head', person.id)"
          >
          <span>設為戶長</span>
        </label>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PersonForm',
  props: {
    person: {
      type: Object,
      required: true
    },
    zodiacOptions: {
      type: Array,
      default: () => []
    },
    showHouseholdHead: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:person', 'toggle-household-head'],
  methods: {
    updateField(field, value) {
      this.$emit('update:person', {
        ...this.person,
        [field]: value
      })
    }
  }
}
</script>

<style scoped>
/* 樣式保持不變 */
.person-form {
  width: 100%;
}

.form-grid.compact {
  display: grid;
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

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.checkbox-label input {
  width: auto;
  margin-right: 0.5rem;
}
</style>