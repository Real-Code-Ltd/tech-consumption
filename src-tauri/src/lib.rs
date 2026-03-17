use std::fs::OpenOptions;
use std::io::Write;
use std::path::PathBuf;
use std::collections::HashMap;
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

#[derive(Serialize, Deserialize, Debug, Clone)]
struct NetworkApiCalls {
    #[allow(non_snake_case)]
    gCO2_per_call: f64,
    wh_per_call: f64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct BaseMetrics {
    network_api_calls: NetworkApiCalls,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct CategoryRule {
    description: String,
    #[allow(non_snake_case)]
    gCO2_per_active_hour: f64,
    wh_per_active_hour: f64,
    keywords: Vec<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct EnvConfig {
    base_metrics: BaseMetrics,
    category_rules: HashMap<String, CategoryRule>,
}

impl Default for EnvConfig {
    fn default() -> Self {
        let mut rules = HashMap::new();
        rules.insert("Development Environment".to_string(), CategoryRule {
            description: "Heavy compute, intensive compiler and indexing CPU bounds.".to_string(),
            gCO2_per_active_hour: 15.0,
            wh_per_active_hour: 35.0,
            keywords: vec!["code".to_string(), "studio".to_string(), "idea".to_string(), "windsurf".to_string(), "antigravity".to_string(), "pycharm".to_string(), "eclipse".to_string()],
        });
        rules.insert("Web Browser".to_string(), CategoryRule {
            description: "Moderate compute, network heavy.".to_string(),
            gCO2_per_active_hour: 8.0,
            wh_per_active_hour: 18.0,
            keywords: vec!["chrome".to_string(), "edge".to_string(), "firefox".to_string(), "brave".to_string(), "safari".to_string()],
        });
        rules.insert("Design Tools".to_string(), CategoryRule {
            description: "Heavy GPU compute.".to_string(),
            gCO2_per_active_hour: 22.0,
            wh_per_active_hour: 45.0,
            keywords: vec!["photoshop".to_string(), "illustrator".to_string(), "figma".to_string(), "blender".to_string()],
        });
        rules.insert("Office Software".to_string(), CategoryRule {
            description: "Light compute, minimal battery impact.".to_string(),
            gCO2_per_active_hour: 4.0,
            wh_per_active_hour: 10.0,
            keywords: vec!["word".to_string(), "excel".to_string(), "powerpoint".to_string(), "notes".to_string(), "libreoffice".to_string(), "notepad".to_string()],
        });
        rules.insert("Communication".to_string(), CategoryRule {
            description: "Network streaming and background processing.".to_string(),
            gCO2_per_active_hour: 6.0,
            wh_per_active_hour: 15.0,
            keywords: vec!["discord".to_string(), "teams".to_string(), "slack".to_string(), "whatsapp".to_string()],
        });
        rules.insert("Media Player".to_string(), CategoryRule {
            description: "Audio/Video decoding and streaming.".to_string(),
            gCO2_per_active_hour: 7.0,
            wh_per_active_hour: 16.0,
            keywords: vec!["vlc".to_string(), "spotify".to_string(), "windows media player".to_string()],
        });
        rules.insert("Game Client".to_string(), CategoryRule {
            description: "Background downloading and DRM.".to_string(),
            gCO2_per_active_hour: 5.0,
            wh_per_active_hour: 12.0,
            keywords: vec!["steam".to_string(), "epic games".to_string(), "battle.net".to_string()],
        });
        rules.insert("System Utilities".to_string(), CategoryRule {
            description: "Core OS functions and file management.".to_string(),
            gCO2_per_active_hour: 2.0,
            wh_per_active_hour: 5.0,
            keywords: vec!["task manager".to_string(), "file explorer".to_string(), "explorer.exe".to_string()],
        });
        rules.insert("Security".to_string(), CategoryRule {
            description: "Background scanning and monitoring.".to_string(),
            gCO2_per_active_hour: 9.0,
            wh_per_active_hour: 20.0,
            keywords: vec!["windows security".to_string(), "malwarebytes".to_string()],
        });
        rules.insert("Other".to_string(), CategoryRule {
            description: "Base tracking for unknown software.".to_string(),
            gCO2_per_active_hour: 5.0,
            wh_per_active_hour: 12.0,
            keywords: vec![],
        });
        rules.insert("Other".to_string(), CategoryRule {
            description: "Base tracking for unknown software.".to_string(),
            gCO2_per_active_hour: 5.0,
            wh_per_active_hour: 12.0,
            keywords: vec![],
        });

        EnvConfig {
            base_metrics: BaseMetrics {
                network_api_calls: NetworkApiCalls {
                    gCO2_per_call: 4.3,
                    wh_per_call: 3.0,
                }
            },
            category_rules: rules,
        }
    }
}

fn categorize_app(app_name: &str, rules: &HashMap<String, CategoryRule>) -> String {
    let lower = app_name.to_lowercase();
    for (category, rule) in rules {
        if category == "Other" { continue; }
        for keyword in &rule.keywords {
            if lower.contains(keyword) {
                return category.clone();
            }
        }
    }
    "Other".to_string()
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

#[tauri::command]
fn get_config(app: tauri::AppHandle) -> Result<String, String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let config_file = app_dir.join("categories.json");
    if config_file.exists() {
        Ok(std::fs::read_to_string(config_file).unwrap_or_else(|_| "".to_string()))
    } else {
        Ok(serde_json::to_string_pretty(&EnvConfig::default()).unwrap())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let app_dir = app.path().app_data_dir().unwrap_or_else(|_| PathBuf::from("."));
            let log_dir = app_dir.clone();
            std::fs::create_dir_all(&log_dir).unwrap();
            
            let config_file = app_dir.join("categories.json");
            let mut env_config = EnvConfig::default();
            
            if !config_file.exists() {
                if let Ok(json) = serde_json::to_string_pretty(&env_config) {
                    let _ = std::fs::write(&config_file, json);
                }
            } else {
                if let Ok(content) = std::fs::read_to_string(&config_file) {
                    if let Ok(parsed) = serde_json::from_str::<EnvConfig>(&content) {
                        env_config = parsed;
                    }
                }
            }
            let rules_for_monitoring = env_config.category_rules.clone();

            let log_file = log_dir.join("app_usage.jsonl");

            tauri::async_runtime::spawn(async move {
                let mut interval = time::interval(Duration::from_secs(10));
                loop {
                    interval.tick().await;
                    if let Ok(active_window) = active_win_pos_rs::get_active_window() {
                        let usage = AppUsage {
                            app_executable: active_window.process_path.display().to_string(),
                            app_title: active_window.title,
                            category: categorize_app(&active_window.app_name, &rules_for_monitoring),
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
        .invoke_handler(tauri::generate_handler![greet, get_usage_data, get_network_data, get_config])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
