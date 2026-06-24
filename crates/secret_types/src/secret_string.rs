use core::fmt;

use crate::SecretBytes;

#[derive(Clone, Eq, PartialEq)]
pub struct SecretString {
    inner: SecretBytes,
}

impl SecretString {
    pub fn new(value: String) -> Self {
        Self {
            inner: SecretBytes::from(value.into_bytes()),
        }
    }

    pub fn from_str(value: &str) -> Self {
        Self::new(value.to_owned())
    }

    pub fn as_bytes(&self) -> &[u8] {
        self.inner.expose()
    }

    pub fn as_str(&self) -> Result<&str, core::str::Utf8Error> {
        core::str::from_utf8(self.as_bytes())
    }

    pub fn is_empty(&self) -> bool {
        self.inner.is_empty()
    }
}

impl fmt::Debug for SecretString {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str("SecretString([REDACTED])")
    }
}

impl From<&str> for SecretString {
    fn from(value: &str) -> Self {
        Self::from_str(value)
    }
}

impl From<String> for SecretString {
    fn from(value: String) -> Self {
        Self::new(value)
    }
}

#[cfg(test)]
mod tests {
    use super::SecretString;

    #[test]
    fn debug_is_redacted() {
        let secret = SecretString::from_str("master-password");
        assert_eq!(format!("{secret:?}"), "SecretString([REDACTED])");
    }
}
