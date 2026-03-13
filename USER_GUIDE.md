# Real Code Ltd - AI Usage Tracker: User Guide

Welcome to the **Real Code Ltd AI Usage Tracker**! This guide will help you install, run, and understand how our application works, with a special focus on how we protect your privacy.

---

## 1. What Does this App Do?

The AI Usage Tracker is a lightweight background application and desktop widget. It helps you understand how efficiently you integrate AI into your daily workflow. It does this by securely monitoring two things:
1. **The application you are currently using** (e.g., your web browser, design tool, or code editor).
2. **When your computer communicates with known AI services** (like ChatGPT, Claude, or Gemini).

The widget then calculates your "AI efficiency" and displays a dynamic color status:
*   🟢 **Green:** Highly efficient/optimal AI usage.
*   🟡 **Amber:** Moderate AI usage.
*   🔴 **Red:** Low AI usage or highly inefficient non-AI workflows.

---

## 2. Installation and Setup

To get the tracker running on your device, follow these simple steps:

### Prerequisite: Npcap (Windows Only)
Because the tracker needs to gently "listen" to network traffic to detect AI usage, it requires a safe, standard Windows networking component called **Npcap**.
1. Download the free Npcap installer from: [https://npcap.com/](https://npcap.com/)
2. Run the downloaded installer. You can leave all the default options checked and click "Next" until it finishes.

### Installing the AI Usage Tracker
1. Download the latest **Real Code Ltd AI Usage Tracker installer** (`.msi` or `.exe`) provided by your administrator or from the official release page.
2. Double-click the installer and follow the on-screen prompts to install the application.

### Running the App for the First Time
1. Open the application from your Start Menu or Desktop shortcut.
2. **Important:** Because the app needs to monitor network traffic to detect AI usage, Windows may ask you to allow the app to run with **Administrator Privileges**. Click **Yes** when prompted. 
3. The app will launch as a sleek widget on your desktop and automatically begin tracking in the background. It will automatically start when you turn on your computer.

---

## 3. Your Privacy is Our Priority

We understand that a background tracking app can sound concerning. **Real Code Ltd has designed this application with strict privacy guarantees built into its core.** 

Here is why you can feel completely confident using the AI Usage Tracker:

### Everything Stays on Your Machine
*   **Total Local Storage:** All data regarding what apps you use, how long you use them, and when you access AI services is stored **entirely on your own computer** in local, private files.
*   **No Spying:** The app **never** sends your private usage history, chat logs, browsing history, or documents to Real Code Ltd, your employer, or any other external server.

### What Does the App Send Over the Internet?
*   The application only makes **one** remote connection per day: it downloads a generic configuration file (containing the current estimated cost per AI call) to keep your dashboard calculations accurate. It does not send any of your personal data during this connection.

### How Does it Watch the Network?
*   The app uses "passive network sniffing." This means it only looks at the "envelope" of your internet traffic (specifically, the domain names like `api.openai.com`), not the "letter inside." 
*   It cannot and does not read the contents of your secure communications, messages, or files. It is simply counting the number of times your computer knocks on the door of an AI service provider.

---

## 4. Understanding Your Dashboard

Once running, you can open the widget to view your personalized dashboard:
*   **Recent Usage Trend:** A graph showing your AI API calls over time.
*   **App Category Breakdown:** A visual breakdown showing the percentage of time you spend in different types of software (Browsers, Development, Office tools, etc.).
*   **Estimated Cost:** An approximation of the monetary value of the AI resources you have utilized.

*If you have any questions or encounter issues, please contact the Real Code Ltd IT support team.*
