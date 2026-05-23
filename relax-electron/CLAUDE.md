# CLAUDE.md — Instrukcje dla Claude Code (VS Code)

> Ten plik opisuje projekt **Relax Wypożyczalnia** — kompletny system zarządzania wypożyczalnią gokartów/rowerów/sprzętu. Przeczytaj go w całości zanim zaczniesz cokolwiek modyfikować.

---

## 1. Struktura projektu

```
relax-electron/
├── CLAUDE.md              ← ten plik
├── main.js                ← Electron main process (SQLite, okno, IPC)
├── preload.js             ← contextBridge: exposeInMainWorld('electronAPI')
├── package.json           ← zależności: electron, electron-builder, sql.js
├── migrate.js             ← jednorazowy skrypt migracji localStorage → SQLite
├── assets/
│   └── icon.png           ← ikona aplikacji (placeholder, zastąp docelową)
└── src/
    └── index.html         ← CAŁA aplikacja: HTML + CSS + JS w jednym pliku (2800+ linii)
```

---

## 2. Architektura

### Electron (desktop)
```
src/index.html  (renderer)
      ↕  window.electronAPI  (preload.js / contextBridge)
main.js         (main process)
      ↕  sql.js (WebAssembly SQLite)
relax.db        (%APPDATA%/relax-wypozyczalnia/relax.db)
```

### Standalone HTML (przeglądarka)
`src/index.html` działa też bez Electrona — dane trafiają do `localStorage`.

### IAPI — warstwa abstrakcji danych
```js
const IAPI = (() => {
  const E = typeof window.electronAPI !== 'undefined' ? window.electronAPI : null;
  // E !== null → Electron (SQLite)
  // E === null → przeglądarka (localStorage)
})()
```
**ZAWSZE** używaj `IAPI.*` do zapisu/odczytu danych. Nigdy nie pisz bezpośrednio `localStorage.setItem` dla kluczy `rl2_*` (z wyjątkiem `rl2_report_categories` i `rl2_pdf_fields` które używają `localStorage` bezpośrednio — to jest świadoma decyzja).

---

## 3. Klucze danych (localStorage / SQLite)

| Klucz | Typ | Opis |
|-------|-----|------|
| `rl2_r` | `Rental[]` | Wszystkie wypożyczenia (aktywne i historia) |
| `rl2_u` | `User[]` | Użytkownicy systemu |
| `rl2_sessions` | `Session[]` | Sesje logowania |
| `rl2_prices` | `PriceConfig` | Ceny gokartów i rowerów |
| `rl2_fleet` | `FleetVehicle[]` | Lista pojazdów |
| `rl2_custom_prices` | `CustomPricesMap` | Ceny custom typów sprzętu |
| `rl2_tasks` | `Task[]` | Zadania/usterki |
| `rl2_theme` | `'dark'/'light'` | Motyw kolorystyczny |
| `rl2_report_categories` | `ReportCat[]` | Kategorie w raporcie dziennym |
| `rl2_pdf_fields` | `string[]` | Pola eksportowane do PDF |

### Typy danych

```ts
type Rental = {
  id: string;           // uid()
  name: string;         // imię klienta lub numer telefonu
  doctype: string;      // 'Dowód osobisty' | 'Prawo jazdy' | 'Inny'
  docnum: string;
  notes: string;
  vehicles: RentalVehicle[];
  duration: number;     // minuty (wspólne dla wszystkich pojazdów)
  startTs: number;      // Date.now()
  totalPrice: number;
  finalSurcharge: number;
  active: boolean;
}

type RentalVehicle = {
  id: string;
  vtype: string;        // 'gokart' | 'rower' | custom (np. 'lodka')
  vmodel: string;       // np. 'Maluch', 'Junior', 'Kajak'
  vnum: string;         // numer pojazdu, '/admin' = bypass
  dur: number;          // minuty
}

type FleetVehicle = {
  type: string;         // 'gokart' | 'rower' | custom
  model: string;        // np. 'Maluch'
  num: string;          // np. '1', '2', '3'
}

type User = {
  id: string;
  name: string;
  role: 'admin' | 'user';
  pin: string;          // hash hasła
  lang?: 'pl' | 'en' | 'uk';
}

type Task = {
  id: string;
  title: string;
  date: string;
  assignee: '' | 'worker' | 'service';
  author: string;
  desc: string;
  createdTs: number;
}
```

