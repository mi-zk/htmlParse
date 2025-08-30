const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const path = require("path");
const { analyzeDirectory, refactorFiles } = require("./parser/analyze");

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: { preload: path.join(__dirname, "preload.js") },
  });
  win.loadFile("renderer/index.html");
}

app.whenReady().then(createWindow);

ipcMain.handle("select-directory", async () => {
  const result = await dialog.showOpenDialog({ properties: ["openDirectory"] });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle("analyze-directory", async (_, dir) => {
  return analyzeDirectory(dir);
});

ipcMain.handle("refactor-files", async (_, changes) => {
  return refactorFiles(changes);
});
