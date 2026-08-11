/* ============================================
   Dungeon Loop – Pixel Canvas Edition
   Maus auf Gegner = Angriff | W/S = Spezial
   A/D = Vor/Zurück | P = Pause
   ============================================ */

const BUILD_ID = "sidescroller-v3-174";
const GAME_VERSION = 4;
const SAVE_SCHEMA_VERSION = 4;
const WORLD_LAYOUT_VERSION = 4;

/* Spielstände NIEMALS bei Updates löschen.
   Frühere Wipe-Logik ist deaktiviert – nur Versionsmarkierung ohne Datenverlust. */
const DATA_WIPE_KEY = "dungeon_loop_wipe_version";
const DATA_WIPE_VERSION = "keep-saves";
(function markSavePolicy() {
  try {
    localStorage.setItem(DATA_WIPE_KEY, DATA_WIPE_VERSION);
  } catch (_) {}
})();

function safeSetLocalStorage(key, value) {
  try {
    const payload = typeof value === "string" ? value : JSON.stringify(value);
    const backupKey = key + "__bak";
    const prev = localStorage.getItem(key);
    if (prev != null) localStorage.setItem(backupKey, prev);
    localStorage.setItem(key, payload);
    // Validate roundtrip
    const read = localStorage.getItem(key);
    if (read !== payload) throw new Error("storage-mismatch");
    return true;
  } catch (err) {
    console.error("Speichern fehlgeschlagen:", key, err);
    try {
      const el = document.getElementById("save-indicator");
      if (el) {
        el.textContent = "Speichern fehlgeschlagen";
        el.classList.remove("hidden");
        el.classList.add("show");
      }
    } catch (_) {}
    return false;
  }
}

function safeGetLocalStorageJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.warn("Spielstand beschädigt, Backup wird versucht:", key, err);
    try {
      const bak = localStorage.getItem(key + "__bak");
      if (!bak) return fallback;
      return JSON.parse(bak);
    } catch (_) {
      return fallback;
    }
  }
}

/** Debug: Hitboxen nur bei ausdrücklich aktiviertem Entwicklungsmodus */
const DEBUG_HITBOXES = false;

/** Partikel-Obergrenze – verhindert unbegrenztes Ansammeln */
const MAX_PARTICLES = 220;

function canSpawnParticles() {
  return audioPrefs.particles !== false;
}

function pushParticle(p) {
  if (!canSpawnParticles()) return;
  if (game.particles.length >= MAX_PARTICLES) game.particles.shift();
  game.particles.push(p);
}

/** Tasten für ausgerüstete Spezialfähigkeiten */
const ABILITY_KEY_LABELS = ["W", "S"];

function getAbilityKeyLabel(slotIdx) {
  return ABILITY_KEY_LABELS[slotIdx] || String(slotIdx + 1);
}

function isTypingInForm() {
  const tag = document.activeElement?.tagName;
  return tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA";
}

const SUPABASE_URL = "DEINE_SUPABASE_URL";
const SUPABASE_KEY = "DEIN_SUPABASE_KEY";
let supabase = null;

// --- Canvas ---
const PIXEL = 3;
const CHAR_PIXEL = 3;
const ENEMY_PIXEL = CHAR_PIXEL * 1.2;
const WEAPON_PIXEL = 2;
const DECOR_PIXEL = 5;
const BG_PIXEL = 6;
const CW = 640, CH = 360;
const GROUND = 288; // Maueroberkante – Held/Gegner laufen genau darauf

/** Alle Charaktere: Unterkante der Hitbox = Bodenlinie */
function pinCharToGround(entity) {
  if (!entity || entity.h == null) return;
  entity.y = GROUND - entity.h;
}
const CAM_ZOOM = 1.0;
const COMBAT_LAYOUT = {
  heroCombatX: 90,
  /** Voller Bildkorridor – Held kann die komplette Breite nutzen */
  heroMoveMinX: 16,
  heroMoveMaxX: 560,
  /** Rechts bleibt der Held weitgehend sichtbar */
  heroEdgeOverflowRight: 0.12,
  enemyRightMargin: 205,
  enemySpacing: 50,
  enemyMeleeReach: 52,
  enemyBossReach: 68,
  introSpeed: 82,
  introOffscreen: 55,
  enemyChaseSpeed: 118,
  enemyBossChaseSpeed: 96,
  enemySeparation: 18,
  screenEdgePad: 8,
  minVisiblePx: 14
};
const CAM_AX = CW / 2;
const CAM_AY = GROUND;
const CAMERA_FOLLOW_OFFSET_X = 72;
const CAMERA_LERP = 8.5;
const visualCamera = { x: CAM_AX, y: CAM_AY, zoom: CAM_ZOOM, ready: false };
let canvas, ctx;
let mouse = { x: CW / 2, y: CH / 2, down: false, onCanvas: false };
let keys = {};

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function getCameraFocusX() {
  if (typeof game === "undefined" || !game.hero) return CAM_AX;
  const h = game.hero;
  // Kamera folgt dem Helden über die volle Breite, ohne ihn mittig einzusperren
  return clamp(h.x + h.w * 0.5 + CAMERA_FOLLOW_OFFSET_X, 100, 540);
}

function updateVisualCamera(dt) {
  const targetX = getCameraFocusX();
  if (!visualCamera.ready) {
    visualCamera.x = targetX;
    visualCamera.ready = true;
  } else {
    const t = 1 - Math.exp(-CAMERA_LERP * dt);
    visualCamera.x += (targetX - visualCamera.x) * t;
  }
  visualCamera.y = CAM_AY;
  visualCamera.zoom = CAM_ZOOM;
}

function applyCamera(c, zoomBoost = 1) {
  const z = CAM_ZOOM * zoomBoost;
  visualCamera.zoom = z;
  c.translate(visualCamera.x, visualCamera.y);
  c.scale(z, z);
  c.translate(-visualCamera.x, -visualCamera.y);
}

function getAim() {
  return {
    x: (mouse.x - visualCamera.x) / visualCamera.zoom + visualCamera.x,
    y: (mouse.y - visualCamera.y) / visualCamera.zoom + visualCamera.y,
    onCanvas: mouse.onCanvas,
    down: mouse.down
  };
}

// --- Paletten & Pixel-Sprites ---
const PAL = {
  ".": null,
  K: "#1a1a2e", k: "#0d0d18",
  s: "#f5cba7", S: "#e8b88a",
  r: "#c0392b", R: "#e74c3c", o: "#922b21",
  g: "#1e8449", G: "#27ae60", l: "#145a32",
  b: "#2471a3", B: "#5dade2", n: "#1a5276",
  w: "#ecf0f1", W: "#bdc3c7", y: "#f1c40f",
  p: "#6c3483", P: "#8e44ad", m: "#2ecc71",
  d: "#5d4e37", D: "#795548", u: "#4a235a",
  h: "#7b241c", H: "#a93226", e: "#d35400",
  c: "#1abc9c", C: "#16a085", a: "#2c3e50",
  t: "#2e4053", T: "#4a6fa5", i: "#85c1e9",
  z: "#52be80", Z: "#1e8449", f: "#f39c12",
  x: "#abb2b9", X: "#808b96", q: "#1c2833",
  j: "#0b1f14", J: "#1a3d2a", v: "#2d6a4f", V: "#52b788",
  L: "#081c15", M: "#1b4332", N: "#40916c", O: "#74c69d",
  A: "#4a3728", E: "#6b4f3a", Q: "#95e1a3", U: "#5c4d7a",
  Y: "#d4a574"
};

const SPRITES = {
  goblin: [
    "....KKKK....",
    "...KGGGGK...",
    "..KGeGGeGK..",
    "..KGGGGGGK..",
    "...KHHHHK...",
    "...KDDDDK...",
    "..KDD..DDK..",
    "...KK..KK..."
  ],
  skelett: [
    "....KKKK....",
    "...KWWWWK...",
    "..KWsWWsWK..",
    "..KWWWWWWK..",
    "...KWWWWK...",
    "..KWKWWKWK..",
    "...KX..XK...",
    "...KK..KK..."
  ],
  schleim: [
    "....KKKK....",
    "..KKZZZZKK..",
    ".KZZeZZeZZK.",
    ".KZZZZZZZZK.",
    ".KZZZQQZZZK.",
    "..KZZZZZZK..",
    "...KKZZKK..."
  ],
  bandit: [
    "....KKKK....",
    "...KDDDDK...",
    "..KDsSSdDK..",
    "..KDDDDDDK..",
    "...KHHHHK...",
    "..KDGGDDK...",
    "..KD..DDK...",
    "...KK..KK..."
  ],
  wolf: [
    "...KKKKKK...",
    "..KdDDDDdK..",
    ".KdDsSSdDK.",
    ".KdDDDDDDK.",
    "..KdHHHdK..",
    "...KdDdK...",
    "..Kd..dK..."
  ],
  spinne: [
    "....KKKK....",
    "...KuPPuK...",
    "..KuPPPPuK..",
    ".KuPePePuK.",
    "..KuPPPPuK..",
    ".KuKPPKuK..",
    "KuK....KuK."
  ],
  boss_ork: [
    "...KKKKKKKK...",
    "..KHHHHHHHHK..",
    ".KHHJHHHHJHK.",
    ".KHHsHHHHsHK.",
    ".KHHHHHHHHHK.",
    "..KHHooooHHK.",
    ".KHHDDDDDDHK",
    "KHHDDGGDDHHK",
    ".KHHDDDDHHK.",
    "..KHH..HHK..",
    "..KKK..KKK.."
  ],
  boss_schatten: [
    "...KKKKKKKK...",
    "..KaaaaaaaaK..",
    ".KaaUUUUUaaK.",
    ".KaasaaaaaaK.",
    ".KaaaaaaaaaK.",
    "..KaaaooaaK..",
    ".KaaPPPPPPaK",
    "KaaPPaaPPaaK",
    ".KaaPPPPaaK.",
    "..Kaa..aaK..",
    "..KKK..KKK.."
  ],
  boss_feuer: [
    "...KKKKKKKK...",
    "..KHHHHHHHHK..",
    ".KHeeeeeeeHK.",
    ".KHeRHHHReHK.",
    ".KHeeeeeeeHK.",
    "..KHHHooHHK..",
    ".KHHfffffHHK",
    "KHHffeeffHHK",
    ".KHHffffHHK.",
    "..KHH..HHK..",
    "..KKK..KKK.."
  ],
  boss_drache: [
    "..KKKKKKKKKK..",
    ".KggGGGGGGggK.",
    "KggGSSGGSSGgK",
    "KggGGGGGGGGgK",
    ".KggHHHHHHgK.",
    "..KggDDDDgK..",
    ".KggDGGGDgK.",
    "KggDGGGGDgK",
    ".KggD..DgK.",
    "..KKK..KKK."
  ],
  boss_nekro: [
    "...KKKKKKKK...",
    "..KPPPPPPPPK..",
    ".KPPUUUUUPPK.",
    ".KPPsPPPPsPK.",
    ".KPPPPPPPPPK.",
    "..KPPPooPPK..",
    ".KPPBBBBPPK",
    "KPPBPPPPBPK",
    ".KPPBBBBPK.",
    "..KPP..PPK..",
    "..KKK..KKK.."
  ],
  tree: [
    ".....KK.....","....KGGK....","...KGGGGK...","...KGGGGGK..",
    "..KGGGGGGK..","...KGGGGK...","....KGGK....",".....GK.....",
    ".....GK.....",".....GK.....","....KGGK....","...KAAAK....",
    "..KAAAAAK...","..KAAAAAK..."
  ],
  pine_tree: [
    ".....KK.....","....KLLK....","...KJMJK....","..KJMMJK....",
    ".KJMMMMJK...","..KJMMJK....","...KJMJK....","....KJJk....",
    ".....Jk.....",".....Jk.....","....KAAK....","...KAAEAK...",
    "..KAAAAAK...","..KAAAAAK...","...KAAAK...."
  ],
  pine_silhouette: [
    "....KKKK....","...KLLLLK...","..KJJMJJk..",".KJJMMJJJK.",
    "KJJMMMMJJKK","KJJMMMMMJJJK",".KJJMMJJJK.","..KJJMJJk..",
    "...KJJJK....","....KJK.....",".....Jk.....","....KAAK....",
    "...KAAAK....","..KAAAAK...."
  ],
  dead_tree: [
    ".....KK.....","....KAAK....","...KAEAEK...","..Kk...kK..",
    "..K.....K..","...K...K....","....K.K.....","....K.K.....",
    "...K...K....","..K.....K..","..K.....K..","...K...K...."
  ],
  mushroom: [
    ".....KK.....","...KRRRRK...","..KRWwwWRK..",".KRWwwwwWRK.",
    "..KWWWWWWK..","...KWWWWK...","....KWWK....","....KWWK....",
    "....KDDK....","....KDDK...."
  ],
  stump: [
    "....KKK....","...KAAAK...","..KAAAAAK..",".KAAAAAAAK.",
    ".KAAEEAAK.","..KAAAAAK..","...KAAAK..."
  ],
  bush_dark: [
    ".....KK.....","...KvVVvK...","..KvNNNVvk..",".KvNNNNNVvk.",
    ".KvNNNNNVvk.","..KvVVVVk...","....KvVk...."
  ],
  bones: [
    ".....KK.....","...KWWWWK...","..KW.K.KWK..","..KWWWWWk...",
    "...KWWWK....","....KKK....."
  ],
  firefly: ["..K..",".QyQ.","..K.."],
  stalactite: [
    "....KKK....","...KXXXk...","..KXXxXXK..","..KXXxXXK..",
    ".KXXxXXXK..","..KXXXXK...","...KXXK....","....KXK...."
  ],
  skull_rock: [
    "....KKK....","...KWWWk...","..KWsWsWK..",".KWWWWWWWK.",
    ".KWWWWWWWK.","..KXXXXXK..","...KXXXK..."
  ],
  torch: [
    ".....KK.....","....KffK....","...KffffK...","..KffffffK..",
    "...KffffK...","....KyyK....","....KDDK....","....KDDK....",
    "....KDDK...."
  ],
  pillar_ruin: [
    "....KKK....","...KXXXK...","..KXXXXXK..",".KXXXXXXXK.",
    ".KXXXXXXXK.",".KXXxXXXxXK",".KXXXXXXXK.",".KXXXXXXXK.",
    ".KXXxXXXxXK",".KXXXXXXXK.",".KXXXXXXXK.","..KXXXXXK..",
    "...KXXXXK..","....KXXXK...",".....KKK...."
  ],
  rubble: [
    ".....KK.....","...KXXXK....","..KxX.XxXK..",".KXXXXXXXK.",
    "..KXXXXXK...","...KXXXK...."
  ],
  banner: [
    ".....KK.....","....KRRK....","...KRRRRK...","..KRRRRRRK..",
    "..KRRRRRRK..","...KRRRRK...","....KDDK....","....KDDK....",
    "....KDDK....","....KDDK...."
  ],
  lava_rock: [
    "....KKK....","...KHHHk...","..KHffHHK..",".KHffffHHK.",
    ".KHHHHHHHK.","..KHHHHHK..","...KHHHK..."
  ],
  smoke_puff: ["..K..",".KXK.","..K.."],
  dragon_bone: [
    ".....KKKK.....","....KYYYYK....","...KYYYYYYK...","..KYYYYYYYYK..",
    "..KYYYYYYYYYK.",".KYY.....YYK..","..KYY....YK...","...KYY..YK....",
    "....KYYYYK....",".....KYYK.....","......YK......"
  ],
  obsidian: [
    "....KKK....","...Kuuuk...","..KuPPuPK..",".KuPPPPuPK.",
    ".KuPPPPuPK.","..KuuuuK...","...KKKK...."
  ],
  cave_crystal: [
    "....KiK....","...KiBiK...","..KiBBiBK..",".KiBBBBiBK..",
    ".KiBiBiBiK.","..KiBBiBK..","...KiBK...."
  ],
  grave: [
    "....KKK....","...KWWWk...","..KWWWWWK..",".KWWWWWWWK.",
    ".KWWWWWWWK.",".KWWWWWWWK.","..KWWWWWK..","...KWWWK...",
    "....KKK...."
  ],
  bush: [
    ".....KK.....","...KmZmZK...","..KmZZZZmk..",".KmZZZZZZmk.",
    ".KmZZZZZZmk.","..KmZZZZK...","....KmZK...."
  ],
  rock: [
    "....KKK....","...KXXXk...","..KXXXXXK..",".KXXxXXXxXK",
    ".KXXXXXXXK.","..KXXXXXK..","...KXXXK..."
  ],
  crystal: [
    "....KiK....","...KiBiK...","..KiBBiBK..",".KiBBBBiBK..",
    "..KiBBiBK..","...KiBiK...","....KkK...."
  ],
  glow_mushroom: [
    ".....KK.....","....KQQQK....","...KQQQQQK...","..KQQwwQQK..",
    ".KQQwwwwQQK.","..KQQwwQQK..","...KWWWWK...","....KDDK....",
    "....KDDK...."
  ],
  glow_pod: [
    ".....KK.....","....KiBiK....","...KiBBiBK...","..KiBBBBiBK..",
    "...KiBBiBK...","....KiBiK....","....KDDK....."
  ],
  hanging_vine: [
    "....KK....","...KGGK...","...KGGK...","..KGGGGK..",
    "..KGGGGK..","...KGGK...","...KGGK...","....GK...."
  ],
  fern: [
    ".....KK.....","....KGGK....","...KGGGGK...","..KGGGGGK..",
    ".KGGGGGGGK.","..KGGGGGK..","...KGGGGK...","....KGGK....",
    "....KDDK...."
  ],
  stone_lantern: [
    ".....KK.....","....KXXXK....","...KXXyXXK...","..KXXyyyXK..",
    "...KXXyXK...","....KDDK....","....KDDK....","....KDDK...."
  ],
  root_cluster: [
    "....KKKK....","...KAAAK...","..KAEAEAK..",".Kk...kK..",
    "..K.....K..","...KAAAK...","....KKK...."
  ],
  branch_fg: [
    "...KKKKK...","..KJJMJJk..",".KJJMMJJJK.","KJJMMMMJJKK",
    ".KJJMMJJJK.","..KJJMJJk..","...KJJJK..."
  ],
  cross: ["..K..",".KwK.","KwwwK",".KwK.","..K.."],
  moon: ["..KyK.",".KyyyK",".KyyyK","..KyK."],
  slash: ["...K...","..KRK..",".KRRRK.","..KRK..","...K..."],
  enemy_slash: ["...o...","..fof..",".foooof.","..fof..","...o..."],
  projectile_sword: ["..K..",".KRK.",".KRK.","..K.."],
  projectile_arrow: [
    "........K",".......WK","......WxK",".KYEYEYWK","......WxK",".......WK","..K...K.."
  ],
  projectile_fire:  ["..f..",".fef.",".fff.","..f.."],
  coin: ["..K..",".KyK.","KyKyK",".KyK.","..K.."]
};

const MONSTER_SPRITE = {
  Goblin: "goblin", Skelett: "skelett", Schleim: "schleim",
  Bandit: "bandit", Wolf: "wolf", Spinne: "spinne",
  "Ork-Champion": "boss_ork", Schattenritter: "boss_schatten",
  Feuerdämon: "boss_feuer", Drachenwächter: "boss_drache", Nekromant: "boss_nekro"
};

const CLASS_WEAPONS = {
  warrior: "Eisenschwert + Schild",
  ranger: "Langbogen",
  mage: "Arkaner Stab"
};

const CLASSES = {
  warrior: {
    name: "Krieger", attackType: "melee",
    hp: 150, attack: 22, defense: 8, crit: 0.06, mana: 0, magicDamage: 0,
    range: 84, attackRate: 440, moveSpeed: 124,
    aoeFalloff: 0.74,
    special: "Schildschlag", specialCd: 8, specialRange: 90, specialMult: 2.2,
    desc: "Nahkampf-Schwert, kurze Reichweite, viel Leben"
  },
  ranger: {
    name: "Waldläufer", attackType: "ranged",
    hp: 118, attack: 17, defense: 5, crit: 0.17, mana: 0, magicDamage: 0,
    range: 235, attackRate: 360, moveSpeed: 152,
    closeRange: 55, meleePenalty: 0.4,
    proj: "projectile_arrow", projSpeed: 13,
    special: "Präzisionsschuss", specialCd: 5,
    desc: "Bogen, große Reichweite, schwach im Nahkampf"
  },
  mage: {
    name: "Magier", attackType: "magic",
    hp: 100, attack: 8, defense: 4, crit: 0.12, mana: 145, magicDamage: 34,
    range: 215, attackRate: 300, moveSpeed: 110, manaPerShot: 3,
    proj: "projectile_fire", projSpeed: 8,
    special: "Feuerball", specialCd: 6, manaCost: 26,
    desc: "Zauber, mittlere Reichweite, braucht Mana"
  }
};

/** Kurz-Anleitung vor dem ersten Run – Inhalt je Klasse */
const CLASS_BRIEFINGS = {
  warrior: {
    title: "Krieger – Aufbruch",
    lead: "Schild voran. Du hältst die Linie und schlägst zu, wenn’s eng wird.",
    role: "Nahkämpfer mit viel Leben. Du musst nah ran – dafür überstehst du mehr Treffer.",
    tips: [
      "Maus auf Gegner = Schwertschlag in Reichweite. Bleib nah, aber nicht mittendrin eingekeilt.",
      "Spezial <kbd>W</kbd>/<kbd>S</kbd>: Schildschlag und weitere Nahkampf-Fähigkeiten gegen Gruppen.",
      "Upgrade zuerst Leben & Rüstung, dann Angriff – du bist der Tank der drei Helden."
    ]
  },
  ranger: {
    title: "Waldläufer – Aufbruch",
    lead: "Abstand halten, Krits suchen, nicht im Nahkampf stecken bleiben.",
    role: "Fernkampf mit Bogen. Hohe Reichweite und Krit-Chance – Nahkampf schwächt dich.",
    tips: [
      "Maus auf Gegner = schießen. Bleib auf Distanz; zu nah kostet spürbar Schaden.",
      "Spezial <kbd>W</kbd>/<kbd>S</kbd>: Präzisionsschuss und Pfeil-Burst für starke Momente.",
      "Upgrade Krit & Angriff früh. Bewege dich seitlich, während du zielst."
    ]
  },
  mage: {
    title: "Magier – Aufbruch",
    lead: "Mana im Blick behalten. Zauber treffen hart – ohne Mana bist du schwach.",
    role: "Magieschaden auf Distanz. Wenig Leben, dafür starke Zauber und Spezialfähigkeiten.",
    tips: [
      "Maus auf Gegner = Feuerzauber. Jeder Schuss kostet Mana – nicht dauerfeuern ohne Plan.",
      "Spezial <kbd>W</kbd>/<kbd>S</kbd>: Feuerball und weitere Zauber (brauchen oft Mana).",
      "Upgrade Magieschaden & Mana zuerst. Weiche aus – ein Fehler kostet dich den Run."
    ]
  }
};

const BRIEFING_SHARED = {
  goal: "Sterben gehört dazu: Run → Tod → Upgrade → neuer Rekord. Erster Durchlauf aller Welten ca. 1,5–2,5 Stunden. Skill hilft – Upgrades machen Bosse machbar.",
  controls: [
    "<kbd>A</kbd>/<kbd>D</kbd> oder <kbd>←</kbd>/<kbd>→</kbd> – vor und zurück bewegen",
    "<kbd>Maus</kbd> auf Gegner – automatisch angreifen (Klassen-Waffe)",
    "<kbd>W</kbd>/<kbd>S</kbd> oder <kbd>↑</kbd>/<kbd>↓</kbd> – Spezialfähigkeiten",
    "<kbd>U</kbd> – Upgrades & Fähigkeiten · <kbd>Esc</kbd>/<kbd>P</kbd> – Pause · <kbd>F</kbd> – Vollbild"
  ],
  watch: [
    "Münzen springen hoch: bewege dich darunter und fange sie in der Luft für <strong>x2 Gold</strong>.",
    "Ein Run reicht selten – Gold farmen, upgraden, dieselbe Welt erneut. Späte Upgrades werden teurer, bleiben aber bezahlbar.",
    "Je mehr du upgradest, desto besser farmst und kämpfst du – du kannst nicht endlos steckenbleiben.",
    "Weltwechsel passiert erst nach klarer Boss-Welle – nicht mitten im Kampf."
  ]
};

const NORMAL_MONSTERS = ["Goblin","Skelett","Schleim","Bandit","Wolf","Spinne"];
const BOSS_MONSTERS = ["Ork-Champion","Schattenritter","Feuerdämon","Drachenwächter","Nekromant"];

const WORLD_MONSTERS = {
  forest: {
    normal: [
      { name: "Goblin", sprite: "forest_goblin" },
      { name: "Bandit", sprite: "forest_bandit" },
      { name: "Waldspinne", sprite: "forest_spider" },
      { name: "Hornisse", sprite: "forest_hornet" },
      { name: "Setzling", sprite: "forest_sapling" },
      { name: "Rankenkriecher", sprite: "forest_vine_crawler" },
      { name: "Waldgeist", sprite: "forest_wraith" }
    ],
    boss: [
      { name: "Wald-Boss", sprite: "boss_forest" }
    ]
  },
  swamp: {
    normal: [
      { name: "Sumpfzombie", sprite: "swamp_zombie" },
      { name: "Hexe", sprite: "swamp_hag" },
      { name: "Alligator", sprite: "swamp_alligator" },
      { name: "Riesenkröte", sprite: "swamp_toad" },
      { name: "Blutegel", sprite: "swamp_leech" },
      { name: "Mückenschwarm", sprite: "swamp_mosquito_swarm" },
      { name: "Schlammelementar", sprite: "swamp_mud_elemental" }
    ],
    boss: [
      { name: "Sumpf-Boss", sprite: "boss_swamp" }
    ]
  },
  frost: {
    normal: [
      { name: "Eisgolem", sprite: "snow_ice_golem" },
      { name: "Frostfledermaus", sprite: "snow_frost_bat" },
      { name: "Yeti", sprite: "snow_yeti" },
      { name: "Frostschächer", sprite: "snow_frost_raider" },
      { name: "Eisspinne", sprite: "snow_ice_spider" },
      { name: "Eisgeist", sprite: "snow_ice_wraith" },
      { name: "Schneeschamane", sprite: "snow_shaman" }
    ],
    boss: [
      { name: "Schnee-Boss", sprite: "boss_frost" }
    ]
  },
  fire: {
    normal: [
      { name: "Feuerimp", sprite: "volcano_fire_imp" },
      { name: "Höllenhund", sprite: "volcano_hellhound" },
      { name: "Obsidian-Golem", sprite: "volcano_obsidian_golem" },
      { name: "Magma-Skorpion", sprite: "volcano_magma_scorpion" },
      { name: "Salamander", sprite: "volcano_salamander" },
      { name: "Aschengeist", sprite: "volcano_ash_wraith" },
      { name: "Vulkan-Kultist", sprite: "volcano_cultist" }
    ],
    boss: [
      { name: "Vulkan-Boss", sprite: "boss_fire" }
    ]
  },
  ruins: {
    normal: [
      { name: "Mumienkrieger", sprite: "ruins_mummy_warrior" },
      { name: "Skelettbogenschütze", sprite: "ruins_skeleton_archer" },
      { name: "Steinhüter", sprite: "ruins_stone_guardian" },
      { name: "Verfluchter Priester", sprite: "ruins_cursed_priest" },
      { name: "Sandwurm", sprite: "ruins_sand_worm" },
      { name: "Skarabäus-Schwarm", sprite: "ruins_scarab_swarm" },
      { name: "Sphinx", sprite: "ruins_sphinx" }
    ],
    boss: [
      { name: "Ruinen-Boss", sprite: "boss_ruins" }
    ]
  }
};

const WORLD_THEME_SKINS = {
  forest: {
    sky: "#040e0a", bg: "#071812", hill: "#0a2218",
    hill2: "#0d2e1e", hill3: "#123824",
    ground: "#1a1208", moss: "#1b4332", leaf: "#2d6a4f",
    accent: "#52b788", fog: "rgba(8,28,18,0.55)",
    fog2: "rgba(20,50,30,0.35)", particleColor: "#95e1a3"
  },
  swamp: {
    sky: "#060a06", bg: "#0a1208", hill: "#141a10",
    hill2: "#1a2214", hill3: "#202818",
    ground: "#1a1810", moss: "#354828", leaf: "#405838",
    accent: "#52b788", fog: "rgba(15,25,10,0.55)",
    fog2: "rgba(30,45,20,0.35)", particleColor: "#7cba6a"
  },
  frost: {
    sky: "#080c18", bg: "#0c1428", hill: "#142038",
    hill2: "#182848", hill3: "#1c3058",
    ground: "#c8d8e8", moss: "#6a8898", leaf: "#a8d8ea",
    accent: "#85c1e9", fog: "rgba(160,200,240,0.35)",
    fog2: "rgba(200,220,255,0.2)", particleColor: "#d4e8f8"
  },
  fire: {
    sky: "#0a0202", bg: "#180606", hill: "#3a0c08",
    hill2: "#4a1008", hill3: "#5a180a",
    ground: "#2a0804", moss: "#5a1a08", leaf: "#922b21",
    accent: "#e74c3c", fog: "rgba(80,20,5,0.45)",
    fog2: "rgba(120,40,10,0.3)", particleColor: "#f39c12"
  },
  ruins: {
    sky: "#0a0814", bg: "#100c1c", hill: "#1a1430",
    hill2: "#201838", hill3: "#281c40",
    ground: "#2a2438", moss: "#4a5058", leaf: "#5a6068",
    accent: "#f1c40f", fog: "rgba(25,20,35,0.4)",
    fog2: "rgba(40,35,55,0.25)", particleColor: "#bb86fc"
  }
};

function buildWorldsFromBalance() {
  const defs = (typeof dlWorldDefs === "function") ? dlWorldDefs() : null;
  if (!defs) {
    return Object.keys(WORLD_THEME_SKINS).map((theme, i) => ({
      name: theme, min: 1 + i * 20, danger: i + 1, theme,
      hpMult: 1, atkMult: 1, speedMult: 1, length: 20,
      ...(WORLD_THEME_SKINS[theme] || {})
    }));
  }
  return defs.map((d) => ({
    name: d.name, min: d.min, danger: d.danger, theme: d.theme,
    hpMult: d.hpMult, atkMult: d.atkMult, speedMult: d.speedMult,
    length: d.length,
    budgetEarly: d.budgetEarly, budgetMid: d.budgetMid,
    budgetLate: d.budgetLate, budgetBoss: d.budgetBoss,
    ...(WORLD_THEME_SKINS[d.theme] || WORLD_THEME_SKINS.forest)
  }));
}

const WORLDS = buildWorldsFromBalance();

// Welt-Integration für Charaktere (Schatten, Licht, Farbton)
const WORLD_CHAR_STYLE = {
  forest: {
    shadow: "rgba(3,12,6,0.52)", contact: "rgba(18,42,24,0.42)",
    tint: "#2d6a4f", tintA: 0.13, fog: "rgba(8,28,18,0.55)"
  },
  swamp: {
    shadow: "rgba(6,10,4,0.58)", contact: "rgba(30,45,20,0.38)",
    tint: "#354828", tintA: 0.16, fog: "rgba(15,25,10,0.55)", rim: "rgba(82,183,136,0.18)"
  },
  frost: {
    shadow: "rgba(8,16,32,0.52)", contact: "rgba(120,160,200,0.28)",
    tint: "#85c1e9", tintA: 0.12, fog: "rgba(160,200,240,0.35)", rim: "rgba(212,232,248,0.2)"
  },
  fire: {
    shadow: "rgba(22,5,0,0.62)", contact: "rgba(160,50,12,0.48)",
    tint: "#922b21", tintA: 0.19, fog: "rgba(80,20,5,0.45)", rim: "rgba(243,156,18,0.25)"
  },
  ruins: {
    shadow: "rgba(10,8,16,0.52)", contact: "rgba(40,36,48,0.36)",
    tint: "#5a6068", tintA: 0.11, fog: "rgba(25,20,35,0.45)", rim: "rgba(241,196,15,0.14)"
  }
};

