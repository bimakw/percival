use axum::{
    extract::{Path, Query, State},
    Json,
};
use serde::Deserialize;
use std::sync::Arc;
use uuid::Uuid;

use crate::application::services::ActivityAppService;
use crate::domain::entities::ActivityLog;
use crate::presentation::dto::ApiResponse;
use crate::shared::DomainError;

#[derive(Debug, Deserialize)]
pub struct ListActivitiesQuery {
    pub limit: Option<i64>,
    pub project_id: Option<Uuid>,
}

pub async fn list_activities(
    State(service): State<Arc<ActivityAppService>>,
    Query(params): Query<ListActivitiesQuery>,
) -> Result<Json<ApiResponse<Vec<ActivityLog>>>, DomainError> {
    let activities = if let Some(project_id) = params.project_id {
        service.get_activities_by_project(project_id, params.limit).await?
    } else {
        service.list_activities(params.limit).await?
    };

    Ok(Json(ApiResponse::success(activities)))
}

pub async fn get_project_activities(
    State(service): State<Arc<ActivityAppService>>,
    Path(project_id): Path<Uuid>,
    Query(params): Query<ListActivitiesQuery>,
) -> Result<Json<ApiResponse<Vec<ActivityLog>>>, DomainError> {
    let activities = service.get_activities_by_project(project_id, params.limit).await?;
    Ok(Json(ApiResponse::success(activities)))
}
