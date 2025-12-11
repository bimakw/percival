use async_trait::async_trait;
use uuid::Uuid;

use crate::domain::entities::{Milestone, Project, Task};
use crate::shared::DomainError;

#[async_trait]
pub trait ProjectRepository: Send + Sync {
    async fn find_by_id(&self, id: Uuid) -> Result<Option<Project>, DomainError>;
    async fn find_all(&self) -> Result<Vec<Project>, DomainError>;
    async fn find_by_owner(&self, owner_id: Uuid) -> Result<Vec<Project>, DomainError>;
    async fn create(&self, project: &Project) -> Result<Project, DomainError>;
    async fn update(&self, project: &Project) -> Result<Project, DomainError>;
    async fn delete(&self, id: Uuid) -> Result<(), DomainError>;
    async fn find_tasks(&self, project_id: Uuid) -> Result<Vec<Task>, DomainError>;
    async fn find_milestones(&self, project_id: Uuid) -> Result<Vec<Milestone>, DomainError>;
}
