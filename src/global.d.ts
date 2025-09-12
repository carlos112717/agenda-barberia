// src/global.d.ts
export {};

declare global {
  interface Window {
    electronAPI: {
      invoke: (channel: string, data?: any) => Promise<any>;
    };
  }
}