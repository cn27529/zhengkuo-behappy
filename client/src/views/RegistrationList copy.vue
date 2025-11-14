<template>
  <div>
    <!-- 顯示數據 -->
    <div v-if="loading">載入中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else>
      <h3>報名表列表 ({{ registrationList.length }} 筆)</h3>

      <!-- 搜索和篩選 -->
      <div class="filter-section">
        <input 
          v-model="searchKeyword" 
          placeholder="搜索表單名稱或聯絡人..." 
          @input="handleSearch"
        />
        <select v-model="filterState" @change="handleFilter">
          <option value="">所有狀態</option>
          <option value="creating">創建中</option>
          <option value="saved">已保存</option>
          <option value="editing">編輯中</option>
          <option value="completed">已完成</option>
          <option value="submitted">已提交</option>
        </select>
        <button @click="refreshList">刷新</button>
      </div>

      <!-- 表單 -->
      <div class="form-section">
        <h4>新增報名表</h4>
        <form @submit.prevent="createRegistration">
          <div class="form-row">
            <input v-model="newForm.formName" placeholder="表單名稱" required />
            <input v-model="newForm.formSource" placeholder="來源說明" />
            <select v-model="newForm.state">
              <option value="creating">創建中</option>
              <option value="saved">已保存</option>
              <option value="editing">編輯中</option>
            </select>
          </div>
          
          <div class="contact-section">
            <h5>聯絡人信息</h5>
            <div class="form-row">
              <input v-model="newForm.contact.name" placeholder="聯絡人姓名" required />
              <input v-model="newForm.contact.phone" placeholder="電話" />
              <input v-model="newForm.contact.mobile" placeholder="手機" />
            </div>
            <div class="form-row">
              <input v-model="newForm.contact.relationship" placeholder="關係" />
              <input v-model="newForm.contact.otherRelationship" placeholder="其他關係說明" />
            </div>
          </div>

          <button type="submit" :disabled="creating">
            {{ creating ? "創建中..." : "新增報名表" }}
          </button>
        </form>
      </div>

      <!-- 列表 -->
      <div class="list-section">
        <div v-for="item in registrationList" :key="item.id" class="item-card">
          <div class="item-header">
            <h4>{{ item.formName }}</h4>
            <span class="status-badge" :class="item.state">{{ item.state }}</span>
          </div>
          <p><strong>表單編號:</strong> {{ item.formId }}</p>
          <p><strong>來源:</strong> {{ item.formSource || '未填寫' }}</p>
          <p><strong>聯絡人:</strong> {{ item.contact?.name }} ({{ item.contact?.phone || item.contact?.mobile }})</p>
          <p><strong>建立時間:</strong> {{ formatDate(item.createdAt) }}</p>
          <p><strong>建立者:</strong> {{ item.createdUser }}</p>
          
          <div class="item-actions">
            <button
              @click="deleteItem(item.id)"
              :disabled="deletingId === item.id"
              class="btn-danger"
            >
              {{ deletingId === item.id ? "刪除中..." : "刪除" }}
            </button>
            <button @click="editItem(item)" class="btn-primary">編輯</button>
            <button 
              v-if="item.state !== 'submitted' && item.state !== 'completed'" 
              @click="submitItem(item.id)"
              :disabled="submittingId === item.id"
              class="btn-success"
            >
              {{ submittingId === item.id ? "提交中..." : "提交" }}
            </button>
            <button 
              v-if="item.state === 'submitted'" 
              @click="completeItem(item.id)"
              :disabled="completingId === item.id"
              class="btn-complete"
            >
              {{ completingId === item.id ? "完成中..." : "標記完成" }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { registrationService } from "../services/registrationService.js";
import { ElMessage, ElMessageBox } from "element-plus";

export default {
  name: "RegistrationList",
  data() {
    return {
      registrationList: [],
      loading: false,
      error: null,
      creating: false,
      deletingId: null,
      submittingId: null,
      completingId: null,
      searchKeyword: "",
      filterState: "",
      newForm: {
        formName: "",
        formSource: "",
        state: "creating",
        contact: {
          name: "",
          phone: "",
          mobile: "",
          relationship: "",
          otherRelationship: "",
        },
        blessing: {
          persons: []
        },
        salvation: {
          ancestors: [],
          livingPersons: []
        }
      },
    };
  },
  async mounted() {
    await this.loadRegistrations();
  },
  methods: {
    // 載入所有數據
    async loadRegistrations() {
      this.loading = true;
      this.error = null;

      try {
        const result = await registrationService.getAllRegistrations();

        if (result.success) {
          this.registrationList = result.data;
          ElMessage.success(`成功載入 ${this.registrationList.length} 筆報名表`);
        } else {
          this.error = result.message;
          ElMessage.error(`載入失敗: ${result.message}`);
        }
      } catch (error) {
        this.error = "載入數據時發生錯誤";
        ElMessage.error("載入數據時發生錯誤");
        console.error("載入錯誤:", error);
      } finally {
        this.loading = false;
      }
    },

    // 創建新項目
    async createRegistration() {
      this.creating = true;

      try {
        const result = await registrationService.createRegistration(this.newForm);

        if (result.success) {
          // 清空表單
          this.resetNewForm();
          // 重新載入列表
          await this.loadRegistrations();
          ElMessage.success(`報名表 ${this.newForm.formName} 創建成功！表單編號: ${result.formId}`);
        } else {
          ElMessage.error(`創建失敗: ${result.message}`);
        }
      } catch (error) {
        ElMessage.error("創建時發生錯誤");
        console.error("創建錯誤:", error);
      } finally {
        this.creating = false;
      }
    },

    // 刪除項目
    async deleteItem(id) {
      try {
        await ElMessageBox.confirm(
          '確定要刪除這個報名表嗎？此操作無法撤銷。',
          '確認刪除',
          {
            confirmButtonText: '確定刪除',
            cancelButtonText: '取消',
            type: 'warning',
            center: true
          }
        );

        this.deletingId = id;

        const result = await registrationService.deleteRegistration(id);

        if (result.success) {
          // 從本地列表移除
          this.registrationList = this.registrationList.filter((item) => item.id !== id);
          ElMessage.success("刪除成功！");
        } else {
          ElMessage.error(`刪除失敗: ${result.message}`);
        }
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error("刪除時發生錯誤");
          console.error("刪除錯誤:", error);
        }
      } finally {
        this.deletingId = null;
      }
    },

    // 提交項目
    async submitItem(id) {
      this.submittingId = id;

      try {
        const result = await registrationService.submitRegistration(id);

        if (result.success) {
          // 更新本地狀態
          const item = this.registrationList.find(item => item.id === id);
          if (item) {
            item.state = 'submitted';
          }
          ElMessage.success("提交成功！");
        } else {
          ElMessage.error(`提交失敗: ${result.message}`);
        }
      } catch (error) {
        ElMessage.error("提交時發生錯誤");
        console.error("提交錯誤:", error);
      } finally {
        this.submittingId = null;
      }
    },

    // 標記完成
    async completeItem(id) {
      this.completingId = id;

      try {
        const result = await registrationService.completeRegistration(id);

        if (result.success) {
          // 更新本地狀態
          const item = this.registrationList.find(item => item.id === id);
          if (item) {
            item.state = 'completed';
          }
          ElMessage.success("標記完成成功！");
        } else {
          ElMessage.error(`標記完成失敗: ${result.message}`);
        }
      } catch (error) {
        ElMessage.error("標記完成時發生錯誤");
        console.error("標記完成錯誤:", error);
      } finally {
        this.completingId = null;
      }
    },

    // 編輯項目
    editItem(item) {
      // 跳轉到編輯頁面或開啟編輯模態框
      console.log("編輯項目:", item);
      ElMessage.info(`準備編輯: ${item.formName}`);
      // this.$router.push(`/registration/edit/${item.id}`)
    },

    // 搜索處理
    async handleSearch() {
      if (this.searchKeyword) {
        try {
          const result = await registrationService.searchMydata(this.searchKeyword);
          if (result.success) {
            this.registrationList = result.data;
          }
        } catch (error) {
          console.error("搜索錯誤:", error);
        }
      } else {
        await this.loadRegistrations();
      }
    },

    // 篩選處理
    async handleFilter() {
      if (this.filterState) {
        try {
          const result = await registrationService.getRegistrationsByState(this.filterState);
          if (result.success) {
            this.registrationList = result.data;
          }
        } catch (error) {
          console.error("篩選錯誤:", error);
        }
      } else {
        await this.loadRegistrations();
      }
    },

    // 刷新列表
    async refreshList() {
      this.searchKeyword = "";
      this.filterState = "";
      await this.loadRegistrations();
    },

    // 重置新表單
    resetNewForm() {
      this.newForm = {
        formName: "",
        formSource: "",
        state: "creating",
        contact: {
          name: "",
          phone: "",
          mobile: "",
          relationship: "",
          otherRelationship: "",
        },
        blessing: {
          persons: []
        },
        salvation: {
          ancestors: [],
          livingPersons: []
        }
      };
    },

    // 格式化日期
    formatDate(dateString) {
      if (!dateString) return '未知';
      const date = new Date(dateString);
      return date.toLocaleString('zh-TW');
    }
  },
};
</script>

