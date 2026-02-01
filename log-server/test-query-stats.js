// test-query-stats.js - 測試查詢和統計功能

/**
 * 測試查詢日誌和統計資料
 * 使用方式: node test-query-stats.js
 */

const BASE_URL = "http://localhost:3002";

// 測試健康檢查
async function testHealth() {
  console.log("🏥 測試健康檢查...");

  try {
    const response = await fetch(`${BASE_URL}/health`);
    const result = await response.json();

    console.log("✅ 健康檢查回應:");
    console.log(JSON.stringify(result, null, 2));
    console.log("");

    return result.mongodb === "connected";
  } catch (error) {
    console.error("❌ 健康檢查失敗:", error.message);
    return false;
  }
}

// 測試統計資料
async function testStats() {
  console.log("📊 測試統計資料...");

  try {
    const response = await fetch(`${BASE_URL}/mongo/stats`);
    const result = await response.json();

    if (result.success) {
      console.log("✅ 統計資料:");
      console.log(JSON.stringify(result.stats, null, 2));
      console.log("");
      return result.stats;
    } else {
      console.error("❌ 取得統計資料失敗:", result.message);
      return null;
    }
  } catch (error) {
    console.error("❌ 請求失敗:", error.message);
    return null;
  }
}

// 測試查詢所有日誌（限制數量）
async function testQueryAll(limit = 10) {
  console.log(`📋 測試查詢最新 ${limit} 筆日誌...`);

  try {
    const response = await fetch(`${BASE_URL}/mongo/logentry/?limit=${limit}`);
    const result = await response.json();

    if (result.success) {
      console.log(`✅ 查詢到 ${result.count} 筆日誌`);

      if (result.data.length > 0) {
        console.log("\n📄 最新一筆日誌:");
        console.log(JSON.stringify(result.data[0], null, 2));
      }

      console.log("");
      return result.data;
    } else {
      console.error("❌ 查詢失敗:", result.message);
      return [];
    }
  } catch (error) {
    console.error("❌ 請求失敗:", error.message);
    return [];
  }
}

// 測試條件查詢（只查詢錯誤日誌）
async function testQueryErrors(limit = 5) {
  console.log(`❌ 測試查詢錯誤日誌（最多 ${limit} 筆）...`);

  try {
    const response = await fetch(
      `${BASE_URL}/mongo/logentry/?success=false&limit=${limit}`,
    );
    const result = await response.json();

    if (result.success) {
      console.log(`✅ 查詢到 ${result.count} 筆錯誤日誌`);

      if (result.data.length > 0) {
        console.log("\n📄 錯誤日誌範例:");
        result.data.slice(0, 2).forEach((log, i) => {
          console.log(
            `\n[${i + 1}] ${log.method} ${log.endpoint} - ${log.status}`,
          );
          console.log(`    錯誤: ${log.errorText || "N/A"}`);
          console.log(`    時間: ${log.timestamp}`);
        });
      }

      console.log("");
      return result.data;
    } else {
      console.error("❌ 查詢失敗:", result.message);
      return [];
    }
  } catch (error) {
    console.error("❌ 請求失敗:", error.message);
    return [];
  }
}

// 測試特定端點查詢
async function testQueryByEndpoint(endpoint = "/api/items") {
  console.log(`🔍 測試查詢特定端點: ${endpoint}...`);

  try {
    const response = await fetch(
      `${BASE_URL}/mongo/logentry/?endpoint=${encodeURIComponent(endpoint)}&limit=5`,
    );
    const result = await response.json();

    if (result.success) {
      console.log(`✅ 查詢到 ${result.count} 筆日誌`);

      if (result.data.length > 0) {
        console.log("\n📋 查詢結果:");
        result.data.forEach((log, i) => {
          console.log(
            `[${i + 1}] ${log.method} ${log.endpoint} - ${log.status} (${log.success ? "成功" : "失敗"})`,
          );
        });
      } else {
        console.log("   沒有找到匹配的日誌");
      }

      console.log("");
      return result.data;
    } else {
      console.error("❌ 查詢失敗:", result.message);
      return [];
    }
  } catch (error) {
    console.error("❌ 請求失敗:", error.message);
    return [];
  }
}

// 測試日期範圍查詢
async function testQueryByDateRange() {
  console.log("📅 測試日期範圍查詢（今天的日誌）...");

  const today = new Date();
  const dateFrom = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const dateTo = new Date(dateFrom.getTime() + 24 * 60 * 60 * 1000);

  try {
    const response = await fetch(
      `${BASE_URL}/mongo/logentry/?dateFrom=${dateFrom.toISOString()}&dateTo=${dateTo.toISOString()}&limit=10`,
    );
    const result = await response.json();

    if (result.success) {
      console.log(`✅ 今天共有 ${result.count} 筆日誌`);
      console.log(
        `   日期範圍: ${dateFrom.toLocaleDateString()} - ${dateTo.toLocaleDateString()}`,
      );
      console.log("");
      return result.data;
    } else {
      console.error("❌ 查詢失敗:", result.message);
      return [];
    }
  } catch (error) {
    console.error("❌ 請求失敗:", error.message);
    return [];
  }
}

// 主測試流程
async function runAllTests() {
  console.log("🧪 開始執行完整測試套件...\n");
  console.log("=".repeat(50));
  console.log("\n");

  // 1. 健康檢查
  const isHealthy = await testHealth();
  if (!isHealthy) {
    console.error("❌ MongoDB 未連接，停止測試");
    return false;
  }

  // 2. 統計資料
  const stats = await testStats();

  // 3. 查詢所有日誌
  await testQueryAll(10);

  // 4. 查詢錯誤日誌
  await testQueryErrors(5);

  // 5. 查詢特定端點
  await testQueryByEndpoint("/api/items");

  // 6. 日期範圍查詢
  await testQueryByDateRange();

  console.log("=".repeat(50));
  console.log("\n✅ 所有測試完成！\n");

  // 總結
  if (stats) {
    console.log("📊 資料庫總結:");
    console.log(`   - 總日誌數: ${stats.total}`);
    console.log(`   - 錯誤數: ${stats.errors}`);
    console.log(`   - 24小時內: ${stats.last24h}`);
    console.log(`   - 錯誤率: ${stats.errorRate}`);
  }

  return true;
}

// 執行測試
runAllTests()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("測試過程發生錯誤:", error);
    process.exit(1);
  });
