use std::path::Path;
use std::time::{Duration, Instant};

use chrono::Utc;
use crypto_core::KdfParams;
use native_protocol::{
    entry_matches_origin, is_origin_allowed, NativeEntrySummary, NativeErrorCode, NativeRequest,
    NativeResponse,
};
use password_generator::{generate_password, PasswordOptions};
use rand::rngs::OsRng;
use rand::RngCore;
use secret_types::SecretString;
use session_manager::SessionManager;
use uuid::Uuid;
use vault_domain::{EntryKind, VaultDocument, VaultEntry, VaultPayload, VaultSettings};
use vault_store::VaultStore;

use crate::clipboard::ClipboardSink;
use crate::models::{CreateEntryInput, DocumentMeta, DocumentWithEntry, EntryDetails, EntrySummary, PasswordStrength, UpdateEntryInput, VaultStats};
use crate::throttle::UnlockThrottle;
use crate::BackendError;

const CHALLENGE_TTL_SECONDS: u16 = 30;
const FILE_SIZE_LIMIT: u64 = 50 * 1024 * 1024; // 50 MB

#[derive(Debug, Clone, Copy, Eq, PartialEq)]
pub struct TickOutcome {
    pub did_lock: bool,
    pub did_clear_clipboard: bool,
}

#[derive(Debug, Clone)]
struct PendingChallenge {
    token: String,
    expires_at: Instant,
}

#[derive(Debug)]
pub struct DesktopBackend<C: ClipboardSink> {
    store: VaultStore,
    clipboard: C,
    session: SessionManager,
    unlock_throttle: UnlockThrottle,
    kdf_params: KdfParams,
    current_payload: Option<VaultPayload>,
    session_master_password: Option<SecretString>,
    pending_challenge: Option<PendingChallenge>,
}

impl<C: ClipboardSink> DesktopBackend<C> {
    pub fn new(store: VaultStore, clipboard: C) -> Self {
        Self {
            store,
            clipboard,
            session: SessionManager::with_secure_defaults(),
            unlock_throttle: UnlockThrottle::default(),
            kdf_params: KdfParams::secure_default(),
            current_payload: None,
            session_master_password: None,
            pending_challenge: None,
        }
    }

    pub fn with_kdf_params(mut self, kdf_params: KdfParams) -> Self {
        self.kdf_params = kdf_params;
        self
    }

    pub fn initialize_empty_vault(&mut self, master_password: &SecretString) -> Result<(), BackendError> {
        if master_password.is_empty() {
            return Err(BackendError::InvalidInput);
        }

        let now = now_iso();
        let mut file_root_salt = vec![0u8; 16];
        OsRng.fill_bytes(&mut file_root_salt);
        let payload = VaultPayload {
            vault_uuid: Uuid::new_v4().to_string(),
            version: 1,
            created_at: now.clone(),
            updated_at: now,
            entries: Vec::new(),
            categories: Vec::new(),
            settings: VaultSettings::default(),
            documents: Vec::new(),
            file_root_salt,
        };

        self.store
            .save(&payload, master_password.as_bytes(), self.kdf_params)
            .map_err(|_| BackendError::Storage)
    }

    pub fn unlock(&mut self, master_password: &SecretString, now: Instant) -> Result<(), BackendError> {
        if let Some(remaining) = self.unlock_throttle.remaining_block_duration(now) {
            return Err(BackendError::UnlockThrottled(remaining.as_secs()));
        }

        let mut payload = match self.store.load(master_password.as_bytes()) {
            Ok(payload) => payload,
            Err(_) => {
                self.unlock_throttle.register_failure(now);
                return Err(BackendError::AuthenticationFailed);
            }
        };

        self.unlock_throttle.reset();

        // Migration : coffres créés avant le support des documents n'ont pas de sel fichier
        let needs_salt_migration = payload.file_root_salt.is_empty();
        if needs_salt_migration {
            let mut salt = vec![0u8; 16];
            OsRng.fill_bytes(&mut salt);
            payload.file_root_salt = salt;
        }

        self.session = SessionManager::new(
            Duration::from_secs(payload.settings.auto_lock_minutes as u64 * 60),
            Duration::from_secs(payload.settings.clipboard_clear_seconds as u64),
        );
        self.session.unlock(now);
        self.current_payload = Some(payload);
        self.session_master_password = Some(master_password.clone());
        self.pending_challenge = None;

        if needs_salt_migration {
            self.persist_unlocked()?;
        }

        Ok(())
    }

    pub fn lock(&mut self) -> Result<(), BackendError> {
        let clear_result = self.clipboard.clear();

        self.session.lock();
        self.current_payload = None;
        self.session_master_password = None;
        self.pending_challenge = None;

        clear_result.map_err(|_| BackendError::Clipboard)
    }

    pub fn panic_lock(&mut self) -> Result<(), BackendError> {
        self.lock()
    }

    pub fn is_unlocked(&self) -> bool {
        self.session.is_unlocked() && self.current_payload.is_some()
    }

