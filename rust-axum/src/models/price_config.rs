// src/models/price_config.rs
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use serde_json::Value as JsonValue;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct PriceConfig {
    pub id: i64,
    #[sqlx(default)]
    pub user_created: Option<String>,
    #[sqlx(default)]
    pub date_created: Option<String>,
    #[sqlx(default)]
    pub user_updated: Option<String>,
    #[sqlx(default)]
    pub date_updated: Option<String>,
    #[sqlx(default)]
    pub version: Option<String>,
    #[sqlx(default)]
    pub state: Option<String>,
    #[sqlx(default)]
    #[serde(
        serialize_with = "serialize_json_string",
        deserialize_with = "deserialize_json_string",
        skip_serializing_if = "Option::is_none"
    )]
    pub prices: Option<String>,
    #[sqlx(default)]
    pub notes: Option<String>,
    #[sqlx(default)]
    pub enable_date: Option<String>,
    #[sqlx(default)]
    pub created_at: Option<String>,
    #[sqlx(default)]
    pub updated_at: Option<String>,
}

fn serialize_json_string<S>(
    value: &Option<String>,
    serializer: S,
) -> Result<S::Ok, S::Error>
where
    S: serde::Serializer,
{
    match value {
        Some(s) => match serde_json::from_str::<JsonValue>(s) {
            Ok(json) => json.serialize(serializer),
            Err(_) => serializer.serialize_none(),
        },
        None => serializer.serialize_none(),
    }
}

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
pub struct CreatePriceConfigRequest {
    #[serde(default)]
    pub version: Option<String>,
    #[serde(default)]
    pub state: Option<String>,
    #[serde(default)]
    pub prices: Option<JsonValue>,
    #[serde(default)]
    pub notes: Option<String>,
    #[serde(default)]
    pub enable_date: Option<String>,
    #[serde(default)]
    pub created_at: Option<String>,
    #[serde(default)]
    pub updated_at: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdatePriceConfigRequest {
    pub version: Option<String>,
    pub state: Option<String>,
    pub prices: Option<JsonValue>,
    pub notes: Option<String>,
    pub enable_date: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
    #[serde(default)]
    pub user_updated: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PriceConfigQuery {
    pub version: Option<String>,
    pub state: Option<String>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
    pub sort: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PriceConfigResponse {
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
    pub version: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub state: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prices: Option<JsonValue>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub notes: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enable_date: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub created_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<String>,
}

impl From<PriceConfig> for PriceConfigResponse {
    fn from(data: PriceConfig) -> Self {
        Self {
            id: data.id,
            user_created: data.user_created,
            date_created: data.date_created,
            user_updated: data.user_updated,
            date_updated: data.date_updated,
            version: data.version,
            state: data.state,
            prices: data.prices.and_then(|s| serde_json::from_str(&s).ok()),
            notes: data.notes,
            enable_date: data.enable_date,
            created_at: data.created_at,
            updated_at: data.updated_at,
        }
    }
}