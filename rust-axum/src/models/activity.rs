// src/models/activity.rs
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

/// 活動模型 - 完全對應 Directus 的 activityDB 表結構
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Activity {
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
    
    // 自定義業務字段
    #[sqlx(rename = "activityId")]
    pub activity_id: Option<String>,  // varchar(255)
    pub name: Option<String>,         // varchar(255)
    pub item_type: Option<String>,    // varchar(255)
    #[sqlx(default)]
    pub participants: Option<i32>,    // integer DEFAULT 0
    pub date: Option<String>,         // varchar(255)
    pub state: Option<String>,        // varchar(255)
    #[sqlx(default)]
    pub icon: Option<String>,         // varchar(255) DEFAULT '🕯️'
    pub description: Option<String>,  // text
    pub location: Option<String>,     // varchar(255)
    
    // 自定義時間戳
    #[sqlx(rename = "createdAt")]
    pub created_at: Option<String>,   // varchar(255)
    #[sqlx(rename = "updatedAt")]
    pub updated_at: Option<String>,   // varchar(255)
}

/// 創建活動請求 - 只包含必要字段（Directus 字段由系統處理）
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateActivityRequest {
    pub activity_id: String,
    pub name: String,
    #[serde(default = "default_item_type")]
    pub item_type: String,
    #[serde(default)]
    pub participants: i32,
    pub date: String,
    #[serde(default = "default_state")]
    pub state: String,
    #[serde(default = "default_icon")]
    pub icon: String,
    pub description: Option<String>,
    pub location: Option<String>,
}

/// 更新活動請求
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateActivityRequest {
    pub name: Option<String>,
    pub item_type: Option<String>,
    pub participants: Option<i32>,
    pub date: Option<String>,
    pub state: Option<String>,
    pub icon: Option<String>,
    pub description: Option<String>,
    pub location: Option<String>,
}

/// 查詢參數
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ActivityQuery {
    pub state: Option<String>,
    pub item_type: Option<String>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
    pub sort: Option<String>,
}

/// API 響應結構（與前端 baseService 格式一致）
#[derive(Debug, Serialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub message: Option<String>,
    pub meta: Option<Meta>,
    pub errors: Option<Vec<String>>,
}

/// 元數據結構
#[derive(Debug, Serialize)]
pub struct Meta {
    pub total: i64,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

impl<T> ApiResponse<T> {
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            message: None,
            meta: None,
            errors: None,
        }
    }

    pub fn success_with_meta(data: T, meta: Meta) -> Self {
        Self {
            success: true,
            data: Some(data),
            message: None,
            meta: Some(meta),
            errors: None,
        }
    }

    pub fn success_with_message(data: T, message: String) -> Self {
        Self {
            success: true,
            data: Some(data),
            message: Some(message),
            meta: None,
            errors: None,
        }
    }

    pub fn error(message: String) -> Self {
        Self {
            success: false,
            data: None,
            message: Some(message),
            meta: None,
            errors: None,
        }
    }

    pub fn error_with_details(message: String, errors: Vec<String>) -> Self {
        Self {
            success: false,
            data: None,
            message: Some(message),
            meta: None,
            errors: Some(errors),
        }
    }
}

// 默認值函數
fn default_item_type() -> String {
    "ceremony".to_string()
}

fn default_state() -> String {
    "upcoming".to_string()
}

fn default_icon() -> String {
    "🕯️".to_string()
}