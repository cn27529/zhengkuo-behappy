// src/models/registration.rs
use serde::{Deserialize, Serialize};
//use serde_json::Value;
use sqlx::FromRow;

/// 報名記錄模型 - 對應 Directus 的 registrationDB 表結構
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Registration {
    // Directus 系統字段
    pub id: i64,
    #[sqlx(default)]
    pub user_created: Option<String>,  // varchar(36) - Directus 用戶 UUID
    #[sqlx(default)]
    pub date_created: Option<String>,  // datetime
    #[sqlx(default)]
    pub user_updated: Option<String>,  // char(36) - Directus 用戶 UUID
    #[sqlx(default)]
    pub date_updated: Option<String>,  // datetime
    
    // 業務字段
    #[sqlx(default)]
    pub state: Option<String>,         // varchar(255)
    #[sqlx(rename = "formId", default)]
    pub form_id: Option<String>,       // varchar(255)
    #[sqlx(rename = "formName", default)]
    pub form_name: Option<String>,     // varchar(255)
    #[sqlx(rename = "formSource", default)]
    pub form_source: Option<String>,   // varchar(255)
    
    // JSON 字段
    #[sqlx(default)]
    pub salvation: Option<String>,      // json - 存儲為字符串
    #[sqlx(default)]
    pub contact: Option<String>,        // json - 存儲為字符串
    #[sqlx(default)]
    pub blessing: Option<String>,       // json - 存儲為字符串
    
    // 自定義時間戳
    #[sqlx(rename = "createdAt", default)]
    pub created_at: Option<String>,    // varchar(255)
    #[sqlx(rename = "updatedAt", default)]
    pub updated_at: Option<String>,    // varchar(255)
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
    #[serde(default)]
    pub salvation: Option<String>,
    #[serde(default)]
    pub contact: Option<String>,
    #[serde(default)]
    pub blessing: Option<String>,
}

/// 更新報名記錄請求
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateRegistrationRequest {
    pub state: Option<String>,
    pub form_id: Option<String>,
    pub form_name: Option<String>,
    pub form_source: Option<String>,
    pub salvation: Option<String>,
    pub contact: Option<String>,
    pub blessing: Option<String>,
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
