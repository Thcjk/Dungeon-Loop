/* ============================================
   Dungeon Loop – Pixel Canvas Edition
   Maus über Canvas = Auto-Angriff | 1 = Spezial
   WASD = Bewegen | P = Pause
   ============================================ */

const SUPABASE_URL = "DEINE_SUPABASE_URL";
const SUPABASE_KEY = "DEIN_SUPABASE_KEY";
let supabase = null;

// --- Canvas ---
const PIXEL = 3;
const CW = 640, CH = 360;
const GROUND = 290;
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
  x: "#abb2b9", X: "#808b96", q: "#1c2833"
};

const SPRITES = {
  warrior: [
    "....KKKK....","...KRRRRK...","..KRRRRRRK..","..KRsSSsrK..",
    "..KRRRRRRK..","..KRRooRRK..","...KRRRRK...","...KRRRRK...",
    "...Kr..rK...","...Kr..rK...","...KK..KK..."
  ],
  ranger: [
    "....KKKK....","...KGGGGK...","..KGGGGGGK..","..KGsSSsGK..",
    "..KGGGGGGK..","..KGGllGGK..","...KGGGGK...","...KGGGGK...",
    "...Kg..gK...","...Kg..gK...","...KK..KK..."
  ],
  mage: [
    "....KKKK....","...KPPPPK...","..KPPBBPPK..","..KPsSSsPK..",
    "..KPPPPPPK..","..KPPnnPPK..","...KPPPPK...","...KPPPPK...",
    "...Kp..pK...","...Kp..pK...","...KK..KK..."
  ],
  goblin: [
    "....KKKK....","...KmmGGK...","..KmGGGGmK..","..KmGGGGmK..",
    "..KmGGGGmK..","...KGGGGK...","...Kg..gK...","...Kg..gK...",
    "...KK..KK..."
  ],
  skelett: [
    "....KKKK....","...KWWWWK...","..KWWWWWWK..","..KWsWWsWK..",
    "..KWWWWWWK..","...KWWWWK...","...Kw..wK...","...Kw..wK...",
    "...KK..KK..."
  ],
  schleim: [
    "....KKKK....","...KmmZmK...","..KmZZZZmK..","..KmZZZZmK..",
    "..KmZZZZmK..","...KZZZZK...","...KZZZZK...","...KKKKKK..."
  ],
  bandit: [
    "....KKKK....","...KyyDDK...","..KyDDDDyK..","..KyDsSDyK..",
    "..KyDDDDyK..","...KyDDyK...","...Ky..yK...","...Ky..yK...",
    "...KK..KK..."
  ],
  wolf: [
    "....KKKK....","...KddDDK...","..KddDDddK..",".KddDsSDdK.",
    "..KddDDddK..","...KddDdK...","...Kd..dK...","...Kd..dK...",
    "...KK..KK..."
  ],
  spinne: [
    "....KKKK....","...KuPuPK...","..KuPPPPuK..",".KuPuPPuPuK.",
    "..KuPPPPuK..","...KuPPuK...",".KuK.K.K.uK.","...KK..KK..."
  ],
  boss_ork: [
    "..KKKKKKKK..",".KHHHHHHHK.","KHHHHHHHHHK","KHHsHHsHHHK",
    "KHHHHHHHHHK",".KHHHHHHHK.",".KHo..oHK.",".KHo..oHK.",
    "..KKK..KKK.."
  ],
  boss_schatten: [
    "..KKKKKKKK..",".KaaaaaaaK.","KaaaaaaaaaK","KaaKaaKaaaK",
    "KaaaaaaaaaK",".KaaaaaaaK.",".KaK..KaK.",".KaK..KaK.",
    "..KKK..KKK.."
  ],
  boss_feuer: [
    "..KKKKKKKK..",".KeeeeeeeK.","KeeffffeeK","KeefSSfeeK",
    "KeeffffeeK",".KeeeeeeeK.",".KeK..KeK.",".KeK..KeK.",
    "..KKK..KKK.."
  ],
  boss_drache: [
    ".KKKKKKKKKK.","KRRRRRRRRRK","KRRfRRfRRRK","KRRRRRRRRRK",
    "KRRRRRRRRRK",".KRRRRRRRK.",".KRo..oRK.",".KRo..oRK.",
    "..KKK..KKK.."
  ],
  boss_nekro: [
    "..KKKKKKKK..",".KPPPPPPPK.","KPPPPPPPPPK","KPPsPPsPPPK",
    "KPPPPPPPPPK",".KPPPPPPPK.",".KpK..KpK.",".KpK..KpK.",
    "..KKK..KKK.."
  ],
  tree: [
    "....KK....","...KGGK...","..KGGGGK..","..KGGGGK..",
    "...KGGK...","....GK....","....GK....","...KGGK..."
  ],
  grave: [
    "...KKK...","..KWWWk..",".KWWWWWK.",".KWWWWWK.",
    ".KWWWWWK.","..KWWWK..","...KKK..."
  ],
  bush: [
    "....KK....","..KmZmK..",".KmZZZmk.",".KmZZZmk.",
    "..KZZZK..","...KZK..."
  ],
  rock: [
    "...KKK...","..KXXXk..",".KXXXXXK.",".KXXxXXK.",
    "..KXXXK..","...KKK..."
  ],
  crystal: [
    "...KiK...","..KiBiK..",".KiBBiBK.","..KiBiK..",
    "...KkK..."
  ],
  cross: ["..K..",".KwK.","KwwwK",".KwK.","..K.."],
  moon: ["..KyK.",".KyyyK",".KyyyK","..KyK."],
  slash: ["...K...","..KRK..",".KRRRK.","..KRK..","...K..."],
  projectile_sword: ["..K..",".KRK.",".KRK.","..K.."],
  projectile_arrow: ["..K..",".KyK.","KyyyK","..K.."],
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
    name: "Dunkler Wald", min: 1, danger: 1,
    hpMult: 1, atkMult: 1, speedMult: 1,
    bg: "#030308", sky: "#08081a", hill: "#0c1820",
    ground: "#142838", tile1: "#1e3d52", tile2: "#2a5870", tile3: "#1a3348",
    accent: "#3dba8c", star: "#4a9a7a", fog: "rgba(10,30,24,0.4)",
    decor: ["tree", "tree", "grave", "bush", "cross"]
  },
  {
    name: "Verfluchte Höhle", min: 10, danger: 2,
    hpMult: 1.6, atkMult: 1.45, speedMult: 1.15,
    bg: "#04040c", sky: "#0a0a1e", hill: "#12122a",
    ground: "#1a1a32", tile1: "#2a2a48", tile2: "#3a3a62", tile3: "#22224a",
    accent: "#9b59b6", star: "#7d5ea8", fog: "rgba(20,10,40,0.5)",
    decor: ["rock", "rock", "crystal", "grave", "cross"]
  },
  {
    name: "Schlossruine", min: 20, danger: 3,
    hpMult: 2.2, atkMult: 1.85, speedMult: 1.25,
    bg: "#060510", sky: "#100c1a", hill: "#1a1428",
    ground: "#282038", tile1: "#3a3050", tile2: "#4a4060", tile3: "#322848",
    accent: "#95a5a6", star: "#708090", fog: "rgba(30,25,40,0.45)",
    decor: ["grave", "grave", "rock", "cross", "tree"]
  },
  {
    name: "Feuervulkan", min: 30, danger: 4,
    hpMult: 3.0, atkMult: 2.3, speedMult: 1.35,
    bg: "#0a0204", sky: "#180608", hill: "#280a08",
    ground: "#3a1208", tile1: "#5a1a10", tile2: "#7a2818", tile3: "#4a150c",
    accent: "#e74c3c", star: "#f39c12", fog: "rgba(60,15,5,0.5)",
    decor: ["rock", "rock", "crystal", "cross"]
  },
  {
    name: "Drachenland", min: 40, danger: 5,
    hpMult: 4.0, atkMult: 2.9, speedMult: 1.45,
    bg: "#05020a", sky: "#0c0618", hill: "#180a28",
    ground: "#220e38", tile1: "#3a1860", tile2: "#502080", tile3: "#2a1048",
    accent: "#f39c12", star: "#d4a017", fog: "rgba(40,10,60,0.5)",
    decor: ["crystal", "grave", "rock", "cross", "tree"]
  }
];

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