/** Loot-Typen je Klasse – erweitertes Beutesystem */
const LOOT_TYPES_BY_CLASS = {
  warrior: ["Schwert", "Schild", "Rüstung", "Amulett"],
  ranger:  ["Bogen", "Rüstung", "Amulett"],
  mage:    ["Stab", "Zauberbuch", "Rüstung", "Amulett"]
};
const LOOT_PREFIXES = [
  "Verzaubertes", "Uraltes", "Dunkles", "Strahlendes", "Verfluchtes",
  "Meister-", "Runen-", "Drachen-", "Schatten-", "Kristall-"
];
const LOOT_SUFFIXES = {
  Schwert: [" der Macht", " des Kriegers", " der Flammen"],
  Schild:  [" der Treue", " des Wächters"],
  Bogen:   [" der Präzision", " des Windes", " des Jägers"],
  Stab:    [" der Weisheit", " der Elemente", " des Archon"],
  Zauberbuch: [" der Geheimnisse", " der Runen"],
  Rüstung: [" der Standhaftigkeit", " des Helden"],
  Amulett: [" des Glücks", " der Vitalität", " der Kritischen Treffer"]
};
/** Seltenheiten: Normal → Mythisch mit zufälligen Werten */
const RARITIES = [
  { name: "Normal",    chance: 0.40, mult: 1,   css: "rarity-normal",    logCss: "loot" },
  { name: "Selten",    chance: 0.28, mult: 2,   css: "rarity-rare",      logCss: "loot" },
  { name: "Episch",    chance: 0.18, mult: 3.5, css: "rarity-epic",      logCss: "loot" },
  { name: "Legendär",  chance: 0.10, mult: 6,   css: "rarity-legendary", logCss: "loot-legendary" },
  { name: "Mythisch",  chance: 0.04, mult: 11,  css: "rarity-mythic",    logCss: "loot-mythic" }
];
const LOOT_EFFECTS = [
  { key: "attack", label: "Angriff" }, { key: "hp", label: "Leben" },
  { key: "defense", label: "Verteidigung" }, { key: "crit", label: "Krit" },
  { key: "goldBonus", label: "Gold" }, { key: "magicDamage", label: "Magie" }, { key: "mana", label: "Mana" }
];
const UPGRADES = (typeof dlUpgradesAsLegacy === "function")
  ? dlUpgradesAsLegacy()
  : [
  { key: "upgrade_health",   label: "Leben",        baseCost: 75,  bonus: 26,  bonusText: "+LP", tip: "Überleben", forClass: "all" },
  { key: "upgrade_defense",  label: "Rüstung",      baseCost: 70,  bonus: 1.15, bonusText: "+DEF", tip: "DEF", forClass: "all" },
  { key: "upgrade_attack",   label: "Angriff",      baseCost: 85,  bonus: 5,   bonusText: "+ATK", tip: "ATK", forClass: "warrior,ranger" },
  { key: "upgrade_magic",    label: "Magieschaden", baseCost: 90,  bonus: 5.5, bonusText: "+MAG", tip: "MAG", forClass: "mage" },
  { key: "upgrade_mana",     label: "Mana",         baseCost: 90,  bonus: 16,  bonusText: "+Mana", tip: "Mana", forClass: "mage" },
  { key: "upgrade_crit",     label: "Krit-Chance",  baseCost: 115, bonus: 0.018, bonusText: "+Krit", tip: "Krit", forClass: "all" },
  { key: "upgrade_gold",     label: "Gold-Fund",    baseCost: 100, bonus: 0.09, bonusText: "+Gold", tip: "Gold", forClass: "all" },
  { key: "upgrade_xp",       label: "XP-Bonus",     baseCost: 90,  bonus: 0.06, bonusText: "+XP", tip: "XP", forClass: "all" },
  { key: "upgrade_cooldown", label: "Spezial-CD",   baseCost: 135, bonus: 0.35, bonusText: "-CD", tip: "CD", forClass: "all" }
];

// BALANCE – Proxy auf DL_BALANCE (zentrale Config in balance.js)
const BALANCE = (typeof DL_BALANCE !== "undefined") ? {
  upgradeCostPow: DL_BALANCE.economy.costPow,
  upgradeCostSoftLv: DL_BALANCE.economy.costSoftLv,
  upgradeCostLinear: DL_BALANCE.economy.costLinear,
  upgradeMax: DL_BALANCE.economy.upgradeMax,
  lootChance: DL_BALANCE.enemy.lootChance,
  xpPerLevel: DL_BALANCE.xpPerLevel,
  levelScalePow: DL_BALANCE.enemy.depthPowHp,
  levelUpHealPct: DL_BALANCE.levelUpHealPct,
  waveCooldown: DL_BALANCE.enemy.waveCooldown,
  minWaveCooldown: DL_BALANCE.enemy.minWaveCooldown,
  defenseFactor: DL_BALANCE.armorFactor,
  earlyEaseUntil: DL_BALANCE.enemy.earlyEaseUntil,
  earlyHpEase: DL_BALANCE.enemy.earlyHpEase,
  earlyAtkEase: DL_BALANCE.enemy.earlyAtkEase,
  difficultyMult: DL_BALANCE.enemy.difficultyMult,
  farmGoldPerUpgrade: 0,
  farmGoldCap: 0,
  coinLife: 2.4,
  coinJumpDur: 0.78,
  coinJumpHeight: 118,
  coinHitRadius: 28,
  coinCatchDelay: 0.14,
  coinCatchMoveMin: 28,
  pierceFactor: DL_BALANCE.pierceFactor,
  critDamageBase: DL_BALANCE.critDamageBase,
  critChanceCap: DL_BALANCE.critChanceCap
} : {
  upgradeCostPow: 1.38,
  upgradeCostSoftLv: 8,
  upgradeCostLinear: 0.28,
  upgradeMax: 24,
  lootChance: 0.2,
  xpPerLevel: 130,
  levelScalePow: 1.028,
  levelUpHealPct: 0.18,
  waveCooldown: 1.9,
  minWaveCooldown: 0.9,
  defenseFactor: 1.35,
  earlyEaseUntil: 12,
  earlyHpEase: 0.10,
  earlyAtkEase: 0.14,
  difficultyMult: 1.0,
  farmGoldPerUpgrade: 0,
  farmGoldCap: 0,
  coinLife: 2.4,
  coinJumpDur: 0.78,
  coinJumpHeight: 118,
  coinHitRadius: 28,
  coinCatchDelay: 0.14,
  coinCatchMoveMin: 28,
  pierceFactor: 0.12,
  critDamageBase: 1.85,
  critChanceCap: 0.52
};
let enemyId = 0;
let upgradePause = false;

const game = {
  playerName: "", classKey: "warrior", playerId: null, slotIndex: 0,
  totalGold: 0, upgrades: {},
  isRunning: false, isPaused: false, isDead: false,
  dungeonLevel: 1, runGold: 0, runXp: 0, playerLevel: 1, monstersDefeated: 0,
  /** Gold aus dem letzten Run (für Game-Over-Anzeige nach dem Einbuchen) */
  lastRunGold: 0,
  /** Aktuelle Welt (0..WORLDS.length-1) – wechselt erst nach Boss-Welle */
  worldIndex: 0,
  /** Aktuelle Welle war Welt-Boss (Tor zur nächsten Welt) */
  waveWasBoss: false,
  /** Dungeon Loop einmal komplett geschafft (Run beendet) */
  loopCompleted: false,
  hero: null, enemies: [], projectiles: [], particles: [], coins: [], meleeSlashes: [],
  attackEffects: [], screenShake: 0,
  waveNumber: 0, currentWave: null,
  worldParticles: [],
  combatLog: [], bestLoot: null,
  specialTimer: 0, lastShot: 0,
  scrollX: 0, waveCooldown: 0,
  waveIntro: false, combatReady: false,
  loopId: null,
  /** Meta-Fortschritt (persistent via localStorage) */
  meta: null,
  /** Boss-Einblendung { name, hp, maxHp, timer } */
  bossIntro: null,
  /** Sichtbare Spielmeldungen: Weltwechsel / Fähigkeit bereit */
  announcement: null,
  /** Dezente Bildschirm-Effekte */
  critFlash: 0, zoomPulse: 0,
  /** Fähigkeiten-Cast-Sperre (keine gleichzeitigen Spezialfähigkeiten) */
  abilityCastLock: 0,
  /** Loop/NG+ (0 = First Clear) */
  loopIndex: 0,
  /** Run-Telemetry für Death-Screen / Balancing */
  runStats: null,
  /** Persistente Bestwerte (pro Slot via meta/records) */
  records: null,
  /** Encounter-Rhythmus: Atem-Wellen nach harten Fights */
  breathWavesLeft: 0,
  lastEncounterIntensity: 1,
  /** Pity: Runs ohne Upgrade-Kauf */
  emptyUpgradeRuns: 0,
  /** Upgrade in diesem Run-Zyklus gekauft? */
  upgradeBoughtThisRun: false,
  /** Boss-Near-Miss Tracking */
  activeBossMaxHp: 0,
  activeBossMinHpFrac: 1,
  runStartMs: 0
};

let WAVE_DATA = null;
let SOUND_MAP = null;
const audioCache = {};
let musicTrack = null;
let musicKey = null;
let audioUnlocked = false;

/** Audio-Einstellungen – unabhängig für Musik & Soundeffekte (localStorage) */
const AUDIO_PREFS_KEY = "dungeon_loop_audio";
let audioPrefs = {
  musicEnabled: true, sfxEnabled: true,
  musicVolume: 0.32, sfxVolume: 0.55,
  screenShake: true, particles: true,
  seenTutorial: false
};
let saveToastTimer = 0;

/** Meta-Fortschritt – Fähigkeiten-Freischaltung & Account-Level */
const META_STORAGE_KEY = "dungeon_loop_meta";
/** Offline-Spielstände – max. 3 Slots */
const PLAYERS_STORAGE_KEY = "dungeon_loop_players";
const SAVE_SLOTS_KEY = "dungeon_loop_save_slots_v2";
const MAX_SAVE_SLOTS = 3;
/** Aktiver Run – Fortsetzen nach Reload / Tab schließen */
const RUN_STORAGE_KEY = "dungeon_loop_active_run";
/** Zuletzt genutzter Slot / Spieler */
const LAST_PLAYER_KEY = "dungeon_loop_last_player";
const LAST_SLOT_KEY = "dungeon_loop_last_slot";
/** Legacy Highscores (nicht mehr angezeigt) */
const LOCAL_SCORES_KEY = "dungeon_loop_scores";
const RUN_SAVE_VERSION = 4;
let runSaveTimer = 0;
let runSaveDirty = false;
/** Aktuell gewählter Speicher-Slot (0..2) */
let pendingSlotIndex = 0;

/** Gegner-KI: unterschiedliche Kampfstile pro Monstertyp */
const ENEMY_AI = {
  _default:   { style: "melee",  speedMult: 1,    atkMult: 1,    intervalMult: 1 },
  Goblin:     { style: "fast",   speedMult: 1.38, atkMult: 0.88, intervalMult: 0.82 },
  Bandit:     { style: "fast",   speedMult: 1.2,  atkMult: 1.0,  intervalMult: 0.92 },
  Waldspinne: { style: "fast",   speedMult: 1.18, atkMult: 0.95, intervalMult: 0.88 },
  Hornisse:   { style: "fast",   speedMult: 1.35, atkMult: 0.9,  intervalMult: 0.8 },
  Setzling:   { style: "melee",  speedMult: 0.9,  atkMult: 0.85, intervalMult: 1.05 },
  Rankenkriecher: { style: "melee", speedMult: 0.95, atkMult: 1.05, intervalMult: 1.0 },
  Waldgeist:  { style: "ranged", speedMult: 0.95, atkMult: 0.88, intervalMult: 1.0,  range: 190 },
  Sumpfzombie:{ style: "slow",   speedMult: 0.62, atkMult: 1.38, intervalMult: 1.3 },
  Hexe:       { style: "ranged", speedMult: 0.88, atkMult: 0.82, intervalMult: 1.1, range: 185 },
  Alligator:  { style: "jump",   speedMult: 1.15, atkMult: 1.2,  intervalMult: 1.05 },
  "Riesenkröte": { style: "melee", speedMult: 0.8, atkMult: 1.1, intervalMult: 1.15 },
  Blutegel:   { style: "fast",   speedMult: 1.25, atkMult: 0.85, intervalMult: 0.9 },
  Mückenschwarm: { style: "fast", speedMult: 1.4, atkMult: 0.75, intervalMult: 0.75 },
  Schlammelementar: { style: "slow", speedMult: 0.7, atkMult: 1.35, intervalMult: 1.25 },
  Eisgolem:   { style: "slow",   speedMult: 0.58, atkMult: 1.55, intervalMult: 1.35 },
  Frostfledermaus: { style: "fast", speedMult: 1.32, atkMult: 0.9, intervalMult: 0.85 },
  Yeti:       { style: "jump",   speedMult: 1.1,  atkMult: 1.25, intervalMult: 1.05 },
  Frostschächer: { style: "melee", speedMult: 1.05, atkMult: 1.1, intervalMult: 0.95 },
  Eisspinne:  { style: "fast",   speedMult: 1.2,  atkMult: 1.0,  intervalMult: 0.9 },
  Eisgeist:   { style: "ranged", speedMult: 0.92, atkMult: 0.85, intervalMult: 1.05, range: 200 },
  Schneeschamane: { style: "ranged", speedMult: 0.9, atkMult: 0.88, intervalMult: 1.1, range: 195 },
  Feuerimp:   { style: "fast",   speedMult: 1.3,  atkMult: 0.95, intervalMult: 0.85 },
  "Höllenhund": { style: "jump", speedMult: 1.3,  atkMult: 1.15, intervalMult: 0.85 },
  "Obsidian-Golem": { style: "slow", speedMult: 0.55, atkMult: 1.6, intervalMult: 1.4 },
  "Magma-Skorpion": { style: "melee", speedMult: 1.05, atkMult: 1.15, intervalMult: 0.95 },
  Salamander: { style: "melee",  speedMult: 1.1,  atkMult: 1.1,  intervalMult: 1.0 },
  Aschengeist:{ style: "ranged", speedMult: 1.0,  atkMult: 0.9,  intervalMult: 0.95, range: 175 },
  "Vulkan-Kultist": { style: "ranged", speedMult: 0.92, atkMult: 0.88, intervalMult: 1.05, range: 180 },
  Mumienkrieger: { style: "slow", speedMult: 0.72, atkMult: 1.35, intervalMult: 1.15 },
  Skelettbogenschütze: { style: "ranged", speedMult: 0.95, atkMult: 0.9, intervalMult: 1.0, range: 200 },
  Steinhüter: { style: "slow",   speedMult: 0.6,  atkMult: 1.5,  intervalMult: 1.3 },
  "Verfluchter Priester": { style: "ranged", speedMult: 0.88, atkMult: 0.85, intervalMult: 1.1, range: 190 },
  Sandwurm:   { style: "melee",  speedMult: 0.95, atkMult: 1.2,  intervalMult: 1.1 },
  "Skarabäus-Schwarm": { style: "fast", speedMult: 1.35, atkMult: 0.8, intervalMult: 0.8 },
  Sphinx:     { style: "melee",  speedMult: 1.0,  atkMult: 1.25, intervalMult: 1.05 },
  _boss:      { style: "boss",   speedMult: 0.88, atkMult: 1.0,  intervalMult: 0.95 }
};

const $ = (id) => document.getElementById(id);

// ============================================
// PIXEL ZEICHNEN
// ============================================

function drawSprite(c, rows, x, y, flip) {
  drawSpriteScaled(c, rows, x, y, flip, PIXEL);
}

function drawDecorSprite(c, rows, x, y, flip, sc) {
  drawSpriteScaled(c, rows, x, y, flip, sc || DECOR_PIXEL);
}

function drawBgSprite(c, rows, x, y, flip) {
  drawSpriteScaled(c, rows, x, y, flip, BG_PIXEL);
}

function drawCharSprite(c, rows, x, y, flip, sc) {
  drawSpriteScaled(c, rows, x, y, flip, sc || CHAR_PIXEL);
}

function drawSpriteScaled(c, rows, x, y, flip, sc) {
  for (let r = 0; r < rows.length; r++) {
    for (let col = 0; col < rows[r].length; col++) {
      const ch = rows[r][col];
      const color = PAL[ch];
      if (!color) continue;
      const dc = flip ? rows[r].length - 1 - col : col;
      c.fillStyle = color;
      c.fillRect(Math.floor(x + dc * sc), Math.floor(y + r * sc), sc, sc);
    }
  }
}

function spriteW(rows) { return rows[0].length * PIXEL; }
function spriteH(rows) { return rows.length * PIXEL; }
function spriteDecorW(rows, sc) { return rows[0].length * (sc || DECOR_PIXEL); }
function spriteDecorH(rows, sc) { return rows.length * (sc || DECOR_PIXEL); }
function spriteWeaponW(rows) { return rows[0].length * WEAPON_PIXEL; }
function spriteWeaponH(rows) { return rows.length * WEAPON_PIXEL; }

function drawWeaponSprite(c, rows, x, y, flip, glowColor, sc) {
  const scale = sc || WEAPON_PIXEL;
  if (glowColor) {
    c.save();
    c.globalAlpha = 0.28;
    c.shadowColor = glowColor;
    c.shadowBlur = 3;
    drawSpriteScaled(c, rows, x, y, flip, scale);
    c.restore();
  }
  drawSpriteScaled(c, rows, x, y, flip, scale);
}
function spriteCharW(rows) { return rows[0].length * ENEMY_PIXEL; }
function spriteCharH(rows) { return rows.length * ENEMY_PIXEL; }

function getCharStyle(world) {
  return WORLD_CHAR_STYLE[world?.theme] || WORLD_CHAR_STYLE.forest;
}

