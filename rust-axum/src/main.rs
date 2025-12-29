// fn main() {
//     println!("Hello, world!");
// }

use axum::{
    routing::get,
    Router,
    Extension,
};
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;

mod db;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 加載 .env 文件
    dotenv::dotenv().ok();

    // 初始化日誌
    tracing_subscriber::fmt()
        .with_env_filter(
            std::env::var("RUST_LOG")
                .unwrap_or_else(|_| "debug".to_string())
        )
        .init();

    // 創建數據庫連接池
    let pool = db::create_pool().await?;

    // 運行數據庫遷移 (如果有)
    // db::run_migrations(&pool).await?;

    // 配置 CORS
    let cors = CorsLayer::permissive(); // 開發環境，生產環境需要更嚴格的配置

    // 創建路由
    let app = Router::new()
        .route("/", get(|| async { "Hello from Axum + SQLite!" }))
        .route("/health", get(health_check))
        .route("/db-test", get(db_test))
        .layer(cors)
        .layer(Extension(pool));  // 添加數據庫連接池到 Extension

    // 啟動服務器
    let host = std::env::var("HOST").unwrap_or_else(|_| "127.0.0.1".to_string());
    let port = std::env::var("PORT")
        .unwrap_or_else(|_| "3000".to_string())
        .parse::<u16>()?;

    let addr = SocketAddr::from((
        host.parse::<std::net::IpAddr>()?,
        port
    ));

    tracing::info!("🚀 服務器運行在 http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

async fn health_check() -> &'static str {
    "OK"
}

// 測試數據庫連接
async fn db_test(
    Extension(pool): Extension<sqlx::SqlitePool>,
) -> String {
    match sqlx::query("SELECT 1 as test")
        .fetch_one(&pool)
        .await
    {
        Ok(_) => "✅ 數據庫連接正常".to_string(),
        Err(e) => format!("❌ 數據庫連接失敗: {}", e),
    }
}