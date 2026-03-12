// src/handlers/my_data.rs
use axum::{
    extract::{Extension, Path, Query},
    http::StatusCode,
    Json,
};
use sqlx::SqlitePool;

use crate::models::api_response::{ApiResponse, Meta};
use crate::models::my_data::{
    CreateMyDataRequest, MyData, MyDataResponse, MyDataQuery, UpdateMyDataRequest,
};

const MY_DATA_FULL_QUERY: &str = r#"
SELECT 
    id,
    user_created,
    CASE 
        WHEN date_created IS NOT NULL 
        THEN datetime(date_created / 1000, 'unixepoch') 
        ELSE NULL 
    END as date_created,
    user_updated,
    CASE 
        WHEN date_updated IS NOT NULL 
        THEN datetime(date_updated / 1000, 'unixepoch') 
        ELSE NULL 
    END as date_updated,
    state,
    formName,
    contact
FROM mydata
"#;

pub async fn get_all_my_data(
    Query(params): Query<MyDataQuery>,
    Extension(pool): Extension<SqlitePool>,
) -> Result<Json<ApiResponse<Vec<MyDataResponse>>>, (StatusCode, Json<ApiResponse<Vec<MyDataResponse>>>)> {
    let mut query = format!("{} WHERE 1=1", MY_DATA_FULL_QUERY);
    let mut count_query = String::from("SELECT COUNT(*) FROM mydata WHERE 1=1");

    if let Some(state) = &params.state {
        let condition = format!(" AND state = '{}'", state);
        query.push_str(&condition);
        count_query.push_str(&condition);
    }

    if let Some(form_name) = &params.form_name {
        let condition = format!(" AND formName LIKE '%{}%'", form_name);
        query.push_str(&condition);
        count_query.push_str(&condition);
    }

    if let Some(sort) = &params.sort {
        if sort.starts_with('-') {
            let field = &sort[1..];
            query.push_str(&format!(" ORDER BY {} DESC", field));
        } else {
            query.push_str(&format!(" ORDER BY {} ASC", sort));
        }
    } else {
        query.push_str(" ORDER BY date_created DESC");
    }

    let limit = params.limit.unwrap_or(100);
    let offset = params.offset.unwrap_or(0);
    query.push_str(&format!(" LIMIT {} OFFSET {}", limit, offset));

    let my_data_list = sqlx::query_as::<_, MyData>(&query)
        .fetch_all(&pool)
        .await
        .map_err(|e| {
            tracing::error!("查詢 myData 失敗: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error(format!("查詢失敗: {}", e))),
            )
        })?;

    let total: (i64,) = sqlx::query_as(&count_query)
        .fetch_one(&pool)
        .await
        .map_err(|e| {
            tracing::error!("查詢 myData 總數失敗: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error(format!("查詢總數失敗: {}", e))),
            )
        })?;

    let responses: Vec<MyDataResponse> = my_data_list
        .into_iter()
        .map(|data| data.into())
        .collect();

    Ok(Json(ApiResponse::success_with_meta(
        responses,
        Meta {
            total: total.0,
            limit: Some(limit),
            offset: Some(offset),
        },
    )))
}

pub async fn get_my_data_by_id(
    Path(id): Path<String>,
    Extension(pool): Extension<SqlitePool>,
) -> Result<Json<ApiResponse<MyDataResponse>>, (StatusCode, Json<ApiResponse<MyDataResponse>>)> {
    let query = format!("{} WHERE id = ?", MY_DATA_FULL_QUERY);
    let my_data = sqlx::query_as::<_, MyData>(&query)
        .bind(&id)
        .fetch_optional(&pool)
        .await
        .map_err(|e| {
            tracing::error!("查詢 myData 失敗: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error(format!("查詢失敗: {}", e))),
            )
        })?;

    match my_data {
        Some(data) => Ok(Json(ApiResponse::success(data.into()))),
        None => Err((
            StatusCode::NOT_FOUND,
            Json(ApiResponse::error(format!("找不到 ID 為 {} 的記錄", id))),
        )),
    }
}

pub async fn get_my_data_by_state(
    Path(state): Path<String>,
    Extension(pool): Extension<SqlitePool>,
) -> Result<Json<ApiResponse<Vec<MyDataResponse>>>, (StatusCode, Json<ApiResponse<Vec<MyDataResponse>>>)> {
    let query = format!("{} WHERE state = ?", MY_DATA_FULL_QUERY);
    let my_data_list = sqlx::query_as::<_, MyData>(&query)
        .bind(&state)
        .fetch_all(&pool)
        .await
        .map_err(|e| {
            tracing::error!("查詢 myData 失敗: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error(format!("查詢失敗: {}", e))),
            )
        })?;

    let responses: Vec<MyDataResponse> = my_data_list
        .into_iter()
        .map(|data| data.into())
        .collect();

    Ok(Json(ApiResponse::success(responses)))
}