function drawCharShadow(c, cx, footY, w, style, bob, big) {
  const sy = footY + 1 - (bob || 0) * 0.25;
  const sw = Math.max(16, w * (big ? 0.52 : 0.44));
  c.save();
  c.fillStyle = style.shadow;
  c.beginPath();
  c.ellipse(cx, sy, sw, 4.5 + (big ? 2 : 0), 0, 0, Math.PI * 2);
  c.fill();
  if (style.contact) {
    c.fillStyle = style.contact;
    c.globalAlpha = 0.9;
    c.beginPath();
    c.ellipse(cx, sy - 1, sw * 0.62, 2.5, 0, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

function applyWorldCharTint(c, x, y, w, h, world) {
  const style = getCharStyle(world);
  if (style.tint && style.tintA > 0) {
    c.save();
    c.globalCompositeOperation = "multiply";
    c.globalAlpha = style.tintA;
    c.fillStyle = style.tint;
    c.fillRect(x - 2, y - 1, w + 4, h + 2);
    c.restore();
  }
  if (style.rim) {
    c.save();
    const g = c.createLinearGradient(x, y, x, y + h * 0.38);
    g.addColorStop(0, style.rim);
    g.addColorStop(1, "rgba(0,0,0,0)");
    c.globalCompositeOperation = "screen";
    c.fillStyle = g;
    c.fillRect(x - 2, y - 1, w + 4, h * 0.35);
    c.restore();
  }
}

function drawCharFeetFog(c, x, y, w, h, world) {
  const style = getCharStyle(world);
  const fogCol = style.fog || world.fog || "rgba(0,0,0,0.3)";
  c.save();
  const g = c.createLinearGradient(x, y + h * 0.5, x, y + h + 5);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(0.55, fogCol);
  g.addColorStop(1, fogCol);
  c.globalAlpha = 0.4;
  c.fillStyle = g;
  c.fillRect(x - 4, y + h * 0.48, w + 8, h * 0.55 + 6);
  c.restore();
}

function getEnemyAnchorX(e, drawX) {
  const x = drawX ?? getEnemyDrawX(e);
  return x + e.w / 2;
}

function drawLivingChar(c, spriteKey, x, y, w, h, flip, world, bob, big) {
  if (typeof VisualEnemies !== "undefined" && typeof VisualEnemies.drawAtFeet === "function") {
    if (VisualEnemies.drawAtFeet(c, spriteKey, x + w / 2, GROUND, flip, world, bob, big, w, h)) return;
  } else if (typeof VisualEnemies !== "undefined" && VisualEnemies.draw(c, spriteKey, x, y, w, h, flip, world, bob, big)) return;
  const sprite = SPRITES[spriteKey];
  if (!sprite) return;
  const footY = y + h;
  const cx = x + w / 2;
  drawCharShadow(c, cx, footY, w, getCharStyle(world), bob, big);
  drawCharSprite(c, sprite, x, y, flip, ENEMY_PIXEL);
  applyWorldCharTint(c, x, y, w, h, world);
  drawCharFeetFog(c, x, y, w, h, world);
}

function getEnemyDrawX(e) {
  const lunge = e.attackAnim > 0 ? (e.isBoss ? 14 : 10) * e.attackAnim : 0;
  return e.x - lunge;
}

function getEnemyVisualBounds(e, drawX) {
  const anchorX = getEnemyAnchorX(e, drawX);
  if (typeof VisualEnemies !== "undefined" && typeof VisualEnemies.getBoundsAtFeet === "function") {
    return VisualEnemies.getBoundsAtFeet(e.sprite, anchorX, GROUND, e.isBoss, true, e.w, e.h);
  }
  return { x: anchorX - e.w / 2, y: GROUND - e.h, w: e.w, h: e.h, cx: anchorX, footY: GROUND };
}

function pointInEnemyBody(e, wx, wy, drawX) {
  const b = getEnemyVisualBounds(e, drawX);
  return wx >= b.x && wx <= b.x + b.w && wy >= b.y && wy <= b.y + b.h;
}

function drawHero(c, h, bob, atkOff, hurtOff, world) {
  const aim = getCombatAim();
  HR.draw(c, {
    x: h.x + (atkOff || 0), h, world, atkOff, hurtOff,
    classKey: game.classKey, aimX: aim.x, aimY: aim.y, groundY: GROUND
  });
}

function drawPremiumSlashFx(c, s) {
  if (typeof PackFX !== "undefined" && PackFX.drawSlash(c, s)) return;
  const maxLife = s.maxLife || (s.big ? 20 : 14);
  const t = s.life / maxLife;
  const color = s.owner === "enemy" ? "#e74c3c" : game.classKey === "warrior" ? "#f1c40f" : game.classKey === "ranger" ? "#95e1a3" : "#bb86fc";
  const edge = s.owner === "enemy" ? "#ff8a65" : "#ffffff";
  c.save();
  c.translate(s.x, s.y);
  c.rotate(s.angle);
  c.globalCompositeOperation = "screen";
  c.globalAlpha = t * 0.65;
  for (let i = 0; i < 4; i++) {
    c.fillStyle = i === 0 ? edge : color;
    c.fillRect(Math.round(s.range * (0.16 + i * 0.08)), Math.round(-12 - i * 2), Math.round(18 + i * 10), 2);
    c.fillRect(Math.round(s.range * (0.2 + i * 0.08)), Math.round(9 + i), Math.round(14 + i * 8), 2);
  }
  c.globalAlpha = t * 0.28;
  c.strokeStyle = color;
  c.lineWidth = s.big ? 5 : 3;
  c.beginPath();
  c.arc(s.range * 0.18, 0, s.range * (s.big ? 0.34 : 0.26), -0.75, 0.7);
  c.stroke();
  c.restore();
}

function drawPremiumProjectileFx(c, p) {
  if (typeof PackFX !== "undefined" && PackFX.drawProjectile(c, p)) return;
  const rows = SPRITES[p.sprite];
  if (!rows) return;
  const sc = p.big ? 1.5 : 1;
  const pw = rows[0].length * PIXEL * sc;
  const ph = rows.length * PIXEL * sc;
  const speed = Math.hypot(p.vx || 0, p.vy || 0) || 1;
  const ux = (p.vx || 0) / speed;
  const uy = (p.vy || 0) / speed;
  const isFire = p.sprite === "projectile_fire";
  const trail = isFire ? "#f39c12" : p.trail || (game.classKey === "mage" ? "#8bd8ff" : "#d8c28a");
  c.save();
  c.globalCompositeOperation = "screen";
  c.globalAlpha = isFire ? 0.55 : 0.36;
  c.fillStyle = trail;
  for (let i = 1; i <= 5; i++) {
    c.fillRect(Math.round(p.x - ux * i * 6), Math.round(p.y - uy * i * 6), Math.max(1, 5 - i), Math.max(1, 3 - (i > 2 ? 1 : 0)));
  }
  if (isFire) {
    const g = c.createRadialGradient(p.x, p.y, 2, p.x, p.y, p.big ? 28 : 18);
    g.addColorStop(0, "rgba(255,220,100,0.75)");
    g.addColorStop(0.45, "rgba(231,76,60,0.22)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    c.fillStyle = g;
    c.fillRect(p.x - 30, p.y - 30, 60, 60);
  }
  c.globalAlpha = 1;
  c.globalCompositeOperation = "source-over";
  drawSprite(c, rows, p.x - pw / 2, p.y - ph / 2, (p.vx || 0) < 0);
  c.restore();
}

let heroCardRaf = null;
let heroCardFrame = 0;
let heroCardTime = 0;

/* ============================================
   HAUPTMENÜ-LOGO – klar & ruhig
   Waldweg + drei Helden (keine Props/FX-Schicht)
   ============================================ */
let menuBrandRaf = null;
let menuBrandTime = 0;

function drawMenuBrandScaled(ctx, img, x, y, scale, flip) {
  if (!img || !img.complete || img.naturalWidth <= 0) return { w: 0, h: 0 };
  const dw = Math.max(1, Math.round(img.width * scale));
  const dh = Math.max(1, Math.round(img.height * scale));
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (flip) {
    ctx.translate(Math.round(x + dw), Math.round(y));
    ctx.scale(-1, 1);
    ctx.drawImage(img, 0, 0, dw, dh);
  } else {
    ctx.drawImage(img, Math.round(x), Math.round(y), dw, dh);
  }
  ctx.restore();
  return { w: dw, h: dh };
}

function drawMenuBrand(cv, time) {
  if (!cv) return;
  const ctx = cv.getContext("2d");
  const W = cv.width;
  const H = cv.height;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, W, H);

  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#07140f");
  g.addColorStop(1, "#0a0c10");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  const pack = typeof PackAssets !== "undefined" ? PackAssets : null;
  if (!pack) return;

  const scene = pack.worldImg("forest", "scene");
  const lane = pack.worldImg("forest", "lane");
  // Weg unten, Wald darüber – wie im Spiel (Maueroberkante = groundY)
  const laneH = 58;
  const sceneH = H - laneH;
  const groundY = sceneH + 2; // Füße sitzen auf der Mauerkrone

  if (scene && scene.complete && scene.naturalWidth > 0) {
    const sx = Math.min(160, Math.max(0, scene.width - W));
    ctx.drawImage(scene, sx, 0, W, Math.min(scene.height, 288), 0, 0, W, sceneH);
  }
  if (lane && lane.complete && lane.naturalWidth > 0) {
    const sx = Math.min(160, Math.max(0, lane.width - W));
    ctx.drawImage(lane, sx, 0, W, lane.height, 0, sceneH, W, laneH);
  }

  // Drei Helden fest auf dem Weg – kein Schweben, kein Bob
  const heroes = ["warrior", "ranger", "mage"];
  const heroXs = [74, 160, 246];
  const sc = 2.05;
  heroes.forEach((cls, i) => {
    const img = pack.hero(cls, "idle");
    if (!img) return;
    const dw = img.width * sc;
    const dh = img.height * sc;
    const cx = heroXs[i];
    // Bodenschatten direkt auf der Mauerkrone
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.beginPath();
    ctx.ellipse(cx, groundY + 1, Math.max(14, dw * 0.3), 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    drawMenuBrandScaled(ctx, img, cx - dw / 2, groundY - dh, sc, false);
  });

  // Leichte seitliche Abdunkelung, kein starker Vignette-Kreis
  const edge = ctx.createLinearGradient(0, 0, W, 0);
  edge.addColorStop(0, "rgba(0,0,0,0.35)");
  edge.addColorStop(0.18, "rgba(0,0,0,0)");
  edge.addColorStop(0.82, "rgba(0,0,0,0)");
  edge.addColorStop(1, "rgba(0,0,0,0.35)");
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, W, H);
}

function tickMenuBrand() {
  const cv = $("menu-brand-canvas");
  const home = $("menu-home");
  const setup = $("setup-section");
  if (!cv || setup?.classList.contains("collapsed") || home?.classList.contains("hidden")) {
    menuBrandRaf = null;
    return;
  }
  drawMenuBrand(cv, menuBrandTime);
  const pack = typeof PackAssets !== "undefined" ? PackAssets : null;
  const ready = !!(pack && pack.menuBrandReady && pack.hero("warrior", "idle"));
  if (ready) {
    menuBrandRaf = null;
    return;
  }
  menuBrandTime += 1 / 60;
  menuBrandRaf = requestAnimationFrame(tickMenuBrand);
}

function startMenuBrandLoop() {
  if (menuBrandRaf) cancelAnimationFrame(menuBrandRaf);
  drawMenuBrand($("menu-brand-canvas"), menuBrandTime);
  menuBrandRaf = requestAnimationFrame(tickMenuBrand);
}

function stopMenuBrandLoop() {
  if (menuBrandRaf) cancelAnimationFrame(menuBrandRaf);
  menuBrandRaf = null;
}

async function bootMenuBrand() {
  if (typeof PackAssets === "undefined") return;
  try {
    await PackAssets.loadMenuBrand();
    drawMenuBrand($("menu-brand-canvas"), menuBrandTime);
    startMenuBrandLoop();
  } catch (err) {
    console.warn("Menü-Logo laden fehlgeschlagen", err);
  }
}

function updateHeroCardUI() {
  const cls = CLASSES[game.classKey];
  if (!cls) return;
  const card = $("hero-card");
  const title = $("hero-card-class");
  if (title) title.textContent = cls.name.toUpperCase();
  if ($("hero-stat-hp")) $("hero-stat-hp").textContent = cls.hp;
  if ($("hero-stat-atk")) $("hero-stat-atk").textContent = cls.attack;
  if ($("hero-stat-def")) $("hero-stat-def").textContent = cls.defense;
  if ($("hero-weapon-name")) $("hero-weapon-name").textContent = CLASS_WEAPONS[game.classKey] || cls.name;
  if (card) {
    card.classList.remove("warrior", "ranger", "mage");
    card.classList.add(game.classKey);
  }
  // Canvas sofort neu zeichnen – sonst bleibt manchmal der alte Held stehen,
  // wenn die Preview-Schleife pausiert war.
  drawHeroCardFrame();
}

function drawHeroCardFrame(frame) {
  const cv = $("hero-card-canvas");
  if (!cv || !HR) return;
  const c = cv.getContext("2d");
  c.imageSmoothingEnabled = false;
  HR.drawHeroCard(c, game.classKey, cv.width, cv.height, frame == null ? heroCardFrame : frame);
}

function tickHeroCard() {
  const cv = $("hero-card-canvas");
  const setup = $("setup-section");
  const newPanel = $("menu-new");
  // Nur zeichnen, wenn Heldenwahl sichtbar ist – Loop trotzdem am Leben halten,
  // solange Setup offen ist, damit Klassenwechsel sofort greifen.
  if (!cv || !HR || setup?.classList.contains("collapsed")) {
    heroCardRaf = null;
    return;
  }
  heroCardTime += 1 / 60;
  if (heroCardTime >= HR.ANIM.idle.t) {
    heroCardTime = 0;
    heroCardFrame = (heroCardFrame + 1) % 10;
  }
  if (!newPanel?.classList.contains("hidden")) {
    drawHeroCardFrame(heroCardFrame);
  }
  heroCardRaf = requestAnimationFrame(tickHeroCard);
}

function startHeroCardLoop() {
  if (heroCardRaf) cancelAnimationFrame(heroCardRaf);
  heroCardFrame = 0;
  heroCardTime = 0;
  updateHeroCardUI();
  heroCardRaf = requestAnimationFrame(tickHeroCard);
}

function stopHeroCardLoop() {
  if (heroCardRaf) cancelAnimationFrame(heroCardRaf);
  heroCardRaf = null;
}

function drawPreviews() {
  updateHeroCardUI();
}

// ============================================
// INIT
// ============================================

document.addEventListener("DOMContentLoaded", async () => {
  canvas = $("game-canvas");
  ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  game.meta = loadMeta();
  loadAudioPrefs();

  // UI sofort bedienbar – nicht auf das volle Asset-Pack warten
  bindEvents();
  syncUnlockedAbilities();
  renderUpgradeButtons();
  renderSetupAbilityHint();
  renderAbilityPanel();
  restoreSetupFromSave();
  const buildEl = document.querySelector(".footer-build");
  if (buildEl) buildEl.textContent = BUILD_ID;
  drawPreviews();
  startHeroCardLoop();
  bootMenuBrand();

  if (typeof PackAssets !== "undefined") {
    const dataLoad = loadGameData();
    try {
      await PackAssets.loadHeroes();
      drawPreviews();
      startHeroCardLoop();
      bootMenuBrand();
      PackAssets.loadRest().then(() => {
        initParallaxBackground(getWorld());
        invalidateParallaxCache?.();
        bootMenuBrand();
      }).catch((err) => console.warn("Asset-Pack Rest laden fehlgeschlagen", err));
      prefetchSaveSlotWorlds();
    } catch (err) {
      console.warn("Asset-Pack Helden laden fehlgeschlagen", err);
    }
    dataLoad.catch(() => {});
  } else {
    loadGameData().catch(() => {});
  }

  initParallaxBackground(getWorld());
  if (typeof applyVisualSpritePatch === "function") applyVisualSpritePatch();
  initSupabase();
  window.addEventListener("beforeunload", () => {
    if (game.playerName) saveLocalPlayer();
    if (game.isRunning && !game.isDead) saveActiveRun(true);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" && game.isRunning && !game.isDead) {
      saveActiveRun(true);
      if (game.playerName) saveLocalPlayer();
    }
  });
});

// ============================================
// WELLEN-DATEN & SOUND-HOOKS (waves.json / sounds.json)
// ============================================

async function loadGameData() {
  try {
    const res = await fetch("waves.json");
    if (res.ok) WAVE_DATA = await res.json();
  } catch (_) { /* offline / lokal ohne Datei */ }
  try {
    const res = await fetch("sounds.json?v=" + BUILD_ID);
    if (res.ok) SOUND_MAP = await res.json();
  } catch (_) { /* optional */ }
  if (audioUnlocked) tryMenuMusic();
}

function primeAudioInGesture() {
  if (!SOUND_MAP?.enabled) return;
  ["coin", "player_melee", "music_menu"].forEach((key) => {
    const src = getSoundSrc(key);
    if (!src || audioCache[src]) return;
    const a = new Audio(resolveAudioSrc(src));
    a.volume = 0.001;
    audioCache[src] = a;
    a.play().then(() => { a.pause(); a.currentTime = 0; a.volume = SOUND_MAP.sfxVolume ?? 0.55; }).catch(() => {});
  });
}

function unlockAudio() {
  audioUnlocked = true;
  primeAudioInGesture();
  tryMenuMusic();
}

function loadAudioPrefs() {
  try {
    const raw = localStorage.getItem(AUDIO_PREFS_KEY);
    if (raw) audioPrefs = { ...audioPrefs, ...JSON.parse(raw) };
  } catch (_) { /* Standardwerte behalten */ }
  updateAudioToggleUI();
}

function saveAudioPrefs() {
  try { localStorage.setItem(AUDIO_PREFS_KEY, JSON.stringify(audioPrefs)); } catch (_) {}
}

function toggleMusic() {
  unlockAudio();
  audioPrefs.musicEnabled = !audioPrefs.musicEnabled;
  saveAudioPrefs();
  updateAudioToggleUI();
  if (!audioPrefs.musicEnabled) stopMusic();
  else if (game.isRunning && !game.isDead) playWorldMusic(getWorld());
  else tryMenuMusic();
}

function toggleSfx() {
  unlockAudio();
  audioPrefs.sfxEnabled = !audioPrefs.sfxEnabled;
  saveAudioPrefs();
  updateAudioToggleUI();
}

function updateAudioToggleUI() {
  const mBtn = $("btn-toggle-music");
  const sBtn = $("btn-toggle-sfx");
  if (mBtn) {
    mBtn.textContent = audioPrefs.musicEnabled ? "Musik AN" : "Musik AUS";
    mBtn.classList.toggle("toggle-on", audioPrefs.musicEnabled);
    mBtn.classList.toggle("toggle-off", !audioPrefs.musicEnabled);
  }
  if (sBtn) {
    sBtn.textContent = audioPrefs.sfxEnabled ? "Sound AN" : "Sound AUS";
    sBtn.classList.toggle("toggle-on", audioPrefs.sfxEnabled);
    sBtn.classList.toggle("toggle-off", !audioPrefs.sfxEnabled);
  }
}

/** Meta-Daten: Account-Level, freigeschaltete & ausgerüstete Fähigkeiten (pro Slot) */
function defaultMeta() {
  return {
    saveVersion: SAVE_SCHEMA_VERSION,
    level: 1, xp: 0, totalKills: 0, playTimeMs: 0,
    loopsCleared: 0,
    records: (typeof createDefaultRecords === "function") ? createDefaultRecords() : {},
    abilities: {
      warrior: { unlocked: [...DEFAULT_UNLOCKED.warrior], equipped: [DEFAULT_UNLOCKED.warrior[0], null] },
      ranger:  { unlocked: [...DEFAULT_UNLOCKED.ranger],  equipped: [DEFAULT_UNLOCKED.ranger[0], null] },
      mage:    { unlocked: [...DEFAULT_UNLOCKED.mage],    equipped: [DEFAULT_UNLOCKED.mage[0], null] }
    }
  };
}

function validateMeta(parsed) {
  const base = defaultMeta();
  if (!parsed || typeof parsed !== "object") return base;
  const lvl = Number(parsed.level);
  const xp = Number(parsed.xp);
  const kills = Number(parsed.totalKills);
  const play = Number(parsed.playTimeMs);
  base.level = clamp(Math.floor(Number.isFinite(lvl) ? lvl : 1), 1, 99);
  base.xp = Number.isFinite(xp) ? Math.max(0, Math.floor(xp)) : 0;
  base.totalKills = Number.isFinite(kills) ? Math.max(0, Math.floor(kills)) : 0;
  base.playTimeMs = Number.isFinite(play) ? Math.max(0, Math.floor(play)) : 0;
  base.saveVersion = SAVE_SCHEMA_VERSION;
  base.loopsCleared = Math.max(0, Math.floor(Number(parsed.loopsCleared) || 0));
  if (parsed.records && typeof parsed.records === "object") base.records = parsed.records;

  ["warrior", "ranger", "mage"].forEach((ck) => {
    const src = parsed.abilities?.[ck];
    if (!src) return;
    const unlocked = Array.isArray(src.unlocked) ? src.unlocked.filter((id) => typeof id === "string") : base.abilities[ck].unlocked;
    let equipped = Array.isArray(src.equipped) ? src.equipped.slice(0, 2)
      : (typeof src.equipped === "string" ? [src.equipped, null] : base.abilities[ck].equipped.slice());
    while (equipped.length < 2) equipped.push(null);
    equipped = equipped.map((id) => (id && unlocked.includes(id) ? id : null));
    // W und S müssen unterschiedliche Fähigkeiten behalten
    equipped = normalizeEquippedPair(equipped);
    if (!equipped[0] && unlocked.length) equipped[0] = unlocked[0];
    // Falls Auto-Fill von Slot 0 mit Slot 1 kollidiert: Slot 1 freimachen
    equipped = normalizeEquippedPair(equipped);
    base.abilities[ck] = { unlocked, equipped };
  });
  return base;
}

function loadLegacyGlobalMeta() {
  try {
    const raw = localStorage.getItem(META_STORAGE_KEY);
    if (!raw) return null;
    return validateMeta(JSON.parse(raw));
  } catch (_) { return null; }
}

function loadMeta() {
  try {
    const i = Math.max(0, Math.min(MAX_SAVE_SLOTS - 1, (game && game.slotIndex) | 0));
    const slot = getSlot(i);
    if (slot && slot.meta) return validateMeta(slot.meta);
  } catch (_) {}
  const legacy = loadLegacyGlobalMeta();
  return legacy || defaultMeta();
}

function saveMeta() {
  if (!game.meta) return;
  game.meta = validateMeta(game.meta);
  const i = Math.max(0, Math.min(MAX_SAVE_SLOTS - 1, game.slotIndex | 0));
  try {
    const slots = loadSaveSlots();
    if (slots[i]) {
      slots[i] = { ...slots[i], meta: game.meta, savedAt: Date.now() };
      persistSaveSlots(slots);
    }
  } catch (_) {}
  // Legacy-Spiegel für Migration älterer Builds
  try { localStorage.setItem(META_STORAGE_KEY, JSON.stringify(game.meta)); } catch (_) {}
}

/** W/S-Ausrüstung: nie dieselbe Fähigkeit auf beiden Tasten – Slot 1 wird geleert */
function normalizeEquippedPair(equipped) {
  const eq = Array.isArray(equipped) ? equipped.slice(0, 2) : [null, null];
  while (eq.length < 2) eq.push(null);
  if (eq[0] && eq[1] && eq[0] === eq[1]) eq[1] = null;
  return eq;
}

function ensureAbilitySlotCds(h) {
  if (!h) return;
  if (!Array.isArray(h.abilitySlotCds) || h.abilitySlotCds.length < 2) {
    h.abilitySlotCds = [0, 0];
  }
}

function getAbilitySlotCd(h, slotIdx) {
  ensureAbilitySlotCds(h);
  return Math.max(0, Number(h.abilitySlotCds[slotIdx]) || 0);
}

function setAbilitySlotCd(h, slotIdx, value) {
  ensureAbilitySlotCds(h);
  h.abilitySlotCds[slotIdx] = Math.max(0, Number(value) || 0);
}

function restoreAbilitySlotCds(h, saved) {
  ensureAbilitySlotCds(h);
  if (saved && Array.isArray(saved.abilitySlotCds) && saved.abilitySlotCds.length >= 2) {
    h.abilitySlotCds = [
      Math.max(0, Number(saved.abilitySlotCds[0]) || 0),
      Math.max(0, Number(saved.abilitySlotCds[1]) || 0)
    ];
    return;
  }
  const legacy = saved?.abilityCds;
  if (legacy && typeof legacy === "object") {
    [0, 1].forEach((slotIdx) => {
      const ab = getEquippedAbilityAtSlot(slotIdx);
      if (ab && legacy[ab.id] != null) h.abilitySlotCds[slotIdx] = Math.max(0, Number(legacy[ab.id]) || 0);
    });
  }
}

function flashSaveIndicator(msg) {
  const el = $("save-indicator");
  if (!el) return;
  el.textContent = msg || "Gespeichert";
  el.classList.remove("hidden");
  el.classList.add("show");
  saveToastTimer = 1.6;
}

function updateSaveIndicator(dt) {
  if (saveToastTimer <= 0) return;
  saveToastTimer -= dt;
  if (saveToastTimer <= 0) {
    const el = $("save-indicator");
    if (el) {
      el.classList.remove("show");
      el.classList.add("hidden");
    }
  }
}

function addMetaXp(amount) {
  if (!game.meta) game.meta = loadMeta();
  game.meta.xp += amount;
  game.meta.totalKills += amount;
  while (game.meta.level < 99 && game.meta.xp >= metaXpForLevel(game.meta.level + 1)) {
    game.meta.level++;
    addLog("Account-Level " + game.meta.level + " erreicht!", "heal");
  }
  saveMeta();
  renderAbilityPanel();
}

function getMetaLevel() {
  return game.meta?.level || 1;
}

function isAbilityOwned(classKey, abilityId) {
  return game.meta?.abilities[classKey]?.unlocked?.includes(abilityId);
}

function getSpecialCdLevel() {
  return Math.max(0, Math.floor(Number(game.upgrades?.upgrade_cooldown) || 0));
}

function getNextCdAbilityUnlock(classKey, cdLv) {
  const nextCd = getNextAbilityUnlockCdLevel(cdLv);
  if (nextCd == null) return null;
  return getClassAbilities(classKey).find((ab) => getAbilityUnlockSpecialCd(ab.slot) === nextCd) || null;
}

function syncUnlockedAbilities(classKey) {
  ensureMeta();
  const cdLv = getSpecialCdLevel();
  const classes = classKey ? [classKey] : [game.classKey || "warrior"];
  classes.forEach((ck) => {
    game.meta.abilities[ck].unlocked = getUnlockedAbilityIds(ck, cdLv);
    const eq = (game.meta.abilities[ck].equipped || [null, null]).slice(0, 2);
    while (eq.length < 2) eq.push(null);
    // Nur ungültige (gesperrte) Einträge entfernen – manuelle Wahl bleibt sonst stehen
    for (let i = 0; i < 2; i++) {
      if (eq[i] && !game.meta.abilities[ck].unlocked.includes(eq[i])) eq[i] = null;
    }
    // Nur leeren W-Slot einmalig mit Basis füllen (nicht S überschreiben)
    if (!eq[0] && game.meta.abilities[ck].unlocked.length) {
      eq[0] = game.meta.abilities[ck].unlocked[0];
    }
    game.meta.abilities[ck].equipped = normalizeEquippedPair(eq);
  });
  saveMeta();
}

function ensureMeta() {
  if (!game.meta) game.meta = loadMeta();
  ["warrior", "ranger", "mage"].forEach((ck) => {
    if (!game.meta.abilities[ck]) {
      game.meta.abilities[ck] = { unlocked: [...(DEFAULT_UNLOCKED[ck] || [])], equipped: [DEFAULT_UNLOCKED[ck]?.[0] || null, null] };
      return;
    }
    if (!Array.isArray(game.meta.abilities[ck].unlocked)) {
      game.meta.abilities[ck].unlocked = [...(DEFAULT_UNLOCKED[ck] || [])];
    }
    if (!Array.isArray(game.meta.abilities[ck].equipped)) {
      game.meta.abilities[ck].equipped = [game.meta.abilities[ck].unlocked[0] || null, null];
    }
  });
  return game.meta;
}

function normalizeClassKey(value) {
  if (!value) return "warrior";
  if (CLASSES[value]) return value;
  const hit = Object.keys(CLASSES).find((k) => CLASSES[k].name === value);
  return hit || "warrior";
}

function getSpendableGold() {
  return Math.max(0, Math.floor(Number(game.totalGold) || 0) + Math.floor(Number(game.runGold) || 0));
}

function spendGold(amount) {
  let left = Math.max(0, Math.floor(Number(amount) || 0));
  game.runGold = Math.max(0, Math.floor(Number(game.runGold) || 0));
  game.totalGold = Math.max(0, Math.floor(Number(game.totalGold) || 0));
  const fromRun = Math.min(game.runGold, left);
  game.runGold -= fromRun;
  left -= fromRun;
  game.totalGold = Math.max(0, game.totalGold - left);
  if (game.isRunning && !game.isDead) markRunSaveDirty();
}

function setEquippedAbility(slotIdx, abilityId) {
  ensureMeta();
  const ck = game.classKey;
  if (!game.meta.abilities[ck]) return;
  const slot = slotIdx === 0 || slotIdx === 1 ? slotIdx : -1;
  if (slot < 0) return;
  const nextId = abilityId || null;
  if (nextId && !isAbilityOwned(ck, nextId)) {
    renderAbilityPanel();
    return;
  }
  const eq = normalizeEquippedPair((game.meta.abilities[ck].equipped || [null, null]).slice());
  const otherSlot = slot === 0 ? 1 : 0;
  // Gleiche Fähigkeit auf W und S verbieten – bestehende Auswahl bleibt
  if (nextId && eq[otherSlot] === nextId) {
    addLog("Taste " + getAbilityKeyLabel(otherSlot) + " hat diese Fähigkeit schon – bitte eine andere wählen.", "special");
    renderAbilityPanel();
    updateClassHint();
    return;
  }
  // Nur dieser Slot ändert sich; der andere bleibt gespeichert
  eq[slot] = nextId;
  game.meta.abilities[ck].equipped = normalizeEquippedPair(eq);
  saveMeta();
  if (game.playerName) saveLocalPlayer({ quiet: true });
  if (game.isRunning && !game.isDead) { markRunSaveDirty(); saveActiveRun(true); }
  flashSaveIndicator("Taste " + getAbilityKeyLabel(slot) + (nextId ? " gespeichert" : " geleert"));
  renderAbilityPanel();
  updateClassHint();
  updateStatus();
}

function renderSetupAbilityHint() {
  const el = $("ability-setup-hint");
  if (!el) return;
  const ck = game.classKey;
  const cdLv = getSpecialCdLevel();
  const list = getClassAbilities(ck);
  const owned = game.meta?.abilities[ck]?.unlocked || [];
  const equipped = (game.meta?.abilities[ck]?.equipped || [])
    .map((id, i) => (id ? { slot: i + 1, ab: getAbilityById(ck, id) } : null))
    .filter((x) => x && x.ab);

  let html = '<p class="ability-setup-lead">6 Spezialfähigkeiten pro Klasse · Freischaltung bei <strong>Spezial-CD Meilensteinen</strong> (Stufe 3, 6, 10 …)</p>';
  html += '<p class="ability-setup-meta">Spezial-CD Stufe <strong>' + cdLv + '</strong> · ' + owned.length + '/' + list.length + ' freigeschaltet · <kbd>W</kbd> und <kbd>S</kbd> je eigene Fähigkeit</p>';
  html += '<div class="ability-overview">';
  list.forEach((ab) => {
    const ownedFlag = owned.includes(ab.id);
    const cdOk = isAbilityUnlockedBySpecialCd(cdLv, ab.slot);
    const needCd = getAbilityUnlockSpecialCd(ab.slot);
    const slotLabel = ab.slot === 0 ? "Basis" : "Slot " + (ab.slot + 1);
    let statusClass = "ability-overview-status--locked";
    let statusText = "Spezial-CD Stufe " + needCd;
    if (ownedFlag) {
      statusClass = "ability-overview-status--owned";
      statusText = "Freigeschaltet";
    } else if (cdOk) {
      statusClass = "ability-overview-status--buy";
      statusText = "Verfügbar";
    }
    html += '<div class="ability-overview-card' + (ownedFlag ? " owned" : "") + (cdOk ? "" : " locked") + '">' +
      '<div class="ability-overview-head">' +
        '<strong>' + ab.name + '</strong>' +
        '<span class="ability-overview-meta">' + slotLabel + ' · ' + ab.cd + 's CD</span>' +
      '</div>' +
      '<p class="ability-overview-desc">' + ab.desc + '</p>' +
      '<span class="ability-overview-status ' + statusClass + '">' + statusText + '</span>' +
    '</div>';
  });
  html += '</div>';
  if (equipped.length) {
    html += '<div class="ability-setup-badges">';
    equipped.forEach(({ slot, ab }) => {
      html += '<span class="ability-badge"><kbd>' + getAbilityKeyLabel(slot - 1) + '</kbd>: ' + ab.name + '</span>';
    });
    html += '</div>';
  }
  el.innerHTML = html;
}

function renderAbilityLoadout() {
  const el = $("ability-loadout");
  if (!el) return;
  const h = game.hero;
  const show = game.isRunning && h;
  el.classList.toggle("hidden", !show);
  if (!show) return;

  let html = "";
  [0, 1].forEach((slotIdx) => {
    const ab = getEquippedAbilityAtSlot(slotIdx);
    const key = getAbilityKeyLabel(slotIdx);
    if (!ab) {
      html += '<div class="ability-slot ability-slot--empty"><span class="ability-slot-key">' + key + '</span><span class="ability-slot-name">–</span></div>';
      return;
    }
    const left = Math.max(0, getEffectiveAbilityCd(ab) - getAbilitySlotCd(h, slotIdx));
    const ready = left <= 0;
    html += '<div class="ability-slot' + (ready ? " ready" : "") + '">' +
      '<span class="ability-slot-key">' + key + '</span>' +
      '<span class="ability-slot-body">' +
        '<span class="ability-slot-name">' + ab.name + '</span>' +
        '<span class="ability-slot-desc">' + ab.desc + '</span>' +
      '</span>' +
      '<span class="ability-slot-cd">' + (ready ? "bereit" : Math.ceil(left) + "s") + '</span></div>';
  });
  html += '<p class="ability-loadout-hint"><kbd>U</kbd> Fähigkeiten anpassen</p>';
  el.innerHTML = html;
}

function getEquippedAbilityAtSlot(slotIdx) {
  const ck = game.classKey;
  const id = game.meta?.abilities[ck]?.equipped?.[slotIdx];
  if (!id) return null;
  return getAbilityById(ck, id);
}

function getEquippedAbilities() {
  const eq = game.meta?.abilities[game.classKey]?.equipped || [];
  return eq.map((id) => (id ? getAbilityById(game.classKey, id) : null)).filter(Boolean);
}

function getEffectiveAbilityCd(ab) {
  const cdRed = (game.upgrades.upgrade_cooldown || 0) * 0.4;
  return Math.max(2, ab.cd - cdRed);
}

/** Dauerhafte Ult-Anzeige über dem Helden: W / S, ✓ wenn bereit. */
function drawAbilityOverhead(ctx, h) {
  const slots = [0, 1].map((slotIdx) => {
    const ab = getEquippedAbilityAtSlot(slotIdx);
    if (!ab) return null;
    const ready = getAbilitySlotCd(h, slotIdx) >= getEffectiveAbilityCd(ab);
    return { key: getAbilityKeyLabel(slotIdx), ready };
  }).filter(Boolean);
  if (!slots.length) return;

  const labels = slots.map((s) => (s.ready ? s.key + "✓" : s.key));
  const text = labels.join("  ");
  const cx = Math.round(h.x + h.w / 2);
  const y = Math.round(h.y - 8);

  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.font = "bold 11px Courier New";
  let x = cx - ctx.measureText(text).width / 2;
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(0,0,0,0.75)";
  ctx.strokeText(text, x, y);
  labels.forEach((label, i) => {
    ctx.fillStyle = slots[i].ready ? "#2ecc71" : "rgba(180,180,190,0.78)";
    ctx.fillText(label, x, y);
    x += ctx.measureText(label + (i < labels.length - 1 ? "  " : "")).width;
  });
  ctx.restore();
}

function canCastAbility(ab, h, st) {
  if (ab.manaCost && h.mana < ab.manaCost) return false;
  // Buffs brauchen keinen Gegner – sonst ist z. B. Kriegsschrei zwischen Wellen tot
  if (ab.type === "buff_shout") return true;
  const range = ab.range || CLASSES[game.classKey].range;
  return hasTargetableEnemy(range);
}

function renderAbilityPanel() {
  const panel = $("ability-panel");
  if (!panel) return;
  ensureMeta();
  const ck = game.classKey;
  const cdLv = getSpecialCdLevel();
  const list = getClassAbilities(ck);
  const owned = game.meta?.abilities[ck]?.unlocked || [];
  const equipped = game.meta?.abilities[ck]?.equipped || [null, null];

  let html = '<p class="ability-meta">Spezial-CD Stufe <strong>' + cdLv + '</strong> · ' + owned.length + '/' + list.length + ' Fähigkeiten · <kbd>W</kbd> und <kbd>S</kbd> getrennt</p>';
  html += '<p class="ability-meta ability-meta--hint">Jede Taste speichert <strong>eine eigene</strong> Fähigkeit – dieselbe Fähigkeit auf W und S ist nicht möglich. Änderung nur über die Auswahl.</p>';
  html += '<div class="ability-equip-grid">';
  [0, 1].forEach((slotIdx) => {
    const otherId = equipped[slotIdx === 0 ? 1 : 0] || null;
    html += '<div class="ability-equip-slot">';
    html += '<label class="label ability-equip-label">Taste ' + getAbilityKeyLabel(slotIdx) + '</label>';
    html += '<select class="input ability-select" data-slot="' + slotIdx + '">';
    html += '<option value="">– Keine –</option>';
    owned.forEach((id) => {
      const ab = getAbilityById(ck, id);
      if (!ab) return;
      const taken = otherId === id;
      const sel = equipped[slotIdx] === id;
      html += '<option value="' + id + '"' +
        (sel ? ' selected' : '') +
        (taken && !sel ? ' disabled' : '') +
        '>' + ab.name + (taken && !sel ? ' (schon ' + getAbilityKeyLabel(slotIdx === 0 ? 1 : 0) + ')' : '') + '</option>';
    });
    html += '</select></div>';
  });
  html += '</div><div class="ability-list">';

  list.forEach((ab) => {
    const ownedFlag = owned.includes(ab.id);
    const needCd = getAbilityUnlockSpecialCd(ab.slot);
    let status = "";
    if (ownedFlag) {
      status = '<span class="ability-owned">✓ Freigeschaltet</span>';
    } else {
      status = '<span class="ability-locked">Spezial-CD Stufe ' + needCd + ' benötigt</span>';
    }
    const eqMark = equipped.includes(ab.id) ? ' ★' : '';
    const slotLabel = ab.slot === 0 ? 'Basis' : 'Slot ' + (ab.slot + 1);
    html += '<div class="ability-card ability-card--shop' + (ownedFlag ? ' owned' : '') + (ownedFlag ? '' : ' locked') + '">' +
      '<div class="ability-card-head"><strong>' + ab.name + eqMark + '</strong><span class="ability-cd">' + slotLabel + ' · CD Stufe ' + needCd + ' · ' + ab.cd + 's</span></div>' +
      '<p class="ability-desc">' + ab.desc + '</p>' +
      '<div class="ability-card-foot">' + status + '</div></div>';
  });
  html += '</div>';
  panel.innerHTML = html;
  renderSetupAbilityHint();
  renderAbilityLoadout();
}

function playSound(key) {
  if (!SOUND_MAP?.enabled || !audioPrefs.sfxEnabled) return;
  const src = getSoundSrc(key);
  if (!src) return;
  const vol = Math.max(0, Math.min(1, Number(audioPrefs.sfxVolume ?? SOUND_MAP.sfxVolume ?? SOUND_MAP.volume ?? 0.5)));
  if (!audioCache[src]) {
    const a = new Audio(resolveAudioSrc(src));
    a.volume = vol;
    audioCache[src] = a;
  }
  const audio = audioCache[src];
  audio.volume = vol;
  audio.currentTime = 0;
  if (!audioUnlocked) {
    audio.play().then(() => { audioUnlocked = true; }).catch(() => {});
    return;
  }
  audio.play().catch(() => {});
}

function playMusic(key) {
  if (!SOUND_MAP?.enabled || !audioPrefs.musicEnabled || !key) return;
  const src = getSoundSrc(key);
  if (!src) return;
  if (musicKey === key && musicTrack) {
    musicTrack.play().catch(() => {});
    return;
  }
  stopMusic();
  musicKey = key;
  musicTrack = new Audio(resolveAudioSrc(src));
  musicTrack.loop = true;
  musicTrack.volume = Math.max(0, Math.min(1, Number(audioPrefs.musicVolume ?? SOUND_MAP.musicVolume ?? 0.32)));
  if (!audioUnlocked) {
    musicTrack.play().then(() => { audioUnlocked = true; }).catch(() => {});
    return;
  }
  musicTrack.play().catch(() => {});
}

function playMenuMusic() {
  if (game.isRunning && !game.isDead) return;
  const key = SOUND_MAP?.music?.menu || "music_menu";
  if (getSoundSrc(key)) playMusic(key);
}

function tryMenuMusic() {
  if (!game.isRunning || game.isDead) playMenuMusic();
}

function getSoundSrc(key) {
  return SOUND_MAP?.files?.[key] || null;
}

function resolveAudioSrc(src) {
  if (!src) return null;
  if (/^https?:\/\//.test(src)) return src;
  try { return new URL(src, location.href).href; } catch (_) { return src; }
}

function stopMusic() {
  if (musicTrack) {
    musicTrack.pause();
    musicTrack.currentTime = 0;
    musicTrack = null;
    musicKey = null;
  }
}

function playWorldMusic(world) {
  if (!world) return;
  const key = WAVE_DATA?.worldAmbient?.[world.name];
  if (key && getSoundSrc(key)) playMusic(key);
  else if (getSoundSrc("music_game")) playMusic("music_game");
}

function playGameMusic() {
  if (getSoundSrc("music_game")) playMusic("music_game");
  else playWorldMusic(getWorld());
}

function emitCombatEvent(eventKey) {
  const evt = WAVE_DATA?.combatEvents?.[eventKey];
  playSound(evt?.sound || eventKey);
}

function getWaveType(isBoss, danger) {
  if (isBoss) return "boss";
  if (danger >= 3) return "danger";
  return "normal";
}

function onWaveSpawn(isBoss, count) {
  const world = getWorld();
  const waveType = getWaveType(isBoss, world.danger);
  game.waveNumber++;
  game.currentWave = {
    number: game.waveNumber,
    type: waveType,
    dungeonLevel: game.dungeonLevel,
    world: world.name,
    danger: world.danger,
    size: count,
    isBoss,
    enemies: []
  };
  const soundKey = WAVE_DATA?.waveTypes?.[waveType]?.soundSpawn || (isBoss ? "boss_spawn" : "wave_spawn");
  playSound(soundKey);
}

function onWaveClear() {
  const waveType = game.currentWave?.type || "normal";
  const soundKey = WAVE_DATA?.waveTypes?.[waveType]?.soundClear || "wave_clear";
  playSound(soundKey);
  game.currentWave = null;
  tryAdvanceWorldAfterBossWave();
}

// ============================================
// ANGRIFFS-VFX
// ============================================

function spawnMeleeSlash(x, y, angle, opts) {
  const o = opts || {};
  game.meleeSlashes.push({
    x, y, angle,
    life: o.life || 14,
    maxLife: o.life || 14,
    range: o.range || 90,
    owner: o.owner || "player",
    big: !!o.big
  });
}

function spawnImpactRing(x, y, radius, color, life) {
  game.attackEffects.push({
    type: "spark", x, y, radius: radius || 24,
    color: color || "#e74c3c",
    life: life || 12, maxLife: life || 12,
    fxKey: "spark_a"
  });
}

function trimParticles() {
  if (game.particles.length > MAX_PARTICLES) {
    game.particles.splice(0, game.particles.length - MAX_PARTICLES);
  }
}

function spawnBurst(x, y, color, count, speed) {
  const n = count || 5;
  const spd = speed || 4;
  for (let i = 0; i < n; i++) {
    const ang = Math.random() * Math.PI * 2;
    pushParticle({
      x, y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
      life: 14 + Math.random() * 8, color: color || "#f1c40f", size: 2 + Math.random() * 2
    });
  }
  trimParticles();
}

function spawnExplosion(x, y, radius, playSound) {
  game.attackEffects.push({
    type: "explosion", x, y, radius: radius || 90,
    life: 20, maxLife: 20, color: "#e74c3c"
  });
  spawnBurst(x, y, "#f39c12", 16, 6);
  if (playSound !== false) emitCombatEvent("explosion");
}

function calcPlayerDamage(rawAttack, defense) {
  const def = defense * (BALANCE.defenseFactor || 1);
  const pierce = Math.floor(rawAttack * (BALANCE.pierceFactor ?? 0.14));
  return Math.max(1, Math.max(pierce, rawAttack - def));
}

/** Schildschlag-Schadensreduktion auf eingehenden Schaden anwenden */
function applyShieldToDamage(h, dmg) {
  if ((h.shieldTimer || 0) > 0) return Math.max(1, Math.floor(dmg * (1 - (h.shieldReduction || 0))));
  return dmg;
}

/** Early-Game-Erleichterung – skaliert bis earlyEaseUntil */
function getEarlyEase() {
  const lv = game.dungeonLevel;
  if (lv > BALANCE.earlyEaseUntil) return 0;
  return (BALANCE.earlyEaseUntil - lv) / (BALANCE.earlyEaseUntil - 1);
}

/** Debuff auf Gegner anwenden (Schwächung / Verlangsamung) */
function applyEnemyDebuff(e, ab) {
  if (!e || e.dead) return;
  const bossResist = e.isBoss ? 0.55 : 1;
  if (ab.debuffWeak) {
    e.weakTimer = (ab.debuffDuration || 2.5) * bossResist;
    e.damageTakenMult = 1 + ab.debuffWeak;
  }
  if (ab.slowDuration) {
    e.slowTimer = ab.slowDuration * bossResist;
    e.slowMult = ab.slowMult || 0.5;
  }
}

function enemyAttackPlayer(e, h, st) {
  const ex = e.x + e.w / 2, ey = e.y + e.h / 2;
  const hx = h.x + h.w / 2, hy = h.y + h.h / 2;
  const angle = Math.atan2(hy - ey, hx - ex);
  let dmg = calcPlayerDamage(e.attack, st.defense);
  dmg = applyShieldToDamage(h, dmg);

  e.attackAnim = e.isBoss ? 0.45 : 0.32;
  spawnMeleeSlash(ex, ey, angle, {
    life: e.isBoss ? 16 : 12,
    range: e.isBoss ? 55 : 40,
    owner: "enemy",
    big: e.isBoss
  });
  spawnImpactRing(hx, hy, e.isBoss ? 32 : 22, "#e74c3c", 14);
  spawnBurst(hx, hy - 8, "#e74c3c", e.isBoss ? 8 : 5, 3.5);

  h.hp -= dmg;
  if (typeof notePlayerDamageTaken === "function") notePlayerDamageTaken(dmg);
  h.hitFlash = e.isBoss ? 14 : 10;
  h.hurtAnim = 0.28;
  game.screenShake = Math.max(game.screenShake, e.isBoss ? 8 : 5);

  spawnDamage(hx, hy - 18, dmg, { taken: true, boss: e.isBoss });
  emitCombatEvent("enemy_attack");
  emitCombatEvent("player_hurt");
  if (h.hp <= 0) { h.hp = 0; onDeath(); }
}

/** Fernkampf-Gegner (Magier, Hexe) schießen Projektile */
function enemyRangedAttack(e, h, st) {
  const ex = e.x + e.w / 2, ey = e.y + e.h / 2;
  const hx = h.x + h.w / 2, hy = h.y + h.h / 2;
  const dx = hx - ex, dy = hy - ey;
  const len = Math.hypot(dx, dy) || 1;
  const dmg = Math.max(1, Math.floor(calcPlayerDamage(e.attack, st.defense) * 0.85));

  e.attackAnim = 0.28;
  game.projectiles.push({
    x: ex, y: ey, vx: (dx / len) * 9, vy: (dy / len) * 9,
    dmg, crit: false, sprite: "projectile_fire", life: 90,
    owner: "enemy", trail: "#9b59b6"
  });
  spawnBurst(ex, ey, "#8e44ad", 4, 2);
  emitCombatEvent("enemy_attack");
}

/** Boss-Spezialangriff: verstärkter Flächenschlag */
function bossSpecialAttack(e, h, st) {
  const hx = h.x + h.w / 2, hy = h.y + h.h / 2;
  const ex = e.x + e.w / 2, ey = e.y + e.h / 2;
  const angle = Math.atan2(hy - ey, hx - ex);
  let dmg = applyShieldToDamage(h, Math.floor(calcPlayerDamage(e.attack * 1.22, st.defense)));

  e.attackAnim = 0.55;
  e.attackWindup = 1;
  spawnMeleeSlash(ex, ey, angle, { life: 20, range: 70, owner: "enemy", big: true });
  spawnExplosion(hx, hy - 10, 60);
  game.screenShake = Math.max(game.screenShake, 10);
  game.critFlash = 0.15;

  h.hp -= dmg;
  h.hitFlash = 16;
  h.hurtAnim = 0.35;
  spawnDamage(hx, hy - 18, dmg, { taken: true, boss: true });
  addLog(e.name + " – Spezialangriff!", "boss");
  emitCombatEvent("enemy_attack");
  if (h.hp <= 0) { h.hp = 0; onDeath(); }
}

function bindEvents() {
  document.querySelectorAll(".class-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".class-btn").forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      game.classKey = btn.dataset.class;
      syncUnlockedAbilities(game.classKey);
      updateClassHint();
      updateHeroCardUI();
      startHeroCardLoop();
      renderSetupAbilityHint();
      renderAbilityPanel();
    });
  });
  const bind = (id, fn) => { const el = $(id); if (el) el.addEventListener("click", fn); };
  bind("btn-menu-new", () => { unlockAudio(); showMenuPanel("new-slot"); });
  bind("btn-menu-continue", () => {
    unlockAudio();
    const i = getLastSlotIndex();
    if (getSlot(i)) loadSaveSlot(i);
  });
  bind("btn-menu-load", () => { unlockAudio(); showMenuPanel("load"); });
  bind("btn-menu-settings", () => { unlockAudio(); showMenuPanel("settings"); });
  bind("btn-menu-credits", () => { unlockAudio(); showMenuPanel("credits"); });
  bind("btn-settings-back", () => showMenuPanel("home"));
  bind("btn-credits-back", () => showMenuPanel("home"));
  bind("btn-settings-save", () => {
    applySettingsFromUI();
    showMenuPanel("home");
  });
  ["setting-music-vol","setting-sfx-vol","setting-music-enabled","setting-sfx-enabled","setting-screen-shake","setting-particles"].forEach((id) => {
    const el = $(id);
    if (el) el.addEventListener("change", () => applySettingsFromUI());
  });
  bind("btn-new-slot-back", () => showMenuPanel("home"));
  bind("btn-new-back", () => showMenuPanel("new-slot"));
  bind("btn-load-back", () => showMenuPanel("home"));
  bind("btn-start-new", () => { openNewGameBriefing(); });
  bind("btn-briefing-back", () => showMenuPanel("new"));
  bind("btn-briefing-go", () => { startNewGameFromMenu(); });
  bind("btn-to-menu", () => { returnToMainMenu(); });
  bind("btn-load-player", () => { unlockAudio(); openNewGameBriefing(); });
  bind("btn-new-game", () => { openNewGameBriefing(); });
  bind("btn-start-run", continueOrStartRun);
  bind("btn-pause", togglePause);
  bind("btn-pause-resume", () => { if (game.isPaused) togglePause(); });
  bind("btn-pause-upgrades", () => {
    hidePauseMenu();
    showUpgrades();
  });
  bind("btn-pause-menu", () => {
    hidePauseMenu();
    returnToMainMenu();
  });
  bind("btn-restart", restartRun);
  bind("btn-save-score", saveScore);
  bind("btn-gameover-run", () => { clearActiveRun(); startRun(); });
  bind("btn-gameover-upgrade", goToUpgrades);
  bind("btn-victory-restart", restartFromVictory);
  bind("btn-victory-loop", continueLoopFromVictory);
  bind("btn-open-upgrades", toggleUpgrades);
  bind("btn-close-upgrades", hideUpgrades);
  bind("btn-reload-leaderboard", () => {});
  bind("btn-fullscreen", toggleFullscreen);
  bind("btn-toggle-music", toggleMusic);
  bind("btn-toggle-sfx", toggleSfx);

  const abilityPanel = $("ability-panel");
  if (abilityPanel) {
    abilityPanel.addEventListener("change", (e) => {
      const sel = e.target.closest(".ability-select");
      if (!sel) return;
      setEquippedAbility(parseInt(sel.dataset.slot, 10), sel.value || null);
    });
  }

  document.addEventListener("fullscreenchange", onFullscreenChange);

  canvas.addEventListener("mousemove", onMouseMove);
  canvas.addEventListener("pointermove", handlePointerMove);
  canvas.addEventListener("pointerdown", handlePointerDown);
  canvas.addEventListener("mouseenter", () => { mouse.onCanvas = true; });
  canvas.addEventListener("mouseleave", () => { mouse.onCanvas = false; });

  window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    keys[k] = true;
    // Pfeiltasten im Spiel nicht die Seite scrollen lassen
    if (game.isRunning && !isTypingInForm() &&
      (k === "arrowleft" || k === "arrowright" || k === "arrowup" || k === "arrowdown")) {
      e.preventDefault();
    }
    if (k === "p" && game.isRunning) togglePause();
    if (!isTypingInForm() && !e.repeat) {
      // W und S getrennt: je eine Fähigkeit, kein Key-Repeat-Spam
      if ((k === "w" || k === "arrowup") && game.isRunning) useEquippedAbility(0);
      if ((k === "s" || k === "arrowdown") && game.isRunning) useEquippedAbility(1);
    }
    if (e.key.toLowerCase() === "f") toggleFullscreen();
    if (e.key.toLowerCase() === "u" && !$("game-section").classList.contains("hidden")) {
      if (document.activeElement?.tagName === "INPUT") return;
      toggleUpgrades();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      const sec = $("upgrade-section");
      if (sec && !sec.classList.contains("hidden")) {
        hideUpgrades();
        return;
      }
      if (game.isRunning && !game.isDead) {
        togglePause();
      }
    }
  });
  window.addEventListener("keyup", (e) => { keys[e.key.toLowerCase()] = false; });
  updateClassHint();
}

