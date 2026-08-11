/* ============================================
   Dungeon Loop – ZENTRALES BALANCE-SYSTEM
   Build: sidescroller-v3-180
   Alle wichtigen Formeln & Zielwerte an einem Ort.
   ============================================
   PHILOSOPHY (Hard Balance + Boss-only Run-Upgrades)
   - Soft gates: Skill kann etwas früher, Avg braucht Meta
   - Gegner skalieren NICHT mit Player-Power
   - First Clear Ziel ~150 Min, ~32 Tode (Median)
   - ~2–4 Runs pro spürbarem Meta-Upgrade
   - Meta maxLv 8, feste Kostentabelle
   - Run-Upgrades nur nach Boss-Kills (max 4 vor Final Boss)
   - Loop/NG+ nach First Clear
   ============================================ */

const DL_BALANCE = {
  version: 180,
  targetFirstClearMin: 150,
  targetFirstClearRange: [140, 170],
  targetDeaths: [26, 38],
  targetDeathsMedian: 32,
  runsPerMeaningfulUpgrade: [2, 4],
  runsPerWorld: [5, 9],

  /* Legacy aliases für script.js BALANCE-Proxy */
  critDamageBase: 1.65,
  critChanceCap: 0.38,
  armorFactor: 1.12,
  pierceFactor: 0.18,
  levelUpHealPct: 0.06,
  xpPerLevel: 130,
  mageManaRegen: 5,

  classes: {
    warrior: {
      name: "Krieger",
      hp: 118, attack: 15, defense: 4, crit: 0.03, critDamage: 1.65,
      mana: 0, magicDamage: 0, range: 80, attackRate: 440, moveSpeed: 126,
      aoeFalloff: 0.74, special: "Schildschlag", specialCd: 8, specialRange: 90,
      specialMult: 2.2, attackType: "melee",
      baseArmorDr: 0.04,
      desc: "Nahkampf-Schwert, kurze Reichweite, viel Leben und Rüstung"
    },
    ranger: {
      name: "Waldläufer",
      hp: 90, attack: 11, defense: 1, crit: 0.05, critDamage: 1.70,
      mana: 0, magicDamage: 0, range: 218, attackRate: 360, moveSpeed: 144,
      closeRange: 65, meleePenalty: 0.52,
      proj: "projectile_arrow", projSpeed: 13,
      special: "Präzisionsschuss", specialCd: 5, attackType: "ranged",
      desc: "Bogen, große Reichweite, schwach im Nahkampf"
    },
    mage: {
      name: "Magier",
      hp: 80, attack: 6, defense: 0, crit: 0.03, critDamage: 1.65,
      mana: 118, magicDamage: 24, range: 200, attackRate: 300, moveSpeed: 136,
      manaPerShot: 3, proj: "projectile_fire", projSpeed: 8,
      special: "Feuerball", specialCd: 6, manaCost: 26, attackType: "magic",
      desc: "Zauber, mittlere Reichweite, braucht Mana"
    }
  },

  caps: {
    critChance: 0.38,
    critDamage: 2.40,
    lifesteal: 0.07,
    lifestealEpic: 0.13,
    damageReduction: 0.46,
    attackSpeedBonus: 0.60,
    cooldownReduction: 0.32,
    bossDamage: 0.38,
    moveSpeedBonus: 0.20
  },

  levelUpHeal: {
    bands: [
      { maxLevel: 20, pct: 0.06 },
      { maxLevel: 50, pct: 0.04 },
      { maxLevel: 90, pct: 0.03 },
      { maxLevel: Infinity, pct: 0.02 }
    ],
    softCapHpPct: 0.70,
    overSoftHealPct: 0.015,
    regenPauseAfterDamageSec: 6
  },

  xp: {
    base: 130,
    perLevel: 4.5
  },

  worlds: [
    {
      id: 0, name: "Dunkler Wald", min: 1, length: 22, danger: 1, theme: "forest",
      hpMult: 1.00, atkMult: 1.00, speedMult: 1.00, rewardMult: 1.00,
      budget: { start: 3.4, p25: 4.8, p50: 6.2, p75: 7.6, preBoss: 9.0, boss: 11 },
      budgetEarly: 3.4, budgetMid: 6.2, budgetLate: 9.0, budgetBoss: 11,
      maxEnemies: 5, eliteChance: 0.07,
      composition: { basic: 0.55, fast: 0.20, ranged: 0.10, tank: 0.10, elite: 0.05 },
      entryEase: 1.0
    },
    {
      id: 1, name: "Verfluchte Sümpfe", min: 24, length: 26, danger: 2, theme: "swamp",
      hpMult: 1.62, atkMult: 1.48, speedMult: 1.06, rewardMult: 1.30,
      budget: { start: 6.0, p25: 7.8, p50: 9.8, p75: 11.8, preBoss: 14.0, boss: 17 },
      budgetEarly: 6.0, budgetMid: 9.8, budgetLate: 14.0, budgetBoss: 17,
      maxEnemies: 6, eliteChance: 0.10,
      composition: { basic: 0.35, fast: 0.15, ranged: 0.25, tank: 0.10, support: 0.08, elite: 0.07 },
      entryEase: 0.92
    },
    {
      id: 2, name: "Gefrorene Berge", min: 52, length: 30, danger: 3, theme: "frost",
      hpMult: 2.35, atkMult: 2.00, speedMult: 1.11, rewardMult: 1.65,
      budget: { start: 8.2, p25: 10.4, p50: 13.0, p75: 15.5, preBoss: 18.3, boss: 22 },
      budgetEarly: 8.2, budgetMid: 13.0, budgetLate: 18.3, budgetBoss: 22,
      maxEnemies: 6, eliteChance: 0.14,
      composition: { basic: 0.25, fast: 0.25, ranged: 0.15, tank: 0.12, jump: 0.12, elite: 0.11 },
      entryEase: 0.92
    },
    {
      id: 3, name: "Feuerlande", min: 84, length: 34, danger: 4, theme: "fire",
      hpMult: 3.35, atkMult: 2.70, speedMult: 1.16, rewardMult: 2.05,
      budget: { start: 10.8, p25: 13.5, p50: 16.5, p75: 19.8, preBoss: 23.2, boss: 28 },
      budgetEarly: 10.8, budgetMid: 16.5, budgetLate: 23.2, budgetBoss: 28,
      maxEnemies: 7, eliteChance: 0.18,
      composition: { basic: 0.20, fast: 0.15, ranged: 0.18, tank: 0.15, support: 0.15, elite: 0.17 },
      entryEase: 0.92
    },
    {
      id: 4, name: "Vergessene Ruinen", min: 120, length: 38, danger: 5, theme: "ruins",
      hpMult: 4.65, atkMult: 3.60, speedMult: 1.21, rewardMult: 2.55,
      budget: { start: 13.5, p25: 16.5, p50: 20.2, p75: 24.0, preBoss: 28.0, boss: 34 },
      budgetEarly: 13.5, budgetMid: 20.2, budgetLate: 28.0, budgetBoss: 34,
      maxEnemies: 7, eliteChance: 0.22,
      composition: { basic: 0.15, fast: 0.15, ranged: 0.18, tank: 0.15, support: 0.15, jump: 0.10, elite: 0.12 },
      entryEase: 0.92
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
    hpPerProgress: 0.38,
    atkPerProgress: 0.30,
    budgetPerProgress: 0.75,
    speedPerProgress: 0.05
  },

  enemy: {
    baseHp: 46,
    baseAtk: 7.5,
    armor: 0,
    goldBase: 3.5,
    goldPerDepth: 0.55,
    goldPerDanger: 1.0,
    goldDepthFactor: 0.01,
    xpBase: 9,
    xpPerDepth: 1.5,
    xpPerDanger: 2.0,
    waveCooldown: 1.7,
    minWaveCooldown: 0.8,
    lootChanceBasic: 0.09,
    lootChanceFast: 0.11,
    lootChanceRanged: 0.12,
    lootChanceTank: 0.17,
    lootChanceSupport: 0.17,
    lootChanceElite: 0.52,
    lootChanceBoss: 1.0,
    lootChance: 0.09,
    ttkNormal: [1.1, 1.9],
    ttkElite: [8, 13],
    ttkBoss: [70, 155],
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
    fast:    { cost: 1.7,  hp: 0.74, atk: 1.00, speed: 1.58, atkSpeed: 1.38, tag: "fast" },
    ranged:  { cost: 2.1,  hp: 0.82, atk: 1.35, speed: 1.00, tag: "ranged" },
    tank:    { cost: 3.2,  hp: 2.65, atk: 1.18, speed: 0.64, armor: 0.18, tag: "tank" },
    support: { cost: 3.0,  hp: 1.05, atk: 0.75, speed: 1.00, tag: "support" },
    jump:    { cost: 2.3,  hp: 0.95, atk: 1.40, speed: 1.22, tag: "jump" },
    elite:   { cost: 6.4,  hp: 3.8,  atk: 1.85, speed: 1.12, tag: "elite" },
    boss:    { cost: 10,   hp: 1,    atk: 1,    tag: "boss" }
  },

  elite: { hpMult: 3.8, atkMult: 1.85, rewardMult: 3.5, cost: 6.4, sizeScale: 1.22 },

  synergy: {
    pairs: [
      { a: "tank", b: "ranged", mult: 1.28 },
      { a: "tank", b: "support", mult: 1.32 },
      { a: "fast", b: "ranged", mult: 1.20 },
      { a: "elite", b: "support", mult: 1.38 },
      { a: "elite", b: "ranged", mult: 1.28 },
      { a: "jump", b: "ranged", mult: 1.22 },
      { a: "tank", b: "elite", mult: 1.28 }
    ],
    threeFast: 1.22,
    maxOvershoot: 1.08
  },

  synergyPairs: [
    { a: "tank", b: "ranged", add: 1.0 },
    { a: "tank", b: "support", add: 1.2 },
    { a: "fast", b: "ranged", add: 0.7 },
    { a: "elite", b: "support", add: 1.4 },
    { a: "elite", b: "ranged", add: 1.0 },
    { a: "jump", b: "ranged", add: 0.8 },
    { a: "tank", b: "elite", add: 1.0 }
  ],

  rhythm: {
    hardThreshold: 1.25,
    breathBudgetMult: 0.50,
    breathChance: 0.15,
    breathWaves: 1
  },

  bosses: [
    { world: 0, hp: 1250,  atk: 16, fightSec: [70, 100],  gold: 210 },
    { world: 1, hp: 2650,  atk: 23, fightSec: [80, 110],  gold: 360 },
    { world: 2, hp: 4800,  atk: 31, fightSec: [90, 120],  gold: 590 },
    { world: 3, hp: 8000,  atk: 42, fightSec: [100, 135], gold: 880 },
    { world: 4, hp: 12800, atk: 56, fightSec: [115, 155], gold: 1200 }
  ],

  boss: { hpMultEarly: 1, hpMultMid: 1, hpMultLate: 1, atkMult: 1, rewardMult: 4 },

  bossAttackPct: {
    light: [0.10, 0.14],
    normal: [0.17, 0.22],
    heavy: [0.27, 0.34],
    ultimate: [0.40, 0.46]
  },

  economy: {
    upgradeMax: 8,
    costTable: [170, 300, 500, 820, 1300, 2050, 3150, 4700],
    costPow: 1.6,
    costSoftLv: 8,
    costLinear: 0.32,
    avgGoldPerRunTarget: [75, 120],
    goldByWorld: {
      0: [75, 120],
      boss0: [160, 240],
      1: [210, 350],
      2: [360, 580],
      3: [560, 880],
      4: [800, 1200]
    },
    pityGoldAfterEmptyRuns: 3,
    pitySteps: [1.18, 1.30],
    maxPityMult: 1.42,
    minRunGoldFloor: 50,
    minRunGoldUpgradeFrac: 0.12,
    loopGoldMult: 0.17
  },

  loop: {
    enemyHpPerLoop: 0.28,
    enemyAtkPerLoop: 0.20,
    goldPerLoop: 0.17,
    budgetMultPerLoop: 0.10,
    budgetPerLoop: 0.10,
    eliteChancePerLoop: 0.03,
    bossHpPerLoop: 0.14,
    bossAtkPerLoop: 0.08
  },

  powerTargets: {
    start: 1.00,
    world: [
      { meta: [1.00, 1.10], run: [1.00, 1.00], total: [1.00, 1.12] },
      { meta: [1.10, 1.28], run: [1.08, 1.18], total: [1.20, 1.45] },
      { meta: [1.25, 1.45], run: [1.15, 1.30], total: [1.45, 1.85] },
      { meta: [1.40, 1.65], run: [1.25, 1.45], total: [1.80, 2.35] },
      { meta: [1.55, 1.90], run: [1.35, 1.60], total: [2.20, 3.00] }
    ]
  },

  simulationTargets: {
    firstClearMin: [140, 170],
    firstClearMedian: 150,
    deaths: [26, 38],
    deathsByWorld: [[5, 7], [5, 8], [5, 8], [6, 9], [6, 10]],
    bossAttempts: [[2, 4], [2, 5], [3, 5], [3, 6], [4, 7]],
    firstRunWorld1Progress: { average: [0.15, 0.30], skilled: [0.35, 0.55] }
  },

  events: {
    enabled: true,
    spawn: {
      baseChance: 0.08,
      eliteChance: 0.14,
      recoveryChance: 0.04,
      preBossChance: 0,
      postBossChance: 0,
      skipFirstWaves: 3,
      skipLastWavesBeforeBoss: 2,
      minWavesBetween: 4,
      pityAfterWaves: 8,
      pityPerWave: 0.04,
      pityCap: 0.20,
      worldChanceMult: [0.85, 1.00, 1.10, 1.15, 1.20]
    },
    limits: {
      maxPerWorld: [2, 2, 3, 3, 3],
      maxAltarPerRun: 1,
      maxMerchantPerWorld: 1,
      maxFountainPerWorld: 1,
      maxFateGatePerWorld: 1,
      maxBloodPactPerWorld: 1,
      noDuplicateConsecutive: true,
      maxVisibleHudIcons: 3,
      maxOffensivePower: 0.20,
      maxDefensivePower: 0.18
    },
    weights: {
      cursed_altar: 0.18,
      merchant: 0.18,
      elite_challenge: 0.17,
      treasure: 0.14,
      healing_fountain: 0.12,
      blood_pact: 0.09,
      golden_enemy: 0.07,
      fate_gate: 0.05
    },
    budgetCompensation: [1.00, 1.04, 1.04, 1.06, 1.06],
    merchant: {
      maxBuys: 1,
      prices: {
        // world index -> {common, uncommon, rare}
        0: { common:90, uncommon:150, rare:260 },
        1: { common:140, uncommon:230, rare:390 },
        2: { common:210, uncommon:340, rare:560 },
        3: { common:300, uncommon:480, rare:780 },
        4: { common:420, uncommon:650, rare:1050 }
      },
      items: [
        { id:"heal_potion", rarity:"common", name:"Heiltrank", healPct:0.20, maxHpToBuy:0.95 },
        { id:"guard_potion", rarity:"uncommon", name:"Schutztrank", drAdd:0.12, encounters:3 },
        { id:"war_potion", rarity:"uncommon", name:"Kriegstrank", dmgAdd:0.15, encounters:3 },
        { id:"boss_elixir", rarity:"rare", name:"Boss-Elixier", bossDmgAdd:0.18, untilBoss:true },
        { id:"gold_magnet", rarity:"common", name:"Goldmagnet", catchRadiusAdd:0.25, untilWorldEnd:true },
        { id:"mana_essence", rarity:"uncommon", name:"Mana-Essenz", mageOnly:true, fillMana:true, manaAdd:15, untilWorldEnd:true }
      ]
    },
    altar: {
      maxActive: 1,
      pacts: [
        { id:"blood_power", name:"Blut für Macht", maxHpMult:-0.15, damageAdd:0.12 },
        { id:"glass_force", name:"Glaskraft", abilityDmgAdd:0.18, enemyDmgTakenAdd:0.10 },
        { id:"greed", name:"Gier", goldAdd:0.25, maxHpMult:-0.12 },
        { id:"fury", name:"Raserei", atkSpdAdd:0.12, armorAdd:-0.08 }
      ]
    },
    eliteChallenge: {
      budgetMult: 1.45,
      minElites: 1,
      dualEliteFromWorld: 2,
      dualEliteChance: 0.30,
      goldMult: 2.2,
      lootChanceAdd: 0.40,
      rarePlusLootMult: 2,
      tempBuffChance: 0.15,
      tempBuffs: [
        { id:"ec_dmg", damageAdd:0.06 },
        { id:"ec_hp", maxHpAdd:0.08 },
        { id:"ec_as", atkSpdAdd:0.05 },
        { id:"ec_boss", bossDmgAdd:0.05 }
      ],
      maxOvershoot: 1.45
    },
    treasure: {
      gold: 0.40, loot: 0.30, buff: 0.20, mimic: 0.10,
      goldRange: {
        0:[80,130], 1:[130,210], 2:[210,330], 3:[320,500], 4:[450,700]
      },
      lootRarity: { uncommon:0.62, rare:0.28, epic:0.09, legendary:0.01 },
      buffs: [
        { id:"tr_dmg", damageAdd:0.08 },
        { id:"tr_hp", maxHpAdd:0.10 },
        { id:"tr_as", atkSpdAdd:0.07 },
        { id:"tr_armor", armorAdd:0.06 }
      ],
      mimic: { hpMult:4.0, atkMult:1.8, speedMult:1.15, rewardMult:3, minLoot:"rare" }
    },
    healingFountain: {
      healPct: 0.22,
      softCap: 0.85,
      hideIfHpAbove: 0.80
    },
    bloodPact: {
      currentHpCost: 0.25,
      minHpFrac: 0.40,
      damageAdd: 0.18,
      bossDmgAdd: 0.12,
      goldAdd: 0.15
    },
    goldenEnemy: {
      hpMult: 1.5,
      atkMult: 0.75,
      speedMult: 1.45,
      fleeSeconds: 12,
      gold: { 0:120, 1:190, 2:300, 3:450, 4:650 },
      lootChance: 0.35,
      minLoot: "uncommon"
    },
    fateGate: {
      safeBudgetMult: 0.75,
      dangerBudgetMult: 1.35,
      dangerEnemyDmgAdd: 0.10,
      dangerEliteChanceAdd: 0.10,
      dangerEncounters: 2,
      rewardGoldMult: 2.5,
      rewardEpicChance: 0.20,
      rewardLegendaryChance: 0.02,
      maxOvershoot: 1.35
    },
    ngPlus: {
      eliteChallengeBudgetAddPerLoopFrom2: 0.05,
      fateGateBudgetAddPerLoopFrom2: 0.05,
      rewardAddPerLoopFrom2: 0.08,
      corruptedChanceFromLoop3: 0.20
    }
  },

  runUpgrades: {
    mode: "afterBoss",
    maxPicksBeforeFinal: 4,
    choicesPerPick: 3,
    freeRerolls: 1,
    targetPicksFirstClear: [4, 4],
    targetRunPower: [65, 90],
    maxStrongRngPower: 130,
    rarityByWorld: {
      0: { common: 0.65, uncommon: 0.28, rare: 0.06, epic: 0.01, legendary: 0 },
      1: { common: 0.45, uncommon: 0.38, rare: 0.14, epic: 0.03, legendary: 0 },
      2: { common: 0.25, uncommon: 0.40, rare: 0.27, epic: 0.07, legendary: 0.01 },
      3: { common: 0.12, uncommon: 0.30, rare: 0.37, epic: 0.17, legendary: 0.04 }
    },
    powerBudget: {
      common: [8, 12], uncommon: [12, 18], rare: [18, 26], epic: [26, 38], legendary: [38, 50]
    },
    milestones: []
  }
};

/**
 * Meta-Upgrade-Katalog – maxLv 8, tabellen-/flat-/pct-Boni.
 * bonus = Fallback-Inkrement; levels = per-level %-Punkte (table) oder ungenutzt.
 * Kosten über economy.costTable via dlUpgradeCost.
 */
const DL_UPGRADES = [
  /* OFFENSE */
  {
    key: "upgrade_attack", cat: "offense", tier: "minor", label: "Angriff",
    baseCost: 170, bonus: 0.04, bonusMode: "table",
    levels: [4, 4, 5, 5, 5, 6, 6, 7],
    bonusText: "+ATK %", tip: "Basis-Schaden %. Krieger & Waldläufer. Max +42 %.",
    forClass: "warrior,ranger", maxLv: 8
  },
  {
    key: "upgrade_magic", cat: "offense", tier: "minor", label: "Magieschaden",
    baseCost: 170, bonus: 0.04, bonusMode: "table",
    levels: [4, 4, 5, 5, 5, 6, 6, 7],
    bonusText: "+Magie %", tip: "Zauber-Schaden %. Nur Magier. Max +42 %.",
    forClass: "mage", maxLv: 8
  },
  {
    key: "upgrade_atkspd", cat: "offense", tier: "major", label: "Angriffsgeschwindigkeit",
    baseCost: 170, bonus: 0.03, bonusMode: "table",
    levels: [3, 3, 4, 4, 4, 5, 5, 6],
    bonusText: "+AtkSpd %", tip: "Schneller angreifen (max +34 %).",
    forClass: "all", maxLv: 8
  },
  {
    key: "upgrade_crit", cat: "offense", tier: "major", label: "Krit-Chance",
    baseCost: 170, bonus: 0.0175, bonusMode: "flat",
    levels: null,
    bonusText: "+1.75% Krit", tip: "Kritische Treffer. Stark mit Krit-Schaden.",
    forClass: "all", maxLv: 8
  },
  {
    key: "upgrade_critdmg", cat: "offense", tier: "major", label: "Krit-Schaden",
    baseCost: 170, bonus: 0.055, bonusMode: "flat",
    levels: null,
    bonusText: "+0.055x Krit-DMG", tip: "Krits knallen härter. Synergie mit Krit.",
    forClass: "all", maxLv: 8
  },
  {
    key: "upgrade_bossdmg", cat: "offense", tier: "major", label: "Boss-Schaden",
    baseCost: 170, bonus: 0.035, bonusMode: "pctOfBase",
    levels: [3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5],
    bonusText: "+3.5% vs Boss", tip: "Spezialisiert auf Welt-Bosse. Max +28 %.",
    forClass: "all", maxLv: 8
  },

  /* DEFENSE */
  {
    key: "upgrade_health", cat: "defense", tier: "minor", label: "Leben",
    baseCost: 170, bonus: 0.055, bonusMode: "pctOfBase",
    levels: [5.5, 5.5, 5.5, 5.5, 5.5, 5.5, 5.5, 5.5],
    bonusText: "+5.5% LP", tip: "Mehr max HP %. Fast immer gut. Max +44 %.",
    forClass: "all", maxLv: 8
  },
  {
    key: "upgrade_defense", cat: "defense", tier: "minor", label: "Rüstung",
    baseCost: 170, bonus: 0.0225, bonusMode: "flat",
    levels: null,
    bonusText: "+2.25% DR", tip: "Damage Reduction vor DR-Formel. Max 18 %.",
    forClass: "all", maxLv: 8
  },
  {
    key: "upgrade_regen", cat: "defense", tier: "major", label: "Regeneration",
    baseCost: 170, bonus: 0.0007, bonusMode: "flat",
    levels: null,
    bonusText: "+% HP/s", tip: "Heilung als Anteil maxHP/s. Pausiert 4s nach Schaden.",
    forClass: "all", maxLv: 8
  },
  {
    key: "upgrade_lifesteal", cat: "defense", tier: "keystone", label: "Lebensraub",
    baseCost: 170, bonus: 0.0065, bonusMode: "flat",
    levels: null,
    bonusText: "+0.65% Lebensraub", tip: "Meta-Lifesteal max 5.2 %, Hardcap 7 %.",
    forClass: "all", maxLv: 8
  },

  /* ECONOMY */
  {
    key: "upgrade_gold", cat: "economy", tier: "major", label: "Gold-Fund",
    baseCost: 170, bonus: 0.05, bonusMode: "pctOfBase",
    levels: [5, 5, 5, 5, 5, 5, 5, 5],
    bonusText: "+5% Gold", tip: "Mehr Gold pro Run – stark im Grind.",
    forClass: "all", maxLv: 8
  },
  {
    key: "upgrade_xp", cat: "economy", tier: "minor", label: "XP-Bonus",
    baseCost: 170, bonus: 0.035, bonusMode: "pctOfBase",
    levels: [3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5],
    bonusText: "+3.5% XP", tip: "Schneller Held-Level im Run.",
    forClass: "all", maxLv: 8
  },

  /* UTILITY */
  {
    key: "upgrade_cooldown", cat: "utility", tier: "keystone", label: "Spezial-CD",
    baseCost: 170, bonus: 0.03, bonusMode: "pctOfBase",
    levels: [3, 3, 3, 3, 3, 3, 3, 3],
    bonusText: "-3% CD", tip: "Cooldown-Reduction (max 24 %, Cap 32 %).",
    forClass: "all", maxLv: 8
  },
  {
    key: "upgrade_mana", cat: "utility", tier: "minor", label: "Mana",
    baseCost: 170, bonus: 10, bonusMode: "flat",
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
  return 1 + (ds.hpPerProgress != null ? ds.hpPerProgress : 0.38) * Math.max(0, Math.min(1, p || 0));
}

function dlDepthAtkMult(p) {
  const ds = DL_BALANCE.depthScaling || {};
  return 1 + (ds.atkPerProgress != null ? ds.atkPerProgress : 0.30) * Math.max(0, Math.min(1, p || 0));
}

function dlDepthSpeedMult(p) {
  const ds = DL_BALANCE.depthScaling || {};
  return 1 + (ds.speedPerProgress != null ? ds.speedPerProgress : 0.05) * Math.max(0, Math.min(1, p || 0));
}

function dlDepthBudgetMult(p) {
  const ds = DL_BALANCE.depthScaling || {};
  return 1 + (ds.budgetPerProgress != null ? ds.budgetPerProgress : 0.75) * Math.max(0, Math.min(1, p || 0));
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
    budget *= (r.breathBudgetMult != null ? r.breathBudgetMult : 0.5);
  }

  if (!isBoss) {
    const ev = DL_BALANCE.events;
    const comp = ev && ev.budgetCompensation;
    if (comp) {
      let wi = (w.id != null) ? (w.id | 0) : -1;
      if (wi < 0 && (DL_BALANCE.worlds || []).length) {
        wi = DL_BALANCE.worlds.indexOf(worldDef);
      }
      if (wi < 0) wi = 0;
      if (comp[wi] != null) budget *= comp[wi];
    }
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
  const fastCount = list.filter((t) => t === "fast").length;
  if (fastCount >= 3) mult *= (syn.threeFast || 1);
  const maxO = syn.maxOvershoot || 1.08;
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
  const base = (up && up.baseCost) || 170;
  const pow = (DL_BALANCE.economy && DL_BALANCE.economy.costPow) || 1.6;
  return Math.floor(base * Math.pow(pow, lv));
}

/**
 * TOTALER Bonus bei gegebener Stufe.
 * %-Upgrades → Fraction (0.42 = +42 %).
 * Regen → aktuelle Rate (Fraction maxHP/s) auf diesem Level.
 */
function dlEffectiveBonus(up, level) {
  const lv = Math.max(0, Math.floor(level || 0));
  if (lv <= 0 || !up) return 0;

  const key = up.key || "";
  const mode = up.bonusMode || null;

  if (key === "upgrade_regen") {
    return 0.0007 + 0.00035 * (lv - 1);
  }
  if (key === "upgrade_crit") return 0.0175 * lv;
  if (key === "upgrade_critdmg") return 0.055 * lv;
  if (key === "upgrade_defense") return 0.0225 * lv;
  if (key === "upgrade_lifesteal") return 0.0065 * lv;
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
  const xp = DL_BALANCE.xp || { base: 130, perLevel: 4.5 };
  const lv = Math.max(1, Math.floor(level || 1));
  return xp.base + lv * xp.perLevel;
}

function dlLevelUpHealPct(playerLevel) {
  const bands = (DL_BALANCE.levelUpHeal && DL_BALANCE.levelUpHeal.bands) || [];
  const lv = Math.max(1, Math.floor(playerLevel || 1));
  for (let i = 0; i < bands.length; i++) {
    if (lv <= bands[i].maxLevel) return bands[i].pct;
  }
  return DL_BALANCE.levelUpHealPct || 0.06;
}

/**
 * Level-Up-Heilung mit Soft-Cap 70 %.
 * Bereits >= softCap: nur overSoftHealPct; sonst Band-Heal hin zum Soft-Cap.
 */
function dlApplyLevelUpHeal(currentHp, maxHp, playerLevel) {
  const maxH = Math.max(1, maxHp || 1);
  let hp = Math.max(0, currentHp || 0);
  const soft = (DL_BALANCE.levelUpHeal && DL_BALANCE.levelUpHeal.softCapHpPct) || 0.70;
  const overSoft = (DL_BALANCE.levelUpHeal && DL_BALANCE.levelUpHeal.overSoftHealPct) || 0.015;
  const softHp = maxH * soft;

  if (hp >= softHp) {
    hp = Math.min(maxH, hp + Math.floor(maxH * overSoft));
  } else {
    const pct = dlLevelUpHealPct(playerLevel);
    const heal = Math.floor(maxH * pct);
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
  const critCap = caps.critChance != null ? caps.critChance : 0.38;
  const critEV = 1 + Math.min(critCap, s.crit || 0) * ((s.critDamage || DL_BALANCE.critDamageBase || 1.65) - 1);
  const dr = Math.min(caps.damageReduction || 0.46, s.defense || 0);
  const ehp = (s.maxHp || 100) * (1 + dr) * (1 + (s.regen || 0) * 80);
  const special = 1 + Math.min(caps.lifesteal || 0.07, s.lifesteal || 0) * 2
    + Math.min(caps.bossDamage || 0.38, s.bossDamage || 0) * 0.4;
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

  const sampleGold = ((B.economy.avgGoldPerRunTarget || [75, 120])[0]
    + (B.economy.avgGoldPerRunTarget || [75, 120])[1]) / 2;

  ups.filter((u) => u.tier === "minor").slice(0, 3).forEach((u) => {
    const c1 = dlUpgradeCost(u, 0);
    if (c1 > sampleGold * 2.8) warnings.push(u.key + ": Stufe 1 zu teuer im Vergleich zum Run-Gold");
    const c5 = dlUpgradeCost(u, 5);
    // Hard economy: late meta levels are intentionally multi-run sinks
    if (c5 / sampleGold > 28) warnings.push(u.key + ": Stufe 6 braucht ungewöhnlich viele Runs");
  });

  const ls = ups.find((u) => u.key === "upgrade_lifesteal");
  if (ls) {
    const total = dlEffectiveBonus(ls, dlUpgradeMax(ls));
    const cap = (B.caps && B.caps.lifesteal) || 0.07;
    if (total > cap + 0.001) warnings.push("Lebensraub-Meta über Cap: " + total.toFixed(3));
  }

  const cr = ups.find((u) => u.key === "upgrade_crit");
  if (cr && ctx && ctx.baseCrit != null) {
    const total = (ctx.baseCrit || 0) + dlEffectiveBonus(cr, dlUpgradeMax(cr));
    const cap = (B.caps && B.caps.critChance) || B.critChanceCap || 0.38;
    if (total > cap + 0.05) warnings.push("Krit-Chance über dem Maximum möglich: " + total.toFixed(2));
  }

  const atk = ups.find((u) => u.key === "upgrade_attack");
  if (atk) {
    const t = dlEffectiveBonus(atk, 8);
    if (Math.abs(t - 0.42) > 0.001) warnings.push("Angriff max sollte 0.42 sein, ist " + t);
  }
  const as = ups.find((u) => u.key === "upgrade_atkspd");
  if (as) {
    const t = dlEffectiveBonus(as, 8);
    if (Math.abs(t - 0.34) > 0.001) warnings.push("AtkSpd max sollte 0.34 sein, ist " + t);
  }
  const boss = ups.find((u) => u.key === "upgrade_bossdmg");
  if (boss) {
    const t = dlEffectiveBonus(boss, 8);
    if (Math.abs(t - 0.28) > 0.001) warnings.push("Boss-DMG max sollte 0.28 sein, ist " + t);
  }
  const def = ups.find((u) => u.key === "upgrade_defense");
  if (def) {
    const t = dlEffectiveBonus(def, 8);
    if (Math.abs(t - 0.18) > 0.001) warnings.push("Defense max sollte 0.18 sein, ist " + t);
  }

  const ru = B.runUpgrades || {};
  if (ru.mode !== "afterBoss") warnings.push("runUpgrades.mode sollte afterBoss sein");
  if (ru.maxPicksBeforeFinal !== 4) warnings.push("runUpgrades.maxPicksBeforeFinal sollte 4 sein");

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
    defense: Math.min(caps.damageReduction || 0.46, def),
    crit: Math.min(caps.critChance || 0.38, crit),
    critDamage: Math.min(caps.critDamage || 2.4, critDmg),
    atkSpeedMult: Math.min(1 + (caps.attackSpeedBonus || 0.60), atkSpd),
    bossDamage: Math.min(caps.bossDamage || 0.38, bossDmg),
    lifesteal: Math.min(caps.lifesteal || 0.07, lifesteal),
    regen
  }, true);
}

/**
 * First-clear Zeit-Heuristik (~150 Min Average inkl. Death-Retries).
 * skillFactor > 1 = langsamer / mehr Tode; < 1 = schneller.
 */
function dlEstimateFirstClearMinutes(skillFactor) {
  const sf = Math.max(0.6, skillFactor || 1);
  let totalLevels = 0;
  DL_BALANCE.worlds.forEach((w) => { totalLevels += w.length; });
  const deaths = DL_BALANCE.targetDeaths || [26, 38];
  const avgDeaths = ((deaths[0] + deaths[1]) / 2) * sf;
  // Calibrated so average (sf=1) ≈ targetFirstClearMin (~150)
  const avgSecPerLevel = 23 * sf;
  const bossFightMin = 16 * sf;
  const upgradePauseMin = 10 * sf;
  const deathRetryMin = avgDeaths * 1.95;
  const runUpgradePauseMin = 4 * sf;
  return Math.round(
    (totalLevels * avgSecPerLevel) / 60
    + bossFightMin
    + upgradePauseMin
    + deathRetryMin
    + runUpgradePauseMin
  );
}

function dlRunBalanceReport() {
  const warnings = dlRunSanityChecks({ baseCrit: 0.05 });
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
    runUpgrades: {
      mode: (DL_BALANCE.runUpgrades && DL_BALANCE.runUpgrades.mode) || null,
      maxPicksBeforeFinal: (DL_BALANCE.runUpgrades && DL_BALANCE.runUpgrades.maxPicksBeforeFinal) || 0
    },
    minRunGoldFloorExample: dlMinRunGoldFloor(170),
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
    dlDepthSpeedMult,
    dlDepthBudgetMult,
    dlMinRunGoldFloor,
    dlSimulatePowerFromLevels,
    dlInterpBudget,
    dlFindUpgrade
  };
}
