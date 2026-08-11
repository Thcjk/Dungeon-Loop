/* ============================================
   Dungeon Loop – Temporäre RUN-UPGRADES
   Verloren bei Tod / NG+-Loop-Start.
   Browser: vor script.js laden; Node: require().
   ============================================ */

const DL_RUN_UPGRADE_DEFAULTS = {
  rarity: {
    early: { common: 0.72, uncommon: 0.22, rare: 0.05, epic: 0.01, legendary: 0 },
    mid:   { common: 0.48, uncommon: 0.30, rare: 0.16, epic: 0.05, legendary: 0.01 },
    late:  { common: 0.30, uncommon: 0.28, rare: 0.24, epic: 0.13, legendary: 0.05 }
  },
  milestones: [3, 6, 9, 12, 15, 18, 22, 26],
  baseCoinCatchMult: 2,
  baseLifestealCap: 0.12
};

function dlRunUpgradeCfg() {
  const ru = (typeof DL_BALANCE !== "undefined" && DL_BALANCE && DL_BALANCE.runUpgrades)
    ? DL_BALANCE.runUpgrades : null;
  return {
    rarity: (ru && ru.rarity) || DL_RUN_UPGRADE_DEFAULTS.rarity,
    milestones: (ru && ru.milestones) || DL_RUN_UPGRADE_DEFAULTS.milestones,
    baseCoinCatchMult: (ru && ru.baseCoinCatchMult != null)
      ? ru.baseCoinCatchMult : DL_RUN_UPGRADE_DEFAULTS.baseCoinCatchMult,
    baseLifestealCap: (ru && ru.baseLifestealCap != null)
      ? ru.baseLifestealCap : DL_RUN_UPGRADE_DEFAULTS.baseLifestealCap
  };
}

