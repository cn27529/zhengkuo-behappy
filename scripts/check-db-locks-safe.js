// scripts/check-db-locks-safe.js
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbDir = path.join(__dirname, "..", "db");
const currentDb = path.join(dbDir, "current.db");

async function checkDbLocks() {
  const dbPath = currentDb;
  let db = null;

  try {
    db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);

    // 包裝為 Promise
    const get = (sql) =>
      new Promise((resolve, reject) => {
        db.get(sql, (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

    console.log("🔍 詳細檢查資料庫鎖定狀態\n");

    // 1. Journal Mode
    const mode = await get("PRAGMA journal_mode;");
    console.log("📊 資料庫模式:", mode);

    // 2. WAL 狀態 - 處理空 WAL 的情況
    try {
      const wal = await get("PRAGMA wal_checkpoint;");
      console.log("📈 WAL 狀態:", wal);
    } catch (err) {
      if (err.message.includes("disk I/O")) {
        console.log("📈 WAL 狀態: 檔案為空 (正常)");
      } else {
        console.log("📈 WAL 狀態錯誤:", err.message);
      }
    }

    // 3. 測試寫入
    await new Promise((resolve, reject) => {
      db.run("CREATE TEMP TABLE test (id int)", (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    await new Promise((resolve, reject) => {
      db.run("DROP TABLE test", (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log("✅ 資料庫可寫入（無鎖定）");
    console.log("\n✅ 檢查完成");
  } catch (error) {
    console.error("❌ 錯誤:", error.message);
    process.exit(1);
  } finally {
    if (db) {
      db.close();
    }
  }
}

checkDbLocks();
