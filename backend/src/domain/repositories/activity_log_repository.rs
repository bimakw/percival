use async_trait::async_trait;
use uuid::Uuid;

use crate::domain::entities::ActivityLog;
use crate::shared::DomainError;

#[async_trait]
pub trait ActivityLogRepository: Send + Sync {
    async fn find_all(&self, limit: Option<i64>) -> Result<Vec<ActivityLog>, DomainError>;
    async fn find_by_project(&self, project_id: Uuid, limit: Option<i64>) -> Result<Vec<ActivityLog>, DomainError>;
    async fn find_by_user(&self, user_id: Uuid, limit: Option<i64>) -> Result<Vec<ActivityLog>, DomainError>;
    async fn create(&self, activity: &ActivityLog) -> Result<ActivityLog, DomainError>;
}
