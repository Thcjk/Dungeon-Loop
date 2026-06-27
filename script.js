/* ============================================
   Dungeon Loop – Idle-RPG
   Reines JavaScript, kein localStorage
   ============================================ */

// --- Supabase Konfiguration (hier eintragen!) ---
const SUPABASE_URL = "DEINE_SUPABASE_URL";
const SUPABASE_KEY = "DEIN_SUPABASE_KEY";

// Supabase Client (wird beim Start initialisiert)
let supabase = null;

// --- Spiel-Konstanten ---

const CLASSES = {
  warrior: {
    name: "Krieger",
    hp: 150, attack: 12, defense: 8, crit: 0.05, mana: 0,
    magicDamage: 0,
    special: "Schildschlag",
    specialCooldown: 8
  },
  ranger: {
    name: "Waldläufer",
    hp: 100, attack: 17, defense: 3, crit: 0.15, mana: 0,
    magicDamage: 0,
    special: "Präzisionsschuss",
    specialCooldown: 7
  },
  mage: {
    name: "Magier",
    hp: 80, attack: 10, defense: 2, crit: 0.10, mana: 120,
    magicDamage: 22,
    special: "Feuerball",
    specialCooldown: 6,
    manaCost: 30
  }
};

const NORMAL_MONSTERS = ["Goblin", "Skelett", "Schleim", "Bandit", "Wolf", "Spinne"];
const BOSS_MONSTERS = ["Ork-Champion", "Schattenritter", "Feuerdämon", "Drachenwächter", "Nekromant"];

const LOOT_TYPES = ["Waffe", "Rüstung", "Amulett", "Zauberbuch"];
const RARITIES = [
  { name: "Gewöhnlich",  chance: 0.50, multiplier: 1,   css: "rarity-common" },
  { name: "Selten",      chance: 0.30, multiplier: 2,   css: "rarity-rare" },
  { name: "Episch",      chance: 0.15, multiplier: 3.5, css: "rarity-epic" },
  { name: "Legendär",    chance: 0.05, multiplier: 6,   css: "rarity-legendary" }
];

const LOOT_EFFECTS = [
  { key: "attack",      label: "Angriff" },
  { key: "hp",          label: "Leben" },
  { key: "defense",     label: "Verteidigung" },
  { key: "crit",        label: "Krit-Chance" },
  { key: "goldBonus",   label: "Gold-Bonus" },
  { key: "magicDamage", label: "Magieschaden" },
  { key: "mana",        label: "Mana" }
];

const UPGRADES = [
  { key: "upgrade_attack",   label: "Angriff",           baseCost: 50,  bonus: 2 },
  { key: "upgrade_health",   label: "Leben",             baseCost: 50,  bonus: 15 },
  { key: "upgrade_defense",  label: "Verteidigung",      baseCost: 50,  bonus: 1 },
  { key: "upgrade_crit",     label: "Krit-Chance",       baseCost: 80,  bonus: 0.01 },
  { key: "upgrade_gold",     label: "Gold-Bonus",        baseCost: 60,  bonus: 0.05 },
  { key: "upgrade_xp",       label: "XP-Bonus",          baseCost: 60,  bonus: 0.05 },
  { key: "upgrade_magic",    label: "Magieschaden",      baseCost: 70,  bonus: 3 },
  { key: "upgrade_mana",     label: "Mana",              baseCost: 70,  bonus: 10 },
  { key: "upgrade_cooldown", label: "Cooldown-Reduktion", baseCost: 100, bonus: 0.5 }
];

const COMBAT_SPEED = 1200; // ms zwischen Angriffen
const LOOT_CHANCE = 0.25;
const XP_PER_LEVEL = 100;

// --- Spielzustand ---
const game = {
  playerName: "",
  classKey: "warrior",
  playerId: null,
  totalGold: 0,
  upgrades: {},
  isRunning: false,
  isPaused: false,
  isDead: false,
  dungeonLevel: 1,
  runGold: 0,
  runXp: 0,
  playerLevel: 1,
  monstersDefeated: 0,
  hero: null,
  monster: null,
  combatLog: [],
  bestLoot: null,
  specialTimer: 0,
  burnTicks: 0,
  debuffAttack: 0, // Krieger-Debuff auf Monster
  combatInterval: null
};

