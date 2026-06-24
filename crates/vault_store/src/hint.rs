use std::fs;
use std::path::Path;

const HINT_FILENAME: &str = "hint.txt";

fn hint_path(vault_path: &Path) -> Option<std::path::PathBuf> {
    vault_path.parent().map(|d| d.join(HINT_FILENAME))
}

pub fn save_hint(vault_path: &Path, hint: &str) -> std::io::Result<()> {
    let path = hint_path(vault_path)
        .ok_or_else(|| std::io::Error::new(std::io::ErrorKind::InvalidInput, "no parent dir"))?;

    if hint.trim().is_empty() {
        let _ = fs::remove_file(&path);
        return Ok(());
    }

    fs::write(path, hint.trim())
}

pub fn load_hint(vault_path: &Path) -> Option<String> {
    let path = hint_path(vault_path)?;
    fs::read_to_string(path).ok()
}
