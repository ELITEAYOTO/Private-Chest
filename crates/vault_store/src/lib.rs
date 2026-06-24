mod atomic_write;
mod backup;
mod hint;
mod load;
mod paths;
mod save;

use std::path::{Path, PathBuf};

use crypto_core::KdfParams;
use thiserror::Error;
use vault_domain::VaultPayload;
use vault_format::VaultFormatError;

pub use backup::create_backup;
pub use paths::{default_app_data_dir, default_backup_dir, default_vault_path};

#[derive(Debug, Error)]
pub enum VaultStoreError {
    #[error("io failure")]
    Io,
    #[error("vault format failure")]
    Format,
}

impl From<std::io::Error> for VaultStoreError {
    fn from(_: std::io::Error) -> Self {
        Self::Io
    }
}

impl From<VaultFormatError> for VaultStoreError {
    fn from(_: VaultFormatError) -> Self {
        Self::Format
    }
}

#[derive(Debug, Clone)]
pub struct VaultStore {
    path: PathBuf,
}

impl VaultStore {
    pub fn new(path: impl Into<PathBuf>) -> Self {
        Self { path: path.into() }
    }

    pub fn from_default_path() -> Option<Self> {
        Some(Self::new(default_vault_path()?))
    }

    pub fn path(&self) -> &Path {
        self.path.as_path()
    }

    pub fn load(&self, master_password: &[u8]) -> Result<VaultPayload, VaultStoreError> {
        load::load_from_path(self.path(), master_password)
    }

    pub fn save(
        &self,
        payload: &VaultPayload,
        master_password: &[u8],
        kdf_params: KdfParams,
    ) -> Result<(), VaultStoreError> {
        // Sauvegarde automatique avant tout écrasement du coffre existant
        if self.path.exists() {
            if let Some(backup_dir) = default_backup_dir() {
                let _ = backup::create_backup_with_rotation(&self.path, &backup_dir, 10);
            }
        }
        save::save_to_path(self.path(), payload, master_password, kdf_params)
    }

    pub fn backup(&self, backup_dir: &Path) -> Result<PathBuf, VaultStoreError> {
        backup::create_backup(self.path(), backup_dir)
    }

    pub fn set_hint(&self, hint_text: &str) -> Result<(), VaultStoreError> {
        hint::save_hint(self.path(), hint_text).map_err(|_| VaultStoreError::Io)
    }

    pub fn get_hint(&self) -> Option<String> {
        hint::load_hint(self.path())
    }
}

#[cfg(test)]
mod tests {
    use crypto_core::KdfParams;
    use tempfile::TempDir;
    use vault_domain::{Category, EntryKind, VaultEntry, VaultPayload, VaultSettings};

    use crate::VaultStore;

    fn sample_payload() -> VaultPayload {
        VaultPayload {
            vault_uuid: "vault-1".to_string(),
            version: 1,
            created_at: "2026-03-06T10:00:00Z".to_string(),
            updated_at: "2026-03-06T10:00:00Z".to_string(),
            entries: vec![VaultEntry {
                id: "entry-1".to_string(),
                kind: EntryKind::Login,
                title: "GitHub".to_string(),
                username: "alice".to_string(),
                password: "super-secret".to_string(),
                urls: vec!["https://github.com".to_string()],
                notes: String::new(),
                category_id: "work".to_string(),
                tags: vec![],
                created_at: "2026-03-06T10:00:00Z".to_string(),
                updated_at: "2026-03-06T10:00:00Z".to_string(),
                last_used_at: None,
                favorite: false,
                deleted: false,
                totp_secret: None,
            }],
            categories: vec![Category {
                id: "work".to_string(),
                label: "Work".to_string(),
            }],
            settings: VaultSettings::default(),
            documents: Vec::new(),
            file_root_salt: Vec::new(),
        }
    }

    #[test]
    fn store_roundtrip() {
        let tmp = TempDir::new().unwrap();
        let path = tmp.path().join("vault.bin");
        let store = VaultStore::new(path);

        let payload = sample_payload();
        let password = b"correct horse battery staple";

        store
            .save(&payload, password, KdfParams::secure_default())
            .unwrap();
        let loaded = store.load(password).unwrap();

        assert_eq!(payload, loaded);
    }
}
