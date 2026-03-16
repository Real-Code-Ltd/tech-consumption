fn main() {
    let npcap_lib_x64 = std::env::current_dir().unwrap().join("npcap-sdk").join("Lib").join("x64");
    if npcap_lib_x64.exists() {
        println!("cargo:rustc-link-search=native={}", npcap_lib_x64.display());
    }
    tauri_build::build()
}
