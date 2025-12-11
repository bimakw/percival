use async_trait::async_trait;
use uuid::Uuid;

use crate::domain::entities::Task;
use crate::domain::value_objects::TaskStatus;
use crate::shared::DomainError;

#[async_trait]
pub trait TaskRepository: Send + Sync {
    async fn find_by_id(&self, id: Uuid) -> Result<Option<Task>, DomainError>;
    async fn find_all(&self) -> Result<Vec<Task>, DomainError>;
    async fn find_by_project(&self, project_id: Uuid) -> Result<Vec<Task>, DomainError>;
    async fn find_by_assignee(&self, user_id: Uuid) -> Result<Vec<Task>, DomainError>;
    async fn find_by_status(&self, status: TaskStatus) -> Result<Vec<Task>, DomainError>;
    async fn create(&self, task: &Task) -> Result<Task, DomainError>;
    async fn update(&self, task: &Task) -> Result<Task, DomainError>;
    async fn delete(&self, id: Uuid) -> Result<(), DomainError>;
}
