<template>

  <div class="page login-container">
    <h2>已退出登录</h2>
    <div class="welcome-message">
      <p>您已成功退出寺庙活动管理系统</p>
    </div>
    <div class="logout-actions">
        <router-link to="/login" class="btn btn-primary">重新登录</router-link>
      </div>
    
  </div>

</template>

<script>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

export default {
  name: 'Logout',
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()

    onMounted(() => {
      // 执行退出登录操作
      authStore.logout()
      
      // 可选：添加延迟后自动跳转到登录页
      setTimeout(() => {
        //router.push('/login')
      }, 3000)
    })

    return {}
  }
}
</script>

<style scoped>
.logout-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 2rem;
}

.logout-content {
  background: white;
  padding: 3rem;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  text-align: center;
  max-width: 400px;
  width: 100%;
}

.logout-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
  opacity: 0.8;
}

.logout-content h1 {
  color: var(--primary-color);
  margin-bottom: 1rem;
  font-size: 1.8rem;
}

.logout-content p {
  color: #666;
  margin-bottom: 2rem;
  font-size: 1.1rem;
  line-height: 1.6;
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
  
  .logout-content {
    padding: 2rem;
  }
  
  .logout-actions {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
  }
}
</style>