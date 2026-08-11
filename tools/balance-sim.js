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
const range = (typeof DL_BALANCE !== "undefined" && DL_BALANCE.targetFirstClearRange)
  ? DL_BALANCE.targetFirstClearRange : [105, 145];
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
  console.log("  economy    " + mk(["gold_find", "gold_find", "elite_gold", "coin_magnet", "gold_greed"]));
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

if (report.warnings.length) {
  console.log("\n⚠ WARNINGS:");
  report.warnings.forEach((w) => console.log("  - " + w));
} else {
  console.log("\n✓ All sanity checks passed");
}

// Exit non-zero only on real sanity warnings – not on estimate band
process.exit(report.warnings.length ? 1 : 0);
