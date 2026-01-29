// scripts/start-with-db.js
const { execSync, spawn } = require("child_process");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("🏯 請選擇要啟動的客戶資料庫:");
console.log("1. 少林寺 (shaolin.db)");
console.log("2. 紫雲寺 (ziyun.db)");
console.log("3. 鎮國寺 (zk.db)");
console.log("4. 使用當前設定（data.db）不更改資料庫");

rl.question("請輸入選項 (1-4): ", (answer) => {
  switch (answer.trim()) {
    case "1":
      console.log("切換到少林寺資料庫...");
      execSync("ln -sf shaolin.db db/current.db", { stdio: "inherit" });
      break;
    case "2":
      console.log("切換到紫雲寺資料庫...");
      execSync("ln -sf ziyun.db db/current.db", { stdio: "inherit" });
      break;
    case "3":
      console.log("切換到鎮國寺資料庫...");
      execSync("ln -sf zk.db db/current.db", { stdio: "inherit" });
      break;
    case "4":
      console.log("使用當前資料庫設定...");
      execSync("ln -sf data.db db/current.db", { stdio: "inherit" });
      break;
    default:
      console.log("無效選項，使用當前設定");
  }

  rl.close();

  console.log("\n🚀 啟動所有服務...");

  // 使用 concurrently 啟動所有服務
  const processes = spawn(
    "npx",
    [
      "concurrently",
      '"npm run start:server"',
      '"npm run start:client"',
      '"npm run start:rust"',
    ],
    {
      stdio: "inherit",
      shell: true,
    },
  );

  processes.on("close", (code) => {
    console.log(`所有服務已結束，退出碼: ${code}`);
  });
});

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
