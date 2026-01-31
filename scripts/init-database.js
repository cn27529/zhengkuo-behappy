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
  magenta: "\x1b[35m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  log(`❌ ${message}`, "red");
}

function success(message) {
  log(`✅ ${message}`, "green");
}

function info(message) {
  log(`ℹ️ ${message}`, "cyan");
}

function warning(message) {
  log(`⚠️ ${message}`, "yellow");
}

console.log("=".repeat(50));
log("🏗️ 客戶資料庫初始化工具", "blue");
console.log("=".repeat(50));

// 獲取專案根目錄
const projectRoot = path.resolve(__dirname, "..");
log(`📁 專案根目錄: ${projectRoot}`, "cyan");

// 定義可能的配置檔路徑（優先級順序）
const possibleConfigPaths = [
  path.join(projectRoot, "db", "databases.json"),
  path.join(projectRoot, "databases.json"),
  path.join(process.cwd(), "db", "databases.json"),
  path.join(process.cwd(), "databases.json"),
];

let configPath = null;
for (const p of possibleConfigPaths) {
  if (fs.existsSync(p)) {
    configPath = p;
    success(`找到配置檔: ${p}`);
    break;
  }
}

if (!configPath) {
  error("找不到 databases.json 配置檔");
  log("嘗試過以下路徑:", "yellow");
  possibleConfigPaths.forEach((p) => log(`  ${p}`, "yellow"));
  log("\n💡 您的配置檔應該在: db/databases.json", "yellow");
  process.exit(1);
}

// 讀取配置檔
let config;
try {
  const configContent = fs.readFileSync(configPath, "utf8");
  config = JSON.parse(configContent);
  success(`已載入配置檔: ${configPath}`);
} catch (err) {
  error(`讀取配置檔失敗: ${err.message}`);
  process.exit(1);
}

// 處理 active_database 路徑
let activeDb = config.active_database;
if (!activeDb) {
  warning("配置檔缺少 active_database，使用預設值 data.db");
  activeDb = "data.db";
} else if (activeDb.startsWith("db/")) {
  activeDb = activeDb.replace("db/", "");
}