    pub fn list_entries(
        &mut self,
        query: Option<&str>,
        now: Instant,
    ) -> Result<Vec<EntrySummary>, BackendError> {
        self.ensure_unlocked()?;
        self.session.touch_activity(now);

        let query_normalized = query.map(|v| v.trim().to_lowercase()).filter(|q| !q.is_empty());

        let payload = self.current_payload.as_ref().ok_or(BackendError::Locked)?;
        let mut out: Vec<EntrySummary> = payload
            .entries
            .iter()
            .filter(|entry| !entry.deleted && entry.kind != EntryKind::CreditCard)
            .filter(|entry| match &query_normalized {
                Some(q) => entry_matches_query(entry, q),
                None => true,
            })
            .map(|entry| EntrySummary {
                id: entry.id.clone(),
                kind: entry.kind.clone(),
                title: entry.title.clone(),
                username: entry.username.clone(),
                category_id: entry.category_id.clone(),
                last_used_at: entry.last_used_at.clone(),
                favorite: entry.favorite,
                password_strength: classify_strength(&entry.password),
            })
            .collect();

        out.sort_by(|a, b| a.title.to_lowercase().cmp(&b.title.to_lowercase()));
        Ok(out)
    }

    pub fn get_entry_details(
        &mut self,
        entry_id: &str,
        reveal_password: bool,
        now: Instant,
    ) -> Result<EntryDetails, BackendError> {
        self.ensure_unlocked()?;
        self.session.touch_activity(now);

        let payload = self.current_payload.as_ref().ok_or(BackendError::Locked)?;
        let entry = payload
            .entries
            .iter()
            .find(|entry| entry.id == entry_id)
            .ok_or(BackendError::EntryNotFound)?;

        Ok(EntryDetails {
            id: entry.id.clone(),
            kind: entry.kind.clone(),
            title: entry.title.clone(),
            username: entry.username.clone(),
            password: if reveal_password {
                Some(entry.password.clone())
            } else {
                None
            },
            urls: entry.urls.clone(),
            notes: entry.notes.clone(),
            category_id: entry.category_id.clone(),
            tags: entry.tags.clone(),
            created_at: entry.created_at.clone(),
            updated_at: entry.updated_at.clone(),
            last_used_at: entry.last_used_at.clone(),
            favorite: entry.favorite,
            password_strength: classify_strength(&entry.password),
            totp_secret: entry.totp_secret.clone(),
        })
    }

    pub fn create_entry(
        &mut self,
        input: CreateEntryInput,
        now: Instant,
    ) -> Result<String, BackendError> {
        self.ensure_unlocked()?;
        self.validate_create_input(&input)?;
        self.session.touch_activity(now);

        let timestamp = now_iso();
        let entry_id = Uuid::new_v4().to_string();

        {
            let payload = self.current_payload.as_mut().ok_or(BackendError::Locked)?;
            payload.entries.push(VaultEntry {
                id: entry_id.clone(),
                kind: input.kind,
                title: input.title,
                username: input.username,
                password: input.password,
                urls: input.urls,
                notes: input.notes,
                category_id: input.category_id,
                tags: input.tags,
                created_at: timestamp.clone(),
                updated_at: timestamp.clone(),
                last_used_at: None,
                favorite: input.favorite,
                deleted: false,
                totp_secret: input.totp_secret,
            });
            payload.updated_at = timestamp;
        }

        self.persist_unlocked()?;
        Ok(entry_id)
    }

    pub fn update_entry(
        &mut self,
        entry_id: &str,
        input: UpdateEntryInput,
        now: Instant,
    ) -> Result<(), BackendError> {
        self.ensure_unlocked()?;
        self.session.touch_activity(now);

        let timestamp = now_iso();
        {
            let payload = self.current_payload.as_mut().ok_or(BackendError::Locked)?;
            let entry = payload
                .entries
                .iter_mut()
                .find(|entry| entry.id == entry_id)
                .ok_or(BackendError::EntryNotFound)?;

            if let Some(value) = input.title {
                if value.trim().is_empty() {
                    return Err(BackendError::InvalidInput);
                }
                entry.title = value;
            }
            if let Some(value) = input.username {
                entry.username = value;
            }
            if let Some(value) = input.password {
                if value.is_empty() {
                    return Err(BackendError::InvalidInput);
                }
                entry.password = value;
            }
            if let Some(value) = input.urls {
                entry.urls = value;
            }
            if let Some(value) = input.notes {
                entry.notes = value;
            }
            if let Some(value) = input.category_id {
                entry.category_id = value;
            }
            if let Some(value) = input.tags {
                entry.tags = value;
            }
            if let Some(value) = input.favorite {
                entry.favorite = value;
            }
            if let Some(value) = input.totp_secret {
                entry.totp_secret = if value.is_empty() { None } else { Some(value) };
            }

            entry.updated_at = timestamp.clone();
            payload.updated_at = timestamp;
        }

        self.persist_unlocked()
    }

