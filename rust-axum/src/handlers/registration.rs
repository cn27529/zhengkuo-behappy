// src/handlers/registration.rs
use axum::{
    extract::{Extension, Path, Query},
    http::StatusCode,
    Json,
};
use sqlx::SqlitePool;

// 導入共享的 API 響應結構
use crate::models::api_response::{ApiResponse, Meta};

use crate::models::registration::{
    CreateRegistrationRequest, Registration, RegistrationResponse, RegistrationQuery, UpdateRegistrationRequest,
};

const REGISTRATION_FULL_QUERY: &str = r#"
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
    state,
    formId,
    formName,
    formSource,
    salvation,
    contact,
    blessing,
    createdAt,
    updatedAt
FROM registrationDB
"#;

/// 獲取所有報名記錄
pub async fn get_all_registrations(
    Query(params): Query<RegistrationQuery>,
    Extension(pool): Extension<SqlitePool>,
) -> Result<Json<ApiResponse<Vec<RegistrationResponse>>>, (StatusCode, Json<ApiResponse<Vec<RegistrationResponse>>>)> {
    let mut query = format!("{} WHERE 1=1", REGISTRATION_FULL_QUERY);
    let mut count_query = String::from("SELECT COUNT(*) FROM registrationDB WHERE 1=1");

    // 添加過濾條件
    if let Some(state) = &params.state {
        let condition = format!(" AND state = '{}'", state);
        query.push_str(&condition);
        count_query.push_str(&condition);
    }

    if let Some(form_id) = &params.form_id {
        let condition = format!(" AND formId = '{}'", form_id);
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
    let registrations = sqlx::query_as::<_, Registration>(&query)
        .fetch_all(&pool)
        .await
        .map_err(|e| {
            tracing::error!("查詢報名記錄失敗: {}", e);
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
            tracing::error!("查詢報名記錄總數失敗: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error(format!("查詢總數失敗: {}", e))),
            )
        })?;

    // 🔥 關鍵：將 Vec<Registration> 轉換為 Vec<RegistrationResponse>
    let responses: Vec<RegistrationResponse> = registrations
        .into_iter()
        .map(|reg| reg.into())
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

pub async fn get_registration_by_form_id(
    Path(form_id): Path<String>,
    Extension(pool): Extension<SqlitePool>,
) -> Result<Json<ApiResponse<RegistrationResponse>>, (StatusCode, Json<ApiResponse<RegistrationResponse>>)> {
    
    let query = format!("{} WHERE formId = ?", REGISTRATION_FULL_QUERY);
    let registration = sqlx::query_as::<_, Registration>(&query)
        .bind(&form_id)
        .fetch_optional(&pool)
        .await
        .map_err(|e| {
            tracing::error!("查詢報名記錄失敗: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error(format!("查詢失敗: {}", e))),
            )
        })?;

    match registration {
        Some(registration) => {
            // 🔥 轉換為 RegistrationResponse
            let response: RegistrationResponse = registration.into();
            Ok(Json(ApiResponse::success(response)))
        },
        None => Err((
            StatusCode::NOT_FOUND,
            Json(ApiResponse::error(format!("找不到 formId 為 {} 的報名記錄", form_id))),
        )),
    }
}

pub async fn get_registration_by_state(
    Path(state): Path<String>,
    Extension(pool): Extension<SqlitePool>,
) -> Result<Json<ApiResponse<RegistrationResponse>>, (StatusCode, Json<ApiResponse<RegistrationResponse>>)> {
    
    let query = format!("{} WHERE state = ?", REGISTRATION_FULL_QUERY);
    let registration = sqlx::query_as::<_, Registration>(&query)
        .bind(&state)
        .fetch_optional(&pool)
        .await
        .map_err(|e| {
            tracing::error!("查詢報名記錄失敗: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error(format!("查詢失敗: {}", e))),
            )
        })?;

    match registration {
        Some(registration) => {
            // 🔥 轉換為 RegistrationResponse
            Ok(Json(ApiResponse::success(registration.into())))
        },
        None => Err((
            StatusCode::NOT_FOUND,
            Json(ApiResponse::error(format!("找不到 state 為 {} 的報名記錄", state))),
        )),
    }
}   

pub async fn get_registration_by_user(
    Path(user_id): Path<String>,
    Extension(pool): Extension<SqlitePool>,
) -> Result<Json<ApiResponse<RegistrationResponse>>, (StatusCode, Json<ApiResponse<RegistrationResponse>>)> {
    
    let query = format!("{} WHERE user_created = ?", REGISTRATION_FULL_QUERY);
    let registration = sqlx::query_as::<_, Registration>(&query)
        .bind(&user_id)
        .fetch_optional(&pool)
        .await
        .map_err(|e| {
            tracing::error!("查詢報名記錄失敗: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error(format!("查詢失敗: {}", e))),
            )
        })?;

    match registration {
        Some(registration) => {
            // 🔥 轉換為 RegistrationResponse
            Ok(Json(ApiResponse::success(registration.into())))
        },
        None => Err((
            StatusCode::NOT_FOUND,
            Json(ApiResponse::error(format!("找不到 user_created 為 {} 的報名記錄", user_id))),
        )),
    }   
}

/// 根據 ID 獲取單個報名記錄
pub async fn get_registration_by_id(
    Path(id): Path<i64>,
    Extension(pool): Extension<SqlitePool>,
) -> Result<Json<ApiResponse<RegistrationResponse>>, (StatusCode, Json<ApiResponse<RegistrationResponse>>)> {
    
    let query = format!("{} WHERE id = ?", REGISTRATION_FULL_QUERY);
    let registration = sqlx::query_as::<_, Registration>(&query)
        .bind(id)
        .fetch_optional(&pool)
        .await
        .map_err(|e| {
            tracing::error!("查詢報名記錄失敗: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error(format!("查詢失敗: {}", e))),
            )
        })?;

    match registration {
        Some(registration) => {
            // 🔥 轉換為 RegistrationResponse
            Ok(Json(ApiResponse::success(registration.into())))
        },
        None => Err((
            StatusCode::NOT_FOUND,
            Json(ApiResponse::error(format!("找不到 ID 為 {} 的報名記錄", id))),
        )),
    }
}

/// 創建新報名記錄
pub async fn create_registration(
    Extension(pool): Extension<SqlitePool>,
    Json(payload): Json<CreateRegistrationRequest>,
) -> Result<Json<ApiResponse<RegistrationResponse>>, (StatusCode, Json<ApiResponse<RegistrationResponse>>)> {
    // 生成當前時間戳
    let now = chrono::Utc::now().to_rfc3339();

    // 確定 user_created 的值
    // let user_created_value = payload.user_created.unwrap_or_else(|| {
    //     "system".to_string()
    // });

    // 🔥 將 JsonValue 轉換為字符串存入資料庫
    let salvation_str = payload.salvation.map(|v| v.to_string());
    let contact_str = payload.contact.map(|v| v.to_string());
    let blessing_str = payload.blessing.map(|v| v.to_string());

    // 插入新記錄
    let result = sqlx::query(
        r#"
        INSERT INTO registrationDB (
            state, formId, formName, formSource, 
            salvation, contact, blessing, createdAt, updatedAt
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#,
    )
    //.bind(&user_created_value)
    .bind(&payload.state)
    .bind(&payload.form_id)
    .bind(&payload.form_name)
    .bind(&payload.form_source)
    .bind(&salvation_str)
    .bind(&contact_str)
    .bind(&blessing_str)
    .bind(&now)
    .bind(&now)
    .execute(&pool)
    .await
    .map_err(|e| {
        tracing::error!("創建報名記錄失敗: {}", e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::error(format!("創建失敗: {}", e))),
        )
    })?;

    let id = result.last_insert_rowid();

    // 返回創建的記錄
    let query = format!("{} WHERE id = ?", REGISTRATION_FULL_QUERY);
    let registration = sqlx::query_as::<_, Registration>(&query)
        .bind(id)
        .fetch_one(&pool)
        .await
        .map_err(|e| {
            tracing::error!("查詢新創建的報名記錄失敗: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error(format!("查詢失敗: {}", e))),
            )
        })?;

    // 🔥 轉換為 RegistrationResponse
    Ok(Json(ApiResponse::success_with_message(
        registration.into(),
        "成功創建報名記錄".to_string(),
    )))
}

/// 更新報名記錄
pub async fn update_registration(
    Path(id): Path<i64>,
    Extension(pool): Extension<SqlitePool>,
    Json(payload): Json<UpdateRegistrationRequest>,
) -> Result<Json<ApiResponse<RegistrationResponse>>, (StatusCode, Json<ApiResponse<RegistrationResponse>>)> {
    // 檢查記錄是否存在
    let exists: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM registrationDB WHERE id = ?")
        .bind(id)
        .fetch_one(&pool)
        .await
        .map_err(|e| {
            tracing::error!("檢查報名記錄失敗: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error(format!("檢查失敗: {}", e))),
            )
        })?;

    if exists.0 == 0 {
        return Err((
            StatusCode::NOT_FOUND,
            Json(ApiResponse::error(format!("找不到 ID 為 {} 的報名記錄", id))),
        ));
    }

    // 構建動態更新語句
    let mut updates = Vec::new();
    let mut bindings: Vec<String> = Vec::new();

    if let Some(state) = &payload.state {
        updates.push("state = ?");
        bindings.push(state.clone());
    }
    if let Some(form_id) = &payload.form_id {
        updates.push("formId = ?");
        bindings.push(form_id.clone());
    }
    if let Some(form_name) = &payload.form_name {
        updates.push("formName = ?");
        bindings.push(form_name.clone());
    }
    if let Some(form_source) = &payload.form_source {
        updates.push("formSource = ?");
        bindings.push(form_source.clone());
    }
    
    // 🔥 將 JsonValue 轉換為字符串
    if let Some(salvation) = &payload.salvation {
        updates.push("salvation = ?");
        bindings.push(salvation.to_string());
    }
    if let Some(contact) = &payload.contact {
        updates.push("contact = ?");
        bindings.push(contact.to_string());
    }
    if let Some(blessing) = &payload.blessing {
        updates.push("blessing = ?");
        bindings.push(blessing.to_string());
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
        "UPDATE registrationDB SET {} WHERE id = ?",
        updates.join(", ")
    );

    let mut query_builder = sqlx::query(&query);
    for binding in bindings {
        query_builder = query_builder.bind(binding);
    }
    query_builder = query_builder.bind(id);

    query_builder.execute(&pool).await.map_err(|e| {
        tracing::error!("更新報名記錄失敗: {}", e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::error(format!("更新失敗: {}", e))),
        )
    })?;

    // 返回更新後的記錄
    let query = format!("{} WHERE id = ?", REGISTRATION_FULL_QUERY);
    let registration = sqlx::query_as::<_, Registration>(&query)
        .bind(id)
        .fetch_one(&pool)
        .await
        .map_err(|e| {
            tracing::error!("查詢更新後的報名記錄失敗: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error(format!("查詢失敗: {}", e))),
            )
        })?;

    // 🔥 轉換為 RegistrationResponse
    Ok(Json(ApiResponse::success_with_message(
        registration.into(),
        "成功更新報名記錄".to_string(),
    )))
}

/// 刪除報名記錄
pub async fn delete_registration(
    Path(id): Path<i64>,
    Extension(pool): Extension<SqlitePool>,
) -> Result<Json<ApiResponse<()>>, (StatusCode, Json<ApiResponse<()>>)> {
    let result = sqlx::query("DELETE FROM registrationDB WHERE id = ?")
        .bind(id)
        .execute(&pool)
        .await
        .map_err(|e| {
            tracing::error!("刪除報名記錄失敗: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error(format!("刪除失敗: {}", e))),
            )
        })?;

    if result.rows_affected() == 0 {
        return Err((
            StatusCode::NOT_FOUND,
            Json(ApiResponse::error(format!("找不到 ID 為 {} 的報名記錄", id))),
        ));
    }

    Ok(Json(ApiResponse {
        success: true,
        data: None,
        message: Some("成功刪除報名記錄".to_string()),
        meta: None,
        errors: None,
    }))
}