/* ============================================
   Dungeon Loop – Interaktiver Dungeon-Crawler
   Tippe Gegner an / Maus drüber = Angriff
   ============================================ */

const SUPABASE_URL = "DEINE_SUPABASE_URL";
const SUPABASE_KEY = "DEIN_SUPABASE_KEY";
let supabase = null;

// --- Klassen ---
const CLASSES = {
  warrior: { name: "Krieger", icon: "⚔️", hp: 150, attack: 12, defense: 8, crit: 0.05, mana: 0, magicDamage: 0, special: "Schildschlag", specialCooldown: 8 },
  ranger:  { name: "Waldläufer", icon: "🏹", hp: 100, attack: 17, defense: 3, crit: 0.15, mana: 0, magicDamage: 0, special: "Präzisionsschuss", specialCooldown: 7 },
  mage:    { name: "Magier", icon: "🔮", hp: 80, attack: 10, defense: 2, crit: 0.10, mana: 120, magicDamage: 22, special: "Feuerball", specialCooldown: 6, manaCost: 30 }
};

const MONSTER_DATA = {
  Goblin:    { icon: "👺", speed: 0.4 },
  Skelett:   { icon: "💀", speed: 0.35 },
  Schleim:   { icon: "🟢", speed: 0.25 },
  Bandit:    { icon: "🦹", speed: 0.45 },
  Wolf:      { icon: "🐺", speed: 0.55 },
  Spinne:    { icon: "🕷️", speed: 0.5 },
  "Ork-Champion":     { icon: "👹", speed: 0.3 },
  Schattenritter:     { icon: "🗡️", speed: 0.35 },
  Feuerdämon:         { icon: "😈", speed: 0.4 },
  Drachenwächter:     { icon: "🐉", speed: 0.3 },
  Nekromant:          { icon: "🧙", speed: 0.25 }
};

const NORMAL_MONSTERS = ["Goblin", "Skelett", "Schleim", "Bandit", "Wolf", "Spinne"];
const BOSS_MONSTERS = ["Ork-Champion", "Schattenritter", "Feuerdämon", "Drachenwächter", "Nekromant"];

const WORLDS = [
  { name: "Wald der Anfänge",  minLevel: 1,  theme: "forest",  sky: "#1a3a2a", ground: "#2d5a3a", decor: "🌲🌳🌲🍄🌿" },
  { name: "Dunkle Höhle",      minLevel: 10, theme: "cave",    sky: "#1a1a2e", ground: "#3d3d5c", decor: "🪨💎🪨⛏️🦇" },
  { name: "Schlossruine",      minLevel: 20, theme: "ruins",   sky: "#2d1f3d", ground: "#4a3f5c", decor: "🏚️🗿⚰️🕯️🌫️" },
  { name: "Feuervulkan",       minLevel: 30, theme: "volcano", sky: "#3d1515", ground: "#6b2a10", decor: "🌋🔥🪨💀🌋" },
  { name: "Drachenland",       minLevel: 40, theme: "dragon",  sky: "#1a0a20", ground: "#3d1040", decor: "🐉💀🔮⚡🌑" }
];

const LOOT_TYPES = ["Waffe", "Rüstung", "Amulett", "Zauberbuch"];
const RARITIES = [
  { name: "Gewöhnlich", chance: 0.50, multiplier: 1,   css: "rarity-common" },
  { name: "Selten",     chance: 0.30, multiplier: 2,   css: "rarity-rare" },
  { name: "Episch",     chance: 0.15, multiplier: 3.5, css: "rarity-epic" },
  { name: "Legendär",   chance: 0.05, multiplier: 6,   css: "rarity-legendary" }
];
const LOOT_EFFECTS = [
  { key: "attack", label: "Angriff" }, { key: "hp", label: "Leben" },
  { key: "defense", label: "Verteidigung" }, { key: "crit", label: "Krit-Chance" },
  { key: "goldBonus", label: "Gold-Bonus" }, { key: "magicDamage", label: "Magieschaden" },
  { key: "mana", label: "Mana" }
];
const UPGRADES = [
  { key: "upgrade_attack",   label: "Angriff",            baseCost: 50,  bonus: 2 },
  { key: "upgrade_health",   label: "Leben",              baseCost: 50,  bonus: 15 },
  { key: "upgrade_defense",  label: "Verteidigung",       baseCost: 50,  bonus: 1 },
  { key: "upgrade_crit",     label: "Krit-Chance",        baseCost: 80,  bonus: 0.01 },
  { key: "upgrade_gold",     label: "Gold-Bonus",         baseCost: 60,  bonus: 0.05 },
  { key: "upgrade_xp",       label: "XP-Bonus",           baseCost: 60,  bonus: 0.05 },
  { key: "upgrade_magic",    label: "Magieschaden",       baseCost: 70,  bonus: 3 },
  { key: "upgrade_mana",     label: "Mana",               baseCost: 70,  bonus: 10 },
  { key: "upgrade_cooldown", label: "Cooldown-Reduktion", baseCost: 100, bonus: 0.5 }
];