    pub fn delete_entry(&mut self, entry_id: &str, now: Instant) -> Result<(), BackendError> {
        self.ensure_unlocked()?;
        self.session.touch_activity(now);

        {
            let payload = self.current_payload.as_mut().ok_or(BackendError::Locked)?;
            let entry = payload
                .entries
                .iter_mut()
                .find(|e| e.id == entry_id)
                .ok_or(BackendError::EntryNotFound)?;
            entry.deleted = true;
            payload.updated_at = now_iso();
        }

        self.persist_unlocked()
    }

    pub fn list_cards(
        &mut self,
        now: Instant,
    ) -> Result<Vec<EntrySummary>, BackendError> {
        self.ensure_unlocked()?;
        self.session.touch_activity(now);

        let payload = self.current_payload.as_ref().ok_or(BackendError::Locked)?;
        let out = payload
            .entries
            .iter()
            .filter(|e| !e.deleted && e.kind == EntryKind::CreditCard)
            .map(|entry| EntrySummary {
                id: entry.id.clone(),
                kind: entry.kind.clone(),
                title: entry.title.clone(),
                username: entry.username.clone(),
                category_id: entry.category_id.clone(),
                last_used_at: entry.last_used_at.clone(),
                favorite: entry.favorite,
                password_strength: classify_strength(&entry.password),
            })
            .collect();
        Ok(out)
    }

    pub fn list_trash(
        &mut self,
        now: Instant,
    ) -> Result<Vec<EntrySummary>, BackendError> {
        self.ensure_unlocked()?;
        self.session.touch_activity(now);

        let payload = self.current_payload.as_ref().ok_or(BackendError::Locked)?;
        let out = payload
            .entries
            .iter()
            .filter(|e| e.deleted)
            .map(|entry| EntrySummary {
                id: entry.id.clone(),
                kind: entry.kind.clone(),
                title: entry.title.clone(),
                username: entry.username.clone(),
                category_id: entry.category_id.clone(),
                last_used_at: entry.last_used_at.clone(),
                favorite: entry.favorite,
                password_strength: classify_strength(&entry.password),
            })
            .collect();
        Ok(out)
    }

    pub fn restore_entry(&mut self, entry_id: &str, now: Instant) -> Result<(), BackendError> {
        self.ensure_unlocked()?;
        self.session.touch_activity(now);

        {
            let payload = self.current_payload.as_mut().ok_or(BackendError::Locked)?;
            let entry = payload
                .entries
                .iter_mut()
                .find(|e| e.id == entry_id)
                .ok_or(BackendError::EntryNotFound)?;
            entry.deleted = false;
            payload.updated_at = now_iso();
        }

        self.persist_unlocked()
    }

    pub fn permanent_delete_entry(&mut self, entry_id: &str, now: Instant) -> Result<(), BackendError> {
        self.ensure_unlocked()?;
        self.session.touch_activity(now);

        {
            let payload = self.current_payload.as_mut().ok_or(BackendError::Locked)?;
            let original_len = payload.entries.len();
            payload.entries.retain(|e| e.id != entry_id);
            if payload.entries.len() == original_len {
                return Err(BackendError::EntryNotFound);
            }
            payload.updated_at = now_iso();
        }

        self.persist_unlocked()
    }

    pub fn verify_master_password(&self, password: &SecretString) -> Result<bool, BackendError> {
        self.ensure_unlocked()?;
        let session_pw = self
            .session_master_password
            .as_ref()
            .ok_or(BackendError::MissingSession)?;
        Ok(session_pw.as_bytes() == password.as_bytes())
    }

    pub fn generate_password(&self, options: PasswordOptions) -> Result<String, BackendError> {
        generate_password(options).map_err(|_| BackendError::PasswordGeneration)
    }

    pub fn copy_password(&mut self, entry_id: &str, now: Instant) -> Result<(), BackendError> {
        self.ensure_unlocked()?;

        let password = {
            let payload = self.current_payload.as_ref().ok_or(BackendError::Locked)?;
            let entry = payload
                .entries
                .iter()
                .find(|entry| entry.id == entry_id)
                .ok_or(BackendError::EntryNotFound)?;
            entry.password.clone()
        };

        self.clipboard
            .set_text(password.as_str())
            .map_err(|_| BackendError::Clipboard)?;

        self.session.touch_activity(now);
        self.session.mark_secret_copied(now);
        Ok(())
    }

    pub fn copy_username(&mut self, entry_id: &str, now: Instant) -> Result<(), BackendError> {
        self.ensure_unlocked()?;

        let username = {
            let payload = self.current_payload.as_ref().ok_or(BackendError::Locked)?;
            let entry = payload
                .entries
                .iter()
                .find(|entry| entry.id == entry_id)
                .ok_or(BackendError::EntryNotFound)?;
            entry.username.clone()
        };

        self.clipboard
            .set_text(username.as_str())
            .map_err(|_| BackendError::Clipboard)?;

        self.session.touch_activity(now);
        Ok(())
    }

