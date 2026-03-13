# Real Code Ltd - AI Usage Tracker

![Tauri](https://img.shields.io/badge/Tauri-2.0-24c8db?logo=tauri&logoColor=fff)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=000)
![Rust](https://img.shields.io/badge/Rust-Backend-000000?logo=rust&logoColor=fff)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss&logoColor=fff)
![License](https://img.shields.io/badge/License-MIT-green.svg)

**AI Usage Tracker** is a secure, privacy-focused background service and desktop widget. It monitors what applications you use and seamlessly detects network requests to major AI providers (like OpenAI, Anthropic, and Google Gemini). It then calculates how efficiently you integrate AI into your daily workflow, presenting a dynamic color-coded dashboard.

Built by **Real Code Ltd**.

## 🌟 Key Features

*   **🔒 Complete Privacy**: All tracking data is stored strictly on your local machine using JSON files. No history or usage logs are ever transmitted externally.
*   **📊 Automatic App Categorization**: Actively polls your foreground window and automatically groups them into intuitive categories (e.g., Development, Web Browser, Office Software).
*   **🕸️ Passive Network Sniffing**: Uses `Npcap` and Rust to passively monitor port 443 TCP traffic. It identifies Server Name Indicator (SNI) records to known AI domains without an intrusive man-in-the-middle proxy or breaking end-to-end encryption.
*   **🎨 Dynamic Widget UI**: A modern React/Tailwind frontend widget that grades your AI workload intensity in real-time (Red, Amber, Green).
*   **📈 Interactive Reports**: Beautiful, interactive charts powered by Recharts showing your AI API calls mapped against active software categories.

---

## 🚀 Quick Start

### 1. Prerequisites
1. **[Npcap](https://npcap.com/)**: Required for Windows OS network packet sniffing. Download and install with default settings.
2. **[Rust](https://rustup.rs/)**: Required to compile the Tauri backend.
3. **[Node.js](https://nodejs.org/)**: Required for the frontend environment.

### 2. Installation & Development

Clone the repository:
```bash
git clone https://github.com/Real-Code-Ltd/tech-consumption.git
cd tech-consumption
```

Install frontend dependencies:
```bash
npm install
```

Run the app in development mode:
```bash
npm run tauri dev
```
> **Note:** Because the app monitors network traffic, Windows may prompt you to allow the background process administrative privileges.

### 3. Build for Production

```bash
npm run build
```

---

## 🏗️ Architecture

*   **Frontend**: React (TS), Vite, Tailwind CSS v4, Recharts, Lucide React.
*   **Backend**: Tauri v2, Rust (tokio, active-win-pos-rs, pcap).
*   **Storage**: Local `app_data_dir` JSON files (`app_usage.jsonl` and `network_calls.jsonl`).

---

## 🤝 Community & Support

We welcome contributions! Please review our community guidelines to get started:
*   [Contributing Guide](CONTRIBUTING.md)
*   [Code of Conduct](CODE_OF_CONDUCT.md)
*   [User Guide](USER_GUIDE.md)

If you encounter any issues, please check the [Issue Tracker](https://github.com/Real-Code-Ltd/tech-consumption/issues) or submit a Bug Report.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
