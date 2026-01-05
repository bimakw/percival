use chrono::{Duration, Utc};
use jsonwebtoken::{encode, EncodingKey, Header};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use uuid::Uuid;

use crate::application::commands::{CreateUserCommand, LoginCommand};
use crate::domain::entities::User;
use crate::domain::repositories::UserRepository;
use crate::domain::services::AuthService;
use crate::domain::value_objects::{Email, PasswordValidator, UserRole};
use crate::shared::DomainError;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Claims {
    pub sub: Uuid,
    pub email: String,
    pub role: UserRole,
    pub exp: i64,
}

#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub token: String,
    pub user: User,
}

pub struct AuthAppService {
    user_repository: Arc<dyn UserRepository>,
    jwt_secret: String,
    jwt_expiration: i64,
}

impl AuthAppService {
    pub fn new(
        user_repository: Arc<dyn UserRepository>,
        jwt_secret: String,
        jwt_expiration: i64,
    ) -> Self {
        Self {
            user_repository,
            jwt_secret,
            jwt_expiration,
        }
    }

    pub async fn register(&self, cmd: CreateUserCommand) -> Result<User, DomainError> {
        // Validate email
        let email = Email::new(&cmd.email)?;

        // Validate password strength
        PasswordValidator::validate(&cmd.password)?;

        // Check if user already exists
        if self
            .user_repository
            .find_by_email(email.as_str())
            .await?
            .is_some()
        {
            return Err(DomainError::AlreadyExists(
                "Email already registered".into(),
            ));
        }

        // Hash password
        let password_hash = AuthService::hash_password(&cmd.password)?;

        // Create user entity
        let user = User::new(email, password_hash, cmd.name, cmd.role);

        // Persist
        self.user_repository.create(&user).await
    }

    pub async fn login(&self, cmd: LoginCommand) -> Result<AuthResponse, DomainError> {
        // Find user by email
        let user = self
            .user_repository
            .find_by_email(&cmd.email)
            .await?
            .ok_or_else(|| DomainError::Unauthorized("Invalid credentials".into()))?;

        // Verify password
        if !AuthService::verify_password(&cmd.password, &user.password_hash)? {
            return Err(DomainError::Unauthorized("Invalid credentials".into()));
        }

        // Generate JWT
        let token = self.generate_token(&user)?;

        Ok(AuthResponse { token, user })
    }

    fn generate_token(&self, user: &User) -> Result<String, DomainError> {
        let claims = Claims {
            sub: user.id,
            email: user.email.to_string(),
            role: user.role.clone(),
            exp: (Utc::now() + Duration::seconds(self.jwt_expiration)).timestamp(),
        };

        encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(self.jwt_secret.as_bytes()),
        )
        .map_err(|_| DomainError::InternalError("Failed to generate token".into()))
    }
}
