// src/routes/merged_receipts.rs
use axum::{
    routing::{delete, get, patch, post},
    Router,
};

use crate::handlers::merged_receipts;

pub fn create_routes() -> Router {
    Router::new()
        .route("/api/merged-receipts", get(merged_receipts::get_all_merged_receipts))
        .route("/api/merged-receipts", post(merged_receipts::create_merged_receipt))
        .route("/api/merged-receipts/by-receipt-type/{receipt_type}", get(merged_receipts::get_merged_receipt_by_receipt_type))
        .route("/api/merged-receipts/{id}", get(merged_receipts::get_merged_receipt_by_id))
        .route("/api/merged-receipts/{id}", patch(merged_receipts::update_merged_receipt))
        .route("/api/merged-receipts/{id}", delete(merged_receipts::delete_merged_receipt))
}