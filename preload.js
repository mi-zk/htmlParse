// preload.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  analyzeProject: async (dirPath) => {
    // ローディング開始通知
    window.dispatchEvent(new Event("loading-start"));
    const result = await ipcRenderer.invoke("analyze-project", dirPath);
    // ローディング終了通知
    window.dispatchEvent(new Event("loading-end"));
    return result;
  },

  // タグ＋属性文字列を置換する
  replaceTag: async (target, replacement, dir) => {
    window.dispatchEvent(new Event("loading-start"));
    const ok = await ipcRenderer.invoke("replace-tag", { target, replacement, dir });
    window.dispatchEvent(new Event("loading-end"));
    return ok;
  },
  // フォルダ選択
  selectDir: () => ipcRenderer.invoke("select-dir"),
  // ダイアログ
  showDialog: (msg) => ipcRenderer.invoke("show-dialog", msg),
});
