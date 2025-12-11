use axum::{
    extract::Request,
    http::{header, StatusCode},
    middleware::Next,
    response::Response,
};
use jsonwebtoken::{decode, DecodingKey, Validation};
use uuid::Uuid;

use crate::application::services::Claims;

#[derive(Clone, Debug)]
pub struct AuthUser {
    pub id: Uuid,
    pub email: String,
    pub role: crate::domain::value_objects::UserRole,
}

pub async fn auth_middleware(mut request: Request, next: Next) -> Result<Response, StatusCode> {
    let auth_header = request
        .headers()
        .get(header::AUTHORIZATION)
        .and_then(|header| header.to_str().ok());

    let token = match auth_header {
        Some(header) if header.starts_with("Bearer ") => &header[7..],
        _ => {
            tracing::warn!("Missing or invalid Authorization header");
            return Err(StatusCode::UNAUTHORIZED);
        }
    };

    let jwt_secret = std::env::var("JWT_SECRET").expect("JWT_SECRET must be set");

    let token_data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(jwt_secret.as_bytes()),
        &Validation::default(),
    )
    .map_err(|e| {
        tracing::warn!("JWT validation failed: {:?}", e);
        StatusCode::UNAUTHORIZED
    })?;

    let auth_user = AuthUser {
        id: token_data.claims.sub,
        email: token_data.claims.email,
        role: token_data.claims.role,
    };

    request.extensions_mut().insert(auth_user);

    Ok(next.run(request).await)
}
