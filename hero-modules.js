/* ==========================================================================
   Dungeon Loop – Modulare Hero-Sprites
   Körper, Helm, Waffe, Schild, Umhang & Effekte als einzelne Module.
   Neue Ausrüstung/Skins/Klassen = Module tauschen, nicht ganzen Char neuzeichnen.
   ========================================================================== */

const HM = {
  /** Zeichen-Reihenfolge: hinten → vorne */
  LAYER_ORDER: [
    "cloak_back",   // Umhang / Cape (hinter Körper)
    "quiver",       // Köcher (Rücken)
    "legs",         // Beine + Stiefel
    "torso",        // Rüstung / Robe / Leder
    "arms",         // Arme (animiert, getrennt vom Torso)
    "belt",         // Gürtel, Taschen, Riemen
    "face",         // Haut / Gesicht (unter Helm)
    "helmet",       // Helm, Kapuze, Hut
    "cloak_front",  // Umhang-Teile vorne (optional)
    "shield",       // Schild (linke Hand)
    "offhand",      // Zauberbuch etc.
    "weapon",       // Hauptwaffe (rechte Hand)
    "effects"       // Runen, Aura, Glühen
  ],

  /** Ankerpunkte auf dem 22×28-Grid (HR.CX = 11) */
  ANCHORS: {
    root:   { x: 11, y: 0 },
    head:   { x: 11, y: 3 },
    torso:  { x: 11, y: 11 },
    belt:   { x: 11, y: 15 },
    legs:   { x: 11, y: 17 },
    handL:  { x: 7,  y: 12 },
    handR:  { x: 15, y: 12 },
    back:   { x: 11, y: 9 },
    feet:   { x: 11, y: 26 }
  },

  /**
   * Standard-Loadouts pro Klasse.
   * Später: hero.equipment = { helmet: 'helm_gold', weapon: 'sword_flame', ... }
   */
  LOADOUTS: {
    warrior: {
      legs: "legs_plate", torso: "torso_plate", arms: "arms_plate",
      face: "face_default", helmet: "helm_warrior", belt: "belt_warrior",
      cloak_back: "cloak_warrior", shield: "shield_round",
      weapon: "sword_broad", weapon_attack: "sword_broad_swing",
      offhand: null, effects: null, quiver: null
    },
    ranger: {
      legs: "legs_leather", torso: "torso_leather", arms: "arms_leather",
      face: "face_default", helmet: "hood_ranger", belt: "belt_ranger",
      cloak_back: "cloak_ranger", shield: null,
      weapon: "bow_long", weapon_attack: "bow_long_draw",
      offhand: null, effects: null, quiver: "quiver_standard"
    },
    mage: {
      legs: "legs_robe", torso: "torso_robe", arms: "arms_robe",
      face: "face_default", helmet: "hat_mage", belt: "belt_mage",
      cloak_back: "cloak_mage", shield: null,
      weapon: "staff_arcane", weapon_attack: "staff_arcane_cast",
      weapon_extra: "staff_orb", offhand: "spellbook", effects: "runes_arcane", quiver: null
    }
  }
};

/* ---- Modul-Typen ----
   procedural: draw(g, cx, y, pose, ctx) – zeichnet auf Body-Grid
   sprite:     { rows, ox, oy, anchor } – Pixel-Sheet mit Offset
   canvas:     draw(c, anchorX, anchorY, ...) – direkt auf Canvas (Waffen)
*/

