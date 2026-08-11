/* ============================================
   Dungeon Loop – ZENTRALES BALANCE-SYSTEM
   Build: sidescroller-v3-177
   Alle wichtigen Formeln & Zielwerte an einem Ort.
   ============================================
   PHILOSOPHY (Hard Grind + Run-Upgrades)
   - Soft gates: Skill kann etwas früher, Avg braucht Meta
   - Gegner skalieren NICHT mit Player-Power
   - First Clear Ziel ~120 Min, ~22 Tode
   - ~2–4 Runs pro spürbarem Meta-Upgrade
   - Meta maxLv 8, feste Kostentabelle
   - Loop/NG+ nach First Clear
   ============================================ */

const DL_BALANCE = {
  version: 177,
  targetFirstClearMin: 120,
  targetFirstClearRange: [105, 145],
  targetDeaths: [18, 28],
  targetDeathsMedian: 22,
  runsPerMeaningfulUpgrade: [2, 4],
  /** Abgeleitet aus Todeszielen / Welt – für balance-sim & Legacy */
  runsPerWorld: [3, 6],

  /* Legacy aliases für script.js BALANCE-Proxy */
  critDamageBase: 1.70,
  critChanceCap: 0.45,
  armorFactor: 1.15,
  pierceFactor: 0.16,
  levelUpHealPct: 0.10,
  xpPerLevel: 110,

  classes: {
    warrior: {
      name: "Krieger",
      hp: 135, attack: 18, defense: 5, crit: 0.04, critDamage: 1.70,
      mana: 0, magicDamage: 0, range: 82, attackRate: 440, moveSpeed: 128,
      aoeFalloff: 0.74, special: "Schildschlag", specialCd: 8, specialRange: 90,
      specialMult: 2.2, attackType: "melee",
      desc: "Nahkampf-Schwert, kurze Reichweite, viel Leben"
    },
    ranger: {
      name: "Waldläufer",
      hp: 102, attack: 14, defense: 2, crit: 0.06, critDamage: 1.75,
      mana: 0, magicDamage: 0, range: 225, attackRate: 360, moveSpeed: 146,
      closeRange: 60, meleePenalty: 0.45,
      proj: "projectile_arrow", projSpeed: 13,
      special: "Präzisionsschuss", specialCd: 5, attackType: "ranged",
      desc: "Bogen, große Reichweite, schwach im Nahkampf"
    },
    mage: {
      name: "Magier",
      hp: 92, attack: 7, defense: 1, crit: 0.04, critDamage: 1.70,
      mana: 130, magicDamage: 29, range: 205, attackRate: 300, moveSpeed: 138,
      manaPerShot: 3, proj: "projectile_fire", projSpeed: 8,
      special: "Feuerball", specialCd: 6, manaCost: 26, attackType: "magic",
      desc: "Zauber, mittlere Reichweite, braucht Mana"
    }
  },

  caps: {
    critChance: 0.45,
    critDamage: 2.60,
    lifesteal: 0.10,
    lifestealEpic: 0.16,
    damageReduction: 0.55,
    attackSpeedBonus: 0.75,
    cooldownReduction: 0.40,
    moveSpeedBonus: 0.25,
    bossDamage: 0.50
  },

  levelUpHeal: {
    bands: [
      { maxLevel: 20, pct: 0.10 },
      { maxLevel: 50, pct: 0.08 },
      { maxLevel: 90, pct: 0.06 },
      { maxLevel: Infinity, pct: 0.05 }
    ],
    softCapHpPct: 0.85,
    regenPauseAfterDamageSec: 4
  },

  xp: {
    base: 110,
    perLevel: 3.2
  },

  mageManaRegen: 6,

  worlds: [
    {
      id: 0, name: "Dunkler Wald", min: 1, length: 22, danger: 1, theme: "forest",
      hpMult: 1.00, atkMult: 1.00, speedMult: 1.00, rewardMult: 1.00,
      budget: { start: 2.5, p25: 3.5, p50: 4.5, p75: 5.5, preBoss: 6.5, boss: 8 },
      budgetEarly: 2.5, budgetMid: 4.5, budgetLate: 6.5, budgetBoss: 8,
      maxEnemies: 5,
      composition: { basic: 0.55, fast: 0.20, ranged: 0.10, tank: 0.10, elite: 0.05 },
      entryEase: 1.0
    },
    {
      id: 1, name: "Verfluchte Sümpfe", min: 24, length: 26, danger: 2, theme: "swamp",
      hpMult: 1.42, atkMult: 1.30, speedMult: 1.05, rewardMult: 1.28,
      budget: { start: 4.5, p25: 5.5, p50: 6.5, p75: 7.5, preBoss: 9, boss: 11 },
      budgetEarly: 4.5, budgetMid: 6.5, budgetLate: 9, budgetBoss: 11,
      maxEnemies: 6,
      composition: { basic: 0.35, fast: 0.15, ranged: 0.25, tank: 0.10, support: 0.08, elite: 0.07 },
      entryEase: 0.90
    },
    {
      id: 2, name: "Gefrorene Berge", min: 52, length: 30, danger: 3, theme: "frost",
      hpMult: 1.95, atkMult: 1.66, speedMult: 1.09, rewardMult: 1.65,
      budget: { start: 6, p25: 7.5, p50: 9, p75: 10.5, preBoss: 12.5, boss: 15 },
      budgetEarly: 6, budgetMid: 9, budgetLate: 12.5, budgetBoss: 15,
      maxEnemies: 6,
      composition: { basic: 0.25, fast: 0.25, ranged: 0.15, tank: 0.12, jump: 0.12, elite: 0.11 },
      entryEase: 0.90
    },
    {
      id: 3, name: "Feuerlande", min: 84, length: 34, danger: 4, theme: "fire",
      hpMult: 2.72, atkMult: 2.12, speedMult: 1.13, rewardMult: 2.15,
      budget: { start: 8, p25: 10, p50: 12, p75: 14, preBoss: 16.5, boss: 20 },
      budgetEarly: 8, budgetMid: 12, budgetLate: 16.5, budgetBoss: 20,
      maxEnemies: 7,
      composition: { basic: 0.20, fast: 0.15, ranged: 0.18, tank: 0.15, support: 0.15, elite: 0.17 },
      entryEase: 0.90
    },
    {
      id: 4, name: "Vergessene Ruinen", min: 120, length: 38, danger: 5, theme: "ruins",
      hpMult: 3.65, atkMult: 2.72, speedMult: 1.17, rewardMult: 2.80,
      budget: { start: 10, p25: 12.5, p50: 15, p75: 17.5, preBoss: 20, boss: 24 },
      budgetEarly: 10, budgetMid: 15, budgetLate: 20, budgetBoss: 24,
      maxEnemies: 7,
      composition: { basic: 0.15, fast: 0.15, ranged: 0.18, tank: 0.15, support: 0.15, jump: 0.10, elite: 0.12 },
      entryEase: 0.90
    }
  ],

  /** Legacy worldCurve – dlWorldIntensity bevorzugt depthScaling */
  worldCurve: {
    warmup:  [0.00, 0.20, 0.95],
    rising:  [0.20, 0.40, 1.10],
    wall:    [0.40, 0.60, 1.28],
    elite:   [0.60, 0.75, 1.42],
    hard:    [0.75, 0.90, 1.55],
    preBoss: [0.90, 1.00, 1.70]
  },

  depthScaling: {
    hpPerProgress: 0.28,
    atkPerProgress: 0.20,
    budgetPerProgress: 0.55
  },

  enemy: {
    baseHp: 38,
    baseAtk: 6,
    armor: 0,
    goldBase: 4,
    goldPerDepth: 0.7,
    goldPerDanger: 1.2,
    goldDepthFactor: 0.012,
    xpBase: 10,
    xpPerDepth: 1.8,
    xpPerDanger: 2.4,
    waveCooldown: 1.65,
    minWaveCooldown: 0.78,
    lootChanceBasic: 0.14,
    lootChanceFast: 0.16,
    lootChanceRanged: 0.16,
    lootChanceTank: 0.22,
    lootChanceSupport: 0.20,
    lootChanceElite: 0.65,
    lootChanceBoss: 1.0,
    lootChance: 0.14,
    ttkNormal: [0.8, 1.6],
    ttkElite: [5, 10],
    ttkBoss: [55, 130],
    /* Legacy keys – Depth läuft über Progress-Formel / World-Mults */
    hpPerDepth: 0,
    atkPerDepth: 0,
    hpPerDanger: 0,
    atkPerDanger: 0,
    depthPowHp: 1,
    depthPowAtk: 1,
    depthPowCap: 1,
    earlyEaseUntil: 0,
    earlyHpEase: 0,
    earlyAtkEase: 0,
    difficultyMult: 1
  },

  roles: {
    basic:   { cost: 1.0,  hp: 1.00, atk: 1.00, speed: 1.00, tag: "basic" },
    fast:    { cost: 1.45, hp: 0.72, atk: 0.85, speed: 1.45, atkSpeed: 1.25, tag: "fast" },
    ranged:  { cost: 1.75, hp: 0.78, atk: 1.15, speed: 1.00, atkSpeed: 0.85, tag: "ranged" },
    tank:    { cost: 2.6,  hp: 2.35, atk: 1.05, speed: 0.68, armor: 0.12, tag: "tank" },
    support: { cost: 2.4,  hp: 0.95, atk: 0.65, speed: 1.00, tag: "support" },
    jump:    { cost: 1.9,  hp: 0.90, atk: 1.20, speed: 1.15, tag: "jump" },
    elite:   { cost: 5.2,  hp: 3.2,  atk: 1.55, speed: 1.08, tag: "elite" },
    boss:    { cost: 9.0,  hp: 1.0,  atk: 1.0,  tag: "boss" }
  },

  elite: { hpMult: 3.2, atkMult: 1.55, rewardMult: 3.0, cost: 5.2, sizeScale: 1.2 },

  synergy: {
    pairs: [
      { a: "tank", b: "ranged", mult: 1.20 },
      { a: "tank", b: "support", mult: 1.25 },
      { a: "fast", b: "ranged", mult: 1.12 },
      { a: "elite", b: "support", mult: 1.30 },
      { a: "elite", b: "ranged", mult: 1.20 }
    ],
    twoRanged: 1.10,
    threeFast: 1.15,
    maxOvershoot: 1.15
  },

  synergyPairs: [
    { a: "tank", b: "ranged", add: 0.8 },
    { a: "tank", b: "support", add: 1.0 },
    { a: "fast", b: "ranged", add: 0.5 },
    { a: "elite", b: "support", add: 1.2 },
    { a: "elite", b: "ranged", add: 0.8 }
  ],

  rhythm: {
    hardThreshold: 1.2,
    breathBudgetMult: 0.60,
    breathChance: 0.30,
    breathWaves: 1
  },

  bosses: [
    { world: 0, hp: 900,  atk: 13, fightSec: [55, 80],  gold: 250 },
    { world: 1, hp: 1850, atk: 18, fightSec: [60, 90],  gold: 420 },
    { world: 2, hp: 3300, atk: 25, fightSec: [70, 100], gold: 700 },
    { world: 3, hp: 5400, atk: 34, fightSec: [75, 110], gold: 1050 },
    { world: 4, hp: 8400, atk: 44, fightSec: [90, 130], gold: 1500 }
  ],

  boss: { hpMultEarly: 1, hpMultMid: 1, hpMultLate: 1, atkMult: 1, rewardMult: 4.2 },

  bossAttackPct: {
    light: [0.08, 0.12],
    normal: [0.13, 0.18],
    heavy: [0.22, 0.30],
    ultimate: [0.35, 0.40]
  },

  economy: {
    upgradeMax: 8,
    costTable: [120, 190, 310, 500, 790, 1220, 1850, 2750],
    costPow: 1.57,
    costSoftLv: 8,
    costLinear: 0.3,
    avgGoldPerRunTarget: [90, 160],
    goldByWorld: {
      0: [90, 160],
      boss0: [180, 300],
      1: [250, 450],
      2: [450, 750],
      3: [700, 1150],
      4: [1000, 1600]
    },
    coinCatchAvg: [0.45, 0.60],
    coinCatchSkilled: [0.70, 0.85],
    coinBonusMult: 2.0,
    pityGoldAfterEmptyRuns: 3,
    pitySteps: [1.25, 1.40],
    pityGoldMult: 1.25,
    maxPityMult: 1.50,
    minRunGoldFloor: 50,
    minRunGoldUpgradeFrac: 0.12,
    loopGoldMult: 0.18
  },

  loop: {
    enemyHpPerLoop: 0.22,
    enemyAtkPerLoop: 0.15,
    goldPerLoop: 0.18,
    budgetPerLoop: 0.07,
    budgetMultPerLoop: 0.07,
    eliteChancePerLoop: 0.02,
    bossHpPerLoop: 0.10,
    bossAtkPerLoop: 0.05
  },

  powerTargets: {
    start: 1.00,
    world: [
      { meta: [1.00, 1.12], run: [1.00, 1.12], total: [1.05, 1.22] },
      { meta: [1.12, 1.30], run: [1.12, 1.30], total: [1.30, 1.60] },
      { meta: [1.28, 1.48], run: [1.25, 1.45], total: [1.60, 2.00] },
      { meta: [1.45, 1.70], run: [1.38, 1.62], total: [2.00, 2.60] },
      { meta: [1.65, 1.95], run: [1.50, 1.80], total: [2.50, 3.40] }
    ]
  },

  simulationTargets: {
    firstClearMin: [105, 145],
    firstClearMedian: 120,
    deaths: [18, 28],
    deathsByWorld: [[3, 5], [3, 5], [4, 6], [4, 6], [4, 7]],
    bossAttempts: [[1, 3], [2, 4], [2, 5], [3, 5], [3, 6]],
    firstRunWorld1Progress: { average: [0.30, 0.45], skilled: [0.50, 0.75] }
  },

  runUpgrades: {
    milestones: [4, 9, 15, 22, 30, 39, 49, 60, 72, 85, 99, 114, 130],
    choicesPerPick: 3,
    freeRerolls: 1,
    targetPicksFirstClear: [11, 13],
    targetRunPower: [130, 175],
    maxStrongRngPower: 210,
    rarity: {
      early: { common: 0.58, uncommon: 0.30, rare: 0.09, epic: 0.025, legendary: 0.005 },
      mid:   { common: 0.40, uncommon: 0.34, rare: 0.18, epic: 0.07,  legendary: 0.01 },
      late:  { common: 0.25, uncommon: 0.35, rare: 0.25, epic: 0.12,  legendary: 0.03 }
    },
    powerBudget: {
      common: [4, 7], uncommon: [7, 11], rare: [11, 17], epic: [17, 25], legendary: [25, 35]
    }
  }
};

