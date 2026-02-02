// src/main.rs
use axum::{routing::get, Extension, Json, Router};
use serde::{Serialize};
use serde_json::{json, Value};
use sqlx::{Row};
use std::net::SocketAddr;
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};
use axum_sql_viewer::{SqlViewerLayer};
use tokio::signal; // ⭐ 新增：用於處理關閉信號

mod db;
mod handlers;
mod models;
mod routes;

// 重新導出 ApiResponse 和 Meta,這樣編譯器知道它們被外部使用
pub use models::api_response::{ApiResponse, Meta};

// 應用狀態
#[derive(Clone)]
struct AppState {
    pool: sqlx::SqlitePool,
    start_time: chrono::DateTime<chrono::Utc>,
    version: String,
}

// Server Info 響應結構
#[derive(Serialize)]
struct ServerInfo {
    name: String,
    version: String,
    uptime_seconds: i64,
    database_connected: bool,
    database_type: String,
    database_path: String,
    database_stats: Option<serde_json::Value>, // 必須是這個類型才能接收 json! 宏的結果,
    current_time: String,
    architecture: Architecture,
}

#[derive(Serialize)]
struct Architecture {
    auth_backend: String,
    data_backend: String,
    database: String,
}

// Server Ping 響應結構
#[derive(Serialize)]
struct PingResponse {
    status: String,
    message: String,
    timestamp: String,
    database_ping: bool,
    response_time_ms: u128,
}

// ⭐ 新增：優雅關閉信號處理器
async fn shutdown_signal() {
    let ctrl_c = async {
        signal::ctrl_c()
            .await
            .expect("failed to install Ctrl+C handler");
    };

    #[cfg(unix)]
    let terminate = async {
        signal::unix::signal(signal::unix::SignalKind::terminate())
            .expect("failed to install signal handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => {
            tracing::info!("🛑 收到 Ctrl+C 信號，開始優雅關閉...");
        },
        _ = terminate => {
            tracing::info!("🛑 收到終止信號，開始優雅關閉...");
        },
    }
}

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

    // 創建數據庫連接池(連接到 Directus 的數據庫)
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

    // ⚠️ 不運行遷移,直接使用 Directus 創建的表
    tracing::info!("✅🦀 [Rust] 數據庫連接成功,使用 Directus 管理的表結構");

    
    
    // 創建應用狀態
    let state = Arc::new(AppState {
        pool: pool.clone(),
        start_time: chrono::Utc::now(),
        version: env!("CARGO_PKG_VERSION").to_string(),
    });

    // 配置 CORS
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // 創建活動路由
    let activity_routes = routes::activity::create_routes();
    let registration_routes = routes::registration::create_routes();
    let monthly_donate_routes = routes::monthly_donate::create_routes();
    let participation_record_routes = routes::participation_record::create_routes();
    
    // ✅ 創建 SqliteProvider(DatabaseProvider 的實現)
    let sql_viewer_router = SqlViewerLayer::sqlite("/sql-viewer", pool.clone()).into_router();

    // 創建主路由 - 使用 nest 而不是 merge
    let app = Router::new()
        .route("/", get(root_handler))
        .route("/health", get(health_check))
        .route("/db-test", get(db_test))
        // 添加 server info 和 ping 端點
        .route("/server/info", get(server_info))
        .route("/server/ping", get(server_ping))
        .merge(activity_routes)
        .merge(registration_routes)
        .merge(monthly_donate_routes)
        .merge(participation_record_routes)        
        // Add the SQL viewer at /sql-viewer
        .merge(sql_viewer_router)
        .layer(cors)
        .layer(Extension(state.clone()))
        .layer(Extension(pool.clone())); // ⭐ 修改：改用 clone，因為後面還要用 pool

    // 啟動服務器
    let host = std::env::var("HOST").unwrap_or_else(|_| "127.0.0.1".to_string());
    let port = std::env::var("PORT")
        .unwrap_or_else(|_| "3000".to_string())
        .parse::<u16>()?;

    let addr = SocketAddr::from((host.parse::<std::net::IpAddr>()?, port));

    tracing::info!("🚀🦀 [Rust] 服務器運行在 http://{}", addr);
    tracing::info!("");
    tracing::info!("📚 系統端點:");
    tracing::info!("  GET    /                           - 根路徑");
    tracing::info!("  GET    /health                     - 健康檢查");
    tracing::info!("  GET    /db-test                    - 數據庫測試");
    tracing::info!("  GET    /api/server/info            - 服務器信息");
    tracing::info!("  GET    /api/server/ping            - 服務器 Ping");
    tracing::info!("  GET    /sql-viewer                 - SQL 數據庫查看器");
    tracing::info!("");
    tracing::info!("  GET    /api/activities             - 活動列表");
    tracing::info!("  GET    /api/registrations          - 祈福登記列表");
    tracing::info!("  GET    /api/monthly-donates        - 每月捐款列表");
    tracing::info!("  GET    /api/participation-records  - 參與記錄列表");
    tracing::info!("");
    tracing::info!("💡🦀 [Rust] 提示: Directus 管理 Auth,Axum 處理數據 CRUD");

    let listener = tokio::net::TcpListener::bind(addr).await?;
    
    // ⭐ 修改：加入優雅關閉支援
    let graceful = axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal());
    
    // ⭐ 修改：等待服務器運行
    if let Err(e) = graceful.await {
        tracing::error!("❌ 服務器錯誤: {}", e);
    }
    
    // ⭐ 新增：優雅關閉數據庫
    tracing::info!("🔄 關閉數據庫連接池...");
    if let Err(e) = db::graceful_shutdown(pool).await {
        tracing::error!("❌ 數據庫關閉失敗: {}", e);
    }
    
    tracing::info!("👋 應用程式已完全關閉");

    Ok(())
}

