use core::fmt;
use zeroize::Zeroizing;

#[derive(Clone, Eq, PartialEq)]
pub struct SecretBytes {
    inner: Zeroizing<Vec<u8>>,
}

impl SecretBytes {
    pub fn new(bytes: Vec<u8>) -> Self {
        Self {
            inner: Zeroizing::new(bytes),
        }
    }

    pub fn from_slice(bytes: &[u8]) -> Self {
        Self::new(bytes.to_vec())
    }

    pub fn expose(&self) -> &[u8] {
        self.inner.as_slice()
    }

    pub fn len(&self) -> usize {
        self.inner.len()
    }

    pub fn is_empty(&self) -> bool {
        self.inner.is_empty()
    }
}

impl fmt::Debug for SecretBytes {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str("SecretBytes([REDACTED])")
    }
}

impl From<Vec<u8>> for SecretBytes {
    fn from(value: Vec<u8>) -> Self {
        Self::new(value)
    }
}

impl From<&[u8]> for SecretBytes {
    fn from(value: &[u8]) -> Self {
        Self::from_slice(value)
    }
}

#[cfg(test)]
mod tests {
    use super::SecretBytes;

    #[test]
    fn debug_is_redacted() {
        let secret = SecretBytes::from_slice(b"top-secret");
        assert_eq!(format!("{secret:?}"), "SecretBytes([REDACTED])");
    }
}