HM.PARTS = {

  /* === BEINE === */
  legs_plate: {
    type: "procedural",
    layer: "legs",
    draw(g, cx, legY, pose) {
      hrModLegs(g, cx, legY, pose, { thigh: "U", shin: "T", boot: "M" });
    }
  },
  legs_leather: {
    type: "procedural", layer: "legs",
    draw(g, cx, legY, pose) {
      hrModLegs(g, cx, legY, pose, { thigh: "J", shin: "K", boot: "M" });
    }
  },
  legs_robe: {
    type: "procedural", layer: "legs",
    draw(g, cx, legY, pose) {
      hrModLegs(g, cx, legY, pose, { thigh: "u", shin: "v", boot: "1" });
      hrModRow(g, legY + 5, cx - 2, "0zz0");
    }
  },

  /* === TORSO === */
  torso_plate: {
    type: "procedural", layer: "torso",
    draw(g, cx, y, pose) {
      const by = pose.breath | 0;
      hrModRow(g, y + by,     cx - 4, "0S000S0");
      hrModRow(g, y + 1 + by, cx - 4, "0abb0");
      hrModRow(g, y + 2 + by, cx - 3, "cde0");
      hrModRow(g, y + 3 + by, cx - 3, "def0");
      hrModRow(g, y + 4 + by, cx - 3, "bab0");
      hrModRow(g, y + 5 + by, cx - 3, "0FGF0");
      hrModSet(g, cx - 4, y + 2 + by, "V"); hrModSet(g, cx + 4, y + 2 + by, "V");
      hrModSet(g, cx - 3, y + 3 + by, "f"); hrModSet(g, cx + 3, y + 3 + by, "e");
      hrModSet(g, cx, y + 3 + by, "f");
      hrModSet(g, cx - 4, y + 4 + by, "J"); hrModSet(g, cx + 4, y + 4 + by, "J");
    }
  },
  torso_leather: {
    type: "procedural", layer: "torso",
    draw(g, cx, y, pose) {
      const by = pose.breath | 0;
      hrModRow(g, y + by,     cx - 3, "0k0");
      hrModRow(g, y + 1 + by, cx - 3, "0mn0");
      hrModRow(g, y + 2 + by, cx - 3, "0op0");
      hrModRow(g, y + 3 + by, cx - 3, "0pq0");
      hrModRow(g, y + 4 + by, cx - 3, "0rs0");
      hrModSet(g, cx, y + 3 + by, "s");
    }
  },
  torso_robe: {
    type: "procedural", layer: "torso",
    draw(g, cx, y, pose) {
      const by = pose.breath | 0;
      hrModRow(g, y + by,     cx - 3, "0z0");
      hrModRow(g, y + 1 + by, cx - 4, "0ABA0");
      hrModRow(g, y + 2 + by, cx - 4, "0BCB0");
      hrModRow(g, y + 3 + by, cx - 4, "0BCB0");
      hrModRow(g, y + 4 + by, cx - 3, "0CB0");
      hrModSet(g, cx, y + 3 + by, "D");
    }
  },

  /* === ARME (schmal, getrennt animierbar) === */
  arms_plate: {
    type: "procedural", layer: "arms",
    draw(g, cx, y, pose) {
      hrModArm(g, cx, y, -1, pose.armL, "b", "c", "d");
      hrModArm(g, cx, y,  1, pose.armR, "b", "c", "d");
    }
  },
  arms_leather: {
    type: "procedural", layer: "arms",
    draw(g, cx, y, pose) {
      hrModArm(g, cx, y, -1, pose.armL, "n", "o", "4");
      hrModArm(g, cx, y,  1, pose.armR, "n", "o", "4");
    }
  },
  arms_robe: {
    type: "procedural", layer: "arms",
    draw(g, cx, y, pose) {
      hrModArm(g, cx, y, -1, pose.armL, "B", "A", "6");
      hrModArm(g, cx, y,  1, pose.armR, "B", "A", "6");
    }
  },

  /* === GESICHT (Haut – unter Helm/Kapuze) === */
  face_default: {
    type: "procedural", layer: "face",
    draw(g, cx, y) {
      hrModRow(g, y + 3, cx - 2, "0450");
      hrModRow(g, y + 4, cx - 2, "0560");
      hrModSet(g, cx - 1, y + 3, "8"); hrModSet(g, cx + 1, y + 3, "8");
      hrModSet(g, cx, y + 4, "5");
    }
  },

  /* === HELME / KOPF === */
  helm_warrior: {
    type: "procedural", layer: "helmet",
    draw(g, cx, y) {
      hrModRow(g, y,     cx - 3, "00000");
      hrModRow(g, y + 1, cx - 4, "0VWV0");
      hrModRow(g, y + 2, cx - 4, "0abb0");
      hrModRow(g, y + 3, cx - 3, "0cdc0");
      hrModRow(g, y + 4, cx - 3, "0cdc0");
      hrModSet(g, cx - 1, y + 3, "1"); hrModSet(g, cx + 1, y + 3, "1");
      hrModSet(g, cx, y + 4, "b");
      hrModSet(g, cx - 2, y + 2, "X"); hrModSet(g, cx + 2, y + 2, "V");
    }
  },
  hood_ranger: {
    type: "procedural", layer: "helmet",
    draw(g, cx, y, pose) {
      const sw = (pose.sway | 0) + (pose.capeWave | 0);
      hrModRow(g, y,     cx - 3, "00000");
      hrModRow(g, y + 1, cx - 4, "0kkk0");
      hrModRow(g, y + 2, cx - 4, "0kkk0");
      hrModSet(g, cx, y + 1, "j");
      hrModSet(g, cx + 3 + sw, y + 4, "8");
      hrModSet(g, cx + 4 + sw, y + 5, "7");
      hrModSet(g, cx + 2 + sw, y + 5, "6");
    }
  },
  hat_mage: {
    type: "procedural", layer: "helmet",
    draw(g, cx, y) {
      hrModRow(g, y,     cx - 3, "0AAA0");
      hrModRow(g, y + 1, cx - 4, "0ABBA0");
      hrModRow(g, y + 2, cx - 4, "0zAAz0");
      hrModSet(g, cx, y + 2, "C");
    }
  },

  /* === GÜRTEL === */
  belt_warrior: {
    type: "procedural", layer: "belt",
    draw(g, cx, y) {
      hrModRow(g, y, cx - 3, "0HI0");
      hrModSet(g, cx - 4, y, "F"); hrModSet(g, cx + 4, y, "F");
      hrModRow(g, y + 1, cx - 2, "0H0");
    }
  },
  belt_ranger: {
    type: "procedural", layer: "belt",
    draw(g, cx, y) {
      hrModRow(g, y, cx - 2, "0F0");
      hrModSet(g, cx - 3, y, "q"); hrModSet(g, cx + 3, y, "t");
    }
  },
  belt_mage: {
    type: "procedural", layer: "belt",
    draw(g, cx, y) {
      hrModRow(g, y, cx - 2, "0=0");
      hrModSet(g, cx - 3, y, "+"); hrModSet(g, cx + 3, y, "+");
    }
  },

  /* === UMHÄNGE (Rückseite) === */
  cloak_warrior: {
    type: "procedural", layer: "cloak_back",
    draw(g, cx, y, pose) {
      const sw = (pose.sway | 0) + (pose.capeWave | 0);
      hrModSet(g, cx - 5, y + 3 + sw, "q");
      hrModSet(g, cx - 5, y + 4 + sw, "r");
      hrModSet(g, cx - 4, y + 5 + sw, "s");
      hrModSet(g, cx + 5, y + 3 - sw, "q");
      hrModSet(g, cx + 4, y + 4 - sw, "r");
    }
  },
  cloak_ranger: {
    type: "procedural", layer: "cloak_back",
    draw(g, cx, y, pose) {
      const sw = (pose.sway | 0) + (pose.capeWave | 0);
      hrModSet(g, cx - 6, y + 2 + sw, "k");
      hrModSet(g, cx - 6, y + 3 + sw, "l");
      hrModSet(g, cx - 5, y + 4 + sw, "k");
      hrModSet(g, cx - 4, y + 5 + sw, "j");
      hrModSet(g, cx + 6, y + 2 - sw, "k");
      hrModSet(g, cx + 6, y + 3 - sw, "l");
      hrModSet(g, cx + 5, y + 4 - sw, "k");
    }
  },
  cloak_mage: {
    type: "procedural", layer: "cloak_back",
    draw(g, cx, y, pose) {
      const sw = (pose.sway | 0) + (pose.capeWave | 0);
      hrModSet(g, cx - 6, y + 1 + sw, "z");
      hrModSet(g, cx - 6, y + 2 + sw, "A");
      hrModSet(g, cx - 5, y + 3 + sw, "B");
      hrModSet(g, cx - 5, y + 4 + sw, "z");
      hrModSet(g, cx - 4, y + 5 + sw, "A");
      hrModSet(g, cx + 6, y + 1 - sw, "z");
      hrModSet(g, cx + 6, y + 2 - sw, "A");
      hrModSet(g, cx + 5, y + 3 - sw, "B");
    }
  }
};

