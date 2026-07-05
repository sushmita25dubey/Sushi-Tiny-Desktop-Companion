const { app, BrowserWindow, screen, ipcMain, powerMonitor } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

let mainWindow;
const windowWidth = 640;
const windowHeight = 640;

// Load window bounds from disk
function loadWindowBounds() {
  const settingsPath = path.join(app.getPath('userData'), 'window-settings.json');
  try {
    if (fs.existsSync(settingsPath)) {
      const data = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      if (typeof data.x === 'number' && typeof data.y === 'number') {
        const displays = screen.getAllDisplays();
        const isVisible = displays.some(display => {
          const bounds = display.bounds;
          return (
            data.x >= bounds.x - 100 &&
            data.x <= bounds.x + bounds.width - 100 &&
            data.y >= bounds.y - 100 &&
            data.y <= bounds.y + bounds.height - 100
          );
        });
        if (isVisible) {
          return { x: data.x, y: data.y };
        } else {
          console.warn('Saved window bounds are offscreen. Resetting to default.');
        }
      }
    }
  } catch (err) {
    console.error('Failed to load window settings:', err);
  }
  return null;
}

// Save window bounds to disk with debouncing
let saveTimeout;
function saveWindowBounds(x, y) {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try {
      const settingsPath = path.join(app.getPath('userData'), 'window-settings.json');
      fs.writeFileSync(settingsPath, JSON.stringify({ x, y }, null, 2));
    } catch (err) {
      console.error('Failed to save window settings:', err);
    }
  }, 500);
}

function createWindow() {
  const savedBounds = loadWindowBounds();
  let x, y;

  if (savedBounds) {
    x = savedBounds.x;
    y = savedBounds.y;
  } else {
    // Start in bottom-right corner of the primary display's workArea (excludes taskbar)
    const primaryDisplay = screen.getPrimaryDisplay();
    const { x: dX, y: dY, width: dW, height: dH } = primaryDisplay.workArea;
    x = dX + dW - windowWidth - 20;
    y = dY + dH - windowHeight - 20;
  }

  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x: x,
    y: y,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false, // Prevents window shadow artifacts on transparent/rounded windows
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  console.log('BrowserWindow created');

  mainWindow.loadFile('index.html').then(() => {
    console.log('index.html loaded');
  }).catch(err => {
    console.error('Failed to load index.html:', err);
  });

  // Track window movements to save position
  mainWindow.on('move', () => {
    const [currX, currY] = mainWindow.getPosition();
    saveWindowBounds(currX, currY);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  console.log('Window shown');
}

// IPC Handlers
ipcMain.handle('sushi:get-stats', () => {
  return {
    cpu: 0,
    memory: 0
  };
});

ipcMain.on('sushi:close', () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

ipcMain.on('sushi:minimize', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.on('sushi:move-window', (event, { deltaX, deltaY }) => {
  if (mainWindow) {
    const [x, y] = mainWindow.getPosition();
    mainWindow.setPosition(x + deltaX, y + deltaY);
  }
});

ipcMain.handle('sushi:get-work-area', () => {
  const primaryDisplay = screen.getPrimaryDisplay();
  return primaryDisplay.workArea;
});

ipcMain.handle('sushi:get-window-position', () => {
  if (mainWindow) {
    return mainWindow.getPosition();
  }
  return [0, 0];
});

app.whenReady().then(() => {
  console.log('Electron started');
  createWindow();

  // Monitor system-wide inactivity (keyboard/mouse idle for 2 minutes)
  let isSystemIdle = false;
  setInterval(() => {
    if (!mainWindow) return;
    try {
      const idleTime = powerMonitor.getSystemIdleTime();
      if (idleTime >= 120) { // 2 minutes (120 seconds)
        if (!isSystemIdle) {
          isSystemIdle = true;
          mainWindow.webContents.send('sushi:system-sleep');
        }
      } else {
        if (isSystemIdle) {
          isSystemIdle = false;
          mainWindow.webContents.send('sushi:system-wake');
        }
      }
    } catch (err) {
      console.error('Failed to query system idle time:', err);
    }
  }, 5000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