function updateClassHint() {
  const cls = CLASSES[game.classKey];
  const hint = $("controls-hint");
  if (!hint || !cls) return;
  const wAb = getEquippedAbilityAtSlot(0);
  const sAb = getEquippedAbilityAtSlot(1);
  const wLabel = wAb ? ("<kbd>W</kbd> " + wAb.name) : "<kbd>W</kbd> –";
  const sLabel = sAb ? ("<kbd>S</kbd> " + sAb.name) : "<kbd>S</kbd> –";
  const moveHint = "<kbd>A</kbd>/<kbd>D</kbd> (<kbd>←</kbd>/<kbd>→</kbd>) Bewegen";
  const action = cls.attackType === "melee" ? "Schwert" : cls.attackType === "ranged" ? "Schießen" : "Zaubern";
  hint.innerHTML = moveHint + " | <kbd>Maus</kbd> = <strong>" + action + "</strong> | " +
    wLabel + " · " + sLabel + " | <kbd>U</kbd> Upgrades &amp; Fähigkeiten";
}

function onMouseMove(e) {
  updatePointerCanvasPos(e);
}

/** Canvas-Koordinaten aus Pointer/Maus (skaliertes Canvas) */
function updatePointerCanvasPos(e) {
  const rect = canvas.getBoundingClientRect();
  if (rect.width === 0) return;
  const scaleX = CW / rect.width, scaleY = CH / rect.height;
  mouse.x = (e.clientX - rect.left) * scaleX;
  mouse.y = (e.clientY - rect.top) * scaleY;
  mouse.onCanvas = mouse.x >= 0 && mouse.x <= CW && mouse.y >= 0 && mouse.y <= CH;
}

function handlePointerMove(e) {
  updatePointerCanvasPos(e);
  const aim = getAim();
  updateCoinCatchMovement(aim);
  tryCollectCoinBonus(aim);
}

function handlePointerDown(e) {
  unlockAudio();
  updatePointerCanvasPos(e);
  const aim = getAim();
  updateCoinCatchMovement(aim);
  tryCollectCoinBonus(aim);
}

function usesPassiveCoinPickup() {
  return game.classKey === "warrior";
}

/** Münze nach Gegner-Tod spawnen – springt hoch; in der Luft = x2, am Boden = normal */
function spawnCoinDrop(amount, x, y) {
  const groundY = GROUND - 6;
  const aim = getAim();
  game.coins.push({
    x,
    groundY,
    y: y,
    val: Math.max(1, Math.floor(amount)),
    phase: "air",
    jumpT: 0,
    jumpDur: BALANCE.coinJumpDur,
    jumpH: BALANCE.coinJumpHeight,
    life: BALANCE.coinLife,
    maxLife: BALANCE.coinLife,
    collected: false,
    bonus: false,
    bob: Math.random() * Math.PI * 2,
    pop: 0,
    catchDelay: BALANCE.coinCatchDelay,
    catchMoveMin: BALANCE.coinCatchMoveMin,
    catchMoved: 0,
    lastAimX: aim.x,
    lastAimY: aim.y
  });
}

function hitTestCoin(wx, wy) {
  const r = BALANCE.coinHitRadius;
  for (const coin of game.coins) {
    if (coin.collected) continue;
    if (Math.hypot(wx - coin.x, wy - coin.y) < r) return coin;
  }
  return null;
}

function spawnCoinBonusText(x, y, text) {
  pushParticle({
    x, y: y - 12, vx: 0, vy: -1.4, life: 52, text, crit: true
  });
}

/** Gold einsammeln – isBonus verdoppelt den Wert (nur einmal pro Münze) */
function collectCoinDrop(coin, isBonus) {
  if (!coin || coin.collected) return;
  coin.collected = true;
  coin.bonus = !!isBonus;
  const amount = isBonus ? coin.val * 2 : coin.val;
  game.runGold += amount;
  coin.pop = 0.35;
  playSound("coin");
  spawnBurst(coin.x, coin.y, "#f1c40f", isBonus ? 10 : 5, isBonus ? 4 : 2);
  if (isBonus) {
    addLog("Perfekt! Münzbonus: " + amount + " Gold!", "crit");
    spawnCoinBonusText(coin.x, coin.y, "+" + amount + " x2!");
  } else {
    addLog("Du sammelst " + amount + " Gold.", "damage");
  }
  markRunSaveDirty();
}

function updateCoinCatchMovement(aim) {
  if (!aim?.onCanvas) return;
  game.coins.forEach((coin) => {
    if (coin.collected || coin.phase !== "air") return;
    const dx = aim.x - coin.lastAimX;
    const dy = aim.y - coin.lastAimY;
    coin.catchMoved += Math.hypot(dx, dy);
    coin.lastAimX = aim.x;
    coin.lastAimY = aim.y;
  });
}

function canCatchCoinBonus(coin) {
  if (coin.phase !== "air") return true;
  if ((coin.jumpT || 0) < (coin.catchDelay ?? BALANCE.coinCatchDelay)) return false;
  return (coin.catchMoved || 0) >= (coin.catchMoveMin ?? BALANCE.coinCatchMoveMin);
}

function tryCollectCoinBonus(aim) {
  if (!game.isRunning || game.isPaused || game.isDead || !aim?.onCanvas) return;
  const coin = hitTestCoin(aim.x, aim.y);
  if (!coin) return;
  if (coin.phase === "air") {
    if (!canCatchCoinBonus(coin)) return;
    collectCoinDrop(coin, true);
  } else if (coin.phase === "ground") {
    collectCoinDrop(coin, false);
  }
}

function updateCoinDrops(dt) {
  game.coins = game.coins.filter((coin) => {
    if (coin.collected) {
      coin.pop -= dt;
      return coin.pop > 0;
    }

    if (coin.phase === "air") {
      coin.jumpT += dt;
      const t = Math.min(1, coin.jumpT / coin.jumpDur);
      coin.y = coin.groundY - coin.jumpH * 4 * t * (1 - t);
      if (t >= 1) {
        coin.phase = "ground";
        coin.y = coin.groundY;
        coin.life = coin.maxLife;
      }
      return true;
    }

    coin.bob += dt * 4;
    coin.y = coin.groundY + Math.sin(coin.bob) * 1.5;
    if (usesPassiveCoinPickup()) {
      coin.life -= dt;
      if (coin.life <= 0) {
        collectCoinDrop(coin, false);
        return coin.pop > 0;
      }
    }
    return true;
  });
}

function drawCoinDrops(ctx) {
  game.coins.forEach((coin) => {
    if (coin.collected && coin.pop <= 0) return;
    const inAir = coin.phase === "air";
    const pulse = 0.85 + Math.sin(coin.bob * 1.4) * 0.15;
    const spin = Math.sin(coin.bob * 0.9) * 2;
    ctx.save();
    ctx.globalAlpha = coin.collected ? Math.max(0, coin.pop / 0.35) : Math.min(1, inAir ? 1 : coin.life / 0.5);
    ctx.shadowColor = inAir ? "#fff8a0" : (coin.bonus ? "#fff8a0" : "#f1c40f");
    ctx.shadowBlur = inAir ? 18 : (coin.bonus ? 16 : 10);
    ctx.translate(coin.x, coin.y - 2);
    ctx.scale(1 + spin * 0.02, 1);
    drawSprite(ctx, SPRITES.coin, -9, -9, false);
    ctx.shadowBlur = 0;
    ctx.font = "bold 9px Courier New";
    ctx.fillStyle = inAir ? "#fff8c0" : (coin.bonus ? "#fff8c0" : "#f1c40f");
    ctx.globalAlpha *= pulse;
    ctx.fillText(String(coin.val), -6, -10);
    if (inAir) {
      ctx.fillStyle = "#2ecc71";
      ctx.fillText("x2?", 6, -10);
    } else if (coin.bonus) {
      ctx.fillStyle = "#2ecc71";
      ctx.fillText("x2", 8, -10);
    }
    ctx.restore();
  });
}

function toggleFullscreen() {
  const frame = $("game-frame");
  if (!frame) return;
  if (!document.fullscreenElement) {
    frame.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen();
  }
}

function onFullscreenChange() {
  const btn = $("btn-fullscreen");
  if (btn) btn.textContent = document.fullscreenElement ? "✕" : "⛶";
  const sec = $("upgrade-section");
  if (sec && !sec.classList.contains("hidden")) mountUpgradeOverlay();
  setTimeout(() => canvas && canvas.focus(), 100);
}

async function initSupabase() {
  if (SUPABASE_URL === "DEINE_SUPABASE_URL") return;
  try {
    if (!window.supabase) await loadScript("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2");
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    loadLeaderboard();
  } catch (e) { /* offline ok */ }
}

function loadScript(url) {
  return new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = url; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
}

// ============================================
// SPIELER – 3 feste Speicher-Slots (localStorage)
// ============================================

function playerStorageKey(name) {
  return (name || "").trim().toLowerCase();
}

function slotRunKey(slotIndex) {
  return "slot_" + Math.max(0, Math.min(MAX_SAVE_SLOTS - 1, slotIndex | 0));
}

function emptySlots() {
  return [null, null, null];
}

function migrateLegacyPlayersToSlots(slots) {
  try {
    const raw = localStorage.getItem(PLAYERS_STORAGE_KEY);
    if (!raw) return slots;
    const store = JSON.parse(raw);
    const entries = Object.keys(store).map((k) => store[k]).filter((p) => p && p.name);
    entries.sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
    for (let i = 0; i < MAX_SAVE_SLOTS; i++) {
      if (slots[i] || !entries[i]) continue;
      const p = entries[i];
      slots[i] = {
        name: p.name,
        classKey: normalizeClassKey(p.classKey),
        totalGold: Math.max(0, Math.floor(Number(p.totalGold) || 0)),
        upgrades: { ...emptyUpgrades(), ...(p.upgrades || {}) },
        savedAt: p.savedAt || Date.now()
      };
    }
  } catch (_) { /* ignore */ }
  return slots;
}

function loadSaveSlots() {
  try {
    const raw = localStorage.getItem(SAVE_SLOTS_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      const slots = emptySlots();
      if (Array.isArray(data)) {
        for (let i = 0; i < MAX_SAVE_SLOTS; i++) slots[i] = data[i] || null;
        return slots;
      }
      if (data && Array.isArray(data.slots)) {
        for (let i = 0; i < MAX_SAVE_SLOTS; i++) slots[i] = data.slots[i] || null;
        return slots;
      }
    }
  } catch (_) { /* ignore */ }
  return migrateLegacyPlayersToSlots(emptySlots());
}

function persistSaveSlots(slots) {
  try {
    safeSetLocalStorage(SAVE_SLOTS_KEY, { version: SAVE_SCHEMA_VERSION, slots });
  } catch (_) {}
}

function getSlot(slotIndex) {
  const slots = loadSaveSlots();
  const i = Math.max(0, Math.min(MAX_SAVE_SLOTS - 1, slotIndex | 0));
  return slots[i] || null;
}

function countFilledSlots() {
  return loadSaveSlots().filter(Boolean).length;
}

function loadLocalPlayer(name) {
  // Legacy + Slot-Lookup nach Name
  const slots = loadSaveSlots();
  const key = playerStorageKey(name);
  for (let i = 0; i < slots.length; i++) {
    if (slots[i] && playerStorageKey(slots[i].name) === key) {
      return { ...slots[i], slotIndex: i };
    }
  }
  try {
    const raw = localStorage.getItem(PLAYERS_STORAGE_KEY);
    const store = raw ? JSON.parse(raw) : {};
    return store[key] || null;
  } catch (_) {
    return null;
  }
}

function saveLocalPlayer(opts) {
  if (!game.playerName) return false;
  const quiet = !!(opts && opts.quiet);
  const i = Math.max(0, Math.min(MAX_SAVE_SLOTS - 1, game.slotIndex | 0));
  const slots = loadSaveSlots();
  ensureMeta();
  slots[i] = {
    saveVersion: SAVE_SCHEMA_VERSION,
    name: game.playerName,
    classKey: game.classKey,
    totalGold: Math.max(0, Math.floor(Number(game.totalGold) || 0)),
    upgrades: { ...emptyUpgrades(), ...(game.upgrades || {}) },
    meta: validateMeta(game.meta),
    createdAt: slots[i]?.createdAt || Date.now(),
    savedAt: Date.now(),
    playTimeMs: Math.max(0, Math.floor(Number(game.meta.playTimeMs) || 0)),
    loopIndex: Math.max(0, Math.floor(Number(game.loopIndex) || 0))
  };
  persistSaveSlots(slots);
  if (!quiet) flashSaveIndicator("Spielstand gespeichert");
  // Legacy-Spiegel für alte Pfade
  try {
    const store = {};
    slots.forEach((s) => {
      if (!s || !s.name) return;
      store[playerStorageKey(s.name)] = s;
    });
    localStorage.setItem(PLAYERS_STORAGE_KEY, JSON.stringify(store));
  } catch (_) {}
  try { localStorage.setItem(LAST_PLAYER_KEY, game.playerName); } catch (_) {}
  try { localStorage.setItem(LAST_SLOT_KEY, String(i)); } catch (_) {}
  return true;
}

function clearSaveSlot(slotIndex) {
  const i = Math.max(0, Math.min(MAX_SAVE_SLOTS - 1, slotIndex | 0));
  const slots = loadSaveSlots();
  const old = slots[i];
  slots[i] = null;
  persistSaveSlots(slots);
  if (old && old.name) clearActiveRun(old.name);
  clearActiveRun(slotRunKey(i));
  flashSaveIndicator("Slot " + (i + 1) + " gelöscht");
}

function getLastPlayerName() {
  try { return (localStorage.getItem(LAST_PLAYER_KEY) || "").trim(); } catch (_) { return ""; }
}

function getLastSlotIndex() {
  try {
    const v = parseInt(localStorage.getItem(LAST_SLOT_KEY) || "0", 10);
    return Number.isFinite(v) ? Math.max(0, Math.min(MAX_SAVE_SLOTS - 1, v)) : 0;
  } catch (_) { return 0; }
}

function listSavedPlayers() {
  return loadSaveSlots().map((p, i) => {
    if (!p || !p.name) return null;
    const run = loadActiveRunFor(p.name) || loadActiveRunFor(slotRunKey(i));
    return {
      key: slotRunKey(i),
      slotIndex: i,
      name: p.name,
      classKey: normalizeClassKey(p.classKey),
      totalGold: Math.max(0, Math.floor(Number(p.totalGold) || 0)),
      savedAt: p.savedAt || 0,
      run
    };
  }).filter(Boolean);
}

