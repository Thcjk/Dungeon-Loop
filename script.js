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
const CHAR_PIXEL = 4;
const WEAPON_PIXEL = 5;
const DECOR_PIXEL = 5;
const BG_PIXEL = 6;
const CW = 640, CH = 360;
const GROUND = 290;
const PATH_TOP = 268;
const PATH_H = 22;
let canvas, ctx;
let mouse = { x: CW / 2, y: CH / 2, down: false, onCanvas: false };
let keys = {};

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
    "....KKKKKK....","...KWWWWWWK...","..KWwSSSSwWK..",".KWwwSSSSwwWK.",
    "KWwwSSyySSwwWK","KWwwSSyySSwwWK",".KWwwwwwwwwWK.","..KWwSSSSwWK..",
    "...KWWWWWWK...","....KKDDKK....",".....KDDK.....","......KK......"
  ],
  sword: [
    ".....K.....","....KwWK....","....KWWK....","...KWWWWK...",
    "...KWWWWK...","...KWWWWK...","...KWwwWK...","....KWWK....",
    "...KDDDDK...","....KDDK....",".....KK....."
  ],
  sword_heavy: [
    ".....K......","....KwWWK....","...KWWWWWK...","...KWWWWWWK..",
    "..KWWWWWWWK.","..KWWWWWWWK.","...KWWWWWWK..","....KWWWWK...",
    "....KWwwWK...","....KDDDDK...",".....KDDK....","......KK....."
  ],
  bow: [
    ".....K.....","....KyK....","...Ky.wyK...","..Ky...wyK..",
    ".Ky.....wyK.","..Ky...wyK..","...Ky.wyK...","....KyK....",
    ".....K....."
  ],
  bow_aim: [
    ".....K.....","....KyK....","...KyywyK...","..KyyyyyK..",
    ".KyyywyyyyK.","..KyyyyyK..","...KyywyK...","....KyK....",
    ".....K....."
  ],
  staff: [
    "....KiBiK....","...KiBBiBK...","..KiBwwBiBK..","...KiBBiBK...",
    "....KiBiK....",".....YWk.....",".....YWk.....",".....YWk.....",
    ".....YWk.....",".....YWk.....",".....YWk.....","....KDDK.....",
    ".....KK......"
  ],
  orb_glow: [
    ".....KiK.....","....KiBiK....","...KiBBiBK...","..KiBBBBiBK..",
    ".KiBBwwBBiBK.","..KiBBBBiBK..","...KiBBiBK...","....KiBiK....",
    ".....KkK....."
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
    range: 90, attackRate: 420, moveSpeed: 125,
    special: "Schildschlag", specialCd: 7, specialRange: 115,
    desc: "Nahkampf-Schwert, kurze Reichweite, viel Leben"
  },
  ranger: {
    name: "Waldläufer", attackType: "ranged",
    hp: 95, attack: 17, defense: 3, crit: 0.18, mana: 0, magicDamage: 0,
    range: 520, attackRate: 200, moveSpeed: 158,
    closeRange: 60, meleePenalty: 0.3,
    proj: "projectile_arrow", projSpeed: 14,
    special: "Präzisionsschuss", specialCd: 5,
    desc: "Bogen, große Reichweite, schwach im Nahkampf"
  },
  mage: {
    name: "Magier", attackType: "magic",
    hp: 72, attack: 7, defense: 2, crit: 0.12, mana: 120, magicDamage: 28,
    range: 340, attackRate: 300, moveSpeed: 108, manaPerShot: 5,
    proj: "projectile_fire", projSpeed: 8,
    special: "Feuerball", specialCd: 6, manaCost: 30,
    desc: "Zauber, mittlere Reichweite, braucht Mana"
  }
};

const NORMAL_MONSTERS = ["Goblin","Skelett","Schleim","Bandit","Wolf","Spinne"];
const BOSS_MONSTERS = ["Ork-Champion","Schattenritter","Feuerdämon","Drachenwächter","Nekromant"];

const WORLDS = [
  {
    name: "Dunkler Wald", min: 1, danger: 1, theme: "forest",
    hpMult: 1, atkMult: 1, speedMult: 1,
    sky: "#040e0a", bg: "#071812", hill: "#0a2218",
    hill2: "#0d2e1e", hill3: "#123824",
    ground: "#1a1208", tile1: "#2a1f12", tile2: "#3d2e1a", tile3: "#2a2215",
    moss: "#1b4332", leaf: "#2d6a4f",
    accent: "#52b788", star: "#74c69d", fog: "rgba(8,28,18,0.55)",
    fog2: "rgba(20,50,30,0.35)", moonTint: "#95e1a3",
    particleColor: "#95e1a3", hasMoon: true, hasStars: false,
    path: { x: 32, w: 576, center: "#5c4a32", edge: "#3d2e1a", verge: "#1b4332", wall: "#0a2218", border: "#2a1f12" },
    decor: ["pine_tree", "pine_tree", "pine_silhouette", "dead_tree", "mushroom", "glow_mushroom", "glow_pod", "fern", "stump", "bush_dark", "root_cluster", "stone_lantern", "hanging_vine", "grave", "bones", "bush"]
  },
  {
    name: "Verfluchte Höhle", min: 10, danger: 2, theme: "cave",
    hpMult: 1.6, atkMult: 1.45, speedMult: 1.15,
    sky: "#0a0814", bg: "#120e1e", hill: "#1a1430", hill2: "#221a3a", hill3: "#2a2050",
    ground: "#18141f", tile1: "#2a2438", tile2: "#3a3250", tile3: "#2a2238",
    moss: "#4a235a", leaf: "#6c3483",
    accent: "#bb86fc", star: "#9b59b6", fog: "rgba(30,10,50,0.5)",
    fog2: "rgba(60,20,90,0.25)", moonTint: "#9b59b6",
    particleColor: "#bb86fc", hasMoon: false, hasStars: false,
    path: { x: 48, w: 544, center: "#2a2438", edge: "#1a1430", verge: "#120e1e", wall: "#0a0814", border: "#3a3250" },
    decor: ["stalactite", "stalactite", "cave_crystal", "glow_pod", "skull_rock", "rock", "rock", "hanging_vine", "grave", "bones", "crystal"]
  },
  {
    name: "Schlossruine", min: 20, danger: 3, theme: "ruins",
    hpMult: 2.2, atkMult: 1.85, speedMult: 1.25,
    sky: "#0c0a14", bg: "#14101c", hill: "#1c1628", hill2: "#241c32", hill3: "#2c243c",
    ground: "#2a2430", tile1: "#3a3448", tile2: "#4a4458", tile3: "#3a3448",
    moss: "#3d4a3d", leaf: "#5a6a5a",
    accent: "#bdc3c7", star: "#95a5a6", fog: "rgba(25,20,35,0.45)",
    fog2: "rgba(40,35,50,0.3)", moonTint: "#ecf0f1",
    particleColor: "#f39c12", hasMoon: true, hasStars: true,
    path: { x: 40, w: 560, center: "#4a4458", edge: "#3a3448", verge: "#2a2430", wall: "#1c1628", border: "#5a6a5a" },
    decor: ["pillar_ruin", "pillar_ruin", "rubble", "rubble", "torch", "stone_lantern", "banner", "grave", "grave", "rock", "cross", "fern"]
  },
  {
    name: "Feuervulkan", min: 30, danger: 4, theme: "volcano",
    hpMult: 3.0, atkMult: 2.3, speedMult: 1.35,
    sky: "#180404", bg: "#280808", hill: "#3a0c08", hill2: "#4a1008", hill3: "#5a180a",
    ground: "#2a0804", tile1: "#4a1208", tile2: "#6a1a0c", tile3: "#4a1008",
    moss: "#5a1a08", leaf: "#922b21",
    accent: "#e74c3c", star: "#f39c12", fog: "rgba(80,20,5,0.45)",
    fog2: "rgba(120,40,10,0.3)", moonTint: "#f39c12",
    particleColor: "#f39c12", hasMoon: false, hasStars: false,
    path: { x: 44, w: 552, center: "#4a1008", edge: "#2a0804", verge: "#3a0c08", wall: "#280808", border: "#922b21" },
    decor: ["lava_rock", "lava_rock", "rock", "rock", "glow_pod", "crystal", "smoke_puff", "bones", "rubble", "root_cluster"]
  },
  {
    name: "Drachenland", min: 40, danger: 5, theme: "dragon",
    hpMult: 4.0, atkMult: 2.9, speedMult: 1.45,
    sky: "#08040e", bg: "#10081a", hill: "#180c28", hill2: "#201038", hill3: "#281448",
    ground: "#1a0c28", tile1: "#2a1440", tile2: "#3a1c58", tile3: "#2a1048",
    moss: "#4a1860", leaf: "#6a2080",
    accent: "#f1c40f", star: "#d4a017", fog: "rgba(50,15,70,0.45)",
    fog2: "rgba(80,30,100,0.25)", moonTint: "#f1c40f",
    particleColor: "#f1c40f", hasMoon: true, hasStars: true,
    path: { x: 38, w: 564, center: "#2a1048", edge: "#1a0c28", verge: "#201038", wall: "#10081a", border: "#6a2080" },
    decor: ["dragon_bone", "obsidian", "obsidian", "cave_crystal", "glow_pod", "pillar_ruin", "crystal", "grave", "rock", "banner", "stone_lantern"]
  }
];

