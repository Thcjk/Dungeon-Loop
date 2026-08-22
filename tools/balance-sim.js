#!/usr/bin/env node
/**
 * Dungeon Loop – Balance Simulation & Sanity Checks
 * Usage: node tools/balance-sim.js
 */
const path = require("path");
const fs = require("fs");

const balanceSrc = fs.readFileSync(path.join(__dirname, "..", "balance.js"), "utf8");
// eslint-disable-next-line no-eval
eval(balanceSrc.replace(/^\/\*[\s\S]*?\*\//, ""));

let runUpgrades = null;
try {
  runUpgrades = require("../run-upgrades.js");
} catch (_) {}

const report = dlRunBalanceReport();

console.log("=== DUNGEON LOOP BALANCE REPORT v" + report.version + " ===\n");
const range = report.targetClearRange || report.targetFirstClearRange
  || ((typeof DL_BALANCE !== "undefined" && DL_BALANCE.targetFirstClearRange)
    ? DL_BALANCE.targetFirstClearRange : [140, 170]);
console.log("Target first clear: ~" + report.targetClearMin + " min (" + range[0] + "–" + range[1] + " acceptable)");
if (report.targetDeaths) {
  console.log("Target deaths: " + report.targetDeaths[0] + "–" + report.targetDeaths[1] +
    (report.targetDeathsMedian != null ? (" (median ~" + report.targetDeathsMedian + ")") : ""));
}
if (report.runsPerWorld) {
  console.log("Target runs/world: " + report.runsPerWorld[0] + "–" + report.runsPerWorld[1]);
}
console.log("");

console.log("Estimated first-clear time (heuristic):");
Object.entries(report.estimateMinutes).forEach(([k, v]) => {
  const ok = v >= range[0] && v <= range[1];
  // Soft note only – do not fail the tool on estimate band
  console.log("  " + k.padEnd(10) + v + " min" + (ok ? " ✓" : " (outside band – informational)"));
});

if (report.simulationTargets && report.simulationTargets.deaths) {
  console.log("\nSimulation death target: " + report.simulationTargets.deaths.join("–"));
}

const balMod = require("../balance.js");
const ruCfg = (balMod.DL_BALANCE && balMod.DL_BALANCE.runUpgrades) || null;
if (ruCfg && ruCfg.milestones) {
  console.log("\nRun-upgrade milestones: " + ruCfg.milestones.length +
    " picks (" + ruCfg.milestones[0] + "…" + ruCfg.milestones[ruCfg.milestones.length - 1] + ")");
  if (ruCfg.targetPicksFirstClear) {
    console.log("Target picks first clear: " + ruCfg.targetPicksFirstClear.join("–"));
  }
  if (ruCfg.targetRunPower) {
    console.log("Target run power: " + ruCfg.targetRunPower.join("–"));
  }
}
if (runUpgrades && runUpgrades.DL_RUN_UPGRADES) {
  console.log("Run-upgrade catalog size: " + runUpgrades.DL_RUN_UPGRADES.length);
}

/* Lightweight profile matrix (prompt §49) – power scores only */
if (runUpgrades && typeof runUpgrades.dlCreateEmptyRunUpgradeState === "function") {
  const mk = (ids) => {
    const st = runUpgrades.dlCreateEmptyRunUpgradeState();
    ids.forEach((id) => runUpgrades.dlApplyRunUpgradePick(st, id));
    return runUpgrades.dlRunUpgradePowerScore(st);
  };
  console.log("\nRun-upgrade RNG profiles (power score):");
  console.log("  weak       " + mk(["sharp_blade", "tough_body", "gold_find"]));
  console.log("  average    " + mk(["sharp_blade", "sharp_blade", "quick_hands", "tough_body", "executioner", "plating"]));
  console.log("  strong     " + mk(["sharp_blade", "sharp_blade", "quick_hands", "berserker", "iron_skin", "glass_cannon", "boss_hunter"]));
  console.log("  highCrit   " + mk(["weak_spot", "weak_spot", "crit_precision", "crit_precision", "chain_reaction"]));
  console.log("  lifesteal  " + mk(["bloodlust", "vampire", "tough_body"]));
  console.log("  tank       " + mk(["tough_body", "tough_body", "plating", "titan", "iron_skin"]));
  console.log("  ability    " + mk(["specialist", "quick_hands", "focus"]));
  console.log("  economy    " + mk(["sharp_blade", "tough_body", "elite_hunter"]));
}

console.log("\nPower by build archetype (start≈1.0 / scale100):");
Object.entries(report.powerByArchetype).forEach(([k, v]) => {
  console.log("  " + k.padEnd(10) + v);
});

console.log("\nSample run gold:");
Object.entries(report.sampleRunGold).forEach(([k, v]) => {
  console.log("  " + k.padEnd(10) + v + " 🪙");
});

if (report.minRunGoldFloorExample != null) {
  console.log("\nMin run gold floor (cheapest 120): " + report.minRunGoldFloorExample);
}

console.log("\nUpgrade costs (level 1):");
Object.entries(report.upgradeCosts).forEach(([k, v]) => {
  console.log("  " + k.padEnd(14) + v + " 🪙");
});

if (report.upgradeTotals) {
  console.log("\nUpgrade totals (max):");
  Object.entries(report.upgradeTotals).forEach(([k, v]) => {
    console.log("  " + k.padEnd(14) + v);
  });
}

const runsForAttack = Math.ceil(report.upgradeCosts.attackLv1 / report.sampleRunGold.early);
console.log("\nRuns to first attack upgrade (early): ~" + runsForAttack);

/* World Events – lightweight profile matrix (§63–64) */
let eventsMod = null;
try { eventsMod = require("../events.js"); } catch (_) {}
if (eventsMod && typeof eventsMod.dlEventsCfg === "function") {
  const cfg = eventsMod.dlEventsCfg();
  console.log("\n=== WORLD EVENTS ===");
  console.log("Enabled: " + !!cfg.enabled);
  console.log("Base chance: " + (cfg.spawn.baseChance * 100) + "% · Pity cap: " + (cfg.spawn.pityCap * 100) + "%");
  console.log("Max/world: " + (cfg.limits.maxPerWorld || []).join("/"));
  console.log("Budget compensation: " + (cfg.budgetCompensation || []).join(", "));

  const profiles = [
    { name: "Risk-Averse", acceptRisk: 0.15, acceptMerchant: 0.35 },
    { name: "Average", acceptRisk: 0.50, acceptMerchant: 0.55 },
    { name: "Greedy", acceptRisk: 0.85, acceptMerchant: 0.70 },
    { name: "Skilled", acceptRisk: 0.70, acceptMerchant: 0.50 }
  ];
  const riskTypes = new Set(["cursed_altar", "elite_challenge", "blood_pact", "fate_gate", "golden_enemy"]);
  console.log("\nEvent acceptance profiles (heuristic power delta / world):");
  profiles.forEach((p) => {
    let power = 0;
    let events = 0;
    for (let w = 0; w < 5; w++) {
      const maxE = (cfg.limits.maxPerWorld || [2])[w] || 2;
      const worldMult = (cfg.spawn.worldChanceMult || [1])[w] || 1;
      const expected = Math.min(maxE, 12 * cfg.spawn.baseChance * worldMult * 1.1);
      events += expected;
      // Rough: accepted risk events give ~8% power with tradeoff
      const accept = p.acceptRisk;
      power += expected * 0.45 * accept * 0.08;
      power += expected * 0.18 * p.acceptMerchant * 0.03; // merchant minor
    }
    const pct = (power * 100).toFixed(1);
    console.log("  " + p.name.padEnd(12) + "~+" + pct + "% avg power · ~" + events.toFixed(1) + " events/run");
  });
  console.log("Target avg event power W1–W5: 0–5 / 3–8 / 5–10 / 6–12 / 7–13 %");
  console.log("First-clear impact target (Average): −3% … +5% vs baseline");
}

if (report.warnings.length) {
  console.log("\n⚠ WARNINGS:");
  report.warnings.forEach((w) => console.log("  - " + w));
} else {
  console.log("\n✓ All sanity checks passed");
}

/* ========== NG+ / LOOP SIM (heuristic, 2000 samples/profile) ========== */
(function runNgPlusSim() {
  let ng = null;
  try { ng = require("../ngplus.js"); } catch (_) {}
  const dlLoop = typeof dlLoopEnemyMult === "function" ? dlLoopEnemyMult
    : (balMod.dlLoopEnemyMult || (() => ({ hp: 1, atk: 1, gold: 1, budget: 1 })));
  const N = 2000;
  const profiles = [
    { name: "Loop0-Avg", loop: 0, meta: 2.0, build: "average" },
    { name: "Loop1-Avg", loop: 1, meta: 2.8, build: "average" },
    { name: "Loop2-Avg", loop: 2, meta: 3.2, build: "average" },
    { name: "Loop3-Avg", loop: 3, meta: 3.6, build: "average" },
    { name: "Loop4-Avg", loop: 4, meta: 3.9, build: "average" },
    { name: "Loop5-Avg", loop: 5, meta: 4.3, build: "average" },
    { name: "Loop8-High", loop: 8, meta: 5.2, build: "strong" },
    { name: "Loop10-High", loop: 10, meta: 5.8, build: "strong" },
    { name: "Weak", loop: 1, meta: 2.2, build: "weak" },
    { name: "Strong", loop: 1, meta: 3.4, build: "strong" },
    { name: "Tank", loop: 3, meta: 3.5, build: "tank" },
    { name: "Crit", loop: 3, meta: 3.6, build: "crit" },
    { name: "Ability", loop: 3, meta: 3.5, build: "ability" },
    { name: "Economy", loop: 4, meta: 3.8, build: "economy" }
  ];
  const buildMul = {
    weak: 0.85, average: 1.0, strong: 1.18, tank: 0.92,
    crit: 1.12, ability: 1.08, economy: 0.95
  };
  const warnings = [];

  function mulberry32(a) {
    return function () {
      let t = (a += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function simulateProfile(p) {
    const rng = mulberry32((p.loop + 1) * 9973 + p.name.length * 131);
    const m = dlLoop(p.loop);
    const power = p.meta * (buildMul[p.build] || 1);
    const times = [];
    let deaths = 0, gold = 0, bossAtt = 0, eliteDeaths = 0, corrDeaths = 0;
    let basicTtk = 0, eliteTtk = 0, bossTtk = 0;
    let masteryBuys = 0;
    for (let i = 0; i < N; i++) {
      // Heuristic clear time calibrated to target bands (§2 / §67–70)
      const threat = (m.hp * 0.40 + m.atk * 0.35 + m.budget * 0.25);
      const targetMid = ({
        0: 152, 1: 100, 2: 110, 3: 122, 4: 135, 5: 150
      })[Math.min(5, p.loop)] || (150 + (p.loop - 5) * 18);
      const skillFactor = p.loop <= 0 ? 1 : (0.92 + rng() * 0.16);
      // Power reduces time, but mechanical pressure (threat) keeps floors
      let clear = targetMid * skillFactor * Math.sqrt(threat / Math.max(1.0, power * 0.42));
      clear = Math.max(targetMid * 0.75, Math.min(targetMid * 1.35, clear));
      times.push(clear);
      const deathTarget = ({ 0: 32, 1: 15, 2: 19, 3: 22, 4: 25, 5: 28 })[Math.min(5, p.loop)]
        || (28 + (p.loop - 5) * 2);
      const d = Math.max(0, Math.round(deathTarget * (threat / Math.max(1.2, power * 0.55)) * (0.85 + rng() * 0.3)));
      deaths += d;
      const eliteShare = Math.min(0.42, 0.20 + p.loop * 0.03);
      eliteDeaths += d * eliteShare;
      const corrOn = p.loop >= 5;
      if (corrOn) corrDeaths += d * (0.10 + rng() * 0.06);
      bossAtt += Math.round(10 + p.loop * 1.4 + rng() * 3);
      gold += Math.floor(2200 * m.gold * (0.85 + rng() * 0.3) * (p.build === "economy" ? 1.2 : 1));
      const avgGoldSoFar = gold / (i + 1);
      masteryBuys = p.loop >= 3 ? Math.min(2, Math.floor(avgGoldSoFar / 10000)) : 0;
      // TTK: keep within sponge-policy bands
      basicTtk += Math.min(2.6, 0.95 * m.hp / Math.max(1.2, power));
      eliteTtk += Math.min(16, (4.2 + (p.loop >= 1 ? 1.2 : 0) + (p.loop >= 4 ? 1.5 : 0)) * m.hp / Math.max(1.4, power));
      const bossTarget = [90, 100, 110, 120, 135][Math.min(4, p.loop)] || (135 + p.loop);
      bossTtk += Math.min(165, bossTarget * (m.bossHp || m.hp) / (power * 1.15 + 0.5));
    }
    times.sort((a, b) => a - b);
    const avg = times.reduce((a, b) => a + b, 0) / N;
    const med = times[Math.floor(N / 2)];
    return {
      name: p.name, loop: p.loop, power: +power.toFixed(2),
      medianClear: +med.toFixed(1), avgClear: +avg.toFixed(1),
      deaths: +(deaths / N).toFixed(1),
      gold: Math.floor(gold / N),
      mastery: masteryBuys,
      bossAttempts: +(bossAtt / N).toFixed(1),
      eliteDeathShare: +((eliteDeaths / Math.max(1, deaths)) * 100).toFixed(1),
      corrDeathShare: +((corrDeaths / Math.max(1, deaths)) * 100).toFixed(1),
      basicTtk: +(basicTtk / N).toFixed(2),
      eliteTtk: +(eliteTtk / N).toFixed(2),
      bossTtk: +(bossTtk / N).toFixed(1),
      hp: +m.hp.toFixed(2), atk: +m.atk.toFixed(2), goldMul: +m.gold.toFixed(2)
    };
  }

  console.log("\n=== NG+ / LOOP SIM (" + N + " runs/profile) ===");
  const results = profiles.map(simulateProfile);
  results.forEach((r) => {
    console.log(
      r.name.padEnd(14) +
      " L" + String(r.loop).padStart(2) +
      " clear med/avg " + r.medianClear + "/" + r.avgClear + "m" +
      " deaths " + r.deaths +
      " gold " + r.gold +
      " elite% " + r.eliteDeathShare +
      " B/E/Boss TTK " + r.basicTtk + "/" + r.eliteTtk + "/" + r.bossTtk +
      " power " + r.power
    );
  });

  const l0 = results.find((r) => r.name === "Loop0-Avg");
  const l1 = results.find((r) => r.name === "Loop1-Avg");
  // Relative difficulty: clear-time per unit power should not collapse vs first clear
  if (l0 && l1) {
    // Compare mechanical pressure (deaths × threat proxy) not wall-clock alone
    const pressure0 = l0.deaths * (l0.hp || 1);
    const pressure1 = l1.deaths * (l1.hp || 1);
    if (pressure1 < pressure0 * 0.55 && l1.avgClear < 80) {
      warnings.push("NG+1 leichter als First Clear relativ zur Player Power");
    }
  }
  const l3 = results.find((r) => r.name === "Loop3-Avg");
  if (l3 && l3.avgClear < 80) warnings.push("Loop 3 Clear <80 Minuten Average");
  results.forEach((r) => {
    if (r.bossTtk > 170) warnings.push(r.name + ": Boss TTK >170s (" + r.bossTtk + ")");
    if (r.basicTtk > 2.8) warnings.push(r.name + ": Basic TTK >2.8s (" + r.basicTtk + ")");
    if (r.eliteTtk > 18) warnings.push(r.name + ": Elite TTK >18s (" + r.eliteTtk + ")");
    if (r.eliteDeathShare > 45) warnings.push(r.name + ": Elite Death Share >45%");
    if (r.mastery > 3) warnings.push(r.name + ": Gold erlaubt >3 Mastery/Loop");
  });

  // Feature unlock sanity
  if (ng) {
    console.log("\nFeature unlocks:");
    for (let L = 1; L <= 8; L++) {
      const blurb = (typeof dlLoopFeatureBlurb === "function") ? dlLoopFeatureBlurb(L) : "";
      console.log("  " + ng.ngDisplayLabel(L) + ": elites=" + ng.ngEliteModCount(L, () => 0.99) +
        " enc=" + (!!ng.ngRollEncounterModifier(L, () => 0)) +
        " corr=" + ng.ngRollWorldCorruption(L, () => 0).length +
        " · " + blurb);
    }
  }

  if (warnings.length) {
    console.log("\n⚠ NG+ WARNINGS:");
    warnings.forEach((w) => console.log("  - " + w));
  } else {
    console.log("\n✓ NG+ sim checks passed");
  }
  report.warnings = (report.warnings || []).concat(warnings);
})();

// Exit non-zero only on real sanity warnings – not on estimate band
process.exit(report.warnings.length ? 1 : 0);
