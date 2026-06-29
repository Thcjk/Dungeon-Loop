/* ============================================
   Dungeon Loop – Fähigkeitensystem
   6 Spezialfähigkeiten pro Klasse
   Freischaltung: Meta-Level + Gold-Kauf
   ============================================ */

/** Meta-Level-Schwellen pro Fähigkeits-Slot (1–6) */
const ABILITY_UNLOCK_LEVELS = [1, 5, 10, 20, 30, 50];

/** Goldkosten nach Freischaltung (Slot 1 = kostenlos) */
const ABILITY_GOLD_COSTS = [0, 180, 450, 1100, 2400, 5200];

/** Spezial-Sound pro Klasse – alle 6 Fähigkeiten nutzen denselben Sound */
const CLASS_SPECIAL_SOUNDS = {
  warrior: "player_special_warrior",
  ranger:  "player_special_ranger",
  mage:    "player_special_mage"
};

function getClassSpecialSound(classKey) {
  return CLASS_SPECIAL_SOUNDS[classKey] || ("player_special_" + classKey);
}

/**
 * Fähigkeits-Definitionen je Klasse.
 * Sound immer klassenweit (getClassSpecialSound) – kein eigenes sound-Feld nötig.
 * type: melee_aoe | melee_single | projectile | projectile_burst | projectile_explosive |
 *       aoe_ground | buff | heal_aoe | magic_beam
 */
const CLASS_ABILITIES = {
  warrior: [
    {
      id: "schildschlag", name: "Schildschlag", slot: 0,
      cd: 8, range: 95, dmgMult: 2.6, type: "melee_aoe",
      color: "#e74c3c", particle: "#f1c40f",
      shieldReduction: 0.28, shieldDuration: 3.5,
      debuffWeak: 0.18, debuffDuration: 2.5,
      desc: "360°-Schildhieb – Schaden + kurzer Schild + Gegner geschwächt"
    },
    {
      id: "wirbelangriff", name: "Wirbelangriff", slot: 1,
      cd: 10, range: 88, dmgMult: 2.0, type: "melee_spin", hits: 3,
      color: "#c0392b", particle: "#e67e22",
      desc: "Dreifach-Wirbel – stärker bei mehreren Gegnern"
    },
    {
      id: "berserker", name: "Berserker", slot: 2,
      cd: 14, range: 80, dmgMult: 3.8, type: "melee_single", critBonus: 0.35,
      color: "#922b21", particle: "#e74c3c",
      desc: "Ein verheerender Nahkampf-Schlag mit hoher Krit-Chance"
    },
    {
      id: "erdbeben", name: "Erdbeben", slot: 3,
      cd: 16, range: 120, dmgMult: 1.8, type: "aoe_ground", radius: 110,
      color: "#795548", particle: "#d35400",
      desc: "Erschüttert den Boden – Flächenschaden vor dem Helden"
    },
    {
      id: "kriegsschrei", name: "Kriegsschrei", slot: 4,
      cd: 18, range: 100, dmgMult: 0.85, type: "buff_shout", buffDuration: 6,
      debuffWeak: 0.22, debuffDuration: 3,
      color: "#f39c12", particle: "#f1c40f",
      desc: "Schreit Gegner an – Buff + Gegner nehmen mehr Schaden"
    },
    {
      id: "klingensturm", name: "Klingensturm", slot: 5,
      cd: 12, range: 100, dmgMult: 1.75, type: "melee_aoe", pierceAll: true,
      color: "#ecf0f1", particle: "#bdc3c7",
      desc: "Klingenwirbel – durchdringender Flächenschaden"
    }
  ],
  ranger: [
    {
      id: "praezisionsschuss", name: "Präzisionsschuss", slot: 0,
      cd: 5, range: 260, dmgMult: 2.3, type: "projectile_burst", count: 7, spread: 0.12,
      critBonus: 0.48,
      color: "#27ae60", particle: "#f1c40f",
      desc: "7 präzise Pfeile – sehr hohe Krit-Chance"
    },
    {
      id: "giftpfeil", name: "Giftpfeil", slot: 1,
      cd: 7, range: 250, dmgMult: 1.85, type: "projectile_poison", dotTicks: 5, dotMult: 0.38,
      color: "#2ecc71", particle: "#27ae60",
      desc: "Vergifteter Pfeil – starker Schaden über Zeit"
    },
    {
      id: "mehrfachschuss", name: "Mehrfachschuss", slot: 2,
      cd: 6, range: 240, dmgMult: 1.3, type: "projectile_burst", count: 5, spread: 0.08,
      color: "#1e8449", particle: "#58d68d",
      desc: "5 schnelle Pfeile auf ein Ziel"
    },
    {
      id: "explosionspfeil", name: "Explosionspfeil", slot: 3,
      cd: 9, range: 255, dmgMult: 2.8, type: "projectile_explosive", radius: 85,
      color: "#e67e22", particle: "#f39c12",
      desc: "Explosiver Pfeil – Flächenschaden bei Einschlag"
    },
    {
      id: "falkenblick", name: "Falkenblick", slot: 4,
      cd: 15, range: 280, dmgMult: 4.5, type: "projectile_snipe", critBonus: 0.5,
      color: "#85c1e9", particle: "#5dade2",
      desc: "Langstrecken-Scharfschuss – extrem hoher Schaden"
    },
    {
      id: "pfeilhagel", name: "Pfeilhagel", slot: 5,
      cd: 11, range: 270, dmgMult: 1.35, type: "projectile_rain", count: 14,
      color: "#145a32", particle: "#27ae60",
      desc: "Pfeilregen – viele Treffer auf alle Gegner"
    }
  ],
  mage: [
    {
      id: "feuerball", name: "Feuerball", slot: 0,
      cd: 6, range: 220, dmgMult: 3.6, manaCost: 26, type: "projectile_explosive", radius: 95,
      color: "#e67e22", particle: "#f39c12",
      desc: "Explosiver Feuerball – hoher Flächenschaden"
    },
    {
      id: "eislanze", name: "Eislanze", slot: 1,
      cd: 5, range: 230, dmgMult: 2.4, manaCost: 18, type: "projectile_pierce",
      color: "#85c1e9", particle: "#aed6f1",
      desc: "Durchdringende Eislanze – trifft mehrere Gegner"
    },
    {
      id: "blitzschlag", name: "Blitzschlag", slot: 2,
      cd: 7, range: 200, dmgMult: 3.5, manaCost: 22, type: "magic_strike",
      color: "#f1c40f", particle: "#f9e79f",
      desc: "Blitz trifft sofort – hoher Burst-Schaden"
    },
    {
      id: "meteor", name: "Meteor", slot: 3,
      cd: 14, range: 210, dmgMult: 4.0, manaCost: 45, type: "aoe_ground", radius: 120,
      color: "#e74c3c", particle: "#922b21",
      desc: "Meteoriteneinschlag – massiver Flächenschaden"
    },
    {
      id: "frostnova", name: "Frostnova", slot: 4,
      cd: 12, range: 95, dmgMult: 2.1, manaCost: 32, type: "melee_aoe",
      slowDuration: 2.8, slowMult: 0.48,
      color: "#5dade2", particle: "#aed6f1",
      desc: "Frostnova – Eisschaden und Verlangsamung"
    },
    {
      id: "arkane_explosion", name: "Arkane Explosion", slot: 5,
      cd: 10, range: 180, dmgMult: 3.2, manaCost: 40, type: "aoe_ground", radius: 100,
      color: "#9b59b6", particle: "#bb86fc",
      desc: "Arkane Energie explodiert vor dem Magier"
    }
  ]
};