function formatSaveDate(ts) {
  if (!ts) return "–";
  try {
    return new Date(ts).toLocaleString("de-DE", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  } catch (_) {
    return "–";
  }
}

function showMenuPanel(which) {
  const panels = ["home", "new-slot", "new", "briefing", "load", "settings", "credits"];
  panels.forEach((key) => {
    const el = $("menu-" + key);
    if (!el) return;
    el.classList.toggle("hidden", key !== which);
  });
  if (which === "home") {
    renderHomeSlotPreview();
    updateContinueButton();
    startMenuBrandLoop();
  }
  if (which === "load") {
    renderSaveSlotList();
    prefetchSaveSlotWorlds();
  }
  if (which === "new-slot") renderNewSlotPicker();
  if (which === "new") {
    const lab = $("new-slot-label");
    if (lab) lab.textContent = "Slot " + (pendingSlotIndex + 1);
    updateHeroCardUI();
    startHeroCardLoop();
    renderSetupAbilityHint();
  }
  if (which === "briefing") {
    renderClassBriefing(getSelectedClassFromUI() || game.classKey);
  }
  if (which === "settings") syncSettingsUI();
}

function fillBriefingList(el, items) {
  if (!el) return;
  el.innerHTML = (items || []).map((t) => "<li>" + t + "</li>").join("");
}

function renderClassBriefing(classKey) {
  const ck = normalizeClassKey(classKey || game.classKey || "warrior");
  const cls = CLASSES[ck];
  const brief = CLASS_BRIEFINGS[ck] || CLASS_BRIEFINGS.warrior;
  const panel = $("menu-briefing");
  if (panel) {
    panel.classList.remove("warrior", "ranger", "mage");
    panel.classList.add(ck);
  }
  const setText = (id, text) => { const el = $(id); if (el) el.textContent = text; };
  const setHtml = (id, html) => { const el = $(id); if (el) el.innerHTML = html; };
  setText("briefing-title", brief.title);
  setText("briefing-lead", brief.lead);
  setHtml("briefing-goal", BRIEFING_SHARED.goal);
  fillBriefingList($("briefing-controls"), BRIEFING_SHARED.controls);
  setText("briefing-class-heading", (cls?.name || "Held") + " – so spielst du");
  setText("briefing-role", brief.role);
  fillBriefingList($("briefing-tips"), brief.tips);
  fillBriefingList($("briefing-watch"), BRIEFING_SHARED.watch);
}

/** Name prüfen, dann Anleitungs-Panel statt Sofort-Start */
function openNewGameBriefing() {
  unlockAudio();
  const name = $("player-name").value.trim();
  if (!name) {
    const hint = $("load-hint");
    if (hint) hint.textContent = "Bitte einen Namen eingeben.";
    return;
  }
  const classKey = getSelectedClassFromUI();
  game.classKey = classKey;
  selectClass(classKey);
  showMenuPanel("briefing");
}

function updateContinueButton() {
  const btn = $("btn-menu-continue");
  if (!btn) return;
  const i = getLastSlotIndex();
  const slot = getSlot(i);
  const ok = !!(slot && slot.name);
  btn.disabled = !ok;
  btn.textContent = ok
    ? ("Fortsetzen · Slot " + (i + 1) + " · " + slot.name)
    : "Fortsetzen";
}

function syncSettingsUI() {
  const set = (id, val) => { const el = $(id); if (el) el.value = String(val); };
  const setCheck = (id, val) => { const el = $(id); if (el) el.checked = !!val; };
  set("setting-music-vol", Math.round((audioPrefs.musicVolume ?? 0.32) * 100));
  set("setting-sfx-vol", Math.round((audioPrefs.sfxVolume ?? 0.55) * 100));
  setCheck("setting-music-enabled", audioPrefs.musicEnabled !== false);
  setCheck("setting-sfx-enabled", audioPrefs.sfxEnabled !== false);
  setCheck("setting-screen-shake", audioPrefs.screenShake !== false);
  setCheck("setting-particles", audioPrefs.particles !== false);
  updateAudioToggleUI();
}

function applySettingsFromUI() {
  const num = (id, def) => {
    const el = $(id);
    if (!el) return def;
    const v = Number(el.value);
    return Number.isFinite(v) ? v : def;
  };
  const chk = (id, def) => {
    const el = $(id);
    return el ? !!el.checked : def;
  };
  audioPrefs.musicVolume = Math.max(0, Math.min(1, num("setting-music-vol", 32) / 100));
  audioPrefs.sfxVolume = Math.max(0, Math.min(1, num("setting-sfx-vol", 55) / 100));
  audioPrefs.musicEnabled = chk("setting-music-enabled", true);
  audioPrefs.sfxEnabled = chk("setting-sfx-enabled", true);
  audioPrefs.screenShake = chk("setting-screen-shake", true);
  audioPrefs.particles = chk("setting-particles", true);
  saveAudioPrefs();
  updateAudioToggleUI();
  if (musicTrack) musicTrack.volume = audioPrefs.musicVolume;
  if (!audioPrefs.musicEnabled) stopMusic();
  else if (!game.isRunning || game.isDead) tryMenuMusic();
  flashSaveIndicator("Einstellungen gespeichert");
}

function countUpgradeLevels(upgrades) {
  const u = upgrades || {};
  return Object.keys(u).reduce((s, k) => s + Math.max(0, Math.floor(Number(u[k]) || 0)), 0);
}

function buildSlotButtonHtml(slotIndex, data, mode) {
  const n = slotIndex + 1;
  if (!data) {
    return "<div class=\"save-slot-main\">" +
      "<strong class=\"save-slot-name\">Slot " + n + "</strong>" +
      "<span class=\"save-slot-class\">Leer</span></div>" +
      "<div class=\"save-slot-meta\"><span>Bereit für neues Spiel</span></div>" +
      "<span class=\"save-slot-action\">" + (mode === "load" ? "–" : "Wählen") + "</span>";
  }
  const cls = CLASSES[normalizeClassKey(data.classKey)] || CLASSES.warrior;
  const run = data.run || loadActiveRunFor(data.name) || loadActiveRunFor(slotRunKey(slotIndex));
  const upLv = countUpgradeLevels(data.upgrades || run?.upgrades);
  return "<div class=\"save-slot-main\">" +
    "<strong class=\"save-slot-name\">Slot " + n + " · " + escapeHtml(data.name) + "</strong>" +
    "<span class=\"save-slot-class\">" + escapeHtml(cls.name) + "</span></div>" +
    "<div class=\"save-slot-meta\">" +
      "<span>🪙 " + (data.totalGold || 0) + "</span>" +
      (upLv > 0 ? "<span>⬆ " + upLv + " Upgrades</span>" : "") +
      (run
        ? "<span>Dungeon " + run.dungeonLevel + " · Held-Lv " + run.playerLevel + "</span>"
        : "<span>Bereit für neuen Run</span>") +
      "<span class=\"save-slot-date\">" + formatSaveDate(run?.savedAt || data.savedAt) + "</span>" +
    "</div>" +
    "<span class=\"save-slot-action\">" +
      (mode === "load" ? (run ? "Weiter" : "Laden") : "Überschreiben") +
    "</span>";
}

function renderHomeSlotPreview() {
  const list = $("home-slot-preview");
  if (!list) return;
  const slots = loadSaveSlots();
  list.innerHTML = "";
  for (let i = 0; i < MAX_SAVE_SLOTS; i++) {
    const el = document.createElement("div");
    el.className = "save-slot save-slot--readonly " + (slots[i] ? normalizeClassKey(slots[i].classKey) : "empty");
    el.innerHTML = buildSlotButtonHtml(i, slots[i] ? {
      ...slots[i],
      run: loadActiveRunFor(slots[i].name) || loadActiveRunFor(slotRunKey(i))
    } : null, "preview");
    list.appendChild(el);
  }
}

function renderNewSlotPicker() {
  const list = $("new-slot-list");
  if (!list) return;
  const slots = loadSaveSlots();
  list.innerHTML = "";
  for (let i = 0; i < MAX_SAVE_SLOTS; i++) {
    const btn = document.createElement("button");
    btn.type = "button";
    const filled = !!slots[i];
    btn.className = "save-slot " + (filled ? normalizeClassKey(slots[i].classKey) : "empty");
    btn.innerHTML = buildSlotButtonHtml(i, filled ? {
      ...slots[i],
      run: loadActiveRunFor(slots[i].name) || loadActiveRunFor(slotRunKey(i))
    } : null, "new");
    btn.addEventListener("click", () => {
      if (filled) {
        const ok = confirm("Slot " + (i + 1) + " („" + slots[i].name + "“) überschreiben?\nAlter Stand und Run gehen verloren.");
        if (!ok) return;
      }
      pendingSlotIndex = i;
      const nameInput = $("player-name");
      if (nameInput) nameInput.value = filled ? slots[i].name : "";
      showMenuPanel("new");
    });
    list.appendChild(btn);
  }
}

function renderSaveSlotList() {
  const list = $("save-slot-list");
  const hint = $("load-slots-hint");
  if (!list) return;
  const slots = loadSaveSlots();
  list.innerHTML = "";
  let filled = 0;
  for (let i = 0; i < MAX_SAVE_SLOTS; i++) {
    const data = slots[i];
    const row = document.createElement("div");
    row.className = "save-slot-row";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "save-slot " + (data ? normalizeClassKey(data.classKey) : "empty");
    btn.disabled = !data;
    btn.innerHTML = buildSlotButtonHtml(i, data ? {
      ...data,
      run: loadActiveRunFor(data.name) || loadActiveRunFor(slotRunKey(i))
    } : null, "load");
    if (data) {
      filled++;
      btn.addEventListener("click", () => {
        unlockAudio();
        loadSaveSlot(i);
      });
    }
    row.appendChild(btn);
    if (data) {
      const del = document.createElement("button");
      del.type = "button";
      del.className = "btn btn-danger btn-small save-slot-delete";
      del.textContent = "Löschen";
      del.addEventListener("click", (ev) => {
        ev.stopPropagation();
        const ok = confirm("Slot " + (i + 1) + ' ("' + data.name + '") wirklich löschen?\nDieser Vorgang kann nicht rückgängig gemacht werden.');
        if (!ok) return;
        clearSaveSlot(i);
        renderSaveSlotList();
        renderHomeSlotPreview();
        updateContinueButton();
      });
      row.appendChild(del);
    }
    list.appendChild(row);
  }
  if (hint) {
    hint.textContent = filled
      ? filled + " von " + MAX_SAVE_SLOTS + " Slots belegt – Tippen lädt, Löschen entfernt den Stand."
      : "Noch keine Spielstände. Starte ein neues Spiel.";
  }
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getSelectedClassFromUI() {
  const sel = document.querySelector(".class-btn.selected");
  return normalizeClassKey((sel && sel.dataset.class) || game.classKey || "warrior");
}

function restoreSetupFromSave() {
  const last = getLastPlayerName();
  const nameInput = $("player-name");
  if (last && nameInput && !nameInput.value) nameInput.value = last;
  pendingSlotIndex = getLastSlotIndex();
  const filled = countFilledSlots();
  const homeHint = $("menu-home-hint");
  if (homeHint) {
    homeHint.textContent = filled
      ? filled + " von " + MAX_SAVE_SLOTS + " Slots belegt. Laden = direkt weiter · Neu = Held + Anleitung."
      : "Neues Spiel → Held wählen → kurze Anleitung · Bis zu 3 Spielstände möglich.";
  }
  showMenuPanel("home");
  updateRunButtons();
}

function returnToMainMenu() {
  if (game.isRunning && !game.isDead) {
    saveActiveRun(true);
    saveLocalPlayer();
  }
  stopLoop();
  game.isRunning = false;
  game.isPaused = false;
  game.isDead = false;
  game.hero = null;
  hideVictoryPanel();
  hidePauseMenu();
  hideUpgrades();
  $("gameover-panel")?.classList.add("hidden");
  $("game-frame")?.classList.add("hidden");
  $("game-section")?.classList.add("hidden");
  const setup = $("setup-section");
  if (setup) {
    setup.classList.remove("collapsed");
    setup.classList.remove("hidden");
  }
  restoreSetupFromSave();
  tryMenuMusic();
  startMenuBrandLoop();
  startHeroCardLoop();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function loadRunStore() {
  try {
    const raw = localStorage.getItem(RUN_STORAGE_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw);
    // Migration: altes Einzel-Objekt → Store (auch ältere RUN_SAVE_VERSION)
    if (data && data.hero && data.playerName && data.version != null && !Object.keys(data).some((k) => /^slot_\d+$/.test(k))) {
      const migrated = migrateRunData(data) || data;
      const key = playerStorageKey(migrated.playerName);
      const out = {};
      if (key) out[key] = migrated;
      out[slotRunKey(migrated.slotIndex | 0)] = migrated;
      return out;
    }
    return data && typeof data === "object" ? data : {};
  } catch (_) {
    return {};
  }
}

function peekActiveRun() {
  const last = getLastPlayerName();
  if (last) {
    const forLast = loadActiveRunFor(last) || loadActiveRunFor(slotRunKey(getLastSlotIndex()));
    if (forLast) return forLast;
  }
  const store = loadRunStore();
  const keys = Object.keys(store);
  if (!keys.length) return null;
  // Neuesten gültigen Run nehmen (nicht an exakte Versionsnummer scheitern)
  let best = null;
  keys.forEach((k) => {
    const raw = store[k];
    if (!raw || !raw.hero || !raw.playerName) return;
    const data = migrateRunData(raw);
    if (!data) return;
    if (!best || (data.savedAt || 0) > (best.savedAt || 0)) best = data;
  });
  return best;
}

function migrateRunData(data) {
  if (!data || !data.hero) return null;
  const needs =
    data.version !== RUN_SAVE_VERSION ||
    data.worldLayoutVersion !== WORLD_LAYOUT_VERSION ||
    (data.buildId && data.buildId !== BUILD_ID);
  if (!needs) return data;
  const out = { ...data };
  out.version = RUN_SAVE_VERSION;
  out.worldLayoutVersion = WORLD_LAYOUT_VERSION;
  out.buildId = BUILD_ID;
  out.scrollX = 0;
  if (out.hero) {
    const minX = COMBAT_LAYOUT?.heroMoveMinX ?? 16;
    const maxX = COMBAT_LAYOUT?.heroMoveMaxX ?? 560;
    out.hero.x = Math.max(minX, Math.min(maxX, Number(out.hero.x) || 320));
  }
  if (Array.isArray(out.enemies)) {
    out.enemies = out.enemies.map((e) => {
      if (!e) return e;
      const copy = { ...e };
      delete copy.y;
      return copy;
    });
  }
  return out;
}

function loadActiveRunFor(nameOrSlotKey) {
  if (nameOrSlotKey == null || nameOrSlotKey === "") return null;
  const store = loadRunStore();
  const rawName = String(nameOrSlotKey);
  const candidates = [];
  // Direkter Slot-Key (slot_0 …)
  if (/^slot_\d+$/.test(rawName)) candidates.push(rawName);
  const nameKey = playerStorageKey(rawName);
  if (nameKey) candidates.push(nameKey);
  // Falls Name übergeben: auch Slot-Key aus gespeichertem slotIndex versuchen
  let raw = null;
  for (const k of candidates) {
    if (store[k] && store[k].hero) { raw = store[k]; break; }
  }
  if (!raw) {
    // Fallback: Run mit passendem Spielernamen / Slot suchen
    const keys = Object.keys(store);
    for (let i = 0; i < keys.length; i++) {
      const entry = store[keys[i]];
      if (!entry || !entry.hero) continue;
      if (nameKey && playerStorageKey(entry.playerName) === nameKey) { raw = entry; break; }
      if (/^slot_\d+$/.test(rawName) && slotRunKey(entry.slotIndex | 0) === rawName) { raw = entry; break; }
    }
  }
  if (!raw || !raw.hero) return null;
  const data = migrateRunData(raw);
  if (data !== raw) {
    try {
      const next = loadRunStore();
      const nameK = playerStorageKey(data.playerName);
      if (nameK) next[nameK] = data;
      next[slotRunKey(data.slotIndex | 0)] = data;
      safeSetLocalStorage(RUN_STORAGE_KEY, next);
    } catch (_) {}
  }
  return data;
}

function clearActiveRun(nameOrSlotKey) {
  runSaveDirty = false;
  try {
    const store = loadRunStore();
    const raw = nameOrSlotKey != null && nameOrSlotKey !== ""
      ? String(nameOrSlotKey)
      : (game.playerName || "");
    const keysToDelete = new Set();
    if (/^slot_\d+$/.test(raw)) keysToDelete.add(raw);
    const nameKey = playerStorageKey(raw || game.playerName);
    if (nameKey) keysToDelete.add(nameKey);
    // Immer auch den aktuellen Slot-Key mitlöschen
    keysToDelete.add(slotRunKey(game.slotIndex | 0));
    // Falls Run den Spielernamen trägt: alle passenden Keys finden
    Object.keys(store).forEach((k) => {
      const e = store[k];
      if (!e) return;
      if (nameKey && playerStorageKey(e.playerName) === nameKey) keysToDelete.add(k);
      if (nameKey && k === nameKey) keysToDelete.add(k);
    });
    keysToDelete.forEach((k) => { delete store[k]; });
    if (Object.keys(store).length) localStorage.setItem(RUN_STORAGE_KEY, JSON.stringify(store));
    else localStorage.removeItem(RUN_STORAGE_KEY);
  } catch (_) {}
  updateRunButtons();
}

function markRunSaveDirty() {
  runSaveDirty = true;
}

function serializeHero(h) {
  if (!h) return null;
  return {
    x: h.x, facing: h.facing || 1,
    hp: h.hp, mana: h.mana,
    maxHp: h.maxHp, maxMana: h.maxMana,
    attack: h.attack, defense: h.defense, crit: h.crit,
    magicDamage: h.magicDamage, goldBonus: h.goldBonus, xpBonus: h.xpBonus,
    specialCd: h.specialCd, specialTimer: h.specialTimer || 0,
    abilitySlotCds: [...(h.abilitySlotCds || [0, 0])],
    abilityCds: { ...(h.abilityCds || {}) },
    warriorBuff: h.warriorBuff || 0,
    warriorBuffMult: h.warriorBuffMult || 1,
    shieldTimer: h.shieldTimer || 0,
    shieldReduction: h.shieldReduction || 0,
    lootBonuses: { ...(h.lootBonuses || {}) },
    equipment: h.equipment || null
  };
}

function serializeEnemy(e) {
  return {
    id: e.id, name: e.name, sprite: e.sprite, isBoss: !!e.isBoss, index: e.index || 0,
    x: e.x, walkingIn: !!e.walkingIn,
    maxHp: e.maxHp, hp: e.hp, attack: e.attack,
    goldReward: e.goldReward, xpReward: e.xpReward,
    speed: e.speed, attackInterval: e.attackInterval,
    aiStyle: e.aiStyle, aiSpeedMult: e.aiSpeedMult || 1,
    isRanged: !!e.isRanged, rangedRange: e.rangedRange || 0,
    jumpTimer: e.jumpTimer || 0, bossSpecialTimer: e.bossSpecialTimer || 0,
    attackTimer: e.attackTimer || 0, dead: !!e.dead
  };
}

function saveActiveRun(force) {
  if (!game.playerName || !game.hero || !game.isRunning || game.isDead) return false;
  if (!force && !runSaveDirty) return false;
  ensureMeta();
  const payload = {
    version: RUN_SAVE_VERSION,
    worldLayoutVersion: WORLD_LAYOUT_VERSION,
    gameVersion: GAME_VERSION,
    buildId: BUILD_ID,
    savedAt: Date.now(),
    playerName: game.playerName,
    slotIndex: game.slotIndex | 0,
    classKey: game.classKey,
    // Meta-Fortschritt mit dem Run mitspeichern – sonst fehlen Upgrades nach Laden
    totalGold: Math.max(0, Math.floor(Number(game.totalGold) || 0)),
    upgrades: { ...emptyUpgrades(), ...(game.upgrades || {}) },
    meta: validateMeta(game.meta),
    dungeonLevel: game.dungeonLevel,
    worldIndex: game.worldIndex | 0,
    waveWasBoss: !!game.waveWasBoss,
    loopCompleted: !!game.loopCompleted,
    loopIndex: game.loopIndex | 0,
    runGold: game.runGold,
    runXp: game.runXp,
    playerLevel: game.playerLevel,
    monstersDefeated: game.monstersDefeated,
    waveCooldown: game.waveCooldown || 0,
    specialTimer: game.specialTimer || 0,
    abilityCastLock: game.abilityCastLock || 0,
    waveNumber: game.waveNumber || 0,
    combatReady: !!game.combatReady,
    waveIntro: !!game.waveIntro,
    bestLoot: game.bestLoot || null,
    enemyId: enemyId,
    hero: serializeHero(game.hero),
    enemies: game.enemies.filter((e) => e && e.hp > 0 && !e.dead).map(serializeEnemy)
  };
  const key = playerStorageKey(game.playerName);
  const slotKey = slotRunKey(game.slotIndex);
  if (!key && !slotKey) return false;
  try {
    const store = loadRunStore();
    if (key) store[key] = payload;
    store[slotKey] = payload;
    safeSetLocalStorage(RUN_STORAGE_KEY, store);
    runSaveDirty = false;
    // Slot-Upgrades/Gold leise mitsynchronisieren
    saveLocalPlayer({ quiet: true });
    return true;
  } catch (_) {
    return false;
  }
}

function restoreHeroFromSave(data) {
  createHero();
  const h = game.hero;
  const s = data.hero;
  if (!s) return;
  h.x = Number.isFinite(s.x) ? s.x : h.x;
  h.facing = s.facing === -1 ? -1 : 1;
  h.maxHp = Number(s.maxHp) || h.maxHp;
  h.maxMana = Number(s.maxMana) || h.maxMana;
  h.attack = Number(s.attack) || h.attack;
  h.defense = Number(s.defense) || h.defense;
  h.crit = Number(s.crit) || h.crit;
  h.magicDamage = Number(s.magicDamage) || h.magicDamage;
  h.goldBonus = Number(s.goldBonus) || h.goldBonus;
  h.xpBonus = Number(s.xpBonus) || h.xpBonus;
  h.specialCd = Number(s.specialCd) || h.specialCd;
  h.specialTimer = Math.max(0, Number(s.specialTimer) || 0);
  restoreAbilitySlotCds(h, s);
  h.abilityCds = { ...(s.abilityCds || h.abilityCds || {}) };
  h.warriorBuff = Math.max(0, Number(s.warriorBuff) || 0);
  h.warriorBuffMult = Number(s.warriorBuffMult) || 1;
  h.shieldTimer = Math.max(0, Number(s.shieldTimer) || 0);
  h.shieldReduction = Number(s.shieldReduction) || 0;
  h.lootBonuses = {
    attack: 0, hp: 0, defense: 0, crit: 0, goldBonus: 0, magicDamage: 0, mana: 0,
    ...(s.lootBonuses || {})
  };
  h.equipment = s.equipment || null;
  const st = heroStats();
  h.hp = Math.max(1, Math.min(st.maxHp, Number(s.hp) || st.maxHp));
  h.mana = Math.max(0, Math.min(st.maxMana, Number.isFinite(Number(s.mana)) ? Number(s.mana) : st.maxMana));
  pinCharToGround(h);
}

function restoreEnemiesFromSave(data) {
  game.enemies = [];
  const list = Array.isArray(data.enemies) ? data.enemies : [];
  list.forEach((s) => {
    const packSize = (typeof VisualEnemies !== "undefined")
      ? VisualEnemies.getSize(s.sprite, !!s.isBoss)
      : null;
    const sp = SPRITES[s.sprite];
    if (!packSize && !sp) return;
    const ew = packSize ? packSize.w : spriteCharW(sp);
    const eh = packSize ? packSize.h : spriteCharH(sp);
    const enemy = {
      id: s.id || ++enemyId,
      name: s.name || "Gegner",
      sprite: s.sprite,
      isBoss: !!s.isBoss,
      index: s.index || 0,
      x: Number.isFinite(s.x) ? s.x : CW + 40,
      walkingIn: !!s.walkingIn,
      y: GROUND - eh,
      w: ew,
      h: eh,
      maxHp: Math.max(1, Number(s.maxHp) || 1),
      hp: Math.max(1, Number(s.hp) || 1),
      attack: Math.max(1, Number(s.attack) || 1),
      goldReward: Math.max(0, Number(s.goldReward) || 0),
      xpReward: Math.max(0, Number(s.xpReward) || 0),
      speed: Number(s.speed) || 0.7,
      attackInterval: Number(s.attackInterval) || 1.2,
      aiStyle: s.aiStyle || "melee",
      aiSpeedMult: Number(s.aiSpeedMult) || 1,
      isRanged: !!s.isRanged,
      rangedRange: Number(s.rangedRange) || 0,
      jumpTimer: Number(s.jumpTimer) || 0,
      bossSpecialTimer: Number(s.bossSpecialTimer) || 0,
      hitFlash: 0, anim: Math.random() * 6, dead: false,
      attackTimer: Number(s.attackTimer) || 0,
      attackAnim: 0, attackWindup: 0
    };
    game.enemies.push(enemy);
    pinCharToGround(enemy);
  });
  if (Number.isFinite(data.enemyId)) enemyId = Math.max(enemyId, data.enemyId);
}

function resumeRun(data) {
  if (!data || !data.hero) {
    startRun();
    return;
  }
  unlockAudio();
  hideUpgrades();
  stopLoop();
  resetRun();
  // Upgrades/Gold/Meta aus dem Run wiederherstellen (sonst fehlen sie nach Laden)
  if (data.upgrades || Number.isFinite(Number(data.totalGold)) || data.meta) {
    applyPlayerSave({
      classKey: data.classKey || game.classKey,
      totalGold: Number.isFinite(Number(data.totalGold)) ? data.totalGold : game.totalGold,
      upgrades: data.upgrades || game.upgrades,
      meta: data.meta || game.meta,
      slotIndex: Number.isFinite(Number(data.slotIndex)) ? data.slotIndex : game.slotIndex
    });
  }
  if (data.playerName) game.playerName = data.playerName;
  game.classKey = normalizeClassKey(data.classKey || game.classKey);
  selectClass(game.classKey);
  syncUnlockedAbilities(game.classKey);
  game.dungeonLevel = Math.max(1, Math.floor(Number(data.dungeonLevel) || 1));
  game.worldIndex = clampWorldIndex(
    Number.isFinite(Number(data.worldIndex))
      ? Number(data.worldIndex)
      : worldIndexFromLevel(game.dungeonLevel)
  );
  game.waveWasBoss = !!data.waveWasBoss ||
    (Array.isArray(data.enemies) && data.enemies.some((e) => e && e.isBoss));
  game.loopCompleted = !!data.loopCompleted;
  game.loopIndex = Math.max(0, Math.floor(Number(data.loopIndex) || 0));
  game.runGold = Math.max(0, Math.floor(Number(data.runGold) || 0));
  game.runXp = Math.max(0, Math.floor(Number(data.runXp) || 0));
  game.playerLevel = Math.max(1, Math.floor(Number(data.playerLevel) || 1));
  game.monstersDefeated = Math.max(0, Math.floor(Number(data.monstersDefeated) || 0));
  game.waveCooldown = Math.max(0, Number(data.waveCooldown) || 0);
  game.specialTimer = Math.max(0, Number(data.specialTimer) || 0);
  game.abilityCastLock = Math.max(0, Number(data.abilityCastLock) || 0);
  game.waveNumber = Math.max(0, Math.floor(Number(data.waveNumber) || 0));
  game.combatReady = data.combatReady !== false;
  game.waveIntro = !!data.waveIntro;
  game.bestLoot = data.bestLoot || null;
  if (game.bestLoot && $("loot-display")) {
    $("loot-display").classList.remove("hidden");
    if ($("best-loot-text")) {
      const bl = game.bestLoot;
      const eff = LOOT_EFFECTS.find((e) => e.key === bl.effect);
      const effLabel = eff ? eff.label : bl.effect;
      $("best-loot-text").textContent = (bl.rarity || "") + " " + (bl.name || "Loot") +
        (effLabel ? " (+" + effLabel + " " + (bl.value || 0) + ")" : "");
      $("best-loot-text").className = "loot-item " + (bl.css || "");
    }
  }
  try {
    restoreHeroFromSave(data);
    restoreEnemiesFromSave(data);
  } catch (err) {
    console.error("resumeRun failed:", err);
    clearActiveRun();
    startRun();
    return;
  }
  initWorldBackground();
  game.isRunning = true; game.isPaused = false; game.isDead = false;
  upgradePause = false;
  hidePauseMenu();
  $("gameover-panel").classList.add("hidden");
  $("game-frame").classList.remove("hidden");
  $("btn-start-run").disabled = true;
  $("btn-pause").disabled = false;
  $("btn-restart").disabled = false;
  $("btn-pause").textContent = "Pause (P)";
  if (countAliveEnemies() === 0 && game.waveCooldown <= 0) {
    game.waveCooldown = 0.8;
  }
  playWorldMusic(getWorld());
  addLog("Spielstand geladen – Dungeon " + game.dungeonLevel + ", weiter geht's!", "heal");
  updateClassHint();
  updateHUD();
  updateStatus();
  updateTotalGold();
  renderUpgradeButtons();
  renderAbilityPanel();
  updateRunButtons();
  markRunSaveDirty();
  saveActiveRun(true);
  saveLocalPlayer({ quiet: true });
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      beginRunLoop();
      if (canvas) canvas.focus();
    });
  });
}

function updateRunButtons() {
  const startBtn = $("btn-start-run");
  if (!startBtn) return;
  const run = game.playerName
    ? (loadActiveRunFor(game.playerName) || loadActiveRunFor(slotRunKey(game.slotIndex)))
    : peekActiveRun();
  if (game.isRunning && !game.isDead) {
    startBtn.textContent = "Run läuft";
    startBtn.disabled = true;
  } else if (run && (!game.playerName || playerStorageKey(run.playerName) === playerStorageKey(game.playerName))) {
    startBtn.textContent = "Weiter spielen";
    startBtn.disabled = false;
  } else {
    startBtn.textContent = "Run starten";
    startBtn.disabled = false;
  }
}

function applyPlayerSave(data) {
  game.classKey = normalizeClassKey(data.classKey);
  game.totalGold = Math.max(0, Math.floor(Number(data.totalGold) || 0));
  const ups = { ...emptyUpgrades(), ...(data.upgrades || {}) };
  Object.keys(ups).forEach((k) => {
    const n = Math.floor(Number(ups[k]) || 0);
    ups[k] = Math.max(0, Math.min(BALANCE.upgradeMax, Number.isFinite(n) ? n : 0));
  });
  game.upgrades = ups;
  if (Number.isFinite(data.slotIndex)) game.slotIndex = data.slotIndex;
  game.meta = validateMeta(data.meta || defaultMeta());
}

function showLeaderboardSection() { /* Rangliste entfernt */ }

async function loadSaveSlot(slotIndex) {
  const slot = getSlot(slotIndex);
  if (!slot || !slot.name) {
    const hint = $("load-slots-hint");
    if (hint) hint.textContent = "Dieser Slot ist leer.";
    return;
  }
  game.slotIndex = slotIndex;
  game.playerName = slot.name;
  game.playerId = null;
  applyPlayerSave({ ...slot, slotIndex });
  selectClass(game.classKey);
  syncUnlockedAbilities(game.classKey);
  saveMeta();
  const run = loadActiveRunFor(slot.name) || loadActiveRunFor(slotRunKey(slotIndex));
  // Falls Run Upgrades hat, die neueren übernehmen
  if (run && run.upgrades) {
    applyPlayerSave({
      classKey: run.classKey || game.classKey,
      totalGold: Number.isFinite(Number(run.totalGold)) ? run.totalGold : game.totalGold,
      upgrades: run.upgrades,
      meta: run.meta || game.meta,
      slotIndex
    });
  }
  await ensureRunWorldAssets(run?.dungeonLevel || 1, run?.worldIndex);
  const upLv = countUpgradeLevels(game.upgrades);
  const msg = run
    ? "Slot " + (slotIndex + 1) + ": " + slot.name + " – Dungeon " + run.dungeonLevel +
      (upLv ? " · " + upLv + " Upgrades" : "")
    : "Slot " + (slotIndex + 1) + ": " + slot.name + " geladen" +
      (upLv ? " (" + upLv + " Upgrades)" : "");
  enterGame(msg, { forceNew: false, autoRun: true });
}

async function loadPlayer(opts) {
  const name = (opts && opts.name) || $("player-name").value.trim();
  if (!name) {
    const hint = $("load-hint");
    if (hint) hint.textContent = "Bitte Namen eingeben.";
    return;
  }
  game.playerName = name;
  game.playerId = null;
  if (Number.isFinite(opts && opts.slotIndex)) game.slotIndex = opts.slotIndex;
  const forceNew = !!(opts && opts.forceNew);
  const forceClass = opts && opts.forceClass ? normalizeClassKey(opts.forceClass) : null;
  if (forceNew) {
    clearActiveRun(name);
    clearActiveRun(slotRunKey(game.slotIndex));
  }

  const saved = forceNew ? null : loadLocalPlayer(name);
  if (saved) {
    applyPlayerSave(saved);
    if (forceClass) {
      game.classKey = forceClass;
      saveLocalPlayer();
    }
    selectClass(game.classKey);
    syncUnlockedAbilities();
    const run = forceNew ? null : (loadActiveRunFor(name) || loadActiveRunFor(slotRunKey(game.slotIndex)));
    await ensureRunWorldAssets(run?.dungeonLevel || 1, run?.worldIndex);
    const msg = run
      ? "Willkommen zurück, " + name + "! Spielstand Dungeon " + run.dungeonLevel + " wird fortgesetzt."
      : forceNew
        ? "Neues Spiel als " + (CLASSES[game.classKey]?.name || game.classKey) + " – " + name + "!"
        : "Willkommen zurück, " + name + "!";
    enterGame(msg, { forceNew, autoRun: true });
    return;
  }

  game.totalGold = 0;
  game.upgrades = emptyUpgrades();
  game.classKey = forceClass || normalizeClassKey(game.classKey);
  saveLocalPlayer();
  selectClass(game.classKey);
  syncUnlockedAbilities();
  await ensureRunWorldAssets(1);
  enterGame("Neuer Abenteurer: " + name + " (" + (CLASSES[game.classKey]?.name || "") + ")!", { forceNew: true, autoRun: true });
}

async function loadPlayerSlot(name, opts) {
  await loadPlayer({ ...(opts || {}), name, forceNew: !!(opts && opts.forceNew) });
}

async function startNewGameFromMenu() {
  unlockAudio();
  const name = $("player-name").value.trim();
  if (!name) {
    const hint = $("load-hint");
    if (hint) hint.textContent = "Bitte einen Namen eingeben.";
    return;
  }
  const classKey = getSelectedClassFromUI();
  game.classKey = classKey;
  game.slotIndex = pendingSlotIndex;
  game.meta = defaultMeta();
  selectClass(classKey);
  // Slot ggf. leeren und neu belegen
  clearSaveSlot(pendingSlotIndex);
  game.playerName = name;
  game.totalGold = 0;
  game.upgrades = emptyUpgrades();
  saveLocalPlayer();
  await loadPlayer({ forceNew: true, forceClass: classKey, name, slotIndex: pendingSlotIndex });
}

async function startNewGameFromSetup() {
  await startNewGameFromMenu();
}

/** Optional: Cloud-Save laden wenn Supabase konfiguriert ist */
async function tryLoadCloudPlayer(name) {
  if (!supabase) return;
  try {
    const { data, error } = await supabase.from("dungeon_players").select("*").eq("name", name).maybeSingle();
    if (error || !data) return;
    game.playerId = data.id;
    const local = loadLocalPlayer(name);
    const cloudTime = data.updated_at ? new Date(data.updated_at).getTime() : 0;
    const localTime = local?.savedAt || 0;
    if (!local || cloudTime > localTime) {
      applyPlayerSave({
        classKey: data.class_name,
        totalGold: data.total_gold,
        upgrades: {
          upgrade_attack: data.upgrade_attack, upgrade_health: data.upgrade_health,
          upgrade_defense: data.upgrade_defense, upgrade_crit: data.upgrade_crit,
          upgrade_gold: data.upgrade_gold, upgrade_xp: data.upgrade_xp,
          upgrade_magic: data.upgrade_magic, upgrade_mana: data.upgrade_mana,
          upgrade_cooldown: data.upgrade_cooldown
        }
      });
      selectClass(game.classKey);
      syncUnlockedAbilities();
      saveLocalPlayer();
      updateTotalGold();
      renderUpgradeButtons();
      renderAbilityPanel();
    }
  } catch (_) { /* offline */ }
}

function enterGame(msg, opts) {
  stopHeroCardLoop();
  stopMenuBrandLoop();
  $("game-section").classList.remove("hidden");
  hideUpgrades();
  $("setup-section").classList.add("collapsed");
  if (!game.meta) game.meta = loadMeta();
  syncUnlockedAbilities();
  updateTotalGold(); renderUpgradeButtons(); renderAbilityPanel();
  renderSetupAbilityHint();
  const hint = $("load-hint");
  if (hint) hint.textContent = msg;
  updateRunButtons();
  $("game-section").scrollIntoView({ behavior: "smooth" });
  const forceNew = !!(opts && opts.forceNew);
  const savedRun = forceNew
    ? null
    : (loadActiveRunFor(game.playerName) || loadActiveRunFor(slotRunKey(game.slotIndex)));
  // Direkt in den Run (Laden & Neues Spiel)
  requestAnimationFrame(() => {
    if (savedRun) resumeRun(savedRun);
    else startRun();
  });
}

function emptyUpgrades() { const u = {}; UPGRADES.forEach((x) => u[x.key] = 0); return u; }
function selectClass(k) {
  game.classKey = normalizeClassKey(k || game.classKey);
  document.querySelectorAll(".class-btn").forEach((b) => b.classList.toggle("selected", b.dataset.class === game.classKey));
  updateHeroCardUI();
}

async function savePlayer() {
  saveLocalPlayer();
  if (!supabase || !game.playerId) return;
  try {
    await supabase.from("dungeon_players").update({
      class_name: game.classKey, total_gold: game.totalGold,
      ...game.upgrades
    }).eq("id", game.playerId);
  } catch (_) { /* offline ok */ }
}

// ============================================
// RUN
// ============================================

function countAliveEnemies() {
  return game.enemies.filter((e) => e.hp > 0 && !e.dead).length;
}

function getEnemyVisibleWidth(e) {
  const left = Math.max(e.x, COMBAT_LAYOUT.screenEdgePad);
  const right = Math.min(e.x + e.w, CW - COMBAT_LAYOUT.screenEdgePad);
  return Math.max(0, right - left);
}

function isEnemyOnScreen(e) {
  if (e.dead || e.hp <= 0) return false;
  return getEnemyVisibleWidth(e) >= COMBAT_LAYOUT.minVisiblePx;
}

function isEnemyTargetable(e, maxRange) {
  if (!isEnemyOnScreen(e)) return false;
  if (e.walkingIn) return false;
  if (maxRange == null || !game.hero) return true;
  const h = game.hero;
  const hx = h.x + h.w / 2, hy = h.y + h.h / 2;
  return Math.hypot(e.x + e.w / 2 - hx, e.y + e.h / 2 - hy) <= maxRange;
}

function getNearestEnemy(maxRange) {
  const h = game.hero;
  if (!h) return null;
  const hx = h.x + h.w / 2, hy = h.y + h.h / 2;
  let best = null, bestD = Infinity;
  game.enemies.forEach((e) => {
    if (!isEnemyTargetable(e, maxRange)) return;
    const d = Math.hypot(e.x + e.w / 2 - hx, e.y + e.h / 2 - hy);
    if (d < bestD) { bestD = d; best = e; }
  });
  return best;
}

function hasTargetableEnemy(maxRange) {
  return game.enemies.some((e) => isEnemyTargetable(e, maxRange));
}

function getHoveredEnemy(maxRange) {
  if (!mouse.onCanvas || !game.hero) return null;
  const aim = getAim();
  const { hx, hy } = getHeroCenter();
  let found = null;
  game.enemies.forEach((e) => {
    if (!isEnemyTargetable(e, maxRange)) return;
    if (!pointInEnemyBody(e, aim.x, aim.y)) return;
    const vb = getEnemyVisualBounds(e);
    const ex = vb.cx, ey = vb.y + vb.h / 2;
    if (Math.hypot(ex - hx, ey - hy) > maxRange) return;
    found = e;
  });
  return found;
}

function getHeroCenter() {
  const h = game.hero;
  if (!h) return { hx: 0, hy: 0 };
  return { hx: h.x + h.w / 2, hy: h.y + h.h / 2 };
}

function forEachEnemyInRange(range, fn) {
  const { hx, hy } = getHeroCenter();
  game.enemies.forEach((e) => {
    if (!isEnemyTargetable(e, range)) return;
    const ex = e.x + e.w / 2, ey = e.y + e.h / 2;
    if (Math.hypot(ex - hx, ey - hy) > range) return;
    fn(e, ex, ey);
  });
}

function getPrimaryMeleeAngle(fallback) {
  const { hx, hy } = getHeroCenter();
  const near = getNearestEnemy(Infinity);
  if (near) return Math.atan2(near.y + near.h / 2 - hy, near.x + near.w / 2 - hx);
  return fallback;
}

function getCombatAim() {
  const aim = getAim();
  const h = game.hero;
  if (!h) return aim;
  const cls = CLASSES[game.classKey];
  const maxR = cls.range || 245;
  const hovered = getHoveredEnemy(maxR);

  if (hovered) {
    return {
      x: hovered.x + hovered.w / 2,
      y: hovered.y + hovered.h / 2,
      onCanvas: true,
      down: mouse.down,
      target: hovered
    };
  }

  if (aim.onCanvas) return aim;
  const { hx, hy } = getHeroCenter();
  return { x: hx, y: hy, onCanvas: false, down: mouse.down };
}

function getHeroMinX(_h) {
  return COMBAT_LAYOUT.heroMoveMinX ?? 16;
}

function getHeroMaxX(h) {
  const overflow = COMBAT_LAYOUT.heroEdgeOverflowRight ?? 0.12;
  const edgeMax = CW - h.w * (1 - overflow);
  const moveMax = COMBAT_LAYOUT.heroMoveMaxX ?? (CW - 24);
  return Math.min(moveMax, edgeMax);
}

function enemyInCombatRange(e, h) {
  const gap = getEnemyGap(e, h);
  const reach = getEnemyReach(e);
  if (gap <= reach && gap >= -36) return true;
  const dist = Math.abs((e.x + e.w * 0.5) - (h.x + h.w * 0.5));
  return dist <= reach + (e.w + h.w) * 0.32;
}

function getEnemyReach(e) {
  return e.isBoss ? COMBAT_LAYOUT.enemyBossReach : COMBAT_LAYOUT.enemyMeleeReach;
}

function getEnemyGap(e, h) {
  return e.x - (h.x + h.w);
}

function getEnemyChaseGap(e) {
  const reach = getEnemyReach(e);
  return Math.max(4, reach - 12);
}

function getEnemyMoveSpeed(e) {
  if (e.walkingIn) return COMBAT_LAYOUT.introSpeed * 0.96;
  const base = e.isBoss ? COMBAT_LAYOUT.enemyBossChaseSpeed : COMBAT_LAYOUT.enemyChaseSpeed;
  const aiMult = e.aiSpeedMult || 1;
  return (base + (e.speed || 0) * 42) * aiMult;
}

function separateEnemies(e, h, dt) {
  const myGap = getEnemyGap(e, h);
  game.enemies.forEach((other) => {
    if (other === e || other.dead || other.hp <= 0) return;
    const dx = (e.x + e.w * 0.5) - (other.x + other.w * 0.5);
    const dist = Math.abs(dx);
    const minDist = COMBAT_LAYOUT.enemySeparation + (e.w + other.w) * 0.14;
    if (dist >= minDist || dist < 0.1) return;
    const push = (minDist - dist) * 1.8 * dt;
    const otherGap = getEnemyGap(other, h);
    // Hintere Gegner nicht vom Helden wegdrücken – nur leicht seitlich ausweichen
    if (myGap > otherGap + 6) {
      e.x -= push * 0.15;
      return;
    }
    if (myGap < otherGap - 4) e.x -= push * 0.35;
    else e.x += dx > 0 ? push * 0.45 : -push * 0.45;
  });
}

function updateEnemyMovement(e, h, dt) {
  if (e.dead || e.hp <= 0) return;
  const startX = e.x;

  const heroEdge = h.x + h.w;
  const gap = getEnemyGap(e, h);
  const idealGap = getEnemyChaseGap(e);
  const targetX = heroEdge + idealGap;
  const reach = getEnemyReach(e);
  let speed = getEnemyMoveSpeed(e);

  if (e.attackWindup > 0.4) speed *= 0.5;
  else if (e.attackAnim > 0) speed *= 0.68;
  if ((e.slowTimer || 0) > 0) speed *= e.slowMult || 0.5;

  /** Wolf & schnelle Gegner: Sprung-Angriff */
  if (e.aiStyle === "jump" && e.isChasing && !e.walkingIn) {
    e.jumpTimer = (e.jumpTimer || 0) + dt;
    if (e.jumpTimer >= 1.7 && gap > reach) {
      e.x -= speed * dt * 2.8;
      e.jumpTimer = 0;
      e.attackAnim = 0.35;
    }
  }

  /** Langsame Gegner: gedämpfte Bewegung, dafür stärker */
  if (e.aiStyle === "slow") speed *= 0.82;

  const inRange = enemyInCombatRange(e, h);
  e.isChasing = !inRange || !!e.walkingIn;

  if (e.walkingIn) {
    if (e.x > targetX + 2) e.x -= speed * dt;
    else if (gap > reach) e.x -= speed * dt * 0.92;
    e.x = Math.max(h.x - e.w * 0.25, e.x);
    e.gaitPhase = (e.gaitPhase || 0) + Math.abs(e.x - startX) * 0.12;
    return;
  }

  if (!inRange) {
    if (e.x > targetX + 1) e.x -= speed * dt;
    else if (gap > reach) e.x -= speed * dt * 0.95;
    else if (gap < -10) e.x += speed * dt * 0.85;
  } else {
    if (gap < -10) e.x += Math.min(speed * dt * 0.75, -gap - 6);
    else if (gap > idealGap + 8) e.x -= Math.min(speed * dt * 0.55, gap - idealGap);
  }

  e.x = Math.max(h.x - e.w * 0.25, Math.min(CW + COMBAT_LAYOUT.introOffscreen + 20, e.x));
  separateEnemies(e, h, dt);
  e.gaitPhase = (e.gaitPhase || 0) + Math.abs(e.x - startX) * 0.12;
}

