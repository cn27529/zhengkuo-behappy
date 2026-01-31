#!/usr/bin/env node

/**
 * 資料庫初始化工具
 * 用於創建新客戶資料庫（從範本複製或初始化 Directus）
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const readline = require("readline");

// 顏色輸出
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  blue: "\x1b[34m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 路徑配置
const ROOT_DIR = path.join(__dirname, "..");
const DB_DIR = path.join(ROOT_DIR, "db");
const SERVER_DIR = path.join(ROOT_DIR, "server");

/**
 * 檢查資料庫是否已初始化
 */
function isDatabaseInitialized(dbPath) {
  if (!fs.existsSync(dbPath)) {
    return false;
  }

  const stats = fs.statSync(dbPath);
  // 空文件或很小的文件（< 10KB）視為未初始化
  return stats.size > 10240;
}

/**
 * 從範本複製資料庫
 */
function copyFromTemplate(templateDb, targetDb) {
  try {
    log(`\n📋 從範本複製資料庫...`, "cyan");
    log(`  範本: ${templateDb}`, "blue");
    log(`  目標: ${targetDb}`, "blue");

    if (!fs.existsSync(templateDb)) {
      log(`  ✗ 範本資料庫不存在: ${templateDb}`, "red");
      return false;
    }

    if (!isDatabaseInitialized(templateDb)) {
      log(`  ⚠️  範本資料庫未初始化或為空`, "yellow");
      return false;
    }

    // 複製文件
    fs.copyFileSync(templateDb, targetDb);

    log(`  ✓ 資料庫複製成功`, "green");

    // 顯示資料庫大小
    const stats = fs.statSync(targetDb);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    log(`  ✓ 資料庫大小: ${sizeMB} MB`, "green");

    return true;
  } catch (error) {
    log(`  ✗ 複製失敗: ${error.message}`, "red");
    return false;
  }
}

/**
 * 使用 Directus 初始化資料庫
 */
function initializeWithDirectus(dbPath, dbName) {
  try {
    log(`\n🔧 使用 Directus 初始化資料庫...`, "cyan");
    log(`  資料庫: ${dbName}`, "blue");

    // 暫時創建符號連結指向新資料庫
    const currentDb = path.join(DB_DIR, "current.db");
    const tempBackup = path.join(DB_DIR, "current.db.backup");

    // 備份現有符號連結
    if (fs.existsSync(currentDb)) {
      log(`  📦 備份現有連結...`, "cyan");
      fs.renameSync(currentDb, tempBackup);
    }

    // 創建指向新資料庫的符號連結
    log(`  🔗 創建臨時連結...`, "cyan");
    fs.symlinkSync(dbName, currentDb);

    // 執行 Directus bootstrap
    log(`  ⏳ 執行 Directus bootstrap (這可能需要一些時間)...`, "cyan");
    log(`  💡 如果詢問管理員帳號，請輸入相關資訊`, "yellow");

    try {
      execSync("npx directus bootstrap", {
        cwd: SERVER_DIR,
        stdio: "inherit",
      });

      log(`  ✓ Directus 初始化成功`, "green");

      // 恢復原始符號連結
      if (fs.existsSync(tempBackup)) {
        log(`  📦 恢復原始連結...`, "cyan");
        fs.unlinkSync(currentDb);
        fs.renameSync(tempBackup, currentDb);
      }

      return true;
    } catch (error) {
      log(`  ✗ Directus 初始化失敗`, "red");

      // 恢復原始符號連結
      if (fs.existsSync(tempBackup)) {
        fs.unlinkSync(currentDb);
        fs.renameSync(tempBackup, currentDb);
      }

      return false;
    }
  } catch (error) {
    log(`  ✗ 初始化失敗: ${error.message}`, "red");
    return false;
  }
}

/**
 * 列出可用的資料庫
 */
