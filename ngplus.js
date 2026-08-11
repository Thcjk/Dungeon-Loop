/* ============================================
   Dungeon Loop – NG+ / Loop Endgame System
   Browser: nach balance.js, vor script.js
   Node: require('./ngplus.js')
   ============================================ */

function ngCfg() {
  if (typeof DL_BALANCE !== "undefined" && DL_BALANCE && DL_BALANCE.ngPlus) {
    return DL_BALANCE.ngPlus;
  }
  if (typeof module !== "undefined" && module.exports) {
    try {
      const bal = require("./balance.js");
      if (bal && bal.DL_BALANCE && bal.DL_BALANCE.ngPlus) return bal.DL_BALANCE.ngPlus;
    } catch (_) {}
  }
  return {};
}

function ngLoopMult(loopIndex) {
  if (typeof dlLoopEnemyMult === "function") return dlLoopEnemyMult(loopIndex);
  return { hp: 1, atk: 1, gold: 1, budget: 1, speed: 1, atkSpd: 1, xp: 1, eliteChance: 0 };
}

function ngCreateEmptyLoopMeta() {
  return {
    highestLoopReached: 0,
    highestLoopCleared: 0,
    loopClearBonusesPaid: {},
    firstClearBonusPaid: false,
    mastery: {},
    unlockedLoopFeatures: {},
    loopStats: {},
    badges: [],
    selectPrepared: true,
    highscores: {
      highestLoop: 0,
      fastestLoopMs: {},
      mostGold: 0,
      highestBossDamage: 0,
      mostEliteKills: 0,
      highestCorruptionCount: 0
    }
  };
}

function ngMigrateLoopMeta(raw, loopsCleared) {
  const base = ngCreateEmptyLoopMeta();
  const src = raw && typeof raw === "object" ? raw : {};
  const cleared = Math.max(0, Math.floor(Number(loopsCleared) || Number(src.highestLoopCleared) || 0));
  base.highestLoopCleared = Math.max(cleared, Math.floor(Number(src.highestLoopCleared) || 0));
  base.highestLoopReached = Math.max(
    base.highestLoopCleared,
    Math.floor(Number(src.highestLoopReached) || 0)
  );
  base.loopClearBonusesPaid = Object.assign({}, src.loopClearBonusesPaid || {});
  base.firstClearBonusPaid = !!src.firstClearBonusPaid || base.highestLoopCleared >= 1;
  base.mastery = Object.assign({}, src.mastery || {});
  base.unlockedLoopFeatures = Object.assign({}, src.unlockedLoopFeatures || {});
  base.loopStats = Object.assign({}, src.loopStats || {});
  base.badges = Array.isArray(src.badges) ? src.badges.slice() : [];
  base.selectPrepared = true;
  base.highscores = Object.assign({}, base.highscores, src.highscores || {});
  return base;
}

function ngCreateRunLoopState() {
  return {
    activeCorruption: [],
    activeEncounterModifier: null,
    corruptionsSurvived: 0,
    elitesWithMods: 0,
    loopStartMs: 0,
    deathsThisLoop: 0
  };
}

function ngMigrateRunLoopState(raw) {
  const base = ngCreateRunLoopState();
  if (!raw || typeof raw !== "object") return base;
  return Object.assign({}, base, raw, {
    activeCorruption: Array.isArray(raw.activeCorruption) ? raw.activeCorruption.slice() : [],
    activeEncounterModifier: raw.activeEncounterModifier || null
  });
}

function ngDisplayLabel(loopIndex) {
  const L = Math.max(0, loopIndex | 0);
  const ui = ngCfg().uiLabel || "LOOP";
  return ui + " " + (L + 1);
}

function ngUnlockFeaturesForLoop(meta, loopIndex) {
  if (!meta) return;
  const map = ngCfg().featureUnlocks || {};
  const L = Math.max(0, loopIndex | 0);
  if (!meta.unlockedLoopFeatures) meta.unlockedLoopFeatures = {};
  for (let i = 1; i <= L; i++) {
    if (map[i]) meta.unlockedLoopFeatures[i] = map[i];
  }
}

