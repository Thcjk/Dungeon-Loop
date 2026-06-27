/* ============================================
   Dungeon Loop – Pixel Canvas Edition
   Maus = Zielen + Schießen | Q = Spezial
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
  warrior: { name: "Krieger", hp: 150, attack: 14, defense: 8, crit: 0.05, mana: 0, magicDamage: 0, special: "Schildschlag", specialCd: 6, proj: "projectile_sword", projSpeed: 7 },
  ranger:  { name: "Waldläufer", hp: 100, attack: 18, defense: 3, crit: 0.15, mana: 0, magicDamage: 0, special: "Präzisionsschuss", specialCd: 5, proj: "projectile_arrow", projSpeed: 11 },
  mage:    { name: "Magier", hp: 80, attack: 10, defense: 2, crit: 0.10, mana: 120, magicDamage: 24, special: "Feuerball", specialCd: 5, manaCost: 25, proj: "projectile_fire", projSpeed: 6 }
};

const NORMAL_MONSTERS = ["Goblin","Skelett","Schleim","Bandit","Wolf","Spinne"];
const BOSS_MONSTERS = ["Ork-Champion","Schattenritter","Feuerdämon","Drachenwächter","Nekromant"];

const WORLDS = [
  { name: "Dunkler Wald", min: 1,  bg: "#050508", ground: "#1a3a4a", ground2: "#2e5a6a", accent: "#2ecc71" },
  { name: "Verfluchte Höhle", min: 10, bg: "#080810", ground: "#2a2a4a", ground2: "#3d3d6a", accent: "#9b59b6" },
  { name: "Schlossruine", min: 20, bg: "#0a0810", ground: "#3a3048", ground2: "#524868", accent: "#95a5a6" },
  { name: "Feuervulkan", min: 30, bg: "#100508", ground: "#4a1a10", ground2: "#6b2a18", accent: "#e74c3c" },
  { name: "Drachenland", min: 40, bg: "#08040f", ground: "#2a1040", ground2: "#4a1870", accent: "#f39c12" }
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
  { key: "upgrade_attack", label: "Angriff", baseCost: 50 },
  { key: "upgrade_health", label: "Leben", baseCost: 50 },
  { key: "upgrade_defense", label: "Verteidigung", baseCost: 50 },
  { key: "upgrade_crit", label: "Krit-Chance", baseCost: 80 },
  { key: "upgrade_gold", label: "Gold-Bonus", baseCost: 60 },
  { key: "upgrade_xp", label: "XP-Bonus", baseCost: 60 },
  { key: "upgrade_magic", label: "Magieschaden", baseCost: 70 },
  { key: "upgrade_mana", label: "Mana", baseCost: 70 },
  { key: "upgrade_cooldown", label: "Cooldown", baseCost: 100 }
];

const LOOT_CHANCE = 0.25, XP_PER_LEVEL = 100;
const FIRE_RATE = 180; // ms zwischen Schüssen
let enemyId = 0;

const game = {
  playerName: "", classKey: "warrior", playerId: null,
  totalGold: 0, upgrades: {},
  isRunning: false, isPaused: false, isDead: false,
  dungeonLevel: 1, runGold: 0, runXp: 0, playerLevel: 1, monstersDefeated: 0,
  hero: null, enemies: [], projectiles: [], particles: [], coins: [],
  combatLog: [], bestLoot: null,
  specialTimer: 0, lastShot: 0,
  scrollX: 0, decor: [], waveTimer: 0,
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
    });
  });
  const bind = (id, fn) => { const el = $(id); if (el) el.addEventListener("click", fn); };
  bind("btn-load-player", loadPlayer);
  bind("btn-start-run", startRun);
  bind("btn-pause", togglePause);
  bind("btn-restart", restartRun);
  bind("btn-save-score", saveScore);
  bind("btn-reload-leaderboard", loadLeaderboard);

  canvas.addEventListener("mousemove", onMouseMove);
  canvas.addEventListener("mousedown", (e) => { mouse.down = true; e.preventDefault(); });
  canvas.addEventListener("mouseup", () => { mouse.down = false; });
  canvas.addEventListener("mouseleave", () => { mouse.down = false; mouse.onCanvas = false; });
  canvas.addEventListener("mouseenter", () => { mouse.onCanvas = true; });

  window.addEventListener("keydown", (e) => {
    keys[e.key.toLowerCase()] = true;
    if (e.key.toLowerCase() === "p" && game.isRunning) togglePause();
    if (e.key.toLowerCase() === "q" && game.isRunning) useSpecial();
  });
  window.addEventListener("keyup", (e) => { keys[e.key.toLowerCase()] = false; });
}

function onMouseMove(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = CW / rect.width, scaleY = CH / rect.height;
  mouse.x = (e.clientX - rect.left) * scaleX;
  mouse.y = (e.clientY - rect.top) * scaleY;
  mouse.onCanvas = true;
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
  addLog("Run gestartet – Maus zielen, halten zum Schießen!");
  startLoop();
}

function resetRun() {
  game.dungeonLevel = 1; game.runGold = 0; game.runXp = 0; game.playerLevel = 1;
  game.monstersDefeated = 0; game.combatLog = []; game.bestLoot = null;
  game.enemies = []; game.projectiles = []; game.particles = []; game.coins = [];
  game.scrollX = 0; game.decor = []; game.specialTimer = 0; game.waveTimer = 0;
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
  game.hero = {
    x: 70, y: GROUND - 40, vx: 0, vy: 0,
    w: spriteW(SPRITES[game.classKey]), h: spriteH(SPRITES[game.classKey]),
    maxHp: cls.hp + u.upgrade_health * 15, hp: cls.hp + u.upgrade_health * 15,
    attack: cls.attack + u.upgrade_attack * 2, defense: cls.defense + u.upgrade_defense,
    crit: cls.crit + u.upgrade_crit * 0.01,
    magicDamage: cls.magicDamage + u.upgrade_magic * 3,
    maxMana: cls.mana + u.upgrade_mana * 10, mana: cls.mana + u.upgrade_mana * 10,
    goldBonus: 1 + u.upgrade_gold * 0.05, xpBonus: 1 + u.upgrade_xp * 0.05,
    specialCd: Math.max(2, cls.specialCd - u.upgrade_cooldown * 0.4),
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

// ============================================
// GEGNER & WELLEN
// ============================================

function spawnWave() {
  const count = Math.min(6, 2 + Math.floor(game.dungeonLevel / 3));
  const isBoss = game.dungeonLevel % 10 === 0;
  for (let i = 0; i < count; i++) spawnEnemy(isBoss && i === 0);
  if (isBoss) addLog("⚠ BOSS-WELLE!", "boss");
}

function spawnEnemy(isBoss) {
  const lv = game.dungeonLevel;
  const names = isBoss ? BOSS_MONSTERS : NORMAL_MONSTERS;
  const name = names[Math.floor(Math.random() * names.length)];
  const spKey = MONSTER_SPRITE[name];
  const sp = SPRITES[spKey];
  const hpM = isBoss ? 4 : 1, atkM = isBoss ? 2.2 : 1, rewM = isBoss ? 2.5 : 1;

  game.enemies.push({
    id: ++enemyId, name, sprite: spKey, isBoss,
    x: CW + 30 + Math.random() * 120, y: GROUND - spriteH(sp) + Math.random() * 20 - 10,
    w: spriteW(sp), h: spriteH(sp),
    maxHp: Math.floor((20 + lv * 7) * hpM), hp: Math.floor((20 + lv * 7) * hpM),
    attack: Math.floor((3 + lv * 1.2) * atkM),
    goldReward: Math.floor((3 + lv * 2) * rewM), xpReward: Math.floor((6 + lv * 3) * rewM),
    speed: (isBoss ? 0.6 : 1) + lv * 0.02, hitFlash: 0, anim: Math.random() * 6, dead: false
  });
}

function initDecor() {
  game.decor = [];
  for (let i = 0; i < 12; i++) {
    game.decor.push({
      x: i * 90 + Math.random() * 40,
      type: Math.random() > 0.5 ? "tree" : "grave",
      y: GROUND - (Math.random() > 0.5 ? 60 : 40)
    });
  }
}

// ============================================
// KAMPF – MAUS & TASTEN
// ============================================

function shoot() {
  const now = performance.now();
  if (now - game.lastShot < FIRE_RATE) return;
  game.lastShot = now;

  const h = game.hero, st = heroStats();
  const cls = CLASSES[game.classKey];
  const hx = h.x + h.w / 2, hy = h.y + h.h / 2;
  const dx = mouse.x - hx, dy = mouse.y - hy;
  const len = Math.hypot(dx, dy) || 1;
  const speed = cls.projSpeed;

  let dmg = game.classKey === "mage" ? st.magicDamage : st.attack;
  if (game.classKey === "mage" && h.mana < 5) dmg = st.attack * 0.5;
  else if (game.classKey === "mage") h.mana = Math.max(0, h.mana - 3);

  const isCrit = Math.random() < st.crit;
  if (isCrit) dmg *= 2;

  game.projectiles.push({
    x: hx, y: hy, vx: (dx / len) * speed, vy: (dy / len) * speed,
    dmg: Math.floor(dmg), crit: isCrit, sprite: cls.proj,
    life: 80, owner: "player"
  });
  h.facing = dx >= 0 ? 1 : -1;
}

function useSpecial() {
  const h = game.hero;
  if (h.specialTimer < h.specialCd || game.isPaused) return;
  const st = heroStats();
  h.specialTimer = 0;

  if (game.classKey === "warrior") {
    game.enemies.forEach((e) => {
      if (e.dead) return;
      if (e.x < h.x + 200) {
        const dmg = Math.floor(st.attack * 2.5);
        e.hp -= dmg; e.hitFlash = 8;
        spawnDamage(e.x + e.w/2, e.y, dmg, true);
        if (e.hp <= 0 && !e.dead) { e.dead = true; onEnemyKill(e); }
      }
    });
    addLog("Schildschlag!", "special");
    for (let i = 0; i < 8; i++) game.particles.push({ x: h.x+30, y: h.y+10, vx: (Math.random()-0.5)*4, vy: -Math.random()*3, life: 20, color: "#e74c3c", size: 3 });
  } else if (game.classKey === "ranger") {
    for (let a = -2; a <= 2; a++) {
      const angle = Math.atan2(mouse.y - h.y, mouse.x - h.x) + a * 0.18;
      game.projectiles.push({ x: h.x+h.w/2, y: h.y+h.h/2, vx: Math.cos(angle)*12, vy: Math.sin(angle)*12,
        dmg: Math.floor(st.attack*1.8), crit: Math.random()<st.crit+0.2, sprite: "projectile_arrow", life: 60, owner: "player" });
    }
    addLog("Präzisionsschuss!", "special");
  } else if (game.classKey === "mage") {
    if (h.mana < CLASSES.mage.manaCost) { addLog("Nicht genug Mana!"); h.specialTimer = h.specialCd - 1; return; }
    h.mana -= CLASSES.mage.manaCost;
    game.projectiles.push({ x: h.x+h.w/2, y: h.y+h.h/2,
      vx: Math.cos(Math.atan2(mouse.y-h.y, mouse.x-h.x))*5, vy: Math.sin(Math.atan2(mouse.y-h.y, mouse.x-h.x))*5,
      dmg: Math.floor(st.magicDamage*2.5), crit: false, sprite: "projectile_fire", life: 50, owner: "player", explosive: true });
    addLog("Feuerball!", "special");
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

  // WASD Bewegung
  const spd = 140;
  if (keys.w) h.y -= spd * dt;
  if (keys.s) h.y += spd * dt;
  if (keys.a) { h.x -= spd * dt; h.facing = -1; }
  if (keys.d) { h.x += spd * dt; h.facing = 1; }
  h.x = Math.max(10, Math.min(CW * 0.4, h.x));
  h.y = Math.max(GROUND - 80, Math.min(GROUND - h.h + 5, h.y));

  // Mana regen
  if (game.classKey === "mage") h.mana = Math.min(st.maxMana, h.mana + dt * 8);

  // Schießen bei Mausklick
  if (mouse.down && mouse.onCanvas) shoot();

  // Gegner bewegen
  game.enemies.forEach((e) => {
    e.anim += dt * 6;
    if (e.hitFlash > 0) e.hitFlash -= dt * 30;
    e.x -= e.speed * 60 * dt;
    // Nahkampf-Schaden
    if (e.x < h.x + h.w + 10 && e.x + e.w > h.x - 10) {
      e.attackTimer = (e.attackTimer || 0) + dt;
      if (e.attackTimer >= 1.2) {
        e.attackTimer = 0;
        const dmg = Math.max(1, e.attack - st.defense);
        h.hp -= dmg;
        spawnDamage(h.x + h.w/2, h.y, dmg, false, true);
        if (h.hp <= 0) { h.hp = 0; onDeath(); }
      }
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
              if (Math.hypot(o.x-p.x, o.y-p.y) < 80) { o.hp -= Math.floor(p.dmg*0.4); o.hitFlash = 5; }
            });
            for (let i = 0; i < 12; i++) game.particles.push({ x:p.x, y:p.y, vx:(Math.random()-0.5)*5, vy:(Math.random()-0.5)*5, life:25, color:"#e74c3c", size:4 });
          }
          if (e.hp <= 0 && !e.dead) { e.dead = true; onEnemyKill(e); }
          return false;
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

  // Neue Welle
  game.waveTimer += dt;
  const alive = game.enemies.filter((e) => e.hp > 0);
  if (alive.length === 0) {
    game.waveTimer += dt;
    if (game.waveTimer > 1.5) { game.waveTimer = 0; spawnWave(); }
  }

  // Nachrücken
  game.enemies = game.enemies.filter((e) => e.hp > 0 || e.hitFlash > 0);

  updateHUD();
  updateStatus();
}

function onEnemyKill(e) {
  const st = heroStats();
  const gold = Math.floor(e.goldReward * st.goldBonus);
  const xp = Math.floor(e.xpReward * game.hero.xpBonus);
  game.runGold += gold; game.runXp += xp;
  game.monstersDefeated++; game.dungeonLevel++;
  addLog(e.name + " besiegt! +" + gold + " Gold", e.isBoss ? "boss" : "");
  game.coins.push({ x: e.x+e.w/2, y: e.y, val: gold, life: 3 });
  for (let i = 0; i < 5; i++) game.particles.push({ x:e.x+e.w/2, y:e.y+e.h/2, vx:(Math.random()-0.5)*3, vy:-Math.random()*4, life:20, color:"#f1c40f", size:2 });

  while (game.runXp >= game.playerLevel * XP_PER_LEVEL) {
    game.runXp -= game.playerLevel * XP_PER_LEVEL;
    game.playerLevel++;
    game.hero.hp = Math.min(heroStats().maxHp, game.hero.hp + Math.floor(heroStats().maxHp * 0.2));
    addLog("Level Up! Held " + game.playerLevel);
  }
  if (Math.random() < LOOT_CHANCE) generateLoot();
}

function onDeath() {
  game.isDead = true; game.isRunning = false;
  stopLoop();
  game.totalGold += game.runGold;
  savePlayer();
  addLog("Game Over!", "death");
  $("gameover-panel").classList.remove("hidden");
  $("gameover-summary").textContent = "Level " + game.dungeonLevel + " | " + game.monstersDefeated + " Monster";
  $("final-score").textContent = calcScore();
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
  ctx.fillStyle = world.bg;
  ctx.fillRect(0, 0, CW, CH);

  // Sterne / Partikel Hintergrund
  ctx.fillStyle = world.accent + "33";
  for (let i = 0; i < 30; i++) {
    const sx = ((i * 97 + game.scrollX * 0.1) % CW);
    const sy = (i * 53) % (GROUND - 40);
    ctx.fillRect(sx, sy, 2, 2);
  }

  // Dekoration (Parallax)
  game.decor.forEach((d) => {
    const dx = ((d.x - game.scrollX * 0.3) % (CW + 100)) - 20;
    drawSprite(ctx, SPRITES[d.type], dx, d.y, false);
  });

  // Boden
  ctx.fillStyle = world.ground;
  ctx.fillRect(0, GROUND, CW, CH - GROUND);
  ctx.fillStyle = world.ground2;
  for (let tx = 0; tx < CW + 32; tx += 16) {
    const ox = (tx - (game.scrollX % 16));
    ctx.fillRect(ox, GROUND, 14, 8);
    ctx.fillRect(ox + 4, GROUND + 10, 10, 6);
  }

  if (!game.hero) return;

  // Münzen
  game.coins.forEach((c) => drawSprite(ctx, SPRITES.coin, c.x - 6, c.y, false));

  // Gegner
  game.enemies.forEach((e) => {
    if (e.hp <= 0) return;
    const bob = Math.sin(e.anim) * 2;
    if (e.hitFlash > 0) ctx.globalAlpha = 0.5 + Math.sin(e.hitFlash) * 0.3;
    drawSprite(ctx, SPRITES[e.sprite], e.x, e.y + bob, true);
    ctx.globalAlpha = 1;
    // HP Balken
    const bw = e.w;
    ctx.fillStyle = "#111"; ctx.fillRect(e.x, e.y - 6, bw, 4);
    ctx.fillStyle = e.isBoss ? "#f1c40f" : "#e74c3c";
    ctx.fillRect(e.x, e.y - 6, bw * (e.hp / e.maxHp), 4);
  });

  // Held
  const h = game.hero;
  const bob = Math.sin(h.anim) * 2;
  drawSprite(ctx, SPRITES[game.classKey], h.x, h.y + bob, h.facing < 0);

  // Projektile
  game.projectiles.forEach((p) => drawSprite(ctx, SPRITES[p.sprite], p.x - 6, p.y - 6, p.vx < 0));

  // Schadenszahlen & Partikel
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
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(mouse.x - 8, mouse.y); ctx.lineTo(mouse.x + 8, mouse.y);
    ctx.moveTo(mouse.x, mouse.y - 8); ctx.lineTo(mouse.x, mouse.y + 8);
    ctx.stroke();
  }

  // Spezial bereit?
  if (h.specialTimer >= h.specialCd) {
    ctx.fillStyle = "rgba(142,68,173,0.6)";
    ctx.font = "bold 10px Courier New";
    ctx.fillText("[Q] SPEZIAL BEREIT", h.x, h.y - 14);
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
  const xpNeed = game.playerLevel * XP_PER_LEVEL;
  $("hud-xp-fill").style.width = (game.runXp / xpNeed * 100) + "%";
  $("hud-xp-text").textContent = Math.floor(game.runXp / xpNeed * 100) + "%";
  $("hud-gold").textContent = game.runGold;
  $("hud-level").textContent = game.dungeonLevel;
  $("hud-world").textContent = world.name;
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
    $("special-status").textContent = ready ? "Q bereit!" : Math.ceil(h.specialCd - h.specialTimer) + "s";
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

function getUpgradeCost(k) { return Math.floor(UPGRADES.find(u=>u.key===k).baseCost * Math.pow(1.5, game.upgrades[k]||0)); }

function renderUpgradeButtons() {
  const grid = $("upgrade-grid"); if (!grid) return;
  grid.innerHTML = "";
  UPGRADES.forEach((up) => {
    const lv = game.upgrades[up.key]||0, cost = getUpgradeCost(up.key);
    const btn = document.createElement("button");
    btn.className = "upgrade-btn"; btn.disabled = game.totalGold < cost;
    btn.innerHTML = '<span class="upgrade-name">' + up.label + '</span><span class="upgrade-level">Stufe ' + lv + '</span><span class="upgrade-cost">' + cost + ' 🪙</span>';
    btn.onclick = () => buyUpgrade(up.key);
    grid.appendChild(btn);
  });
}

async function buyUpgrade(k) {
  const cost = getUpgradeCost(k);
  if (game.totalGold < cost) return;
  game.totalGold -= cost; game.upgrades[k] = (game.upgrades[k]||0) + 1;
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
  if (game.combatLog.length > 8) game.combatLog.shift();
  const ul = $("combat-log"); if (!ul) return;
  ul.innerHTML = "";
  game.combatLog.forEach((e) => {
    const li = document.createElement("li");
    li.textContent = e.text; if (e.css) li.classList.add(e.css);
    ul.appendChild(li);
  });
}