/**
 * Meta-Upgrade-Katalog – maxLv 8, tabellen-/flat-/pct-Boni.
 * bonus = Fallback-Inkrement; levels = per-level %-Punkte (table) oder ungenutzt.
 */
const DL_UPGRADES = [
  /* OFFENSE */
  {
    key: "upgrade_attack", cat: "offense", tier: "minor", label: "Angriff",
    baseCost: 120, bonus: 0.05, bonusMode: "table",
    levels: [5, 5, 6, 6, 7, 7, 8, 8],
    bonusText: "+ATK %", tip: "Basis-Schaden %. Krieger & Waldläufer.",
    forClass: "warrior,ranger", maxLv: 8
  },
  {
    key: "upgrade_magic", cat: "offense", tier: "minor", label: "Magieschaden",
    baseCost: 120, bonus: 0.05, bonusMode: "table",
    levels: [5, 5, 6, 6, 7, 7, 8, 8],
    bonusText: "+Magie %", tip: "Zauber-Schaden %. Nur Magier.",
    forClass: "mage", maxLv: 8
  },
  {
    key: "upgrade_atkspd", cat: "offense", tier: "major", label: "Angriffsgeschwindigkeit",
    baseCost: 120, bonus: 0.04, bonusMode: "table",
    levels: [4, 4, 5, 5, 6, 6, 7, 7],
    bonusText: "+AtkSpd %", tip: "Schneller angreifen (max +44 %).",
    forClass: "all", maxLv: 8
  },
  {
    key: "upgrade_crit", cat: "offense", tier: "major", label: "Krit-Chance",
    baseCost: 120, bonus: 0.025, bonusMode: "flat",
    levels: null,
    bonusText: "+2.5% Krit", tip: "Kritische Treffer. Stark mit Krit-Schaden.",
    forClass: "all", maxLv: 8
  },
  {
    key: "upgrade_critdmg", cat: "offense", tier: "major", label: "Krit-Schaden",
    baseCost: 120, bonus: 0.08, bonusMode: "flat",
    levels: null,
    bonusText: "+0.08x Krit-DMG", tip: "Krits knallen härter. Synergie mit Krit.",
    forClass: "all", maxLv: 8
  },
  {
    key: "upgrade_bossdmg", cat: "offense", tier: "major", label: "Boss-Schaden",
    baseCost: 120, bonus: 0.05, bonusMode: "pctOfBase",
    levels: [5, 5, 5, 5, 5, 5, 5, 5],
    bonusText: "+5% vs Boss", tip: "Spezialisiert auf Welt-Bosse.",
    forClass: "all", maxLv: 8
  },

  /* DEFENSE */
  {
    key: "upgrade_health", cat: "defense", tier: "minor", label: "Leben",
    baseCost: 120, bonus: 0.07, bonusMode: "pctOfBase",
    levels: [7, 7, 7, 7, 7, 7, 7, 7],
    bonusText: "+7% LP", tip: "Mehr max HP %. Fast immer gut.",
    forClass: "all", maxLv: 8
  },
  {
    key: "upgrade_defense", cat: "defense", tier: "minor", label: "Rüstung",
    baseCost: 120, bonus: 0.03, bonusMode: "flat",
    levels: null,
    bonusText: "+3% DR", tip: "Damage Reduction vor DR-Formel.",
    forClass: "all", maxLv: 8
  },
  {
    key: "upgrade_regen", cat: "defense", tier: "major", label: "Regeneration",
    baseCost: 120, bonus: 0.0010, bonusMode: "flat",
    levels: null,
    bonusText: "+% HP/s", tip: "Heilung als Anteil maxHP/s. Pausiert 4s nach Schaden.",
    forClass: "all", maxLv: 8
  },
  {
    key: "upgrade_lifesteal", cat: "defense", tier: "keystone", label: "Lebensraub",
    baseCost: 120, bonus: 0.01, bonusMode: "flat",
    levels: null,
    bonusText: "+1% Lebensraub", tip: "Meta-Lifesteal max 8 %, Hardcap 10 %.",
    forClass: "all", maxLv: 8
  },

  /* ECONOMY */
  {
    key: "upgrade_gold", cat: "economy", tier: "major", label: "Gold-Fund",
    baseCost: 120, bonus: 0.07, bonusMode: "pctOfBase",
    levels: [7, 7, 7, 7, 7, 7, 7, 7],
    bonusText: "+7% Gold", tip: "Mehr Gold pro Run – stark im Grind.",
    forClass: "all", maxLv: 8
  },
  {
    key: "upgrade_xp", cat: "economy", tier: "minor", label: "XP-Bonus",
    baseCost: 120, bonus: 0.05, bonusMode: "pctOfBase",
    levels: [5, 5, 5, 5, 5, 5, 5, 5],
    bonusText: "+5% XP", tip: "Schneller Held-Level im Run.",
    forClass: "all", maxLv: 8
  },

  /* UTILITY */
  {
    key: "upgrade_cooldown", cat: "utility", tier: "keystone", label: "Spezial-CD",
    baseCost: 120, bonus: 0.04, bonusMode: "pctOfBase",
    levels: [4, 4, 4, 4, 4, 4, 4, 4],
    bonusText: "-4% CD", tip: "Cooldown-Reduction (max 32 %, Cap 40 %).",
    forClass: "all", maxLv: 8
  },
  {
    key: "upgrade_mana", cat: "utility", tier: "minor", label: "Mana",
    baseCost: 120, bonus: 10, bonusMode: "flat",
    levels: null,
    bonusText: "+10 Mana", tip: "Nur Magier – mehr Zauber pro Run.",
    forClass: "mage", maxLv: 8
  }
];

