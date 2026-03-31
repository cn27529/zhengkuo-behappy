// src/handlers/price_config.rs
use axum::{
    extract::{Extension, Path, Query},
    http::StatusCode,
    Json,
};
use sqlx::SqlitePool;

use crate::models::api_response::{ApiResponse, Meta};
use crate::models::price_config::{
    CreatePriceConfigRequest, PriceConfig, PriceConfigResponse, PriceConfigQuery, UpdatePriceConfigRequest,
};

const PRICE_CONFIG_FULL_QUERY: &str = r#"
SELECT 
    id,
    user_created,
    CASE 
        WHEN date_created IS NOT NULL 
        THEN datetime(date_created / 1000, 'unixepoch') 
        ELSE NULL 
    END as date_created,
    user_updated,
    CASE 
        WHEN date_updated IS NOT NULL 
        THEN datetime(date_updated / 1000, 'unixepoch') 
        ELSE NULL 
    END as date_updated,
    version,
    state,
    prices,
    notes,
    enableDate,
    createdAt,
    updatedAt
FROM priceConfigDB
"#;

pub async fn get_all_price_configs(
    Query(params): Query<PriceConfigQuery>,
    Extension(pool): Extension<SqlitePool>,
) -> Result<Json<ApiResponse<Vec<PriceConfigResponse>>>, (StatusCode, Json<ApiResponse<Vec<PriceConfigResponse>>>)> {
    let mut query = format!("{} WHERE 1=1", PRICE_CONFIG_FULL_QUERY);
    let mut count_query = String::from("SELECT COUNT(*) FROM priceConfigDB WHERE 1=1");

    if let Some(version) = &params.version {
        let condition = format!(" AND version LIKE '%{}%'", version);
        query.push_str(&condition);
        count_query.push_str(&condition);
    }

    if let Some(state) = &params.state {
        let condition = format!(" AND state = '{}'", state);
        query.push_str(&condition);
        count_query.push_str(&condition);
    }

    if let Some(sort) = &params.sort {
        if sort.starts_with('-') {
            let field = &sort[1..];
            query.push_str(&format!(" ORDER BY {} DESC", field));
        } else {
            query.push_str(&format!(" ORDER BY {} ASC", sort));
        }
    } else {
        query.push_str(" ORDER BY date_created DESC");
    }

    let limit = params.limit.unwrap_or(100);
    let offset = params.offset.unwrap_or(0);
    query.push_str(&format!(" LIMIT {} OFFSET {}", limit, offset));

    let price_config_list = sqlx::query_as::<_, PriceConfig>(&query)
        .fetch_all(&pool)
        .await
        .map_err(|e| {
            tracing::error!("查詢 priceConfig 失敗: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error(format!("查詢失敗: {}", e))),
            )
        })?;

    let total: (i64,) = sqlx::query_as(&count_query)
        .fetch_one(&pool)
        .await
        .map_err(|e| {
            tracing::error!("查詢 priceConfig 總數失敗: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error(format!("查詢總數失敗: {}", e))),
            )
        })?;

    let responses: Vec<PriceConfigResponse> = price_config_list
        .into_iter()
        .map(|data| data.into())
        .collect();

    Ok(Json(ApiResponse::success_with_meta(
        responses,
        Meta {
            total: total.0,
            limit: Some(limit),
            offset: Some(offset),
        },
    )))
}

pub async fn get_price_config_by_id(
    Path(id): Path<i64>,
    Extension(pool): Extension<SqlitePool>,
) -> Result<Json<ApiResponse<PriceConfigResponse>>, (StatusCode, Json<ApiResponse<PriceConfigResponse>>)> {
    let query = format!("{} WHERE id = ?", PRICE_CONFIG_FULL_QUERY);
    let price_config = sqlx::query_as::<_, PriceConfig>(&query)
        .bind(&id)
        .fetch_optional(&pool)
        .await
        .map_err(|e| {
            tracing::error!("查詢 priceConfig 失敗: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error(format!("查詢失敗: {}", e))),
            )
        })?;

    match price_config {
        Some(data) => Ok(Json(ApiResponse::success(data.into()))),
        None => Err((
            StatusCode::NOT_FOUND,
            Json(ApiResponse::error(format!("找不到 ID 為 {} 的記錄", id))),
        )),
    }
}

pub async fn get_price_config_by_state(
    Path(state): Path<String>,
    Extension(pool): Extension<SqlitePool>,
) -> Result<Json<ApiResponse<Vec<PriceConfigResponse>>>, (StatusCode, Json<ApiResponse<Vec<PriceConfigResponse>>>)> {
    let query = format!("{} WHERE state = ?", PRICE_CONFIG_FULL_QUERY);
    let price_config_list = sqlx::query_as::<_, PriceConfig>(&query)
        .bind(&state)
        .fetch_all(&pool)
        .await
        .map_err(|e| {
            tracing::error!("查詢 priceConfig 失敗: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error(format!("查詢失敗: {}", e))),
            )
        })?;

    let responses: Vec<PriceConfigResponse> = price_config_list
        .into_iter()
        .map(|data| data.into())
        .collect();

    Ok(Json(ApiResponse::success(responses)))
}

