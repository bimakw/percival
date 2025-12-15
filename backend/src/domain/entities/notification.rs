/*
 * Licensed under the MIT License
 * Copyright (c) 2024 bimakw
 */

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, sqlx::Type)]
#[sqlx(type_name = "notification_type", rename_all = "snake_case")]
pub enum NotificationType {
    TaskAssigned,
    TaskUpdated,
    TaskCompleted,
    TaskDueSoon,
    ProjectUpdated,
    CommentAdded,
    Mention,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Notification {
    pub id: Uuid,
    pub user_id: Uuid,
    #[serde(rename = "type")]
    pub notification_type: NotificationType,
    pub title: String,
    pub message: String,
    pub link: Option<String>,
    pub is_read: bool,
    pub created_at: DateTime<Utc>,
}

impl Notification {
    pub fn new(
        user_id: Uuid,
        notification_type: NotificationType,
        title: String,
        message: String,
        link: Option<String>,
    ) -> Self {
        Self {
            id: Uuid::new_v4(),
            user_id,
            notification_type,
            title,
            message,
            link,
            is_read: false,
            created_at: Utc::now(),
        }
    }

    pub fn mark_as_read(&mut self) {
        self.is_read = true;
    }
}
