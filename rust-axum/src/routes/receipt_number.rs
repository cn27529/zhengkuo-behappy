// src/routes/receipt_number.rs
use axum::{
    routing::{get, post, patch},
    Router,
};

use crate::handlers::receipt_number;

/// 創建收據編號相關的路由
pub fn create_routes() -> Router {
    Router::new()
        // 獲取所有收據編號（支持查詢參數：yearMonth, receiptType, state 等）
        .route(
            "/api/receipt-numbers", 
            get(receipt_number::get_all_receipt_numbers)
        )
        // 🔥 核心：原子性生成新收據編號 (方案 1)
        .route(
            "/api/receipt-numbers/generate", 
            post(receipt_number::generate_receipt_number)
        )
        // 更新收據編號狀態（例如：作廢 void）
        .route(
            "/api/receipt-numbers/{id}/status", 
            patch(receipt_number::void_receipt_number)
        )
        // 合併收據編號
        .route(
            "/api/receipt-numbers/merge",
            post(receipt_number::generate_merged_receipt_number)
        )
        
}