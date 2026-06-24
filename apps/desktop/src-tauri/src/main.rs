#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod app_state;
mod commands;

use app_state::AppState;

fn main() {
    let state = AppState::new().expect("failed to initialize app state");

    tauri::Builder::default()
        .manage(state)
        .invoke_handler(tauri::generate_handler![
            commands::vault_exists,
            commands::initialize_vault,
            commands::unlock_vault,
            commands::session_status,
            commands::lock_vault,
            commands::list_entries,
            commands::get_entry_details,
            commands::create_entry,
            commands::update_entry,
            commands::delete_entry,
            commands::generate_password,
            commands::copy_password,
            commands::copy_username,
            commands::tick,
            commands::rotate_master_password,
            commands::update_settings,
            commands::get_vault_stats,
            commands::set_hint,
            commands::get_hint,
            commands::create_manual_backup,
            commands::list_cards,
            commands::list_trash,
            commands::restore_entry,
            commands::permanent_delete_entry,
            commands::verify_master_password,
            commands::import_entries,
            commands::attach_file,
            commands::list_documents,
            commands::list_all_documents,
            commands::download_document,
            commands::delete_document,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
