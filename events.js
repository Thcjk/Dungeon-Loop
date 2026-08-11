/* ============================================
   Dungeon Loop – World Events / Risk-Reward
   Browser: nach balance.js, vor script.js laden.
   Node: require('./events.js')
   ============================================ */

const DL_EVENTS_DEFAULTS = {
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
  merchant: {
    maxBuys: 1,
    prices: {
      0: { common: 90, uncommon: 150, rare: 260 },
      1: { common: 140, uncommon: 230, rare: 390 },
      2: { common: 210, uncommon: 340, rare: 560 },
      3: { common: 300, uncommon: 480, rare: 780 },
      4: { common: 420, uncommon: 650, rare: 1050 }
    },
    items: [
      { id: "heal_potion", rarity: "common", name: "Heiltrank", healPct: 0.20, maxHpToBuy: 0.95 },
      { id: "guard_potion", rarity: "uncommon", name: "Schutztrank", drAdd: 0.12, encounters: 3 },
      { id: "war_potion", rarity: "uncommon", name: "Kriegstrank", dmgAdd: 0.15, encounters: 3 },
      { id: "boss_elixir", rarity: "rare", name: "Boss-Elixier", bossDmgAdd: 0.18, untilBoss: true },
      { id: "gold_magnet", rarity: "common", name: "Goldmagnet", catchRadiusAdd: 0.25, untilWorldEnd: true },
      { id: "mana_essence", rarity: "uncommon", name: "Mana-Essenz", mageOnly: true, fillMana: true, manaAdd: 15, untilWorldEnd: true }
    ]
  },
  altar: {
    maxActive: 1,
    pacts: [
      { id: "blood_power", name: "Blut für Macht", maxHpMult: -0.15, damageAdd: 0.12 },
      { id: "glass_force", name: "Glaskraft", abilityDmgAdd: 0.18, enemyDmgTakenAdd: 0.10 },
      { id: "greed", name: "Gier", goldAdd: 0.25, maxHpMult: -0.12 },
      { id: "fury", name: "Raserei", atkSpdAdd: 0.12, armorAdd: -0.08 }
    ]
  },
  eliteChallenge: {
    budgetMult: 1.45, minElites: 1, dualEliteFromWorld: 2, dualEliteChance: 0.30,
    goldMult: 2.2, lootChanceAdd: 0.40, rarePlusLootMult: 2, tempBuffChance: 0.15,
    tempBuffs: [
      { id: "ec_dmg", damageAdd: 0.06 }, { id: "ec_hp", maxHpAdd: 0.08 },
      { id: "ec_as", atkSpdAdd: 0.05 }, { id: "ec_boss", bossDmgAdd: 0.05 }
    ]
  },
  treasure: {
    gold: 0.40, loot: 0.30, buff: 0.20, mimic: 0.10,
    goldRange: { 0: [80, 130], 1: [130, 210], 2: [210, 330], 3: [320, 500], 4: [450, 700] },
    buffs: [
      { id: "tr_dmg", damageAdd: 0.08 }, { id: "tr_hp", maxHpAdd: 0.10 },
      { id: "tr_as", atkSpdAdd: 0.07 }, { id: "tr_armor", armorAdd: 0.06 }
    ],
    mimic: { hpMult: 4.0, atkMult: 1.8, speedMult: 1.15, rewardMult: 3, minLoot: "rare" }
  },
  healingFountain: { healPct: 0.22, softCap: 0.85, hideIfHpAbove: 0.80 },
  bloodPact: {
    currentHpCost: 0.25, minHpFrac: 0.40, damageAdd: 0.18, bossDmgAdd: 0.12, goldAdd: 0.15
  },
  goldenEnemy: {
    hpMult: 1.5, atkMult: 0.75, speedMult: 1.45, fleeSeconds: 12,
    gold: { 0: 120, 1: 190, 2: 300, 3: 450, 4: 650 }, lootChance: 0.35, minLoot: "uncommon"
  },
  fateGate: {
    safeBudgetMult: 0.75, dangerBudgetMult: 1.35, dangerEnemyDmgAdd: 0.10,
    dangerEliteChanceAdd: 0.10, dangerEncounters: 2, rewardGoldMult: 2.5,
    rewardEpicChance: 0.20, rewardLegendaryChance: 0.02
  }
};

const DL_EVENT_TYPES = [
  "cursed_altar", "merchant", "elite_challenge", "treasure",
  "healing_fountain", "blood_pact", "golden_enemy", "fate_gate"
];

const DL_EVENT_UI = {
  cursed_altar: { title: "Verfluchter Altar", body: "Ein dunkler Pakt winkt. Macht… gegen einen Preis." },
  merchant: { title: "Wandernder Händler", body: "Seltene Waren – ein Kauf pro Besuch." },
  elite_challenge: { title: "Elite-Herausforderung", body: "Härtere Welle, bessere Beute." },
  treasure: { title: "Schatztruhe", body: "Drei Truhen. Eine könnte tödlich sein." },
  healing_fountain: { title: "Heilbrunnen", body: "Klares Wasser. Ein Schluck heilt." },
  blood_pact: { title: "Blutpakt", body: "Opfere Leben für rohe Kampfkraft." },
  golden_enemy: { title: "Goldener Feind", body: "Ein flüchtiger Schatzträger erscheint." },
  fate_gate: { title: "Schicksalstor", body: "Sicherer Pfad oder gefährliche Belohnung?" }
};

