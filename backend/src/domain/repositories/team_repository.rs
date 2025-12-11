use async_trait::async_trait;
use uuid::Uuid;

use crate::domain::entities::{Team, TeamMember};
use crate::shared::DomainError;

#[async_trait]
pub trait TeamRepository: Send + Sync {
    async fn find_by_id(&self, id: Uuid) -> Result<Option<Team>, DomainError>;
    async fn find_all(&self) -> Result<Vec<Team>, DomainError>;
    async fn create(&self, team: &Team) -> Result<Team, DomainError>;
    async fn update(&self, team: &Team) -> Result<Team, DomainError>;
    async fn delete(&self, id: Uuid) -> Result<(), DomainError>;
    async fn find_members(&self, team_id: Uuid) -> Result<Vec<TeamMember>, DomainError>;
    async fn add_member(&self, member: &TeamMember) -> Result<TeamMember, DomainError>;
    async fn remove_member(&self, team_id: Uuid, user_id: Uuid) -> Result<(), DomainError>;
}
