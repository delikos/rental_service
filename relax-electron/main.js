const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');
const path = require('path');
const fs   = require('fs');
const crypto = require('crypto');

const userDataPath = app.getPath('userData');
const dbPath       = path.join(userDataPath, 'relax.db');
const backupDir    = path.join(userDataPath, 'backups');
let db, SQL;

// ── Init DB ──────────────────────────────────────────────────────
async function initDB() {
  SQL = await require('sql.js')();
  if (fs.existsSync(dbPath)) {
    db = new SQL.Database(fs.readFileSync(dbPath));
  } else {
    db = new SQL.Database();
  }
  db.run(`
    CREATE TABLE IF NOT EXISTS rentals  (id TEXT PRIMARY KEY, data TEXT);
    CREATE TABLE IF NOT EXISTS users    (id TEXT PRIMARY KEY, data TEXT);
    CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, data TEXT);
    CREATE TABLE IF NOT EXISTS kv       (key TEXT PRIMARY KEY, value TEXT);
  `);
  flush();
}

function flush() {
  try {
    const buf = db.export();
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    fs.writeFileSync(dbPath, Buffer.from(buf));
  } catch(e) { console.error('flush:', e); }
}

function exec(sql, params) {
  const res = db.exec(sql, params);
  return res.length ? res[0].values : [];
}

// ── Auto backup (max 5 files) ─────────────────────────────────────
function createAutoBackup() {
  try {
    if (!db || !fs.existsSync(dbPath)) return;
    flush();
    fs.mkdirSync(backupDir, { recursive: true });
    const now = new Date();
    const p = n => String(n).padStart(2, '0');
    const ts = `${now.getFullYear()}-${p(now.getMonth()+1)}-${p(now.getDate())}_${p(now.getHours())}${p(now.getMinutes())}${p(now.getSeconds())}`;
    fs.copyFileSync(dbPath, path.join(backupDir, `backup_${ts}.db`));
    const files = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('backup_') && f.endsWith('.db'))
      .sort();
    files.slice(0, Math.max(0, files.length - 5))
      .forEach(f => { try { fs.unlinkSync(path.join(backupDir, f)); } catch(_) {} });
  } catch(e) { console.error('Auto backup error:', e); }
}

// ── IPC handlers ─────────────────────────────────────────────────
ipcMain.handle('db:getData', () => {
  const rentals  = exec('SELECT data FROM rentals' ).map(r => JSON.parse(r[0]));
  const userRows = exec('SELECT data FROM users'   ).map(r => JSON.parse(r[0]));
  const sessions = exec('SELECT data FROM sessions').map(r => JSON.parse(r[0]));
  return { rentals, users: userRows.length ? userRows : null, sessions };
});

ipcMain.handle('db:saveRentals', (_, json) => {
  const items = JSON.parse(json);
  const cur   = new Set(exec('SELECT id FROM rentals').map(r => r[0]));
  const next  = new Set(items.map(r => r.id));
  for (const id of cur) if (!next.has(id)) db.run('DELETE FROM rentals WHERE id=?', [id]);
  for (const r of items) db.run('INSERT OR REPLACE INTO rentals(id,data) VALUES(?,?)', [r.id, JSON.stringify(r)]);
  flush(); return true;
});

ipcMain.handle('db:saveUsers', (_, json) => {
  for (const u of JSON.parse(json)) db.run('INSERT OR REPLACE INTO users(id,data) VALUES(?,?)', [u.id, JSON.stringify(u)]);
  flush(); return true;
});

ipcMain.handle('db:saveSessions', (_, json) => {
  for (const s of JSON.parse(json)) db.run('INSERT OR REPLACE INTO sessions(id,data) VALUES(?,?)', [s.id, JSON.stringify(s)]);
  flush(); return true;
});

ipcMain.handle('db:kvGet', (_, key) => {
  const rows = exec('SELECT value FROM kv WHERE key=?', [key]);
  return rows.length ? rows[0][0] : null;
});

