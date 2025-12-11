use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::domain::value_objects::{Priority, TaskStatus};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: Uuid,
    pub project_id: Uuid,
    pub milestone_id: Option<Uuid>,
    pub title: String,
    pub description: Option<String>,
    pub status: TaskStatus,
    pub priority: Priority,
    pub assignee_id: Option<Uuid>,
    pub due_date: Option<DateTime<Utc>>,
    pub estimated_hours: Option<f32>,
    pub actual_hours: Option<f32>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl Task {
    pub fn new(
        project_id: Uuid,
        title: String,
        description: Option<String>,
        priority: Option<Priority>,
        assignee_id: Option<Uuid>,
        due_date: Option<DateTime<Utc>>,
        estimated_hours: Option<f32>,
    ) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4(),
            project_id,
            milestone_id: None,
            title,
            description,
            status: TaskStatus::Todo,
            priority: priority.unwrap_or(Priority::Medium),
            assignee_id,
            due_date,
            estimated_hours,
            actual_hours: None,
            created_at: now,
            updated_at: now,
        }
    }

    pub fn is_done(&self) -> bool {
        matches!(self.status, TaskStatus::Done)
    }

    pub fn is_blocked(&self) -> bool {
        matches!(self.status, TaskStatus::Blocked)
    }

    pub fn can_transition_to(&self, new_status: &TaskStatus) -> bool {
        use TaskStatus::*;
        match (&self.status, new_status) {
            (Todo, InProgress) => true,
            (InProgress, Review | Blocked | Todo) => true,
            (Review, Done | InProgress) => true,
            (Blocked, InProgress | Todo) => true,
            (Done, InProgress) => true, // Reopen
            _ => false,
        }
    }

    pub fn update_status(&mut self, status: TaskStatus) {
        self.status = status;
        self.updated_at = Utc::now();
    }

    pub fn assign_to(&mut self, user_id: Option<Uuid>) {
        self.assignee_id = user_id;
        self.updated_at = Utc::now();
    }

    pub fn log_hours(&mut self, hours: f32) {
        self.actual_hours = Some(self.actual_hours.unwrap_or(0.0) + hours);
        self.updated_at = Utc::now();
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskComment {
    pub id: Uuid,
    pub task_id: Uuid,
    pub user_id: Uuid,
    pub content: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl TaskComment {
    pub fn new(task_id: Uuid, user_id: Uuid, content: String) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4(),
            task_id,
            user_id,
            content,
            created_at: now,
            updated_at: now,
        }
    }
}
