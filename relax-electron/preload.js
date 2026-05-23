const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getData:      ()          => ipcRenderer.invoke('db:getData'),
  saveRentals:  (json)      => ipcRenderer.invoke('db:saveRentals', json),
  saveUsers:    (json)      => ipcRenderer.invoke('db:saveUsers', json),
  saveSessions: (json)      => ipcRenderer.invoke('db:saveSessions', json),
  kvGet:        (key)       => ipcRenderer.invoke('db:kvGet', key),
  kvSet:        (key, val)  => ipcRenderer.invoke('db:kvSet', key, val),
  minimize:     ()          => ipcRenderer.invoke('win:minimize'),
  maximize:     ()          => ipcRenderer.invoke('win:maximize'),
  close:        ()          => ipcRenderer.invoke('win:close'),
});
