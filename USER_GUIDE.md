# Real Code Ltd - Tech Energy Usage: User Guide

Welcome to the **Tech Energy Usage** tracker! This guide will help you install, run, and understand how our application works on both **Windows** and **macOS**.

---

## 1. What Does this App Do?

The Tech Energy Usage tracker is a lightweight background application and desktop widget. It helps you understand the environmental impact and energy usage of your AI consumption. It does this by securely monitoring:
1. **The application you are currently using** (e.g., your web browser, design tool, or code editor) — on all platforms.
2. **When your computer communicates with known AI services** (like ChatGPT, Claude, or Gemini) — **Windows only**, see the platform table below.

The widget then calculates your carbon footprint and energy usage, displaying a dynamic color status:
*   🟢 **Green:** Low Environmental Impact (optimal workflow with minimal AI excess).
*   🟡 **Amber:** Moderate Environmental Impact.
*   🔴 **Red:** High Environmental Impact (heavy AI reliance driving up energy consumption).

### Platform Feature Comparison

| Feature | Windows | macOS |
|---|---|---|
| Active window tracking | ✅ | ✅ |
| App category breakdown | ✅ | ✅ |
| Energy & carbon estimates | ✅ | ✅ |
| System tray icon | ✅ | ✅ |
| Settings & always-on-top | ✅ | ✅ |
| AI / network call tracking | ✅ (requires admin) | ❌ |

---

## 2. Installation and Setup

### Windows

#### Step 1: Install Npcap
Because the tracker needs to gently "listen" to network traffic to detect AI usage, it requires a safe, standard Windows networking component called **Npcap**.
1. Download the free Npcap installer from: [https://npcap.com/](https://npcap.com/)
2. Run the downloaded installer. You can leave all the default options checked and click "Next" until it finishes.

#### Step 2: Install the App
1. Go to the **[Releases Page](../../releases/latest)** and download the `.msi` file.
2. Double-click the installer and follow the on-screen prompts.

#### Step 3: First Launch
1. Open the application from your Start Menu or Desktop shortcut.
2. **Important:** Because the app monitors network traffic to detect AI usage, Windows may ask you to allow it to run with **Administrator Privileges**. Click **Yes** when prompted.
3. The app will launch as a widget on your desktop and automatically begin tracking. It will start automatically when you turn on your computer.

---

### macOS

#### Step 1: Install the App
1. Go to the **[Releases Page](../../releases/latest)** and download the `.dmg` file.
2. Open the `.dmg` and drag **Tech energy usage** into your **Applications** folder.

#### Step 2: Open the App (Gatekeeper Warning)
Because the app is not distributed via the Mac App Store, macOS will block it on first launch with a message like *"cannot be opened because the developer cannot be verified"*.

To open it:
1. **Do not double-click** the app icon.
2. **Right-click** (or Control-click) the app icon in Applications and select **Open**.
3. In the dialog that appears, click **Open** again.

You only need to do this once — after that the app opens normally.

#### Step 3: First Launch
The app will appear in your menu bar (top-right area of your screen). Click the icon to open the dashboard. It will start automatically when you log in.

> **Note:** AI/network call tracking is not available on macOS. The AI call counter will remain at zero — all other features (energy tracking, category breakdown, system tray, settings) work fully.

---

## 3. Your Privacy is Our Priority

We understand that a background tracking app can sound concerning. **Real Code Ltd has designed this application with strict privacy guarantees built into its core.**

### Everything Stays on Your Machine
*   **Total Local Storage:** All data regarding what apps you use, how long you use them, and when you access AI services is stored **entirely on your own computer** in local, private files.
*   **No Spying:** The app **never** sends your private usage history, chat logs, browsing history, or documents to Real Code Ltd, your employer, or any other external server.

### How Does it Watch the Network? (Windows only)
*   The app uses "passive network sniffing." This means it only looks at the "envelope" of your internet traffic (specifically, the domain names like `api.openai.com`), not the "letter inside."
*   It cannot and does not read the contents of your secure communications, messages, or files. It is simply counting the number of times your computer knocks on the door of an AI service provider.

---

## 4. Understanding Your Dashboard

Once running, you can open the widget to view your personalized dashboard:
*   **Active Time:** Total time tracked in the current session.
*   **Carbon Footprint:** An estimate of the gCO₂ emitted based on your app usage (and AI queries on Windows).
*   **Estimated Energy:** An approximation of the Watt-hours (Wh) your usage has consumed.
*   **Active Time by Category:** A graph showing time spent across app categories.
*   **App Category Breakdown:** Time, estimated Wh, and gCO₂ per category of software.

---

## 5. Customising App Categories

The app determines the category of your active software by reading a `categories.json` file automatically generated in your App Data directory:

*   **Windows:** `%LOCALAPPDATA%\com.realcodeltd.techenergyusage\categories.json`
*   **macOS:** `~/Library/Application Support/com.realcodeltd.techenergyusage/categories.json`

By default, it categorizes your software by checking the active window's process name and title against these predefined keywords:
*   **Development Environment:** `code`, `studio`, `idea`, `windsurf`, `antigravity`, `pycharm`, `eclipse`
*   **Web Browser:** `chrome`, `edge`, `firefox`, `brave`, `safari`
*   **Office Software:** `word`, `excel`, `powerpoint`, `notes`, `libreoffice`, `notepad`
*   **Design Tools:** `photoshop`, `illustrator`, `figma`, `blender`
*   **Communication:** `discord`, `teams`, `slack`, `whatsapp`
*   **Media Player:** `vlc`, `spotify`, `windows media player`
*   **Game Client:** `steam`, `epic games`, `battle.net`
*   **System Utilities:** `task manager`, `file explorer`, `explorer.exe`
*   **Security:** `windows security`, `malwarebytes`
*   **Other:** Any application that does not match the above keywords.

**How to customize:**
1. Open the app at least once so it generates the default `categories.json` file.
2. Navigate to your App Data directory (paths above).
3. Open `categories.json` in any text editor.
4. Add new keywords, adjust the environmental multipliers (`gCO2_per_active_hour`, `wh_per_active_hour`), or define entirely new categories to perfectly match your workflow.
5. Completely restart the Tech Energy Usage app for the changes to take effect.

You can also edit keywords directly from within the app via the **Settings panel** (gear icon in the title bar).

---

*If you have any questions or encounter issues, please contact the Real Code Ltd support team.*
