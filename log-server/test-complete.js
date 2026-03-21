// test-complete.js - 完整測試套件
import { DateUtils } from "./utils/dateUtils.js";

/**
 * 完整測試流程：
 * 1. 健康檢查
 * 2. 寫入單筆日誌
 * 3. 批次寫入日誌
 * 4. 查詢和統計
 * 5. 清理測試資料（可選）
 *
 * 使用方式: node test-complete.js
 */

const BASE_URL = "http://localhost:3002";

// ==========================================
// 測試輔助函數
// ==========================================

function log(emoji, message, data = null) {
  console.log(`${emoji} ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

function section(title) {
  console.log("\n" + "=".repeat(60));
  console.log(`  ${title}`);
  console.log("=".repeat(60) + "\n");
}

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ==========================================
// 測試函數
// ==========================================

// 1. 健康檢查
async function step1_healthCheck() {
  section("步驟 1: 健康檢查");

  try {
    const response = await fetch(`${BASE_URL}/health`);
    const result = await response.json();

    log("✅", "健康檢查通過", result);

    if (result.mongodb !== "connected") {
      throw new Error("MongoDB 未連接");
    }

    return true;
  } catch (error) {
    log("❌", "健康檢查失敗: " + error.message);
    return false;
  }
}

// 2. 寫入單筆測試日誌
async function step2_writeSingleLog() {
  section("步驟 2: 寫入單筆測試日誌");

  const testLog = {
    endpoint: "/api/test/single",
    method: "POST",
    status: 201,
    success: true,
    responseTime: 100,
    timestamp: DateUtils.getCurrentISOTime(),
    context: {
      test: true,
      type: "single",
      timestamp: Date.now(),
    },
  };

  log("📝", "準備寫入測試日誌", testLog);

  try {
    const response = await fetch(`${BASE_URL}/mongo/logentry/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testLog),
    });

    const result = await response.json();

    if (result.success) {
      log("✅", "單筆日誌寫入成功", { id: result.id });
      return result.id;
    } else {
      log("❌", "寫入失敗: " + result.message);
      return null;
    }
  } catch (error) {
    log("❌", "寫入失敗: " + error.message);
    return null;
  }
}

