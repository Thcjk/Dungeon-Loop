/* ============================================
   Dungeon Loop – ZENTRALES BALANCE-SYSTEM
   Build: sidescroller-v3-176
   Alle wichtigen Formeln & Zielwerte an einem Ort.
   ============================================
   PHILOSOPHY (Hard Grind Challenge)
   - Soft gates: Skill kann etwas früher, Avg braucht Upgrades
   - Gegner skalieren NICHT mit Player-Power (kein Meta-Ease)
   - Spieler wächst über feste World-Curves hinaus
   - ~10–20 Versuche (Runs/Tode) pro Welt – Grind mit Sinn
   - ~2–4 Runs pro spürbarem Upgrade
   - First Clear: lange Session (Ziel ~180–280 Min)
   - Loop/NG+ nach First Clear
   ============================================ */

const DL_BALANCE = {
  version: 176,
  targetFirstClearMin: 220,
  targetFirstClearRange: [160, 340],
  runsPerMeaningfulUpgrade: [2, 4],
  /** Ziel: so viele Runs/Tode bis Welt-Boss realistisch fällt */
  runsPerWorld: [10, 20],

  /* ---------- PLAYER BASE (Klassen bleiben in script.js CLASSES) ---------- */
  critDamageBase: 1.85,
  critChanceCap: 0.48,
  armorFactor: 1.22,
  pierceFactor: 0.18,
  levelUpHealPct: 0.11,
  xpPerLevel: 145,
  mageManaRegen: 6,

  /* ---------- WORLD LENGTH (Dungeon-Level = Kills+1) ---------- */
  /** Soft gates: Boss-Welle freischalten bei min+length */
  worlds: [
    { id: 0, name: "Dunkler Wald",       min: 1,   length: 24, danger: 1, theme: "forest",
      hpMult: 1.00, atkMult: 1.00, speedMult: 1.00,
      budgetEarly: 3, budgetMid: 6, budgetLate: 9, budgetBoss: 14 },
    { id: 1, name: "Verfluchte Sümpfe",  min: 26,  length: 28, danger: 2, theme: "swamp",
      hpMult: 1.38, atkMult: 1.32, speedMult: 1.06,
      budgetEarly: 5, budgetMid: 8, budgetLate: 11, budgetBoss: 17 },
    { id: 2, name: "Gefrorene Berge",    min: 56,  length: 32, danger: 3, theme: "frost",
      hpMult: 1.85, atkMult: 1.68, speedMult: 1.10,
      budgetEarly: 6, budgetMid: 10, budgetLate: 14, budgetBoss: 20 },
    { id: 3, name: "Feuerlande",         min: 90,  length: 36, danger: 4, theme: "fire",
      hpMult: 2.45, atkMult: 2.15, speedMult: 1.14,
      budgetEarly: 8, budgetMid: 12, budgetLate: 16, budgetBoss: 24 },
    { id: 4, name: "Vergessene Ruinen",  min: 128, length: 42, danger: 5, theme: "ruins",
      hpMult: 3.20, atkMult: 2.70, speedMult: 1.18,
      budgetEarly: 9, budgetMid: 14, budgetLate: 18, budgetBoss: 28 }
  ],

  /* Interner World-Progress 0..1 → Difficulty-Kurve (härtere Mid/Late-Wall) */
  worldCurve: {
    warmup:   [0.00, 0.18, 0.95],
    rising:   [0.18, 0.38, 1.08],
    wall:     [0.38, 0.58, 1.28],
    elite:    [0.58, 0.74, 1.48],
    hard:     [0.74, 0.90, 1.68],
    preBoss:  [0.90, 1.00, 1.85]
  },

  /* ---------- ENEMY BASE (feste Welt-Stats, kein Player-Scaling) ---------- */
  /* ATK muss Rüstung durchbrechen – früher oft nur 1 Schaden → zu easy */
  enemy: {
    baseHp: 40,
    hpPerDepth: 4.4,
    hpPerDanger: 8.5,
    baseAtk: 12,
    atkPerDepth: 0.78,
    atkPerDanger: 2.4,
    depthPowHp: 1.036,
    depthPowAtk: 1.028,
    depthPowCap: 26,
    earlyEaseUntil: 7,
    earlyHpEase: 0.07,
    earlyAtkEase: 0.09,
    difficultyMult: 1.22,
    goldBase: 7,
    goldPerDepth: 1.65,
    goldPerDanger: 2.3,
    goldDepthFactor: 0.026,
    xpBase: 11,
    xpPerDepth: 2.2,
    xpPerDanger: 3.2,
    waveCooldown: 1.55,
    minWaveCooldown: 0.72,
    lootChance: 0.18,
    /** TTK-Ziele (Sekunden) für Sanity – Orientierung */
    ttkNormal: [1.2, 3.8],
    ttkElite: [5.0, 12],
    ttkBoss: [24, 60]
  },

  boss: {
    hpMultEarly: 5.2,
    hpMultMid: 6.4,
    hpMultLate: 7.5,
    atkMult: 2.05,
    rewardMult: 4.2
  },

  elite: {
    hpMult: 1.72,
    atkMult: 1.32,
    rewardMult: 2.2,
    cost: 5.5,
    sizeScale: 1.2
  },

  /* Encounter roles – Difficulty Cost */
  roles: {
    basic:   { cost: 1.0, hp: 1.0,  atk: 1.0,  tag: "basic" },
    fast:    { cost: 1.5, hp: 0.82, atk: 1.12, tag: "fast", speed: 1.28 },
    ranged:  { cost: 2.0, hp: 0.88, atk: 1.08, tag: "ranged" },
    tank:    { cost: 3.2, hp: 1.85, atk: 0.95, tag: "tank", speed: 0.8 },
    support: { cost: 2.6, hp: 0.95, atk: 0.9,  tag: "support" },
    elite:   { cost: 5.5, hp: 1.72, atk: 1.32, tag: "elite" },
    boss:    { cost: 9.0, hp: 1.0,  atk: 1.0,  tag: "boss" }
  },

  /** Synergie-Aufschlag wenn Kombi im Encounter */
  synergyPairs: [
    { a: "tank", b: "ranged", add: 1.8 },
    { a: "elite", b: "ranged", add: 1.5 },
    { a: "fast", b: "ranged", add: 1.0 },
    { a: "tank", b: "support", add: 1.3 }
  ],

  /* Rhythmus: nach hartem Fight etwas Luft – dann wieder Druck */
  rhythm: {
    hardThreshold: 1.22,
    breathBudgetMult: 0.68,
    breathWaves: 1
  },

  /* ---------- ECONOMY (Grind: Gold spürbar, Upgrades teuer genug) ---------- */
  economy: {
    upgradeMax: 24,
    costPow: 1.44,
    costSoftLv: 7,
    costLinear: 0.3,
    /** Ziel: ~2–4 Runs für ein spürbares Upgrade */
    avgGoldPerRunTarget: [140, 320],
    pityGoldAfterEmptyRuns: 4,
    pityGoldMult: 1.1,
    maxPityMult: 1.35,
    loopGoldMult: 0.12,
    /** Mindest-Gold pro Run (Anti-Softlock: kein wertloser Tod) */
    minRunGoldFloor: 14
  },

  /* ---------- LOOP / NG+ ---------- */
  loop: {
    enemyHpPerLoop: 0.22,
    enemyAtkPerLoop: 0.16,
    goldPerLoop: 0.12,
    budgetPerLoop: 1.0
  },

  /* ---------- PLAYER POWER TARGETS (relativ zu Start=100) ---------- */
  /* Höher, weil Gegner härter – ohne Investition stirbt man am Wall */
  powerTargets: {
    start: 100,
    afterW1: [160, 200],
    afterW2: [230, 290],
    afterW3: [330, 420],
    afterW4: [450, 560],
    final: [580, 720]
  }
};

