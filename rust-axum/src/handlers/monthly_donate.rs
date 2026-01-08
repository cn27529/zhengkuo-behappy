// src/handlers/monthly_donate.rs
use axum::{
    extract::{Extension, Path, Query},
    http::StatusCode,
    Json,
};
use sqlx::SqlitePool;

// 導入共享的 API 響應結構
use crate::models::api_response::{ApiResponse, Meta};

use crate::models::monthly_donate::{
    CreateMonthlyDonateRequest, MonthlyDonate, MonthlyDonateResponse, MonthlyDonateQuery, UpdateMonthlyDonateRequest,
};

const MONTHLY_DONATE_FULL_QUERY: &str = r#"
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
    name,
    registrationId,
    donateId,
    donateType,
    donateItems,
    memo,
    createdAt,
    updatedAt
FROM monthlyDonateDB
"#;

/// 獲取所有每月捐款記錄
pub async fn get_all_monthly_donates(
    Query(params): Query<MonthlyDonateQuery>,
    Extension(pool): Extension<SqlitePool>,
) -> Result<Json<ApiResponse<Vec<MonthlyDonateResponse>>>, (StatusCode, Json<ApiResponse<Vec<MonthlyDonateResponse>>>)> {
    let mut query = format!("{} WHERE 1=1", MONTHLY_DONATE_FULL_QUERY);
    let mut count_query = String::from("SELECT COUNT(*) FROM monthlyDonateDB WHERE 1=1");

    // 添加過濾條件
    if let Some(name) = &params.name {
        let condition = format!(" AND name LIKE '%{}%'", name);
        query.push_str(&condition);
        count_query.push_str(&condition);
    }

    if let Some(registration_id) = &params.registration_id {
        let condition = format!(" AND registrationId = {}", registration_id);
        query.push_str(&condition);
        count_query.push_str(&condition);
    }

    if let Some(donate_id) = &params.donate_id {
        let condition = format!(" AND donateId = '{}'", donate_id);
        query.push_str(&condition);
        count_query.push_str(&condition);
    }

    if let Some(donate_type) = &params.donate_type {
        let condition = format!(" AND donateType = '{}'", donate_type);
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
        query.push_str(" ORDER BY createdAt DESC");
    }

    // 添加分頁
    let limit = params.limit.unwrap_or(100);
    let offset = params.offset.unwrap_or(0);
    query.push_str(&format!(" LIMIT {} OFFSET {}", limit, offset));

    // 執行查詢
    let monthly_donates = sqlx::query_as::<_, MonthlyDonate>(&query)
        .fetch_all(&pool)
        .await
        .map_err(|e| {
            tracing::error!("查詢每月捐款記錄失敗: {}", e);
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
            tracing::error!("查詢每月捐款記錄總數失敗: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error(format!("查詢總數失敗: {}", e))),
            )
        })?;

    // 🔥 關鍵：將 Vec<MonthlyDonate> 轉換為 Vec<MonthlyDonateResponse>
    let responses: Vec<MonthlyDonateResponse> = monthly_donates
        .into_iter()
        .map(|donate| donate.into())
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

/// 根據 donateId 獲取捐款記錄
pub async fn get_monthly_donate_by_donate_id(
    Path(donate_id): Path<String>,
    Extension(pool): Extension<SqlitePool>,
) -> Result<Json<ApiResponse<MonthlyDonateResponse>>, (StatusCode, Json<ApiResponse<MonthlyDonateResponse>>)> {
    
    let query = format!("{} WHERE donateId = ?", MONTHLY_DONATE_FULL_QUERY);
    let monthly_donate = sqlx::query_as::<_, MonthlyDonate>(&query)
        .bind(&donate_id)
        .fetch_optional(&pool)
        .await
        .map_err(|e| {
            tracing::error!("查詢每月捐款記錄失敗: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error(format!("查詢失敗: {}", e))),
            )
        })?;

    match monthly_donate {
        Some(monthly_donate) => {
            // 🔥 轉換為 MonthlyDonateResponse
            let response: MonthlyDonateResponse = monthly_donate.into();
            Ok(Json(ApiResponse::success(response)))
        },
        None => Err((
            StatusCode::NOT_FOUND,
            Json(ApiResponse::error(format!("找不到 donateId 為 {} 的捐款記錄", donate_id))),
        )),
    }
}

/// 根據 registrationId 獲取捐款記錄
pub async fn get_monthly_donate_by_registration_id(
    Path(registration_id): Path<i64>,
    Extension(pool): Extension<SqlitePool>,
) -> Result<Json<ApiResponse<MonthlyDonateResponse>>, (StatusCode, Json<ApiResponse<MonthlyDonateResponse>>)> {
    
    let query = format!("{} WHERE registrationId = ?", MONTHLY_DONATE_FULL_QUERY);
    let monthly_donate = sqlx::query_as::<_, MonthlyDonate>(&query)
        .bind(registration_id)
        .fetch_optional(&pool)
        .await
        .map_err(|e| {
            tracing::error!("查詢每月捐款記錄失敗: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error(format!("查詢失敗: {}", e))),
            )
        })?;

    match monthly_donate {
        Some(monthly_donate) => {
            // 🔥 轉換為 MonthlyDonateResponse
            Ok(Json(ApiResponse::success(monthly_donate.into())))
        },
        None => Err((
            StatusCode::NOT_FOUND,
            Json(ApiResponse::error(format!("找不到 registrationId 為 {} 的捐款記錄", registration_id))),
        )),
    }
}   

/// 根據 donateType 獲取捐款記錄
pub async fn get_monthly_donate_by_donate_type(
    Path(donate_type): Path<String>,
    Extension(pool): Extension<SqlitePool>,
) -> Result<Json<ApiResponse<MonthlyDonateResponse>>, (StatusCode, Json<ApiResponse<MonthlyDonateResponse>>)> {
    
    let query = format!("{} WHERE donateType = ?", MONTHLY_DONATE_FULL_QUERY);
    let monthly_donate = sqlx::query_as::<_, MonthlyDonate>(&query)
        .bind(&donate_type)
        .fetch_optional(&pool)
        .await
        .map_err(|e| {
            tracing::error!("查詢每月捐款記錄失敗: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error(format!("查詢失敗: {}", e))),
            )
        })?;

    match monthly_donate {
        Some(monthly_donate) => {
            // 🔥 轉換為 MonthlyDonateResponse
            Ok(Json(ApiResponse::success(monthly_donate.into())))
        },
        None => Err((
            StatusCode::NOT_FOUND,
            Json(ApiResponse::error(format!("找不到 donateType 為 {} 的捐款記錄", donate_type))),
        )),
    }
}

/// 根據 ID 獲取單個捐款記錄
pub async fn get_monthly_donate_by_id(
    Path(id): Path<i64>,
    Extension(pool): Extension<SqlitePool>,
) -> Result<Json<ApiResponse<MonthlyDonateResponse>>, (StatusCode, Json<ApiResponse<MonthlyDonateResponse>>)> {
    
    let query = format!("{} WHERE id = ?", MONTHLY_DONATE_FULL_QUERY);
    let monthly_donate = sqlx::query_as::<_, MonthlyDonate>(&query)
        .bind(id)
        .fetch_optional(&pool)
        .await
        .map_err(|e| {
            tracing::error!("查詢每月捐款記錄失敗: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error(format!("查詢失敗: {}", e))),
            )
        })?;

    match monthly_donate {
        Some(monthly_donate) => {
            // 🔥 轉換為 MonthlyDonateResponse
            Ok(Json(ApiResponse::success(monthly_donate.into())))
        },
        None => Err((
            StatusCode::NOT_FOUND,
            Json(ApiResponse::error(format!("找不到 ID 為 {} 的捐款記錄", id))),
        )),
    }
}

/// 創建新每月捐款記錄
pub async fn create_monthly_donate(
    Extension(pool): Extension<SqlitePool>,
    Json(payload): Json<CreateMonthlyDonateRequest>,
) -> Result<Json<ApiResponse<MonthlyDonateResponse>>, (StatusCode, Json<ApiResponse<MonthlyDonateResponse>>)> {
    // 生成當前時間戳
    let now = chrono::Utc::now().to_rfc3339();

    // 確定 user_created 的值
    // let user_created_value = payload.user_created.unwrap_or_else(|| {
    //     "system".to_string()
    // });

    // 🔥 將 JsonValue 轉換為字符串存入資料庫
    let donate_items_str = payload.donate_items.map(|v| v.to_string());

    // 插入新記錄
    let result = sqlx::query(
        r#"
        INSERT INTO monthlyDonateDB (
            name, registrationId, donateId, donateType, 
            donateItems, memo, createdAt, updatedAt
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        "#,
    )
    //.bind(&user_created_value)
    .bind(&payload.name)
    .bind(&payload.registration_id)
    .bind(&payload.donate_id)
    .bind(&payload.donate_type)
    .bind(&donate_items_str)
    .bind(&payload.memo)
    .bind(&now)
    .bind(&now)
    .execute(&pool)
    .await
    .map_err(|e| {
        tracing::error!("創建每月捐款記錄失敗: {}", e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::error(format!("創建失敗: {}", e))),
        )
    })?;

    let id = result.last_insert_rowid();

    // 返回創建的記錄
    let query = format!("{} WHERE id = ?", MONTHLY_DONATE_FULL_QUERY);
    let monthly_donate = sqlx::query_as::<_, MonthlyDonate>(&query)
        .bind(id)
        .fetch_one(&pool)
        .await
        .map_err(|e| {
            tracing::error!("查詢新創建的每月捐款記錄失敗: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error(format!("查詢失敗: {}", e))),
            )
        })?;

    // 🔥 轉換為 MonthlyDonateResponse
    Ok(Json(ApiResponse::success_with_message(
        monthly_donate.into(),
        "成功創建每月捐款記錄".to_string(),
    )))
}

/// 更新每月捐款記錄
pub async fn update_monthly_donate(
    Path(id): Path<i64>,
    Extension(pool): Extension<SqlitePool>,
    Json(payload): Json<UpdateMonthlyDonateRequest>,
) -> Result<Json<ApiResponse<MonthlyDonateResponse>>, (StatusCode, Json<ApiResponse<MonthlyDonateResponse>>)> {
    // 檢查記錄是否存在
    let exists: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM monthlyDonateDB WHERE id = ?")
        .bind(id)
        .fetch_one(&pool)
        .await
        .map_err(|e| {
            tracing::error!("檢查每月捐款記錄失敗: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error(format!("檢查失敗: {}", e))),
            )
        })?;

    if exists.0 == 0 {
        return Err((
            StatusCode::NOT_FOUND,
            Json(ApiResponse::error(format!("找不到 ID 為 {} 的捐款記錄", id))),
        ));
    }

    // 構建動態更新語句
    let mut updates = Vec::new();
    let mut bindings: Vec<String> = Vec::new();

    if let Some(name) = &payload.name {
        updates.push("name = ?");
        bindings.push(name.clone());
    }
    if let Some(registration_id) = &payload.registration_id {
        updates.push("registrationId = ?");
        bindings.push(registration_id.to_string());
    }
    if let Some(donate_id) = &payload.donate_id {
        updates.push("donateId = ?");
        bindings.push(donate_id.clone());
    }
    if let Some(donate_type) = &payload.donate_type {
        updates.push("donateType = ?");
        bindings.push(donate_type.clone());
    }
    
    // 🔥 將 JsonValue 轉換為字符串
    if let Some(donate_items) = &payload.donate_items {
        updates.push("donateItems = ?");
        bindings.push(donate_items.to_string());
    }

    if let Some(memo) = &payload.memo {
        updates.push("memo = ?");
        bindings.push(memo.clone());
    }

    // 在更新語句中添加 user_updated
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

    // 添加 updatedAt
    let now = chrono::Utc::now().to_rfc3339();
    updates.push("updatedAt = ?");
    bindings.push(now);

    let query = format!(
        "UPDATE monthlyDonateDB SET {} WHERE id = ?",
        updates.join(", ")
    );

    let mut query_builder = sqlx::query(&query);
    for binding in bindings {
        query_builder = query_builder.bind(binding);
    }
    query_builder = query_builder.bind(id);

    query_builder.execute(&pool).await.map_err(|e| {
        tracing::error!("更新每月捐款記錄失敗: {}", e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::error(format!("更新失敗: {}", e))),
        )
    })?;

    // 返回更新後的記錄
    let query = format!("{} WHERE id = ?", MONTHLY_DONATE_FULL_QUERY);
    let monthly_donate = sqlx::query_as::<_, MonthlyDonate>(&query)
        .bind(id)
        .fetch_one(&pool)
        .await
        .map_err(|e| {
            tracing::error!("查詢更新後的每月捐款記錄失敗: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error(format!("查詢失敗: {}", e))),
            )
        })?;

    // 🔥 轉換為 MonthlyDonateResponse
    Ok(Json(ApiResponse::success_with_message(
        monthly_donate.into(),
        "成功更新每月捐款記錄".to_string(),
    )))
}

/// 刪除每月捐款記錄
pub async fn delete_monthly_donate(
    Path(id): Path<i64>,
    Extension(pool): Extension<SqlitePool>,
) -> Result<Json<ApiResponse<()>>, (StatusCode, Json<ApiResponse<()>>)> {
    let result = sqlx::query("DELETE FROM monthlyDonateDB WHERE id = ?")
        .bind(id)
        .execute(&pool)
        .await
        .map_err(|e| {
            tracing::error!("刪除每月捐款記錄失敗: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error(format!("刪除失敗: {}", e))),
            )
        })?;

    if result.rows_affected() == 0 {
        return Err((
            StatusCode::NOT_FOUND,
            Json(ApiResponse::error(format!("找不到 ID 為 {} 的捐款記錄", id))),
        ));
    }

    Ok(Json(ApiResponse {
        success: true,
        data: None,
        message: Some("成功刪除每月捐款記錄".to_string()),
        meta: None,
        errors: None,
    }))
}