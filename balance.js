/* ============================================
   Dungeon Loop – ZENTRALES BALANCE-SYSTEM
   Build: sidescroller-v3-171
   Alle wichtigen Formeln & Zielwerte an einem Ort.
   ============================================
   PHILOSOPHY
   - Soft gates: Skill kann früher schaffen, Avg braucht Upgrades
   - Gegner skalieren NICHT mit Player-Power (kein Meta-Ease)
   - Spieler wächst über feste World-Curves hinaus
   - ~90–150 Min First Clear (Ziel ~120)
   - 1–3 Runs pro spürbarem Upgrade
   - Loop/NG+ nach First Clear
   ============================================ */

const DL_BALANCE = {
  version: 166,
  targetFirstClearMin: 120,
  targetFirstClearRange: [90, 150],
  runsPerMeaningfulUpgrade: [1, 3],

  /* ---------- PLAYER BASE (Klassen bleiben in script.js CLASSES) ---------- */
  critDamageBase: 1.85,
  critChanceCap: 0.52,
  armorFactor: 1.35,
  pierceFactor: 0.12,
  levelUpHealPct: 0.18,
  xpPerLevel: 130,
  mageManaRegen: 7,

  /* ---------- WORLD LENGTH (Dungeon-Level = Kills+1) ---------- */
  /** Soft gates: Boss-Welle freischalten bei min des nächsten Worlds */
  worlds: [
    { id: 0, name: "Dunkler Wald",       min: 1,   length: 18, danger: 1, theme: "forest",
      hpMult: 1.00, atkMult: 1.00, speedMult: 1.00,
      budgetEarly: 3, budgetMid: 5, budgetLate: 7, budgetBoss: 12 },
    { id: 1, name: "Verfluchte Sümpfe",  min: 20,  length: 22, danger: 2, theme: "swamp",
      hpMult: 1.12, atkMult: 1.10, speedMult: 1.04,
      budgetEarly: 4, budgetMid: 6, budgetLate: 9, budgetBoss: 14 },
    { id: 2, name: "Gefrorene Berge",    min: 42,  length: 26, danger: 3, theme: "frost",
      hpMult: 1.26, atkMult: 1.20, speedMult: 1.08,
      budgetEarly: 5, budgetMid: 8, budgetLate: 11, budgetBoss: 16 },
    { id: 3, name: "Feuerlande",         min: 70,  length: 30, danger: 4, theme: "fire",
      hpMult: 1.42, atkMult: 1.32, speedMult: 1.12,
      budgetEarly: 6, budgetMid: 10, budgetLate: 13, budgetBoss: 18 },
    { id: 4, name: "Vergessene Ruinen",  min: 105, length: 36, danger: 5, theme: "ruins",
      hpMult: 1.60, atkMult: 1.46, speedMult: 1.15,
      budgetEarly: 7, budgetMid: 11, budgetLate: 15, budgetBoss: 22 }
  ],

  /* Interner World-Progress 0..1 → Difficulty-Kurve (smooth peaks) */
  worldCurve: {
    warmup:   [0.00, 0.20, 0.88],
    rising:   [0.20, 0.40, 1.00],
    wall:     [0.40, 0.60, 1.12],
    elite:    [0.60, 0.75, 1.22],
    hard:     [0.75, 0.90, 1.28],
    preBoss:  [0.90, 1.00, 1.35]
  },

  /* ---------- ENEMY BASE (feste Welt-Stats, kein Player-Scaling) ---------- */
  enemy: {
    baseHp: 30,
    hpPerDepth: 3.4,
    hpPerDanger: 5.5,
    baseAtk: 3.6,
    atkPerDepth: 0.42,
    atkPerDanger: 1.1,
    depthPowHp: 1.028,
    depthPowAtk: 1.018,
    depthPowCap: 22,
    earlyEaseUntil: 12,
    earlyHpEase: 0.10,
    earlyAtkEase: 0.14,
    difficultyMult: 1.0,
    goldBase: 8,
    goldPerDepth: 2.2,
    goldPerDanger: 3.2,
    goldDepthFactor: 0.035,
    xpBase: 11,
    xpPerDepth: 2.4,
    xpPerDanger: 3.5,
    waveCooldown: 1.9,
    minWaveCooldown: 0.9,
    lootChance: 0.2,
    /** TTK-Ziele (Sekunden) für Sanity – Orientierung */
    ttkNormal: [0.6, 2.2],
    ttkElite: [3.5, 8],
    ttkBoss: [18, 45]
  },

  boss: {
    hpMultEarly: 3.8,
    hpMultMid: 4.2,
    hpMultLate: 4.6,
    atkMult: 1.65,
    rewardMult: 5.0
  },

  elite: {
    hpMult: 1.55,
    atkMult: 1.22,
    rewardMult: 2.4,
    cost: 5,
    sizeScale: 1.18
  },

  /* Encounter roles – Difficulty Cost */
  roles: {
    basic:   { cost: 1.0, hp: 1.0,  atk: 1.0,  tag: "basic" },
    fast:    { cost: 1.5, hp: 0.85, atk: 1.05, tag: "fast", speed: 1.25 },
    ranged:  { cost: 2.0, hp: 0.9,  atk: 1.0,  tag: "ranged" },
    tank:    { cost: 3.0, hp: 1.7,  atk: 0.9,  tag: "tank", speed: 0.82 },
    support: { cost: 2.5, hp: 0.95, atk: 0.85, tag: "support" },
    elite:   { cost: 5.0, hp: 1.55, atk: 1.22, tag: "elite" },
    boss:    { cost: 8.0, hp: 1.0,  atk: 1.0,  tag: "boss" }
  },

  /** Synergie-Aufschlag wenn Kombi im Encounter */
  synergyPairs: [
    { a: "tank", b: "ranged", add: 1.5 },
    { a: "elite", b: "ranged", add: 1.2 },
    { a: "fast", b: "ranged", add: 0.8 },
    { a: "tank", b: "support", add: 1.0 }
  ],

  /* Rhythmus: nach hartem Fight leichteres Budget */
  rhythm: {
    hardThreshold: 1.18,
    breathBudgetMult: 0.72,
    breathWaves: 1
  },

  /* ---------- ECONOMY ---------- */
  economy: {
    upgradeMax: 24,
    /** Kosten: base * pow^lv, ab softLv linear */
    costPow: 1.38,
    costSoftLv: 8,
    costLinear: 0.28,
    /** Ziel: spürbares Upgrade nach 1–3 Runs */
    pityGoldAfterEmptyRuns: 3,
    pityGoldMult: 1.15,
    maxPityMult: 1.45,
    /** Loop-Gold */
    loopGoldMult: 0.12
  },

  /* ---------- LOOP / NG+ ---------- */
  loop: {
    enemyHpPerLoop: 0.18,
    enemyAtkPerLoop: 0.12,
    goldPerLoop: 0.15,
    budgetPerLoop: 0.8
  },

  /* ---------- PLAYER POWER TARGETS (relativ zu Start=100) ---------- */
  powerTargets: {
    start: 100,
    afterW1: [130, 150],
    afterW2: [170, 210],
    afterW3: [230, 280],
    afterW4: [300, 370],
    final: [400, 500]
  }
};

