/* ============================================
   Dungeon Loop – Progression Runtime
   Run-Stats, Encounter-Budget, Damage-Pipeline,
   Death-Screen, Loop/NG+, Debug helpers
   ============================================ */

function createDefaultRunStats() {
  return {
    worldIndex: 0,
    worldName: "",
    progress01: 0,
    bestProgress01: 0,
    kills: 0,
    eliteKills: 0,
    damageDealt: 0,
    damageTaken: 0,
    bossDamage: 0,
    bossMaxHp: 0,
    bossMinHpFrac: 1,
    goldEarned: 0,
    resourcesEarned: 0,
    runDurationMs: 0,
    highestCombo: 0,
    combo: 0,
    upgradePower: 0,
    deathCause: "",
    deathPosition: 0,
    elitesSeen: 0
  };
}

function createDefaultRecords() {
  return {
    bestWorldProgress: {}, // worldIndex -> 0..1
    bestBossHpFrac: {},    // worldIndex -> lowest boss HP frac (0=kill)
    bestKills: 0,
    bestGoldRun: 0,
    lastRunProgress: 0,
    lastRunKills: 0,
    lastRunGold: 0,
    lastRunDamage: 0
  };
}

function ensureRunStats() {
  if (!game.runStats) game.runStats = createDefaultRunStats();
  return game.runStats;
}

function ensureRecords() {
  if (!game.records) game.records = createDefaultRecords();
  if (!game.meta) return game.records;
  if (!game.meta.records) game.meta.records = createDefaultRecords();
  game.records = game.meta.records;
  return game.records;
}

function resetRunStatsForNewRun() {
  const rs = createDefaultRunStats();
  const world = (typeof getWorld === "function") ? getWorld() : { name: "?", danger: 1 };
  rs.worldIndex = game.worldIndex | 0;
  rs.worldName = world.name || "";
  rs.upgradePower = (typeof getPlayerPowerScore === "function") ? getPlayerPowerScore() : 0;
  game.runStats = rs;
  game.runStartMs = performance.now();
  game.activeBossMaxHp = 0;
  game.activeBossMinHpFrac = 1;
  game.breathWavesLeft = 0;
  game.lastEncounterIntensity = 1;
}

function syncRunStatsLive() {
  const rs = ensureRunStats();
  const world = getWorld();
  rs.worldIndex = game.worldIndex | 0;
  rs.worldName = world.name || "";
  rs.progress01 = (typeof getWorldProgress01 === "function") ? getWorldProgress01() : 0;
  if (rs.progress01 > rs.bestProgress01) rs.bestProgress01 = rs.progress01;
  if (game.runStartMs) rs.runDurationMs = Math.max(0, performance.now() - game.runStartMs);
  rs.upgradePower = (typeof getPlayerPowerScore === "function") ? getPlayerPowerScore() : rs.upgradePower;
  // Boss near-miss
  const boss = (game.enemies || []).find((e) => e && e.isBoss && !e.dead && e.hp > 0);
  if (boss && boss.maxHp > 0) {
    game.activeBossMaxHp = boss.maxHp;
    const frac = boss.hp / boss.maxHp;
    if (frac < game.activeBossMinHpFrac) game.activeBossMinHpFrac = frac;
    rs.bossMaxHp = boss.maxHp;
    rs.bossMinHpFrac = game.activeBossMinHpFrac;
  }
}

function getUpgradeEff(key) {
  const up = UPGRADES.find((u) => u.key === key);
  const lv = Math.max(0, Math.floor(Number(game.upgrades?.[key]) || 0));
  if (!up) return 0;
  if (typeof dlEffectiveBonus === "function") return dlEffectiveBonus(up, lv);
  return lv * (up.bonus || 0);
}

function getPlayerPowerScore() {
  if (!game.hero) {
    return typeof dlPlayerPowerScore === "function" ? dlPlayerPowerScore({}) : 100;
  }
  const st = heroStats();
  return typeof dlPlayerPowerScore === "function"
    ? dlPlayerPowerScore({
      attack: st.attack,
      magicDamage: st.magicDamage,
      crit: st.crit,
      critDamage: st.critDamage,
      maxHp: st.maxHp,
      defense: st.defense,
      atkSpeedMult: st.atkSpeedMult,
      moveSpeedMult: st.moveSpeedMult,
      regen: st.regen,
      lifesteal: st.lifesteal,
      bossDamage: st.bossDamage
    })
    : 100;
}