function safeSpawnWave() {
  try {
    if (countAliveEnemies() === 0) spawnWave();
  } catch (err) {
    console.error("spawnWave failed:", err);
    addLog("Gegner-Spawn Fehler – erneuter Versuch...");
  }
}

function ensureGameLoop() {
  if (!canvas || !ctx) return;
  if (!game.loopId) startLoop();
  render();
  // Regeneration (Defense-Build)
  if (game.hero && !game.isDead) {
    const stR = heroStats();
    if (stR.regen > 0) {
      game.hero.hp = Math.min(stR.maxHp, game.hero.hp + stR.regen * dt);
    }
  }
  if (typeof syncRunStatsLive === "function") syncRunStatsLive();
  if (typeof tickBalanceDebug === "function") tickBalanceDebug(dt);
  updateHUD();
  updateStatus();
}

function beginRunLoop() {
  ensureGameLoop();
}

function startRun() {
  unlockAudio();
  if (game.isRunning && !game.isDead) {
    ensureGameLoop();
    if (countAliveEnemies() === 0) safeSpawnWave();
    return;
  }
  clearActiveRun();
  hideUpgrades();
  stopLoop();
  resetRun();
  try {
    createHero();
  } catch (err) {
    console.error("createHero failed:", err);
    addLog("Start fehlgeschlagen – Seite neu laden (Strg+F5).");
    return;
  }
  game.isRunning = true; game.isPaused = false; game.isDead = false;
  upgradePause = false;
  game.upgradeBoughtThisRun = false;
  game._lastDeathData = null;
  hidePauseMenu();
  $("gameover-panel").classList.add("hidden");
  $("game-frame").classList.remove("hidden");
  $("btn-start-run").disabled = true;
  $("btn-pause").disabled = false;
  $("btn-restart").disabled = false;
  $("btn-pause").textContent = "Pause (P)";
  if (typeof resetRunStatsForNewRun === "function") resetRunStatsForNewRun();
  safeSpawnWave();
  game.combatReady = true;
  playWorldMusic(getWorld());
  addLog("Run gestartet – Durchlauf " + ((game.loopIndex | 0) + 1) + ". Stirb → Upgrade → neuer Rekord!");
  updateClassHint();
  updateRunButtons();
  markRunSaveDirty();
  saveActiveRun(true);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      beginRunLoop();
      if (canvas) canvas.focus();
    });
  });
}

async function continueOrStartRun() {
  unlockAudio();
  if (game.isRunning && !game.isDead) {
    ensureGameLoop();
    return;
  }
  const existing = game.playerName
    ? (loadActiveRunFor(game.playerName) || loadActiveRunFor(slotRunKey(game.slotIndex)))
    : peekActiveRun();
  if (existing) {
    await ensureRunWorldAssets(existing.dungeonLevel || 1, existing.worldIndex);
    resumeRun(existing);
    return;
  }
  await ensureRunWorldAssets(1);
  startRun();
}

function resetRun() {
  game.dungeonLevel = 1; game.runGold = 0; game.lastRunGold = 0; game.runXp = 0; game.playerLevel = 1;
  game.worldIndex = 0; game.waveWasBoss = false;
  game.loopCompleted = false;
  game.monstersDefeated = 0; game.combatLog = []; game.bestLoot = null;
  game.enemies = []; game.projectiles = []; game.particles = []; game.coins = [];
  game.meleeSlashes = []; game.attackEffects = []; game.screenShake = 0;
  game.scrollX = 0; game.specialTimer = 0; game.waveCooldown = 0;
  game.waveNumber = 0; game.currentWave = null;
  game.waveIntro = false; game.combatReady = true;
  game.worldParticles = [];
  game.bossIntro = null; game.announcement = null; game.abilityCastLock = 0;
  game.critFlash = 0; game.zoomPulse = 0;
  $("loot-display").classList.add("hidden");
  initWorldBackground();
}

function restartRun() {
  stopLoop();
  clearActiveRun();
  game.isRunning = false; game.isPaused = false; game.isDead = false;
  resetRun();
  game.hero = null;
  hidePauseMenu();
  $("gameover-panel").classList.add("hidden");
  $("game-frame").classList.add("hidden");
  $("btn-start-run").disabled = false;
  $("btn-pause").disabled = true; $("btn-restart").disabled = true;
  updateRunButtons();
  addLog("Run zurückgesetzt.");
}

function mountUpgradeOverlay() {
  const sec = $("upgrade-section");
  const frame = $("game-frame");
  const card = $("game-section");
  if (!sec || !card) return;
  const host = (document.fullscreenElement === frame && frame) ? frame : card;
  if (sec.parentElement !== host) host.appendChild(sec);
}

function showPauseMenu() {
  const panel = $("pause-panel");
  if (panel) panel.classList.remove("hidden");
}

function hidePauseMenu() {
  const panel = $("pause-panel");
  if (panel) panel.classList.add("hidden");
}

function showUpgrades() {
  $("gameover-panel").classList.add("hidden");
  hidePauseMenu();
  mountUpgradeOverlay();
  const sec = $("upgrade-section");
  if (!sec || !$("game-section") || $("game-section").classList.contains("hidden")) return;
  sec.classList.remove("hidden");
  sec.classList.add("highlight-pulse");
  if (canvas) canvas.style.pointerEvents = "none";
  updateTotalGold(); renderUpgradeButtons(); renderAbilityPanel();
  if (game.isRunning && !game.isDead && !game.isPaused) {
    upgradePause = true;
    game.isPaused = true;
    stopLoop();
    $("btn-pause").textContent = "Weiter (P)";
  }
  setTimeout(() => sec.classList.remove("highlight-pulse"), 2400);
}

function hideUpgrades() {
  const sec = $("upgrade-section");
  if (!sec) return;
  sec.classList.add("hidden");
  if (canvas) canvas.style.pointerEvents = "";
  if (upgradePause) {
    upgradePause = false;
    game.isPaused = false;
    $("btn-pause").textContent = "Pause (P)";
  }
  if (game.isDead) $("gameover-panel").classList.remove("hidden");
  // Aus Upgrades zurück ins Pausenmenü, wenn der Run noch pausiert ist
  if (game.isRunning && !game.isDead && game.isPaused) {
    showPauseMenu();
  }
  if (game.isRunning && !game.isDead && !game.isPaused) {
    ensureGameLoop();
    if (countAliveEnemies() === 0) safeSpawnWave();
  }
  if (canvas) canvas.focus();
}

function toggleUpgrades() {
  const sec = $("upgrade-section");
  if (!sec || $("game-section").classList.contains("hidden")) return;
  if (sec.classList.contains("hidden")) showUpgrades();
  else hideUpgrades();
}

function goToUpgrades() {
  showUpgrades();
}

function togglePause() {
  if (!game.isRunning || game.isDead) return;
  // Während Upgrade- oder Victory-Overlay: Pause nicht umschalten
  const sec = $("upgrade-section");
  if (sec && !sec.classList.contains("hidden")) return;
  const vic = $("victory-panel");
  if (vic && !vic.classList.contains("hidden")) return;
  game.isPaused = !game.isPaused;
  $("btn-pause").textContent = game.isPaused ? "Weiter (P)" : "Pause (P)";
  if (game.isPaused) {
    saveActiveRun(true);
    if (game.playerName) saveLocalPlayer();
    stopLoop();
    showPauseMenu();
    addLog("Pausiert.");
  } else {
    hidePauseMenu();
    startLoop();
  }
}

// ============================================
// HELD
// ============================================

function createHero() {
  const cls = CLASSES[game.classKey];
  const eff = (key) => getUpgradeEff(key);
  const hp = cls.hp + eff("upgrade_health");
  const atkSpd = 1 + eff("upgrade_atkspd");
  game.hero = {
    x: COMBAT_LAYOUT.heroCombatX,
    y: GROUND - HR.displayH(), vx: 0, vy: 0,
    w: HR.displayW(), h: HR.displayH(),
    maxHp: hp,
    hp: hp,
    attack: cls.attack + eff("upgrade_attack"),
    defense: cls.defense + eff("upgrade_defense"),
    crit: cls.crit + eff("upgrade_crit"),
    critDamage: (BALANCE.critDamageBase || 1.85) + eff("upgrade_critdmg"),
    magicDamage: cls.magicDamage + eff("upgrade_magic"),
    maxMana: cls.mana + eff("upgrade_mana"),
    mana: cls.mana + eff("upgrade_mana"),
    goldBonus: 1 + eff("upgrade_gold"),
    xpBonus: 1 + eff("upgrade_xp"),
    bossDamage: eff("upgrade_bossdmg"),
    lifesteal: Math.min(0.12, eff("upgrade_lifesteal")),
    regen: eff("upgrade_regen"),
    atkSpeedMult: Math.min(1.85, atkSpd),
    moveSpeedMult: 1,
    specialCd: Math.max(2.5, cls.specialCd - eff("upgrade_cooldown")),
    specialTimer: 0,
    abilitySlotCds: [0, 0],
    abilityCds: {},
    warriorBuff: 0,
    warriorBuffMult: 1,
    shieldTimer: 0,
    shieldReduction: 0,
    lootBonuses: { attack:0, hp:0, defense:0, crit:0, goldBonus:0, magicDamage:0, mana:0 },
    equipment: null,
    facing: 1, anim: 0, hitFlash: 0, attackAnim: 0, hurtAnim: 0,
    animState: "idle", animFrame: 0, animTime: 0, deathAnim: false, deathDone: false
  };
  pinCharToGround(game.hero);
  $("hud-mana-wrap").classList.toggle("hidden", game.classKey !== "mage");
  initHeroAbilityCds(game.hero);
}

/** Cooldown-Timer pro W/S-Taste (getrennt, auch bei gleicher Fähigkeits-ID) */
function initHeroAbilityCds(h) {
  h.abilitySlotCds = [0, 0];
  [0, 1].forEach((slotIdx) => {
    const ab = getEquippedAbilityAtSlot(slotIdx);
    if (ab) h.abilitySlotCds[slotIdx] = getEffectiveAbilityCd(ab) * 0.4;
  });
  // Legacy-Spiegel für ältere Saves
  h.abilityCds = {};
  getClassAbilities(game.classKey).forEach((ab) => {
    h.abilityCds[ab.id] = ab.cd * 0.4;
  });
}

function heroStats() {
  const h = game.hero, lb = h.lootBonuses || {};
  const cap = BALANCE.critChanceCap || 0.52;
  return {
    attack: h.attack + (lb.attack || 0),
    defense: h.defense + (lb.defense || 0),
    crit: Math.min(cap, h.crit + (lb.crit || 0)),
    critDamage: h.critDamage || (BALANCE.critDamageBase || 1.85),
    magicDamage: h.magicDamage + (lb.magicDamage || 0),
    maxHp: h.maxHp + (lb.hp || 0),
    maxMana: h.maxMana + (lb.mana || 0),
    goldBonus: h.goldBonus + (lb.goldBonus || 0),
    bossDamage: h.bossDamage || 0,
    lifesteal: h.lifesteal || 0,
    regen: h.regen || 0,
    atkSpeedMult: h.atkSpeedMult || 1,
    moveSpeedMult: 1
  };
}

function refreshHeroFromUpgrades() {
  if (!game.hero) return;
  const cls = CLASSES[game.classKey];
  const eff = (key) => getUpgradeEff(key);
  const h = game.hero;
  const ratio = h.maxHp > 0 ? h.hp / h.maxHp : 1;
  h.maxHp = cls.hp + eff("upgrade_health");
  h.hp = Math.max(1, Math.min(h.maxHp, Math.floor(h.maxHp * ratio)));
  h.attack = cls.attack + eff("upgrade_attack");
  h.defense = cls.defense + eff("upgrade_defense");
  h.crit = cls.crit + eff("upgrade_crit");
  h.critDamage = (BALANCE.critDamageBase || 1.85) + eff("upgrade_critdmg");
  h.magicDamage = cls.magicDamage + eff("upgrade_magic");
  h.maxMana = cls.mana + eff("upgrade_mana");
  h.mana = Math.min(h.maxMana, h.mana);
  h.goldBonus = 1 + eff("upgrade_gold");
  h.xpBonus = 1 + eff("upgrade_xp");
  h.bossDamage = eff("upgrade_bossdmg");
  h.lifesteal = Math.min(0.12, eff("upgrade_lifesteal"));
  h.regen = eff("upgrade_regen");
  h.atkSpeedMult = Math.min(1.85, 1 + eff("upgrade_atkspd"));
  h.moveSpeedMult = 1;
  h.specialCd = Math.max(2.5, cls.specialCd - eff("upgrade_cooldown"));
}

function getWorldForLevel(level) {
  const lv = Math.max(1, Math.floor(Number(level) || 1));
  let w = WORLDS[0];
  for (const x of WORLDS) if (lv >= x.min) w = x;
  return w;
}

function worldIndexFromLevel(level) {
  const lv = Math.max(1, Math.floor(Number(level) || 1));
  let idx = 0;
  for (let i = 0; i < WORLDS.length; i++) if (lv >= WORLDS[i].min) idx = i;
  return idx;
}

function clampWorldIndex(idx) {
  const n = Math.floor(Number(idx) || 0);
  return Math.max(0, Math.min(WORLDS.length - 1, n));
}

async function ensureRunWorldAssets(dungeonLevel, worldIndex) {
  if (typeof PackAssets === "undefined") return;
  const world = Number.isFinite(Number(worldIndex))
    ? WORLDS[clampWorldIndex(worldIndex)]
    : getWorldForLevel(dungeonLevel);
  await PackAssets.ensureWorld(world.theme);
}

function prefetchSaveSlotWorlds() {
  if (typeof PackAssets === "undefined") return;
  const themes = new Set(["forest"]);
  loadSaveSlots().forEach((slot, i) => {
    if (!slot) return;
    const run = loadActiveRunFor(slot.name) || loadActiveRunFor(slotRunKey(i));
    const idx = Number.isFinite(Number(run?.worldIndex))
      ? clampWorldIndex(run.worldIndex)
      : worldIndexFromLevel(run?.dungeonLevel || 1);
    themes.add(WORLDS[idx].theme);
  });
  PackAssets.prefetchWorlds([...themes]);
}

function getWorld() {
  return WORLDS[clampWorldIndex(game.worldIndex)];
}

/** Boss-Welle: Tor zur nächsten Welt; in der letzten Welt endet der Run nach dem Boss. */
function shouldSpawnWorldBoss() {
  const idx = clampWorldIndex(game.worldIndex);
  const world = WORLDS[idx];
  const len = world.length || 20;
  // Boss am Ende der Weltlänge (soft gate)
  if (game.dungeonLevel >= world.min + len) return true;
  // Legacy-Tor: nächste Welt-min
  if (idx < WORLDS.length - 1 && game.dungeonLevel >= WORLDS[idx + 1].min) return true;
  return false;
}

/** Nach besiegter Boss-Welle: nächste Welt – Boss der letzten Welt = Spiel fertig. */
function tryAdvanceWorldAfterBossWave() {
  if (!game.waveWasBoss) return false;
  game.waveWasBoss = false;
  const idx = clampWorldIndex(game.worldIndex);

  // Boss in der letzten Welt besiegt → fertig
  if (idx >= WORLDS.length - 1) {
    completeDungeonLoop();
    return true;
  }

  const gate = WORLDS[idx + 1].min;
  if (game.dungeonLevel < gate) return false;

  game.worldIndex = idx + 1;
  const newWorld = getWorld();
  PackAssets?.ensureWorld(newWorld.theme).catch(() => {});
  initWorldBackground();
  startWorldTransition(newWorld);
  addLog("⚠ NEUE WELT: " + newWorld.name + " – härter, upgraden lohnt sich!", "boss");
  showAnnouncement("world", "NEUE WELT", newWorld.name, 3.0);
  playWorldMusic(newWorld);
  emitCombatEvent("world_change");
  return true;
}

/** Glückwunsch – Welten geschafft. Nächster Durchlauf oder Neu starten. */
function completeDungeonLoop() {
  if (game.loopCompleted) return;
  game.loopCompleted = true;
  game.isPaused = true;
  game.isRunning = false;
  stopLoop();
  hidePauseMenu();
  hideUpgrades();

  const earnedGold = Math.max(0, Math.floor(Number(game.runGold) || 0));
  game.lastRunGold = earnedGold;
  game.totalGold = Math.max(0, Math.floor(Number(game.totalGold) || 0) + earnedGold);
  game.runGold = 0;
  const clearedLoop = (game.loopIndex | 0) + 1;
  if (game.meta) {
    game.meta.loopsCleared = Math.max(game.meta.loopsCleared || 0, clearedLoop);
    saveMeta();
  }
  if (game.playerName) saveLocalPlayer({ quiet: true });
  clearActiveRun();

  const panel = $("victory-panel");
  if (panel) panel.classList.remove("hidden");
  const summary = $("victory-summary");
  if (summary) {
    summary.textContent =
      "Durchlauf " + clearedLoop + " geschafft · Level " + game.dungeonLevel +
      " · " + game.monstersDefeated + " Monster · " + earnedGold + " Gold\n" +
      "Durchlauf " + (clearedLoop + 1) + ": härter, Upgrades bleiben. Oder Neu starten = von null.";
  }
  const lead = $("victory-lead");
  if (lead) {
    lead.textContent = clearedLoop <= 1
      ? "Erster Durchlauf geschafft!"
      : ("Durchlauf " + clearedLoop + " geschafft!");
  }
  addLog("Glückwunsch – Durchlauf " + clearedLoop + " geschafft!", "heal");
  showAnnouncement("victory", "GLÜCKWUNSCH", "Durchlauf " + clearedLoop, 3.2);
  emitCombatEvent("world_change");
  $("btn-start-run").disabled = false;
  $("btn-pause").disabled = true;
  updateTotalGold();
  renderUpgradeButtons();
  updateRunButtons();
  tryMenuMusic();
}

function hideVictoryPanel() {
  $("victory-panel")?.classList.add("hidden");
}

/** Ganz von vorne: Gold, Upgrades, Meta & Fähigkeiten – sonst rennst du durch. */
function wipeProgressKeepIdentity() {
  game.totalGold = 0;
  game.runGold = 0;
  game.lastRunGold = 0;
  game.upgrades = emptyUpgrades();
  game.bestLoot = null;
  game.meta = defaultMeta();
  // Alle Klassen auf Start-Fähigkeit – kein Rest von alten Unlocks
  ["warrior", "ranger", "mage"].forEach((ck) => {
    const base = DEFAULT_UNLOCKED[ck] || [];
    game.meta.abilities[ck] = {
      unlocked: [...base],
      equipped: [base[0] || null, null]
    };
  });
  try { localStorage.setItem(META_STORAGE_KEY, JSON.stringify(game.meta)); } catch (_) {}
  syncUnlockedAbilities(game.classKey);
  saveMeta();
  if (game.playerName) saveLocalPlayer({ quiet: true });
}

/** Nächster Loop – Upgrades/Gold bleiben, Gegner härter. */
function continueLoopFromVictory() {
  hideVictoryPanel();
  clearActiveRun();
  game.loopCompleted = false;
  game.isDead = false;
  game.isPaused = false;
  game.loopIndex = (game.loopIndex | 0) + 1;
  stopLoop();
  resetRun();
  try { createHero(); } catch (err) {
    console.error(err);
    addLog("Durchlauf-Start fehlgeschlagen – Strg+F5.");
    return;
  }
  game.isRunning = true;
  $("gameover-panel")?.classList.add("hidden");
  $("game-frame")?.classList.remove("hidden");
  $("btn-start-run").disabled = true;
  $("btn-pause").disabled = false;
  $("btn-restart").disabled = false;
  $("btn-pause").textContent = "Pause (P)";
  if (typeof resetRunStatsForNewRun === "function") resetRunStatsForNewRun();
  updateTotalGold();
  renderUpgradeButtons();
  renderAbilityPanel();
  safeSpawnWave();
  game.combatReady = true;
  playWorldMusic(getWorld());
  addLog("Durchlauf " + ((game.loopIndex | 0) + 1) + " – Upgrades bleiben, Gegner härter!");
  updateClassHint();
  updateRunButtons();
  markRunSaveDirty();
  saveActiveRun(true);
  beginRunLoop();
  if (canvas) canvas.focus();
}

/** Neu starten nach Sieg: kompletter Fortschritts-Reset, dann Wald Lv.1. */
function restartFromVictory() {
  hideVictoryPanel();
  clearActiveRun();
  game.loopCompleted = false;
  game.isDead = false;
  game.isPaused = false;
  game.loopIndex = 0;
  stopLoop();

  wipeProgressKeepIdentity();

  resetRun();
  try {
    createHero();
  } catch (err) {
    console.error("createHero failed:", err);
    addLog("Start fehlgeschlagen – Seite neu laden (Strg+F5).");
    return;
  }
  game.isRunning = true;
  $("gameover-panel")?.classList.add("hidden");
  $("game-frame")?.classList.remove("hidden");
  $("btn-start-run").disabled = true;
  $("btn-pause").disabled = false;
  $("btn-restart").disabled = false;
  $("btn-pause").textContent = "Pause (P)";
  updateTotalGold();
  renderUpgradeButtons();
  renderAbilityPanel();
  renderSetupAbilityHint();
  safeSpawnWave();
  game.combatReady = true;
  playWorldMusic(getWorld());
  addLog("Ganz von vorne – Wald, Level 1. Gold, Upgrades und Fähigkeiten zurückgesetzt.");
  updateClassHint();
  updateRunButtons();
  markRunSaveDirty();
  saveActiveRun(true);
  beginRunLoop();
  if (canvas) canvas.focus();
}

// Schwierigkeit je Welt: Tiefe + feste World-Curve (KEIN Player-Scaling auf Gegner)
function getWorldDepth() {
  const world = getWorld();
  return Math.max(1, game.dungeonLevel - (world.min || 1) + 1);
}

function getWorldProgress01() {
  const world = getWorld();
  const len = world.length || 20;
  return Math.max(0, Math.min(1, (game.dungeonLevel - (world.min || 1)) / len));
}

function getUpgradeInvestment() {
  return Object.values(game.upgrades || {}).reduce((s, v) => s + (Number(v) || 0), 0);
}

/** @deprecated – Gegner skalieren nicht mehr mit Upgrades (Smooth Progression) */
function getMetaEase() {
  return 1;
}

function getFarmGoldMult() {
  const pityRuns = Math.max(0, game.emptyUpgradeRuns | 0);
  const eco = (typeof DL_BALANCE !== "undefined") ? DL_BALANCE.economy : null;
  if (!eco) return 1;
  if (pityRuns < (eco.pityGoldAfterEmptyRuns || 3)) return 1;
  const steps = pityRuns - eco.pityGoldAfterEmptyRuns + 1;
  return Math.min(eco.maxPityMult || 1.45, 1 + steps * ((eco.pityGoldMult || 1.15) - 1));
}

function getLoopMult() {
  if (typeof dlLoopEnemyMult === "function") return dlLoopEnemyMult(game.loopIndex || 0);
  return { hp: 1, atk: 1, gold: 1 };
}

function getBossMult(isBoss) {
  if (!isBoss) return { hp: 1, atk: 1, rew: 1 };
  const depth = getWorldDepth();
  const B = (typeof DL_BALANCE !== "undefined") ? DL_BALANCE.boss : null;
  const early = B ? B.hpMultEarly : 3.8;
  const mid = B ? B.hpMultMid : 4.2;
  const late = B ? B.hpMultLate : 4.6;
  const hp = depth <= 8 ? early : depth <= 16 ? mid : late;
  return { hp, atk: B ? B.atkMult : 1.65, rew: B ? B.rewardMult : 5 };
}

function getEnemyStats(isBoss, roleTag) {
  const world = getWorld();
  const depth = getWorldDepth();
  const danger = world.danger || 1;
  const progress = getWorldProgress01();
  const intensity = (typeof dlWorldIntensity === "function" && !isBoss)
    ? dlWorldIntensity(progress)
    : 1;
  const E = (typeof DL_BALANCE !== "undefined") ? DL_BALANCE.enemy : null;
  const role = (typeof DL_BALANCE !== "undefined" && roleTag && DL_BALANCE.roles[roleTag])
    ? DL_BALANCE.roles[roleTag]
    : { hp: 1, atk: 1, speed: 1 };
  const loop = getLoopMult();
  const boss = getBossMult(isBoss);
  const early = getEarlyEase();
  const earlyHp = 1 - (BALANCE.earlyHpEase || 0.1) * early;
  const earlyAtk = 1 - (BALANCE.earlyAtkEase || 0.14) * early;

  const baseHp = (E ? E.baseHp : 30) + depth * (E ? E.hpPerDepth : 3.4) + danger * (E ? E.hpPerDanger : 5.5);
  const baseAtk = (E ? E.baseAtk : 3.6) + depth * (E ? E.atkPerDepth : 0.42) + danger * (E ? E.atkPerDanger : 1.1);
  const powHp = E ? E.depthPowHp : 1.028;
  const powAtk = E ? E.depthPowAtk : 1.018;
  const cap = E ? E.depthPowCap : 22;
  const depthHp = Math.pow(powHp, Math.min(cap, depth * 0.85));
  const depthAtk = Math.pow(powAtk, Math.min(cap, depth * 0.85));
  const farm = getFarmGoldMult();
  const eliteExtra = (roleTag === "elite" && !isBoss && typeof DL_BALANCE !== "undefined")
    ? DL_BALANCE.elite : null;

  let hpMult = world.hpMult * intensity * (BALANCE.difficultyMult || 1) * boss.hp * earlyHp * loop.hp * (role.hp || 1);
  let atkMult = world.atkMult * intensity * (BALANCE.difficultyMult || 1) * boss.atk * earlyAtk * loop.atk * (role.atk || 1);
  if (eliteExtra) {
    hpMult *= eliteExtra.hpMult / (role.hp || 1);
    atkMult *= eliteExtra.atkMult / (role.atk || 1);
  }

  const goldBase = (E ? E.goldBase : 8) + depth * (E ? E.goldPerDepth : 2.2) + danger * (E ? E.goldPerDanger : 3.2);
  const rew = boss.rew * (eliteExtra ? eliteExtra.rewardMult : 1) * loop.gold * farm;

  return {
    hp: Math.floor(baseHp * depthHp * hpMult),
    attack: Math.max(1, Math.floor(baseAtk * depthAtk * atkMult)),
    gold: Math.floor(goldBase * rew * (1 + depth * (E ? E.goldDepthFactor : 0.035))),
    xp: Math.floor(((E ? E.xpBase : 11) + depth * (E ? E.xpPerDepth : 2.4) + danger * (E ? E.xpPerDanger : 3.5)) * boss.rew),
    speed: (isBoss ? 0.52 : 0.7) * world.speedMult * (role.speed || 1) + depth * 0.01,
    attackInterval: Math.max(0.66, 1.15 - depth * 0.007 - danger * 0.016),
    role: roleTag || (isBoss ? "boss" : "basic"),
    intensity
  };
}

function getWaveSize() {
  // Legacy fallback – Encounter Budget steuert die echte Größe
  const progress = getWorldProgress01();
  const d = getWorld().danger || 1;
  const size = 2 + Math.floor(progress * 3) + Math.max(0, d - 2);
  return Math.min(5, Math.max(2, size));
}

function getUpgradeTip() {
  const tips = {
    warrior: "Krieger: Leben → Rüstung → Angriff → Spezial-CD / Lebensraub",
    ranger:  "Waldläufer: Angriff → Krit → Krit-DMG → Boss-Schaden",
    mage:    "Magier: Magie → Mana → Boss-Schaden → Spezial-CD"
  };
  const goals = (typeof getShortMidLongGoals === "function") ? getShortMidLongGoals() : null;
  const base = tips[game.classKey] || "";
  if (!goals) return base;
  return base + " · Kurz: " + goals.short;
}

// ============================================
// GEGNER & WELLEN
// ============================================

function startWaveIntro() {
  game.waveIntro = true;
  game.combatReady = true;
}

function updateWaveIntro() {
  let pending = false;
  game.enemies.forEach((e) => {
    if (e.dead || e.hp <= 0 || !e.walkingIn) return;
    if (e.x > CW - 28) pending = true;
    else e.walkingIn = false;
  });
  if (!pending) game.waveIntro = false;
}

function spawnWave() {
  const isBoss = shouldSpawnWorldBoss();
  game.waveWasBoss = isBoss;
  const world = getWorld();
  const progress = getWorldProgress01();
  const breath = (game.breathWavesLeft | 0) > 0;
  if (breath) game.breathWavesLeft = Math.max(0, (game.breathWavesLeft | 0) - 1);

  let budget = (typeof dlEncounterBudget === "function")
    ? dlEncounterBudget(world, progress, isBoss, game.loopIndex || 0, breath)
    : getWaveSize();

  let roles = [];
  if (isBoss) {
    roles = [{ tag: "boss", cost: 8 }];
    // Filler bis Budget
    const plan = (typeof planEncounterRoles === "function")
      ? planEncounterRoles(Math.max(2, budget - 8), world.theme, world.danger, false)
      : { picks: [{ tag: "basic", cost: 1 }] };
    roles = roles.concat(plan.picks || []);
  } else {
    const allowElite = progress >= 0.55 || (world.danger || 1) >= 3;
    const plan = (typeof planEncounterRoles === "function")
      ? planEncounterRoles(budget, world.theme, world.danger, allowElite)
      : { picks: Array.from({ length: getWaveSize() }, () => ({ tag: "basic", cost: 1 })) };
    roles = plan.picks || [{ tag: "basic", cost: 1 }];
    game.lastEncounterIntensity = (plan.spent || budget) / Math.max(1, world.budgetMid || 5);
    if (game.lastEncounterIntensity >= ((typeof DL_BALANCE !== "undefined" && DL_BALANCE.rhythm.hardThreshold) || 1.18)) {
      game.breathWavesLeft = (typeof DL_BALANCE !== "undefined" ? DL_BALANCE.rhythm.breathWaves : 1);
    }
  }

  const count = Math.max(1, roles.length);
  onWaveSpawn(isBoss, count);
  startWaveIntro();
  let bossEnemy = null;
  let eliteCount = 0;
  roles.forEach((r, i) => {
    const isBossSpawn = isBoss && i === 0;
    const e = spawnEnemy(isBossSpawn, i, isBossSpawn ? "boss" : r.tag);
    if (e && e.isBoss) bossEnemy = e;
    if (e && e.isElite) eliteCount++;
  });
  if (eliteCount && game.runStats) game.runStats.elitesSeen = (game.runStats.elitesSeen || 0) + eliteCount;
  if (bossEnemy) startBossIntro(bossEnemy);
  if (isBoss) addLog("⚠ WELT-BOSS: " + (bossEnemy?.name || "Unbekannt") + "! Besiege die Welle für die nächste Welt.", "boss");
  else if (eliteCount) addLog("Eliten-Kampf! " + count + " Gegner", "damage");
  else if (breath) addLog("Atemholen – schwächere Welle (" + count + ")");
  else if (world.danger >= 3) addLog("Gefahr " + world.danger + "/5 – " + count + " Gegner!", "damage");
  else addLog(count + " Gegner (Lv." + game.dungeonLevel + ")");
}