const DL_EVENT_HUD = {
  blood_power: { label: "Blut", tip: "Altar: mehr Schaden, weniger LP" },
  glass_force: { label: "Glas", tip: "Altar: Fähigkeitsschaden, mehr erlittener Schaden" },
  greed: { label: "Gier", tip: "Altar: mehr Gold, weniger LP" },
  fury: { label: "Raserei", tip: "Altar: AtkSpd, weniger Rüstung" },
  blood_pact: { label: "Pakt", tip: "Blutpakt aktiv" },
  heal_potion: { label: "Heil", tip: "Heiltrank genutzt" },
  guard_potion: { label: "Schutz", tip: "DR für Begegnungen" },
  war_potion: { label: "Krieg", tip: "Schaden für Begegnungen" },
  boss_elixir: { label: "Elixier", tip: "Boss-Schaden bis Boss" },
  gold_magnet: { label: "Magnet", tip: "Größerer Münz-Radius" },
  mana_essence: { label: "Mana", tip: "Extra Mana" },
  tr_dmg: { label: "Schatz+", tip: "Schadensbuff" },
  tr_hp: { label: "Schatz+", tip: "LP-Buff" },
  tr_as: { label: "Schatz+", tip: "AtkSpd-Buff" },
  tr_armor: { label: "Schatz+", tip: "Rüstungsbuff" },
  ec_dmg: { label: "Elite+", tip: "Temp. Schaden" },
  ec_hp: { label: "Elite+", tip: "Temp. LP" },
  ec_as: { label: "Elite+", tip: "Temp. AtkSpd" },
  ec_boss: { label: "Elite+", tip: "Temp. Boss-Schaden" },
  fate_danger: { label: "Schicksal", tip: "Gefahr-Pfad aktiv" }
};

/* ---- Config helpers ---- */

function dlEventsCfg() {
  const src = (typeof DL_BALANCE !== "undefined" && DL_BALANCE && DL_BALANCE.events)
    ? DL_BALANCE.events : null;
  if (!src) return JSON.parse(JSON.stringify(DL_EVENTS_DEFAULTS));
  const d = DL_EVENTS_DEFAULTS;
  return {
    enabled: src.enabled != null ? !!src.enabled : d.enabled,
    spawn: Object.assign({}, d.spawn, src.spawn || {}),
    limits: Object.assign({}, d.limits, src.limits || {}),
    weights: Object.assign({}, d.weights, src.weights || {}),
    merchant: Object.assign({}, d.merchant, src.merchant || {}, {
      prices: (src.merchant && src.merchant.prices) || d.merchant.prices,
      items: (src.merchant && src.merchant.items) || d.merchant.items
    }),
    altar: Object.assign({}, d.altar, src.altar || {}, {
      pacts: (src.altar && src.altar.pacts) || d.altar.pacts
    }),
    eliteChallenge: Object.assign({}, d.eliteChallenge, src.eliteChallenge || {}),
    treasure: Object.assign({}, d.treasure, src.treasure || {}),
    healingFountain: Object.assign({}, d.healingFountain, src.healingFountain || {}),
    bloodPact: Object.assign({}, d.bloodPact, src.bloodPact || {}),
    goldenEnemy: Object.assign({}, d.goldenEnemy, src.goldenEnemy || {}),
    fateGate: Object.assign({}, d.fateGate, src.fateGate || {}),
    budgetCompensation: src.budgetCompensation,
    ngPlus: src.ngPlus
  };
}

function dlEventWorldLimits(worldIndex) {
  const lim = dlEventsCfg().limits;
  const wi = Math.max(0, worldIndex | 0);
  const maxArr = lim.maxPerWorld || [2, 2, 3, 3, 3];
  return {
    maxPerWorld: maxArr[Math.min(maxArr.length - 1, wi)] || 2,
    maxMerchantPerWorld: lim.maxMerchantPerWorld != null ? lim.maxMerchantPerWorld : 1,
    maxFountainPerWorld: lim.maxFountainPerWorld != null ? lim.maxFountainPerWorld : 1,
    maxFateGatePerWorld: lim.maxFateGatePerWorld != null ? lim.maxFateGatePerWorld : 1,
    maxBloodPactPerWorld: lim.maxBloodPactPerWorld != null ? lim.maxBloodPactPerWorld : 1,
    maxAltarPerRun: lim.maxAltarPerRun != null ? lim.maxAltarPerRun : 1
  };
}

/* ---- RNG / util ---- */

function dlEventRng(rng) {
  if (typeof rng === "function") return rng;
  return Math.random;
}

function dlEventPickWeighted(entries, rng) {
  const r = dlEventRng(rng);
  let sum = 0;
  for (let i = 0; i < entries.length; i++) sum += Math.max(0, entries[i].w || 0);
  if (sum <= 0) return entries.length ? entries[0].id : null;
  let roll = r() * sum;
  for (let i = 0; i < entries.length; i++) {
    roll -= Math.max(0, entries[i].w || 0);
    if (roll <= 0) return entries[i].id;
  }
  return entries[entries.length - 1].id;
}

function dlEventRandInt(a, b, rng) {
  const r = dlEventRng(rng);
  const lo = Math.min(a, b), hi = Math.max(a, b);
  return lo + Math.floor(r() * (hi - lo + 1));
}

function dlEventUid(prefix) {
  return (prefix || "ev") + "_" + Date.now().toString(36) + "_" + Math.floor(Math.random() * 1e6).toString(36);
}

/* ---- State ---- */

function dlCreateEmptyEventState() {
  return {
    activeEffects: [],
    activeCurse: null,
    worldEventCount: 0,
    wavesSinceEvent: 999,
    wavesInWorld: 0,
    eventHistory: [],
    lastEventType: null,
    activeChallenge: null,
    merchantBought: false,
    fateGateUsed: false,
    fountainUsed: false,
    bloodPactUsed: false,
    altarUsedThisRun: false,
    pendingEvent: null,
    telemetry: []
  };
}

