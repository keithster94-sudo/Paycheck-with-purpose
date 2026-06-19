# Builder OS

A mobile-first daily operating system for a busy person building multiple ventures. Tracks your daily stats, priorities, health habits, ventures, and long-term goals — all from your phone, with no internet required.

---

## How to Open Locally

1. Download or clone this repository to your computer.
2. Open the `index.html` file directly in any modern browser (Chrome, Safari, Firefox, Edge).
3. No server or installation needed — it runs entirely in your browser.

To open it from the terminal:
```
open index.html        # macOS
start index.html       # Windows
xdg-open index.html    # Linux
```

---

## How to Save to Your iPhone Home Screen

This app is designed to work as a home-screen app on iPhone Safari.

1. Open `index.html` in **Safari** on your iPhone (other browsers do not support this).
2. Tap the **Share** button (the box with an arrow pointing up at the bottom of the screen).
3. Scroll down in the share sheet and tap **"Add to Home Screen"**.
4. Change the name to **Builder OS** if needed, then tap **Add**.
5. The app icon will appear on your home screen.

When you open it from the home screen, it launches full-screen with no browser chrome — it feels like a native app.

> **Tip:** For a custom icon, save a square image as `icon-192.png` and `icon-512.png` in the same folder as `index.html` before adding to your home screen.

---

## What localStorage Means

Builder OS stores all your data using **localStorage** — a feature built into every modern browser that saves information directly on your device.

What this means for you:

- **Private** — Your data never leaves your phone or computer. Nothing is sent to any server.
- **Persistent** — Data stays saved even after you close the browser or restart your phone.
- **Device-specific** — Data is tied to the browser on that device. It will not sync to other devices automatically.
- **Not backed up** — If you clear your browser's site data, your entries will be gone.

**How to protect your data:**
- Use the **Export Text** button to copy your daily entry and paste it into Notes, email, or another app.
- Do this regularly if the data matters to you.

---

## Sections

| Section | Purpose |
|---|---|
| **Daily Builder Sheet** | Log sleep, energy, pain, stress, and focus each morning |
| **Capacity Check** | Rate how much bandwidth you actually have today |
| **Top 3 Priorities** | Lock in the three things that must get done |
| **Health Check** | Mark off water, walk, stretch, and healthy meals |
| **Venture Check** | Note which ventures you touched today |
| **Evening Review** | Reflect on your win, challenge, lesson, and tomorrow's focus |
| **Weekly Review** | Zoom out — review the week and set next week's direction |
| **Master Dashboard** | Track progress on your biggest long-term goals |

---

## Buttons

- **Save Entry** — Saves the current day's data. Do this before switching dates.
- **Clear Today** — Wipes the current day's entry (asks for confirmation first).
- **Export Text** — Copies your full daily entry as formatted text to the clipboard.

---

## Future Upgrades

- **Cloud sync** — Store data in a backend database so it syncs between phone and computer.
- **Daily reminders** — Push notifications to prompt you to fill in your Builder Sheet each morning.
- **Trends and charts** — Visualize energy, stress, and focus over weeks and months.
- **Weekly report export** — Generate a formatted PDF or email summary of the week.
- **Dark/light theme toggle** — Option to switch to a light mode.
- **Goal milestone steps** — Break each Dashboard goal into smaller checkable milestones.
- **AI insights** — Surface patterns and suggestions based on your logged data.
- **Password lock** — Add a PIN or Face ID lock to protect the app on shared devices.
- **Multi-device sync** — Real-time sync across iPhone, iPad, and desktop.
