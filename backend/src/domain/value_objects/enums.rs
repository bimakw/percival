use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, sqlx::Type)]
#[sqlx(type_name = "user_role", rename_all = "lowercase")]
pub enum UserRole {
    Admin,
    Manager,
    Member,
}

impl Default for UserRole {
    fn default() -> Self {
        Self::Member
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, sqlx::Type)]
#[sqlx(type_name = "project_status", rename_all = "lowercase")]
pub enum ProjectStatus {
    Planning,
    Active,
    #[serde(rename = "onhold")]
    #[sqlx(rename = "onhold")]
    OnHold,
    Completed,
    Cancelled,
}

impl Default for ProjectStatus {
    fn default() -> Self {
        Self::Planning
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, sqlx::Type)]
#[sqlx(type_name = "priority", rename_all = "lowercase")]
pub enum Priority {
    Low,
    Medium,
    High,
    Critical,
}

impl Default for Priority {
    fn default() -> Self {
        Self::Medium
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, sqlx::Type)]
#[sqlx(type_name = "task_status", rename_all = "lowercase")]
pub enum TaskStatus {
    Todo,
    #[serde(rename = "inprogress")]
    #[sqlx(rename = "inprogress")]
    InProgress,
    Review,
    Done,
    Blocked,
}

impl Default for TaskStatus {
    fn default() -> Self {
        Self::Todo
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, sqlx::Type)]
#[sqlx(type_name = "team_member_role", rename_all = "lowercase")]
pub enum TeamMemberRole {
    Lead,
    Member,
}

impl Default for TeamMemberRole {
    fn default() -> Self {
        Self::Member
    }
}
