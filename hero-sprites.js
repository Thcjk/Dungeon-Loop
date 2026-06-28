/* ==========================================================================
   Dungeon Loop – Character Sprites v3 (Komplett-Neuentwurf)
   Vollständige Körper-Sprites pro Klasse – keine Modul-Zusammenbau-Logik.
   Grid 20×38 → ~38 px Kampfhöhe (ca. 15 % größer als Gegner ~33 px)
   Proportionen: 18 % Kopf | 35 % Oberkörper | 10 % Becken | 37 % Beine
   ========================================================================== */

const CHR = {
  W: 20,
  H: 38,

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

  /** Waffen max. ~30 % der Körperhöhe (≤ 11 px) */
  EQUIP: {
    sword: {
      rows: [
        "..e..",
        ".eef.",
        ".ddf.",
        ".ccf.",
        ".aaF.",
        ".GGH.",
        ".JJJ.",
        "..J.."
      ],
      grip: { x: 2, y: 5 },
      idleAngle: -0.78
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
        "GHIIG",
        "GHIIG",
        "GHHHG",
        ".GHH.",
        "..J.."
      ],
      grip: { x: 3, y: 4 },
      offset: { x: -2, y: 1 }
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
      idleAngle: -0.42
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
        "..J..",
        "..J.."
      ],
      grip: { x: 2, y: 8 },
      offset: { x: 1, y: 0 },
      idleAngle: 0.22
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
      offset: { x: -1, y: 0 }
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
    grips: grips || { handR: { x: 15, y: 17 }, handL: { x: 4, y: 16 }, back: { x: 10, y: 10 } }
  };
}

/** Bein-Animation: Oberschenkel / Knie / Wade / Fuß wechseln natürlich */
function chrWalkLegs(rows, phase) {
  const out = rows.slice();
  const legStart = 24;
  const legEnd = 37;
  const patterns = [
    ["bbbb..bbbb", "bbbb..bbbb", "bbbb..bbbb", "bbb...bbb", "bbb...bbb", "bb....bb", "bb....bb", "bb....bb", "bbb..bbb", "ccc..ccc", "ccc..ccc", "cc....cc", "cc....cc", "cc....cc"],
    ["bbbb..bbbb", "bbbb..bbbb", "bbb...bbb", "bbb...bbb", "bb....bb", "bb....bb", "bb....bb", "bbb..bbb", "bbb..bbb", "ccc..ccc", "ccc..ccc", "cc....cc", "cc....cc", "cc....cc"],
    ["bbbb..bbbb", "bbbb..bbbb", "bbbb..bbbb", "bbb...bbb", "bbb...bbb", "bb....bb", "bb....bb", "bb....bb", "bbb..bbb", "ccc..ccc", "ccc..ccc", "cc....cc", "cc....cc", "cc....cc"],
    ["bbbb..bbbb", "bbb...bbb", "bbb...bbb", "bb....bb", "bb....bb", "bb....bb", "bbb..bbb", "bbb..bbb", "ccc..ccc", "ccc..ccc", "cc....cc", "cc....cc", "cc....cc", "cc....cc"]
  ];
  const pat = patterns[phase % 4];
  for (let i = legStart; i <= legEnd; i++) {
    const pi = i - legStart;
    if (pat[pi]) out[i] = chrRow(pat[pi]);
  }
  return out;
}

function chrWalkLegsTint(rows, phase, from, to) {
  const walked = chrWalkLegs(rows, phase);
  for (let i = 24; i <= 37; i++) {
    walked[i] = walked[i].replace(new RegExp(from, "g"), to);
  }
  return walked;
}

/* ==========================================================================
   KRIEGER – breiter Brustkorb, kräftige Schultern, volle Anatomie
   ========================================================================== */
