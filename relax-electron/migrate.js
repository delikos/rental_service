/**
 * migrate.js — Przenosi dane z localStorage do SQLite
 * 
 * Użycie:
 *   node migrate.js [plik-z-danymi.json]
 * 
 * Plik JSON powinien zawierać obiekt z kluczami localStorage:
 * {
 *   "rl2_r": "[...]",
 *   "rl2_u": "[...]",
 *   "rl2_sessions": "[...]",
 *   "rl2_prices": "...",
 *   "rl2_fleet": "...",
 *   ...
 * }
 * 
 * Jak wyeksportować z przeglądarki (Chrome DevTools Console):
 *   JSON.stringify(Object.fromEntries(
 *     Object.keys(localStorage)
 *       .filter(k => k.startsWith('rl2_'))
 *       .map(k => [k, localStorage.getItem(k)])
 *   ))
 */

const path = require('path');
const fs = require('fs');

// Determine db path
let dbPath;
if (process.platform === 'win32') {
  dbPath = path.join(process.env.APPDATA, 'relax-wypozyczalnia', 'relax.db');
} else if (process.platform === 'darwin') {
  dbPath = path.join(process.env.HOME, 'Library', 'Application Support', 'relax-wypozyczalnia', 'relax.db');
} else {
  dbPath = path.join(process.env.HOME, '.config', 'relax-wypozyczalnia', 'relax.db');
}

// Check if db exists
if (!fs.existsSync(dbPath)) {
  console.error('❌ Baza danych nie istnieje. Uruchom najpierw aplikację Electron.');
  console.error('   Szukam w:', dbPath);
  process.exit(1);
}

const Database = require('better-sqlite3');
const db = new Database(dbPath);

// Load migration data
const inputFile = process.argv[2];
if (!inputFile) {
  console.error('❌ Podaj plik z danymi: node migrate.js migration-data.json');
  process.exit(1);
}

let data;
try {
  data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
} catch (e) {
  console.error('❌ Błąd odczytu pliku:', e.message);
  process.exit(1);
}

console.log('🔄 Migracja danych...');
console.log('   Plik:', inputFile);
console.log('   Baza:', dbPath);
console.log('   Klucze:', Object.keys(data).join(', '));

const migrate = db.transaction(() => {
  // Rentals
  if (data.rl2_r) {
    try {
      const rentals = JSON.parse(data.rl2_r);
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO rentals (id, data, active, updated_at)
        VALUES (?, ?, ?, strftime('%s','now'))
      `);
      let count = 0;
      for (const r of rentals) {
        stmt.run(r.id, JSON.stringify(r), r.active ? 1 : 0);
        count++;
      }
      console.log(`   ✅ Wypożyczenia: ${count} rekordów`);
    } catch (e) {
      console.error('   ❌ Błąd migracji wypożyczeń:', e.message);
    }
  }

  // Users
  if (data.rl2_u) {
    try {
      const users = JSON.parse(data.rl2_u);
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO users (id, data, updated_at)
        VALUES (?, ?, strftime('%s','now'))
      `);
      let count = 0;
      for (const u of users) {
        stmt.run(u.id, JSON.stringify(u));
        count++;
      }
      console.log(`   ✅ Użytkownicy: ${count} rekordów`);
    } catch (e) {
      console.error('   ❌ Błąd migracji użytkowników:', e.message);
    }
  }

  // Sessions
  if (data.rl2_sessions) {
    try {
      const sessions = JSON.parse(data.rl2_sessions);
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO sessions (id, data, created_at)
        VALUES (?, ?, strftime('%s','now'))
      `);
      let count = 0;
      for (const s of sessions) {
        stmt.run(s.id, JSON.stringify(s));
        count++;
      }
      console.log(`   ✅ Sesje: ${count} rekordów`);
    } catch (e) {
      console.error('   ❌ Błąd migracji sesji:', e.message);
    }
  }

  // KV keys: prices, fleet, custom_prices, tasks, theme
  const kvKeys = ['rl2_prices', 'rl2_fleet', 'rl2_custom_prices', 'rl2_tasks', 'rl2_theme'];
  const kvStmt = db.prepare(`
    INSERT OR REPLACE INTO kv (key, value, updated_at)
    VALUES (?, ?, strftime('%s','now'))
  `);
  for (const key of kvKeys) {
    if (data[key]) {
      kvStmt.run(key, data[key]);
      console.log(`   ✅ ${key}: przeniesiono`);
    }
  }
});

try {
  migrate();
  console.log('\n✅ Migracja zakończona pomyślnie!');
  db.close();
} catch (e) {
  console.error('\n❌ Błąd migracji:', e.message);
  db.close();
  process.exit(1);
}