const ATTACK_COOLDOWN = 350;
const ENEMY_ATTACK_INTERVAL = 1800;
const LOOT_CHANCE = 0.25;
const XP_PER_LEVEL = 100;
let enemyIdCounter = 0;

const game = {
  playerName: "", classKey: "warrior", playerId: null,
  totalGold: 0, upgrades: {},
  isRunning: false, isPaused: false, isDead: false,
  dungeonLevel: 1, runGold: 0, runXp: 0, playerLevel: 1, monstersDefeated: 0,
  hero: null, enemies: [], combatLog: [], bestLoot: null,
  specialReady: false, specialTimer: 0, burnTicks: 0, debuffAttack: 0,
  lastAttackTime: 0, hoveredEnemyId: null, hoverAttackTimer: null,
  gameLoopId: null, enemyAttackTimer: null, waveCleared: false
};

const $ = (id) => document.getElementById(id);
const sounds = { attack: new Audio("attack.wav"), magic: new Audio("magic.wav"), loot: new Audio("loot.wav"), boss: new Audio("boss.wav"), gameover: new Audio("gameover.wav") };
function playSound(n) { const s = sounds[n]; if (s) { s.currentTime = 0; s.play().catch(() => {}); } }

// ============================================
// INIT
// ============================================

document.addEventListener("DOMContentLoaded", () => {
  try {
    bindEvents();
    renderUpgradeButtons();
    loadLeaderboard();
    initSupabase();
  } catch (err) {
    console.error(err);
    const hint = $("load-hint");
    if (hint) hint.textContent = "Fehler beim Laden. Seite neu laden.";
  }
});

async function initSupabase() {
  if (SUPABASE_URL === "DEINE_SUPABASE_URL" || SUPABASE_KEY === "DEIN_SUPABASE_KEY") return;
  try {
    if (!window.supabase) await loadScript("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2");
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    loadLeaderboard();
  } catch (e) { console.warn("Supabase nicht verfügbar"); }
}

function loadScript(url) {
  return new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = url; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
}

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
  bind("btn-special", useSpecialManual);
  bind("btn-pause", togglePause);
  bind("btn-restart", restartRun);
  bind("btn-save-score", saveScore);
  bind("btn-reload-leaderboard", loadLeaderboard);
}

// ============================================
// SPIELER
// ============================================

async function loadPlayer() {
  const name = $("player-name").value.trim();
  if (!name) { $("load-hint").textContent = "Bitte gib einen Namen ein."; return; }
  game.playerName = name;
  $("btn-load-player").disabled = true;

  if (!supabase) {
    game.totalGold = 0;
    game.upgrades = createEmptyUpgrades();
    enterGame("Bereit! Tippe auf Run starten.");
    return;
  }

  $("load-hint").textContent = "Lade Spieler...";
  const { data, error } = await supabase.from("dungeon_players").select("*").eq("name", name).maybeSingle();
  if (error) { $("load-hint").textContent = "Fehler: " + error.message; $("btn-load-player").disabled = false; return; }

  if (data) {
    game.playerId = data.id;
    game.classKey = data.class_name || game.classKey;
    game.totalGold = data.total_gold || 0;
    game.upgrades = {
      upgrade_attack: data.upgrade_attack || 0, upgrade_health: data.upgrade_health || 0,
      upgrade_defense: data.upgrade_defense || 0, upgrade_crit: data.upgrade_crit || 0,
      upgrade_gold: data.upgrade_gold || 0, upgrade_xp: data.upgrade_xp || 0,
      upgrade_magic: data.upgrade_magic || 0, upgrade_mana: data.upgrade_mana || 0,
      upgrade_cooldown: data.upgrade_cooldown || 0
    };
    selectClassButton(game.classKey);
    enterGame("Willkommen zurück, " + name + "!");
  } else {
    const { data: inserted, error: insErr } = await supabase.from("dungeon_players")
      .insert({ name, class_name: game.classKey, total_gold: 0, ...createEmptyUpgrades() }).select().single();
    if (insErr) { $("load-hint").textContent = "Fehler: " + insErr.message; $("btn-load-player").disabled = false; return; }
    game.playerId = inserted.id;
    game.totalGold = 0;
    game.upgrades = createEmptyUpgrades();
    enterGame("Neuer Spieler erstellt!");
  }
}

