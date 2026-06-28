/* ==========================================================================
   Dungeon Loop – Character Sprites v2.1
   Anatomie-Fokus: 20 % Kopf | 35 % Torso | 45 % Beine (16×36 Grid)
   Spieler ~36 px → ca. 10–15 % größer als Gegner (~33 px)
   ========================================================================== */

const CHR = {
  W: 16,
  H: 36,

  GRIP: {
    handR: "handR",
    handL: "handL",
    back: "back"
  },

  PAL: {
    ".": null,
    "0": "#1a1410", "1": "#2a2018", "2": "#3a3028",
    "4": "#d8b890", "5": "#b89070", "6": "#f0e0c8",
    "7": "#886040", "8": "#684830",
    "a": "#8898a8", "b": "#a0b0c0", "c": "#c0d0e0", "d": "#e0ecf8", "e": "#f8fcff", "f": "#ffffff",
    "g": "#4a6848", "h": "#5a8058", "i": "#6a9868", "j": "#7ab078", "k": "#3a4838", "l": "#2a3828",
    "m": "#806848", "n": "#a08868", "o": "#c0a888", "p": "#e0c8a8",
    "q": "#584830", "r": "#786040", "s": "#987850",
    "t": "#485868", "u": "#587888", "v": "#7098a8",
    "z": "#584878", "A": "#705898", "B": "#8870b0", "C": "#a890d0", "D": "#c8b0f0", "E": "#e8d0ff",
    "F": "#907038", "G": "#b08848", "H": "#d0a850", "I": "#f0c860",
    "J": "#684830", "K": "#886040", "L": "#a87850",
    "M": "#403830", "N": "#584840", "O": "#705850",
    "S": "#282018", "T": "#505050", "U": "#707070", "V": "#909090", "W": "#b0b0b0", "X": "#d0d0d0",
    "]": "#c84848", "[": "#a83838",
    "+": "#581818", "=": "#782828"
  },

  /** Waffen ~25–35 % der Körperhöhe (9–12 px) */
  EQUIP: {
    sword: {
      rows: [
        "..e..",
        ".eef.",
        ".eef.",
        ".ddf.",
        ".ccf.",
        ".aaF.",
        ".GGH.",
        ".JJJ.",
        "..J.."
      ],
      grip: { x: 2, y: 7 }
    },
    sword_attack: {
      rows: [
        "..e..",
        "eef..",
        "ddf..",
        ".aaF.",
        ".GGH.",
        "..J.."
      ],
      grip: { x: 2, y: 4 }
    },
    shield: {
      rows: [
        "..G..",
        ".GHH.",
        "GHIHG",
        "GHIIG",
        "GHHHG",
        ".GHH.",
        "..J.."
      ],
      grip: { x: 3, y: 4 },
      offset: { x: -1, y: 2 }
    },
    bow: {
      rows: [
        "..F..",
        ".F.F.",
        "F...F",
        "F...F",
        ".F.F.",
        "..F.."
      ],
      grip: { x: 1, y: 4 },
      offset: { x: 0, y: 0 },
      idleAngle: -0.35
    },
    bow_draw: {
      rows: [
        "..F..",
        ".Fef.",
        "Fedef",
        ".Fef.",
        "..F.."
      ],
      grip: { x: 1, y: 3 }
    },
    staff: {
      rows: [
        "..w..",
        ".wyy.",
        "wyxyw",
        ".wyy.",
        "..J..",
        "..J..",
        "..J..",
        "..J..",
        "..J.."
      ],
      grip: { x: 2, y: 7 },
      offset: { x: 1, y: 0 },
      idleAngle: -0.15
    },
    staff_cast: {
      rows: [
        "..w..",
        ".wyy.",
        "wyxyw",
        ".wyy.",
        "..J..",
        "..J.."
      ],
      grip: { x: 2, y: 5 }
    },
    orb: {
      rows: [".wyy.", "wyyxw", "wyxyw", "wyyxw", ".wyy."],
      attach: "staff_top",
      offset: { x: 0, y: -4 }
    },
    quiver: {
      rows: [".t.", "tut", "tst", "trt", ".t."],
      grip: { x: 1, y: 3 },
      offset: { x: 0, y: 0 }
    },
    spellbook: {
      rows: [".==.", "=CB=", "=CB=", ".==."],
      grip: { x: 1, y: 2 },
      offset: { x: -1, y: 1 }
    }
  },

  CLASSES: {
    warrior: {
      back: null,
      weapon: "sword",
      weaponAttack: "sword_attack",
      shield: "shield",
      offhand: null,
      orb: null,
      frames: {}
    },
    ranger: {
      back: "quiver",
      weapon: "bow",
      weaponAttack: "bow_draw",
      shield: null,
      offhand: null,
      orb: null,
      frames: {}
    },
    mage: {
      back: null,
      weapon: "staff",
      weaponAttack: "staff_cast",
      shield: null,
      offhand: "spellbook",
      orb: "orb",
      frames: {}
    }
  }
};

