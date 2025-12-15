/*
 * Licensed under the MIT License
 * Copyright (c) 2024 bimakw
 */

use async_trait::async_trait;
use chrono::{DateTime, Utc};
use sqlx::{FromRow, PgPool};
use uuid::Uuid;

use crate::domain::entities::{Notification, NotificationType};
use crate::domain::repositories::NotificationRepository;
use crate::shared::DomainError;

#[derive(Debug, FromRow)]
struct NotificationRow {
    id: Uuid,
    user_id: Uuid,
    #[sqlx(rename = "type")]
    notification_type: NotificationType,
    title: String,
    message: String,
    link: Option<String>,
    is_read: bool,
    created_at: DateTime<Utc>,
}

impl From<NotificationRow> for Notification {
    fn from(row: NotificationRow) -> Self {
        Notification {
            id: row.id,
            user_id: row.user_id,
            notification_type: row.notification_type,
            title: row.title,
            message: row.message,
            link: row.link,
            is_read: row.is_read,
            created_at: row.created_at,
        }
    }
}

pub struct PgNotificationRepository {
    pool: PgPool,
}

impl PgNotificationRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl NotificationRepository for PgNotificationRepository {
    async fn find_by_id(&self, id: Uuid) -> Result<Option<Notification>, DomainError> {
        let row = sqlx::query_as::<_, NotificationRow>("SELECT * FROM notifications WHERE id = $1")
            .bind(id)
            .fetch_optional(&self.pool)
            .await?;

        Ok(row.map(Into::into))
    }

    async fn find_by_user(&self, user_id: Uuid, limit: Option<i64>) -> Result<Vec<Notification>, DomainError> {
        let rows = sqlx::query_as::<_, NotificationRow>(
            "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2",
        )
        .bind(user_id)
        .bind(limit.unwrap_or(50))
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(Into::into).collect())
    }

    async fn find_unread_by_user(&self, user_id: Uuid) -> Result<Vec<Notification>, DomainError> {
        let rows = sqlx::query_as::<_, NotificationRow>(
            "SELECT * FROM notifications WHERE user_id = $1 AND is_read = FALSE ORDER BY created_at DESC",
        )
        .bind(user_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(Into::into).collect())
    }

    async fn count_unread(&self, user_id: Uuid) -> Result<i64, DomainError> {
        let result: (i64,) = sqlx::query_as(
            "SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE",
        )
        .bind(user_id)
        .fetch_one(&self.pool)
        .await?;

        Ok(result.0)
    }

    async fn create(&self, notification: &Notification) -> Result<Notification, DomainError> {
        let row = sqlx::query_as::<_, NotificationRow>(
            r#"
            INSERT INTO notifications (id, user_id, type, title, message, link, is_read, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
            "#,
        )
        .bind(notification.id)
        .bind(notification.user_id)
        .bind(&notification.notification_type)
        .bind(&notification.title)
        .bind(&notification.message)
        .bind(&notification.link)
        .bind(notification.is_read)
        .bind(notification.created_at)
        .fetch_one(&self.pool)
        .await?;

        Ok(row.into())
    }

    async fn mark_as_read(&self, id: Uuid) -> Result<(), DomainError> {
        sqlx::query("UPDATE notifications SET is_read = TRUE WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await?;

        Ok(())
    }

    async fn mark_all_as_read(&self, user_id: Uuid) -> Result<(), DomainError> {
        sqlx::query("UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE")
            .bind(user_id)
            .execute(&self.pool)
            .await?;

        Ok(())
    }

    async fn delete(&self, id: Uuid) -> Result<(), DomainError> {
        sqlx::query("DELETE FROM notifications WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await?;

        Ok(())
    }
}