const DL_UPGRADE_CAT_LABELS = {
  offense: "ANGRIFF",
  defense: "VERTEIDIGUNG",
  economy: "WIRTSCHAFT",
  utility: "SPEZIAL"
};

/* ========== FORMELN ========== */

function dlWorldDefs() {
  return DL_BALANCE.worlds;
}

function dlGetWorldDef(index) {
  const list = DL_BALANCE.worlds;
  const i = Math.max(0, Math.min(list.length - 1, index | 0));
  return list[i];
}

function dlWorldProgress(dungeonLevel, worldDef) {
  const start = worldDef.min || 1;
  const len = Math.max(1, worldDef.length || 20);
  return Math.max(0, Math.min(1, (dungeonLevel - start) / len));
}

function dlDepthHpMult(p) {
  const ds = DL_BALANCE.depthScaling || {};
  return 1 + (ds.hpPerProgress || 0.28) * Math.max(0, Math.min(1, p || 0));
}

function dlDepthAtkMult(p) {
  const ds = DL_BALANCE.depthScaling || {};
  return 1 + (ds.atkPerProgress || 0.20) * Math.max(0, Math.min(1, p || 0));
}

function dlDepthBudgetMult(p) {
  const ds = DL_BALANCE.depthScaling || {};
  return 1 + (ds.budgetPerProgress || 0.55) * Math.max(0, Math.min(1, p || 0));
}