function enterGame(msg) {
  showGameSections();
  updateTotalGoldDisplay();
  renderUpgradeButtons();
  $("setup-section").classList.add("collapsed");
  $("game-section").scrollIntoView({ behavior: "smooth", block: "start" });
  $("load-hint").textContent = msg;
  $("btn-load-player").disabled = false;
  $("btn-start-run").classList.add("pulse");
  setTimeout(() => $("btn-start-run").classList.remove("pulse"), 2000);
}

function createEmptyUpgrades() { const u = {}; UPGRADES.forEach((up) => { u[up.key] = 0; }); return u; }
function selectClassButton(k) { document.querySelectorAll(".class-btn").forEach((b) => b.classList.toggle("selected", b.dataset.class === k)); }
function showGameSections() { ["game-section","upgrade-section","log-section"].forEach((id) => $(id).classList.remove("hidden")); }

async function savePlayer() {
  if (!supabase || !game.playerId) return;
  await supabase.from("dungeon_players").update({
    class_name: game.classKey, total_gold: game.totalGold,
    upgrade_attack: game.upgrades.upgrade_attack, upgrade_health: game.upgrades.upgrade_health,
    upgrade_defense: game.upgrades.upgrade_defense, upgrade_crit: game.upgrades.upgrade_crit,
    upgrade_gold: game.upgrades.upgrade_gold, upgrade_xp: game.upgrades.upgrade_xp,
    upgrade_magic: game.upgrades.upgrade_magic, upgrade_mana: game.upgrades.upgrade_mana,
    upgrade_cooldown: game.upgrades.upgrade_cooldown
  }).eq("id", game.playerId);
}

// ============================================
// RUN
// ============================================

function startRun() {
  if (game.isRunning && !game.isDead) return;
  stopGameLoop();
  resetRunState();
  createHero();
  game.isRunning = true;
  game.isPaused = false;
  game.isDead = false;

  $("gameover-panel").classList.add("hidden");
  $("world-view").classList.remove("hidden");
  $("btn-start-run").disabled = true;
  $("btn-pause").disabled = false;
  $("btn-restart").disabled = false;
  $("btn-special").disabled = false;

  updateWorldTheme();
  spawnWave();
  updateUI();
  startGameLoop();
  addLog("Abenteuer gestartet in " + getCurrentWorld().name + "!");
}

function resetRunState() {
  stopGameLoop();
  game.dungeonLevel = 1; game.runGold = 0; game.runXp = 0; game.playerLevel = 1;
  game.monstersDefeated = 0; game.combatLog = []; game.bestLoot = null;
  game.enemies = []; game.specialTimer = 0; game.burnTicks = 0; game.debuffAttack = 0;
  game.specialReady = false; game.waveCleared = false;
  $("enemies-zone").innerHTML = "";
  $("float-layer").innerHTML = "";
  $("loot-display").classList.add("hidden");
}

function restartRun() {
  stopGameLoop();
  game.isRunning = false; game.isPaused = false; game.isDead = false;
  resetRunState();
  $("gameover-panel").classList.add("hidden");
  $("world-view").classList.add("hidden");
  $("btn-start-run").disabled = false;
  $("btn-pause").disabled = true;
  $("btn-restart").disabled = true;
  $("btn-special").disabled = true;
  $("btn-pause").textContent = "Pause";
  updateUI();
  addLog("Run zurückgesetzt.");
}

function togglePause() {
  if (!game.isRunning || game.isDead) return;
  game.isPaused = !game.isPaused;
  $("btn-pause").textContent = game.isPaused ? "Weiter" : "Pause";
  if (game.isPaused) { stopGameLoop(); addLog("Pausiert."); }
  else { startGameLoop(); addLog("Weiter!"); }
}

// ============================================
// HELD
// ============================================