    pub fn tick(&mut self, now: Instant) -> Result<TickOutcome, BackendError> {
        let did_lock = self.session.check_auto_lock(now);
        if did_lock {
            self.current_payload = None;
            self.session_master_password = None;
            self.pending_challenge = None;
            self.clipboard.clear().map_err(|_| BackendError::Clipboard)?;
            return Ok(TickOutcome {
                did_lock: true,
                did_clear_clipboard: true,
            });
        }

        let did_clear_clipboard = if self.session.consume_clipboard_clear(now) {
            self.clipboard.clear().map_err(|_| BackendError::Clipboard)?;
            true
        } else {
            false
        };

        Ok(TickOutcome {
            did_lock: false,
            did_clear_clipboard,
        })
    }

    pub fn save(&mut self) -> Result<(), BackendError> {
        self.persist_unlocked()
    }

    pub fn export_encrypted(&self, destination: &Path) -> Result<(), BackendError> {
        std::fs::copy(self.store.path(), destination).map_err(|_| BackendError::Storage)?;
        Ok(())
    }

    pub fn rotate_master_password(
        &mut self,
        old_password: &SecretString,
        new_password: &SecretString,
        now: Instant,
    ) -> Result<(), BackendError> {
        self.ensure_unlocked()?;

        if new_password.as_bytes().len() < 8 {
            return Err(BackendError::InvalidInput);
        }

        let session_password = self
            .session_master_password
            .as_ref()
            .ok_or(BackendError::MissingSession)?;

        if session_password.as_bytes() != old_password.as_bytes() {
            return Err(BackendError::AuthenticationFailed);
        }

        let payload = self.current_payload.as_ref().ok_or(BackendError::Locked)?;
        self.store
            .save(payload, new_password.as_bytes(), self.kdf_params)
            .map_err(|_| BackendError::Storage)?;

        self.session_master_password = Some(new_password.clone());
        self.session.touch_activity(now);
        Ok(())
    }

    pub fn update_settings(
        &mut self,
        auto_lock_minutes: Option<u16>,
        clipboard_clear_seconds: Option<u16>,
        now: Instant,
    ) -> Result<(), BackendError> {
        self.ensure_unlocked()?;
        self.session.touch_activity(now);

        {
            let payload = self.current_payload.as_mut().ok_or(BackendError::Locked)?;
            if let Some(v) = auto_lock_minutes {
                if v == 0 {
                    return Err(BackendError::InvalidInput);
                }
                payload.settings.auto_lock_minutes = v;
            }
            if let Some(v) = clipboard_clear_seconds {
                if v == 0 {
                    return Err(BackendError::InvalidInput);
                }
                payload.settings.clipboard_clear_seconds = v;
            }
            payload.updated_at = now_iso();
        }

        let (lock_m, clip_s) = {
            let payload = self.current_payload.as_ref().ok_or(BackendError::Locked)?;
            (
                payload.settings.auto_lock_minutes,
                payload.settings.clipboard_clear_seconds,
            )
        };
        self.session.update_timeouts(
            Duration::from_secs(lock_m as u64 * 60),
            Duration::from_secs(clip_s as u64),
        );

        self.persist_unlocked()
    }

    pub fn get_vault_stats(&mut self, now: Instant) -> Result<VaultStats, BackendError> {
        self.ensure_unlocked()?;
        self.session.touch_activity(now);

        let payload = self.current_payload.as_ref().ok_or(BackendError::Locked)?;
        let login_entries: Vec<_> = payload
            .entries
            .iter()
            .filter(|e| !e.deleted && e.kind == EntryKind::Login)
            .collect();
        let weak = login_entries
            .iter()
            .filter(|e| matches!(classify_strength(&e.password), PasswordStrength::Weak))
            .count();
        let card_count = payload
            .entries
            .iter()
            .filter(|e| !e.deleted && e.kind == EntryKind::CreditCard)
            .count();
        let trash_count = payload.entries.iter().filter(|e| e.deleted).count();

        Ok(VaultStats {
            total_entries: login_entries.len(),
            favorites: payload.entries.iter().filter(|e| e.favorite && !e.deleted).count(),
            weak_passwords: weak,
            categories: payload.categories.len(),
            card_count,
            trash_count,
            auto_lock_minutes: payload.settings.auto_lock_minutes,
            clipboard_clear_seconds: payload.settings.clipboard_clear_seconds,
        })
    }

    pub fn set_hint(&self, hint_text: String) -> Result<(), BackendError> {
        self.store
            .set_hint(&hint_text)
            .map_err(|_| BackendError::Storage)
    }

    pub fn get_hint(&self) -> Option<String> {
        self.store.get_hint()
    }

    pub fn create_manual_backup(&self) -> Result<(), BackendError> {
        let backup_dir =
            vault_store::default_backup_dir().ok_or(BackendError::Storage)?;
        self.store
            .backup(&backup_dir)
            .map(|_| ())
            .map_err(|_| BackendError::Storage)
    }

    pub fn seconds_until_lock(&self, now: Instant) -> Option<u64> {
        self.session.seconds_until_lock(now)
    }

