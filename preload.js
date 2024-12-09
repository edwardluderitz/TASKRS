/* PRELOAD.JS */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel, data) => {
      let validChannels = ['toggle-always-on-top', 'app-closed'];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    },
    on: (channel, func) => {
      let validChannels = ['app-close'];
      if (validChannels.includes(channel)) {
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    },
    invoke: (channel, args) => {
      if (channel === 'select-directory') {
        return ipcRenderer.invoke(channel, args);
      }
    }
  }
});