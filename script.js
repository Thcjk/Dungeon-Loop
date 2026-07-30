/* ============================================
   Dungeon Loop – Pixel Canvas Edition
   Maus auf Gegner = Angriff | W/S = Spezial
   A/D = Vor/Zurück | P = Pause
   ============================================ */

const BUILD_ID = "slots-v121";

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
const GROUND = 308;

/** Alle Charaktere: Unterkante der Hitbox = Bodenlinie */
function pinCharToGround(entity) {
  if (!entity || entity.h == null) return;
  entity.y = GROUND - entity.h;
}
const CAM_ZOOM = 1.12;
const COMBAT_LAYOUT = {
  heroCombatX: 90,
  /** Bewegungskorridor – links bleibt der Held vollständig sichtbar */
  heroMoveMinX: 28,
  heroMoveMaxX: 280,
  /** Rechts darf max. 50 % der Körperbreite aus dem Bildschirm ragen */
  heroEdgeOverflowRight: 0.5,
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
const CAMERA_FOLLOW_OFFSET_X = 145;
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
  return clamp(h.x + CAMERA_FOLLOW_OFFSET_X, 215, 395);
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
    hp: 128, attack: 19, defense: 6, crit: 0.05, mana: 0, magicDamage: 0,
    range: 82, attackRate: 480, moveSpeed: 122,
    aoeFalloff: 0.72,
    special: "Schildschlag", specialCd: 8, specialRange: 90, specialMult: 2.2,
    desc: "Nahkampf-Schwert, kurze Reichweite, viel Leben"
  },
  ranger: {
    name: "Waldläufer", attackType: "ranged",
    hp: 108, attack: 17, defense: 4, crit: 0.18, mana: 0, magicDamage: 0,
    range: 245, attackRate: 200, moveSpeed: 158,
    closeRange: 50, meleePenalty: 0.3,
    proj: "projectile_arrow", projSpeed: 14,
    special: "Präzisionsschuss", specialCd: 5,
    desc: "Bogen, große Reichweite, schwach im Nahkampf"
  },
  mage: {
    name: "Magier", attackType: "magic",
    hp: 82, attack: 7, defense: 3, crit: 0.12, mana: 120, magicDamage: 28,
    range: 210, attackRate: 300, moveSpeed: 108, manaPerShot: 5,
    proj: "projectile_fire", projSpeed: 8,
    special: "Feuerball", specialCd: 6, manaCost: 30,
    desc: "Zauber, mittlere Reichweite, braucht Mana"
  }
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

const WORLDS = [
  {
    name: "Dunkler Wald", min: 1, danger: 1, theme: "forest",
    hpMult: 1, atkMult: 1, speedMult: 1,
    sky: "#040e0a", bg: "#071812", hill: "#0a2218",
    hill2: "#0d2e1e", hill3: "#123824",
    ground: "#1a1208", moss: "#1b4332", leaf: "#2d6a4f",
    accent: "#52b788", fog: "rgba(8,28,18,0.55)",
    fog2: "rgba(20,50,30,0.35)", particleColor: "#95e1a3"
  },
  {
    name: "Verfluchte Sümpfe", min: 20, danger: 2, theme: "swamp",
    hpMult: 1.32, atkMult: 1.24, speedMult: 1.1,
    sky: "#060a06", bg: "#0a1208", hill: "#141a10",
    hill2: "#1a2214", hill3: "#202818",
    ground: "#1a1810", moss: "#354828", leaf: "#405838",
    accent: "#52b788", fog: "rgba(15,25,10,0.55)",
    fog2: "rgba(30,45,20,0.35)", particleColor: "#7cba6a"
  },
  {
    name: "Gefrorene Berge", min: 40, danger: 3, theme: "frost",
    hpMult: 1.62, atkMult: 1.48, speedMult: 1.18,
    sky: "#080c18", bg: "#0c1428", hill: "#142038",
    hill2: "#182848", hill3: "#1c3058",
    ground: "#c8d8e8", moss: "#6a8898", leaf: "#a8d8ea",
    accent: "#85c1e9", fog: "rgba(160,200,240,0.35)",
    fog2: "rgba(200,220,255,0.2)", particleColor: "#d4e8f8"
  },
  {
    name: "Feuerlande", min: 60, danger: 4, theme: "fire",
    hpMult: 1.95, atkMult: 1.72, speedMult: 1.25,
    sky: "#0a0202", bg: "#180606", hill: "#3a0c08",
    hill2: "#4a1008", hill3: "#5a180a",
    ground: "#2a0804", moss: "#5a1a08", leaf: "#922b21",
    accent: "#e74c3c", fog: "rgba(80,20,5,0.45)",
    fog2: "rgba(120,40,10,0.3)", particleColor: "#f39c12"
  },
  {
    name: "Vergessene Ruinen", min: 80, danger: 5, theme: "ruins",
    hpMult: 2.35, atkMult: 2.05, speedMult: 1.32,
    sky: "#0a0814", bg: "#100c1c", hill: "#1a1430",
    hill2: "#201838", hill3: "#281c40",
    ground: "#2a2438", moss: "#4a5058", leaf: "#5a6068",
    accent: "#f1c40f", fog: "rgba(25,20,35,0.4)",
    fog2: "rgba(40,35,55,0.25)", particleColor: "#bb86fc"
  }
];

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
const UPGRADES = [
  { key: "upgrade_health",   label: "Leben",        baseCost: 85,  bonus: 24,  bonusText: "+24 LP",       tip: "Überleben! Pflicht für jeden Run.",           forClass: "all" },
  { key: "upgrade_defense",  label: "Verteidigung", baseCost: 75,  bonus: 1,   bonusText: "+1 DEF",       tip: "Weniger Schaden – für jede Klasse nützlich.", forClass: "all" },
  { key: "upgrade_attack",   label: "Angriff",      baseCost: 95,  bonus: 4,   bonusText: "+4 ATK",       tip: "Schneller töten. Krieger & Waldläufer.",    forClass: "warrior,ranger" },
  { key: "upgrade_magic",    label: "Magieschaden", baseCost: 110, bonus: 5,   bonusText: "+5 MAG",       tip: "Nur Magier – vor Mana upgraden!",           forClass: "mage" },
  { key: "upgrade_mana",     label: "Mana",         baseCost: 100, bonus: 15,  bonusText: "+15 Mana",     tip: "Nur Magier – mehr Zauber pro Run.",         forClass: "mage" },
  { key: "upgrade_crit",     label: "Krit-Chance",  baseCost: 120, bonus: 0.011, bonusText: "+1.1% Krit", tip: "Waldläufer lieben das. Risiko-Reiz.",     forClass: "ranger" },
  { key: "upgrade_gold",     label: "Gold-Bonus",   baseCost: 130, bonus: 0.08, bonusText: "+8% Gold",   tip: "Langzeit-Farm. Erst wenn du oft stirbst.",  forClass: "all" },
  { key: "upgrade_xp",       label: "XP-Bonus",     baseCost: 110, bonus: 0.06, bonusText: "+6% XP",     tip: "Schneller Held-Level im Run.",              forClass: "all" },
  { key: "upgrade_cooldown", label: "Spezial-CD",   baseCost: 165, bonus: 0.35, bonusText: "-0.35s CD",  tip: "Kürzere CD + Fähigkeiten bei Stufe 3/6/10/14/20", forClass: "all" }
];

