#!/usr/bin/env node

/**
 * 啟動服務並選擇客戶資料庫
 * 在創建新符號連結前會先移除舊的連接
 */

const { execSync, spawn } = require("child_process");
const readline = require("readline");
const fs = require("fs");
const path = require("path");

// 顏色輸出
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  blue: "\x1b[34m",
  bold: "\x1b[1m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 路徑配置
const ROOT_DIR = path.join(__dirname, "..");
const DB_DIR = path.join(ROOT_DIR, "db");
const CURRENT_DB = path.join(DB_DIR, "current.db");

// 檢測作業系統
const isWindows = process.platform === "win32";

/**
 * 安全移除符號連結或文件
 */
function removeSymlink(linkPath) {
  try {
    if (fs.existsSync(linkPath)) {
      const stats = fs.lstatSync(linkPath);

      if (stats.isSymbolicLink()) {
        log(`  🗑️  移除舊的符號連結: ${path.basename(linkPath)}`, "yellow");
      } else {
        log(`  ⚠️  發現非符號連結文件: ${path.basename(linkPath)}`, "yellow");
        log(`  🗑️  移除舊文件`, "yellow");
      }

      // 移除文件或符號連結
      if (isWindows) {
        // Windows 可能需要特殊處理
        try {
          fs.unlinkSync(linkPath);
        } catch (e) {
          // 嘗試作為目錄移除（junction）
          fs.rmdirSync(linkPath);
        }
      } else {
        fs.unlinkSync(linkPath);
      }

      log(`  ✓ 成功移除舊連接`, "green");
      return true;
    } else {
      log(`  ℹ️  不存在舊連接，直接創建新連接`, "cyan");
      return true;
    }
  } catch (error) {
    log(`  ✗ 移除連接失敗: ${error.message}`, "red");
    return false;
  }
}

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
 * 創建符號連結（跨平台）
 */
function createSymlink(target, link) {
  try {
    const targetPath = path.join(DB_DIR, target);

    // 檢查目標資料庫是否存在
    if (!fs.existsSync(targetPath)) {
      log(`  ⚠️  目標資料庫不存在: ${target}`, "yellow");
      log(`  ❌ 請先使用以下命令初始化資料庫:`, "red");
      log(`     node scripts/init-database.js`, "cyan");
      return false;
    }

    // 檢查資料庫是否已初始化
    if (!isDatabaseInitialized(targetPath)) {
      log(`  ⚠️  資料庫未初始化: ${target}`, "yellow");
      log(`  ❌ 這個資料庫是空的，Directus 無法啟動`, "red");
      log(`  💡 請使用以下命令初始化:`, "cyan");
      log(`     node scripts/init-database.js`, "cyan");
      return false;
    }

    const stats = fs.statSync(targetPath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    log(`  ✓ 資料庫檢查通過 (${sizeMB} MB)`, "green");

    // 先移除舊連接
    if (!removeSymlink(link)) {
      return false;
    }

    // 創建新的符號連結
    if (isWindows) {
      // Windows: 使用相對路徑，避免需要管理員權限
      try {
        fs.symlinkSync(target, link, "file");
        log(`  ✓ 符號連結創建成功 (symlink)`, "green");
      } catch (error) {
        // 如果失敗，嘗試使用 mklink 命令
        log(`  ⚠️  symlink 失敗，嘗試使用 mklink...`, "yellow");
        const cmd = `mklink "${link}" "${target}"`;
        execSync(cmd, { stdio: "pipe", shell: true });
        log(`  ✓ 符號連結創建成功 (mklink)`, "green");
      }
    } else {
      // Unix/Linux/macOS: 使用相對路徑
      fs.symlinkSync(target, link);
      log(`  ✓ 符號連結創建成功`, "green");
    }

    // 驗證符號連結
    if (fs.existsSync(link)) {
      const stats = fs.lstatSync(link);
      if (stats.isSymbolicLink()) {
        const linkTarget = fs.readlinkSync(link);
        log(`  ✓ 驗證成功: current.db → ${linkTarget}`, "green");
        return true;
      }
    }

    return true;
  } catch (error) {
    log(`  ✗ 創建符號連結失敗: ${error.message}`, "red");
    if (isWindows) {
      log(`  💡 提示: Windows 用戶可能需要:`, "yellow");
      log(`     1. 以管理員身份運行`, "yellow");
      log(`     2. 或啟用開發者模式`, "yellow");
    }
    return false;
  }
}

/**
 * 切換資料庫
 */
function switchDatabase(dbName, displayName) {
  log(`\n🔄 切換到 ${displayName}...`, "cyan");

  // 確保 db 目錄存在
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
    log(`  📁 創建資料庫目錄`, "green");
  }

  // 創建符號連結
  return createSymlink(dbName, CURRENT_DB);
}

