#!/usr/bin/env node

/**
 * 符號連結檢查工具
 * 用於檢查和顯示資料庫目錄中的符號連結狀態
 */

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

/**
 * 格式化檔案大小
 */
function formatFileSize(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * 檢查單個符號連結
 */
function checkSymlink(filePath) {
  const fullPath = path.resolve(filePath);
  const fileName = path.basename(fullPath);
  
  try {
    const stats = fs.lstatSync(fullPath);
    
    if (!stats.isSymbolicLink()) {
      return {
        isSymlink: false,
        fileName: fileName,
        fullPath: fullPath,
        error: "不是符號連結"
      };
    }

    const target = fs.readlinkSync(fullPath);
    const targetPath = path.resolve(path.dirname(fullPath), target);
    const targetExists = fs.existsSync(targetPath);
    
    let targetSize = null;
    if (targetExists) {
      try {
        const targetStats = fs.statSync(targetPath);
        targetSize = targetStats.size;
      } catch (err) {
        // 無法讀取目標檔案大小
      }
    }

    return {
      isSymlink: true,
      fileName: fileName,
      fullPath: fullPath,
      target: target,
      targetPath: targetPath,
      targetExists: targetExists,
      targetSize: targetSize,
      isValid: targetExists
    };
  } catch (err) {
    return {
      isSymlink: false,
      fileName: fileName,
      fullPath: fullPath,
      error: err.message
    };
  }
}

/**
 * 掃描目錄中的所有符號連結
 */
function scanDirectory(dirPath) {
  const fullDirPath = path.resolve(dirPath);
  
  if (!fs.existsSync(fullDirPath)) {
    error(`目錄不存在: ${fullDirPath}`);
    return [];
  }

  if (!fs.statSync(fullDirPath).isDirectory()) {
    error(`不是目錄: ${fullDirPath}`);
    return [];
  }

  const symlinks = [];
  
  try {
    const files = fs.readdirSync(fullDirPath);
    
    for (const file of files) {
      const filePath = path.join(fullDirPath, file);
      const result = checkSymlink(filePath);
      
      if (result.isSymlink) {
        symlinks.push(result);
      }
    }
  } catch (err) {
    error(`讀取目錄失敗: ${err.message}`);
  }

  return symlinks;
}

/**
 * 顯示單個符號連結信息
 */
function displaySymlinkInfo(symlinkInfo) {
  console.log("=".repeat(80));
  
  log(`📄 ${symlinkInfo.fileName}`, "cyan");
  log(`   路徑: ${symlinkInfo.fullPath}`, "blue");
  log(`   指向: ${symlinkInfo.target}`, "blue");
  
  if (symlinkInfo.isValid) {
    success(`   狀態: 有效`);
    if (symlinkInfo.targetSize !== null) {
      log(`   大小: ${formatFileSize(symlinkInfo.targetSize)}`, "cyan");
    }
  } else {
    error(`   狀態: 損壞 (目標不存在)`);
  }
  
  if (symlinkInfo.targetPath) {
    log(`   完整目標路徑: ${symlinkInfo.targetPath}`, "magenta");
  }
}

/**
 * 顯示統計信息
 */
function displayStatistics(symlinks) {
  console.log("\n" + "=".repeat(80));
  log("📊 統計:", "cyan");
  
  const total = symlinks.length;
  const valid = symlinks.filter(s => s.isValid).length;
  const broken = total - valid;
  
  log(`   總數: ${total}`, "blue");
  
  if (valid > 0) {
    success(`   ✓ 有效: ${valid}`);
  }
  
  if (broken > 0) {
    error(`   ✗ 損壞: ${broken}`);
  }
  
  console.log("=".repeat(80));
}

/**
 * 主程式
 */
function main() {
  const args = process.argv.slice(2);
  
  console.log("=".repeat(50));
  log("🔍 符號連結檢查工具", "blue");
  console.log("=".repeat(50));

  // 如果提供了特定檔案路徑
  if (args.length > 0) {
    const filePath = args[0];
    
    log(`\n🔗 符號連結信息`, "cyan");
    
    const result = checkSymlink(filePath);
    
    if (!result.isSymlink) {
      if (result.error) {
        error(`檢查失敗: ${result.error}`);
      } else {
        warning(`${result.fileName} 不是符號連結`);
      }
      return;
    }
    
    displaySymlinkInfo(result);
    return;
  }

  // 預設掃描 db 目錄
  const projectRoot = path.resolve(__dirname, "..");
  const dbDir = path.join(projectRoot, "db");
  
  log(`\n📂 掃描目錄: ${dbDir}`, "cyan");
  
  if (!fs.existsSync(dbDir)) {
    error("db 目錄不存在");
    log("💡 請確認您在正確的專案目錄中執行此腳本", "yellow");
    return;
  }

  const symlinks = scanDirectory(dbDir);
  
  if (symlinks.length === 0) {
    warning("沒有找到符號連結");
    return;
  }

  log(`\n🔗 符號連結列表`, "cyan");
  
  symlinks.forEach(symlink => {
    displaySymlinkInfo(symlink);
  });
  
  displayStatistics(symlinks);
}

// 執行
main();