function createHero() {
  const cls = CLASSES[game.classKey];
  const u = game.upgrades;
  game.hero = {
    name: game.playerName, className: cls.name, classKey: game.classKey,
    maxHp: cls.hp + u.upgrade_health * 15, hp: cls.hp + u.upgrade_health * 15,
    attack: cls.attack + u.upgrade_attack * 2, defense: cls.defense + u.upgrade_defense,
    crit: cls.crit + u.upgrade_crit * 0.01,
    magicDamage: cls.magicDamage + u.upgrade_magic * 3,
    maxMana: cls.mana + u.upgrade_mana * 10, mana: cls.mana + u.upgrade_mana * 10,
    goldBonus: 1 + u.upgrade_gold * 0.05, xpBonus: 1 + u.upgrade_xp * 0.05,
    specialCooldown: Math.max(3, cls.specialCooldown - u.upgrade_cooldown * 0.5),
    specialTimer: 0,
    lootBonuses: { attack: 0, hp: 0, defense: 0, crit: 0, goldBonus: 0, magicDamage: 0, mana: 0 }
  };
  $("hero-sprite").textContent = cls.icon;
  $("hero-name").textContent = game.playerName;
  $("hero-panel").className = "hero-panel " + game.classKey;
}

function getHeroStats() {
  const h = game.hero, lb = h.lootBonuses;
  return {
    attack: h.attack + lb.attack, defense: h.defense + lb.defense,
    crit: Math.min(0.5, h.crit + lb.crit), magicDamage: h.magicDamage + lb.magicDamage,
    maxHp: h.maxHp + lb.hp, maxMana: h.maxMana + lb.mana, goldBonus: h.goldBonus + lb.goldBonus
  };
}

// ============================================
// WELTEN
// ============================================

function getCurrentWorld() {
  let world = WORLDS[0];
  for (const w of WORLDS) { if (game.dungeonLevel >= w.minLevel) world = w; }
  return world;
}

function updateWorldTheme() {
  const world = getCurrentWorld();
  const bg = $("world-bg");
  bg.className = "world-bg theme-" + world.theme;
  bg.querySelector(".world-sky").style.background = "linear-gradient(180deg, " + world.sky + " 0%, " + world.ground + " 100%)";
  bg.querySelector(".world-ground").style.background = world.ground;
  $("world-decor").textContent = world.decor;
  $("world-name").textContent = world.name + " – Level " + game.dungeonLevel;
}

// ============================================
// GEGNER & WELLEN
// ============================================

function spawnWave() {
  game.enemies = [];
  $("enemies-zone").innerHTML = "";
  const count = Math.min(5, 2 + Math.floor(game.dungeonLevel / 4));
  const isBossWave = game.dungeonLevel % 10 === 0;

  for (let i = 0; i < count; i++) {
    const isBoss = isBossWave && i === 0;
    spawnEnemy(isBoss);
  }
  if (isBossWave) { playSound("boss"); addLog("⚠️ Boss-Welle!", "boss"); }
  game.waveCleared = false;
}

function spawnEnemy(isBoss) {
  const level = game.dungeonLevel;
  const names = isBoss ? BOSS_MONSTERS : NORMAL_MONSTERS;
  const name = names[Math.floor(Math.random() * names.length)];
  const data = MONSTER_DATA[name] || { icon: "👾", speed: 0.4 };
  const hpMult = isBoss ? 3 : 1;
  const atkMult = isBoss ? 2 : 1;
  const rewardMult = isBoss ? 2.5 : 1;

  const enemy = {
    id: ++enemyIdCounter,
    name, icon: data.icon, isBoss,
    maxHp: Math.floor((25 + level * 8) * hpMult),
    hp: Math.floor((25 + level * 8) * hpMult),
    attack: Math.floor((4 + level * 1.5) * atkMult),
    goldReward: Math.floor((4 + level * 2) * rewardMult),
    xpReward: Math.floor((8 + level * 4) * rewardMult),
    x: 70 + Math.random() * 25,
    y: 15 + Math.random() * 55,
    speed: data.speed + level * 0.01,
    attackTimer: 0,
    el: null
  };

  game.enemies.push(enemy);
  renderEnemy(enemy);
}