/**
 * Upgrade-Katalog mit Kategorien, Diminishing Returns und Tiers.
 * bonus = Wert pro Stufe VOR Diminish; effectiveBonus() liefert echten Zuwachs.
 * tier: minor | major | keystone
 * Kosten höher → Grind nötig, Bonus etwas knapper → jede Stufe zählt.
 */
const DL_UPGRADES = [
  /* OFFENSE */
  { key: "upgrade_attack", cat: "offense", tier: "minor", label: "Angriff",
    baseCost: 125, bonus: 4.2, bonusText: "+Angriff", tip: "Basis-Schaden. Krieger & Waldläufer.",
    forClass: "warrior,ranger", diminish: 0.91, softCap: 12 },
  { key: "upgrade_magic", cat: "offense", tier: "minor", label: "Magieschaden",
    baseCost: 130, bonus: 4.6, bonusText: "+Magie", tip: "Zauber-Schaden. Nur Magier.",
    forClass: "mage", diminish: 0.91, softCap: 12 },
  { key: "upgrade_atkspd", cat: "offense", tier: "major", label: "Angriffsgeschwindigkeit",
    baseCost: 165, bonus: 0.035, bonusText: "+3.5% Angriffsgeschwindigkeit", tip: "Schneller angreifen (ab Stufe 8 etwas weniger Zuwachs).",
    forClass: "all", diminish: 0.87, softCap: 10, maxLv: 12 },
  { key: "upgrade_crit", cat: "offense", tier: "major", label: "Krit-Chance",
    baseCost: 155, bonus: 0.015, bonusText: "+1.5% Krit", tip: "Kritische Treffer. Stark mit Krit-Schaden.",
    forClass: "all", diminish: 0.9, softCap: 10, maxLv: 14 },
  { key: "upgrade_critdmg", cat: "offense", tier: "major", label: "Krit-Schaden",
    baseCost: 175, bonus: 0.07, bonusText: "+7% Krit-Schaden", tip: "Krits knallen härter. Synergie mit Krit.",
    forClass: "all", diminish: 0.9, softCap: 10, maxLv: 12 },
  { key: "upgrade_bossdmg", cat: "offense", tier: "major", label: "Boss-Schaden",
    baseCost: 190, bonus: 0.045, bonusText: "+4.5% vs Boss", tip: "Spezialisiert auf Welt-Bosse – lohnt sich vor dem Gate.",
    forClass: "all", diminish: 0.92, softCap: 12, maxLv: 14 },

  /* DEFENSE */
  { key: "upgrade_health", cat: "defense", tier: "minor", label: "Leben",
    baseCost: 110, bonus: 20, bonusText: "+LP", tip: "Mehr Überlebenszeit. Fast immer gut.",
    forClass: "all", diminish: 0.93, softCap: 14 },
  { key: "upgrade_defense", cat: "defense", tier: "minor", label: "Rüstung",
    baseCost: 105, bonus: 1.05, bonusText: "+DEF", tip: "Weniger Schaden pro Treffer.",
    forClass: "all", diminish: 0.88, softCap: 12 },
  { key: "upgrade_regen", cat: "defense", tier: "major", label: "Regeneration",
    baseCost: 170, bonus: 0.95, bonusText: "+0.95 LP/s", tip: "Heilung zwischen Treffern. Gut für stabile Builds.",
    forClass: "all", diminish: 0.87, softCap: 10, maxLv: 12 },
  { key: "upgrade_lifesteal", cat: "defense", tier: "keystone", label: "Lebensraub",
    baseCost: 240, bonus: 0.01, bonusText: "+1% Lebensraub", tip: "Heilung beim Treffer. Stark begrenzt – kein Unsterblichkeits-Build.",
    forClass: "all", diminish: 0.8, softCap: 6, maxLv: 8 },

  /* MOBILITY – entfernt (Sidescroller: A/D reicht, kein Dash-System) */

  /* ECONOMY */
  { key: "upgrade_gold", cat: "economy", tier: "major", label: "Gold-Fund",
    baseCost: 140, bonus: 0.075, bonusText: "+7.5% Gold", tip: "Langfristig schnellere Progression – stark im Grind.",
    forClass: "all", diminish: 0.93, softCap: 14 },
  { key: "upgrade_xp", cat: "economy", tier: "minor", label: "XP-Bonus",
    baseCost: 125, bonus: 0.05, bonusText: "+5% XP", tip: "Schneller Held-Level im Run.",
    forClass: "all", diminish: 0.93, softCap: 12 },

  /* UTILITY / SPECIAL */
  { key: "upgrade_cooldown", cat: "utility", tier: "keystone", label: "Spezial-CD",
    baseCost: 185, bonus: 0.3, bonusText: "-0.3s CD", tip: "Kürzere CD + neue Fähigkeiten (3/6/10/14/20).",
    forClass: "all", diminish: 0.94, softCap: 16 },
  { key: "upgrade_mana", cat: "utility", tier: "minor", label: "Mana",
    baseCost: 125, bonus: 14, bonusText: "+Mana", tip: "Nur Magier – mehr Zauber pro Run.",
    forClass: "mage", diminish: 0.93, softCap: 12 }
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

/** Smooth internal difficulty multiplier from world progress 0..1 */
function dlWorldIntensity(progress) {
  const c = DL_BALANCE.worldCurve;
  const p = Math.max(0, Math.min(1, progress));
  const bands = [c.warmup, c.rising, c.wall, c.elite, c.hard, c.preBoss];
  for (let i = 0; i < bands.length; i++) {
    const [a, b, mult] = bands[i];
    if (p >= a && p < b) {
      const t = (p - a) / Math.max(0.001, b - a);
      const next = bands[i + 1] ? bands[i + 1][2] : mult;
      return mult + (next - mult) * t * 0.35;
    }
  }
  return c.preBoss[2];
}

function dlEncounterBudget(worldDef, progress, isBoss, loopIndex, breath) {
  let budget;
  if (isBoss) budget = worldDef.budgetBoss;
  else if (progress < 0.33) budget = worldDef.budgetEarly;
  else if (progress < 0.66) budget = worldDef.budgetMid;
  else budget = worldDef.budgetLate;

  const intensity = isBoss ? 1 : dlWorldIntensity(progress);
  budget *= intensity;
  budget += (loopIndex || 0) * (DL_BALANCE.loop.budgetPerLoop || 0.8);
  if (breath) budget *= DL_BALANCE.rhythm.breathBudgetMult;
  return Math.max(2, budget);
}

function dlSynergyExtra(tags) {
  let extra = 0;
  const set = new Set(tags || []);
  DL_BALANCE.synergyPairs.forEach((p) => {
    if (set.has(p.a) && set.has(p.b)) extra += p.add;
  });
  return extra;
}

/** Effektiver Upgrade-Bonus mit Diminishing Returns */
function dlEffectiveBonus(up, level) {
  const lv = Math.max(0, Math.floor(level || 0));
  if (lv <= 0 || !up) return 0;
  const dim = up.diminish != null ? up.diminish : 0.92;
  const soft = up.softCap != null ? up.softCap : 12;
  let total = 0;
  for (let i = 0; i < lv; i++) {
    const factor = i < soft ? Math.pow(dim, i) : Math.pow(dim, soft) * Math.pow(0.85, i - soft);
    total += up.bonus * factor;
  }
  return total;
}

function dlUpgradeMax(up) {
  if (up && up.maxLv != null) return Math.min(DL_BALANCE.economy.upgradeMax, up.maxLv);
  return DL_BALANCE.economy.upgradeMax;
}

function dlUpgradeCost(up, level) {
  const lv = Math.max(0, Math.floor(level || 0));
  const max = dlUpgradeMax(up);
  if (lv >= max) return Infinity;
  const eco = DL_BALANCE.economy;
  const pow = eco.costPow;
  const soft = eco.costSoftLv;
  if (lv < soft) return Math.floor(up.baseCost * Math.pow(pow, lv));
  const anchor = up.baseCost * Math.pow(pow, soft);
  return Math.floor(anchor * (1 + (lv - soft) * eco.costLinear));
}

/**
 * Player Power Score (~100 at start). Für Analyse / Debug – NICHT für Enemy-Scaling.
 * FinalDamage ≈ atk * (1+boss) * (1 + crit*(critDmg-1)) * atkspdFactor
 */
function dlPlayerPowerScore(stats) {
  const s = stats || {};
  const atk = Math.max(1, s.attack || s.magicDamage || 1);
  const mag = Math.max(0, s.magicDamage || 0);
  const dpsProxy = Math.max(atk, mag) * (s.atkSpeedMult || 1);
  const critEV = 1 + Math.min(0.48, s.crit || 0) * ((s.critDamage || 1.85) - 1);
  const ehp = (s.maxHp || 100) * (1 + (s.defense || 0) * 0.04) * (1 + (s.regen || 0) * 0.03);
  const mob = 1;
  const special = 1 + (s.lifesteal || 0) * 2 + (s.bossDamage || 0) * 0.4;
  const raw = dpsProxy * critEV * 2.2 + ehp * 0.35;
  return Math.round(100 * (raw / 120) * mob * special);
}

function dlLoopEnemyMult(loopIndex) {
  const L = Math.max(0, loopIndex | 0);
  const lp = DL_BALANCE.loop;
  return {
    hp: 1 + L * lp.enemyHpPerLoop,
    atk: 1 + L * lp.enemyAtkPerLoop,
    gold: 1 + L * lp.goldPerLoop
  };
}

/** Theme → bevorzugte Rollen für Encounter-Mix */
function dlThemeRoleWeights(theme, danger) {
  const base = { basic: 1, fast: 0.45, ranged: 0.35, tank: 0.28, support: 0.18 };
  if (theme === "swamp" || danger >= 2) base.ranged += 0.5;
  if (theme === "frost" || danger >= 3) { base.fast += 0.55; base.tank += 0.25; }
  if (theme === "fire" || danger >= 4) { base.tank += 0.4; base.support += 0.3; base.ranged += 0.25; }
  if (theme === "ruins" || danger >= 5) { base.elite = 0.4; base.support += 0.35; base.ranged += 0.3; }
  return base;
}

/**
 * Sanity-Checks – gibt Warnungs-Strings zurück.
 * Aufruf aus Debug-Dashboard / Konsole: dlRunSanityChecks(ctx)
 */
function dlRunSanityChecks(ctx) {
  const warnings = [];
  const B = DL_BALANCE;
  const ups = DL_UPGRADES;
  if (!ups.length) warnings.push("Keine Upgrades definiert");

  // Economy: Kosten Stufe 0–2 vs typisches Run-Gold (Grind: 2–4 Runs ok)
  const sampleGold = 220;
  ups.filter((u) => u.tier === "minor").slice(0, 3).forEach((u) => {
    const c1 = dlUpgradeCost(u, 0);
    if (c1 > sampleGold * 1.8) warnings.push(u.key + ": Stufe 1 zu teuer im Vergleich zum Run-Gold");
    const c5 = dlUpgradeCost(u, 5);
    if (c5 / sampleGold > 8) warnings.push(u.key + ": Stufe 6 braucht mehr als 8 Durchschnitts-Runs");
  });

  // Lifesteal cap
  const ls = ups.find((u) => u.key === "upgrade_lifesteal");
  if (ls) {
    const total = dlEffectiveBonus(ls, dlUpgradeMax(ls));
    if (total > 0.12) warnings.push("Lebensraub-Maximum zu hoch: " + total.toFixed(3));
  }

  // Crit chance total
  const cr = ups.find((u) => u.key === "upgrade_crit");
  if (cr && ctx && ctx.baseCrit != null) {
    const total = (ctx.baseCrit || 0) + dlEffectiveBonus(cr, dlUpgradeMax(cr));
    if (total > B.critChanceCap + 0.05) warnings.push("Krit-Chance über dem Maximum möglich: " + total.toFixed(2));
  }

  // World lengths
  let prev = 0;
  B.worlds.forEach((w, i) => {
    if (w.min < prev) warnings.push("Welt-Startlevel steigt nicht: " + w.name);
    prev = w.min + w.length;
    if (w.length < 16) warnings.push("Welt zu kurz: " + w.name);
  });

  // Power targets sanity
  if (B.powerTargets.final[0] < B.powerTargets.afterW4[1]) {
    warnings.push("End-Power-Ziel niedriger als nach Welt 4");
  }

  // Enemy ATK must meaningfully pierce base warrior armor
  const warriorDef = 8 * (B.armorFactor || 1.22);
  const earlyAtk = B.enemy.baseAtk + 1 * B.enemy.atkPerDepth + 1 * B.enemy.atkPerDanger;
  const pierce = Math.floor(earlyAtk * (B.pierceFactor || 0.18));
  const dmg = Math.max(1, Math.max(pierce, earlyAtk - warriorDef));
  if (dmg < 4) warnings.push("Früher Gegner-Schaden zu niedrig vs Krieger-Rüstung: " + dmg);

  return warnings;
}

/** Export-Hilfe für script.js: UPGRADES-kompatible Liste */
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
    diminish: u.diminish,
    softCap: u.softCap,
    maxLv: u.maxLv
  }));
}