/** Intensity aus Depth-Scaling (Budget-Kurve als Proxy) */
function dlWorldIntensity(progress) {
  const p = Math.max(0, Math.min(1, progress || 0));
  return dlDepthBudgetMult(p);
}

function dlInterpBudget(budget, progress) {
  if (!budget) return 4;
  const p = Math.max(0, Math.min(1, progress || 0));
  const keys = [
    [0.00, budget.start],
    [0.25, budget.p25],
    [0.50, budget.p50],
    [0.75, budget.p75],
    [1.00, budget.preBoss]
  ];
  for (let i = 0; i < keys.length - 1; i++) {
    const [a, va] = keys[i];
    const [b, vb] = keys[i + 1];
    if (p >= a && p <= b) {
      const t = (p - a) / Math.max(0.001, b - a);
      return va + (vb - va) * t;
    }
  }
  return budget.preBoss != null ? budget.preBoss : budget.p50;
}

function dlEncounterBudget(worldDef, progress, isBoss, loopIndex, breath) {
  const w = worldDef || {};
  const b = w.budget;
  let budget;
  if (isBoss) {
    budget = (b && b.boss != null) ? b.boss : (w.budgetBoss != null ? w.budgetBoss : 12);
  } else if (b) {
    budget = dlInterpBudget(b, progress);
    budget *= dlDepthBudgetMult(progress);
  } else if (progress < 0.33) {
    budget = w.budgetEarly != null ? w.budgetEarly : 3;
  } else if (progress < 0.66) {
    budget = w.budgetMid != null ? w.budgetMid : 6;
  } else {
    budget = w.budgetLate != null ? w.budgetLate : 9;
  }

  const L = Math.max(0, loopIndex | 0);
  const loop = DL_BALANCE.loop || {};
  const multPer = loop.budgetMultPerLoop != null ? loop.budgetMultPerLoop : (loop.budgetPerLoop || 0);
  if (multPer > 0 && multPer < 1.5) {
    budget *= 1 + L * multPer;
  } else if (L > 0) {
    budget += L * (loop.budgetPerLoop || 0);
  }

  if (breath) {
    const r = DL_BALANCE.rhythm || {};
    budget *= (r.breathBudgetMult != null ? r.breathBudgetMult : 0.6);
  }
  return Math.max(2, budget);
}