// --- DOM Elemente ---
const $ = (id) => document.getElementById(id);

// --- Sound (optional, bricht nicht ab wenn Dateien fehlen) ---
const sounds = {
  attack:   new Audio("attack.wav"),
  magic:    new Audio("magic.wav"),
  loot:     new Audio("loot.wav"),
  boss:     new Audio("boss.wav"),
  gameover: new Audio("gameover.wav")
};

function playSound(name) {
  const s = sounds[name];
  if (!s) return;
  s.currentTime = 0;
  s.play().catch(() => {}); // Fehler ignorieren
}

// ============================================
// INITIALISIERUNG
// ============================================

document.addEventListener("DOMContentLoaded", () => {
  initSupabase();
  bindEvents();
  renderUpgradeButtons();
  loadLeaderboard();
});

function initSupabase() {
  if (SUPABASE_URL === "DEINE_SUPABASE_URL" || SUPABASE_KEY === "DEIN_SUPABASE_KEY") {
    console.warn("Supabase noch nicht konfiguriert.");
    return;
  }
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

function bindEvents() {
  // Klassenauswahl
  document.querySelectorAll(".class-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".class-btn").forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      game.classKey = btn.dataset.class;
    });
  });

  $("btn-load-player").addEventListener("click", loadPlayer);
  $("btn-start-run").addEventListener("click", startRun);
  $("btn-pause").addEventListener("click", togglePause);
  $("btn-restart").addEventListener("click", restartRun);
  $("btn-save-score").addEventListener("click", saveScore);
  $("btn-reload-leaderboard").addEventListener("click", loadLeaderboard);
}

// ============================================
// SPIELER LADEN / SPEICHERN (Supabase)
// ============================================

async function loadPlayer() {
  const name = $("player-name").value.trim();
  if (!name) {
    $("load-hint").textContent = "Bitte gib einen Namen ein.";
    return;
  }

  game.playerName = name;

  if (!supabase) {
    // Offline-Modus: lokal im Speicher (nur Session, kein localStorage)
    game.totalGold = 0;
    game.upgrades = createEmptyUpgrades();
    showGameSections();
    $("load-hint").textContent = "Offline-Modus (Supabase nicht konfiguriert).";
    return;
  }

  $("load-hint").textContent = "Lade Spieler...";

  const { data, error } = await supabase
    .from("dungeon_players")
    .select("*")
    .eq("name", name)
    .maybeSingle();

  if (error) {
    $("load-hint").textContent = "Fehler: " + error.message;
    return;
  }

  if (data) {
    game.playerId = data.id;
    game.classKey = data.class_name || game.classKey;
    game.totalGold = data.total_gold || 0;
    game.upgrades = {
      upgrade_attack:   data.upgrade_attack   || 0,
      upgrade_health:   data.upgrade_health   || 0,
      upgrade_defense:  data.upgrade_defense  || 0,
      upgrade_crit:     data.upgrade_crit     || 0,
      upgrade_gold:     data.upgrade_gold     || 0,
      upgrade_xp:       data.upgrade_xp       || 0,
      upgrade_magic:    data.upgrade_magic    || 0,
      upgrade_mana:     data.upgrade_mana     || 0,
      upgrade_cooldown: data.upgrade_cooldown || 0
    };
    selectClassButton(game.classKey);
    $("load-hint").textContent = "Willkommen zurück, " + name + "!";
  } else {
    // Neuer Spieler anlegen
    const newPlayer = {
      name: name,
      class_name: game.classKey,
      total_gold: 0,
      ...createEmptyUpgrades()
    };

    const { data: inserted, error: insertError } = await supabase
      .from("dungeon_players")
      .insert(newPlayer)
      .select()
      .single();

    if (insertError) {
      $("load-hint").textContent = "Fehler: " + insertError.message;
      return;
    }

    game.playerId = inserted.id;
    game.totalGold = 0;
    game.upgrades = createEmptyUpgrades();
    $("load-hint").textContent = "Neuer Spieler erstellt!";
  }

  showGameSections();
  updateTotalGoldDisplay();
  renderUpgradeButtons();
}

function createEmptyUpgrades() {
  const u = {};
  UPGRADES.forEach((up) => { u[up.key] = 0; });
  return u;
}

