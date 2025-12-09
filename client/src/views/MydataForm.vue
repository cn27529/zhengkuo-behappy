<template>
  <div class="mydata-form">
    <h3>{{ isEdit ? "編輯" : "新增" }} Mydata</h3>

    <form @submit.prevent="submitForm">
      <div class="form-group">
        <label>表單名稱 *</label>
        <input
          v-model="formData.formName"
          required
          placeholder="輸入表單名稱"
        />
      </div>

      <div class="form-group">
        <label>狀態</label>
        <select v-model="formData.state">
          <option value="draft">草稿</option>
          <option value="active">啟用</option>
          <option value="inactive">停用</option>
        </select>
      </div>

      <div class="contact-section">
        <h4>聯絡資訊</h4>

        <div class="form-group">
          <label>姓名</label>
          <input v-model="formData.contact.name" placeholder="聯絡人姓名" />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>電話</label>
            <input v-model="formData.contact.phone" placeholder="市話" />
          </div>
          <div class="form-group">
            <label>手機</label>
            <input v-model="formData.contact.mobile" placeholder="手機號碼" />
          </div>
        </div>

        <div class="form-group">
          <label>關係</label>
          <select v-model="formData.contact.relationship">
            <option value="">請選擇</option>
            <option value="家人">家人</option>
            <option value="朋友">朋友</option>
            <option value="同事">同事</option>
            <option value="其他">其他</option>
          </select>
        </div>

        <div v-if="formData.contact.relationship === '其他'" class="form-group">
          <label>其他關係</label>
          <input
            v-model="formData.contact.otherRelationship"
            placeholder="請說明關係"
          />
        </div>
      </div>

      <div class="form-actions">
        <button type="submit" :disabled="submitting">
          {{ submitting ? "提交中..." : isEdit ? "更新" : "創建" }}
        </button>
        <button type="button" @click="$router.back()">取消</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { mydataService } from "../services/mydataService.js";

const formData = {
  formName: "",
  state: "draft",
  contact: {
    name: "",
    phone: "",
    mobile: "",
    relationship: "",
    otherRelationship: "",
  },
};

const submitting = false;

const isEdit = computed(() => !!id);

const loadMydata = () => {
  mydataService
    .getMydataById(id)
    .then((result) => {
      if (result.success) {
        formData.value = { ...result.data };
      } else {
        alert("載入數據失敗");
        router.back();
      }
    })
    .catch((error) => {
      alert("載入時發生錯誤");
      console.error(error);
    })
    .finally(() => {
      submitting.value = false;
    });
};

const submitForm = () => {
  submitting.value = true;

  mydataService
    .createMydata(formData.value)
    .then((result) => {
      if (result.success) {
        alert("提交成功");
        router.back();
      } else {
        alert("提交失敗");
      }
    })
    .catch((error) => {
      alert("提交時發生錯誤");
      console.error(error);
    })
    .finally(() => {
      submitting.value = false;
    });
};

mounted(() => {
  if (isEdit.value) {
    loadMydata();
  }
});
</script>

<style scoped>
.mydata-form {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.form-row .form-group {
  flex: 1;
}

.contact-section {
  border-top: 1px solid #eee;
  padding-top: 1rem;
  margin-top: 1rem;
}

.form-actions {
  margin-top: 2rem;
  text-align: center;
}

.form-actions button {
  margin: 0 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.form-actions button[type="submit"] {
  background-color: #007bff;
  color: white;
}

.form-actions button[type="button"] {
  background-color: #6c757d;
  color: white;
}
</style>
