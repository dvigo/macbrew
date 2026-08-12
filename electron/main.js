const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { spawn, execSync } = require('child_process');
const fs = require('fs');

let mainWindow;

// Locate Homebrew binary path on macOS (Apple Silicon M1/M2/M3/M4 or Intel)
function getHomebrewPath() {
  const candidates = [
    '/opt/homebrew/bin/brew',
    '/usr/local/bin/brew',
    '/home/linuxbrew/.linuxbrew/bin/brew'
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  try {
    const whichPath = execSync('which brew', { encoding: 'utf8' }).trim();
    if (whichPath) return whichPath;
  } catch (e) {
    // ignore
  }

  return 'brew';
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 920,
    minHeight: 620,
    title: 'MacBrew',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 18, y: 18 },
    backgroundColor: '#0a0d14',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, '../index.html'));

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC Handler: Check Homebrew installation status
ipcMain.handle('check-homebrew', async () => {
  const brewPath = getHomebrewPath();
  try {
    const output = execSync(`"${brewPath}" --version`, { encoding: 'utf8' });
    return { installed: true, version: output.split('\n')[0], path: brewPath };
  } catch (err) {
    return { installed: false, error: err.message, path: brewPath };
  }
});

// IPC Handler: Get array of currently installed casks and formulas
ipcMain.handle('get-installed-apps', async () => {
  const brewPath = getHomebrewPath();
  const installed = new Set();
  try {
    const casks = execSync(`"${brewPath}" list --cask -1`, { encoding: 'utf8' });
    casks.split('\n').forEach(line => {
      if (line.trim()) installed.add(line.trim());
    });
  } catch (e) { /* ignore */ }

  try {
    const formulas = execSync(`"${brewPath}" list --formula -1`, { encoding: 'utf8' });
    formulas.split('\n').forEach(line => {
      if (line.trim()) installed.add(line.trim());
    });
  } catch (e) { /* ignore */ }

  return Array.from(installed);
});

// IPC Handler: Execute a Homebrew command and stream output
ipcMain.handle('execute-brew', async (event, cmdString) => {
  const brewPath = getHomebrewPath();
  
  // Clean command string into arguments
  const cleanCmd = cmdString.replace(/^brew\s+/, '').trim();
  const args = cleanCmd.split(/\s+/);

  return new Promise((resolve) => {
    const processEnv = { ...process.env, PATH: `/opt/homebrew/bin:/usr/local/bin:${process.env.PATH}` };
    const brewProcess = spawn(brewPath, args, { env: processEnv, shell: true });

    brewProcess.stdout.on('data', (data) => {
      if (mainWindow) {
        mainWindow.webContents.send('brew-output', { type: 'stdout', text: data.toString() });
      }
    });

    brewProcess.stderr.on('data', (data) => {
      if (mainWindow) {
        mainWindow.webContents.send('brew-output', { type: 'stderr', text: data.toString() });
      }
    });

    brewProcess.on('close', (code) => {
      if (mainWindow) {
        mainWindow.webContents.send('brew-output', { type: 'exit', code });
      }
      resolve({ success: code === 0, code });
    });

    brewProcess.on('error', (err) => {
      if (mainWindow) {
        mainWindow.webContents.send('brew-output', { type: 'error', text: err.message });
      }
      resolve({ success: false, error: err.message });
    });
  });
});

// IPC Handler: Open external link
ipcMain.handle('open-external', async (event, url) => {
  await shell.openExternal(url);
});