// Welt-Integration für Charaktere (Schatten, Licht, Farbton)
const WORLD_CHAR_STYLE = {
  forest: {
    shadow: "rgba(3,12,6,0.52)", contact: "rgba(18,42,24,0.42)",
    tint: "#2d6a4f", tintA: 0.13, fog: "rgba(8,28,18,0.55)"
  },
  cave: {
    shadow: "rgba(6,3,16,0.58)", contact: "rgba(45,28,65,0.38)",
    tint: "#6c3483", tintA: 0.17, fog: "rgba(30,10,50,0.5)", rim: "rgba(187,134,252,0.22)"
  },
  ruins: {
    shadow: "rgba(10,8,16,0.52)", contact: "rgba(40,36,48,0.36)",
    tint: "#5a6a5a", tintA: 0.11, fog: "rgba(25,20,35,0.45)", rim: "rgba(189,195,199,0.14)"
  },
  volcano: {
    shadow: "rgba(22,5,0,0.62)", contact: "rgba(160,50,12,0.48)",
    tint: "#922b21", tintA: 0.19, fog: "rgba(80,20,5,0.45)", rim: "rgba(243,156,18,0.25)"
  },
  dragon: {
    shadow: "rgba(10,3,20,0.56)", contact: "rgba(55,22,75,0.4)",
    tint: "#6a2080", tintA: 0.15, fog: "rgba(50,15,70,0.45)", rim: "rgba(241,196,15,0.16)"
  }
};

const DECOR_META = {
  pine_tree:       { parallax: 0.35 },
  pine_silhouette: { parallax: 0.12 },
  dead_tree:       { parallax: 0.3 },
  mushroom:        { parallax: 0.4 },
  stump:           { parallax: 0.45 },
  bush_dark:       { parallax: 0.42 },
  bones:           { parallax: 0.5 },
  tree:            { parallax: 0.35 },
  bush:            { parallax: 0.42 },
  grave:           { parallax: 0.4 },
  cross:           { parallax: 0.38 },
  rock:            { parallax: 0.4 },
  crystal:         { parallax: 0.38 },
  stalactite:      { parallax: 0.15, ceiling: true },
  cave_crystal:    { parallax: 0.35 },
  skull_rock:      { parallax: 0.42 },
  torch:           { parallax: 0.45 },
  pillar_ruin:     { parallax: 0.28 },
  rubble:          { parallax: 0.48 },
  banner:          { parallax: 0.32 },
  lava_rock:       { parallax: 0.4 },
  smoke_puff:      { parallax: 0.08, ceiling: true },
  dragon_bone:     { parallax: 0.3 },
  obsidian:        { parallax: 0.4 },
  glow_mushroom:   { parallax: 0.48 },
  glow_pod:        { parallax: 0.44 },
  hanging_vine:    { parallax: 0.1, ceiling: true },
  fern:            { parallax: 0.46 },
  stone_lantern:   { parallax: 0.42 },
  root_cluster:    { parallax: 0.47 }
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
  { key: "upgrade_health",   label: "Leben",        baseCost: 100, bonus: 20,  bonusText: "+20 LP",       tip: "Überleben! Pflicht für jeden Run.",           forClass: "all" },
  { key: "upgrade_defense",  label: "Verteidigung", baseCost: 90,  bonus: 1,   bonusText: "+1 DEF",       tip: "Weniger Schaden. Krieger & Magier zuerst.", forClass: "warrior,mage" },
  { key: "upgrade_attack",   label: "Angriff",      baseCost: 110, bonus: 3,   bonusText: "+3 ATK",       tip: "Schneller töten. Krieger & Waldläufer.",    forClass: "warrior,ranger" },
  { key: "upgrade_magic",    label: "Magieschaden", baseCost: 130, bonus: 5,   bonusText: "+5 MAG",       tip: "Nur Magier – vor Mana upgraden!",           forClass: "mage" },
  { key: "upgrade_mana",     label: "Mana",         baseCost: 120, bonus: 15,  bonusText: "+15 Mana",     tip: "Nur Magier – mehr Zauber pro Run.",         forClass: "mage" },
  { key: "upgrade_crit",     label: "Krit-Chance",  baseCost: 140, bonus: 0.008, bonusText: "+0.8% Krit", tip: "Waldläufer lieben das. Risiko-Reiz.",     forClass: "ranger" },
  { key: "upgrade_gold",     label: "Gold-Bonus",   baseCost: 150, bonus: 0.08, bonusText: "+8% Gold",   tip: "Langzeit-Farm. Erst wenn du oft stirbst.",  forClass: "all" },
  { key: "upgrade_xp",       label: "XP-Bonus",     baseCost: 130, bonus: 0.06, bonusText: "+6% XP",     tip: "Schneller Held-Level im Run.",              forClass: "all" },
  { key: "upgrade_cooldown", label: "Spezial-CD",   baseCost: 180, bonus: 0.35, bonusText: "-0.35s CD",  tip: "Öfter Spezial = mehr Überleben.",           forClass: "all" }
];