function chrRow(s) {
  const t = s.replace(/\s/g, "");
  if (t.length >= CHR.W) return t.slice(0, CHR.W);
  const pad = CHR.W - t.length;
  const l = Math.floor(pad / 2);
  return ".".repeat(l) + t + ".".repeat(pad - l);
}

function chrBody(rows, grips) {
  while (rows.length < CHR.H) rows.push(".".repeat(CHR.W));
  return {
    rows: rows.slice(0, CHR.H).map(chrRow),
    grips: grips || { handR: { x: 11, y: 12 }, handL: { x: 4, y: 12 }, back: { x: 8, y: 10 } }
  };
}

function chrLegWalk(rows, start, end, phase) {
  const out = rows.slice();
  for (let i = start; i <= end; i++) {
    if (phase === 0) {
      if (i <= start + 3) out[i] = out[i].replace("..cc......cc..", "..ccc....ccc..");
      else if (i <= start + 7) out[i] = out[i].replace("..cc......cc..", "...cc....cc...");
      else out[i] = out[i].replace("..cc......cc..", "..ccc....ccc..");
    } else if (phase === 1) {
      out[i] = out[i].replace("..cc......cc..", "..cc........cc");
      out[i] = out[i].replace("..ccc....ccc..", "..cc........cc");
      out[i] = out[i].replace("...cc....cc...", "..cc........cc");
    } else if (phase === 2) {
      if (i <= start + 3) out[i] = out[i].replace("..cc......cc..", "...cc....cc...");
      else if (i <= start + 7) out[i] = out[i].replace("..cc......cc..", "..ccc....ccc..");
      else out[i] = out[i].replace("..cc......cc..", "...cc....cc...");
    } else {
      out[i] = out[i].replace("..cc......cc..", "..cc........cc");
      out[i] = out[i].replace("..ccc....ccc..", "..cc........cc");
      out[i] = out[i].replace("...cc....cc...", "..cc........cc");
    }
  }
  return out;
}

/* ==========================================================================
   KRIEGER – breite Schultern, kräftige Gliedmaßen, Helm-Silhouette
   ========================================================================== */
(function buildWarrior() {
  const base = [
    /* Kopf 0–6 (~20 %) */
    "....cccccccc....",
    "...cbbdddbc.....",
    "..cbddfffdbc....",
    "..cbfeeeefbc....",
    "..cbddfffdbc....",
    "...cbbdddbc.....",
    "..ccbbbbbbcc....",
    /* Torso 7–19 (~36 %) */
    ".cabbbbbbbbca..",
    "cabbecccebbac.",
    "cabbecccebbac.",
    "cabbecccebbac.",
    ".cabbbbbbbbca..",
    "..cabbbbbba....",
    "..ccaaaaaaac...",
    "..ccaaaaaaac...",
    "...cc....cc....",
    "...cc....cc....",
    "...cc....cc....",
    "..cc......cc..",
    "...cc....cc....",
    /* Beine 20–35 (~44 %) */
    "..cc......cc..",
    "..cc......cc..",
    "..cc......cc..",
    "..cc......cc..",
    "..ccc....ccc..",
    "..ccc....ccc..",
    "..cc......cc..",
    "..cc......cc..",
    "..cc......cc..",
    "..cc......cc..",
    "...cc....cc....",
    "...cc....cc....",
    "..ccc....ccc..",
    "..ccc....ccc..",
    "...cc....cc....",
    "...cc....cc...."
  ];

  const g = { handR: { x: 12, y: 12 }, handL: { x: 3, y: 13 }, back: { x: 8, y: 9 } };

  const frames = { idle: [], walk: [], attack: [], hurt: [], death: [] };

  frames.idle = [0, 0, 1, 0].map((breath) => {
    const rows = base.slice();
    if (breath && rows[8]) rows[8] = "cabbeccccebbac.";
    return chrBody(rows, { ...g, handR: { x: 12, y: 12 + breath }, handL: { x: 3, y: 13 + breath } });
  });

  for (let f = 0; f < 4; f++) {
    const legs = chrLegWalk(base, 20, 33, f);
    frames.walk.push(chrBody(legs, {
      handR: { x: 12 + (f % 2), y: 12 + (f % 2) },
      handL: { x: 3 - (f % 2), y: 13 - (f % 2) },
      back: { x: 8, y: 9 }
    }));
  }

  for (let f = 0; f < 3; f++) {
    frames.attack.push(chrBody(base.slice(), {
      handR: { x: 13 + f, y: 11 + f },
      handL: { x: 3, y: 14 },
      back: { x: 8, y: 9 }
    }));
  }

  frames.hurt = [chrBody(base.slice(), { handR: { x: 11, y: 13 }, handL: { x: 5, y: 14 }, back: { x: 8, y: 10 } })];
  frames.death = [
    chrBody(base.map((r, i) => (i > 10 ? r.replace(/c/g, "1") : r)), g),
    chrBody(base.map((r, i) => (i > 8 ? r.replace(/c/g, "0") : r)), g)
  ];

  CHR.CLASSES.warrior.frames = frames;
})();

