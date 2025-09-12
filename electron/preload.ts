// electron/preload.ts
import { contextBridge, ipcRenderer } from 'electron';

// Expone funciones seguras al proceso de renderizado (nuestra app React)
contextBridge.exposeInMainWorld('electronAPI', {
  // Función para enviar un mensaje al proceso principal y esperar una respuesta
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  invoke: (channel: string, data: any) => ipcRenderer.invoke(channel, data),
});