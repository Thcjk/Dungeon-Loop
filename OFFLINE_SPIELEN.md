# Dungeon Loop – Offline spielen (Desktop-Ordner)

**Aktuelle Version:** `miniworld-v100` (MiniWorld-Weltgrafik + Sounds)

---

## Schnellstart (Desktop)

### Windows
1. Doppelklick auf **`play.bat`**
2. Browser oeffnet http://localhost:8080
3. **Kein Internet mehr noetig** waehrend des Spielens

### Mac / Linux
```bash
chmod +x play.sh update-offline.sh
./play.sh
```

---

## Desktop-Ordner einrichten (einmalig)

1. https://github.com/Thcjk/Dungeon-Loop → **Code → Download ZIP**
2. ZIP entpacken (z. B. `Dungeon-Loop`)
3. Ordner auf den **Desktop** legen (oder `C:\Spiele\Dungeon-Loop`)
4. Rechtsklick auf **`play.bat`** → **Verknuepfung erstellen** → Verknuepfung auf Desktop ziehen
5. Fertig – jederzeit per Doppelklick starten

**Wichtig:** Nicht `index.html` direkt oeffnen – der Mini-Server (`play.bat`) ist noetig, damit Grafiken und Sounds laden.

---

## Desktop-Ordner aktualisieren

Dein alter Ordner hat **kein Update-Skript**? Kein Problem:

### Sofort (Windows, einmal Internet)

**Option 1 – In deinem Dungeon-Loop Ordner:**
Doppelklick auf **`play.bat`** → fragt automatisch „Jetzt updaten?“ wenn Grafiken fehlen.

**Option 2 – Update-Befehl:**
```bat
play.bat update
```

**Option 3 – Ohne neue Dateien (PowerShell im Ordner):**
```powershell
cd Desktop\Dungeon-Loop
Invoke-WebRequest -Uri "https://github.com/Thcjk/Dungeon-Loop/archive/refs/heads/main.zip" -OutFile dl.zip
Expand-Archive dl.zip .
xcopy /E /Y Dungeon-Loop-main\* .
rmdir /S /Q Dungeon-Loop-main
del dl.zip
```

**Option 4 – Komplett neu:**
1. https://github.com/Thcjk/Dungeon-Loop → **Code → Download ZIP**
2. Alten Desktop-Ordner loeschen, neues ZIP entpacken
3. `play.bat` starten

*(Mac/Linux: `./play.sh update` oder `./update-offline.sh`)*

**Speicherstaende bleiben erhalten** – die liegen im Browser (localStorage), nicht im Ordner.

---

## Ordner-Inhalt (wichtig fuer Offline)

| Pfad | Zweck |
|------|-------|
| `play.bat` / `play.sh` | Spiel starten (`play.bat update` = Update) |
| `UPDATE.bat` | Gleich wie `play.bat update` |
| `assets/miniworld/` | **Welt-Grafiken** (neu in v100) |
| `sounds/` | Sound-Dateien |
| `index.html`, `script.js`, … | Spiel-Code |

Fehlt `assets/miniworld/`, fragt `play.bat` automatisch nach Update.

---

## Was wird gespeichert?

Alles laeuft **lokal im Browser** (localStorage):

| Gespeichert | Wo |
|---|---|
| Gold & Upgrades | Pro Spielername |
| Faehigkeiten & Loadout | Pro Browser |
| Audio-Einstellungen | Pro Browser |
| Highscores | Lokale Rangliste |

**Gleicher Name = gleicher Speicherstand** beim naechsten Start.

---

## Manuell starten (falls play.bat nicht geht)

```bash
cd Dungeon-Loop
python -m http.server 8080
```

Dann: http://localhost:8080

---

## Supabase (optional)

Nur fuer Online-Rangliste – URL/Key in `script.js` eintragen. Offline-Spiel funktioniert ohne Supabase.
