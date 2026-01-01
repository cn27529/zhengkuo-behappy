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

/// 活動響應 DTO - 用於 API 響應
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ActivityResponse {
    
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
    
    // 自定義業務字段
    #[serde(skip_serializing_if = "Option::is_none")]
    pub activity_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub item_type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub participants: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub date: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub state: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub icon: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub location: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub created_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<String>,
}

/// 從 Activity 到 ActivityResponse 的轉換
impl From<Activity> for ActivityResponse {
    fn from(activity: Activity) -> Self {
        Self {
            id: activity.id,
            user_created: activity.user_created,
            date_created: activity.date_created,
            user_updated: activity.user_updated,
            date_updated: activity.date_updated,
            activity_id: activity.activity_id,
            name: activity.name,
            item_type: activity.item_type,
            participants: activity.participants,
            date: activity.date,
            state: activity.state,
            icon: activity.icon,
            description: activity.description,
            location: activity.location,
            created_at: activity.created_at,
            updated_at: activity.updated_at,
        }
    }
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