/**
 * Zentrale Schaden-Pipeline Spieler → Gegner
 * Tracks stats, Crit-DMG, Boss-DMG, Lifesteal, Weak-Debuff
 */
function dealPlayerDamage(e, rawDmg, opts) {
  if (!e || e.dead || e.hp <= 0) return 0;
  const o = opts || {};
  const st = o.stats || (game.hero ? heroStats() : {});
  let dmg = Math.max(1, Number(rawDmg) || 0);

  const isCrit = !!o.crit || (o.critRoll != null && Math.random() < o.critRoll);
  if (isCrit) dmg *= (st.critDamage || (BALANCE.critDamageBase || 1.85));

  if (e.isBoss && st.bossDamage) dmg *= (1 + st.bossDamage);

  if (e.weakTimer > 0 && e.damageTakenMult) dmg *= e.damageTakenMult;

  dmg = Math.max(1, Math.floor(dmg));
  e.hp -= dmg;
  e.hitFlash = Math.max(e.hitFlash || 0, isCrit ? 10 : 6);

  const rs = ensureRunStats();
  rs.damageDealt += dmg;
  if (e.isBoss) rs.bossDamage += dmg;
  rs.combo = (rs.combo || 0) + 1;
  if (rs.combo > (rs.highestCombo || 0)) rs.highestCombo = rs.combo;

  if (game.hero && st.lifesteal > 0 && dmg > 0) {
    const heal = Math.max(0, Math.floor(dmg * Math.min(0.12, st.lifesteal)));
    if (heal > 0) {
      const maxHp = st.maxHp || game.hero.maxHp;
      game.hero.hp = Math.min(maxHp, game.hero.hp + heal);
    }
  }

  if (typeof spawnDamage === "function") {
    const ex = e.x + e.w / 2;
    spawnDamage(ex, e.y, dmg, {
      crit: isCrit,
      magic: !!o.magic,
      big: !!o.big || e.isBoss,
      color: o.color
    });
  }

  if (e.hp <= 0 && !e.dead) {
    e.dead = true;
    if (typeof onEnemyKill === "function") onEnemyKill(e);
  }
  return dmg;
}

function notePlayerDamageTaken(dmg) {
  const rs = ensureRunStats();
  rs.damageTaken += Math.max(0, Math.floor(dmg || 0));
  rs.combo = 0;
}

function noteEnemyKillForStats(e) {
  const rs = ensureRunStats();
  rs.kills += 1;
  if (e && e.isElite) {
    rs.eliteKills += 1;
  }
  if (e && e.isBoss) {
    rs.bossMinHpFrac = 0;
    game.activeBossMinHpFrac = 0;
  }
}

/** Encounter aus Budget bauen – Rollenliste */
function planEncounterRoles(budget, theme, danger, allowElite) {
  const roles = (typeof DL_BALANCE !== "undefined") ? DL_BALANCE.roles : null;
  if (!roles) return [{ tag: "basic", cost: 1 }];

  const weights = (typeof dlThemeRoleWeights === "function")
    ? dlThemeRoleWeights(theme, danger)
    : { basic: 1, fast: 0.3, ranged: 0.3, tank: 0.2 };

  const pool = Object.keys(weights).filter((k) => k !== "boss" && (allowElite || k !== "elite"));
  const picks = [];
  let spent = 0;
  let guard = 0;
  while (spent < budget - 0.4 && picks.length < 5 && guard++ < 20) {
    const remaining = budget - spent;
    const options = pool
      .map((tag) => ({ tag, cost: roles[tag].cost, w: weights[tag] || 0.1 }))
      .filter((o) => o.cost <= remaining + 0.15);
    if (!options.length) break;
    // Weighted random
    const sum = options.reduce((a, o) => a + o.w, 0);
    let r = Math.random() * sum;
    let chosen = options[0];
    for (const o of options) {
      r -= o.w;
      if (r <= 0) { chosen = o; break; }
    }
    picks.push({ tag: chosen.tag, cost: chosen.cost });
    spent += chosen.cost;
    // Synergy awareness: if we already have tank, prefer ranged next
    if (picks.some((p) => p.tag === "tank")) weights.ranged = (weights.ranged || 0) + 0.35;
  }
  if (!picks.length) picks.push({ tag: "basic", cost: 1 });

  const tags = picks.map((p) => p.tag);
  const syn = (typeof dlSynergyExtra === "function") ? dlSynergyExtra(tags) : 0;
  // If synergy would blow budget badly and we have room to drop last, keep for tension
  return { picks, spent: spent + syn, synergy: syn };
}

