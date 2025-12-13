use std::sync::Arc;
use uuid::Uuid;

use crate::domain::entities::ActivityLog;
use crate::domain::repositories::ActivityLogRepository;
use crate::shared::DomainError;

pub struct ActivityAppService {
    activity_repository: Arc<dyn ActivityLogRepository>,
}

impl ActivityAppService {
    pub fn new(activity_repository: Arc<dyn ActivityLogRepository>) -> Self {
        Self { activity_repository }
    }

    pub async fn list_activities(&self, limit: Option<i64>) -> Result<Vec<ActivityLog>, DomainError> {
        self.activity_repository.find_all(limit).await
    }

    pub async fn get_activities_by_project(
        &self,
        project_id: Uuid,
        limit: Option<i64>,
    ) -> Result<Vec<ActivityLog>, DomainError> {
        self.activity_repository.find_by_project(project_id, limit).await
    }

    pub async fn get_activities_by_user(
        &self,
        user_id: Uuid,
        limit: Option<i64>,
    ) -> Result<Vec<ActivityLog>, DomainError> {
        self.activity_repository.find_by_user(user_id, limit).await
    }

    pub async fn log_activity(&self, activity: ActivityLog) -> Result<ActivityLog, DomainError> {
        self.activity_repository.create(&activity).await
    }
}
