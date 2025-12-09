<template>
  <div class="container">
    <header>
      <h1>JavaScript 開啟新分頁方法</h1>
      <p class="subtitle">使用Vue 3實現多種開啟新標籤頁的方式</p>
    </header>

    <div class="methods-grid">
      <div v-for="method in methods" :key="method.id" class="method-card">
        <h3 class="method-title">
          <span class="method-icon">{{ method.icon }}</span>
          {{ method.title }}
        </h3>
        <p class="method-description">{{ method.description }}</p>
        <div class="code-block">
          <pre><code>{{ method.code }}</code></pre>
        </div>
        <button class="demo-btn" @click="executeMethod(method.id)">
          測試此方法
        </button>
      </div>
    </div>

    <div class="demo-section">
      <h2 class="demo-title">自定義測試</h2>
      <div class="demo-controls">
        <input
          v-model="customUrl"
          type="text"
          placeholder="輸入網址 (例如: https://example.com)"
          class="url-input"
        />
        <button class="demo-btn" @click="openCustomUrl('_blank')">
          開啟自定義網址
        </button>
        <button class="demo-btn secondary" @click="openCustomUrl('_self')">
          在當前分頁開啟
        </button>
      </div>
      <div class="options">
        <label class="option">
          <input v-model="options.noopener" type="checkbox" />
          添加 noopener
        </label>
        <label class="option">
          <input v-model="options.noreferrer" type="checkbox" />
          添加 noreferrer
        </label>
      </div>
    </div>

    <div class="info-section">
      <h2>注意事項</h2>
      <ul>
        <li>瀏覽器可能會阻擋彈出視窗，請允許此網站開啟新分頁</li>
        <li>
          使用 <code>noopener</code> 可增強安全性，防止新分頁訪問原始分頁的
          window 對象
        </li>
        <li>使用 <code>noreferrer</code> 可防止發送 Referer header</li>
        <li>
          現代瀏覽器通常會自動為 <code>target="_blank"</code> 添加
          <code>rel="noopener"</code>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from "vue";

// 響應式數據
const customUrl = ref("https://example.com");
const options = reactive({
  noopener: true,
  noreferrer: false,
});

// 方法定義
const methods = ref([
  {
    id: "windowOpen",
    icon: "🪟",
    title: "window.open() 方法",
    description: "最常用的開啟新分頁方法，可自定義視窗特性",
    code: `// 基本用法
window.open('https://example.com', '_blank');

// 帶有特性的用法
window.open(
  'https://example.com', 
  '_blank', 
  'noopener,noreferrer'
);`,
  },
  {
    id: "anchorTag",
    icon: "🔗",
    title: "Anchor 標籤方法",
    description: "使用 HTML 連結元素開啟新分頁",
    code: `// 動態創建連結元素
const link = document.createElement('a');
link.href = 'https://example.com';
link.target = '_blank';
link.rel = 'noopener noreferrer';
link.click();

// 或者在模板中使用
// <a href="https://example.com" target="_blank" rel="noopener">連結</a>`,
  },
  {
    id: "formSubmit",
    icon: "📝",
    title: "表單提交方法",
    description: "通過表單提交在新分頁中開啟 URL",
    code: `// 動態創建表單
const form = document.createElement('form');
form.method = 'GET';
form.action = 'https://example.com';
form.target = '_blank';
document.body.appendChild(form);
form.submit();
document.body.removeChild(form);`,
  },
  {
    id: "locationHref",
    icon: "📍",
    title: "window.location 方法",
    description: "在當前分頁或新分頁中導航",
    code: `// 當前分頁導航
window.location.href = 'https://example.com';

// 無法直接在新分頁中開啟，但可配合其他方法使用`,
  },
]);

// 方法執行函數
const executeMethod = (methodId) => {
  const url = "https://example.com";

  switch (methodId) {
    case "windowOpen":
      window.open(url, "_blank", "noopener,noreferrer");
      break;
    case "anchorTag":
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      break;
    case "formSubmit":
      const form = document.createElement("form");
      form.method = "GET";
      form.action = url;
      form.target = "_blank";
      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
      break;
    case "locationHref":
      window.location.href = url;
      break;
  }
};

