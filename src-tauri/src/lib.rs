mod commands;
mod excel_exporter;
mod models;
mod session_store;
mod system_tray;
mod timer_manager;

use commands::AppState;
use session_store::SessionStore;
use timer_manager::TimerManager;
use std::sync::Arc;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            // Get app data directory
            let app_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to get app data directory");

            // Create directory if it doesn't exist
            std::fs::create_dir_all(&app_dir).expect("Failed to create app data directory");

            // Initialize database
            let db_path = app_dir.join("time-tracker.db");
            let session_store = Arc::new(
                SessionStore::new(db_path).expect("Failed to initialize session store"),
            );

            let timer_manager = Arc::new(
                TimerManager::new(session_store.clone()).expect("Failed to initialize timer manager"),
            );

            // Store state
            app.manage(AppState {
                timer_manager,
                session_store,
            });

            // Create system tray
            system_tray::create_tray(&app.handle())?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::start_timer,
            commands::pause_timer,
            commands::resume_timer,
            commands::end_timer,
            commands::get_timer_state,
            commands::get_current_elapsed,
            commands::get_all_sessions,
            commands::get_monthly_summary,
            commands::export_session,
            commands::export_monthly_summary,
            commands::update_tray,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