    pub fn handle_native_request(&mut self, request: NativeRequest, now: Instant) -> NativeResponse {
        match request {
            NativeRequest::Ping => NativeResponse::Pong,
            NativeRequest::Lock => {
                if self.lock().is_err() {
                    return NativeResponse::Error {
                        code: NativeErrorCode::Internal,
                        message: "lock failed".to_owned(),
                    };
                }
                NativeResponse::Ack
            }
            NativeRequest::GetChallenge => {
                if !self.is_unlocked() {
                    return NativeResponse::Locked;
                }

                let token = self.issue_challenge(now);
                NativeResponse::Challenge {
                    token,
                    expires_in_seconds: CHALLENGE_TTL_SECONDS,
                }
            }
            NativeRequest::ListEntries { origin, challenge } => {
                if !self.is_unlocked() {
                    return NativeResponse::Locked;
                }

                if !is_origin_allowed(origin.as_str()) {
                    return NativeResponse::Error {
                        code: NativeErrorCode::ForbiddenOrigin,
                        message: "origin not allowed".to_owned(),
                    };
                }

                if !self.consume_challenge(challenge.as_str(), now) {
                    return NativeResponse::Error {
                        code: NativeErrorCode::ChallengeFailed,
                        message: "invalid challenge".to_owned(),
                    };
                }

                self.session.touch_activity(now);

                let payload = match self.current_payload.as_ref() {
                    Some(payload) => payload,
                    None => {
                        return NativeResponse::Locked;
                    }
                };

                let entries = payload
                    .entries
                    .iter()
                    .filter(|entry| entry_matches_origin(entry.urls.as_slice(), origin.as_str()))
                    .map(|entry| NativeEntrySummary {
                        id: entry.id.clone(),
                        title: entry.title.clone(),
                        username: entry.username.clone(),
                    })
                    .collect();

                NativeResponse::Entries { entries }
            }
            NativeRequest::FillForOrigin {
                origin,
                entry_id,
                challenge,
                user_gesture,
            } => {
                if !self.is_unlocked() {
                    return NativeResponse::Locked;
                }

                if !is_origin_allowed(origin.as_str()) {
                    return NativeResponse::Error {
                        code: NativeErrorCode::ForbiddenOrigin,
                        message: "origin not allowed".to_owned(),
                    };
                }

                if !self.consume_challenge(challenge.as_str(), now) {
                    return NativeResponse::Error {
                        code: NativeErrorCode::ChallengeFailed,
                        message: "invalid challenge".to_owned(),
                    };
                }

                if !user_gesture {
                    return NativeResponse::Error {
                        code: NativeErrorCode::UserGestureRequired,
                        message: "explicit user action required".to_owned(),
                    };
                }

                let (username, password) = {
                    let payload = match self.current_payload.as_mut() {
                        Some(payload) => payload,
                        None => {
                            return NativeResponse::Locked;
                        }
                    };

                    let Some(entry) = payload.entries.iter_mut().find(|entry| entry.id == entry_id) else {
                        return NativeResponse::Error {
                            code: NativeErrorCode::EntryNotFound,
                            message: "entry not found".to_owned(),
                        };
                    };

                    if !entry_matches_origin(entry.urls.as_slice(), origin.as_str()) {
                        return NativeResponse::Error {
                            code: NativeErrorCode::ForbiddenOrigin,
                            message: "entry not allowed for origin".to_owned(),
                        };
                    }

                    entry.last_used_at = Some(now_iso());
                    (entry.username.clone(), entry.password.clone())
                };

                if self.persist_unlocked().is_err() {
                    return NativeResponse::Error {
                        code: NativeErrorCode::Internal,
                        message: "failed to persist usage metadata".to_owned(),
                    };
                }

                self.session.touch_activity(now);

                NativeResponse::FillData { username, password }
            }
        }
    }

    pub fn clipboard_preview(&self) -> Option<&str> {
        self.clipboard.peek_text()
    }

    // ── Documents chiffrés ───────────────────────────────────────────────────

    fn files_dir(&self) -> std::path::PathBuf {
        self.store
            .path()
            .parent()
            .expect("le chemin du coffre doit avoir un répertoire parent")
            .join("files")
    }

    fn derive_doc_key(&self, doc_id: &str) -> Result<[u8; crypto_core::KEY_LEN], BackendError> {
        let payload = self.current_payload.as_ref().ok_or(BackendError::Locked)?;
        if payload.file_root_salt.is_empty() {
            return Err(BackendError::Storage);
        }
        let master = self
            .session_master_password
            .as_ref()
            .ok_or(BackendError::MissingSession)?;
        crypto_core::derive_file_key(master.as_bytes(), &payload.file_root_salt, doc_id)
            .map_err(|_| BackendError::Storage)
    }