function dlMigrateEventState(raw) {
  const base = dlCreateEmptyEventState();
  if (!raw || typeof raw !== "object") return base;
  const out = Object.assign({}, base, raw);
  out.activeEffects = Array.isArray(raw.activeEffects) ? raw.activeEffects.slice() : [];
  out.eventHistory = Array.isArray(raw.eventHistory) ? raw.eventHistory.slice() : [];
  out.telemetry = Array.isArray(raw.telemetry) ? raw.telemetry.slice() : [];
  out.activeCurse = raw.activeCurse != null ? raw.activeCurse : null;
  out.activeChallenge = raw.activeChallenge || null;
  out.pendingEvent = raw.pendingEvent || null;
  out.worldEventCount = raw.worldEventCount | 0;
  out.wavesSinceEvent = raw.wavesSinceEvent != null ? (raw.wavesSinceEvent | 0) : 999;
  out.wavesInWorld = raw.wavesInWorld | 0;
  out.merchantBought = !!raw.merchantBought;
  out.fateGateUsed = !!raw.fateGateUsed;
  out.fountainUsed = !!raw.fountainUsed;
  out.bloodPactUsed = !!raw.bloodPactUsed;
  out.altarUsedThisRun = !!raw.altarUsedThisRun;
  out.lastEventType = raw.lastEventType || null;
  return out;
}

function dlClearWorldEventBuffs(state) {
  if (!state) return state;
  state.activeEffects = (state.activeEffects || []).filter((e) => e && e.duration !== "world");
  state.worldEventCount = 0;
  state.wavesSinceEvent = 999;
  state.wavesInWorld = 0;
  state.merchantBought = false;
  state.fateGateUsed = false;
  state.fountainUsed = false;
  state.bloodPactUsed = false;
  state.activeChallenge = null;
  state.pendingEvent = null;
  return state;
}

function dlClearAllEventEffects(state) {
  if (!state) return state;
  state.activeEffects = [];
  state.activeCurse = null;
  state.activeChallenge = null;
  state.pendingEvent = null;
  state.worldEventCount = 0;
  state.wavesSinceEvent = 999;
  state.wavesInWorld = 0;
  state.merchantBought = false;
  state.fateGateUsed = false;
  state.fountainUsed = false;
  state.bloodPactUsed = false;
  state.altarUsedThisRun = false;
  state.lastEventType = null;
  return state;
}

function dlEmptyBonusBag() {
  return {
    damageMult: 1, atkSpdMult: 1, maxHpMult: 1, armorAdd: 0, abilityDmgMult: 1,
    bossDmgAdd: 0, goldMult: 1, enemyDmgTakenMult: 1, catchRadiusAdd: 0,
    manaAdd: 0, encounterDrAdd: 0, encounterDmgAdd: 0, bossElixirBossDmg: 0,
    offensivePower: 0, defensivePower: 0
  };
}

function dlEffectPowerContribution(e) {
  if (!e) return { off: 0, def: 0 };
  let off = 0, def = 0;
  if (e.damageAdd) off += Math.abs(e.damageAdd);
  if (e.atkSpdAdd) off += Math.abs(e.atkSpdAdd) * 0.85;
  if (e.abilityDmgAdd) off += Math.abs(e.abilityDmgAdd) * 0.9;
  if (e.bossDmgAdd) off += Math.abs(e.bossDmgAdd) * 0.85;
  if (e.dmgAdd) off += Math.abs(e.dmgAdd);
  if (e.maxHpAdd) def += Math.abs(e.maxHpAdd);
  if (e.maxHpMult) def += Math.abs(e.maxHpMult);
  if (e.armorAdd) def += Math.abs(e.armorAdd);
  if (e.drAdd) def += Math.abs(e.drAdd);
  if (e.goldAdd) off += Math.abs(e.goldAdd) * 0.35;
  if (e.enemyDmgTakenAdd) def += Math.abs(e.enemyDmgTakenAdd) * 0.5;
  return { off, def };
}

function dlGetEventBonuses(state) {
  const out = dlEmptyBonusBag();
  const effects = (state && state.activeEffects) || [];
  for (let i = 0; i < effects.length; i++) {
    const e = effects[i];
    if (!e) continue;
    if (e.damageAdd) out.damageMult += e.damageAdd;
    if (e.atkSpdAdd) out.atkSpdMult += e.atkSpdAdd;
    if (e.maxHpAdd) out.maxHpMult += e.maxHpAdd;
    if (e.maxHpMult) out.maxHpMult += e.maxHpMult;
    if (e.armorAdd) out.armorAdd += e.armorAdd;
    if (e.abilityDmgAdd) out.abilityDmgMult += e.abilityDmgAdd;
    if (e.bossDmgAdd && !e.untilBoss && e.type !== "boss_elixir" && e.id !== "boss_elixir") {
      out.bossDmgAdd += e.bossDmgAdd;
    }
    if (e.goldAdd) out.goldMult += e.goldAdd;
    if (e.enemyDmgTakenAdd) out.enemyDmgTakenMult += e.enemyDmgTakenAdd;
    if (e.catchRadiusAdd) out.catchRadiusAdd += e.catchRadiusAdd;
    if (e.manaAdd) out.manaAdd += e.manaAdd;
    if (e.drAdd) out.encounterDrAdd += e.drAdd;
    if (e.dmgAdd) out.encounterDmgAdd += e.dmgAdd;
    if ((e.id === "boss_elixir" || e.type === "boss_elixir" || e.untilBoss) && e.bossDmgAdd) {
      out.bossElixirBossDmg += e.bossDmgAdd;
    }
    const p = dlEffectPowerContribution(e);
    out.offensivePower += p.off;
    out.defensivePower += p.def;
  }
  return out;
}

function dlPushEffect(state, effect) {
  if (!state || !effect) return;
  if (!state.activeEffects) state.activeEffects = [];
  state.activeEffects.push(effect);
}

/* ---- Spawn ---- */

