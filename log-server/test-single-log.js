// test-single-log.js - 測試單筆日誌寫入

/**
 * 測試單筆日誌寫入到 MongoDB
 * 使用方式: node test-single-log.js
 */

const BASE_URL = "http://localhost:3002";

async function testSingleLog() {
  console.log("🧪 開始測試單筆日誌寫入...\n");

  // 準備測試資料
  const logEntry = {
    endpoint: "/api/items/test",
    method: "POST",
    status: 201,
    success: true,
    responseTime: 125,
    timestamp: new Date().toISOString(),
    userAgent: "Mozilla/5.0 (Test Client)",
    url: "http://localhost:3000/test",
    requestBody: {
      title: "Test Item",
      description: "This is a test log entry",
    },
    responseData: {
      id: 1001,
      title: "Test Item",
      created_at: new Date().toISOString(),
    },
    context: {
      service: "test-service",
      operation: "create",
      userId: "test-user-123",
    },
  };

  console.log("📝 測試資料:");
  console.log(JSON.stringify(logEntry, null, 2));
  console.log("\n📤 發送請求到:", `${BASE_URL}/mongo/logentry/`);

  try {
    const response = await fetch(`${BASE_URL}/mongo/logentry/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(logEntry),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log("\n✅ 成功寫入日誌！");
      console.log("📊 回應結果:");
      console.log(JSON.stringify(result, null, 2));
      console.log(`\n🎉 日誌 ID: ${result.id}`);
      return true;
    } else {
      console.log("\n❌ 寫入失敗！");
      console.log("錯誤訊息:", result.message);
      return false;
    }
  } catch (error) {
    console.error("\n💥 請求失敗:", error.message);
    console.error("提示: 請確認服務器是否正在運行 (npm start)");
    return false;
  }
}

// 執行測試
testSingleLog()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("測試過程發生錯誤:", error);
    process.exit(1);
  });
