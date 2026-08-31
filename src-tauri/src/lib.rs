mod commands;
mod platform;

/// Builds the native application and registers the small command surface used by Svelte.
/// Business rules stay in the frontend; these commands only expose OS capabilities.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::window_commands::get_foreground_window_title,
            commands::window_commands::minimize_foreground_window
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