/** Erwartete Gold pro Kill (Orientierung für Sim) */
function dlEstimateGoldPerKill(depth, danger, loopIndex) {
  const E = DL_BALANCE.enemy;
  const loop = dlLoopEnemyMult(loopIndex || 0);
  const goldBase = E.goldBase + depth * E.goldPerDepth + danger * E.goldPerDanger;
  return Math.floor(goldBase * loop.gold * (1 + depth * E.goldDepthFactor));
}

/** Simuliert Run-Gold bei gegebener Tiefe & Killrate */
function dlSimulateRunGold(kills, depth, danger, loopIndex, pityMult) {
  const perKill = dlEstimateGoldPerKill(depth, danger, loopIndex);
  const base = kills * perKill;
  const floor = DL_BALANCE.economy.minRunGoldFloor || 12;
  return Math.max(floor, Math.floor(base * (pityMult || 1)));
}

/** Archetyp-Build für Simulations-Vergleich */
const DL_BUILD_ARCHETYPES = {
  beginner: { attack: 0, health: 2, defense: 1, gold: 1, atkspd: 0, crit: 0 },
  average:  { attack: 4, health: 4, defense: 3, gold: 2, atkspd: 2, crit: 2, bossdmg: 1 },
  skilled:  { attack: 6, health: 5, defense: 4, gold: 3, atkspd: 4, crit: 4, bossdmg: 3, regen: 2 },
  tank:     { attack: 2, health: 10, defense: 8, regen: 4, lifesteal: 2 },
  crit:     { attack: 4, health: 3, crit: 8, critdmg: 6, atkspd: 4 },
  economy:  { attack: 2, health: 3, gold: 8, xp: 4 }
};

