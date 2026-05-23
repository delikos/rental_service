# Relax Wypożyczalnia — Electron Desktop

## Instalacja (development)

```bash
cd relax-electron
npm install
npm start
```

## Budowanie instalatora

```bash
# Windows (.exe installer)
npm run build:win

# macOS (.dmg)
npm run build:mac

# Linux (.AppImage)
npm run build:linux
```

Pliki wyjściowe będą w folderze `dist/`.

## Baza danych

Aplikacja używa **SQLite** (przez `better-sqlite3`).

Lokalizacja bazy danych:
- **Windows:** `%APPDATA%\relax-wypozyczalnia\relax.db`
- **macOS:** `~/Library/Application Support/relax-wypozyczalnia/relax.db`
- **Linux:** `~/.config/relax-wypozyczalnia/relax.db`

## Migracja z localStorage

Przy pierwszym uruchomieniu aplikacja automatycznie przenosi dane z przeglądarki
do SQLite. Jeśli wcześniej używałeś wersji HTML w przeglądarce:

1. Otwórz stary plik HTML w przeglądarce (Chrome/Edge)
2. Otwórz DevTools → Application → Local Storage
3. Skopiuj wartości kluczy `rl2_*` do pliku `migration-data.json`
4. Uruchom: `node migrate.js migration-data.json`

## Struktura projektu

```
relax-electron/
├── main.js          # Electron main process (SQLite, IPC, window)
├── preload.js       # Bridge renderer ↔ main (contextBridge)
├── package.json     # Zależności i konfiguracja buildu
├── src/
│   └── index.html   # Cała aplikacja (HTML + CSS + JS)
└── assets/
    ├── icon.png     # Ikona aplikacji
    ├── icon.ico     # Ikona Windows
    └── icon.icns    # Ikona macOS
```

## Architektura

```
Renderer (index.html)
    ↓ window.electronAPI (preload.js / contextBridge)
Main Process (main.js)
    ↓ better-sqlite3
SQLite (relax.db)
```

Wszystkie operacje na bazie są synchroniczne po stronie SQLite (przez better-sqlite3),
co zapewnia spójność danych bez potrzeby zarządzania transakcjami w UI.

localStorage jest nadal synchronizowany jako backup (działa też po otwarciu
index.html bezpośrednio w przeglądarce bez Electrona).
