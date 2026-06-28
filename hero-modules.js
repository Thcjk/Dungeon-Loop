/* ==========================================================================
   Dungeon Loop – Modulare Hero-Sprites (Spec: schlanke Silhouette, Klassen-Design)
   ========================================================================== */

const HM = {
  LAYER_ORDER: [
    "cloak_back", "quiver", "legs", "torso", "arms", "belt",
    "face", "helmet", "cloak_front", "shield", "offhand", "weapon", "effects"
  ],

  ANCHORS: {
    root:   { x: 11, y: 0 },
    head:   { x: 11, y: 2 },
    torso:  { x: 11, y: 10 },
    belt:   { x: 11, y: 13 },
    legs:   { x: 11, y: 15 },
    handL:  { x: 8,  y: 10 },
    handR:  { x: 14, y: 10 },
    back:   { x: 11, y: 8 },
    feet:   { x: 11, y: 24 }
  },

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

HM.PARTS = {

  legs_plate: {
    type: "procedural", layer: "legs",
    draw(g, cx, legY, pose) {
      hrModLegs(g, cx, legY, pose, { thigh: "W", shin: "X", boot: "N" });
    }
  },
  legs_leather: {
    type: "procedural", layer: "legs",
    draw(g, cx, legY, pose) {
      hrModLegs(g, cx, legY, pose, { thigh: "%", shin: "^", boot: "q" });
    }
  },
  legs_robe: {
    type: "procedural", layer: "legs",
    draw(g, cx, legY, pose) {
      hrModLegs(g, cx, legY, pose, { thigh: "u", shin: "v", boot: "1" });
      hrModRow(g, legY + 4, cx - 1, "0B0");
    }
  },

  torso_plate: {
    type: "procedural", layer: "torso",
    draw(g, cx, y, pose) {
      const by = pose.breath | 0;
      hrModRow(g, y + by,     cx - 2, "0ab0");
      hrModRow(g, y + 1 + by, cx - 2, "cdc0");
      hrModRow(g, y + 2 + by, cx - 2, "def0");
      hrModRow(g, y + 3 + by, cx - 2, "bab0");
      hrModSet(g, cx, y + 1 + by, "f");
      hrModSet(g, cx, y + 2 + by, "e");
      hrModSet(g, cx - 2, y + 2 + by, "V");
      hrModSet(g, cx + 2, y + 2 + by, "V");
      hrModSet(g, cx, y + 3 + by, "]");
    }
  },
  torso_leather: {
    type: "procedural", layer: "torso",
    draw(g, cx, y, pose) {
      const by = pose.breath | 0;
      hrModRow(g, y + by,     cx - 2, "0h0");
      hrModRow(g, y + 1 + by, cx - 2, "0ij0");
      hrModRow(g, y + 2 + by, cx - 2, "0op0");
      hrModRow(g, y + 3 + by, cx - 2, "0pq0");
      hrModSet(g, cx, y + 2 + by, "p");
    }
  },
  torso_robe: {
    type: "procedural", layer: "torso",
    draw(g, cx, y, pose) {
      const by = pose.breath | 0;
      hrModRow(g, y + by,     cx - 2, "0z0");
      hrModRow(g, y + 1 + by, cx - 2, "ABA");
      hrModRow(g, y + 2 + by, cx - 2, "BCB");
      hrModRow(g, y + 3 + by, cx - 2, "CDC");
      hrModSet(g, cx, y + 2 + by, "E");
      hrModSet(g, cx, y + 1 + by, "D");
    }
  },

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
      hrModArm(g, cx, y, -1, pose.armL, "h", "i", "4");
      hrModArm(g, cx, y,  1, pose.armR, "h", "i", "4");
    }
  },
  arms_robe: {
    type: "procedural", layer: "arms",
    draw(g, cx, y, pose) {
      hrModArm(g, cx, y, -1, pose.armL, "B", "A", "6");
      hrModArm(g, cx, y,  1, pose.armR, "B", "A", "6");
    }
  },

  face_default: {
    type: "procedural", layer: "face",
    draw(g, cx, y) {
      hrModSet(g, cx - 1, y + 3, "4");
      hrModSet(g, cx + 1, y + 3, "4");
      hrModSet(g, cx, y + 3, "6");
      hrModSet(g, cx, y + 4, "5");
    }
  },

  helm_warrior: {
    type: "procedural", layer: "helmet",
    draw(g, cx, y) {
      hrModRow(g, y,     cx - 2, "0V0");
      hrModRow(g, y + 1, cx - 2, "abc");
      hrModRow(g, y + 2, cx - 2, "cdc");
      hrModSet(g, cx - 1, y + 2, "1");
      hrModSet(g, cx + 1, y + 2, "1");
      hrModSet(g, cx, y + 2, "f");
      hrModSet(g, cx - 2, y + 1, "X");
    }
  },
  hood_ranger: {
    type: "procedural", layer: "helmet",
    draw(g, cx, y, pose) {
      const sw = (pose.sway | 0) + (pose.capeWave | 0);
      hrModRow(g, y,     cx - 2, "0i0");
      hrModRow(g, y + 1, cx - 2, "iji");
      hrModRow(g, y + 2, cx - 2, "hhh");
      hrModSet(g, cx, y + 1, "j");
      hrModSet(g, cx + 2 + sw, y + 4, "7");
      hrModSet(g, cx + 3 + sw, y + 5, "6");
    }
  },
  hat_mage: {
    type: "procedural", layer: "helmet",
    draw(g, cx, y) {
      hrModRow(g, y,     cx - 2, "AAA");
      hrModRow(g, y + 1, cx - 2, "BCB");
      hrModSet(g, cx, y + 1, "E");
      hrModSet(g, cx, y, "D");
    }
  },

  belt_warrior: {
    type: "procedural", layer: "belt",
    draw(g, cx, y) {
      hrModRow(g, y, cx - 2, "HI");
      hrModSet(g, cx - 3, y, "F");
      hrModSet(g, cx + 3, y, "F");
    }
  },
  belt_ranger: {
    type: "procedural", layer: "belt",
    draw(g, cx, y) {
      hrModRow(g, y, cx - 1, "G");
      hrModSet(g, cx - 2, y, "q");
      hrModSet(g, cx + 2, y, "t");
    }
  },
  belt_mage: {
    type: "procedural", layer: "belt",
    draw(g, cx, y) {
      hrModRow(g, y, cx - 1, "=");
      hrModSet(g, cx - 2, y, "+");
      hrModSet(g, cx + 2, y, "+");
    }
  },

  cloak_warrior: {
    type: "procedural", layer: "cloak_back",
    draw(g, cx, y, pose) {
      const sw = (pose.sway | 0) + (pose.capeWave | 0);
      hrModSet(g, cx - 4, y + 2 + sw, "q");
      hrModSet(g, cx - 4, y + 3 + sw, "r");
      hrModSet(g, cx + 4, y + 2 - sw, "q");
    }
  },
  cloak_ranger: {
    type: "procedural", layer: "cloak_back",
    draw(g, cx, y, pose) {
      const sw = (pose.sway | 0) + (pose.capeWave | 0);
      hrModSet(g, cx - 5, y + 1 + sw, "k");
      hrModSet(g, cx - 5, y + 2 + sw, "l");
      hrModSet(g, cx + 5, y + 1 - sw, "k");
    }
  },
  cloak_mage: {
    type: "procedural", layer: "cloak_back",
    draw(g, cx, y, pose) {
      const sw = (pose.sway | 0) + (pose.capeWave | 0);
      hrModSet(g, cx - 5, y + 1 + sw, "z");
      hrModSet(g, cx - 5, y + 2 + sw, "A");
      hrModSet(g, cx + 5, y + 1 - sw, "z");
    }
  }
};