// Balance – Early Game fairer; Werte hier zum Feintuning
const BALANCE = {
  upgradeCostPow: 1.64,
  upgradeMax: 25,
  lootChance: 0.18,
  xpPerLevel: 155,          // niedriger = schnelleres Held-Level
  levelScalePow: 1.060,       // niedriger = langsamere Gegner-Skalierung
  levelUpHealPct: 0.14,
  waveCooldown: 2.15,
  minWaveCooldown: 0.95,
  defenseFactor: 1.3,           // höher = Verteidigung wirkt stärker
  earlyEaseUntil: 15,           // erste N Dungeon-Level leichter
  earlyHpEase: 0.12,            // max. HP-Reduktion Early Game
  earlyAtkEase: 0.22,           // max. Schaden-Reduktion Early Game
  coinLife: 2.4,                // Sekunden auf dem Boden bis Auto-Einsammeln (nur Krieger)
  coinJumpDur: 0.62,            // Sprung in die Luft
  coinJumpHeight: 72,           // Max. Sprunghöhe
  coinHitRadius: 24,            // Maus/Touch-Trefferzone
  coinCatchDelay: 0.16,         // Kurz nicht einsammelbar – Münze entweicht der Maus
  coinCatchMoveMin: 34          // Mausbewegung nötig für x2-Bonus
};
let enemyId = 0;
let upgradePause = false;

const game = {
  playerName: "", classKey: "warrior", playerId: null, slotIndex: 0,
  totalGold: 0, upgrades: {},
  isRunning: false, isPaused: false, isDead: false,
  dungeonLevel: 1, runGold: 0, runXp: 0, playerLevel: 1, monstersDefeated: 0,
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
  /** Dezente Bildschirm-Effekte */
  critFlash: 0, zoomPulse: 0,
  /** Fähigkeiten-Cast-Sperre (keine gleichzeitigen Spezialfähigkeiten) */
  abilityCastLock: 0
};

let WAVE_DATA = null;
let SOUND_MAP = null;
const audioCache = {};
let musicTrack = null;
let musicKey = null;
let audioUnlocked = false;

/** Audio-Einstellungen – unabhängig für Musik & Soundeffekte (localStorage) */
const AUDIO_PREFS_KEY = "dungeon_loop_audio";
let audioPrefs = { musicEnabled: true, sfxEnabled: true };

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
const RUN_SAVE_VERSION = 1;
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
  _boss:      { style: "boss",   speedMult: 0.95, atkMult: 1.2,  intervalMult: 0.88 }
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
}