/** Waffen, Schilde, Accessoires – eigene Pixel-Sheets (Canvas-Layer) */
HM.ITEMS = {
  sword_broad: {
    layer: "weapon", slot: "weapon", z: "front",
    rows: [
      "....00....","...0ff0...","...0ef0...","...0ef0...","...0de0...",
      "...0de0...","...0cd0...","...0bc0...","...0ab0...","...0FF0...",
      "...0GG0...","...0HH0...","...0JJ0...","...0JJ0...","....00...."
    ],
    grip: { x: 2, y: 13 }, attach: "handR", idleAngle: -0.7
  },
  sword_broad_swing: {
    layer: "weapon", slot: "weapon_attack", z: "front",
    rows: [
      "....00....","..0eef0...",".0eeef0...","0eef0.....","0de0......",
      "0cd0......",".0bc0.....","..0FF0....","...0GG0...","....00...."
    ],
    grip: { x: 2, y: 8 }, attach: "handR"
  },
  shield_round: {
    layer: "shield", slot: "shield", z: "back",
    rows: [
      "....00....","...0GF0...","..0GHH0..","..0HIU0..","..0HIP0..",
      "..0HIU0..","..0GHH0..","...0GF0...","...0JJ0...","...0JJ0...",
      "....00...."
    ],
    attach: "handL", offset: { x: -10, y: -4 }
  },
  bow_long: {
    layer: "weapon", slot: "weapon", z: "front",
    rows: [
      ".....0....","....0F0...","...0F.F0..","..0F...F0.","..0F...F0.",
      "...0F.F0..","....0F0...",".....0....","...0tt0...","...0ss0..."
    ],
    grip: { x: 2, y: 7 }, attach: "handR", idleAngle: -0.5
  },
  bow_long_draw: {
    layer: "weapon", slot: "weapon_attack", z: "front",
    rows: [
      ".....0....","....0F0...","...0Fef0..","..0FedeF0.","..0FedeF0.",
      "...0Fef0..","....0F0...",".....0...."
    ],
    grip: { x: 2, y: 6 }, attach: "handR"
  },
  arrow_standard: {
    layer: "weapon", slot: "weapon_extra", z: "front",
    rows: ["..0..",".0e0.","0ede0",".0e0.","..0.."],
    attach: "handR", offset: { x: 6, y: -8 }, onlyWhen: "attack"
  },
  staff_arcane: {
    layer: "weapon", slot: "weapon", z: "front",
    rows: [
      "....00....","...0JJ0...","...0HH0...","...0GG0...","...0FF0...",
      "...0FF0...","...0JJ0...","...0JJ0...","...0JJ0...","...0JJ0...",
      "...0JJ0...","....00...."
    ],
    grip: { x: 2, y: 11 }, attach: "handR", idleAngle: -0.4
  },
  staff_orb: {
    layer: "weapon", slot: "weapon_extra", z: "front",
    rows: ["...0ww0...","..0wyyw0..","..0wyxyw0.","..0wyyw0..","...0ww0..."],
    attach: "handR", offset: { x: -2, y: -24 }, onlyWhen: "idle"
  },
  staff_arcane_cast: {
    layer: "weapon", slot: "weapon_attack", z: "front",
    rows: [
      "....00....","...0JJ0...","..0wyyw0..",".0wyxxyw0.",".0wyyyyw0.",
      "..0wyyw0..","...0ww0...","...0JJ0..."
    ],
    grip: { x: 2, y: 7 }, attach: "handR"
  },
  spellbook: {
    layer: "offhand", slot: "offhand", z: "front",
    rows: ["..00..",".0==0.",".0CB0.",".0CB0.","..00.."],
    attach: "handL", offset: { x: -10, y: 2 }
  },
  quiver_standard: {
    layer: "quiver", slot: "quiver", z: "back",
    rows: [".0..","0t0.","0s0.","0r0.","0q0.",".0.."],
    attach: "back", offset: { x: 6, y: -8 }
  }
};

