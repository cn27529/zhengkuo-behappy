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
    ReceiptNumberQuery, UpdateReceiptStatusRequest, RemoveMergedReceiptRequest
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

    let now_iso = chrono::Utc::now().to_rfc3339();
    let now_timestamp = chrono::Utc::now().timestamp_millis();
    let state = "active";

    // 5. 插入 receiptNumbersDB
    let insert_result = sqlx::query(
        r#"
        INSERT INTO receiptNumbersDB (
            receiptNumber, receiptType, yearMonth, serialNumber, 
            recordId, createdAt, state, user_created, date_created
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#,
    )
    .bind(&receipt_number)
    .bind(&payload.receipt_type)
    .bind(&year_month)
    .bind(next_serial)
    .bind(payload.record_id)
    .bind(&now_iso)
    .bind(&state)
    .bind(&payload.user_id)
    .bind(&now_timestamp)
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

    // 🔥 7-1. 強制 checkpoint，清空 WAL
    // 🔥 關鍵修復：強制 checkpoint 並清空 WAL
    // 使用 TRUNCATE 選項會立即清空 WAL 檔案
    match sqlx::query("PRAGMA wal_checkpoint(TRUNCATE)")
        .execute(&pool)
        .await 
    {
        Ok(result) => {
            eprintln!("Checkpoint 完成: {:?}", result);
        }
        Err(e) => {
            // 只記錄警告，不影響 API 響應
            eprintln!("警告: WAL checkpoint 失敗: {}", e);
        }
    }

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


/// 🔥 核心功能：原子性生成合併收據編號
pub async fn generate_merged_receipt_number(
    Extension(pool): Extension<SqlitePool>,
    Json(payload): Json<GenerateReceiptRequest>,
) -> Result<Json<ApiResponse<ReceiptNumberResponse>>, (StatusCode, Json<ApiResponse<ReceiptNumberResponse>>)> {
    
    // 驗證 record_ids
    let record_ids = payload.record_ids.ok_or_else(|| {
        (StatusCode::BAD_REQUEST, Json(ApiResponse::error("record_ids 不能為空".to_string())))
    })?;

    if record_ids.is_empty() {
        return Err((StatusCode::BAD_REQUEST, Json(ApiResponse::error("record_ids 不能為空".to_string()))));
    }

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

    let now_iso = chrono::Utc::now().to_rfc3339();
    let now_timestamp = chrono::Utc::now().timestamp_millis();

    let state = "merged";
    let void_reason = payload.void_reason.clone().unwrap_or_else(|| "合併收據".to_string());

    // 5. 插入 receiptNumbersDB
    let insert_result = sqlx::query(
        r#"
        INSERT INTO receiptNumbersDB (
            receiptNumber, receiptType, yearMonth, serialNumber, 
            recordId, createdAt, user_created, state, date_created, voidReason
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#,
    )
    .bind(&receipt_number)
    .bind(&payload.receipt_type)
    .bind(&year_month)
    .bind(next_serial)
    .bind(-1)  // 🔥 合併收據：使用 -1 表示合併收據
    .bind(&now_iso)    
    .bind(&payload.user_id)
    .bind(&state)
    .bind(&now_timestamp)
    .bind(&void_reason)
    .execute(&mut *tx)
    .await
    .map_err(|e| {
        (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(format!("記錄編號失敗: {}", e))))
    })?;

    let new_id = insert_result.last_insert_rowid();

    // 5.1 插入 mergedReceiptNumbersDB (如果需要合併)
    // Vec<i64> → JSON string 存入 mergeIds 欄位
    let merge_ids_json = serde_json::to_string(&record_ids)
        .map_err(|e| {
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(format!("序列化失敗: {}", e))))
        })?;

    let insert_merged_result = sqlx::query(r#"
        INSERT INTO mergedReceiptsDB (
            receiptNumber, receiptType, totalAmount, createdAt, user_created, mergeIds, date_created
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    "#)
    .bind(&receipt_number)
    .bind(&payload.receipt_type)
    .bind(payload.total_amount)
    .bind(&now_iso)    
    .bind(&payload.user_id)
    .bind(&merge_ids_json)      // "[1,3,5]"
    .bind(&now_timestamp)
    .execute(&mut *tx)
    .await
    .map_err(|e| {
        (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(format!("記錄合併編號失敗: {}", e))))
    })?;

    let merged_id = insert_merged_result.last_insert_rowid();

    // 6. 更新參加記錄表 (同步反饋)
    //"receiptNumber": "26040001",
    // "receiptIssued": "stamp",
    // ""mergedRef": 1,  // 關聯 mergedReceiptNumbersDB 的 id
    // 構建動態 SQL
    // 6. UPDATE participationRecordDB，動態展開 IN (?, ?, ?)
    let placeholders = record_ids.iter().map(|_| "?").collect::<Vec<_>>().join(", ");
    let sql = format!(
        "UPDATE participationRecordDB SET receiptNumber = ?, receiptIssued = ?, mergedRef = ? WHERE id IN ({})",
        placeholders
    );

    let mut q = sqlx::query(&sql)
        .bind(&receipt_number)
        .bind(&payload.receipt_type)
        .bind(merged_id);

    for id in &record_ids {
        q = q.bind(id);
    }

    q.execute(&mut *tx)
        .await
        .map_err(|e| {
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(format!("同步更新參加記錄失敗: {}", e))))
        })?;

    
    //6.1 將 merged_id 回寫到 receiptNumbersDB 的 recordId 欄位, WHERE 條件是 new_id, receipt_number (剛插入的 receiptNumbersDB 記錄) 的 id 
    sqlx::query(
        "UPDATE receiptNumbersDB SET recordId = ? WHERE id = ? and receiptNumber = ?"
    )
    .bind(merged_id)
    .bind(new_id)
    .bind(&receipt_number)
    .execute(&mut *tx)
    .await
    .map_err(|e| {
        (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(format!("回寫 merged_id 失敗: {}", e))))
    })?;

    // 7. 提交事務
    tx.commit().await.map_err(|e| {
        (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(format!("提交事務失敗: {}", e))))
    })?;

    // 🔥 7-1. 強制 checkpoint，清空 WAL
    // 🔥 關鍵修復：強制 checkpoint 並清空 WAL
    // 使用 TRUNCATE 選項會立即清空 WAL 檔案
    match sqlx::query("PRAGMA wal_checkpoint(TRUNCATE)")
        .execute(&pool)
        .await 
    {
        Ok(result) => {
            eprintln!("Checkpoint 完成: {:?}", result);
        }
        Err(e) => {
            // 只記錄警告，不影響 API 響應
            eprintln!("警告: WAL checkpoint 失敗: {}", e);
        }
    }

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