/** Erste Fähigkeit jeder Klasse ist von Anfang an freigeschaltet */
const DEFAULT_UNLOCKED = {
  warrior: ["schildschlag"],
  ranger: ["praezisionsschuss"],
  mage: ["feuerball"]
};

/** Meta-XP pro Level (kumulativ) */
function metaXpForLevel(lv) {
  return lv * lv * 20;
}

function getClassAbilities(classKey) {
  return CLASS_ABILITIES[classKey] || [];
}

function getAbilityById(classKey, id) {
  return getClassAbilities(classKey).find((a) => a.id === id) || null;
}

function getAbilityUnlockLevel(slotIndex) {
  return ABILITY_UNLOCK_LEVELS[slotIndex] || 99;
}

function getAbilityGoldCost(slotIndex) {
  return ABILITY_GOLD_COSTS[slotIndex] || 99999;
}

/** Prüft ob Meta-Level die Fähigkeit freigeschaltet hat (Slot sichtbar) */
function isAbilityLevelUnlocked(metaLevel, slotIndex) {
  return metaLevel >= getAbilityUnlockLevel(slotIndex);
}

/** Prüft ob Spieler die Fähigkeit kaufen/ausrüsten darf */
function canPurchaseAbility(metaLevel, slotIndex, totalGold, alreadyOwned) {
  if (alreadyOwned) return false;
  if (!isAbilityLevelUnlocked(metaLevel, slotIndex)) return false;
  return totalGold >= getAbilityGoldCost(slotIndex);
}
