<template>
  <div class="p-6 max-w-3xl mx-auto space-y-4">
    <h1 class="text-2xl font-bold text-blue-700">🔹 Generate Git Hash 測試頁面</h1>

    <div class="space-y-2">
      <p>目前環境：<strong>{{ environment }}</strong></p>
      <button
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        @click="generateHashes"
      >
        重新生成哈希
      </button>
      <button
        class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        @click="testUniquenessAsync"
      >
        測試唯一性 (瀏覽器版)
      </button>
    </div>

    <div class="border p-4 rounded bg-gray-50">
      <h2 class="text-lg font-semibold mb-2">生成結果：</h2>
      <ul class="space-y-1">
        <li v-for="(hash, idx) in hashes" :key="idx" class="font-mono text-gray-700">
          {{ idx + 1 }}. {{ hash }}
        </li>
      </ul>
    </div>

    <div v-if="testResult" class="border p-4 rounded bg-green-50">
      <h2 class="text-lg font-semibold mb-2">唯一性測試結果：</h2>
      <pre class="text-sm">{{ testResult }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import {
  generateGitHash,
  generateGitHashBrowser,
  testUniqueness,
} from "@/utils/generateGitHash.js"; // ✅ 根據你的實際路徑調整

const hashes = ref([]);
const testResult = ref(null);

const environment =
  typeof window !== "undefined" && typeof window.document !== "undefined"
    ? "Browser"
    : "Node.js";

// 生成多個哈希
async function generateHashes() {
  hashes.value = [];
  for (let i = 0; i < 10; i++) {
    // 使用瀏覽器的異步版本確保兼容
    const hash = await generateGitHashBrowser("data-" + i);
    hashes.value.push(hash);
  }
}

// 測試唯一性（瀏覽器版）
async function testUniquenessAsync() {
  testResult.value = "測試中...";
  const result = await testUniqueness(200, true);
  testResult.value = JSON.stringify(result, null, 2);
}

// 頁面初始化自動生成
generateHashes();
</script>

<style scoped>
button {
  transition: background-color 0.2s ease;
}
</style>
