<template>

  <div class="page login-container">
    <h2>已退出登录</h2>
    <div class="welcome-message">
      <p>您已成功退出{{ appTitle }}</p>
    </div>
    <div class="logout-actions" style="display: none;">
        <router-link to="/login" class="btn btn-primary">重新登录</router-link>
    </div>
  </div>

</template>

<script>
import { onMounted,ref, reactive } from "vue"
import { useRouter } from "vue-router"
import { useAuthStore } from "../stores/authStore.js"
import { useSupabaseAuthStore } from "../stores/supabase-auth.js"
import { ElMessage } from "element-plus"
import appConfig from "../config/appConfig"

export default {
  name: "Logout",
  setup() {
    
    const router = useRouter()
    const authStore = useAuthStore()
    const supabaseAuthStore = useSupabaseAuthStore()

    // const errors = reactive({
    //   name: '',
    //   email: '',
    //   phone: '',
    //   subject: '',
    //   message: ''
    // })

    //const success = ref(false)
    //const loading = ref(false)

    onMounted(() => {
    
      // 显示退出登录消息
      ElMessage.success('您已成功退出登录！👋👋');
        
        
      // 执行退出登录操作
      authStore.logout()
      supabaseAuthStore.logout()

      // 可选：添加延迟后自动跳转到登录页
      setTimeout(() => {
        router.push('/login')
      }, 3000); // 3秒后跳转

    })

    return {
      appTitle: appConfig.title,
      //errors,
      //success,
      //loading,
    }
  }
}
</script>

<style scoped>
.logout-container { max-width: 300px; margin: 50px auto; padding: 20px; border: 1px solid #ccc; border-radius: 10px; }
h2 { text-align: center; }
/* .login-container:hover {
  filter: drop-shadow(0 0 3em #42b883aa);
} */



.logout-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
  opacity: 0.8;
}

.logout-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-block;
}

.btn-primary {
  background-color: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background-color: var(--secondary-color);
  transform: translateY(-2px);
}

.btn-outline {
  background: transparent;
  border: 1px solid var(--primary-color);
  color: var(--primary-color);
}

.btn-outline:hover {
  background: var(--primary-color);
  color: white;
  transform: translateY(-2px);
}

/* 响应式设计 */
@media (max-width: 480px) {
  .logout-container {
    padding: 1rem;
  }
  
  .logout-actions {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
  }
}
</style>