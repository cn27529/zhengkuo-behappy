// test_logger.js

const SERVER_URL = "http://localhost:3002/mongo/logentry/";

const testLog = {
  timestamp: new Date().toISOString(),
  endpoint: "http://localhost:8055/items/activityDB",
  method: "POST",
  status: 200,
  statusText: "OK",
  context: {
    service: "ActivityService",
    operation: "createActivity",
    startTime: Date.now(),
    method: "POST",
    endpoint: "http://localhost:8055/items/activityDB",
    requestBody: { name: "測試法會", participants: 50 },
    duration: 120,
  },
  duration: 120,
  success: true,
  error: false,
  userAgent: "Mozilla/5.0 (Test Script)",
  url: "http://localhost:5173/test",
};

async function sendTestLog() {
  try {
    console.log("📤 正在發送測試日誌...");
    const response = await fetch(SERVER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testLog),
    });

    const result = await response.json();
    console.log("✅ 服務器回應:", result);
  } catch (error) {
    console.error("❌ 發送失敗:", error.message);
  }
}

// 發送單條
sendTestLog();

// 若要測試批次接口，可使用以下數據和端點 /mongo/logentry/batch
const batchData = { logs: [testLog, { ...testLog, id: "test-id-2" }] };