/** Waffen – proportional zum schlanken Körper, mit Metall/Lichtreflexen */
HM.ITEMS = {
  sword_broad: {
    layer: "weapon", slot: "weapon", z: "front",
    rows: [
      "..0..",".0f0.",".0ef.",".0de.",".0cd.",
      ".0bc.",".0ab.",".0FF.",".0GG.",".0JJ.","..0.."
    ],
    grip: { x: 1, y: 9 }, attach: "handR", idleAngle: -0.75
  },
  sword_broad_swing: {
    layer: "weapon", slot: "weapon_attack", z: "front",
    rows: [
      "..0..","0eef.","0eef0","0de..","0cd..",
      ".0bc.",".0FF.","..0G.","..0.."
    ],
    grip: { x: 1, y: 6 }, attach: "handR"
  },
  shield_round: {
    layer: "shield", slot: "shield", z: "back",
    rows: [
      "..0..",".0GF.","0GHH0","0HIP0","0GHH0",
      ".0GF.",".0JJ.","..0.."
    ],
    attach: "handL", offset: { x: -8, y: -3 }
  },
  bow_long: {
    layer: "weapon", slot: "weapon", z: "front",
    rows: [
      "..0..",".0F.","0F.F0","0F..F","0F.F0",
      ".0F.",".0t.","..0.."
    ],
    grip: { x: 1, y: 5 }, attach: "handR", idleAngle: -0.55
  },
  bow_long_draw: {
    layer: "weapon", slot: "weapon_attack", z: "front",
    rows: [
      "..0..",".0F.","0Fef0","0Fede","0Fef0",
      ".0F.","..0.."
    ],
    grip: { x: 1, y: 4 }, attach: "handR"
  },
  arrow_standard: {
    layer: "weapon", slot: "weapon_extra", z: "front",
    rows: [".0.","0e0","ede","0e0",".0."],
    attach: "handR", offset: { x: 5, y: -6 }, onlyWhen: "attack"
  },
  staff_arcane: {
    layer: "weapon", slot: "weapon", z: "front",
    rows: [
      "..0..",".0JJ.",".0HH.",".0GG.",".0FF.",
      ".0JJ.",".0JJ.",".0JJ.","..0.."
    ],
    grip: { x: 1, y: 7 }, attach: "handR", idleAngle: -0.45
  },
  staff_orb: {
    layer: "weapon", slot: "weapon_extra", z: "front",
    rows: [".0ww.","0wyyw","0wyxw","0wyyw",".0ww."],
    attach: "handR", offset: { x: -1, y: -18 }, onlyWhen: "idle"
  },
  staff_arcane_cast: {
    layer: "weapon", slot: "weapon_attack", z: "front",
    rows: [
      "..0..",".0JJ.","0wyyw","0wyxy","0wyyw",
      ".0ww.","..0.."
    ],
    grip: { x: 1, y: 5 }, attach: "handR"
  },
  spellbook: {
    layer: "offhand", slot: "offhand", z: "front",
    rows: [".00.","0==0","0CB0","0CB0",".00."],
    attach: "handL", offset: { x: -8, y: 1 }
  },
  quiver_standard: {
    layer: "quiver", slot: "quiver", z: "back",
    rows: [".0.","0t0","0s0","0r0",".0."],
    attach: "back", offset: { x: 5, y: -6 }
  }
};