/** Effekt-Module (Canvas-only, kein Grid) */
HM.EFFECTS = {
  runes_arcane: {
    layer: "effects",
    draw(c, ax, ay, frame, attacking) {
      if (!attacking && frame % 3 !== 0) return;
      c.save();
      c.globalAlpha = attacking ? 0.7 : 0.25;
      c.fillStyle = attacking ? "#c8a8f0" : "#8868b8";
      const t = frame * 0.8;
      [[-8, -14], [8, -12], [0, -18]].forEach(([ox, oy], i) => {
        c.fillRect(ax + ox + Math.sin(t + i) * 2, ay + oy + Math.cos(t + i) * 2, 2, 2);
      });
      c.restore();
    }
  },
  staff_glow: {
    layer: "effects",
    draw(c, ax, ay, frame, attacking) {
      if (!attacking) return;
      c.save();
      c.globalAlpha = 0.55;
      c.fillStyle = "#88d8f0";
      c.beginPath(); c.arc(ax, ay - 22, 5, 0, Math.PI * 2); c.fill();
      c.globalAlpha = 0.25;
      c.beginPath(); c.arc(ax, ay - 22, 9, 0, Math.PI * 2); c.fill();
      c.restore();
    }
  }
};

/* ---- Modul-Hilfsfunktionen (Grid 22×28) ---- */

