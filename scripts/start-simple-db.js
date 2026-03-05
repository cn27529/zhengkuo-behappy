// scripts/start-simple-db.js
const { execSync, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
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
  bold: "\x1b[1m"
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

console.log("🏯 資料庫切換工具");
console.log("==================");

// 自動尋找 databases.json
const findConfig = () => {
  const paths = [
    "databases.json",
    "db/databases.json",
    "../databases.json",
    "../db/databases.json",
  ];

  for (const p of paths) {
    if (fs.existsSync(p)) {
      console.log(`找到配置檔: ${p}`);
      return p;
    }
  }
  return null;
};

const configPath = findConfig();

if (!configPath) {
  console.log("❌ 找不到 databases.json");
  console.log("💡 請將 databases.json 放在專案根目錄或 db/ 目錄中");
  process.exit(1);
}

// 讀取配置
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const databases = config.databases;
const activeDb = config.active_database || "data.db";

// 顯示當前狀態
console.log("\n當前連結狀態:");
try {
  execSync("ls -l db/current.db", { stdio: "inherit" });
} catch {
  console.log("❌ 沒有 current.db 連結");
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("\n選擇資料庫:");
Object.entries(databases).forEach(([key, db], index) => {
  console.log(`${index + 1}. ${db.name} (${key}.db)`);
});
console.log(`${Object.keys(databases).length + 1}. 基礎資料庫 (${activeDb})`);
console.log(`${Object.keys(databases).length + 2}. 不更改`);

rl.question("\n選擇: ", (answer) => {
  let targetDb = null;
  const dbCount = Object.keys(databases).length;

  if (answer >= 1 && answer <= dbCount) {
    const key = Object.keys(databases)[answer - 1];
    targetDb = databases[key];
    console.log(`切換到: ${targetDb.name}`);

    // 檢查檔案是否存在
    const dbFile = `${key}.db`;
    if (!fs.existsSync(`db/${dbFile}`)) {
      console.log(`建立新的 ${dbFile}...`);
      if (fs.existsSync(`db/${activeDb}`)) {
        fs.copyFileSync(`db/${activeDb}`, `db/${dbFile}`);
      } else {
        fs.writeFileSync(`db/${dbFile}`, "");
      }
    }

    // 建立連結
    execSync(`ln -sf ${dbFile} db/current.db`);
  } else if (answer == dbCount + 1) {
    console.log(`使用基礎資料庫: ${activeDb}`);
    execSync(`ln -sf ${activeDb} db/current.db`);
  } else {
    console.log("保持當前設定");
  }

  rl.close();

  // 顯示結果
  console.log("\n結果:");
  try {
    execSync("ls -l db/current.db", { stdio: "inherit" });
  } catch {}

  // // 啟動服務
  // console.log("\n啟動服務...");
  // spawn(
  //   "npx",
  //   ["concurrently", "npm:start:server", "npm:start:client", "npm:start:rust", "npm:start:logs", "npm:start:docs", "npm:start:apps"],
  //   {
  //     stdio: "inherit",
  //     shell: true,
  //   },
  // );

  // 啟動服務
  startServices(null);
});

function startServices(projectRoot) {
  log(`\n${"=".repeat(50)}`, "cyan");
  log(`${colors.bold}${colors.green}🚀 啟動所有服務...${colors.reset}`);
  log(`${"=".repeat(50)}\n`, "cyan");

  log("📦 服務列表:", "cyan");
  log("  • Directus (port 8055)", "blue");
  log("  • Vue Client (port 5173)", "blue");
  log("  • Rust-Axum (port 3000)", "blue");
  log("  • Log Server (port 3002)", "blue");
  log("  • 服務入口總覽 (port 8080)", "blue");
  log("");

  log("💡 提示: 按 Ctrl+C 可停止所有服務\n", "yellow");

  try {
    // 使用 concurrently 啟動所有服務
    const processes = spawn(
      "npx",
      [
        "concurrently",
        "--kill-others",
        "--names",
        "🐇DIRECTUS,🌍CLIENT,🦀RUST,🌱LOGS,📚DOCS,📦APPS",
        //"🐇,🌍,🦀,🌱",
        "--prefix-colors",
        "bgBlue.bold,bgMagenta.bold,bgGreen.bold,bgBlack.bold,bgWhite.bold,bgWhite.bold",
        '"npm run start:server"',
        '"npm run start:client"',
        '"npm run start:rust"',
        '"npm run start:logs"',
        '"npm run start:docs"',
        '"npm run start:apps"',
      ],
      {
        stdio: "inherit",
        shell: true,
      },
    );

    // 處理進程退出
    processes.on("close", (code) => {
      if (code === 0) {
        log(`\n✅ 所有服務正常結束`, "green");
      } else {
        log(`\n⚠️  服務結束，退出碼: ${code}`, "yellow");
      }
    });

    // 處理錯誤
    processes.on("error", (error) => {
      log(`\n❌ 啟動服務時發生錯誤: ${error.message}`, "red");
      process.exit(1);
    });

    // 處理 Ctrl+C
    process.on("SIGINT", () => {
      log(`\n\n👋 收到中斷信號，正在停止所有服務...`, "yellow");
      processes.kill("SIGINT");
    });

    process.on("SIGTERM", () => {
      log(`\n\n👋 收到終止信號，正在停止所有服務...`, "yellow");
      processes.kill("SIGTERM");
    });
  } catch (error) {
    log(`\n❌ 啟動失敗: ${error.message}`, "red");
    log(`\n💡 請確認:`, "yellow");
    log(`   1. 已安裝所有依賴: npm install`, "yellow");
    log(`   2. concurrently 已安裝`, "yellow");
    log(`   3. server、client、rust-axum 目錄都存在`, "yellow");
    process.exit(1);
  }
}
