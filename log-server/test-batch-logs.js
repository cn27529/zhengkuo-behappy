// test-batch-logs.js - 測試批次日誌寫入

/**
 * 測試批次寫入多筆日誌到 MongoDB
 * 使用方式: node test-batch-logs.js
 */

const BASE_URL = "http://localhost:3002";

// 生成隨機 HTTP 狀態碼
function randomStatus() {
  const statuses = [200, 201, 400, 404, 500];
  return statuses[Math.floor(Math.random() * statuses.length)];
}

// 生成隨機 HTTP 方法
function randomMethod() {
  const methods = ["GET", "POST", "PUT", "DELETE", "PATCH"];
  return methods[Math.floor(Math.random() * methods.length)];
}

// 生成隨機端點
function randomEndpoint() {
  const endpoints = [
    "/api/items",
    "/api/users",
    "/api/orders",
    "/api/products",
    "/api/categories",
  ];
  return endpoints[Math.floor(Math.random() * endpoints.length)];
}

// 生成測試日誌
function generateTestLog(index) {
  const status = randomStatus();
  const method = randomMethod();

  return {
    endpoint: randomEndpoint(),
    method,
    status,
    success: status < 400,
    responseTime: Math.floor(Math.random() * 500) + 50,
    timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
    userAgent: "Mozilla/5.0 (Test Client)",
    url: `http://localhost:3000/test-${index}`,
    requestBody:
      method !== "GET"
        ? {
            data: `Test data ${index}`,
            timestamp: new Date().toISOString(),
          }
        : null,
    responseData:
      status < 400
        ? {
            id: 1000 + index,
            result: "success",
          }
        : null,
    errorText: status >= 400 ? `Error ${status}: Something went wrong` : null,
    context: {
      service: "test-service",
      operation: method.toLowerCase(),
      testRun: true,
      batchIndex: index,
    },
  };
}

async function testBatchLogs(count = 10) {
  console.log(`🧪 開始測試批次寫入 ${count} 筆日誌...\n`);

  // 生成測試資料
  const logs = Array.from({ length: count }, (_, i) => generateTestLog(i + 1));

  console.log("📝 生成了", logs.length, "筆測試資料");
  console.log("📋 範例資料 (第一筆):");
  console.log(JSON.stringify(logs[0], null, 2));
  console.log("\n📤 發送批次請求到:", `${BASE_URL}/mongo/logentry/batch`);

  try {
    const startTime = Date.now();

    const response = await fetch(`${BASE_URL}/mongo/logentry/batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ logs }),
    });

    const result = await response.json();
    const duration = Date.now() - startTime;

    if (response.ok && result.success) {
      console.log("\n✅ 批次寫入成功！");
      console.log("📊 回應結果:");
      console.log(JSON.stringify(result, null, 2));
      console.log(`\n⏱️  耗時: ${duration}ms`);
      console.log(`📈 平均每筆: ${(duration / count).toFixed(2)}ms`);

      // 顯示統計
      const successCount = logs.filter((log) => log.success).length;
      const errorCount = logs.filter((log) => !log.success).length;
      console.log(`\n📊 測試資料統計:`);
      console.log(`   - 總數: ${logs.length}`);
      console.log(`   - 成功: ${successCount}`);
      console.log(`   - 錯誤: ${errorCount}`);

      return true;
    } else {
      console.log("\n❌ 批次寫入失敗！");
      console.log("錯誤訊息:", result.message);
      return false;
    }
  } catch (error) {
    console.error("\n💥 請求失敗:", error.message);
    console.error("提示: 請確認服務器是否正在運行 (npm start)");
    return false;
  }
}

// 從命令行參數獲取數量，預設為 10
const count = parseInt(process.argv[2]) || 10;

// 執行測試
testBatchLogs(count)
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("測試過程發生錯誤:", error);
    process.exit(1);
  });