/** Katalog: Offense / Defense / Economy (Abschnitte 28–30) */
const DL_RUN_UPGRADES = [
  /* ---- OFFENSE ---- */
  { id: "sharp_blade", name: "SCHARFE KLINGE", rarity: "common", unique: false, maxStacks: 4, power: 5,
    tags: ["offense", "damage"], desc: "+6% Schaden",
    effects: { damageAdd: 0.06 } },
  { id: "quick_hands", name: "SCHNELLE HÄNDE", rarity: "common", unique: false, maxStacks: 4, power: 5,
    tags: ["offense", "atkspd"], desc: "+5% Angriffsgeschwindigkeit",
    effects: { atkSpdAdd: 0.05 } },
  { id: "weak_spot", name: "SCHWACHE STELLE", rarity: "common", unique: false, maxStacks: 3, power: 5,
    tags: ["offense", "crit"], desc: "+3% Krit-Chance",
    effects: { critAdd: 0.03 } },
  { id: "boss_hunter", name: "BOSSJÄGER", rarity: "common", unique: false, maxStacks: 3, power: 6,
    tags: ["offense", "boss"], desc: "+8% Schaden gegen Bosse",
    effects: { bossDmgAdd: 0.08 } },
  { id: "executioner", name: "HENKER", rarity: "uncommon", unique: true, maxStacks: 1, power: 9,
    tags: ["offense"], desc: "+22% Schaden gegen Gegner unter 20% LP",
    effects: { executioner: true, execHpFrac: 0.2, execDmgAdd: 0.22 } },
  { id: "adrenaline", name: "ADRENALIN", rarity: "uncommon", unique: true, maxStacks: 1, power: 9,
    tags: ["offense"], desc: "+15% Angriffsgeschwindigkeit unter 35% LP",
    effects: { adrenaline: true, adrHpFrac: 0.35, adrAtkSpdAdd: 0.15 } },
  { id: "crit_precision", name: "KRIT-PRÄZISION", rarity: "uncommon", unique: false, maxStacks: 3, power: 9,
    tags: ["offense", "crit"], desc: "+12% Krit-Schaden",
    effects: { critDmgAdd: 0.12 } },
  { id: "berserker", name: "BERSERKER", rarity: "rare", unique: true, maxStacks: 1, power: 14,
    tags: ["offense"], desc: "+2,5% Schaden je 10% fehlender LP (max. +20%)",
    effects: { berserker: true, bersPer10: 0.025, bersMax: 0.2 } },
  { id: "chain_reaction", name: "KETTENREAKTION", rarity: "rare", unique: true, maxStacks: 1, power: 14,
    tags: ["offense", "crit"], desc: "Bei Krit 18% Chance: nächster Gegner nimmt 35% des Schadens",
    effects: { chainReaction: true, chainChance: 0.18, chainFrac: 0.35 } },
  { id: "focus", name: "FOKUS", rarity: "rare", unique: true, maxStacks: 1, power: 13,
    tags: ["offense"], desc: "Nach 3s ohne Schaden: +15% Schaden bis zum nächsten Treffer",
    effects: { focus: true, focusDelay: 3, focusDmgAdd: 0.15 } },
  { id: "glass_cannon", name: "GLASKANONE", rarity: "epic", unique: true, maxStacks: 1, power: 20,
    tags: ["offense", "glass"], desc: "+35% Schaden, −22% max. LP",
    effects: { glassCannon: true, damageAdd: 0.35, maxHpAdd: -0.22 } },
  { id: "specialist", name: "SPEZIALIST", rarity: "epic", unique: true, maxStacks: 1, power: 21,
    tags: ["offense", "ability"], desc: "+30% Fähigkeitsschaden, −12% Angriffsschaden, −12% CD",
    effects: { specialist: true, abilityDmgAdd: 0.3, attackDmgAdd: -0.12, cdrAdd: 0.12 } },
  { id: "war_machine", name: "KRIEGSMASCHINE", rarity: "legendary", unique: true, maxStacks: 1, power: 28,
    tags: ["offense"], desc: "Bei Kill +1,5% Schaden (max. +24%); bei Treffer −3 Stacks",
    effects: { warMachine: true, wmPerKill: 0.015, wmMax: 0.24, wmLoseOnHit: 3 } },

  /* ---- DEFENSE ---- */
  { id: "tough_body", name: "HARTER KÖRPER", rarity: "common", unique: false, maxStacks: 4, power: 5,
    tags: ["defense", "hp"], desc: "+8% max. LP",
    effects: { maxHpAdd: 0.08 } },
  { id: "plating", name: "PANZERUNG", rarity: "common", unique: false, maxStacks: 3, power: 5,
    tags: ["defense", "armor"], desc: "+5% effektive Rüstung / Schadensreduktion",
    effects: { armorAdd: 0.05 } },
  { id: "second_wind", name: "ZWEITER ATEM", rarity: "uncommon", unique: true, maxStacks: 1, power: 9,
    tags: ["defense", "heal"], desc: "Nach 8s ohne Schaden: alle 4s 2% max. LP heilen",
    effects: { secondWind: true, swDelay: 8, swInterval: 4, swHealFrac: 0.02 } },
  { id: "guard_layer", name: "SCHUTZSCHICHT", rarity: "uncommon", unique: true, maxStacks: 1, power: 10,
    tags: ["defense"], desc: "Nach schwerem Treffer (≥15% max. LP): +10% DR für 4s (CD 10s)",
    effects: { guardLayer: true, guardHitFrac: 0.15, guardDr: 0.1, guardDur: 4, guardCd: 10 } },
  { id: "iron_skin", name: "EISENHAUT", rarity: "rare", unique: true, maxStacks: 1, power: 14,
    tags: ["defense"], desc: "3 Treffer in 5s → +15% DR für 5s (CD 12s)",
    effects: { ironSkin: true, ironHits: 3, ironWindow: 5, ironDr: 0.15, ironDur: 5, ironCd: 12 } },
  { id: "bloodlust", name: "BLUTRAUSCH", rarity: "rare", unique: true, maxStacks: 1, power: 13,
    tags: ["defense", "lifesteal"], desc: "Jeder 12. Treffer heilt 2,5% max. LP (ICD 2s)",
    effects: { bloodlust: true, blEvery: 12, blHealFrac: 0.025, blIcd: 2 } },
  { id: "titan", name: "TITAN", rarity: "epic", unique: true, maxStacks: 1, power: 20,
    tags: ["defense", "tank"], desc: "+32% LP, +10% Rüstung, −10% Bewegungsgeschwindigkeit",
    effects: { titan: true, maxHpAdd: 0.32, armorAdd: 0.1, moveSpeedAdd: -0.1 } },
  { id: "vampire", name: "VAMPIR", rarity: "epic", unique: true, maxStacks: 1, power: 22,
    tags: ["defense", "lifesteal"], desc: "+5% Lebensraub, Cap 16%, Level-Heilung −50%",
    effects: { vampire: true, lifestealAdd: 0.05, lifestealCap: 0.16, levelHealMult: 0.5 } },
  { id: "last_warrior", name: "LETZTER KRIEGER", rarity: "legendary", unique: true, maxStacks: 1, power: 30,
    tags: ["defense", "revive"], desc: "Einmal pro Run: bei tödlichem Schaden auf 25% LP, 2s Immunität",
    effects: { lastWarrior: true, lwHpFrac: 0.25, lwImmune: 2 } },

  /* ---- ECONOMY ---- */
  { id: "gold_find", name: "GOLDFUND", rarity: "common", unique: false, maxStacks: 3, power: 5,
    tags: ["economy", "gold"], desc: "+8% Gold",
    effects: { goldAdd: 0.08 } },
  { id: "elite_gold", name: "ELITE-GOLD", rarity: "uncommon", unique: true, maxStacks: 1, power: 8,
    tags: ["economy"], desc: "+25% Gold von Eliten",
    effects: { eliteGoldAdd: 0.25 } },
  { id: "coin_magnet", name: "MÜNZMAGNET", rarity: "rare", unique: true, maxStacks: 1, power: 12,
    tags: ["economy"], desc: "Münz-Fang-Multiplikator 2 → 2,35",
    effects: { coinCatchSet: 2.35 } },
  { id: "gold_greed", name: "GOLDGIER", rarity: "epic", unique: true, maxStacks: 1, power: 18,
    tags: ["economy"], desc: "+30% Gold, −8% Spielerschaden",
    effects: { goldAdd: 0.3, damageAdd: -0.08 } },
  { id: "gold_fever", name: "GOLDFIEBER", rarity: "legendary", unique: true, maxStacks: 1, power: 26,
    tags: ["economy"], desc: "Fang-Bonus ×3, +12% erlittener Schaden",
    effects: { coinCatchScale: 3, enemyDmgTakenAdd: 0.12 } }
];

