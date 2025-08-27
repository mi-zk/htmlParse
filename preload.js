const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  // クラス & ID 抽出
  extractAttributes: (dir) => ipcRenderer.invoke("extract-attributes", dir),

  // クラス置換
  renameClass: (oldName, newName) => ipcRenderer.invoke("rename-class", oldName, newName),

  // ID置換
  renameId: (oldId, newId) => ipcRenderer.invoke("rename-id", oldId, newId),
});
