use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, Eq, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum EntryKind {
    Login,
    SecureNote,
    CreditCard,
}

#[derive(Debug, Clone, Serialize, Deserialize, Eq, PartialEq)]
pub struct VaultEntry {
    pub id: String,
    pub kind: EntryKind,
    pub title: String,
    pub username: String,
    pub password: String,
    pub urls: Vec<String>,
    pub notes: String,
    pub category_id: String,
    pub tags: Vec<String>,
    pub created_at: String,
    pub updated_at: String,
    pub last_used_at: Option<String>,
    pub favorite: bool,
    #[serde(default)]
    pub deleted: bool,
    #[serde(default)]
    pub totp_secret: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Eq, PartialEq)]
pub struct Category {
    pub id: String,
    pub label: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Eq, PartialEq)]
pub struct VaultSettings {
    pub auto_lock_minutes: u16,
    pub clipboard_clear_seconds: u16,
}

impl Default for VaultSettings {
    fn default() -> Self {
        Self {
            auto_lock_minutes: 5,
            clipboard_clear_seconds: 20,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Eq, PartialEq)]
pub struct VaultDocument {
    pub id: String,
    pub entry_id: String,
    pub filename: String,
    pub mime_type: String,
    pub size: u64,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Eq, PartialEq)]
pub struct VaultPayload {
    pub vault_uuid: String,
    pub version: u16,
    pub created_at: String,
    pub updated_at: String,
    pub entries: Vec<VaultEntry>,
    pub categories: Vec<Category>,
    pub settings: VaultSettings,
    #[serde(default)]
    pub documents: Vec<VaultDocument>,
    #[serde(default)]
    pub file_root_salt: Vec<u8>,
}

#[cfg(test)]
mod tests {
    use super::VaultSettings;

    #[test]
    fn secure_defaults() {
        let settings = VaultSettings::default();
        assert_eq!(settings.auto_lock_minutes, 5);
        assert_eq!(settings.clipboard_clear_seconds, 20);
    }
}