/* ---- Elite modifiers ---- */

function ngEliteModCount(loopIndex, rng) {
  const L = Math.max(0, loopIndex | 0);
  const el = ngCfg().elites || {};
  if (L < (el.unlockLoop != null ? el.unlockLoop : 1)) return 0;
  const r = typeof rng === "function" ? rng : Math.random;
  let doubleChance = 0;
  if (L >= (el.doubleUnlockLoop != null ? el.doubleUnlockLoop : 4)) {
    const by = el.doubleChanceByLoop || {};
    doubleChance = by[L] != null ? by[L] : (el.doubleChanceCap != null ? el.doubleChanceCap : 0.7);
    doubleChance = Math.min(el.doubleChanceCap != null ? el.doubleChanceCap : 0.7, doubleChance);
  }
  let tripleChance = 0;
  if (L >= (el.tripleUnlockLoop != null ? el.tripleUnlockLoop : 8)) {
    const by = el.tripleChanceByLoop || {};
    tripleChance = by[L] != null ? by[L] : (el.tripleChanceCap != null ? el.tripleChanceCap : 0.15);
    tripleChance = Math.min(el.tripleChanceCap != null ? el.tripleChanceCap : 0.15, tripleChance);
  }
  if (tripleChance > 0 && r() < tripleChance) return 3;
  if (doubleChance > 0 && r() < doubleChance) return 2;
  return 1;
}

function ngPickEliteModifiers(count, roleTag, rng) {
  const el = ngCfg().elites || {};
  const pool = (el.pool || []).slice();
  const mods = el.modifiers || {};
  const forbidden = el.forbiddenPairs || [];
  const r = typeof rng === "function" ? rng : Math.random;
  const picked = [];
  const n = Math.max(0, count | 0);
  for (let k = 0; k < n && pool.length; k++) {
    const candidates = pool.filter((id) => {
      if (picked.indexOf(id) >= 0) return false;
      for (let i = 0; i < picked.length; i++) {
        for (let f = 0; f < forbidden.length; f++) {
          const a = forbidden[f][0], b = forbidden[f][1];
          if ((picked[i] === a && id === b) || (picked[i] === b && id === a)) return false;
        }
      }
      // Armored+Shielded rare on tanks/elites
      if (el.rareArmoredShielded && (roleTag === "elite" || roleTag === "tank")) {
        if ((picked.indexOf("armored") >= 0 && id === "shielded") ||
            (picked.indexOf("shielded") >= 0 && id === "armored")) {
          if (r() > 0.25) return false;
        }
      }
      return !!mods[id];
    });
    if (!candidates.length) break;
    const id = candidates[Math.floor(r() * candidates.length)];
    picked.push(id);
  }
  return picked;
}

