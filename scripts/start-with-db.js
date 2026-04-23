// scripts/start-with-db.js
const { execSync, spawn } = require("child_process");
const readline = require("readline");
const fs = require("fs");
const path = require("path");
const {
  createSymlink,
  provideWindowsAdvice,
} = require("./windows-symlink-helper");

// 顏色輸出
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  bold: "\x1b[1m",
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
log("🏯 客戶資料庫管理工具", "blue");
console.log("=".repeat(50));

// 獲取專案根目錄
const projectRoot = path.resolve(__dirname, "..");
log(`📁 專案根目錄: ${projectRoot}`, "cyan");

// 定義可能的配置檔路徑（優先級順序）
const possibleConfigPaths = [
  path.join(projectRoot, "db", "databases.json"), // 您的配置檔位置
  path.join(projectRoot, "databases.json"), // 專案根目錄
  path.join(process.cwd(), "db", "databases.json"), // 當前目錄的 db
  path.join(process.cwd(), "databases.json"), // 當前目錄
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
  log("配置檔內容:", "yellow");
  try {
    console.log(fs.readFileSync(configPath, "utf8"));
  } catch (e) {
    console.log("無法讀取檔案內容");
  }
  process.exit(1);
}

// 處理 active_database 路徑
let activeDb = config.active_database;
if (!activeDb) {
  warning("配置檔缺少 active_database，使用預設值 data.db");
  activeDb = "data.db";
} else if (activeDb.startsWith("db/")) {
  // 移除 db/ 前綴
  activeDb = activeDb.replace("db/", "");
  log(
    `修正 active_database 路徑: ${config.active_database} -> ${activeDb}`,
    "yellow",
  );
}

// 顯示配置摘要
console.log("\n" + "=".repeat(50));
log("📋 配置摘要", "cyan");
console.log("-".repeat(50));
log(`基礎資料庫: ${activeDb}`, "cyan");
log(`可用客戶數: ${Object.keys(config.databases || {}).length}`, "cyan");

// 顯示當前狀態
console.log("\n" + "=".repeat(50));
log("📊 當前資料庫狀態", "cyan");
console.log("-".repeat(50));

const currentLink = path.join(projectRoot, "db", "current.db");
const dbDir = path.join(projectRoot, "db");

if (fs.existsSync(currentLink)) {
  try {
    const stats = fs.lstatSync(currentLink);
    if (stats.isSymbolicLink()) {
      const target = fs.readlinkSync(currentLink);
      log(`🔗 當前連結: current.db -> ${target}`, "green");

      // 檢查目標是否存在
      const targetPath = path.join(dbDir, target);
      if (fs.existsSync(targetPath)) {
        const targetStats = fs.statSync(targetPath);
        const sizeMB = (targetStats.size / 1024 / 1024).toFixed(2);
        log(`    目標檔案: ${target} (${sizeMB} MB) ✅`, "green");
      } else {
        log(`    目標檔案: ${target} ❌ 不存在!`, "red");
      }
    } else {
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
      log(`📄 當前: current.db (實體檔案, ${sizeMB} MB)`, "yellow");
    }
  } catch (err) {
    log(`❌ 讀取連結失敗: ${err.message}`, "red");
  }
} else {
  log("❌ current.db 不存在", "yellow");
}

console.log("-".repeat(50));

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// 詢問是否解除連結
rl.question("是否要解除目前的資料庫連結？(y/n): ", (answer) => {
  if (answer.trim().toLowerCase() === "y") {
    if (fs.existsSync(currentLink)) {
      try {
        fs.unlinkSync(currentLink);
        success("已解除 db/current.db 連結");
      } catch (err) {
        error(`解除連結失敗: ${err.message}`);
      }
    } else {
      info("current.db 不存在，無需解除");
    }
  }

  rl.close();
  showDatabaseMenu(config, projectRoot, activeDb);
});

