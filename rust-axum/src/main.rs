// src/main.rs
use axum::{routing::get, Extension, Json, Router};
use serde_json::{json, Value};
use sqlx::Row;  // ✅ 添加這行！
use std::net::SocketAddr;
use tower_http::cors::{Any, CorsLayer};

mod db;
mod handlers;
mod models;
mod routes;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 加載 .env 文件
    dotenv::dotenv().ok();

    // 初始化日誌
    tracing_subscriber::fmt()
        .with_env_filter(std::env::var("RUST_LOG").unwrap_or_else(|_| "debug".to_string()))
        .init();

    tracing::info!("🚀🦀 [Rust] Axum 啟動後端服務...");
    tracing::info!("📦 使用現有 Directus SQLite 數據庫");

    // 創建數據庫連接池（連接到 Directus 的數據庫）
    let pool = db::create_pool().await?;

    // 測試數據庫連接
    if let Err(e) = db::test_connection(&pool).await {
        tracing::error!("❌🦀 [Rust] 數據庫連接測試失敗: {}", e);
        return Err(e.into());
    }

    // 顯示數據庫統計信息
    match db::get_db_stats(&pool).await {
        Ok(stats) => {
            tracing::info!("📊 數據庫統計:");
            tracing::info!("  - 表數量: {}", stats.table_count);
            tracing::info!("  - 數據庫大小: {:.2} MB", stats.size_mb);
            tracing::info!("  - 表列表: {:?}", stats.table_names);
        }
        Err(e) => {
            tracing::warn!("⚠️🦀 [Rust] 無法獲取數據庫統計: {}", e);
        }
    }

    // ⚠️ 不運行遷移！直接使用 Directus 創建的表
    tracing::info!("✅🦀 [Rust] 數據庫連接成功，使用 Directus 管理的表結構");

    // 配置 CORS
    // 當 allow_credentials(true) 時，不能同時使用 allow_headers(Any)（即 *）。
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);
        //.allow_credentials(true);  // 如果需要 cookie/認證

    // 創建活動路由
    let activity_routes = routes::activity::create_routes();
    let registration_routes =  routes::registration::create_routes();

    // 創建主路由
    let app = Router::new()
        .route("/", get(root_handler))
        .route("/health", get(health_check))
        .route("/db-test", get(db_test))
        .merge(activity_routes) // 合併活動路由
        .merge(registration_routes) // 合併報名記錄路由
        .layer(cors)
        .layer(Extension(pool)); // 添加數據庫連接池

    // 啟動服務器
    let host = std::env::var("HOST").unwrap_or_else(|_| "127.0.0.1".to_string());
    let port = std::env::var("PORT")
        .unwrap_or_else(|_| "3000".to_string())
        .parse::<u16>()?;

    let addr = SocketAddr::from((host.parse::<std::net::IpAddr>()?, port));

    tracing::info!("🚀🦀 [Rust] 服務器運行在 http://{}", addr);
    // tracing::info!("");
    // tracing::info!("📚 API 端點:");
    // tracing::info!("  健康檢查:");
    // tracing::info!("    GET    /health                    - 服務健康狀態");
    // tracing::info!("    GET    /db-test                   - 數據庫連接測試");
    // tracing::info!("");
    // tracing::info!("  活動 API:");
    // tracing::info!("    GET    /api/activities            - 獲取所有活動");
    // tracing::info!("    POST   /api/activities            - 創建新活動");
    // tracing::info!("    GET    /api/activities/:id        - 獲取單個活動");
    // tracing::info!("    PATCH  /api/activities/:id        - 更新活動");
    // tracing::info!("    DELETE /api/activities/:id        - 刪除活動");
    // tracing::info!("");
    tracing::info!("💡🦀 [Rust] 提示: Directus 管理 Auth，Axum 處理數據 CRUD");

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

async fn root_handler() -> Json<Value> {
    Json(json!({
        "name": "Rust Axum Backend",
        "version": "0.1.0",
        "status": "running",
        "description": "數據 API 後端 (與 Directus 共享 SQLite)",
        "endpoints": {
            "health": "/health",
            "activities": "/api/activities",
            "db_test": "/db-test"
        },
        "architecture": {
            "auth_backend": "Directus (login, users, permissions)",
            "data_backend": "Rust Axum (CRUD operations)",
            "database": "Shared SQLite"
        }
    }))
}

async fn health_check() -> Json<Value> {
    Json(json!({
        "status": "OK",
        "timestamp": chrono::Utc::now().to_rfc3339(),
        "service": "Rust Axum Data API"
    }))
}

async fn db_test(Extension(pool): Extension<sqlx::SqlitePool>) -> Json<Value> {
    // 測試數據庫連接並檢查 activityDB 表
    match sqlx::query("SELECT COUNT(*) as count FROM activityDB")
        .fetch_one(&pool)
        .await
    {
        Ok(row) => {
            let count: i64 = row.try_get("count").unwrap_or(0);
            Json(json!({
                "success": true,
                "message": "✅ 數據庫連接正常",
                "database": "Directus SQLite",
                "activityDB_count": count
            }))
        }
        Err(e) => Json(json!({
            "success": false,
            "message": format!("❌ 數據庫連接失敗: {}", e)
        })),
    }
}