function spawnEnemy(isBoss, index, roleTag) {
  const world = getWorld();
  const pool = WORLD_MONSTERS[world.theme] || WORLD_MONSTERS.forest;
  const list = isBoss ? pool.boss : pool.normal;
  const pick = list[Math.floor(Math.random() * list.length)];
  const name = pick.name;
  const spKey = pick.sprite;
  const packSize = (typeof VisualEnemies !== "undefined")
    ? VisualEnemies.getSize(spKey, isBoss)
    : null;
  const sp = SPRITES[spKey];
  if (!packSize && !sp) {
    console.error("Sprite fehlt für:", name, spKey);
    return null;
  }
  const role = roleTag || (isBoss ? "boss" : "basic");
  const stats = getEnemyStats(isBoss, role);
  const aiBase = getEnemyAI(name, isBoss) || {};
  const ai = {
    style: aiBase.style || "chase",
    speedMult: aiBase.speedMult || 1,
    atkMult: aiBase.atkMult || 1,
    intervalMult: aiBase.intervalMult || 1,
    range: aiBase.range || 0
  };
  // Ranged role forces ranged AI when possible
  if (role === "ranged" && !isBoss) {
    ai.style = "ranged";
    ai.range = ai.range || 180;
  }
  if (role === "fast" && !isBoss) {
    ai.speedMult = (ai.speedMult || 1) * 1.2;
  }
  const idx = index || 0;
  let ew = packSize ? packSize.w : spriteCharW(sp);
  let eh = packSize ? packSize.h : spriteCharH(sp);
  const isElite = role === "elite" && !isBoss;
  if (isElite) {
    const sc = (typeof DL_BALANCE !== "undefined" ? DL_BALANCE.elite.sizeScale : 1.18);
    ew = Math.floor(ew * sc);
    eh = Math.floor(eh * sc);
  }

  const enemy = {
    id: ++enemyId, name: isElite ? ("Elite " + name) : name, sprite: spKey, isBoss, isElite, index: idx,
    role,
    x: CW + COMBAT_LAYOUT.introOffscreen + idx * 62 + Math.random() * 18,
    walkingIn: true,
    y: GROUND - eh,
    w: ew, h: eh,
    maxHp: stats.hp, hp: stats.hp,
    attack: Math.floor(stats.attack * (ai.atkMult || 1)),
    goldReward: stats.gold, xpReward: stats.xp,
    speed: stats.speed * (ai.speedMult || 1),
    attackInterval: stats.attackInterval * (ai.intervalMult || 1),
    aiStyle: ai.style,
    aiSpeedMult: ai.speedMult || 1,
    isRanged: ai.style === "ranged",
    rangedRange: ai.range || 0,
    jumpTimer: 0,
    bossSpecialTimer: isBoss ? 3 : 0,
    hitFlash: 0, anim: Math.random() * 6, dead: false,
    attackTimer: 0, attackAnim: 0, attackWindup: 0
  };
  game.enemies.push(enemy);
  pinCharToGround(enemy);
  if (game.currentWave) game.currentWave.enemies.push({ name: enemy.name, isBoss, isElite });
  return enemy;
}

function initWorldBackground() {
  invalidateParallaxCache();
  initParallaxBackground(getWorld());
  if (typeof VisualFX !== "undefined") VisualFX.init(getWorld());
}

function renderUnifiedBackground(world) {
  renderParallaxBackground(ctx, world, game.scrollX);
}

// renderWorldAtmosphere entfernt – kein Extra-Nebel über dem Weg

// ============================================
// KAMPF – KLASSEN-SPEZIFISCH
// ============================================

function attack() {
  if (!game.isRunning || game.isPaused || game.isDead || !game.hero) return;
  const cls = CLASSES[game.classKey];
  const now = performance.now();
  const stRate = game.hero ? heroStats() : null;
  const rate = cls.attackRate / Math.max(0.55, (stRate && stRate.atkSpeedMult) || 1);
  if (now - game.lastShot < rate) return;

  const target = getHoveredEnemy(cls.range);
  if (!target) return;

  if (cls.attackType === "melee") {
    if (warriorMeleeAttack(target)) game.lastShot = now;
  } else if (cls.attackType === "ranged") {
    if (rangerShoot(cls, target)) game.lastShot = now;
  } else if (cls.attackType === "magic") {
    if (mageShoot(cls, target)) game.lastShot = now;
  }
}

function warriorMeleeAttack(target) {
  const h = game.hero, st = heroStats();
  const cls = CLASSES.warrior;
  const { hx, hy } = getHeroCenter();
  const tx = target.x + target.w / 2, ty = target.y + target.h / 2;
  const angle = Math.atan2(ty - hy, tx - hx);
  h.facing = tx >= hx ? 1 : -1;
  // Schwertschwung-Asset (attack.png) sichtbar halten
  h.attackAnim = 0.4;

  let hitAny = false;
  forEachEnemyInRange(cls.range, (e, ex, ey) => {
    let raw = st.attack;
    if (e.id !== target.id) raw = raw * (cls.aoeFalloff || 1);
    dealPlayerDamage(e, raw, { stats: st, critRoll: st.crit });
    spawnImpactRing(ex, ey, 16, "#ecf0f1", 10);
    emitCombatEvent("enemy_hit");
    hitAny = true;
  });

  spawnMeleeSlash(hx, hy, angle, { life: 14, range: cls.range, owner: "player" });
  const backAngle = angle + Math.PI;
  if (hitAny) spawnMeleeSlash(hx, hy, backAngle, { life: 10, range: cls.range * 0.85, owner: "player" });
  spawnBurst(hx + Math.cos(angle) * 30, hy + Math.sin(angle) * 30, "#bdc3c7", 4, 2.5);
  emitCombatEvent("player_melee");
  if (hitAny) emitCombatEvent("player_melee_hit");
  if (hitAny) addLog("Schwerttreffer!", "crit");
  return hitAny;
}

function rangerShoot(cls, target) {
  const h = game.hero, st = heroStats();
  const hx = h.x + h.w / 2, hy = h.y + h.h / 2;
  if (!target || !isEnemyTargetable(target, cls.range)) return false;

  let dx = target.x + target.w / 2 - hx;
  let dy = target.y + target.h / 2 - hy;
  let dist = Math.hypot(dx, dy);
  if (dist > cls.range) return false;

  let dmgMult = 1;
  const tooClose = game.enemies.some((e) => isEnemyTargetable(e, cls.closeRange) &&
    Math.hypot(e.x + e.w / 2 - hx, e.y + e.h / 2 - hy) < cls.closeRange);
  if (tooClose) { dmgMult = cls.meleePenalty; }

  const len = dist || 1;
  let dmg = st.attack * dmgMult;
  const isCrit = Math.random() < st.crit + (tooClose ? 0 : 0.05);

  game.projectiles.push({
    x: hx, y: hy, vx: (dx / len) * cls.projSpeed, vy: (dy / len) * cls.projSpeed,
    dmg: Math.floor(dmg), crit: isCrit, sprite: cls.proj,
    life: 70, owner: "player", pierce: false, trail: "#2ecc71", usePipeline: true
  });
  h.facing = dx >= 0 ? 1 : -1;
  // Bogenspann-Asset (attack.png) sichtbar halten – vorher zu kurz (~15ms).
  h.attackAnim = 0.42;
  spawnBurst(hx + (dx / len) * 8, hy + (dy / len) * 8, "#27ae60", 3, 2);
  emitCombatEvent("player_arrow");
  return true;
}

function mageShoot(cls, target) {
  const h = game.hero, st = heroStats();
  const hx = h.x + h.w / 2, hy = h.y + h.h / 2;
  if (!target || !isEnemyTargetable(target, cls.range)) return false;

  let dx = target.x + target.w / 2 - hx;
  let dy = target.y + target.h / 2 - hy;
  let dist = Math.hypot(dx, dy);
  if (dist > cls.range) return false;

  h.facing = dx >= 0 ? 1 : -1;

  if (h.mana < cls.manaPerShot) {
    let dmg = Math.floor(st.attack * 0.4);
    const angle = getPrimaryMeleeAngle(Math.atan2(dy, dx));
    let hitAny = false;
    forEachEnemyInRange(55, (e, ex, ey) => {
      dealPlayerDamage(e, dmg, { stats: st, critRoll: st.crit, magic: true });
      spawnImpactRing(ex, ey, 14, "#9b59b6", 8);
      emitCombatEvent("enemy_hit");
      hitAny = true;
    });
    spawnMeleeSlash(hx, hy, angle, { life: 10, range: 55, owner: "player" });
    spawnMeleeSlash(hx, hy, angle + Math.PI, { life: 8, range: 48, owner: "player" });
    spawnBurst(hx, hy, "#8e44ad", 4, 2);
    h.attackAnim = 0.32;
    emitCombatEvent("player_staff");
    if (hitAny) addLog("Kein Mana – Stab-Schlag!");
    return hitAny;
  }

  h.mana -= cls.manaPerShot;
  let dmg = st.magicDamage;
  const isCrit = Math.random() < st.crit;
  const len = dist || 1;

  game.projectiles.push({
    x: hx, y: hy, vx: (dx / len) * cls.projSpeed, vy: (dy / len) * cls.projSpeed,
    dmg: Math.floor(dmg), crit: isCrit, sprite: cls.proj,
    life: 65, owner: "player", magic: true, trail: "#e74c3c", usePipeline: true
  });
  // Stab-/Zauberpose (attack.png) sichtbar halten – vorher ~25ms unsichtbar
  h.attackAnim = 0.38;
  spawnBurst(hx, hy, "#9b59b6", 5, 2.5);
  emitCombatEvent("player_magic");
  return true;
}

function getEnemyAI(name, isBoss) {
  if (isBoss) return ENEMY_AI._boss;
  return ENEMY_AI[name] || ENEMY_AI._default;
}

function startBossIntro(bossEnemy) {
  game.bossIntro = {
    name: bossEnemy.name,
    hp: bossEnemy.hp,
    maxHp: bossEnemy.maxHp,
    timer: 3.2
  };
  game.screenShake = Math.max(game.screenShake, 6);
  game.zoomPulse = 0.08;
  playSound("boss_spawn");
}

function updateBossIntro(dt) {
  if (!game.bossIntro) return;
  game.bossIntro.timer -= dt;
  if (game.bossIntro.timer <= 0) game.bossIntro = null;
}

function showAnnouncement(kind, title, subtitle, duration) {
  game.announcement = {
    kind,
    title,
    subtitle: subtitle || "",
    timer: duration || 2.4,
    duration: duration || 2.4
  };
}

function updateAnnouncement(dt) {
  if (!game.announcement) return;
  game.announcement.timer -= dt;
  if (game.announcement.timer <= 0) game.announcement = null;
}

function getPrimaryTarget(range) {
  const hovered = getHoveredEnemy(range);
  if (hovered) return hovered;
  let best = null, bestDist = Infinity;
  const hx = game.hero.x + game.hero.w / 2, hy = game.hero.y + game.hero.h / 2;
  game.enemies.forEach((e) => {
    if (!isEnemyTargetable(e, range)) return;
    const d = Math.hypot(e.x + e.w / 2 - hx, e.y + e.h / 2 - hy);
    if (d < bestDist) { bestDist = d; best = e; }
  });
  return best;
}

function dealAbilityDamage(e, rawDmg, opts) {
  const o = opts || {};
  const st = game.hero ? heroStats() : {};
  const dmg = dealPlayerDamage(e, rawDmg, {
    stats: st, critRoll: o.critRoll, crit: o.crit, magic: o.magic, big: o.big, color: o.color
  });
  spawnImpactRing(e.x + e.w / 2, e.y + e.h / 2, o.ring || 18, o.color || "#ecf0f1", 10);
  emitCombatEvent("enemy_hit");
  if (o.crit || (o.critRoll && dmg > rawDmg)) {
    game.critFlash = 0.12;
    game.screenShake = Math.max(game.screenShake, 4);
  }
  return dmg;
}

function damageEnemiesInRadius(cx, cy, radius, rawDmg, opts) {
  game.enemies.forEach((e) => {
    if (!isEnemyOnScreen(e) || e.walkingIn || e.dead || e.hp <= 0) return;
    if (Math.hypot(e.x + e.w / 2 - cx, e.y + e.h / 2 - cy) <= radius) {
      dealAbilityDamage(e, rawDmg, opts);
    }
  });
}

/** Fähigkeit ausführen – Schaden, Cooldown, Animation & Partikel */
function castAbility(ab, h, st) {
  const hx = h.x + h.w / 2, hy = h.y + h.h / 2;
  const cls = CLASSES[game.classKey];
  const range = ab.range || cls.range;
  const target = getPrimaryTarget(range);
  if (!target && ab.type !== "melee_aoe" && ab.type !== "buff_shout") return false;
  if (ab.manaCost && h.mana < ab.manaCost) return false;
  if (ab.manaCost) h.mana -= ab.manaCost;

  h.attackAnim = 0.36;
  game.abilityCastLock = 0.4;
  addLog(ab.name + "!", "magic");
  emitCombatEvent(getClassSpecialSound(game.classKey));
  spawnBurst(hx, hy, ab.particle || ab.color, 10, 4);
  game.screenShake = Math.max(game.screenShake, ab.type === "aoe_ground" ? 5 : 3);
  if (typeof PackFX !== "undefined" && (game.classKey === "mage" || ab.type === "aoe_ground" || ab.magic)) {
    PackFX.spawnMagicCircle(hx, hy + 10, { life: 18 });
  }

  const atkBase = game.classKey === "mage" ? st.magicDamage : st.attack;
  const buffMult = h.warriorBuff > 0 ? h.warriorBuffMult : 1;

  switch (ab.type) {
    case "melee_aoe": {
      const angle = target ? Math.atan2(target.y + target.h / 2 - hy, target.x + target.w / 2 - hx) : 0;
      h.facing = Math.cos(angle) >= 0 ? 1 : -1;
      if (ab.shieldReduction) {
        h.shieldTimer = ab.shieldDuration || 3;
        h.shieldReduction = ab.shieldReduction;
      }
      spawnMeleeSlash(hx, hy, angle, { life: 20, range, owner: "player", big: true });
      spawnMeleeSlash(hx, hy, angle + Math.PI, { life: 16, range: range * 0.9, owner: "player", big: true });
      forEachEnemyInRange(range, (e, ex) => {
        dealAbilityDamage(e, atkBase * ab.dmgMult * buffMult, {
          critRoll: st.crit + (ab.critBonus || 0), magic: game.classKey === "mage",
          color: ab.color, big: true
        });
        applyEnemyDebuff(e, ab);
      });
      break;
    }
    case "melee_spin": {
      const hits = ab.hits || 3;
      let enemyCount = 0;
      forEachEnemyInRange(range, () => { enemyCount++; });
      const crowdMult = 1 + Math.min(0.65, Math.max(0, enemyCount - 1) * 0.16);
      for (let i = 0; i < hits; i++) {
        const ang = (Math.PI * 2 / hits) * i;
        spawnMeleeSlash(hx, hy, ang, { life: 12, range: range * 0.85, owner: "player" });
      }
      forEachEnemyInRange(range, (e) => {
        dealAbilityDamage(e, atkBase * ab.dmgMult * buffMult * crowdMult, {
          critRoll: st.crit, color: ab.color
        });
      });
      break;
    }
    case "melee_single": {
      if (!target) return false;
      const tx = target.x + target.w / 2;
      h.facing = tx >= hx ? 1 : -1;
      const ang = Math.atan2(target.y + target.h / 2 - hy, tx - hx);
      spawnMeleeSlash(hx, hy, ang, { life: 18, range, owner: "player", big: true });
      dealAbilityDamage(target, atkBase * ab.dmgMult * buffMult, {
        critRoll: st.crit + (ab.critBonus || 0), color: ab.color, big: true
      });
      break;
    }
    case "aoe_ground": {
      const tx = target ? target.x + target.w / 2 : hx + h.facing * 80;
      const ty = target ? target.y + target.h / 2 : hy;
      spawnExplosion(tx, ty, ab.radius || 100, false);
      game.attackEffects.push({
        type: "explosion", x: tx, y: ty, radius: ab.radius || 100,
        life: 22, maxLife: 22, color: ab.color
      });
      damageEnemiesInRadius(tx, ty, ab.radius || 100, atkBase * ab.dmgMult, {
        magic: game.classKey === "mage", color: ab.color, big: true
      });
      break;
    }
    case "buff_shout": {
      h.warriorBuff = ab.buffDuration || 5;
      h.warriorBuffMult = ab.buffMult || 1.35;
      forEachEnemyInRange(range, (e) => {
        dealAbilityDamage(e, atkBase * ab.dmgMult, { color: ab.color });
        applyEnemyDebuff(e, ab);
      });
      spawnBurst(hx, hy, "#f1c40f", 14, 5);
      addLog("Kriegsschrei – Angriff verstärkt!", "heal");
      break;
    }
    case "projectile_burst":
    case "projectile_rain": {
      const aim = target || { x: hx + 100, y: hy, w: 0, h: 0 };
      const baseAngle = Math.atan2(aim.y + aim.h / 2 - hy, aim.x + aim.w / 2 - hx);
      const count = ab.count || 7;
      const spread = ab.spread || 0.12;
      for (let i = 0; i < count; i++) {
        const ang = ab.type === "projectile_rain"
          ? baseAngle + (Math.random() - 0.5) * 1.2
          : baseAngle + (i - (count - 1) / 2) * spread;
        game.projectiles.push({
          x: hx, y: hy - Math.random() * 20,
          vx: Math.cos(ang) * (cls.projSpeed || 14),
          vy: Math.sin(ang) * (cls.projSpeed || 14),
          dmg: Math.floor(atkBase * ab.dmgMult),
          crit: Math.random() < st.crit + (ab.critBonus || 0.1),
          sprite: cls.proj || "projectile_arrow",
          life: 80, owner: "player", pierce: ab.type === "projectile_rain",
          trail: ab.particle, magic: game.classKey === "mage"
        });
      }
      break;
    }
    case "projectile_poison": {
      if (!target) return false;
      const dx = target.x + target.w / 2 - hx, dy = target.y + target.h / 2 - hy;
      const len = Math.hypot(dx, dy) || 1;
      game.projectiles.push({
        x: hx, y: hy, vx: (dx / len) * 15, vy: (dy / len) * 15,
        dmg: Math.floor(atkBase * ab.dmgMult), crit: false,
        sprite: "projectile_arrow", life: 70, owner: "player",
        trail: ab.particle, poison: ab.dotTicks || 4, poisonMult: ab.dotMult || 0.35
      });
      break;
    }
    case "projectile_explosive": {
      if (!target) return false;
      const dx = target.x + target.w / 2 - hx, dy = target.y + target.h / 2 - hy;
      const len = Math.hypot(dx, dy) || 1;
      const spd = game.classKey === "mage" ? 7 : 14;
      game.projectiles.push({
        x: hx, y: hy, vx: (dx / len) * spd, vy: (dy / len) * spd,
        dmg: Math.floor(atkBase * ab.dmgMult), crit: false,
        sprite: game.classKey === "mage" ? "projectile_fire" : "projectile_arrow",
        life: 60, owner: "player", explosive: true, big: true,
        explosiveRadius: ab.radius || 90,
        trail: ab.particle, magic: game.classKey === "mage", fromAbility: true
      });
      break;
    }
    case "projectile_pierce": {
      if (!target) return false;
      const dx = target.x + target.w / 2 - hx, dy = target.y + target.h / 2 - hy;
      const len = Math.hypot(dx, dy) || 1;
      game.projectiles.push({
        x: hx, y: hy, vx: (dx / len) * 12, vy: (dy / len) * 12,
        dmg: Math.floor(atkBase * ab.dmgMult), crit: false,
        sprite: "projectile_fire", life: 75, owner: "player",
        pierce: true, pierceLeft: ab.pierceCount || 4,
        trail: ab.particle, magic: true
      });
      break;
    }
    case "projectile_snipe": {
      if (!target) return false;
      const dx = target.x + target.w / 2 - hx, dy = target.y + target.h / 2 - hy;
      const len = Math.hypot(dx, dy) || 1;
      game.projectiles.push({
        x: hx, y: hy, vx: (dx / len) * 20, vy: (dy / len) * 20,
        dmg: Math.floor(atkBase * ab.dmgMult),
        crit: Math.random() < st.crit + (ab.critBonus || 0),
        sprite: "projectile_arrow", life: 55, owner: "player",
        trail: ab.particle, big: true
      });
      break;
    }
    case "magic_strike": {
      if (!target) return false;
      const tx = target.x + target.w / 2, ty = target.y + target.h / 2;
      for (let i = 0; i < 6; i++) {
        pushParticle({
          x: tx + (Math.random() - 0.5) * 20, y: ty - 30 - i * 8,
          vx: 0, vy: 8, life: 12, color: ab.particle, size: 3
        });
      }
      dealAbilityDamage(target, atkBase * ab.dmgMult, { magic: true, color: ab.color, big: true });
      const chains = ab.chainHits || 0;
      if (chains > 0) {
        const hit = new Set([target]);
        let current = target;
        for (let c = 0; c < chains; c++) {
          const cx = current.x + current.w / 2, cy = current.y + current.h / 2;
          let next = null, bestD = Infinity;
          for (const e of game.enemies) {
            if (e.dead || e.hp <= 0 || hit.has(e) || !isEnemyOnScreen(e)) continue;
            const d = Math.hypot(e.x + e.w / 2 - cx, e.y + e.h / 2 - cy);
            if (d < 130 && d < bestD) { bestD = d; next = e; }
          }
          if (!next) break;
          hit.add(next);
          dealAbilityDamage(next, atkBase * ab.dmgMult * 0.75, { magic: true, color: ab.color });
          spawnBurst(next.x + next.w / 2, next.y, ab.particle, 8, 4);
          current = next;
        }
      }
      spawnBurst(tx, ty, ab.particle, 12, 5);
      break;
    }
    default:
      return false;
  }
  return true;
}

/** Cooldowns & Buffs – kein Auto-Cast; W und S haben je eigenen Timer */
function updateAbilityState(dt, h) {
  if (game.abilityCastLock > 0) game.abilityCastLock -= dt;
  if (h.warriorBuff > 0) h.warriorBuff -= dt;
  ensureAbilitySlotCds(h);
  [0, 1].forEach((slotIdx) => {
    h.abilitySlotCds[slotIdx] = getAbilitySlotCd(h, slotIdx) + dt;
  });

  h.abilityReadyState = h.abilityReadyState || {};
  [0, 1].forEach((slotIdx) => {
    const ab = getEquippedAbilityAtSlot(slotIdx);
    if (!ab) return;
    h.abilityReadyState[ab.id + ":slot" + slotIdx] = getAbilitySlotCd(h, slotIdx) >= getEffectiveAbilityCd(ab);
  });
}

function useEquippedAbility(slotIdx) {
  const h = game.hero;
  if (!h || game.isPaused || !game.isRunning || game.isDead || game.abilityCastLock > 0) return;
  const ab = getEquippedAbilityAtSlot(slotIdx);
  if (!ab) return;
  const st = heroStats();
  const cd = getEffectiveAbilityCd(ab);
  if (getAbilitySlotCd(h, slotIdx) < cd) return;
  if (!canCastAbility(ab, h, st)) return;
  if (castAbility(ab, h, st)) {
    setAbilitySlotCd(h, slotIdx, 0);
    h.abilityReadyState = h.abilityReadyState || {};
    h.abilityReadyState[ab.id + ":slot" + slotIdx] = false;
  }
}

function useSpecial() { useEquippedAbility(0); }

// ============================================
// GAME LOOP
// ============================================

function startLoop() {
  stopLoop();
  let last = performance.now();
  function frame(now) {
    game.loopId = requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (!game.isPaused && game.isRunning && !game.isDead) update(dt);
    render();
  }
  game.loopId = requestAnimationFrame(frame);
}

function stopLoop() {
  if (game.loopId) { cancelAnimationFrame(game.loopId); game.loopId = null; }
}

function update(dt) {
  try {
    updateFrame(dt);
  } catch (err) {
    console.error("update error:", err);
  }
}

function updateFrame(dt) {
  const h = game.hero;
  if (!h) return;
  const st = heroStats();
  updateSaveIndicator(dt);
  if (game.meta) game.meta.playTimeMs = (game.meta.playTimeMs || 0) + dt * 1000;
  game.scrollX += dt * 40;
  h.specialTimer += dt;
  h.anim += dt * 8;
  if (h.hitFlash > 0) h.hitFlash -= dt * 30;
  // Attack-Pose sichtbar halten: Ranger spann, Krieger/Magier schwingen/wirken
  if (h.attackAnim > 0) {
    const decay = game.classKey === "ranger" ? 1.55
      : game.classKey === "mage" ? 2.1
      : 2.35;
    h.attackAnim -= dt * decay;
  }
  if (h.hurtAnim > 0) h.hurtAnim -= dt * 3;
  if (h.shieldTimer > 0) h.shieldTimer -= dt;
  if (!audioPrefs.screenShake) game.screenShake = 0;
  else if (game.screenShake > 0) game.screenShake = Math.max(0, game.screenShake - dt * 28);
  if (game.critFlash > 0) game.critFlash = Math.max(0, game.critFlash - dt * 2.5);
  if (game.zoomPulse > 0) game.zoomPulse = Math.max(0, game.zoomPulse - dt * 0.06);
  updateBossIntro(dt);
  updateAnnouncement(dt);

  const moveLeft = keys.a || keys.arrowleft;
  const moveRight = keys.d || keys.arrowright;
  const heroMoving = !!(game.isRunning && !game.isPaused && !game.isDead && (moveLeft || moveRight));
  if (game.isRunning && !game.isPaused && !game.isDead) {
    const stMove = heroStats();
    const spd = CLASSES[game.classKey].moveSpeed * (stMove.moveSpeedMult || 1);
    h.vx = 0;
    if (moveLeft) { h.x -= spd * dt; h.facing = -1; h.vx = -spd; }
    if (moveRight) { h.x += spd * dt; h.facing = 1; h.vx = spd; }
    h.x = Math.max(getHeroMinX(h), Math.min(getHeroMaxX(h), h.x));
  } else {
    h.vx = 0;
  }
  h.y = GROUND - h.h;
  pinCharToGround(h);
  updateVisualCamera(dt);
  if (typeof HR !== "undefined") HR.updateAnim(h, dt, heroMoving);

  // Mana regen (nur Magier)
  if (game.classKey === "mage") h.mana = Math.min(st.maxMana, h.mana + dt * 7);

  if (game.waveIntro) updateWaveIntro();

  // Angriff nur wenn Maus auf Gegner in Reichweite
  if (game.isRunning && !game.isPaused && !game.isDead && countAliveEnemies() > 0) attack();

  /** Spezialfähigkeiten: Cooldowns (nur manuell über Taste W/S) */
  if (game.isRunning && !game.isPaused && !game.isDead) updateAbilityState(dt, h);

  // Ambient-Partikel (Parallax-Welt)
  updateWorldAmbient(dt, getWorld());
  updateWorldTransition(dt);
  if (typeof VisualFX !== "undefined") VisualFX.update(dt, getWorld());

  // Schwert-Slashes & Effekte altern
  game.meleeSlashes = game.meleeSlashes.filter((s) => { s.life--; return s.life > 0; });
  game.attackEffects = game.attackEffects.filter((fx) => { fx.life--; return fx.life > 0; });

  // Gegner – jagen den Helden und greifen in Nahreichweite an
  game.enemies.forEach((e) => {
    if (e.dead || e.hp <= 0) return;
    pinCharToGround(e);
    updateEnemyMovement(e, h, dt);
    e.anim += dt * (e.isChasing ? 10 : 6);
    if (e.hitFlash > 0) e.hitFlash -= dt * 30;
    if (e.attackAnim > 0) e.attackAnim -= dt * 4;
    if (e.attackWindup > 0) e.attackWindup -= dt * 5;
    if (e.slowTimer > 0) e.slowTimer -= dt;
    if (e.weakTimer > 0) e.weakTimer -= dt;
    if ((e.poisonTicks || 0) > 0 && e.hp > 0 && !e.dead) {
      e.poisonTimer = (e.poisonTimer || 0.4) - dt;
      if (e.poisonTimer <= 0) {
        e.poisonTimer = 0.4;
        e.poisonTicks -= 1;
        const dot = Math.max(1, e.poisonDmg || 1);
        e.hp -= dot;
        spawnDamage(e.x + e.w / 2, e.y, dot, { magic: true });
        if (e.hp <= 0 && !e.dead) { e.dead = true; onEnemyKill(e); }
      }
    }

    if (e.walkingIn && e.x > CW - 28) {
      e.attackWindup = 0;
      return;
    }

    if (!enemyInCombatRange(e, h)) {
      e.attackWindup = 0;
      /** Fernkampf-Gegner: Schuss aus der Distanz */
      if (e.isRanged && e.rangedRange > 0) {
        const dist = Math.hypot((e.x + e.w / 2) - (h.x + h.w / 2), (e.y + e.h / 2) - (h.y + h.h / 2));
        if (dist < e.rangedRange && dist > getEnemyReach(e)) {
          e.attackTimer = (e.attackTimer || 0) + dt;
          if (e.attackTimer >= (e.attackInterval || 1.2)) {
            e.attackTimer = 0;
            enemyRangedAttack(e, h, st);
          }
        }
      }
      return;
    }

    /** Boss-Spezialangriff in Intervallen */
    if (e.isBoss) {
      e.bossSpecialTimer = (e.bossSpecialTimer || 0) + dt;
      if (e.bossSpecialTimer >= 5.5) {
        e.bossSpecialTimer = 0;
        bossSpecialAttack(e, h, st);
        return;
      }
    }

    if ((e.attackTimer || 0) <= 0) e.attackTimer = 0.04;

    e.attackTimer += dt;
    const interval = e.attackInterval || 0.75;
    const windup = 0.22;
    if (e.attackTimer >= interval - windup) {
      e.attackWindup = Math.min(1, (e.attackTimer - (interval - windup)) / windup);
    }
    if (e.attackTimer >= interval) {
      e.attackTimer = 0;
      e.attackWindup = 0;
      enemyAttackPlayer(e, h, st);
    }
  });

  // Entkommene Gegner entfernen (Fallback)
  game.enemies.forEach((e) => {
    if (!e.dead && e.hp > 0 && e.x < h.x - 40) {
      e.dead = true;
      addLog(e.name + " ist entkommen!");
    }
  });

  // Projektile
  game.projectiles = game.projectiles.filter((p) => {
    p.x += p.vx; p.y += p.vy; p.life--;
    if (p.trail && p.life % 3 === 0) {
      pushParticle({ x: p.x, y: p.y, vx: 0, vy: 0, life: 8, color: p.trail, size: 2 });
    }
    if (p.life <= 0) return false;
    if (p.owner === "enemy") {
      const h = game.hero;
      if (h && p.x > h.x && p.x < h.x + h.w && p.y > h.y && p.y < h.y + h.h) {
        const st = heroStats();
        let dmg = applyShieldToDamage(h, calcPlayerDamage(p.dmg, st.defense));
        h.hp -= dmg;
        if (typeof notePlayerDamageTaken === "function") notePlayerDamageTaken(dmg);
        h.hitFlash = 8;
        h.hurtAnim = 0.2;
        spawnDamage(h.x + h.w / 2, h.y, dmg, { taken: true, magic: true });
        emitCombatEvent("player_hurt");
        if (h.hp <= 0) { h.hp = 0; onDeath(); }
        return false;
      }
    }
    if (p.owner === "player") {
      for (const e of game.enemies) {
        if (!isEnemyOnScreen(e) || e.walkingIn || e.hp <= 0) continue;
        const vb = getEnemyVisualBounds(e);
        if (p.x > vb.x && p.x < vb.x + vb.w && p.y > vb.y && p.y < vb.y + vb.h) {
          const st = heroStats();
          const dealt = dealPlayerDamage(e, p.dmg, { stats: st, crit: p.crit, magic: p.magic, big: p.big });
          p._lastDealt = dealt;
          spawnImpactRing(vb.cx, vb.y + vb.h / 2, p.big ? 24 : 14, p.crit ? "#f1c40f" : (p.magic ? "#5dade2" : "#ecf0f1"), 10);
          emitCombatEvent("enemy_hit");
          /** Giftpfeil: DoT am Gegner (pausierbar, kein setTimeout) */
          if (p.poison && e.hp > 0) {
            e.poisonTicks = Math.max(e.poisonTicks || 0, p.poison);
            e.poisonDmg = Math.max(e.poisonDmg || 0, Math.floor(p.dmg * (p.poisonMult || 0.25)));
            e.poisonTimer = e.poisonTimer || 0.4;
          }
          if (p.explosive) {
            const rad = p.explosiveRadius || 90;
            spawnExplosion(p.x, p.y, rad, !p.fromAbility);
            game.enemies.forEach((o) => {
              if (!isEnemyOnScreen(o) || o.walkingIn || o.dead || o.hp <= 0) return;
              if (Math.hypot(o.x + o.w/2 - p.x, o.y + o.h/2 - p.y) < rad) {
                dealPlayerDamage(o, p.dmg * 0.48, { stats: heroStats(), magic: p.magic });
              }
            });
          }
          if (!p.pierce) return false;
          p.pierceLeft = (p.pierceLeft ?? 99) - 1;
          if (p.pierceLeft <= 0) return false;
        }
      }
    }
    return p.x > -20 && p.x < CW+20 && p.y > -20 && p.y < CH+20;
  });

  // Partikel
  game.particles = game.particles.filter((p) => { p.x+=p.vx; p.y+=p.vy; p.life--; return p.life>0; });

  // Münzen – Auto-Einsammeln oder Maus/Touch-Bonus
  updateCoinDrops(dt);

  // Neue Welle wenn alle besiegt oder entkommen
  const alive = game.enemies.filter((e) => e.hp > 0 && !e.dead);
  if (alive.length === 0) {
    game.waveCooldown += dt;
    const cd = Math.max(BALANCE.minWaveCooldown, BALANCE.waveCooldown - game.dungeonLevel * 0.04);
    if (game.waveCooldown >= cd) {
      game.waveCooldown = 0;
      game.enemies = game.enemies.filter((e) => e.hp > 0 && !e.dead);
      onWaveClear();
      safeSpawnWave();
    }
  } else {
    game.waveCooldown = 0;
  }

  // Tote Gegner aufräumen
  game.enemies = game.enemies.filter((e) => (e.hp > 0 && !e.dead) || e.hitFlash > 0);

  // Periodischer Spielstand (alle ~2.5s bei Änderungen)
  runSaveTimer += dt;
  if (runSaveTimer >= 2.5) {
    runSaveTimer = 0;
    if (runSaveDirty) saveActiveRun(false);
  }

  // Regeneration (Defense-Build)
  if (game.hero && !game.isDead) {
    const stR = heroStats();
    if (stR.regen > 0) {
      game.hero.hp = Math.min(stR.maxHp, game.hero.hp + stR.regen * dt);
    }
  }
  if (typeof syncRunStatsLive === "function") syncRunStatsLive();
  if (typeof tickBalanceDebug === "function") tickBalanceDebug(dt);
  updateHUD();
  updateStatus();
}

