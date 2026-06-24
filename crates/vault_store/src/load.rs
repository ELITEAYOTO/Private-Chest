use std::fs;
use std::path::Path;

use vault_domain::VaultPayload;

use crate::VaultStoreError;

pub fn load_from_path(path: &Path, master_password: &[u8]) -> Result<VaultPayload, VaultStoreError> {
    let bytes = fs::read(path)?;
    let payload = vault_format::unseal_vault(bytes.as_slice(), master_password)?;
    Ok(payload)
}