/**
 * Upgrade-Katalog mit Kategorien, Diminishing Returns und Tiers.
 * bonus = Wert pro Stufe VOR Diminish; effectiveBonus() liefert echten Zuwachs.
 * tier: minor | major | keystone
 */
const DL_UPGRADES = [
  /* OFFENSE */
  { key: "upgrade_attack", cat: "offense", tier: "minor", label: "Angriff",
    baseCost: 85, bonus: 5, bonusText: "+Angriff", tip: "Basis-Schaden. Krieger & Waldläufer.",
    forClass: "warrior,ranger", diminish: 0.92, softCap: 12 },
  { key: "upgrade_magic", cat: "offense", tier: "minor", label: "Magieschaden",
    baseCost: 90, bonus: 5.5, bonusText: "+Magie", tip: "Zauber-Schaden. Nur Magier.",
    forClass: "mage", diminish: 0.92, softCap: 12 },
  { key: "upgrade_atkspd", cat: "offense", tier: "major", label: "Angriffsgeschwindigkeit",
    baseCost: 120, bonus: 0.04, bonusText: "+4% Angriffsgeschwindigkeit", tip: "Schneller angreifen (ab Stufe 8 etwas weniger Zuwachs).",
    forClass: "all", diminish: 0.88, softCap: 10, maxLv: 12 },
  { key: "upgrade_crit", cat: "offense", tier: "major", label: "Krit-Chance",
    baseCost: 115, bonus: 0.018, bonusText: "+1.8% Krit", tip: "Kritische Treffer. Stark mit Krit-Schaden.",
    forClass: "all", diminish: 0.9, softCap: 10, maxLv: 14 },
  { key: "upgrade_critdmg", cat: "offense", tier: "major", label: "Krit-Schaden",
    baseCost: 130, bonus: 0.08, bonusText: "+8% Krit-Schaden", tip: "Krits knallen härter. Synergie mit Krit.",
    forClass: "all", diminish: 0.9, softCap: 10, maxLv: 12 },
  { key: "upgrade_bossdmg", cat: "offense", tier: "major", label: "Boss-Schaden",
    baseCost: 140, bonus: 0.05, bonusText: "+5% vs Boss", tip: "Spezialisiert auf Welt-Bosse.",
    forClass: "all", diminish: 0.93, softCap: 12, maxLv: 14 },

  /* DEFENSE */
  { key: "upgrade_health", cat: "defense", tier: "minor", label: "Leben",
    baseCost: 75, bonus: 26, bonusText: "+LP", tip: "Mehr Überlebenszeit. Fast immer gut.",
    forClass: "all", diminish: 0.94, softCap: 14 },
  { key: "upgrade_defense", cat: "defense", tier: "minor", label: "Rüstung",
    baseCost: 70, bonus: 1.15, bonusText: "+DEF", tip: "Weniger Schaden pro Treffer.",
    forClass: "all", diminish: 0.9, softCap: 12 },
  { key: "upgrade_regen", cat: "defense", tier: "major", label: "Regeneration",
    baseCost: 125, bonus: 1.2, bonusText: "+1.2 LP/s", tip: "Heilung zwischen Treffern. Gut für stabile Builds.",
    forClass: "all", diminish: 0.88, softCap: 10, maxLv: 12 },
  { key: "upgrade_lifesteal", cat: "defense", tier: "keystone", label: "Lebensraub",
    baseCost: 180, bonus: 0.012, bonusText: "+1,2% Lebensraub", tip: "Heilung beim Treffer. Stark begrenzt – kein Unsterblichkeits-Build.",
    forClass: "all", diminish: 0.82, softCap: 6, maxLv: 8 },

  /* MOBILITY */
  { key: "upgrade_movespeed", cat: "mobility", tier: "major", label: "Bewegung",
    baseCost: 110, bonus: 0.035, bonusText: "+3,5% Bewegung", tip: "Schneller positionieren und ausweichen.",
    forClass: "all", diminish: 0.9, softCap: 10, maxLv: 12 },

  /* ECONOMY */
  { key: "upgrade_gold", cat: "economy", tier: "major", label: "Gold-Fund",
    baseCost: 100, bonus: 0.09, bonusText: "+9% Gold", tip: "Langfristig schnellere Progression.",
    forClass: "all", diminish: 0.94, softCap: 14 },
  { key: "upgrade_xp", cat: "economy", tier: "minor", label: "XP-Bonus",
    baseCost: 90, bonus: 0.06, bonusText: "+6% XP", tip: "Schneller Held-Level im Run.",
    forClass: "all", diminish: 0.94, softCap: 12 },

  /* UTILITY / SPECIAL */
  { key: "upgrade_cooldown", cat: "utility", tier: "keystone", label: "Spezial-CD",
    baseCost: 135, bonus: 0.35, bonusText: "-0.35s CD", tip: "Kürzere CD + neue Fähigkeiten (3/6/10/14/20).",
    forClass: "all", diminish: 0.95, softCap: 16 },
  { key: "upgrade_mana", cat: "utility", tier: "minor", label: "Mana",
    baseCost: 90, bonus: 16, bonusText: "+Mana", tip: "Nur Magier – mehr Zauber pro Run.",
    forClass: "mage", diminish: 0.94, softCap: 12 }
];

