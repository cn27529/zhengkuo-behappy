// src/routes/price_config.rs
use axum::{
    routing::{delete, get, patch, post},
    Router,
};

use crate::handlers::price_config;

pub fn create_routes() -> Router {
    Router::new()
        .route("/api/price-config", get(price_config::get_all_price_configs))
        .route("/api/price-config", post(price_config::create_price_config))
        .route("/api/price-config/{id}", get(price_config::get_price_config_by_id))
        .route("/api/price-config/{id}", patch(price_config::update_price_config))
        .route("/api/price-config/{id}", delete(price_config::delete_price_config))
        .route("/api/price-config/by-state/{state}", get(price_config::get_price_config_by_state))
}
