const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('sushiAPI', {
  getStats: () => ipcRenderer.invoke('sushi:get-stats'),
  close: () => ipcRenderer.send('sushi:close'),
  minimize: () => ipcRenderer.send('sushi:minimize'),
  moveWindow: (deltaX, deltaY) => ipcRenderer.send('sushi:move-window', { deltaX, deltaY }),
  getWorkArea: () => ipcRenderer.invoke('sushi:get-work-area'),
  getWindowPosition: () => ipcRenderer.invoke('sushi:get-window-position'),
  onSystemSleep: (callback) => ipcRenderer.on('sushi:system-sleep', callback),
  onSystemWake: (callback) => ipcRenderer.on('sushi:system-wake', callback)
});

console.log('preload loaded');
