/* ============================================
   Dungeon Loop – Temporäre RUN-UPGRADES (Hard)
   Post-Boss-Picks only · unique combat builds.
   Browser: vor script.js laden; Node: require().
   ============================================ */

const DL_RUN_UPGRADE_DEFAULTS = {
  rarity: {
    early: { common: 0.50, uncommon: 0.32, rare: 0.14, epic: 0.035, legendary: 0.005 },
    mid:   { common: 0.35, uncommon: 0.34, rare: 0.20, epic: 0.08,  legendary: 0.03 },
    late:  { common: 0.20, uncommon: 0.30, rare: 0.28, epic: 0.15,  legendary: 0.07 }
  },
  /** defeatedWorldIndex 0..3 → Rarity nach Boss W1..W4 */
  rarityByWorld: {
    0: { common: 0.50, uncommon: 0.32, rare: 0.14, epic: 0.035, legendary: 0.005 },
    1: { common: 0.36, uncommon: 0.34, rare: 0.20, epic: 0.07,  legendary: 0.03 },
    2: { common: 0.24, uncommon: 0.30, rare: 0.26, epic: 0.14,  legendary: 0.06 },
    3: { common: 0.14, uncommon: 0.26, rare: 0.30, epic: 0.20,  legendary: 0.10 }
  },
  milestones: [],
  freeRerolls: 1,
  baseCoinCatchMult: 2,
  baseLifestealCap: 0.07
};

function dlRunUpgradeCfg() {
  const ru = (typeof DL_BALANCE !== "undefined" && DL_BALANCE && DL_BALANCE.runUpgrades)
    ? DL_BALANCE.runUpgrades : null;
  return {
    rarity: (ru && ru.rarity) || DL_RUN_UPGRADE_DEFAULTS.rarity,
    rarityByWorld: (ru && ru.rarityByWorld) || DL_RUN_UPGRADE_DEFAULTS.rarityByWorld,
    milestones: (ru && Array.isArray(ru.milestones)) ? ru.milestones : DL_RUN_UPGRADE_DEFAULTS.milestones,
    freeRerolls: (ru && ru.freeRerolls != null)
      ? ru.freeRerolls : DL_RUN_UPGRADE_DEFAULTS.freeRerolls,
    baseCoinCatchMult: (ru && ru.baseCoinCatchMult != null)
      ? ru.baseCoinCatchMult : DL_RUN_UPGRADE_DEFAULTS.baseCoinCatchMult,
    baseLifestealCap: (ru && ru.baseLifestealCap != null)
      ? ru.baseLifestealCap : DL_RUN_UPGRADE_DEFAULTS.baseLifestealCap
  };
}

