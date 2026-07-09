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

Wenn du schon einen alten Ordner auf dem Desktop hast:

### Option A – Update-Skript (empfohlen)
1. **`update-offline.bat`** doppelklicken (Windows)
2. Warten bis „Update fertig!“
3. **`play.bat`** starten

*(Mac/Linux: `./update-offline.sh`)*

### Option B – Manuell
1. Alten Ordner loeschen oder umbenennen (z. B. `Dungeon-Loop-alt`)
2. Neues ZIP von GitHub laden und entpacken
3. **`play.bat`**-Verknuepfung neu anlegen

**Speicherstaende bleiben erhalten** – die liegen im Browser (localStorage), nicht im Ordner.

---

## Ordner-Inhalt (wichtig fuer Offline)

| Pfad | Zweck |
|------|-------|
| `play.bat` / `play.sh` | Spiel starten |
| `update-offline.bat` | Update von GitHub |
| `assets/miniworld/` | **Welt-Grafiken** (neu in v100) |
| `sounds/` | Sound-Dateien |
| `index.html`, `script.js`, … | Spiel-Code |

Fehlt `assets/miniworld/`, zeigt `play.bat` eine Warnung – dann `update-offline.bat` ausfuehren.

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
