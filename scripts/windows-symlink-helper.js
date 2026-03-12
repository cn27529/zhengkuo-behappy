// scripts/windows-symlink-helper.js
// Windows 符號連結輔助工具

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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

/**
 * 檢查 Windows 是否啟用開發者模式
 */
function checkDeveloperMode() {
  try {
    const result = execSync('reg query "HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\AppModelUnlock" /v AllowDevelopmentWithoutDevLicense', { encoding: 'utf8' });
    return result.includes('0x1');
  } catch (error) {
    return false;
  }
}

/**
 * 檢查是否以管理員身份執行
 */
function checkAdminRights() {
  try {
    execSync('net session', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 使用 mklink 命令建立符號連結
 */
function createSymlinkWithMklink(target, link) {
  try {
    const targetPath = path.resolve(target);
    const linkPath = path.resolve(link);
    
    // 刪除已存在的連結
    if (fs.existsSync(linkPath)) {
      fs.unlinkSync(linkPath);
    }
    
    // 使用 mklink 建立符號連結
    execSync(`mklink "${linkPath}" "${targetPath}"`, { stdio: 'inherit' });
    return true;
  } catch (error) {
    log(`❌ mklink 失敗: ${error.message}`, 'red');
    return false;
  }
}

/**
 * 主要的符號連結建立函數
 */
function createSymlink(target, link) {
  const isWindows = process.platform === 'win32';
  
  if (!isWindows) {
    // 非 Windows 系統，使用標準方法
    try {
      if (fs.existsSync(link)) {
        fs.unlinkSync(link);
      }
      fs.symlinkSync(target, link);
      log(`✅ 符號連結建立成功: ${path.basename(link)} -> ${target}`, 'green');
      return { success: true, method: 'symlink' };
    } catch (error) {
      log(`❌ 符號連結建立失敗: ${error.message}`, 'red');
      return { success: false, error: error.message };
    }
  }
  
  // Windows 系統的處理
  log('🪟 Windows 環境，檢查符號連結支援...', 'cyan');
  
  const hasAdminRights = checkAdminRights();
  const hasDeveloperMode = checkDeveloperMode();
  
  log(`   管理員權限: ${hasAdminRights ? '✅' : '❌'}`, hasAdminRights ? 'green' : 'red');
  log(`   開發者模式: ${hasDeveloperMode ? '✅' : '❌'}`, hasDeveloperMode ? 'green' : 'red');
  
  // 方法 1: 嘗試使用 Node.js 原生方法
  if (hasAdminRights || hasDeveloperMode) {
    try {
      if (fs.existsSync(link)) {
        fs.unlinkSync(link);
      }
      fs.symlinkSync(target, link);
      log(`✅ 符號連結建立成功: ${path.basename(link)} -> ${target}`, 'green');
      return { success: true, method: 'nodejs-symlink' };
    } catch (error) {
      log(`⚠️  Node.js 符號連結失敗: ${error.message}`, 'yellow');
    }
  }
  
  // 方法 2: 嘗試使用 mklink 命令
  if (hasAdminRights) {
    log('🔧 嘗試使用 mklink 命令...', 'cyan');
    if (createSymlinkWithMklink(target, link)) {
      return { success: true, method: 'mklink' };
    }
  }
  
  // 方法 3: 備用方案 - 複製文件
  log('📋 使用複製作為備用方案...', 'yellow');
  try {
    if (fs.existsSync(link)) {
      fs.unlinkSync(link);
    }
    fs.copyFileSync(target, link);
    log(`✅ 文件複製成功: ${path.basename(link)} <- ${target}`, 'green');
    log(`⚠️  注意: 使用複製而非符號連結，文件將獨立存在`, 'yellow');
    return { success: true, method: 'copy', warning: '使用複製而非符號連結' };
  } catch (error) {
    log(`❌ 複製失敗: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

/**
 * 提供 Windows 符號連結的建議
 */
function provideWindowsAdvice() {
  const hasAdminRights = checkAdminRights();
  const hasDeveloperMode = checkDeveloperMode();
  
  if (hasAdminRights && hasDeveloperMode) {
    log('✅ 您的系統已完全支援符號連結', 'green');
    return;
  }
  
  log('\n💡 改善 Windows 符號連結支援的建議:', 'cyan');
  
  if (!hasAdminRights) {
    log('   1. 以管理員身份執行命令提示字元或 PowerShell', 'yellow');
    log('      - 右鍵點擊 "命令提示字元" 或 "PowerShell"', 'yellow');
    log('      - 選擇 "以系統管理員身分執行"', 'yellow');
  }
  
  if (!hasDeveloperMode) {
    log('   2. 啟用 Windows 開發者模式 (推薦)', 'yellow');
    log('      - 開啟 "設定" > "更新與安全性" > "開發人員專用"', 'yellow');
    log('      - 選擇 "開發人員模式"', 'yellow');
    log('      - 重新啟動電腦', 'yellow');
  }
  
  log('   3. 或者繼續使用複製模式 (功能正常但文件獨立)', 'yellow');
}

module.exports = {
  createSymlink,
  checkDeveloperMode,
  checkAdminRights,
  provideWindowsAdvice
};

// 如果直接執行此腳本，顯示系統資訊
if (require.main === module) {
  console.log('🪟 Windows 符號連結檢查工具');
  console.log('='.repeat(40));
  
  const hasAdminRights = checkAdminRights();
  const hasDeveloperMode = checkDeveloperMode();
  
  log(`作業系統: ${process.platform}`, 'cyan');
  log(`Node.js 版本: ${process.version}`, 'cyan');
  log(`管理員權限: ${hasAdminRights ? '✅ 是' : '❌ 否'}`, hasAdminRights ? 'green' : 'red');
  log(`開發者模式: ${hasDeveloperMode ? '✅ 已啟用' : '❌ 未啟用'}`, hasDeveloperMode ? 'green' : 'red');
  
  console.log('='.repeat(40));
  provideWindowsAdvice();
}