async fn root_handler() -> Json<Value> {
     let host = std::env::var("HOST").unwrap_or_else(|_| "127.0.0.1".to_string());
    let port = std::env::var("PORT").unwrap_or_else(|_| "3000".to_string());
    
    Json(json!({
        "name": "Rust Axum Backend",
        "version": "0.1.0",
        "status": "running",
        "description": "數據 API 後端 (與 Directus 共享 SQLite)",
        "server": format!("http://{}:{}", host, port),
        "endpoints": {
            "health": "/health",
            "activities": "/api/activities",
            "registrations": "/api/registrations",
            "monthly_donates": "/api/monthly-donates",
            "participation_records": "/api/participation-records",
            "db_test": "/db-test",
            "sql_viewer": "/sql-viewer"
        },
        "architecture": {
            "auth_backend": "Directus (login, users, permissions)",
            "data_backend": "Rust Axum (CRUD operations)",
            "database": "Shared SQLite"
        }
    }))
}

async fn health_check(Extension(pool): Extension<sqlx::SqlitePool>) -> Json<Value> {

    // 1. 測試數據庫連線
    let is_connected = db::test_connection(&pool).await.is_ok();
    
    // 2. 獲取數據庫統計 (利用你 db.rs 寫好的函數)
    let db_stats = match db::get_db_stats(&pool).await {
        Ok(stats) => json!({
            "connected": is_connected,
            "table_count": stats.table_count,
            "size_mb": format!("{:.2} MB", stats.size_mb),
            // "tables": stats.table_names // 如果不想暴露表名可以註解掉
        }),
        Err(e) => json!({
            "connected": is_connected,
            "error": e.to_string()
        }),
    };

    Json(json!({
        "status": if is_connected { "healthy" } else { "unhealthy" },
        "timestamp": chrono::Utc::now().to_rfc3339(),
        "database": db_stats,
        "service": "Rust Axum Data API",
        "mode": "Read-Only (Shared with Directus)"
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

// Server Info 端點
async fn server_info(Extension(state): Extension<Arc<AppState>>) -> Json<ServerInfo> {
    // // 計算運行時間
    // let uptime = chrono::Utc::now() - state.start_time;

    // // 檢查數據庫連接 - 使用 db.rs 中的函數
    // let db_connected = db::test_connection(&state.pool).await.is_ok();

    // // 獲取數據庫路徑
    // let database_url = std::env::var("DATABASE_URL")
    //     .unwrap_or_else(|_| "未知".to_string())
    //     .replace("sqlite:", "");

    // let info = ServerInfo {
    //     name: "Rust Axum Backend".to_string(),
    //     version: state.version.clone(),
    //     uptime_seconds: uptime.num_seconds(),
    //     database_connected: db_connected,
    //     database_type: "SQLite".to_string(),
    //     database_path: database_url,
    //     current_time: chrono::Utc::now().to_rfc3339(),
    //     architecture: Architecture {
    //         auth_backend: "Directus".to_string(),
    //         data_backend: "Rust Axum".to_string(),
    //         database: "Shared SQLite".to_string(),
    //     },
    // };

    // Json(info)


    // 1. 計算運行時間
    let uptime = chrono::Utc::now() - state.start_time;

    // 2. 獲取數據庫統計信息 (調用 db.rs 中的函數)
    // 注意：因為 pool 是在 AppState 裡，所以用 state.pool
    let db_stats = db::get_db_stats(&state.pool).await.ok(); 

    // 3. 構建響應結構
    let info = ServerInfo {
        name: "Rust Axum Backend".to_string(),
        version: state.version.clone(),
        uptime_seconds: uptime.num_seconds(),
        database_connected: db_stats.is_some(),
        database_type: "SQLite".to_string(),
        database_path: std::env::var("DATABASE_URL")
            .unwrap_or_else(|_| "未知".to_string())
            .replace("sqlite:", ""),
        // 將 DbStats 轉換為 JSON Value
        database_stats: db_stats.map(|s| json!({
            "table_count": s.table_count,
            "size_mb": format!("{:.2} MB", s.size_mb), // 格式化輸出
            "tables": s.table_names,
        })),
        current_time: chrono::Utc::now().to_rfc3339(),
        architecture: Architecture {
            auth_backend: "Directus".to_string(),
            data_backend: "Rust Axum".to_string(),
            database: "Shared SQLite".to_string(),
        },
    };

    Json(info)

}

// Server Ping 端點
async fn server_ping(Extension(state): Extension<Arc<AppState>>) -> Json<PingResponse> {
    let start = std::time::Instant::now();
    let now = chrono::Utc::now();

    // 嘗試 ping 數據庫 - 使用 db.rs 中的函數
    let db_ping = db::test_connection(&state.pool).await.is_ok();

    let response_time = start.elapsed().as_millis();

    let response = PingResponse {
        status: if db_ping { "ok".to_string() } else { "degraded".to_string() },
        message: if db_ping {
            "服務器健康,數據庫響應正常".to_string()
        } else {
            "服務器運行中,但數據庫連接失敗".to_string()
        },
        timestamp: now.to_rfc3339(),
        database_ping: db_ping,
        response_time_ms: response_time,
    };

    Json(response)
}