const DL_RUN_RARITY_ORDER = ["common", "uncommon", "rare", "epic", "legendary"];
const DL_RUN_BUILD_TYPES = ["offense", "defense", "economy"];

function dlRunUpgradeById(id) {
  return DL_RUN_UPGRADES.find((u) => u.id === id) || null;
}

function dlRunUpgradeRarityTable(progress01) {
  const r = dlRunUpgradeCfg().rarity;
  const p = Math.max(0, Math.min(1, progress01 || 0));
  if (p < 0.33) return Object.assign({}, r.early);
  if (p < 0.66) return Object.assign({}, r.mid);
  return Object.assign({}, r.late);
}

function dlRollRunUpgradeRarity(progress01, rng) {
  const roll = typeof rng === "function" ? rng : Math.random;
  const table = dlRunUpgradeRarityTable(progress01);
  let r = roll();
  for (let i = 0; i < DL_RUN_RARITY_ORDER.length; i++) {
    const key = DL_RUN_RARITY_ORDER[i];
    const w = table[key] || 0;
    if (r < w) return key;
    r -= w;
  }
  return "common";
}

function dlIsRunMilestone(playerLevel) {
  const lv = Math.max(0, Math.floor(playerLevel || 0));
  return dlRunUpgradeCfg().milestones.indexOf(lv) >= 0;
}