    pub fn attach_file(
        &mut self,
        entry_id: &str,
        filename: &str,
        mime_type: &str,
        data: &[u8],
        now: Instant,
    ) -> Result<String, BackendError> {
        self.ensure_unlocked()?;
        self.session.touch_activity(now);

        if data.len() as u64 > FILE_SIZE_LIMIT {
            return Err(BackendError::InvalidInput);
        }

        {
            let payload = self.current_payload.as_ref().ok_or(BackendError::Locked)?;
            if !payload.entries.iter().any(|e| e.id == entry_id && !e.deleted) {
                return Err(BackendError::EntryNotFound);
            }
        }

        let doc_id = Uuid::new_v4().to_string();
        let key = self.derive_doc_key(&doc_id)?;
        let nonce = crypto_core::rng::random_array::<{ crypto_core::NONCE_LEN }>();
        let ciphertext =
            crypto_core::aead::encrypt(&key, &nonce, crypto_core::FILE_AAD, data)
                .map_err(|_| BackendError::Storage)?;

        let dir = self.files_dir();
        std::fs::create_dir_all(&dir).map_err(|_| BackendError::Storage)?;
        let file_path = dir.join(format!("{}.enc", doc_id));
        let mut enc_data = Vec::with_capacity(crypto_core::NONCE_LEN + ciphertext.len());
        enc_data.extend_from_slice(&nonce);
        enc_data.extend_from_slice(&ciphertext);
        std::fs::write(&file_path, &enc_data).map_err(|_| BackendError::Storage)?;

        let doc = VaultDocument {
            id: doc_id.clone(),
            entry_id: entry_id.to_owned(),
            filename: filename.to_owned(),
            mime_type: mime_type.to_owned(),
            size: data.len() as u64,
            created_at: now_iso(),
        };

        {
            let payload = self.current_payload.as_mut().ok_or(BackendError::Locked)?;
            payload.documents.push(doc);
            payload.updated_at = now_iso();
        }

        if let Err(e) = self.persist_unlocked() {
            let _ = std::fs::remove_file(&file_path);
            if let Some(payload) = self.current_payload.as_mut() {
                payload.documents.retain(|d| d.id != doc_id);
            }
            return Err(e);
        }

        Ok(doc_id)
    }

    pub fn list_documents(
        &mut self,
        entry_id: &str,
        now: Instant,
    ) -> Result<Vec<DocumentMeta>, BackendError> {
        self.ensure_unlocked()?;
        self.session.touch_activity(now);

        let payload = self.current_payload.as_ref().ok_or(BackendError::Locked)?;
        let docs = payload
            .documents
            .iter()
            .filter(|d| d.entry_id == entry_id)
            .map(|d| DocumentMeta {
                id: d.id.clone(),
                entry_id: d.entry_id.clone(),
                filename: d.filename.clone(),
                mime_type: d.mime_type.clone(),
                size: d.size,
                created_at: d.created_at.clone(),
            })
            .collect();
        Ok(docs)
    }

    pub fn list_all_documents(
        &mut self,
        now: Instant,
    ) -> Result<Vec<DocumentWithEntry>, BackendError> {
        self.ensure_unlocked()?;
        self.session.touch_activity(now);

        let payload = self.current_payload.as_ref().ok_or(BackendError::Locked)?;
        let docs = payload
            .documents
            .iter()
            .map(|d| {
                let entry_title = payload
                    .entries
                    .iter()
                    .find(|e| e.id == d.entry_id)
                    .map(|e| e.title.clone())
                    .unwrap_or_default();
                DocumentWithEntry {
                    id: d.id.clone(),
                    entry_id: d.entry_id.clone(),
                    entry_title,
                    filename: d.filename.clone(),
                    mime_type: d.mime_type.clone(),
                    size: d.size,
                    created_at: d.created_at.clone(),
                }
            })
            .collect();
        Ok(docs)
    }

    pub fn get_document_bytes(
        &mut self,
        doc_id: &str,
        now: Instant,
    ) -> Result<(DocumentMeta, Vec<u8>), BackendError> {
        self.ensure_unlocked()?;
        self.session.touch_activity(now);

        let doc = {
            let payload = self.current_payload.as_ref().ok_or(BackendError::Locked)?;
            payload
                .documents
                .iter()
                .find(|d| d.id == doc_id)
                .cloned()
                .ok_or(BackendError::EntryNotFound)?
        };

        let key = self.derive_doc_key(doc_id)?;
        let file_path = self.files_dir().join(format!("{}.enc", doc_id));
        let enc_data = std::fs::read(&file_path).map_err(|_| BackendError::Storage)?;

        if enc_data.len() < crypto_core::NONCE_LEN {
            return Err(BackendError::Storage);
        }

        let nonce: [u8; crypto_core::NONCE_LEN] = enc_data[..crypto_core::NONCE_LEN]
            .try_into()
            .map_err(|_| BackendError::Storage)?;
        let ciphertext = &enc_data[crypto_core::NONCE_LEN..];
        let plaintext =
            crypto_core::aead::decrypt(&key, &nonce, crypto_core::FILE_AAD, ciphertext)
                .map_err(|_| BackendError::Storage)?;

        let meta = DocumentMeta {
            id: doc.id,
            entry_id: doc.entry_id,
            filename: doc.filename,
            mime_type: doc.mime_type,
            size: doc.size,
            created_at: doc.created_at,
        };
        Ok((meta, plaintext))
    }

