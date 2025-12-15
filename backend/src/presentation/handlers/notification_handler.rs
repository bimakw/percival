/*
 * Licensed under the MIT License
 * Copyright (c) 2024 bimakw
 */

use axum::{
    extract::{Path, Query, State},
    Extension, Json,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use uuid::Uuid;

use crate::application::services::NotificationAppService;
use crate::domain::entities::Notification;
use crate::presentation::dto::ApiResponse;
use crate::presentation::middleware::AuthUser;
use crate::shared::DomainError;

#[derive(Debug, Deserialize)]
pub struct NotificationQuery {
    pub limit: Option<i64>,
}

#[derive(Debug, Serialize)]
pub struct UnreadCountResponse {
    pub count: i64,
}

pub async fn list_notifications(
    State(service): State<Arc<NotificationAppService>>,
    Extension(auth_user): Extension<AuthUser>,
    Query(query): Query<NotificationQuery>,
) -> Result<Json<ApiResponse<Vec<Notification>>>, DomainError> {
    let notifications = service
        .get_user_notifications(auth_user.id, query.limit)
        .await?;
    Ok(Json(ApiResponse::success(notifications)))
}

pub async fn get_unread_notifications(
    State(service): State<Arc<NotificationAppService>>,
    Extension(auth_user): Extension<AuthUser>,
) -> Result<Json<ApiResponse<Vec<Notification>>>, DomainError> {
    let notifications = service.get_unread_notifications(auth_user.id).await?;
    Ok(Json(ApiResponse::success(notifications)))
}

pub async fn get_unread_count(
    State(service): State<Arc<NotificationAppService>>,
    Extension(auth_user): Extension<AuthUser>,
) -> Result<Json<ApiResponse<UnreadCountResponse>>, DomainError> {
    let count = service.get_unread_count(auth_user.id).await?;
    Ok(Json(ApiResponse::success(UnreadCountResponse { count })))
}

pub async fn mark_as_read(
    State(service): State<Arc<NotificationAppService>>,
    Extension(auth_user): Extension<AuthUser>,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<()>>, DomainError> {
    service.mark_as_read(id, auth_user.id).await?;
    Ok(Json(ApiResponse::ok("Notification marked as read")))
}

pub async fn mark_all_as_read(
    State(service): State<Arc<NotificationAppService>>,
    Extension(auth_user): Extension<AuthUser>,
) -> Result<Json<ApiResponse<()>>, DomainError> {
    service.mark_all_as_read(auth_user.id).await?;
    Ok(Json(ApiResponse::ok("All notifications marked as read")))
}

pub async fn delete_notification(
    State(service): State<Arc<NotificationAppService>>,
    Extension(auth_user): Extension<AuthUser>,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<()>>, DomainError> {
    service.delete_notification(id, auth_user.id).await?;
    Ok(Json(ApiResponse::ok("Notification deleted")))
}
