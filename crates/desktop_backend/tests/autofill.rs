use std::time::Instant;

use desktop_backend::{CreateEntryInput, DesktopBackend, InMemoryClipboard};
use native_protocol::{NativeRequest, NativeResponse};
use secret_types::SecretString;
use tempfile::TempDir;
use vault_domain::EntryKind;
use vault_store::VaultStore;

#[test]
fn autofill_flow_works_only_when_unlocked_and_challenged() {
    let temp = TempDir::new().unwrap();
    let store = VaultStore::new(temp.path().join("vault.bin"));
    let clipboard = InMemoryClipboard::default();
    let mut backend = DesktopBackend::new(store, clipboard);

    let password = SecretString::from_str("CorrectHorseBatteryStaple");
    backend.initialize_empty_vault(&password).unwrap();

    let t0 = Instant::now();
    backend.unlock(&password, t0).unwrap();

    let entry_id = backend
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

    let challenge = match backend.handle_native_request(NativeRequest::GetChallenge, t0) {
        NativeResponse::Challenge { token, .. } => token,
        _ => panic!("challenge required"),
    };

    let response = backend.handle_native_request(
        NativeRequest::FillForOrigin {
            origin: "https://github.com/login".to_string(),
            entry_id,
            challenge,
            user_gesture: true,
        },
        t0,
    );

    assert!(matches!(response, NativeResponse::FillData { .. }));
}
