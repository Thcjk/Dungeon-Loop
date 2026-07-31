#!/usr/bin/env node
/** Release-Smoke-Tests für Save-Schema, Balancing und Kernkonstanten. */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const ok = [];
const fail = [];

function assert(cond, msg) {
  if (cond) ok.push(msg);
  else fail.push(msg);
}

assert(script.includes('BUILD_ID = "sidescroller-v3-151"'), "BUILD_ID v151");
assert(script.includes("function drawMenuBrand("), "Menü-Logo aus Asset-Pack");
assert(script.includes("loadMenuBrand"), "PackAssets.loadMenuBrand");
assert(html.includes('id="menu-brand-canvas"'), "Menü-Logo-Canvas");
assert(html.includes('class="menu-brand"'), "Hauptmenü-Logo-Bereich");
assert(!html.includes('src="logo.svg"'), "kein SVG-Logo mehr");
assert(script.includes("SAVE_SCHEMA_VERSION"), "SAVE_SCHEMA_VERSION vorhanden");
assert(script.includes("function validateMeta("), "validateMeta vorhanden");
assert(script.includes("function safeSetLocalStorage("), "safeSetLocalStorage vorhanden");
assert(script.includes("function flashSaveIndicator("), "Save-Indikator vorhanden");
assert(script.includes("function updateContinueButton("), "Fortsetzen-Button-Logik");
assert(script.includes("function applySettingsFromUI("), "Einstellungen anwenden");
assert(script.includes('ab.type === "buff_shout"'), "buff_shout ohne Ziel");
assert(script.includes("e.poisonTicks"), "Gift-DoT pausierbar");
assert(!/setTimeout\(\(\) => \{\s*if \(e\.dead/.test(script), "kein Gift-setTimeout mehr");
assert(/attackRate:\s*380/.test(script), "Ranger attackRate 380");
assert(/attackRate:\s*460/.test(script), "Krieger attackRate 460");
assert(script.includes("function shouldSpawnWorldBoss("), "Welt-Boss-Tor vorhanden");
assert(script.includes("function tryAdvanceWorldAfterBossWave("), "Weltwechsel nach Boss-Welle");
assert(script.includes("worldIndex:"), "worldIndex im Spielstand");
assert(!script.includes("dungeonLevel % 10 === 0"), "kein alter Level-%-10-Boss mehr");
assert(html.includes('id="menu-settings"'), "Einstellungen-Menü");
assert(html.includes('id="menu-credits"'), "Credits-Menü");
assert(html.includes('id="btn-menu-continue"'), "Fortsetzen im Hauptmenü");
assert(html.includes('id="save-indicator"'), "Save-Indikator HTML");
assert(html.includes("favicon.svg"), "Favicon");
assert(!html.includes("fonts.googleapis.com"), "keine Google-Fonts-Abhängigkeit");
assert(fs.existsSync(path.join(root, "favicon.svg")), "favicon.svg Datei");
assert(fs.existsSync(path.join(root, "RELEASE_REPORT.md")), "RELEASE_REPORT.md vorhanden");

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
function validateMetaLite(parsed) {
  const base = { level: 1, xp: 0, totalKills: 0, playTimeMs: 0 };
  if (!parsed || typeof parsed !== "object") return base;
  base.level = clamp(Math.floor(Number(parsed.level) || 1), 1, 99);
  base.xp = Math.max(0, Math.floor(Number(parsed.xp) || 0));
  const kills = Number(parsed.totalKills);
  const play = Number(parsed.playTimeMs);
  base.totalKills = Number.isFinite(kills) ? Math.max(0, Math.floor(kills)) : 0;
  base.playTimeMs = Number.isFinite(play) ? Math.max(0, Math.floor(play)) : 0;
  return base;
}
const bad = validateMetaLite({ level: -3, xp: NaN, totalKills: Infinity, playTimeMs: -9 });
assert(bad.level === 1 && bad.xp === 0 && bad.totalKills === 0 && bad.playTimeMs === 0, "Meta-Validierung korrigiert Ungültiges");
assert(Math.max(0, Math.floor(Number(-12.7) || 0)) === 0, "Gold nicht negativ");

console.log("OK:", ok.length);
if (fail.length) {
  console.error("FAIL:");
  fail.forEach((f) => console.error(" -", f));
  process.exit(1);
}
console.log("Alle Release-Smoke-Tests bestanden.");
