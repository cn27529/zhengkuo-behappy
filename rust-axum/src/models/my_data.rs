// src/models/my_data.rs
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use serde_json::Value as JsonValue;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct MyData {
    pub id: String,
    #[sqlx(default)]
    pub user_created: Option<String>,
    #[sqlx(default)]
    pub date_created: Option<String>,
    #[sqlx(default)]
    pub user_updated: Option<String>,
    #[sqlx(default)]
    pub date_updated: Option<String>,
    #[sqlx(default)]
    pub state: Option<String>,
    #[sqlx(rename = "formName", default)]
    pub form_name: Option<String>,
    #[sqlx(default)]
    #[serde(
        serialize_with = "serialize_json_string",
        deserialize_with = "deserialize_json_string",
        skip_serializing_if = "Option::is_none"
    )]
    pub contact: Option<String>,
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
pub struct CreateMyDataRequest {
    #[serde(default)]
    pub state: Option<String>,
    #[serde(default)]
    pub form_name: Option<String>,
    #[serde(default)]
    pub contact: Option<JsonValue>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateMyDataRequest {
    pub state: Option<String>,
    pub form_name: Option<String>,
    pub contact: Option<JsonValue>,
    #[serde(default)]
    pub user_updated: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MyDataQuery {
    pub state: Option<String>,
    pub form_name: Option<String>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
    pub sort: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MyDataResponse {
    pub id: String,
    #[serde(rename = "user_created", skip_serializing_if = "Option::is_none")]
    pub user_created: Option<String>,
    #[serde(rename = "date_created", skip_serializing_if = "Option::is_none")]
    pub date_created: Option<String>,
    #[serde(rename = "user_updated", skip_serializing_if = "Option::is_none")]
    pub user_updated: Option<String>,
    #[serde(rename = "date_updated", skip_serializing_if = "Option::is_none")]
    pub date_updated: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub state: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub form_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub contact: Option<JsonValue>,
}

impl From<MyData> for MyDataResponse {
    fn from(data: MyData) -> Self {
        Self {
            id: data.id,
            user_created: data.user_created,
            date_created: data.date_created,
            user_updated: data.user_updated,
            date_updated: data.date_updated,
            state: data.state,
            form_name: data.form_name,
            contact: data.contact.and_then(|s| serde_json::from_str(&s).ok()),
        }
    }
}
