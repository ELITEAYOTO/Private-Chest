mod backend;
mod clipboard;
mod models;
mod throttle;

pub use backend::{DesktopBackend, TickOutcome};
pub use clipboard::{ClipboardError, ClipboardSink, InMemoryClipboard, SystemClipboard};
pub use models::{
    CreateEntryInput, DocumentMeta, DocumentWithEntry, EntryDetails, EntrySummary, PasswordStrength,
    UpdateEntryInput, VaultStats,
};
pub use throttle::{UnlockThrottle, UnlockThrottlePolicy};

use thiserror::Error;

#[derive(Debug, Error)]
pub enum BackendError {
    #[error("vault is locked")]
    Locked,
    #[error("authentication failed")]
    AuthenticationFailed,
    #[error("unlock temporarily blocked for {0} seconds")]
    UnlockThrottled(u64),
    #[error("entry not found")]
    EntryNotFound,
    #[error("invalid input")]
    InvalidInput,
    #[error("missing active session")]
    MissingSession,
    #[error("clipboard operation failed")]
    Clipboard,
    #[error("storage operation failed")]
    Storage,
    #[error("password generation failed")]
    PasswordGeneration,
}
