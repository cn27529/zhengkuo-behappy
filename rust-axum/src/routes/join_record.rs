// src/routes/join_record.rs
use axum::{
    routing::{delete, get, patch, post},
    Router,
};

use crate::handlers::join_record;

/// 創建參與記錄相關的路由
pub fn create_routes() -> Router {
    Router::new()
        // 獲取所有參與記錄（支持查詢參數）
        .route("/api/join-records", get(join_record::get_all_join_records))
        // 創建新參與記錄
        .route("/api/join-records", post(join_record::create_join_record))
        // 根據數據庫 ID 獲取參與記錄
        .route("/api/join-records/{id}", get(join_record::get_join_record_by_id))
        // 更新參與記錄
        .route("/api/join-records/{id}", patch(join_record::update_join_record))
        // 刪除參與記錄
        .route("/api/join-records/{id}", delete(join_record::delete_join_record))
        // 根據 registrationId 獲取參與記錄
        .route(
            "/api/join-records/by-registration/{registration_id}",
            get(join_record::get_join_record_by_registration_id),
        )
        // 根據 activityId 獲取參與記錄
        .route(
            "/api/join-records/by-activity/{activity_id}",
            get(join_record::get_join_record_by_activity_id),
        )
}
