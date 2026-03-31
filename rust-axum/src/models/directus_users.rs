// src/models/directus_users.rs
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct DirectusUser {
    pub id: String,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub email: Option<String>,
    #[serde(skip_serializing)]
    pub password: Option<String>,
    pub location: Option<String>,
    pub title: Option<String>,
    pub description: Option<String>,
    pub tags: Option<String>,
    pub avatar: Option<String>,
    pub language: Option<String>,
    #[serde(skip_serializing)]
    pub tfa_secret: Option<String>,
    pub status: String,
    pub role: Option<String>,
    #[serde(skip_serializing)]
    pub token: Option<String>,
    pub last_access: Option<String>,
    pub last_page: Option<String>,
    pub provider: String,
    pub external_identifier: Option<String>,
    pub auth_data: Option<String>,
    pub email_notifications: Option<bool>,
    pub appearance: Option<String>,
    pub theme_dark: Option<String>,
    pub theme_light: Option<String>,
    pub theme_light_overrides: Option<String>,
    pub theme_dark_overrides: Option<String>,
    pub text_direction: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DirectusUserResponse {
    pub id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub first_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub email: Option<String>,
    // #[serde(skip_serializing_if = "Option::is_none")]
    // pub password: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub location: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tags: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub avatar: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub language: Option<String>,
    pub status: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub role: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_access: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_page: Option<String>,
    pub provider: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub external_identifier: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub auth_data: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub email_notifications: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub appearance: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub theme_dark: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub theme_light: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub theme_light_overrides: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub theme_dark_overrides: Option<String>,
    pub text_direction: String,
}

impl From<DirectusUser> for DirectusUserResponse {
    fn from(data: DirectusUser) -> Self {
        Self {
            id: data.id,
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            //password: user.password,
            location: data.location,
            title: data.title,
            description: data.description,
            tags: data.tags,
            avatar: data.avatar,
            language: data.language,
            status: data.status,
            role: data.role,
            last_access: data.last_access,
            last_page: data.last_page,
            provider: data.provider,
            external_identifier: data.external_identifier,
            auth_data: data.auth_data,
            email_notifications: data.email_notifications,
            appearance: data.appearance,
            theme_dark: data.theme_dark,
            theme_light: data.theme_light,
            theme_light_overrides: data.theme_light_overrides,
            theme_dark_overrides: data.theme_dark_overrides,
            text_direction: data.text_direction,
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct DirectusUserQuery {
    pub status: Option<String>,
    pub role: Option<String>,
}
