use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::domain::value_objects::{Priority, ProjectStatus};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub status: ProjectStatus,
    pub priority: Priority,
    pub start_date: Option<DateTime<Utc>>,
    pub end_date: Option<DateTime<Utc>>,
    pub budget: Option<Decimal>,
    pub owner_id: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl Project {
    pub fn new(
        name: String,
        description: Option<String>,
        owner_id: Uuid,
        status: Option<ProjectStatus>,
        priority: Option<Priority>,
        start_date: Option<DateTime<Utc>>,
        end_date: Option<DateTime<Utc>>,
        budget: Option<Decimal>,
    ) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4(),
            name,
            description,
            status: status.unwrap_or(ProjectStatus::Planning),
            priority: priority.unwrap_or(Priority::Medium),
            start_date,
            end_date,
            budget,
            owner_id,
            created_at: now,
            updated_at: now,
        }
    }

    pub fn is_active(&self) -> bool {
        matches!(self.status, ProjectStatus::Active)
    }

    pub fn is_completed(&self) -> bool {
        matches!(self.status, ProjectStatus::Completed)
    }

    pub fn can_add_tasks(&self) -> bool {
        !matches!(self.status, ProjectStatus::Completed | ProjectStatus::Cancelled)
    }

    pub fn update_status(&mut self, status: ProjectStatus) {
        self.status = status;
        self.updated_at = Utc::now();
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectMember {
    pub id: Uuid,
    pub project_id: Uuid,
    pub user_id: Uuid,
    pub role: Option<String>,
    pub joined_at: DateTime<Utc>,
}

impl ProjectMember {
    pub fn new(project_id: Uuid, user_id: Uuid, role: Option<String>) -> Self {
        Self {
            id: Uuid::new_v4(),
            project_id,
            user_id,
            role,
            joined_at: Utc::now(),
        }
    }
}
