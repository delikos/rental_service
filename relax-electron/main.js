const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');
const path = require('path');
const fs   = require('fs');

const userDataPath = app.getPath('userData');
const dbPath       = path.join(userDataPath, 'relax.db');
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

ipcMain.handle('win:savePDF', async (event, htmlContent, defaultName) => {
  const tmpPath = path.join(app.getPath('temp'), `relax_pdf_${Date.now()}.html`);
  const hidden = new BrowserWindow({ show: false, webPreferences: { nodeIntegration: false, contextIsolation: true } });
  try {
    fs.writeFileSync(tmpPath, htmlContent, 'utf8');
    await hidden.loadFile(tmpPath);
    await new Promise(resolve => hidden.webContents.once('did-finish-load', resolve));
    await new Promise(resolve => setTimeout(resolve, 400));
    const pdfData = await hidden.webContents.printToPDF({ printBackground: true, pageSize: 'A4' });
    hidden.close();
    try { fs.unlinkSync(tmpPath); } catch(_) {}
    const { filePath, canceled } = await dialog.showSaveDialog({
      defaultPath: defaultName || 'raport.pdf',
      filters: [{ name: 'PDF', extensions: ['pdf'] }]
    });
    if (canceled || !filePath) return false;
    fs.writeFileSync(filePath, Buffer.isBuffer(pdfData) ? pdfData : Buffer.from(pdfData));
    return true;
  } catch(e) {
    try { hidden.close(); } catch(_) {}
    try { fs.unlinkSync(tmpPath); } catch(_) {}
    throw e;
  }
});

ipcMain.handle('win:minimize', () => BrowserWindow.getFocusedWindow()?.minimize());
ipcMain.handle('win:maximize', () => {
  const w = BrowserWindow.getFocusedWindow();
  w?.isMaximized() ? w.unmaximize() : w?.maximize();
});
ipcMain.handle('win:close', () => BrowserWindow.getFocusedWindow()?.close());

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
  Menu.setApplicationMenu(null);
}

app.whenReady().then(async () => {
  await initDB();
  createWindow();
  app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
