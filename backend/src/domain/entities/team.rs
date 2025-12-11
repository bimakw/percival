use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::domain::value_objects::TeamMemberRole;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Team {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub lead_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl Team {
    pub fn new(name: String, description: Option<String>, lead_id: Option<Uuid>) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4(),
            name,
            description,
            lead_id,
            created_at: now,
            updated_at: now,
        }
    }

    pub fn set_lead(&mut self, lead_id: Option<Uuid>) {
        self.lead_id = lead_id;
        self.updated_at = Utc::now();
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TeamMember {
    pub id: Uuid,
    pub team_id: Uuid,
    pub user_id: Uuid,
    pub role: TeamMemberRole,
    pub joined_at: DateTime<Utc>,
}

impl TeamMember {
    pub fn new(team_id: Uuid, user_id: Uuid, role: Option<TeamMemberRole>) -> Self {
        Self {
            id: Uuid::new_v4(),
            team_id,
            user_id,
            role: role.unwrap_or(TeamMemberRole::Member),
            joined_at: Utc::now(),
        }
    }

    pub fn is_lead(&self) -> bool {
        matches!(self.role, TeamMemberRole::Lead)
    }

    pub fn promote_to_lead(&mut self) {
        self.role = TeamMemberRole::Lead;
    }
}
