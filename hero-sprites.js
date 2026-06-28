/* ==========================================================================
   Dungeon Loop – Character Sprites v2
   Vollständige Körper-Sprites pro Klasse + Equipment als separate Layer.
   Proportionen: ~20 % Kopf | 35 % Torso | 35 % Beine | 10 % Fuß
   Grid 16×36 → ~36 px Kampfhöhe bei Scale 1.0
   ========================================================================== */

const CHR = {
  W: 16,
  H: 36,

  /** Griffpunkte pro Frame (relativ zum Sprite, vor Flip) */
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

  /** Equipment-Sprites – Griffpunkt = Pixel in rows, der an Hand-Raster haftet */
  EQUIP: {
    sword: {
      rows: [
        "..e..",".eef.",".eef.",".ddf.",".ccf.",
        ".bbf.",".aaF.",".GGH.",".HHI.",".JJJ.",
        ".JJJ.","..J.."
      ],
      grip: { x: 2, y: 10 }
    },
    sword_attack: {
      rows: [
        "..e..","eef..","eef0.","ddf..","ccf..",
        ".bbf.",".aaF.",".GGH.","..J.."
      ],
      grip: { x: 2, y: 7 }
    },
    shield: {
      rows: [
        "..G..",".GHH.","GHIHG","GHIIG","GHHHG",
        ".GHH.",".GJJ.","..J.."
      ],
      grip: { x: 4, y: 4 },
      offset: { x: -2, y: -1 }
    },
    bow: {
      rows: [
        "..F..",".F.F.","F...F","F...F","F...F",
        ".F.F.","..F..","..t.."
      ],
      grip: { x: 1, y: 5 },
      offset: { x: 0, y: 0 },
      idleAngle: -0.35
    },
    bow_draw: {
      rows: [
        "..F..",".Fef.","Fedef","Fedef",".Fef.",
        "..F.."
      ],
      grip: { x: 1, y: 4 }
    },
    staff: {
      rows: [
        "..w..",".wyy.","wyxyw","wyyxw",".wyy.",
        "..J..","..J..","..J..","..J..","..J.."
      ],
      grip: { x: 2, y: 9 },
      offset: { x: 1, y: 0 },
      idleAngle: -0.15
    },
    staff_cast: {
      rows: [
        "..w..",".wyy.","wyxyw","wyyxw",".wyy.",
        "..J..","..J.."
      ],
      grip: { x: 2, y: 6 }
    },
    orb: {
      rows: [".wyy.","wyyxw","wyxyw","wyyxw",".wyy."],
      attach: "staff_top",
      offset: { x: 0, y: -4 }
    },
    quiver: {
      rows: [".t.","tut","tst","trt",".t."],
      grip: { x: 1, y: 4 },
      offset: { x: 0, y: 0 }
    },
    spellbook: {
      rows: [".==.","=CB=","=CB=",".==."],
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

/* ---- Hilfsfunktion: zentrierte Zeile exakt W Zeichen ---- */
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
    grips: grips || { handR: { x: 11, y: 11 }, handL: { x: 4, y: 11 }, back: { x: 8, y: 9 } }
  };
}

/* ==========================================================================
   KRIEGER – breite Schultern, klare Beine, Helm (Körper OHNE Waffen)
   ========================================================================== */
(function buildWarrior() {
  const base = [
    "......cccc......",".....cbddbc.....",".....cbffbc.....",".....cbffbc.....",
    "......cbdc......","......cbdc......",".....cbbbbc.....",
    "..cabbbbbbaac..",".cabbecccebbaa.",".cabbecccebbaa.",".cabbecccebbaa.",
    ".cabbbbbbbbbaa.","..cabbbbbbaac..","...cabbbbba....",
    "....cc....cc....","....cc....cc....","....cc....cc....","....cc....cc....",
    "....cc....cc....","....cc....cc....","....cc....cc....","....cc....cc....",
    "....cc....cc....","....cc....cc....",".....cc..cc.....",".....cc..cc.....",
    ".....cc..cc.....",".....cc..cc.....","......cccc......","......cccc......",
    ".......cc.......",".......cc.......",".......cc.......",".......cc.......",
    ".......cc.......",".......cc......."
  ];
  const g = { handR: { x: 12, y: 10 }, handL: { x: 3, y: 11 }, back: { x: 8, y: 8 } };

  const walkLeg = [
    null,null,null,null,null,null,null,null,null,null,null,null,null,
    "....cc....cc....","...cc......cc...","...cc......cc...","....cc....cc....",
    "....cc....cc....","...cc......cc...","...cc......cc...","....cc....cc....",
    "....cc....cc....","...cc......cc...","...cc......cc...",null,null,null,null,null,null,null,null
  ];

  const frames = {
    idle: [chrBody(base, g)],
    walk: [],
    attack: [],
    hurt: [chrBody(base.map((r, i) => i >= 7 && i <= 12 ? r.replace(/cab/g, "cab") : r), { handR: { x: 10, y: 12 }, handL: { x: 5, y: 12 }, back: { x: 8, y: 8 } })],
    death: []
  };

  for (let f = 0; f < 4; f++) {
    const legs = base.slice();
    const ph = f % 2;
    for (let i = 13; i <= 24; i++) {
      if (walkLeg[i]) legs[i] = walkLeg[i];
      else if (ph === 0 && i >= 13 && i <= 20) legs[i] = legs[i].replace("....cc....cc....", "...cc......cc...");
      else if (ph === 1 && i >= 13 && i <= 20) legs[i] = legs[i].replace("....cc....cc....", "..cc........cc..");
    }
    const armShift = f % 2 === 0 ? 0 : 1;
    frames.walk.push(chrBody(legs, {
      handR: { x: 12 + armShift, y: 10 + (f % 2) },
      handL: { x: 3 - armShift, y: 11 - (f % 2) },
      back: { x: 8, y: 8 }
    }));
  }

  for (let f = 0; f < 3; f++) {
    const atk = base.slice();
    frames.attack.push(chrBody(atk, {
      handR: { x: 13 + f, y: 9 + f },
      handL: { x: 3, y: 12 },
      back: { x: 8, y: 8 }
    }));
  }

  frames.hurt[0] = chrBody(base.slice(), { handR: { x: 11, y: 12 }, handL: { x: 5, y: 13 }, back: { x: 8, y: 9 } });
  frames.death = [
    chrBody(base.map((r, i) => i > 10 ? r.replace(/c/g, "1") : r), g),
    chrBody(base.map((r, i) => i > 8 ? r.replace(/c/g, "0") : r), g)
  ];

  frames.idle = [0, 0, 1, 0].map((breath) => {
    const rows = base.slice();
    if (breath && rows[8]) rows[8] = "..cabbbbbbaac..";
    return chrBody(rows, { ...g, handR: { x: 12, y: 10 + breath }, handL: { x: 3, y: 11 + breath } });
  });
  CHR.CLASSES.warrior.frames = frames;
})();

/* ==========================================================================
   WALDLÄUFER – Kapuze, schlank, Bogen seitlich gehalten
   ========================================================================== */
(function buildRanger() {
  const base = [
    "......iiii......",".....iijjii.....",".....iijjii.....",".....iijjii.....",
    "......ijji......","......i44i......","......i55i......",
    "...ciiiiiiiic...","..ciiiooooiic..","..ciiiooooiic..","..ciiiooooiic..",
    "..ciiiiiiiic..","...ciiiiiic...","....ciiiiic....",
    "....hh....hh....","....hh....hh....","....hh....hh....","....hh....hh....",
    "....hh....hh....","....hh....hh....","....hh....hh....","....hh....hh....",
    "....hh....hh....","....hh....hh....",".....hh..hh.....",".....hh..hh.....",
    ".....hh..hh.....",".....hh..hh.....","......hhhh......","......hhhh......",
    ".......hh.......",".......hh.......",".......hh.......",".......hh.......",
    ".......hh.......",".......hh......."
  ];
  const g = { handR: { x: 11, y: 10 }, handL: { x: 5, y: 10 }, back: { x: 7, y: 9 } };

  const frames = { idle: [chrBody(base, g)], walk: [], attack: [], hurt: [], death: [] };

  for (let f = 0; f < 4; f++) {
    const legs = base.slice();
    const ph = f % 2;
    for (let i = 13; i <= 22; i++) {
      if (ph === 0) legs[i] = legs[i].replace("....hh....hh....", "...hh......hh...");
      else legs[i] = legs[i].replace("....hh....hh....", "..hh........hh..");
    }
    frames.walk.push(chrBody(legs, {
      handR: { x: 11 + (f % 2), y: 10 },
      handL: { x: 5 - (f % 2), y: 10 + (f % 2) },
      back: { x: 7, y: 9 }
    }));
  }

  for (let f = 0; f < 3; f++) {
    frames.attack.push(chrBody(base, {
      handR: { x: 12, y: 9 },
      handL: { x: 4 - f, y: 10 },
      back: { x: 7, y: 9 }
    }));
  }

  frames.hurt = [chrBody(base, { handR: { x: 10, y: 11 }, handL: { x: 6, y: 11 }, back: { x: 7, y: 9 } })];
  frames.death = [
    chrBody(base.map(r => r.replace(/i/g, "k")), g),
    chrBody(base.map(r => r.replace(/[hi]/g, "l")), g)
  ];

  frames.idle = [0, 0, 1, 0].map((breath) => {
    const rows = base.slice();
    if (breath && rows[8]) rows[8] = "..ciiiiiiiic..";
    return chrBody(rows, { ...g, handR: { x: 11, y: 10 + breath }, handL: { x: 5, y: 10 + breath } });
  });

  CHR.CLASSES.ranger.frames = frames;
})();

/* ==========================================================================
   MAGIER – lange Robe, spitz Hut, Stab seitlich (Hand an Hüfte, nicht im Gesicht)
   ========================================================================== */
(function buildMage() {
  const base = [
    "......BBB.......",".....BBEBB......",".....BBBBB......","......BEB.......",
    "......B4B.......","......B5B.......","......BBB.......",
    "...zBBBBBBBBz...","..zBBBCCCCBBz..","..zBBBCCCCBBz..","..zBBBBBBBBz..",
    "..zBBBBBBBBz..","..zBBBBBBBBz..","...zBBBBBBz...","....zBBBBz....",
    "....zz....zz....","....zz....zz....","....zz....zz....","....zz....zz....",
    "....zz....zz....","....zz....zz....","....zz....zz....","....zz....zz....",
    "....zz....zz....","....zz....zz....",".....zz..zz.....",".....zz..zz.....",
    ".....zz..zz.....",".....zz..zz.....","......zzzz......","......zzzz......",
    ".......zz.......",".......zz.......",".......zz.......",".......zz.......",
    ".......zz.......",".......zz......."
  ];
  const g = { handR: { x: 11, y: 13 }, handL: { x: 4, y: 14 }, back: { x: 8, y: 10 } };

  const frames = { idle: [chrBody(base, g)], walk: [], attack: [], hurt: [], death: [] };

  for (let f = 0; f < 4; f++) {
    const legs = base.slice();
    const ph = f % 2;
    for (let i = 14; i <= 23; i++) {
      if (ph === 0) legs[i] = legs[i].replace("....zz....zz....", "...zz......zz...");
      else legs[i] = legs[i].replace("....zz....zz....", "..zz........zz..");
    }
    frames.walk.push(chrBody(legs, {
      handR: { x: 11, y: 13 },
      handL: { x: 4 + (f % 2), y: 14 },
      back: { x: 8, y: 10 }
    }));
  }

  for (let f = 0; f < 3; f++) {
    frames.attack.push(chrBody(base, {
      handR: { x: 12 + f, y: 12 },
      handL: { x: 4, y: 14 },
      back: { x: 8, y: 10 }
    }));
  }

  frames.hurt = [chrBody(base, { handR: { x: 10, y: 14 }, handL: { x: 5, y: 15 }, back: { x: 8, y: 10 } })];
  frames.death = [
    chrBody(base.map(r => r.replace(/z/g, "A")), g),
    chrBody(base.map(r => r.replace(/[zB]/g, "1")), g)
  ];

  frames.idle = [0, 0, 1, 0].map((breath) => {
    const rows = base.slice();
    if (breath && rows[8]) rows[8] = "..zBBBBBBBBz..";
    return chrBody(rows, { ...g, handR: { x: 11, y: 13 + breath } });
  });

  CHR.CLASSES.mage.frames = frames;
})();

/** Frame für Animationszustand abrufen */
CHR.getFrame = (classKey, animState, frameIndex, attacking) => {
  const cls = CHR.CLASSES[classKey] || CHR.CLASSES.warrior;
  let state = animState || "idle";
  if (attacking && cls.frames.attack?.length) state = "attack";
  const list = cls.frames[state] || cls.frames.idle || [];
  if (!list.length) return cls.frames.idle[0];
  return list[frameIndex % list.length];
};

CHR.getClassDef = (classKey) => CHR.CLASSES[classKey] || CHR.CLASSES.warrior;
