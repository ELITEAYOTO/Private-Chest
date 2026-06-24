use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::{Path, PathBuf};

fn tmp_path(path: &Path) -> std::io::Result<PathBuf> {
    let file_name = path
        .file_name()
        .ok_or_else(|| std::io::Error::new(std::io::ErrorKind::InvalidInput, "missing filename"))?
        .to_string_lossy()
        .to_string();

    Ok(path.with_file_name(format!("{file_name}.tmp.{}", std::process::id())))
}

#[cfg(unix)]
fn sync_parent(parent: &Path) -> std::io::Result<()> {
    std::fs::File::open(parent)?.sync_all()
}

#[cfg(not(unix))]
fn sync_parent(_: &Path) -> std::io::Result<()> {
    Ok(())
}

pub fn write_atomic(path: &Path, bytes: &[u8]) -> std::io::Result<()> {
    let parent = path
        .parent()
        .ok_or_else(|| std::io::Error::new(std::io::ErrorKind::InvalidInput, "missing parent"))?;

    fs::create_dir_all(parent)?;

    let tmp = tmp_path(path)?;
    {
        let mut file = OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&tmp)?;
        file.write_all(bytes)?;
        file.sync_all()?;
    }

    #[cfg(target_family = "windows")]
    {
        if path.exists() {
            let file_name = path
                .file_name()
                .ok_or_else(|| std::io::Error::new(std::io::ErrorKind::InvalidInput, "missing filename"))?
                .to_string_lossy()
                .to_string();

            let backup = path.with_file_name(format!("{file_name}.swap"));

            let _ = fs::remove_file(&backup);
            fs::rename(path, &backup)?;

            match fs::rename(&tmp, path) {
                Ok(_) => {
                    let _ = fs::remove_file(&backup);
                }
                Err(e) => {
                    let _ = fs::rename(&backup, path);
                    let _ = fs::remove_file(&tmp);
                    return Err(e);
                }
            }
        } else {
            fs::rename(&tmp, path)?;
        }
    }

    #[cfg(not(target_family = "windows"))]
    {
        fs::rename(&tmp, path)?;
    }

    sync_parent(parent)?;
    Ok(())
}
