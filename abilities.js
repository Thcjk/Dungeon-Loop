/* ============================================
   Dungeon Loop – Fähigkeitensystem
   6 Spezialfähigkeiten pro Klasse
   Freischaltung: Spezial-CD-Meilensteine (kein Gold-Kauf)
   ============================================ */

/** Spezial-CD-Stufe pro Slot – spätere Fähigkeiten brauchen deutlich mehr Investment */
const ABILITY_UNLOCK_CD_LEVELS = [0, 3, 6, 10, 14, 20];

function getAbilityUnlockSpecialCd(slotIndex) {
  return ABILITY_UNLOCK_CD_LEVELS[slotIndex] ?? 99;
}

function isAbilityUnlockedBySpecialCd(specialCdLevel, slotIndex) {
  return specialCdLevel >= getAbilityUnlockSpecialCd(slotIndex);
}

function getNextAbilityUnlockCdLevel(specialCdLevel) {
  const cdLv = Math.max(0, Math.floor(specialCdLevel || 0));
  const next = ABILITY_UNLOCK_CD_LEVELS.find((need) => need > cdLv);
  return next ?? null;
}

/** @deprecated – früher Account-Level, jetzt Spezial-CD */
function getAbilityUnlockLevel(slotIndex) {
  return getAbilityUnlockSpecialCd(slotIndex);
}

/** @deprecated – kein Gold-Kauf mehr */
function getAbilityGoldCost(slotIndex) {
  return 0;
}

function isAbilityLevelUnlocked(_metaLevel, slotIndex) {
  return slotIndex <= 5;
}

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
 * Höhere Slots = spürbar stärker (Schaden, Reichweite, Effekte).
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
      cd: 10, range: 92, dmgMult: 2.5, type: "melee_spin", hits: 4,
      color: "#c0392b", particle: "#e67e22",
      desc: "Vierfach-Wirbel – je mehr Gegner, desto härter der Treffer"
    },
    {
      id: "berserker", name: "Berserker", slot: 2,
      cd: 13, range: 85, dmgMult: 4.6, type: "melee_single", critBonus: 0.42,
      color: "#922b21", particle: "#e74c3c",
      desc: "Verheerender Einzelschlag – sehr hoher Schaden + Krit"
    },
    {
      id: "erdbeben", name: "Erdbeben", slot: 3,
      cd: 15, range: 130, dmgMult: 2.5, type: "aoe_ground", radius: 125,
      color: "#795548", particle: "#d35400",
      desc: "Massives Beben – großer Flächenschaden vor dem Helden"
    },
    {
      id: "kriegsschrei", name: "Kriegsschrei", slot: 4,
      cd: 17, range: 110, dmgMult: 1.2, type: "buff_shout", buffDuration: 8, buffMult: 1.48,
      debuffWeak: 0.30, debuffDuration: 4,
      color: "#f39c12", particle: "#f1c40f",
      desc: "Starker Angriffs-Buff + Gegner nehmen deutlich mehr Schaden"
    },
    {
      id: "klingensturm", name: "Klingensturm", slot: 5,
      cd: 11, range: 110, dmgMult: 3.1, type: "melee_aoe", pierceAll: true,
      color: "#ecf0f1", particle: "#bdc3c7",
      desc: "Ultimativer Klingenwirbel – durchdringender Massenschaden"
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
      cd: 7, range: 255, dmgMult: 2.2, type: "projectile_poison", dotTicks: 6, dotMult: 0.48,
      color: "#2ecc71", particle: "#27ae60",
      desc: "Starker Giftpfeil – hoher Sofort- und DoT-Schaden"
    },
    {
      id: "mehrfachschuss", name: "Mehrfachschuss", slot: 2,
      cd: 6, range: 250, dmgMult: 1.75, type: "projectile_burst", count: 8, spread: 0.07,
      color: "#1e8449", particle: "#58d68d",
      desc: "8 schnelle Pfeile – solider Burst auf ein Ziel"
    },
    {
      id: "explosionspfeil", name: "Explosionspfeil", slot: 3,
      cd: 9, range: 265, dmgMult: 3.5, type: "projectile_explosive", radius: 105,
      color: "#e67e22", particle: "#f39c12",
      desc: "Schwerer Explosionspfeil – großer Flächenschaden"
    },
    {
      id: "falkenblick", name: "Falkenblick", slot: 4,
      cd: 14, range: 290, dmgMult: 5.8, type: "projectile_snipe", critBonus: 0.62,
      color: "#85c1e9", particle: "#5dade2",
      desc: "Tödlicher Langstrecken-Schuss – extrem hoher Burst"
    },
    {
      id: "pfeilhagel", name: "Pfeilhagel", slot: 5,
      cd: 10, range: 280, dmgMult: 1.75, type: "projectile_rain", count: 20,
      color: "#145a32", particle: "#27ae60",
      desc: "Ultimativer Pfeilregen – trifft alle Gegner im Feld"
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
      cd: 5, range: 240, dmgMult: 3.1, manaCost: 20, type: "projectile_pierce", pierceCount: 4,
      color: "#85c1e9", particle: "#aed6f1",
      desc: "Eislanze durchbohrt bis zu 4 Gegner"
    },
    {
      id: "blitzschlag", name: "Blitzschlag", slot: 2,
      cd: 7, range: 210, dmgMult: 4.4, manaCost: 24, type: "magic_strike", chainHits: 2,
      color: "#f1c40f", particle: "#f9e79f",
      desc: "Blitz trifft sofort und springt auf 2 weitere Gegner"
    },
    {
      id: "meteor", name: "Meteor", slot: 3,
      cd: 13, range: 220, dmgMult: 5.2, manaCost: 42, type: "aoe_ground", radius: 135,
      color: "#e74c3c", particle: "#922b21",
      desc: "Massiver Meteoriteneinschlag – riesiger Flächenschaden"
    },
    {
      id: "frostnova", name: "Frostnova", slot: 4,
      cd: 11, range: 105, dmgMult: 2.9, manaCost: 30, type: "melee_aoe",
      slowDuration: 3.5, slowMult: 0.38,
      color: "#5dade2", particle: "#aed6f1",
      desc: "Starke Frostnova – hoher Schaden + lange Verlangsamung"
    },
    {
      id: "arkane_explosion", name: "Arkane Explosion", slot: 5,
      cd: 9, range: 195, dmgMult: 4.5, manaCost: 38, type: "aoe_ground", radius: 120,
      color: "#9b59b6", particle: "#bb86fc",
      desc: "Ultimative arkane Detonation – massiver Flächenschaden"
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

function getUnlockedAbilityIds(classKey, specialCdLevel) {
  const cdLv = Math.max(0, Math.floor(specialCdLevel || 0));
  return getClassAbilities(classKey)
    .filter((ab) => isAbilityUnlockedBySpecialCd(cdLv, ab.slot))
    .map((ab) => ab.id);
}