function renderEnemy(enemy) {
  const div = document.createElement("div");
  div.className = "enemy" + (enemy.isBoss ? " boss" : "");
  div.dataset.id = enemy.id;
  div.style.left = enemy.x + "%";
  div.style.top = enemy.y + "%";

  div.innerHTML =
    '<div class="enemy-sprite">' + enemy.icon + '</div>' +
    '<div class="enemy-hp-bar"><div class="enemy-hp-fill" style="width:100%"></div></div>' +
    '<span class="enemy-label">' + enemy.name + '</span>';

  // Tippen = Angriff
  div.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    attackEnemy(enemy.id);
  });

  // Maus drüber = wiederholter Angriff (Laptop)
  div.addEventListener("pointerenter", () => {
    game.hoveredEnemyId = enemy.id;
    startHoverAttack();
  });
  div.addEventListener("pointerleave", () => {
    if (game.hoveredEnemyId === enemy.id) game.hoveredEnemyId = null;
    stopHoverAttack();
  });

  $("enemies-zone").appendChild(div);
  enemy.el = div;

  // Spawn-Animation
  requestAnimationFrame(() => div.classList.add("spawned"));
}

function updateEnemyDOM(enemy) {
  if (!enemy.el) return;
  enemy.el.style.left = enemy.x + "%";
  enemy.el.style.top = enemy.y + "%";
  const fill = enemy.el.querySelector(".enemy-hp-fill");
  if (fill) fill.style.width = Math.max(0, (enemy.hp / enemy.maxHp) * 100) + "%";
  if (enemy.hp <= 0) enemy.el.classList.add("dying");
}

function removeEnemyDOM(enemy) {
  if (enemy.el) {
    enemy.el.classList.add("dead");
    setTimeout(() => enemy.el && enemy.el.remove(), 400);
  }
}

// ============================================
// SPIEL-LOOP
// ============================================

function startGameLoop() {
  stopGameLoop();
  let lastTime = performance.now();
  function loop(now) {
    game.gameLoopId = requestAnimationFrame(loop);
    if (game.isPaused || game.isDead || !game.isRunning) return;
    const dt = (now - lastTime) / 1000;
    lastTime = now;
    updateGame(dt);
  }
  game.gameLoopId = requestAnimationFrame(loop);

  game.enemyAttackTimer = setInterval(enemyAttackTick, ENEMY_ATTACK_INTERVAL);
}

function stopGameLoop() {
  if (game.gameLoopId) { cancelAnimationFrame(game.gameLoopId); game.gameLoopId = null; }
  if (game.enemyAttackTimer) { clearInterval(game.enemyAttackTimer); game.enemyAttackTimer = null; }
  stopHoverAttack();
}

function updateGame(dt) {
  // Mana regen
  if (game.classKey === "mage") {
    const stats = getHeroStats();
    game.hero.mana = Math.min(stats.maxMana, game.hero.mana + dt * 5);
  }

  // Spezial-Timer
  game.hero.specialTimer += dt;
  game.specialReady = game.hero.specialTimer >= game.hero.specialCooldown;
  $("btn-special").classList.toggle("ready", game.specialReady);

  // Gegner bewegen sich auf den Helden zu
  const heroX = 12;
  game.enemies.forEach((e) => {
    if (e.hp <= 0) return;
    if (e.x > heroX + 8) {
      e.x -= e.speed * dt * 8;
      updateEnemyDOM(e);
    }
  });

  updateUI();
}

function enemyAttackTick() {
  if (!game.isRunning || game.isPaused || game.isDead) return;
  const stats = getHeroStats();
  const nearby = game.enemies.filter((e) => e.hp > 0 && e.x < 35);
  if (nearby.length === 0) return;

  nearby.forEach((e) => {
    let atk = e.attack;
    if (game.debuffAttack > 0) atk = Math.floor(atk * 0.6);
    const dmg = Math.max(1, atk - stats.defense);
    game.hero.hp -= dmg;
    showFloat(dmg, "damage-taken", 15, 40);
    if (e.el) e.el.classList.add("attacking");
    setTimeout(() => e.el && e.el.classList.remove("attacking"), 300);
  });

  if (game.debuffAttack > 0) game.debuffAttack--;
  addLog(nearby.length + " Gegner greifen an! -" + Math.max(1, nearby[0].attack - stats.defense) + " LP");

  if (game.hero.hp <= 0) { game.hero.hp = 0; onHeroDeath(); }
  updateUI();
}

// ============================================
// ANGRIFF (Tippen / Maus)
// ============================================

function canAttack() {
  return game.isRunning && !game.isPaused && !game.isDead && (performance.now() - game.lastAttackTime >= ATTACK_COOLDOWN);
}

