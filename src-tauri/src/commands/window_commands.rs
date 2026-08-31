/// Returns only the visible title of the focused desktop window.
#[tauri::command]
pub fn get_foreground_window_title() -> String {
    crate::platform::foreground_window_title()
}

/// The expected title prevents a delayed request from minimizing a newly focused window.
#[tauri::command]
pub fn minimize_foreground_window(expected_title: String) -> bool {
    crate::platform::minimize_foreground_window(&expected_title)
}
