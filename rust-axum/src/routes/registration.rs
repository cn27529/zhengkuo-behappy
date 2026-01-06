// src/routes/registration.rs
use axum::{
    routing::{delete, get, patch, post},
    Router,
};

use crate::handlers::registration;

/// 創建報名記錄相關的路由
pub fn create_routes() -> Router {
    Router::new()
        // 獲取所有報名記錄（支持查詢參數）
        .route("/api/registrations", get(registration::get_all_registrations))
        // 創建新報名記錄
        .route("/api/registrations", post(registration::create_registration))
        // 根據數據庫 ID 獲取報名記錄
        .route("/api/registrations/{id}", get(registration::get_registration_by_id))
        // 更新報名記錄
        .route("/api/registrations/{id}", patch(registration::update_registration))
        // 刪除報名記錄
        .route("/api/registrations/{id}", delete(registration::delete_registration))
        // 根據 formId 獲取報名記錄
        .route(
            "/api/registrations/by-form-id/{form_id}",
            get(registration::get_registration_by_form_id),
        )
        // 根據 state 獲取報名記錄
        .route("/api/registrations/by-state/{state}",
            get(registration::get_registration_by_state)
        )
        .route("/api/registrations/by-user/{user_id}",
            get(registration::get_registration_by_user)
        )
}