const game = {
  playerName: "", classKey: "warrior", playerId: null,
  totalGold: 0, upgrades: {},
  isRunning: false, isPaused: false, isDead: false,
  dungeonLevel: 1, runGold: 0, runXp: 0, playerLevel: 1, monstersDefeated: 0,
  hero: null, enemies: [], projectiles: [], particles: [], coins: [], meleeSlashes: [],
  combatLog: [], bestLoot: null,
  specialTimer: 0, lastShot: 0,
  scrollX: 0, decor: [], waveCooldown: 0,
  loopId: null
};

const $ = (id) => document.getElementById(id);

// ============================================
// PIXEL ZEICHNEN
// ============================================

function drawSprite(c, rows, x, y, flip) {
  const sc = PIXEL;
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

function drawPreviews() {
  document.querySelectorAll(".preview-sprite").forEach((cv) => {
    const c = cv.getContext("2d");
    c.imageSmoothingEnabled = false;
    c.clearRect(0, 0, 48, 48);
    const key = cv.dataset.preview;
    const sp = SPRITES[key];
    if (sp) drawSprite(c, sp, 8, 4, false);
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
  loadLeaderboard();
  initSupabase();
});

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
  });
  window.addEventListener("keyup", (e) => { keys[e.key.toLowerCase()] = false; });
  updateClassHint();
}