    pub fn delete_document(
        &mut self,
        doc_id: &str,
        now: Instant,
    ) -> Result<(), BackendError> {
        self.ensure_unlocked()?;
        self.session.touch_activity(now);

        {
            let payload = self.current_payload.as_ref().ok_or(BackendError::Locked)?;
            if !payload.documents.iter().any(|d| d.id == doc_id) {
                return Err(BackendError::EntryNotFound);
            }
        }

        let file_path = self.files_dir().join(format!("{}.enc", doc_id));
        if file_path.exists() {
            std::fs::remove_file(&file_path).map_err(|_| BackendError::Storage)?;
        }

        {
            let payload = self.current_payload.as_mut().ok_or(BackendError::Locked)?;
            payload.documents.retain(|d| d.id != doc_id);
            payload.updated_at = now_iso();
        }

        self.persist_unlocked()
    }

    fn ensure_unlocked(&self) -> Result<(), BackendError> {
        if !self.is_unlocked() {
            return Err(BackendError::Locked);
        }

        Ok(())
    }

    fn persist_unlocked(&self) -> Result<(), BackendError> {
        let payload = self.current_payload.as_ref().ok_or(BackendError::Locked)?;
        let master = self
            .session_master_password
            .as_ref()
            .ok_or(BackendError::MissingSession)?;

        self.store
            .save(payload, master.as_bytes(), self.kdf_params)
            .map_err(|_| BackendError::Storage)
    }

    fn validate_create_input(&self, input: &CreateEntryInput) -> Result<(), BackendError> {
        if input.title.trim().is_empty() {
            return Err(BackendError::InvalidInput);
        }

        if input.kind == EntryKind::Login && input.password.is_empty() {
            return Err(BackendError::InvalidInput);
        }

        if input.kind == EntryKind::Login && input.urls.is_empty() {
            return Err(BackendError::InvalidInput);
        }

        Ok(())
    }

    pub fn import_entries(
        &mut self,
        entries: Vec<CreateEntryInput>,
        now: Instant,
    ) -> Result<usize, BackendError> {
        self.ensure_unlocked()?;
        self.session.touch_activity(now);

        let count = entries.len();
        if count == 0 { return Ok(0); }

        let timestamp = now_iso();
        {
            let payload = self.current_payload.as_mut().ok_or(BackendError::Locked)?;
            for input in entries {
                if input.title.trim().is_empty() { continue; }
                payload.entries.push(VaultEntry {
                    id: Uuid::new_v4().to_string(),
                    kind: input.kind,
                    title: input.title,
                    username: input.username,
                    password: input.password,
                    urls: input.urls,
                    notes: input.notes,
                    category_id: input.category_id,
                    tags: input.tags,
                    created_at: timestamp.clone(),
                    updated_at: timestamp.clone(),
                    last_used_at: None,
                    favorite: input.favorite,
                    deleted: false,
                    totp_secret: input.totp_secret,
                });
            }
            payload.updated_at = timestamp;
        }

        self.persist_unlocked()?;
        Ok(count)
    }

    fn issue_challenge(&mut self, now: Instant) -> String {
        let token = random_token();
        self.pending_challenge = Some(PendingChallenge {
            token: token.clone(),
            expires_at: now + Duration::from_secs(CHALLENGE_TTL_SECONDS as u64),
        });
        token
    }

    fn consume_challenge(&mut self, token: &str, now: Instant) -> bool {
        let Some(state) = self.pending_challenge.as_ref() else {
            return false;
        };

        let is_valid = state.token == token && now <= state.expires_at;
        if is_valid {
            self.pending_challenge = None;
        }

        is_valid
    }
}

fn now_iso() -> String {
    Utc::now().to_rfc3339()
}

fn random_token() -> String {
    let mut bytes = [0_u8; 16];
    OsRng.fill_bytes(&mut bytes);
    bytes.iter().map(|b| format!("{b:02x}")).collect()
}

fn entry_matches_query(entry: &VaultEntry, query: &str) -> bool {
    let title = entry.title.to_lowercase();
    let username = entry.username.to_lowercase();
    let category = entry.category_id.to_lowercase();

    if title.contains(query) || username.contains(query) || category.contains(query) {
        return true;
    }

    entry.urls.iter().any(|url| url.to_lowercase().contains(query))
}

fn classify_strength(password: &str) -> PasswordStrength {
    if password.is_empty() {
        return PasswordStrength::Unknown;
    }
    let len = password.len();
    let has_upper = password.chars().any(|c| c.is_uppercase());
    let has_digit = password.chars().any(|c| c.is_ascii_digit());
    let has_symbol = password.chars().any(|c| !c.is_alphanumeric());

    let score = (len >= 12) as u8
        + (len >= 16) as u8
        + has_upper as u8
        + has_digit as u8
        + has_symbol as u8;

    match score {
        0..=2 => PasswordStrength::Weak,
        3..=3 => PasswordStrength::Fair,
        _ => PasswordStrength::Strong,
    }
}

#[cfg(test)]
mod tests {
    use std::time::{Duration, Instant};

    use native_protocol::{NativeErrorCode, NativeRequest, NativeResponse};
    use secret_types::SecretString;
    use tempfile::TempDir;
    use vault_domain::EntryKind;
    use vault_store::VaultStore;

