<template>
  <div class="generator-page">
    <header class="page-header">
      <h1>Git Flow 哈希（hash）生成器</h1>
    </header>
    
    <main class="page-content">
      
      <p>生成类似Git提交哈希（hash）的5位代码</p>
      <!-- 使用示例区域 -->
      <div class="usage-examples">
        <h2>使用示例</h2>
        <div class="examples-grid">
          
          <div class="example-card">
            <h3>在组件中使用</h3>
            <pre><code>
import { useGitHash } from '@/composables/useGitHash'

const { generateSingleHash } = useGitHash()
const commitHash = generateSingleHash()
            </code></pre>
          </div>
          
          <div class="example-card">
            <h3>直接使用工具函数</h3>
            <pre><code>
import { generateGitHash } from '@/utils/generateGitHash'

const hash = generateGitHash()
console.log(hash) // 例如: "fd0d4"
            </code></pre>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>

</script>

<style scoped>
.generator-page {
  min-height: 100vh;
  /* background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); */
}

.page-header {
  text-align: center;
  padding: 40px 20px;
  color: white;
}

.page-header h1 {
  margin-bottom: 4px;
  font-size: 1.5rem;
}

.page-content {
  padding: 20px;
}

.usage-examples {
  /* max-width: 800px;
  margin: 20px auto; */
  background: white;
  border-radius: 8px;
  padding: 24px;
}

.usage-examples h2 {
  margin-bottom: 20px;
  color: #333;
}

.examples-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

.example-card {
  /* background: #f8f9fa;
  padding: 16px;
  border-radius: 6px;
  border-left: 4px solid #007bff; */
}

.example-card h3 {
  margin-bottom: 12px;
  color: #495057;
}

pre {
  background: #2d2d2d;
  color: #f8f9fa;
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 14px;
}

@media (max-width: 768px) {
  .examples-grid {
    grid-template-columns: 1fr;
  }
}
</style>