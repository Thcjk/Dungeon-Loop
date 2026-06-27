/* ============================================
   Dungeon Loop – Pixel Canvas Edition
   Maus über Canvas = Auto-Angriff | 1 = Spezial
   A/D = Vor/Zurück | P = Pause
   ============================================ */

const SUPABASE_URL = "DEINE_SUPABASE_URL";
const SUPABASE_KEY = "DEIN_SUPABASE_KEY";
let supabase = null;

// --- Canvas ---
const PIXEL = 3;
const CHAR_PIXEL = 3;
const WEAPON_PIXEL = 2;
const DECOR_PIXEL = 5;
const BG_PIXEL = 6;
const CW = 640, CH = 360;
const GROUND = 308;
const CAM_ZOOM = 1.38;
const COMBAT_LAYOUT = {
  heroCombatX: 78,
  heroMinX: 20,
  heroMaxX: 320,
  enemyRightMargin: 205,
  enemySpacing: 50,
  enemyMeleeReach: 52,
  enemyBossReach: 68,
  introSpeed: 82,
  introOffscreen: 55,
  enemyChaseSpeed: 102,
  enemyBossChaseSpeed: 84,
  enemySeparation: 18,
  screenEdgePad: 8,
  minVisiblePx: 14
};
const CAM_AX = CW / 2;
const CAM_AY = GROUND;
let canvas, ctx;
let mouse = { x: CW / 2, y: CH / 2, down: false, onCanvas: false };
let keys = {};

function applyCamera(c) {
  c.translate(CAM_AX, CAM_AY);
  c.scale(CAM_ZOOM, CAM_ZOOM);
  c.translate(-CAM_AX, -CAM_AY);
}