function dlCanRollEvent(ctx) {
  const c = ctx || {};
  const cfg = dlEventsCfg();
  if (!cfg.enabled) return false;
  const sp = cfg.spawn;
  const st = c.eventState || {};
  const wi = c.worldIndex | 0;
  const waves = c.wavesInWorld | 0;
  const len = Math.max(1, c.worldLength | 0);
  const lim = dlEventWorldLimits(wi);

  if (c.waveWasBoss) return false;
  if (c.preBossImminent) return false;
  if (waves < (sp.skipFirstWaves != null ? sp.skipFirstWaves : 3)) return false;
  const skipLast = sp.skipLastWavesBeforeBoss != null ? sp.skipLastWavesBeforeBoss : 2;
  if (waves >= len - skipLast) return false;
  if ((st.worldEventCount | 0) >= lim.maxPerWorld) return false;
  const minBetween = sp.minWavesBetween != null ? sp.minWavesBetween : 4;
  if ((st.wavesSinceEvent | 0) < minBetween) return false;
  if (st.activeChallenge) return false;
  if (st.pendingEvent) return false;
  return true;
}

function dlRollEventChance(ctx) {
  const c = ctx || {};
  const sp = dlEventsCfg().spawn;
  const st = c.eventState || {};
  const wi = Math.max(0, c.worldIndex | 0);
  const worldMultArr = sp.worldChanceMult || [1];
  const worldMult = worldMultArr[Math.min(worldMultArr.length - 1, wi)] || 1;

  let chance = (sp.baseChance != null ? sp.baseChance : 0.08) * worldMult;
  if (c.wasElite) chance = sp.eliteChance != null ? sp.eliteChance * worldMult : chance;
  if (c.wasRecovery) chance = sp.recoveryChance != null ? sp.recoveryChance * worldMult : Math.min(chance, 0.04);
  if (c.preBossImminent) chance = sp.preBossChance != null ? sp.preBossChance : 0;
  if (c.waveWasBoss) chance = sp.postBossChance != null ? sp.postBossChance : 0;

  const since = st.wavesSinceEvent | 0;
  const pityAfter = sp.pityAfterWaves != null ? sp.pityAfterWaves : 8;
  if (since >= pityAfter) {
    const extra = (since - pityAfter + 1) * (sp.pityPerWave != null ? sp.pityPerWave : 0.04);
    chance += Math.min(sp.pityCap != null ? sp.pityCap : 0.20, extra);
  }
  return Math.max(0, Math.min(1, chance));
}

function dlEventAtPowerCap(state) {
  const lim = dlEventsCfg().limits;
  const b = dlGetEventBonuses(state);
  return {
    off: b.offensivePower >= (lim.maxOffensivePower != null ? lim.maxOffensivePower : 0.20),
    def: b.defensivePower >= (lim.maxDefensivePower != null ? lim.maxDefensivePower : 0.18)
  };
}

function dlPickEventType(state, worldIndex, heroHpFrac, classKey, rng) {
  const cfg = dlEventsCfg();
  const lim = dlEventWorldLimits(worldIndex | 0);
  const st = state || dlCreateEmptyEventState();
  const hp = heroHpFrac != null ? heroHpFrac : 1;
  const caps = dlEventAtPowerCap(st);
  const weights = cfg.weights || {};
  const fountain = cfg.healingFountain || {};
  const bp = cfg.bloodPact || {};
  const entries = [];

  for (let i = 0; i < DL_EVENT_TYPES.length; i++) {
    const id = DL_EVENT_TYPES[i];
    let w = weights[id];
    if (!(w > 0)) continue;

    if (cfg.limits.noDuplicateConsecutive && st.lastEventType === id) continue;
    if (id === "cursed_altar") {
      if (st.activeCurse || st.altarUsedThisRun) continue;
      if (caps.off && caps.def) continue;
    }
    if (id === "merchant" && st.merchantBought) continue;
    if (id === "healing_fountain") {
      if (st.fountainUsed) continue;
      if (hp > (fountain.hideIfHpAbove != null ? fountain.hideIfHpAbove : 0.80)) continue;
    }
    if (id === "blood_pact") {
      if (st.bloodPactUsed) continue;
      if (hp < (bp.minHpFrac != null ? bp.minHpFrac : 0.40)) continue;
      if (caps.off) continue;
    }
    if (id === "fate_gate" && st.fateGateUsed) continue;
    if (id === "elite_challenge" && caps.off) continue;
    // Power cap: skip buff-heavy types, still allow gold/merchant/fountain/golden
    if ((caps.off || caps.def) && (id === "cursed_altar" || id === "blood_pact")) continue;

    entries.push({ id, w });
  }

  if (!entries.length) {
    // Fallback: gold-ish types only
    ["merchant", "golden_enemy", "treasure", "healing_fountain"].forEach((id) => {
      if (weights[id] > 0) {
        if (id === "merchant" && st.merchantBought) return;
        if (id === "healing_fountain" && (st.fountainUsed || hp > 0.8)) return;
        entries.push({ id, w: weights[id] });
      }
    });
  }
  if (!entries.length) return null;
  return dlEventPickWeighted(entries, rng);
}

function dlTryTriggerEventAfterWave(ctx) {
  const c = ctx || {};
  const st = c.eventState;
  if (!st) return null;
  st.wavesInWorld = (c.wavesInWorld != null ? c.wavesInWorld : st.wavesInWorld) | 0;
  st.wavesSinceEvent = (st.wavesSinceEvent | 0) + 1;

  if (!dlCanRollEvent(c)) return null;
  const chance = dlRollEventChance(c);
  const rng = dlEventRng(c.rng);
  if (rng() > chance) return null;

  const hpFrac = c.heroHpFrac != null ? c.heroHpFrac
    : (c.heroMaxHp > 0 ? (c.heroHp || 0) / c.heroMaxHp : 1);
  const type = dlPickEventType(st, c.worldIndex | 0, hpFrac, c.classKey, rng);
  if (!type) return null;

  const pending = dlBuildEventPending(type, c);
  if (!pending) return null;

  st.pendingEvent = pending;
  st.wavesSinceEvent = 0;
  st.worldEventCount = (st.worldEventCount | 0) + 1;
  st.lastEventType = type;
  st.eventHistory = (st.eventHistory || []).concat([type]).slice(-12);
  dlNoteEventTelemetry(st, { kind: "trigger", type, worldIndex: c.worldIndex | 0 });
  return pending;
}

