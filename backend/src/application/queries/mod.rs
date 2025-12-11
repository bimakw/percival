use serde::Deserialize;
use uuid::Uuid;

use crate::domain::value_objects::TaskStatus;

#[derive(Debug, Deserialize, Default)]
pub struct PaginationQuery {
    pub page: Option<u32>,
    pub per_page: Option<u32>,
}

impl PaginationQuery {
    pub fn offset(&self) -> u32 {
        let page = self.page.unwrap_or(1).max(1);
        let per_page = self.per_page();
        (page - 1) * per_page
    }

    pub fn per_page(&self) -> u32 {
        self.per_page.unwrap_or(20).min(100)
    }
}

#[derive(Debug, Deserialize, Default)]
pub struct ProjectQuery {
    pub owner_id: Option<Uuid>,
    #[serde(flatten)]
    pub pagination: PaginationQuery,
}

#[derive(Debug, Deserialize, Default)]
pub struct TaskQuery {
    pub project_id: Option<Uuid>,
    pub assignee_id: Option<Uuid>,
    pub status: Option<TaskStatus>,
    #[serde(flatten)]
    pub pagination: PaginationQuery,
}
