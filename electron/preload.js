const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('macbrewNative', {
  isNative: true,
  platform: process.platform,

  // Check if Homebrew is installed on the host system
  checkHomebrew: () => ipcRenderer.invoke('check-homebrew'),

  // Get list of installed casks & formulas on the user's Mac
  getInstalledApps: () => ipcRenderer.invoke('get-installed-apps'),

  // Execute a Homebrew installation command directly with real-time log output
  executeBrew: (cmdString) => ipcRenderer.invoke('execute-brew', cmdString),

  // Listen for real-time output streams from running Homebrew commands
  onBrewOutput: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('brew-output', handler);
    return () => ipcRenderer.removeListener('brew-output', handler);
  },

  // Open external links safely in default macOS browser
  openExternal: (url) => ipcRenderer.invoke('open-external', url)
});
