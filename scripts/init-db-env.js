#!/usr/bin/env node

/**
 * 資料庫初始化腳本
 * 用於首次設置或重置資料庫環境
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 路徑配置
const ROOT_DIR = path.join(__dirname, '..');
const DB_DIR = path.join(ROOT_DIR, 'db');
const CONFIG_DIR = path.join(ROOT_DIR, 'config');
const SERVER_DIR = path.join(ROOT_DIR, 'server');
const RUST_DIR = path.join(ROOT_DIR, 'rust-axum');

// 初始化函數
function init() {
  log('\n🚀 初始化資料庫環境...', 'cyan');
  
  // 1. 創建必要目錄
  log('\n📁 創建目錄結構...', 'cyan');
  [DB_DIR, CONFIG_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      log(`  ✓ 創建: ${path.relative(ROOT_DIR, dir)}`, 'green');
    } else {
      log(`  - 已存在: ${path.relative(ROOT_DIR, dir)}`, 'yellow');
    }
  });
  
  // 2. 檢查配置文件
  log('\n⚙️  檢查配置文件...', 'cyan');
  const configFile = path.join(CONFIG_DIR, 'clients.json');
  if (!fs.existsSync(configFile)) {
    log(`  ✗ clients.json 不存在`, 'yellow');
    log(`  💡 請先創建 config/clients.json`, 'cyan');
  } else {
    log(`  ✓ clients.json 存在`, 'green');
    
    // 讀取並驗證配置
    try {
      const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
      log(`  ✓ 配置有效`, 'green');
      log(`  ✓ 當前客戶: ${config.current_client}`, 'green');
      log(`  ✓ 客戶數量: ${Object.keys(config.clients).length}`, 'green');
    } catch (error) {
      log(`  ✗ 配置文件格式錯誤: ${error.message}`, 'yellow');
    }
  }
  
  // 3. 創建 .env.template 文件
  log('\n📝 創建環境變數模板...', 'cyan');
  
  // Server .env.template
  const serverEnvTemplate = path.join(SERVER_DIR, '.env.template');
  if (!fs.existsSync(serverEnvTemplate)) {
    const serverEnvContent = `# Directus JWT 設置
KEY="mT5qR8vW2tZ4cV7bN1mK3jH6gF9dA2sJ5hG8fD1kS4pX7yB0wM3rC6eU9iQ2"
SECRET="xLp9vW2tZ5cV8bN1mK4jH7gF0dA3sJ6hG9fD2kS5pX8yB1wM4rC7eU0iQ3tZ6vN1mK4jH7gF0dA3sJ6hG9fD2kS5pX8yB1wM4rC7eU0iQ3"

# 認證配置
ACCESS_TOKEN_TTL="24h"
REFRESH_TOKEN_TTL="30d"

# 資料庫配置（使用符號連結）
DB_CLIENT="sqlite3"
DB_FILENAME="../db/current.db"

# 伺服器配置
HOST="127.0.0.1"
PORT="8055"
PUBLIC_URL="http://localhost:8055"

# CORS 配置
CORS_ENABLED="true"
CORS_ORIGIN="http://localhost:5173"
`;
    fs.writeFileSync(serverEnvTemplate, serverEnvContent);
    log(`  ✓ 創建: server/.env.template`, 'green');
  } else {
    log(`  - 已存在: server/.env.template`, 'yellow');
  }
  
  // Rust .env.template
  const rustEnvTemplate = path.join(RUST_DIR, '.env.template');
  if (!fs.existsSync(rustEnvTemplate)) {
    const rustEnvContent = `# Rust Axum Backend 配置
HOST=127.0.0.1
PORT=3000

# SQLite 數據庫配置（使用符號連結）
DATABASE_URL=sqlite:../db/current.db

# SQLite 連接池配置
DATABASE_MAX_CONNECTIONS=5
DATABASE_ACQUIRE_TIMEOUT=3

# SQLite 性能優化配置
SQLITE_JOURNAL_MODE=WAL
SQLITE_SYNCHRONOUS=NORMAL
SQLITE_BUSY_TIMEOUT=5

# JWT 配置
JWT_SECRET="xLp9vW2tZ5cV8bN1mK4jH7gF0dA3sJ6hG9fD2kS5pX8yB1wM4rC7eU0iQ3tZ6vN1mK4jH7gF0dA3sJ6hG9fD2kS5pX8yB1wM4rC7eU0iQ3"
JWT_EXPIRATION=604800

# CORS 配置
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:8055

# 日誌配置
RUST_LOG=debug
`;
    fs.writeFileSync(rustEnvTemplate, rustEnvContent);
    log(`  ✓ 創建: rust-axum/.env.template`, 'green');
  } else {
    log(`  - 已存在: rust-axum/.env.template`, 'yellow');
  }
  
  // 4. 複製 .env.template 到 .env（如果不存在）
  log('\n🔧 設置環境變數...', 'cyan');
  
  const serverEnv = path.join(SERVER_DIR, '.env');
  if (!fs.existsSync(serverEnv)) {
    fs.copyFileSync(serverEnvTemplate, serverEnv);
    log(`  ✓ 創建: server/.env`, 'green');
  } else {
    log(`  - 已存在: server/.env`, 'yellow');
  }
  
  const rustEnv = path.join(RUST_DIR, '.env');
  if (!fs.existsSync(rustEnv)) {
    fs.copyFileSync(rustEnvTemplate, rustEnv);
    log(`  ✓ 創建: rust-axum/.env`, 'green');
  } else {
    log(`  - 已存在: rust-axum/.env`, 'yellow');
  }
  
  // 5. 總結
  log('\n✅ 初始化完成！', 'green');
  log('\n📋 下一步:', 'cyan');
  log('  1. 檢查 config/clients.json 配置', 'cyan');
  log('  2. 運行: npm run client:switch 少林寺', 'cyan');
  log('  3. 運行: npm run dev', 'cyan');
  log('');
}

// 執行
init();