function dlPendingRunMilestones(playerLevel, claimedSetOrArray) {
  const lv = Math.max(0, Math.floor(playerLevel || 0));
  const claimed = claimedSetOrArray instanceof Set
    ? claimedSetOrArray
    : new Set(claimedSetOrArray || []);
  return dlRunUpgradeCfg().milestones.filter((m) => m <= lv && !claimed.has(m));
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

function dlCanOfferRunUpgrade(def, state) {
  if (!def) return false;
  const owned = dlRunUpgradeOwnedCount(state, def.id);
  const max = def.maxStacks != null ? def.maxStacks : (def.unique ? 1 : 1);
  if (owned >= max) return false;
  if (def.unique && owned > 0) return false;
  if ((def.rarity === "legendary" || def.rarity === "epic") && def.unique && owned > 0) return false;
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

function dlDraftOne(state, progress01, excludeIds, preferMode, slot0Build, rng) {
  const rarity = dlRollRunUpgradeRarity(progress01, rng);
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
 * Smart-Draft: Slot0 50% Tag-Match, Slot1 random, Slot2 anderer Build-Typ.
 */
function dlSmartDraftRunUpgrades(state, progress01, count, rng) {
  const n = Math.max(1, count == null ? 3 : count | 0);
  const roll = typeof rng === "function" ? rng : Math.random;
  const picked = [];
  const exclude = new Set();
  let slot0Build = null;

  for (let i = 0; i < n; i++) {
    let prefer = "random";
    if (i === 0 && roll() < 0.5) prefer = "tags";
    else if (i === 2) prefer = "diffBuild";
    const def = dlDraftOne(state, progress01, exclude, prefer, slot0Build, roll);
    if (!def) break;
    picked.push(def);
    exclude.add(def.id);
    if (i === 0) slot0Build = dlRunPrimaryBuild(def);
  }
  return picked;
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

  // Falls Pool zu klein: gleiche Menge wie vorher, aber nicht exakt dieselbe ID-Menge
  if (draft.length < 3) {
    const soft = dlSmartDraftRunUpgrades(state, progress01, 3, roll);
    const softIds = soft.map((d) => d.id).sort().join(",");
    const prevKey = prev.slice().sort().join(",");
    if (softIds !== prevKey) return soft;
  }
  return draft;
}

function dlCreateEmptyRunUpgradeState() {
  return {
    upgrades: [],
    stacks: {},
    rerolls: 1,
    powerScore: 0,
    buildTags: {},
    claimedMilestones: [],
    focusTimer: 0,
    warMachineStacks: 0,
    lastWarriorUsed: false,
    hitCount: 0,
    secondWindTimer: 0,
    guardCd: 0,
    ironCd: 0,
    bloodlustIcd: 0,
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
    adrenaline: false,
    berserker: false,
    focus: false,
    chainReaction: false,
    glassCannon: false,
    specialist: false,
    warMachine: false,
    secondWind: false,
    guardLayer: false,
    ironSkin: false,
    bloodlust: false,
    titan: false,
    vampire: false,
    lastWarrior: false,
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

    if (e.executioner) out.executioner = true;
    if (e.adrenaline) out.adrenaline = true;
    if (e.berserker) out.berserker = true;
    if (e.focus) out.focus = true;
    if (e.chainReaction) out.chainReaction = true;
    if (e.glassCannon) out.glassCannon = true;
    if (e.specialist) out.specialist = true;
    if (e.warMachine) out.warMachine = true;
    if (e.secondWind) out.secondWind = true;
    if (e.guardLayer) out.guardLayer = true;
    if (e.ironSkin) out.ironSkin = true;
    if (e.bloodlust) out.bloodlust = true;
    if (e.titan) out.titan = true;
    if (e.vampire) out.vampire = true;
    if (e.lastWarrior) out.lastWarrior = true;
  });

  if (coinCatchSet != null) out.coinCatchMult = coinCatchSet;
  out.coinCatchMult *= coinCatchScale;
  return out;
}

function dlDescribeRunUpgrade(def) {
  if (!def) return "";
  const r = ({ common: "Gewöhnlich", uncommon: "Ungewöhnlich", rare: "Selten",
    epic: "Episch", legendary: "Legendär" })[def.rarity] || def.rarity;
  const stack = def.unique ? "Einzigartig" : ("max. " + (def.maxStacks || 1) + "×");
  return def.name + " · " + r + " · " + stack + " — " + (def.desc || "");
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    DL_RUN_UPGRADES,
    DL_RUN_UPGRADE_DEFAULTS,
    dlRunUpgradeById,
    dlRunUpgradeRarityTable,
    dlRollRunUpgradeRarity,
    dlIsRunMilestone,
    dlPendingRunMilestones,
    dlRunUpgradeOwnedCount,
    dlCanOfferRunUpgrade,
    dlSmartDraftRunUpgrades,
    dlRerollRunDraft,
    dlApplyRunUpgradePick,
    dlCreateEmptyRunUpgradeState,
    dlComputeRunBonus,
    dlRunUpgradePowerScore,
    dlDescribeRunUpgrade
  };
}