/* ==========================================================================
   WALDLÄUFER – Kapuze, schlanker Torso, gleiche Bein-Proportionen
   ========================================================================== */
(function buildRanger() {
  const base = [
    /* Kopf / Kapuze 0–6 */
    ".....iiii.....",
    "....iijjjii....",
    "...iijjjjjii...",
    "...iijeejjii...",
    "...iijjjjjii...",
    "....iiiiii.....",
    "..cciiiiiicc...",
    /* Torso 7–19 */
    "..ciiiiiiiic..",
    ".ciiiooooiiic.",
    ".ciiiooooiiic.",
    ".ciiiooooiiic.",
    "..ciiiiiiiic..",
    "...ciiiiiic...",
    "...chhhhhhc....",
    "...chhhhhhc....",
    "...hh....hh....",
    "...hh....hh....",
    "...hh....hh....",
    "..hh......hh..",
    "...hh....hh....",
    /* Beine 20–35 */
    "..hh......hh..",
    "..hh......hh..",
    "..hh......hh..",
    "..hh......hh..",
    "..hhh....hhh..",
    "..hhh....hhh..",
    "..hh......hh..",
    "..hh......hh..",
    "..hh......hh..",
    "..hh......hh..",
    "...hh....hh....",
    "...hh....hh....",
    "..hhh....hhh..",
    "..hhh....hhh..",
    "...hh....hh....",
    "...hh....hh...."
  ];

  const g = { handR: { x: 11, y: 12 }, handL: { x: 5, y: 12 }, back: { x: 7, y: 10 } };
  const frames = { idle: [], walk: [], attack: [], hurt: [], death: [] };

  frames.idle = [0, 0, 1, 0].map((breath) => {
    const rows = base.slice();
    if (breath && rows[8]) rows[8] = ".ciiiooooiiic.";
    return chrBody(rows, { ...g, handR: { x: 11, y: 12 + breath }, handL: { x: 5, y: 12 + breath } });
  });

  for (let f = 0; f < 4; f++) {
    const legs = base.slice();
    for (let i = 20; i <= 33; i++) {
      if (f % 2 === 0) {
        legs[i] = legs[i].replace("..hh......hh..", f % 4 === 0 ? "..hhh....hhh.." : "...hh....hh....");
      } else {
        legs[i] = legs[i].replace("..hh......hh..", "..hh........hh");
      }
    }
    frames.walk.push(chrBody(legs, {
      handR: { x: 11 + (f % 2), y: 12 },
      handL: { x: 5 - (f % 2), y: 12 + (f % 2) },
      back: { x: 7, y: 10 }
    }));
  }

  for (let f = 0; f < 3; f++) {
    frames.attack.push(chrBody(base.slice(), {
      handR: { x: 12, y: 11 },
      handL: { x: 4 - f, y: 12 },
      back: { x: 7, y: 10 }
    }));
  }

  frames.hurt = [chrBody(base.slice(), { handR: { x: 10, y: 13 }, handL: { x: 6, y: 13 }, back: { x: 7, y: 10 } })];
  frames.death = [
    chrBody(base.map((r) => r.replace(/i/g, "k")), g),
    chrBody(base.map((r) => r.replace(/[hi]/g, "l")), g)
  ];

  CHR.CLASSES.ranger.frames = frames;
})();

