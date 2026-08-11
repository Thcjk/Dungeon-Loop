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

const report = dlRunBalanceReport();

console.log("=== DUNGEON LOOP BALANCE REPORT v" + report.version + " ===\n");
console.log("Target first clear: ~" + report.targetClearMin + " min (90–150 acceptable)\n");

console.log("Estimated first-clear time (heuristic):");
Object.entries(report.estimateMinutes).forEach(([k, v]) => {
  const ok = v >= 90 && v <= 150;
  console.log("  " + k.padEnd(10) + v + " min" + (ok ? " ✓" : " ⚠"));
});

console.log("\nPower by build archetype (start=100):");
Object.entries(report.powerByArchetype).forEach(([k, v]) => {
  console.log("  " + k.padEnd(10) + v);
});

console.log("\nSample run gold:");
Object.entries(report.sampleRunGold).forEach(([k, v]) => {
  console.log("  " + k.padEnd(10) + v + " 🪙");
});

console.log("\nUpgrade costs (level 1):");
Object.entries(report.upgradeCosts).forEach(([k, v]) => {
  console.log("  " + k.padEnd(14) + v + " 🪙");
});

const runsForAttack = Math.ceil(report.upgradeCosts.attackLv1 / report.sampleRunGold.early);
console.log("\nRuns to first attack upgrade (early): ~" + runsForAttack);

if (report.warnings.length) {
  console.log("\n⚠ WARNINGS:");
  report.warnings.forEach((w) => console.log("  - " + w));
} else {
  console.log("\n✓ All sanity checks passed");
}

process.exit(report.warnings.length ? 1 : 0);