function dlSynergyExtra(tags) {
  let extra = 0;
  const set = new Set(tags || []);
  (DL_BALANCE.synergyPairs || []).forEach((p) => {
    if (set.has(p.a) && set.has(p.b)) extra += p.add;
  });
  return extra;
}

/** Multiplikative Synergie auf Encounter-Budget */
function dlSynergyMult(tags) {
  const list = tags || [];
  const set = new Set(list);
  const syn = DL_BALANCE.synergy || {};
  let mult = 1;
  (syn.pairs || []).forEach((p) => {
    if (set.has(p.a) && set.has(p.b)) mult *= p.mult;
  });
  const rangedCount = list.filter((t) => t === "ranged").length;
  const fastCount = list.filter((t) => t === "fast").length;
  if (rangedCount >= 2) mult *= (syn.twoRanged || 1);
  if (fastCount >= 3) mult *= (syn.threeFast || 1);
  const maxO = syn.maxOvershoot || 1.15;
  return Math.min(maxO, mult);
}

function dlUpgradeMax(up) {
  const ecoMax = (DL_BALANCE.economy && DL_BALANCE.economy.upgradeMax) || 8;
  if (up && up.maxLv != null) return Math.min(ecoMax, up.maxLv);
  return ecoMax;
}

function dlUpgradeCost(up, level) {
  const lv = Math.max(0, Math.floor(level || 0));
  const table = (DL_BALANCE.economy && DL_BALANCE.economy.costTable) || [];
  if (lv >= dlUpgradeMax(up)) return Infinity;
  if (table[lv] != null) return table[lv];
  const base = (up && up.baseCost) || 120;
  const pow = (DL_BALANCE.economy && DL_BALANCE.economy.costPow) || 1.57;
  return Math.floor(base * Math.pow(pow, lv));
}

/**
 * TOTALER Bonus bei gegebener Stufe.
 * %-Upgrades → Fraction (0.52 = +52 %).
 * Regen → aktuelle Rate (Fraction maxHP/s) auf diesem Level.
 */
function dlEffectiveBonus(up, level) {
  const lv = Math.max(0, Math.floor(level || 0));
  if (lv <= 0 || !up) return 0;

  const key = up.key || "";
  const mode = up.bonusMode || null;

  if (key === "upgrade_regen") {
    return 0.0010 + 0.0005 * (lv - 1);
  }
  if (key === "upgrade_crit") return 0.025 * lv;
  if (key === "upgrade_critdmg") return 0.08 * lv;
  if (key === "upgrade_defense") return 0.03 * lv;
  if (key === "upgrade_lifesteal") return 0.01 * lv;
  if (key === "upgrade_mana") return 10 * lv;

  if (mode === "table" && Array.isArray(up.levels)) {
    let sum = 0;
    for (let i = 0; i < lv && i < up.levels.length; i++) sum += up.levels[i];
    // levels are %-points (5 = +5%)
    return sum / 100;
  }

  if (mode === "pctOfBase") {
    if (Array.isArray(up.levels) && up.levels.length) {
      let sum = 0;
      for (let i = 0; i < lv && i < up.levels.length; i++) sum += up.levels[i];
      return sum / 100;
    }
    return (up.bonus || 0) * lv;
  }

  if (mode === "flat") {
    return (up.bonus || 0) * lv;
  }

  // Legacy diminish fallback
  if (up.diminish != null) {
    const dim = up.diminish;
    const soft = up.softCap != null ? up.softCap : 12;
    let total = 0;
    for (let i = 0; i < lv; i++) {
      const factor = i < soft ? Math.pow(dim, i) : Math.pow(dim, soft) * Math.pow(0.85, i - soft);
      total += (up.bonus || 0) * factor;
    }
    return total;
  }

  return (up.bonus || 0) * lv;
}

function dlXpNeeded(level) {
  const xp = DL_BALANCE.xp || { base: 110, perLevel: 3.2 };
  const lv = Math.max(1, Math.floor(level || 1));
  return xp.base + lv * xp.perLevel;
}

