use axum::{
    extract::{Path, State},
    Extension, Json,
};
use std::sync::Arc;
use uuid::Uuid;

use crate::application::commands::{AddTeamMemberCommand, CreateTeamCommand, UpdateTeamCommand};
use crate::application::services::TeamAppService;
use crate::domain::entities::{Team, TeamMember};
use crate::presentation::dto::ApiResponse;
use crate::presentation::middleware::AuthUser;
use crate::shared::DomainError;

pub async fn list_teams(
    State(service): State<Arc<TeamAppService>>,
) -> Result<Json<ApiResponse<Vec<Team>>>, DomainError> {
    let teams = service.list_teams().await?;
    Ok(Json(ApiResponse::success(teams)))
}

pub async fn get_team(
    State(service): State<Arc<TeamAppService>>,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<Team>>, DomainError> {
    let team = service.get_team(id).await?;
    Ok(Json(ApiResponse::success(team)))
}

pub async fn create_team(
    State(service): State<Arc<TeamAppService>>,
    Extension(auth_user): Extension<AuthUser>,
    Json(cmd): Json<CreateTeamCommand>,
) -> Result<Json<ApiResponse<Team>>, DomainError> {
    tracing::info!(
        user_id = %auth_user.id,
        "User creating new team"
    );
    let team = service.create_team(cmd).await?;
    Ok(Json(ApiResponse::success(team)))
}

pub async fn update_team(
    State(service): State<Arc<TeamAppService>>,
    Extension(auth_user): Extension<AuthUser>,
    Path(id): Path<Uuid>,
    Json(cmd): Json<UpdateTeamCommand>,
) -> Result<Json<ApiResponse<Team>>, DomainError> {
    tracing::info!(
        user_id = %auth_user.id,
        team_id = %id,
        "User updating team"
    );
    let team = service.update_team(id, cmd).await?;
    Ok(Json(ApiResponse::success(team)))
}

pub async fn delete_team(
    State(service): State<Arc<TeamAppService>>,
    Extension(auth_user): Extension<AuthUser>,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<()>>, DomainError> {
    tracing::info!(
        user_id = %auth_user.id,
        team_id = %id,
        "User deleting team"
    );
    service.delete_team(id).await?;
    Ok(Json(ApiResponse::ok("Team deleted successfully")))
}

pub async fn get_team_members(
    State(service): State<Arc<TeamAppService>>,
    Path(id): Path<Uuid>,
) -> Result<Json<ApiResponse<Vec<TeamMember>>>, DomainError> {
    let members = service.get_team_members(id).await?;
    Ok(Json(ApiResponse::success(members)))
}

pub async fn add_team_member(
    State(service): State<Arc<TeamAppService>>,
    Extension(auth_user): Extension<AuthUser>,
    Path(team_id): Path<Uuid>,
    Json(cmd): Json<AddTeamMemberCommand>,
) -> Result<Json<ApiResponse<TeamMember>>, DomainError> {
    tracing::info!(
        user_id = %auth_user.id,
        team_id = %team_id,
        new_member_id = %cmd.user_id,
        "User adding team member"
    );
    let member = service.add_team_member(team_id, cmd).await?;
    Ok(Json(ApiResponse::success(member)))
}