function showDatabaseMenu(config, projectRoot, activeDb) {
  console.log("\n" + "=".repeat(50));
  log("🏯 請選擇要啟動的客戶資料庫:", "blue");
  console.log("=".repeat(50));

  const databases = config.databases || {};
  const dbDir = path.join(projectRoot, "db");

  let optionNumber = 1;
  const options = [];

  // 顯示配置中的資料庫
  for (const [key, dbInfo] of Object.entries(databases)) {
    // 從 path 中提取檔案名稱
    let dbFile;
    if (dbInfo.path) {
      // 移除路徑中的 db/ 前綴
      dbFile = dbInfo.path.replace(/^db\//, "");
    } else {
      dbFile = `${key}.db`;
    }

    const dbPath = path.join(dbDir, dbFile);
    const exists = fs.existsSync(dbPath);

    const statusColor = exists ? "green" : "yellow";
    const statusIcon = exists ? "✅" : "❌";

    log(
      `${optionNumber}. ${dbInfo.name || key} (${dbFile}) ${statusIcon}`,
      statusColor,
    );

    if (dbInfo.description) {
      log(`   描述: ${dbInfo.description}`, "cyan");
    }

    if (exists) {
      const stats = fs.statSync(dbPath);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
      log(`   大小: ${sizeMB} MB`, "cyan");
    } else {
      log(`   狀態: 不存在，將從 ${activeDb} 複製建立`, "magenta");
    }

    console.log();

    options.push({
      number: optionNumber,
      key: key,
      name: dbInfo.name || key,
      file: dbFile,
      path: dbPath,
      exists: exists,
    });

    optionNumber++;
  }

  // 顯示基礎資料庫選項
  const baseDbPath = path.join(dbDir, activeDb);
  const baseExists = fs.existsSync(baseDbPath);

  const baseStatusColor = baseExists ? "cyan" : "yellow";
  const baseStatusIcon = baseExists ? "✅" : "❌";

  log(
    `${optionNumber}. 基礎資料庫 (${activeDb}) ${baseStatusIcon}`,
    baseStatusColor,
  );
  log(`   描述: 系統預設基礎資料庫`, "cyan");

  if (baseExists) {
    const stats = fs.statSync(baseDbPath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    log(`   大小: ${sizeMB} MB`, "cyan");
  } else {
    log(`   狀態: ❌ 檔案不存在！`, "red");
  }

  console.log();

  options.push({
    number: optionNumber,
    key: "active",
    name: "基礎資料庫",
    file: activeDb,
    path: baseDbPath,
    exists: baseExists,
  });

  optionNumber++;

  log(`${optionNumber}. 使用當前設定 (不更改)`, "reset");
  log(`   描述: 保持現有連結不變`, "cyan");
  console.log();

  options.push({
    number: optionNumber,
    key: "current",
    name: "當前設定",
  });

  console.log("-".repeat(50));

  const rl2 = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl2.question(`請輸入選項 (1-${options.length}): `, (answer) => {
    const choice = parseInt(answer.trim());

    if (isNaN(choice) || choice < 1 || choice > options.length) {
      error("無效選項，結束對話。");
      rl2.close();
      return;
    }

    const selected = options[choice - 1];

    if (selected.key === "current") {
      info("使用當前資料庫設定");
    } else {
      log(`\n🔄 切換到: ${selected.name}`, "magenta");

      const targetFile = selected.file;
      const targetPath = selected.path;
      const baseDbPath = path.join(dbDir, activeDb);

      // 1. 檢查目標檔案是否存在，不存在則建立
      if (!selected.exists) {
        if (fs.existsSync(baseDbPath)) {
          info(`從 ${activeDb} 複製建立 ${targetFile}...`);
          try {
            fs.copyFileSync(baseDbPath, targetPath);
            const stats = fs.statSync(targetPath);
            const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
            success(`✅ 已建立 ${targetFile} (${sizeMB} MB)`);
          } catch (err) {
            error(`❌ 複製失敗: ${err.message}`);
            rl2.close();
            return;
          }
        } else {
          error(`❌ 基礎資料庫 ${activeDb} 不存在！無法建立 ${targetFile}`);
          error(`💡 請先建立基礎資料庫檔案: ${baseDbPath}`);
          rl2.close();
          return;
        }
      }

      // 2. 建立符號連結（先刪除已存在的）
      try {
        if (fs.existsSync(currentLink)) {
          fs.unlinkSync(currentLink);
          info("已刪除舊的 current.db");
        }

        // 確保目標檔案存在
        if (!fs.existsSync(targetPath)) {
          error(`❌ 目標檔案 ${targetFile} 不存在！`);
          rl2.close();
          return;
        }

        // 使用輔助工具建立符號連結
        const result = createSymlink(targetFile, currentLink);

        if (result.success) {
          if (result.warning) {
            warning(`⚠️  ${result.warning}`);
          }

          // 顯示使用的方法
          const methodNames = {
            symlink: "符號連結",
            "nodejs-symlink": "Node.js 符號連結",
            mklink: "Windows mklink",
            copy: "文件複製",
          };
          info(`使用方法: ${methodNames[result.method] || result.method}`);
        } else {
          error(`❌ 建立連結失敗: ${result.error}`);

          // 提供 Windows 特定建議
          if (process.platform === "win32") {
            console.log();
            provideWindowsAdvice();
          }

          rl2.close();
          return;
        }
      } catch (err) {
        error(`❌ 處理資料庫連結時發生錯誤: ${err.message}`);
        rl2.close();
        return;
      }
    }

    rl2.close();

    // 顯示最終狀態
    console.log("\n" + "=".repeat(50));
    log("📊 最終狀態", "green");
    console.log("-".repeat(50));

    if (fs.existsSync(currentLink)) {
      try {
        const stats = fs.lstatSync(currentLink);
        if (stats.isSymbolicLink()) {
          const target = fs.readlinkSync(currentLink);
          log(`🔗 符號連結: current.db -> ${target}`, "green");

          // 檢查目標
          const targetPath = path.join(dbDir, target);
          if (fs.existsSync(targetPath)) {
            const targetStats = fs.statSync(targetPath);
            const sizeMB = (targetStats.size / 1024 / 1024).toFixed(2);
            log(`📏 檔案大小: ${sizeMB} MB`, "cyan");
          }
        } else {
          log(`📄 實體檔案: current.db`, "yellow");
        }
      } catch (err) {
        error(`讀取連結失敗: ${err.message}`);
      }
    } else {
      log("❌ current.db 不存在", "yellow");
    }

    console.log("-".repeat(50));

    // 🔧 新增：啟動服務前先清理殘留文件
    cleanupWalFiles();

    // 啟動服務
    //startServices(projectRoot);
  });
}

function cleanupWalFiles() {
  log("🧹 清理殘留的資料庫文件...", "cyan");

  // 檢查 dbDir 是否存在
  if (!dbDir || !fs.existsSync(dbDir)) {
    warning(`資料庫目錄不存在: ${dbDir}`);
    return;
  }

  log(`   目錄: ${dbDir}`, "cyan");

  // 只清理明顯的殘留文件
  ["-shm", "-wal", "-journal"].forEach((suffix) => {
    try {
      const files = fs.readdirSync(dbDir).filter((f) => f.endsWith(suffix));

      files.forEach((file) => {
        const filePath = path.join(dbDir, file);
        try {
          const stats = fs.statSync(filePath);
          // 只刪除舊文件（例如超過1小時）
          if (Date.now() - stats.mtimeMs > 3600000) {
            fs.unlinkSync(filePath);
            log(`   已刪除: ${file}`, "yellow");
          } else {
            log(`   保留（新文件）: ${file}`, "cyan");
          }
        } catch (e) {
          // 忽略文件錯誤
          log(`   無法處理: ${file} (${e.message})`, "yellow");
        }
      });
    } catch (e) {
      // 忽略讀取目錄錯誤
      log(`   無法讀取目錄: ${e.message}`, "yellow");
    }
  });
}
