const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const isDev = process.env.NODE_ENV === 'development' || process.defaultApp;

let mainWindow;
let serverProcess;

const startServer = () => {
  return new Promise((resolve) => {
    if (isDev) {
      console.log(`[Main] Development mode - skipping server startup`);
      resolve();
      return;
    }

    console.log(`[Main] Starting HTTP server for production...`);
    
    // Start simple HTTP server with app path
    const serverPath = path.join(__dirname, 'server.js');
    
    // In production, out/ is next to electron/ in the packaged app
    const outPath = path.join(__dirname, '..', 'out');
    
    console.log(`[Main] Server script: ${serverPath}`);
    console.log(`[Main] Out directory: ${outPath}`);
    
    serverProcess = spawn(process.execPath, [serverPath, outPath], {
      stdio: 'inherit', // Use 'inherit' to see server logs
      detached: true,
    });

    serverProcess.on('error', (err) => {
      console.error(`[Main] Failed to start server:`, err);
    });

    console.log(`[Main] Server process started (PID: ${serverProcess.pid})`);
    serverProcess.unref();

    setTimeout(() => {
      console.log(`[Main] Waiting for server to be ready...`);
      resolve();
    }, 1000);
  });
};

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      sandbox: true,
    },
    icon: path.join(__dirname, 'assets', 'icon.ico'),
  });

  const startUrl = isDev
    ? 'http://localhost:3000'
    : 'http://localhost:3001';

  console.log(`[Main] Loading URL: ${startUrl}`);
  mainWindow.loadURL(startUrl).catch(err => {
    console.error(`[Main] Error loading URL:`, err);
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log(`[Main] Page finished loading`);
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error(`[Main] Failed to load: ${errorCode} ${errorDescription}`);
  });

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[Renderer] [${level}] ${message}`);
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

app.on('ready', async () => {
  await startServer();
  createWindow();
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    try {
      process.kill(-serverProcess.pid);
    } catch (e) {}
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Create application menu
const createMenu = () => {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About ReddiTunes',
          click: () => {
            // You can create an about window here
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};

app.whenReady().then(() => {
  createMenu();
});
