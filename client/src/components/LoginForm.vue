<template>
  <div>
    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <label for="username">用户名</label>
        <input
          type="text"
          id="username"
          v-model="loginForm.username"
          placeholder="请输入用户名"
          required
        />
      </div>

      <div class="form-group">
        <label for="password">密码</label>
        <input
          type="password"
          id="password"
          v-model="loginForm.password"
          placeholder="请输入密码"
          required
        />
      </div>

      <div class="form-group">
        <div class="form-options">
          <el-checkbox
            v-model="rememberMe"
            class="highlight-bg"
            label="記住用戶名"
            size="large"
          />
        </div>
      </div>

      <button
        type="submit"
        class="btn btn-primary btn-block"
        :disabled="loading"
      >
        {{ loading ? "登录中..." : "登录" }}
      </button>
    </form>

    <!-- 裝置提示對話框 -->
    <el-dialog
      v-model="showDeviceDialog"
      title="裝置提示"
      width="500px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
      align-center
      class="custom-dialog"
    >
      <div class="dialog-content">
        <div class="warning-icon">
          <el-icon size="48" color="#E6A23C">
            <Warning />
          </el-icon>
        </div>
        <h3>為了較佳的使用體驗，請選擇桌上型裝置</h3>
      </div>

      <span class="dialog-footer">
        <el-button type="primary" @click="confirmDeviceDialog" size="large">
          我知道了
        </el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { useAuthStore } from "../stores/authStore.js";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { Warning } from "@element-plus/icons-vue"; // 添加這一行

const authStore = useAuthStore();
const router = useRouter();
const rememberMe = ref(false);

const showDeviceDialog = ref(false);

// 確認對話框
const confirmDeviceDialog = () => {
  showDeviceDialog.value = false;
  // 可選：將用戶選擇存儲在本地，避免每次都要顯示
  //sessionStorage.setItem('device-warning-confirmed', 'true');
};

const loginForm = reactive({
  username: "",
  password: "",
});

//const success = ref(false)
const loading = ref(false);

const validateForm = () => {
  let isValid = true;

  // 重置错误信息
  //Object.keys(errors).forEach(key => errors[key] = '')

  // 用户名验证
  if (!loginForm.username.trim()) {
    ElMessage.error("请输入用户名");
    isValid = false;
  } else if (loginForm.username.length < 3) {
    ElMessage.error("用户名至少需要3个字符");
    isValid = false;
  }

  // 密码验证
  if (!loginForm.password) {
    ElMessage.error("请输入密码");
    isValid = false;
  } else if (loginForm.password.length < 6) {
    ElMessage.error("密码至少需要6个字符");
    isValid = false;
  }

  return isValid;
};

const handleLogin = async () => {
  if (!validateForm()) return;

  loading.value = true;

  try {
    await authStore.submitLogin(loginForm.username, loginForm.password);

    // 處理「記住我」邏輯
    if (rememberMe.value) {
      localStorage.setItem("remembered_username", loginForm.username);
    } else {
      localStorage.removeItem("remembered_username");
    }

    ElMessage.success("登录成功！正在跳转至主页...👍👍");

    // 模拟跳转延迟
    setTimeout(() => {
      //success.value = false
      router.push("/dashboard");
    }, 1500);
  } catch (error) {
    //alert(error.message);
    ElMessage.error("登入失敗: " + error.message);
    console.error("登入失敗:", error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  // 讀取 localStorage
  const savedUsername = localStorage.getItem("remembered_username");
  if (savedUsername) {
    loginForm.username = savedUsername;
    rememberMe.value = true;
  }

  if (authStore.isMobileDevice() || authStore.detectDeviceType() === "mobile") {
    // 延迟显示，确保页面加载完成
    setTimeout(() => {
      showDeviceDialog.value = true;
    }, 800);
  }
});
</script>

<style scoped>
.dialog-content {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 10px 0;
}

.warning-icon {
  flex-shrink: 0;
  margin-top: 4px;
}

.warning-text h3 {
  margin: 0 0 8px 0;
  color: #e6a23c;
  font-size: 18px;
  text-align: center;
}

.warning-text p {
  margin: 0;
  color: #606266;
  line-height: 1.5;
  text-align: center;
}

.dialog-footer {
  display: flex;
  justify-content: center;
}

/* 自訂對話框樣式 */
:deep(.custom-dialog .el-dialog__title) {
  color: white !important;
}

.form-options {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-bottom: 20px;
  padding-left: 2px;
}

/* 做「背景高亮」（像標記一樣） */
.highlight-bg {
  background: #fff;
  padding: 2px 6px;
  border-radius: 4px;
}

.btn-block {
  width: 100%;
  height: 40px;
  font-size: 16px;
}

/* 讓 Checkbox 的文字顏色更柔和 */
:deep(.el-checkbox__label) {
  color: #606266;
  font-weight: 400;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .dialog-content {
    flex-direction: column;
    text-align: center;
  }

  .warning-icon {
    align-self: center;
  }

  /* 自訂對話框樣式 */
  :deep(.custom-dialog .el-dialog__title) {
    color: white !important;
  }
}
</style>