function finalizeRunRecordsOnDeath(cause) {
  syncRunStatsLive();
  const rs = ensureRunStats();
  const rec = ensureRecords();
  rs.deathCause = cause || "hp";
  rs.deathPosition = game.dungeonLevel | 0;
  rs.goldEarned = Math.max(rs.goldEarned, game.lastRunGold || 0);

  const wi = String(rs.worldIndex | 0);
  const prevP = rec.bestWorldProgress[wi] || 0;
  if (rs.bestProgress01 > prevP) rec.bestWorldProgress[wi] = rs.bestProgress01;

  if (rs.bossMaxHp > 0) {
    const frac = rs.bossMinHpFrac;
    const prevB = rec.bestBossHpFrac[wi];
    if (prevB == null || frac < prevB) rec.bestBossHpFrac[wi] = frac;
  }

  if (rs.kills > (rec.bestKills || 0)) rec.bestKills = rs.kills;
  if (rs.goldEarned > (rec.bestGoldRun || 0)) rec.bestGoldRun = rs.goldEarned;

  rec.lastRunProgress = rs.bestProgress01;
  rec.lastRunKills = rs.kills;
  rec.lastRunGold = rs.goldEarned;
  rec.lastRunDamage = rs.damageDealt;

  if (game.meta) {
    game.meta.records = rec;
    if (typeof saveMeta === "function") saveMeta();
  }
  return { rs, rec, prevProgress: prevP };
}

function formatPct(x) {
  return Math.round(Math.max(0, Math.min(1, x || 0)) * 100) + "%";
}

function buildGameOverRichHtml(rs, rec, prevProgress) {
  const delta = (rs.bestProgress01 || 0) - (prevProgress || 0);
  const newBest = (rs.bestProgress01 || 0) >= (prevProgress || 0) && (rs.bestProgress01 || 0) > 0.01;
  const bossLine = (rs.bossMaxHp > 0)
    ? ("Boss-Leben: " + formatPct(rs.bossMinHpFrac) +
      (rs.bossMinHpFrac < (rec.bestBossHpFrac[String(rs.worldIndex)] ?? 1) + 0.001
        ? " · NEUER REKORD" : ""))
    : "";
  const lines = [
    (rs.worldName || "Welt") + " · Fortschritt " + formatPct(rs.bestProgress01) +
      (newBest ? " · NEUER REKORD" : ""),
    delta > 0.005 ? ("Letzter Rekord +" + Math.round(delta * 100) + "%") : ("Vorher: " + formatPct(prevProgress || 0)),
    rs.kills + " Besiegt" + (rs.eliteKills ? (" · " + rs.eliteKills + " Eliten") : "") +
      " · " + Math.floor(rs.goldEarned || 0) + " Gold",
    "Schaden ausgeteilt " + Math.floor(rs.damageDealt || 0) + " · Erlitten " + Math.floor(rs.damageTaken || 0),
    bossLine,
    "Stärke " + (rs.upgradePower || 0) + " · Durchlauf " + ((game.loopIndex | 0) + 1)
  ].filter(Boolean);
  return lines.join("\n");
}

function getShortMidLongGoals() {
  // SHORT: cheapest relevant upgrade
  let short = null;
  UPGRADES.forEach((up) => {
    if (typeof isUpgradeRelevant === "function" && !isUpgradeRelevant(up)) return;
    const lv = game.upgrades[up.key] || 0;
    const max = (typeof dlUpgradeMax === "function") ? dlUpgradeMax(up) : (BALANCE.upgradeMax || 24);
    if (lv >= max) return;
    const cost = (typeof getUpgradeCost === "function") ? getUpgradeCost(up.key) : up.baseCost;
    if (!short || cost < short.cost) short = { label: up.label + " " + (lv + 1), cost, left: Math.max(0, cost - getSpendableGold()) };
  });
  const mid = (typeof getNextCdAbilityUnlock === "function")
    ? getNextCdAbilityUnlock(game.classKey, getSpecialCdLevel())
    : null;
  const world = getWorld();
  const long = "Weltboss: " + world.name;
  return {
    short: short ? (short.left > 0
      ? ("Noch " + short.left + " Gold für " + short.label)
      : ("Jetzt kaufen: " + short.label)) : "Alle Upgrades max",
    mid: mid ? ("Freischalten: " + mid.name + " (Spezial-CD)") : "Fähigkeiten ausbauen / Build verbessern",
    long
  };
}