HM.EFFECTS = {
  runes_arcane: {
    layer: "effects",
    draw(c, ax, ay, frame, attacking) {
      c.save();
      c.globalAlpha = attacking ? 0.75 : 0.35;
      c.fillStyle = attacking ? "#d8b8ff" : "#a888e0";
      const t = frame * 0.8;
      [[-6, -12], [6, -10], [0, -16]].forEach(([ox, oy], i) => {
        c.fillRect(ax + ox + Math.sin(t + i) * 1.5, ay + oy + Math.cos(t + i) * 1.5, 2, 2);
      });
      c.restore();
    }
  },
  staff_glow: {
    layer: "effects",
    draw(c, ax, ay, frame, attacking) {
      if (!attacking) return;
      c.save();
      c.globalAlpha = 0.6;
      c.fillStyle = "#98e8ff";
      c.beginPath(); c.arc(ax, ay - 16, 4, 0, Math.PI * 2); c.fill();
      c.globalAlpha = 0.25;
      c.beginPath(); c.arc(ax, ay - 16, 7, 0, Math.PI * 2); c.fill();
      c.restore();
    }
  }
};

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
  const px = cx + (phase * s | 0);
  const py = y + Math.max(0, phase);
  hrModSet(g, px, py, cols.thigh);
  hrModSet(g, px, py + 1, cols.shin);
  hrModSet(g, px + (phase > 0 ? s : 0), py + 2, cols.boot);
  hrModSet(g, px + (phase > 0 ? s : 0), py + 3, cols.boot);
}

function hrModArm(g, cx, y, side, swing, upper, lower, hand) {
  const s = side < 0 ? -1 : 1;
  const ax = cx + s * 3 + (swing * s | 0);
  const ay = y + 1 - Math.abs(swing >> 1);
  hrModSet(g, ax, ay, upper);
  hrModSet(g, ax, ay + 1, lower);
  hrModSet(g, ax, ay + 2, hand);
}

HM.getLoadout = (classKey, overrides) => {
  const base = { ...(HM.LOADOUTS[classKey] || HM.LOADOUTS.warrior) };
  if (overrides) Object.assign(base, overrides);
  return base;
};

HM.registerPart = (id, def) => { HM.PARTS[id] = def; };
HM.registerItem = (id, def) => { HM.ITEMS[id] = def; };
HM.registerLoadout = (classKey, loadout) => { HM.LOADOUTS[classKey] = loadout; };

HM.composeBodyGrid = (loadout, pose) => {
  const g = hrModBlank();
  const cx = HR.CX;
  const headY  = 2 + pose.drop;
  const torsoY = 8 + pose.drop + (pose.death > 1 ? 2 : 0);
  const beltY  = 13 + pose.drop + (pose.death > 1 ? 2 : 0);
  const legY   = 15 + pose.drop + (pose.death > 2 ? 2 : 0);
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

  if (pose.death > 3) hrModRow(g, legY + 3, cx - 3, "00000");
  return g.map((r) => r.join(""));
};

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

HM.getAnchor = (name, rawDx, rawDy, pose, flip) => {
  const a = HM.ANCHORS[name] || HM.ANCHORS.torso;
  const gx = flip ? HR.NW - 1 - a.x : a.x;
  const breath = (pose?.breath | 0) * HR.SCALE;
  return {
    x: rawDx + gx * HR.SCALE,
    y: rawDy + a.y * HR.SCALE + breath
  };
};