/** Katalog: Combat-Builds (Hard Balance Abschnitte 8–13) – fast alles UNIQUE */
const DL_RUN_UPGRADES = [
  /* ---- COMMON (power ~10) ---- */
  { id: "sharp_blade", name: "SCHARFE KLINGE", rarity: "common", unique: true, maxStacks: 1, power: 10,
    tags: ["offense", "damage"], desc: "+8% Schaden",
    effects: { damageAdd: 0.08 } },
  { id: "quick_hands", name: "SCHNELLE HÄNDE", rarity: "common", unique: true, maxStacks: 1, power: 10,
    tags: ["offense", "atkspd"], desc: "+7% Angriffsgeschwindigkeit",
    effects: { atkSpdAdd: 0.07 } },
  { id: "tough_body", name: "ZÄHER KÖRPER", rarity: "common", unique: true, maxStacks: 1, power: 10,
    tags: ["defense", "hp"], desc: "+10% max. LP",
    effects: { maxHpAdd: 0.10 } },
  { id: "plating", name: "PANZERUNG", rarity: "common", unique: true, maxStacks: 1, power: 10,
    tags: ["defense", "armor"], desc: "+6% effektive Rüstung / Schadensreduktion",
    effects: { armorAdd: 0.06 } },
  { id: "weak_spot", name: "SCHWACHE STELLE", rarity: "common", unique: true, maxStacks: 1, power: 10,
    tags: ["offense", "crit"], desc: "+4% Krit-Chance",
    effects: { critAdd: 0.04 } },
  { id: "boss_hunter", name: "BOSSJÄGER", rarity: "common", unique: true, maxStacks: 1, power: 10,
    tags: ["offense", "boss"], desc: "+10% Schaden gegen Bosse",
    effects: { bossDmgAdd: 0.10 } },

  /* ---- UNCOMMON (power ~15) ---- */
  { id: "executioner", name: "HENKER", rarity: "uncommon", unique: true, maxStacks: 1, power: 15,
    tags: ["offense"], desc: "+25% Schaden gegen Gegner unter 20% LP",
    effects: { executioner: true, execHpFrac: 0.2, execDmgAdd: 0.25 } },
  /* ---- NG+ EXCLUSIVE (ab Loop 3, 15% Chance) ---- */
  { id: "ng_executioner", name: "HENKER+", rarity: "rare", unique: true, maxStacks: 1, power: 22, ngPlusOnly: true,
    tags: ["offense", "boss"], desc: "Boss unter 15% LP: +30% Schaden",
    effects: { executioner: true, execHpFrac: 0.15, execDmgAdd: 0.30, bossOnlyExec: true } },
  { id: "ng_adaptation", name: "ANPASSUNG", rarity: "rare", unique: true, maxStacks: 1, power: 18, ngPlusOnly: true,
    tags: ["offense"], desc: "Nach Elite-Treffer: +8% Schaden gegen diesen Elite (6s)",
    effects: { adaptation: true, adaptDmg: 0.08, adaptDur: 6 } },
  { id: "ng_corruption_hunter", name: "KORRUPTIONSJÄGER", rarity: "epic", unique: true, maxStacks: 1, power: 28, ngPlusOnly: true,
    tags: ["offense"], desc: "+20% Schaden in korrupten Welten, −8% sonst",
    effects: { corruptionHunter: true, corrDmg: 0.20, normalDmgPen: -0.08 } },
  { id: "ng_undying", name: "UNSTERBLICH", rarity: "legendary", unique: true, maxStacks: 1, power: 40, ngPlusOnly: true,
    tags: ["defense"], desc: "1× pro Welt: tödlicher Treffer → 15% LP",
    effects: { undying: true, undyingHpFrac: 0.15 } },
  { id: "adrenaline", name: "ADRENALIN", rarity: "uncommon", unique: true, maxStacks: 1, power: 15,
    tags: ["offense"], desc: "+18% Angriffsgeschwindigkeit unter 30% LP",
    effects: { adrenaline: true, adrHpFrac: 0.3, adrAtkSpdAdd: 0.18 } },
  { id: "crit_precision", name: "KRIT-PRÄZISION", rarity: "uncommon", unique: true, maxStacks: 1, power: 15,
    tags: ["offense", "crit"], desc: "+18% Krit-Schaden",
    effects: { critDmgAdd: 0.18 } },
  { id: "second_wind", name: "ZWEITER ATEM", rarity: "uncommon", unique: true, maxStacks: 1, power: 15,
    tags: ["defense", "heal"], desc: "Nach 9s ohne Schaden: alle 5s 2% max. LP heilen",
    effects: { secondWind: true, swDelay: 9, swInterval: 5, swHealFrac: 0.02 } },
  { id: "elite_hunter", name: "ELITE-JÄGER", rarity: "uncommon", unique: true, maxStacks: 1, power: 15,
    tags: ["offense", "elite"], desc: "+18% Schaden gegen Eliten, +20% Elite-Gold",
    effects: { eliteDamageAdd: 0.18, eliteGoldAdd: 0.20 } },

  /* ---- RARE (power ~22) ---- */
  { id: "berserker", name: "BERSERKER", rarity: "rare", unique: true, maxStacks: 1, power: 22,
    tags: ["offense"], desc: "+3% Schaden je 10% fehlender LP (max. +24%)",
    effects: { berserker: true, bersPer10: 0.03, bersMax: 0.24 } },
  { id: "chain_reaction", name: "KETTENREAKTION", rarity: "rare", unique: true, maxStacks: 1, power: 22,
    tags: ["offense", "crit"], desc: "Bei Krit 20% Chance: anderer Gegner nimmt 40% des Schadens",
    effects: { chainReaction: true, chainChance: 0.20, chainFrac: 0.40 } },
  { id: "iron_skin", name: "EISENHAUT", rarity: "rare", unique: true, maxStacks: 1, power: 22,
    tags: ["defense"], desc: "3 Treffer in 5s → +16% DR für 5s (CD 12s)",
    effects: { ironSkin: true, ironHits: 3, ironWindow: 5, ironDr: 0.16, ironDur: 5, ironCd: 12 } },
  { id: "bloodlust", name: "BLUTRAUSCH", rarity: "rare", unique: true, maxStacks: 1, power: 22,
    tags: ["defense", "lifesteal"], desc: "Jeder 12. Treffer heilt 2,5% max. LP (ICD 2,5s)",
    effects: { bloodlust: true, blEvery: 12, blHealFrac: 0.025, blIcd: 2.5 } },
  { id: "special_focus", name: "SPEZIALFOKUS", rarity: "rare", unique: true, maxStacks: 1, power: 22,
    tags: ["offense", "ability"], desc: "+20% Fähigkeitsschaden, −8% CD (W/S)",
    effects: { abilityDmgAdd: 0.20, cdrAdd: 0.08 } },

  /* ---- EPIC (power ~32) ---- */
  { id: "glass_cannon", name: "GLASKANONE", rarity: "epic", unique: true, maxStacks: 1, power: 32,
    tags: ["offense", "glass"], desc: "+38% Schaden, −28% max. LP",
    effects: { glassCannon: true, damageAdd: 0.38, maxHpAdd: -0.28 } },
  { id: "titan", name: "TITAN", rarity: "epic", unique: true, maxStacks: 1, power: 32,
    tags: ["defense", "tank"], desc: "+35% LP, +12% Rüstung, −12% Bewegungsgeschwindigkeit",
    effects: { titan: true, maxHpAdd: 0.35, armorAdd: 0.12, moveSpeedAdd: -0.12 } },
  { id: "specialist", name: "SPEZIALIST", rarity: "epic", unique: true, maxStacks: 1, power: 32,
    tags: ["offense", "ability"], desc: "+35% Fähigkeitsschaden, −12% CD, −18% Normalangriff",
    effects: { specialist: true, abilityDmgAdd: 0.35, cdrAdd: 0.12, attackDmgAdd: -0.18 } },
  { id: "vampire", name: "VAMPIR", rarity: "epic", unique: true, maxStacks: 1, power: 32,
    tags: ["defense", "lifesteal"], desc: "+5% Lebensraub, Cap 13%, Level-Heilung −65%",
    effects: { vampire: true, lifestealAdd: 0.05, lifestealCap: 0.13, levelHealMult: 0.35 } },

  /* ---- LEGENDARY (power ~42) ---- */
  { id: "last_warrior", name: "LETZTER KRIEGER", rarity: "legendary", unique: true, maxStacks: 1, power: 42,
    tags: ["defense", "revive"], desc: "Einmal pro Run: bei tödlichem Schaden auf 20% LP, 1,5s Immunität",
    effects: { lastWarrior: true, lwHpFrac: 0.20, lwImmune: 1.5 } },
  { id: "war_machine", name: "KRIEGSMASCHINE", rarity: "legendary", unique: true, maxStacks: 1, power: 42,
    tags: ["offense"], desc: "Bei Kill +1,5% Schaden (max. +24%); bei Treffer −4 Stacks",
    effects: { warMachine: true, wmPerKill: 0.015, wmMax: 0.24, wmLoseOnHit: 4 } },
  { id: "time_breaker", name: "ZEITBRECHER", rarity: "legendary", unique: true, maxStacks: 1, power: 42,
    tags: ["offense", "ability"], desc: "Fähigkeitstreffer auf Elite/Boss: 10% Chance CD der Fähigkeit zu resetten (ICD 10s)",
    effects: { timeBreaker: true, tbChance: 0.10, tbIcd: 10 } }
];

