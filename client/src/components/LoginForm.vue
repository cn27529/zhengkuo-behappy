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

      <div style="display: none;" class="form-group">
        <label class="checkbox-label">
          <input type="checkbox" v-model="rememberMe" />
          <span>記住我（在此電腦保持登入狀態）</span>
        </label>
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
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";

export default {
  name: "LoginForm",
  setup() {
    const authStore = useAuthStore();
    const router = useRouter();
    const rememberMe = ref(false);

    const showDeviceDialog = ref(false);

    // 检测是否为移动设备
    const isMobileDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const screenWidth = window.innerWidth;
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      const mobileKeywords = [
        'android', 'iphone', 'ipad', 'ipod', 'blackberry',
        'windows phone', 'webos', 'opera mini', 'iemobile', 'mobile'
      ];
      
      return mobileKeywords.some(keyword => userAgent.includes(keyword)) || 
             (screenWidth <= 768 && hasTouch);
    };

    const detectDeviceType = () => {
      const userAgent = navigator.userAgent;
      const screenWidth = window.innerWidth;
      
      // 更精確的移動設備檢測
      const isMobile = {
        // User Agent 檢測
        byUA: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
        // 屏幕尺寸 + 觸控
        byScreen: screenWidth <= 768 && ('ontouchstart' in window || navigator.maxTouchPoints > 0),
        // 特定移動特徵
        byFeatures: !!userAgent.match(/iPhone|Android/i) && 'ontouchstart' in window
      };
      
      return isMobile.byUA || isMobile.byScreen || isMobile.byFeatures ? 'mobile' : 'desktop';
    };

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
        await authStore.login(loginForm.username, loginForm.password);

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
      
      // // 檢查用戶是否已經確認過提示
      // const hasConfirmed = sessionStorage.getItem('device-warning-confirmed');
      
      if (isMobileDevice() || detectDeviceType() === 'mobile') {
        // 延迟显示，确保页面加载完成
        setTimeout(() => {
          showDeviceDialog.value = true;
        }, 800);
      }

      //const deviceType = detectDeviceType();
      //console.log(`檢測到裝置類型: ${deviceType}`);
      
      //if (deviceType === 'mobile') {
        // ElMessage({
        //   message: "為了較佳的使用體驗，請選擇桌上型裝置",
        //   type: 'warning',
        //   duration: 6000,
        //   showClose: true,
        // });
      //}

      
    })

    return {
      loginForm,
      //success,
      loading,
      handleLogin,
      rememberMe,
      showDeviceDialog,
      confirmDeviceDialog
    };
  },
};
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
  color: #E6A23C;
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

    /* 自訂對話框樣式 */
  :deep(.custom-dialog .el-dialog__title) {
    color: white !important;
    
  }

}
</style>
