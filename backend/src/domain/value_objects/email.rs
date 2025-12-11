use serde::{Deserialize, Serialize};
use std::fmt;

use crate::shared::error::DomainError;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(transparent)]
pub struct Email(String);

impl Email {
    pub fn new(email: impl Into<String>) -> Result<Self, DomainError> {
        let email = email.into();

        if email.is_empty() {
            return Err(DomainError::ValidationError("Email cannot be empty".into()));
        }

        if !email.contains('@') || !email.contains('.') {
            return Err(DomainError::ValidationError("Invalid email format".into()));
        }

        Ok(Self(email.to_lowercase()))
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl fmt::Display for Email {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl AsRef<str> for Email {
    fn as_ref(&self) -> &str {
        &self.0
    }
}
