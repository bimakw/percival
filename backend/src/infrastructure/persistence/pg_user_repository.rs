use async_trait::async_trait;
use chrono::{DateTime, Utc};
use sqlx::{FromRow, PgPool};
use uuid::Uuid;

use crate::domain::entities::User;
use crate::domain::repositories::UserRepository;
use crate::domain::value_objects::{Email, UserRole};
use crate::shared::DomainError;

#[derive(Debug, FromRow)]
struct UserRow {
    id: Uuid,
    email: String,
    password_hash: String,
    name: String,
    role: UserRole,
    avatar_url: Option<String>,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}

impl From<UserRow> for User {
    fn from(row: UserRow) -> Self {
        User {
            id: row.id,
            email: Email::new(row.email).unwrap(),
            password_hash: row.password_hash,
            name: row.name,
            role: row.role,
            avatar_url: row.avatar_url,
            created_at: row.created_at,
            updated_at: row.updated_at,
        }
    }
}

pub struct PgUserRepository {
    pool: PgPool,
}

impl PgUserRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl UserRepository for PgUserRepository {
    async fn find_by_id(&self, id: Uuid) -> Result<Option<User>, DomainError> {
        let row = sqlx::query_as::<_, UserRow>("SELECT * FROM users WHERE id = $1")
            .bind(id)
            .fetch_optional(&self.pool)
            .await?;

        Ok(row.map(Into::into))
    }

    async fn find_by_email(&self, email: &str) -> Result<Option<User>, DomainError> {
        let row = sqlx::query_as::<_, UserRow>("SELECT * FROM users WHERE email = $1")
            .bind(email)
            .fetch_optional(&self.pool)
            .await?;

        Ok(row.map(Into::into))
    }

    async fn find_all(&self) -> Result<Vec<User>, DomainError> {
        let rows = sqlx::query_as::<_, UserRow>("SELECT * FROM users ORDER BY created_at DESC")
            .fetch_all(&self.pool)
            .await?;

        Ok(rows.into_iter().map(Into::into).collect())
    }

    async fn create(&self, user: &User) -> Result<User, DomainError> {
        let row = sqlx::query_as::<_, UserRow>(
            r#"
            INSERT INTO users (id, email, password_hash, name, role, avatar_url, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
            "#,
        )
        .bind(user.id)
        .bind(user.email.as_str())
        .bind(&user.password_hash)
        .bind(&user.name)
        .bind(&user.role)
        .bind(&user.avatar_url)
        .bind(user.created_at)
        .bind(user.updated_at)
        .fetch_one(&self.pool)
        .await?;

        Ok(row.into())
    }

    async fn update(&self, user: &User) -> Result<User, DomainError> {
        let row = sqlx::query_as::<_, UserRow>(
            r#"
            UPDATE users
            SET name = $1, role = $2, avatar_url = $3, updated_at = NOW()
            WHERE id = $4
            RETURNING *
            "#,
        )
        .bind(&user.name)
        .bind(&user.role)
        .bind(&user.avatar_url)
        .bind(user.id)
        .fetch_one(&self.pool)
        .await?;

        Ok(row.into())
    }

    async fn delete(&self, id: Uuid) -> Result<(), DomainError> {
        sqlx::query("DELETE FROM users WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await?;

        Ok(())
    }
}