function attackEnemy(id) {
  if (!canAttack()) return;
  const enemy = game.enemies.find((e) => e.id === id && e.hp > 0);
  if (!enemy) return;

  game.lastAttackTime = performance.now();
  const stats = getHeroStats();
  const isCrit = Math.random() < stats.crit;
  let dmg = stats.attack;
  if (isCrit) dmg *= 2;
  dmg = Math.max(1, Math.floor(dmg));

  enemy.hp -= dmg;
  playSound("attack");

  // Helden-Angriffsanimation
  const hero = $("hero-sprite");
  hero.classList.remove("attacking");
  void hero.offsetWidth;
  hero.classList.add("attacking");

  // Schadenszahl am Gegner
  showFloat(dmg, isCrit ? "damage-crit" : "damage-dealt", enemy.x, enemy.y);
  if (enemy.el) {
    enemy.el.classList.remove("hit");
    void enemy.el.offsetWidth;
    enemy.el.classList.add("hit");
  }

  const critText = isCrit ? " Kritischer Treffer!" : "";
  addLog(CLASSES[game.classKey].name + " trifft " + enemy.name + " für " + dmg + " Schaden!" + critText, isCrit ? "crit" : "");

  updateEnemyDOM(enemy);
  if (enemy.hp <= 0) onEnemyDeath(enemy);
  updateUI();
}

function startHoverAttack() {
  stopHoverAttack();
  game.hoverAttackTimer = setInterval(() => {
    if (game.hoveredEnemyId) attackEnemy(game.hoveredEnemyId);
  }, ATTACK_COOLDOWN + 50);
}

function stopHoverAttack() {
  if (game.hoverAttackTimer) { clearInterval(game.hoverAttackTimer); game.hoverAttackTimer = null; }
}

function useSpecialManual() {
  if (!game.specialReady || !game.isRunning || game.isPaused) return;
  const target = game.enemies.find((e) => e.hp > 0);
  if (!target) return;
  useSpecialAbility(target);
  game.hero.specialTimer = 0;
  game.specialReady = false;
}

function useSpecialAbility(target) {
  const stats = getHeroStats();
  const cls = CLASSES[game.classKey];

  switch (game.classKey) {
    case "warrior": {
      const dmg = Math.floor(stats.attack * 2);
      dealSpecialDamage(target, dmg, "Krieger: Schildschlag!");
      game.debuffAttack = 4;
      // Treffer alle nahen Gegner leicht
      game.enemies.forEach((e) => { if (e.hp > 0 && e.x < 50) { e.hp -= Math.floor(dmg * 0.4); if (e.hp <= 0) onEnemyDeath(e); else updateEnemyDOM(e); } });
      break;
    }
    case "ranger": {
      const crit = Math.random() < Math.min(0.7, stats.crit + 0.35);
      let dmg = Math.floor(stats.attack * 2.5);
      if (crit) dmg *= 2;
      dealSpecialDamage(target, dmg, "Waldläufer: Präzisionsschuss!" + (crit ? " Krit!" : ""), crit);
      break;
    }
    case "mage": {
      if (game.hero.mana < cls.manaCost) { addLog("Nicht genug Mana!"); return; }
      game.hero.mana -= cls.manaCost;
      let dmg = Math.floor(stats.magicDamage * 1.8);
      const crit = Math.random() < stats.crit;
      if (crit) dmg *= 2;
      dealSpecialDamage(target, dmg, "Magier: Feuerball!", crit);
      playSound("magic");
      if (Math.random() < 0.25) {
        game.enemies.forEach((e) => {
          if (e.hp > 0 && e.x < 60) { e.hp -= Math.floor(dmg * 0.3); if (e.hp <= 0) onEnemyDeath(e); else updateEnemyDOM(e); }
        });
        addLog("Feuerball trifft alle Gegner!", "special");
      }
      return;
    }
  }
  playSound("attack");
}

function dealSpecialDamage(target, dmg, logMsg, isCrit) {
  target.hp -= dmg;
  showFloat(dmg, isCrit ? "damage-crit" : "damage-special", target.x, target.y);
  if (target.el) { target.el.classList.add("hit"); }
  addLog(logMsg, "special");
  updateEnemyDOM(target);
  if (target.hp <= 0) onEnemyDeath(target);
}

function showFloat(text, cssClass, xPercent, yPercent) {
  const el = document.createElement("div");
  el.className = "float-text " + cssClass;
  el.textContent = (cssClass.includes("taken") ? "-" : "") + text;
  el.style.left = xPercent + "%";
  el.style.top = yPercent + "%";
  $("float-layer").appendChild(el);
  setTimeout(() => el.remove(), 800);
}

