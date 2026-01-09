// src/models/registration.rs
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use serde_json::Value as JsonValue;

/// 報名記錄模型 - 對應 Directus 的 registrationDB 表結構
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Registration {
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
    pub state: Option<String>,
    #[sqlx(rename = "formId", default)]
    pub form_id: Option<String>,
    #[sqlx(rename = "formName", default)]
    pub form_name: Option<String>,
    #[sqlx(rename = "formSource", default)]
    pub form_source: Option<String>,
    
    // JSON 字段 - 使用 serde_json::Value
    #[sqlx(default)]
    #[serde(
        serialize_with = "serialize_json_string",
        deserialize_with = "deserialize_json_string",
        skip_serializing_if = "Option::is_none"
    )]
    pub salvation: Option<String>,
    
    #[sqlx(default)]
    #[serde(
        serialize_with = "serialize_json_string",
        deserialize_with = "deserialize_json_string",
        skip_serializing_if = "Option::is_none"
    )]
    pub contact: Option<String>,
    
    #[sqlx(default)]
    #[serde(
        serialize_with = "serialize_json_string",
        deserialize_with = "deserialize_json_string",
        skip_serializing_if = "Option::is_none"
    )]
    pub blessing: Option<String>,
    
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

/// 創建報名記錄請求
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateRegistrationRequest {
    #[serde(default)]
    pub state: Option<String>,
    pub form_id: String,
    #[serde(default)]
    pub form_name: Option<String>,
    #[serde(default)]
    pub form_source: Option<String>,
    
    // 接收 JSON 對象，自動轉為字符串
    #[serde(default)]
    pub salvation: Option<JsonValue>,
    #[serde(default)]
    pub contact: Option<JsonValue>,
    #[serde(default)]
    pub blessing: Option<JsonValue>,    
}

/// 更新報名記錄請求
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateRegistrationRequest {
    pub state: Option<String>,
    pub form_id: Option<String>,
    pub form_name: Option<String>,
    pub form_source: Option<String>,
    
    pub salvation: Option<JsonValue>,
    pub contact: Option<JsonValue>,
    pub blessing: Option<JsonValue>,
    
    #[serde(default)]
    pub user_updated: Option<String>,
}

/// 查詢參數
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RegistrationQuery {
    pub state: Option<String>,
    pub form_id: Option<String>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
    pub sort: Option<String>,
}

/// API 響應用的報名記錄 DTO
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RegistrationResponse {
    
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
    pub state: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub form_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub form_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub form_source: Option<String>,
    
    // JSON 字段直接使用 JsonValue
    #[serde(skip_serializing_if = "Option::is_none")]
    pub salvation: Option<JsonValue>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub contact: Option<JsonValue>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub blessing: Option<JsonValue>,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub created_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<String>,
}

impl From<Registration> for RegistrationResponse {
    fn from(reg: Registration) -> Self {
        Self {
            id: reg.id,
            user_created: reg.user_created,
            date_created: reg.date_created,
            user_updated: reg.user_updated,
            date_updated: reg.date_updated,
            state: reg.state,
            form_id: reg.form_id,
            form_name: reg.form_name,
            form_source: reg.form_source,
            salvation: reg.salvation
                .and_then(|s| serde_json::from_str(&s).ok()),
            contact: reg.contact
                .and_then(|s| serde_json::from_str(&s).ok()),
            blessing: reg.blessing
                .and_then(|s| serde_json::from_str(&s).ok()),
            created_at: reg.created_at,
            updated_at: reg.updated_at,
        }
    }
}