function getAim() {
  return {
    x: (mouse.x - CAM_AX) / CAM_ZOOM + CAM_AX,
    y: (mouse.y - CAM_AY) / CAM_ZOOM + CAM_AY,
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
  warrior: [
    ".....KKKKKK.....","....KHHHHHHK....","...KHyyyyyyHK...","...KHsyyySsyHK..",
    "...KHyyyyyyHK...","...KHHHooHHHK...","....KHDDDDHK....","....KHDGGDHK....",
    "....KHo..oHK....","....KDGGGGDK....","....KDGGGGDK....","....KD...DK.....",
    "....KD...DK.....","....KK...KK....."
  ],
  ranger: [
    "....KKKKKK....","...KlGGGGlK...","..KlGGGGGGlK..","..KlGssSSslK..",
    "..KlGGGGGGlK..","..KlGGllGGlK..","...KlGGGGlK...","...KlGooGlK...",
    "....KlGGlK....","....KgGGgK....","....Kg..gK....","....Kg..gK....",
    "....KK..KK...."
  ],
  mage: [
    "....KKKKKK....","...KuPPPPuK...","..KuPPPPPPuK..","..KuPssSSPuK..",
    "..KuPPPPPPuK..","..KuPPBBPPuK..","...KuPPPPuK...","...KuPooPuK...",
    "....KuPPuK....","....KpBBpK....","....Kp..pK....","....Kp..pK....",
    "....KK..KK...."
  ],
  shield: [
    "....KKKK....","...KWWWWK...","..KWwSSwWK..","..KWSSSSWK..",
    "..KWSSSSWK..","...KWWWWK...","....KDDK....",".....KK....."
  ],
  sword: [
    ".....K.....","....KwK....","....KWWK....","....KWWK....",
    "....KWWK....","....KWWK....","....KWWK....","....KwWK....",
    "....KDDK....",".....KK....."
  ],
  sword_heavy: [
    ".....K.....","....KWWK....","...KWWWWK...","...KWWWWK...",
    "...KWWWWK...","...KWWWWK...","....KwWWK...","....KDDDK...",
    ".....KK....."
  ],
  bow: [
    ".....K.....","....KyK....","...Ky.wyK..","..Ky...wyK.",
    "..Ky.....wyK","...Ky.wyK..","....KyK....",".....K....."
  ],
  bow_aim: [
    ".....K.....","....KyK....","...KyywyK..","..KyyyyyK..",
    ".KyyywyyyyK","..KyyyyyK..","...KyywyK..","....KyK....",
    ".....K....."
  ],
  staff: [
    "....KiK....","...KiBiK...","..KiBBiBK..","...KiBiK...",
    "....KiK....",".....YWk....",".....YWk....",".....YWk....",
    ".....YWk....",".....YWk....","....KDDK....",".....KK....."
  ],
  orb_glow: [
    "....KiK....","...KiBiK...","..KiBBiBK..","...KiBiK...",
    "....KkK...."
  ],
  goblin: [
    "....KKKKKK....","...KmGGGGmK...","..KmGGGGGGmK..","..KmGeGGemK...",
    "..KmGGGGGGmK..","...KmGGGGmK...","...KmGmmGmK...","....KmGGmK....",
    "....Kg..gK....","....Kg..gK....","....KK..KK...."
  ],
  skelett: [
    "....KKKKKK....","...KWWWWWWK...","..KWWWWWWWWK..","..KWWsWWWsWK..",
    "..KWWWWWWWWK..","...KWWWKWKK...","...KWWWwWWK...","....Kw..wK....",
    "....Kw..wK....","....KK..KK...."
  ],
  schleim: [
    "....KKKKKK....","...KmZZZZmK...","..KmZZZZZZmK..","..KmZeZZemK...",
    "..KmZZZZZZmK..","...KmZZZZmK...","...KmZZZZmK...","....KmZZmK....",
    "....KKKKKK...."
  ],
  bandit: [
    "....KKKKKK....","...KyyDDDDK...","..KyDDDDDDyK..","..KyDsSSSDyK..",
    "..KyDDDDDDyK..","...KyDDDDyK...","...KyDooDyK...","....KyDDyK....",
    "....Ky..yK....","....Ky..yK....","....KK..KK...."
  ],
  wolf: [
    "...KKKKKKKK...","..KddDDDDdK..",".KddDsSSdDdK.",".KddDDDDDDdK.",
    ".KddDDDDDDdK.","..KddDDDDdK..","...KdD..DdK...","...KdD..DdK...",
    "...KK....KK..."
  ],
  spinne: [
    "....KKKKKK....","...KuPPPPuK...","..KuPPPPPPuK..",".KuPuPPuPuK...",
    "..KuPPPPPPuK..","...KuPPPPuK...","..KuK.KPPK.KuK.","..KuK.K..K.KuK.",
    "....KK....KK...."
  ],
  boss_ork: [
    "...KKKKKKKKKK...","..KHHHHHHHHHK..",".KHHHHHHHHHHHK.",".KHHsHHHHsHHHK.",
    ".KHHHHHHHHHHHK.",".KHHHHoHHoHHHK.","..KHHHHHHHHHK..","..KHo....oHK...",
    "..KHo....oHK...","..KDGGGGGGDK...","..KDGGGGGGDK...","..KKK....KKK..."
  ],
  boss_schatten: [
    "...KKKKKKKKKK...","..KaaaaaaaaaK..",".KaaaaaaaaaaaK.",".KaaKaaaaKaaaK.",
    ".KaaaaaaaaaaaK.",".KaaaaaooaaaaK.","..KaaaaaaaaaK..","..KaK....KaK...",
    "..KaK....KaK...","..KKK....KKK..."
  ],
  boss_feuer: [
    "...KKKKKKKKKK...","..KeeeeeeeeeK..",".KeeffffffffeK.",".KeefSSSSfeeK.",
    ".KeeffffffffeK.",".KeeeeeooeeeeK.","..KeeeeeeeeeK..","..KeK....KeK...",
    "..KeK....KeK...","..KKK....KKK..."
  ],
  boss_drache: [
    "..KKKKKKKKKKKK..",".KRRRRRRRRRRRK.","KRRRRRRRRRRRRRK","KRRfRRRRRfRRRRK",
    "KRRRRRRRRRRRRRK",".KRRRRoRRoRRRRK.",".KRRRRRRRRRRRK.",".KRo......oRK..",
    ".KRo......oRK..",".KKK......KKK.."
  ],
  boss_nekro: [
    "...KKKKKKKKKK...","..KPPPPPPPPPK..",".KPPPPPPPPPPPK.",".KPPsPPPPsPPPK.",
    ".KPPPPPPPPPPPK.",".KPPPPooPPPPK.","..KPPPPPPPPPK..","..KpK....KpK...",
    "..KpK....KpK...","..KKK....KKK..."
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
  projectile_arrow: ["...K..","..KyK.",".KyyyK","KyyyyK",".KyyyK","..KyK.","...K.."],
  projectile_fire:  ["..f..",".fef.",".fff.","..f.."],
  coin: ["..K..",".KyK.","KyKyK",".KyK.","..K.."]
};

const MONSTER_SPRITE = {
  Goblin: "goblin", Skelett: "skelett", Schleim: "schleim",
  Bandit: "bandit", Wolf: "wolf", Spinne: "spinne",
  "Ork-Champion": "boss_ork", Schattenritter: "boss_schatten",
  Feuerdämon: "boss_feuer", Drachenwächter: "boss_drache", Nekromant: "boss_nekro"
};

const CLASSES = {
  warrior: {
    name: "Krieger", attackType: "melee",
    hp: 165, attack: 24, defense: 11, crit: 0.06, mana: 0, magicDamage: 0,
    range: 88, attackRate: 420, moveSpeed: 125,
    special: "Schildschlag", specialCd: 7, specialRange: 98,
    desc: "Nahkampf-Schwert, kurze Reichweite, viel Leben"
  },
  ranger: {
    name: "Waldläufer", attackType: "ranged",
    hp: 95, attack: 17, defense: 3, crit: 0.18, mana: 0, magicDamage: 0,
    range: 245, attackRate: 200, moveSpeed: 158,
    closeRange: 50, meleePenalty: 0.3,
    proj: "projectile_arrow", projSpeed: 14,
    special: "Präzisionsschuss", specialCd: 5,
    desc: "Bogen, große Reichweite, schwach im Nahkampf"
  },
  mage: {
    name: "Magier", attackType: "magic",
    hp: 72, attack: 7, defense: 2, crit: 0.12, mana: 120, magicDamage: 28,
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
      { name: "Goblin", sprite: "goblin" },
      { name: "Wolf", sprite: "wolf" },
      { name: "Schleim", sprite: "schleim" },
      { name: "Spinne", sprite: "spinne" }
    ],
    boss: [
      { name: "Ork-Champion", sprite: "boss_ork" },
      { name: "Waldwächter", sprite: "boss_schatten" }
    ]
  },
  swamp: {
    normal: [
      { name: "Zombie", sprite: "skelett" },
      { name: "Hexe", sprite: "boss_nekro" },
      { name: "Sumpfmonster", sprite: "schleim" },
      { name: "Riesenfrosch", sprite: "schleim" }
    ],
    boss: [
      { name: "Sumpfkönig", sprite: "boss_ork" },
      { name: "Nekromant", sprite: "boss_nekro" }
    ]
  },
  frost: {
    normal: [
      { name: "Eisgolem", sprite: "skelett" },
      { name: "Frostwolf", sprite: "wolf" },
      { name: "Yeti", sprite: "boss_ork" },
      { name: "Frostmagier", sprite: "boss_schatten" }
    ],
    boss: [
      { name: "Eiswächter", sprite: "boss_drache" },
      { name: "Schneesturm", sprite: "boss_feuer" }
    ]
  },
  fire: {
    normal: [
      { name: "Dämon", sprite: "boss_feuer" },
      { name: "Feuergeist", sprite: "boss_schatten" },
      { name: "Lava-Golem", sprite: "boss_ork" },
      { name: "Höllenhund", sprite: "wolf" }
    ],
    boss: [
      { name: "Feuerdämon", sprite: "boss_feuer" },
      { name: "Infernowächter", sprite: "boss_drache" }
    ]
  },
  ruins: {
    normal: [
      { name: "Ritter", sprite: "bandit" },
      { name: "Geist", sprite: "boss_schatten" },
      { name: "Gargoyle", sprite: "boss_ork" },
      { name: "Wächter", sprite: "boss_drache" }
    ],
    boss: [
      { name: "Schattenritter", sprite: "boss_schatten" },
      { name: "Drachenwächter", sprite: "boss_drache" }
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

const LOOT_TYPES = ["Waffe","Rüstung","Amulett","Zauberbuch"];
const RARITIES = [
  { name: "Gewöhnlich", chance: 0.5, mult: 1, css: "rarity-common" },
  { name: "Selten", chance: 0.3, mult: 2, css: "rarity-rare" },
  { name: "Episch", chance: 0.15, mult: 3.5, css: "rarity-epic" },
  { name: "Legendär", chance: 0.05, mult: 6, css: "rarity-legendary" }
];
const LOOT_EFFECTS = [
  { key: "attack", label: "Angriff" }, { key: "hp", label: "Leben" },
  { key: "defense", label: "Verteidigung" }, { key: "crit", label: "Krit" },
  { key: "goldBonus", label: "Gold" }, { key: "magicDamage", label: "Magie" }, { key: "mana", label: "Mana" }
];
const UPGRADES = [
  { key: "upgrade_health",   label: "Leben",        baseCost: 85,  bonus: 20,  bonusText: "+20 LP",       tip: "Überleben! Pflicht für jeden Run.",           forClass: "all" },
  { key: "upgrade_defense",  label: "Verteidigung", baseCost: 75,  bonus: 1,   bonusText: "+1 DEF",       tip: "Weniger Schaden. Krieger & Magier zuerst.", forClass: "warrior,mage" },
  { key: "upgrade_attack",   label: "Angriff",      baseCost: 95,  bonus: 3,   bonusText: "+3 ATK",       tip: "Schneller töten. Krieger & Waldläufer.",    forClass: "warrior,ranger" },
  { key: "upgrade_magic",    label: "Magieschaden", baseCost: 110, bonus: 5,   bonusText: "+5 MAG",       tip: "Nur Magier – vor Mana upgraden!",           forClass: "mage" },
  { key: "upgrade_mana",     label: "Mana",         baseCost: 100, bonus: 15,  bonusText: "+15 Mana",     tip: "Nur Magier – mehr Zauber pro Run.",         forClass: "mage" },
  { key: "upgrade_crit",     label: "Krit-Chance",  baseCost: 120, bonus: 0.008, bonusText: "+0.8% Krit", tip: "Waldläufer lieben das. Risiko-Reiz.",     forClass: "ranger" },
  { key: "upgrade_gold",     label: "Gold-Bonus",   baseCost: 130, bonus: 0.08, bonusText: "+8% Gold",   tip: "Langzeit-Farm. Erst wenn du oft stirbst.",  forClass: "all" },
  { key: "upgrade_xp",       label: "XP-Bonus",     baseCost: 110, bonus: 0.06, bonusText: "+6% XP",     tip: "Schneller Held-Level im Run.",              forClass: "all" },
  { key: "upgrade_cooldown", label: "Spezial-CD",   baseCost: 155, bonus: 0.35, bonusText: "-0.35s CD",  tip: "Öfter Spezial = mehr Überleben.",           forClass: "all" }
];

// Balance – knifflig, aber über Loot & Upgrades machbar
const BALANCE = {
  upgradeCostPow: 1.64,
  upgradeMax: 25,
  lootChance: 0.15,
  xpPerLevel: 175,
  levelScalePow: 1.082,
  levelUpHealPct: 0.15,
  waveCooldown: 2.15,
  minWaveCooldown: 0.95
};
let enemyId = 0;
let upgradePause = false;

const game = {
  playerName: "", classKey: "warrior", playerId: null,
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
  loopId: null
};

let WAVE_DATA = null;
let SOUND_MAP = null;
const audioCache = {};

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
function spriteCharW(rows) { return rows[0].length * CHAR_PIXEL; }
function spriteCharH(rows) { return rows.length * CHAR_PIXEL; }

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

function drawLivingChar(c, sprite, x, y, w, h, flip, world, bob, big) {
  const groundY = y + h - (bob || 0);
  const cx = x + w / 2;
  drawCharShadow(c, cx, groundY, w, getCharStyle(world), bob, big);
  drawCharSprite(c, sprite, x, y, flip);
  applyWorldCharTint(c, x, y, w, h, world);
  drawCharFeetFog(c, x, y, w, h, world);
}

const HERO_WEAPON = {
  warrior: { idle: "sword", attack: "sword_heavy", offhand: "shield" },
  ranger:  { idle: "bow", attack: "bow_aim" },
  mage:    { idle: "staff", attack: "staff", glow: "orb_glow" }
};

function drawHeroWeaponLayer(c, classKey, cx, cy, angle, attacking, sc) {
  const w = HERO_WEAPON[classKey];
  if (!w) return;
  const wKey = attacking ? (w.attack || w.idle) : w.idle;
  const sp = SPRITES[wKey];
  if (!sp) return;
  const scale = sc || WEAPON_PIXEL;
  const glow = classKey === "mage" ? "#5dade2" : classKey === "ranger" ? "#f1c40f" : "#ecf0f1";
  c.save();
  c.translate(cx, cy);
  c.rotate(angle);
  const gripX = classKey === "mage" ? -3 : classKey === "ranger" ? -2 : 4;
  const gripY = classKey === "mage" ? -22 : classKey === "ranger" ? -12 : -10;
  drawWeaponSprite(c, sp, gripX, gripY, false, glow, scale);
  if (classKey === "mage") {
    const pulse = 0.45 + Math.sin(performance.now() * 0.02) * 0.25;
    c.globalAlpha = pulse;
    drawWeaponSprite(c, SPRITES.orb_glow, gripX - 1, gripY - 14, false, "#85c1e9", scale);
    c.globalAlpha = 1;
  }
  if (classKey === "ranger" && attacking) {
    c.globalAlpha = 0.65;
    drawWeaponSprite(c, SPRITES.projectile_arrow, gripX + 8, gripY, false, "#f1c40f", scale);
    c.globalAlpha = 1;
  }
  c.restore();
}

function drawHeroShieldLayer(c, flip, cx, cy, sc) {
  const scale = sc || WEAPON_PIXEL;
  c.save();
  c.translate(cx, cy);
  drawWeaponSprite(c, SPRITES.shield, flip ? 14 : -20, -4, flip, "#bdc3c7", scale);
  c.restore();
}

function drawHero(c, h, bob, atkOff, hurtOff, world) {
  const x = h.x + atkOff + hurtOff;
  const y = h.y + bob;
  const flip = h.facing < 0;
  const cx = x + h.w / 2;
  const cy = y + h.h / 2 + 4;
  const body = SPRITES[game.classKey];
  const attacking = h.attackAnim > 0.04;
  let angle = Math.atan2(getAim().y - cy, getAim().x - cx);
  if (!getAim().onCanvas && !attacking) angle = flip ? 2.4 : -0.75;

  drawCharShadow(c, cx, h.y + h.h, h.w, getCharStyle(world), bob, false);

  if (game.classKey === "warrior") drawHeroShieldLayer(c, flip, cx, cy);

  drawCharSprite(c, body, x, y, flip);
  applyWorldCharTint(c, x, y, h.w, h.h, world);
  drawCharFeetFog(c, x, y, h.w, h.h, world);

  drawHeroWeaponLayer(c, game.classKey, cx, cy, angle, attacking);
}

function drawPreviews() {
  const PSC = 4;
  const WSC = 3;
  document.querySelectorAll(".preview-sprite").forEach((cv) => {
    const c = cv.getContext("2d");
    c.imageSmoothingEnabled = false;
    c.clearRect(0, 0, cv.width, cv.height);
    const key = cv.dataset.preview;
    const body = SPRITES[key];
    if (!body) return;
    const bw = body[0].length * PSC;
    const bh = body.length * PSC;
    const ox = Math.floor((cv.width - bw) / 2);
    const oy = Math.floor((cv.height - bh) / 2) + 6;
    const cx = ox + bw / 2;
    const cy = oy + bh / 2 + 2;
    const aim = -0.65;

    if (key === "warrior") drawHeroShieldLayer(c, false, cx, cy, WSC);
    drawCharSprite(c, body, ox, oy, false, PSC);

    const w = HERO_WEAPON[key];
    if (w) {
      const wKey = w.idle;
      const sp = SPRITES[wKey];
      c.save();
      c.translate(cx, cy);
      c.rotate(aim);
      const gx = key === "mage" ? -3 : key === "ranger" ? -2 : 4;
      const gy = key === "mage" ? -18 : key === "ranger" ? -10 : -8;
      const glow = key === "mage" ? "#5dade2" : key === "ranger" ? "#f1c40f" : "#ecf0f1";
      drawWeaponSprite(c, sp, gx, gy, false, glow, WSC);
      if (key === "mage") drawWeaponSprite(c, SPRITES.orb_glow, gx - 1, gy - 12, false, "#85c1e9", WSC);
      c.restore();
    }
  });
}

// ============================================
// INIT
// ============================================

document.addEventListener("DOMContentLoaded", () => {
  canvas = $("game-canvas");
  ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  initParallaxBackground(getWorld());
  drawPreviews();
  bindEvents();
  renderUpgradeButtons();
  initSupabase();
  loadGameData();
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
    const res = await fetch("sounds.json");
    if (res.ok) SOUND_MAP = await res.json();
  } catch (_) { /* optional */ }
}

function playSound(key) {
  if (!SOUND_MAP?.enabled || !SOUND_MAP.files?.[key]) return;
  const src = SOUND_MAP.files[key];
  if (!audioCache[src]) {
    const a = new Audio(src);
    a.volume = SOUND_MAP.volume ?? 0.5;
    audioCache[src] = a;
  }
  const audio = audioCache[src];
  audio.volume = SOUND_MAP.volume ?? 0.5;
  audio.currentTime = 0;
  audio.play().catch(() => {});
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

function spawnExplosion(x, y, radius) {
  game.attackEffects.push({
    type: "explosion", x, y, radius: radius || 90,
    life: 20, maxLife: 20, color: "#e74c3c"
  });
  spawnBurst(x, y, "#f39c12", 16, 6);
  emitCombatEvent("explosion");
}

function enemyAttackPlayer(e, h, st) {
  const ex = e.x + e.w / 2, ey = e.y + e.h / 2;
  const hx = h.x + h.w / 2, hy = h.y + h.h / 2;
  const angle = Math.atan2(hy - ey, hx - ex);
  const dmg = Math.max(1, e.attack - st.defense);

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

  spawnDamage(hx, hy - 5, dmg, false, true);
  emitCombatEvent("enemy_attack");
  emitCombatEvent("player_hurt");
  if (h.hp <= 0) { h.hp = 0; onDeath(); }
}

function bindEvents() {
  document.querySelectorAll(".class-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".class-btn").forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      game.classKey = btn.dataset.class;
      updateClassHint();
    });
  });
  const bind = (id, fn) => { const el = $(id); if (el) el.addEventListener("click", fn); };
  bind("btn-load-player", loadPlayer);
  bind("btn-start-run", startRun);
  bind("btn-pause", togglePause);
  bind("btn-restart", restartRun);
  bind("btn-save-score", saveScore);
  bind("btn-gameover-run", startRun);
  bind("btn-gameover-upgrade", goToUpgrades);
  bind("btn-open-upgrades", toggleUpgrades);
  bind("btn-close-upgrades", hideUpgrades);
  bind("btn-reload-leaderboard", loadLeaderboard);
  bind("btn-fullscreen", toggleFullscreen);

  document.addEventListener("fullscreenchange", onFullscreenChange);

  canvas.addEventListener("mousemove", onMouseMove);
  canvas.addEventListener("mouseenter", () => { mouse.onCanvas = true; });
  canvas.addEventListener("mouseleave", () => { mouse.onCanvas = false; });

  window.addEventListener("keydown", (e) => {
    keys[e.key.toLowerCase()] = true;
    if (e.key.toLowerCase() === "p" && game.isRunning) togglePause();
    if (e.key === "1" && game.isRunning) useSpecial();
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
  if (cls.attackType === "melee") {
    hint.innerHTML = "<kbd>A</kbd>/<kbd>D</kbd> Vor/Zurück | <kbd>Maus</kbd> drüber = <strong>Auto-Schwert</strong> | <kbd>1</kbd> Schildschlag | <kbd>U</kbd> Upgrades | <kbd>F</kbd> Vollbild";
  } else if (cls.attackType === "ranged") {
    hint.innerHTML = "<kbd>A</kbd>/<kbd>D</kbd> Vor/Zurück | <kbd>Maus</kbd> drüber = <strong>Auto-Pfeile</strong> | <kbd>1</kbd> 7 Pfeile | <kbd>U</kbd> Upgrades | <kbd>F</kbd> Vollbild";
  } else {
    hint.innerHTML = "<kbd>A</kbd>/<kbd>D</kbd> Vor/Zurück | <kbd>Maus</kbd> drüber = <strong>Auto-Zauber</strong> | <kbd>1</kbd> Feuerball | <kbd>U</kbd> Upgrades | <kbd>F</kbd> Vollbild";
  }
}

function onMouseMove(e) {
  const rect = canvas.getBoundingClientRect();
  if (rect.width === 0) return;
  const scaleX = CW / rect.width, scaleY = CH / rect.height;
  mouse.x = (e.clientX - rect.left) * scaleX;
  mouse.y = (e.clientY - rect.top) * scaleY;
  mouse.onCanvas = mouse.x >= 0 && mouse.x <= CW && mouse.y >= 0 && mouse.y <= CH;
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
// SPIELER / SUPABASE
// ============================================

async function loadPlayer() {
  const name = $("player-name").value.trim();
  if (!name) { $("load-hint").textContent = "Bitte Namen eingeben."; return; }
  game.playerName = name;
  if (!supabase) {
    game.totalGold = 0; game.upgrades = emptyUpgrades();
    enterGame("Los geht's! Maus über das Spiel zum Kämpfen.");
    return;
  }
  const { data, error } = await supabase.from("dungeon_players").select("*").eq("name", name).maybeSingle();
  if (error) { $("load-hint").textContent = error.message; return; }
  if (data) {
    game.playerId = data.id; game.classKey = data.class_name || game.classKey;
    game.totalGold = data.total_gold || 0;
    game.upgrades = { upgrade_attack: data.upgrade_attack||0, upgrade_health: data.upgrade_health||0,
      upgrade_defense: data.upgrade_defense||0, upgrade_crit: data.upgrade_crit||0,
      upgrade_gold: data.upgrade_gold||0, upgrade_xp: data.upgrade_xp||0,
      upgrade_magic: data.upgrade_magic||0, upgrade_mana: data.upgrade_mana||0,
      upgrade_cooldown: data.upgrade_cooldown||0 };
    selectClass(game.classKey);
    enterGame("Willkommen zurück, " + name + "!");
  } else {
    const { data: ins, error: err } = await supabase.from("dungeon_players")
      .insert({ name, class_name: game.classKey, total_gold: 0, ...emptyUpgrades() }).select().single();
    if (err) { $("load-hint").textContent = err.message; return; }
    game.playerId = ins.id; game.totalGold = 0; game.upgrades = emptyUpgrades();
    enterGame("Neuer Spieler!");
  }
}

function enterGame(msg) {
  $("game-section").classList.remove("hidden");
  hideUpgrades();
  $("setup-section").classList.add("collapsed");
  updateTotalGold(); renderUpgradeButtons();
  $("load-hint").textContent = msg;
  $("game-section").scrollIntoView({ behavior: "smooth" });
  requestAnimationFrame(() => startRun());
}

function emptyUpgrades() { const u = {}; UPGRADES.forEach((x) => u[x.key] = 0); return u; }
function selectClass(k) { document.querySelectorAll(".class-btn").forEach((b) => b.classList.toggle("selected", b.dataset.class === k)); }

async function savePlayer() {
  if (!supabase || !game.playerId) return;
  await supabase.from("dungeon_players").update({
    class_name: game.classKey, total_gold: game.totalGold,
    ...game.upgrades
  }).eq("id", game.playerId);
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

function getCombatAim() {
  const aim = getAim();
  const h = game.hero;
  if (!h) return aim;
  const hx = h.x + h.w / 2, hy = h.y + h.h / 2;
  const cls = CLASSES[game.classKey];
  const maxR = cls.range || 245;

  const aimAt = (tx, ty) => ({ x: tx, y: ty, onCanvas: true, down: mouse.down });

  if (aim.onCanvas) {
    const d = Math.hypot(aim.x - hx, aim.y - hy);
    if (d <= maxR) {
      const hovered = game.enemies.find((e) => {
        if (!isEnemyTargetable(e, maxR)) return false;
        return aim.x >= e.x && aim.x <= e.x + e.w && aim.y >= e.y && aim.y <= e.y + e.h;
      });
      if (hovered || d <= maxR) return aim;
    }
  }

  const target = getNearestEnemy(maxR);
  if (target) return aimAt(target.x + target.w / 2, target.y + target.h / 2);

  if (aim.onCanvas) return aim;
  return aimAt(hx + Math.min(maxR * 0.55, 180), hy);
}

function enemyInCombatRange(e, h) {
  const gap = getEnemyGap(e, h);
  const reach = getEnemyReach(e);
  return gap <= reach && gap >= -24 && e.x + e.w > h.x;
}

function getEnemyReach(e) {
  return e.isBoss ? COMBAT_LAYOUT.enemyBossReach : COMBAT_LAYOUT.enemyMeleeReach;
}

function getEnemyGap(e, h) {
  return e.x - (h.x + h.w);
}

function getEnemyChaseGap(e) {
  const reach = getEnemyReach(e);
  return Math.max(6, reach - 8);
}

function getEnemyMoveSpeed(e) {
  if (e.walkingIn) return COMBAT_LAYOUT.introSpeed * 0.96;
  const base = e.isBoss ? COMBAT_LAYOUT.enemyBossChaseSpeed : COMBAT_LAYOUT.enemyChaseSpeed;
  return base + (e.speed || 0) * 42;
}

function separateEnemies(e, h, dt) {
  const myGap = getEnemyGap(e, h);
  game.enemies.forEach((other) => {
    if (other === e || other.dead || other.hp <= 0) return;
    const dx = (e.x + e.w * 0.5) - (other.x + other.w * 0.5);
    const dist = Math.abs(dx);
    const minDist = COMBAT_LAYOUT.enemySeparation + (e.w + other.w) * 0.16;
    if (dist >= minDist || dist < 0.1) return;
    const push = (minDist - dist) * 2.4 * dt;
    const otherGap = getEnemyGap(other, h);
    if (myGap > otherGap + 4) e.x += push;
    else if (myGap < otherGap - 4) e.x -= push * 0.35;
    else e.x += dx > 0 ? push * 0.5 : -push * 0.5;
  });
}

function updateEnemyMovement(e, h, dt) {
  if (e.dead || e.hp <= 0) return;

  const heroEdge = h.x + h.w;
  const gap = getEnemyGap(e, h);
  const idealGap = getEnemyChaseGap(e);
  let speed = getEnemyMoveSpeed(e);

  if (e.attackWindup > 0.45) speed *= 0.35;
  else if (e.attackAnim > 0) speed *= 0.55;

  const inRange = enemyInCombatRange(e, h);
  e.isChasing = !inRange;

  if (!inRange) {
    const wantX = heroEdge + idealGap;
    if (e.x > wantX + 0.5) e.x -= speed * dt;
    else if (gap < -14) e.x += speed * dt * 0.5;
  } else if (gap < -10) {
    e.x += Math.min(speed * dt * 0.55, -gap - 8);
  }

  const minX = heroEdge - e.w * 0.12;
  const maxX = CW + COMBAT_LAYOUT.introOffscreen + (e.index || 0) * 40;
  e.x = Math.max(minX, Math.min(maxX, e.x));

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
  if (game.isRunning && !game.isDead) {
    ensureGameLoop();
    if (countAliveEnemies() === 0) safeSpawnWave();
    return;
  }
  hideUpgrades();
  stopLoop();
  resetRun();
  createHero();
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
  addLog("Run gestartet – Level 1. Stirbst du? Upgrades kaufen!");
  updateClassHint();
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      beginRunLoop();
      if (canvas) canvas.focus();
    });
  });
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
  $("loot-display").classList.add("hidden");
  initWorldBackground();
}

function restartRun() {
  stopLoop();
  game.isRunning = false; game.isPaused = false; game.isDead = false;
  resetRun();
  $("gameover-panel").classList.add("hidden");
  $("game-frame").classList.add("hidden");
  $("btn-start-run").disabled = false;
  $("btn-pause").disabled = true; $("btn-restart").disabled = true;
  addLog("Run zurückgesetzt.");
}

function showUpgrades() {
  $("gameover-panel").classList.add("hidden");
  const sec = $("upgrade-section");
  if (!sec || !$("game-section") || $("game-section").classList.contains("hidden")) return;
  sec.classList.remove("hidden");
  sec.classList.add("highlight-pulse");
  updateTotalGold(); renderUpgradeButtons();
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
  if (game.isPaused) stopLoop(); else startLoop();
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
  const heroSp = SPRITES[game.classKey];
  game.hero = {
    x: COMBAT_LAYOUT.heroCombatX,
    y: GROUND - spriteCharH(heroSp), vx: 0, vy: 0,
    w: spriteCharW(heroSp), h: spriteCharH(heroSp),
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
    lootBonuses: { attack:0, hp:0, defense:0, crit:0, goldBonus:0, magicDamage:0, mana:0 },
    facing: 1, anim: 0, hitFlash: 0, attackAnim: 0, hurtAnim: 0
  };
  $("hud-mana-wrap").classList.toggle("hidden", game.classKey !== "mage");
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
  return Math.max(0.84, 1 - total * 0.008);
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
  const ease = lv <= 12 ? 0.76 : lv <= 25 ? 0.88 : lv <= 45 ? 0.95 : 1;
  return { hp: 4.2 * ease, atk: 2.2 * ease, rew: 3.2 };
}

function getEnemyStats(isBoss) {
  const lv = game.dungeonLevel;
  const world = getWorld();
  const hpScale = getDifficultyScale();
  const atkScale = getAttackScale();
  const boss = getBossMult(isBoss);
  const worldEase = world.danger === 1 ? 0.76 : world.danger === 2 ? 0.88 : world.danger === 3 ? 0.95 : world.danger === 4 ? 0.98 : 1;
  const lvEase = lv <= 14 ? 0.78 : lv <= 26 ? 0.86 : lv <= 40 ? 0.93 : 1;

  return {
    hp: Math.floor((24 + lv * 3.8) * hpScale * boss.hp),
    attack: Math.max(1, Math.floor((3 + lv * 0.95) * atkScale * boss.atk * worldEase * lvEase)),
    gold: Math.floor((4 + lv * 1.4) * boss.rew * (1 + lv * 0.038)),
    xp: Math.floor((9 + lv * 2.2) * boss.rew),
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
    if (e.x > CW - 42) pending = true;
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
  for (let i = 0; i < count; i++) spawnEnemy(isBoss && i === 0, i);
  if (isBoss) addLog("⚠ BOSS! Gefahr " + world.danger + "/5", "boss");
  else if (world.danger >= 3) addLog("Gefahr " + world.danger + "/5 – " + count + " Gegner!", "death");
  else addLog(count + " Gegner (Lv." + game.dungeonLevel + ")");
}

function spawnEnemy(isBoss, index) {
  const world = getWorld();
  const pool = WORLD_MONSTERS[world.theme] || WORLD_MONSTERS.forest;
  const list = isBoss ? pool.boss : pool.normal;
  const pick = list[Math.floor(Math.random() * list.length)];
  const name = pick.name;
  const spKey = pick.sprite;
  const sp = SPRITES[spKey];
  if (!sp) {
    console.error("Sprite fehlt für:", name, spKey);
    return;
  }
  const stats = getEnemyStats(isBoss);
  const idx = index || 0;
  const ew = spriteCharW(sp);

  game.enemies.push({
    id: ++enemyId, name, sprite: spKey, isBoss, index: idx,
    x: CW + COMBAT_LAYOUT.introOffscreen + idx * 62 + Math.random() * 18,
    walkingIn: true,
    y: GROUND - spriteCharH(sp),
    w: ew, h: spriteCharH(sp),
    maxHp: stats.hp, hp: stats.hp,
    attack: stats.attack,
    goldReward: stats.gold, xpReward: stats.xp,
    speed: stats.speed,
    attackInterval: stats.attackInterval,
    hitFlash: 0, anim: Math.random() * 6, dead: false,
    attackTimer: 0, attackAnim: 0, attackWindup: 0
  });
  if (game.currentWave) game.currentWave.enemies.push({ name, isBoss });
}

function initWorldBackground() {
  invalidateParallaxCache();
  initParallaxBackground(getWorld());
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
  if (!hasTargetableEnemy(cls.range)) return;

  if (cls.attackType === "melee") {
    if (warriorMeleeAttack()) game.lastShot = now;
  } else if (cls.attackType === "ranged") {
    if (rangerShoot(cls)) game.lastShot = now;
  } else if (cls.attackType === "magic") {
    if (mageShoot(cls)) game.lastShot = now;
  }
}

function warriorMeleeAttack() {
  const h = game.hero, st = heroStats();
  const cls = CLASSES.warrior;
  const hx = h.x + h.w / 2, hy = h.y + h.h / 2;
  const aim = getCombatAim();
  const angle = Math.atan2(aim.y - hy, aim.x - hx);
  h.facing = Math.cos(angle) >= 0 ? 1 : -1;
  h.attackAnim = 0.14;

  let hitAny = false;
  game.enemies.forEach((e) => {
    if (!isEnemyTargetable(e, cls.range)) return;
    const ex = e.x + e.w / 2, ey = e.y + e.h / 2;
    const dist = Math.hypot(ex - hx, ey - hy);
    if (dist > cls.range) return;
    let diff = Math.atan2(ey - hy, ex - hx) - angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    if (Math.abs(diff) > 1.1) return;

    let dmg = st.attack;
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
  spawnBurst(hx + Math.cos(angle) * 30, hy + Math.sin(angle) * 30, "#bdc3c7", 4, 2.5);
  emitCombatEvent("player_melee");
  if (hitAny) emitCombatEvent("player_melee_hit");
  if (hitAny) addLog("Schwerttreffer!", "crit");
  return hitAny;
}

function rangerShoot(cls) {
  const h = game.hero, st = heroStats();
  const hx = h.x + h.w / 2, hy = h.y + h.h / 2;
  const near = getNearestEnemy(cls.range);
  if (!near) return false;

  let dx = near.x + near.w / 2 - hx;
  let dy = near.y + near.h / 2 - hy;
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

function mageShoot(cls) {
  const h = game.hero, st = heroStats();
  const hx = h.x + h.w / 2, hy = h.y + h.h / 2;
  const near = getNearestEnemy(cls.range);
  if (!near) return false;

  let dx = near.x + near.w / 2 - hx;
  let dy = near.y + near.h / 2 - hy;
  let dist = Math.hypot(dx, dy);
  if (dist > cls.range) return false;

  const angle = Math.atan2(dy, dx);
  h.facing = dx >= 0 ? 1 : -1;

  if (h.mana < cls.manaPerShot) {
    let dmg = Math.floor(st.attack * 0.4);
    const isCrit = Math.random() < st.crit;
    if (isCrit) dmg *= 2;
    let hitAny = false;
    game.enemies.forEach((e) => {
      if (!isEnemyTargetable(e, 55)) return;
      const ex = e.x + e.w / 2, ey = e.y + e.h / 2;
      if (Math.hypot(ex - hx, ey - hy) > 55) return;
      let diff = Math.atan2(ey - hy, ex - hx) - angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      if (Math.abs(diff) > 1.2) return;
      e.hp -= dmg; e.hitFlash = 6;
      spawnDamage(ex, e.y, dmg, isCrit);
      spawnImpactRing(ex, ey, 14, "#9b59b6", 8);
      emitCombatEvent("enemy_hit");
      if (e.hp <= 0 && !e.dead) { e.dead = true; onEnemyKill(e); }
      hitAny = true;
    });
    spawnMeleeSlash(hx, hy, angle, { life: 10, range: 55, owner: "player" });
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

function useSpecial() {
  const h = game.hero;
  if (h.specialTimer < h.specialCd || game.isPaused || !game.isRunning || game.isDead) return;
  const st = heroStats();
  const cls = CLASSES[game.classKey];
  const hx = h.x + h.w / 2, hy = h.y + h.h / 2;

  if (game.classKey === "warrior") {
    if (!hasTargetableEnemy(cls.specialRange)) return;
    h.specialTimer = 0;
    h.attackAnim = 0.2;
    const aim = getCombatAim();
    const angle = Math.atan2(aim.y - hy, aim.x - hx);
    spawnMeleeSlash(hx, hy, angle, { life: 20, range: cls.specialRange, owner: "player", big: true });
    game.enemies.forEach((e) => {
      if (!isEnemyTargetable(e, cls.specialRange)) return;
      const ex = e.x + e.w / 2, ey = e.y + e.h / 2;
      const dist = Math.hypot(ex - hx, ey - hy);
      if (dist > cls.specialRange) return;
      let diff = Math.atan2(ey - hy, ex - hx) - angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      if (Math.abs(diff) > 1.4) return;
      const dmg = Math.floor(st.attack * 2.8);
      e.hp -= dmg; e.hitFlash = 10;
      spawnDamage(ex, e.y, dmg, true);
      spawnImpactRing(ex, ey, 22, "#f1c40f", 12);
      emitCombatEvent("enemy_hit");
      if (e.hp <= 0 && !e.dead) { e.dead = true; onEnemyKill(e); }
    });
    addLog("Schildschlag! – Nahkampf-Spezial", "special");
    spawnBurst(hx, hy, "#e74c3c", 12, 5);
    game.screenShake = Math.max(game.screenShake, 4);
    emitCombatEvent("player_special_warrior");

  } else if (game.classKey === "ranger") {
    if (!hasTargetableEnemy(cls.range)) return;
    h.specialTimer = 0;
    h.attackAnim = 0.15;
    const aim = getCombatAim();
    const baseAngle = Math.atan2(aim.y - hy, aim.x - hx);
    for (let a = -3; a <= 3; a++) {
      const ang = baseAngle + a * 0.12;
      game.projectiles.push({
        x: hx, y: hy, vx: Math.cos(ang) * 16, vy: Math.sin(ang) * 16,
        dmg: Math.floor(st.attack * 2), crit: Math.random() < st.crit + 0.25,
        sprite: "projectile_arrow", life: 80, owner: "player", pierce: true, trail: "#f1c40f"
      });
    }
    spawnBurst(hx, hy, "#27ae60", 8, 3);
    addLog("Präzisionsschuss! – 7 Pfeile", "special");
    emitCombatEvent("player_special_ranger");

  } else if (game.classKey === "mage") {
    if (!hasTargetableEnemy(cls.range)) return;
    if (h.mana < cls.manaCost) { addLog("Nicht genug Mana!"); return; }
    h.mana -= cls.manaCost;
    h.specialTimer = 0;
    h.attackAnim = 0.18;
    const aim = getCombatAim();
    const ang = Math.atan2(aim.y - hy, aim.x - hx);
    game.projectiles.push({
      x: hx, y: hy, vx: Math.cos(ang) * 6, vy: Math.sin(ang) * 6,
      dmg: Math.floor(st.magicDamage * 3), crit: false,
      sprite: "projectile_fire", life: 55, owner: "player", explosive: true, big: true, trail: "#f39c12"
    });
    spawnBurst(hx, hy, "#e67e22", 10, 4);
    addLog("Feuerball! – Explosion", "special");
    emitCombatEvent("player_special_mage");
  }
}

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
  const h = game.hero, st = heroStats();
  game.scrollX += dt * 40;
  h.specialTimer += dt;
  h.anim += dt * 8;
  if (h.hitFlash > 0) h.hitFlash -= dt * 30;
  if (h.attackAnim > 0) h.attackAnim -= dt * 4;
  if (h.hurtAnim > 0) h.hurtAnim -= dt * 3;
  if (game.screenShake > 0) game.screenShake = Math.max(0, game.screenShake - dt * 28);

  // A/D – frei vor/zurück im linken Bereich und Mitte
  if (game.isRunning && !game.isPaused && !game.isDead) {
    const spd = CLASSES[game.classKey].moveSpeed;
    if (keys.a) { h.x -= spd * dt; h.facing = -1; }
    if (keys.d) { h.x += spd * dt; h.facing = 1; }
    const maxX = Math.min(COMBAT_LAYOUT.heroMaxX, CW * 0.48 - h.w);
    h.x = Math.max(COMBAT_LAYOUT.heroMinX, Math.min(maxX, h.x));
  }
  h.y = GROUND - h.h;

  // Mana regen (nur Magier)
  if (game.classKey === "mage") h.mana = Math.min(st.maxMana, h.mana + dt * 7);

  if (game.waveIntro) updateWaveIntro();

  // Auto-Angriff solange Gegner leben (Maus optional zum Zielen)
  if (game.isRunning && !game.isPaused && !game.isDead && countAliveEnemies() > 0) attack();

  // Ambient-Partikel (Parallax-Welt)
  updateWorldAmbient(dt, getWorld());
  updateWorldTransition(dt);

  // Schwert-Slashes & Effekte altern
  game.meleeSlashes = game.meleeSlashes.filter((s) => { s.life--; return s.life > 0; });
  game.attackEffects = game.attackEffects.filter((fx) => { fx.life--; return fx.life > 0; });

  // Gegner – jagen den Helden und greifen in Nahreichweite an
  game.enemies.forEach((e) => {
    if (e.dead || e.hp <= 0) return;
    updateEnemyMovement(e, h, dt);
    e.anim += dt * (e.isChasing ? 10 : 6);
    if (e.hitFlash > 0) e.hitFlash -= dt * 30;
    if (e.attackAnim > 0) e.attackAnim -= dt * 4;
    if (e.attackWindup > 0) e.attackWindup -= dt * 5;

    if (e.walkingIn && e.x > CW - 42) {
      e.attackWindup = 0;
      return;
    }

    if (!enemyInCombatRange(e, h)) {
      e.attackWindup = 0;
      e.attackTimer = Math.max(0, (e.attackTimer || 0) - dt * 0.35);
      return;
    }

    if ((e.attackTimer || 0) <= 0) e.attackTimer = 0.12;

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
    if (p.owner === "player") {
      for (const e of game.enemies) {
        if (!isEnemyOnScreen(e) || e.walkingIn || e.hp <= 0) continue;
        if (p.x > e.x && p.x < e.x+e.w && p.y > e.y && p.y < e.y+e.h) {
          e.hp -= p.dmg; e.hitFlash = 6;
          spawnDamage(e.x+e.w/2, e.y, p.dmg, p.crit);
          spawnImpactRing(e.x + e.w / 2, e.y + e.h / 2, p.big ? 24 : 14, p.crit ? "#f1c40f" : "#ecf0f1", 10);
          emitCombatEvent("enemy_hit");
          if (p.explosive) {
            spawnExplosion(p.x, p.y, 90);
            game.enemies.forEach((o) => {
              if (!isEnemyOnScreen(o) || o.walkingIn || o.dead || o.hp <= 0) return;
              if (Math.hypot(o.x + o.w/2 - p.x, o.y + o.h/2 - p.y) < 90) {
                o.hp -= Math.floor(p.dmg * 0.45); o.hitFlash = 5;
                if (o.hp <= 0 && !o.dead) { o.dead = true; onEnemyKill(o); }
              }
            });
          }
          if (e.hp <= 0 && !e.dead) { e.dead = true; onEnemyKill(e); }
          if (!p.pierce) return false;
        }
      }
    }
    return p.x > -20 && p.x < CW+20 && p.y > -20 && p.y < CH+20;
  });

  // Partikel
  game.particles = game.particles.filter((p) => { p.x+=p.vx; p.y+=p.vy; p.life--; return p.life>0; });

  // Münzen einsammeln
  game.coins = game.coins.filter((c) => {
    c.y += dt * 30; c.life -= dt;
    if (Math.hypot(c.x - h.x, c.y - h.y) < 30) {
      game.runGold += c.val;
      spawnBurst(c.x, c.y, "#f1c40f", 4, 2);
      playSound("coin");
      return false;
    }
    return c.life > 0;
  });

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

  updateHUD();
  updateStatus();
}

function onEnemyKill(e) {
  const st = heroStats();
  const gold = Math.floor(e.goldReward * st.goldBonus);
  const xp = Math.floor(e.xpReward * game.hero.xpBonus);
  const oldWorld = getWorld();
  game.runGold += gold; game.runXp += xp;
  game.monstersDefeated++; game.dungeonLevel++;
  const newWorld = getWorld();
  if (newWorld.name !== oldWorld.name) {
    initWorldBackground();
    startWorldTransition(newWorld);
    addLog("⚠ NEUE WELT: " + newWorld.name + " – härter, aber machbar!", "boss");
    const ambKey = WAVE_DATA?.worldAmbient?.[newWorld.name];
    if (ambKey) playSound(ambKey);
    emitCombatEvent("world_change");
  }
  addLog(e.name + " besiegt! +" + gold + " Gold", e.isBoss ? "boss" : "");
  game.coins.push({ x: e.x+e.w/2, y: e.y, val: gold, life: 3 });
  for (let i = 0; i < 5; i++) game.particles.push({ x:e.x+e.w/2, y:e.y+e.h/2, vx:(Math.random()-0.5)*3, vy:-Math.random()*4, life:20, color:"#f1c40f", size:2 });

  while (game.runXp >= game.playerLevel * BALANCE.xpPerLevel) {
    game.runXp -= game.playerLevel * BALANCE.xpPerLevel;
    game.playerLevel++;
    game.hero.hp = Math.min(heroStats().maxHp, game.hero.hp + Math.floor(heroStats().maxHp * BALANCE.levelUpHealPct));
    spawnBurst(game.hero.x + game.hero.w / 2, game.hero.y, "#2ecc71", 10, 3);
    emitCombatEvent("level_up");
    addLog("Level Up! Held " + game.playerLevel);
  }
  if (Math.random() < BALANCE.lootChance) generateLoot();
}

function onDeath() {
  game.isDead = true; game.isRunning = false;
  stopLoop();
  render();
  game.totalGold += game.runGold;
  savePlayer();
  addLog("Game Over!", "death");

  const world = getWorld();
  $("gameover-panel").classList.remove("hidden");
  $("gameover-summary").textContent =
    "Level " + game.dungeonLevel + " · " + world.name + "\n" +
    game.monstersDefeated + " Monster besiegt · " + game.runGold + " Gold";
  $("final-score").textContent = calcScore();
  $("gameover-tip").textContent = getUpgradeTip();
  $("save-hint").textContent = "";
  $("btn-start-run").disabled = false;
  $("btn-pause").disabled = true;
  updateTotalGold(); renderUpgradeButtons();
}

function spawnDamage(x, y, val, crit, taken) {
  game.particles.push({ x, y: y-10, vx: 0, vy: -1.5, life: 40, text: (taken?"-":"") + val, crit, taken });
}

// ============================================
// RENDERN
// ============================================

function render() {
  const world = getWorld();
  const shakeX = game.screenShake ? (Math.random() - 0.5) * game.screenShake : 0;
  const shakeY = game.screenShake ? (Math.random() - 0.5) * game.screenShake * 0.6 : 0;

  ctx.save();
  ctx.translate(shakeX, shakeY);
  ctx.save();
  applyCamera(ctx);

  renderUnifiedBackground(world);
  renderWorldAtmosphere(world);

  if (!game.hero) {
    ctx.restore();
    ctx.restore();
    return;
  }

  game.coins.forEach((c) => drawSprite(ctx, SPRITES.coin, c.x - 6, c.y, false));

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
    const bob = Math.sin(e.anim) * 2;
    const lunge = e.attackAnim > 0 ? (e.isBoss ? 14 : 10) * e.attackAnim : 0;
    const drawX = e.x - lunge;
    ctx.save();
    if (e.hitFlash > 0) ctx.globalAlpha = 0.5 + Math.sin(e.hitFlash) * 0.3;
    if (e.attackWindup > 0) {
      ctx.shadowColor = "#e74c3c";
      ctx.shadowBlur = 6 + e.attackWindup * 10;
    }
    drawLivingChar(ctx, SPRITES[e.sprite], drawX, e.y + bob, e.w, e.h, true, world, bob, e.isBoss);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    ctx.restore();
    ctx.fillStyle = "#111"; ctx.fillRect(e.x, e.y - 6, e.w, 4);
    ctx.fillStyle = e.isBoss ? "#f1c40f" : "#e74c3c";
    ctx.fillRect(e.x, e.y - 6, e.w * (e.hp / e.maxHp), 4);
    if (e.attackWindup > 0.4) {
      ctx.fillStyle = "rgba(231,76,60," + (e.attackWindup * 0.7) + ")";
      ctx.font = "bold 9px Courier New";
      ctx.fillText("!", e.x + e.w / 2 - 3, e.y - 10);
    }
  });

  const h = game.hero;
  const bob = Math.sin(h.anim) * 2;
  const hx = h.x + h.w / 2, hy = h.y + h.h / 2;
  const hurtOff = h.hurtAnim > 0 ? Math.sin(h.hurtAnim * 20) * 4 * h.hurtAnim : 0;
  const atkOff = h.attackAnim > 0 ? h.facing * 5 * h.attackAnim : 0;

  // Reichweiten-Anzeige
  if (game.isRunning && !game.isPaused && mouse.onCanvas) {
    const cls = CLASSES[game.classKey];
    const aim = getAim();
    if (cls.attackType === "melee") {
      ctx.strokeStyle = "rgba(231,76,60,0.35)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      const a = Math.atan2(aim.y - hy, aim.x - hx);
      ctx.arc(hx, hy, cls.range, a - 1.1, a + 1.1);
      ctx.stroke();
    } else {
      ctx.strokeStyle = cls.attackType === "ranged" ? "rgba(46,204,113,0.2)" : "rgba(155,89,182,0.25)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(hx, hy, cls.range, 0, Math.PI * 2);
      ctx.stroke();
      if (cls.attackType === "ranged") {
        ctx.strokeStyle = "rgba(231,76,60,0.25)";
        ctx.beginPath();
        ctx.arc(hx, hy, cls.closeRange, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  ctx.save();
  if (h.hitFlash > 0) {
    ctx.globalAlpha = 0.45 + Math.sin(h.hitFlash) * 0.35;
    ctx.fillStyle = "rgba(231,76,60,0.25)";
    ctx.fillRect(h.x - 4, h.y - 8, h.w + 8, h.h + 12);
  }
  drawHero(ctx, h, bob, atkOff, hurtOff, world);
  ctx.globalAlpha = 1;
  ctx.restore();

  game.projectiles.forEach((p) => {
    const sc = p.big ? 1.5 : 1;
    drawSprite(ctx, SPRITES[p.sprite], p.x - 6 * sc, p.y - 6 * sc, p.vx < 0);
  });

  game.particles.forEach((p) => {
    if (p.text) {
      ctx.font = "bold " + (p.crit ? "14" : "11") + "px Courier New";
      ctx.fillStyle = p.taken ? "#e74c3c" : p.crit ? "#f1c40f" : "#ecf0f1";
      ctx.fillText(p.text, p.x - 8, p.y - p.life * 0.8);
    } else {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
  });

  if (h.specialTimer >= h.specialCd) {
    ctx.fillStyle = "rgba(142,68,173,0.8)";
    ctx.font = "bold 10px Courier New";
    ctx.fillText("[1] SPEZIAL", h.x, h.y - 14);
  }

  ctx.restore();

  renderWorldTransition(ctx);

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
  const h = game.hero;
  if (h) {
    const ready = h.specialTimer >= h.specialCd;
    $("special-status").textContent = ready ? "1 bereit!" : Math.ceil(h.specialCd - h.specialTimer) + "s";
    $("special-status").style.color = ready ? "#2ecc71" : "";
  }
}

// ============================================
// LOOT / UPGRADES / SCORE
// ============================================

function generateLoot() {
  let roll = Math.random(), cum = 0, rarity = RARITIES[0];
  for (const r of RARITIES) { cum += r.chance; if (roll <= cum) { rarity = r; break; } }
  const type = LOOT_TYPES[Math.floor(Math.random() * LOOT_TYPES.length)];
  const eff = LOOT_EFFECTS[Math.floor(Math.random() * LOOT_EFFECTS.length)];
  const val = Math.max(1, Math.floor(rarity.mult * (1 + game.dungeonLevel * 0.1)));
  const loot = { name: rarity.name + " " + type, css: rarity.css, effect: eff.key, value: val, score: rarity.mult * val };
  applyLoot(loot);
  if (!game.bestLoot || loot.score > game.bestLoot.score) {
    game.bestLoot = loot;
    $("loot-display").classList.remove("hidden");
    $("best-loot-text").textContent = loot.name + " (+" + eff.label + " " + val + ")";
    $("best-loot-text").className = "loot-item " + loot.css;
  }
  addLog("Loot: " + loot.name, "loot");
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
    const btn = document.createElement("button");
    btn.className = "upgrade-btn" + (relevant ? " relevant" : "") + (maxed ? " maxed" : "");
    btn.disabled = maxed || game.totalGold < cost;
    btn.innerHTML =
      '<span class="upgrade-info">' +
        '<span class="upgrade-name">' + up.label + (relevant ? " ★" : "") + '</span>' +
        '<span class="upgrade-level">Stufe ' + lv + (maxed ? " MAX" : "") + ' – ' + up.bonusText + '</span>' +
        '<span class="upgrade-tip-text">' + up.tip + '</span>' +
      '</span>' +
      '<span class="upgrade-cost">' + (maxed ? "MAX" : cost + " 🪙") + '</span>';
    btn.onclick = () => buyUpgrade(up.key);
    grid.appendChild(btn);
  });
}

async function buyUpgrade(k) {
  const cost = getUpgradeCost(k);
  if (game.totalGold < cost || (game.upgrades[k] || 0) >= BALANCE.upgradeMax) return;
  game.totalGold -= cost;
  game.upgrades[k] = (game.upgrades[k] || 0) + 1;
  addLog("Upgrade: " + UPGRADES.find(u => u.key === k).label + " Stufe " + game.upgrades[k]);
  await savePlayer(); updateTotalGold(); renderUpgradeButtons();
}

function updateTotalGold() { if ($("total-gold")) $("total-gold").textContent = game.totalGold; }
function calcScore() { return game.dungeonLevel*100 + game.monstersDefeated*50 + game.runGold + game.playerLevel*200; }

async function saveScore() {
  if (!supabase) { $("save-hint").textContent = "Supabase nicht konfiguriert."; return; }
  const { error } = await supabase.from("dungeon_scores").insert({
    name: game.playerName, class_name: CLASSES[game.classKey].name, score: calcScore(),
    dungeon_level: game.dungeonLevel, monsters_defeated: game.monstersDefeated,
    gold: game.runGold, player_level: game.playerLevel
  });
  $("save-hint").textContent = error ? error.message : "Score gespeichert!";
  if (!error) loadLeaderboard();
}

async function loadLeaderboard() {
  const list = $("leaderboard"); if (!list) return;
  if (!supabase) { list.innerHTML = '<li class="empty">Supabase nicht konfiguriert.</li>'; return; }
  const { data, error } = await supabase.from("dungeon_scores").select("*").order("score",{ascending:false}).limit(10);
  if (error || !data?.length) { list.innerHTML = '<li class="empty">Keine Scores.</li>'; return; }
  const medals = ["🥇","🥈","🥉"];
  list.innerHTML = "";
  data.forEach((e,i) => {
    const li = document.createElement("li");
    li.innerHTML = '<span>' + (medals[i]||(i+1)+".") + '</span><span>' + e.name + '</span><span class="lb-score">' + e.score + '</span>';
    list.appendChild(li);
  });
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