/// 🔥 解除合併收據（反操作）
/// 1. receiptNumbersDB: 更新 state 為 'void'，voidReason 註記「解除合併列印」
/// 2. mergedReceiptsDB: 不異動，保留歷史記錄
/// 3. participationRecordDB: 清空 receiptNumber, receiptIssued, receiptIssuedAt, receiptIssuedBy
pub async fn remove_merged_receipt_number(
    Extension(pool): Extension<SqlitePool>,
    Json(payload): Json<RemoveMergedReceiptRequest>,
) -> Result<Json<ApiResponse<()>>, (StatusCode, Json<ApiResponse<()>>)> {
    
    // 1. 開始資料庫事務
    let mut tx = pool.begin().await.map_err(|e| {
        (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(format!("啟動事務失敗: {}", e))))
    })?;

    let now_iso = chrono::Utc::now().to_rfc3339();
    let now_timestamp = chrono::Utc::now().timestamp_millis();
    let void_reason = payload.void_reason
        .clone()
        .unwrap_or_else(|| "解除合併".to_string());

    // 2. 查詢合併收據記錄，獲取關聯的 participationRecordDB IDs
    let merged_record: Option<(i64, String)> = sqlx::query_as::<_, (i64, String)>(
        "SELECT id, mergeIds FROM mergedReceiptsDB WHERE receiptNumber = ?"
    )
    .bind(&payload.receipt_number)
    .fetch_optional(&mut *tx)
    .await
    .map_err(|e| {
        (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(format!("查詢合併記錄失敗: {}", e))))
    })?;

    let (merged_id, merge_ids_json) = match merged_record {
        Some(record) => record,
        None => {
            return Err((StatusCode::NOT_FOUND, Json(ApiResponse::error(format!("找不到合併收據記錄: {}", payload.receipt_number)))));
        }
    };

    // 解析 mergeIds JSON 字串為 Vec<i64>
    let record_ids: Vec<i64> = serde_json::from_str(&merge_ids_json)
        .map_err(|e| {
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(format!("解析 mergeIds 失敗: {}", e))))
        })?;

    if record_ids.is_empty() {
        return Err((StatusCode::BAD_REQUEST, Json(ApiResponse::error("合併記錄中沒有關聯的參加記錄 ID".to_string()))));
    }

    let state = "remove merged";

    // 3. 更新 receiptNumbersDB：將該合併收據標記為作廢
    let update_result = sqlx::query(
        r#"
        UPDATE receiptNumbersDB 
        SET state = ?, 
            voidReason = ?, 
            updatedAt = ?, 
            date_updated = ?, 
            user_updated = ?            
        WHERE receiptNumber = ? AND recordId = ?
        "#
    )
    .bind(&state)
    .bind(&void_reason)
    .bind(&now_iso)
    .bind(&now_timestamp)
    .bind(&payload.user_id)
    .bind(&payload.receipt_number)
    .bind(merged_id)
    .execute(&mut *tx)
    .await
    .map_err(|e| {
        (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(format!("更新收據記錄失敗: {}", e))))
    })?;

    if update_result.rows_affected() == 0 {
        return Err((StatusCode::NOT_FOUND, Json(ApiResponse::error(format!("找不到對應的收據記錄: {}", payload.receipt_number)))));
    }

    // 4. 更新 participationRecordDB：清空收據相關欄位
    // 構建動態 SQL 清空多筆記錄
    let placeholders = record_ids.iter().map(|_| "?").collect::<Vec<_>>().join(", ");
    let sql = format!("UPDATE participationRecordDB SET receiptNumber = NULL, receiptIssued = NULL, receiptIssuedAt = NULL, receiptIssuedBy = NULL, mergedRef = NULL, updatedAt = ?, date_updated = ?, user_updated = ? WHERE id IN ({})",
        placeholders
    );

    let mut q = sqlx::query(&sql)
    .bind(&now_iso)
    .bind(&now_timestamp)
    .bind(&payload.user_id);

    for id in &record_ids {
        q = q.bind(id);
    }

    let update_participants_result = q.execute(&mut *tx)
        .await
        .map_err(|e| {
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(format!("清空參加記錄收據欄位失敗: {}", e))))
        })?;

    // 5. 可選：檢查更新的記錄數量是否匹配
    if update_participants_result.rows_affected() as usize != record_ids.len() {
        eprintln!(
            "警告：預期更新 {} 筆參加記錄，實際更新 {} 筆",
            record_ids.len(),
            update_participants_result.rows_affected()
        );
    }

    // 6. 提交事務
    tx.commit().await.map_err(|e| {
        (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiResponse::error(format!("提交事務失敗: {}", e))))
    })?;

    // 🔥 7. 強制 checkpoint，清空 WAL
    // 🔥 關鍵修復：強制 checkpoint 並清空 WAL
    // 使用 TRUNCATE 選項會立即清空 WAL 檔案
    match sqlx::query("PRAGMA wal_checkpoint(TRUNCATE)")
        .execute(&pool)
        .await 
    {
        Ok(result) => {
            eprintln!("Checkpoint 完成: {:?}", result);
        }
        Err(e) => {
            // 只記錄警告，不影響 API 響應
            eprintln!("警告: WAL checkpoint 失敗: {}", e);
        }
    }

    Ok(Json(ApiResponse::success_with_message(
        (),
        format!(
            "成功解除合併收據 {}，共處理 {} 筆參加記錄",
            payload.receipt_number,
            record_ids.len()
        ),
    )))
}

/// 作廢編號
pub async fn void_receipt_number(
    Path(id): Path<i64>,
    Extension(pool): Extension<SqlitePool>,
    Json(payload): Json<UpdateReceiptStatusRequest>,
) -> Result<Json<ApiResponse<ReceiptNumberResponse>>, (StatusCode, Json<ApiResponse<ReceiptNumberResponse>>)> {
    
    let now_iso = chrono::Utc::now().to_rfc3339();
    
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