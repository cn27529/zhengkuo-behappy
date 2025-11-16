<template>
  <div>
    <!-- 顯示數據 -->
    <div v-if="loading">載入中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else>
      <h3>Mydata 列表 ({{ mydataList.length }} 筆)</h3>

      <!-- 表單 -->
      <div class="form-section">
        <h4>新增 Mydata</h4>
        <form @submit.prevent="createMydata">
          <input v-model="newForm.formName" placeholder="表單名稱" required />
          <select v-model="newForm.state">
            <option value="draft">草稿</option>
            <option value="active">啟用</option>
            <option value="inactive">停用</option>
          </select>
          <button type="submit" :disabled="creating">新增</button>
        </form>
      </div>

      <!-- 列表 -->
      <div class="list-section">
        <div v-for="item in mydataList" :key="item.id" class="item-card">
          <h4>{{ item.formName }}</h4>
          <p>狀態: {{ item.state }}</p>
          <p v-if="item.contact">聯絡人: {{ item.contact.name }}</p>
          <button
            @click="deleteItem(item.id)"
            :disabled="deletingId === item.id"
          >
            {{ deletingId === item.id ? "刪除中..." : "刪除" }}
          </button>
          <button @click="editItem(item)">編輯</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mydataService } from "../services/mydataService.js";
import { ElMessage, ElMessageBox } from "element-plus";
import MockDataHelper from "../utils/mockDataHelper.js";

export default {
  name: "MydataList",
  data() {
    return {
      mydataList: [],
      loading: false,
      error: null,
      creating: false,
      deletingId: null,
      newForm: {
        formName: "",
        state: "draft",
        contact: {
          name: "廣小明",
          phone: "02-12345678",
          mobile: "0912345678",
          relationship: "家人",
          otherRelationship: "",
        },
      },
    };
  },
  async mounted() {
    await this.loadMydata();
  },
  methods: {
    // 載入所有數據
    async loadMydata() {
      this.loading = true;
      this.error = null;

      try {
        const result = await mydataService.getAllMydata();

        if (result.success) {
          this.mydataList = result.data;
        } else {
          this.error = result.message;
          console.error("載入失敗:", result);
        }
      } catch (error) {
        this.error = "載入數據時發生錯誤";
        console.error("載入錯誤:", error);
      } finally {
        this.loading = false;
      }
    },

    // 創建新項目
    async createMydata() {
      this.creating = true;

      try {
        const randomData = MockDataHelper.getRandomMydata();
        this.newForm = {
          ...this.newForm,
          ...randomData,
        };
        
        const result = await mydataService.createMydata(this.newForm);

        if (result.success) {
          // 清空表單
          this.newForm.formName = "";
          this.newForm.state = "draft";
          // 重新載入列表
          await this.loadMydata();
          //alert("創建成功！");
          ElMessage.success(` ${this.newForm.formName} 己創建成功！${JSON.stringify(this.newForm.contact)}`);
        } else {
          //alert(`創建失敗: ${result.message}`);
          ElMessage.error(`創建失敗: ${result.message}`);
        }
      } catch (error) {
        //alert("創建時發生錯誤");
        ElMessage.error(`創建時發生錯誤: ${error}`);
        console.error("創建錯誤:", error);
      } finally {
        this.creating = false;
      }
    },

    // 刪除項目
    async deleteItem(id) {
      //if (!confirm("確定要刪除這個項目嗎？")) return;

      await ElMessageBox.confirm(
          '確定要刪除這個項目嗎？此操作無法撤銷。',
          '確認刪除',
          {
            confirmButtonText: '確定刪除',
            cancelButtonText: '取消',
            type: 'warning',
            center: true
          }
        )


      this.deletingId = id;

      try {
        const result = await mydataService.deleteMydata(id);

        if (result.success) {
          // 從本地列表移除
          this.mydataList = this.mydataList.filter((item) => item.id !== id);
          //alert("刪除成功！");
          ElMessage.success("刪除成功！");
        } else {
          //alert(`刪除失敗: ${result.message}`);
          ElMessage.error(`刪除失敗: ${result.message}`);
        }
      } catch (error) {
        //alert("刪除時發生錯誤");
        console.error("刪除錯誤:", error);
        ElMessage.error(`刪除時發生錯誤: ${error}`);
      } finally {
        this.deletingId = null;
      }
    },

    // 編輯項目
    editItem(item) {
      // 跳轉到編輯頁面或開啟編輯模態框
      console.log("編輯項目:", item);
      // this.$router.push(`/mydata/edit/${item.id}`)
    },
  },
};
</script>

<style scoped>
.item-card {
  border: 1px solid #ddd;
  padding: 1rem;
  margin: 0.5rem 0;
  border-radius: 4px;
}

.error {
  color: red;
  background: #ffe6e6;
  padding: 1rem;
  border-radius: 4px;
}




</style>
