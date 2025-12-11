use serde::Deserialize;
use tower_http::cors::AllowOrigin;

#[derive(Debug, Deserialize, Clone)]
pub struct AppConfig {
    pub database_url: String,
    pub server_addr: String,
    pub jwt_secret: String,
    pub jwt_expiration: i64,
    pub allowed_origins: Vec<String>,
}

impl AppConfig {
    pub fn from_env() -> Self {
        let allowed_origins = std::env::var("ALLOWED_ORIGINS")
            .unwrap_or_else(|_| "http://localhost:3000".to_string())
            .split(',')
            .map(|s| s.trim().to_string())
            .collect();

        Self {
            database_url: std::env::var("DATABASE_URL").expect("DATABASE_URL must be set"),
            server_addr: std::env::var("SERVER_ADDR").unwrap_or_else(|_| "0.0.0.0:8080".to_string()),
            jwt_secret: std::env::var("JWT_SECRET").expect("JWT_SECRET must be set"),
            jwt_expiration: std::env::var("JWT_EXPIRATION")
                .unwrap_or_else(|_| "86400".to_string())
                .parse()
                .expect("JWT_EXPIRATION must be a number"),
            allowed_origins,
        }
    }

    pub fn allowed_origins(&self) -> AllowOrigin {
        let origins: Vec<_> = self
            .allowed_origins
            .iter()
            .filter_map(|s| s.parse().ok())
            .collect();
        AllowOrigin::list(origins)
    }
}