const DL_RUN_RARITY_ORDER = ["common", "uncommon", "rare", "epic", "legendary"];
const DL_RUN_BUILD_TYPES = ["offense", "defense"];

function dlRunUpgradeById(id) {
  return DL_RUN_UPGRADES.find((u) => u.id === id) || null;
}

function dlCopyRarityTable(table) {
  return Object.assign({}, table || {});
}

/** Rarity-Tabelle für Fortschritt 0..1 (early/mid/late). */
function dlRunUpgradeRarityTable(progress01OrWorld) {
  if (dlLooksLikeWorldIndex(progress01OrWorld)) {
    return dlRunUpgradeRarityForWorld(progress01OrWorld);
  }
  const r = dlRunUpgradeCfg().rarity;
  const p = Math.max(0, Math.min(1, progress01OrWorld || 0));
  if (p < 0.33) return dlCopyRarityTable(r.early);
  if (p < 0.66) return dlCopyRarityTable(r.mid);
  return dlCopyRarityTable(r.late);
}

/** Rarity nach besiegtem Boss (defeatedWorldIndex 0..3). */
function dlRunUpgradeRarityForWorld(defeatedWorldIndex) {
  const cfg = dlRunUpgradeCfg();
  const idx = Math.max(0, Math.min(3, defeatedWorldIndex | 0));
  const byWorld = cfg.rarityByWorld || DL_RUN_UPGRADE_DEFAULTS.rarityByWorld;
  if (byWorld && byWorld[idx]) return dlCopyRarityTable(byWorld[idx]);
  // Fallback early/mid/late
  const r = cfg.rarity || DL_RUN_UPGRADE_DEFAULTS.rarity;
  if (idx <= 0) return dlCopyRarityTable(r.early);
  if (idx === 1) return dlCopyRarityTable(r.mid);
  return dlCopyRarityTable(r.late);
}

