const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("bridge", {
  onLog: (callback) => ipcRenderer.on("bridge-log", (_event, lines) => callback(lines)),
});