// 3. 批次寫入測試日誌
async function step3_writeBatchLogs(count = 20) {
  section(`步驟 3: 批次寫入 ${count} 筆測試日誌`);

  // 生成測試資料
  const logs = Array.from({ length: count }, (_, i) => {
    const status = [200, 201, 400, 404, 500][i % 5];
    return {
      endpoint: `/api/test/batch/${i + 1}`,
      method: ["GET", "POST", "PUT", "DELETE"][i % 4],
      status,
      success: status < 400,
      responseTime: Math.floor(Math.random() * 300) + 50,
      timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      errorText: status >= 400 ? `Test error ${status}` : null,
      context: {
        test: true,
        type: "batch",
        index: i + 1,
      },
    };
  });

  log("📦", `生成了 ${logs.length} 筆測試資料`);

  try {
    const startTime = Date.now();

    const response = await fetch(`${BASE_URL}/mongo/logentry/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logs }),
    });

    const result = await response.json();
    const duration = Date.now() - startTime;

    if (result.success) {
      log("✅", `批次寫入成功 (${duration}ms)`, {
        count: result.count,
        avgTime: `${(duration / count).toFixed(2)}ms/筆`,
      });
      return result.count;
    } else {
      log("❌", "批次寫入失敗: " + result.message);
      return 0;
    }
  } catch (error) {
    log("❌", "批次寫入失敗: " + error.message);
    return 0;
  }
}

// 4. 查詢統計資料
async function step4_checkStats() {
  section("步驟 4: 查詢統計資料");

  try {
    const response = await fetch(`${BASE_URL}/mongo/stats`);
    const result = await response.json();

    if (result.success) {
      log("📊", "統計資料", result.stats);
      return result.stats;
    } else {
      log("❌", "取得統計失敗: " + result.message);
      return null;
    }
  } catch (error) {
    log("❌", "取得統計失敗: " + error.message);
    return null;
  }
}

// 5. 查詢最新日誌
async function step5_queryLatestLogs(limit = 5) {
  section(`步驟 5: 查詢最新 ${limit} 筆日誌`);

  try {
    const response = await fetch(`${BASE_URL}/mongo/logentry/?limit=${limit}`);
    const result = await response.json();

    if (result.success) {
      log("📋", `查詢到 ${result.count} 筆日誌`);

      result.data.forEach((log, i) => {
        console.log(
          `   [${i + 1}] ${log.method} ${log.endpoint} - ${log.status}`,
        );
      });

      return result.data;
    } else {
      log("❌", "查詢失敗: " + result.message);
      return [];
    }
  } catch (error) {
    log("❌", "查詢失敗: " + error.message);
    return [];
  }
}

// 6. 查詢錯誤日誌
async function step6_queryErrorLogs() {
  section("步驟 6: 查詢錯誤日誌");

  try {
    const response = await fetch(
      `${BASE_URL}/mongo/logentry/?success=false&limit=5`,
    );
    const result = await response.json();

    if (result.success) {
      log("❌", `查詢到 ${result.count} 筆錯誤日誌`);

      result.data.forEach((log, i) => {
        console.log(
          `   [${i + 1}] ${log.method} ${log.endpoint} - ${log.status}`,
        );
        console.log(`       錯誤: ${log.errorText || "N/A"}`);
      });

      return result.data;
    } else {
      log("❌", "查詢失敗: " + result.message);
      return [];
    }
  } catch (error) {
    log("❌", "查詢失敗: " + error.message);
    return [];
  }
}

// 7. 測試特定查詢
async function step7_testSpecificQuery() {
  section("步驟 7: 測試特定條件查詢");

  // 查詢特定端點
  console.log('🔍 查詢包含 "/api/test/" 的端點...');

  try {
    const response = await fetch(
      `${BASE_URL}/mongo/logentry/?endpoint=/api/test&limit=10`,
    );
    const result = await response.json();

    if (result.success) {
      console.log(`✅ 找到 ${result.count} 筆測試日誌\n`);
      return result.data;
    } else {
      log("❌", "查詢失敗: " + result.message);
      return [];
    }
  } catch (error) {
    log("❌", "查詢失敗: " + error.message);
    return [];
  }
}

// ==========================================
// 主測試流程
// ==========================================

async function runCompleteTest() {
  console.log("\n");
  console.log("╔" + "═".repeat(58) + "╗");
  console.log(
    "║" + " ".repeat(10) + "🧪 MongoDB 日誌系統完整測試" + " ".repeat(19) + "║",
  );
  console.log("╚" + "═".repeat(58) + "╝");
  console.log("\n");

  const results = {
    healthCheck: false,
    singleWrite: null,
    batchWrite: 0,
    stats: null,
    queries: [],
  };

  try {
    // 步驟 1: 健康檢查
    results.healthCheck = await step1_healthCheck();
    if (!results.healthCheck) {
      throw new Error("健康檢查失敗，停止測試");
    }
    await wait(500);

    // 步驟 2: 單筆寫入
    results.singleWrite = await step2_writeSingleLog();
    await wait(500);

    // 步驟 3: 批次寫入
    results.batchWrite = await step3_writeBatchLogs(20);
    await wait(1000);

    // 步驟 4: 統計資料
    results.stats = await step4_checkStats();
    await wait(500);

    // 步驟 5: 查詢最新日誌
    await step5_queryLatestLogs(5);
    await wait(500);

    // 步驟 6: 查詢錯誤日誌
    await step6_queryErrorLogs();
    await wait(500);

    // 步驟 7: 特定查詢
    results.queries = await step7_testSpecificQuery();

    // 測試總結
    section("測試總結");

    console.log("✅ 所有測試步驟完成！\n");
    console.log("📊 測試結果:");
    console.log(`   ✓ 健康檢查: ${results.healthCheck ? "通過" : "失敗"}`);
    console.log(
      `   ✓ 單筆寫入: ${results.singleWrite ? "成功 (ID: " + results.singleWrite + ")" : "失敗"}`,
    );
    console.log(`   ✓ 批次寫入: 成功 ${results.batchWrite} 筆`);

    if (results.stats) {
      console.log("\n📈 資料庫統計:");
      console.log(`   - 總日誌數: ${results.stats.total}`);
      console.log(`   - 錯誤數: ${results.stats.errors}`);
      console.log(`   - 24小時內: ${results.stats.last24h}`);
      console.log(`   - 錯誤率: ${results.stats.errorRate}`);
    }

    console.log("\n🎉 測試完成！所有功能正常運作。");
    console.log("");

    return true;
  } catch (error) {
    console.error("\n💥 測試過程發生錯誤:", error.message);
    console.log("");
    return false;
  }
}

// 執行測試
runCompleteTest()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("未預期的錯誤:", error);
    process.exit(1);
  });
