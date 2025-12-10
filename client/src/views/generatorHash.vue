<!-- src/views/generatorHash.vue -->
<template>
  <div class="main-content">
    <div class="page-header">
      <h2>Git Flow 哈希生成器</h2>
    </div>

    <!-- 表單管理区域 -->
    <div class="form-header">
      <p>生成类似Git提交哈希的7位代码</p>
    </div>

    <div class="form-content">
      <!-- 内容区域 -->
      <div class="form-section">
        <h2>顯示當前生成的哈希</h2>
        <div class="form-actions">
          <button @click="handleGenerateHash" class="btn btn-primary">
            生成哈希
          </button>
          <button
            style="display: none"
            @click="copyHash(currentHash)"
            class="btn btn-copy"
          >
            📋 複製
          </button>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label></label>
            <code class="hash-display">{{ currentHash }}</code>
          </div>
        </div>
      </div>

      <div class="form-section">
        <h2>顯示多個哈希</h2>
        <div class="form-actions">
          <button @click="handleGenerateMultiple" class="btn btn-secondary">
            生成5個哈希
          </button>
          <button
            style="display: none"
            @click="copyHash(hash)"
            class="btn btn-copy"
          >
            📋 複製
          </button>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label></label>
            <div
              v-for="(hash, index) in multipleHashes"
              :key="index"
              class="hash-item"
            >
              <span class="hash-index"></span>
              <code class="hash-value">{{ hash }}</code>
            </div>
          </div>
        </div>
      </div>

      <div class="form-section">
        <h2>直接使用工具函数</h2>
        <div class="form-grid">
          <div class="form-group">
            <label>直接使用工具函数</label>
            <pre><code>
import { generateGitHash } from "../utils/generateGitHash"

const hash = generateGitHash()
console.log(hash) // 例如: "{{ currentHash || '4a1c5d6' }}"
            </code></pre>
          </div>
        </div>
      </div>

      <div class="form-section">
        <h2>批量生成</h2>
        <div class="form-grid">
          <div class="form-group">
            <label>批量生成</label>
            <pre><code>
import { generateMultipleHashes } from "../utils/generateGitHash"

const hashes = generateMultipleHashes(5)
console.log(hashes) // {{ multipleHashes.length ? `[${multipleHashes.map((hash) => `"${hash}"`).join(', ')}]` : '["4a1c5d6", "8e9f2a1", ...]' }}
            </code></pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import {
  generateGitHash,
  generateMultipleHashes,
} from "../utils/generateGitHash";

const currentHash = ref("");
const multipleHashes = ref([]);

const handleGenerateHash = () => {
  currentHash.value = generateGitHash();
  console.log("生成的哈希:", currentHash.value);
};

const handleGenerateMultiple = () => {
  multipleHashes.value = generateMultipleHashes(5);
  console.log("生成的多個哈希:", multipleHashes.value);
};

const copyHash = async (hash) => {
  try {
    await navigator.clipboard.writeText(hash);
    alert("已複製哈希: " + hash);
  } catch (err) {
    console.error("複製失敗:", err);
    // 降級方案
    const textArea = document.createElement("textarea");
    textArea.value = hash;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
    alert("已複製: " + hash);
  }
};
</script>

<style scoped>
/* 增加粘性标题时的样式 */
.form-section.sticky {
  position: fixed;
  top: 0;
  /* min-width: auto; */
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); /* 可选：添加阴影效果 */
  /* 透過 left: 50% 和 transform: translateX(-50%) 讓固定元素在視窗水平置中，最大寬度限制與父容器一致。 */
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.form-grid.compact {
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.form-group.address-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.form-group.address-row label {
  width: 120px;
  margin-bottom: 0;
}

.form-group.address-row input {
  flex: 1;
}

.url-info {
  padding: 0.75rem;
  background: #e7f3ff;
  border: 1px solid #b3d9ff;
  border-radius: 6px;
  color: #0066cc;
  font-size: 0.9rem;
}

.result-value {
  padding: 0.75rem;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1.2rem; /* 從 1rem 改為 1.2rem */
  font-weight: bold;
  text-align: center;
}

.zodiac-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 1.5rem; /* 從 1.1rem 改為 1.5rem */
}

.tai-sui-label {
  padding: 0.5rem;
  border-radius: 4px;
  color: white;
  text-align: center;
  font-weight: bold;
}

.tai-sui-label.value {
  background: #dc3545;
  color: white;
}
.tai-sui-label.chong {
  background: #fd7e14;
  color: white;
}
.tai-sui-label.hai {
  background: #20c997;
  color: white;
}
.tai-sui-label.po {
  background: #6f42c1;
  color: white;
}
.tai-sui-label.xing {
  background: #e83e8c;
  color: white;
}

.explanation-text {
  background: white;
  padding: 1.5rem;
  border-radius: 6px;
  border: 1px solid #ddd;
}

.explanation-text pre {
  margin: 0;
  white-space: pre-wrap;
  font-family: inherit;
  line-height: 1.5;
  color: #333;
  font-size: 1.2rem; /* 從 1rem 改為 1.2rem */
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.8rem;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--secondary-color);
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

.btn-outline {
  background: transparent;
  border: 1px solid var(--primary-color);
  color: var(--primary-color);
}

.btn-outline:hover:not(:disabled) {
  background: var(--primary-color);
  color: white;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 2rem;
  /* border-top: 1px solid #e9ecef; */
}

/* 响應式設計 */
@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-group.address-row {
    flex-direction: column;
    align-items: stretch;
  }

  .form-group.address-row label {
    width: auto;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }

  .loading-indicator {
    background: #e7f3ff;
    border: 1px solid #b3d9ff;
    border-radius: 6px;
    padding: 0.5rem 1rem;
    color: #0066cc;
    font-size: 0.9rem;
    margin-top: 0.5rem;
  }

  input:disabled {
    background-color: #f8f9fa;
    cursor: not-allowed;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}
</style>