// Balance – Spiel soll über viele Runs mit Upgrades geschafft werden
const BALANCE = {
  upgradeCostPow: 1.72,
  upgradeMax: 25,
  lootChance: 0.10,
  xpPerLevel: 200,
  levelScalePow: 1.15,
  waveCooldown: 2.2,
  minWaveCooldown: 0.9
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
  scrollX: 0, decor: [], waveCooldown: 0,
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

function drawWeaponSprite(c, rows, x, y, flip, glowColor) {
  if (glowColor) {
    c.save();
    c.globalAlpha = 0.35;
    c.shadowColor = glowColor;
    c.shadowBlur = 8;
    drawSpriteScaled(c, rows, x - 1, y - 1, flip, WEAPON_PIXEL);
    c.restore();
  }
  drawSpriteScaled(c, rows, x, y, flip, WEAPON_PIXEL);
  c.save();
  c.globalCompositeOperation = "lighter";
  c.globalAlpha = 0.18;
  drawSpriteScaled(c, rows, x, y, flip, WEAPON_PIXEL);
  c.restore();
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

function drawHeroWeaponLayer(c, classKey, cx, cy, angle, attacking) {
  const w = HERO_WEAPON[classKey];
  if (!w) return;
  const wKey = attacking ? (w.attack || w.idle) : w.idle;
  const sp = SPRITES[wKey];
  if (!sp) return;
  const glow = classKey === "mage" ? "#5dade2" : classKey === "ranger" ? "#f1c40f" : "#ecf0f1";
  c.save();
  c.translate(cx, cy);
  c.rotate(angle);
  const gripX = classKey === "mage" ? -7 : classKey === "ranger" ? -6 : 12;
  const gripY = classKey === "mage" ? -38 : classKey === "ranger" ? -24 : -22;
  drawWeaponSprite(c, sp, gripX, gripY, false, glow);
  if (classKey === "mage") {
    const pulse = 0.5 + Math.sin(performance.now() * 0.02) * 0.3;
    c.globalAlpha = pulse;
    drawWeaponSprite(c, SPRITES.orb_glow, gripX - 3, gripY - 34, false, "#85c1e9");
    c.globalAlpha = 1;
  }
  if (classKey === "ranger" && attacking) {
    c.globalAlpha = 0.7;
    drawWeaponSprite(c, SPRITES.projectile_arrow, gripX + 14, gripY - 2, false, "#f1c40f");
    c.globalAlpha = 1;
  }
  c.restore();
}

function drawHero(c, h, bob, atkOff, hurtOff, world) {
  const x = h.x + atkOff + hurtOff;
  const y = h.y + bob;
  const flip = h.facing < 0;
  const cx = x + h.w / 2;
  const cy = y + h.h / 2 + 6;
  const body = SPRITES[game.classKey];
  const attacking = h.attackAnim > 0.04;
  let angle = Math.atan2(mouse.y - cy, mouse.x - cx);
  if (!mouse.onCanvas && !attacking) angle = flip ? Math.PI - 0.4 : -0.4;

  drawCharShadow(c, cx, h.y + h.h, h.w, getCharStyle(world), bob, false);

  if (game.classKey === "warrior") {
    c.save();
    c.translate(cx, cy);
    drawWeaponSprite(c, SPRITES.shield, flip ? 26 : -42, -10, flip, "#bdc3c7");
    c.restore();
  }

  drawCharSprite(c, body, x, y, flip);
  drawHeroWeaponLayer(c, game.classKey, cx, cy, angle, attacking);

  const pad = game.classKey === "warrior" ? 14 : game.classKey === "mage" ? 10 : 8;
  applyWorldCharTint(c, x - pad, y - 2, h.w + pad * 2, h.h + 4, world);
  drawCharFeetFog(c, x - 4, y, h.w + 8, h.h, world);
}

function drawPreviews() {
  const PSC = 4;
  document.querySelectorAll(".preview-sprite").forEach((cv) => {
    const c = cv.getContext("2d");
    c.imageSmoothingEnabled = false;
    c.clearRect(0, 0, cv.width, cv.height);
    const key = cv.dataset.preview;
    const body = SPRITES[key];
    if (!body) return;
    const bw = body[0].length * PSC;
    const bh = body.length * PSC;
    const ox = Math.floor((cv.width - bw) / 2) - 4;
    const oy = Math.floor((cv.height - bh) / 2) + 2;
    const cx = ox + bw / 2;
    const cy = oy + bh / 2 + 4;
    if (key === "warrior") drawWeaponSprite(c, SPRITES.shield, ox - 18, oy + 10, false, "#bdc3c7");
    drawCharSprite(c, body, ox, oy, false, PSC);
    const w = HERO_WEAPON[key];
    if (w) {
      const wKey = key === "ranger" ? w.attack : w.idle;
      const sp = SPRITES[wKey];
      c.save();
      c.translate(cx, cy);
      c.rotate(-0.55);
      const gx = key === "mage" ? -6 : key === "ranger" ? -5 : 10;
      const gy = key === "mage" ? -30 : key === "ranger" ? -18 : -18;
      const glow = key === "mage" ? "#5dade2" : key === "ranger" ? "#f1c40f" : "#ecf0f1";
      drawWeaponSprite(c, sp, gx, gy, false, glow);
      if (key === "mage") drawWeaponSprite(c, SPRITES.orb_glow, gx - 3, gy - 28, false, "#85c1e9");
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
  game.scrollX = 0; game.decor = []; game.specialTimer = 0; game.waveCooldown = 0;
  game.waveNumber = 0; game.currentWave = null;
  game.worldParticles = [];
  $("loot-display").classList.add("hidden");
  initDecor();
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
    x: 70, y: GROUND - spriteCharH(heroSp), vx: 0, vy: 0,
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

// Schwierigkeit skaliert exponentiell – ein Run reicht NIE für alles
function getDifficultyScale() {
  const lv = game.dungeonLevel;
  const world = getWorld();
  const levelMult = Math.pow(BALANCE.levelScalePow, lv);
  return levelMult * world.hpMult;
}

function getAttackScale() {
  const lv = game.dungeonLevel;
  const world = getWorld();
  return Math.pow(BALANCE.levelScalePow - 0.02, lv) * world.atkMult;
}

function getEnemyStats(isBoss) {
  const lv = game.dungeonLevel;
  const world = getWorld();
  const hpScale = getDifficultyScale();
  const atkScale = getAttackScale();
  const bossHp = isBoss ? 5.5 : 1;
  const bossAtk = isBoss ? 2.8 : 1;
  const bossRew = isBoss ? 3.5 : 1;

  return {
    hp: Math.floor((28 + lv * 5) * hpScale * bossHp),
    attack: Math.floor((5 + lv * 1.8) * atkScale * bossAtk),
    gold: Math.floor((3 + lv * 1.2) * bossRew * (1 + lv * 0.05)),
    xp: Math.floor((8 + lv * 2.5) * bossRew),
    speed: (isBoss ? 0.55 : 0.75) * world.speedMult + lv * 0.012,
    attackInterval: Math.max(0.45, 0.9 - lv * 0.008 - world.danger * 0.05)
  };
}

function getWaveSize() {
  const lv = game.dungeonLevel;
  return Math.min(7, 2 + Math.floor(lv / 2) + getWorld().danger);
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

function spawnWave() {
  const count = getWaveSize();
  const isBoss = game.dungeonLevel % 10 === 0 && game.dungeonLevel > 0;
  const world = getWorld();
  onWaveSpawn(isBoss, count);
  for (let i = 0; i < count; i++) spawnEnemy(isBoss && i === 0, i);
  if (isBoss) addLog("⚠ BOSS! Gefahr " + world.danger + "/5", "boss");
  else if (world.danger >= 3) addLog("Gefahr " + world.danger + "/5 – " + count + " Gegner!", "death");
  else addLog(count + " Gegner (Lv." + game.dungeonLevel + ")");
}

function spawnEnemy(isBoss, index) {
  const names = isBoss ? BOSS_MONSTERS : NORMAL_MONSTERS;
  const name = names[Math.floor(Math.random() * names.length)];
  const spKey = MONSTER_SPRITE[name];
  const sp = SPRITES[spKey];
  if (!sp) {
    console.error("Sprite fehlt für:", name, spKey);
    return;
  }
  const stats = getEnemyStats(isBoss);
  const idx = index || 0;

  game.enemies.push({
    id: ++enemyId, name, sprite: spKey, isBoss,
    x: CW - 40 - idx * 50 - Math.random() * 15,
    y: GROUND - spriteCharH(sp),
    w: spriteCharW(sp), h: spriteCharH(sp),
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

function getPath(world) {
  return world.path || { x: 40, w: CW - 80, center: "#3d2e1a", edge: "#2a1f12", verge: "#1b4332", wall: "#0a2218", border: "#2a1f12" };
}

function decorScreenX(d) {
  const raw = ((d.x - game.scrollX * d.parallax) % (CW + 220)) - 40;
  if (d.lane === "left") return 8 + (raw % 148);
  if (d.lane === "right") return CW - 156 + (raw % 148);
  const path = getPath(getWorld());
  return path.x + 24 + (raw % Math.max(80, path.w - 48));
}

const LANE_TYPES = {
  left:  ["pine_tree", "dead_tree", "pine_tree", "bush_dark", "tree", "fern", "root_cluster", "glow_mushroom", "pillar_ruin", "stalactite", "rock", "lava_rock", "obsidian"],
  right: ["pine_tree", "dead_tree", "pine_tree", "bush_dark", "tree", "fern", "glow_pod", "stone_lantern", "pillar_ruin", "torch", "banner", "dragon_bone", "cave_crystal"],
  path:  ["mushroom", "glow_mushroom", "glow_pod", "stump", "bones", "bush", "rubble", "grave", "cross", "crystal", "skull_rock", "fern", "root_cluster"]
};

function initDecor() {
  const world = getWorld();
  game.decor = [];
  const themeTypes = world.decor;
  const pick = (lane) => {
    const pool = LANE_TYPES[lane].filter((t) => themeTypes.includes(t));
    const src = pool.length ? pool : themeTypes;
    return src[Math.floor(Math.random() * src.length)];
  };
  const parallaxFor = (lane) => (lane === "left" ? 0.26 : lane === "right" ? 0.34 : 0.5);

  [["left", 20], ["right", 20], ["path", 16]].forEach(([lane, count]) => {
    for (let i = 0; i < count; i++) {
      const type = pick(lane);
      const meta = DECOR_META[type] || { parallax: 0.3 };
      const sp = SPRITES[type];
      const sh = sp ? spriteDecorH(sp) : 40;
      const y = meta.ceiling
        ? 2 + (i % 5) * 18 + Math.random() * 8
        : GROUND - sh - (lane === "path" ? 0 : Math.floor(Math.random() * 6));
      game.decor.push({
        x: i * 68 + Math.random() * 24,
        lane,
        type,
        y,
        parallax: parallaxFor(lane) + (Math.random() - 0.5) * 0.05,
        flip: Math.random() < 0.4
      });
    }
  });
  if (themeTypes.includes("hanging_vine")) {
    for (let i = 0; i < 10; i++) {
      game.decor.push({
        x: i * 64 + Math.random() * 20,
        lane: i % 2 === 0 ? "left" : "right",
        type: "hanging_vine",
        y: 4 + (i % 4) * 16,
        parallax: 0.08 + (Math.random() - 0.5) * 0.03,
        flip: Math.random() < 0.3
      });
    }
  }
  initWorldParticles();
}

function initWorldParticles() {
  const world = getWorld();
  game.worldParticles = [];
  const n = world.theme === "forest" ? 48 : world.theme === "volcano" ? 32 : 28;
  for (let i = 0; i < n; i++) {
    game.worldParticles.push({
      x: Math.random() * CW,
      y: 95 + Math.random() * (PATH_TOP - 110),
      phase: Math.random() * Math.PI * 2,
      speed: 0.4 + Math.random() * 1.2,
      size: world.theme === "volcano" ? 2 + Math.random() * 2 : 1 + Math.random() * 1.5,
      drift: (Math.random() - 0.5) * 14
    });
  }
}

function renderWorldSky(world) {
  const grad = ctx.createLinearGradient(0, 0, 0, GROUND);
  grad.addColorStop(0, world.sky);
  grad.addColorStop(0.35, world.bg);
  grad.addColorStop(0.72, world.hill);
  grad.addColorStop(1, world.hill2 || world.hill);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CW, GROUND);
}

function renderWorldDepth(world) {
  const path = getPath(world);

  if (world.theme === "cave") {
    ctx.fillStyle = world.hill3 || world.hill;
    ctx.fillRect(0, 0, CW, PATH_TOP - 8);
    ctx.fillStyle = path.wall || world.hill;
    ctx.fillRect(0, 0, path.x - 6, GROUND);
    ctx.fillRect(path.x + path.w + 6, 0, CW - path.x - path.w - 6, GROUND);
    for (let i = 0; i < 10; i++) {
      const wx = ((i * 95 - game.scrollX * 0.06) % (CW + 60)) - 20;
      ctx.fillStyle = world.hill2 || world.hill;
      ctx.fillRect(wx, 40 + (i % 4) * 22, 28, GROUND - 50 - (i % 3) * 15);
      ctx.fillStyle = world.accent;
      ctx.globalAlpha = 0.08;
      ctx.fillRect(wx + 4, 60 + (i % 4) * 22, 8, GROUND - 90);
      ctx.globalAlpha = 1;
    }
    return;
  }

  const hills = [world.hill, world.hill2 || world.hill, world.hill3 || world.hill2 || world.hill];
  hills.forEach((col, layer) => {
    ctx.fillStyle = col;
    const parallax = 0.06 + layer * 0.05;
    for (let i = 0; i < 7; i++) {
      const hx = ((i * 148 - game.scrollX * parallax) % (CW + 190)) - 48;
      const hh = 95 + layer * 32;
      const hy = GROUND - hh - layer * 10;
      ctx.beginPath();
      ctx.moveTo(hx, GROUND);
      ctx.quadraticCurveTo(hx + 88, hy - 28, hx + 168, GROUND);
      ctx.fill();
    }
  });

  // Weg-Ränder: dichte Vegetation / Felswände
  ctx.fillStyle = world.verge || world.moss;
  ctx.fillRect(0, PATH_TOP - 18, path.x, GROUND - PATH_TOP + 18);
  ctx.fillRect(path.x + path.w, PATH_TOP - 18, CW - path.x - path.w, GROUND - PATH_TOP + 18);

  if (world.theme === "forest") {
    const sp = SPRITES.pine_silhouette;
    const sh = sp ? spriteDecorH(sp, BG_PIXEL) : 84;
    for (let i = 0; i < 16; i++) {
      const side = i % 2 === 0;
      const raw = ((i * 68 - game.scrollX * (side ? 0.07 : 0.09)) % (CW + 100)) - 20;
      const sx = side ? raw % 130 : CW - 140 + (raw % 130);
      if (sp) drawBgSprite(ctx, sp, sx, GROUND - sh - 4 - (i % 3) * 8, !side);
    }
    // Leuchtende Waldboden-Akzente (Hades-artig)
    for (let i = 0; i < 24; i++) {
      const gx = ((i * 47 - game.scrollX * 0.35) % (CW + 30)) - 8;
      const gy = PATH_TOP + 4 + (i % 5) * 3;
      const onPath = gx > path.x + 8 && gx < path.x + path.w - 8;
      if (!onPath && gx > path.x - 40 && gx < path.x + path.w + 40) {
        ctx.fillStyle = i % 3 === 0 ? world.particleColor : world.accent;
        ctx.globalAlpha = 0.25 + (i % 4) * 0.12;
        ctx.fillRect(gx, gy, 2 + (i % 2), 2);
        if (i % 5 === 0) {
          ctx.globalAlpha = 0.15;
          ctx.beginPath();
          ctx.arc(gx + 1, gy + 1, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
    }
    ctx.fillStyle = path.wall || world.hill3;
    for (let i = 0; i < 22; i++) {
      const bx = ((i * 62 - game.scrollX * 0.12) % (CW + 40)) - 10;
      const onLeft = bx < path.x - 10;
      const onRight = bx > path.x + path.w + 10;
      if (!onLeft && !onRight) continue;
      ctx.globalAlpha = 0.35 + (i % 3) * 0.12;
      ctx.fillRect(bx, PATH_TOP - 40 - (i % 4) * 12, 14 + (i % 3) * 6, GROUND - PATH_TOP + 36);
      ctx.globalAlpha = 1;
    }
  }

  if (world.theme === "ruins") {
    ctx.fillStyle = "rgba(30,25,40,0.82)";
    for (let i = 0; i < 7; i++) {
      const rx = ((i * 168 - game.scrollX * 0.05) % (CW + 120)) - 30;
      const side = rx < CW / 2;
      const px = side ? Math.min(rx, path.x - 18) : Math.max(rx, path.x + path.w + 4);
      const ph = 110 + (i % 4) * 18;
      ctx.fillRect(px, GROUND - ph, 22, ph);
      ctx.fillRect(px + (side ? 18 : -14), GROUND - ph - 6, 12, 8);
      if (i % 2 === 0) {
        ctx.fillStyle = "rgba(60,55,70,0.5)";
        ctx.fillRect(px - 4, GROUND - ph + 20, 30, 6);
        ctx.fillStyle = "rgba(30,25,40,0.82)";
      }
    }
  }

  if (world.theme === "volcano") {
    ctx.fillStyle = path.wall || world.hill3;
    for (let i = 0; i < 6; i++) {
      const vx = ((i * 185 - game.scrollX * 0.04) % (CW + 80)) + 10;
      const vh = 145 + (i % 3) * 20;
      ctx.beginPath();
      ctx.moveTo(vx, GROUND);
      ctx.lineTo(vx + 70, GROUND - vh);
      ctx.lineTo(vx + 140, GROUND);
      ctx.fill();
    }
    ctx.fillStyle = "rgba(231,76,60,0.25)";
    for (let i = 0; i < 8; i++) {
      const lx = path.x + 20 + ((i * 48 - game.scrollX * 0.45) % (path.w - 40));
      ctx.fillRect(lx, GROUND - 3, 6, 3);
    }
  }

  if (world.theme === "dragon") {
    const sp = SPRITES.dragon_bone;
    const sh = sp ? spriteDecorH(sp, BG_PIXEL) : 66;
    for (let i = 0; i < 6; i++) {
      const dx = ((i * 200 - game.scrollX * 0.05) % (CW + 100)) - 20;
      if (sp) drawBgSprite(ctx, sp, dx, GROUND - sh - 2, i % 2 === 0);
    }
    ctx.fillStyle = path.wall || world.hill3;
    for (let i = 0; i < 8; i++) {
      const cx = ((i * 88 - game.scrollX * 0.08) % (CW + 60)) - 15;
      const tall = cx < path.x - 8 || cx > path.x + path.w;
      if (!tall) continue;
      ctx.fillRect(cx, 55 + (i % 5) * 16, 20, GROUND - 60 - (i % 4) * 10);
      ctx.fillStyle = world.accent;
      ctx.globalAlpha = 0.1;
      ctx.fillRect(cx + 3, 70 + (i % 5) * 16, 6, 12);
      ctx.globalAlpha = 1;
      ctx.fillStyle = path.wall || world.hill3;
    }
  }
}

function renderWorldWalkway(world) {
  const path = getPath(world);
  const scroll = game.scrollX * 0.55;
  const tileW = 18;

  // Untergrund unter dem Weg
  ctx.fillStyle = world.ground;
  ctx.fillRect(0, PATH_TOP, CW, GROUND - PATH_TOP);

  // Seitenstreifen (Wald: Gras, Höhle: Gestein …)
  ctx.fillStyle = path.verge;
  ctx.fillRect(0, PATH_TOP, path.x, PATH_H + 4);
  ctx.fillRect(path.x + path.w, PATH_TOP, CW - path.x - path.w, PATH_H + 4);

  // Wegrand
  ctx.fillStyle = path.border;
  ctx.fillRect(path.x, PATH_TOP, 3, PATH_H);
  ctx.fillRect(path.x + path.w - 3, PATH_TOP, 3, PATH_H);

  // Weg-Oberfläche (scrollend)
  for (let tx = 0; tx < path.w / tileW + 2; tx++) {
    const ox = path.x + tx * tileW - (scroll % tileW);
    const shade = (tx + Math.floor(scroll / tileW)) % 3;
    ctx.fillStyle = shade === 0 ? path.center : shade === 1 ? path.edge : path.center;
    ctx.fillRect(ox, PATH_TOP, tileW - 1, PATH_H);
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    ctx.fillRect(ox, PATH_TOP + PATH_H - 3, tileW - 1, 2);
    if (world.theme === "forest" && tx % 4 === 1) {
      ctx.fillStyle = world.leaf || world.accent;
      ctx.globalAlpha = 0.35;
      ctx.fillRect(ox + 4, PATH_TOP + 2, 3, 2);
      ctx.globalAlpha = 1;
    }
    if (world.theme === "ruins" && tx % 3 === 0) {
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      ctx.fillRect(ox, PATH_TOP, tileW - 1, 2);
    }
    if (world.theme === "volcano" && tx % 5 === 2) {
      ctx.fillStyle = "#f39c12";
      ctx.globalAlpha = 0.45;
      ctx.fillRect(ox + 6, PATH_TOP + 8, 3, 2);
      ctx.globalAlpha = 1;
    }
    if (world.theme === "dragon" && tx % 4 === 0) {
      ctx.fillStyle = world.accent;
      ctx.globalAlpha = 0.15;
      ctx.fillRect(ox + 2, PATH_TOP + 4, tileW - 5, 2);
      ctx.globalAlpha = 1;
    }
    if (world.theme === "cave" && tx % 4 === 2) {
      ctx.fillStyle = world.accent;
      ctx.globalAlpha = 0.12;
      ctx.fillRect(ox + 3, PATH_TOP + 5, 5, 3);
      ctx.globalAlpha = 1;
    }
  }

  // Weg-Tiefe / Schatten an den Rändern
  const edgeGrad = ctx.createLinearGradient(path.x, PATH_TOP, path.x + 28, PATH_TOP);
  edgeGrad.addColorStop(0, "rgba(0,0,0,0.35)");
  edgeGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = edgeGrad;
  ctx.fillRect(path.x, PATH_TOP, 28, PATH_H);
  const edgeGradR = ctx.createLinearGradient(path.x + path.w, PATH_TOP, path.x + path.w - 28, PATH_TOP);
  edgeGradR.addColorStop(0, "rgba(0,0,0,0.35)");
  edgeGradR.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = edgeGradR;
  ctx.fillRect(path.x + path.w - 28, PATH_TOP, 28, PATH_H);
}

function renderWorldMidScatter(world) {
  const path = getPath(world);
  const scroll = game.scrollX;

  for (let i = 0; i < 40; i++) {
    const seed = i * 97;
    const px = ((seed * 1.7 - scroll * (0.25 + (i % 5) * 0.06)) % (CW + 60)) - 20;
    const side = px < path.x ? "left" : px > path.x + path.w ? "right" : "path";
    const py = PATH_TOP - 8 - (seed % 55);
    if (side === "path" && i % 3 !== 0) continue;

    if (world.theme === "forest") {
      ctx.fillStyle = i % 4 === 0 ? world.accent : world.moss;
      ctx.globalAlpha = 0.2 + (i % 5) * 0.08;
      if (i % 7 === 0) {
        drawDecorSprite(ctx, SPRITES.fern, px, GROUND - spriteDecorH(SPRITES.fern) + (seed % 8), i % 2 === 0);
      } else if (i % 11 === 0) {
        drawDecorSprite(ctx, SPRITES.glow_mushroom, px, GROUND - spriteDecorH(SPRITES.glow_mushroom), false);
      } else {
        ctx.fillRect(px, py + 60, 3 + (i % 3), 2);
        ctx.fillRect(px + 2, py + 58, 2, 2);
      }
    } else if (world.theme === "cave") {
      ctx.fillStyle = world.accent;
      ctx.globalAlpha = 0.12 + (i % 4) * 0.06;
      ctx.fillRect(px, py + 50, 2, 2);
      if (i % 9 === 0) drawDecorSprite(ctx, SPRITES.cave_crystal, px, GROUND - spriteDecorH(SPRITES.cave_crystal) - 2, false);
    } else if (world.theme === "ruins") {
      ctx.fillStyle = "rgba(180,180,190,0.15)";
      ctx.fillRect(px, py + 55, 4, 2);
      if (i % 8 === 0) drawDecorSprite(ctx, SPRITES.rubble, px, GROUND - spriteDecorH(SPRITES.rubble), i % 2 === 0);
    } else if (world.theme === "volcano") {
      ctx.fillStyle = i % 2 ? "#f39c12" : "#e74c3c";
      ctx.globalAlpha = 0.2;
      ctx.fillRect(px, py + 58, 2, 2);
    } else if (world.theme === "dragon") {
      ctx.fillStyle = world.accent;
      ctx.globalAlpha = 0.15;
      ctx.fillRect(px, py + 54, 2, 2);
      if (i % 10 === 0) drawDecorSprite(ctx, SPRITES.glow_pod, px, GROUND - spriteDecorH(SPRITES.glow_pod), false);
    }
    ctx.globalAlpha = 1;
  }

  // Wurzeln / Steine am Wegrand
  for (let i = 0; i < 14; i++) {
    const rx = path.x - 8 + ((i * 52 - scroll * 0.5) % (path.w + 16));
    const sp = world.theme === "forest" ? SPRITES.root_cluster : SPRITES.rubble;
    if (sp && i % 2 === 0) {
      drawDecorSprite(ctx, sp, rx, GROUND - spriteDecorH(sp) + 2, i % 3 === 0);
    }
  }
}

function renderWorldForegroundFrame(world) {
  const sp = SPRITES.branch_fg;
  if (!sp) return;

  for (let i = 0; i < 5; i++) {
    const lx = -10 + (i * 38) % 120;
    drawDecorSprite(ctx, sp, lx, PATH_TOP - 20 + (i % 3) * 8, false);
    drawDecorSprite(ctx, sp, CW - 90 + (i * 34) % 100, PATH_TOP - 16 + (i % 2) * 10, true);
  }

  ctx.fillStyle = world.theme === "forest" ? "rgba(4,14,10,0.55)" : "rgba(8,6,14,0.5)";
  const fgGradL = ctx.createLinearGradient(0, 0, 90, 0);
  fgGradL.addColorStop(0, "rgba(0,0,0,0.65)");
  fgGradL.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = fgGradL;
  ctx.fillRect(0, PATH_TOP - 30, 95, GROUND - PATH_TOP + 40);
  const fgGradR = ctx.createLinearGradient(CW, 0, CW - 90, 0);
  fgGradR.addColorStop(0, "rgba(0,0,0,0.65)");
  fgGradR.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = fgGradR;
  ctx.fillRect(CW - 95, PATH_TOP - 30, 95, GROUND - PATH_TOP + 40);

  if (world.theme === "forest") {
    for (let i = 0; i < 6; i++) {
      drawDecorSprite(ctx, SPRITES.hanging_vine, 12 + i * 22, 8 + (i % 3) * 12, false);
      drawDecorSprite(ctx, SPRITES.hanging_vine, CW - 40 - i * 24, 10 + (i % 2) * 14, true);
    }
  }
}

function renderWorldCanopy(world) {
  const path = getPath(world);

  if (world.theme === "forest") {
    ctx.fillStyle = world.hill3 || "#123824";
    for (let i = 0; i < 22; i++) {
      const cx = (i * 44 - game.scrollX * 0.03) % (CW + 40);
      const cy = 4 + (i % 5) * 11;
      const r = 20 + (i % 6) * 4;
      ctx.globalAlpha = 0.6 + (i % 3) * 0.1;
      ctx.beginPath();
      ctx.ellipse(cx, cy, r, r * 0.62, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = world.leaf || "#2d6a4f";
    for (let i = 0; i < 35; i++) {
      const lx = (i * 31 + game.scrollX * 0.02) % CW;
      ctx.globalAlpha = 0.22 + (i % 4) * 0.1;
      ctx.fillRect(lx, 2 + (i % 7) * 8, 5 + (i % 4) * 2, 3);
    }
    ctx.globalAlpha = 1;
    const vineGrad = ctx.createLinearGradient(0, 0, 0, 110);
    vineGrad.addColorStop(0, "rgba(8,28,18,0.82)");
    vineGrad.addColorStop(0.6, "rgba(8,28,18,0.35)");
    vineGrad.addColorStop(1, "rgba(8,28,18,0)");
    ctx.fillStyle = vineGrad;
    ctx.fillRect(0, 0, CW, 110);
    for (let i = 0; i < 14; i++) {
      const vx = (i * 52 - game.scrollX * 0.04) % CW;
      ctx.fillStyle = world.moss;
      ctx.globalAlpha = 0.45;
      ctx.fillRect(vx, 0, 2, 42 + (i % 5) * 10);
      ctx.globalAlpha = 1;
    }
    // Lichtstrahlen durch Blätterdach
    for (let i = 0; i < 5; i++) {
      const bx = path.x + 40 + i * 110 + (game.scrollX * 0.02) % 80;
      const beam = ctx.createLinearGradient(bx, 0, bx + 30, PATH_TOP);
      beam.addColorStop(0, "rgba(149,225,163,0.08)");
      beam.addColorStop(1, "rgba(149,225,163,0)");
      ctx.fillStyle = beam;
      ctx.fillRect(bx, 0, 28, PATH_TOP - 20);
    }
  }

  if (world.theme === "cave") {
    ctx.fillStyle = world.hill || "#120e1e";
    ctx.fillRect(0, 0, CW, 100);
    for (let i = 0; i < 14; i++) {
      const cx = ((i * 88 - game.scrollX * 0.02) % (CW + 60)) - 20;
      ctx.fillStyle = world.hill2 || world.hill;
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx + 55, 0);
      ctx.lineTo(cx + 27, 55 + (i % 4) * 14);
      ctx.closePath();
      ctx.fill();
    }
    const ceilGrad = ctx.createLinearGradient(0, 0, 0, 110);
    ceilGrad.addColorStop(0, "rgba(0,0,0,0.5)");
    ceilGrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = ceilGrad;
    ctx.fillRect(0, 0, CW, 110);
  }

  if (world.theme === "ruins") {
    const gapGrad = ctx.createRadialGradient(CW / 2, 50, 10, CW / 2, 50, 120);
    gapGrad.addColorStop(0, world.bg);
    gapGrad.addColorStop(1, "rgba(12,10,20,0)");
    ctx.fillStyle = gapGrad;
    ctx.fillRect(CW / 2 - 120, 0, 240, 100);
    ctx.fillStyle = "rgba(20,16,28,0.85)";
    ctx.fillRect(0, 0, path.x - 10, 95);
    ctx.fillRect(path.x + path.w + 10, 0, CW - path.x - path.w - 10, 95);
    for (let i = 0; i < 6; i++) {
      const ax = i % 2 === 0 ? path.x - 35 : path.x + path.w + 8;
      ctx.fillRect(ax, 20 + i * 10, 28, 8);
      ctx.fillRect(ax + 6, 0, 6, 28 + i * 8);
    }
  }

  if (world.theme === "volcano") {
    ctx.fillStyle = "rgba(40,8,4,0.65)";
    ctx.fillRect(0, 0, CW, 88);
    for (let i = 0; i < 10; i++) {
      const sx = (i * 71 - game.scrollX * 0.04) % (CW + 30);
      ctx.fillStyle = i % 2 ? "rgba(120,40,10,0.4)" : "rgba(80,20,5,0.35)";
      ctx.beginPath();
      ctx.ellipse(sx, 25 + (i % 3) * 12, 22 + (i % 4) * 8, 12, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (world.theme === "dragon") {
    ctx.fillStyle = "rgba(16,8,28,0.7)";
    ctx.fillRect(0, 0, CW, 92);
    for (let i = 0; i < 8; i++) {
      const ax = path.x - 30 + (i % 2) * (path.w + 20);
      ctx.strokeStyle = world.accent;
      ctx.globalAlpha = 0.2;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(ax, 85);
      ctx.quadraticCurveTo(ax + 40, 30 + i * 5, ax + 80, 10);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
}

function renderWorldAtmosphere(world) {
  const path = getPath(world);

  if (world.hasStars && world.theme !== "cave" && world.theme !== "volcano") {
    for (let i = 0; i < 28; i++) {
      const sx = (i * 67 + game.scrollX * 0.04) % CW;
      const sy = 18 + (i * 31) % 72;
      ctx.fillStyle = world.star;
      if (i % 7 === 0 && world.theme === "ruins") {
        drawSprite(ctx, SPRITES.cross, sx, sy, false);
      } else {
        ctx.globalAlpha = 0.35 + (i % 5) * 0.14;
        ctx.fillRect(sx, sy, 2, 2);
        ctx.globalAlpha = 1;
      }
    }
  }

  if (world.hasMoon) {
    ctx.save();
    ctx.globalAlpha = 0.8;
    const mx = world.theme === "ruins" ? CW / 2 - 14 : CW - 68;
    const my = world.theme === "ruins" ? 42 : 48;
    drawSprite(ctx, SPRITES.moon, mx, my, false);
    if (world.moonTint) {
      ctx.fillStyle = world.moonTint;
      ctx.globalAlpha = 0.22;
      ctx.fillRect(mx - 4, my - 4, 28, 28);
    }
    ctx.restore();
  }

  if (world.theme === "forest") {
    game.worldParticles.forEach((p) => {
      const fx = (p.x + game.scrollX * 0.03 + Math.sin(p.phase) * 6) % CW;
      const fy = p.y + Math.cos(p.phase * 1.3) * 5;
      if (fx < path.x - 10 || fx > path.x + path.w + 10) return;
      ctx.fillStyle = world.particleColor || "#95e1a3";
      ctx.globalAlpha = 0.3 + Math.sin(p.phase) * 0.25;
      ctx.fillRect(fx, fy, p.size, p.size);
    });
    ctx.globalAlpha = 1;
  } else if (world.theme === "volcano") {
    game.worldParticles.forEach((p) => {
      const fx = (p.x + game.scrollX * 0.06) % CW;
      const fy = p.y - ((game.scrollX * 0.015 + p.phase * 8) % 60);
      ctx.fillStyle = p.phase % 2 > 1 ? "#f39c12" : "#e74c3c";
      ctx.globalAlpha = 0.45 + Math.sin(p.phase) * 0.3;
      ctx.fillRect(fx, fy, p.size, p.size);
    });
    ctx.globalAlpha = 1;
  } else if (world.theme === "cave" || world.theme === "dragon") {
    game.worldParticles.forEach((p) => {
      const fx = (p.x + Math.sin(p.phase) * 4) % CW;
      const fy = p.y + Math.cos(p.phase) * 3;
      ctx.fillStyle = world.particleColor || world.accent;
      ctx.globalAlpha = 0.2 + Math.sin(p.phase * 2) * 0.18;
      ctx.fillRect(fx, fy, 2, 2);
    });
    ctx.globalAlpha = 1;
  }

  // Bodennebel nur am Weg – Perspektive „man geht durch“
  const fogGrad = ctx.createLinearGradient(0, PATH_TOP - 20, 0, GROUND);
  fogGrad.addColorStop(0, "rgba(0,0,0,0)");
  fogGrad.addColorStop(0.45, world.fog);
  fogGrad.addColorStop(1, world.fog2 || world.fog);
  ctx.fillStyle = fogGrad;
  ctx.fillRect(path.x - 12, PATH_TOP - 18, path.w + 24, GROUND - PATH_TOP + 22);
}

function renderWorldGround(world) {
  ctx.fillStyle = world.ground;
  ctx.fillRect(0, GROUND, CW, CH - GROUND);

  const path = getPath(world);
  const tileW = world.theme === "forest" ? 20 : 16;
  const tileH = 10;
  const scroll = game.scrollX * 0.55;

  for (let row = 0; row < 3; row++) {
    for (let tx = 0; tx < CW / tileW + 2; tx++) {
      const ox = tx * tileW - (scroll % tileW);
      const oy = GROUND + row * tileH;
      const onPath = ox + tileW > path.x && ox < path.x + path.w;
      if (onPath && row === 0) continue;
      const colors = [world.tile1, world.tile2, world.tile3];
      ctx.fillStyle = colors[(tx + row) % 3];
      ctx.fillRect(ox, oy, tileW - 2, tileH - 2);
      if (row === 0) {
        ctx.fillStyle = world.moss || world.verge;
        ctx.globalAlpha = 0.35;
        ctx.fillRect(ox, oy - 2, tileW - 2, 2);
        ctx.globalAlpha = 1;
      }
    }
  }
}

// ============================================
// KAMPF – KLASSEN-SPEZIFISCH
// ============================================

function attack() {
  const cls = CLASSES[game.classKey];
  const now = performance.now();
  if (now - game.lastShot < cls.attackRate) return;

  if (cls.attackType === "melee") {
    if (warriorMeleeAttack()) game.lastShot = now;
  } else if (cls.attackType === "ranged") {
    rangerShoot(cls);
    game.lastShot = now;
  } else if (cls.attackType === "magic") {
    if (mageShoot(cls)) game.lastShot = now;
  }
}

function warriorMeleeAttack() {
  const h = game.hero, st = heroStats();
  const cls = CLASSES.warrior;
  const hx = h.x + h.w / 2, hy = h.y + h.h / 2;
  const angle = Math.atan2(mouse.y - hy, mouse.x - hx);
  h.facing = Math.cos(angle) >= 0 ? 1 : -1;
  h.attackAnim = 0.14;

  let hitAny = false;
  game.enemies.forEach((e) => {
    if (e.dead || e.hp <= 0) return;
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
  return true;
}

function rangerShoot(cls) {
  const h = game.hero, st = heroStats();
  const hx = h.x + h.w / 2, hy = h.y + h.h / 2;
  const dx = mouse.x - hx, dy = mouse.y - hy;
  const dist = Math.hypot(dx, dy);
  if (dist > cls.range) return;

  let dmgMult = 1;
  const tooClose = game.enemies.some((e) => !e.dead && e.hp > 0 &&
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
}

function mageShoot(cls) {
  const h = game.hero, st = heroStats();
  const hx = h.x + h.w / 2, hy = h.y + h.h / 2;
  const dx = mouse.x - hx, dy = mouse.y - hy;
  const dist = Math.hypot(dx, dy);
  if (dist > cls.range) return;

  const angle = Math.atan2(dy, dx);
  h.facing = dx >= 0 ? 1 : -1;

  if (h.mana < cls.manaPerShot) {
    let dmg = Math.floor(st.attack * 0.4);
    const isCrit = Math.random() < st.crit;
    if (isCrit) dmg *= 2;
    game.enemies.forEach((e) => {
      if (e.dead || e.hp <= 0) return;
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
    });
    spawnMeleeSlash(hx, hy, angle, { life: 10, range: 55, owner: "player" });
    spawnBurst(hx, hy, "#8e44ad", 4, 2);
    h.attackAnim = 0.12;
    emitCombatEvent("player_staff");
    addLog("Kein Mana – Stab-Schlag!");
    return true;
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
  if (h.specialTimer < h.specialCd || game.isPaused) return;
  const st = heroStats();
  const cls = CLASSES[game.classKey];
  const hx = h.x + h.w / 2, hy = h.y + h.h / 2;

  if (game.classKey === "warrior") {
    h.specialTimer = 0;
    h.attackAnim = 0.2;
    const angle = Math.atan2(mouse.y - hy, mouse.x - hx);
    spawnMeleeSlash(hx, hy, angle, { life: 20, range: cls.specialRange, owner: "player", big: true });
    game.enemies.forEach((e) => {
      if (e.dead) return;
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
    h.specialTimer = 0;
    h.attackAnim = 0.15;
    const baseAngle = Math.atan2(mouse.y - hy, mouse.x - hx);
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
    if (h.mana < cls.manaCost) { addLog("Nicht genug Mana!"); return; }
    h.mana -= cls.manaCost;
    h.specialTimer = 0;
    h.attackAnim = 0.18;
    const ang = Math.atan2(mouse.y - hy, mouse.x - hx);
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

  // A/D Bewegung – nur horizontal (klassenabhängige Geschwindigkeit)
  const spd = CLASSES[game.classKey].moveSpeed;
  if (keys.a) { h.x -= spd * dt; h.facing = -1; }
  if (keys.d) { h.x += spd * dt; h.facing = 1; }
  h.x = Math.max(10, Math.min(CW * 0.45, h.x));
  h.y = GROUND - h.h;

  // Mana regen (nur Magier)
  if (game.classKey === "mage") h.mana = Math.min(st.maxMana, h.mana + dt * 7);

  // Auto-Angriff wenn Maus über dem Spiel ist (kein Klick nötig)
  if (mouse.onCanvas) attack();

  // Ambient-Weltpartikel (Glühwürmchen, Funken, Kristallstaub)
  if (game.worldParticles.length) {
    game.worldParticles.forEach((p) => {
      p.phase += dt * p.speed;
      p.x += p.drift * dt;
      if (p.x < -5) p.x = CW + 5;
      if (p.x > CW + 5) p.x = -5;
    });
  }

  // Schwert-Slashes & Effekte altern
  game.meleeSlashes = game.meleeSlashes.filter((s) => { s.life--; return s.life > 0; });
  game.attackEffects = game.attackEffects.filter((fx) => { fx.life--; return fx.life > 0; });

  // Gegner bewegen, stoppen & angreifen
  const stopLine = h.x + h.w + 4;
  game.enemies.forEach((e) => {
    if (e.dead || e.hp <= 0) return;
    e.anim += dt * 6;
    if (e.hitFlash > 0) e.hitFlash -= dt * 30;
    if (e.attackAnim > 0) e.attackAnim -= dt * 4;
    if (e.attackWindup > 0) e.attackWindup -= dt * 5;

    // Zum Held laufen bis Stopplinie
    if (e.x > stopLine) {
      e.x -= e.speed * 50 * dt;
    }
    // Nicht durch den Held laufen!
    if (e.x < stopLine) e.x = stopLine;

    const inRange = e.x < h.x + h.w + 70 && e.x + e.w > h.x;

    if (inRange) {
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
    } else {
      e.attackWindup = 0;
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
        if (e.hp <= 0) continue;
        if (p.x > e.x && p.x < e.x+e.w && p.y > e.y && p.y < e.y+e.h) {
          e.hp -= p.dmg; e.hitFlash = 6;
          spawnDamage(e.x+e.w/2, e.y, p.dmg, p.crit);
          spawnImpactRing(e.x + e.w / 2, e.y + e.h / 2, p.big ? 24 : 14, p.crit ? "#f1c40f" : "#ecf0f1", 10);
          emitCombatEvent("enemy_hit");
          if (p.explosive) {
            spawnExplosion(p.x, p.y, 90);
            game.enemies.forEach((o) => {
              if (o.dead || o.hp <= 0) return;
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
  const oldWorld = getWorld().name;
  game.runGold += gold; game.runXp += xp;
  game.monstersDefeated++; game.dungeonLevel++;
  const newWorld = getWorld().name;
  if (newWorld !== oldWorld) {
    initDecor();
    addLog("⚠ NEUE WELT: " + newWorld + " – viel schwerer!", "boss");
    const ambKey = WAVE_DATA?.worldAmbient?.[newWorld];
    if (ambKey) playSound(ambKey);
    emitCombatEvent("world_change");
  }
  addLog(e.name + " besiegt! +" + gold + " Gold", e.isBoss ? "boss" : "");
  game.coins.push({ x: e.x+e.w/2, y: e.y, val: gold, life: 3 });
  for (let i = 0; i < 5; i++) game.particles.push({ x:e.x+e.w/2, y:e.y+e.h/2, vx:(Math.random()-0.5)*3, vy:-Math.random()*4, life:20, color:"#f1c40f", size:2 });

  while (game.runXp >= game.playerLevel * BALANCE.xpPerLevel) {
    game.runXp -= game.playerLevel * BALANCE.xpPerLevel;
    game.playerLevel++;
    game.hero.hp = Math.min(heroStats().maxHp, game.hero.hp + Math.floor(heroStats().maxHp * 0.12));
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

  // Welt: Himmel → Tiefe → Weg → Dekor → Boden → Kronendach → Atmosphäre
  renderWorldSky(world);
  renderWorldDepth(world);
  renderWorldMidScatter(world);
  renderWorldWalkway(world);

  game.decor.forEach((d) => {
    const dx = decorScreenX(d);
    const sp = SPRITES[d.type];
    if (sp) drawDecorSprite(ctx, sp, dx, d.y, !!d.flip);
  });

  renderWorldGround(world);
  renderWorldCanopy(world);
  renderWorldAtmosphere(world);

  if (!game.hero) {
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
    if (cls.attackType === "melee") {
      ctx.strokeStyle = "rgba(231,76,60,0.35)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      const a = Math.atan2(mouse.y - hy, mouse.x - hx);
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

  renderWorldForegroundFrame(world);

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

  // Fadenkreuz
  if (game.isRunning && !game.isPaused && mouse.onCanvas) {
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(mouse.x - 8, mouse.y); ctx.lineTo(mouse.x + 8, mouse.y);
    ctx.moveTo(mouse.x, mouse.y - 8); ctx.lineTo(mouse.x, mouse.y + 8);
    ctx.stroke();
  }

  if (h.specialTimer >= h.specialCd) {
    ctx.fillStyle = "rgba(142,68,173,0.8)";
    ctx.font = "bold 10px Courier New";
    ctx.fillText("[1] SPEZIAL", h.x, h.y - 14);
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