function dlLooksLikeWorldIndex(n) {
  if (n == null || !Number.isFinite(n)) return false;
  return n === Math.floor(n) && n >= 0 && n <= 3;
}

function dlNgPlusRunUpgradeRarePp(loopIndex) {
  const L = Math.max(0, loopIndex | 0);
  const ng = (typeof DL_BALANCE !== "undefined" && DL_BALANCE.ngPlus && DL_BALANCE.ngPlus.runUpgrades)
    ? DL_BALANCE.ngPlus.runUpgrades : {};
  const arr = ng.rarePlusPpByLoop || [0];
  const cap = ng.rarePlusPpCap != null ? ng.rarePlusPpCap : 0.06;
  if (L <= 0) return 0;
  if (L < arr.length && arr[L] != null) return Math.min(cap, arr[L]);
  return cap;
}

function dlApplyNgPlusRarityBoost(table, loopIndex) {
  const pp = dlNgPlusRunUpgradeRarePp(loopIndex);
  if (!pp || !table) return table;
  const out = Object.assign({}, table);
  const rareKeys = ["rare", "epic", "legendary"];
  let rareSum = 0;
  rareKeys.forEach((k) => { rareSum += out[k] || 0; });
  const lowKeys = ["common", "uncommon"];
  let lowSum = 0;
  lowKeys.forEach((k) => { lowSum += out[k] || 0; });
  if (lowSum <= 0) return out;
  const take = Math.min(pp, lowSum * 0.9);
  // Shift probability from common/uncommon into rare+
  lowKeys.forEach((k) => {
    if (!out[k]) return;
    const share = out[k] / lowSum;
    out[k] = Math.max(0, out[k] - take * share);
  });
  if (rareSum <= 0) {
    out.rare = (out.rare || 0) + take;
  } else {
    rareKeys.forEach((k) => {
      if (!out[k] && k !== "rare") return;
      const share = (out[k] || 0) / rareSum;
      out[k] = (out[k] || 0) + take * (share || (k === "rare" ? 1 : 0));
    });
  }
  return out;
}

function dlRollRunUpgradeRarity(worldOrProgress, rng) {
  const roll = typeof rng === "function" ? rng : Math.random;
  let table = dlLooksLikeWorldIndex(worldOrProgress)
    ? dlRunUpgradeRarityForWorld(worldOrProgress)
    : dlRunUpgradeRarityTable(worldOrProgress);
  const loop = (typeof game !== "undefined" && game) ? (game.loopIndex | 0) : 0;
  table = dlApplyNgPlusRarityBoost(table, loop);
  let r = roll();
  for (let i = 0; i < DL_RUN_RARITY_ORDER.length; i++) {
    const key = DL_RUN_RARITY_ORDER[i];
    const w = table[key] || 0;
    if (r < w) return key;
    r -= w;
  }
  return "common";
}

/** Meilensteine ungenutzt (Hard: nur Post-Boss). */
function dlIsRunMilestone(/* playerLevel */) {
  return false;
}

function dlPendingRunMilestones(/* playerLevel, claimedSetOrArray */) {
  return [];
}

function dlRunUpgradeOwnedCount(state, id) {
  if (!state) return 0;
  if (state.stacks && state.stacks[id] != null) return state.stacks[id] | 0;
  if (!state.upgrades) return 0;
  let n = 0;
  for (let i = 0; i < state.upgrades.length; i++) {
    if (state.upgrades[i] === id) n++;
  }
  return n;
}

/** Unique: nie erneut anbieten wenn bereits owned. */
function dlCanOfferRunUpgrade(def, state) {
  if (!def) return false;
  const owned = dlRunUpgradeOwnedCount(state, def.id);
  if (owned > 0 && (def.unique || (def.maxStacks != null && def.maxStacks <= 1))) return false;
  const max = def.maxStacks != null ? def.maxStacks : (def.unique ? 1 : 1);
  if (owned >= max) return false;
  return true;
}

