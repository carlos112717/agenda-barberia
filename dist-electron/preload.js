"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  // Función para enviar un mensaje al proceso principal y esperar una respuesta
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  invoke: (channel, data) => electron.ipcRenderer.invoke(channel, data)
});