function selectClassButton(classKey) {
  document.querySelectorAll(".class-btn").forEach((b) => {
    b.classList.toggle("selected", b.dataset.class === classKey);
  });
}

async function savePlayer() {
  if (!supabase || !game.playerId) return;

  await supabase
    .from("dungeon_players")
    .update({
      class_name: game.classKey,
      total_gold: game.totalGold,
      upgrade_attack:   game.upgrades.upgrade_attack,
      upgrade_health:   game.upgrades.upgrade_health,
      upgrade_defense:  game.upgrades.upgrade_defense,
      upgrade_crit:     game.upgrades.upgrade_crit,
      upgrade_gold:     game.upgrades.upgrade_gold,
      upgrade_xp:       game.upgrades.upgrade_xp,
      upgrade_magic:    game.upgrades.upgrade_magic,
      upgrade_mana:     game.upgrades.upgrade_mana,
      upgrade_cooldown: game.upgrades.upgrade_cooldown
    })
    .eq("id", game.playerId);
}

function showGameSections() {
  $("game-section").classList.remove("hidden");
  $("upgrade-section").classList.remove("hidden");
  $("log-section").classList.remove("hidden");
}

// ============================================
// RUN STARTEN / PAUSE / NEUSTART
// ============================================

function startRun() {
  if (game.isRunning && !game.isDead) return;

  resetRunState();
  createHero();
  spawnMonster();
  game.isRunning = true;
  game.isPaused = false;
  game.isDead = false;

  $("gameover-panel").classList.add("hidden");
  $("btn-start-run").disabled = true;
  $("btn-pause").disabled = false;
  $("btn-restart").disabled = false;

  updateUI();
  startCombatLoop();
  addLog("Run gestartet! Dungeon Level " + game.dungeonLevel);
}

function resetRunState() {
  stopCombatLoop();
  game.dungeonLevel = 1;
  game.runGold = 0;
  game.runXp = 0;
  game.playerLevel = 1;
  game.monstersDefeated = 0;
  game.combatLog = [];
  game.bestLoot = null;
  game.specialTimer = 0;
  game.burnTicks = 0;
  game.debuffAttack = 0;
  $("loot-display").classList.add("hidden");
}

function restartRun() {
  stopCombatLoop();
  game.isRunning = false;
  game.isPaused = false;
  game.isDead = false;
  resetRunState();
  $("gameover-panel").classList.add("hidden");
  $("btn-start-run").disabled = false;
  $("btn-pause").disabled = true;
  $("btn-restart").disabled = true;
  $("btn-pause").textContent = "Pause";
  updateUI();
  addLog("Run zurückgesetzt.");
}

function togglePause() {
  if (!game.isRunning || game.isDead) return;
  game.isPaused = !game.isPaused;
  $("btn-pause").textContent = game.isPaused ? "Weiter" : "Pause";
  if (game.isPaused) {
    stopCombatLoop();
    addLog("Kampf pausiert.");
  } else {
    startCombatLoop();
    addLog("Kampf fortgesetzt.");
  }
}

// ============================================
// HELD ERSTELLEN
// ============================================

function createHero() {
  const cls = CLASSES[game.classKey];
  const u = game.upgrades;

  game.hero = {
    name: game.playerName,
    className: cls.name,
    classKey: game.classKey,
    maxHp: cls.hp + u.upgrade_health * 15,
    hp: cls.hp + u.upgrade_health * 15,
    attack: cls.attack + u.upgrade_attack * 2,
    defense: cls.defense + u.upgrade_defense * 1,
    crit: cls.crit + u.upgrade_crit * 0.01,
    magicDamage: cls.magicDamage + u.upgrade_magic * 3,
    maxMana: cls.mana + u.upgrade_mana * 10,
    mana: cls.mana + u.upgrade_mana * 10,
    goldBonus: 1 + u.upgrade_gold * 0.05,
    xpBonus: 1 + u.upgrade_xp * 0.05,
    cooldownReduction: u.upgrade_cooldown * 0.5,
    specialCooldown: Math.max(3, cls.specialCooldown - u.upgrade_cooldown * 0.5),
    specialTimer: 0,
    lootBonuses: { attack: 0, hp: 0, defense: 0, crit: 0, goldBonus: 0, magicDamage: 0, mana: 0 }
  };
}