/* ---- Build pending UI ---- */

function dlMerchantOffers(worldIndex, classKey, rng) {
  const cfg = dlEventsCfg().merchant;
  const wi = Math.max(0, worldIndex | 0);
  const prices = (cfg.prices && (cfg.prices[wi] || cfg.prices[String(wi)]))
    || { common: 100, uncommon: 180, rare: 300 };
  const pool = (cfg.items || []).filter((it) => {
    if (!it) return false;
    if (it.mageOnly && classKey !== "mage") return false;
    return true;
  });
  const r = dlEventRng(rng);
  const shuffled = pool.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    const t = shuffled[i]; shuffled[i] = shuffled[j]; shuffled[j] = t;
  }
  const picks = shuffled.slice(0, Math.min(3, shuffled.length));
  return picks.map((it, idx) => ({
    index: idx,
    id: it.id,
    name: it.name,
    rarity: it.rarity,
    price: prices[it.rarity] != null ? prices[it.rarity] : 150,
    item: it
  }));
}

function dlBuildEventPending(type, ctx) {
  const c = ctx || {};
  const ui = DL_EVENT_UI[type];
  if (!ui) return null;
  const cfg = dlEventsCfg();
  const rng = dlEventRng(c.rng);
  const pending = {
    type,
    title: ui.title,
    body: ui.body,
    choices: [],
    meta: {}
  };

  if (type === "cursed_altar") {
    const pacts = (cfg.altar && cfg.altar.pacts) || [];
    const pact = pacts.length ? pacts[Math.floor(rng() * pacts.length)] : null;
    pending.meta.pact = pact;
    pending.body = pact
      ? ("Pakt „" + pact.name + "“ – Risiko und Macht.")
      : ui.body;
    pending.choices = [
      { id: "accept", label: "Pakt annehmen", hint: pact ? pact.name : "Fluch" },
      { id: "decline", label: "Ablehnen", hint: "Nichts riskieren" }
    ];
  } else if (type === "merchant") {
    const offers = dlMerchantOffers(c.worldIndex | 0, c.classKey || "warrior", rng);
    pending.meta.offers = offers;
    pending.choices = offers.map((o, i) => ({
      id: "buy" + i,
      label: o.name + " (" + o.price + "g)",
      hint: o.rarity
    })).concat([{ id: "leave", label: "Weitergehen", hint: "Kein Kauf" }]);
  } else if (type === "elite_challenge") {
    pending.choices = [
      { id: "accept", label: "Annehmen", hint: "Schwere Elite-Welle" },
      { id: "decline", label: "Ablehnen", hint: "Normal weiter" }
    ];
  } else if (type === "treasure") {
    pending.choices = [
      { id: "chest0", label: "Truhe links", hint: "?" },
      { id: "chest1", label: "Truhe mitte", hint: "?" },
      { id: "chest2", label: "Truhe rechts", hint: "?" }
    ];
  } else if (type === "healing_fountain") {
    const hf = cfg.healingFountain || {};
    const pct = Math.round((hf.healPct != null ? hf.healPct : 0.22) * 100);
    pending.choices = [
      { id: "drink", label: "Trinken (+" + pct + "% LP)", hint: "Einmalig" },
      { id: "leave", label: "Weitergehen", hint: "Unberührt" }
    ];
  } else if (type === "blood_pact") {
    const bp = cfg.bloodPact || {};
    const cost = Math.round((bp.currentHpCost != null ? bp.currentHpCost : 0.25) * 100);
    pending.choices = [
      { id: "accept", label: "Opfern (−" + cost + "% LP)", hint: "+Schaden / Boss / Gold" },
      { id: "decline", label: "Ablehnen", hint: "Leben behalten" }
    ];
  } else if (type === "golden_enemy") {
    pending.choices = [
      { id: "accept", label: "Herausfordern", hint: "Goldener Feind spawnt" },
      { id: "leave", label: "Ignorieren", hint: "Weiterziehen" }
    ];
  } else if (type === "fate_gate") {
    pending.choices = [
      { id: "safe", label: "Sicherer Pfad", hint: "Leichtere Welle" },
      { id: "danger", label: "Gefahr-Pfad", hint: "Härter, mehr Belohnung" }
    ];
  } else {
    pending.choices = [
      { id: "accept", label: "Annehmen" },
      { id: "decline", label: "Ablehnen" }
    ];
  }
  return pending;
}

/* ---- Resolve ---- */

function dlResultBase() {
  return {
    ok: false, logLines: [], goldDelta: 0, healDelta: 0,
    spawnChallenge: null, startMerchantBuy: null, effectsApplied: [], rejected: false
  };
}

