use crypto_core::KdfParams;
use vault_domain::{Category, EntryKind, VaultEntry, VaultPayload, VaultSettings};
use vault_format::seal_vault;

fn sample_payload() -> VaultPayload {
    VaultPayload {
        vault_uuid: "vault-1".to_string(),
        version: 1,
        created_at: "2026-03-06T10:00:00Z".to_string(),
        updated_at: "2026-03-06T10:00:00Z".to_string(),
        entries: vec![VaultEntry {
            id: "entry-1".to_string(),
            kind: EntryKind::Login,
            title: "Discord".to_string(),
            username: "alice@example.com".to_string(),
            password: "secret-pass".to_string(),
            urls: vec!["https://discord.com".to_string()],
            notes: String::new(),
            category_id: "social".to_string(),
            tags: vec![],
            created_at: "2026-03-06T10:00:00Z".to_string(),
            updated_at: "2026-03-06T10:00:00Z".to_string(),
            last_used_at: None,
            favorite: false,
            deleted: false,
            totp_secret: None,
        }],
        categories: vec![Category {
            id: "social".to_string(),
            label: "Social".to_string(),
        }],
        settings: VaultSettings::default(),
        documents: Vec::new(),
        file_root_salt: Vec::new(),
    }
}

#[test]
fn tampered_ciphertext_is_rejected() {
    let payload = sample_payload();
    let mut bytes = seal_vault(&payload, b"correct-password", KdfParams::secure_default()).unwrap();

    let index = bytes.len().saturating_sub(3);
    bytes[index] ^= 0x01;

    let opened = vault_format::unseal_vault(bytes.as_slice(), b"correct-password");
    assert!(opened.is_err());
}

#[test]
fn truncated_vault_is_rejected() {
    let payload = sample_payload();
    let bytes = seal_vault(&payload, b"correct-password", KdfParams::secure_default()).unwrap();
    let truncated = &bytes[..bytes.len().saturating_sub(10)];

    let opened = vault_format::unseal_vault(truncated, b"correct-password");
    assert!(opened.is_err());
}