function getHeroStats() {
  const h = game.hero;
  const lb = h.lootBonuses;
  return {
    attack: h.attack + lb.attack,
    defense: h.defense + lb.defense,
    crit: Math.min(0.5, h.crit + lb.crit),
    magicDamage: h.magicDamage + lb.magicDamage,
    maxHp: h.maxHp + lb.hp,
    maxMana: h.maxMana + lb.mana,
    goldBonus: h.goldBonus + lb.goldBonus
  };
}

// ============================================
// MONSTER ERSTELLEN
// ============================================

function spawnMonster() {
  const level = game.dungeonLevel;
  const isBoss = level % 10 === 0;
  const names = isBoss ? BOSS_MONSTERS : NORMAL_MONSTERS;
  const name = names[Math.floor(Math.random() * names.length)];

  const hpMult = isBoss ? 4 : 1;
  const atkMult = isBoss ? 2.5 : 1;
  const rewardMult = isBoss ? 3 : 1;

  game.monster = {
    name: name,
    isBoss: isBoss,
    maxHp: Math.floor((30 + level * 12) * hpMult),
    hp: Math.floor((30 + level * 12) * hpMult),
    attack: Math.floor((5 + level * 2) * atkMult),
  baseAttack: Math.floor((5 + level * 2) * atkMult),
    goldReward: Math.floor((5 + level * 3) * rewardMult),
    xpReward: Math.floor((10 + level * 5) * rewardMult)
  };

  if (isBoss) {
  playSound("boss");
    addLog("⚠️ BOSS erscheint: " + name + "!", "boss");
  }
}

// ============================================
// KAMPF-SYSTEM
// ============================================

function startCombatLoop() {
  stopCombatLoop();
  game.combatInterval = setInterval(combatTick, COMBAT_SPEED);
}

function stopCombatLoop() {
  if (game.combatInterval) {
    clearInterval(game.combatInterval);
    game.combatInterval = null;
  }
}

function combatTick() {
  if (!game.isRunning || game.isPaused || game.isDead) return;

  // Mana-Regeneration für Magier
  if (game.classKey === "mage" && game.hero.mana < getHeroStats().maxMana) {
    game.hero.mana = Math.min(getHeroStats().maxMana, game.hero.mana + 3);
  }

  // Brennen-Schaden
  if (game.burnTicks > 0) {
    const burnDmg = Math.floor(game.hero.magicDamage * 0.3);
    game.monster.hp -= burnDmg;
    game.burnTicks--;
    addLog("🔥 Brennen verursacht " + burnDmg + " Schaden");
    if (game.monster.hp <= 0) { onMonsterDeath(); updateUI(); return; }
  }

  // Debuff-Timer
  if (game.debuffAttack > 0) game.debuffAttack--;

  // Spezialfähigkeit prüfen
  game.hero.specialTimer++;
  let usedSpecial = false;

  if (game.hero.specialTimer >= game.hero.specialCooldown) {
    usedSpecial = useSpecialAbility();
    if (usedSpecial) game.hero.specialTimer = 0;
  }

  // Normaler Angriff (wenn kein Spezial genutzt)
  if (!usedSpecial) {
    heroAttack(false);
  }

  // Monster greift zurück (wenn noch lebt)
  if (game.monster.hp > 0) {
    monsterAttack();
  }

  updateUI();
}

function heroAttack(isSpecialFollowUp) {
  const stats = getHeroStats();
  const cls = CLASSES[game.classKey];
  let damage = stats.attack;
  let isCrit = Math.random() < stats.crit;
  let isMagic = false;

  // Magier ohne Mana: normaler Angriff
  if (game.classKey === "mage") {
    // Normaler Angriff
  }

  if (isCrit) damage *= 2;

  damage = Math.max(1, Math.floor(damage));
  game.monster.hp -= damage;

  const critText = isCrit ? " – Kritischer Treffer!" : "";
  addLog(cls.name + " trifft " + game.monster.name + " für " + damage + " Schaden" + critText, isCrit ? "crit" : "");
  playSound("attack");

  if (game.monster.hp <= 0) onMonsterDeath();
}