function dlRunPrimaryBuild(def) {
  if (!def || !def.tags) return null;
  for (let i = 0; i < DL_RUN_BUILD_TYPES.length; i++) {
    if (def.tags.indexOf(DL_RUN_BUILD_TYPES[i]) >= 0) return DL_RUN_BUILD_TYPES[i];
  }
  return def.tags[0] || null;
}

function dlPickWeighted(list, rng) {
  if (!list || !list.length) return null;
  return list[Math.floor(rng() * list.length) % list.length];
}

function dlFilterOfferable(state, rarity, excludeIds, tagPrefer, buildAvoid) {
  const excl = excludeIds instanceof Set ? excludeIds : new Set(excludeIds || []);
  return DL_RUN_UPGRADES.filter((d) => {
    if (excl.has(d.id)) return false;
    if (d.ngPlusOnly) return false;
    if (rarity && d.rarity !== rarity) return false;
    if (!dlCanOfferRunUpgrade(d, state)) return false;
    if (tagPrefer && tagPrefer.length) {
      const hit = d.tags && d.tags.some((t) => tagPrefer.indexOf(t) >= 0);
      if (!hit) return false;
    }
    if (buildAvoid) {
      if (dlRunPrimaryBuild(d) === buildAvoid) return false;
    }
    return true;
  });
}

function dlDominantBuildTags(state) {
  const tags = (state && state.buildTags) || {};
  const keys = Object.keys(tags).filter((k) => (tags[k] | 0) > 0);
  keys.sort((a, b) => (tags[b] | 0) - (tags[a] | 0));
  return keys;
}

function dlDraftOne(state, rarityKeyOrProgress, excludeIds, preferMode, slot0Build, rng) {
  const rarity = (typeof rarityKeyOrProgress === "string" && DL_RUN_RARITY_ORDER.indexOf(rarityKeyOrProgress) >= 0)
    ? rarityKeyOrProgress
    : dlRollRunUpgradeRarity(rarityKeyOrProgress, rng);
  let pool = null;

  if (preferMode === "tags") {
    const dom = dlDominantBuildTags(state);
    if (dom.length) {
      pool = dlFilterOfferable(state, rarity, excludeIds, dom.slice(0, 3), null);
      if (!pool.length) pool = dlFilterOfferable(state, null, excludeIds, dom.slice(0, 3), null);
    }
  } else if (preferMode === "diffBuild" && slot0Build) {
    pool = dlFilterOfferable(state, rarity, excludeIds, null, slot0Build);
    if (!pool.length) pool = dlFilterOfferable(state, null, excludeIds, null, slot0Build);
  }

  if (!pool || !pool.length) {
    pool = dlFilterOfferable(state, rarity, excludeIds, null, null);
  }
  if (!pool.length) {
    pool = dlFilterOfferable(state, null, excludeIds, null, null);
  }
  return dlPickWeighted(pool, rng);
}

/**
 * Smart-Draft über Fortschritt 0..1 (oder world-index-Heuristik).
 * Slot0 50% Tag-Match, Slot1 random, Slot2 anderer Build-Typ.
 */
function dlSmartDraftRunUpgrades(state, rarityProgress, count, rng) {
  const n = Math.max(1, count == null ? 3 : count | 0);
  const roll = typeof rng === "function" ? rng : Math.random;
  const picked = [];
  const exclude = new Set();
  let slot0Build = null;

  for (let i = 0; i < n; i++) {
    let prefer = "random";
    if (i === 0 && roll() < 0.5) prefer = "tags";
    else if (i === 2) prefer = "diffBuild";
    const def = dlDraftOne(state, rarityProgress, exclude, prefer, slot0Build, roll);
    if (!def) break;
    picked.push(def);
    exclude.add(def.id);
    if (i === 0) slot0Build = dlRunPrimaryBuild(def);
  }
  return picked;
}

