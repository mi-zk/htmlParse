const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  analyzeProject: () => ipcRenderer.invoke("analyze-project"),
});