function dlSimulatePowerFromLevels(levelMap) {
  const ups = {};
  Object.keys(levelMap || {}).forEach((k) => {
    ups["upgrade_" + k] = levelMap[k];
  });
  let atk = 20, hp = 120, def = 5, crit = 0.06, critDmg = 1.85;
  DL_UPGRADES.forEach((u) => {
    const lv = ups[u.key] || 0;
    const eff = dlEffectiveBonus(u, lv);
    if (u.key === "upgrade_attack") atk += eff;
    if (u.key === "upgrade_health") hp += eff;
    if (u.key === "upgrade_defense") def += eff;
    if (u.key === "upgrade_crit") crit += eff;
    if (u.key === "upgrade_critdmg") critDmg += eff;
  });
  return dlPlayerPowerScore({ attack: atk, maxHp: hp, defense: def, crit, critDamage: critDmg, atkSpeedMult: 1 + (ups.upgrade_atkspd ? dlEffectiveBonus(DL_UPGRADES.find(x => x.key === "upgrade_atkspd"), ups.upgrade_atkspd) : 0) });
}

/**
 * Grobe First-Clear-Zeit-Schätzung (Minuten) – nur für Dev/Sanity.
 * skillFactor: 1.0 = average, 0.75 = skilled, 1.35 = beginner
 * Inkl. ~14 Runs/Welt Grind-Overhead
 */