/** Post-Boss-Draft: nutzt rarityByWorld[defeatedWorldIndex] + NG+ Exklusiv-Karten. */
function dlSmartDraftAfterBoss(state, defeatedWorldIndex, count, rng) {
  const idx = Math.max(0, Math.min(3, defeatedWorldIndex | 0));
  const draft = dlSmartDraftRunUpgrades(state, idx, count, rng);
  const roll = typeof rng === "function" ? rng : Math.random;
  const loop = (typeof game !== "undefined" && game) ? (game.loopIndex | 0) : 0;
  const ng = (typeof DL_BALANCE !== "undefined" && DL_BALANCE.ngPlus && DL_BALANCE.ngPlus.runUpgrades)
    ? DL_BALANCE.ngPlus.runUpgrades : {};
  const fromLoop = ng.exclusiveFromLoop != null ? ng.exclusiveFromLoop : 3;
  const chance = ng.exclusiveChance != null ? ng.exclusiveChance : 0.15;
  if (loop >= fromLoop && roll() < chance && draft.length) {
    const exclusives = DL_RUN_UPGRADES.filter((u) => u.ngPlusOnly);
    const owned = new Set((state && state.upgrades) || []);
    const pool = exclusives.filter((u) => !owned.has(u.id) && !draft.some((d) => d.id === u.id));
    if (pool.length) {
      const pick = pool[Math.floor(roll() * pool.length)];
      draft[draft.length - 1] = pick;
    }
  }
  return draft;
}

/** Freier Reroll: dieselben 3 IDs dürfen nicht erneut erscheinen. */
function dlRerollRunDraft(state, previousIds, progress01, rng) {
  const prev = previousIds || [];
  const roll = typeof rng === "function" ? rng : Math.random;
  const hardExclude = new Set(prev);
  const draft = [];
  let slot0Build = null;

  for (let i = 0; i < 3; i++) {
    let prefer = "random";
    if (i === 0 && roll() < 0.5) prefer = "tags";
    else if (i === 2) prefer = "diffBuild";
    const def = dlDraftOne(state, progress01, hardExclude, prefer, slot0Build, roll);
    if (!def) break;
    draft.push(def);
    hardExclude.add(def.id);
    if (i === 0) slot0Build = dlRunPrimaryBuild(def);
  }

  if (draft.length < 3) {
    const soft = dlSmartDraftRunUpgrades(state, progress01, 3, roll);
    const softIds = soft.map((d) => d.id).sort().join(",");
    const prevKey = prev.slice().sort().join(",");
    if (softIds !== prevKey) return soft;
  }
  return draft;
}

function dlRerollAfterBoss(state, previousIds, defeatedWorldIndex, rng) {
  const idx = Math.max(0, Math.min(3, defeatedWorldIndex | 0));
  return dlRerollRunDraft(state, previousIds, idx, rng);
}

function dlCreateEmptyRunUpgradeState() {
  const cfg = dlRunUpgradeCfg();
  return {
    upgrades: [],
    stacks: {},
    rerolls: cfg.freeRerolls != null ? cfg.freeRerolls : 1,
    powerScore: 0,
    buildTags: {},
    claimedMilestones: [],
    claimedWorlds: [],
    claimedBossWorlds: [],
    focusTimer: 0,
    warMachineStacks: 0,
    lastWarriorUsed: false,
    hitCount: 0,
    secondWindTimer: 0,
    guardCd: 0,
    ironCd: 0,
    bloodlustIcd: 0,
    timeBreakerIcd: 0,
    noDamageTimer: 0
  };
}

function dlApplyRunUpgradePick(state, id) {
  const def = dlRunUpgradeById(id);
  if (!def || !state) return null;
  if (!dlCanOfferRunUpgrade(def, state)) return null;

  if (!state.upgrades) state.upgrades = [];
  if (!state.stacks) state.stacks = {};
  if (!state.buildTags) state.buildTags = {};

  state.upgrades.push(id);
  state.stacks[id] = (state.stacks[id] | 0) + 1;
  (def.tags || []).forEach((t) => {
    state.buildTags[t] = (state.buildTags[t] | 0) + 1;
  });
  state.powerScore = dlRunUpgradePowerScore(state);
  return def;
}

function dlRunUpgradePowerScore(state) {
  if (!state || !state.stacks) return 0;
  let sum = 0;
  Object.keys(state.stacks).forEach((id) => {
    const def = dlRunUpgradeById(id);
    const n = state.stacks[id] | 0;
    if (def && n > 0) sum += (def.power || 0) * n;
  });
  return sum;
}

