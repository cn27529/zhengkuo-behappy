// src/handlers/activity.rs
use axum::{
    extract::{Extension, Path, Query},
    http::StatusCode,
    Json,
};
use sqlx::SqlitePool;

use crate::models::activity::{
    Activity, ActivityQuery, ApiResponse, CreateActivityRequest, Meta, UpdateActivityRequest,
};

/// 獲取所有活動
pub async fn get_all_activities(
    Query(params): Query<ActivityQuery>,
    Extension(pool): Extension<SqlitePool>,
) -> Result<Json<ApiResponse<Vec<Activity>>>, (StatusCode, Json<ApiResponse<Vec<Activity>>>)> {
    // 構建查詢
    let mut query = String::from("SELECT * FROM activityDB WHERE 1=1");
    let mut count_query = String::from("SELECT COUNT(*) FROM activityDB WHERE 1=1");

    // 添加過濾條件
    if let Some(state) = &params.state {
        let condition = format!(" AND state = '{}'", state);
        query.push_str(&condition);
        count_query.push_str(&condition);
    }

    if let Some(item_type) = &params.item_type {
        let condition = format!(" AND item_type = '{}'", item_type);
        query.push_str(&condition);
        count_query.push_str(&condition);
    }

    // 添加排序
    if let Some(sort) = &params.sort {
        if sort.starts_with('-') {
            let field = &sort[1..];
            query.push_str(&format!(" ORDER BY {} DESC", field));
        } else {
            query.push_str(&format!(" ORDER BY {} ASC", sort));
        }
    } else {
        query.push_str(" ORDER BY date DESC");
    }

    // 添加分頁
    let limit = params.limit.unwrap_or(100);
    let offset = params.offset.unwrap_or(0);
    query.push_str(&format!(" LIMIT {} OFFSET {}", limit, offset));

    tracing::debug!("執行查詢: {}", query);

    // 執行查詢
    let activities = sqlx::query_as::<_, Activity>(&query)
        .fetch_all(&pool)
        .await
        .map_err(|e| {
            tracing::error!("查詢活動失敗: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error(format!("查詢失敗: {}", e))),
            )
        })?;

    // 獲取總數
    let total: (i64,) = sqlx::query_as(&count_query)
        .fetch_one(&pool)
        .await
        .map_err(|e| {
            tracing::error!("查詢總數失敗: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error(format!("查詢總數失敗: {}", e))),
            )
        })?;

    Ok(Json(ApiResponse::success_with_meta(
        activities,
        Meta {
            total: total.0,
            limit: Some(limit),
            offset: Some(offset),
        },
    )))
}

/// 根據 ID 獲取單個活動
pub async fn get_activity_by_id(
    Path(id): Path<i64>,
    Extension(pool): Extension<SqlitePool>,
) -> Result<Json<ApiResponse<Activity>>, (StatusCode, Json<ApiResponse<Activity>>)> {
    let activity = sqlx::query_as::<_, Activity>("SELECT * FROM activityDB WHERE id = ?")
        .bind(id)
        .fetch_optional(&pool)
        .await
        .map_err(|e| {
            tracing::error!("查詢活動失敗: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error(format!("查詢失敗: {}", e))),
            )
        })?;

    match activity {
        Some(activity) => Ok(Json(ApiResponse::success(activity))),
        None => Err((
            StatusCode::NOT_FOUND,
            Json(ApiResponse::error(format!("找不到 ID 為 {} 的活動", id))),
        )),
    }
}

/// 根據 activityId 獲取活動
pub async fn get_activity_by_activity_id(
    Path(activity_id): Path<String>,
    Extension(pool): Extension<SqlitePool>,
) -> Result<Json<ApiResponse<Activity>>, (StatusCode, Json<ApiResponse<Activity>>)> {
    let activity =
        sqlx::query_as::<_, Activity>("SELECT * FROM activityDB WHERE activityId = ?")
            .bind(&activity_id)
            .fetch_optional(&pool)
            .await
            .map_err(|e| {
                tracing::error!("查詢活動失敗: {}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(ApiResponse::error(format!("查詢失敗: {}", e))),
                )
            })?;

    match activity {
        Some(activity) => Ok(Json(ApiResponse::success(activity))),
        None => Err((
            StatusCode::NOT_FOUND,
            Json(ApiResponse::error(format!(
                "找不到 activityId 為 {} 的活動",
                activity_id
            ))),
        )),
    }
}