function dlResolveEventChoice(state, pending, choiceId, ctx) {
  const res = dlResultBase();
  const st = state || dlCreateEmptyEventState();
  const p = pending || st.pendingEvent;
  const c = ctx || {};
  if (!p || !p.type) {
    res.logLines.push("Kein Ereignis aktiv.");
    return res;
  }
  const type = p.type;
  const id = String(choiceId || "");
  const cfg = dlEventsCfg();
  const rng = dlEventRng(c.rng);

  const finish = () => {
    st.pendingEvent = null;
    return res;
  };

  if (type === "cursed_altar") {
    if (id === "decline") {
      res.ok = true; res.rejected = true;
      res.logLines.push("Du lässt den Altar unbeachtet.");
      return finish();
    }
    if (id !== "accept") { res.logLines.push("Ungültige Wahl."); return res; }
    const pact = (p.meta && p.meta.pact) || ((cfg.altar.pacts || [])[0]);
    if (!pact) { res.logLines.push("Kein Pakt."); return finish(); }
    const eff = Object.assign({
      id: pact.id, type: "cursed_altar", cat: "curse", duration: "run"
    }, pact);
    dlPushEffect(st, eff);
    st.activeCurse = pact.id;
    st.altarUsedThisRun = true;
    res.ok = true; res.effectsApplied.push(eff);
    res.logLines.push("Pakt „" + pact.name + "“ angenommen.");
    dlNoteEventTelemetry(st, { kind: "resolve", type, choice: id, pact: pact.id });
    return finish();
  }

  if (type === "merchant") {
    if (id === "leave") {
      res.ok = true; res.rejected = true;
      res.logLines.push("Du gehst ohne Kauf weiter.");
      return finish();
    }
    const m = id.match(/^buy(\d+)$/);
    if (!m) { res.logLines.push("Ungültige Wahl."); return res; }
    if (st.merchantBought) {
      res.logLines.push("Bereits gekauft.");
      return finish();
    }
    const offers = (p.meta && p.meta.offers) || [];
    const offer = offers[m[1] | 0];
    if (!offer) { res.logLines.push("Angebot fehlt."); return res; }
    const price = offer.price | 0;
    const gold = c.runGold != null ? c.runGold : 0;
    if (gold < price) {
      res.logLines.push("Nicht genug Gold.");
      return res;
    }
    const item = offer.item || offer;
    if (item.maxHpToBuy != null && c.heroMaxHp > 0) {
      const frac = (c.heroHp || 0) / c.heroMaxHp;
      if (frac >= item.maxHpToBuy) {
        res.logLines.push("Leben zu voll für Heiltrank.");
        return res;
      }
    }
    if (typeof c.spendGold === "function") c.spendGold(price);
    res.goldDelta = -price;
    st.merchantBought = true;

    if (item.healPct && typeof c.healHero === "function") {
      const heal = Math.floor((c.heroMaxHp || 0) * item.healPct);
      c.healHero(heal);
      res.healDelta = heal;
      res.logLines.push(item.name + ": +" + heal + " LP.");
    } else {
      let duration = "world";
      let encountersLeft;
      if (item.encounters) { duration = "encounters"; encountersLeft = item.encounters; }
      if (item.untilBoss) duration = "untilBoss";
      if (item.untilWorldEnd) duration = "world";
      const eff = {
        id: item.id, type: item.id, cat: "merchant", duration,
        damageAdd: item.damageAdd, dmgAdd: item.dmgAdd, drAdd: item.drAdd,
        bossDmgAdd: item.bossDmgAdd, catchRadiusAdd: item.catchRadiusAdd,
        manaAdd: item.manaAdd, untilBoss: !!item.untilBoss,
        encountersLeft
      };
      dlPushEffect(st, eff);
      res.effectsApplied.push(eff);
      res.logLines.push(item.name + " gekauft (−" + price + "g).");
      if (item.fillMana && typeof c.fullMana === "function") c.fullMana();
    }
    res.ok = true;
    res.startMerchantBuy = { offer, price };
    dlNoteEventTelemetry(st, { kind: "resolve", type, choice: id, item: item.id, price });
    return finish();
  }

  if (type === "elite_challenge") {
    if (id === "decline") {
      res.ok = true; res.rejected = true;
      res.logLines.push("Herausforderung abgelehnt.");
      return finish();
    }
    if (id !== "accept") { res.logLines.push("Ungültige Wahl."); return res; }
    const ec = cfg.eliteChallenge || {};
    const dual = (c.worldIndex | 0) >= (ec.dualEliteFromWorld != null ? ec.dualEliteFromWorld : 2)
      && rng() < (ec.dualEliteChance != null ? ec.dualEliteChance : 0.3);
    const ch = {
      type: "elite_challenge",
      budgetMult: ec.budgetMult != null ? ec.budgetMult : 1.45,
      minElites: dual ? 2 : (ec.minElites != null ? ec.minElites : 1),
      goldMult: ec.goldMult != null ? ec.goldMult : 2.2,
      lootChanceAdd: ec.lootChanceAdd != null ? ec.lootChanceAdd : 0.4,
      wavesLeft: 1
    };
    st.activeChallenge = ch;
    res.ok = true; res.spawnChallenge = ch;
    res.logLines.push("Elite-Herausforderung angenommen!");
    dlNoteEventTelemetry(st, { kind: "resolve", type, choice: id });
    return finish();
  }

  if (type === "treasure") {
    if (!/^chest[012]$/.test(id)) { res.logLines.push("Ungültige Truhe."); return res; }
    const tr = cfg.treasure || {};
    const roll = rng();
    const gW = tr.gold != null ? tr.gold : 0.4;
    const lW = tr.loot != null ? tr.loot : 0.3;
    const bW = tr.buff != null ? tr.buff : 0.2;
    let kind = "mimic";
    if (roll < gW) kind = "gold";
    else if (roll < gW + lW) kind = "loot";
    else if (roll < gW + lW + bW) kind = "buff";

    if (kind === "gold") {
      const wi = c.worldIndex | 0;
      const range = (tr.goldRange && (tr.goldRange[wi] || tr.goldRange[String(wi)])) || [80, 130];
      const amt = dlEventRandInt(range[0], range[1], rng);
      if (typeof c.addRunGold === "function") c.addRunGold(amt);
      res.goldDelta = amt;
      res.logLines.push("Goldtruhe! +" + amt + "g.");
    } else if (kind === "loot") {
      res.logLines.push("Beute gefunden!");
      res.meta = { loot: true, rarityTable: tr.lootRarity };
    } else if (kind === "buff") {
      const buffs = tr.buffs || [];
      const buff = buffs.length ? buffs[Math.floor(rng() * buffs.length)] : null;
      if (buff) {
        const eff = Object.assign({
          id: buff.id, type: "treasure_buff", cat: "buff", duration: "world"
        }, buff);
        dlPushEffect(st, eff);
        res.effectsApplied.push(eff);
        res.logLines.push("Truhen-Segen erhalten!");
      }
    } else {
      const mimic = Object.assign({ type: "mimic" }, tr.mimic || {});
      st.activeChallenge = mimic;
      res.spawnChallenge = mimic;
      res.logLines.push("Eine Mimic! Vorsicht!");
    }
    res.ok = true;
    dlNoteEventTelemetry(st, { kind: "resolve", type, choice: id, result: kind });
    return finish();
  }

  if (type === "healing_fountain") {
    if (id === "leave") {
      res.ok = true; res.rejected = true;
      res.logLines.push("Du lässt den Brunnen stehen.");
      return finish();
    }
    if (id !== "drink") { res.logLines.push("Ungültige Wahl."); return res; }
    const hf = cfg.healingFountain || {};
    const healPct = hf.healPct != null ? hf.healPct : 0.22;
    const soft = hf.softCap != null ? hf.softCap : 0.85;
    const maxHp = c.heroMaxHp || 0;
    const hp = c.heroHp || 0;
    let heal = Math.floor(maxHp * healPct);
    if (maxHp > 0 && (hp + heal) / maxHp > soft) {
      heal = Math.max(0, Math.floor(maxHp * soft - hp));
    }
    if (heal > 0 && typeof c.healHero === "function") c.healHero(heal);
    st.fountainUsed = true;
    res.ok = true; res.healDelta = heal;
    res.logLines.push(heal > 0 ? ("Brunnen: +" + heal + " LP.") : "Schon genug geheilt.");
    dlNoteEventTelemetry(st, { kind: "resolve", type, choice: id, heal });
    return finish();
  }

  if (type === "blood_pact") {
    if (id === "decline") {
      res.ok = true; res.rejected = true;
      res.logLines.push("Blutpakt abgelehnt.");
      return finish();
    }
    if (id !== "accept") { res.logLines.push("Ungültige Wahl."); return res; }
    const bp = cfg.bloodPact || {};
    const cost = bp.currentHpCost != null ? bp.currentHpCost : 0.25;
    const hp = c.heroHp || 0;
    const newHp = Math.max(1, Math.floor(hp * (1 - cost)));
    const lost = hp - newHp;
    if (typeof c.setHeroHp === "function") c.setHeroHp(newHp);
    else if (typeof c.healHero === "function") c.healHero(-lost);
    const eff = {
      id: "blood_pact", type: "blood_pact", cat: "pact", duration: "world",
      damageAdd: bp.damageAdd != null ? bp.damageAdd : 0.18,
      bossDmgAdd: bp.bossDmgAdd != null ? bp.bossDmgAdd : 0.12,
      goldAdd: bp.goldAdd != null ? bp.goldAdd : 0.15
    };
    dlPushEffect(st, eff);
    st.bloodPactUsed = true;
    res.ok = true; res.healDelta = -lost; res.effectsApplied.push(eff);
    res.logLines.push("Blutpakt besiegelt (−" + lost + " LP).");
    dlNoteEventTelemetry(st, { kind: "resolve", type, choice: id });
    return finish();
  }

  if (type === "golden_enemy") {
    if (id === "leave") {
      res.ok = true; res.rejected = true;
      res.logLines.push("Der goldene Feind entkommt.");
      return finish();
    }
    if (id !== "accept") { res.logLines.push("Ungültige Wahl."); return res; }
    const ge = cfg.goldenEnemy || {};
    const wi = c.worldIndex | 0;
    const goldMap = ge.gold || {};
    const ch = {
      type: "golden_enemy",
      hpMult: ge.hpMult != null ? ge.hpMult : 1.5,
      atkMult: ge.atkMult != null ? ge.atkMult : 0.75,
      speedMult: ge.speedMult != null ? ge.speedMult : 1.45,
      fleeSeconds: ge.fleeSeconds != null ? ge.fleeSeconds : 12,
      goldReward: goldMap[wi] != null ? goldMap[wi] : (goldMap[String(wi)] || 120),
      lootChance: ge.lootChance != null ? ge.lootChance : 0.35,
      minLoot: ge.minLoot || "uncommon"
    };
    st.activeChallenge = ch;
    res.ok = true; res.spawnChallenge = ch;
    res.logLines.push("Ein goldener Feind erscheint!");
    dlNoteEventTelemetry(st, { kind: "resolve", type, choice: id });
    return finish();
  }

  if (type === "fate_gate") {
    const fg = cfg.fateGate || {};
    if (id === "safe") {
      const ch = {
        type: "fate_gate", path: "safe",
        budgetMult: fg.safeBudgetMult != null ? fg.safeBudgetMult : 0.75,
        wavesLeft: 1
      };
      st.activeChallenge = ch;
      st.fateGateUsed = true;
      res.ok = true; res.spawnChallenge = ch;
      res.logLines.push("Sicherer Pfad gewählt.");
      dlNoteEventTelemetry(st, { kind: "resolve", type, choice: id });
      return finish();
    }
    if (id === "danger") {
      const enc = fg.dangerEncounters != null ? fg.dangerEncounters : 2;
      const ch = {
        type: "fate_gate", path: "danger",
        budgetMult: fg.dangerBudgetMult != null ? fg.dangerBudgetMult : 1.35,
        enemyDmgAdd: fg.dangerEnemyDmgAdd != null ? fg.dangerEnemyDmgAdd : 0.10,
        eliteChanceAdd: fg.dangerEliteChanceAdd != null ? fg.dangerEliteChanceAdd : 0.10,
        rewardGoldMult: fg.rewardGoldMult != null ? fg.rewardGoldMult : 2.5,
        rewardEpicChance: fg.rewardEpicChance != null ? fg.rewardEpicChance : 0.20,
        rewardLegendaryChance: fg.rewardLegendaryChance != null ? fg.rewardLegendaryChance : 0.02,
        wavesLeft: enc
      };
      const eff = {
        id: "fate_danger", type: "fate_gate", cat: "challenge",
        duration: "encounters", encountersLeft: enc,
        enemyDmgTakenAdd: fg.dangerEnemyDmgAdd != null ? fg.dangerEnemyDmgAdd : 0.10
      };
      dlPushEffect(st, eff);
      st.activeChallenge = ch;
      st.fateGateUsed = true;
      res.ok = true; res.spawnChallenge = ch; res.effectsApplied.push(eff);
      res.logLines.push("Gefahr-Pfad gewählt – " + enc + " schwere Wellen.");
      dlNoteEventTelemetry(st, { kind: "resolve", type, choice: id });
      return finish();
    }
    res.logLines.push("Ungültige Wahl.");
    return res;
  }

  res.logLines.push("Unbekanntes Ereignis.");
  return finish();
}

