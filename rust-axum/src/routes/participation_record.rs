// src/routes/participation_record.rs
use axum::{
    routing::{delete, get, patch, post},
    Router,
};

use crate::handlers::participation_record;

/// 創建參與記錄相關的路由
pub fn create_routes() -> Router {
    Router::new()
        // 獲取所有參與記錄（支持查詢參數）
        .route("/api/participation-records", get(participation_record::get_all_participation_records))
        // 創建新參與記錄
        .route("/api/participation-records", post(participation_record::create_participation_record))
        // 根據數據庫 ID 獲取參與記錄
        .route("/api/participation-records/{id}", get(participation_record::get_participation_record_by_id))
        // 更新參與記錄
        .route("/api/participation-records/{id}", patch(participation_record::update_participation_record))
        // 刪除參與記錄
        .route("/api/participation-records/{id}", delete(participation_record::delete_participation_record))
        // 根據 registrationId 獲取參與記錄
        .route(
            "/api/participation-records/by-registration/{registration_id}",
            get(participation_record::get_participation_record_by_registration_id),
        )
        // 根據 activityId 獲取參與記錄
        .route(
            "/api/participation-records/by-activity/{activity_id}",
            get(participation_record::get_participation_record_by_activity_id),
        )
}
