#!/usr/bin/env node

// check-log-server.js - 檢查日誌服務器狀態
const LOG_SERVER_URL = "http://localhost:3002";

async function checkLogServer() {
  try {
    console.log("🔍 檢查日誌服務器狀態...");

    const response = await fetch(`${LOG_SERVER_URL}/health`);
    const data = await response.json();

    if (response.ok && data.status === "ok") {
      console.log("✅ 日誌服務器運行正常");
      console.log(`📊 MongoDB 狀態: ${data.mongodb}`);
      console.log(`🕐 服務器時間: ${data.timestamp}`);
      console.log(`⚡ 運行時間: ${data.uptime}ms`);

      // 檢查統計資料
      const statsResponse = await fetch(`${LOG_SERVER_URL}/mongo/stats`);
      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        console.log(`📈 總日誌數: ${stats.total}`);
        console.log(`❌ 錯誤數: ${stats.errors}`);
        console.log(`📅 24小時內: ${stats.last24h}`);
      }
    } else {
      console.log("❌ 日誌服務器回應異常");
      console.log(data);
    }
  } catch (error) {
    console.log("❌ 無法連接到日誌服務器");
    console.log("💡 請確認服務器是否已啟動:");
    console.log("   cd log-server && node mongoDBLogger.js");
    console.log(`   或訪問: ${LOG_SERVER_URL}/health`);
  }
}

checkLogServer();
