// src/handlers/directus_users.rs
use axum::{
    extract::{Extension, Path, Query},
    http::StatusCode,
    Json,
};
use sqlx::SqlitePool;

use crate::models::api_response::{ApiResponse, Meta};
use crate::models::directus_users::{DirectusUser, DirectusUserQuery, DirectusUserResponse};

/// 獲取所有用戶
pub async fn get_all_users(
    Query(params): Query<DirectusUserQuery>,
    Extension(pool): Extension<SqlitePool>,
) -> Result<Json<ApiResponse<Vec<DirectusUserResponse>>>, (StatusCode, Json<ApiResponse<Vec<DirectusUserResponse>>>)> {
    let mut query = String::from(
        "SELECT id, first_name, last_name, email, password, location, title, description, \
         tags, avatar, language, tfa_secret, status, role, token, \
         CASE WHEN last_access IS NOT NULL THEN datetime(last_access / 1000, 'unixepoch') ELSE NULL END as last_access, \
         last_page, provider, external_identifier, auth_data, email_notifications, \
         appearance, theme_dark, theme_light, theme_light_overrides, theme_dark_overrides, text_direction \
         FROM directus_users WHERE 1=1"
    );
    let mut count_query = String::from("SELECT COUNT(*) FROM directus_users WHERE 1=1");

    if let Some(status) = &params.status {
        let condition = format!(" AND status = '{}'", status);
        query.push_str(&condition);
        count_query.push_str(&condition);
    }

    if let Some(role) = &params.role {
        let condition = format!(" AND role = '{}'", role);
        query.push_str(&condition);
        count_query.push_str(&condition);
    }

    let users = sqlx::query_as::<_, DirectusUser>(&query)
        .fetch_all(&pool)
        .await
        .map_err(|e| {
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(format!("查詢失敗: {}", e))))
        })?;

    let total: (i64,) = sqlx::query_as(&count_query)
        .fetch_one(&pool)
        .await
        .map_err(|e| {
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(format!("查詢總數失敗: {}", e))))
        })?;

    let responses: Vec<DirectusUserResponse> = users.into_iter().map(|u| u.into()).collect();

    Ok(Json(ApiResponse::success_with_meta(
        responses,
        Meta { total: total.0, limit: None, offset: None },
    )))
}

/// 根據 ID 獲取單一用戶
pub async fn get_user_by_id(
    Path(id): Path<String>,
    Extension(pool): Extension<SqlitePool>,
) -> Result<Json<ApiResponse<DirectusUserResponse>>, (StatusCode, Json<ApiResponse<DirectusUserResponse>>)> {
    let user = sqlx::query_as::<_, DirectusUser>(
        "SELECT id, first_name, last_name, email, password, location, title, description, \
         tags, avatar, language, tfa_secret, status, role, token, \
         CASE WHEN last_access IS NOT NULL THEN datetime(last_access / 1000, 'unixepoch') ELSE NULL END as last_access, \
         last_page, provider, external_identifier, auth_data, email_notifications, \
         appearance, theme_dark, theme_light, theme_light_overrides, theme_dark_overrides, text_direction \
         FROM directus_users WHERE id = ?"
    )
        .bind(&id)
        .fetch_one(&pool)
        .await
        .map_err(|e| match e {
            sqlx::Error::RowNotFound => {
                (StatusCode::NOT_FOUND, Json(ApiResponse::error("用戶不存在".to_string())))
            }
            _ => {
                (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(format!("查詢失敗: {}", e))))
            }
        })?;

    Ok(Json(ApiResponse::success(user.into())))
}
