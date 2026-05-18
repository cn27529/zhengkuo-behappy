#!/usr/bin/env node
// scripts/import-from-export-json.js
// 將 db/EXPORT.json 資料逐筆寫入 registrationDB

const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");

const DIRECTUS_URL = "http://localhost:8055";
const DIRECTUS_TOKEN = "";
const DIRECTUS_EMAIL = "admin@example.com";
const DIRECTUS_PASSWORD = "123456";
const CONCURRENCY = 5; // 同時並發數

const records = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../db/EXPORT.json"), "utf-8"),
);

let successCount = 0;
let errorCount = 0;

let authToken = DIRECTUS_TOKEN;

async function login() {
  if (authToken) return;
  const result = await request("/auth/login", {
    method: "POST",
    body: { email: DIRECTUS_EMAIL, password: DIRECTUS_PASSWORD },
  });
  if (!result.data?.data?.access_token) {
    throw new Error("登入失敗: " + JSON.stringify(result.data));
  }
  authToken = result.data.data.access_token;
  console.log("✅ 登入成功，取得 token\n");
}


async function request(endpoint, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, DIRECTUS_URL);
    const lib = url.protocol === "https:" ? https : http;

    const reqOptions = {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
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

async function importRecord(record) {
  const payload = {
    state: record.state,
    formId: record.formId,
    formName: record.formName,
    formSource: record.formSource,
    updatedAt: record.updatedAt,
    contact: record.contact,
    blessing: record.blessing,
    salvation: record.salvation,
  };

  try {
    const result = await request("/items/registrationDB", {
      method: "POST",
      body: payload,
    });

    if (result.status === 200 || result.status === 201) {
      successCount++;
    } else {
      errorCount++;
      console.error(
        `\n❌ 第 ${record.id} 筆失敗 (HTTP ${result.status}):`,
        JSON.stringify(result.data).slice(0, 100),
      );
    }
  } catch (error) {
    errorCount++;
    console.error(`\n❌ 第 ${record.id} 筆錯誤: ${error.message}`);
  }

  process.stdout.write(
    `\r✅ 成功: ${successCount} | ❌ 失敗: ${errorCount} | 進度: ${successCount + errorCount}/${records.length}`,
  );
}

async function main() {
  console.log(`📦 載入 ${records.length} 筆資料`);
  console.log(`🚀 並發數: ${CONCURRENCY}`);

  // 登入取得 token
  await login();

  // 測試連接
  try {
    await request("/server/info");
    console.log("✅ Directus 連接成功\n");
  } catch (error) {
    console.error("❌ 無法連接 Directus:", error.message);
    process.exit(1);
  }

  // 分批並發寫入
  for (let i = 0; i < records.length; i += CONCURRENCY) {
    const batch = records.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map(importRecord));
  }

  console.log("\n\n📊 匯入完成:");
  console.log(`   ✅ 成功: ${successCount} 筆`);
  console.log(`   ❌ 失敗: ${errorCount} 筆`);
}

main().catch(console.error);
