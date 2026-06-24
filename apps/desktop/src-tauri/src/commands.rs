use std::path::PathBuf;
use std::sync::{Mutex, MutexGuard};
use std::time::Instant;

use desktop_backend::{
    CreateEntryInput, DesktopBackend, DocumentMeta, DocumentWithEntry, EntryDetails, EntrySummary,
    SystemClipboard, UpdateEntryInput, VaultStats,
};
use password_generator::PasswordOptions;
use secret_types::SecretString;
use serde::{Deserialize, Serialize};
use tauri::State;
use vault_domain::EntryKind;
use vault_store::VaultStore;

use crate::app_state::AppState;

pub struct CommandService {
    backend: Mutex<DesktopBackend<SystemClipboard>>,
    vault_path: PathBuf,
}

impl CommandService {
    pub fn new() -> Result<Self, String> {
        let store = VaultStore::from_default_path().ok_or("no default vault path".to_owned())?;
        let vault_path = store.path().to_path_buf();
        let clipboard = SystemClipboard::new().map_err(|_| "clipboard unavailable".to_owned())?;
        let backend = DesktopBackend::new(store, clipboard);

        Ok(Self {
            backend: Mutex::new(backend),
            vault_path,
        })
    }

    fn backend(&self) -> Result<MutexGuard<'_, DesktopBackend<SystemClipboard>>, String> {
        self.backend
            .lock()
            .map_err(|_| "backend lock poisoned".to_owned())
    }

    pub fn initialize_vault(&self, master_password: String) -> Result<(), String> {
        let secret = SecretString::from(master_password);
        let mut backend = self.backend()?;
        backend
            .initialize_empty_vault(&secret)
            .map_err(|e| e.to_string())?;
        backend
            .unlock(&secret, Instant::now())
            .map_err(|e| e.to_string())
    }

    pub fn vault_exists(&self) -> bool {
        self.vault_path.exists()
    }

    pub fn unlock_vault(&self, master_password: String) -> Result<(), String> {
        let secret = SecretString::from(master_password);
        let mut backend = self.backend()?;
        backend
            .unlock(&secret, Instant::now())
            .map_err(|e| e.to_string())
    }

    pub fn session_status(&self) -> Result<bool, String> {
        let backend = self.backend()?;
        Ok(backend.is_unlocked())
    }

    pub fn lock_vault(&self) -> Result<(), String> {
        let mut backend = self.backend()?;
        backend.lock().map_err(|_| "lock failed".to_owned())
    }

    pub fn list_entries(&self, query: Option<String>) -> Result<Vec<EntrySummary>, String> {
        let mut backend = self.backend()?;
        backend
            .list_entries(query.as_deref(), Instant::now())
            .map_err(|_| "list failed".to_owned())
    }

    pub fn get_entry_details(
        &self,
        entry_id: String,
        reveal_password: bool,
    ) -> Result<EntryDetails, String> {
        let mut backend = self.backend()?;
        backend
            .get_entry_details(entry_id.as_str(), reveal_password, Instant::now())
            .map_err(|_| "details failed".to_owned())
    }

    pub fn create_entry(&self, payload: CreateEntryPayload) -> Result<String, String> {
        let mut backend = self.backend()?;
        backend
            .create_entry(
                CreateEntryInput {
                    kind: payload.kind,
                    title: payload.title,
                    username: payload.username,
                    password: payload.password,
                    urls: if payload.url.trim().is_empty() {
                        Vec::new()
                    } else {
                        vec![payload.url]
                    },
                    notes: payload.notes,
                    category_id: payload.category_id,
                    tags: Vec::new(),
                    favorite: payload.favorite,
                    totp_secret: payload.totp_secret,
                },                Instant::now(),
            )
            .map_err(|e| e.to_string())
    }

    pub fn update_entry(&self, payload: UpdateEntryPayload) -> Result<(), String> {
        let mut backend = self.backend()?;
        backend
            .update_entry(
                payload.entry_id.as_str(),
                UpdateEntryInput {
                    title: payload.title,
                    username: payload.username,
                    password: payload.password,
                    urls: payload.url.map(|url| {
                        if url.trim().is_empty() {
                            Vec::new()
                        } else {
                            vec![url]
                        }
                    }),
                    notes: payload.notes,
                    category_id: payload.category_id,
                    favorite: payload.favorite,
                    totp_secret: payload.totp_secret,
                    ..UpdateEntryInput::default()
                },
                Instant::now(),
            )
            .map_err(|e| e.to_string())
    }

    pub fn delete_entry(&self, entry_id: String) -> Result<(), String> {
        let mut backend = self.backend()?;
        backend
            .delete_entry(entry_id.as_str(), Instant::now())
            .map_err(|_| "delete failed".to_owned())
    }

    pub fn import_entries(&self, entries: Vec<ImportEntryPayload>) -> Result<usize, String> {
        let mut backend = self.backend()?;
        let inputs: Vec<CreateEntryInput> = entries
            .into_iter()
            .map(|p| CreateEntryInput {
                kind: p.kind,
                title: p.title,
                username: p.username,
                password: p.password,
                urls: if p.url.trim().is_empty() { Vec::new() } else { vec![p.url] },
                notes: p.notes,
                category_id: p.category_id,
                tags: Vec::new(),
                favorite: false,
                totp_secret: p.totp_secret,
            })
            .collect();
        backend
            .import_entries(inputs, Instant::now())
            .map_err(|e| e.to_string())
    }

    // ── Documents chiffrés ────────────────────────────────────────────────────

    pub fn attach_file(
        &self,
        entry_id: String,
        filename: String,
        mime_type: String,
        data_b64: String,
    ) -> Result<String, String> {
        use base64::{Engine, engine::general_purpose::STANDARD};
        let data = STANDARD
            .decode(&data_b64)
            .map_err(|_| "base64 invalide".to_owned())?;
        let mut backend = self.backend()?;
        backend
            .attach_file(&entry_id, &filename, &mime_type, &data, Instant::now())
            .map_err(|e| e.to_string())
    }

    pub fn list_documents(&self, entry_id: String) -> Result<Vec<DocumentMeta>, String> {
        let mut backend = self.backend()?;
        backend
            .list_documents(&entry_id, Instant::now())
            .map_err(|e| e.to_string())
    }

    pub fn list_all_documents(&self) -> Result<Vec<DocumentWithEntry>, String> {
        let mut backend = self.backend()?;
        backend
            .list_all_documents(Instant::now())
            .map_err(|e| e.to_string())
    }

    pub fn download_document(&self, doc_id: String) -> Result<DocumentDownload, String> {
        use base64::{Engine, engine::general_purpose::STANDARD};
        let mut backend = self.backend()?;
        let (meta, bytes) = backend
            .get_document_bytes(&doc_id, Instant::now())
            .map_err(|e| e.to_string())?;
        Ok(DocumentDownload {
            filename: meta.filename,
            mime_type: meta.mime_type,
            data_b64: STANDARD.encode(&bytes),
        })
    }

    pub fn delete_document(&self, doc_id: String) -> Result<(), String> {
        let mut backend = self.backend()?;
        backend
            .delete_document(&doc_id, Instant::now())
            .map_err(|e| e.to_string())
    }

    pub fn generate_password(&self, opts: GeneratePasswordPayload) -> Result<String, String> {
        let options = PasswordOptions {
            length: opts.length.clamp(8, 128),
            lowercase: opts.lowercase,
            uppercase: opts.uppercase,
            digits: opts.digits,
            symbols: opts.symbols,
            exclude_ambiguous: opts.exclude_ambiguous,
        };
        let backend = self.backend()?;
        backend
            .generate_password(options)
            .map_err(|_| "generation failed".to_owned())
    }

    pub fn copy_password(&self, entry_id: String) -> Result<(), String> {
        let mut backend = self.backend()?;
        backend
            .copy_password(entry_id.as_str(), Instant::now())
            .map_err(|_| "copy failed".to_owned())
    }

    pub fn copy_username(&self, entry_id: String) -> Result<(), String> {
        let mut backend = self.backend()?;
        backend
            .copy_username(entry_id.as_str(), Instant::now())
            .map_err(|_| "copy failed".to_owned())
    }

    pub fn tick(&self) -> Result<TickResult, String> {
        let now = Instant::now();
        let mut backend = self.backend()?;
        let outcome = backend.tick(now).map_err(|_| "tick failed".to_owned())?;
        let seconds_until_lock = backend.seconds_until_lock(now);
        Ok(TickResult {
            did_lock: outcome.did_lock,
            did_clear_clipboard: outcome.did_clear_clipboard,
            seconds_until_lock,
        })
    }

    pub fn rotate_master_password(
        &self,
        old_password: String,
        new_password: String,
    ) -> Result<(), String> {
        let old = SecretString::from(old_password);
        let new = SecretString::from(new_password);
        let mut backend = self.backend()?;
        backend
            .rotate_master_password(&old, &new, Instant::now())
            .map_err(|e| e.to_string())
    }

    pub fn update_settings(
        &self,
        auto_lock_minutes: Option<u16>,
        clipboard_clear_seconds: Option<u16>,
    ) -> Result<(), String> {
        let mut backend = self.backend()?;
        backend
            .update_settings(auto_lock_minutes, clipboard_clear_seconds, Instant::now())
            .map_err(|_| "settings update failed".to_owned())
    }

    pub fn get_vault_stats(&self) -> Result<VaultStats, String> {
        let mut backend = self.backend()?;
        backend
            .get_vault_stats(Instant::now())
            .map_err(|_| "stats failed".to_owned())
    }

    pub fn set_hint(&self, hint: String) -> Result<(), String> {
        let backend = self.backend()?;
        backend.set_hint(hint).map_err(|_| "hint failed".to_owned())
    }

    pub fn get_hint(&self) -> Option<String> {
        self.backend().ok().and_then(|b| b.get_hint())
    }

    pub fn create_manual_backup(&self) -> Result<(), String> {
        let backend = self.backend()?;
        backend
            .create_manual_backup()
            .map_err(|_| "backup failed".to_owned())
    }

    pub fn list_cards(&self) -> Result<Vec<EntrySummary>, String> {
        let mut backend = self.backend()?;
        backend
            .list_cards(Instant::now())
            .map_err(|_| "list cards failed".to_owned())
    }

    pub fn list_trash(&self) -> Result<Vec<EntrySummary>, String> {
        let mut backend = self.backend()?;
        backend
            .list_trash(Instant::now())
            .map_err(|_| "list trash failed".to_owned())
    }

    pub fn restore_entry(&self, entry_id: String) -> Result<(), String> {
        let mut backend = self.backend()?;
        backend
            .restore_entry(entry_id.as_str(), Instant::now())
            .map_err(|_| "restore failed".to_owned())
    }

    pub fn permanent_delete_entry(&self, entry_id: String) -> Result<(), String> {
        let mut backend = self.backend()?;
        backend
            .permanent_delete_entry(entry_id.as_str(), Instant::now())
            .map_err(|_| "permanent delete failed".to_owned())
    }

    pub fn verify_master_password(&self, password: String) -> Result<bool, String> {
        let secret = SecretString::from(password);
        let backend = self.backend()?;
        backend
            .verify_master_password(&secret)
            .map_err(|_| "verify failed".to_owned())
    }
}

