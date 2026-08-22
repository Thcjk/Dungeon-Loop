# Asset Pack (spielbereit)

Vorverarbeitete Assets aus `assets/incoming/` (Meshy Pixel-Art Pack).

## Struktur

| Pfad | Inhalt |
|------|--------|
| `heroes/` | Krieger / Waldläufer / Magier (Idle–Death) |
| `enemies/` | Gegner pro Welt |
| `bosses/` | Welt-Bosse |
| `worlds/` | Preview, Ground, Midband, Tileset, Deco |
| `props/` | Freigestellte Deko-Props (ohne Schachbrett) |
| `fx/` | Effekt-/Projektil-Sheets |
| `fx/sprites/` | Zugeschnittene FX (Arrow, Feuerball, Slash, Explosion …) |
| `ui/` | HUD-/Frame-/Icon-Sheets |
| `manifest.json` | Zentrale Pfad-Zuordnung (`fxSprites` für Runtime) |

Runtime: `asset-pack.js` → `PackAssets` · `pack-fx.js` → Kampf-VFX
