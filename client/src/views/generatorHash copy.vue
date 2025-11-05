<template>
  <div class="generator-page">
    <header class="page-header">
      <h1>Git Flow 哈希生成器</h1>
      <p>生成类似Git提交哈希的7位代码</p>
    </header>
    
    <main class="page-content">
      <!-- 控制按鈕 -->
      <div class="controls">
        <button @click="generateHash" class="btn btn-primary">生成哈希</button>
        <button @click="generateMultiple" class="btn btn-secondary">生成5個哈希</button>
      </div>
      
      <!-- 顯示當前生成的哈希 -->
      <div v-if="currentHash" class="result-card">
        <h3>當前生成的哈希:</h3>
        <code class="hash-display">{{ currentHash }}</code>
        <button @click="copyHash(currentHash)" class="btn btn-copy">📋 複製</button>
      </div>
      
      <!-- 顯示多個哈希 -->
      <div v-if="multipleHashes.length" class="result-card">
        <h3>多個哈希:</h3>
        <div v-for="(hash, index) in multipleHashes" :key="index" class="hash-item">
          <span class="hash-index">#{{ index + 1 }}</span>
          <code class="hash-value">{{ hash }}</code>
          <button @click="copyHash(hash)" class="btn btn-copy">📋</button>
        </div>
      </div>
      
      <!-- 使用示例区域 -->
      <div class="usage-examples">
        <h2>使用示例</h2>
        <div class="examples-grid">
          <div class="example-card">
            <h3>直接使用工具函数</h3>
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
console.log(hashes) // {{ multipleHashes.length ? `["${multipleHashes[0]}", ...]` : '["4a1c5d6", "8e9f2a1", ...]' }}
            </code></pre>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { 
  generateGitHash, 
  generateMultipleHashes, 
} from '@/utils/generateGitHash';

const currentHash = ref('');
const multipleHashes = ref([]);

const generateHash = () => {
  currentHash.value = generateGitHash();
  console.log('生成的哈希:', currentHash.value);
};

const generateMultiple = () => {
  multipleHashes.value = generateMultipleHashes(5);
  console.log('生成的多個哈希:', multipleHashes.value);
};

const copyHash = async (hash) => {
  try {
    await navigator.clipboard.writeText(hash);
    alert('已複製哈希: ' + hash);
  } catch (err) {
    console.error('複製失敗:', err);
    // 降級方案
    const textArea = document.createElement('textarea');
    textArea.value = hash;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    alert('已複製: ' + hash);
  }
};
</script>

<style scoped>
.generator-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.page-header {
  text-align: center;
  padding: 40px 20px;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.page-header h1 {
  margin-bottom: 8px;
  font-size: 2rem;
  color: #333;
}

.page-header p {
  color: #666;
  font-size: 1.1rem;
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

.btn-copy {
  background: #28a745;
  color: white;
  padding: 6px 12px;
  font-size: 12px;
}

.btn-copy:hover {
  background: #1e7e34;
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
  margin-right: 12px;
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
  flex: 1;
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
  padding: 20px;
  border-radius: 6px;
  border-left: 4px solid #007bff;
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