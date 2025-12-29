use sqlx::sqlite::{SqliteConnectOptions, SqlitePool, SqlitePoolOptions};
use std::str::FromStr;
use std::time::Duration;

pub async fn create_pool() -> Result<SqlitePool, sqlx::Error> {
    let database_url = std::env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set");

    // 配置 SQLite 連接選項
    let connect_options = SqliteConnectOptions::from_str(&database_url)?
        .create_if_missing(true)  // 自動創建數據庫文件
        .journal_mode(sqlx::sqlite::SqliteJournalMode::Wal)  // 使用 WAL 模式
        .synchronous(sqlx::sqlite::SqliteSynchronous::Normal)  // 設置同步模式
        .busy_timeout(Duration::from_secs(5));  // 設置忙碌超時

    // 創建連接池
    let pool = SqlitePoolOptions::new()
        .max_connections(5)  // 最大連接數
        .acquire_timeout(Duration::from_secs(3))  // 獲取連接超時
        .connect_with(connect_options)
        .await?;

    tracing::info!("✅ SQLite 數據庫連接成功");
    
    Ok(pool)
}

// 運行數據庫遷移
pub async fn run_migrations(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    tracing::info!("🔄 運行數據庫遷移...");
    
    sqlx::migrate!("./migrations")
        .run(pool)
        .await?;
    
    tracing::info!("✅ 數據庫遷移完成");
    Ok(())
}