function dlEstimateFirstClearMinutes(skillFactor) {
  const sf = Math.max(0.6, skillFactor || 1);
  let totalLevels = 0;
  DL_BALANCE.worlds.forEach((w) => { totalLevels += w.length; });
  const runsPerWorld = ((DL_BALANCE.runsPerWorld[0] + DL_BALANCE.runsPerWorld[1]) / 2) * sf;
  const worlds = DL_BALANCE.worlds.length;
  const avgSecPerLevel = 48 * sf;
  const upgradePauseMin = 28 * sf;
  const deathRetryMin = worlds * runsPerWorld * 1.1;
  return Math.round((totalLevels * avgSecPerLevel) / 60 + upgradePauseMin + deathRetryMin);
}

/** Vollständige Sanity + Sim-Ausgabe für tools/balance-sim.js */
function dlRunBalanceReport() {
  const warnings = dlRunSanityChecks({ baseCrit: 0.06 });
  const powers = {};
  Object.keys(DL_BUILD_ARCHETYPES).forEach((name) => {
    powers[name] = dlSimulatePowerFromLevels(DL_BUILD_ARCHETYPES[name]);
  });
  return {
    version: DL_BALANCE.version,
    targetClearMin: DL_BALANCE.targetFirstClearMin,
    runsPerWorld: DL_BALANCE.runsPerWorld,
    estimateMinutes: {
      beginner: dlEstimateFirstClearMinutes(1.35),
      average: dlEstimateFirstClearMinutes(1.0),
      skilled: dlEstimateFirstClearMinutes(0.75)
    },
    powerByArchetype: powers,
    sampleRunGold: {
      early: dlSimulateRunGold(10, 6, 1, 0, 1),
      mid: dlSimulateRunGold(16, 18, 2, 0, 1),
      late: dlSimulateRunGold(20, 40, 4, 0, 1)
    },
    upgradeCosts: {
      attackLv1: dlUpgradeCost(DL_UPGRADES.find(u => u.key === "upgrade_attack"), 0),
      healthLv1: dlUpgradeCost(DL_UPGRADES.find(u => u.key === "upgrade_health"), 0),
      lifestealLv1: dlUpgradeCost(DL_UPGRADES.find(u => u.key === "upgrade_lifesteal"), 0)
    },
    warnings
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    DL_BALANCE, DL_UPGRADES, dlRunBalanceReport, dlRunSanityChecks,
    dlPlayerPowerScore, dlEffectiveBonus, dlUpgradeCost, dlEstimateFirstClearMinutes
  };
}
