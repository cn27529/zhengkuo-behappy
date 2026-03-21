#!/usr/bin/env node
// scripts/stress-test-wal.js
// WAL 機制壓力測試 - 頻繁寫入數據

const https = require("https");
const http = require("http");

const DIRECTUS_URL = process.env.DIRECTUS_URL || "http://0.0.0.0:8055";
const INTERVAL_MS = parseInt(process.env.INTERVAL_MS) || 500; // 預設 500ms 寫入一次
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE) || 1; // 每次寫入筆數

let writeCount = 0;
let errorCount = 0;
let running = true;

async function request(endpoint, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, DIRECTUS_URL);
    const lib = url.protocol === "https:" ? https : http;

    const reqOptions = {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    };

    const req = lib.request(url, reqOptions, (response) => {
      let data = "";
      response.on("data", (chunk) => (data += chunk));
      response.on("end", () => {
        try {
          resolve({
            status: response.statusCode,
            data: data ? JSON.parse(data) : {},
          });
        } catch (error) {
          reject(new Error(`JSON 解析錯誤: ${error.message}`));
        }
      });
    });

    req.on("error", reject);
    if (options.body) req.write(JSON.stringify(options.body));
    req.end();
  });
}

async function writeData() {
  const timestamp = Date.now();
  const data = {
    formName: `WAL測試-${timestamp}`,
    state: "draft",
    contact: {
      name: `測試用戶-${writeCount}`,
      phone: `02-${String(timestamp).slice(-8)}`,
      mobile: `09${String(timestamp).slice(-8)}`,
      relationship: "測試",
    },
  };

  try {
    const result = await request("/items/mydata", {
      method: "POST",
      body: data,
    });

    if (result.status === 200) {
      writeCount++;
      process.stdout.write(
        `\r✅ 已寫入: ${writeCount} 筆 | 錯誤: ${errorCount} 筆`,
      );
    } else {
      errorCount++;
      process.stdout.write(
        `\r❌ 寫入失敗 (${result.status}) | 已寫入: ${writeCount} 筆 | 錯誤: ${errorCount} 筆`,
      );
    }
  } catch (error) {
    errorCount++;
    process.stdout.write(
      `\r❌ 錯誤: ${error.message.slice(0, 30)} | 已寫入: ${writeCount} 筆 | 錯誤: ${errorCount} 筆`,
    );
  }
}

async function batchWrite() {
  const promises = [];
  for (let i = 0; i < BATCH_SIZE; i++) {
    promises.push(writeData());
  }
  await Promise.all(promises);
}

async function main() {
  console.log("🔥 WAL 壓力測試啟動");
  console.log(`📊 設定: 每 ${INTERVAL_MS}ms 寫入 ${BATCH_SIZE} 筆`);
  console.log("💡 按 Ctrl+C 停止測試\n");

  // 測試連接
  try {
    await request("/server/info");
    console.log("✅ Directus 連接成功\n");
  } catch (error) {
    console.error("❌ 無法連接 Directus:", error.message);
    process.exit(1);
  }

  // 開始寫入循環
  const interval = setInterval(async () => {
    if (running) {
      await batchWrite();
    }
  }, INTERVAL_MS);

  // 優雅關閉
  process.on("SIGINT", () => {
    console.log("\n\n🛑 停止測試...");
    running = false;
    clearInterval(interval);
    console.log(`\n📊 最終統計:`);
    console.log(`   ✅ 成功寫入: ${writeCount} 筆`);
    console.log(`   ❌ 失敗: ${errorCount} 筆`);
    console.log(`\n💡 現在可以停止 Rust 服務來驗證 WAL checkpoint`);
    process.exit(0);
  });
}

main().catch(console.error);
