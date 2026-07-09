# Dungeon Loop – Offline spielen (wie ein Steam-Spiel)

## Schnellstart

### Windows
Doppelklick auf **`play.bat`**

### Mac / Linux
Im Terminal:
```bash
chmod +x play.sh
./play.sh
```

Der Browser öffnet **http://localhost:8080** – danach **kein Internet mehr nötig**.

---

## Download

1. https://github.com/Thcjk/Dungeon-Loop
2. **Code → Download ZIP**
3. ZIP entpacken (z. B. `Dungeon-Loop`)
4. `play.bat` (Windows) oder `play.sh` (Mac/Linux) starten

---

## Was wird gespeichert?

Alles läuft **lokal im Browser** (localStorage):

| Gespeichert | Wo |
|---|---|
| Gold & Upgrades | Pro Spielername |
| Fähigkeiten & Loadout | Pro Browser |
| Audio-Einstellungen | Pro Browser |
| Highscores | Lokale Rangliste |

**Gleicher Name = gleicher Speicherstand** beim nächsten Start.

---

## Wichtig

- **Nicht** `index.html` per Doppelklick öffnen – der Mini-Server (`play.bat`) ist nötig
- Fortschritt liegt im **Browser-Profil** – anderen Browser oder privates Fenster = neuer Speicher
- **Supabase optional** – nur für Online-Rangliste, wenn du URL/Key in `script.js` einträgst

---

## Manuell starten (falls play.bat nicht geht)

```bash
cd Dungeon-Loop
python3 -m http.server 8080
```

Dann: http://localhost:8080

---

## Steam-ähnliches Setup

1. ZIP herunterladen und entpacken
2. Ordner z. B. nach `C:\Spiele\Dungeon-Loop` legen
3. Verknüpfung zu `play.bat` auf den Desktop
4. Fertig – jederzeit offline spielbar
