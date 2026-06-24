use crate::{header::CURRENT_VERSION, VaultFormatError};

pub fn assert_supported_version(version: u8) -> Result<(), VaultFormatError> {
    if version != CURRENT_VERSION {
        return Err(VaultFormatError::UnsupportedVersion);
    }

    Ok(())
}