function dlLevelUpHealPct(playerLevel) {
  const bands = (DL_BALANCE.levelUpHeal && DL_BALANCE.levelUpHeal.bands) || [];
  const lv = Math.max(1, Math.floor(playerLevel || 1));
  for (let i = 0; i < bands.length; i++) {
    if (lv <= bands[i].maxLevel) return bands[i].pct;
  }
  return DL_BALANCE.levelUpHealPct || 0.05;
}

/**
 * Level-Up-Heilung mit Soft-Cap 85 %.
 * War HP bereits >= softCap: normale Heal, nie über 100 %.
 */
function dlApplyLevelUpHeal(currentHp, maxHp, playerLevel) {
  const maxH = Math.max(1, maxHp || 1);
  let hp = Math.max(0, currentHp || 0);
  const pct = dlLevelUpHealPct(playerLevel);
  const soft = (DL_BALANCE.levelUpHeal && DL_BALANCE.levelUpHeal.softCapHpPct) || 0.85;
  const softHp = maxH * soft;
  const heal = Math.floor(maxH * pct);
  if (hp >= softHp) {
    hp = Math.min(maxH, hp + heal);
  } else {
    hp = Math.min(softHp, hp + heal);
  }
  return Math.max(0, Math.min(maxH, hp));
}

function dlGetBossDef(worldIndex) {
  const list = DL_BALANCE.bosses || [];
  const i = Math.max(0, Math.min(list.length - 1, worldIndex | 0));
  return list.find((b) => b.world === i) || list[i] || null;
}

function dlMinRunGoldFloor(cheapestUpgradeCost) {
  const eco = DL_BALANCE.economy || {};
  const floor = eco.minRunGoldFloor != null ? eco.minRunGoldFloor : 50;
  const frac = eco.minRunGoldUpgradeFrac != null ? eco.minRunGoldUpgradeFrac : 0.12;
  const cost = Math.max(0, Number(cheapestUpgradeCost) || 0);
  return Math.max(floor, Math.floor(cost * frac));
}

/**
 * Normalized Power Score (Start ≈ 1.00).
 * Für Analyse – NICHT für Enemy-Scaling.
 * Optional scale100: true → ~100 am Start (Legacy-Sim-Anzeige).
 */
function dlPlayerPowerScore(stats, scale100) {
  const s = stats || {};
  const caps = DL_BALANCE.caps || {};
  const atk = Math.max(1, s.attack || 1);
  const mag = Math.max(0, s.magicDamage || 0);
  const dpsProxy = Math.max(atk, mag) * (s.atkSpeedMult || 1);
  const critCap = caps.critChance != null ? caps.critChance : 0.45;
  const critEV = 1 + Math.min(critCap, s.crit || 0) * ((s.critDamage || DL_BALANCE.critDamageBase || 1.7) - 1);
  const dr = Math.min(caps.damageReduction || 0.55, s.defense || 0);
  const ehp = (s.maxHp || 100) * (1 + dr) * (1 + (s.regen || 0) * 80);
  const special = 1 + Math.min(caps.lifesteal || 0.1, s.lifesteal || 0) * 2
    + Math.min(caps.bossDamage || 0.5, s.bossDamage || 0) * 0.4;
  const raw = dpsProxy * critEV * 2.2 + ehp * 0.35;
  const norm = (raw / 120) * special;
  if (scale100) return Math.round(100 * norm);
  return Math.round(norm * 100) / 100;
}

function dlLoopEnemyMult(loopIndex) {
  const L = Math.max(0, loopIndex | 0);
  const lp = DL_BALANCE.loop || {};
  return {
    hp: 1 + L * (lp.enemyHpPerLoop || 0),
    atk: 1 + L * (lp.enemyAtkPerLoop || 0),
    gold: 1 + L * (lp.goldPerLoop || 0),
    budget: 1 + L * (lp.budgetMultPerLoop != null ? lp.budgetMultPerLoop : (lp.budgetPerLoop || 0)),
    eliteChance: L * (lp.eliteChancePerLoop || 0),
    bossHp: 1 + L * (lp.bossHpPerLoop || 0),
    bossAtk: 1 + L * (lp.bossAtkPerLoop || 0)
  };
}

/** Theme / World-Composition → Rollen-Gewichte */
function dlThemeRoleWeights(theme, danger) {
  const worlds = DL_BALANCE.worlds || [];
  const byTheme = worlds.find((w) => w.theme === theme);
  if (byTheme && byTheme.composition) {
    const out = {};
    Object.keys(byTheme.composition).forEach((k) => {
      out[k] = byTheme.composition[k];
    });
    return out;
  }
  const byDanger = worlds.find((w) => w.danger === danger);
  if (byDanger && byDanger.composition) {
    return Object.assign({}, byDanger.composition);
  }
  const base = { basic: 1, fast: 0.45, ranged: 0.35, tank: 0.28, support: 0.18 };
  if (theme === "swamp" || danger >= 2) base.ranged += 0.5;
  if (theme === "frost" || danger >= 3) { base.fast += 0.55; base.tank += 0.25; base.jump = 0.35; }
  if (theme === "fire" || danger >= 4) { base.tank += 0.4; base.support += 0.3; base.ranged += 0.25; }
  if (theme === "ruins" || danger >= 5) { base.elite = 0.4; base.support += 0.35; base.ranged += 0.3; base.jump = 0.25; }
  return base;
}

