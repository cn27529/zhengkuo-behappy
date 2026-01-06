// src/routes/activity.rs
use axum::{
    routing::{delete, get, patch, post},
    Router,
};

use crate::handlers::activity;

/// 創建活動相關的路由
pub fn create_routes() -> Router {
    Router::new()
        // 獲取所有活動（支持查詢參數）
        .route("/api/activities", get(activity::get_all_activities))
        // 創建新活動
        .route("/api/activities", post(activity::create_activity))
        // 根據數據庫 ID 獲取活動 - ✅ 修正：使用 {id} 而不是 :id
        .route("/api/activities/{id}", get(activity::get_activity_by_id))
        // 更新活動 - ✅ 修正：使用 {id} 而不是 :id
        .route("/api/activities/{id}", patch(activity::update_activity))
        // 刪除活動 - ✅ 修正：使用 {id} 而不是 :id
        .route("/api/activities/{id}", delete(activity::delete_activity))
        // 根據 activityId 獲取活動 - ✅ 修正：使用 {activity_id} 而不是 :activity_id
        .route(
            "/api/activities/by-activity-id/{activity_id}",
            get(activity::get_activity_by_activity_id),
        )
}