const DL_UPGRADE_CAT_LABELS = {
  offense: "ANGRIFF",
  defense: "VERTEIDIGUNG",
  mobility: "BEWEGLICHKEIT",
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
  const critEV = 1 + Math.min(0.52, s.crit || 0) * ((s.critDamage || 1.85) - 1);
  const ehp = (s.maxHp || 100) * (1 + (s.defense || 0) * 0.04) * (1 + (s.regen || 0) * 0.03);
  const mob = 1 + ((s.moveSpeedMult || 1) - 1) * 0.5;
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
  const base = { basic: 1, fast: 0.4, ranged: 0.3, tank: 0.25, support: 0.15 };
  if (theme === "swamp" || danger >= 2) base.ranged += 0.45;
  if (theme === "frost" || danger >= 3) { base.fast += 0.5; base.tank += 0.2; }
  if (theme === "fire" || danger >= 4) { base.tank += 0.35; base.support += 0.25; base.ranged += 0.2; }
  if (theme === "ruins" || danger >= 5) { base.elite = 0.35; base.support += 0.3; base.ranged += 0.25; }
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

  // Economy: Kosten Stufe 0–2 vs typisches Run-Gold
  const sampleGold = 550;
  ups.filter((u) => u.tier === "minor").slice(0, 3).forEach((u) => {
    const c1 = dlUpgradeCost(u, 0);
    if (c1 > sampleGold * 1.2) warnings.push(u.key + ": Stufe 1 zu teuer im Vergleich zum Run-Gold");
    const c5 = dlUpgradeCost(u, 5);
    if (c5 / sampleGold > 4) warnings.push(u.key + ": Stufe 6 braucht mehr als 4 Durchschnitts-Runs");
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
    if (w.length < 12) warnings.push("Welt zu kurz: " + w.name);
  });

  // Power targets sanity
  if (B.powerTargets.final[0] < B.powerTargets.afterW4[1]) {
    warnings.push("End-Power-Ziel niedriger als nach Welt 4");
  }

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
