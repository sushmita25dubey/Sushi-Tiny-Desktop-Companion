# Sushi Companion

A Windows desktop companion application featuring a beautiful glassmorphic Sushi virtual widget and a system resource monitor.

Built using **Electron, HTML5, CSS3, and JavaScript**.

---

## Features

- **Transparent Frameless Window**: The widget floats seamlessly on your desktop with zero window borders.
- **Always on Top**: Stays above other active windows so you can keep track of stats and your sushi companion.
- **Taskbar Excluded**: Does not clutter the taskbar (`skipTaskbar` is enabled).
- **Fixed Dimensions**: Fixed resizable sizing (`280x340`) that sits elegantly in a corner.
- **Bottom-Right Alignment**: Calculates primary display bounds on first launch to align in the bottom-right corner.
- **Draggable & Persisted Position**: Drag the widget anywhere by its body; its coordinates are saved to `window-settings.json` and restored on the next run.
- **System Stat Monitor**: Standard Node API polls CPU and memory usage and displays it live in the widget.
- **Interactive Metrics**: Keep the sushi companion fresh (fan to restore freshness, feed wasabi to spice up).

---

## Directory Structure

```
Sushi/
├── assets/             # Project asset resources
├── css/
│   └── style.css       # Glassmorphism widgets, panels, and CSS sushi vector graphics
├── js/                 # Supporting script files
├── main.js             # Electron main process (IPC handlers, storage, window sizing)
├── preload.js          # Electron preload script (secure contextBridge exposing APIs)
├── renderer.js         # Frontend controller (UI actions, stats polling, and freshness loop)
├── index.html          # Main HTML structure with descriptive SEO headers and tags
├── package.json        # Project details, entrypoint definitions, and dependencies
└── README.md           # Documentation
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) (v16+ recommended)
- Windows (compatible with macOS/Linux, though taskbar settings are tailored for Windows)

### Installation

1. Open PowerShell/terminal in the project root:
   ```powershell
   cd c:\Users\user\Desktop\Sushi
   ```

2. Install dependencies:
   ```powershell
   npm install
   ```

3. Run the application:
   ```powershell
   npm start
   ```

---

## Implementation Details

- **Window State Retention**: On window `move` event triggers, the coordinates `(x, y)` are saved with a `500ms` debounce to avoid disk write congestion.
- **Stats Collection**: Uses the standard Node.js `os` module to compute CPU utilization (by comparing tick differences over a 1-second interval) and memory ratios without using external native module dependencies.
- **Draggability**: Managed by `-webkit-app-region: drag` rules on the main container. Interactive targets (buttons, navigations) use `-webkit-app-region: no-drag` so cursor events continue to fire.
