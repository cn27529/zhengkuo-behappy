#!/usr/bin/env node

/**
 * 客戶資料庫切換工具
 * 使用符號連結切換不同客戶的資料庫
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// 路徑配置
const ROOT_DIR = path.join(__dirname, "..");
const CONFIG_FILE = path.join(ROOT_DIR, "config", "clients.json");
const DB_DIR = path.join(ROOT_DIR, "db");
const CURRENT_DB = path.join(DB_DIR, "current.db");
const CURRENT_CLIENT_FILE = path.join(DB_DIR, ".current-client");

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

// 檢測作業系統
const isWindows = process.platform === "win32";

// 讀取配置
function loadConfig() {
  try {
    const configContent = fs.readFileSync(CONFIG_FILE, "utf8");
    return JSON.parse(configContent);
  } catch (error) {
    log(`❌ 無法讀取配置文件: ${error.message}`, "red");
    process.exit(1);
  }
}

// 獲取當前客戶
function getCurrentClient() {
  try {
    if (fs.existsSync(CURRENT_CLIENT_FILE)) {
      return fs.readFileSync(CURRENT_CLIENT_FILE, "utf8").trim();
    }
  } catch (error) {
    // 忽略錯誤
  }
  return null;
}

// 創建符號連結（跨平台）
function createSymlink(target, link) {
  try {
    // 刪除舊的連結或檔案
    if (fs.existsSync(link)) {
      if (isWindows) {
        // Windows 需要特殊處理
        try {
          fs.unlinkSync(link);
        } catch (e) {
          // 可能是目錄，嘗試 rmdir
          fs.rmdirSync(link);
        }
      } else {
        fs.unlinkSync(link);
      }
    }

    // 創建符號連結
    if (isWindows) {
      // Windows: 使用 junction 或需要管理員權限的 symlink
      try {
        // 嘗試創建符號連結（需要管理員權限）
        fs.symlinkSync(target, link, "file");
      } catch (error) {
        // 如果失敗，使用 mklink 命令（junction 不需要管理員權限）
        const cmd = `mklink "${link}" "${target}"`;
        execSync(cmd, { stdio: "inherit", shell: true });
      }
    } else {
      // Unix/Linux/macOS: 使用標準 symlink
      fs.symlinkSync(target, link);
    }

    return true;
  } catch (error) {
    log(`❌ 創建符號連結失敗: ${error.message}`, "red");
    if (isWindows) {
      log("💡 提示: Windows 用戶可能需要以管理員身份運行此腳本", "yellow");
    }
    return false;
  }
}

// 切換客戶
function switchClient(clientName) {
  const config = loadConfig();

  if (!config.clients[clientName]) {
    log(`❌ 找不到客戶: ${clientName}`, "red");
    log(`\n可用的客戶:`, "cyan");
    Object.keys(config.clients).forEach((name) => {
      const client = config.clients[name];
      log(`  - ${name} (${client.display_name})`, "blue");
    });
    process.exit(1);
  }

  const client = config.clients[clientName];
  const targetDb = path.join(DB_DIR, client.database);

  // 檢查資料庫檔案是否存在
  if (!fs.existsSync(targetDb)) {
    log(`⚠️  資料庫檔案不存在: ${targetDb}`, "yellow");
    log(`正在創建空資料庫...`, "cyan");
    // 創建空檔案
    fs.writeFileSync(targetDb, "");
  }

  // 創建符號連結
  log(`\n🔄 切換客戶資料庫...`, "cyan");
  log(`   客戶: ${client.display_name}`, "blue");
  log(`   資料庫: ${client.database}`, "blue");

  if (createSymlink(client.database, CURRENT_DB)) {
    // 更新配置文件的 current_client
    config.current_client = clientName;
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));

    // 記錄當前客戶
    fs.writeFileSync(CURRENT_CLIENT_FILE, clientName);

    log(`\n✅ 成功切換到: ${client.display_name}`, "green");
    log(`📁 資料庫連結: db/current.db -> ${client.database}`, "green");
    log(`\n💡 現在可以運行: npm run dev`, "cyan");
  } else {
    process.exit(1);
  }
}

// 顯示當前狀態
function showStatus() {
  const config = loadConfig();
  const currentClient = getCurrentClient() || config.current_client;

  log(`\n📊 當前客戶資料庫狀態`, "cyan");
  log(`${"=".repeat(50)}`, "cyan");

  if (currentClient && config.clients[currentClient]) {
    const client = config.clients[currentClient];
    log(`✓ 當前客戶: ${client.display_name}`, "green");
    log(`✓ 資料庫檔案: ${client.database}`, "green");

    // 檢查符號連結
    if (fs.existsSync(CURRENT_DB)) {
      try {
        const stats = fs.lstatSync(CURRENT_DB);
        if (stats.isSymbolicLink()) {
          const target = fs.readlinkSync(CURRENT_DB);
          log(`✓ 符號連結: current.db -> ${target}`, "green");
        } else {
          log(`⚠️  current.db 不是符號連結`, "yellow");
        }
      } catch (error) {
        log(`⚠️  無法檢查符號連結: ${error.message}`, "yellow");
      }
    } else {
      log(`⚠️  符號連結不存在，請運行切換命令`, "yellow");
    }
  } else {
    log(`⚠️  未設置當前客戶`, "yellow");
  }

  log(`\n📋 可用客戶列表:`, "cyan");
  Object.keys(config.clients).forEach((name) => {
    const client = config.clients[name];
    const isCurrent = name === currentClient;
    const marker = isCurrent ? "→" : " ";
    const color = isCurrent ? "green" : "blue";
    log(
      `  ${marker} ${name.padEnd(10)} - ${client.display_name} (${client.database})`,
      color,
    );
  });

  log(`${"=".repeat(50)}\n`, "cyan");
}

// 列出所有客戶
function listClients() {
  const config = loadConfig();

  log(`\n📋 可用客戶列表`, "cyan");
  log(`${"=".repeat(50)}`, "cyan");

  Object.keys(config.clients).forEach((name) => {
    const client = config.clients[name];
    log(`\n客戶: ${name}`, "green");
    log(`  ID: ${client.id}`, "blue");
    log(`  顯示名稱: ${client.display_name}`, "blue");
    log(`  資料庫: ${client.database}`, "blue");
    log(`  說明: ${client.description}`, "blue");
  });

  log(`\n${"=".repeat(50)}\n`, "cyan");
}

// 主程式
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const clientName = args[1];

  // 確保必要目錄存在
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  log(`\n🗄️  客戶資料庫切換工具`, "cyan");

  switch (command) {
    case "switch":
    case "s":
      if (!clientName) {
        log(`❌ 請指定客戶名稱`, "red");
        log(`用法: npm run switch-client 少林寺`, "yellow");
        process.exit(1);
      }
      switchClient(clientName);
      break;

    case "status":
    case "st":
      showStatus();
      break;

    case "list":
    case "ls":
      listClients();
      break;

    case "help":
    case "-h":
    case "--help":
      log(
        `
用法:
  npm run client:switch <客戶名稱>  - 切換到指定客戶
  npm run client:status            - 顯示當前狀態
  npm run client:list              - 列出所有客戶

範例:
  npm run client:switch 少林寺
  npm run client:switch 紫雲寺
  npm run client:status
      `,
        "cyan",
      );
      break;

    default:
      // 如果沒有參數，顯示狀態
      if (!command) {
        showStatus();
      } else {
        // 假設直接輸入客戶名稱
        switchClient(command);
      }
  }
}

// 執行
main();
