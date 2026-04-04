// src/handlers/merged_receipts.rs
use axum::{
    extract::{Extension, Path, Query},
    http::StatusCode,
    Json,
};
use sqlx::SqlitePool;

use crate::models::api_response::{ApiResponse, Meta};
use crate::models::merged_receipts::{
    CreateMergedReceiptRequest, MergedReceipt, MergedReceiptResponse, MergedReceiptQuery, UpdateMergedReceiptRequest,
};

const MERGED_RECEIPT_FULL_QUERY: &str = r#"
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
    mergeIds,
    totalAmount,
    issuedAt,
    issuedBy,
    notes,
    createdAt,
    updatedAt
FROM mergedReceiptsDB
"#;

pub async fn get_all_merged_receipts(
    Query(params): Query<MergedReceiptQuery>,
    Extension(pool): Extension<SqlitePool>,
) -> Result<Json<ApiResponse<Vec<MergedReceiptResponse>>>, (StatusCode, Json<ApiResponse<Vec<MergedReceiptResponse>>>)> {
    let mut query = format!("{} WHERE 1=1", MERGED_RECEIPT_FULL_QUERY);
    let mut count_query = String::from("SELECT COUNT(*) FROM mergedReceiptsDB WHERE 1=1");

    if let Some(receipt_number) = &params.receipt_number {
        let condition = format!(" AND receiptNumber LIKE '%{}%'", receipt_number);
        query.push_str(&condition);
        count_query.push_str(&condition);
    }

    if let Some(receipt_type) = &params.receipt_type {
        let condition = format!(" AND receiptType = '{}'", receipt_type);
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

    let merged_receipt_list = sqlx::query_as::<_, MergedReceipt>(&query)
        .fetch_all(&pool)
        .await
        .map_err(|e| {
            tracing::error!("查詢 mergedReceipt 失敗: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error(format!("查詢失敗: {}", e))),
            )
        })?;

    let total: (i64,) = sqlx::query_as(&count_query)
        .fetch_one(&pool)
        .await
        .map_err(|e| {
            tracing::error!("查詢 mergedReceipt 總數失敗: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error(format!("查詢總數失敗: {}", e))),
            )
        })?;

    let responses: Vec<MergedReceiptResponse> = merged_receipt_list
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

pub async fn get_merged_receipt_by_id(
    Path(id): Path<i64>,
    Extension(pool): Extension<SqlitePool>,
) -> Result<Json<ApiResponse<MergedReceiptResponse>>, (StatusCode, Json<ApiResponse<MergedReceiptResponse>>)> {
    let query = format!("{} WHERE id = ?", MERGED_RECEIPT_FULL_QUERY);
    let merged_receipt = sqlx::query_as::<_, MergedReceipt>(&query)
        .bind(&id)
        .fetch_optional(&pool)
        .await
        .map_err(|e| {
            tracing::error!("查詢 mergedReceipt 失敗: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error(format!("查詢失敗: {}", e))),
            )
        })?;

    match merged_receipt {
        Some(data) => Ok(Json(ApiResponse::success(data.into()))),
        None => Err((
            StatusCode::NOT_FOUND,
            Json(ApiResponse::error(format!("找不到 ID 為 {} 的記錄", id))),
        )),
    }
}

pub async fn get_merged_receipt_by_receipt_type(
    Path(receipt_type): Path<String>,
    Extension(pool): Extension<SqlitePool>,
) -> Result<Json<ApiResponse<Vec<MergedReceiptResponse>>>, (StatusCode, Json<ApiResponse<Vec<MergedReceiptResponse>>>)> {
    let query = format!("{} WHERE receiptType = ?", MERGED_RECEIPT_FULL_QUERY);
    let merged_receipt_list = sqlx::query_as::<_, MergedReceipt>(&query)
        .bind(&receipt_type)
        .fetch_all(&pool)
        .await
        .map_err(|e| {
            tracing::error!("查詢 mergedReceipt 失敗: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error(format!("查詢失敗: {}", e))),
            )
        })?;

    let responses: Vec<MergedReceiptResponse> = merged_receipt_list
        .into_iter()
        .map(|data| data.into())
        .collect();

    Ok(Json(ApiResponse::success(responses)))
}

pub async fn create_merged_receipt(
    Extension(pool): Extension<SqlitePool>,
    Json(payload): Json<CreateMergedReceiptRequest>,
) -> Result<Json<ApiResponse<MergedReceiptResponse>>, (StatusCode, Json<ApiResponse<MergedReceiptResponse>>)> {
    //let merge_ids_str = payload.merge_ids.map(|v| v.to_string());
    // ✅ 改後
    let merge_ids_str = payload.merge_ids
        .map(|v| serde_json::to_string(&v).unwrap_or_default());
    
    let result = sqlx::query(
        r#"
        INSERT INTO mergedReceiptsDB (receiptNumber, receiptType, mergeIds, totalAmount, issuedAt, issuedBy, notes, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#,
    )
    .bind(&payload.receipt_number)
    .bind(&payload.receipt_type)
    .bind(&merge_ids_str)
    .bind(&payload.total_amount)
    .bind(&payload.issued_at)
    .bind(&payload.issued_by)
    .bind(&payload.notes)
    .bind(&payload.created_at)
    .bind(&payload.updated_at)
    .execute(&pool)
    .await
    .map_err(|e| {
        tracing::error!("創建 mergedReceipt 失敗: {}", e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::error(format!("創建失敗: {}", e))),
        )
    })?;

    let id = result.last_insert_rowid();

    let query = format!("{} WHERE id = ?", MERGED_RECEIPT_FULL_QUERY);
    let merged_receipt = sqlx::query_as::<_, MergedReceipt>(&query)
        .bind(id)
        .fetch_one(&pool)
        .await
        .map_err(|e| {
            tracing::error!("查詢新創建的 mergedReceipt 失敗: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error(format!("查詢失敗: {}", e))),
            )
        })?;

    Ok(Json(ApiResponse::success_with_message(
        merged_receipt.into(),
        "成功創建記錄".to_string(),
    )))
}

pub async fn update_merged_receipt(
    Path(id): Path<i64>,
    Extension(pool): Extension<SqlitePool>,
    Json(payload): Json<UpdateMergedReceiptRequest>,
) -> Result<Json<ApiResponse<MergedReceiptResponse>>, (StatusCode, Json<ApiResponse<MergedReceiptResponse>>)> {
    let exists: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM mergedReceiptsDB WHERE id = ?")
        .bind(&id)
        .fetch_one(&pool)
        .await
        .map_err(|e| {
            tracing::error!("檢查 mergedReceipt 失敗: {}", e);
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

    if let Some(receipt_number) = &payload.receipt_number {
        updates.push("receiptNumber = ?");
        bindings.push(receipt_number.clone());
    }
    if let Some(receipt_type) = &payload.receipt_type {
        updates.push("receiptType = ?");
        bindings.push(receipt_type.clone());
    }
    if let Some(merge_ids) = &payload.merge_ids {
        updates.push("mergeIds = ?");
        //bindings.push(merge_ids.to_string());
        // ✅ 改後
        bindings.push(serde_json::to_string(merge_ids).unwrap_or_default());
        
    }
    if let Some(total_amount) = &payload.total_amount {
        updates.push("totalAmount = ?");
        bindings.push(total_amount.to_string());
    }
    if let Some(issued_at) = &payload.issued_at {
        updates.push("issuedAt = ?");
        bindings.push(issued_at.clone());
    }
    if let Some(issued_by) = &payload.issued_by {
        updates.push("issuedBy = ?");
        bindings.push(issued_by.clone());
    }
    if let Some(notes) = &payload.notes {
        updates.push("notes = ?");
        bindings.push(notes.clone());
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

    let query = format!("UPDATE mergedReceiptsDB SET {} WHERE id = ?", updates.join(", "));
    let mut query_builder = sqlx::query(&query);
    for binding in bindings {
        query_builder = query_builder.bind(binding);
    }
    query_builder = query_builder.bind(&id);

    query_builder.execute(&pool).await.map_err(|e| {
        tracing::error!("更新 mergedReceipt 失敗: {}", e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::error(format!("更新失敗: {}", e))),
        )
    })?;

    let query = format!("{} WHERE id = ?", MERGED_RECEIPT_FULL_QUERY);
    let merged_receipt = sqlx::query_as::<_, MergedReceipt>(&query)
        .bind(&id)
        .fetch_one(&pool)
        .await
        .map_err(|e| {
            tracing::error!("查詢更新後的 mergedReceipt 失敗: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error(format!("查詢失敗: {}", e))),
            )
        })?;

    Ok(Json(ApiResponse::success_with_message(
        merged_receipt.into(),
        "成功更新記錄".to_string(),
    )))
}

pub async fn delete_merged_receipt(
    Path(id): Path<i64>,
    Extension(pool): Extension<SqlitePool>,
) -> Result<Json<ApiResponse<()>>, (StatusCode, Json<ApiResponse<()>>)> {
    let result = sqlx::query("DELETE FROM mergedReceiptsDB WHERE id = ?")
        .bind(&id)
        .execute(&pool)
        .await
        .map_err(|e| {
            tracing::error!("刪除 mergedReceipt 失敗: {}", e);
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