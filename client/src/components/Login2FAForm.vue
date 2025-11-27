<template>
  <div>
    <!-- 主要登入表單 -->
    <form v-if="!show2FA" @submit.prevent="handleLogin">
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

      <button
        type="submit"
        class="btn btn-primary btn-block"
        :disabled="loading"
      >
        {{ loading ? "登录中..." : "登录" }}
      </button>
    </form>

    <!-- 2FA 驗證表單 -->
    <form v-else @submit.prevent="handle2FAVerification">
      <div class="form-group">
        <div class="twofa-header">
          <el-icon size="24" color="#409EFF"><Lock /></el-icon>
          <h3>兩步驟驗證</h3>
        </div>
        <p class="twofa-description">
          請開啟您的驗證器 App (如 Google Authenticator、Microsoft Authenticator
          等)，輸入顯示的 6 位驗證碼
        </p>

        <label for="otp">驗證碼</label>
        <input
          type="text"
          id="otp"
          v-model="twoFAForm.otp"
          placeholder="请输入 6 位验证码"
          maxlength="6"
          required
          :disabled="twoFALoading"
        />
      </div>

      <div class="twofa-actions">
        <button
          type="submit"
          class="btn btn-primary btn-block"
          :disabled="
            twoFALoading || !twoFAForm.otp || twoFAForm.otp.length !== 6
          "
        >
          {{ twoFALoading ? "验证中..." : "验证" }}
        </button>

        <button
          type="button"
          class="btn btn-secondary btn-block"
          @click="cancel2FA"
          :disabled="twoFALoading"
        >
          返回重新登入
        </button>
      </div>
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
        <div class="warning-text">
          <h3>為了較佳的使用體驗，請選擇桌上型裝置</h3>
        </div>
      </div>

      <span class="dialog-footer">
        <el-button type="primary" @click="confirmDeviceDialog" size="large">
          我知道了
        </el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from "vue";
import { useAuthStore } from "../stores/authStore.js";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { Lock, Warning } from "@element-plus/icons-vue";

export default {
  name: "Login2FAForm",
  components: {
    Lock,
    Warning,
  },
  setup() {
    const authStore = useAuthStore();
    const router = useRouter();

    const show2FA = ref(false);
    const showDeviceDialog = ref(false);
    const loading = ref(false);
    const twoFALoading = ref(false);

    // 儲存 2FA 流程中的臨時令牌
    const twoFATempToken = ref(null);

    const loginForm = reactive({
      username: "",
      password: "",
    });

    const twoFAForm = reactive({
      otp: "",
    });

    const confirmDeviceDialog = () => {
      showDeviceDialog.value = false;
    };

    const validateForm = () => {
      let isValid = true;

      if (!loginForm.username.trim()) {
        ElMessage.error("请输入用户名");
        isValid = false;
      } else if (loginForm.username.length < 3) {
        ElMessage.error("用户名至少需要3个字符");
        isValid = false;
      }

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
        // 使用新的 2FA 登入方法
        const result = await authStore.loginWith2FA(
          loginForm.username,
          loginForm.password
        );

        if (result.requires2FA) {
          // 需要 2FA 驗證
          twoFATempToken.value = result.tempToken;
          show2FA.value = true;
          ElMessage.info("請輸入兩步驟驗證碼");
        } else {
          // 不需要 2FA，直接登入成功
          ElMessage.success("登录成功！正在跳转至主页...👍👍");
          setTimeout(() => {
            router.push("/dashboard");
          }, 1500);
        }
      } catch (error) {
        ElMessage.error("登入失敗: " + error.message);
        console.error("登入失敗:", error);
      } finally {
        loading.value = false;
      }
    };

    const handle2FAVerification = async () => {
      if (!twoFAForm.otp || twoFAForm.otp.length !== 6) {
        ElMessage.error("请输入6位验证码");
        return;
      }

      twoFALoading.value = true;

      try {
        // 使用 store 的 2FA 驗證方法
        await authStore.verify2FA(twoFATempToken.value, twoFAForm.otp);

        ElMessage.success("兩步驟驗證成功！正在跳转至主页...");
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      } catch (error) {
        if (error.isRetryable) {
          ElMessage.error("驗證碼錯誤，請重新輸入");
          twoFAForm.otp = ""; // 清空輸入框讓用戶重新輸入
        } else {
          ElMessage.error("兩步驟驗證失敗: " + error.message);
        }
        console.error("2FA 驗證失敗:", error);
      } finally {
        twoFALoading.value = false;
      }
    };

    const cancel2FA = () => {
      show2FA.value = false;
      twoFAForm.otp = "";
      twoFATempToken.value = null;
      loginForm.password = ""; // 清空密碼讓用戶重新輸入
    };

    onMounted(() => {
      if (
        authStore.isMobileDevice() ||
        authStore.detectDeviceType() === "mobile"
      ) {
        setTimeout(() => {
          showDeviceDialog.value = true;
        }, 800);
      }
    });

    return {
      loginForm,
      twoFAForm,
      show2FA,
      showDeviceDialog,
      loading,
      twoFALoading,
      handleLogin,
      handle2FAVerification,
      cancel2FA,
      confirmDeviceDialog,
    };
  },
};
</script>

<style scoped>
.twofa-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  justify-content: center;
}

.twofa-header h3 {
  margin: 0;
  color: #409eff;
}

.twofa-description {
  text-align: center;
  color: #606266;
  margin-bottom: 24px;
  line-height: 1.5;
  font-size: 14px;
}

.twofa-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 20px;
}

.btn-secondary {
  background-color: #909399;
  border-color: #909399;
  color: white;
}

.btn-secondary:hover {
  background-color: #a6a9ad;
  border-color: #a6a9ad;
}

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
}

.dialog-footer {
  display: flex;
  justify-content: center;
}

/* 自訂對話框樣式 */
:deep(.custom-dialog .el-dialog__title) {
  color: white !important;
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

  :deep(.custom-dialog .el-dialog__title) {
    color: white !important;
  }
}

/* 表單樣式 */
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #303133;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.form-group input:focus {
  outline: none;
  border-color: #409eff;
}

.btn {
  padding: 12px 20px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background-color: #409eff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #66b1ff;
}

.btn-primary:disabled {
  background-color: #a0cfff;
  cursor: not-allowed;
}

.btn-block {
  width: 100%;
}
</style>