(function buildWarrior() {
  const base = [
    /* Kopf 0–6 (~18 %) */
    "cccccccccccc",
    "cccbccccccbcc",
    "ccbdffccffdbcc",
    "ccbfeeccfefbcc",
    "ccbdffccffdbcc",
    "ccbccccccbcc",
    "ccccccbbcccc",
    /* Oberkörper + Arme 7–19 (~35 %) */
    "aabbccccccccbbaa",
    "hhbbbccccccbbbhh",
    "hhbbbbccccbbbbhh",
    "hhbbbbccccbbbbhh",
    "hhbbbbccbbbbbbhh",
    "hhbbbbbbbbbbbbhh",
    "ccmmbbbbbbbbmmcc",
    "ccmmbbbbbbbbmmcc",
    "cchhhbbbbbbhhhcc",
    "cchhhbbbbbbhhhcc",
    "cchhhbbbbbbhhhcc",
    "cchhhbbbbbbhhhcc",
    "ccbbbbbbbbbbcc",
    /* Becken 20–23 (~10 %) */
    "ccmmmmmmmmmmcc",
    "ccmmmmmmmmmmcc",
    "ccmmmmmmmmmmcc",
    "ccmmmmmmmmmmcc",
    /* Beine 24–37 (~37 %) */
    "bbbb..bbbb",
    "bbbb..bbbb",
    "bbbb..bbbb",
    "bbb...bbb",
    "bbb...bbb",
    "bb....bb",
    "bb....bb",
    "bb....bb",
    "bbb..bbb",
    "ccc..ccc",
    "ccc..ccc",
    "cc....cc",
    "cc....cc",
    "cc....cc"
  ];

  const g = { handR: { x: 16, y: 17 }, handL: { x: 3, y: 16 }, back: { x: 10, y: 9 } };
  const frames = { idle: [], walk: [], attack: [], hurt: [], death: [] };

  frames.idle = [0, 0, 1, 0].map((breath) => {
    const rows = base.slice();
    if (breath && rows[9]) rows[9] = "hhbbbbccccbbbbhh";
    return chrBody(rows, {
      ...g,
      handR: { x: 16, y: 17 + breath },
      handL: { x: 3, y: 16 + breath }
    });
  });

  for (let f = 0; f < 4; f++) {
    frames.walk.push(chrBody(chrWalkLegs(base, f), {
      handR: { x: 16, y: 17 + (f % 2) },
      handL: { x: 3, y: 16 - (f % 2) },
      back: { x: 10, y: 9 }
    }));
  }

  for (let f = 0; f < 3; f++) {
    frames.attack.push(chrBody(base.slice(), {
      handR: { x: 17, y: 15 + f },
      handL: { x: 3, y: 17 },
      back: { x: 10, y: 9 }
    }));
  }

  frames.hurt = [chrBody(base.slice(), { handR: { x: 15, y: 18 }, handL: { x: 5, y: 17 }, back: { x: 10, y: 10 } })];
  frames.death = [
    chrBody(base.map((r, i) => (i > 10 ? r.replace(/c/g, "1") : r)), g),
    chrBody(base.map((r, i) => (i > 8 ? r.replace(/c/g, "0") : r)), g)
  ];

  CHR.CLASSES.warrior.frames = frames;
})();

/* ==========================================================================
   WALDLÄUFER – Kapuze, schlanker Körper, gleiche Anatomie-Struktur
   ========================================================================== */
(function buildRanger() {
  const base = [
    /* Kopf / Kapuze 0–6 */
    "iiii",
    "iiiiii",
    "iiiiiiii",
    "iijjjjjjjjii",
    "iijjjejjjii",
    "iijjeejjeeii",
    "cccciiiiiicc",
    /* Oberkörper 7–19 */
    "iiccccccccccii",
    "hhiiooooooii hh",
    "hhiiooooooii hh",
    "hhiiooooooii hh",
    "hhiiiooooii hh",
    "hhiiiooooii hh",
    "cchhoooooohhcc",
    "cchhoooooohhcc",
    "cchhhooooohhhcc",
    "cchhhooooohhhcc",
    "cchhhooooohhhcc",
    "cchhhooooohhhcc",
    "cchhoooooohhcc",
    /* Becken 20–23 */
    "cchhhhhhhhhhcc",
    "cchhhhhhhhhhcc",
    "cchhhhhhhhhhcc",
    "cchhhhhhhhhhcc",
    /* Beine 24–37 */
    "hhhh..hhhh",
    "hhhh..hhhh",
    "hhhh..hhhh",
    "hhh...hhh",
    "hhh...hhh",
    "hh....hh",
    "hh....hh",
    "hh....hh",
    "hhh..hhh",
    "ooo..ooo",
    "ooo..ooo",
    "oo....oo",
    "oo....oo",
    "oo....oo"
  ].map((r) => r.replace(/\s/g, ""));

  const g = { handR: { x: 15, y: 17 }, handL: { x: 4, y: 16 }, back: { x: 10, y: 10 } };
  const frames = { idle: [], walk: [], attack: [], hurt: [], death: [] };

  frames.idle = [0, 0, 1, 0].map((breath) => {
    const rows = base.slice();
    if (breath && rows[10]) rows[10] = "hhiiooooooii hh".replace(/\s/g, "");
    return chrBody(rows, {
      ...g,
      handR: { x: 15, y: 17 + breath },
      handL: { x: 4, y: 16 + breath }
    });
  });

  for (let f = 0; f < 4; f++) {
    frames.walk.push(chrBody(chrWalkLegsTint(base, f, "b", "h"), {
      handR: { x: 15 + (f % 2), y: 17 },
      handL: { x: 4 - (f % 2), y: 16 + (f % 2) },
      back: { x: 10, y: 10 }
    }));
  }

  for (let f = 0; f < 3; f++) {
    frames.attack.push(chrBody(base.slice(), {
      handR: { x: 16, y: 15 },
      handL: { x: 3 - f, y: 16 },
      back: { x: 10, y: 10 }
    }));
  }

  frames.hurt = [chrBody(base.slice(), { handR: { x: 14, y: 18 }, handL: { x: 6, y: 17 }, back: { x: 10, y: 10 } })];
  frames.death = [
    chrBody(base.map((r) => r.replace(/i/g, "k")), g),
    chrBody(base.map((r) => r.replace(/[hi]/g, "l")), g)
  ];

  CHR.CLASSES.ranger.frames = frames;
})();