function ngApplyEliteModifiers(enemy, modIds, loopIndex) {
  if (!enemy || !modIds || !modIds.length) return enemy;
  const el = ngCfg().elites || {};
  const defs = el.modifiers || {};
  const strength = modIds.length >= 2 ? (el.doubleStrength != null ? el.doubleStrength : 0.9) : 1;
  enemy.eliteMods = modIds.slice();
  enemy.eliteModStrength = strength;
  let dmgMul = 1, hpMul = 1, moveMul = 1, asMul = 1, armorAdd = 0;
  modIds.forEach((id) => {
    const m = defs[id];
    if (!m) return;
    if (m.damage) dmgMul *= (1 + m.damage * strength);
    if (m.hp) hpMul *= (1 + m.hp * strength);
    if (m.move) moveMul *= (1 + m.move * strength);
    if (m.atkSpd) asMul *= (1 + m.atkSpd * strength);
    if (m.armor) armorAdd += m.armor * strength;
    if (m.healOnHit) {
      enemy.vampiricHeal = m.healOnHit * strength;
      enemy.vampiricIcd = m.healIcd != null ? m.healIcd : 2.5;
      enemy.vampiricTimer = 0;
    }
    if (m.shieldPct) {
      enemy.eliteShieldMax = Math.floor(enemy.maxHp * m.shieldPct * strength);
      enemy.eliteShield = enemy.eliteShieldMax;
    }
    if (m.delay != null) {
      enemy.explosiveOnDeath = {
        delay: m.delay,
        radius: m.radius || 70,
        dmgPctMaxHp: (m.dmgPctMaxHp || 0.18) * strength
      };
    }
  });
  enemy.maxHp = Math.max(1, Math.floor(enemy.maxHp * hpMul));
  enemy.hp = enemy.maxHp;
  enemy.attack = Math.max(1, Math.floor(enemy.attack * dmgMul));
  enemy.speed *= moveMul;
  enemy.attackInterval = Math.max(0.35, enemy.attackInterval / asMul);
  enemy.eliteArmor = (enemy.eliteArmor || 0) + armorAdd;
  const rewardKey = Math.min(3, modIds.length);
  const rewardMult = (el.rewardMult && el.rewardMult[rewardKey]) || (3 + modIds.length);
  enemy.goldReward = Math.floor((enemy.goldReward || 1) * (rewardMult / 3));
  enemy.xpReward = Math.floor((enemy.xpReward || 1) * (1 + 0.25 * modIds.length));
  const labels = modIds.map((id) => id.toUpperCase()).join("+");
  if (enemy.name && enemy.name.indexOf("[") < 0) {
    enemy.name = enemy.name + " [" + labels + "]";
  }
  return enemy;
}

/* ---- Encounter modifiers ---- */

function ngRollEncounterModifier(loopIndex, rng) {
  const L = Math.max(0, loopIndex | 0);
  const em = ngCfg().encounterModifiers || {};
  if (L < (em.unlockLoop != null ? em.unlockLoop : 2)) return null;
  const r = typeof rng === "function" ? rng : Math.random;
  if (r() >= (em.chance != null ? em.chance : 0.2)) return null;
  const pool = em.pool || {};
  const keys = Object.keys(pool);
  if (!keys.length) return null;
  const id = keys[Math.floor(r() * keys.length)];
  return { id, effects: Object.assign({}, pool[id]) };
}

function ngApplyEncounterModToStats(stats, mod) {
  if (!stats || !mod || !mod.effects) return stats;
  const e = mod.effects;
  const out = Object.assign({}, stats);
  if (e.hp) out.hp = Math.max(1, Math.floor(out.hp * (1 + e.hp)));
  if (e.damage) out.attack = Math.max(1, Math.floor(out.attack * (1 + e.damage)));
  if (e.move) out.speed = out.speed * (1 + e.move);
  if (e.atkSpd) out.attackInterval = Math.max(0.35, out.attackInterval / (1 + e.atkSpd));
  if (e.armor) out.armor = (out.armor || 0) + e.armor;
  if (e.reward) {
    out.gold = Math.floor(out.gold * (1 + e.reward));
    out.xp = Math.floor(out.xp * (1 + e.reward * 0.5));
  }
  return out;
}

/* ---- Corruption ---- */

function ngRollWorldCorruption(loopIndex, rng) {
  const L = Math.max(0, loopIndex | 0);
  const c = ngCfg().corruption || {};
  if (L < (c.unlockLoop != null ? c.unlockLoop : 5)) return [];
  const r = typeof rng === "function" ? rng : Math.random;
  const pool = c.pool || {};
  const keys = Object.keys(pool);
  if (!keys.length) return [];
  const shuffle = keys.slice();
  for (let i = shuffle.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    const t = shuffle[i]; shuffle[i] = shuffle[j]; shuffle[j] = t;
  }
  const out = [{ id: shuffle[0], effects: Object.assign({}, pool[shuffle[0]]) }];
  let doubleChance = 0;
  if (L >= (c.doubleFromLoop != null ? c.doubleFromLoop : 7)) {
    const by = c.doubleChanceByLoop || {};
    doubleChance = by[L] != null ? by[L] : (c.doubleChanceCap || 0.5);
    doubleChance = Math.min(c.doubleChanceCap != null ? c.doubleChanceCap : 0.5, doubleChance);
  }
  if (doubleChance > 0 && shuffle.length > 1 && r() < doubleChance) {
    out.push({ id: shuffle[1], effects: Object.assign({}, pool[shuffle[1]]) });
  }
  return out;
}

