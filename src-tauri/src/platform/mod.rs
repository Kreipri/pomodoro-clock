#[cfg(target_os = "windows")]
mod windows;

#[cfg(target_os = "windows")]
pub use windows::{foreground_window_title, minimize_foreground_window};

#[cfg(not(target_os = "windows"))]
pub fn foreground_window_title() -> String {
    String::new()
}

#[cfg(not(target_os = "windows"))]
pub fn minimize_foreground_window(_expected_title: &str) -> bool {
    false
}