function tickHeroCard() {
  const cv = $("hero-card-canvas");
  if (!cv || !HR || $("setup-section")?.classList.contains("collapsed")) {
    heroCardRaf = null;
    return;
  }
  const c = cv.getContext("2d");
  c.imageSmoothingEnabled = false;
  heroCardTime += 1 / 60;
  if (heroCardTime >= HR.ANIM.idle.t) {
    heroCardTime = 0;
    heroCardFrame = (heroCardFrame + 1) % HR.ANIM.idle.n;
  }
  HR.drawHeroCard(c, game.classKey, cv.width, cv.height, heroCardFrame);
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
  const cv = $("hero-card-canvas");
  if (cv && HR) {
    const c = cv.getContext("2d");
    c.imageSmoothingEnabled = false;
    HR.drawHeroCard(c, game.classKey, cv.width, cv.height, 0);
  }
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

  if (typeof PackAssets !== "undefined") {
    try {
      await PackAssets.loadHeroes();
      drawPreviews();
      startHeroCardLoop();
      // Welten/Gegner im Hintergrund – Starten bleibt möglich
      PackAssets.loadRest().then(() => {
        initParallaxBackground(getWorld());
        invalidateParallaxCache?.();
      }).catch((err) => console.warn("Asset-Pack Rest laden fehlgeschlagen", err));
    } catch (err) {
      console.warn("Asset-Pack Helden laden fehlgeschlagen", err);
    }
  }

  initParallaxBackground(getWorld());
  if (typeof applyVisualSpritePatch === "function") applyVisualSpritePatch();
  initSupabase();
  await loadGameData();
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
    const res = await fetch("sounds.json?v=99");
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

/** Meta-Daten: Account-Level, freigeschaltete & ausgerüstete Fähigkeiten */
function defaultMeta() {
  return {
    level: 1, xp: 0, totalKills: 0,
    abilities: {
      warrior: { unlocked: [...DEFAULT_UNLOCKED.warrior], equipped: [DEFAULT_UNLOCKED.warrior[0], null] },
      ranger:  { unlocked: [...DEFAULT_UNLOCKED.ranger],  equipped: [DEFAULT_UNLOCKED.ranger[0], null] },
      mage:    { unlocked: [...DEFAULT_UNLOCKED.mage],    equipped: [DEFAULT_UNLOCKED.mage[0], null] }
    }
  };
}

function loadMeta() {
  try {
    const raw = localStorage.getItem(META_STORAGE_KEY);
    if (!raw) return defaultMeta();
    const parsed = JSON.parse(raw);
    const base = defaultMeta();
    base.level = parsed.level || 1;
    base.xp = parsed.xp || 0;
    base.totalKills = parsed.totalKills || 0;
    ["warrior", "ranger", "mage"].forEach((ck) => {
      if (parsed.abilities?.[ck]) {
        base.abilities[ck].unlocked = parsed.abilities[ck].unlocked || base.abilities[ck].unlocked;
        base.abilities[ck].equipped = parsed.abilities[ck].equipped || base.abilities[ck].equipped;
      }
    });
    return base;
  } catch (_) { return defaultMeta(); }
}

function saveMeta() {
  if (!game.meta) return;
  try { localStorage.setItem(META_STORAGE_KEY, JSON.stringify(game.meta)); } catch (_) {}
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
  const classes = classKey ? [classKey] : ["warrior", "ranger", "mage"];
  classes.forEach((ck) => {
    game.meta.abilities[ck].unlocked = getUnlockedAbilityIds(ck, cdLv);
    const eq = game.meta.abilities[ck].equipped || [null, null];
    for (let i = 0; i < 2; i++) {
      if (eq[i] && !game.meta.abilities[ck].unlocked.includes(eq[i])) eq[i] = null;
    }
    if (!eq[0] && game.meta.abilities[ck].unlocked.length) {
      eq[0] = game.meta.abilities[ck].unlocked[0];
    }
    if (!eq[1] && game.meta.abilities[ck].unlocked.length > 1) {
      eq[1] = game.meta.abilities[ck].unlocked.find((id) => id !== eq[0]) || null;
    }
    game.meta.abilities[ck].equipped = eq;
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
  if (abilityId && !isAbilityOwned(ck, abilityId)) return;
  const otherSlot = slotIdx === 0 ? 1 : 0;
  if (abilityId && game.meta.abilities[ck].equipped[otherSlot] === abilityId) {
    game.meta.abilities[ck].equipped[otherSlot] = null;
  }
  game.meta.abilities[ck].equipped[slotIdx] = abilityId;
  saveMeta();
  if (game.isRunning && !game.isDead) { markRunSaveDirty(); saveActiveRun(true); }
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
  html += '<p class="ability-setup-meta">Spezial-CD Stufe <strong>' + cdLv + '</strong> · ' + owned.length + '/' + list.length + ' freigeschaltet · Taste <kbd>W</kbd>/<kbd>S</kbd> im Kampf</p>';
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
    const left = Math.max(0, getEffectiveAbilityCd(ab) - (h.abilityCds[ab.id] || 0));
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
  const cdRed = (game.upgrades.upgrade_cooldown || 0) * 0.35;
  return Math.max(2, ab.cd - cdRed);
}

function canCastAbility(ab, h, st) {
  if (ab.manaCost && h.mana < ab.manaCost) return false;
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

  let html = '<p class="ability-meta">Spezial-CD Stufe <strong>' + cdLv + '</strong> · ' + owned.length + '/' + list.length + ' Fähigkeiten · Taste <kbd>W</kbd>/<kbd>S</kbd> im Kampf</p>';
  html += '<p class="ability-meta ability-meta--hint">Meilensteine: CD Stufe <strong>3 · 6 · 10 · 14 · 20</strong> – spätere Fähigkeiten sind deutlich stärker.</p>';
  html += '<div class="ability-equip-grid">';
  [0, 1].forEach((slotIdx) => {
    html += '<div class="ability-equip-slot">';
    html += '<label class="label ability-equip-label">Taste ' + getAbilityKeyLabel(slotIdx) + '</label>';
    html += '<select class="input ability-select" data-slot="' + slotIdx + '">';
    html += '<option value="">– Keine –</option>';
    owned.forEach((id) => {
      const ab = getAbilityById(ck, id);
      if (!ab) return;
      html += '<option value="' + id + '"' + (equipped[slotIdx] === id ? ' selected' : '') + '>' + ab.name + '</option>';
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
  const vol = SOUND_MAP.sfxVolume ?? SOUND_MAP.volume ?? 0.5;
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
  musicTrack.volume = SOUND_MAP.musicVolume ?? 0.32;
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
    type: "ring", x, y, radius: radius || 24,
    color: color || "#e74c3c",
    life: life || 12, maxLife: life || 12
  });
}

function spawnBurst(x, y, color, count, speed) {
  const n = count || 5;
  const spd = speed || 4;
  for (let i = 0; i < n; i++) {
    const ang = Math.random() * Math.PI * 2;
    game.particles.push({
      x, y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
      life: 14 + Math.random() * 8, color: color || "#f1c40f", size: 2 + Math.random() * 2
    });
  }
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
  const pierce = Math.floor(rawAttack * 0.17);
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
  let dmg = applyShieldToDamage(h, Math.floor(calcPlayerDamage(e.attack * 1.6, st.defense)));

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
      renderSetupAbilityHint();
      renderAbilityPanel();
    });
  });
  const bind = (id, fn) => { const el = $(id); if (el) el.addEventListener("click", fn); };
  bind("btn-menu-new", () => { unlockAudio(); showMenuPanel("new-slot"); });
  bind("btn-menu-load", () => { unlockAudio(); showMenuPanel("load"); });
  bind("btn-new-slot-back", () => showMenuPanel("home"));
  bind("btn-new-back", () => showMenuPanel("new-slot"));
  bind("btn-load-back", () => showMenuPanel("home"));
  bind("btn-start-new", () => { startNewGameFromMenu(); });
  bind("btn-to-menu", () => { returnToMainMenu(); });
  bind("btn-load-player", () => { unlockAudio(); startNewGameFromMenu(); });
  bind("btn-new-game", () => { startNewGameFromSetup(); });
  bind("btn-start-run", continueOrStartRun);
  bind("btn-pause", togglePause);
  bind("btn-restart", restartRun);
  bind("btn-save-score", saveScore);
  bind("btn-gameover-run", () => { clearActiveRun(); startRun(); });
  bind("btn-gameover-upgrade", goToUpgrades);
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
    if (!isTypingInForm()) {
      if ((k === "w" || k === "arrowup") && game.isRunning) useEquippedAbility(0);
      if ((k === "s" || k === "arrowdown") && game.isRunning) useEquippedAbility(1);
    }
    if (e.key.toLowerCase() === "f") toggleFullscreen();
    if (e.key.toLowerCase() === "u" && !$("game-section").classList.contains("hidden")) {
      if (document.activeElement?.tagName === "INPUT") return;
      toggleUpgrades();
    }
    if (e.key === "Escape") {
      const sec = $("upgrade-section");
      if (sec && !sec.classList.contains("hidden")) {
        e.preventDefault();
        hideUpgrades();
        return;
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
  const slots = [0, 1].map((i) => getEquippedAbilityAtSlot(i)).filter(Boolean);
  const eq = slots.map((a) => a.name).join(", ") || "–";
  const keyHint = "<kbd>W</kbd>/<kbd>S</kbd> (<kbd>↑</kbd>/<kbd>↓</kbd>) Spezial";
  const moveHint = "<kbd>A</kbd>/<kbd>D</kbd> (<kbd>←</kbd>/<kbd>→</kbd>) Bewegen";
  const action = cls.attackType === "melee" ? "Schwert" : cls.attackType === "ranged" ? "Schießen" : "Zaubern";
  hint.innerHTML = moveHint + " | <kbd>Maus</kbd> = <strong>" + action + "</strong> | " + keyHint + " (" + eq + ") | <kbd>U</kbd> Upgrades &amp; Fähigkeiten";
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
  game.particles.push({
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
    localStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify({ version: 2, slots }));
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

function saveLocalPlayer() {
  if (!game.playerName) return;
  const i = Math.max(0, Math.min(MAX_SAVE_SLOTS - 1, game.slotIndex | 0));
  const slots = loadSaveSlots();
  slots[i] = {
    name: game.playerName,
    classKey: game.classKey,
    totalGold: Math.max(0, Math.floor(Number(game.totalGold) || 0)),
    upgrades: { ...emptyUpgrades(), ...(game.upgrades || {}) },
    savedAt: Date.now()
  };
  persistSaveSlots(slots);
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
}

function clearSaveSlot(slotIndex) {
  const i = Math.max(0, Math.min(MAX_SAVE_SLOTS - 1, slotIndex | 0));
  const slots = loadSaveSlots();
  const old = slots[i];
  slots[i] = null;
  persistSaveSlots(slots);
  if (old && old.name) clearActiveRun(old.name);
  clearActiveRun(slotRunKey(i));
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
  const panels = ["menu-home", "menu-new-slot", "menu-new", "menu-load"];
  panels.forEach((id) => {
    const el = $(id);
    if (!el) return;
    el.classList.toggle("hidden", id !== which);
  });
  if (which === "home") renderHomeSlotPreview();
  if (which === "load") renderSaveSlotList();
  if (which === "new-slot") renderNewSlotPicker();
  if (which === "new") {
    const lab = $("new-slot-label");
    if (lab) lab.textContent = "Slot " + (pendingSlotIndex + 1);
    updateHeroCardUI();
    renderSetupAbilityHint();
  }
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
  return "<div class=\"save-slot-main\">" +
    "<strong class=\"save-slot-name\">Slot " + n + " · " + escapeHtml(data.name) + "</strong>" +
    "<span class=\"save-slot-class\">" + escapeHtml(cls.name) + "</span></div>" +
    "<div class=\"save-slot-meta\">" +
      "<span>🪙 " + (data.totalGold || 0) + "</span>" +
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
    list.appendChild(btn);
  }
  if (hint) {
    hint.textContent = filled
      ? filled + " von " + MAX_SAVE_SLOTS + " Slots belegt – Tippen lädt direkt in den Run."
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
      ? filled + " von " + MAX_SAVE_SLOTS + " Slots belegt. Laden = direkt weiter · Neu = Heldenwahl."
      : "Neues Spiel → Heldenwahl · Bis zu 3 Spielstände möglich.";
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
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function loadRunStore() {
  try {
    const raw = localStorage.getItem(RUN_STORAGE_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw);
    // Migration: altes Einzel-Objekt → Store
    if (data && data.version === RUN_SAVE_VERSION && data.playerName && data.hero) {
      const key = playerStorageKey(data.playerName);
      return key ? { [key]: data } : {};
    }
    return data && typeof data === "object" ? data : {};
  } catch (_) {
    return {};
  }
}

function peekActiveRun() {
  const last = getLastPlayerName();
  if (last) {
    const forLast = loadActiveRunFor(last);
    if (forLast) return forLast;
  }
  const store = loadRunStore();
  const keys = Object.keys(store);
  if (!keys.length) return null;
  const data = store[keys[0]];
  if (!data || data.version !== RUN_SAVE_VERSION || !data.playerName || !data.hero) return null;
  return data;
}

function loadActiveRunFor(name) {
  const key = playerStorageKey(name);
  if (!key) return null;
  const data = loadRunStore()[key];
  if (!data || data.version !== RUN_SAVE_VERSION || !data.hero) return null;
  return data;
}

function clearActiveRun(name) {
  runSaveDirty = false;
  const key = playerStorageKey(name || game.playerName);
  try {
    if (!key) {
      localStorage.removeItem(RUN_STORAGE_KEY);
    } else {
      const store = loadRunStore();
      delete store[key];
      if (Object.keys(store).length) localStorage.setItem(RUN_STORAGE_KEY, JSON.stringify(store));
      else localStorage.removeItem(RUN_STORAGE_KEY);
    }
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
  const payload = {
    version: RUN_SAVE_VERSION,
    buildId: BUILD_ID,
    savedAt: Date.now(),
    playerName: game.playerName,
    slotIndex: game.slotIndex | 0,
    classKey: game.classKey,
    dungeonLevel: game.dungeonLevel,
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
    localStorage.setItem(RUN_STORAGE_KEY, JSON.stringify(store));
    runSaveDirty = false;
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
  game.classKey = normalizeClassKey(data.classKey || game.classKey);
  selectClass(game.classKey);
  game.dungeonLevel = Math.max(1, Math.floor(Number(data.dungeonLevel) || 1));
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

function updateRunButtons() {
  const startBtn = $("btn-start-run");
  if (!startBtn) return;
  const run = game.playerName ? loadActiveRunFor(game.playerName) : peekActiveRun();
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
  game.upgrades = { ...emptyUpgrades(), ...(data.upgrades || {}) };
  if (Number.isFinite(data.slotIndex)) game.slotIndex = data.slotIndex;
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
  syncUnlockedAbilities();
  const run = loadActiveRunFor(slot.name) || loadActiveRunFor(slotRunKey(slotIndex));
  const msg = run
    ? "Slot " + (slotIndex + 1) + ": " + slot.name + " – Dungeon " + run.dungeonLevel
    : "Slot " + (slotIndex + 1) + ": " + slot.name + " geladen";
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
  document.querySelectorAll(".class-btn").forEach((b) => b.classList.toggle("selected", b.dataset.class === k));
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
  return COMBAT_LAYOUT.heroMoveMinX ?? 24;
}

function getHeroMaxX(h) {
  const overflow = COMBAT_LAYOUT.heroEdgeOverflowRight ?? 0.5;
  const edgeMax = CW - h.w * (1 - overflow);
  const moveMax = COMBAT_LAYOUT.heroMoveMaxX ?? 300;
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
  $("gameover-panel").classList.add("hidden");
  $("game-frame").classList.remove("hidden");
  $("btn-start-run").disabled = true;
  $("btn-pause").disabled = false;
  $("btn-restart").disabled = false;
  $("btn-pause").textContent = "Pause (P)";
  safeSpawnWave();
  game.combatReady = true;
  playWorldMusic(getWorld());
  addLog("Run gestartet – Level 1. Stirbst du? Upgrades kaufen!");
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

function continueOrStartRun() {
  unlockAudio();
  if (game.isRunning && !game.isDead) {
    ensureGameLoop();
    return;
  }
  const existing = game.playerName ? loadActiveRunFor(game.playerName) : null;
  if (existing) {
    resumeRun(existing);
    return;
  }
  startRun();
}

function resetRun() {
  game.dungeonLevel = 1; game.runGold = 0; game.runXp = 0; game.playerLevel = 1;
  game.monstersDefeated = 0; game.combatLog = []; game.bestLoot = null;
  game.enemies = []; game.projectiles = []; game.particles = []; game.coins = [];
  game.meleeSlashes = []; game.attackEffects = []; game.screenShake = 0;
  game.scrollX = 0; game.specialTimer = 0; game.waveCooldown = 0;
  game.waveNumber = 0; game.currentWave = null;
  game.waveIntro = false; game.combatReady = true;
  game.worldParticles = [];
  game.bossIntro = null; game.abilityCastLock = 0;
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

function showUpgrades() {
  $("gameover-panel").classList.add("hidden");
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
  game.isPaused = !game.isPaused;
  $("btn-pause").textContent = game.isPaused ? "Weiter (P)" : "Pause (P)";
  if (game.isPaused) {
    saveActiveRun(true);
    if (game.playerName) saveLocalPlayer();
    stopLoop();
  } else {
    startLoop();
  }
}

// ============================================
// HELD
// ============================================

function createHero() {
  const cls = CLASSES[game.classKey], u = game.upgrades || emptyUpgrades();
  const ub = (key) => {
    const up = UPGRADES.find((x) => x.key === key);
    return (u[key] || 0) * up.bonus;
  };
  game.hero = {
    x: COMBAT_LAYOUT.heroCombatX,
    y: GROUND - HR.displayH(), vx: 0, vy: 0,
    w: HR.displayW(), h: HR.displayH(),
    maxHp: cls.hp + ub("upgrade_health"),
    hp: cls.hp + ub("upgrade_health"),
    attack: cls.attack + ub("upgrade_attack"),
    defense: cls.defense + ub("upgrade_defense"),
    crit: cls.crit + ub("upgrade_crit"),
    magicDamage: cls.magicDamage + ub("upgrade_magic"),
    maxMana: cls.mana + ub("upgrade_mana"),
    mana: cls.mana + ub("upgrade_mana"),
    goldBonus: 1 + ub("upgrade_gold"),
    xpBonus: 1 + ub("upgrade_xp"),
    specialCd: Math.max(2.5, cls.specialCd - ub("upgrade_cooldown")),
    specialTimer: 0,
    /** Individuelle Cooldowns pro ausgerüsteter Fähigkeit */
    abilityCds: {},
    warriorBuff: 0,
    warriorBuffMult: 1,
    shieldTimer: 0,
    shieldReduction: 0,
    lootBonuses: { attack:0, hp:0, defense:0, crit:0, goldBonus:0, magicDamage:0, mana:0 },
    /** Modulare Ausrüstung – überschreibt Loadout-Teile (Helm, Waffe, Schild …) */
    equipment: null,
    facing: 1, anim: 0, hitFlash: 0, attackAnim: 0, hurtAnim: 0,
    animState: "idle", animFrame: 0, animTime: 0, deathAnim: false, deathDone: false
  };
  pinCharToGround(game.hero);
  $("hud-mana-wrap").classList.toggle("hidden", game.classKey !== "mage");
  initHeroAbilityCds(game.hero);
}

/** Cooldown-Timer für alle Klassen-Fähigkeiten initialisieren */
function initHeroAbilityCds(h) {
  h.abilityCds = {};
  getClassAbilities(game.classKey).forEach((ab) => {
    h.abilityCds[ab.id] = ab.cd * 0.4;
  });
}

function heroStats() {
  const h = game.hero, lb = h.lootBonuses;
  return {
    attack: h.attack + lb.attack, defense: h.defense + lb.defense,
    crit: Math.min(0.55, h.crit + lb.crit),
    magicDamage: h.magicDamage + lb.magicDamage,
    maxHp: h.maxHp + lb.hp, maxMana: h.maxMana + lb.mana,
    goldBonus: h.goldBonus + lb.goldBonus
  };
}

function getWorld() {
  let w = WORLDS[0];
  for (const x of WORLDS) if (game.dungeonLevel >= x.min) w = x;
  return w;
}

// Schwierigkeit skaliert mit Dungeon-Level & Welt – Meta-Upgrades helfen spürbar mit
function getScaledLevel(lv) {
  if (lv <= 14) return lv;
  return 14 + Math.pow(lv - 14, 0.82);
}

function getMetaEase() {
  const total = Object.values(game.upgrades).reduce((s, v) => s + (v || 0), 0);
  return Math.max(0.72, 1 - total * 0.011);
}

function getDifficultyScale() {
  const lv = getScaledLevel(game.dungeonLevel);
  const world = getWorld();
  const levelMult = Math.pow(BALANCE.levelScalePow, lv);
  return levelMult * world.hpMult * getMetaEase();
}

function getAttackScale() {
  const lv = getScaledLevel(game.dungeonLevel);
  const world = getWorld();
  const atkPow = BALANCE.levelScalePow - 0.032;
  return Math.pow(atkPow, lv) * world.atkMult * getMetaEase();
}

function getBossMult(isBoss) {
  if (!isBoss) return { hp: 1, atk: 1, rew: 1 };
  const lv = game.dungeonLevel;
  const ease = lv <= 10 ? 0.82 : lv <= 25 ? 0.92 : lv <= 50 ? 1.0 : 1.08;
  return { hp: 5.2 * ease, atk: 2.25 * ease, rew: 3.8 };
}

function getEnemyStats(isBoss) {
  const lv = game.dungeonLevel;
  const world = getWorld();
  const hpScale = getDifficultyScale();
  const atkScale = getAttackScale();
  const boss = getBossMult(isBoss);
  const worldEase = world.danger === 1 ? 0.74 : world.danger === 2 ? 0.86 : world.danger === 3 ? 0.93 : world.danger === 4 ? 0.97 : 1;
  const lvEase = lv <= 14 ? 0.76 : lv <= 26 ? 0.84 : lv <= 40 ? 0.91 : 1;
  const early = getEarlyEase();
  const earlyHp = 1 - BALANCE.earlyHpEase * early;
  const earlyAtk = 1 - BALANCE.earlyAtkEase * early;
  const hpEase = lv <= 14 ? 0.88 : lv <= 26 ? 0.94 : 1;

  return {
    hp: Math.floor((24 + lv * 3.1) * hpScale * boss.hp * earlyHp * hpEase),
    attack: Math.max(1, Math.floor((3 + lv * 0.78) * atkScale * boss.atk * worldEase * lvEase * earlyAtk)),
    gold: Math.floor((5 + lv * 1.55) * boss.rew * (1 + lv * 0.034)),
    xp: Math.floor((11 + lv * 2.45) * boss.rew),
    speed: (isBoss ? 0.52 : 0.72) * world.speedMult + lv * 0.009,
    attackInterval: Math.max(0.64, 1.12 - lv * 0.0035 - world.danger * 0.026)
  };
}

function getWaveSize() {
  const lv = game.dungeonLevel;
  const d = getWorld().danger;
  const size = 2 + Math.floor(lv / 3) + Math.max(0, d - 2);
  return Math.min(6, Math.max(2, size));
}

function getUpgradeTip() {
  const tips = {
    warrior: "Krieger: Leben → Verteidigung → Angriff → Spezial-CD",
    ranger:  "Waldläufer: Angriff → Krit → Leben → Gold-Farm",
    mage:    "Magier: Magieschaden → Mana → Leben → Spezial-CD"
  };
  return tips[game.classKey] || "";
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
  const count = getWaveSize();
  const isBoss = game.dungeonLevel % 10 === 0 && game.dungeonLevel > 0;
  const world = getWorld();
  onWaveSpawn(isBoss, count);
  startWaveIntro();
  let bossEnemy = null;
  for (let i = 0; i < count; i++) {
    const e = spawnEnemy(isBoss && i === 0, i);
    if (e && e.isBoss) bossEnemy = e;
  }
  if (bossEnemy) startBossIntro(bossEnemy);
  if (isBoss) addLog("⚠ BOSS: " + (bossEnemy?.name || "Unbekannt") + "! Gefahr " + world.danger + "/5", "boss");
  else if (world.danger >= 3) addLog("Gefahr " + world.danger + "/5 – " + count + " Gegner!", "damage");
  else addLog(count + " Gegner (Lv." + game.dungeonLevel + ")");
}

function spawnEnemy(isBoss, index) {
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
  const stats = getEnemyStats(isBoss);
  const ai = getEnemyAI(name, isBoss);
  const idx = index || 0;
  const ew = packSize ? packSize.w : spriteCharW(sp);
  const eh = packSize ? packSize.h : spriteCharH(sp);

  const enemy = {
    id: ++enemyId, name, sprite: spKey, isBoss, index: idx,
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
  if (game.currentWave) game.currentWave.enemies.push({ name, isBoss });
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

function renderWorldAtmosphere(world) {
  const pal = WR_PALETTES[world.theme];
  if (!pal) return;
  const fogCol = pal.fog || world.fog || "rgba(0,0,0,0.3)";
  const fogGrad = ctx.createLinearGradient(0, GROUND - 30, 0, GROUND + 20);
  fogGrad.addColorStop(0, "rgba(0,0,0,0)");
  fogGrad.addColorStop(0.6, fogCol);
  fogGrad.addColorStop(1, world.fog2 || fogCol);
  ctx.fillStyle = fogGrad;
  ctx.fillRect(0, GROUND - 30, CW, 50);
}

// ============================================
// KAMPF – KLASSEN-SPEZIFISCH
// ============================================

function attack() {
  if (!game.isRunning || game.isPaused || game.isDead || !game.hero) return;
  const cls = CLASSES[game.classKey];
  const now = performance.now();
  if (now - game.lastShot < cls.attackRate) return;

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
  h.attackAnim = 0.14;

  let hitAny = false;
  forEachEnemyInRange(cls.range, (e, ex, ey) => {
    let dmg = st.attack;
    if (e.id !== target.id) dmg = Math.floor(dmg * (cls.aoeFalloff || 1));
    const isCrit = Math.random() < st.crit;
    if (isCrit) dmg *= 2;
    dmg = Math.floor(dmg);
    e.hp -= dmg; e.hitFlash = 8;
    spawnDamage(ex, e.y, dmg, isCrit);
    spawnImpactRing(ex, ey, 16, isCrit ? "#f1c40f" : "#ecf0f1", 10);
    emitCombatEvent("enemy_hit");
    if (e.hp <= 0 && !e.dead) { e.dead = true; onEnemyKill(e); }
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
  if (isCrit) dmg *= 2;

  game.projectiles.push({
    x: hx, y: hy, vx: (dx / len) * cls.projSpeed, vy: (dy / len) * cls.projSpeed,
    dmg: Math.floor(dmg), crit: isCrit, sprite: cls.proj,
    life: 70, owner: "player", pierce: false, trail: "#2ecc71"
  });
  h.facing = dx >= 0 ? 1 : -1;
  h.attackAnim = 0.1;
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
    const isCrit = Math.random() < st.crit;
    if (isCrit) dmg *= 2;
    const angle = getPrimaryMeleeAngle(Math.atan2(dy, dx));
    let hitAny = false;
    forEachEnemyInRange(55, (e, ex, ey) => {
      e.hp -= dmg; e.hitFlash = 6;
      spawnDamage(ex, e.y, dmg, isCrit);
      spawnImpactRing(ex, ey, 14, "#9b59b6", 8);
      emitCombatEvent("enemy_hit");
      if (e.hp <= 0 && !e.dead) { e.dead = true; onEnemyKill(e); }
      hitAny = true;
    });
    spawnMeleeSlash(hx, hy, angle, { life: 10, range: 55, owner: "player" });
    spawnMeleeSlash(hx, hy, angle + Math.PI, { life: 8, range: 48, owner: "player" });
    spawnBurst(hx, hy, "#8e44ad", 4, 2);
    h.attackAnim = 0.12;
    emitCombatEvent("player_staff");
    if (hitAny) addLog("Kein Mana – Stab-Schlag!");
    return hitAny;
  }

  h.mana -= cls.manaPerShot;
  let dmg = st.magicDamage;
  const isCrit = Math.random() < st.crit;
  if (isCrit) dmg *= 2;
  const len = dist || 1;

  game.projectiles.push({
    x: hx, y: hy, vx: (dx / len) * cls.projSpeed, vy: (dy / len) * cls.projSpeed,
    dmg: Math.floor(dmg), crit: isCrit, sprite: cls.proj,
    life: 65, owner: "player", magic: true, trail: "#e74c3c"
  });
  h.attackAnim = 0.1;
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
    timer: 2.8
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
  let dmg = Math.floor(rawDmg);
  if ((e.weakTimer || 0) > 0 && e.damageTakenMult) dmg = Math.floor(dmg * e.damageTakenMult);
  if (o.critRoll && Math.random() < o.critRoll) { dmg = Math.floor(dmg * 2); o.crit = true; }
  e.hp -= dmg;
  e.hitFlash = o.big ? 10 : 7;
  spawnDamage(e.x + e.w / 2, e.y, dmg, {
    crit: o.crit, magic: o.magic, boss: e.isBoss
  });
  spawnImpactRing(e.x + e.w / 2, e.y + e.h / 2, o.ring || 18, o.color || "#ecf0f1", 10);
  emitCombatEvent("enemy_hit");
  if (o.crit) { game.critFlash = 0.12; game.screenShake = Math.max(game.screenShake, 4); }
  if (e.hp <= 0 && !e.dead) { e.dead = true; onEnemyKill(e); }
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

  h.attackAnim = 0.18;
  game.abilityCastLock = 0.4;
  addLog(ab.name + "!", "magic");
  emitCombatEvent(getClassSpecialSound(game.classKey));
  spawnBurst(hx, hy, ab.particle || ab.color, 10, 4);
  game.screenShake = Math.max(game.screenShake, ab.type === "aoe_ground" ? 5 : 3);

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
        game.particles.push({
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

/** Cooldowns & Buffs – kein Auto-Cast */
function updateAbilityState(dt, h) {
  if (game.abilityCastLock > 0) game.abilityCastLock -= dt;
  if (h.warriorBuff > 0) h.warriorBuff -= dt;
  Object.keys(h.abilityCds).forEach((k) => { h.abilityCds[k] += dt; });
}

function useEquippedAbility(slotIdx) {
  const h = game.hero;
  if (!h || game.isPaused || !game.isRunning || game.isDead || game.abilityCastLock > 0) return;
  const ab = getEquippedAbilityAtSlot(slotIdx);
  if (!ab) return;
  const st = heroStats();
  const cd = getEffectiveAbilityCd(ab);
  if ((h.abilityCds[ab.id] || 0) < cd) return;
  if (!canCastAbility(ab, h, st)) return;
  if (castAbility(ab, h, st)) h.abilityCds[ab.id] = 0;
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
  game.scrollX += dt * 40;
  h.specialTimer += dt;
  h.anim += dt * 8;
  if (h.hitFlash > 0) h.hitFlash -= dt * 30;
  if (h.attackAnim > 0) h.attackAnim -= dt * 4;
  if (h.hurtAnim > 0) h.hurtAnim -= dt * 3;
  if (h.shieldTimer > 0) h.shieldTimer -= dt;
  if (game.screenShake > 0) game.screenShake = Math.max(0, game.screenShake - dt * 28);
  if (game.critFlash > 0) game.critFlash = Math.max(0, game.critFlash - dt * 2.5);
  if (game.zoomPulse > 0) game.zoomPulse = Math.max(0, game.zoomPulse - dt * 0.06);
  updateBossIntro(dt);

  const moveLeft = keys.a || keys.arrowleft;
  const moveRight = keys.d || keys.arrowright;
  const heroMoving = !!(game.isRunning && !game.isPaused && !game.isDead && (moveLeft || moveRight));
  if (game.isRunning && !game.isPaused && !game.isDead) {
    const spd = CLASSES[game.classKey].moveSpeed;
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
      game.particles.push({ x: p.x, y: p.y, vx: 0, vy: 0, life: 8, color: p.trail, size: 2 });
    }
    if (p.life <= 0) return false;
    if (p.owner === "enemy") {
      const h = game.hero;
      if (h && p.x > h.x && p.x < h.x + h.w && p.y > h.y && p.y < h.y + h.h) {
        const st = heroStats();
        let dmg = applyShieldToDamage(h, calcPlayerDamage(p.dmg, st.defense));
        h.hp -= dmg;
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
          e.hp -= p.dmg; e.hitFlash = 6;
          spawnDamage(vb.cx, vb.y, p.dmg, {
            crit: p.crit, magic: p.magic, boss: e.isBoss
          });
          spawnImpactRing(vb.cx, vb.y + vb.h / 2, p.big ? 24 : 14, p.crit ? "#f1c40f" : (p.magic ? "#5dade2" : "#ecf0f1"), 10);
          emitCombatEvent("enemy_hit");
          /** Giftpfeil: Schaden über Zeit */
          if (p.poison && e.hp > 0) {
            const dot = Math.floor(p.dmg * (p.poisonMult || 0.25));
            for (let t = 1; t <= p.poison; t++) {
              setTimeout(() => {
                if (e.dead || e.hp <= 0) return;
                e.hp -= dot;
                spawnDamage(e.x + e.w / 2, e.y, dot, { magic: true });
                if (e.hp <= 0 && !e.dead) { e.dead = true; onEnemyKill(e); }
              }, t * 400);
            }
          }
          if (p.explosive) {
            const rad = p.explosiveRadius || 90;
            spawnExplosion(p.x, p.y, rad, !p.fromAbility);
            game.enemies.forEach((o) => {
              if (!isEnemyOnScreen(o) || o.walkingIn || o.dead || o.hp <= 0) return;
              if (Math.hypot(o.x + o.w/2 - p.x, o.y + o.h/2 - p.y) < rad) {
                o.hp -= Math.floor(p.dmg * 0.48); o.hitFlash = 5;
                if (o.hp <= 0 && !o.dead) { o.dead = true; onEnemyKill(o); }
              }
            });
          }
          if (e.hp <= 0 && !e.dead) { e.dead = true; onEnemyKill(e); }
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

  updateHUD();
  updateStatus();
}

function onEnemyKill(e) {
  const st = heroStats();
  const gold = Math.floor(e.goldReward * st.goldBonus);
  const xp = Math.floor(e.xpReward * game.hero.xpBonus);
  const oldWorld = getWorld();
  game.runXp += xp;
  game.monstersDefeated++; game.dungeonLevel++;
  const newWorld = getWorld();
  if (newWorld.name !== oldWorld.name) {
    initWorldBackground();
    startWorldTransition(newWorld);
    addLog("⚠ NEUE WELT: " + newWorld.name + " – härter, aber machbar!", "boss");
    playWorldMusic(newWorld);
    emitCombatEvent("world_change");
  }
  addLog(e.name + " besiegt!", e.isBoss ? "boss" : "damage");
  addMetaXp(2);
  spawnCoinDrop(gold, e.x + e.w / 2, e.y + e.h / 2);
  for (let i = 0; i < 5; i++) game.particles.push({ x:e.x+e.w/2, y:e.y+e.h/2, vx:(Math.random()-0.5)*3, vy:-Math.random()*4, life:20, color:"#f1c40f", size:2 });

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
  clearActiveRun();
  if (game.hero) { game.hero.deathAnim = true; game.hero.animState = "death"; game.hero.animFrame = 0; }
  game.totalGold = Math.max(0, Math.floor(Number(game.totalGold) || 0) + Math.floor(Number(game.runGold) || 0));
  addMetaXp(Math.floor(game.playerLevel * 1.5) + Math.floor(game.monstersDefeated / 5));
  saveMeta();
  savePlayer();
  addLog("Game Over!", "death");
  let deathT = 0;
  function deathFrame(now) {
    deathT += 16;
    if (game.hero && typeof HR !== "undefined") HR.updateAnim(game.hero, 0.016, false);
    render();
    if (deathT < 900 && game.hero && !game.hero.deathDone) { requestAnimationFrame(deathFrame); return; }
    game.isRunning = false;
    stopLoop();
    showGameOver();
  }
  requestAnimationFrame(deathFrame);
}

function showGameOver() {

  const world = getWorld();
  emitCombatEvent("game_over");
  $("gameover-panel").classList.remove("hidden");
  $("gameover-summary").textContent =
    "Level " + game.dungeonLevel + " · " + world.name + "\n" +
    game.monstersDefeated + " Monster besiegt · " + game.runGold + " Gold";
  $("final-score").textContent = calcScore();
  $("gameover-tip").textContent = getUpgradeTip();
  $("save-hint").textContent = "";
  $("btn-start-run").disabled = false;
  $("btn-pause").disabled = true;
  updateTotalGold(); renderUpgradeButtons(); renderAbilityPanel();
  renderSetupAbilityHint();
  updateRunButtons();
  tryMenuMusic();
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

  game.particles.push({
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

  // Treffer-Ringe & Explosionen (hinten)
  game.attackEffects.forEach((fx) => {
    const t = fx.life / fx.maxLife;
    if (fx.type === "ring") {
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

  // Nahkampf-Schläge (Spieler + Gegner)
  game.meleeSlashes.forEach((s) => {
    const maxLife = s.maxLife || (s.big ? 20 : 14);
    drawPremiumSlashFx(ctx, s);
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.angle);
    ctx.globalAlpha = (s.life / maxLife) * (s.big ? 0.95 : 0.8);
    const sc = s.big ? 2.5 : 1.8;
    const sp = s.owner === "enemy" ? SPRITES.enemy_slash : SPRITES.slash;
    drawSprite(ctx, sp, s.range * 0.35, -6 * sc, false);
    ctx.restore();
  });

  // Gegner
  game.enemies.forEach((e) => {
    if (e.hp <= 0) return;
    const bob = 0;
    const drawX = getEnemyDrawX(e);
    const vb = getEnemyVisualBounds(e, drawX);
    ctx.save();
    if (e.hitFlash > 0) ctx.globalAlpha = 0.5 + Math.sin(e.hitFlash) * 0.3;
    if (e.attackWindup > 0) {
      ctx.shadowColor = "#e74c3c";
      ctx.shadowBlur = 6 + e.attackWindup * 10;
    }
    drawLivingChar(ctx, e.sprite, drawX, e.y, e.w, e.h, true, world, bob, e.isBoss);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    ctx.restore();
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

  // Reichweiten-Anzeige nur bei Ziel unter Maus
  const hovered = getHoveredEnemy(CLASSES[game.classKey].range);
  if (game.isRunning && !game.isPaused && hovered) {
    const cls = CLASSES[game.classKey];
    const vb = getEnemyVisualBounds(hovered);
    const tx = vb.cx, ty = vb.y + vb.h / 2;
    ctx.strokeStyle = cls.attackType === "melee" ? "rgba(241,196,15,0.55)" : "rgba(46,204,113,0.45)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(hx, hy, cls.range, 0, Math.PI * 2);
    ctx.strokeStyle = cls.attackType === "melee" ? "rgba(231,76,60,0.25)" : "rgba(46,204,113,0.18)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  ctx.save();
  // Kein weißes/rotes Hitbox-Rechteck – Treffer-Feedback nur am Sprite (HR) + Hurt-Pose
  drawHero(ctx, h, 0, atkOff, hurtOff, world);
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

  /** Ausgerüstete Fähigkeiten – CD-Anzeige am Helden (Taste W / S) */
  // Ability status lives in sidebar loadout – no floating debug text over hero
  if (false && game.isRunning) {
    ctx.font = "bold 8px Courier New";
    [0, 1].forEach((slotIdx) => {
      const ab = getEquippedAbilityAtSlot(slotIdx);
      if (!ab) return;
      const left = Math.max(0, getEffectiveAbilityCd(ab) - (h.abilityCds[ab.id] || 0));
      ctx.fillStyle = left <= 0 ? "rgba(46,204,113,0.95)" : "rgba(200,160,255,0.85)";
      const label = getAbilityKeyLabel(slotIdx) + ":" + ab.name.substring(0, 5) + (left <= 0 ? " ✓" : " " + Math.ceil(left) + "s");
      ctx.fillText(label, h.x, h.y - 18 - slotIdx * 10);
    });
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
      const left = Math.max(0, getEffectiveAbilityCd(ab) - (h.abilityCds[ab.id] || 0));
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
  const lv = game.upgrades[k] || 0;
  if (lv >= BALANCE.upgradeMax) return Infinity;
  return Math.floor(up.baseCost * Math.pow(BALANCE.upgradeCostPow, lv));
}

function isUpgradeRelevant(up) {
  if (up.forClass === "all") return true;
  return up.forClass.split(",").includes(game.classKey);
}

function renderUpgradeButtons() {
  const grid = $("upgrade-grid"); if (!grid) return;
  grid.innerHTML = "";

  const tipEl = $("upgrade-tip");
  if (tipEl) tipEl.textContent = getUpgradeTip();

  UPGRADES.forEach((up) => {
    const lv = game.upgrades[up.key] || 0;
    const cost = getUpgradeCost(up.key);
    const maxed = lv >= BALANCE.upgradeMax;
    const relevant = isUpgradeRelevant(up);
    let tipText = up.tip;
    if (up.key === "upgrade_cooldown" && !maxed) {
      const next = getNextCdAbilityUnlock(game.classKey, lv);
      const nextCd = getNextAbilityUnlockCdLevel(lv);
      if (next && nextCd != null) tipText += " · Nächste: " + next.name + " (CD " + nextCd + ")";
    }
    const btn = document.createElement("button");
    btn.className = "upgrade-btn" + (relevant ? " relevant" : "") + (maxed ? " maxed" : "");
    btn.disabled = maxed || getSpendableGold() < cost;
    btn.innerHTML =
      '<span class="upgrade-info">' +
        '<span class="upgrade-name">' + up.label + (relevant ? " ★" : "") + '</span>' +
        '<span class="upgrade-level">Stufe ' + lv + (maxed ? " MAX" : "") + ' – ' + up.bonusText + '</span>' +
        '<span class="upgrade-tip-text">' + tipText + '</span>' +
      '</span>' +
      '<span class="upgrade-cost">' + (maxed ? "MAX" : cost + " 🪙") + '</span>';
    btn.onclick = () => buyUpgrade(up.key);
    grid.appendChild(btn);
  });
}

async function buyUpgrade(k) {
  const cost = getUpgradeCost(k);
  if (getSpendableGold() < cost || (game.upgrades[k] || 0) >= BALANCE.upgradeMax) return;
  const prevCd = getSpecialCdLevel();
  const prevUnlocked = getUnlockedAbilityIds(game.classKey, prevCd);
  spendGold(cost);
  game.upgrades[k] = (game.upgrades[k] || 0) + 1;
  const up = UPGRADES.find((u) => u.key === k);
  addLog("Upgrade: " + up.label + " Stufe " + game.upgrades[k]);
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
function calcScore() { return game.dungeonLevel*100 + game.monstersDefeated*50 + game.runGold + game.playerLevel*200; }

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
    gold: game.runGold,
    player_level: game.playerLevel
  };
  saveLocalScore(entry);
  $("save-hint").textContent = "Score lokal gespeichert!";
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
