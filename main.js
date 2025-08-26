const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const parser = require("./parser");

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  win.loadFile("index.html");
}

// クラス抽出リクエスト
ipcMain.handle("extract-classes", async (event, dir) => {
  const result = await parser.extractClasses(dir);
  return result;
});

// クラスリネームリクエスト
ipcMain.handle("rename-class", async (event, oldName, newName) => {
  const result = await parser.renameClass(oldName, newName);
  return result;
});

app.whenReady().then(createWindow);