pub async fn create_price_config(
    Extension(pool): Extension<SqlitePool>,
    Json(payload): Json<CreatePriceConfigRequest>,
) -> Result<Json<ApiResponse<PriceConfigResponse>>, (StatusCode, Json<ApiResponse<PriceConfigResponse>>)> {
    let prices_str = payload.prices.map(|v| v.to_string());

    let result = sqlx::query(
        r#"
        INSERT INTO priceConfigDB (version, state, prices, notes, enableDate, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        "#,
    )
    .bind(&payload.version)
    .bind(&payload.state)
    .bind(&prices_str)
    .bind(&payload.notes)
    .bind(&payload.enable_date)
    .bind(&payload.created_at)
    .bind(&payload.updated_at)
    .execute(&pool)
    .await
    .map_err(|e| {
        tracing::error!("創建 priceConfig 失敗: {}", e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::error(format!("創建失敗: {}", e))),
        )
    })?;

    let id = result.last_insert_rowid();

    let query = format!("{} WHERE id = ?", PRICE_CONFIG_FULL_QUERY);
    let price_config = sqlx::query_as::<_, PriceConfig>(&query)
        .bind(id)
        .fetch_one(&pool)
        .await
        .map_err(|e| {
            tracing::error!("查詢新創建的 priceConfig 失敗: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error(format!("查詢失敗: {}", e))),
            )
        })?;

    Ok(Json(ApiResponse::success_with_message(
        price_config.into(),
        "成功創建記錄".to_string(),
    )))
}

pub async fn update_price_config(
    Path(id): Path<i64>,
    Extension(pool): Extension<SqlitePool>,
    Json(payload): Json<UpdatePriceConfigRequest>,
) -> Result<Json<ApiResponse<PriceConfigResponse>>, (StatusCode, Json<ApiResponse<PriceConfigResponse>>)> {
    let exists: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM priceConfigDB WHERE id = ?")
        .bind(&id)
        .fetch_one(&pool)
        .await
        .map_err(|e| {
            tracing::error!("檢查 priceConfig 失敗: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error(format!("檢查失敗: {}", e))),
            )
        })?;

    if exists.0 == 0 {
        return Err((
            StatusCode::NOT_FOUND,
            Json(ApiResponse::error(format!("找不到 ID 為 {} 的記錄", id))),
        ));
    }

    let mut updates = Vec::new();
    let mut bindings: Vec<String> = Vec::new();

    if let Some(version) = &payload.version {
        updates.push("version = ?");
        bindings.push(version.clone());
    }
    if let Some(state) = &payload.state {
        updates.push("state = ?");
        bindings.push(state.clone());
    }
    if let Some(prices) = &payload.prices {
        updates.push("prices = ?");
        bindings.push(prices.to_string());
    }
    if let Some(notes) = &payload.notes {
        updates.push("notes = ?");
        bindings.push(notes.clone());
    }
    if let Some(enable_date) = &payload.enable_date {
        updates.push("enableDate = ?");
        bindings.push(enable_date.clone());
    }
    if let Some(created_at) = &payload.created_at {
        updates.push("createdAt = ?");
        bindings.push(created_at.clone());
    }
    if let Some(updated_at) = &payload.updated_at {
        updates.push("updatedAt = ?");
        bindings.push(updated_at.clone());
    }
    if let Some(user_updated) = &payload.user_updated {
        updates.push("user_updated = ?");
        bindings.push(user_updated.clone());
    }

    if updates.is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ApiResponse::error("沒有提供要更新的字段".to_string())),
        ));
    }

    let query = format!("UPDATE priceConfigDB SET {} WHERE id = ?", updates.join(", "));
    let mut query_builder = sqlx::query(&query);
    for binding in bindings {
        query_builder = query_builder.bind(binding);
    }
    query_builder = query_builder.bind(&id);

    query_builder.execute(&pool).await.map_err(|e| {
        tracing::error!("更新 priceConfig 失敗: {}", e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::error(format!("更新失敗: {}", e))),
        )
    })?;

    let query = format!("{} WHERE id = ?", PRICE_CONFIG_FULL_QUERY);
    let price_config = sqlx::query_as::<_, PriceConfig>(&query)
        .bind(&id)
        .fetch_one(&pool)
        .await
        .map_err(|e| {
            tracing::error!("查詢更新後的 priceConfig 失敗: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error(format!("查詢失敗: {}", e))),
            )
        })?;

    Ok(Json(ApiResponse::success_with_message(
        price_config.into(),
        "成功更新記錄".to_string(),
    )))
}

pub async fn delete_price_config(
    Path(id): Path<i64>,
    Extension(pool): Extension<SqlitePool>,
) -> Result<Json<ApiResponse<()>>, (StatusCode, Json<ApiResponse<()>>)> {
    let result = sqlx::query("DELETE FROM priceConfigDB WHERE id = ?")
        .bind(&id)
        .execute(&pool)
        .await
        .map_err(|e| {
            tracing::error!("刪除 priceConfig 失敗: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error(format!("刪除失敗: {}", e))),
            )
        })?;

    if result.rows_affected() == 0 {
        return Err((
            StatusCode::NOT_FOUND,
            Json(ApiResponse::error(format!("找不到 ID 為 {} 的記錄", id))),
        ));
    }

    Ok(Json(ApiResponse {
        success: true,
        data: None,
        message: Some("成功刪除記錄".to_string()),
        meta: None,
        errors: None,
    }))
}