function updateClassHint() {
  const cls = CLASSES[game.classKey];
  const hint = $("controls-hint");
  if (!hint || !cls) return;
  if (cls.attackType === "melee") {
    hint.innerHTML = "<kbd>WASD</kbd> Bewegen | <kbd>Maus</kbd> drüber = <strong>Auto-Schwert</strong> | <kbd>1</kbd> Schildschlag | <kbd>F</kbd> Vollbild";
  } else if (cls.attackType === "ranged") {
    hint.innerHTML = "<kbd>WASD</kbd> Bewegen | <kbd>Maus</kbd> drüber = <strong>Auto-Pfeile</strong> | <kbd>1</kbd> 7 Pfeile | <kbd>F</kbd> Vollbild";
  } else {
    hint.innerHTML = "<kbd>WASD</kbd> Bewegen | <kbd>Maus</kbd> drüber = <strong>Auto-Zauber</strong> | <kbd>1</kbd> Feuerball | <kbd>F</kbd> Vollbild";
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
    enterGame("Bereit! Run starten, dann Maus zum Kämpfen.");
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
  ["game-section","upgrade-section","log-section"].forEach((id) => $(id).classList.remove("hidden"));
  $("setup-section").classList.add("collapsed");
  updateTotalGold(); renderUpgradeButtons();
  $("load-hint").textContent = msg;
  $("game-section").scrollIntoView({ behavior: "smooth" });
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

function startRun() {
  if (game.isRunning && !game.isDead) return;
  stopLoop();
  resetRun();
  createHero();
  game.isRunning = true; game.isPaused = false; game.isDead = false;
  $("gameover-panel").classList.add("hidden");
  $("game-frame").classList.remove("hidden");
  $("btn-start-run").disabled = true;
  $("btn-pause").disabled = false;
  $("btn-restart").disabled = false;
  canvas.focus();
  spawnWave();
  addLog("Run gestartet – Level 1. Stirbst du? Upgrades kaufen!");
  updateClassHint();
  startLoop();
}

function resetRun() {
  game.dungeonLevel = 1; game.runGold = 0; game.runXp = 0; game.playerLevel = 1;
  game.monstersDefeated = 0; game.combatLog = []; game.bestLoot = null;
  game.enemies = []; game.projectiles = []; game.particles = []; game.coins = []; game.meleeSlashes = [];
  game.scrollX = 0; game.decor = []; game.specialTimer = 0; game.waveCooldown = 0;
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
  const cls = CLASSES[game.classKey], u = game.upgrades;
  const ub = (key) => {
    const up = UPGRADES.find((x) => x.key === key);
    return (u[key] || 0) * up.bonus;
  };
  game.hero = {
    x: 70, y: GROUND - 40, vx: 0, vy: 0,
    w: spriteW(SPRITES[game.classKey]), h: spriteH(SPRITES[game.classKey]),
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
    facing: 1, anim: 0
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
  const stats = getEnemyStats(isBoss);
  const idx = index || 0;

  game.enemies.push({
    id: ++enemyId, name, sprite: spKey, isBoss,
    x: CW - 40 - idx * 50 - Math.random() * 15,
    y: GROUND - spriteH(sp) - 4,
    w: spriteW(sp), h: spriteH(sp),
    maxHp: stats.hp, hp: stats.hp,
    attack: stats.attack,
    goldReward: stats.gold, xpReward: stats.xp,
    speed: stats.speed,
    attackInterval: stats.attackInterval,
    hitFlash: 0, anim: Math.random() * 6, dead: false, attackTimer: 0
  });
}

function initDecor() {
  const world = getWorld();
  game.decor = [];
  const types = world.decor;
  for (let i = 0; i < 16; i++) {
    game.decor.push({
      x: i * 75 + Math.random() * 30,
      type: types[Math.floor(Math.random() * types.length)],
      y: GROUND - 35 - Math.random() * 45,
      parallax: 0.2 + Math.random() * 0.25
    });
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
    if (e.hp <= 0 && !e.dead) { e.dead = true; onEnemyKill(e); }
    hitAny = true;
  });

  game.meleeSlashes.push({ x: hx, y: hy, angle, life: 14, range: cls.range });
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
    life: 70, owner: "player", pierce: false
  });
  h.facing = dx >= 0 ? 1 : -1;
}

