// scripts/start-simple-db.js
const { execSync, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

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
});
