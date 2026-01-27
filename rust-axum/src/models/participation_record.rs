// src/models/participation_record.rs
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use serde_json::Value as JsonValue;

/// 參與記錄模型 - 對應 participationRecordDB 表結構
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ParticipationRecord {
    // Directus 系統字段
    pub id: i64,
    #[sqlx(default)]
    pub user_created: Option<String>,
    #[sqlx(default)]
    pub date_created: Option<String>,
    #[sqlx(default)]
    pub user_updated: Option<String>,
    #[sqlx(default)]
    pub date_updated: Option<String>,
    
    // 業務字段
    #[sqlx(rename = "registrationId", default)]
    pub registration_id: Option<i64>,
    
    #[sqlx(rename = "activityId", default)]
    pub activity_id: Option<i64>,
    
    #[sqlx(default)]
    pub state: Option<String>,
    
    // JSON 字段 - 使用 serde_json::Value
    #[sqlx(default)]
    #[serde(
        serialize_with = "serialize_json_string",
        deserialize_with = "deserialize_json_string",
        skip_serializing_if = "Option::is_none"
    )]
    pub items: Option<String>,
    
    #[sqlx(default)]
    #[serde(
        serialize_with = "serialize_json_string",
        deserialize_with = "deserialize_json_string",
        skip_serializing_if = "Option::is_none"
    )]
    pub contact: Option<String>,
    
    #[sqlx(rename = "totalAmount", default)]
    pub total_amount: Option<i64>,
    
    #[sqlx(rename = "discountAmount", default)]
    pub discount_amount: Option<i64>,
    
    #[sqlx(rename = "finalAmount", default)]
    pub final_amount: Option<i64>,
    
    #[sqlx(rename = "paidAmount", default)]
    pub paid_amount: Option<i64>,
    
    #[sqlx(rename = "needReceipt", default)]
    pub need_receipt: Option<String>,
    
    #[sqlx(rename = "receiptNumber", default)]
    pub receipt_number: Option<String>,
    
    #[sqlx(rename = "receiptIssued", default)]
    pub receipt_issued: Option<String>,
    
    #[sqlx(rename = "receiptIssuedAt", default)]
    pub receipt_issued_at: Option<String>,
    
    #[sqlx(rename = "receiptIssuedBy", default)]
    pub receipt_issued_by: Option<String>,
    
    #[sqlx(rename = "accountingState", default)]
    pub accounting_state: Option<String>,
    
    #[sqlx(rename = "accountingDate", default)]
    pub accounting_date: Option<String>,
    
    #[sqlx(rename = "accountingBy", default)]
    pub accounting_by: Option<String>,
    
    #[sqlx(rename = "accountingNotes", default)]
    pub accounting_notes: Option<String>,
    
    #[sqlx(rename = "paymentState", default)]
    pub payment_state: Option<String>,
    
    #[sqlx(rename = "paymentMethod", default)]
    pub payment_method: Option<String>,
    
    #[sqlx(rename = "paymentDate", default)]
    pub payment_date: Option<String>,
    
    #[sqlx(rename = "paymentNotes", default)]
    pub payment_notes: Option<String>,
    
    #[sqlx(default)]
    pub notes: Option<String>,
    
    // 自定義時間戳
    #[sqlx(rename = "createdAt", default)]
    pub created_at: Option<String>,
    #[sqlx(rename = "updatedAt", default)]
    pub updated_at: Option<String>,
}

// 自定義序列化函數：將 JSON 字符串轉為 JSON 對象
fn serialize_json_string<S>(
    value: &Option<String>,
    serializer: S,
) -> Result<S::Ok, S::Error>
where
    S: serde::Serializer,
{
    match value {
        Some(s) => {
            // 嘗試解析 JSON 字符串
            match serde_json::from_str::<JsonValue>(s) {
                Ok(json) => json.serialize(serializer),
                Err(_) => serializer.serialize_none(), // 如果解析失敗，返回 null
            }
        }
        None => serializer.serialize_none(),
    }
}

// 自定義反序列化函數：將 JSON 對象轉為字符串
fn deserialize_json_string<'de, D>(
    deserializer: D,
) -> Result<Option<String>, D::Error>
where
    D: serde::Deserializer<'de>,
{
    let value: Option<JsonValue> = Option::deserialize(deserializer)?;
    Ok(value.map(|v| v.to_string()))
}

