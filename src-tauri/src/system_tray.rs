use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Emitter, Manager, Runtime,
};

pub fn create_tray<R: Runtime>(app: &tauri::AppHandle<R>) -> tauri::Result<()> {
    let quit_item = MenuItem::with_id(app, "quit", "Quit Time Tracker", true, None::<&str>)?;
    let show_item = MenuItem::with_id(app, "show", "Show Window", true, None::<&str>)?;
    let start_item = MenuItem::with_id(app, "start", "Start Timer", true, None::<&str>)?;

    let menu = Menu::with_items(
        app,
        &[&show_item, &start_item, &quit_item],
    )?;

    TrayIconBuilder::with_id("main")
        .menu(&menu)
        .icon(app.default_window_icon().unwrap().clone())
        .on_menu_event(move |app, event| {
            println!("Tray menu event: {}", event.id.as_ref());
            match event.id.as_ref() {
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
                    println!("Emitting tray-start-timer event");
                    let _ = app.emit("tray-start-timer", ());
                }
                "pause" => {
                    println!("Emitting tray-pause-timer event");
                    let _ = app.emit("tray-pause-timer", ());
                }
                "resume" => {
                    println!("Emitting tray-resume-timer event");
                    let _ = app.emit("tray-resume-timer", ());
                }
                "end" => {
                    println!("Emitting tray-end-timer event");
                    let _ = app.emit("tray-end-timer", ());
                }
                _ => {
                    println!("Unknown tray event: {}", event.id.as_ref());
                }
            }
        })
        .build(app)?;

    Ok(())
}

pub fn update_tray_menu<R: Runtime>(
    app: &tauri::AppHandle<R>,
    is_running: bool,
    is_paused: bool,
    _elapsed_seconds: i64,
) -> tauri::Result<()> {
    println!("Updating tray menu - is_running: {}, is_paused: {}", is_running, is_paused);
    
    let quit_item = MenuItem::with_id(app, "quit", "Quit Time Tracker", true, None::<&str>)?;
    let show_item = MenuItem::with_id(app, "show", "Show Window", true, None::<&str>)?;

    let menu = if !is_running {
        println!("Creating menu with Start Timer");
        let start_item = MenuItem::with_id(app, "start", "Start Timer", true, None::<&str>)?;
        Menu::with_items(app, &[&show_item, &start_item, &quit_item])?
    } else if is_paused {
        println!("Creating menu with Resume Timer");
        let resume_item = MenuItem::with_id(app, "resume", "Resume Timer", true, None::<&str>)?;
        let end_item = MenuItem::with_id(app, "end", "End Session", true, None::<&str>)?;
        Menu::with_items(app, &[&show_item, &resume_item, &end_item, &quit_item])?
    } else {
        println!("Creating menu with Pause Timer");
        let pause_item = MenuItem::with_id(app, "pause", "Pause Timer", true, None::<&str>)?;
        let end_item = MenuItem::with_id(app, "end", "End Session", true, None::<&str>)?;
        Menu::with_items(app, &[&show_item, &pause_item, &end_item, &quit_item])?
    };

    // Get the main tray icon by ID and update it
    if let Some(tray) = app.tray_by_id("main") {
        println!("Tray found, setting new menu");
        tray.set_menu(Some(menu))?;
        println!("Tray menu updated successfully");
    } else {
        println!("Warning: Tray not found!");
    }

    Ok(())
}
