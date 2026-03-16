use std::fs::OpenOptions;
use std::io::Write;
use std::path::PathBuf;
use std::time::Duration;
use tauri::Manager;
use tokio::time;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
struct AppUsage {
    app_executable: String,
    app_title: String,
    category: String,
    timestamp: String,
}

fn categorize_app(app_name: &str) -> String {
    let lower = app_name.to_lowercase();
    if lower.contains("code") || lower.contains("studio") || lower.contains("idea") {
        "Development Environment".to_string()
    } else if lower.contains("chrome") || lower.contains("edge") || lower.contains("firefox") || lower.contains("brave") {
        "Web Browser".to_string()
    } else if lower.contains("word") || lower.contains("excel") || lower.contains("powerpoint") || lower.contains("notes") {
        "Office Software".to_string()
    } else if lower.contains("photoshop") || lower.contains("illustrator") || lower.contains("figma") {
        "Design Tools".to_string()
    } else {
        "Other".to_string()
    }
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn get_usage_data(app: tauri::AppHandle) -> Result<String, String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let log_file = app_dir.join("app_usage.jsonl");
    Ok(std::fs::read_to_string(log_file).unwrap_or_else(|_| "".to_string()))
}

#[tauri::command]
fn get_network_data(app: tauri::AppHandle) -> Result<String, String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let net_log_file = app_dir.join("network_calls.jsonl");
    Ok(std::fs::read_to_string(net_log_file).unwrap_or_else(|_| "".to_string()))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let app_dir = app.path().app_data_dir().unwrap_or_else(|_| PathBuf::from("."));
            let log_dir = app_dir.clone();
            std::fs::create_dir_all(&log_dir).unwrap();
            let log_file = log_dir.join("app_usage.jsonl");

            tauri::async_runtime::spawn(async move {
                let mut interval = time::interval(Duration::from_secs(10));
                loop {
                    interval.tick().await;
                    if let Ok(active_window) = active_win_pos_rs::get_active_window() {
                        let usage = AppUsage {
                            app_executable: active_window.process_path.display().to_string(),
                            app_title: active_window.title,
                            category: categorize_app(&active_window.app_name),
                            timestamp: chrono::Utc::now().to_rfc3339(),
                        };
                        
                        if let Ok(json) = serde_json::to_string(&usage) {
                            if let Ok(mut file) = OpenOptions::new().create(true).append(true).open(&log_file) {
                                let _ = writeln!(file, "{}", json);
                            }
                        }
                    }
                }
            });

            // Start PCAP Network Monitor
            let net_log_file = log_dir.join("network_calls.jsonl");
            std::thread::spawn(move || {
                let device = match pcap::Device::lookup() {
                    Ok(Some(dev)) => dev,
                    _ => return,
                };
                
                if let Ok(mut cap) = pcap::Capture::from_device(device).unwrap().promisc(true).snaplen(1500).open() {
                    if cap.filter("tcp port 443", true).is_ok() {
                        while let Ok(packet) = cap.next_packet() {
                            let data = packet.data;
                            // Simple byte search for known AI domains in plaintext (TLS SNI)
                            let ai_domains = ["api.anthropic.com", "api.openai.com", "gemini.google.com"];
                            for domain in ai_domains {
                                if data.windows(domain.len()).any(|w| w == domain.as_bytes()) {
                                    #[derive(Serialize)]
                                    struct NetworkCall {
                                        domain: String,
                                        timestamp: String,
                                    }
                                    let call = NetworkCall {
                                        domain: domain.to_string(),
                                        timestamp: chrono::Utc::now().to_rfc3339(),
                                    };
                                    if let Ok(json) = serde_json::to_string(&call) {
                                        if let Ok(mut file) = OpenOptions::new().create(true).append(true).open(&net_log_file) {
                                            let _ = writeln!(file, "{}", json);
                                        }
                                    }
                                    break;
                                }
                            }
                        }
                    }
                }
            });

            Ok(())
        })
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, get_usage_data, get_network_data])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