<style scoped>
.item-card {
  border: 1px solid #ddd;
  padding: 1.5rem;
  margin: 0.5rem 0;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: bold;
}

.status-badge.creating { background: #e3f2fd; color: #1976d2; }
.status-badge.saved { background: #fff3e0; color: #f57c00; }
.status-badge.editing { background: #fff8e1; color: #ffa000; }
.status-badge.completed { background: #e8f5e8; color: #2e7d32; }
.status-badge.submitted { background: #f3e5f5; color: #7b1fa2; }

.error {
  color: red;
  background: #ffe6e6;
  padding: 1rem;
  border-radius: 4px;
}

.form-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  border: 1px solid #eee;
  border-radius: 8px;
  background: #f9f9f9;
}

.contact-section {
  margin: 1rem 0;
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background: #fff;
}

.form-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.form-row input,
.form-row select {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.filter-section {
  margin-bottom: 1rem;
  display: flex;
  gap: 0.5rem;
}

.filter-section input,
.filter-section select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.item-actions {
  margin-top: 1rem;
  display: flex;
  gap: 0.5rem;
}

.item-actions button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
}

.btn-primary { background: #1976d2; color: white; }
.btn-danger { background: #d32f2f; color: white; }
.btn-success { background: #2e7d32; color: white; }
.btn-complete { background: #7b1fa2; color: white; }

.btn-primary:hover { background: #1565c0; }
.btn-danger:hover { background: #c62828; }
.btn-success:hover { background: #1b5e20; }
.btn-complete:hover { background: #6a1b9a; }

.btn-primary:disabled,
.btn-danger:disabled,
.btn-success:disabled,
.btn-complete:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>