function useSpecialAbility() {
  const cls = CLASSES[game.classKey];
  const stats = getHeroStats();

  switch (game.classKey) {
    case "warrior": {
      const dmg = Math.floor(stats.attack * 1.8);
      game.monster.hp -= dmg;
      game.debuffAttack = 3;
      addLog("Krieger nutzt Schildschlag für " + dmg + " Schaden!", "special");
      playSound("attack");
      if (game.monster.hp <= 0) { onMonsterDeath(); return true; }
      return true;
    }
    case "ranger": {
      const critChance = Math.min(0.6, stats.crit + 0.3);
      const isCrit = Math.random() < critChance;
      let dmg = Math.floor(stats.attack * 2.2);
      if (isCrit) dmg *= 2;
      game.monster.hp -= dmg;
      const critText = isCrit ? " – Kritischer Treffer!" : "";
      addLog("Waldläufer nutzt Präzisionsschuss für " + dmg + " Schaden" + critText, isCrit ? "crit" : "special");
      playSound("attack");
      if (game.monster.hp <= 0) { onMonsterDeath(); return true; }
      return true;
    }
    case "mage": {
      if (game.hero.mana < cls.manaCost) return false;
      game.hero.mana -= cls.manaCost;
      let dmg = Math.floor(stats.magicDamage * 1.5);
      const isCrit = Math.random() < stats.crit;
      if (isCrit) dmg *= 2;
      game.monster.hp -= dmg;

      if (Math.random() < 0.2) {
        game.burnTicks = 3;
        addLog("Magier wirkt Feuerball für " + dmg + " Schaden – Gegner brennt!", "special");
      } else {
        addLog("Magier wirkt Feuerball für " + dmg + " Schaden!", "special");
      }
      playSound("magic");
      if (game.monster.hp <= 0) { onMonsterDeath(); return true; }
      return true;
    }
  }
  return false;
}

function monsterAttack() {
  let atk = game.monster.attack;
  if (game.debuffAttack > 0) {
    atk = Math.floor(atk * 0.6);
  }

  const stats = getHeroStats();
  const damage = Math.max(1, atk - stats.defense);
  game.hero.hp -= damage;

  addLog(game.monster.name + " trifft dich für " + damage + " Schaden");

  if (game.hero.hp <= 0) {
    game.hero.hp = 0;
    onHeroDeath();
  }
}

function onMonsterDeath() {
  const m = game.monster;
  const stats = getHeroStats();

  const goldGain = Math.floor(m.goldReward * stats.goldBonus);
  const xpGain = Math.floor(m.xpReward * game.hero.xpBonus);

  game.runGold += goldGain;
  game.runXp += xpGain;
  game.monstersDefeated++;

  if (m.isBoss) {
    addLog("Boss besiegt! +" + goldGain + " Gold, +" + xpGain + " XP", "boss");
  } else {
    addLog(m.name + " besiegt! +" + goldGain + " Gold, +" + xpGain + " XP");
  }

  // XP Level-Up
  while (game.runXp >= game.playerLevel * XP_PER_LEVEL) {
    game.runXp -= game.playerLevel * XP_PER_LEVEL;
    game.playerLevel++;
    const healAmount = Math.floor(getHeroStats().maxHp * 0.2);
    game.hero.hp = Math.min(getHeroStats().maxHp, game.hero.hp + healAmount);
    addLog("Level Up! Jetzt Level " + game.playerLevel);
  }

  // Loot-Chance
  if (Math.random() < LOOT_CHANCE) {
    generateLoot();
  }

  // Nächstes Level & Monster
  game.dungeonLevel++;
  spawnMonster();
}

function onHeroDeath() {
  game.isDead = true;
  game.isRunning = false;
  stopCombatLoop();

  // Run-Gold zum Gesamt-Gold addieren
  game.totalGold += game.runGold;
  savePlayer();

  playSound("gameover");
  addLog("Du bist gestorben! Game Over.", "death");

  const score = calculateScore();
  $("gameover-panel").classList.remove("hidden");
  $("gameover-summary").textContent =
    "Dungeon Level " + game.dungeonLevel + " | " +
    game.monstersDefeated + " Monster besiegt | " +
    game.runGold + " Gold verdient";
  $("final-score").textContent = score;
  $("save-hint").textContent = "";

  $("btn-start-run").disabled = false;
  $("btn-pause").disabled = true;
  $("btn-restart").disabled = false;

  updateTotalGoldDisplay();
  renderUpgradeButtons();
}