function ngCorruptionBonuses(list) {
  const out = {
    enemyDmg: 1, enemyHp: 1, gold: 1, reward: 1, budget: 1,
    playerDmg: 1, playerMaxHp: 1, rarePlusRel: 0, telegraph: 0,
    tankSupportWeightRel: 0, breathChanceMul: 1
  };
  (list || []).forEach((c) => {
    const e = c && c.effects ? c.effects : {};
    if (e.enemyDmg) out.enemyDmg *= (1 + e.enemyDmg);
    if (e.hp) out.enemyHp *= (1 + e.hp);
    if (e.gold) out.gold *= (1 + e.gold);
    if (e.reward) out.reward *= (1 + e.reward);
    if (e.budget) out.budget *= (1 + e.budget);
    if (e.playerDmg) out.playerDmg *= (1 + e.playerDmg);
    if (e.playerMaxHp) out.playerMaxHp *= (1 + e.playerMaxHp);
    if (e.rarePlusRel) out.rarePlusRel += e.rarePlusRel;
    if (e.telegraph) out.telegraph += e.telegraph;
    if (e.tankSupportWeightRel) out.tankSupportWeightRel += e.tankSupportWeightRel;
    if (e.breathChanceMul != null) out.breathChanceMul *= e.breathChanceMul;
  });
  return out;
}

/* ---- Loop completion rewards ---- */

function ngPayLoopClearBonus(meta, loopIndex, addGoldFn) {
  if (!meta) return { paid: 0, firstClear: false };
  const L = Math.max(0, loopIndex | 0);
  let paid = 0;
  let firstClear = false;
  if (L === 0 && !meta.firstClearBonusPaid) {
    const amt = (typeof dlLoopClearBonusGold === "function")
      ? dlLoopClearBonusGold(0)
      : ((ngCfg().rewards || {}).firstClearBonus || 1200);
    if (typeof addGoldFn === "function") addGoldFn(amt);
    paid += amt;
    meta.firstClearBonusPaid = true;
    firstClear = true;
  }
  const key = String(L + 1); // bonus keyed by cleared loop display (1 = first clear done as loopIndex 0)
  // Spec: Loop 1 clear bonus = 1500 when clearing NG+ display loop 1 which is loopIndex 0? 
  // "Loop 1: 1500" under LOOP COMPLETION – clearing loopIndex 0 (first clear) also has firstClearBonus 1200.
  // loopClearBonus map uses 1..5 for NG+ clears. So clearing loopIndex 0 = first clear bonus only.
  // Clearing loopIndex 1 (LOOP 2 / NG+1) pays map[1]=1500? Spec says Loop 1: 1500 under completion.
  // Interpreting: loopClearBonus[N] when clearing loopIndex N (NG+N / LOOP N+1 display).
  // Loop 1 clear = clearing first NG+ = loopIndex 1 → 1500. First clear separate 1200.
  if (L >= 1) {
    if (!meta.loopClearBonusesPaid) meta.loopClearBonusesPaid = {};
    const payKey = String(L);
    if (!meta.loopClearBonusesPaid[payKey]) {
      const amt = (typeof dlLoopClearBonusGold === "function")
        ? dlLoopClearBonusGold(L)
        : 0;
      if (amt > 0 && typeof addGoldFn === "function") addGoldFn(amt);
      paid += amt;
      meta.loopClearBonusesPaid[payKey] = true;
    }
  }
  meta.highestLoopCleared = Math.max(meta.highestLoopCleared | 0, L + 1);
  meta.highestLoopReached = Math.max(meta.highestLoopReached | 0, L + 1);
  ngUnlockFeaturesForLoop(meta, L + 1);
  // Badges
  const badgeLoops = [1, 3, 5, 10, 15];
  const clearedDisplay = L + 1;
  badgeLoops.forEach((b) => {
    if (clearedDisplay >= b && meta.badges.indexOf("loop_" + b) < 0) {
      meta.badges.push("loop_" + b);
    }
  });
  return { paid, firstClear };
}

