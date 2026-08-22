# Dungeon Loop – Offline spielen (wie ein Steam-Spiel)

## Schnellstart Windows

### Variante A – Doppelklick (einfachste)
1. Ordner `Dungeon-Loop` öffnen
2. Doppelklick auf **`play.bat`**
3. Browser öffnet automatisch **http://localhost:8080**

### Variante B – Kommandozeile (cmd / PowerShell)

```bat
cd Pfad\zu\Dungeon-Loop
play.bat
```

Oder manuell mit Python:

```bat
cd Pfad\zu\Dungeon-Loop
python -m http.server 8080
```

Dann im Browser öffnen: **http://localhost:8080**

Falls `python` nicht gefunden wird:

```bat
py -m http.server 8080
```

---

## Mac / Linux

```bash
cd Dungeon-Loop
chmod +x play.sh
./play.sh
```

Oder:

```bash
python3 -m http.server 8080
```

---

## Download

1. https://github.com/Thcjk/Dungeon-Loop
2. **Code → Download ZIP**
3. ZIP entpacken (z. B. `Dungeon-Loop`)
4. `play.bat` starten

---

## Was wird gespeichert?

Alles läuft **lokal im Browser** (localStorage):

| Gespeichert | Wo |
|---|---|
| Gold & Upgrades | Pro Spielername |
| Aktiver Run (Weiterspielen) | Pro Spielername |
| Fähigkeiten & Loadout | Pro Browser |
| Audio-Einstellungen | Pro Browser |
| Highscores | Lokale Rangliste |

**Gleicher Name = gleicher Speicherstand** beim nächsten Start.

---

## Wichtig

- **Nicht** `index.html` per Doppelklick öffnen – der Mini-Server (`play.bat`) ist nötig
- Fortschritt liegt im **Browser-Profil** – anderer Browser oder privates Fenster = neuer Speicher
- **Supabase optional** – nur für Online-Rangliste, wenn du URL/Key in `script.js` einträgst
- Beim ersten Laden können Assets kurz nachladen – „Spiel starten“ funktioniert trotzdem

---

## Code im Editor öffnen (Windows)

Im Ordner `Dungeon-Loop` (Explorer-Adressleiste oder cmd):

```bat
code .
```

(Voraussetzung: [VS Code](https://code.visualstudio.com/) / Cursor installiert und `code` im PATH)

## Steam-ähnliches Setup

1. ZIP herunterladen und entpacken
2. Ordner z. B. nach `C:\Spiele\Dungeon-Loop` legen
3. Verknüpfung zu `play.bat` auf den Desktop
4. Fertig – jederzeit offline spielbar
