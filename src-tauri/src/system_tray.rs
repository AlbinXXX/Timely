use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Emitter, Manager, Runtime,
};

pub fn create_tray<R: Runtime>(app: &tauri::AppHandle<R>) -> tauri::Result<()> {
    let quit_item = MenuItem::with_id(app, "quit", "Quit Time Tracker", true, None::<&str>)?;
    let show_item = MenuItem::with_id(app, "show", "Show Window", true, None::<&str>)?;
    let start_item = MenuItem::with_id(app, "start", "Start Timer", true, None::<&str>)?;
    let pause_item = MenuItem::with_id(app, "pause", "Pause Timer", true, None::<&str>)?;
    let end_item = MenuItem::with_id(app, "end", "End Session", true, None::<&str>)?;

    let menu = Menu::with_items(
        app,
        &[&show_item, &start_item, &pause_item, &end_item, &quit_item],
    )?;

    let _tray = TrayIconBuilder::with_id("main")
        .menu(&menu)
        .icon(app.default_window_icon().unwrap().clone())
        .show_menu_on_left_click(true)
        .on_menu_event(move |app, event| match event.id.as_ref() {
            "quit" => {
                app.exit(0);
            }
            "show" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            "start" => {
                let _ = app.emit("tray-start-timer", ());
            }
            "pause" => {
                let _ = app.emit("tray-pause-timer", ());
            }
            "resume" => {
                let _ = app.emit("tray-resume-timer", ());
            }
            "end" => {
                let _ = app.emit("tray-end-timer", ());
            }
            _ => {}
        })
        .build(app)?;

    Ok(())
}

pub fn update_tray_menu<R: Runtime>(
    app: &tauri::AppHandle<R>,
    is_running: bool,
    is_paused: bool,
    elapsed_seconds: i64,
) -> tauri::Result<()> {
    let hours = elapsed_seconds / 3600;
    let minutes = (elapsed_seconds % 3600) / 60;
    let time_label = if is_running {
        format!("⏱ {}h {}m", hours, minutes)
    } else {
        "⏱ No active session".to_string()
    };
    let time_item = MenuItem::with_id(app, "time", &time_label, false, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "quit", "Quit Time Tracker", true, None::<&str>)?;
    let show_item = MenuItem::with_id(app, "show", "Show Window", true, None::<&str>)?;

    let menu = if !is_running {
        let start_item = MenuItem::with_id(app, "start", "▶️ Start Timer", true, None::<&str>)?;
        Menu::with_items(app, &[&time_item, &show_item, &start_item, &quit_item])?
    } else if is_paused {
        let resume_item = MenuItem::with_id(app, "resume", "▶️ Resume Timer", true, None::<&str>)?;
        let end_item = MenuItem::with_id(app, "end", "⏹ End Session", true, None::<&str>)?;
        Menu::with_items(app, &[&time_item, &show_item, &resume_item, &end_item, &quit_item])?
    } else {
        let pause_item = MenuItem::with_id(app, "pause", "⏸ Pause Timer", true, None::<&str>)?;
        let end_item = MenuItem::with_id(app, "end", "⏹ End Session", true, None::<&str>)?;
        Menu::with_items(app, &[&time_item, &show_item, &pause_item, &end_item, &quit_item])?
    };

    // Get the main tray icon by ID and update it
    if let Some(tray) = app.tray_by_id("main") {
        tray.set_menu(Some(menu))?;
    }

    Ok(())
}
