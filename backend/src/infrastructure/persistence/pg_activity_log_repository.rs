use async_trait::async_trait;
use chrono::{DateTime, Utc};
use serde_json::Value as JsonValue;
use sqlx::{FromRow, PgPool};
use uuid::Uuid;

use crate::domain::entities::{ActivityAction, ActivityLog, EntityType};
use crate::domain::repositories::ActivityLogRepository;
use crate::shared::DomainError;

#[derive(Debug, FromRow)]
struct ActivityLogRow {
    id: Uuid,
    user_id: Option<Uuid>,
    user_name: Option<String>,
    project_id: Option<Uuid>,
    project_name: Option<String>,
    action: String,
    entity_type: String,
    entity_id: Uuid,
    entity_name: Option<String>,
    details: Option<JsonValue>,
    created_at: DateTime<Utc>,
}

impl From<ActivityLogRow> for ActivityLog {
    fn from(row: ActivityLogRow) -> Self {
        ActivityLog {
            id: row.id,
            user_id: row.user_id,
            user_name: row.user_name,
            project_id: row.project_id,
            project_name: row.project_name,
            action: ActivityAction::from(row.action),
            entity_type: EntityType::from(row.entity_type),
            entity_id: row.entity_id,
            entity_name: row.entity_name,
            details: row.details,
            created_at: row.created_at,
        }
    }
}

pub struct PgActivityLogRepository {
    pool: PgPool,
}

impl PgActivityLogRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl ActivityLogRepository for PgActivityLogRepository {
    async fn find_all(&self, limit: Option<i64>) -> Result<Vec<ActivityLog>, DomainError> {
        let limit = limit.unwrap_or(50);

        let rows = sqlx::query_as::<_, ActivityLogRow>(
            r#"
            SELECT
                al.id,
                al.user_id,
                u.name as user_name,
                al.project_id,
                p.name as project_name,
                al.action,
                al.entity_type,
                al.entity_id,
                COALESCE(
                    CASE al.entity_type
                        WHEN 'project' THEN (SELECT name FROM projects WHERE id = al.entity_id)
                        WHEN 'task' THEN (SELECT title FROM tasks WHERE id = al.entity_id)
                        WHEN 'team' THEN (SELECT name FROM teams WHERE id = al.entity_id)
                        WHEN 'milestone' THEN (SELECT name FROM milestones WHERE id = al.entity_id)
                        ELSE NULL
                    END,
                    'Unknown'
                ) as entity_name,
                al.details,
                al.created_at
            FROM activity_logs al
            LEFT JOIN users u ON al.user_id = u.id
            LEFT JOIN projects p ON al.project_id = p.id
            ORDER BY al.created_at DESC
            LIMIT $1
            "#,
        )
        .bind(limit)
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(Into::into).collect())
    }

    async fn find_by_project(&self, project_id: Uuid, limit: Option<i64>) -> Result<Vec<ActivityLog>, DomainError> {
        let limit = limit.unwrap_or(50);

        let rows = sqlx::query_as::<_, ActivityLogRow>(
            r#"
            SELECT
                al.id,
                al.user_id,
                u.name as user_name,
                al.project_id,
                p.name as project_name,
                al.action,
                al.entity_type,
                al.entity_id,
                COALESCE(
                    CASE al.entity_type
                        WHEN 'project' THEN (SELECT name FROM projects WHERE id = al.entity_id)
                        WHEN 'task' THEN (SELECT title FROM tasks WHERE id = al.entity_id)
                        WHEN 'team' THEN (SELECT name FROM teams WHERE id = al.entity_id)
                        WHEN 'milestone' THEN (SELECT name FROM milestones WHERE id = al.entity_id)
                        ELSE NULL
                    END,
                    'Unknown'
                ) as entity_name,
                al.details,
                al.created_at
            FROM activity_logs al
            LEFT JOIN users u ON al.user_id = u.id
            LEFT JOIN projects p ON al.project_id = p.id
            WHERE al.project_id = $1
            ORDER BY al.created_at DESC
            LIMIT $2
            "#,
        )
        .bind(project_id)
        .bind(limit)
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(Into::into).collect())
    }

    async fn find_by_user(&self, user_id: Uuid, limit: Option<i64>) -> Result<Vec<ActivityLog>, DomainError> {
        let limit = limit.unwrap_or(50);

        let rows = sqlx::query_as::<_, ActivityLogRow>(
            r#"
            SELECT
                al.id,
                al.user_id,
                u.name as user_name,
                al.project_id,
                p.name as project_name,
                al.action,
                al.entity_type,
                al.entity_id,
                COALESCE(
                    CASE al.entity_type
                        WHEN 'project' THEN (SELECT name FROM projects WHERE id = al.entity_id)
                        WHEN 'task' THEN (SELECT title FROM tasks WHERE id = al.entity_id)
                        WHEN 'team' THEN (SELECT name FROM teams WHERE id = al.entity_id)
                        WHEN 'milestone' THEN (SELECT name FROM milestones WHERE id = al.entity_id)
                        ELSE NULL
                    END,
                    'Unknown'
                ) as entity_name,
                al.details,
                al.created_at
            FROM activity_logs al
            LEFT JOIN users u ON al.user_id = u.id
            LEFT JOIN projects p ON al.project_id = p.id
            WHERE al.user_id = $1
            ORDER BY al.created_at DESC
            LIMIT $2
            "#,
        )
        .bind(user_id)
        .bind(limit)
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(Into::into).collect())
    }

    async fn create(&self, activity: &ActivityLog) -> Result<ActivityLog, DomainError> {
        sqlx::query(
            r#"
            INSERT INTO activity_logs (id, user_id, project_id, action, entity_type, entity_id, details, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            "#,
        )
        .bind(activity.id)
        .bind(activity.user_id)
        .bind(activity.project_id)
        .bind(activity.action.to_string())
        .bind(activity.entity_type.to_string())
        .bind(activity.entity_id)
        .bind(&activity.details)
        .bind(activity.created_at)
        .execute(&self.pool)
        .await?;

        // Fetch the created activity with joined data
        let rows = sqlx::query_as::<_, ActivityLogRow>(
            r#"
            SELECT
                al.id,
                al.user_id,
                u.name as user_name,
                al.project_id,
                p.name as project_name,
                al.action,
                al.entity_type,
                al.entity_id,
                COALESCE(
                    CASE al.entity_type
                        WHEN 'project' THEN (SELECT name FROM projects WHERE id = al.entity_id)
                        WHEN 'task' THEN (SELECT title FROM tasks WHERE id = al.entity_id)
                        WHEN 'team' THEN (SELECT name FROM teams WHERE id = al.entity_id)
                        WHEN 'milestone' THEN (SELECT name FROM milestones WHERE id = al.entity_id)
                        ELSE NULL
                    END,
                    'Unknown'
                ) as entity_name,
                al.details,
                al.created_at
            FROM activity_logs al
            LEFT JOIN users u ON al.user_id = u.id
            LEFT JOIN projects p ON al.project_id = p.id
            WHERE al.id = $1
            "#,
        )
        .bind(activity.id)
        .fetch_one(&self.pool)
        .await?;

        Ok(rows.into())
    }
}
