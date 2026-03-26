// scripts/start-with-db.js
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

// 獲取專案根目錄
const projectRoot = path.resolve(__dirname, "..");
log(`📁 專案根目錄: ${projectRoot}`, "cyan");

startServices(projectRoot);

function startServices(projectRoot) {
  // 读取脚本参数
  const args = process.argv.slice(2);
  let isProd = false;
  if (args.includes("--prod")) {
    console.log("生产模式");
    //process.env.NODE_ENV = "production";
    isProd = true;
  }

  console.log("isProd:", isProd);

  log(`\n${"=".repeat(50)}`, "cyan");
  log(`${colors.bold}${colors.green}🚀 啟動所有服務...${colors.reset}`);
  log(`${"=".repeat(50)}\n`, "cyan");

  log("📦 所有服務列表:", "cyan");
  log("  • 🐇Directus (port 8055)", "blue");
  log("  • 🌍Vue Client Dev (port 5173)", "blue");
  log("  • 🦀Rust-Axum (port 3000)", "blue");
  log("  • 🌱Log Server (port 3002)", "blue");
  log("  • 📚文檔服務 (port 3001)", "blue");
  log("  • 📦Portal入口 (port 8080)", "blue");
  log("  • 📊數據庫文件 (port 9000)", "blue");
  log("  • 🌍前台應用 (port 5173,80)", "blue");
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
        "🐇DIRECTUS,🌍CLIENT,🦀RUST,🌱LOGS,📚DOCS,📦PORTAL,📊SQLITE",
        //"🐇,🌍,🦀,🌱",
        "--prefix-colors",
        "bgBlue.bold,bgMagenta.bold,bgGreen.bold,bgBlack.bold,bgWhite.bold,bgWhite.bold,bgRed.bold",
        '"npm run start:server"',
        isProd ? '"npm run start:client"' : '"npm run start:client"',
        '"npm run start:rust"',
        '"npm run start:logs"',
        '"npm run start:docs"',
        isProd ? '"npm run start:portal:prod"' : '"npm run start:portal"',
        '"npm run sqlite:viewer"',
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

  // // 執行 npm run dev
  // const processes = spawn("npm", ["run", "dev"], {
  //   stdio: "inherit",
  //   shell: true,
  // });

  // processes.on("close", (code) => {
  //   console.log("\n" + "=".repeat(50));
  //   if (code === 0) {
  //     log("✅ 所有服務已正常結束", "green");
  //   } else {
  //     log(`⚠️ 服務結束，退出碼: ${code}`, "yellow");
  //   }
  //   console.log("=".repeat(50));

  //   // 恢復原始工作目錄
  //   process.chdir(originalCwd);
  // });
}
