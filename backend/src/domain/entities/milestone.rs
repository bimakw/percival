use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Milestone {
    pub id: Uuid,
    pub project_id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub due_date: Option<DateTime<Utc>>,
    pub completed: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl Milestone {
    pub fn new(
        project_id: Uuid,
        name: String,
        description: Option<String>,
        due_date: Option<DateTime<Utc>>,
    ) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4(),
            project_id,
            name,
            description,
            due_date,
            completed: false,
            created_at: now,
            updated_at: now,
        }
    }

    pub fn mark_completed(&mut self) {
        self.completed = true;
        self.updated_at = Utc::now();
    }

    pub fn is_overdue(&self) -> bool {
        if let Some(due_date) = self.due_date {
            !self.completed && Utc::now() > due_date
        } else {
            false
        }
    }
}
