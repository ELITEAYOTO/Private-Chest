use std::fs;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

use crate::VaultStoreError;

pub fn create_backup(source: &Path, backup_dir: &Path) -> Result<PathBuf, VaultStoreError> {
    fs::create_dir_all(backup_dir)?;

    let ts = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|_| std::io::Error::new(std::io::ErrorKind::Other, "clock"))?
        .as_secs();

    let backup_path = backup_dir.join(format!("vault-{ts}.bin"));
    fs::copy(source, &backup_path)?;

    Ok(backup_path)
}

pub fn create_backup_with_rotation(
    source: &Path,
    backup_dir: &Path,
    max_backups: usize,
) -> Result<PathBuf, VaultStoreError> {
    let path = create_backup(source, backup_dir)?;
    prune_backups(backup_dir, max_backups)?;
    Ok(path)
}

fn prune_backups(backup_dir: &Path, max_backups: usize) -> Result<(), VaultStoreError> {
    let mut bins: Vec<PathBuf> = fs::read_dir(backup_dir)?
        .filter_map(|e| e.ok())
        .map(|e| e.path())
        .filter(|p| p.extension().and_then(|s| s.to_str()) == Some("bin"))
        .collect();

    if bins.len() <= max_backups {
        return Ok(());
    }

    bins.sort();
    let excess = bins.len() - max_backups;
    for path in bins.iter().take(excess) {
        let _ = fs::remove_file(path);
    }
    Ok(())
}