---

## 4. Kluczowe funkcje JS (src/index.html)

### Nawigacja
```js
showV(view)           // przełącza zakładkę: 'rentals'|'history'|'avail'|'tasks'|'stats'|'settings'|'settings-prices'|'settings-equipment'|'settings-user'
renderFAB(view)       // renderuje 3 przyciski FAB (Nowe wypożyczenie, Śledzenie, Raport)
```

### Wypożyczenia
```js
renderRentals()       // lista aktywnych wypożyczeń (odświeżana co 20s)
renderRRow(r)         // pojedynczy wiersz wypożyczenia w gridzie
renderHistory()       // zakładka Historia
addRental()           // utwórz nowe wypożyczenie (walidacja + zapis)
delRental(id)         // zakończ wypożyczenie (oznacza active=false)
restoreRental(id)     // przywróć zakończone wypożyczenie
calcSurcharge(r, now) // oblicz dopłatę za przekroczenie czasu
vSur(v, overMs)       // dopłata dla jednego pojazdu (gokart/rower/custom)
```

### Sprzęt / Fleet
```js
loadFleet()           // ładuje FLEET z rl2_fleet
saveFleet()           // zapisuje FLEET
addFleetVehicle()     // dodaj pojazd z formularza (z walidacją duplikatów)
removeFleetVehicle(i) // usuń pojazd z listy
renderSettingsEquipment() // zakładka "Zarządzanie sprzętem"
renderAvail(searchVnum, filterType) // Stan sprzętu z filtrem kategorii
```

### Cennik
```js
renderCennikPanel()   // panel cennika po prawej (GOKARTY / ROWERY / DOPŁATY + custom)
renderSettingsPrices() // edycja cen w ustawieniach admina
saveKartPrices()      // zapisz ceny gokartów
saveBikePrices()      // zapisz ceny rowerów
getCustomPrice(vtype, vmodel, dur) // cena dla custom sprzętu
getCustomDurs(type, model)         // dostępne czasy dla custom sprzętu
```

### Wielojęzyczność
```js
var LANGS = { pl: {...}, en: {...}, uk: {...} }  // MUSI być var (nie const) — hoist
t(key)          // zwraca tłumaczenie dla aktualnego języka
getLang()       // zwraca aktualny język ('pl'/'en'/'uk')
applyLang()     // aktualizuje wszystkie napisy w UI
setSelfLang(lang) // pracownik zmienia swój język
setUserLang(uid, lang) // admin zmienia język innemu użytkownikowi
```

### Raport / PDF
```js
renderReport()       // modal raportu dziennego
exportReportPDF()    // generuje HTML + pobiera jako plik relax_raport_DD_MM_YYYY.html
togglePdfField(key, checked) // zaznacz/odznacz pole PDF (zapisuje w rl2_pdf_fields)
toggleReportCat(type, label, checked) // konfiguruj kategorie raportu (rl2_report_categories)
```

### Statystyki
```js
renderStats()     // zakładka statystyk (przychód dzienny, godziny szczytu, top modele)
// getDynamicPct(day, val) — skalowanie słupka wykresu do maxRev (global max)
```

### Zadania
```js
renderTasks()     // lista zadań + formularz (lista najpierw, przycisk "Nowe zadanie" na dole)
addTask()         // dodaj zadanie
editTask(id)      // załaduj dane zadania do formularza
saveEditTask(id)  // zapisz zmiany
deleteTask(id)    // usuń zadanie
```

---

## 5. Globalne zmienne JS

```js
var LANGS          // tłumaczenia PL/EN/UK — MUSI być var
var DEFAULT_PERMS  // domyślne uprawnienia ról — MUSI być var
let rentals        // Rental[] — aktywne i zakończone
let users          // User[]
let sessions       // Session[]
let FLEET          // FleetVehicle[]
let KARTS          // konfiguracja cen gokartów
let BIKES          // konfiguracja cen rowerów
let SURCHARGE      // konfiguracja dopłat
let currentUser    // zalogowany użytkownik
let currentView    // aktualna zakładka
let cpOpen         // czy cennik jest otwarty (bool)
let vehicleRows    // wiersze pojazdów w formularzu nowego wypożyczenia
```

