#!/usr/bin/env node
// scripts/check-db-locks.js
// 檢查資料庫鎖定和 WAL 狀態

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const dbDir = path.join(__dirname, "..", "db");
const currentDb = path.join(dbDir, "current.db");

console.log("🔍 檢查資料庫鎖定狀態\n");

// 1. 檢查 current.db 連結
if (fs.existsSync(currentDb)) {
  const stats = fs.lstatSync(currentDb);
  if (stats.isSymbolicLink()) {
    const target = fs.readlinkSync(currentDb);
    console.log(`🔗 current.db -> ${target}`);
  } else {
    console.log(`📄 current.db (實體檔案)`);
  }
} else {
  console.log("❌ current.db 不存在");
  process.exit(1);
}

// 2. 檢查 WAL 相關檔案
console.log("\n📊 WAL 檔案狀態:");
["-wal", "-shm", "-journal"].forEach((suffix) => {
  const file = currentDb + suffix;
  if (fs.existsSync(file)) {
    const stats = fs.statSync(file);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    console.log(`  ✅ ${path.basename(file)}: ${sizeMB} MB`);
  } else {
    console.log(`  ❌ ${path.basename(file)}: 不存在`);
  }
});

// 3. 使用 lsof 檢查誰在使用資料庫 (macOS/Linux)
if (process.platform !== "win32") {
  console.log("\n🔒 檢查資料庫連接:");
  try {
    const result = execSync(`lsof "${currentDb}" 2>/dev/null || true`, {
      encoding: "utf8",
    });
    if (result.trim()) {
      console.log(result);
    } else {
      console.log("  ✅ 沒有進程持有資料庫連接");
    }
  } catch (e) {
    console.log("  ⚠️  無法檢查 (需要 lsof 工具)");
  }
}

// 4. 檢查 Directus 和 Rust 進程
console.log("\n🔍 相關進程:");
try {
  const processes = execSync(
    `ps aux | grep -E "(directus|rust-axum|cargo run)" | grep -v grep || true`,
    { encoding: "utf8" }
  );
  if (processes.trim()) {
    console.log(processes);
  } else {
    console.log("  ✅ 沒有相關進程運行");
  }
} catch (e) {
  console.log("  ⚠️  無法檢查進程");
}
