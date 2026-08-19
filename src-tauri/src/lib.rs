#[cfg(target_os = "windows")]
#[link(name = "user32")]
extern "system" {
    fn GetForegroundWindow() -> *mut std::ffi::c_void;
    fn GetWindowTextLengthW(window: *mut std::ffi::c_void) -> i32;
    fn GetWindowTextW(window: *mut std::ffi::c_void, text: *mut u16, max_count: i32) -> i32;
}

/// Returns the title of the currently focused desktop window. Browser window
/// titles include the active tab title, which gives the frontend a useful,
/// privacy-conscious signal without reading history or page contents.
#[tauri::command]
fn get_foreground_window_title() -> String {
    #[cfg(target_os = "windows")]
    unsafe {
        let window = GetForegroundWindow();
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

        return String::from_utf16_lossy(&buffer[..copied as usize]);
    }

    #[cfg(not(target_os = "windows"))]
    String::new()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![get_foreground_window_title])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