/// 創建新活動（不處理 Directus 系統字段，讓 Directus 管理）
pub async fn create_activity(
    Extension(pool): Extension<SqlitePool>,
    Json(payload): Json<CreateActivityRequest>,
) -> Result<Json<ApiResponse<Activity>>, (StatusCode, Json<ApiResponse<Activity>>)> {
    // 檢查 activityId 是否已存在
    let exists: (i64,) =
        sqlx::query_as("SELECT COUNT(*) FROM activityDB WHERE activityId = ?")
            .bind(&payload.activity_id)
            .fetch_one(&pool)
            .await
            .map_err(|e| {
                tracing::error!("檢查活動 ID 失敗: {}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(ApiResponse::error(format!("檢查失敗: {}", e))),
                )
            })?;

    if exists.0 > 0 {
        return Err((
            StatusCode::CONFLICT,
            Json(ApiResponse::error(format!(
                "activityId '{}' 已存在",
                payload.activity_id
            ))),
        ));
    }

    // 生成當前時間戳
    let now = chrono::Utc::now().to_rfc3339();

    // 插入新記錄（只插入業務字段，Directus 字段保持 NULL）
    let result = sqlx::query(
        r#"
        INSERT INTO activityDB (
            activityId, name, item_type, participants, date, 
            state, icon, description, location, createdAt, updatedAt
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#,
    )
    .bind(&payload.activity_id)
    .bind(&payload.name)
    .bind(&payload.item_type)
    .bind(payload.participants)
    .bind(&payload.date)
    .bind(&payload.state)
    .bind(&payload.icon)
    .bind(&payload.description)
    .bind(&payload.location)
    .bind(&now)
    .bind(&now)
    .execute(&pool)
    .await
    .map_err(|e| {
        tracing::error!("創建活動失敗: {}", e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::error(format!("創建失敗: {}", e))),
        )
    })?;

    let id = result.last_insert_rowid();

    // 返回創建的記錄
    let activity = sqlx::query_as::<_, Activity>("SELECT * FROM activityDB WHERE id = ?")
        .bind(id)
        .fetch_one(&pool)
        .await
        .map_err(|e| {
            tracing::error!("查詢新創建的活動失敗: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error(format!("查詢失敗: {}", e))),
            )
        })?;

    Ok(Json(ApiResponse::success_with_message(
        activity,
        "成功創建活動".to_string(),
    )))
}

/// 更新活動
pub async fn update_activity(
    Path(id): Path<i64>,
    Extension(pool): Extension<SqlitePool>,
    Json(payload): Json<UpdateActivityRequest>,
) -> Result<Json<ApiResponse<Activity>>, (StatusCode, Json<ApiResponse<Activity>>)> {
    // 檢查活動是否存在
    let exists: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM activityDB WHERE id = ?")
        .bind(id)
        .fetch_one(&pool)
        .await
        .map_err(|e| {
            tracing::error!("檢查活動失敗: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error(format!("檢查失敗: {}", e))),
            )
        })?;

    if exists.0 == 0 {
        return Err((
            StatusCode::NOT_FOUND,
            Json(ApiResponse::error(format!("找不到 ID 為 {} 的活動", id))),
        ));
    }

    // 構建動態更新語句
    let mut updates = Vec::new();
    let mut bindings: Vec<String> = Vec::new();

    if let Some(name) = &payload.name {
        updates.push("name = ?");
        bindings.push(name.clone());
    }
    if let Some(item_type) = &payload.item_type {
        updates.push("item_type = ?");
        bindings.push(item_type.clone());
    }
    if let Some(participants) = payload.participants {
        updates.push("participants = ?");
        bindings.push(participants.to_string());
    }
    if let Some(date) = &payload.date {
        updates.push("date = ?");
        bindings.push(date.clone());
    }
    if let Some(state) = &payload.state {
        updates.push("state = ?");
        bindings.push(state.clone());
    }
    if let Some(icon) = &payload.icon {
        updates.push("icon = ?");
        bindings.push(icon.clone());
    }
    if let Some(description) = &payload.description {
        updates.push("description = ?");
        bindings.push(description.clone());
    }
    if let Some(location) = &payload.location {
        updates.push("location = ?");
        bindings.push(location.clone());
    }

    if updates.is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ApiResponse::error("沒有提供要更新的字段".to_string())),
        ));
    }

    // 添加 updatedAt
    let now = chrono::Utc::now().to_rfc3339();
    updates.push("updatedAt = ?");
    bindings.push(now);

    let query = format!(
        "UPDATE activityDB SET {} WHERE id = ?",
        updates.join(", ")
    );

    let mut query_builder = sqlx::query(&query);
    for binding in bindings {
        query_builder = query_builder.bind(binding);
    }
    query_builder = query_builder.bind(id);

    query_builder.execute(&pool).await.map_err(|e| {
        tracing::error!("更新活動失敗: {}", e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::error(format!("更新失敗: {}", e))),
        )
    })?;

    // 返回更新後的記錄
    let activity = sqlx::query_as::<_, Activity>("SELECT * FROM activityDB WHERE id = ?")
        .bind(id)
        .fetch_one(&pool)
        .await
        .map_err(|e| {
            tracing::error!("查詢更新後的活動失敗: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error(format!("查詢失敗: {}", e))),
            )
        })?;

    Ok(Json(ApiResponse::success_with_message(
        activity,
        "成功更新活動".to_string(),
    )))
}

/// 刪除活動
pub async fn delete_activity(
    Path(id): Path<i64>,
    Extension(pool): Extension<SqlitePool>,
) -> Result<Json<ApiResponse<()>>, (StatusCode, Json<ApiResponse<()>>)> {
    let result = sqlx::query("DELETE FROM activityDB WHERE id = ?")
        .bind(id)
        .execute(&pool)
        .await
        .map_err(|e| {
            tracing::error!("刪除活動失敗: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error(format!("刪除失敗: {}", e))),
            )
        })?;

    if result.rows_affected() == 0 {
        return Err((
            StatusCode::NOT_FOUND,
            Json(ApiResponse::error(format!("找不到 ID 為 {} 的活動", id))),
        ));
    }

    Ok(Json(ApiResponse {
        success: true,
        data: None,
        message: Some("成功刪除活動".to_string()),
        meta: None,
        errors: None,
    }))
}