const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  extractClasses: (dir) => ipcRenderer.invoke("extract-classes", dir),
  renameClass: (oldName, newName) => ipcRenderer.invoke("rename-class", oldName, newName),
});