/**
 * 顯示當前資料庫狀態
 */
function showCurrentDatabase() {
  try {
    if (fs.existsSync(CURRENT_DB)) {
      const stats = fs.lstatSync(CURRENT_DB);
      if (stats.isSymbolicLink()) {
        const target = fs.readlinkSync(CURRENT_DB);
        log(`\n📊 當前資料庫: ${target}`, "cyan");
      } else {
        log(`\n⚠️  current.db 存在但不是符號連結`, "yellow");
      }
    } else {
      log(`\n⚠️  尚未設定資料庫連接`, "yellow");
    }
  } catch (error) {
    log(`\n⚠️  無法檢查當前資料庫狀態`, "yellow");
  }
}

/**
 * 主程式
 */
function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // 顯示當前狀態
  showCurrentDatabase();

  // 顯示選單
  log(`\n${"=".repeat(50)}`, "cyan");
  log(
    `${colors.bold}${colors.cyan}🏯 請選擇要啟動的客戶資料庫:${colors.reset}`,
  );
  log(`${"=".repeat(50)}`, "cyan");
  log(`  ${colors.green}1.${colors.reset} 少林寺 (shaolin.db)`);
  log(`  ${colors.green}2.${colors.reset} 紫雲寺 (ziyun.db)`);
  log(`  ${colors.green}3.${colors.reset} 鎮國寺 (zk.db)`);
  log(`  ${colors.green}4.${colors.reset} 預設資料庫 (data.db)`);
  log(`  ${colors.yellow}0.${colors.reset} 取消並退出`);
  log(`${"=".repeat(50)}\n`, "cyan");

  rl.question(`${colors.cyan}請輸入選項 (0-4): ${colors.reset}`, (answer) => {
    const choice = answer.trim();
    let success = false;

    switch (choice) {
      case "1":
        success = switchDatabase("shaolin.db", "少林寺資料庫");
        break;
      case "2":
        success = switchDatabase("ziyun.db", "紫雲寺資料庫");
        break;
      case "3":
        success = switchDatabase("zk.db", "鎮國寺資料庫");
        break;
      case "4":
        success = switchDatabase("data.db", "預設資料庫");
        break;
      case "0":
        log("\n👋 已取消，退出程式", "yellow");
        rl.close();
        process.exit(0);
        return;
      default:
        log(`\n❌ 無效選項: ${choice}`, "red");
        log("使用當前資料庫設定...", "yellow");
        success = true; // 繼續執行，不切換資料庫
    }

    rl.close();

    // 如果切換失敗，詢問是否繼續
    if (!success) {
      log(`\n❌ 資料庫切換失敗`, "red");
      log(`是否仍要啟動服務？可能會使用舊的資料庫連接。`, "yellow");

      const rl2 = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      rl2.question(`繼續啟動? (y/N): `, (continueAnswer) => {
        rl2.close();

        if (continueAnswer.toLowerCase() !== "y") {
          log("\n👋 已取消啟動", "yellow");
          process.exit(1);
        }

        startServices();
      });
    } else {
      startServices();
    }
  });
}

/**
 * 啟動所有服務
 */
function startServices() {
  log(`\n${"=".repeat(50)}`, "cyan");
  log(`${colors.bold}${colors.green}🚀 啟動所有服務...${colors.reset}`);
  log(`${"=".repeat(50)}\n`, "cyan");

  log("📦 服務列表:", "cyan");
  log("  • Directus (port 8055)", "blue");
  log("  • Vue Client (port 5173)", "blue");
  log("  • Rust-Axum (port 3000)", "blue");
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
        "DIRECTUS,CLIENT,RUST",
        "--prefix-colors",
        "bgBlue.bold,bgMagenta.bold,bgGreen.bold",
        '"npm run start:server"',
        '"npm run start:client"',
        '"npm run start:rust"',
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

// 執行主程式
main();
