# Dungeon Loop – Release Report

## Versionen

| Feld | Wert |
|------|------|
| Spielversion / Build | `sidescroller-v3-144` |
| Game-Version | `4` |
| Save-Schema | `SAVE_SCHEMA_VERSION = 3` |
| World-Layout | `WORLD_LAYOUT_VERSION = 4` |
| Run-Save | `RUN_SAVE_VERSION = 3` |

## Start & Build

- **Lokal:** `./play.sh` oder `./play.bat` (HTTP auf Port 8080), dann Browser öffnen
- **Hosting:** GitHub Pages via `.github/workflows/deploy-pages.yml` (Branch `main` → `gh-pages`)
- **Hinweis:** Nicht über `file://` starten – Audio und Fetch brauchen HTTP(S)
- Nach Deploy: Hard-Reload (**Strg+F5**)

## Speicherorte (localStorage)

| Key | Inhalt |
|-----|--------|
| `dungeon_loop_save_slots_v2` | Bis zu 3 permanente Slots (Name, Klasse, Gold, Upgrades, Meta) |
| `dungeon_loop_active_run` | Aktiver Run (Dungeon-Level, Held, Gegner, Wellenstatus) |
| `dungeon_loop_meta` | Legacy-Spiegel der Meta-Daten |
| `dungeon_loop_audio` | Einstellungen (Musik/SFX, Lautstärken, Shake, Partikel) |
| `dungeon_loop_last_player` / `dungeon_loop_last_slot` | Fortsetzen-Hinweis |
| `*_bak` | Backup beim sicheren Schreiben |

## Save-Migration

1. Beim Laden werden Slots und Runs auf das aktuelle Schema geprüft.
2. Fehlende Felder werden mit sicheren Defaults ergänzt (`validateMeta`, Upgrade-Clamping).
3. Ungültige Zahlen (NaN / negativ / zu groß) werden korrigiert.
4. Bei Schreibfehlern bleibt das vorherige Backup (`__bak`) erhalten.
5. Ein kompletter Wipe passiert nur bei bewusster Erhöhung von `DATA_WIPE_VERSION` (aktuell `"4"`).

## Wichtigste behobene / überarbeitete Punkte

### Kritisch / Speichern
- Meta-Fortschritt (Fähigkeiten, Account-XP) ist **pro Slot** statt global
- Sicheres Speichern mit Backup-Key und Fehleranzeige
- Slot löschen mit Bestätigung im Lade-Menü
- Fortsetzen-Button im Hauptmenü
- Unaufdringlicher Speicher-Indikator
- Upgrade-Stufen und Meta-Werte werden beim Laden validiert

### Gameplay / Stabilität
- Ranger-Grundfeuer stark entschleunigt (Balance)
- Klassenwerte angeglichen (Krieger tankiger, Magier etwas robuster)
- Gift-DoT ohne `setTimeout` (pausier- und todsicher)
- `buff_shout` (Kriegsschrei) funktioniert ohne Gegner in Reichweite
- Rückkehr ins Hauptmenü stoppt Weltmusik und startet Menümusik neu
- Pause mit Esc inkl. Pausenmenü beibehalten
- Ult-Bereit nur über dem Helden (W/S ✓)

### Menüs / Release-Polish
- Einstellungen: Musik/SFX an/aus, Lautstärken, Screen-Shake, Partikel
- Credits-Seite
- Favicon, Meta-Description
- Google-Fonts-Abhängigkeit entfernt
- Deploy schließt `assets/pack/_debug` und `assets/incoming` aus
- Cache-Bust für `sounds.json` an Build-ID gekoppelt
- Dead Score-/Leaderboard-Button entfernt

### Balancing (Auszug)
- Ranger `attackRate` 200 → **380** ms, ATK/Krit leicht reduziert
- Krieger mehr HP/DEF, Magier mehr Mana/Magieschaden
- Early-Game etwas großzügiger, frühe Bosse etwas milder
- Upgrade-Kostenkurve leicht entschärft, etwas mehr Loot/XP

## Getestete Abläufe

Automatisiert (`node tools/test-release.mjs`):
- Build-/Save-Konstanten vorhanden
- Menü-IDs (Fortsetzen, Settings, Credits, Save-Indikator)
- Ranger-Balance-Konstante
- Gift ohne setTimeout / buff_shout-Zweig
- Meta-Validierung korrigiert ungültige Werte
- Keine Google-Fonts-Abhängigkeit

Manuell im Code-Pfad geprüft (Logik-Review; in dieser Umgebung kein Browserfenster):
- Neues Spiel → Slot → Klasse → frische Meta
- Laden → slotgebundene Meta + Fähigkeiten
- Pause Esc / Pausenmenü / Hauptmenü inkl. Menümusik
- Tod → Run clear, Gold banken
- Autosave (dirty, Interval, beforeunload, visibilitychange)

## Auflösungen

Canvas intern **640×360**, CSS skaliert das Frame. Layout unterstützt typische Desktop-Breiten (1280×720, 1366×768, 1920×1080) und schmalere Fenster über bestehendes Grid/Stacking.

## Bekannte Einschränkungen (nicht blockierend)

- Kampf- und Menümusik teilen sich derzeit `sounds/music/menu.mp3`
- Run-Save speichert keine fliegenden Projektile/Münzen
- Online-Leaderboard/Supabase ist absichtlich deaktiviert
- Kein mehrstufiges Tutorial mit Persistenz-Flag
- Mehrere Tabs mit demselben Slot können sich überschreiben

## Drittanbieter / Lizenzen (erkennbar)

- Kein npm-Bundle, keine Runtime-Framework-Abhängigkeit
- Optional: Supabase nur wenn URL/Key gesetzt (aktuell nicht)
- Assets: integriertes Pack unter `assets/pack/`
- Audio unter `sounds/`

## Startanleitung (Kurz)

1. `./play.sh` ausführen
2. Browser → `http://localhost:8080`
3. **Fortsetzen** oder **Neues Spiel** → Slot → Klasse
4. Im Run: Maus = Angriff, A/D = Bewegen, W/S = Ult, U = Upgrades, Esc = Pause
