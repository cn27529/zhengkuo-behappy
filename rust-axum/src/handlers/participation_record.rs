// src/handlers/participation_record.rs
use axum::{
    extract::{Extension, Path, Query},
    http::StatusCode,
    Json,
};
use sqlx::SqlitePool;

// 導入共享的 API 響應結構
use crate::models::api_response::{ApiResponse, Meta};

use crate::models::participation_record::{
    CreateParticipationRecordRequest, ParticipationRecord, ParticipationRecordResponse, 
    ParticipationRecordQuery, UpdateParticipationRecordRequest,
};

const PARTICIPATION_RECORD_FULL_QUERY: &str = r#"
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
    registrationId,
    activityId,
    state,
    items,
    totalAmount,
    discountAmount,
    finalAmount,
    paidAmount,
    needReceipt,
    receiptNumber,
    receiptIssued,
    receiptIssuedAt,
    receiptIssuedBy,
    accountingState,
    accountingDate,
    accountingBy,
    accountingNotes,
    paymentState,
    paymentMethod,
    paymentDate,
    paymentNotes,
    notes,
    createdAt,
    updatedAt
FROM participationRecordDB
"#;

/// 獲取所有參與記錄
pub async fn get_all_participation_records(
    Query(params): Query<ParticipationRecordQuery>,
    Extension(pool): Extension<SqlitePool>,
) -> Result<Json<ApiResponse<Vec<ParticipationRecordResponse>>>, (StatusCode, Json<ApiResponse<Vec<ParticipationRecordResponse>>>)> {
    let mut query = format!("{} WHERE 1=1", PARTICIPATION_RECORD_FULL_QUERY);
    let mut count_query = String::from("SELECT COUNT(*) FROM participationRecordDB WHERE 1=1");

    // 添加過濾條件
    if let Some(registration_id) = &params.registration_id {
        let condition = format!(" AND registrationId = {}", registration_id);
        query.push_str(&condition);
        count_query.push_str(&condition);
    }

    if let Some(activity_id) = &params.activity_id {
        let condition = format!(" AND activityId = {}", activity_id);
        query.push_str(&condition);
        count_query.push_str(&condition);
    }

    if let Some(state) = &params.state {
        let condition = format!(" AND state = '{}'", state);
        query.push_str(&condition);
        count_query.push_str(&condition);
    }

    if let Some(payment_state) = &params.payment_state {
        let condition = format!(" AND paymentState = '{}'", payment_state);
        query.push_str(&condition);
        count_query.push_str(&condition);
    }

    if let Some(accounting_state) = &params.accounting_state {
        let condition = format!(" AND accountingState = '{}'", accounting_state);
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
    let records = sqlx::query_as::<_, ParticipationRecord>(&query)
        .fetch_all(&pool)
        .await
        .map_err(|e| {
            tracing::error!("查詢參與記錄失敗: {}", e);
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
            tracing::error!("查詢參與記錄總數失敗: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error(format!("查詢總數失敗: {}", e))),
            )
        })?;

    // 轉換為響應格式
    let responses: Vec<ParticipationRecordResponse> = records
        .into_iter()
        .map(|record| record.into())
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

/// 根據 registrationId 獲取參與記錄
pub async fn get_participation_record_by_registration_id(
    Path(registration_id): Path<i64>,
    Extension(pool): Extension<SqlitePool>,
) -> Result<Json<ApiResponse<ParticipationRecordResponse>>, (StatusCode, Json<ApiResponse<ParticipationRecordResponse>>)> {
    
    let query = format!("{} WHERE registrationId = ?", PARTICIPATION_RECORD_FULL_QUERY);
    let record = sqlx::query_as::<_, ParticipationRecord>(&query)
        .bind(registration_id)
        .fetch_optional(&pool)
        .await
        .map_err(|e| {
            tracing::error!("查詢參與記錄失敗: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error(format!("查詢失敗: {}", e))),
            )
        })?;

    match record {
        Some(record) => {
            Ok(Json(ApiResponse::success(record.into())))
        },
        None => Err((
            StatusCode::NOT_FOUND,
            Json(ApiResponse::error(format!("找不到 registrationId 為 {} 的參與記錄", registration_id))),
        )),
    }
}

/// 根據 activityId 獲取參與記錄
pub async fn get_participation_record_by_activity_id(
    Path(activity_id): Path<i64>,
    Extension(pool): Extension<SqlitePool>,
) -> Result<Json<ApiResponse<Vec<ParticipationRecordResponse>>>, (StatusCode, Json<ApiResponse<Vec<ParticipationRecordResponse>>>)> {
    
    let query = format!("{} WHERE activityId = ?", PARTICIPATION_RECORD_FULL_QUERY);
    let records = sqlx::query_as::<_, ParticipationRecord>(&query)
        .bind(activity_id)
        .fetch_all(&pool)
        .await
        .map_err(|e| {
            tracing::error!("查詢參與記錄失敗: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error(format!("查詢失敗: {}", e))),
            )
        })?;

    let responses: Vec<ParticipationRecordResponse> = records
        .into_iter()
        .map(|record| record.into())
        .collect();

    Ok(Json(ApiResponse::success(responses)))
}

/// 根據 ID 獲取單個參與記錄
pub async fn get_participation_record_by_id(
    Path(id): Path<i64>,
    Extension(pool): Extension<SqlitePool>,
) -> Result<Json<ApiResponse<ParticipationRecordResponse>>, (StatusCode, Json<ApiResponse<ParticipationRecordResponse>>)> {
    
    let query = format!("{} WHERE id = ?", PARTICIPATION_RECORD_FULL_QUERY);
    let record = sqlx::query_as::<_, ParticipationRecord>(&query)
        .bind(id)
        .fetch_optional(&pool)
        .await
        .map_err(|e| {
            tracing::error!("查詢參與記錄失敗: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error(format!("查詢失敗: {}", e))),
            )
        })?;

    match record {
        Some(record) => {
            Ok(Json(ApiResponse::success(record.into())))
        },
        None => Err((
            StatusCode::NOT_FOUND,
            Json(ApiResponse::error(format!("找不到 ID 為 {} 的參與記錄", id))),
        )),
    }
}

/// 創建新參與記錄
pub async fn create_participation_record(
    Extension(pool): Extension<SqlitePool>,
    Json(payload): Json<CreateParticipationRecordRequest>,
) -> Result<Json<ApiResponse<ParticipationRecordResponse>>, (StatusCode, Json<ApiResponse<ParticipationRecordResponse>>)> {
    // 生成當前時間戳
    let now = chrono::Utc::now().to_rfc3339();

    // 將 JsonValue 轉換為字符串存入資料庫
    let items_str = payload.items.map(|v| v.to_string());

    // 插入新記錄
    let result = sqlx::query(
        r#"
        INSERT INTO participationRecordDB (
            registrationId, activityId, state, items, totalAmount, discountAmount,
            finalAmount, paidAmount, needReceipt, receiptNumber, receiptIssued,
            receiptIssuedAt, receiptIssuedBy, accountingState, accountingDate,
            accountingBy, accountingNotes, paymentState, paymentMethod,
            paymentDate, paymentNotes, notes, createdAt, updatedAt
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#,
    )
    .bind(&payload.registration_id)
    .bind(&payload.activity_id)
    .bind(&payload.state)
    .bind(&items_str)
    .bind(&payload.total_amount)
    .bind(&payload.discount_amount)
    .bind(&payload.final_amount)
    .bind(&payload.paid_amount)
    .bind(&payload.need_receipt)
    .bind(&payload.receipt_number)
    .bind(&payload.receipt_issued)
    .bind(&payload.receipt_issued_at)
    .bind(&payload.receipt_issued_by)
    .bind(&payload.accounting_state)
    .bind(&payload.accounting_date)
    .bind(&payload.accounting_by)
    .bind(&payload.accounting_notes)
    .bind(&payload.payment_state)
    .bind(&payload.payment_method)
    .bind(&payload.payment_date)
    .bind(&payload.payment_notes)
    .bind(&payload.notes)
    .bind(&now)
    .bind(&now)
    .execute(&pool)
    .await
    .map_err(|e| {
        tracing::error!("創建參與記錄失敗: {}", e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::error(format!("創建失敗: {}", e))),
        )
    })?;

    let id = result.last_insert_rowid();

    // 返回創建的記錄
    let query = format!("{} WHERE id = ?", PARTICIPATION_RECORD_FULL_QUERY);
    let record = sqlx::query_as::<_, ParticipationRecord>(&query)
        .bind(id)
        .fetch_one(&pool)
        .await
        .map_err(|e| {
            tracing::error!("查詢新創建的參與記錄失敗: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error(format!("查詢失敗: {}", e))),
            )
        })?;

    Ok(Json(ApiResponse::success_with_message(
        record.into(),
        "成功創建參與記錄".to_string(),
    )))
}

/// 更新參與記錄
pub async fn update_participation_record(
    Path(id): Path<i64>,
    Extension(pool): Extension<SqlitePool>,
    Json(payload): Json<UpdateParticipationRecordRequest>,
) -> Result<Json<ApiResponse<ParticipationRecordResponse>>, (StatusCode, Json<ApiResponse<ParticipationRecordResponse>>)> {
    // 檢查記錄是否存在
    let exists: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM participationRecordDB WHERE id = ?")
        .bind(id)
        .fetch_one(&pool)
        .await
        .map_err(|e| {
            tracing::error!("檢查參與記錄失敗: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error(format!("檢查失敗: {}", e))),
            )
        })?;

    if exists.0 == 0 {
        return Err((
            StatusCode::NOT_FOUND,
            Json(ApiResponse::error(format!("找不到 ID 為 {} 的參與記錄", id))),
        ));
    }

    // 構建動態更新語句
    let mut updates = Vec::new();
    let mut bindings: Vec<String> = Vec::new();

    if let Some(registration_id) = &payload.registration_id {
        updates.push("registrationId = ?");
        bindings.push(registration_id.to_string());
    }
    if let Some(activity_id) = &payload.activity_id {
        updates.push("activityId = ?");
        bindings.push(activity_id.to_string());
    }
    if let Some(state) = &payload.state {
        updates.push("state = ?");
        bindings.push(state.clone());
    }
    
    // 將 JsonValue 轉換為字符串
    if let Some(items) = &payload.items {
        updates.push("items = ?");
        bindings.push(items.to_string());
    }

    if let Some(total_amount) = &payload.total_amount {
        updates.push("totalAmount = ?");
        bindings.push(total_amount.to_string());
    }
    if let Some(discount_amount) = &payload.discount_amount {
        updates.push("discountAmount = ?");
        bindings.push(discount_amount.to_string());
    }
    if let Some(final_amount) = &payload.final_amount {
        updates.push("finalAmount = ?");
        bindings.push(final_amount.to_string());
    }
    if let Some(paid_amount) = &payload.paid_amount {
        updates.push("paidAmount = ?");
        bindings.push(paid_amount.to_string());
    }
    if let Some(need_receipt) = &payload.need_receipt {
        updates.push("needReceipt = ?");
        bindings.push(need_receipt.clone());
    }
    if let Some(receipt_number) = &payload.receipt_number {
        updates.push("receiptNumber = ?");
        bindings.push(receipt_number.clone());
    }
    if let Some(receipt_issued) = &payload.receipt_issued {
        updates.push("receiptIssued = ?");
        bindings.push(receipt_issued.clone());
    }
    if let Some(receipt_issued_at) = &payload.receipt_issued_at {
        updates.push("receiptIssuedAt = ?");
        bindings.push(receipt_issued_at.clone());
    }
    if let Some(receipt_issued_by) = &payload.receipt_issued_by {
        updates.push("receiptIssuedBy = ?");
        bindings.push(receipt_issued_by.clone());
    }
    if let Some(accounting_state) = &payload.accounting_state {
        updates.push("accountingState = ?");
        bindings.push(accounting_state.clone());
    }
    if let Some(accounting_date) = &payload.accounting_date {
        updates.push("accountingDate = ?");
        bindings.push(accounting_date.clone());
    }
    if let Some(accounting_by) = &payload.accounting_by {
        updates.push("accountingBy = ?");
        bindings.push(accounting_by.clone());
    }
    if let Some(accounting_notes) = &payload.accounting_notes {
        updates.push("accountingNotes = ?");
        bindings.push(accounting_notes.clone());
    }
    if let Some(payment_state) = &payload.payment_state {
        updates.push("paymentState = ?");
        bindings.push(payment_state.clone());
    }
    if let Some(payment_method) = &payload.payment_method {
        updates.push("paymentMethod = ?");
        bindings.push(payment_method.clone());
    }
    if let Some(payment_date) = &payload.payment_date {
        updates.push("paymentDate = ?");
        bindings.push(payment_date.clone());
    }
    if let Some(payment_notes) = &payload.payment_notes {
        updates.push("paymentNotes = ?");
        bindings.push(payment_notes.clone());
    }
    if let Some(notes) = &payload.notes {
        updates.push("notes = ?");
        bindings.push(notes.clone());
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
        "UPDATE participationRecordDB SET {} WHERE id = ?",
        updates.join(", ")
    );

    let mut query_builder = sqlx::query(&query);
    for binding in bindings {
        query_builder = query_builder.bind(binding);
    }
    query_builder = query_builder.bind(id);

    query_builder.execute(&pool).await.map_err(|e| {
        tracing::error!("更新參與記錄失敗: {}", e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::error(format!("更新失敗: {}", e))),
        )
    })?;

    // 返回更新後的記錄
    let query = format!("{} WHERE id = ?", PARTICIPATION_RECORD_FULL_QUERY);
    let record = sqlx::query_as::<_, ParticipationRecord>(&query)
        .bind(id)
        .fetch_one(&pool)
        .await
        .map_err(|e| {
            tracing::error!("查詢更新後的參與記錄失敗: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error(format!("查詢失敗: {}", e))),
            )
        })?;

    Ok(Json(ApiResponse::success_with_message(
        record.into(),
        "成功更新參與記錄".to_string(),
    )))
}

/// 刪除參與記錄
pub async fn delete_participation_record(
    Path(id): Path<i64>,
    Extension(pool): Extension<SqlitePool>,
) -> Result<Json<ApiResponse<()>>, (StatusCode, Json<ApiResponse<()>>)> {
    let result = sqlx::query("DELETE FROM participationRecordDB WHERE id = ?")
        .bind(id)
        .execute(&pool)
        .await
        .map_err(|e| {
            tracing::error!("刪除參與記錄失敗: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error(format!("刪除失敗: {}", e))),
            )
        })?;

    if result.rows_affected() == 0 {
        return Err((
            StatusCode::NOT_FOUND,
            Json(ApiResponse::error(format!("找不到 ID 為 {} 的參與記錄", id))),
        ));
    }

    Ok(Json(ApiResponse {
        success: true,
        data: None,
        message: Some("成功刪除參與記錄".to_string()),
        meta: None,
        errors: None,
    }))
}
