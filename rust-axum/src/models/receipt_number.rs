// src/models/receipt_number.rs
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

/// 收據編號模型 - 完全對應 Directus 的 receiptNumbersDB 表結構
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ReceiptNumber {
    // Directus 系統字段
    pub id: i64,
    #[sqlx(default)]
    pub user_created: Option<String>,  // char(36) - Directus 用戶 UUID
    #[sqlx(default)]
    pub date_created: Option<String>,  // datetime
    #[sqlx(default)]
    pub user_updated: Option<String>,  // char(36)
    #[sqlx(default)]
    pub date_updated: Option<String>,  // datetime

    // 自定義業務字段
    #[sqlx(rename = "receiptNumber")]
    pub receipt_number: Option<String>,  // varchar(255) - '26029999' 或 'A26029999'
    #[sqlx(rename = "receiptType")]
    pub receipt_type: Option<String>,    // varchar(255) - 'stamp' 或 'standard'
    #[sqlx(rename = "yearMonth")]
    pub year_month: Option<String>,      // varchar(255) - '2602'
    #[sqlx(rename = "serialNumber")]
    pub serial_number: Option<i32>,      // integer
    #[sqlx(rename = "recordId")]
    pub record_id: Option<i32>,          // integer - 關聯的參加記錄 ID
    
    // 狀態與原因
    pub state: Option<String>,           // varchar(255) - 'active', 'void', 'regenerated'
    #[sqlx(rename = "voidReason")]
    pub void_reason: Option<String>,     // varchar(255)

    // 自定義時間戳
    #[sqlx(rename = "createdAt")]
    pub created_at: Option<String>,      // varchar(255)
    #[sqlx(rename = "updatedAt")]
    pub updated_at: Option<String>,      // varchar(255)
}

/// 收據編號響應 DTO - 用於 API 響應
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ReceiptNumberResponse {
    pub id: i64,
    #[serde(rename = "user_created", skip_serializing_if = "Option::is_none")]
    pub user_created: Option<String>,
    #[serde(rename = "date_created", skip_serializing_if = "Option::is_none")]
    pub date_created: Option<String>,
    
    // 業務字段使用 camelCase 輸出
    pub receipt_number: Option<String>,
    pub receipt_type: Option<String>,
    pub year_month: Option<String>,
    pub serial_number: Option<i32>,
    pub record_id: Option<i32>,
    pub state: Option<String>,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub void_reason: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub created_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<String>,
}

/// 從 ReceiptNumber 到 ReceiptNumberResponse 的轉換
impl From<ReceiptNumber> for ReceiptNumberResponse {
    fn from(rn: ReceiptNumber) -> Self {
        Self {
            id: rn.id,
            user_created: rn.user_created,
            date_created: rn.date_created,
            receipt_number: rn.receipt_number,
            receipt_type: rn.receipt_type,
            year_month: rn.year_month,
            serial_number: rn.serial_number,
            record_id: rn.record_id,
            state: rn.state,
            void_reason: rn.void_reason,
            created_at: rn.created_at,
            updated_at: rn.updated_at,
        }
    }
}

/// 請求生成收據編號的 Payload
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GenerateReceiptRequest {
    pub record_id: i32,
    pub receipt_type: String, // "stamp" 或 "standard"
    pub user_id: Option<String>,
}

/// 更新編號狀態請求 (例如作廢)
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateReceiptStatusRequest {
    pub state: String,
    pub void_reason: Option<String>,
    pub user_id: Option<String>,
}

/// 查詢參數
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReceiptNumberQuery {
    pub year_month: Option<String>,
    pub receipt_type: Option<String>,
    pub record_id: Option<i32>,
    pub state: Option<String>,
}