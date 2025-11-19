use crate::excel_exporter::ExcelExporter;
use crate::models::{MonthlySummary, Session, TimerState};
use crate::session_store::SessionStore;
use crate::timer_manager::TimerManager;
use chrono::{Datelike, Utc};
use directories::UserDirs;
use std::path::PathBuf;
use std::sync::Arc;
use tauri::State;

pub struct AppState {
    pub timer_manager: Arc<TimerManager>,
    pub session_store: Arc<SessionStore>,
}

#[tauri::command]
pub fn start_timer(state: State<AppState>) -> Result<Session, String> {
    state
        .timer_manager
        .start_session()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn pause_timer(state: State<AppState>) -> Result<Session, String> {
    state
        .timer_manager
        .pause_session()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn resume_timer(state: State<AppState>) -> Result<Session, String> {
    state
        .timer_manager
        .resume_session()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn end_timer(state: State<AppState>) -> Result<Session, String> {
    state
        .timer_manager
        .end_session()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_timer_state(state: State<AppState>) -> TimerState {
    if let Some(session) = state.timer_manager.get_current_session() {
        let elapsed = state.timer_manager.get_current_elapsed_seconds();
        println!("Timer state - Session ID: {}, Paused: {}, Elapsed: {}", 
                 session.id, session.is_paused(), elapsed);
        TimerState {
            is_running: true,
            is_paused: session.is_paused(),
            current_session_id: Some(session.id.clone()),
            elapsed_seconds: elapsed,
        }
    } else {
        println!("No active session");
        TimerState::default()
    }
}

#[tauri::command]
pub fn get_current_elapsed() -> Result<i64, String> {
    Ok(Utc::now().timestamp())
}

#[tauri::command]
pub fn get_all_sessions(state: State<AppState>) -> Result<Vec<Session>, String> {
    state
        .session_store
        .get_all_sessions()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_monthly_summary(
    state: State<AppState>,
    year: i32,
    month: u32,
) -> Result<MonthlySummary, String> {
    state
        .session_store
        .get_monthly_summary(year, month)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn export_session(session: Session) -> Result<String, String> {
    let downloads_dir = UserDirs::new()
        .and_then(|dirs| dirs.home_dir().to_path_buf().into())
        .map(|home: PathBuf| home.join("Downloads"))
        .ok_or_else(|| "Could not determine downloads directory".to_string())?;

    let filename = format!(
        "Session-{}.xlsx",
        session.start.format("%Y-%m-%d-%H-%M")
    );
    let output_path = downloads_dir.join(filename);

    ExcelExporter::export_session(&session, output_path.clone())
        .map_err(|e| e.to_string())?;

    Ok(output_path.to_string_lossy().to_string())
}

#[tauri::command]
pub fn update_tray(
    app: tauri::AppHandle,
    is_running: bool,
    is_paused: bool,
    elapsed_seconds: i64,
) -> Result<(), String> {
    crate::system_tray::update_tray_menu(&app, is_running, is_paused, elapsed_seconds)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn export_monthly_summary(
    state: State<'_, AppState>,
    year: i32,
    month: u32,
) -> Result<String, String> {
    let _summary = state.session_store.get_monthly_summary(year, month)
        .map_err(|e| e.to_string())?;
    
    let sessions = state.session_store.get_all_sessions()
        .map_err(|e| e.to_string())?
        .into_iter()
        .filter(|s| {
            let start_year = s.start.year();
            let start_month = s.start.month();
            start_year == year && start_month == month
        })
        .collect::<Vec<_>>();

    let downloads_dir = UserDirs::new()
        .and_then(|dirs| dirs.home_dir().to_path_buf().into())
        .map(|home: PathBuf| home.join("Downloads"))
        .ok_or_else(|| "Could not determine downloads directory".to_string())?;

    let filename = format!("MonthlySummary-{}-{:02}.xlsx", year, month);
    let output_path = downloads_dir.join(filename);

    ExcelExporter::export_monthly_summary(year, month, &sessions, output_path.clone())
        .map_err(|e| e.to_string())?;

    Ok(output_path.to_string_lossy().to_string())
}