// 自定義 URL 開啟函數
const openCustomUrl = (target) => {
  if (!customUrl.value) {
    alert("請輸入有效的網址");
    return;
  }

  // 驗證 URL 格式
  try {
    new URL(customUrl.value);
  } catch {
    alert("請輸入有效的網址格式 (例如: https://example.com)");
    return;
  }

  // 構建 rel 屬性
  let rel = "";
  if (options.noopener) rel += "noopener ";
  if (options.noreferrer) rel += "noreferrer";
  rel = rel.trim();

  // 開啟 URL
  if (target === "_blank") {
    window.open(customUrl.value, "_blank", rel);
  } else {
    window.location.href = customUrl.value;
  }
};
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  padding: 30px;
  overflow: hidden;
}

header {
  text-align: center;
  margin-bottom: 40px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eaeaea;
}

h1 {
  color: #2575fc;
  margin-bottom: 10px;
  font-size: 2.5rem;
}

.subtitle {
  color: #666;
  font-size: 1.2rem;
}

.methods-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 25px;
  margin-bottom: 40px;
}

.method-card {
  background: white;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  padding: 25px;
  transition: transform 0.3s, box-shadow 0.3s;
  border-top: 4px solid #2575fc;
}

.method-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
}

.method-title {
  color: #2575fc;
  margin-bottom: 15px;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
}

.method-icon {
  margin-right: 10px;
  font-size: 1.8rem;
}

.method-description {
  margin-bottom: 20px;
  color: #555;
}

.code-block {
  background: #2d2d2d;
  color: #f8f8f2;
  padding: 15px;
  border-radius: 8px;
  font-family: "Courier New", monospace;
  margin-bottom: 20px;
  overflow-x: auto;
  font-size: 0.9rem;
}

pre {
  margin: 0;
  white-space: pre-wrap;
}

.demo-section {
  background: #f8f9fa;
  padding: 25px;
  border-radius: 10px;
  margin-top: 30px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
}

.demo-title {
  color: #2575fc;
  margin-bottom: 20px;
  font-size: 1.8rem;
  text-align: center;
}

.demo-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  justify-content: center;
  margin-bottom: 20px;
}

.url-input {
  flex: 1;
  min-width: 250px;
  padding: 12px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.url-input:focus {
  outline: none;
  border-color: #2575fc;
}

.demo-btn {
  background: #2575fc;
  color: white;
  border: none;
  padding: 12px 25px;
  border-radius: 50px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s;
  box-shadow: 0 4px 6px rgba(37, 117, 252, 0.3);
}

.demo-btn:hover {
  background: #1a68e3;
  transform: translateY(-2px);
  box-shadow: 0 6px 8px rgba(37, 117, 252, 0.4);
}

.demo-btn.secondary {
  background: #6c757d;
  box-shadow: 0 4px 6px rgba(108, 117, 125, 0.3);
}

.demo-btn.secondary:hover {
  background: #5a6268;
  box-shadow: 0 6px 8px rgba(108, 117, 125, 0.4);
}

.options {
  display: flex;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
}

.option {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.option input {
  cursor: pointer;
}

.info-section {
  background: #e7f3ff;
  padding: 20px;
  border-radius: 10px;
  margin-top: 30px;
}

.info-section h2 {
  color: #2575fc;
  margin-bottom: 15px;
}

.info-section ul {
  padding-left: 20px;
}

.info-section li {
  margin-bottom: 10px;
  color: #555;
}

code {
  background: #f1f1f1;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: "Courier New", monospace;
}

@media (max-width: 768px) {
  .container {
    padding: 20px;
  }

  h1 {
    font-size: 2rem;
  }

  .methods-grid {
    grid-template-columns: 1fr;
  }

  .demo-controls {
    flex-direction: column;
  }

  .url-input {
    min-width: auto;
  }
}
</style>