function hrModBlank() {
  return Array(HR.NH).fill(null).map(() => ".".repeat(HR.NW).split(""));
}

function hrModSet(g, x, y, ch) {
  if (y < 0 || y >= HR.NH || x < 0 || x >= HR.NW || !ch || ch === ".") return;
  g[y][x] = ch;
}

function hrModRow(g, y, x0, str) {
  for (let i = 0; i < str.length; i++) hrModSet(g, x0 + i, y, str[i]);
}

function hrModLegs(g, cx, legY, pose, cols) {
  hrModLeg(g, cx, legY, -1, pose.legL, cols);
  hrModLeg(g, cx, legY,  1, pose.legR, cols);
}

function hrModLeg(g, cx, y, side, phase, cols) {
  const s = side < 0 ? -1 : 1;
  const px = cx + s * 1 + (phase * s | 0);
  const py = y + Math.max(0, phase);
  hrModSet(g, px, py, "0");
  hrModSet(g, px, py + 1, cols.thigh);
  hrModSet(g, px, py + 2, cols.shin);
  hrModSet(g, px, py + 3, cols.boot);
  hrModSet(g, px + (phase > 0 ? s : 0), py + 4, cols.boot);
}

function hrModArm(g, cx, y, side, swing, upper, lower, hand) {
  const s = side < 0 ? -1 : 1;
  const ax = cx + s * 4 + (swing * s | 0);
  const ay = y + 1 - Math.abs(swing >> 1);
  hrModSet(g, ax, ay, "0");
  hrModSet(g, ax, ay + 1, upper);
  hrModSet(g, ax, ay + 2, lower);
  hrModSet(g, ax, ay + 3, hand);
}