---

## 6. Ważne zasady przy modyfikacjach

### ABSOLUTNIE NIE ZMIENIAJ bez wyraźnej prośby:
- `grid-template-columns` w `.lh` i `.rrow` — precyzyjnie skalibrowane
- `LANGS` z `var` na `const` — spowoduje TDZ crash
- `DEFAULT_PERMS` z `var` na `const` — jw.
- Logiki `IAPI` — to most między Electron i przeglądarką
- CSS zmiennych `--bd`, `--s1..s4`, `--t1..t3` — globalny design system

### Przy dodawaniu nowych widoków:
1. Dodaj case w `showV(v)` 
2. Dodaj tytuł w obiekcie `viewTitles`
3. Dodaj przycisk w nawigacji `#sb`
4. Napisz funkcję `renderXxx()`

### Przy dodawaniu nowych kluczy danych:
1. Użyj `IAPI._kvSet('rl2_XXX', value)` do zapisu
2. Użyj `IAPI._lGet('rl2_XXX', default)` do odczytu
3. Dodaj klucz do listy w sekcji 3 tego pliku

### Numer `/admin` w polu pojazdu:
- Bypass walidacji floty — pozwala na wypożyczenie bez pojazdu w bazie
- Obsłużony w `updateVnumOnly()` i `addRental()`

---

## 7. Electron — IPC API

Dostępne przez `window.electronAPI` (tylko gdy uruchomione w Electronie):

```js
await electronAPI.getData()                    // → { rentals, users, sessions }
await electronAPI.saveRentals(jsonString)      // zapisz wypożyczenia
await electronAPI.saveUsers(jsonString)        // zapisz użytkowników
await electronAPI.saveSessions(jsonString)     // zapisz sesje
await electronAPI.kvGet(key)                   // → string | null
await electronAPI.kvSet(key, value)            // zapisz wartość
electronAPI.minimize()                         // minimalizuj okno
electronAPI.maximize()                         // maksymalizuj/przywróć okno
electronAPI.close()                            // zamknij aplikację
```

---

## 8. Uruchomienie i build

```bash
# Instalacja
npm install

# Uruchomienie (dev)
npm start

# Build instalatora
npm run build:win    # → dist/Relax Wypożyczalnia Setup.exe
npm run build:mac    # → dist/Relax Wypożyczalnia.dmg
npm run build:linux  # → dist/Relax Wypożyczalnia.AppImage
```

**Lokalizacja bazy danych:**
- Windows: `%APPDATA%\relax-wypozyczalnia\relax.db`
- macOS: `~/Library/Application Support/relax-wypozyczalnia/relax.db`
- Linux: `~/.config/relax-wypozyczalnia/relax.db`

---

## 9. Styl kodu i konwencje

- Cały UI w jednym pliku: `src/index.html` — to świadoma decyzja (standalone HTML)
- JS bez bundlera, bez frameworka — vanilla JS ES2020+
- Template literals do generowania HTML w JS
- Funkcje `render*()` zawsze ustawiają `document.getElementById('content').innerHTML`
- `uid()` — generator unikalnych ID (wbudowany)
- `fmtHM(ts)` — formatuje timestamp do HH:MM
- `fmtDate(ts)` — formatuje timestamp do DD.MM.YYYY
- `fmtDur(mins)` — formatuje minuty do "30 min" / "1 godz." / "Cały dzień"

---

## 10. Znane specyfiki i pułapki

| Problem | Rozwiązanie |
|---------|-------------|
| `LANGS is not defined` | Upewnij się że `var LANGS` jest przed funkcjami które go używają |
| Dopłaty custom sprzętu = 0 | `vSur()` czyta z `rl2_custom_prices[vtype][model].surcharges[0]` |
| Cennik nie pokazuje custom | `renderCennikPanel()` musi być wywołane po `addFleetVehicle()` |
| Wykres "płaski" | `getDynamicPct` używa globalnego `maxRev` — sprawdź czy `revByDay` jest poprawnie wyliczone |
| PDF nie otwiera się | Popup blocker — używamy `Blob + <a>` zamiast `window.open()` |
| Toggle motywu działa za 2. kliknięciem | `data-theme` musi być zawsze ustawiony na `<html>` przy starcie — sprawdź IIFE na końcu `<script>` |
