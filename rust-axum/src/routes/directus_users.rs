// src/routes/directus_users.rs
use axum::{routing::get, Router};

use crate::handlers::directus_users;

pub fn create_routes() -> Router {
    Router::new()
        .route("/api/directus-users", get(directus_users::get_all_users))
        .route("/api/directus-users/{id}", get(directus_users::get_user_by_id))
}