/* ---- Challenge / encounter buffs ---- */

function dlOnChallengeWaveComplete(state, waveResult) {
  const st = state;
  if (!st || !st.activeChallenge) return null;
  const ch = st.activeChallenge;
  const wr = waveResult || {};
  const out = { completed: false, reward: null, challenge: ch };

  if (ch.type === "elite_challenge") {
    ch.wavesLeft = Math.max(0, (ch.wavesLeft | 0) - 1);
    if (ch.wavesLeft <= 0 || wr.cleared) {
      const cfg = dlEventsCfg().eliteChallenge || {};
      if (rngChance(cfg.tempBuffChance != null ? cfg.tempBuffChance : 0.15)) {
        const buffs = cfg.tempBuffs || [];
        if (buffs.length) {
          const buff = buffs[Math.floor(Math.random() * buffs.length)];
          const eff = Object.assign({
            id: buff.id, type: "elite_reward", cat: "buff", duration: "world"
          }, buff);
          dlPushEffect(st, eff);
          out.reward = { buff: eff };
        }
      }
      out.completed = true;
      st.activeChallenge = null;
      dlNoteEventTelemetry(st, { kind: "challenge_complete", type: "elite_challenge" });
    }
    return out;
  }

  if (ch.type === "fate_gate") {
    ch.wavesLeft = Math.max(0, (ch.wavesLeft | 0) - 1);
    if (ch.wavesLeft <= 0 || wr.cleared) {
      out.completed = true;
      if (ch.path === "danger") {
        out.reward = {
          goldMult: ch.rewardGoldMult || 2.5,
          epicChance: ch.rewardEpicChance || 0.2,
          legendaryChance: ch.rewardLegendaryChance || 0.02
        };
      }
      st.activeChallenge = null;
      dlNoteEventTelemetry(st, { kind: "challenge_complete", type: "fate_gate", path: ch.path });
    }
    return out;
  }

  if (ch.type === "golden_enemy" || ch.type === "mimic") {
    if (wr.killed || wr.cleared) {
      out.completed = true;
      out.reward = { gold: ch.goldReward || 0, challengeType: ch.type };
      st.activeChallenge = null;
    } else if (wr.fled || wr.failed) {
      out.completed = true;
      st.activeChallenge = null;
    }
    return out;
  }

  return out;
}