// 路徑配置
const ROOT_DIR = projectRoot;
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
  log(`\n📊 現有資料庫狀態:`, "cyan");
  log(`${"=".repeat(60)}`, "cyan");

  if (!fs.existsSync(DB_DIR)) {
    log(`  ⚠️  db 目錄不存在`, "yellow");
    return [];
  }

  const databases = config.databases || {};
  const initializedDbs = [];

  // 顯示配置中的資料庫
  for (const [key, dbInfo] of Object.entries(databases)) {
    let dbFile = dbInfo.path ? dbInfo.path.replace(/^db\//, "") : `${key}.db`;
    const dbPath = path.join(DB_DIR, dbFile);
    const exists = fs.existsSync(dbPath);
    
    if (exists) {
      const stats = fs.statSync(dbPath);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
      const isInit = isDatabaseInitialized(dbPath);
      
      if (isInit) {
        initializedDbs.push({ key, name: dbInfo.name || key, file: dbFile, path: dbPath });
        log(`  ${(dbInfo.name || key).padEnd(15)} ${dbFile.padEnd(20)} ${sizeMB.padStart(8)} MB  ✓ 已初始化`, "green");
      } else {
        log(`  ${(dbInfo.name || key).padEnd(15)} ${dbFile.padEnd(20)} ${sizeMB.padStart(8)} MB  ✗ 未初始化`, "red");
      }
    } else {
      log(`  ${(dbInfo.name || key).padEnd(15)} ${dbFile.padEnd(20)} ${"N/A".padStart(8)}     ❌ 不存在`, "yellow");
    }
  }

  // 顯示基礎資料庫
  const baseDbPath = path.join(DB_DIR, activeDb);
  if (fs.existsSync(baseDbPath)) {
    const stats = fs.statSync(baseDbPath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    const isInit = isDatabaseInitialized(baseDbPath);
    
    if (isInit) {
      initializedDbs.push({ key: "active", name: "基礎資料庫", file: activeDb, path: baseDbPath });
      log(`  ${"基礎資料庫".padEnd(15)} ${activeDb.padEnd(20)} ${sizeMB.padStart(8)} MB  ✓ 已初始化`, "cyan");
    } else {
      log(`  ${"基礎資料庫".padEnd(15)} ${activeDb.padEnd(20)} ${sizeMB.padStart(8)} MB  ✗ 未初始化`, "red");
    }
  } else {
    log(`  ${"基礎資料庫".padEnd(15)} ${activeDb.padEnd(20)} ${"N/A".padStart(8)}     ❌ 不存在`, "yellow");
  }

  log(`${"=".repeat(60)}\n`, "cyan");
  return initializedDbs;
}

/**
 * 顯示資料庫選擇選單
 */
function showDatabaseMenu(initializedDbs) {
  console.log("\n" + "=".repeat(50));
  log("🏗️ 請選擇要初始化的客戶資料庫:", "blue");
  console.log("=".repeat(50));

  const databases = config.databases || {};
  const options = [];
  let optionNumber = 1;

  // 顯示配置中未初始化的資料庫
  for (const [key, dbInfo] of Object.entries(databases)) {
    let dbFile = dbInfo.path ? dbInfo.path.replace(/^db\//, "") : `${key}.db`;
    const dbPath = path.join(DB_DIR, dbFile);
    const exists = fs.existsSync(dbPath);
    const isInit = exists ? isDatabaseInitialized(dbPath) : false;

    if (!isInit) {
      const statusColor = exists ? "yellow" : "magenta";
      const statusIcon = exists ? "⚠️" : "🆕";
      const statusText = exists ? "未初始化" : "不存在，將建立";

      log(`${optionNumber}. ${dbInfo.name || key} (${dbFile}) ${statusIcon}`, statusColor);
      log(`   描述: ${dbInfo.description || "無描述"}`, "cyan");
      log(`   狀態: ${statusText}`, statusColor);
      console.log();

      options.push({
        number: optionNumber,
        key: key,
        name: dbInfo.name || key,
        file: dbFile,
        path: dbPath,
        exists: exists,
        description: dbInfo.description,
      });

      optionNumber++;
    }
  }

  if (options.length === 0) {
    log("✅ 所有配置的資料庫都已初始化", "green");
    return null;
  }

  log(`${optionNumber}. 取消操作`, "red");
  console.log();

  options.push({
    number: optionNumber,
    key: "cancel",
    name: "取消",
  });

  console.log("-".repeat(50));
  return options;
}

/**
 * 顯示範本選擇選單
 */
function showTemplateMenu(initializedDbs) {
  console.log("\n" + "=".repeat(50));
  log("📋 請選擇範本資料庫:", "cyan");
  console.log("=".repeat(50));

  initializedDbs.forEach((db, index) => {
    const stats = fs.statSync(db.path);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    log(`${index + 1}. ${db.name} (${db.file})`, "green");
    log(`   大小: ${sizeMB} MB`, "cyan");
    console.log();
  });

  log(`${initializedDbs.length + 1}. 使用 Directus 初始化（慢，需要設定管理員）`, "yellow");
  log(`${initializedDbs.length + 2}. 取消`, "red");
  console.log();
  console.log("-".repeat(50));

  return initializedDbs.length + 2;
}

/**
 * 主程式
 */
async function main() {
  // 確保目錄存在
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  // 列出現有資料庫
  const initializedDbs = listDatabases();

  if (initializedDbs.length === 0) {
    error("沒有可用的範本資料庫");
    log("💡 請先建立並初始化基礎資料庫", "yellow");
    process.exit(1);
  }

  // 顯示資料庫選擇選單
  const options = showDatabaseMenu(initializedDbs);
  
  if (!options) {
    process.exit(0);
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question(`請輸入選項 (1-${options.length}): `, (answer) => {
    const choice = parseInt(answer.trim());

    if (isNaN(choice) || choice < 1 || choice > options.length) {
      error("無效選項，結束操作。");
      rl.close();
      return;
    }

    const selected = options[choice - 1];

    if (selected.key === "cancel") {
      info("已取消操作");
      rl.close();
      return;
    }

    log(`\n🔄 初始化資料庫: ${selected.name}`, "magenta");

    // 檢查是否已存在且已初始化
    if (selected.exists && isDatabaseInitialized(selected.path)) {
      success(`資料庫 ${selected.file} 已初始化，可以直接使用`);
      rl.close();
      return;
    }

    // 顯示範本選擇選單
    const maxOption = showTemplateMenu(initializedDbs);

    rl.question(`請選擇範本 (1-${maxOption}): `, (templateChoice) => {
      const templateIndex = parseInt(templateChoice.trim());

      if (isNaN(templateIndex) || templateIndex < 1 || templateIndex > maxOption) {
        error("無效選擇");
        rl.close();
        return;
      }

      if (templateIndex === maxOption) {
        // 取消
        info("已取消操作");
        rl.close();
        return;
      }

      if (templateIndex === maxOption - 1) {
        // 使用 Directus 初始化
        if (!selected.exists) {
          fs.writeFileSync(selected.path, "");
        }

        if (initializeWithDirectus(selected.path, selected.file)) {
          success(`資料庫初始化成功: ${selected.file}`);
          log(`💡 現在可以使用 start-with-db.js 切換到這個資料庫`, "cyan");
        } else {
          error("資料庫初始化失敗");
          log(`💡 建議使用範本複製方式`, "yellow");
        }
      } else {
        // 從範本複製
        const templateDb = initializedDbs[templateIndex - 1];
        
        if (copyFromTemplate(templateDb.path, selected.path)) {
          success(`資料庫初始化成功: ${selected.file}`);
          log(`💡 現在可以使用 start-with-db.js 切換到這個資料庫`, "cyan");
        }
      }

      rl.close();
    });
  });
}

// 執行
main();
