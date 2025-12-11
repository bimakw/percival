use axum::{extract::State, Json};
use std::sync::Arc;

use crate::application::commands::{CreateUserCommand, LoginCommand};
use crate::application::services::{AuthAppService, AuthResponse};
use crate::domain::entities::User;
use crate::presentation::dto::ApiResponse;
use crate::shared::DomainError;

pub async fn register(
    State(auth_service): State<Arc<AuthAppService>>,
    Json(cmd): Json<CreateUserCommand>,
) -> Result<Json<ApiResponse<User>>, DomainError> {
    let email = cmd.email.clone();
    match auth_service.register(cmd).await {
        Ok(user) => {
            tracing::info!(
                email = %email,
                user_id = %user.id,
                "New user registered successfully"
            );
            Ok(Json(ApiResponse::success(user)))
        }
        Err(e) => {
            tracing::warn!(
                email = %email,
                error = %e,
                "Registration failed"
            );
            Err(e)
        }
    }
}

pub async fn login(
    State(auth_service): State<Arc<AuthAppService>>,
    Json(cmd): Json<LoginCommand>,
) -> Result<Json<ApiResponse<AuthResponse>>, DomainError> {
    let email = cmd.email.clone();
    match auth_service.login(cmd).await {
        Ok(response) => {
            tracing::info!(
                email = %email,
                user_id = %response.user.id,
                "User logged in successfully"
            );
            Ok(Json(ApiResponse::success(response)))
        }
        Err(e) => {
            tracing::warn!(
                email = %email,
                error = %e,
                "Login attempt failed"
            );
            Err(e)
        }
    }
}