function listDatabases() {
  log(`\n📊 現有資料庫列表:`, "cyan");
  log(`${"=".repeat(60)}`, "cyan");

  if (!fs.existsSync(DB_DIR)) {
    log(`  ⚠️  db 目錄不存在`, "yellow");
    return [];
  }

  const files = fs
    .readdirSync(DB_DIR)
    .filter((f) => f.endsWith(".db") && f !== "current.db");

  if (files.length === 0) {
    log(`  ⚠️  沒有找到資料庫文件`, "yellow");
    return [];
  }

  files.forEach((file) => {
    const filePath = path.join(DB_DIR, file);
    const stats = fs.statSync(filePath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    const isInit = isDatabaseInitialized(filePath);
    const status = isInit ? "✓ 已初始化" : "✗ 未初始化";
    const color = isInit ? "green" : "red";

    log(`  ${file.padEnd(20)} ${sizeMB.padStart(8)} MB  ${status}`, color);
  });

  log(`${"=".repeat(60)}\n`, "cyan");

  return files.filter((f) => {
    const filePath = path.join(DB_DIR, f);
    return isDatabaseInitialized(filePath);
  });
}

/**
 * 主程式
 */
async function main() {
  log(`\n🗄️  客戶資料庫初始化工具`, "cyan");

  // 確保目錄存在
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  // 列出現有資料庫
  const initializedDbs = listDatabases();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // 詢問要創建的資料庫名稱
  rl.question(
    `${colors.cyan}請輸入新資料庫名稱（不含 .db 後綴）: ${colors.reset}`,
    (dbName) => {
      if (!dbName.trim()) {
        log(`\n❌ 資料庫名稱不能為空`, "red");
        rl.close();
        return;
      }

      const fullDbName = `${dbName.trim()}.db`;
      const dbPath = path.join(DB_DIR, fullDbName);

      // 檢查是否已存在
      if (fs.existsSync(dbPath)) {
        log(`\n⚠️  資料庫已存在: ${fullDbName}`, "yellow");

        if (isDatabaseInitialized(dbPath)) {
          log(`✓ 資料庫已初始化，可以直接使用`, "green");
        } else {
          log(`✗ 資料庫未初始化，建議重新初始化`, "red");
        }

        rl.close();
        return;
      }

      // 選擇初始化方式
      log(`\n📋 請選擇初始化方式:`, "cyan");
      log(`${"=".repeat(60)}`, "cyan");

      if (initializedDbs.length > 0) {
        log(`  1. 從現有資料庫複製（快速，推薦）`, "green");
        initializedDbs.forEach((db, i) => {
          log(`     ${String.fromCharCode(97 + i)}. 從 ${db} 複製`, "blue");
        });
      }

      //log(`  2. 使用 Directus 初始化（慢，需要設定管理員）`, "yellow");
      log(`  0. 取消`, "red");
      log(`${"=".repeat(60)}\n`, "cyan");

      rl.question(`${colors.cyan}請選擇 (1/2/0): ${colors.reset}`, (choice) => {
        switch (choice.trim()) {
          case "1":
            if (initializedDbs.length === 0) {
              log(`\n❌ 沒有可用的範本資料庫`, "red");
              rl.close();
              return;
            }

            // 如果只有一個，直接使用
            if (initializedDbs.length === 1) {
              const templateDb = path.join(DB_DIR, initializedDbs[0]);
              if (copyFromTemplate(templateDb, dbPath)) {
                log(`\n✅ 資料庫創建成功: ${fullDbName}`, "green");
                log(
                  `💡 現在可以使用 start-with-db.js 切換到這個資料庫`,
                  "cyan",
                );
              }
              rl.close();
              return;
            }

            // 多個範本，詢問選擇
            rl.question(
              `${colors.cyan}選擇範本 (a-${String.fromCharCode(96 + initializedDbs.length)}): ${colors.reset}`,
              (templateChoice) => {
                const index = templateChoice.charCodeAt(0) - 97;

                if (index < 0 || index >= initializedDbs.length) {
                  log(`\n❌ 無效選擇`, "red");
                  rl.close();
                  return;
                }

                const templateDb = path.join(DB_DIR, initializedDbs[index]);
                if (copyFromTemplate(templateDb, dbPath)) {
                  log(`\n✅ 資料庫創建成功: ${fullDbName}`, "green");
                  log(
                    `💡 現在可以使用 start-with-db.js 切換到這個資料庫`,
                    "cyan",
                  );
                }

                rl.close();
              },
            );
            break;

          case "2":
            // 創建空資料庫文件
            fs.writeFileSync(dbPath, "");

            if (initializeWithDirectus(dbPath, fullDbName)) {
              log(`\n✅ 資料庫創建成功: ${fullDbName}`, "green");
              log(`💡 現在可以使用 start-with-db.js 切換到這個資料庫`, "cyan");
            } else {
              log(`\n❌ 資料庫初始化失敗`, "red");
              log(`💡 建議使用方式 1（從現有資料庫複製）`, "yellow");
            }

            rl.close();
            break;

          case "0":
            log(`\n👋 已取消`, "yellow");
            rl.close();
            break;

          default:
            log(`\n❌ 無效選擇`, "red");
            rl.close();
        }
      });
    },
  );
}

// 執行
main();
