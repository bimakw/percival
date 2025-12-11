use crate::shared::error::DomainError;

pub struct PasswordValidator;

impl PasswordValidator {
    const MIN_LENGTH: usize = 8;
    const MAX_LENGTH: usize = 128;

    pub fn validate(password: &str) -> Result<(), DomainError> {
        if password.len() < Self::MIN_LENGTH {
            return Err(DomainError::ValidationError(format!(
                "Password must be at least {} characters long",
                Self::MIN_LENGTH
            )));
        }

        if password.len() > Self::MAX_LENGTH {
            return Err(DomainError::ValidationError(format!(
                "Password must not exceed {} characters",
                Self::MAX_LENGTH
            )));
        }

        let has_uppercase = password.chars().any(|c| c.is_uppercase());
        let has_lowercase = password.chars().any(|c| c.is_lowercase());
        let has_digit = password.chars().any(|c| c.is_ascii_digit());
        let has_special = password.chars().any(|c| !c.is_alphanumeric());

        if !has_uppercase {
            return Err(DomainError::ValidationError(
                "Password must contain at least one uppercase letter".into(),
            ));
        }

        if !has_lowercase {
            return Err(DomainError::ValidationError(
                "Password must contain at least one lowercase letter".into(),
            ));
        }

        if !has_digit {
            return Err(DomainError::ValidationError(
                "Password must contain at least one digit".into(),
            ));
        }

        if !has_special {
            return Err(DomainError::ValidationError(
                "Password must contain at least one special character".into(),
            ));
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_valid_password() {
        assert!(PasswordValidator::validate("Password1!").is_ok());
        assert!(PasswordValidator::validate("MyStr0ng@Pass").is_ok());
    }

    #[test]
    fn test_too_short() {
        assert!(PasswordValidator::validate("Pass1!").is_err());
    }

    #[test]
    fn test_no_uppercase() {
        assert!(PasswordValidator::validate("password1!").is_err());
    }

    #[test]
    fn test_no_lowercase() {
        assert!(PasswordValidator::validate("PASSWORD1!").is_err());
    }

    #[test]
    fn test_no_digit() {
        assert!(PasswordValidator::validate("Password!").is_err());
    }

    #[test]
    fn test_no_special() {
        assert!(PasswordValidator::validate("Password1").is_err());
    }
}
