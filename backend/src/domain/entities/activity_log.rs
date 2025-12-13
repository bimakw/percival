use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ActivityAction {
    Created,
    Updated,
    Deleted,
    StatusChanged,
    Assigned,
    Commented,
}

impl std::fmt::Display for ActivityAction {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ActivityAction::Created => write!(f, "created"),
            ActivityAction::Updated => write!(f, "updated"),
            ActivityAction::Deleted => write!(f, "deleted"),
            ActivityAction::StatusChanged => write!(f, "status_changed"),
            ActivityAction::Assigned => write!(f, "assigned"),
            ActivityAction::Commented => write!(f, "commented"),
        }
    }
}

impl From<String> for ActivityAction {
    fn from(s: String) -> Self {
        match s.as_str() {
            "created" => ActivityAction::Created,
            "updated" => ActivityAction::Updated,
            "deleted" => ActivityAction::Deleted,
            "status_changed" => ActivityAction::StatusChanged,
            "assigned" => ActivityAction::Assigned,
            "commented" => ActivityAction::Commented,
            _ => ActivityAction::Updated,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum EntityType {
    Project,
    Task,
    Team,
    Milestone,
    Comment,
}

impl std::fmt::Display for EntityType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            EntityType::Project => write!(f, "project"),
            EntityType::Task => write!(f, "task"),
            EntityType::Team => write!(f, "team"),
            EntityType::Milestone => write!(f, "milestone"),
            EntityType::Comment => write!(f, "comment"),
        }
    }
}

impl From<String> for EntityType {
    fn from(s: String) -> Self {
        match s.as_str() {
            "project" => EntityType::Project,
            "task" => EntityType::Task,
            "team" => EntityType::Team,
            "milestone" => EntityType::Milestone,
            "comment" => EntityType::Comment,
            _ => EntityType::Task,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivityLog {
    pub id: Uuid,
    pub user_id: Option<Uuid>,
    pub user_name: Option<String>,
    pub project_id: Option<Uuid>,
    pub project_name: Option<String>,
    pub action: ActivityAction,
    pub entity_type: EntityType,
    pub entity_id: Uuid,
    pub entity_name: Option<String>,
    pub details: Option<JsonValue>,
    pub created_at: DateTime<Utc>,
}

impl ActivityLog {
    pub fn new(
        user_id: Option<Uuid>,
        project_id: Option<Uuid>,
        action: ActivityAction,
        entity_type: EntityType,
        entity_id: Uuid,
        details: Option<JsonValue>,
    ) -> Self {
        Self {
            id: Uuid::new_v4(),
            user_id,
            user_name: None,
            project_id,
            project_name: None,
            action,
            entity_type,
            entity_id,
            entity_name: None,
            details,
            created_at: Utc::now(),
        }
    }
}
