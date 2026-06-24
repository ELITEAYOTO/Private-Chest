use std::io;

use native_host::{run_loop, DesktopHandler, LockedHandler};

fn main() {
    let mut stdin = io::stdin();
    let mut stdout = io::stdout();

    if let Ok(mut handler) = DesktopHandler::from_default_store() {
        if let Err(error) = run_loop(&mut stdin, &mut stdout, &mut handler) {
            eprintln!("native host terminated: {error}");
        }
        return;
    }

    let mut fallback = LockedHandler;
    if let Err(error) = run_loop(&mut stdin, &mut stdout, &mut fallback) {
        eprintln!("native host terminated: {error}");
    }
}