function calculateScore() {
  return (
    game.dungeonLevel * 100 +
    game.monstersDefeated * 50 +
    game.runGold +
    game.playerLevel * 200
  );
}

// ============================================
// LOOT-SYSTEM
// ============================================

function generateLoot() {
  // Seltenheit würfeln
  const roll = Math.random();
  let cumulative = 0;
  let rarity = RARITIES[0];
  for (const r of RARITIES) {
    cumulative += r.chance;
    if (roll <= cumulative) { rarity = r; break; }
  }

  const type = LOOT_TYPES[Math.floor(Math.random() * LOOT_TYPES.length)];
  const effect = LOOT_EFFECTS[Math.floor(Math.random() * LOOT_EFFECTS.length)];
  const value = Math.max(1, Math.floor(rarity.multiplier * (1 + game.dungeonLevel * 0.1)));

  const loot = {
    name: rarity.name + " " + type,
    rarity: rarity.name,
    css: rarity.css,
    effect: effect.key,
    value: value,
    score: rarity.multiplier * value
  };

  // Loot-Bonus anwenden
  applyLootBonus(loot);

  // Bester Loot speichern
  if (!game.bestLoot || loot.score > game.bestLoot.score) {
    game.bestLoot = loot;
    $("loot-display").classList.remove("hidden");
    $("best-loot-text").textContent = loot.name + " (+" + effect.label + " " + value + ")";
    $("best-loot-text").className = "loot-item " + loot.css;
  }

  addLog("Du findest: " + loot.name + " (+" + effect.label + ")", "loot");
  playSound("loot");
}

function applyLootBonus(loot) {
  const h = game.hero;
  switch (loot.effect) {
    case "attack":      h.lootBonuses.attack += loot.value; break;
    case "hp":
      h.lootBonuses.hp += loot.value;
      h.hp += loot.value;
      break;
    case "defense":     h.lootBonuses.defense += loot.value; break;
    case "crit":        h.lootBonuses.crit += loot.value * 0.01; break;
    case "goldBonus":   h.lootBonuses.goldBonus += loot.value * 0.02; break;
    case "magicDamage": h.lootBonuses.magicDamage += loot.value; break;
    case "mana":
      h.lootBonuses.mana += loot.value;
      h.mana += loot.value;
      break;
  }
}

// ============================================
// UPGRADE-SYSTEM
// ============================================

function getUpgradeCost(key) {
  const upgrade = UPGRADES.find((u) => u.key === key);
  const level = game.upgrades[key] || 0;
  return Math.floor(upgrade.baseCost * Math.pow(1.5, level));
}

