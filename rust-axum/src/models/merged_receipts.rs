// src/models/merged_receipts.rs
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use serde_json::Value as JsonValue;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct MergedReceipt {
    // Directus 系統字段
    pub id: i64,
    #[sqlx(default)]
    pub user_created: Option<String>,  // char(36) - Directus 用戶 UUID
    #[sqlx(default)]
    pub date_created: Option<String>,  // datetime
    #[sqlx(default)]
    pub user_updated: Option<String>,  // char(36) - Directus 用戶 UUID
    #[sqlx(default)]
    pub date_updated: Option<String>,  // datetime

    // 業務字段
    #[sqlx(rename = "receiptNumber", default)]
    pub receipt_number: Option<String>,
    #[sqlx(rename = "receiptType", default)]
    pub receipt_type: Option<String>,
    #[sqlx(default)]
    #[serde(
        serialize_with = "serialize_json_string",
        deserialize_with = "deserialize_json_string",
        skip_serializing_if = "Option::is_none"
    )]
    pub merge_ids: Option<String>,  // json field
    #[sqlx(rename = "totalAmount", default)]
    pub total_amount: Option<i64>,
    #[sqlx(rename = "issuedAt", default)]
    pub issued_at: Option<String>,
    #[sqlx(rename = "issuedBy", default)]
    pub issued_by: Option<String>,
    #[sqlx(default)]
    pub notes: Option<String>,
    
    // 自定義時間戳
    #[sqlx(rename = "createdAt")]
    pub created_at: Option<String>,   // varchar(255)
    #[sqlx(rename = "updatedAt")]
    pub updated_at: Option<String>,   // varchar(255)
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

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateMergedReceiptRequest {
    #[serde(default)]
    pub receipt_number: Option<String>,
    #[serde(default)]
    pub receipt_type: Option<String>,
    #[serde(default)]
    pub merge_ids: Option<Vec<JsonValue>>,
    #[serde(default)]
    pub total_amount: Option<i64>,
    #[serde(default)]
    pub issued_at: Option<String>,
    #[serde(default)]
    pub issued_by: Option<String>,
    #[serde(default)]
    pub notes: Option<String>,
    #[serde(default)]
    pub created_at: Option<String>,
    #[serde(default)]
    pub updated_at: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateMergedReceiptRequest {
    pub receipt_number: Option<String>,
    pub receipt_type: Option<String>,
    pub merge_ids: Option<Vec<JsonValue>>,
    pub total_amount: Option<i64>,
    pub issued_at: Option<String>,
    pub issued_by: Option<String>,
    pub notes: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
    #[serde(default)]
    pub user_updated: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MergedReceiptQuery {
    pub receipt_number: Option<String>,
    pub receipt_type: Option<String>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
    pub sort: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MergedReceiptResponse {
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

    // 業務字段
    #[serde(skip_serializing_if = "Option::is_none")]
    pub receipt_number: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub receipt_type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub merge_ids: Option<Vec<JsonValue>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub total_amount: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub issued_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub issued_by: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub notes: Option<String>,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub created_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<String>,
}

impl From<MergedReceipt> for MergedReceiptResponse {
    fn from(data: MergedReceipt) -> Self {
        Self {
            id: data.id,
            user_created: data.user_created,
            date_created: data.date_created,
            user_updated: data.user_updated,
            date_updated: data.date_updated,
            receipt_number: data.receipt_number,
            receipt_type: data.receipt_type,
            merge_ids: data.merge_ids.and_then(|s| serde_json::from_str(&s).ok()),
            total_amount: data.total_amount,
            issued_at: data.issued_at,
            issued_by: data.issued_by,
            notes: data.notes,
            created_at: data.created_at,
            updated_at: data.updated_at,
        }
    }
}