function dlRunSanityChecks(ctx) {
  const warnings = [];
  const B = DL_BALANCE;
  const ups = DL_UPGRADES;
  if (!ups.length) warnings.push("Keine Upgrades definiert");

  const sampleGold = ((B.economy.avgGoldPerRunTarget || [90, 160])[0]
    + (B.economy.avgGoldPerRunTarget || [90, 160])[1]) / 2;

  ups.filter((u) => u.tier === "minor").slice(0, 3).forEach((u) => {
    const c1 = dlUpgradeCost(u, 0);
    if (c1 > sampleGold * 2.2) warnings.push(u.key + ": Stufe 1 zu teuer im Vergleich zum Run-Gold");
    const c5 = dlUpgradeCost(u, 5);
    if (c5 / sampleGold > 12) warnings.push(u.key + ": Stufe 6 braucht mehr als 12 Durchschnitts-Runs");
  });

  const ls = ups.find((u) => u.key === "upgrade_lifesteal");
  if (ls) {
    const total = dlEffectiveBonus(ls, dlUpgradeMax(ls));
    const cap = (B.caps && B.caps.lifesteal) || 0.10;
    if (total > cap + 0.001) warnings.push("Lebensraub-Meta über Cap: " + total.toFixed(3));
  }

  const cr = ups.find((u) => u.key === "upgrade_crit");
  if (cr && ctx && ctx.baseCrit != null) {
    const total = (ctx.baseCrit || 0) + dlEffectiveBonus(cr, dlUpgradeMax(cr));
    const cap = (B.caps && B.caps.critChance) || B.critChanceCap || 0.45;
    if (total > cap + 0.05) warnings.push("Krit-Chance über dem Maximum möglich: " + total.toFixed(2));
  }

  const atk = ups.find((u) => u.key === "upgrade_attack");
  if (atk) {
    const t = dlEffectiveBonus(atk, 8);
    if (Math.abs(t - 0.52) > 0.001) warnings.push("Angriff max sollte 0.52 sein, ist " + t);
  }
  const as = ups.find((u) => u.key === "upgrade_atkspd");
  if (as) {
    const t = dlEffectiveBonus(as, 8);
    if (Math.abs(t - 0.44) > 0.001) warnings.push("AtkSpd max sollte 0.44 sein, ist " + t);
  }

  let prev = 0;
  B.worlds.forEach((w) => {
    if (w.min < prev) warnings.push("Welt-Startlevel steigt nicht: " + w.name);
    prev = w.min + w.length;
    if (w.length < 16) warnings.push("Welt zu kurz: " + w.name);
    if (!w.budget) warnings.push("Welt ohne budget-Objekt: " + w.name);
  });

  const pt = B.powerTargets;
  if (pt && Array.isArray(pt.world) && pt.world.length >= 2) {
    const last = pt.world[pt.world.length - 1];
    const prevW = pt.world[pt.world.length - 2];
    if (last.total[0] < prevW.total[1] * 0.9) {
      warnings.push("End-Power-Ziel ungewöhnlich niedrig vs vorherige Welt");
    }
  }

  const sumLen = B.worlds.reduce((s, w) => s + w.length, 0);
  if (sumLen < 100 || sumLen > 200) {
    warnings.push("Weltlängen-Summe ungewöhnlich: " + sumLen);
  }

  return warnings;
}

function dlUpgradesAsLegacy() {
  return DL_UPGRADES.map((u) => ({
    key: u.key,
    label: u.label,
    baseCost: u.baseCost,
    bonus: u.bonus,
    bonusText: u.bonusText,
    tip: u.tip,
    forClass: u.forClass,
    cat: u.cat,
    tier: u.tier,
    bonusMode: u.bonusMode,
    levels: u.levels,
    maxLv: u.maxLv
  }));
}

function dlEstimateGoldPerKill(depth, danger, loopIndex) {
  const E = DL_BALANCE.enemy;
  const loop = dlLoopEnemyMult(loopIndex || 0);
  const goldBase = E.goldBase + depth * E.goldPerDepth + danger * E.goldPerDanger;
  return Math.floor(goldBase * loop.gold * (1 + depth * E.goldDepthFactor));
}

function dlSimulateRunGold(kills, depth, danger, loopIndex, pityMult) {
  const perKill = dlEstimateGoldPerKill(depth, danger, loopIndex);
  const base = kills * perKill;
  const floor = DL_BALANCE.economy.minRunGoldFloor || 50;
  return Math.max(floor, Math.floor(base * (pityMult || 1)));
}

/** Archetyp-Builds (Meta-Level, max 8) */
const DL_BUILD_ARCHETYPES = {
  beginner: { attack: 0, health: 2, defense: 1, gold: 1, atkspd: 0, crit: 0 },
  average:  { attack: 3, health: 3, defense: 2, gold: 2, atkspd: 2, crit: 2, bossdmg: 1 },
  skilled:  { attack: 5, health: 4, defense: 3, gold: 3, atkspd: 4, crit: 4, bossdmg: 3, regen: 2 },
  tank:     { attack: 2, health: 8, defense: 6, regen: 4, lifesteal: 3 },
  crit:     { attack: 4, health: 3, crit: 8, critdmg: 6, atkspd: 4 },
  economy:  { attack: 2, health: 3, gold: 8, xp: 4 },
  mageAvg:  { magic: 4, mana: 4, health: 3, bossdmg: 2, cooldown: 2 },
  rangerAvg:{ attack: 4, crit: 4, critdmg: 3, atkspd: 3, health: 2 }
};

function dlFindUpgrade(key) {
  return DL_UPGRADES.find((x) => x.key === key) || null;
}

