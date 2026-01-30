#!/usr/bin/env node

/**
 * 符號連結檢查工具
 * 顯示所有符號連結的狀態
 */

const fs = require('fs');
const path = require('path');

// 顏色輸出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

const ROOT_DIR = path.join(__dirname, '..');
const DB_DIR = path.join(ROOT_DIR, 'db');

/**
 * 檢查文件是否為符號連結
 */
function checkSymlink(filePath) {
  try {
    const stats = fs.lstatSync(filePath);
    return stats.isSymbolicLink();
  } catch (error) {
    return false;
  }
}

/**
 * 獲取符號連結的目標
 */
function getSymlinkTarget(filePath) {
  try {
    return fs.readlinkSync(filePath);
  } catch (error) {
    return null;
  }
}

/**
 * 檢查目標文件是否存在
 */
function targetExists(linkPath) {
  try {
    // 使用 statSync 而非 lstatSync，會追蹤符號連結
    fs.statSync(linkPath);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 獲取文件大小
 */
function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    return `${sizeMB} MB`;
  } catch (error) {
    return 'N/A';
  }
}

/**
 * 掃描目錄中的符號連結
 */
function scanDirectory(dirPath) {
  const results = [];
  
  try {
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      
      if (checkSymlink(filePath)) {
        const target = getSymlinkTarget(filePath);
        const exists = targetExists(filePath);
        const size = exists ? getFileSize(filePath) : 'N/A';
        
        results.push({
          name: file,
          path: filePath,
          target: target,
          exists: exists,
          size: size,
        });
      }
    }
  } catch (error) {
    log(`✗ 無法掃描目錄: ${error.message}`, 'red');
  }
  
  return results;
}

/**
 * 顯示符號連結列表
 */
function displaySymlinks(symlinks) {
  if (symlinks.length === 0) {
    log('\n⚠️  未找到任何符號連結', 'yellow');
    return;
  }
  
  log(`\n${colors.bold}${colors.cyan}🔗 符號連結列表${colors.reset}`);
  log(`${'='.repeat(80)}`, 'cyan');
  
  symlinks.forEach((link) => {
    const statusIcon = link.exists ? '✓' : '✗';
    const statusColor = link.exists ? 'green' : 'red';
    const statusText = link.exists ? '有效' : '損壞';
    
    log(`\n📄 ${link.name}`, 'blue');
    log(`   路徑: ${link.path}`, 'cyan');
    log(`   指向: ${link.target}`, 'cyan');
    log(`   ${colors[statusColor]}${statusIcon} 狀態: ${statusText}${colors.reset}`);
    
    if (link.exists) {
      log(`   大小: ${link.size}`, 'cyan');
    } else {
      log(`   ⚠️  目標文件不存在！`, 'red');
    }
  });
  
  log(`\n${'='.repeat(80)}`, 'cyan');
  
  // 統計
  const validCount = symlinks.filter(s => s.exists).length;
  const brokenCount = symlinks.length - validCount;
  
  log(`\n📊 統計:`, 'cyan');
  log(`   總數: ${symlinks.length}`, 'blue');
  log(`   ${colors.green}✓ 有效: ${validCount}${colors.reset}`);
  
  if (brokenCount > 0) {
    log(`   ${colors.red}✗ 損壞: ${brokenCount}${colors.reset}`);
  }
  
  log('');
}

/**
 * 檢查特定文件
 */
function checkSpecificFile(filePath) {
  if (!fs.existsSync(filePath)) {
    log(`\n❌ 文件不存在: ${filePath}`, 'red');
    return;
  }
  
  if (!checkSymlink(filePath)) {
    log(`\n⚠️  這不是一個符號連結: ${filePath}`, 'yellow');
    
    // 顯示文件類型
    const stats = fs.lstatSync(filePath);
    if (stats.isFile()) {
      log(`   這是一個普通文件`, 'cyan');
      log(`   大小: ${getFileSize(filePath)}`, 'cyan');
    } else if (stats.isDirectory()) {
      log(`   這是一個目錄`, 'cyan');
    }
    return;
  }
  
  const target = getSymlinkTarget(filePath);
  const exists = targetExists(filePath);
  
  log(`\n${colors.bold}${colors.cyan}🔗 符號連結信息${colors.reset}`);
  log(`${'='.repeat(80)}`, 'cyan');
  log(`   文件: ${path.basename(filePath)}`, 'blue');
  log(`   完整路徑: ${filePath}`, 'cyan');
  log(`   指向: ${target}`, 'cyan');
  
  if (exists) {
    log(`   ${colors.green}✓ 狀態: 有效${colors.reset}`);
    log(`   目標大小: ${getFileSize(filePath)}`, 'cyan');
    
    // 顯示完整的目標路徑
    const fullTarget = path.resolve(path.dirname(filePath), target);
    log(`   完整目標路徑: ${fullTarget}`, 'cyan');
  } else {
    log(`   ${colors.red}✗ 狀態: 損壞${colors.reset}`);
    log(`   ⚠️  目標文件不存在！`, 'red');
  }
  
  log(`${'='.repeat(80)}\n`, 'cyan');
}

/**
 * 主程式
 */
function main() {
  const args = process.argv.slice(2);
  
  log(`\n${colors.bold}${colors.cyan}🔍 符號連結檢查工具${colors.reset}\n`);
  
  if (args.length > 0) {
    // 檢查指定的文件
    const targetPath = path.resolve(args[0]);
    checkSpecificFile(targetPath);
  } else {
    // 掃描 db 目錄
    if (!fs.existsSync(DB_DIR)) {
      log(`❌ db 目錄不存在: ${DB_DIR}`, 'red');
      log(`💡 請確認您在正確的專案目錄下執行此腳本\n`, 'yellow');
      return;
    }
    
    log(`📂 掃描目錄: ${DB_DIR}`, 'cyan');
    
    const symlinks = scanDirectory(DB_DIR);
    displaySymlinks(symlinks);
    
    // 額外檢查常見的符號連結
    const commonLinks = [
      path.join(DB_DIR, 'current.db'),
    ];
    
    const extraSymlinks = [];
    for (const linkPath of commonLinks) {
      if (fs.existsSync(linkPath) && checkSymlink(linkPath)) {
        const target = getSymlinkTarget(linkPath);
        const exists = targetExists(linkPath);
        const size = exists ? getFileSize(linkPath) : 'N/A';
        
        extraSymlinks.push({
          name: path.basename(linkPath),
          path: linkPath,
          target: target,
          exists: exists,
          size: size,
        });
      }
    }
    
    if (extraSymlinks.length > 0 && symlinks.length === 0) {
      displaySymlinks(extraSymlinks);
    }
  }
  
  log(`💡 使用方式:`, 'cyan');
  log(`   檢查 db 目錄: node scripts/check-symlinks.js`, 'blue');
  log(`   檢查特定文件: node scripts/check-symlinks.js db/current.db`, 'blue');
  log('');
}

// 執行
main();
