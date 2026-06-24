use std::path::PathBuf;

use directories::ProjectDirs;

const QUALIFIER: &str = "io";
const ORGANIZATION: &str = "privatechest";
const APPLICATION: &str = "PrivateChest";

pub fn default_app_data_dir() -> Option<PathBuf> {
    let dirs = ProjectDirs::from(QUALIFIER, ORGANIZATION, APPLICATION)?;
    Some(dirs.data_dir().to_path_buf())
}

pub fn default_vault_path() -> Option<PathBuf> {
    let base = default_app_data_dir()?;
    Some(base.join("vault.bin"))
}

pub fn default_backup_dir() -> Option<PathBuf> {
    let base = default_app_data_dir()?;
    Some(base.join("backup"))
}

#[cfg(test)]
mod tests {
    use crate::paths::{default_app_data_dir, default_backup_dir, default_vault_path};

    #[test]
    fn default_paths_are_resolvable() {
        assert!(default_app_data_dir().is_some());
        assert!(default_vault_path().is_some());
        assert!(default_backup_dir().is_some());
    }
}
