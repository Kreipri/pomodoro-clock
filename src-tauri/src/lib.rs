#[cfg(target_os = "windows")]
#[link(name = "user32")]
extern "system" {
    fn GetForegroundWindow() -> *mut std::ffi::c_void;
    fn GetWindowTextLengthW(window: *mut std::ffi::c_void) -> i32;
    fn GetWindowTextW(window: *mut std::ffi::c_void, text: *mut u16, max_count: i32) -> i32;
    fn ShowWindow(window: *mut std::ffi::c_void, command: i32) -> i32;
}

#[cfg(target_os = "windows")]
unsafe fn window_title(window: *mut std::ffi::c_void) -> String {
    if window.is_null() {
        return String::new();
    }

    let length = GetWindowTextLengthW(window);
    if length <= 0 {
        return String::new();
    }

    let mut buffer = vec![0_u16; length as usize + 1];
    let copied = GetWindowTextW(window, buffer.as_mut_ptr(), buffer.len() as i32);
    if copied <= 0 {
        return String::new();
    }

    String::from_utf16_lossy(&buffer[..copied as usize])
}

/// Returns the visible title of the focused desktop window. Browser titles
/// include the active tab without exposing history, URLs, or page contents.
#[tauri::command]
fn get_foreground_window_title() -> String {
    #[cfg(target_os = "windows")]
    unsafe {
        return window_title(GetForegroundWindow());
    }

    #[cfg(not(target_os = "windows"))]
    String::new()
}

/// Minimizes the distracting foreground window only when it still has the
/// title observed by the frontend. This prevents a delayed action from
/// minimizing a different window after the user has already switched back.
#[tauri::command]
fn minimize_foreground_window(expected_title: String) -> bool {
    #[cfg(target_os = "windows")]
    unsafe {
        const SW_MINIMIZE: i32 = 6;
        let window = GetForegroundWindow();
        if window.is_null() || window_title(window) != expected_title {
            return false;
        }
        ShowWindow(window, SW_MINIMIZE);
        return true;
    }

    #[cfg(not(target_os = "windows"))]
    false
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_foreground_window_title,
            minimize_foreground_window
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