function dlComputeRunBonus(state) {
  const cfg = dlRunUpgradeCfg();
  const out = {
    damageMult: 1,
    atkSpdMult: 1,
    critAdd: 0,
    critDmgAdd: 0,
    bossDmgAdd: 0,
    eliteDamageAdd: 0,
    maxHpMult: 1,
    armorAdd: 0,
    moveSpeedMult: 1,
    goldMult: 1,
    eliteGoldMult: 1,
    lifestealAdd: 0,
    lifestealCap: cfg.baseLifestealCap,
    levelHealMult: 1,
    abilityDmgMult: 1,
    attackDmgMult: 1,
    cdrAdd: 0,
    coinCatchMult: cfg.baseCoinCatchMult,
    enemyDmgTakenMult: 1,
    executioner: false,
    execHpFrac: 0.2,
    execDmgAdd: 0.25,
    adrenaline: false,
    adrHpFrac: 0.3,
    adrAtkSpdAdd: 0.18,
    berserker: false,
    bersPer10: 0.03,
    bersMax: 0.24,
    focus: false,
    chainReaction: false,
    chainChance: 0.2,
    chainFrac: 0.4,
    glassCannon: false,
    specialist: false,
    warMachine: false,
    wmPerKill: 0.015,
    wmMax: 0.24,
    wmLoseOnHit: 4,
    secondWind: false,
    swDelay: 9,
    swInterval: 5,
    swHealFrac: 0.02,
    guardLayer: false,
    ironSkin: false,
    ironHits: 3,
    ironWindow: 5,
    ironDr: 0.16,
    ironDur: 5,
    ironCd: 12,
    bloodlust: false,
    blEvery: 12,
    blHealFrac: 0.025,
    blIcd: 2.5,
    titan: false,
    vampire: false,
    lastWarrior: false,
    lwHpFrac: 0.2,
    lwImmune: 1.5,
    undying: false,
    undyingHpFrac: 0.15,
    adaptation: false,
    adaptDmg: 0.08,
    adaptDur: 6,
    corruptionHunter: false,
    corrDmg: 0.20,
    normalDmgPen: -0.08,
    timeBreaker: false,
    tbChance: 0.1,
    tbIcd: 10,
    warMachineStacks: (state && state.warMachineStacks) || 0
  };
  if (!state || !state.stacks) return out;

  let coinCatchSet = null;
  let coinCatchScale = 1;

  Object.keys(state.stacks).forEach((id) => {
    const n = state.stacks[id] | 0;
    if (n <= 0) return;
    const def = dlRunUpgradeById(id);
    if (!def || !def.effects) return;
    const e = def.effects;

    if (e.damageAdd) out.damageMult += e.damageAdd * n;
    if (e.atkSpdAdd) out.atkSpdMult += e.atkSpdAdd * n;
    if (e.critAdd) out.critAdd += e.critAdd * n;
    if (e.critDmgAdd) out.critDmgAdd += e.critDmgAdd * n;
    if (e.bossDmgAdd) out.bossDmgAdd += e.bossDmgAdd * n;
    if (e.eliteDamageAdd) out.eliteDamageAdd += e.eliteDamageAdd * n;
    if (e.maxHpAdd) out.maxHpMult += e.maxHpAdd * n;
    if (e.armorAdd) out.armorAdd += e.armorAdd * n;
    if (e.moveSpeedAdd) out.moveSpeedMult += e.moveSpeedAdd * n;
    if (e.goldAdd) out.goldMult += e.goldAdd * n;
    if (e.eliteGoldAdd) out.eliteGoldMult += e.eliteGoldAdd * n;
    if (e.lifestealAdd) out.lifestealAdd += e.lifestealAdd * n;
    if (e.lifestealCap != null) out.lifestealCap = Math.max(out.lifestealCap, e.lifestealCap);
    if (e.levelHealMult != null) out.levelHealMult *= Math.pow(e.levelHealMult, n);
    if (e.abilityDmgAdd) out.abilityDmgMult += e.abilityDmgAdd * n;
    if (e.attackDmgAdd) out.attackDmgMult += e.attackDmgAdd * n;
    if (e.cdrAdd) out.cdrAdd += e.cdrAdd * n;
    if (e.enemyDmgTakenAdd) out.enemyDmgTakenMult += e.enemyDmgTakenAdd * n;
    if (e.coinCatchSet != null) coinCatchSet = e.coinCatchSet;
    if (e.coinCatchScale) coinCatchScale *= Math.pow(e.coinCatchScale, n);

    if (e.executioner) {
      out.executioner = true;
      if (e.execHpFrac != null) out.execHpFrac = e.execHpFrac;
      if (e.execDmgAdd != null) out.execDmgAdd = e.execDmgAdd;
    }
    if (e.adrenaline) {
      out.adrenaline = true;
      if (e.adrHpFrac != null) out.adrHpFrac = e.adrHpFrac;
      if (e.adrAtkSpdAdd != null) out.adrAtkSpdAdd = e.adrAtkSpdAdd;
    }
    if (e.berserker) {
      out.berserker = true;
      if (e.bersPer10 != null) out.bersPer10 = e.bersPer10;
      if (e.bersMax != null) out.bersMax = e.bersMax;
    }
    if (e.focus) out.focus = true;
    if (e.chainReaction) {
      out.chainReaction = true;
      if (e.chainChance != null) out.chainChance = e.chainChance;
      if (e.chainFrac != null) out.chainFrac = e.chainFrac;
    }
    if (e.glassCannon) out.glassCannon = true;
    if (e.specialist) out.specialist = true;
    if (e.warMachine) {
      out.warMachine = true;
      if (e.wmPerKill != null) out.wmPerKill = e.wmPerKill;
      if (e.wmMax != null) out.wmMax = e.wmMax;
      if (e.wmLoseOnHit != null) out.wmLoseOnHit = e.wmLoseOnHit;
    }
    if (e.secondWind) {
      out.secondWind = true;
      if (e.swDelay != null) out.swDelay = e.swDelay;
      if (e.swInterval != null) out.swInterval = e.swInterval;
      if (e.swHealFrac != null) out.swHealFrac = e.swHealFrac;
    }
    if (e.guardLayer) out.guardLayer = true;
    if (e.ironSkin) {
      out.ironSkin = true;
      if (e.ironHits != null) out.ironHits = e.ironHits;
      if (e.ironWindow != null) out.ironWindow = e.ironWindow;
      if (e.ironDr != null) out.ironDr = e.ironDr;
      if (e.ironDur != null) out.ironDur = e.ironDur;
      if (e.ironCd != null) out.ironCd = e.ironCd;
    }
    if (e.bloodlust) {
      out.bloodlust = true;
      if (e.blEvery != null) out.blEvery = e.blEvery;
      if (e.blHealFrac != null) out.blHealFrac = e.blHealFrac;
      if (e.blIcd != null) out.blIcd = e.blIcd;
    }
    if (e.titan) out.titan = true;
    if (e.vampire) out.vampire = true;
    if (e.lastWarrior) {
      out.lastWarrior = true;
      if (e.lwHpFrac != null) out.lwHpFrac = e.lwHpFrac;
      if (e.lwImmune != null) out.lwImmune = e.lwImmune;
    }
    if (e.undying) {
      out.undying = true;
      if (e.undyingHpFrac != null) out.undyingHpFrac = e.undyingHpFrac;
    }
    if (e.adaptation) {
      out.adaptation = true;
      if (e.adaptDmg != null) out.adaptDmg = e.adaptDmg;
      if (e.adaptDur != null) out.adaptDur = e.adaptDur;
    }
    if (e.corruptionHunter) {
      out.corruptionHunter = true;
      if (e.corrDmg != null) out.corrDmg = e.corrDmg;
      if (e.normalDmgPen != null) out.normalDmgPen = e.normalDmgPen;
    }
    if (e.timeBreaker) {
      out.timeBreaker = true;
      if (e.tbChance != null) out.tbChance = e.tbChance;
      if (e.tbIcd != null) out.tbIcd = e.tbIcd;
    }
  });

  if (coinCatchSet != null) out.coinCatchMult = coinCatchSet;
  out.coinCatchMult *= coinCatchScale;
  return out;
}

