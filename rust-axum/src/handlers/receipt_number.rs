// src/handlers/receipt_number.rs
use axum::{
    extract::{Extension, Path, Query},
    http::StatusCode,
    Json,
};
use sqlx::SqlitePool;
use chrono::Local;

use crate::models::api_response::{ApiResponse, Meta};
use crate::models::receipt_number::{
    ReceiptNumber, ReceiptNumberResponse, GenerateReceiptRequest, 
    ReceiptNumberQuery, UpdateReceiptStatusRequest,
};

const RECEIPT_FULL_QUERY: &str = r#"
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
    receiptNumber,
    receiptType,
    yearMonth,
    serialNumber,
    recordId,
    createdAt,
    updatedAt,
    state,
    voidReason
FROM receiptNumbersDB
"#;

/// 獲取所有收據編號記錄
pub async fn get_all_receipt_numbers(
    Query(params): Query<ReceiptNumberQuery>,
    Extension(pool): Extension<SqlitePool>,
) -> Result<Json<ApiResponse<Vec<ReceiptNumberResponse>>>, (StatusCode, Json<ApiResponse<Vec<ReceiptNumberResponse>>>)> {
    let mut query = format!("{} WHERE 1=1", RECEIPT_FULL_QUERY);
    let mut count_query = String::from("SELECT COUNT(*) FROM receiptNumbersDB WHERE 1=1");

    if let Some(state) = &params.state {
        let condition = format!(" AND state = '{}'", state);
        query.push_str(&condition);
        count_query.push_str(&condition);
    }

    if let Some(r_type) = &params.receipt_type {
        let condition = format!(" AND receiptType = '{}'", r_type);
        query.push_str(&condition);
        count_query.push_str(&condition);
    }

    if let Some(year_month) = &params.year_month {
        let condition = format!(" AND yearMonth = '{}'", year_month);
        query.push_str(&condition);
        count_query.push_str(&condition);
    }

    query.push_str(" ORDER BY createdAt DESC");

    let records = sqlx::query_as::<_, ReceiptNumber>(&query)
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

    let responses: Vec<ReceiptNumberResponse> = records.into_iter().map(|r| r.into()).collect();

    Ok(Json(ApiResponse::success_with_meta(
        responses,
        Meta { total: total.0, limit: None, offset: None },
    )))
}

/// 🔥 核心功能：原子性生成收據編號 (方案 1)
pub async fn generate_receipt_number(
    Extension(pool): Extension<SqlitePool>,
    Json(payload): Json<GenerateReceiptRequest>,
) -> Result<Json<ApiResponse<ReceiptNumberResponse>>, (StatusCode, Json<ApiResponse<ReceiptNumberResponse>>)> {
    
    // 1. 開始資料庫事務
    let mut tx = pool.begin().await.map_err(|e| {
        (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(format!("啟動事務失敗: {}", e))))
    })?;

    // 2. 獲取當前年月 (YYMM)
    let now_dt = Local::now();
    let year_month = now_dt.format("%y%m").to_string(); // 例如 "2602"

    // 3. 查詢當月該類型的最大流水號 (使用事務鎖定)
    let max_serial: Option<i32> = sqlx::query_scalar(
        "SELECT serialNumber FROM receiptNumbersDB 
         WHERE yearMonth = ? AND receiptType = ? 
         ORDER BY serialNumber DESC LIMIT 1"
    )
    .bind(&year_month)
    .bind(&payload.receipt_type)
    .fetch_optional(&mut *tx)
    .await
    .map_err(|e| {
        (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(format!("獲取流水號失敗: {}", e))))
    })?;

    let next_serial = max_serial.unwrap_or(0) + 1;
    if next_serial > 9999 {
        return Err((StatusCode::BAD_REQUEST, Json(ApiResponse::error("當月編號已達上限(9999)".to_string()))));
    }

    // 4. 根據規則生成編號
    let formatted_serial = format!("{:04}", next_serial);
    let receipt_number = if payload.receipt_type == "standard" {
        format!("A{}{}", year_month, formatted_serial) // 感謝狀帶 A 前綴
    } else {
        format!("{}{}", year_month, formatted_serial) // 一般收據
    };

    let now_iso = now_dt.to_rfc3339();

    // 5. 插入 receiptNumbersDB
    let insert_result = sqlx::query(
        r#"
        INSERT INTO receiptNumbersDB (
            receiptNumber, receiptType, yearMonth, serialNumber, 
            recordId, createdAt, date_created, state, user_created
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?)
        "#,
    )
    .bind(&receipt_number)
    .bind(&payload.receipt_type)
    .bind(&year_month)
    .bind(next_serial)
    .bind(payload.record_id)
    .bind(&now_iso)
    .bind(&now_iso)
    .bind(&payload.user_id)
    .execute(&mut *tx)
    .await
    .map_err(|e| {
        (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(format!("記錄編號失敗: {}", e))))
    })?;

    let new_id = insert_result.last_insert_rowid();

    // 6. 更新參加記錄表 (同步反饋)
    sqlx::query(
        "UPDATE participationRecordDB SET receiptNumber = ?, receiptIssued = ? WHERE id = ?"
    )
    .bind(&receipt_number)
    .bind(&payload.receipt_type)
    .bind(payload.record_id)
    .execute(&mut *tx)
    .await
    .map_err(|e| {
        (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(format!("同步更新參加記錄失敗: {}", e))))
    })?;

    // 7. 提交事務
    tx.commit().await.map_err(|e| {
        (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(format!("提交事務失敗: {}", e))))
    })?;

    // 8. 返回新生成的完整記錄
    let final_record = sqlx::query_as::<_, ReceiptNumber>(&format!("{} WHERE id = ?", RECEIPT_FULL_QUERY))
        .bind(new_id)
        .fetch_one(&pool)
        .await
        .map_err(|e| {
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(format!("查詢新編號失敗: {}", e))))
        })?;

    Ok(Json(ApiResponse::success_with_message(
        final_record.into(),
        format!("成功生成編號: {}", receipt_number),
    )))
}

/// 作廢編號
pub async fn void_receipt_number(
    Path(id): Path<i64>,
    Extension(pool): Extension<SqlitePool>,
    Json(payload): Json<UpdateReceiptStatusRequest>,
) -> Result<Json<ApiResponse<ReceiptNumberResponse>>, (StatusCode, Json<ApiResponse<ReceiptNumberResponse>>)> {
    
    let now_iso = Local::now().to_rfc3339();
    
    sqlx::query(
        "UPDATE receiptNumbersDB SET state = ?, voidReason = ?, updatedAt = ?, date_updated = ?, user_updated = ? WHERE id = ?"
    )
    .bind(&payload.state)
    .bind(&payload.void_reason)
    .bind(&now_iso)
    .bind(&now_iso)
    .bind(&payload.user_id)
    .bind(id)
    .execute(&pool)
    .await
    .map_err(|e| {
        (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(format!("更新狀態失敗: {}", e))))
    })?;

    let updated = sqlx::query_as::<_, ReceiptNumber>(&format!("{} WHERE id = ?", RECEIPT_FULL_QUERY))
        .bind(id)
        .fetch_one(&pool)
        .await
        .map_err(|e| {
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(format!("查詢失敗: {}", e))))
        })?;

    Ok(Json(ApiResponse::success(updated.into())))
}