/* ---- Mastery ---- */

function ngMasteryLevel(meta, upgradeKey) {
  if (!meta || !meta.mastery) return 0;
  return Math.max(0, Math.min(2, meta.mastery[upgradeKey] | 0));
}

function ngMasteryBonus(meta, upgradeKey) {
  const lv = ngMasteryLevel(meta, upgradeKey);
  if (lv <= 0) return 0;
  const bonuses = (ngCfg().mastery || {}).bonuses || {};
  const per = bonuses[upgradeKey] || 0;
  return per * lv;
}

function ngMasteryCost(meta, upgradeKey) {
  const m = ngCfg().mastery || {};
  const lv = ngMasteryLevel(meta, upgradeKey);
  const costs = m.costs || [7500, 12000];
  if (lv >= (m.maxTier != null ? m.maxTier : 2)) return null;
  return costs[lv] != null ? costs[lv] : null;
}

function ngCanBuyMastery(meta, loopIndex, upgradeKey) {
  const m = ngCfg().mastery || {};
  if ((loopIndex | 0) < (m.unlockLoop != null ? m.unlockLoop : 3)) return false;
  const bonuses = m.bonuses || {};
  if (!Object.prototype.hasOwnProperty.call(bonuses, upgradeKey)) return false;
  return ngMasteryCost(meta, upgradeKey) != null;
}

function ngBuyMastery(meta, upgradeKey) {
  if (!meta) return { ok: false };
  if (!meta.mastery) meta.mastery = {};
  const cost = ngMasteryCost(meta, upgradeKey);
  if (cost == null) return { ok: false, reason: "max" };
  meta.mastery[upgradeKey] = (meta.mastery[upgradeKey] | 0) + 1;
  return { ok: true, cost, level: meta.mastery[upgradeKey] };
}

/* ---- Next loop preview ---- */

function ngNextLoopPreview(loopIndex) {
  const next = (loopIndex | 0) + 1;
  const cur = ngLoopMult(loopIndex | 0);
  const nxt = ngLoopMult(next);
  const blurb = (typeof dlLoopFeatureBlurb === "function")
    ? dlLoopFeatureBlurb(next)
    : ((ngCfg().featureUnlocks || {})[next] || "");
  return {
    loopIndex: next,
    label: ngDisplayLabel(next),
    hpDelta: (nxt.hp / Math.max(0.01, cur.hp)) - 1,
    dmgDelta: (nxt.atk / Math.max(0.01, cur.atk)) - 1,
    budgetDelta: (nxt.budget / Math.max(0.01, cur.budget)) - 1,
    goldDelta: (nxt.gold / Math.max(0.01, cur.gold)) - 1,
    feature: blurb
  };
}

function ngBossPhaseSpeed(loopIndex, phase) {
  const L = Math.max(0, loopIndex | 0);
  const be = ngCfg().bossEvolution || {};
  if (L < (be.unlockLoop != null ? be.unlockLoop : 3)) return 1;
  if (phase >= 3) return 1 + (be.phase3Speed != null ? be.phase3Speed : 0.10);
  if (phase >= 2) return 1 + (be.phase2Speed != null ? be.phase2Speed : 0.06);
  return 1;
}

/* ---- Exports ---- */

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    ngCfg,
    ngLoopMult,
    ngCreateEmptyLoopMeta,
    ngMigrateLoopMeta,
    ngCreateRunLoopState,
    ngMigrateRunLoopState,
    ngDisplayLabel,
    ngUnlockFeaturesForLoop,
    ngEliteModCount,
    ngPickEliteModifiers,
    ngApplyEliteModifiers,
    ngRollEncounterModifier,
    ngApplyEncounterModToStats,
    ngRollWorldCorruption,
    ngCorruptionBonuses,
    ngPayLoopClearBonus,
    ngMasteryLevel,
    ngMasteryBonus,
    ngMasteryCost,
    ngCanBuyMastery,
    ngBuyMastery,
    ngNextLoopPreview,
    ngBossPhaseSpeed
  };
}
