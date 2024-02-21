/* PRELOAD.JS */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel, data) => {
      let validChannels = ['toggle-always-on-top'];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    }
  }
});
