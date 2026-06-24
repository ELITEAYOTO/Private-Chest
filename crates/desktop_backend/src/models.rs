use serde::{Deserialize, Serialize};
use vault_domain::EntryKind;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateEntryInput {
    pub kind: EntryKind,
    pub title: String,
    pub username: String,
    pub password: String,
    pub urls: Vec<String>,
    pub notes: String,
    pub category_id: String,
    pub tags: Vec<String>,
    pub favorite: bool,
    pub totp_secret: Option<String>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct UpdateEntryInput {
    pub title: Option<String>,
    pub username: Option<String>,
    pub password: Option<String>,
    pub urls: Option<Vec<String>>,
    pub notes: Option<String>,
    pub category_id: Option<String>,
    pub tags: Option<Vec<String>>,
    pub favorite: Option<bool>,
    pub totp_secret: Option<String>,
}

#[derive(Debug, Clone, Eq, PartialEq, Serialize, Deserialize)]
pub struct EntrySummary {
    pub id: String,
    pub kind: EntryKind,
    pub title: String,
    pub username: String,
    pub category_id: String,
    pub last_used_at: Option<String>,
    pub favorite: bool,
    pub password_strength: PasswordStrength,
}

#[derive(Debug, Clone, Eq, PartialEq, Serialize, Deserialize)]
pub struct EntryDetails {
    pub id: String,
    pub kind: EntryKind,
    pub title: String,
    pub username: String,
    pub password: Option<String>,
    pub urls: Vec<String>,
    pub notes: String,
    pub category_id: String,
    pub tags: Vec<String>,
    pub created_at: String,
    pub updated_at: String,
    pub last_used_at: Option<String>,
    pub favorite: bool,
    pub password_strength: PasswordStrength,
    pub totp_secret: Option<String>,
}

#[derive(Debug, Clone, Eq, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum PasswordStrength {
    Unknown,
    Weak,
    Fair,
    Strong,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentMeta {
    pub id: String,
    pub entry_id: String,
    pub filename: String,
    pub mime_type: String,
    pub size: u64,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentWithEntry {
    pub id: String,
    pub entry_id: String,
    pub entry_title: String,
    pub filename: String,
    pub mime_type: String,
    pub size: u64,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VaultStats {
    pub total_entries: usize,
    pub favorites: usize,
    pub weak_passwords: usize,
    pub categories: usize,
    pub card_count: usize,
    pub trash_count: usize,
    pub auto_lock_minutes: u16,
    pub clipboard_clear_seconds: u16,
}
