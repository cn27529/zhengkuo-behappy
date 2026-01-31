// scripts/check-base-db.js
const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const dbDir = path.join(projectRoot, "db");
const baseDb = path.join(dbDir, "data.db");

console.log("🔍 檢查基礎資料庫...");
console.log(`📁 位置: ${baseDb}`);

// 確保 db 目錄存在
if (!fs.existsSync(dbDir)) {
  console.log("❌ db 目錄不存在，建立中...");
  fs.mkdirSync(dbDir, { recursive: true });
}

// 檢查基礎資料庫
if (!fs.existsSync(baseDb)) {
  console.log("❌ data.db 不存在，建立空的資料庫檔案...");

  try {
    // 建立空的檔案（SQLite 會自動初始化）
    fs.writeFileSync(baseDb, "");
    console.log("✅ 已建立空的 data.db 檔案");
  } catch (err) {
    console.error("❌ 建立檔案失敗:", err.message);
  }
} else {
  console.log("✅ data.db 已存在");

  // 檢查檔案大小
  const stats = fs.statSync(baseDb);
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
  console.log(`📏 檔案大小: ${sizeMB} MB`);
}

// 顯示 db 目錄內容（安全版本）
console.log("\n📁 db 目錄內容:");
try {
  const files = fs.readdirSync(dbDir);

  files.forEach((file) => {
    try {
      const fullPath = path.join(dbDir, file);
      const stats = fs.lstatSync(fullPath); // 使用 lstat 而不是 stat

      // 檢查是否是符號連結
      const isLink = stats.isSymbolicLink();

      if (isLink) {
        // 如果是符號連結，嘗試讀取目標
        try {
          const target = fs.readlinkSync(fullPath);
          const targetPath = path.join(dbDir, target);
          const targetExists = fs.existsSync(targetPath);

          console.log(
            `  🔗 ${file.padEnd(15)} -> ${target} ${targetExists ? "✅" : "❌"}`,
          );

          if (!targetExists) {
            console.log(`     警告: 連結目標不存在!`);
          }
        } catch (linkErr) {
          console.log(`  🔗 ${file.padEnd(15)} -> [讀取連結失敗]`);
        }
      } else {
        // 普通檔案
        const size = (stats.size / 1024 / 1024).toFixed(2);
        console.log(`  📄 ${file.padEnd(15)} ${size} MB`);
      }
    } catch (fileErr) {
      // 處理個別檔案錯誤
      console.log(`  ❓ ${file.padEnd(15)} [無法讀取: ${fileErr.code}]`);
    }
  });
} catch (dirErr) {
  console.log(`❌ 無法讀取 db 目錄: ${dirErr.message}`);
}

// 特別檢查 current.db 的狀態
console.log("\n🔍 檢查 current.db 狀態:");
const currentLink = path.join(dbDir, "current.db");

if (fs.existsSync(currentLink)) {
  try {
    const stats = fs.lstatSync(currentLink);

    if (stats.isSymbolicLink()) {
      // 是符號連結
      const target = fs.readlinkSync(currentLink);
      const targetPath = path.join(dbDir, target);
      const targetExists = fs.existsSync(targetPath);

      console.log(`  🔗 current.db -> ${target}`);
      console.log(`    目標檔案: ${targetExists ? "✅ 存在" : "❌ 不存在"}`);

      if (!targetExists) {
        console.log("    警告: 符號連結目標檔案不存在!");
        console.log("    建議修復選項:");
        console.log("    1. 刪除連結: rm db/current.db");
        console.log("    2. 重新建立: ln -sf data.db db/current.db");
      }
    } else {
      // 是普通檔案
      const size = (stats.size / 1024 / 1024).toFixed(2);
      console.log(`  📄 current.db (實體檔案) ${size} MB`);
    }
  } catch (err) {
    console.log(`  ❌ 讀取 current.db 失敗: ${err.message}`);
  }
} else {
  console.log("  ❌ current.db 不存在");
  console.log("    建議建立: ln -sf data.db db/current.db");
}

// 建立修復腳本選項
console.log("\n💡 修復建議:");
console.log("1. 刪除壞連結: rm db/current.db 或 unlink db/current.db");
console.log("2. 建立新連結: ln -sf db/data.db db/current.db");
//console.log("3. 檢查所有連結: ls -l db/*.db");