/* ---- Loadout-API (für spätere Skins / Loot-Ausrüstung) ---- */

/** Aktuelles Loadout einer Klasse (+ optionale Overrides vom Helden) */
HM.getLoadout = (classKey, overrides) => {
  const base = { ...(HM.LOADOUTS[classKey] || HM.LOADOUTS.warrior) };
  if (overrides) Object.assign(base, overrides);
  return base;
};

/** Neues Körper-Modul registrieren (z. B. legs_dragon) */
HM.registerPart = (id, def) => { HM.PARTS[id] = def; };

/** Neues Item registrieren (z. B. sword_flame) */
HM.registerItem = (id, def) => { HM.ITEMS[id] = def; };

/** Neues Loadout / Skin für Klasse */
HM.registerLoadout = (classKey, loadout) => { HM.LOADOUTS[classKey] = loadout; };

/** Körper-Grid aus modularen Parts zusammensetzen */
HM.composeBodyGrid = (loadout, pose) => {
  const g = hrModBlank();
  const cx = HR.CX;
  const headY  = 1 + pose.drop;
  const torsoY = 7 + pose.drop + (pose.death > 1 ? 2 : 0);
  const beltY  = 14 + pose.drop + (pose.death > 1 ? 2 : 0);
  const legY   = 16 + pose.drop + (pose.death > 2 ? 2 : 0);
  const ctx = { cx, headY, torsoY, beltY, legY, pose };

  HM.LAYER_ORDER.forEach((layerKey) => {
    if (layerKey === "shield" || layerKey === "weapon" || layerKey === "offhand" ||
        layerKey === "quiver" || layerKey === "effects") return;
    const partId = loadout[layerKey];
    if (!partId) return;
    const part = HM.PARTS[partId];
    if (!part || part.type !== "procedural") return;
    const anchorY = layerKey === "face" || layerKey === "helmet" ? headY
      : layerKey === "belt" ? beltY
      : layerKey === "legs" ? legY
      : layerKey === "cloak_back" ? torsoY - 2
      : torsoY;
    part.draw(g, cx, anchorY, pose, ctx);
  });

  if (pose.death > 3) hrModRow(g, legY + 4, cx - 4, "0000000");
  return g.map((r) => r.join(""));
};

/** Canvas-Layer in Rücken- und Vordergrund trennen */
HM.collectCanvasLayers = (loadout, pose, attacking) => {
  const back = [], front = [], effects = [];
  const addItem = (itemId, slotKey) => {
    if (!itemId) return;
    const item = HM.ITEMS[itemId];
    if (!item) return;
    if (item.onlyWhen === "attack" && !attacking) return;
    if (item.onlyWhen === "idle" && attacking) return;
    const entry = { kind: "item", item, slot: slotKey };
    if (item.z === "back") back.push(entry);
    else front.push(entry);
  };

  addItem(loadout.shield, "shield");
  addItem(loadout.quiver, "quiver");
  if (attacking) {
    addItem(loadout.weapon_attack, "weapon");
  } else {
    addItem(loadout.weapon, "weapon");
    addItem(loadout.weapon_extra, "weapon_extra");
  }
  addItem(loadout.offhand, "offhand");
  if (attacking && loadout.weapon_attack === "bow_long_draw") {
    addItem("arrow_standard", "arrow");
  }

  if (loadout.effects && HM.EFFECTS[loadout.effects]) {
    effects.push({ kind: "effect", effect: HM.EFFECTS[loadout.effects] });
  }
  if (attacking && loadout.weapon_attack === "staff_arcane_cast") {
    effects.push({ kind: "effect", effect: HM.EFFECTS.staff_glow });
  }
  return { back, front, effects };
};

HM.getAnchor = (name, icy, pose) => {
  const a = HM.ANCHORS[name] || HM.ANCHORS.torso;
  return { x: a.x, y: icy - 14 + a.y + (pose.breath || 0) };
};
