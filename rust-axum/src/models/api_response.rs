// src/models/api_response.rs
use serde::Serialize;

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