// ============================================
// TOD & BELOHNUNG
// ============================================

function onEnemyDeath(enemy) {
  const stats = getHeroStats();
  const goldGain = Math.floor(enemy.goldReward * stats.goldBonus);
  const xpGain = Math.floor(enemy.xpReward * game.hero.xpBonus);

  game.runGold += goldGain;
  game.runXp += xpGain;
  game.monstersDefeated++;
  game.dungeonLevel++;

  if (enemy.isBoss) addLog("👑 " + enemy.name + " besiegt! +" + goldGain + " Gold", "boss");
  else addLog(enemy.name + " besiegt! +" + goldGain + " Gold", "loot");

  checkLevelUp();
  if (Math.random() < LOOT_CHANCE) generateLoot();
  removeEnemyDOM(enemy);
  game.enemies = game.enemies.filter((e) => e.id !== enemy.id);

  // Welt wechseln?
  updateWorldTheme();

  // Neue Welle wenn alle tot
  if (game.enemies.filter((e) => e.hp > 0).length === 0) {
    setTimeout(() => { if (game.isRunning && !game.isDead) spawnWave(); }, 1200);
  }
  updateUI();
}

function checkLevelUp() {
  while (game.runXp >= game.playerLevel * XP_PER_LEVEL) {
    game.runXp -= game.playerLevel * XP_PER_LEVEL;
    game.playerLevel++;
    const heal = Math.floor(getHeroStats().maxHp * 0.25);
    game.hero.hp = Math.min(getHeroStats().maxHp, game.hero.hp + heal);
    addLog("⭐ Level Up! Held Level " + game.playerLevel);
    showFloat("LEVEL UP!", "level-up", 12, 30);
  }
}

function onHeroDeath() {
  game.isDead = true;
  game.isRunning = false;
  stopGameLoop();
  game.totalGold += game.runGold;
  savePlayer();
  playSound("gameover");
  addLog("Du bist gestorben!", "death");

  $("gameover-panel").classList.remove("hidden");
  $("gameover-summary").textContent = "Level " + game.dungeonLevel + " | " + game.monstersDefeated + " Monster | " + game.runGold + " Gold";
  $("final-score").textContent = calculateScore();
  $("btn-start-run").disabled = false;
  $("btn-pause").disabled = true;
  $("btn-special").disabled = true;
  updateTotalGoldDisplay();
  renderUpgradeButtons();
}

function calculateScore() {
  return game.dungeonLevel * 100 + game.monstersDefeated * 50 + game.runGold + game.playerLevel * 200;
}

// ============================================
// LOOT
// ============================================

function generateLoot() {
  const roll = Math.random();
  let cumulative = 0, rarity = RARITIES[0];
  for (const r of RARITIES) { cumulative += r.chance; if (roll <= cumulative) { rarity = r; break; } }
  const type = LOOT_TYPES[Math.floor(Math.random() * LOOT_TYPES.length)];
  const effect = LOOT_EFFECTS[Math.floor(Math.random() * LOOT_EFFECTS.length)];
  const value = Math.max(1, Math.floor(rarity.multiplier * (1 + game.dungeonLevel * 0.1)));
  const loot = { name: rarity.name + " " + type, css: rarity.css, effect: effect.key, value, score: rarity.multiplier * value };

  applyLootBonus(loot);
  if (!game.bestLoot || loot.score > game.bestLoot.score) {
    game.bestLoot = loot;
    $("loot-display").classList.remove("hidden");
    $("best-loot-text").textContent = loot.name + " (+" + effect.label + " " + value + ")";
    $("best-loot-text").className = "loot-item " + loot.css;
  }
  addLog("🎁 " + loot.name + " gefunden!", "loot");
  playSound("loot");
  showFloat("LOOT!", "loot-popup", 50, 20);
}

function applyLootBonus(loot) {
  const h = game.hero;
  switch (loot.effect) {
    case "attack": h.lootBonuses.attack += loot.value; break;
    case "hp": h.lootBonuses.hp += loot.value; h.hp += loot.value; break;
    case "defense": h.lootBonuses.defense += loot.value; break;
    case "crit": h.lootBonuses.crit += loot.value * 0.01; break;
    case "goldBonus": h.lootBonuses.goldBonus += loot.value * 0.02; break;
    case "magicDamage": h.lootBonuses.magicDamage += loot.value; break;
    case "mana": h.lootBonuses.mana += loot.value; h.mana += loot.value; break;
  }
}