function dlDescribeRunUpgrade(def) {
  if (!def) return "";
  const r = ({ common: "Gewöhnlich", uncommon: "Ungewöhnlich", rare: "Selten",
    epic: "Episch", legendary: "Legendär" })[def.rarity] || def.rarity;
  const stack = def.unique || (def.maxStacks != null && def.maxStacks <= 1)
    ? "Einzigartig"
    : ("max. " + (def.maxStacks || 1) + "×");
  return def.name + " · " + r + " · " + stack + " — " + (def.desc || "");
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    DL_RUN_UPGRADES,
    DL_RUN_UPGRADE_DEFAULTS,
    dlRunUpgradeById,
    dlRunUpgradeRarityTable,
    dlRunUpgradeRarityForWorld,
    dlRollRunUpgradeRarity,
    dlIsRunMilestone,
    dlPendingRunMilestones,
    dlRunUpgradeOwnedCount,
    dlCanOfferRunUpgrade,
    dlSmartDraftRunUpgrades,
    dlSmartDraftAfterBoss,
    dlRerollRunDraft,
    dlRerollAfterBoss,
    dlApplyRunUpgradePick,
    dlCreateEmptyRunUpgradeState,
    dlComputeRunBonus,
    dlRunUpgradePowerScore,
    dlDescribeRunUpgrade
  };
}