// ── Payload structs ──────────────────────────────────────────────────────────

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateEntryPayload {
    #[serde(default = "default_kind")]
    pub kind: EntryKind,
    pub title: String,
    pub username: String,
    pub password: String,
    pub url: String,
    pub notes: String,
    #[serde(alias = "category_id")]
    pub category_id: String,
    #[serde(default)]
    pub favorite: bool,
    #[serde(default)]
    pub totp_secret: Option<String>,
}

fn default_kind() -> EntryKind { EntryKind::Login }

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateEntryPayload {
    #[serde(alias = "entry_id")]
    pub entry_id: String,
    pub title: Option<String>,
    pub username: Option<String>,
    pub password: Option<String>,
    pub url: Option<String>,
    pub notes: Option<String>,
    #[serde(alias = "category_id")]
    pub category_id: Option<String>,
    pub favorite: Option<bool>,
    pub totp_secret: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GeneratePasswordPayload {
    #[serde(default = "default_length")]
    pub length: usize,
    #[serde(default = "default_true")]
    pub lowercase: bool,
    #[serde(default = "default_true")]
    pub uppercase: bool,
    #[serde(default = "default_true")]
    pub digits: bool,
    #[serde(default = "default_true")]
    pub symbols: bool,
    #[serde(default)]
    pub exclude_ambiguous: bool,
}

fn default_length() -> usize { 20 }
fn default_true() -> bool { true }

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportEntryPayload {
    #[serde(default = "default_kind")]
    pub kind: EntryKind,
    pub title: String,
    #[serde(default)]
    pub username: String,
    #[serde(default)]
    pub password: String,
    #[serde(default)]
    pub url: String,
    #[serde(default)]
    pub notes: String,
    #[serde(default = "default_category")]
    pub category_id: String,
    pub totp_secret: Option<String>,
}

fn default_category() -> String { "import".to_owned() }

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TickResult {
    pub did_lock: bool,
    pub did_clear_clipboard: bool,
    pub seconds_until_lock: Option<u64>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DocumentDownload {
    pub filename: String,
    pub mime_type: String,
    pub data_b64: String,
}

// ── Tauri command handlers ────────────────────────────────────────────────────

#[tauri::command(rename_all = "camelCase")]
pub fn vault_exists(state: State<'_, AppState>) -> bool {
    state.commands.vault_exists()
}

#[tauri::command(rename_all = "camelCase")]
pub fn initialize_vault(state: State<'_, AppState>, master_password: String) -> Result<(), String> {
    state.commands.initialize_vault(master_password)
}

#[tauri::command(rename_all = "camelCase")]
pub fn unlock_vault(state: State<'_, AppState>, master_password: String) -> Result<(), String> {
    state.commands.unlock_vault(master_password)
}

#[tauri::command(rename_all = "camelCase")]
pub fn session_status(state: State<'_, AppState>) -> Result<bool, String> {
    state.commands.session_status()
}

#[tauri::command(rename_all = "camelCase")]
pub fn lock_vault(state: State<'_, AppState>) -> Result<(), String> {
    state.commands.lock_vault()
}

#[tauri::command(rename_all = "camelCase")]
pub fn list_entries(
    state: State<'_, AppState>,
    query: Option<String>,
) -> Result<Vec<EntrySummary>, String> {
    state.commands.list_entries(query)
}

#[tauri::command(rename_all = "camelCase")]
pub fn get_entry_details(
    state: State<'_, AppState>,
    entry_id: String,
    reveal_password: bool,
) -> Result<EntryDetails, String> {
    state.commands.get_entry_details(entry_id, reveal_password)
}

#[tauri::command(rename_all = "camelCase")]
pub fn create_entry(
    state: State<'_, AppState>,
    payload: CreateEntryPayload,
) -> Result<String, String> {
    state.commands.create_entry(payload)
}

#[tauri::command(rename_all = "camelCase")]
pub fn update_entry(
    state: State<'_, AppState>,
    payload: UpdateEntryPayload,
) -> Result<(), String> {
    state.commands.update_entry(payload)
}

#[tauri::command(rename_all = "camelCase")]
pub fn delete_entry(state: State<'_, AppState>, entry_id: String) -> Result<(), String> {
    state.commands.delete_entry(entry_id)
}

#[tauri::command(rename_all = "camelCase")]
pub fn generate_password(
    state: State<'_, AppState>,
    opts: GeneratePasswordPayload,
) -> Result<String, String> {
    state.commands.generate_password(opts)
}

#[tauri::command(rename_all = "camelCase")]
pub fn copy_password(state: State<'_, AppState>, entry_id: String) -> Result<(), String> {
    state.commands.copy_password(entry_id)
}

#[tauri::command(rename_all = "camelCase")]
pub fn copy_username(state: State<'_, AppState>, entry_id: String) -> Result<(), String> {
    state.commands.copy_username(entry_id)
}

#[tauri::command(rename_all = "camelCase")]
pub fn tick(state: State<'_, AppState>) -> Result<TickResult, String> {
    state.commands.tick()
}

#[tauri::command(rename_all = "camelCase")]
pub fn rotate_master_password(
    state: State<'_, AppState>,
    old_password: String,
    new_password: String,
) -> Result<(), String> {
    state.commands.rotate_master_password(old_password, new_password)
}

#[tauri::command(rename_all = "camelCase")]
pub fn update_settings(
    state: State<'_, AppState>,
    auto_lock_minutes: Option<u16>,
    clipboard_clear_seconds: Option<u16>,
) -> Result<(), String> {
    state.commands.update_settings(auto_lock_minutes, clipboard_clear_seconds)
}

#[tauri::command(rename_all = "camelCase")]
pub fn get_vault_stats(state: State<'_, AppState>) -> Result<VaultStats, String> {
    state.commands.get_vault_stats()
}

#[tauri::command(rename_all = "camelCase")]
pub fn set_hint(state: State<'_, AppState>, hint: String) -> Result<(), String> {
    state.commands.set_hint(hint)
}

#[tauri::command(rename_all = "camelCase")]
pub fn get_hint(state: State<'_, AppState>) -> Option<String> {
    state.commands.get_hint()
}

#[tauri::command(rename_all = "camelCase")]
pub fn create_manual_backup(state: State<'_, AppState>) -> Result<(), String> {
    state.commands.create_manual_backup()
}

#[tauri::command(rename_all = "camelCase")]
pub fn list_cards(state: State<'_, AppState>) -> Result<Vec<EntrySummary>, String> {
    state.commands.list_cards()
}

#[tauri::command(rename_all = "camelCase")]
pub fn list_trash(state: State<'_, AppState>) -> Result<Vec<EntrySummary>, String> {
    state.commands.list_trash()
}

#[tauri::command(rename_all = "camelCase")]
pub fn restore_entry(state: State<'_, AppState>, entry_id: String) -> Result<(), String> {
    state.commands.restore_entry(entry_id)
}

#[tauri::command(rename_all = "camelCase")]
pub fn permanent_delete_entry(state: State<'_, AppState>, entry_id: String) -> Result<(), String> {
    state.commands.permanent_delete_entry(entry_id)
}

#[tauri::command(rename_all = "camelCase")]
pub fn verify_master_password(state: State<'_, AppState>, password: String) -> Result<bool, String> {
    state.commands.verify_master_password(password)
}

#[tauri::command(rename_all = "camelCase")]
pub fn import_entries(
    state: State<'_, AppState>,
    entries: Vec<ImportEntryPayload>,
) -> Result<usize, String> {
    state.commands.import_entries(entries)
}

#[tauri::command(rename_all = "camelCase")]
pub fn attach_file(
    state: State<'_, AppState>,
    entry_id: String,
    filename: String,
    mime_type: String,
    data_b64: String,
) -> Result<String, String> {
    state.commands.attach_file(entry_id, filename, mime_type, data_b64)
}

#[tauri::command(rename_all = "camelCase")]
pub fn list_documents(
    state: State<'_, AppState>,
    entry_id: String,
) -> Result<Vec<DocumentMeta>, String> {
    state.commands.list_documents(entry_id)
}

#[tauri::command(rename_all = "camelCase")]
pub fn list_all_documents(
    state: State<'_, AppState>,
) -> Result<Vec<DocumentWithEntry>, String> {
    state.commands.list_all_documents()
}

#[tauri::command(rename_all = "camelCase")]
pub fn download_document(
    state: State<'_, AppState>,
    doc_id: String,
) -> Result<DocumentDownload, String> {
    state.commands.download_document(doc_id)
}

#[tauri::command(rename_all = "camelCase")]
pub fn delete_document(state: State<'_, AppState>, doc_id: String) -> Result<(), String> {
    state.commands.delete_document(doc_id)
}
