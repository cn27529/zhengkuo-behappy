// src/routes/my_data.rs
use axum::{
    routing::{delete, get, patch, post},
    Router,
};

use crate::handlers::my_data;

pub fn create_routes() -> Router {
    Router::new()
        .route("/api/my-data", get(my_data::get_all_my_data))
        .route("/api/my-data", post(my_data::create_my_data))
        .route("/api/my-data/{id}", get(my_data::get_my_data_by_id))
        .route("/api/my-data/{id}", patch(my_data::update_my_data))
        .route("/api/my-data/{id}", delete(my_data::delete_my_data))
        .route("/api/my-data/by-state/{state}", get(my_data::get_my_data_by_state))
}