    use crate::{CreateEntryInput, DesktopBackend, InMemoryClipboard};

    fn create_backend() -> (DesktopBackend<InMemoryClipboard>, SecretString) {
        let temp = TempDir::new().unwrap();
        let vault_path = temp.path().join("vault.bin");

        let store = VaultStore::new(vault_path);
        let clipboard = InMemoryClipboard::default();
        let mut backend = DesktopBackend::new(store, clipboard);
        let password = SecretString::from_str("CorrectHorseBatteryStaple");

        backend.initialize_empty_vault(&password).unwrap();

        // Keep temp dir alive by leaking; tests are short-lived.
        std::mem::forget(temp);

        (backend, password)
    }

    #[test]
    fn lock_unlock_crud_and_clipboard_timer() {
        let (mut backend, password) = create_backend();
        let t0 = Instant::now();

        backend.unlock(&password, t0).unwrap();

        let id = backend
            .create_entry(
                CreateEntryInput {
                    kind: EntryKind::Login,
                    title: "GitHub".to_string(),
                    username: "alice".to_string(),
                    password: "secret-123".to_string(),
                    urls: vec!["https://github.com/login".to_string()],
                    notes: String::new(),
                    category_id: "work".to_string(),
                    tags: vec![],
                    favorite: false,
                    totp_secret: None,
                },
                t0,
            )
            .unwrap();

        let entries = backend.list_entries(Some("git"), t0).unwrap();
        assert_eq!(entries.len(), 1);
        assert_eq!(entries[0].id, id);

        backend.copy_password(&id, t0).unwrap();
        assert_eq!(backend.clipboard_preview(), Some("secret-123"));

        let outcome = backend.tick(t0 + Duration::from_secs(21)).unwrap();
        assert!(outcome.did_clear_clipboard);
        assert_eq!(backend.clipboard_preview(), None);
    }

    #[test]
    fn unlock_throttle_after_repeated_failures() {
        let (mut backend, _password) = create_backend();
        let t0 = Instant::now();
        let wrong = SecretString::from_str("wrong-password");

        for i in 0..6 {
            let result = backend.unlock(&wrong, t0 + Duration::from_secs(i));
            assert!(result.is_err());
        }

        let blocked = backend.unlock(&wrong, t0 + Duration::from_secs(10));
        assert!(blocked.is_err());
    }

    #[test]
    fn native_flow_requires_challenge_and_user_gesture() {
        let (mut backend, password) = create_backend();
        let t0 = Instant::now();

        backend.unlock(&password, t0).unwrap();

        let id = backend
            .create_entry(
                CreateEntryInput {
                    kind: EntryKind::Login,
                    title: "GitHub".to_string(),
                    username: "alice".to_string(),
                    password: "secret-123".to_string(),
                    urls: vec!["https://github.com/login".to_string()],
                    notes: String::new(),
                    category_id: "work".to_string(),
                    tags: vec![],
                    favorite: false,
                    totp_secret: None,
                },
                t0,
            )
            .unwrap();

        let denied = backend.handle_native_request(
            NativeRequest::ListEntries {
                origin: "https://github.com/login".to_string(),
                challenge: "bad".to_string(),
            },
            t0,
        );
        assert!(matches!(
            denied,
            NativeResponse::Error {
                code: NativeErrorCode::ChallengeFailed,
                ..
            }
        ));

        let challenge = match backend.handle_native_request(NativeRequest::GetChallenge, t0) {
            NativeResponse::Challenge { token, .. } => token,
            other => panic!("unexpected response: {other:?}"),
        };

        let listed = backend.handle_native_request(
            NativeRequest::ListEntries {
                origin: "https://github.com/login".to_string(),
                challenge,
            },
            t0,
        );

        match listed {
            NativeResponse::Entries { entries } => {
                assert_eq!(entries.len(), 1);
                assert_eq!(entries[0].id, id);
            }
            other => panic!("unexpected response: {other:?}"),
        }

        let fill_challenge = match backend.handle_native_request(NativeRequest::GetChallenge, t0) {
            NativeResponse::Challenge { token, .. } => token,
            other => panic!("unexpected response: {other:?}"),
        };

        let no_gesture = backend.handle_native_request(
            NativeRequest::FillForOrigin {
                origin: "https://github.com/login".to_string(),
                entry_id: id.clone(),
                challenge: fill_challenge,
                user_gesture: false,
            },
            t0,
        );
        assert!(matches!(
            no_gesture,
            NativeResponse::Error {
                code: NativeErrorCode::UserGestureRequired,
                ..
            }
        ));

        let fill_challenge = match backend.handle_native_request(NativeRequest::GetChallenge, t0) {
            NativeResponse::Challenge { token, .. } => token,
            other => panic!("unexpected response: {other:?}"),
        };

        let fill_ok = backend.handle_native_request(
            NativeRequest::FillForOrigin {
                origin: "https://github.com/login".to_string(),
                entry_id: id,
                challenge: fill_challenge,
                user_gesture: true,
            },
            t0,
        );

        assert!(matches!(fill_ok, NativeResponse::FillData { .. }));
    }
}
