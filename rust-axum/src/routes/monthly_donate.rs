// src/routes/monthly_donate.rs
use axum::{
    routing::{delete, get, patch, post},
    Router,
};

use crate::handlers::monthly_donate;

/// 創建每月捐款記錄相關的路由
pub fn create_routes() -> Router {
    Router::new()
        // 獲取所有每月捐款記錄（支持查詢參數）
        .route("/api/monthly-donates", get(monthly_donate::get_all_monthly_donates))
        // 創建新每月捐款記錄
        .route("/api/monthly-donates", post(monthly_donate::create_monthly_donate))
        // 根據數據庫 ID 獲取每月捐款記錄
        .route("/api/monthly-donates/:id", get(monthly_donate::get_monthly_donate_by_id))
        // 更新每月捐款記錄
        .route("/api/monthly-donates/:id", patch(monthly_donate::update_monthly_donate))
        // 刪除每月捐款記錄
        .route("/api/monthly-donates/:id", delete(monthly_donate::delete_monthly_donate))
        // 根據 donateId 獲取每月捐款記錄
        .route(
            "/api/monthly-donates/by-donate-id/:donate_id",
            get(monthly_donate::get_monthly_donate_by_donate_id),
        )
        // 根據 registrationId 獲取每月捐款記錄
        .route(
            "/api/monthly-donates/by-registration/:registration_id",
            get(monthly_donate::get_monthly_donate_by_registration_id),
        )
        // 根據 donateType 獲取每月捐款記錄
        .route(
            "/api/monthly-donates/by-type/:donate_type",
            get(monthly_donate::get_monthly_donate_by_donate_type),
        )
        // 以下是根據 rustMonthlyDonateService.js 中的方法添加的路由
        // 批量操作（Rust 特有功能）
        // .route(
        //     "/api/monthly-donates/batch",
        //     post(monthly_donate::batch_operations),
        // )
        // // 搜索贊助記錄（全文搜索）
        // .route(
        //     "/api/monthly-donates/search",
        //     post(monthly_donate::search_monthly_donates),
        // )
        // // 導出贊助數據
        // .route(
        //     "/api/monthly-donates/export",
        //     get(monthly_donate::export_monthly_donates),
        // )
        // // 獲取月度統計
        // .route(
        //     "/api/monthly-donates/stats/monthly",
        //     get(monthly_donate::get_monthly_donate_stats),
        // )
        // // 獲取捐贈統計
        // .route(
        //     "/api/monthly-donates/stats/donation",
        //     get(monthly_donate::get_donation_stats),
        // )
        // // 獲取捐贈類型統計
        // .route(
        //     "/api/monthly-donates/stats/types",
        //     get(monthly_donate::get_donation_type_stats),
        // )
        // // 獲取捐贈趨勢
        // .route(
        //     "/api/monthly-donates/stats/trend/:period",
        //     get(monthly_donate::get_donation_trend),
        // )
        // // 以下為 donateItems 操作方法的路由（需要額外實現）
        // // 新增指定贊助記錄
        // .route(
        //     "/api/monthly-donates/:id/items",
        //     post(monthly_donate::add_donate_item),
        // )
        // // 更新指定贊助記錄
        // .route(
        //     "/api/monthly-donates/:id/items/:items_id",
        //     patch(monthly_donate::update_donate_item),
        // )
        // // 刪除指定贊助記錄
        // .route(
        //     "/api/monthly-donates/:id/items/:items_id",
        //     delete(monthly_donate::delete_donate_item),
        // )
        // // 健康檢查
        // .route(
        //     "/api/monthly-donates/health",
        //     get(monthly_donate::health_check),
        // )
}