function renderUpgradeButtons() {
  const grid = $("upgrade-grid");
  grid.innerHTML = "";

  UPGRADES.forEach((up) => {
    const level = game.upgrades[up.key] || 0;
    const cost = getUpgradeCost(up.key);
    const canAfford = game.totalGold >= cost;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "upgrade-btn";
    btn.disabled = !canAfford;
    btn.innerHTML =
      '<span class="upgrade-info">' +
        '<span class="upgrade-name">' + up.label + '</span>' +
        '<span class="upgrade-level">Stufe ' + level + '</span>' +
      '</span>' +
      '<span class="upgrade-cost">' + cost + ' 🪙</span>';

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

function updateTotalGoldDisplay() {
  $("total-gold").textContent = game.totalGold;
}

// ============================================
// SCORE SPEICHERN & RANGLISTE
// ============================================

async function saveScore() {
  if (!supabase) {
    $("save-hint").textContent = "Supabase nicht konfiguriert.";
    return;
  }

  const score = calculateScore();
  $("save-hint").textContent = "Speichere...";

  const { error } = await supabase.from("dungeon_scores").insert({
    name: game.playerName,
    class_name: CLASSES[game.classKey].name,
    score: score,
    dungeon_level: game.dungeonLevel,
    monsters_defeated: game.monstersDefeated,
    gold: game.runGold,
    player_level: game.playerLevel
  });

  if (error) {
    $("save-hint").textContent = "Fehler: " + error.message;
  } else {
    $("save-hint").textContent = "Score gespeichert!";
    loadLeaderboard();
  }
}

async function loadLeaderboard() {
  const list = $("leaderboard");
  list.innerHTML = '<li class="loading">Lade Rangliste...</li>';

  if (!supabase) {
    list.innerHTML = '<li class="empty">Supabase nicht konfiguriert.</li>';
    return;
  }

  const { data, error } = await supabase
    .from("dungeon_scores")
    .select("*")
    .order("score", { ascending: false })
    .limit(10);

  if (error) {
    list.innerHTML = '<li class="empty">Fehler: ' + error.message + '</li>';
    return;
  }

  if (!data || data.length === 0) {
    list.innerHTML = '<li class="empty">Noch keine Scores vorhanden.</li>';
    return;
  }

  const medals = ["🥇", "🥈", "🥉"];
  list.innerHTML = "";

  data.forEach((entry, i) => {
    const rank = medals[i] || (i + 1) + ".";
    const li = document.createElement("li");
    li.innerHTML =
      '<span class="lb-rank">' + rank + '</span>' +
      '<span class="lb-name">' + entry.name + ' (' + entry.class_name + ')</span>' +
      '<span class="lb-details">' +
        '<span class="lb-score">' + entry.score + '</span><br>' +
        'Lv.' + entry.dungeon_level + ' | ' + entry.monsters_defeated + ' Monster' +
      '</span>';
    list.appendChild(li);
  });
}

// ============================================
// KAMPFLOG
// ============================================

function addLog(message, cssClass) {
  game.combatLog.push({ text: message, css: cssClass || "" });
  if (game.combatLog.length > 8) game.combatLog.shift();
  renderCombatLog();
}

function renderCombatLog() {
  const ul = $("combat-log");
  ul.innerHTML = "";
  game.combatLog.forEach((entry) => {
    const li = document.createElement("li");
    li.textContent = entry.text;
    if (entry.css) li.classList.add(entry.css);
    ul.appendChild(li);
  });
  ul.scrollTop = ul.scrollHeight;
}

// ============================================
// UI AKTUALISIEREN
// ============================================

function updateUI() {
  if (!game.hero) return;

  const stats = getHeroStats();
  const h = game.hero;
  const m = game.monster;

  // Statusleiste
  $("dungeon-level").textContent = game.dungeonLevel;
  $("run-gold").textContent = game.runGold;
  $("run-xp").textContent = game.runXp;
  $("player-level").textContent = game.playerLevel;

  // Heldenkarte
  const heroCard = $("hero-card");
  heroCard.className = "fighter-card hero-card " + game.classKey;
  $("hero-name").textContent = h.name;
  $("hero-class").textContent = h.className;

  const hpPercent = Math.max(0, (h.hp / stats.maxHp) * 100);
  $("hero-hp-fill").style.width = hpPercent + "%";
  $("hero-hp-text").textContent = Math.max(0, Math.floor(h.hp)) + " / " + stats.maxHp;

  // Mana (nur Magier)
  const manaArea = $("mana-area");
  if (game.classKey === "mage") {
    manaArea.classList.remove("hidden");
    const manaPercent = (h.mana / stats.maxMana) * 100;
    $("hero-mana-fill").style.width = manaPercent + "%";
    $("hero-mana-text").textContent = Math.floor(h.mana) + " / " + stats.maxMana;
  } else {
    manaArea.classList.add("hidden");
  }

  $("hero-stats").innerHTML =
    "⚔️ " + stats.attack +
    " 🛡️ " + stats.defense +
    " 💥 " + Math.round(stats.crit * 100) + "%";

  // Monsterkarte
  if (m) {
    const monsterCard = $("monster-card");
    monsterCard.className = "fighter-card monster-card" + (m.isBoss ? " boss" : "");
    $("monster-name").textContent = m.name;
    $("monster-level-text").textContent = "Dungeon Level " + game.dungeonLevel + (m.isBoss ? " – BOSS" : "");

    const mHpPercent = Math.max(0, (m.hp / m.maxHp) * 100);
    $("monster-hp-fill").style.width = mHpPercent + "%";
    $("monster-hp-text").textContent = Math.max(0, m.hp) + " / " + m.maxHp;
    $("monster-stats").innerHTML = "⚔️ " + m.attack;
  }
}
