<template>
  <div class="generator-page">
    <header class="page-header">
      <h1>Git Flow 哈希（hash）生成器</h1>
    </header>
    
    <main class="page-content">
      <div class="controls">
        <button @click="generateHash" class="btn btn-primary">生成哈希（hash）</button>
        <button @click="generateMultiple" class="btn btn-secondary">生成5個哈希（hash）</button>
        <!-- <button @click="testUniqueness" class="btn btn-info">測試唯一性</button> -->
      </div>
      
      <div v-if="currentHash" class="result-card">
        <h3>當前生成的哈希（hash）:</h3>
        <code class="hash-display">{{ currentHash }}</code>
      </div>
      
      <div v-if="multipleHashes.length" class="result-card">
        <h3>多個哈希（hash）:</h3>
        <div v-for="(hash, index) in multipleHashes" :key="index" class="hash-item">
          <span class="hash-index">#{{ index + 1 }}</span>
          <code class="hash-value">{{ hash }}</code>
        </div>
      </div>
      
      <div v-if="testResult" class="result-card">
        <h3>測試結果:</h3>
        <pre class="test-result">{{ JSON.stringify(testResult, null, 2) }}</pre>
      </div>
      
      <!-- 使用示例区域 -->
      <div class="usage-examples">
        <h2>使用示例</h2>
        <div class="examples-grid">
          <div class="example-card">
            <h3>在組件中使用</h3>
            <pre><code>
import { generateGitHash } from '@/utils/generateGitHash'

const hash = generateGitHash()
console.log(hash) // 例如: "{{ currentHash || '4a1c5d6' }}"
            </code></pre>
          </div>
          
          <div class="example-card">
            <h3>批量生成</h3>
            <pre><code>
import { generateMultipleHashes } from '@/utils/generateGitHash'

const hashes = generateMultipleHashes(5)
console.log(hashes) // ["4a1c5d6", "8e9f2a1", ...]
            </code></pre>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { 
  generateGitHash, 
  generateMultipleHashes, 
  testUniqueness 
} from '@/utils/generateGitHash.js'

const currentHash = ref('')
const multipleHashes = ref([])
const testResult = ref(null)
const isLoading = ref(false)

const generateHash = () => {
  currentHash.value = generateGitHash()
}

const generateMultiple = () => {
  multipleHashes.value = generateMultipleHashes(5)
}

// const testUniqueness = async () => {
//   isLoading.value = true
//   try {
//     testResult.value = await new Promise(resolve => {
//       setTimeout(() => {
//         resolve(testUniqueness(50))
//       }, 0)
//     })
//   } finally {
//     isLoading.value = false
//   }
// }
</script>

<style scoped>
.generator-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.page-header {
  text-align: center;
  padding: 30px 20px;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.page-header h1 {
  margin-bottom: 8px;
  font-size: 2rem;
  color: #333;
}

.page-content {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.controls {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.btn {
  padding: 12px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #545b62;
}

.btn-info {
  background: #17a2b8;
  color: white;
}

.btn-info:hover {
  background: #138496;
}

.result-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.result-card h3 {
  margin-bottom: 12px;
  color: #333;
  font-size: 1.2rem;
}

.hash-display {
  display: inline-block;
  background: #f8f9fa;
  padding: 12px 16px;
  border-radius: 6px;
  font-family: 'Courier New', monospace;
  font-size: 18px;
  font-weight: bold;
  color: #e83e8c;
  border: 2px solid #e9ecef;
}

.hash-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  margin-bottom: 6px;
  background: #f8f9fa;
  border-radius: 4px;
}

.hash-index {
  color: #6c757d;
  font-size: 12px;
  min-width: 30px;
}

.hash-value {
  font-family: 'Courier New', monospace;
  color: #28a745;
  font-weight: bold;
}

.test-result {
  background: #2d2d2d;
  color: #f8f9fa;
  padding: 16px;
  border-radius: 6px;
  overflow-x: auto;
  font-size: 14px;
  line-height: 1.4;
}

.usage-examples {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.usage-examples h2 {
  margin-bottom: 20px;
  color: #333;
  font-size: 1.5rem;
}

.examples-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.example-card {
  background: #f8f9fa;
  /* padding: 20px;
  border-radius: 6px;
  border-left: 4px solid #007bff; */
}

.example-card h3 {
  margin-bottom: 12px;
  color: #495057;
  font-size: 1.1rem;
}

pre {
  background: #2d2d2d;
  color: #f8f9fa;
  padding: 16px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 13px;
  line-height: 1.5;
  margin: 0;
}

code {
  font-family: 'Courier New', monospace;
}

@media (max-width: 768px) {
  .examples-grid {
    grid-template-columns: 1fr;
  }
  
  .controls {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
  }
  
  .page-header h1 {
    font-size: 1.5rem;
  }
}
</style>