/* ----- Debug Dashboard ----- */
function isBalanceDebug() {
  try {
    return /(?:\?|&)debug=1(?:&|$)/.test(location.search) || localStorage.getItem("dungeon_loop_debug") === "1";
  } catch (_) {
    return false;
  }
}

function renderBalanceDebugPanel() {
  if (!isBalanceDebug()) return;
  let el = document.getElementById("balance-debug");
  if (!el) {
    el = document.createElement("div");
    el.id = "balance-debug";
    el.className = "balance-debug";
    document.body.appendChild(el);
  }
  const st = game.hero ? heroStats() : {};
  const world = (typeof getWorld === "function") ? getWorld() : {};
  const progress = (typeof getWorldProgress01 === "function") ? getWorldProgress01() : 0;
  const intensity = (typeof dlWorldIntensity === "function") ? dlWorldIntensity(progress) : 1;
  const power = getPlayerPowerScore();
  const warnings = (typeof dlRunSanityChecks === "function")
    ? dlRunSanityChecks({ baseCrit: CLASSES[game.classKey]?.crit || 0 })
    : [];
  const goals = getShortMidLongGoals();
  el.innerHTML =
    "<strong>BALANCE-DEBUG</strong>" +
    "<div>Stärke " + power + " · Durchlauf " + ((game.loopIndex | 0) + 1) + "</div>" +
    "<div>Welt " + (world.name || "?") + " · Fortschritt " + formatPct(progress) + " · Intensität " + intensity.toFixed(2) + "</div>" +
    "<div>Gold " + (typeof getSpendableGold === "function" ? getSpendableGold() : 0) +
    " · Läufe ohne Upgrade " + (game.emptyUpgradeRuns | 0) + "</div>" +
    "<div>Angriff " + Math.floor(st.attack || 0) + " Magie " + Math.floor(st.magicDamage || 0) +
    " Tempo " + ((st.atkSpeedMult || 1)).toFixed(2) + " Krit " + Math.round((st.crit || 0) * 100) + "%</div>" +
    "<div>Leben " + Math.floor(st.maxHp || 0) + " Rüstung " + (st.defense || 0).toFixed?.(1) +
    " Lebensraub " + Math.round((st.lifesteal || 0) * 1000) / 10 + "%</div>" +
    "<div class='dbg-goals'>Kurz: " + goals.short + "<br>Mittel: " + goals.mid + "<br>Lang: " + goals.long + "</div>" +
    (warnings.length ? ("<div class='dbg-warn'>" + warnings.join("<br>") + "</div>") : "<div>Checks OK</div>") +
    "<div class='dbg-actions'>" +
    "<button type='button' data-dbg='w1'>W1</button>" +
    "<button type='button' data-dbg='w2'>W2</button>" +
    "<button type='button' data-dbg='w3'>W3</button>" +
    "<button type='button' data-dbg='gold'> +500🪙</button>" +
    "<button type='button' data-dbg='god'>Unverwundbar</button>" +
    "</div>";

  el.onclick = (ev) => {
    const btn = ev.target.closest("[data-dbg]");
    if (!btn) return;
    const a = btn.getAttribute("data-dbg");
    if (a === "gold") {
      game.totalGold = (game.totalGold || 0) + 500;
      updateTotalGold();
      renderUpgradeButtons();
    } else if (a === "god") {
      if (game.hero) game.hero.hp = game.hero.maxHp = 9999;
    } else if (a === "w1" || a === "w2" || a === "w3" || a === "w4" || a === "w5") {
      const idx = parseInt(a[1], 10) - 1;
      debugJumpWorld(idx);
    }
    renderBalanceDebugPanel();
  };
}

function debugJumpWorld(idx) {
  if (!isBalanceDebug()) return;
  const i = Math.max(0, Math.min(WORLDS.length - 1, idx | 0));
  game.worldIndex = i;
  game.dungeonLevel = WORLDS[i].min;
  game.enemies = [];
  game.projectiles = [];
  if (typeof initWorldBackground === "function") initWorldBackground();
  if (typeof safeSpawnWave === "function") safeSpawnWave();
  addLog("Debug: Sprung zu " + WORLDS[i].name, "heal");
}

function tickBalanceDebug(dt) {
  if (!isBalanceDebug()) return;
  if (!tickBalanceDebug._t) tickBalanceDebug._t = 0;
  tickBalanceDebug._t += dt;
  if (tickBalanceDebug._t > 0.5) {
    tickBalanceDebug._t = 0;
    renderBalanceDebugPanel();
  }
}