function onEnemyKill(e) {
  const st = heroStats();
  const gold = Math.floor(e.goldReward * st.goldBonus);
  const xp = Math.floor(e.xpReward * game.hero.xpBonus);
  game.runXp += xp;
  game.monstersDefeated++; game.dungeonLevel++;
  if (typeof noteEnemyKillForStats === "function") noteEnemyKillForStats(e);
  if (game.runStats) {
    game.runStats.goldEarned = (game.runStats.goldEarned || 0) + gold;
    game.runStats.resourcesEarned = (game.runStats.resourcesEarned || 0) + gold;
  }
  addLog(e.name + " besiegt!", e.isBoss ? "boss" : (e.isElite ? "loot" : "damage"));
  addMetaXp(2);
  spawnCoinDrop(gold, e.x + e.w / 2, e.y + e.h / 2);
  if (typeof PackFX !== "undefined") {
    PackFX.spawnExplosion(e.x + e.w / 2, e.y + e.h / 2, { radius: e.isBoss ? 48 : 28, life: e.isBoss ? 20 : 14 });
  } else {
    for (let i = 0; i < 5; i++) pushParticle({ x:e.x+e.w/2, y:e.y+e.h/2, vx:(Math.random()-0.5)*3, vy:-Math.random()*4, life:20, color:"#f1c40f", size:2 });
  }

  while (game.runXp >= game.playerLevel * BALANCE.xpPerLevel) {
    game.runXp -= game.playerLevel * BALANCE.xpPerLevel;
    game.playerLevel++;
    game.hero.hp = Math.min(heroStats().maxHp, game.hero.hp + Math.floor(heroStats().maxHp * BALANCE.levelUpHealPct));
    spawnBurst(game.hero.x + game.hero.w / 2, game.hero.y, "#2ecc71", 10, 3);
    emitCombatEvent("level_up");
    addLog("Level Up! Held " + game.playerLevel, "heal");
  }
  if (Math.random() < BALANCE.lootChance) generateLoot();
  markRunSaveDirty();
}

function onDeath() {
  game.isDead = true;
  stopMusic();
  if (!game.upgradeBoughtThisRun) {
    game.emptyUpgradeRuns = (game.emptyUpgradeRuns | 0) + 1;
  }
  // Gold aus dem Run sichern – Mindest-Belohnung gegen wertlose Runs
  let earnedGold = Math.max(0, Math.floor(Number(game.runGold) || 0));
  const floor = (typeof DL_BALANCE !== "undefined" && DL_BALANCE.economy.minRunGoldFloor)
    ? DL_BALANCE.economy.minRunGoldFloor : 12;
  if (earnedGold < floor && game.monstersDefeated > 0) {
    earnedGold = Math.max(floor, Math.floor(game.monstersDefeated * 4));
  }
  game.lastRunGold = earnedGold;
  game.totalGold = Math.max(0, Math.floor(Number(game.totalGold) || 0) + earnedGold);
  game.runGold = 0;
  addMetaXp(Math.floor(game.playerLevel * 1.5) + Math.floor(game.monstersDefeated / 5));
  saveMeta();
  savePlayer();
  clearActiveRun();
  if (game.hero) { game.hero.deathAnim = true; game.hero.animState = "death"; game.hero.animFrame = 0; }
  if (game.runStats) game.runStats.goldEarned = Math.max(game.runStats.goldEarned || 0, earnedGold);
  if (typeof finalizeRunRecordsOnDeath === "function") {
    game._lastDeathData = finalizeRunRecordsOnDeath("hp");
  }
  addLog("Game Over! +" + earnedGold + " Gold gesichert.", "death");
  let deathT = 0;
  function deathFrame(now) {
    deathT += 16;
    if (game.hero && typeof HR !== "undefined") HR.updateAnim(game.hero, 0.016, false);
    render();
    // Max ~0.55s Downtime → schnell Retry
    if (deathT < 550 && game.hero && !game.hero.deathDone) { requestAnimationFrame(deathFrame); return; }
    game.isRunning = false;
    stopLoop();
    showGameOver();
  }
  requestAnimationFrame(deathFrame);
}

function showGameOver() {
  hidePauseMenu();
  const world = getWorld();
  const earnedGold = Math.max(0, Math.floor(Number(game.lastRunGold) || 0));
  emitCombatEvent("game_over");

  const deathData = game._lastDeathData || null;
  const rs = deathData?.rs || game.runStats;
  const rec = deathData?.rec || (game.meta?.records || game.records);
  const prevProgress = deathData?.prevProgress ?? 0;

  $("gameover-panel").classList.remove("hidden");
  const summaryEl = $("gameover-summary");
  if (summaryEl) {
    summaryEl.textContent = (typeof buildGameOverRichHtml === "function" && rs)
      ? buildGameOverRichHtml(rs, rec || {}, prevProgress, earnedGold)
      : (world.name + " · Level " + game.dungeonLevel + "\n" + earnedGold + " Gold · " + game.monstersDefeated + " Kills");
  }

  const nextEl = $("gameover-next");
  if (nextEl) {
    const hint = (typeof buildGameOverNextHint === "function") ? buildGameOverNextHint() : "";
    nextEl.textContent = hint;
    nextEl.classList.toggle("hidden", !hint);
  }

  $("final-score").textContent = calcScore(earnedGold);
  $("btn-start-run").disabled = false;
  $("btn-pause").disabled = true;
  updateTotalGold(); renderUpgradeButtons(); renderAbilityPanel();
  renderSetupAbilityHint();
  updateRunButtons();
  tryMenuMusic();
  if (typeof renderBalanceDebugPanel === "function") renderBalanceDebugPanel();
}

function formatDamageNumber(val) {
  const n = Number(val);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.round(n));
}

function damagePopupLife(amount, opts) {
  if (opts.crit || opts.boss) return 32;
  if (amount >= 100) return 36;
  if (amount >= 10) return 26;
  return 20;
}

function spawnDamage(x, y, val, arg4, arg5) {
  /** Unterstützt altes (crit, taken) und neues Options-Objekt */
  let opts = {};
  if (typeof arg4 === "object" && arg4 !== null) opts = arg4;
  else if (typeof arg4 === "boolean" && arg5) opts = { crit: arg4, taken: true };
  else if (typeof arg4 === "boolean") opts = { crit: arg4 };

  const amount = formatDamageNumber(val);
  const life = damagePopupLife(amount, opts);
  const prefix = opts.heal ? "+" : opts.taken ? "-" : "";

  pushParticle({
    x, y: y - 10, vx: (Math.random() - 0.5) * 0.8, vy: -1.8,
    life, maxLife: life,
    text: prefix + amount,
    crit: opts.crit, taken: opts.taken, heal: opts.heal,
    magic: opts.magic, boss: opts.boss
  });
}

// ============================================
// RENDERN
// ============================================

function render() {
  const world = getWorld();
  if (ctx) ctx.imageSmoothingEnabled = false;
  const shakeX = game.screenShake ? (Math.random() - 0.5) * game.screenShake : 0;
  const shakeY = game.screenShake ? (Math.random() - 0.5) * game.screenShake * 0.6 : 0;
  const zoomBoost = 1 + (game.zoomPulse || 0);

  ctx.save();
  ctx.translate(shakeX, shakeY);
  ctx.save();
  applyCamera(ctx, zoomBoost);

  renderUnifiedBackground(world);

  if (!game.hero) {
    ctx.restore();
    ctx.restore();
    return;
  }

  drawCoinDrops(ctx);

  // Treffer-Ringe & Explosionen (hinten) – Pack-FX wenn verfügbar
  game.attackEffects.forEach((fx) => {
    if (typeof PackFX !== "undefined" && PackFX.drawEffect(ctx, fx)) {
      ctx.globalAlpha = 1;
      return;
    }
    const t = fx.life / fx.maxLife;
    if (fx.type === "ring" || fx.type === "spark") {
      ctx.strokeStyle = fx.color;
      ctx.globalAlpha = t * 0.85;
      ctx.lineWidth = 2 + (1 - t) * 2;
      ctx.beginPath();
      ctx.arc(fx.x, fx.y, fx.radius * (1.1 - t * 0.3), 0, Math.PI * 2);
      ctx.stroke();
    } else if (fx.type === "explosion") {
      ctx.fillStyle = fx.color;
      ctx.globalAlpha = t * 0.35;
      ctx.beginPath();
      ctx.arc(fx.x, fx.y, fx.radius * (1 - t * 0.5), 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#f39c12";
      ctx.globalAlpha = t * 0.7;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(fx.x, fx.y, fx.radius * (1 - t * 0.7), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  });

  // Nahkampf-Schläge (Spieler + Gegner) – Pack-Slash bevorzugt
  game.meleeSlashes.forEach((s) => {
    drawPremiumSlashFx(ctx, s);
  });

  // Gegner – Trefferfeedback am Sprite (kein Hitbox-Rechteck)
  game.enemies.forEach((e) => {
    if (e.hp <= 0) return;
    const bob = 0;
    // Eigene, rein visuelle Angriffsbewegung (Hitboxen/Kampfwerte bleiben
    // unverändert): Nahkämpfer stoßen nach vorn, Fernkämpfer weichen beim
    // Schuss zurück, Bosse machen einen schwereren Stampfer.
    const attackMax = e.isBoss ? 0.55 : (e.isRanged ? 0.28 : 0.32);
    const attackProgress = e.attackAnim > 0
      ? Math.max(0, Math.min(1, 1 - e.attackAnim / attackMax))
      : 0;
    const strike = Math.sin(attackProgress * Math.PI);
    const attackOffset = e.isRanged
      ? strike * 4
      : -strike * (e.isBoss ? 12 : (e.aiStyle === "jump" ? 10 : 7));
    const drawX = getEnemyDrawX(e) + attackOffset;
    const vb = getEnemyVisualBounds(e, drawX);
    const hitFlash = Math.max(0, e.hitFlash || 0);
    ctx.save();
    if (e.attackWindup > 0) {
      ctx.shadowColor = "rgba(231,76,60,0.45)";
      ctx.shadowBlur = 3 + e.attackWindup * 6;
    }
    if (typeof VisualEnemies !== "undefined" && VisualEnemies.drawAtFeet) {
      const gaitLean = e.isChasing && !(e.attackAnim > 0)
        ? Math.sin(e.gaitPhase || 0) * 0.024
        : 0;
      const attackLean = e.attackAnim > 0
        ? (e.isRanged ? -0.055 : 0.065) * strike
        : 0;
      VisualEnemies.drawAtFeet(
        ctx, e.sprite, drawX + e.w / 2, GROUND, true, world, bob, e.isBoss, e.w, e.h, hitFlash,
        gaitLean + attackLean
      );
    } else {
      drawLivingChar(ctx, e.sprite, drawX, e.y, e.w, e.h, true, world, bob, e.isBoss);
    }
    ctx.shadowBlur = 0;
    ctx.restore();
    if (DEBUG_HITBOXES) {
      ctx.strokeStyle = "rgba(255,0,0,0.7)";
      ctx.lineWidth = 1;
      ctx.strokeRect(e.x, e.y, e.w, e.h);
    }
    const barW = Math.min(vb.w, e.isBoss ? 96 : 56);
    const barX = vb.x + (vb.w - barW) / 2;
    const barY = vb.y - 7;
    ctx.fillStyle = "#111"; ctx.fillRect(barX, barY, barW, 4);
    ctx.fillStyle = e.isBoss ? "#f1c40f" : "#e74c3c";
    ctx.fillRect(barX, barY, barW * (e.hp / e.maxHp), 4);
    if (e.attackWindup > 0.4) {
      ctx.fillStyle = "rgba(231,76,60," + (e.attackWindup * 0.7) + ")";
      ctx.font = "bold 9px Courier New";
      ctx.fillText("!", vb.x + vb.w / 2 - 3, vb.y - 11);
    }
  });

  const h = game.hero;
  const hx = h.x + h.w / 2, hy = h.y + h.h / 2;
  const hurtOff = h.hurtAnim > 0 ? Math.sin(h.hurtAnim * 20) * 4 * h.hurtAnim : 0;
  const atkOff = h.attackAnim > 0 ? h.facing * 5 * h.attackAnim : 0;

  ctx.save();
  // Kein Hitbox-Rechteck – Treffer-Feedback nur am Sprite (HR) + Hurt-Pose
  drawHero(ctx, h, 0, atkOff, hurtOff, world);
  if (DEBUG_HITBOXES) {
    ctx.strokeStyle = "rgba(0,255,0,0.7)";
    ctx.lineWidth = 1;
    ctx.strokeRect(h.x, h.y, h.w, h.h);
  }
  ctx.restore();

  game.projectiles.forEach((p) => {
    drawPremiumProjectileFx(ctx, p);
  });

  game.particles.forEach((p) => {
    if (p.text) {
      const maxLife = p.maxLife || 48;
      const t = 1 - p.life / maxLife;
      let fontSize = 11;
      if (p.crit) fontSize = 16;
      if (p.boss) fontSize = 14;
      if (p.heal) fontSize = 13;
      ctx.font = "bold " + fontSize + "px Courier New";
      ctx.globalAlpha = Math.max(0.2, 1 - t * 0.85);
      if (p.heal) ctx.fillStyle = "#2ecc71";
      else if (p.magic) ctx.fillStyle = "#5dade2";
      else if (p.boss && p.taken) ctx.fillStyle = "#e67e22";
      else if (p.taken) ctx.fillStyle = "#e74c3c";
      else if (p.crit) ctx.fillStyle = "#f1c40f";
      else ctx.fillStyle = "#ecf0f1";
      if (p.crit) {
        ctx.strokeStyle = "rgba(0,0,0,0.5)";
        ctx.lineWidth = 2;
        ctx.strokeText(p.text, p.x - 8, p.y - p.life * 0.75);
      }
      ctx.fillText(p.text, p.x - 8, p.y - p.life * 0.75);
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
  });

  /** Ult / Fähigkeiten dauerhaft über dem Kopf: W & S, ✓ wenn bereit */
  if (game.isRunning && !game.isDead) {
    drawAbilityOverhead(ctx, h);
  }

  if (typeof renderWorldForeground === "function") {
    renderWorldForeground(ctx, world, {
      x: game.scrollX,
      scrollX: game.scrollX,
      focusX: visualCamera.x,
      zoom: visualCamera.zoom
    }, typeof WR !== "undefined" ? WR.animTime : 0);
  }

  ctx.restore();

  renderWorldTransition(ctx);

  // Kurze Treffer-Vignette am Bildschirmrand (kein rotes Rechteck auf dem Held)
  if (game.hero && (game.hero.hitFlash || 0) > 6) {
    const vig = Math.min(0.22, (game.hero.hitFlash - 6) * 0.025);
    const g = ctx.createRadialGradient(CW / 2, CH / 2, CH * 0.28, CW / 2, CH / 2, CH * 0.75);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(120,20,20," + vig + ")");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, CW, CH);
  }

  /** Kritischer Treffer – dezenter Bildschirmblitz */
  if (game.critFlash > 0) {
    ctx.fillStyle = "rgba(241,196,15," + (game.critFlash * 0.35) + ")";
    ctx.fillRect(0, 0, CW, CH);
  }

  /** Boss-Einblendung */
  if (game.bossIntro) {
    const bi = game.bossIntro;
    const alpha = Math.min(1, bi.timer / 0.6);
    ctx.fillStyle = "rgba(0,0,0," + (0.72 * alpha) + ")";
    ctx.fillRect(0, 0, CW, CH);
    ctx.textAlign = "center";
    ctx.font = "bold 28px Courier New";
    ctx.fillStyle = "rgba(231,76,60," + alpha + ")";
    ctx.fillText("⚠ BOSS ⚠", CW / 2, CH / 2 - 40);
    ctx.font = "bold 18px Courier New";
    ctx.fillStyle = "rgba(241,196,15," + alpha + ")";
    ctx.fillText(bi.name, CW / 2, CH / 2 - 8);
    const barW = 280, barH = 10;
    const bx = (CW - barW) / 2, by = CH / 2 + 16;
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(bx, by, barW, barH);
    ctx.fillStyle = "rgba(241,196,15," + alpha + ")";
    ctx.fillRect(bx, by, barW * (bi.hp / bi.maxHp), barH);
    ctx.font = "11px Courier New";
    ctx.fillStyle = "rgba(200,200,200," + alpha + ")";
    ctx.fillText("Spezialangriffe – Vorsicht!", CW / 2, by + 28);
    ctx.textAlign = "left";
  }

  /** Spielereignisse: Weltwechsel und Fähigkeit bereit – UI, nie Welt-Layer */
  if (game.announcement) {
    const a = game.announcement;
    const fadeIn = Math.min(1, (a.duration - a.timer) / 0.18);
    const fadeOut = Math.min(1, a.timer / 0.35);
    const alpha = fadeIn * fadeOut;
    const isWorld = a.kind === "world";
    const col = isWorld ? "#f1c40f" : "#71d99b";
    const y = isWorld ? 82 : 104;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = "center";
    ctx.font = "bold " + (isWorld ? 17 : 15) + "px Courier New";
    const titleW = ctx.measureText(a.title).width;
    const subFont = "bold 11px Courier New";
    ctx.font = subFont;
    const subW = ctx.measureText(a.subtitle).width;
    const boxW = Math.max(titleW, subW) + 34;
    const boxH = a.subtitle ? 36 : 25;
    const boxX = (CW - boxW) / 2;
    const boxY = y - 20;

    ctx.fillStyle = "rgba(5,8,10,0.78)";
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = isWorld ? "rgba(241,196,15,0.72)" : "rgba(113,217,155,0.72)";
    ctx.lineWidth = 1;
    ctx.strokeRect(boxX + 0.5, boxY + 0.5, boxW - 1, boxH - 1);

    ctx.font = "bold " + (isWorld ? 17 : 15) + "px Courier New";
    ctx.fillStyle = col;
    ctx.fillText(a.title, CW / 2, y);
    if (a.subtitle) {
      ctx.font = subFont;
      ctx.fillStyle = "#f3ead0";
      ctx.fillText(a.subtitle, CW / 2, y + 14);
    }
    ctx.restore();
  }

  if (game.isRunning && !game.isPaused && mouse.onCanvas) {
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(mouse.x - 8, mouse.y); ctx.lineTo(mouse.x + 8, mouse.y);
    ctx.moveTo(mouse.x, mouse.y - 8); ctx.lineTo(mouse.x, mouse.y + 8);
    ctx.stroke();
  }

  ctx.restore();
}

// ============================================
// HUD & UI
// ============================================

function updateHUD() {
  if (!game.hero) return;
  const st = heroStats(), h = game.hero;
  const world = getWorld();
  $("hud-hp-fill").style.width = (h.hp / st.maxHp * 100) + "%";
  $("hud-hp-text").textContent = Math.floor(h.hp) + " / " + st.maxHp;
  const xpNeed = game.playerLevel * BALANCE.xpPerLevel;
  $("hud-xp-fill").style.width = (game.runXp / xpNeed * 100) + "%";
  $("hud-xp-text").textContent = Math.floor(game.runXp / xpNeed * 100) + "%";
  $("hud-gold").textContent = game.runGold;
  $("hud-level").textContent = game.dungeonLevel;
  $("hud-world").textContent = world.name + " ☠" + world.danger;
  const alive = game.enemies.filter((e) => e.hp > 0 && !e.dead).length;
  const hudEn = $("hud-enemies");
  if (hudEn) hudEn.textContent = alive;
  if (game.classKey === "mage") {
    $("hud-mana-fill").style.width = (h.mana / st.maxMana * 100) + "%";
    $("hud-mana-text").textContent = Math.floor(h.mana) + " / " + st.maxMana;
  }
}

function updateStatus() {
  $("dungeon-level").textContent = game.dungeonLevel;
  $("monsters-killed").textContent = game.monstersDefeated;
  $("player-level").textContent = game.playerLevel;
  const accEl = $("account-level");
  if (accEl) accEl.textContent = getMetaLevel();
  const h = game.hero;
  if (h) {
    const parts = [0, 1].map((slotIdx) => {
      const ab = getEquippedAbilityAtSlot(slotIdx);
      if (!ab) return null;
      const left = Math.max(0, getEffectiveAbilityCd(ab) - getAbilitySlotCd(h, slotIdx));
      const cd = left <= 0 ? "✓" : Math.ceil(left) + "s";
      return getAbilityKeyLabel(slotIdx) + ": " + ab.name + " " + cd;
    }).filter(Boolean);
    if (parts.length) {
      $("special-status").textContent = parts.join(" | ");
      $("special-status").style.color = parts.some((p) => p.includes("✓")) ? "#2ecc71" : "";
    } else {
      $("special-status").textContent = "–";
      $("special-status").style.color = "";
    }
  }
  renderAbilityLoadout();
}

// ============================================
// LOOT / UPGRADES / SCORE
// ============================================

function generateLoot() {
  let roll = Math.random(), cum = 0, rarity = RARITIES[0];
  for (const r of RARITIES) { cum += r.chance; if (roll <= cum) { rarity = r; break; } }

  const types = LOOT_TYPES_BY_CLASS[game.classKey] || LOOT_TYPES_BY_CLASS.warrior;
  const baseType = types[Math.floor(Math.random() * types.length)];
  const prefix = LOOT_PREFIXES[Math.floor(Math.random() * LOOT_PREFIXES.length)];
  const suffixArr = LOOT_SUFFIXES[baseType] || [""];
  const suffix = suffixArr[Math.floor(Math.random() * suffixArr.length)];

  /** Zufällige Werte: Basis × Seltenheit × Dungeon-Level ± Varianz */
  const variance = 0.75 + Math.random() * 0.5;
  const eff = LOOT_EFFECTS[Math.floor(Math.random() * LOOT_EFFECTS.length)];
  const val = Math.max(1, Math.floor(rarity.mult * variance * (1 + game.dungeonLevel * 0.12)));

  const loot = {
    name: prefix + " " + baseType + suffix,
    rarity: rarity.name,
    css: rarity.css,
    effect: eff.key,
    value: val,
    score: rarity.mult * val
  };
  applyLoot(loot);
  if (!game.bestLoot || loot.score > game.bestLoot.score) {
    game.bestLoot = loot;
    $("loot-display").classList.remove("hidden");
    $("best-loot-text").textContent = rarity.name + " " + loot.name + " (+" + eff.label + " " + val + ")";
    $("best-loot-text").className = "loot-item " + loot.css;
  }
  addLog("Loot: " + rarity.name + " " + loot.name + " (+" + eff.label + " " + val + ")", rarity.logCss);
  if (rarity.name === "Legendär" || rarity.name === "Mythisch") {
    spawnBurst(game.hero.x + game.hero.w / 2, game.hero.y, rarity.name === "Mythisch" ? "#bb86fc" : "#f1c40f", 12, 4);
  }
}

function applyLoot(loot) {
  const h = game.hero, lb = h.lootBonuses;
  switch (loot.effect) {
    case "attack": lb.attack += loot.value; break;
    case "hp": lb.hp += loot.value; h.hp += loot.value; break;
    case "defense": lb.defense += loot.value; break;
    case "crit": lb.crit += loot.value * 0.01; break;
    case "goldBonus": lb.goldBonus += loot.value * 0.02; break;
    case "magicDamage": lb.magicDamage += loot.value; break;
    case "mana": lb.mana += loot.value; h.mana += loot.value; break;
  }
}

function getUpgradeCost(k) {
  const up = UPGRADES.find((u) => u.key === k);
  if (!up) return Infinity;
  const lv = game.upgrades[k] || 0;
  if (typeof dlUpgradeCost === "function") return dlUpgradeCost(up, lv);
  const max = BALANCE.upgradeMax || 24;
  if (lv >= max) return Infinity;
  const pow = BALANCE.upgradeCostPow || 1.38;
  const soft = BALANCE.upgradeCostSoftLv ?? 8;
  if (lv < soft) return Math.floor(up.baseCost * Math.pow(pow, lv));
  const anchor = up.baseCost * Math.pow(pow, soft);
  return Math.floor(anchor * (1 + (lv - soft) * (BALANCE.upgradeCostLinear || 0.28)));
}

function isUpgradeRelevant(up) {
  if (up.forClass === "all") return true;
  return up.forClass.split(",").includes(game.classKey);
}

function renderUpgradeButtons() {
  const grid = $("upgrade-grid"); if (!grid) return;
  grid.innerHTML = "";

  const tipEl = $("upgrade-tip");
  if (tipEl) {
    const goals = (typeof getShortMidLongGoals === "function") ? getShortMidLongGoals() : null;
    tipEl.textContent = goals
      ? (goals.short + " · " + goals.mid + " · " + goals.long)
      : getUpgradeTip();
  }

  const cats = ["offense", "defense", "economy", "utility"];
  const labels = (typeof DL_UPGRADE_CAT_LABELS !== "undefined") ? DL_UPGRADE_CAT_LABELS : {};
  const byCat = {};
  UPGRADES.forEach((up) => {
    const c = up.cat || "offense";
    if (!byCat[c]) byCat[c] = [];
    byCat[c].push(up);
  });

  cats.forEach((cat) => {
    const list = byCat[cat];
    if (!list || !list.length) return;
    const head = document.createElement("div");
    head.className = "upgrade-cat";
    head.textContent = labels[cat] || cat.toUpperCase();
    grid.appendChild(head);
    list.forEach((up) => {
      const lv = game.upgrades[up.key] || 0;
      const max = (typeof dlUpgradeMax === "function") ? dlUpgradeMax(up) : (BALANCE.upgradeMax || 24);
      const cost = getUpgradeCost(up.key);
      const maxed = lv >= max;
      const relevant = isUpgradeRelevant(up);
      let tipText = up.tip || "";
      if (up.tier) tipText = "[" + ({ minor: "klein", major: "groß", keystone: "Schlüssel" }[up.tier] || up.tier) + "] " + tipText;
      if (up.key === "upgrade_cooldown" && !maxed) {
        const next = getNextCdAbilityUnlock(game.classKey, lv);
        const nextCd = getNextAbilityUnlockCdLevel(lv);
        if (next && nextCd != null) tipText += " · Nächste: " + next.name + " (CD " + nextCd + ")";
      }
      const eff = (typeof getUpgradeEff === "function") ? getUpgradeEff(up.key) : lv * up.bonus;
      let effText = up.bonusText;
      if (typeof eff === "number" && up.bonus < 1) effText = "+" + (Math.round(eff * 1000) / 10) + "% gesamt";
      else if (typeof eff === "number" && up.key.indexOf("health") >= 0) effText = "+" + Math.floor(eff) + " LP gesamt";
      const btn = document.createElement("button");
      btn.className = "upgrade-btn" + (relevant ? " relevant" : "") + (maxed ? " maxed" : "") + (up.tier === "keystone" ? " keystone" : "");
      btn.disabled = maxed || getSpendableGold() < cost;
      btn.innerHTML =
        '<span class="upgrade-info">' +
          '<span class="upgrade-name">' + up.label + (relevant ? " ★" : "") + '</span>' +
          '<span class="upgrade-level">Stufe ' + lv + (maxed ? " MAX" : "") + ' – ' + effText + '</span>' +
          '<span class="upgrade-tip-text">' + tipText + '</span>' +
        '</span>' +
        '<span class="upgrade-cost">' + (maxed ? "MAX" : cost + " 🪙") + '</span>';
      btn.onclick = () => buyUpgrade(up.key);
      grid.appendChild(btn);
    });
  });
}

async function buyUpgrade(k) {
  const cost = getUpgradeCost(k);
  if (getSpendableGold() < cost || (game.upgrades[k] || 0) >= BALANCE.upgradeMax) return;
  const prevCd = getSpecialCdLevel();
  const prevUnlocked = getUnlockedAbilityIds(game.classKey, prevCd);
  spendGold(cost);
  game.upgrades[k] = (game.upgrades[k] || 0) + 1;
  game.emptyUpgradeRuns = 0;
  game.upgradeBoughtThisRun = true;
  game.upgradeBoughtThisRun = false;
  const up = UPGRADES.find((u) => u.key === k);
  const eff = (typeof getUpgradeEff === "function") ? getUpgradeEff(k) : game.upgrades[k] * up.bonus;
  addLog("Upgrade: " + up.label + " Stufe " + game.upgrades[k] + " – spürbar stärker!", "heal");
  if (game.hero && !game.isDead) {
    refreshHeroFromUpgrades();
  }
  if (k === "upgrade_cooldown") {
    syncUnlockedAbilities();
    const newUnlocked = getUnlockedAbilityIds(game.classKey, getSpecialCdLevel());
    newUnlocked.filter((id) => !prevUnlocked.includes(id)).forEach((id) => {
      const ab = getAbilityById(game.classKey, id);
      if (ab) addLog("Neue Fähigkeit: " + ab.name + "!", "heal");
    });
  }
  await savePlayer(); updateTotalGold(); renderUpgradeButtons(); renderAbilityPanel();
  updateClassHint();
  if (game.isRunning && !game.isDead) { markRunSaveDirty(); saveActiveRun(true); }
}

function updateTotalGold() {
  if ($("total-gold")) $("total-gold").textContent = getSpendableGold();
}
function calcScore(runGoldOverride) {
  const gold = runGoldOverride != null
    ? Math.max(0, Math.floor(Number(runGoldOverride) || 0))
    : Math.max(0, Math.floor(Number(game.lastRunGold || game.runGold) || 0));
  return game.dungeonLevel * 100 + game.monstersDefeated * 50 + gold + game.playerLevel * 200;
}

function loadLocalScores() {
  try {
    const raw = localStorage.getItem(LOCAL_SCORES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

function saveLocalScore(entry) {
  const scores = loadLocalScores();
  scores.push({ ...entry, savedAt: Date.now() });
  scores.sort((a, b) => (b.score || 0) - (a.score || 0));
  try { localStorage.setItem(LOCAL_SCORES_KEY, JSON.stringify(scores.slice(0, 50))); } catch (_) {}
}

function renderLeaderboardList(list, data) {
  if (!data?.length) {
    list.innerHTML = '<li class="empty">Noch keine Scores – sterb tapfer!</li>';
    return;
  }
  const medals = ["🥇", "🥈", "🥉"];
  list.innerHTML = "";
  data.forEach((e, i) => {
    const li = document.createElement("li");
    li.innerHTML = '<span>' + (medals[i] || (i + 1) + ".") + '</span><span>' + e.name + '</span><span class="lb-score">' + e.score + '</span>';
    list.appendChild(li);
  });
}

async function saveScore() {
  const entry = {
    name: game.playerName,
    class_name: CLASSES[game.classKey].name,
    score: calcScore(),
    dungeon_level: game.dungeonLevel,
    monsters_defeated: game.monstersDefeated,
    gold: Math.max(0, Math.floor(Number(game.lastRunGold || game.runGold) || 0)),
    player_level: game.playerLevel
  };
  saveLocalScore(entry);
  $("save-hint") && ($("save-hint").textContent = "Score lokal gespeichert!");
  loadLeaderboard();
  if (!supabase) return;
  try {
    const { error } = await supabase.from("dungeon_scores").insert(entry);
    if (!error) $("save-hint").textContent = "Score lokal + online gespeichert!";
  } catch (_) { /* offline ok */ }
}

async function loadLeaderboard() {
  const list = $("leaderboard"); if (!list) return;
  const local = loadLocalScores().slice(0, 10);
  if (!supabase) {
    renderLeaderboardList(list, local);
    return;
  }
  try {
    const { data, error } = await supabase.from("dungeon_scores").select("*").order("score", { ascending: false }).limit(10);
    if (!error && data?.length) {
      renderLeaderboardList(list, data);
      return;
    }
  } catch (_) { /* offline */ }
  renderLeaderboardList(list, local);
}

function addLog(msg, css) {
  game.combatLog.push({ text: msg, css: css||"" });
  if (game.combatLog.length > 12) game.combatLog.shift();
  ["combat-log"].forEach((id) => {
    const ul = $(id);
    if (!ul) return;
    ul.innerHTML = "";
    game.combatLog.forEach((e) => {
      const li = document.createElement("li");
      li.textContent = e.text; if (e.css) li.classList.add(e.css);
      ul.appendChild(li);
    });
  });
}
