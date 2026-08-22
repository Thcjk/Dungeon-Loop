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
 * Slot 0 = Startfähig (kein One-Tap auf Bosse). Spätere Slots = Upgrade-Belohnung.
 */
const CLASS_ABILITIES = {
  warrior: [
    {
      id: "schildschlag", name: "Schildschlag", slot: 0,
      cd: 8, range: 95, dmgMult: 1.85, type: "melee_aoe",
      color: "#e74c3c", particle: "#f1c40f",
      shieldReduction: 0.28, shieldDuration: 3.5,
      debuffWeak: 0.18, debuffDuration: 2.5,
      desc: "360°-Schildhieb – solider Startschaden + Schild + Schwächung"
    },
    {
      id: "wirbelangriff", name: "Wirbelangriff", slot: 1,
      cd: 10, range: 92, dmgMult: 2.15, type: "melee_spin", hits: 4,
      color: "#c0392b", particle: "#e67e22",
      desc: "Vierfach-Wirbel – je mehr Gegner, desto härter der Treffer"
    },
    {
      id: "berserker", name: "Berserker", slot: 2,
      cd: 13, range: 85, dmgMult: 3.8, type: "melee_single", critBonus: 0.35,
      color: "#922b21", particle: "#e74c3c",
      desc: "Starker Einzelschlag – hoher Schaden + Krit"
    },
    {
      id: "erdbeben", name: "Erdbeben", slot: 3,
      cd: 15, range: 130, dmgMult: 2.3, type: "aoe_ground", radius: 125,
      color: "#795548", particle: "#d35400",
      desc: "Massives Beben – großer Flächenschaden vor dem Helden"
    },
    {
      id: "kriegsschrei", name: "Kriegsschrei", slot: 4,
      cd: 17, range: 110, dmgMult: 1.15, type: "buff_shout", buffDuration: 8, buffMult: 1.4,
      debuffWeak: 0.28, debuffDuration: 4,
      color: "#f39c12", particle: "#f1c40f",
      desc: "Angriffs-Buff + Gegner nehmen deutlich mehr Schaden"
    },
    {
      id: "klingensturm", name: "Klingensturm", slot: 5,
      cd: 11, range: 110, dmgMult: 2.8, type: "melee_aoe", pierceAll: true,
      color: "#ecf0f1", particle: "#bdc3c7",
      desc: "Ultimativer Klingenwirbel – durchdringender Massenschaden"
    }
  ],
  ranger: [
    {
      id: "praezisionsschuss", name: "Präzisionsschuss", slot: 0,
      cd: 5, range: 260, dmgMult: 1.35, type: "projectile_burst", count: 4, spread: 0.12,
      critBonus: 0.28,
      color: "#27ae60", particle: "#f1c40f",
      desc: "4 präzise Pfeile – guter Start-Burst, kein Boss-Delete"
    },
    {
      id: "giftpfeil", name: "Giftpfeil", slot: 1,
      cd: 7, range: 255, dmgMult: 1.9, type: "projectile_poison", dotTicks: 5, dotMult: 0.4,
      color: "#2ecc71", particle: "#27ae60",
      desc: "Giftpfeil – Sofort- und DoT-Schaden"
    },
    {
      id: "mehrfachschuss", name: "Mehrfachschuss", slot: 2,
      cd: 6, range: 250, dmgMult: 1.55, type: "projectile_burst", count: 6, spread: 0.07,
      color: "#1e8449", particle: "#58d68d",
      desc: "6 schnelle Pfeile – solider Burst auf ein Ziel"
    },
    {
      id: "explosionspfeil", name: "Explosionspfeil", slot: 3,
      cd: 9, range: 265, dmgMult: 2.9, type: "projectile_explosive", radius: 100,
      color: "#e67e22", particle: "#f39c12",
      desc: "Explosionspfeil – Flächenschaden"
    },
    {
      id: "falkenblick", name: "Falkenblick", slot: 4,
      cd: 14, range: 290, dmgMult: 4.6, type: "projectile_snipe", critBonus: 0.5,
      color: "#85c1e9", particle: "#5dade2",
      desc: "Langstrecken-Schuss – hoher Burst als CD-Belohnung"
    },
    {
      id: "pfeilhagel", name: "Pfeilhagel", slot: 5,
      cd: 10, range: 280, dmgMult: 1.45, type: "projectile_rain", count: 16,
      color: "#145a32", particle: "#27ae60",
      desc: "Ultimativer Pfeilregen – trifft alle Gegner im Feld"
    }
  ],
  mage: [
    {
      id: "feuerball", name: "Feuerball", slot: 0,
      cd: 6, range: 220, dmgMult: 2.35, manaCost: 26, type: "projectile_explosive", radius: 90,
      color: "#e67e22", particle: "#f39c12",
      desc: "Explosiver Feuerball – stark, aber kein One-Tap auf Bosse"
    },
    {
      id: "eislanze", name: "Eislanze", slot: 1,
      cd: 5, range: 240, dmgMult: 2.5, manaCost: 20, type: "projectile_pierce", pierceCount: 4,
      color: "#85c1e9", particle: "#aed6f1",
      desc: "Eislanze durchbohrt bis zu 4 Gegner"
    },
    {
      id: "blitzschlag", name: "Blitzschlag", slot: 2,
      cd: 7, range: 210, dmgMult: 3.5, manaCost: 24, type: "magic_strike", chainHits: 2,
      color: "#f1c40f", particle: "#f9e79f",
      desc: "Blitz trifft sofort und springt auf 2 weitere Gegner"
    },
    {
      id: "meteor", name: "Meteor", slot: 3,
      cd: 13, range: 220, dmgMult: 4.2, manaCost: 42, type: "aoe_ground", radius: 130,
      color: "#e74c3c", particle: "#922b21",
      desc: "Meteoriteneinschlag – großer Flächenschaden"
    },
    {
      id: "frostnova", name: "Frostnova", slot: 4,
      cd: 11, range: 105, dmgMult: 2.5, manaCost: 30, type: "melee_aoe",
      slowDuration: 3.5, slowMult: 0.38,
      color: "#5dade2", particle: "#aed6f1",
      desc: "Frostnova – Schaden + lange Verlangsamung"
    },
    {
      id: "arkane_explosion", name: "Arkane Explosion", slot: 5,
      cd: 9, range: 195, dmgMult: 3.8, manaCost: 38, type: "aoe_ground", radius: 115,
      color: "#9b59b6", particle: "#bb86fc",
      desc: "Arkane Detonation – starker Flächenschaden"
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