/* ==========================================================================
   MAGIER – Spitzhut, weite Robe, natürliche Proportionen darunter
   ========================================================================== */
(function buildMage() {
  const base = [
    /* Hut + Kopf 0–6 */
    "......BBB......",
    ".....BBEBB.....",
    "....BBBBBBB....",
    "...BBBBEBBBB...",
    "...BBB44BBB....",
    "....BBBBBBB....",
    "..ccBBBBBBcc...",
    /* Torso / Robe 7–19 */
    "..zBBBBBBBBz..",
    ".zBBBCCCCBBz.",
    ".zBBBCCCCBBz.",
    ".zBBBBBBBBBz.",
    "..zBBBBBBBBz..",
    "...zBBBBBBz....",
    "...zzzzzzzz....",
    "...zzzzzzzz....",
    "...zz....zz....",
    "...zz....zz....",
    "...zz....zz....",
    "..zz......zz..",
    "...zz....zz....",
    /* Beine / Robensaum 20–35 */
    "..zz......zz..",
    "..zz......zz..",
    "..zz......zz..",
    "..zz......zz..",
    "..zzz....zzz..",
    "..zzz....zzz..",
    "..zz......zz..",
    "..zz......zz..",
    "..zz......zz..",
    "..zz......zz..",
    "...zz....zz....",
    "...zz....zz....",
    "..zzz....zzz..",
    "..zzz....zzz..",
    "...zz....zz....",
    "...zz....zz...."
  ];

  const g = { handR: { x: 11, y: 14 }, handL: { x: 4, y: 15 }, back: { x: 8, y: 11 } };
  const frames = { idle: [], walk: [], attack: [], hurt: [], death: [] };

  frames.idle = [0, 0, 1, 0].map((breath) => {
    const rows = base.slice();
    if (breath && rows[8]) rows[8] = ".zBBBCCCCBBz.";
    return chrBody(rows, { ...g, handR: { x: 11, y: 14 + breath }, handL: { x: 4, y: 15 + breath } });
  });

  for (let f = 0; f < 4; f++) {
    const legs = base.slice();
    for (let i = 20; i <= 33; i++) {
      if (f % 2 === 0) {
        legs[i] = legs[i].replace("..zz......zz..", f % 4 === 0 ? "..zzz....zzz.." : "...zz....zz....");
      } else {
        legs[i] = legs[i].replace("..zz......zz..", "..zz........zz");
      }
    }
    frames.walk.push(chrBody(legs, {
      handR: { x: 11, y: 14 },
      handL: { x: 4 + (f % 2), y: 15 },
      back: { x: 8, y: 11 }
    }));
  }

  for (let f = 0; f < 3; f++) {
    frames.attack.push(chrBody(base.slice(), {
      handR: { x: 12 + f, y: 13 },
      handL: { x: 4, y: 15 },
      back: { x: 8, y: 11 }
    }));
  }

  frames.hurt = [chrBody(base.slice(), { handR: { x: 10, y: 15 }, handL: { x: 5, y: 16 }, back: { x: 8, y: 11 } })];
  frames.death = [
    chrBody(base.map((r) => r.replace(/z/g, "A")), g),
    chrBody(base.map((r) => r.replace(/[zB]/g, "1")), g)
  ];

  CHR.CLASSES.mage.frames = frames;
})();

CHR.getFrame = (classKey, animState, frameIndex, attacking) => {
  const cls = CHR.CLASSES[classKey] || CHR.CLASSES.warrior;
  let state = animState || "idle";
  if (attacking && cls.frames.attack?.length) state = "attack";
  const list = cls.frames[state] || cls.frames.idle || [];
  if (!list.length) return cls.frames.idle[0];
  return list[frameIndex % list.length];
};

CHR.getClassDef = (classKey) => CHR.CLASSES[classKey] || CHR.CLASSES.warrior;