/// 創建參與記錄請求
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateParticipationRecordRequest {
    #[serde(default)]
    pub registration_id: Option<i64>,
    
    #[serde(default)]
    pub activity_id: Option<i64>,
    
    #[serde(default)]
    pub state: Option<String>,
    
    // 接收 JSON 對象，自動轉為字符串
    #[serde(default)]
    pub items: Option<JsonValue>,
    
    #[serde(default)]
    pub contact: Option<JsonValue>,
    
    #[serde(default)]
    pub total_amount: Option<i64>,
    
    #[serde(default)]
    pub discount_amount: Option<i64>,
    
    #[serde(default)]
    pub final_amount: Option<i64>,
    
    #[serde(default)]
    pub paid_amount: Option<i64>,
    
    #[serde(default)]
    pub need_receipt: Option<String>,
    
    #[serde(default)]
    pub receipt_number: Option<String>,
    
    #[serde(default)]
    pub receipt_issued: Option<String>,
    
    #[serde(default)]
    pub receipt_issued_at: Option<String>,
    
    #[serde(default)]
    pub receipt_issued_by: Option<String>,
    
    #[serde(default)]
    pub accounting_state: Option<String>,
    
    #[serde(default)]
    pub accounting_date: Option<String>,
    
    #[serde(default)]
    pub accounting_by: Option<String>,
    
    #[serde(default)]
    pub accounting_notes: Option<String>,
    
    #[serde(default)]
    pub payment_state: Option<String>,
    
    #[serde(default)]
    pub payment_method: Option<String>,
    
    #[serde(default)]
    pub payment_date: Option<String>,
    
    #[serde(default)]
    pub payment_notes: Option<String>,
    
    #[serde(default)]
    pub notes: Option<String>,
}

/// 更新參與記錄請求
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateParticipationRecordRequest {
    pub registration_id: Option<i64>,
    pub activity_id: Option<i64>,
    pub state: Option<String>,
    pub items: Option<JsonValue>,
    pub contact: Option<JsonValue>,
    pub total_amount: Option<i64>,
    pub discount_amount: Option<i64>,
    pub final_amount: Option<i64>,
    pub paid_amount: Option<i64>,
    pub need_receipt: Option<String>,
    pub receipt_number: Option<String>,
    pub receipt_issued: Option<String>,
    pub receipt_issued_at: Option<String>,
    pub receipt_issued_by: Option<String>,
    pub accounting_state: Option<String>,
    pub accounting_date: Option<String>,
    pub accounting_by: Option<String>,
    pub accounting_notes: Option<String>,
    pub payment_state: Option<String>,
    pub payment_method: Option<String>,
    pub payment_date: Option<String>,
    pub payment_notes: Option<String>,
    pub notes: Option<String>,
    
    #[serde(default)]
    pub user_updated: Option<String>,
}

/// 查詢參數
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ParticipationRecordQuery {
    pub registration_id: Option<i64>,
    pub activity_id: Option<i64>,
    pub state: Option<String>,
    pub payment_state: Option<String>,
    pub accounting_state: Option<String>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
    pub sort: Option<String>,
}

/// API 響應用的參與記錄 DTO
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ParticipationRecordResponse {
    // Directus 系統字段
    pub id: i64,
    #[serde(rename = "user_created", skip_serializing_if = "Option::is_none")]
    pub user_created: Option<String>,
    #[serde(rename = "date_created", skip_serializing_if = "Option::is_none")]
    pub date_created: Option<String>,
    #[serde(rename = "user_updated", skip_serializing_if = "Option::is_none")]
    pub user_updated: Option<String>,
    #[serde(rename = "date_updated", skip_serializing_if = "Option::is_none")]
    pub date_updated: Option<String>,

    // 自定義字段
    #[serde(skip_serializing_if = "Option::is_none")]
    pub registration_id: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub activity_id: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub state: Option<String>,
    
    // JSON 字段直接使用 JsonValue
    #[serde(skip_serializing_if = "Option::is_none")]
    pub items: Option<JsonValue>,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub contact: Option<JsonValue>,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub total_amount: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub discount_amount: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub final_amount: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub paid_amount: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub need_receipt: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub receipt_number: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub receipt_issued: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub receipt_issued_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub receipt_issued_by: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub accounting_state: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub accounting_date: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub accounting_by: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub accounting_notes: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub payment_state: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub payment_method: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub payment_date: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub payment_notes: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub notes: Option<String>,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub created_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<String>,
}

impl From<ParticipationRecord> for ParticipationRecordResponse {
    fn from(record: ParticipationRecord) -> Self {
        Self {
            id: record.id,
            user_created: record.user_created,
            date_created: record.date_created,
            user_updated: record.user_updated,
            date_updated: record.date_updated,
            registration_id: record.registration_id,
            activity_id: record.activity_id,
            state: record.state,
            items: record.items
                .and_then(|s| serde_json::from_str(&s).ok()),
            contact: record.contact
                .and_then(|s| serde_json::from_str(&s).ok()),
            total_amount: record.total_amount,
            discount_amount: record.discount_amount,
            final_amount: record.final_amount,
            paid_amount: record.paid_amount,
            need_receipt: record.need_receipt,
            receipt_number: record.receipt_number,
            receipt_issued: record.receipt_issued,
            receipt_issued_at: record.receipt_issued_at,
            receipt_issued_by: record.receipt_issued_by,
            accounting_state: record.accounting_state,
            accounting_date: record.accounting_date,
            accounting_by: record.accounting_by,
            accounting_notes: record.accounting_notes,
            payment_state: record.payment_state,
            payment_method: record.payment_method,
            payment_date: record.payment_date,
            payment_notes: record.payment_notes,
            notes: record.notes,
            created_at: record.created_at,
            updated_at: record.updated_at,
        }
    }
}
