/* MAIN.JS */

const { app, BrowserWindow, ipcMain } = require('electron');
const expressApp = require('./server.js');
const path = require('path');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 240,
        height: 300,
        minWidth: 240, 
        minHeight: 300, 
        resizable: true, 
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });
    mainWindow.loadURL('http://localhost:3000');

    mainWindow.setMenu(null);
}

ipcMain.on('toggle-always-on-top', (event, shouldSetAlwaysOnTop) => {
    mainWindow.setAlwaysOnTop(shouldSetAlwaysOnTop);
  });

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