function rngChance(p) {
  return Math.random() < (p || 0);
}

function dlConsumeEncounterBuffs(state) {
  if (!state || !state.activeEffects) return state;
  const next = [];
  for (let i = 0; i < state.activeEffects.length; i++) {
    const e = state.activeEffects[i];
    if (!e) continue;
    if (e.duration === "encounters") {
      const left = (e.encountersLeft != null ? e.encountersLeft : 1) - 1;
      if (left <= 0) continue;
      e.encountersLeft = left;
    }
    next.push(e);
  }
  state.activeEffects = next;
  return state;
}

/* ---- HUD / telemetry ---- */

function dlListEventHudIcons(state) {
  const lim = dlEventsCfg().limits;
  const max = lim.maxVisibleHudIcons != null ? lim.maxVisibleHudIcons : 3;
  const effects = (state && state.activeEffects) || [];
  const icons = [];
  for (let i = 0; i < effects.length; i++) {
    const e = effects[i];
    if (!e || !e.id) continue;
    const hud = DL_EVENT_HUD[e.id] || { label: e.name || e.id, tip: e.type || "Effekt" };
    icons.push({ id: e.id, label: hud.label, tip: hud.tip });
  }
  if (state && state.activeCurse && !icons.some((x) => x.id === state.activeCurse)) {
    const hud = DL_EVENT_HUD[state.activeCurse] || { label: "Fluch", tip: "Aktiver Altar-Fluch" };
    icons.unshift({ id: state.activeCurse, label: hud.label, tip: hud.tip });
  }
  const shown = icons.slice(0, max);
  return { icons: shown, overflow: Math.max(0, icons.length - max) };
}

function dlNoteEventTelemetry(state, entry) {
  if (!state) return;
  if (!state.telemetry) state.telemetry = [];
  state.telemetry.push(Object.assign({ t: Date.now() }, entry || {}));
  if (state.telemetry.length > 80) state.telemetry = state.telemetry.slice(-60);
}

/* ---- Exports ---- */

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    DL_EVENTS_DEFAULTS,
    DL_EVENT_TYPES,
    dlEventsCfg,
    dlEventWorldLimits,
    dlCreateEmptyEventState,
    dlMigrateEventState,
    dlClearWorldEventBuffs,
    dlClearAllEventEffects,
    dlGetEventBonuses,
    dlCanRollEvent,
    dlRollEventChance,
    dlPickEventType,
    dlTryTriggerEventAfterWave,
    dlBuildEventPending,
    dlResolveEventChoice,
    dlOnChallengeWaveComplete,
    dlConsumeEncounterBuffs,
    dlListEventHudIcons,
    dlNoteEventTelemetry
  };
}