function dlSimulatePowerFromLevels(levelMap) {
  const ups = {};
  Object.keys(levelMap || {}).forEach((k) => {
    ups["upgrade_" + k] = levelMap[k];
  });
  const base = DL_BALANCE.classes.warrior;
  let atk = base.attack;
  let hp = base.hp;
  let def = 0;
  let crit = base.crit;
  let critDmg = base.critDamage;
  let atkSpd = 1;
  let bossDmg = 0;
  let lifesteal = 0;
  let regen = 0;

  DL_UPGRADES.forEach((u) => {
    const lv = ups[u.key] || 0;
    const eff = dlEffectiveBonus(u, lv);
    if (u.key === "upgrade_attack") atk *= (1 + eff);
    if (u.key === "upgrade_health") hp *= (1 + eff);
    if (u.key === "upgrade_defense") def += eff;
    if (u.key === "upgrade_crit") crit += eff;
    if (u.key === "upgrade_critdmg") critDmg += eff;
    if (u.key === "upgrade_atkspd") atkSpd += eff;
    if (u.key === "upgrade_bossdmg") bossDmg += eff;
    if (u.key === "upgrade_lifesteal") lifesteal += eff;
    if (u.key === "upgrade_regen") regen = eff;
  });

  const caps = DL_BALANCE.caps || {};
  return dlPlayerPowerScore({
    attack: atk,
    maxHp: hp,
    defense: Math.min(caps.damageReduction || 0.55, def),
    crit: Math.min(caps.critChance || 0.45, crit),
    critDamage: Math.min(caps.critDamage || 2.6, critDmg),
    atkSpeedMult: Math.min(1 + (caps.attackSpeedBonus || 0.75), atkSpd),
    bossDamage: Math.min(caps.bossDamage || 0.5, bossDmg),
    lifesteal: Math.min(caps.lifesteal || 0.1, lifesteal),
    regen
  }, true);
}

function dlEstimateFirstClearMinutes(skillFactor) {
  const sf = Math.max(0.6, skillFactor || 1);
  let totalLevels = 0;
  DL_BALANCE.worlds.forEach((w) => { totalLevels += w.length; });
  const deaths = DL_BALANCE.targetDeaths || [18, 28];
  const avgDeaths = ((deaths[0] + deaths[1]) / 2) * sf;
  const avgSecPerLevel = 22 * sf;
  const upgradePauseMin = 14 * sf;
  const deathRetryMin = avgDeaths * 2.2;
  return Math.round((totalLevels * avgSecPerLevel) / 60 + upgradePauseMin + deathRetryMin);
}

function dlRunBalanceReport() {
  const warnings = dlRunSanityChecks({ baseCrit: 0.06 });
  const powers = {};
  Object.keys(DL_BUILD_ARCHETYPES).forEach((name) => {
    powers[name] = dlSimulatePowerFromLevels(DL_BUILD_ARCHETYPES[name]);
  });

  const attackUp = DL_UPGRADES.find((u) => u.key === "upgrade_attack");
  const healthUp = DL_UPGRADES.find((u) => u.key === "upgrade_health");
  const lsUp = DL_UPGRADES.find((u) => u.key === "upgrade_lifesteal");

  return {
    version: DL_BALANCE.version,
    targetClearMin: DL_BALANCE.targetFirstClearMin,
    targetClearRange: DL_BALANCE.targetFirstClearRange,
    targetDeaths: DL_BALANCE.targetDeaths,
    targetDeathsMedian: DL_BALANCE.targetDeathsMedian,
    runsPerWorld: DL_BALANCE.runsPerWorld,
    simulationTargets: DL_BALANCE.simulationTargets,
    estimateMinutes: {
      beginner: dlEstimateFirstClearMinutes(1.35),
      average: dlEstimateFirstClearMinutes(1.0),
      skilled: dlEstimateFirstClearMinutes(0.75)
    },
    powerByArchetype: powers,
    sampleRunGold: {
      early: dlSimulateRunGold(12, 5, 1, 0, 1),
      mid: dlSimulateRunGold(14, 12, 2, 0, 1),
      late: dlSimulateRunGold(16, 20, 4, 0, 1)
    },
    upgradeCosts: {
      attackLv1: dlUpgradeCost(attackUp, 0),
      healthLv1: dlUpgradeCost(healthUp, 0),
      lifestealLv1: dlUpgradeCost(lsUp, 0),
      attackMax: dlUpgradeCost(attackUp, 7)
    },
    upgradeTotals: {
      attackMax: dlEffectiveBonus(attackUp, 8),
      atkspdMax: dlEffectiveBonus(DL_UPGRADES.find((u) => u.key === "upgrade_atkspd"), 8),
      healthMax: dlEffectiveBonus(healthUp, 8),
      lifestealMax: dlEffectiveBonus(lsUp, 8)
    },
    minRunGoldFloorExample: dlMinRunGoldFloor(120),
    warnings
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    DL_BALANCE,
    DL_UPGRADES,
    DL_UPGRADE_CAT_LABELS,
    DL_BUILD_ARCHETYPES,
    dlWorldDefs,
    dlGetWorldDef,
    dlWorldProgress,
    dlWorldIntensity,
    dlEncounterBudget,
    dlSynergyExtra,
    dlSynergyMult,
    dlLoopEnemyMult,
    dlThemeRoleWeights,
    dlPlayerPowerScore,
    dlRunSanityChecks,
    dlUpgradesAsLegacy,
    dlEstimateGoldPerKill,
    dlSimulateRunGold,
    dlRunBalanceReport,
    dlEstimateFirstClearMinutes,
    dlUpgradeCost,
    dlUpgradeMax,
    dlEffectiveBonus,
    dlXpNeeded,
    dlLevelUpHealPct,
    dlApplyLevelUpHeal,
    dlGetBossDef,
    dlDepthHpMult,
    dlDepthAtkMult,
    dlDepthBudgetMult,
    dlMinRunGoldFloor,
    dlSimulatePowerFromLevels,
    dlInterpBudget,
    dlFindUpgrade
  };
}
