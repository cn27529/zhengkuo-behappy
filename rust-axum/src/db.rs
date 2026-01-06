// src/db.rs
use sqlx::sqlite::{SqliteConnectOptions, SqliteJournalMode, SqlitePool, SqlitePoolOptions, SqliteSynchronous};
use std::str::FromStr;
use std::time::Duration;

/// 從環境變數讀取配置並創建 SQLite 連接池
pub async fn create_pool() -> Result<SqlitePool, sqlx::Error> {
    // 讀取數據庫 URL
    let database_url = std::env::var("DATABASE_URL")
        .expect("DATABASE_URL 必須在 .env 文件中設置");

    tracing::info!("📦 連接數據庫: {}", database_url);

    // 讀取 Journal Mode（預設 WAL）
    let journal_mode = std::env::var("SQLITE_JOURNAL_MODE")
        .unwrap_or_else(|_| "WAL".to_string())
        .to_uppercase();
    
    let journal_mode = match journal_mode.as_str() {
        "DELETE" => SqliteJournalMode::Delete,
        "TRUNCATE" => SqliteJournalMode::Truncate,
        "PERSIST" => SqliteJournalMode::Persist,
        "MEMORY" => SqliteJournalMode::Memory,
        "WAL" => SqliteJournalMode::Wal,
        _ => {
            tracing::warn!("⚠️🦀 [Rust] 無效的 SQLITE_JOURNAL_MODE: {}，使用預設 WAL", journal_mode);
            SqliteJournalMode::Wal
        }
    };

    // 讀取 Synchronous 模式（預設 NORMAL）
    let synchronous = std::env::var("SQLITE_SYNCHRONOUS")
        .unwrap_or_else(|_| "NORMAL".to_string())
        .to_uppercase();
    
    let synchronous = match synchronous.as_str() {
        "OFF" => SqliteSynchronous::Off,
        "NORMAL" => SqliteSynchronous::Normal,
        "FULL" => SqliteSynchronous::Full,
        "EXTRA" => SqliteSynchronous::Extra,
        _ => {
            tracing::warn!("⚠️🦀 [Rust] 無效的 SQLITE_SYNCHRONOUS: {}，使用預設 NORMAL", synchronous);
            SqliteSynchronous::Normal
        }
    };

    // 讀取忙碌超時（預設 5 秒）
    let busy_timeout = std::env::var("SQLITE_BUSY_TIMEOUT")
        .ok()
        .and_then(|v| v.parse::<u64>().ok())
        .unwrap_or(5);

    // 配置 SQLite 連接選項
    let connect_options = SqliteConnectOptions::from_str(&database_url)?
        .create_if_missing(false)                         // 不自動創建數據庫（使用現有的）
        .journal_mode(journal_mode)                       // 設置日誌模式
        .synchronous(synchronous)                         // 設置同步模式
        .busy_timeout(Duration::from_secs(busy_timeout)); // 設置忙碌超時

    tracing::info!("⚙️🦀 [Rust] SQLite 配置:");
    tracing::info!("  - Journal Mode: {:?}", journal_mode);
    tracing::info!("  - Synchronous: {:?}", synchronous);
    tracing::info!("  - Busy Timeout: {} 秒", busy_timeout);

    // 讀取連接池配置
    let max_connections = std::env::var("DATABASE_MAX_CONNECTIONS")
        .ok()
        .and_then(|v| v.parse::<u32>().ok())
        .unwrap_or(5);

    let acquire_timeout = std::env::var("DATABASE_ACQUIRE_TIMEOUT")
        .ok()
        .and_then(|v| v.parse::<u64>().ok())
        .unwrap_or(3);

    tracing::info!("🔗🦀 [Rust] 連接池配置:");
    tracing::info!("  - 最大連接數: {}", max_connections);
    tracing::info!("  - 獲取連接超時: {} 秒", acquire_timeout);

    // 創建連接池
    let pool = SqlitePoolOptions::new()
        .max_connections(max_connections)                    // 最大連接數
        .acquire_timeout(Duration::from_secs(acquire_timeout)) // 獲取連接超時
        .connect_with(connect_options)
        .await?;

    tracing::info!("✅🦀 [Rust] SQLite 數據庫連接池創建成功");
    
    Ok(pool)
}

/// 測試數據庫連接
pub async fn test_connection(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    tracing::info!("🧪🦀 [Rust] 測試數據庫連接...");
    
    sqlx::query("SELECT 1")
        .fetch_one(pool)
        .await?;
    
    tracing::info!("✅🦀 [Rust] 數據庫連接測試成功");
    Ok(())
}

/// 獲取數據庫統計信息
pub async fn get_db_stats(pool: &SqlitePool) -> Result<DbStats, sqlx::Error> {
    // 獲取表列表
    let tables: Vec<(String,)> = sqlx::query_as(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    )
    .fetch_all(pool)
    .await?;

    let table_names: Vec<String> = tables.into_iter().map(|(name,)| name).collect();

    // 獲取數據庫大小（頁數）
    let page_count: (i64,) = sqlx::query_as("PRAGMA page_count")
        .fetch_one(pool)
        .await?;

    let page_size: (i64,) = sqlx::query_as("PRAGMA page_size")
        .fetch_one(pool)
        .await?;

    let size_bytes = page_count.0 * page_size.0;

    Ok(DbStats {
        table_count: table_names.len(),
        table_names,
        size_bytes,
        size_mb: size_bytes as f64 / (1024.0 * 1024.0),
    })
}

/// 數據庫統計信息
#[derive(Debug)]
pub struct DbStats {
    pub table_count: usize,
    pub table_names: Vec<String>,
    #[allow(dead_code)]
    pub size_bytes: i64,
    pub size_mb: f64,
}