/* ==========================================================================
   MAGIER – Spitzhut, lange Robe, Stoff-Silhouette
   ========================================================================== */
(function buildMage() {
  const base = [
    /* Hut + Kopf 0–6 */
    "BBBBBB",
    "BBBBBBBB",
    "BBBBBBBBBB",
    "BBBBBBBBBBBB",
    "BBB44BBBBBBB",
    "BBBBBBBBBBBB",
    "ccccBBBBcccc",
    /* Oberkörper / Robe 7–19 */
    "zzBBBBBBBBzz",
    "hhzzCCCCCCzzhh",
    "hhzzzCCCCCzzzhh",
    "hhzzzCCCCCzzzhh",
    "hhzzzzCCCzzzzhh",
    "hhzzzzzzzzzzhh",
    "cczzzzzzzzzzcc",
    "cczzzzzzzzzzcc",
    "cchhhzzzzzhhhcc",
    "cchhhzzzzzhhhcc",
    "cchhhzzzzzhhhcc",
    "cchhhzzzzzhhhcc",
    "cczzzzzzzzzzcc",
    /* Becken 20–23 */
    "cczzzzzzzzzzcc",
    "cczzzzzzzzzzcc",
    "cczzzzzzzzzzcc",
    "cczzzzzzzzzzcc",
    /* Beine / Robensaum 24–37 */
    "zzzz..zzzz",
    "zzzz..zzzz",
    "zzzz..zzzz",
    "zzz...zzz",
    "zzz...zzz",
    "zz....zz",
    "zz....zz",
    "zz....zz",
    "zzz..zzz",
    "AAA..AAA",
    "AAA..AAA",
    "AA....AA",
    "AA....AA",
    "AA....AA"
  ];

  const g = { handR: { x: 15, y: 18 }, handL: { x: 4, y: 17 }, back: { x: 10, y: 11 } };
  const frames = { idle: [], walk: [], attack: [], hurt: [], death: [] };

  frames.idle = [0, 0, 1, 0].map((breath) => {
    const rows = base.slice();
    if (breath && rows[9]) rows[9] = "hhzzzCCCCCzzzhh";
    return chrBody(rows, {
      ...g,
      handR: { x: 15, y: 18 + breath },
      handL: { x: 4, y: 17 + breath }
    });
  });

  for (let f = 0; f < 4; f++) {
    frames.walk.push(chrBody(chrWalkLegsTint(base, f, "b", "z"), {
      handR: { x: 15, y: 18 },
      handL: { x: 4 + (f % 2), y: 17 },
      back: { x: 10, y: 11 }
    }));
  }

  for (let f = 0; f < 3; f++) {
    frames.attack.push(chrBody(base.slice(), {
      handR: { x: 16 + f, y: 16 },
      handL: { x: 4, y: 17 },
      back: { x: 10, y: 11 }
    }));
  }

  frames.hurt = [chrBody(base.slice(), { handR: { x: 14, y: 19 }, handL: { x: 5, y: 18 }, back: { x: 10, y: 11 } })];
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
