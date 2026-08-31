#[link(name = "user32")]
extern "system" {
    fn GetForegroundWindow() -> *mut std::ffi::c_void;
    fn GetWindowTextLengthW(window: *mut std::ffi::c_void) -> i32;
    fn GetWindowTextW(window: *mut std::ffi::c_void, text: *mut u16, max_count: i32) -> i32;
    fn ShowWindow(window: *mut std::ffi::c_void, command: i32) -> i32;
}

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

pub fn foreground_window_title() -> String {
    unsafe { window_title(GetForegroundWindow()) }
}

pub fn minimize_foreground_window(expected_title: &str) -> bool {
    unsafe {
        const SW_MINIMIZE: i32 = 6;
        let window = GetForegroundWindow();
        if window.is_null() || window_title(window) != expected_title {
            return false;
        }
        ShowWindow(window, SW_MINIMIZE);
        true
    }
}