// ============================================
// UPGRADES
// ============================================

function getUpgradeCost(key) {
  const up = UPGRADES.find((u) => u.key === key);
  return Math.floor(up.baseCost * Math.pow(1.5, game.upgrades[key] || 0));
}

function renderUpgradeButtons() {
  const grid = $("upgrade-grid");
  if (!grid) return;
  grid.innerHTML = "";
  UPGRADES.forEach((up) => {
    const level = game.upgrades[up.key] || 0;
    const cost = getUpgradeCost(up.key);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "upgrade-btn";
    btn.disabled = game.totalGold < cost;
    btn.innerHTML = '<span class="upgrade-info"><span class="upgrade-name">' + up.label + '</span><span class="upgrade-level">Stufe ' + level + '</span></span><span class="upgrade-cost">' + cost + ' 🪙</span>';
    btn.addEventListener("click", () => buyUpgrade(up.key));
    grid.appendChild(btn);
  });
}

async function buyUpgrade(key) {
  const cost = getUpgradeCost(key);
  if (game.totalGold < cost) return;
  game.totalGold -= cost;
  game.upgrades[key] = (game.upgrades[key] || 0) + 1;
  await savePlayer();
  updateTotalGoldDisplay();
  renderUpgradeButtons();
}

function updateTotalGoldDisplay() { if ($("total-gold")) $("total-gold").textContent = game.totalGold; }

// ============================================
// SCORE & RANGLISTE
// ============================================

async function saveScore() {
  if (!supabase) { $("save-hint").textContent = "Supabase nicht konfiguriert."; return; }
  const { error } = await supabase.from("dungeon_scores").insert({
    name: game.playerName, class_name: CLASSES[game.classKey].name, score: calculateScore(),
    dungeon_level: game.dungeonLevel, monsters_defeated: game.monstersDefeated,
    gold: game.runGold, player_level: game.playerLevel
  });
  $("save-hint").textContent = error ? "Fehler: " + error.message : "Score gespeichert!";
  if (!error) loadLeaderboard();
}

async function loadLeaderboard() {
  const list = $("leaderboard");
  if (!list) return;
  if (!supabase) { list.innerHTML = '<li class="empty">Supabase nicht konfiguriert.</li>'; return; }
  const { data, error } = await supabase.from("dungeon_scores").select("*").order("score", { ascending: false }).limit(10);
  if (error || !data || !data.length) { list.innerHTML = '<li class="empty">' + (error ? error.message : "Noch keine Scores.") + '</li>'; return; }
  const medals = ["🥇","🥈","🥉"];
  list.innerHTML = "";
  data.forEach((e, i) => {
    const li = document.createElement("li");
    li.innerHTML = '<span class="lb-rank">' + (medals[i] || (i+1)+".") + '</span><span class="lb-name">' + e.name + ' (' + e.class_name + ')</span><span class="lb-details"><span class="lb-score">' + e.score + '</span><br>Lv.' + e.dungeon_level + ' | ' + e.monsters_defeated + ' Monster</span>';
    list.appendChild(li);
  });
}

// ============================================
// LOG & UI
// ============================================

function addLog(msg, css) {
  game.combatLog.push({ text: msg, css: css || "" });
  if (game.combatLog.length > 8) game.combatLog.shift();
  const ul = $("combat-log");
  if (!ul) return;
  ul.innerHTML = "";
  game.combatLog.forEach((e) => {
    const li = document.createElement("li");
    li.textContent = e.text;
    if (e.css) li.classList.add(e.css);
    ul.appendChild(li);
  });
}

function updateUI() {
  if (!game.hero) return;
  const stats = getHeroStats();
  $("dungeon-level").textContent = game.dungeonLevel;
  $("run-gold").textContent = game.runGold;
  $("run-xp").textContent = game.runXp;
  $("player-level").textContent = game.playerLevel;

  const hpPct = Math.max(0, (game.hero.hp / stats.maxHp) * 100);
  $("hero-hp-fill").style.width = hpPct + "%";

  const manaArea = $("mana-area");
  if (game.classKey === "mage") {
    manaArea.classList.remove("hidden");
    $("hero-mana-fill").style.width = (game.hero.mana / stats.maxMana * 100) + "%";
  } else {
    manaArea.classList.add("hidden");
  }
}