pub async fn create_my_data(
    Extension(pool): Extension<SqlitePool>,
    Json(payload): Json<CreateMyDataRequest>,
) -> Result<Json<ApiResponse<MyDataResponse>>, (StatusCode, Json<ApiResponse<MyDataResponse>>)> {
    let id = uuid::Uuid::new_v4().to_string();
    let contact_str = payload.contact.map(|v| v.to_string());

    sqlx::query(
        r#"
        INSERT INTO mydata (id, state, formName, contact)
        VALUES (?, ?, ?, ?)
        "#,
    )
    .bind(&id)
    .bind(&payload.state)
    .bind(&payload.form_name)
    .bind(&contact_str)
    .execute(&pool)
    .await
    .map_err(|e| {
        tracing::error!("創建 myData 失敗: {}", e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::error(format!("創建失敗: {}", e))),
        )
    })?;

    let query = format!("{} WHERE id = ?", MY_DATA_FULL_QUERY);
    let my_data = sqlx::query_as::<_, MyData>(&query)
        .bind(&id)
        .fetch_one(&pool)
        .await
        .map_err(|e| {
            tracing::error!("查詢新創建的 myData 失敗: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error(format!("查詢失敗: {}", e))),
            )
        })?;

    Ok(Json(ApiResponse::success_with_message(
        my_data.into(),
        "成功創建記錄".to_string(),
    )))
}

pub async fn update_my_data(
    Path(id): Path<String>,
    Extension(pool): Extension<SqlitePool>,
    Json(payload): Json<UpdateMyDataRequest>,
) -> Result<Json<ApiResponse<MyDataResponse>>, (StatusCode, Json<ApiResponse<MyDataResponse>>)> {
    let exists: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM mydata WHERE id = ?")
        .bind(&id)
        .fetch_one(&pool)
        .await
        .map_err(|e| {
            tracing::error!("檢查 myData 失敗: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error(format!("檢查失敗: {}", e))),
            )
        })?;

    if exists.0 == 0 {
        return Err((
            StatusCode::NOT_FOUND,
            Json(ApiResponse::error(format!("找不到 ID 為 {} 的記錄", id))),
        ));
    }

    let mut updates = Vec::new();
    let mut bindings: Vec<String> = Vec::new();

    if let Some(state) = &payload.state {
        updates.push("state = ?");
        bindings.push(state.clone());
    }
    if let Some(form_name) = &payload.form_name {
        updates.push("formName = ?");
        bindings.push(form_name.clone());
    }
    if let Some(contact) = &payload.contact {
        updates.push("contact = ?");
        bindings.push(contact.to_string());
    }
    if let Some(user_updated) = &payload.user_updated {
        updates.push("user_updated = ?");
        bindings.push(user_updated.clone());
    }

    if updates.is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ApiResponse::error("沒有提供要更新的字段".to_string())),
        ));
    }

    let query = format!("UPDATE mydata SET {} WHERE id = ?", updates.join(", "));
    let mut query_builder = sqlx::query(&query);
    for binding in bindings {
        query_builder = query_builder.bind(binding);
    }
    query_builder = query_builder.bind(&id);

    query_builder.execute(&pool).await.map_err(|e| {
        tracing::error!("更新 myData 失敗: {}", e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::error(format!("更新失敗: {}", e))),
        )
    })?;

    let query = format!("{} WHERE id = ?", MY_DATA_FULL_QUERY);
    let my_data = sqlx::query_as::<_, MyData>(&query)
        .bind(&id)
        .fetch_one(&pool)
        .await
        .map_err(|e| {
            tracing::error!("查詢更新後的 myData 失敗: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error(format!("查詢失敗: {}", e))),
            )
        })?;

    Ok(Json(ApiResponse::success_with_message(
        my_data.into(),
        "成功更新記錄".to_string(),
    )))
}

pub async fn delete_my_data(
    Path(id): Path<String>,
    Extension(pool): Extension<SqlitePool>,
) -> Result<Json<ApiResponse<()>>, (StatusCode, Json<ApiResponse<()>>)> {
    let result = sqlx::query("DELETE FROM mydata WHERE id = ?")
        .bind(&id)
        .execute(&pool)
        .await
        .map_err(|e| {
            tracing::error!("刪除 myData 失敗: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error(format!("刪除失敗: {}", e))),
            )
        })?;

    if result.rows_affected() == 0 {
        return Err((
            StatusCode::NOT_FOUND,
            Json(ApiResponse::error(format!("找不到 ID 為 {} 的記錄", id))),
        ));
    }

    Ok(Json(ApiResponse {
        success: true,
        data: None,
        message: Some("成功刪除記錄".to_string()),
        meta: None,
        errors: None,
    }))
}
