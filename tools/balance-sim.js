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

// Exit non-zero only on real sanity warnings – not on estimate band
process.exit(report.warnings.length ? 1 : 0);
