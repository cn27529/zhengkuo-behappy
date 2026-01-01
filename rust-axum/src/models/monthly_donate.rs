// src/models/monthly_donate.rs
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use serde_json::Value as JsonValue;

/// 每月捐款記錄模型 - 對應 Directus 的 monthlyDonateDB 表結構
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct MonthlyDonate {
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
    #[sqlx(default)]
    pub name: Option<String>,
    
    #[sqlx(rename = "registrationId", default)]
    pub registration_id: Option<i64>,
    
    #[sqlx(rename = "donateId", default)]
    pub donate_id: Option<String>,
    
    #[sqlx(rename = "donateType", default)]
    pub donate_type: Option<String>,
    
    // JSON 字段 - 使用 serde_json::Value
    #[sqlx(rename = "donateItems", default)]
    #[serde(
        serialize_with = "serialize_json_string",
        deserialize_with = "deserialize_json_string",
        skip_serializing_if = "Option::is_none"
    )]
    pub donate_items: Option<String>,
    
    #[sqlx(default)]
    pub memo: Option<String>,
    
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

/// 創建每月捐款記錄請求
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateMonthlyDonateRequest {
    #[serde(default)]
    pub name: Option<String>,
    
    #[serde(default)]
    pub registration_id: Option<i64>,
    
    #[serde(default)]
    pub donate_id: Option<String>,
    
    #[serde(default)]
    pub donate_type: Option<String>,
    
    // 接收 JSON 對象，自動轉為字符串
    #[serde(default)]
    pub donate_items: Option<JsonValue>,
    
    #[serde(default)]
    pub memo: Option<String>,
    
    #[serde(default)]
    pub user_created: Option<String>,
}

/// 更新每月捐款記錄請求
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateMonthlyDonateRequest {
    pub name: Option<String>,
    pub registration_id: Option<i64>,
    pub donate_id: Option<String>,
    pub donate_type: Option<String>,
    
    pub donate_items: Option<JsonValue>,
    
    pub memo: Option<String>,
    
    #[serde(default)]
    pub user_updated: Option<String>,
}

/// 查詢參數
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MonthlyDonateQuery {
    pub name: Option<String>,
    pub registration_id: Option<i64>,
    pub donate_id: Option<String>,
    pub donate_type: Option<String>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
    pub sort: Option<String>,
}

/// API 響應用的每月捐款記錄 DTO
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MonthlyDonateResponse {
    pub id: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub user_created: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub date_created: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub user_updated: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub date_updated: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub registration_id: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub donate_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub donate_type: Option<String>,
    
    // JSON 字段直接使用 JsonValue
    #[serde(skip_serializing_if = "Option::is_none")]
    pub donate_items: Option<JsonValue>,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub memo: Option<String>,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub created_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<String>,
}

impl From<MonthlyDonate> for MonthlyDonateResponse {
    fn from(donate: MonthlyDonate) -> Self {
        Self {
            id: donate.id,
            user_created: donate.user_created,
            date_created: donate.date_created,
            user_updated: donate.user_updated,
            date_updated: donate.date_updated,
            name: donate.name,
            registration_id: donate.registration_id,
            donate_id: donate.donate_id,
            donate_type: donate.donate_type,
            donate_items: donate.donate_items
                .and_then(|s| serde_json::from_str(&s).ok()),
            memo: donate.memo,
            created_at: donate.created_at,
            updated_at: donate.updated_at,
        }
    }
}