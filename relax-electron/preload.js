const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getData:      ()          => ipcRenderer.invoke('db:getData'),
  saveRentals:  (json)      => ipcRenderer.invoke('db:saveRentals', json),
  saveUsers:    (json)      => ipcRenderer.invoke('db:saveUsers', json),
  saveSessions: (json)      => ipcRenderer.invoke('db:saveSessions', json),
  kvGet:        (key)       => ipcRenderer.invoke('db:kvGet', key),
  kvSet:        (key, val)  => ipcRenderer.invoke('db:kvSet', key, val),
  generatePDF:  (name)      => ipcRenderer.invoke('win:generatePDF', name),
  savePDF:      (html, name)=> ipcRenderer.invoke('win:savePDF', html, name),
  focusWindow:     ()       => ipcRenderer.send('focus-window'),
  forceFocusWindow:()       => ipcRenderer.send('force-focus-window'),
  relaunch:        ()       => ipcRenderer.send('app:relaunch'),
  saveZipBackup:   (fn,buf) => ipcRenderer.invoke('db:saveZipBackup', fn, buf),
  hashPw:       (pw)        => ipcRenderer.invoke('auth:hashPw', pw),
  verifyPw:     (pw, hash)  => ipcRenderer.invoke('auth:verifyPw', pw, hash),
  minimize:     ()          => ipcRenderer.invoke('win:minimize'),
  maximize:     ()          => ipcRenderer.invoke('win:maximize'),
  close:        ()          => ipcRenderer.invoke('win:close'),
});
