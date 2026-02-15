#!/usr/bin/env node
// scripts/stress-test-mydata-query.js
// MyData API 查詢壓力測試

const http = require("http");

const RUST_URL = process.env.RUST_URL || "http://localhost:3000";
const INTERVAL_MS = parseInt(process.env.INTERVAL_MS) || 100; // 預設 100ms 查詢一次
const CONCURRENT = parseInt(process.env.CONCURRENT) || 5; // 並發請求數

let queryCount = 0;
let errorCount = 0;
let totalResponseTime = 0;
let running = true;

async function request(endpoint, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, RUST_URL);
    const startTime = Date.now();

    const reqOptions = {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    };

    const req = http.request(url, reqOptions, (response) => {
      let data = "";
      response.on("data", (chunk) => (data += chunk));
      response.on("end", () => {
        const responseTime = Date.now() - startTime;
        try {
          resolve({
            status: response.statusCode,
            data: data ? JSON.parse(data) : {},
            responseTime,
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

async function queryMyData() {
  try {
    const result = await request("/api/my-data?limit=100&offset=0");

    if (result.status === 200) {
      queryCount++;
      totalResponseTime += result.responseTime;
      const avgTime = Math.round(totalResponseTime / queryCount);
      process.stdout.write(
        `\r✅ 查詢: ${queryCount} 次 共 ${queryCount * 100} 筆 | 錯誤: ${errorCount} 次 | 平均響應: ${avgTime}ms | 最後: ${result.responseTime}ms`,
      );
    } else {
      errorCount++;
      process.stdout.write(
        `\r❌ 查詢失敗 (${result.status}) | 查詢: ${queryCount} 次 | 錯誤: ${errorCount} 次`,
      );
    }
  } catch (error) {
    errorCount++;
    process.stdout.write(
      `\r❌ 錯誤: ${error.message.slice(0, 30)} | 查詢: ${queryCount} 次 | 錯誤: ${errorCount} 次`,
    );
  }
}

async function concurrentQuery() {
  const promises = [];
  for (let i = 0; i < CONCURRENT; i++) {
    promises.push(queryMyData());
  }
  await Promise.all(promises);
}

async function main() {
  console.log("🔥 MyData API 查詢壓力測試啟動");
  console.log(`📊 設定: 每 ${INTERVAL_MS}ms 發送 ${CONCURRENT} 個並發請求`);
  console.log("💡 按 Ctrl+C 停止測試\n");

  // 測試連接
  try {
    await request("/health");
    console.log("✅ Rust 服務連接成功\n");
  } catch (error) {
    console.error("❌ 無法連接 Rust 服務:", error.message);
    process.exit(1);
  }

  // 開始查詢循環
  const interval = setInterval(async () => {
    if (running) {
      await concurrentQuery();
    }
  }, INTERVAL_MS);

  // 優雅關閉
  process.on("SIGINT", () => {
    console.log("\n\n🛑 停止測試...");
    running = false;
    clearInterval(interval);
    const avgTime =
      queryCount > 0 ? Math.round(totalResponseTime / queryCount) : 0;
    console.log(`\n📊 最終統計:`);
    console.log(`   ✅ 成功查詢: ${queryCount} 次`);
    console.log(`   ❌ 失敗: ${errorCount} 次`);
    console.log(`   ⏱️  平均響應時間: ${avgTime}ms`);
    console.log(
      `   📈 QPS: ${Math.round(queryCount / ((Date.now() - startTime) / 1000))}`,
    );
    process.exit(0);
  });

  const startTime = Date.now();
}

main().catch(console.error);
