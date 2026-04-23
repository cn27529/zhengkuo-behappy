#!/usr/bin/env node
// scripts/check-db-locks-detailed.js
// 詳細檢查 SQLite 資料庫鎖定狀態

const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const dbDir = path.join(__dirname, "..", "db");
const currentDb = path.join(dbDir, "current.db");

console.log("🔍 詳細檢查資料庫鎖定狀態\n");

// 解析 current.db 連結
let targetDb = currentDb;
if (fs.existsSync(currentDb)) {
  const stats = fs.lstatSync(currentDb);
  if (stats.isSymbolicLink()) {
    const target = fs.readlinkSync(currentDb);
    targetDb = path.join(dbDir, target);
    console.log(`🔗 current.db -> ${target}\n`);
  }
}

try {
  // 使用 readonly 模式打開，避免影響鎖定狀態
  const db = new Database(targetDb, { readonly: true });

  // 1. 檢查 WAL 模式
  console.log("📊 資料庫模式:");
  const journalMode = db.pragma("journal_mode", { simple: true });
  console.log(`  Journal Mode: ${journalMode}`);

  // 2. 檢查 WAL checkpoint 狀態
  if (journalMode === "wal") {
    try {
      console.log("📈 WAL 狀態:", journalMode);
      const walInfo = db.pragma("wal_checkpoint(TRUNCATE)", { simple: false });
      console.log(`  Busy: ${walInfo[0].busy}`);
      console.log(`  Log: ${walInfo[0].log} frames`);
      console.log(`  Checkpointed: ${walInfo[0].checkpointed} frames`);
    } catch (err) {
      console.log("📈 WAL 狀態錯誤:", err);
    }
  }

  // 3. 檢查資料庫統計
  console.log("\n📊 資料庫統計:");
  const pageCount = db.pragma("page_count", { simple: true });
  const pageSize = db.pragma("page_size", { simple: true });
  const dbSizeMB = ((pageCount * pageSize) / 1024 / 1024).toFixed(2);
  console.log(
    `  大小: ${dbSizeMB} MB (${pageCount} pages × ${pageSize} bytes)`,
  );

  // 4. 檢查 WAL 文件大小
  const walFile = targetDb + "-wal";
  if (fs.existsSync(walFile)) {
    const walStats = fs.statSync(walFile);
    const walSizeMB = (walStats.size / 1024 / 1024).toFixed(2);
    console.log(`  WAL 文件: ${walSizeMB} MB`);
  }

  // 5. 檢查連接數（通過查詢 pragma）
  console.log("\n🔗 連接信息:");
  const cacheSize = db.pragma("cache_size", { simple: true });
  console.log(`  Cache Size: ${cacheSize} pages`);

  // 6. 檢查是否有長時間運行的事務（通過 WAL 大小判斷）
  if (fs.existsSync(walFile)) {
    const walStats = fs.statSync(walFile);
    if (walStats.size > 10 * 1024 * 1024) {
      // 超過 10MB
      console.log("\n⚠️  警告: WAL 文件較大，可能有長時間運行的讀取事務");
    }
  }

  // 7. 測試寫入能力（嘗試獲取鎖）
  console.log("\n🔒 鎖定測試:");
  try {
    // 嘗試以寫入模式打開
    const testDb = new Database(targetDb, { timeout: 100 });
    testDb.pragma("query_only = 0");

    // 嘗試開始一個事務
    const canWrite = testDb.prepare("BEGIN IMMEDIATE").run();
    testDb.prepare("ROLLBACK").run();
    testDb.close();

    console.log("  ✅ 資料庫可寫入（無鎖定）");
  } catch (error) {
    if (error.message.includes("database is locked")) {
      console.log("  ❌ 資料庫被鎖定！");
      console.log(`     錯誤: ${error.message}`);
    } else {
      console.log(`  ⚠️  測試失敗: ${error.message}`);
    }
  }

  db.close();

  console.log("\n✅ 檢查完成");
} catch (error) {
  console.error("❌ 錯誤:", error.message);
  process.exit(1);
}
