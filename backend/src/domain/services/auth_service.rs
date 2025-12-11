use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};

use crate::shared::DomainError;

pub struct AuthService;

impl AuthService {
    pub fn hash_password(password: &str) -> Result<String, DomainError> {
        let salt = SaltString::generate(&mut OsRng);
        let argon2 = Argon2::default();

        argon2
            .hash_password(password.as_bytes(), &salt)
            .map(|hash| hash.to_string())
            .map_err(|_| DomainError::InternalError("Failed to hash password".into()))
    }

    pub fn verify_password(password: &str, hash: &str) -> Result<bool, DomainError> {
        let parsed_hash = PasswordHash::new(hash)
            .map_err(|_| DomainError::InternalError("Invalid password hash".into()))?;

        Ok(Argon2::default()
            .verify_password(password.as_bytes(), &parsed_hash)
            .is_ok())
    }
}
