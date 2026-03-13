# Real Code Ltd - AI Environmental Tracker

**Welcome!** This application is a lightweight, background friendly desktop widget designed to help you understand the environmental impact of your daily computer usage. As artificial intelligence becomes integrated into our workflows, it's important to be aware of the energy and carbon footprint those requests generate.

Built securely by **Real Code Ltd**.

---

## 🖼️ What it Looks Like

The dashboard runs right on your desktop, grading your environmental impact in real-time. It shifts from **Green** (Low Impact) to **Red** (High Impact).

![AI Flow Tracker Dashboard](https://raw.githubusercontent.com/Real-Code-Ltd/tech-consumption/main/docs/dashboard-mockup.png)

---

## 🎯 What Does This App Do?

This app silently and securely tracks two things on your computer:
1. **The application you are currently using** (e.g., your web browser, design tool, or code editor).
2. **When your computer communicates with known AI services** (like ChatGPT, Claude, or Gemini).

It then automatically categorizes your software to calculate a highly accurate estimate of your carbon footprint (gCO₂) and energy usage (Wh).

### Example: How we Calculate Impact
We map different types of software to different energy costs. Here is an example of the configuration rulebook the app uses to determine your footprint:

```json
{
  "base_metrics": {
    "network_api_calls": {
      "gCO2_per_call": 4.3,
      "wh_per_call": 3.0
    }
  },
  "category_multipliers": {
    "Development Environment": {
      "description": "Heavy compute, intensive compiler and indexing CPU bounds.",
      "gCO2_per_active_hour": 15.0,
      "wh_per_active_hour": 35.0
    },
    "Office Software": {
      "description": "Light compute, minimal battery impact.",
      "gCO2_per_active_hour": 4.0,
      "wh_per_active_hour": 10.0
    }
  }
}
```
*In the example above, spending an hour in a Development Environment consumes roughly 3.7x more energy than an hour in standard Office Software.*

---

## 🔒 Your Privacy is Guaranteed

We understand a background tracking app sounds concerning. **This application has been designed with strict privacy guarantees built right in.** 

*   **Total Local Storage:** All data regarding what apps you use and when you access AI is stored **entirely on your own computer**.
*   **No Spying:** The app **never** sends your private usage history, chat logs, browsing history, or documents to Real Code Ltd.
*   **Passive Listening:** The app only looks at the outermost "envelope" of your internet traffic (specifically, reading the domain name like `api.openai.com`), not the "letter inside". It cannot read the content of your communications.

---

## 🚀 How to Install and Start Tracking

You do **not** need to be technical to install this! Just follow these two steps:

### Step 1: Install Npcap
The tracker needs a standard Windows tool called **Npcap** to safely monitor internet traffic envelopes. 
*   Download the free installer here: [https://npcap.com/](https://npcap.com/)
*   Run the file and click "Next" through the default options.

### Step 2: Download the Application
We automatically build the installer for you!
1. Go to our **[Releases Page](../../releases/latest)**.
2. Under "Assets", click and download `Real-Code-Ltd-AI-Tracker.msi`.
3. Double-click the downloaded file to install it. 
4. **Important:** Because the app needs to monitor your network, Windows may ask you to allow the app to run as an Administrator. Click **Yes**.

The app is now running securely on your desktop!

---

## 👤 For Developers

Want to contribute to the code? Awesome! 
Check out our [Contributing Guide](CONTRIBUTING.md) and [User Guide](USER_GUIDE.md).

```bash
# Clone the repository
git clone https://github.com/Real-Code-Ltd/tech-consumption.git

# Install dependencies
npm install

# Run the app in development mode
npm run tauri dev
```

📄 **License**: MIT License