ipcMain.handle('db:kvSet', (_, key, val) => {
  db.run('INSERT OR REPLACE INTO kv(key,value) VALUES(?,?)', [key, val]);
  flush(); return true;
});

ipcMain.handle('win:generatePDF', async (event, defaultName) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const { filePath, canceled } = await dialog.showSaveDialog(win, {
    title: 'Zapisz raport dzienny',
    defaultPath: defaultName || 'raport.pdf',
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  });
  if (canceled || !filePath) return false;
  try {
    const data = await win.webContents.printToPDF({ printBackground: true, marginsType: 1 });
    fs.writeFileSync(filePath, data);
    return true;
  } catch(e) {
    console.error('PDF error:', e);
    throw e;
  }
});

ipcMain.handle('win:savePDF', async (event, htmlContent, defaultName) => {
  const mainWin = BrowserWindow.fromWebContents(event.sender);
  // Show save dialog FIRST while main window still has focus
  const { filePath, canceled } = await dialog.showSaveDialog(mainWin, {
    defaultPath: defaultName || 'raport.pdf',
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  });
  if (canceled || !filePath) return false;

  // Use base64 data URL — avoids temp-file path/encoding issues on Windows
  const hidden = new BrowserWindow({
    show: false,
    width: 794, height: 1123,
    webPreferences: { nodeIntegration: false, contextIsolation: true }
  });
  try {
    const b64 = Buffer.from(htmlContent, 'utf8').toString('base64');
    await hidden.loadURL(`data:text/html;base64,${b64}`);
    await new Promise(resolve => hidden.webContents.once('did-finish-load', resolve));
    await new Promise(resolve => setTimeout(resolve, 800));
    const pdfData = await hidden.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4',
    });
    hidden.destroy();
    const buf = Buffer.isBuffer(pdfData) ? pdfData : Buffer.from(pdfData);
    if (!buf || buf.length < 100) throw new Error('PDF generation returned empty data');
    fs.writeFileSync(filePath, buf);
    return true;
  } catch(e) {
    try { hidden.destroy(); } catch(_) {}
    console.error('PDF error:', e);
    throw e;
  }
});

ipcMain.handle('win:focus', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win && !win.isDestroyed()) { win.show(); win.focus(); }
});

ipcMain.handle('auth:hashPw', (_, pw) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(pw, salt, 100000, 64, 'sha512').toString('hex');
  return 'pbkdf2:' + salt + ':' + hash;
});

ipcMain.handle('auth:verifyPw', (_, pw, stored) => {
  if (!stored || !stored.startsWith('pbkdf2:')) {
    // djb2 fallback for legacy hashes
    let h = 5381;
    for (let i = 0; i < pw.length; i++) h = ((h << 5) + h) + pw.charCodeAt(i) & 0xffffffff;
    return h.toString(16) === stored;
  }
  const [, salt, hash] = stored.split(':');
  return crypto.pbkdf2Sync(pw, salt, 100000, 64, 'sha512').toString('hex') === hash;
});

ipcMain.handle('win:minimize', (event) => BrowserWindow.fromWebContents(event.sender)?.minimize());
ipcMain.handle('win:maximize', (event) => {
  const w = BrowserWindow.fromWebContents(event.sender);
  w?.isMaximized() ? w.unmaximize() : w?.maximize();
});
ipcMain.handle('win:close', (event) => BrowserWindow.fromWebContents(event.sender)?.close());

// ── Window ────────────────────────────────────────────────────────
function createWindow() {
  const win = new BrowserWindow({
    width: 1280, height: 800, minWidth: 900, minHeight: 600,
    frame: false, backgroundColor: '#111',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadFile(path.join(__dirname, 'src', 'index.html'));
  // Restore OS focus after every page load (fixes freeze after window.location.reload())
  win.webContents.on('did-finish-load', () => {
    if (!win.isDestroyed()) win.focus();
  });
  Menu.setApplicationMenu(null);
}

app.whenReady().then(async () => {
  await initDB();
  createWindow();
  app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow(); });
});
app.on('before-quit', createAutoBackup);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