function mageShoot(cls) {
  const h = game.hero, st = heroStats();
  const hx = h.x + h.w / 2, hy = h.y + h.h / 2;
  const dx = mouse.x - hx, dy = mouse.y - hy;
  const dist = Math.hypot(dx, dy);
  if (dist > cls.range) return;

  let dmg = st.magicDamage;
  if (h.mana < cls.manaPerShot) {
    dmg = st.attack * 0.4;
    addLog("Kein Mana – Stab-Schlag!");
  } else {
    h.mana -= cls.manaPerShot;
  }

  const isCrit = Math.random() < st.crit;
  if (isCrit) dmg *= 2;
  const len = dist || 1;

  game.projectiles.push({
    x: hx, y: hy, vx: (dx / len) * cls.projSpeed, vy: (dy / len) * cls.projSpeed,
    dmg: Math.floor(dmg), crit: isCrit, sprite: cls.proj,
    life: 65, owner: "player", magic: true
  });
  h.facing = dx >= 0 ? 1 : -1;
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
    const angle = Math.atan2(mouse.y - hy, mouse.x - hx);
    game.meleeSlashes.push({ x: hx, y: hy, angle, life: 20, range: cls.specialRange, big: true });
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
      if (e.hp <= 0 && !e.dead) { e.dead = true; onEnemyKill(e); }
    });
    addLog("Schildschlag! – Nahkampf-Spezial", "special");
    for (let i = 0; i < 10; i++) game.particles.push({ x: hx, y: hy, vx: Math.cos(angle + (Math.random()-0.5)) * 5, vy: Math.sin(angle + (Math.random()-0.5)) * 5, life: 18, color: "#e74c3c", size: 4 });

  } else if (game.classKey === "ranger") {
    h.specialTimer = 0;
    const baseAngle = Math.atan2(mouse.y - hy, mouse.x - hx);
    for (let a = -3; a <= 3; a++) {
      const ang = baseAngle + a * 0.12;
      game.projectiles.push({
        x: hx, y: hy, vx: Math.cos(ang) * 16, vy: Math.sin(ang) * 16,
        dmg: Math.floor(st.attack * 2), crit: Math.random() < st.crit + 0.25,
        sprite: "projectile_arrow", life: 80, owner: "player", pierce: true
      });
    }
    addLog("Präzisionsschuss! – 7 Pfeile", "special");

  } else if (game.classKey === "mage") {
    if (h.mana < cls.manaCost) { addLog("Nicht genug Mana!"); return; }
    h.mana -= cls.manaCost;
    h.specialTimer = 0;
    const ang = Math.atan2(mouse.y - hy, mouse.x - hx);
    game.projectiles.push({
      x: hx, y: hy, vx: Math.cos(ang) * 6, vy: Math.sin(ang) * 6,
      dmg: Math.floor(st.magicDamage * 3), crit: false,
      sprite: "projectile_fire", life: 55, owner: "player", explosive: true, big: true
    });
    addLog("Feuerball! – Explosion", "special");
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
  const h = game.hero, st = heroStats();
  game.scrollX += dt * 40;
  h.specialTimer += dt;
  h.anim += dt * 8;

  // WASD Bewegung (klassenabhängige Geschwindigkeit)
  const spd = CLASSES[game.classKey].moveSpeed;
  if (keys.w) h.y -= spd * dt;
  if (keys.s) h.y += spd * dt;
  if (keys.a) { h.x -= spd * dt; h.facing = -1; }
  if (keys.d) { h.x += spd * dt; h.facing = 1; }
  h.x = Math.max(10, Math.min(CW * 0.45, h.x));
  h.y = Math.max(GROUND - 80, Math.min(GROUND - h.h + 5, h.y));

  // Mana regen (nur Magier)
  if (game.classKey === "mage") h.mana = Math.min(st.maxMana, h.mana + dt * 7);

  // Auto-Angriff wenn Maus über dem Spiel ist (kein Klick nötig)
  if (mouse.onCanvas) attack();

  // Schwert-Slashs altern
  game.meleeSlashes = game.meleeSlashes.filter((s) => { s.life--; return s.life > 0; });

  // Gegner bewegen, stoppen & angreifen
  const stopLine = h.x + h.w + 4;
  game.enemies.forEach((e) => {
    if (e.dead || e.hp <= 0) return;
    e.anim += dt * 6;
    if (e.hitFlash > 0) e.hitFlash -= dt * 30;

    // Auf gleiche Höhe wie Held
    e.y += (h.y - e.y) * Math.min(1, dt * 5);

    // Zum Held laufen bis Stopplinie
    if (e.x > stopLine) {
      e.x -= e.speed * 50 * dt;
    }
    // Nicht durch den Held laufen!
    if (e.x < stopLine) e.x = stopLine;

    const inRange = e.x < h.x + h.w + 70 && e.x + e.w > h.x;
    const yClose = Math.abs((e.y + e.h / 2) - (h.y + h.h / 2)) < 40;

    if (inRange && yClose) {
      e.attackTimer += dt;
      const interval = e.attackInterval || 0.75;
      if (e.attackTimer >= interval) {
        e.attackTimer = 0;
        const dmg = Math.max(1, e.attack - st.defense);
        h.hp -= dmg;
        spawnDamage(h.x + h.w / 2, h.y - 5, dmg, false, true);
        e.hitFlash = 5;
        if (h.hp <= 0) { h.hp = 0; onDeath(); }
      }
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
    if (p.life <= 0) return false;
    if (p.owner === "player") {
      for (const e of game.enemies) {
        if (e.hp <= 0) continue;
        if (p.x > e.x && p.x < e.x+e.w && p.y > e.y && p.y < e.y+e.h) {
          e.hp -= p.dmg; e.hitFlash = 6;
          spawnDamage(e.x+e.w/2, e.y, p.dmg, p.crit);
          if (p.explosive) {
            game.enemies.forEach((o) => {
              if (o.dead || o.hp <= 0) return;
              if (Math.hypot(o.x + o.w/2 - p.x, o.y + o.h/2 - p.y) < 90) {
                o.hp -= Math.floor(p.dmg * 0.45); o.hitFlash = 5;
                if (o.hp <= 0 && !o.dead) { o.dead = true; onEnemyKill(o); }
              }
            });
            for (let i = 0; i < 14; i++) game.particles.push({ x:p.x, y:p.y, vx:(Math.random()-0.5)*6, vy:(Math.random()-0.5)*6, life:28, color:"#e74c3c", size:4 });
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
    if (Math.hypot(c.x - h.x, c.y - h.y) < 30) { game.runGold += c.val; return false; }
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
      spawnWave();
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
  }
  addLog(e.name + " besiegt! +" + gold + " Gold", e.isBoss ? "boss" : "");
  game.coins.push({ x: e.x+e.w/2, y: e.y, val: gold, life: 3 });
  for (let i = 0; i < 5; i++) game.particles.push({ x:e.x+e.w/2, y:e.y+e.h/2, vx:(Math.random()-0.5)*3, vy:-Math.random()*4, life:20, color:"#f1c40f", size:2 });

  while (game.runXp >= game.playerLevel * BALANCE.xpPerLevel) {
    game.runXp -= game.playerLevel * BALANCE.xpPerLevel;
    game.playerLevel++;
    game.hero.hp = Math.min(heroStats().maxHp, game.hero.hp + Math.floor(heroStats().maxHp * 0.12));
    addLog("Level Up! Held " + game.playerLevel);
  }
  if (Math.random() < BALANCE.lootChance) generateLoot();
}

function onDeath() {
  game.isDead = true; game.isRunning = false;
  stopLoop();
  game.totalGold += game.runGold;
  savePlayer();
  addLog("Game Over!", "death");

  const world = getWorld();
  $("gameover-panel").classList.remove("hidden");
  $("gameover-summary").textContent =
    "Level " + game.dungeonLevel + " (" + world.name + ") | " +
    game.monstersDefeated + " Monster | " + game.runGold + " Gold";
  $("final-score").textContent = calcScore();
  $("save-hint").textContent = "Tipp: " + getUpgradeTip();
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

  // Himmel
  const grad = ctx.createLinearGradient(0, 0, 0, GROUND);
  grad.addColorStop(0, world.sky);
  grad.addColorStop(1, world.bg);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CW, GROUND);

  // Hügel-Silhouette
  ctx.fillStyle = world.hill;
  for (let i = 0; i < 5; i++) {
    const hx = ((i * 180 - game.scrollX * 0.08) % (CW + 200)) - 60;
    ctx.fillRect(hx, GROUND - 50 - i * 8, 140 + i * 20, 60);
  }

  // Sterne / Kreuze (wie Referenzbild)
  for (let i = 0; i < 40; i++) {
    const sx = (i * 67 + game.scrollX * 0.05) % CW;
    const sy = 15 + (i * 43) % (GROUND - 80);
    ctx.fillStyle = world.star;
    if (i % 5 === 0) {
      drawSprite(ctx, SPRITES.cross, sx, sy, false);
    } else {
      ctx.fillRect(sx, sy, 2, 2);
    }
  }

  // Mond
  drawSprite(ctx, SPRITES.moon, CW - 70, 25, false);

  // Nebel
  ctx.fillStyle = world.fog;
  ctx.fillRect(0, GROUND - 60, CW, 50);

  // Dekoration Parallax
  game.decor.forEach((d) => {
    const dx = ((d.x - game.scrollX * d.parallax) % (CW + 120)) - 30;
    const sp = SPRITES[d.type];
    if (sp) drawSprite(ctx, sp, dx, d.y, false);
  });

  // Pixel-Boden (Ziegel wie Referenz)
  ctx.fillStyle = world.ground;
  ctx.fillRect(0, GROUND, CW, CH - GROUND);
  const tileW = 16, tileH = 12;
  for (let row = 0; row < 3; row++) {
    for (let tx = 0; tx < CW / tileW + 2; tx++) {
      const ox = tx * tileW - (game.scrollX % tileW);
      const oy = GROUND + row * tileH;
      const colors = [world.tile1, world.tile2, world.tile3];
      ctx.fillStyle = colors[(tx + row) % 3];
      ctx.fillRect(ox, oy, tileW - 2, tileH - 2);
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(ox, oy + tileH - 4, tileW - 2, 2);
    }
  }

  if (!game.hero) return;

  game.coins.forEach((c) => drawSprite(ctx, SPRITES.coin, c.x - 6, c.y, false));

  // Gegner
  game.enemies.forEach((e) => {
    if (e.hp <= 0) return;
    const bob = Math.sin(e.anim) * 2;
    if (e.hitFlash > 0) ctx.globalAlpha = 0.5 + Math.sin(e.hitFlash) * 0.3;
    drawSprite(ctx, SPRITES[e.sprite], e.x, e.y + bob, true);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#111"; ctx.fillRect(e.x, e.y - 6, e.w, 4);
    ctx.fillStyle = e.isBoss ? "#f1c40f" : "#e74c3c";
    ctx.fillRect(e.x, e.y - 6, e.w * (e.hp / e.maxHp), 4);
  });

  const h = game.hero;
  const bob = Math.sin(h.anim) * 2;
  const hx = h.x + h.w / 2, hy = h.y + h.h / 2;

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

  // Schwert-Slashes
  game.meleeSlashes.forEach((s) => {
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.angle);
    const alpha = s.life / 14;
    ctx.globalAlpha = alpha * (s.big ? 0.9 : 0.7);
    const sc = s.big ? 2.5 : 1.8;
    drawSprite(ctx, SPRITES.slash, s.range * 0.4, -6 * sc, false);
    ctx.restore();
  });

  drawSprite(ctx, SPRITES[game.classKey], h.x, h.y + bob, h.facing < 0);

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
  ["combat-log", "combat-log-full"].forEach((id) => {
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
