const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
    const win = new BrowserWindow({
        width: 1100,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('show-open-dialog', async (event) => {
    const res = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'JSON', extensions: ['json'] }]
    });
    if (res.canceled || res.filePaths.length === 0) return null;
    const fp = res.filePaths[0];
    try {
        const content = fs.readFileSync(fp, 'utf8');
        return { path: fp, content };
    } catch (err) {
        return { error: err.message };
    }
});

ipcMain.handle('show-save-dialog', async (event, defaultPath) => {
    const res = await dialog.showSaveDialog({
        defaultPath: defaultPath || 'lootchests.json',
        filters: [{ name: 'JSON', extensions: ['json'] }]
    });
    if (res.canceled || !res.filePath) return null;
    return res.filePath;
});

ipcMain.handle('write-file', async (event, filePath, content) => {
    try {
        fs.writeFileSync(filePath, content, 'utf8');
        return { ok: true };
    } catch (err) {
        return { error: err.message };
    }
});

// Optionally: Load a file path directly (for sample or default)
ipcMain.handle('read-file', async (event, filePath) => {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return { content };
    } catch (err) {
        return { error: err.message };
    }
});
