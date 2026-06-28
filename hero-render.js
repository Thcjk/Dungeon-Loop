/* ==========================================================================
   Dungeon Loop – Hero Renderer (Komplett-Neuzeichnung)
   Hochwertige Pixel-Art · realistische Proportionen · weltgebundene Farben
   Grid 22×28 @ 2px · Display ~15 % kleiner für Kampfabstand
   ========================================================================== */

const HR = {
  NW: 22,
  NH: 28,
  SCALE: 2,
  /** Etwas kleiner als Gegner-Hitbox – mehr Platz für Projektile & FX */
  DISPLAY_SCALE: 0.84,
  CX: 11,

  ANIM: {
    idle:   { n: 6, t: 0.32 },
    walk:   { n: 8, t: 0.075 },
    attack: { n: 5, t: 0.065 },
    hurt:   { n: 3, t: 0.11 },
    death:  { n: 6, t: 0.2 }
  },

  /** Basis-Palette – gedämpft, passend zu Gegner-Sprites */
  PAL: {
    ".": null,
    "0": "#0c0a0a", "1": "#1a1614", "2": "#2a2420", "3": "#3a322c",
    "4": "#b89878", "5": "#9a7858", "6": "#dcc8a8", "7": "#7a6048",
    "8": "#5a4030", "9": "#3a2a22",
    "a": "#4a5058", "b": "#687078", "c": "#909aa4", "d": "#b8c4cc",
    "e": "#dce4ec", "f": "#f0f4f8",
    "g": "#3a4a38", "h": "#4a6248", "i": "#5a7a58", "j": "#6a9468",
    "k": "#2a3828", "l": "#1a2418",
    "m": "#5a4838", "n": "#7a6048", "o": "#9a8060", "p": "#baa080",
    "q": "#382818", "r": "#584030", "s": "#786048",
    "t": "#283848", "u": "#384858", "v": "#506878", "w": "#6890a8",
    "x": "#88b8d0", "y": "#a8d8e8",
    "z": "#382858", "A": "#503870", "B": "#684898", "C": "#8868b8",
    "D": "#a888d8", "E": "#c8a8f0",
    "F": "#6a5030", "G": "#8a6838", "H": "#aa8848", "I": "#caa858",
    "J": "#4a3828", "K": "#6a5038", "L": "#8a6848",
    "M": "#282018", "N": "#403028", "O": "#584838", "P": "#786050",
    "Q": "#989078", "R": "#b8b0a0",
    "S": "#1a1818", "T": "#303030", "U": "#484848", "V": "#686868",
    "W": "#888888", "X": "#a8a8a8", "Y": "#c8c8c8", "Z": "#e8e8e8",
    "!": "#284838", "@": "#386848", "#": "#488858", "$": "#589868",
    "%": "#689878", "^": "#789888",
    "&": "#482818", "*": "#683828", "(": "#884838", ")": "#a85848",
    "-": "#c87858", "_": "#e89868",
    "+": "#381818", "=": "#582020", "[": "#782828", "]": "#983838",
    "{": "#b84848", "}": "#d86868",
    "|": "#181828", ";": "#282840", ":": "#383858", "'": "#484870",
    "<": "#585888", ">": "#6868a0",
    ",": "#302018", "`": "#503028", "~": "#704038", "?": "#905048"
  },

  /** Welt-Themen: Farbumbiegung für perfekte Integration */
  THEMES: {
    forest: { mul: null, rim: "rgba(82,183,136,0.12)", aura: null },
    swamp:  { mul: "rgba(40,55,30,0.18)", rim: "rgba(82,183,136,0.1)", aura: "#354828" },
    frost:  { mul: "rgba(120,160,200,0.14)", rim: "rgba(168,216,232,0.18)", aura: "#506878" },
    fire:   { mul: "rgba(120,40,15,0.16)", rim: "rgba(243,156,18,0.14)", aura: "#582818" },
    ruins:  { mul: "rgba(50,45,65,0.12)", rim: "rgba(187,134,252,0.12)", aura: "#403858" }
  }
};

HR._footRow = null;
HR._cache = {};

HR.getFootRow = () => {
  if (HR._footRow != null) return HR._footRow;
  let last = HR.NH - 1;
  HR._footRow = last;
  return last;
};

HR.displayW = () => Math.ceil(HR.NW * HR.SCALE * HR.DISPLAY_SCALE);
HR.displayH = () => Math.ceil((HR.getFootRow() + 1) * HR.SCALE * HR.DISPLAY_SCALE);
HR.getFootOffset = () => HR.displayH();
HR.getGroundY = () => (typeof GROUND !== "undefined" ? GROUND : 308);
HR.getDrawY = () => HR.getGroundY() - HR.displayH();

/* ---- Zeichen-Hilfen ---- */

function hrBlank() {
  return Array(HR.NH).fill(null).map(() => ".".repeat(HR.NW).split(""));
}

function hrSet(g, x, y, ch) {
  if (y < 0 || y >= HR.NH || x < 0 || x >= HR.NW || !ch || ch === ".") return;
  g[y][x] = ch;
}

function hrRow(g, y, x0, str) {
  for (let i = 0; i < str.length; i++) hrSet(g, x0 + i, y, str[i]);
}

function hrGrid(g) { return g.map((r) => r.join("")); }

function hrDrawRows(c, rows, x, y, flip, sc, pal) {
  const s = sc || HR.SCALE;
  const P = pal || HR.PAL;
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    for (let col = 0; col < row.length; col++) {
      const ch = row[col];
      const colr = P[ch] || HR.PAL[ch];
      if (!colr) continue;
      const dc = flip ? row.length - 1 - col : col;
      c.fillStyle = colr;
      c.fillRect(Math.floor(x + dc * s), Math.floor(y + r * s), s, s);
    }
  }
}

function hrThemePal(theme) {
  const t = HR.THEMES[theme] || HR.THEMES.forest;
  if (!t.mul) return HR.PAL;
  return HR.PAL;
}

/* ---- Körper-Bausteine (Proportionen: Kopf ~18 %, lange Beine, schmale Arme) ---- */

function hrDrawHead(g, cx, y, cls, frame) {
  const skin = "4", skinD = "5", skinL = "6";
  if (cls === "warrior") {
    hrRow(g, y,     cx - 3, "00000");
    hrRow(g, y + 1, cx - 4, "0VWV0");
    hrRow(g, y + 2, cx - 4, "0abb0");
    hrRow(g, y + 3, cx - 3, "0cdc0");
    hrRow(g, y + 4, cx - 3, "0cdc0");
    hrSet(g, cx - 1, y + 3, "1"); hrSet(g, cx + 1, y + 3, "1");
    hrSet(g, cx, y + 4, "b");
    hrSet(g, cx - 2, y + 2, "X"); hrSet(g, cx + 2, y + 2, "V");
  } else if (cls === "ranger") {
    hrRow(g, y,     cx - 3, "00000");
    hrRow(g, y + 1, cx - 4, "0kkk0");
    hrRow(g, y + 2, cx - 4, "0kkk0");
    hrRow(g, y + 3, cx - 3, "0" + skin + skin + skin + "0");
    hrRow(g, y + 4, cx - 3, "0" + skinD + skinL + skinD + "0");
    hrSet(g, cx - 1, y + 3, "8"); hrSet(g, cx + 1, y + 3, "8");
    hrSet(g, cx, y + 4, "5");
    hrSet(g, cx, y + 1, "j");
  } else {
    hrRow(g, y,     cx - 3, "0AAA0");
    hrRow(g, y + 1, cx - 4, "0ABBA0");
    hrRow(g, y + 2, cx - 4, "0zAAz0");
    hrRow(g, y + 3, cx - 3, "0" + skin + skin + skin + "0");
    hrRow(g, y + 4, cx - 3, "0" + skinD + skinL + skinD + "0");
    hrSet(g, cx - 1, y + 3, "9"); hrSet(g, cx + 1, y + 3, "9");
    hrSet(g, cx, y + 4, "5");
    hrSet(g, cx, y + 2, "C");
  }
}

function hrDrawTorso(g, cx, y, cls, breath) {
  const by = breath | 0;
  if (cls === "warrior") {
    hrRow(g, y + by,     cx - 4, "0S000S0");
    hrRow(g, y + 1 + by, cx - 4, "0abb0");
    hrRow(g, y + 2 + by, cx - 3, "cde0");
    hrRow(g, y + 3 + by, cx - 3, "cde0");
    hrRow(g, y + 4 + by, cx - 3, "bab0");
    hrRow(g, y + 5 + by, cx - 3, "0FGF0");
    hrSet(g, cx - 4, y + 2 + by, "V"); hrSet(g, cx + 4, y + 2 + by, "V");
    hrSet(g, cx, y + 3 + by, "f");
    hrRow(g, y + 6 + by, cx - 2, "0H0");
  } else if (cls === "ranger") {
    hrRow(g, y + by,     cx - 3, "0k0");
    hrRow(g, y + 1 + by, cx - 3, "0mn0");
    hrRow(g, y + 2 + by, cx - 3, "0op0");
    hrRow(g, y + 3 + by, cx - 3, "0pq0");
    hrRow(g, y + 4 + by, cx - 3, "0rs0");
    hrRow(g, y + 5 + by, cx - 2, "0F0");
    hrSet(g, cx - 4, y + 2 + by, "k");
    hrSet(g, cx + 4, y + 1 + by, "q");
    hrSet(g, cx + 4, y + 2 + by, "r");
    hrSet(g, cx, y + 3 + by, "s");
  } else {
    hrRow(g, y + by,     cx - 3, "0z0");
    hrRow(g, y + 1 + by, cx - 4, "0ABA0");
    hrRow(g, y + 2 + by, cx - 4, "0BCB0");
    hrRow(g, y + 3 + by, cx - 4, "0BCB0");
    hrRow(g, y + 4 + by, cx - 3, "0CB0");
    hrRow(g, y + 5 + by, cx - 3, "0AA0");
    hrSet(g, cx - 5, y + 2 + by, "z");
    hrSet(g, cx + 5, y + 2 + by, "z");
    hrSet(g, cx, y + 3 + by, "D");
    hrRow(g, y + 6 + by, cx - 2, "0=0");
  }
}

function hrDrawArm(g, cx, y, side, swing, cls) {
  const s = side < 0 ? -1 : 1;
  const ax = cx + s * 4 + (swing * s | 0);
  const ay = y + 1 - Math.abs(swing >> 1);
  const upper = cls === "warrior" ? "b" : cls === "ranger" ? "n" : "B";
  const lower = cls === "warrior" ? "c" : cls === "ranger" ? "o" : "A";
  const hand = cls === "warrior" ? "d" : cls === "ranger" ? "4" : "6";
  hrSet(g, ax, ay, "0");
  hrSet(g, ax, ay + 1, upper);
  hrSet(g, ax, ay + 2, lower);
  hrSet(g, ax + (s > 0 ? 0 : 0), ay + 3, hand);
}

function hrDrawLeg(g, cx, y, side, phase, cls) {
  const s = side < 0 ? -1 : 1;
  const px = cx + s * 1 + (phase * s | 0);
  const py = y + Math.max(0, phase);
  const thigh = cls === "warrior" ? "U" : cls === "ranger" ? "J" : "u";
  const shin  = cls === "warrior" ? "T" : cls === "ranger" ? "K" : "v";
  const boot  = cls === "warrior" ? "M" : cls === "ranger" ? "M" : "1";
  hrSet(g, px, py, "0");
  hrSet(g, px, py + 1, thigh);
  hrSet(g, px, py + 2, shin);
  hrSet(g, px, py + 3, boot);
  hrSet(g, px + (phase > 0 ? s : 0), py + 4, boot);
}

function hrDrawCape(g, cx, y, sway, cls) {
  const sw = sway | 0;
  if (cls === "warrior") {
    hrSet(g, cx - 5, y + 3 + sw, "q");
    hrSet(g, cx - 5, y + 4 + sw, "r");
    hrSet(g, cx + 5, y + 3 - sw, "q");
  } else if (cls === "ranger") {
    hrSet(g, cx - 6, y + 2 + sw, "k");
    hrSet(g, cx - 6, y + 3 + sw, "l");
    hrSet(g, cx - 5, y + 4 + sw, "k");
    hrSet(g, cx + 6, y + 2 - sw, "k");
    hrSet(g, cx + 6, y + 3 - sw, "l");
  } else if (cls === "mage") {
    hrSet(g, cx - 6, y + 1 + sw, "z");
    hrSet(g, cx - 6, y + 2 + sw, "A");
    hrSet(g, cx - 5, y + 3 + sw, "B");
    hrSet(g, cx - 5, y + 4 + sw, "z");
    hrSet(g, cx + 6, y + 1 - sw, "z");
    hrSet(g, cx + 6, y + 2 - sw, "A");
  }
}

function hrDrawBelt(g, cx, y, cls) {
  if (cls === "warrior") {
    hrRow(g, y, cx - 3, "0HI0");
    hrSet(g, cx - 4, y, "F"); hrSet(g, cx + 4, y, "F");
  } else if (cls === "ranger") {
    hrRow(g, y, cx - 2, "0F0");
    hrSet(g, cx - 3, y, "q"); hrSet(g, cx + 3, y, "t");
  } else {
    hrRow(g, y, cx - 2, "0=0");
    hrSet(g, cx - 3, y, "+"); hrSet(g, cx + 3, y, "+");
  }
}

function hrDrawExtras(g, cx, y, cls) {
  if (cls === "ranger") {
    hrSet(g, cx + 5, y + 1, "q");
    hrSet(g, cx + 5, y + 2, "r");
    hrSet(g, cx + 5, y + 3, "s");
    hrSet(g, cx + 6, y + 2, "t");
  }
  if (cls === "mage") {
    hrSet(g, cx - 5, y + 4, "C");
    hrSet(g, cx - 4, y + 5, "D");
    hrSet(g, cx + 5, y + 3, "E");
  }
}

function hrBuildBody(cls, pose) {
  const g = hrBlank();
  const cx = HR.CX;
  const headY  = 1 + pose.drop;
  const torsoY = 7 + pose.drop + (pose.death > 1 ? 2 : 0);
  const beltY  = 14 + pose.drop + (pose.death > 1 ? 2 : 0);
  const legY   = 16 + pose.drop + (pose.death > 2 ? 2 : 0);

  hrDrawCape(g, cx, torsoY, pose.sway, cls);
  hrDrawHead(g, cx, headY, cls, 0);
  hrDrawTorso(g, cx, torsoY, cls, pose.breath);
  hrDrawBelt(g, cx, beltY, cls);
  hrDrawArm(g, cx, torsoY, -1, pose.armL, cls);
  hrDrawArm(g, cx, torsoY,  1, pose.armR, cls);
  hrDrawLeg(g, cx, legY, -1, pose.legL, cls);
  hrDrawLeg(g, cx, legY,  1, pose.legR, cls);
  hrDrawExtras(g, cx, torsoY, cls);

  if (pose.death > 3) {
    hrRow(g, legY + 4, cx - 4, "0000000");
  }
  return hrGrid(g);
}

function hrPose(cls, state, frame) {
  const f = frame;
  const p = { breath: 0, sway: 0, armL: 0, armR: 0, legL: 0, legR: 0, drop: 0, death: 0, lean: 0 };
  if (state === "idle") {
    p.breath = f % 3 === 0 ? 0 : f % 3 === 1 ? 1 : 0;
    p.sway = f < 3 ? 0 : f < 5 ? 1 : 0;
    p.armL = -1; p.armR = 0;
  } else if (state === "walk") {
    const cycle = [0, 1, 1, 0, -1, -1, 0, 0];
    const ph = cycle[f % 8];
    p.legL = ph; p.legR = -ph;
    p.armL = -ph; p.armR = ph;
    p.sway = f % 2;
    p.breath = f % 4 === 2 ? 1 : 0;
  } else if (state === "attack") {
    p.armR = 2 + f;
    p.armL = -2 - Math.floor(f / 2);
    p.legL = 1; p.legR = -1;
    p.lean = f;
    p.sway = f;
  } else if (state === "hurt") {
    p.lean = 1 + f;
    p.armL = -2; p.armR = 2;
    p.drop = f;
  } else if (state === "death") {
    p.death = f + 1;
    p.drop = f + 1;
    p.armL = 3; p.armR = 3;
    p.legL = 2; p.legR = 2;
  }
  return p;
}

function hrGetBody(cls, state, frame) {
  const k = cls + "|" + state + "|" + frame;
  if (!HR._cache[k]) HR._cache[k] = hrBuildBody(cls, hrPose(cls, state, frame));
  return HR._cache[k];
}

/* ---- Detaillierte Waffen & Ausrüstung (eigene Pixel-Grids) ---- */

HR.WEAPONS = {
  sword: [
    "....00....",
    "...0ef0...",
    "...0ef0...",
    "...0de0...",
    "...0de0...",
    "...0cd0...",
    "...0bc0...",
    "...0ab0...",
    "...0FF0...",
    "...0GG0...",
    "...0HH0...",
    "...0JJ0...",
    "....00...."
  ],
  sword_swing: [
    "....00....",
    "..0eef0...",
    ".0eeef0...",
    "0eef0.....",
    "0de0......",
    "0cd0......",
    ".0bc0.....",
    "..0FF0....",
    "...0GG0...",
    "....00...."
  ],
  shield: [
    "....00....",
    "...0GF0...",
    "..0GHH0..",
    "..0HIP0..",
    "..0HIP0..",
    "..0GHH0..",
    "...0GF0...",
    "...0JJ0...",
    "....00...."
  ],
  bow: [
    ".....0....",
    "....0F0...",
    "...0F.F0..",
    "..0F...F0.",
    "..0F...F0.",
    "...0F.F0..",
    "....0F0...",
    ".....0....",
    "...0tt0...",
    "...0ss0..."
  ],
  bow_draw: [
    ".....0....",
    "....0F0...",
    "...0Fef0..",
    "..0FedeF0.",
    "..0FedeF0.",
    "...0Fef0..",
    "....0F0...",
    ".....0...."
  ],
  arrow: [
    "..0..",
    ".0e0.",
    "0ede0",
    ".0e0.",
    "..0.."
  ],
  staff: [
    "....00....",
    "...0JJ0...",
    "...0HH0...",
    "...0GG0...",
    "...0FF0...",
    "...0FF0...",
    "...0JJ0...",
    "...0JJ0...",
    "...0JJ0...",
    "...0JJ0...",
    "...0JJ0...",
    "....00...."
  ],
  staff_orb: [
    "...0ww0...",
    "..0wyyw0..",
    "..0wyxyw0.",
    "..0wyyw0..",
    "...0ww0..."
  ],
  staff_cast: [
    "....00....",
    "...0JJ0...",
    "..0wyyw0..",
    ".0wyxxyw0.",
    ".0wyyyyw0.",
    "..0wyyw0..",
    "...0ww0...",
    "...0JJ0..."
  ],
  spellbook: [
    "..00..",
    ".0==0.",
    ".0CB0.",
    ".0CB0.",
    "..00.."
  ],
  quiver: [
    ".0..",
    "0t0.",
    "0s0.",
    "0r0.",
    "0q0.",
    ".0.."
  ]
};

HR.getAnimState = (h, moving) => {
  if (typeof game !== "undefined" && (game.isDead || h.deathAnim)) return "death";
  if (h.hurtAnim > 0.05) return "hurt";
  if (h.attackAnim > 0.04) return "attack";
  if (moving && typeof game !== "undefined" && game.isRunning && !game.isPaused) return "walk";
  return "idle";
};

HR.updateAnim = (h, dt, moving) => {
  const st = HR.getAnimState(h, moving);
  if (h.animState !== st) { h.animState = st; h.animFrame = 0; h.animTime = 0; }
  const cfg = HR.ANIM[st];
  h.animTime = (h.animTime || 0) + dt;
  if (h.animTime >= cfg.t) {
    h.animTime = 0;
    h.animFrame = (h.animFrame + 1) % cfg.n;
    if (st === "death") {
      h.animFrame = Math.min(h.animFrame, cfg.n - 1);
      if (h.animFrame >= cfg.n - 1) h.deathDone = true;
    }
  }
};

/** Schild am linken Arm verankert (nicht schwebend) */
HR.drawShield = (c, cx, cy, flip, sc, pose) => {
  const s = sc || HR.SCALE;
  const ox = flip ? 8 : -10;
  const oy = -4 + (pose.breath || 0);
  c.save();
  c.translate(cx + ox, cy + oy);
  if (flip) c.scale(-1, 1);
  hrDrawRows(c, HR.WEAPONS.shield, 0, 0, false, s);
  c.restore();
};

HR.drawWeapon = (c, cls, cx, cy, angle, attacking, flip, sc, pose) => {
  const s = sc || HR.SCALE;
  c.save();
  c.translate(cx, cy);
  if (flip) c.scale(-1, 1);
  c.rotate(angle);

  if (cls === "warrior") {
    hrDrawRows(c, attacking ? HR.WEAPONS.sword_swing : HR.WEAPONS.sword, 2, -18, false, s);
  } else if (cls === "ranger") {
    hrDrawRows(c, attacking ? HR.WEAPONS.bow_draw : HR.WEAPONS.bow, -4, -10, false, s);
    if (attacking) hrDrawRows(c, HR.WEAPONS.arrow, 6, -8, false, s);
  } else {
    hrDrawRows(c, attacking ? HR.WEAPONS.staff_cast : HR.WEAPONS.staff, -2, -20, false, s);
    if (!attacking) hrDrawRows(c, HR.WEAPONS.staff_orb, -2, -24, false, s);
    else {
      c.globalAlpha = 0.55;
      c.fillStyle = "#88d8f0";
      c.beginPath(); c.arc(0, -22, 5, 0, Math.PI * 2); c.fill();
      c.globalAlpha = 0.25;
      c.beginPath(); c.arc(0, -22, 9, 0, Math.PI * 2); c.fill();
      c.globalAlpha = 1;
    }
    hrDrawRows(c, HR.WEAPONS.spellbook, -10, 2, false, s);
  }
  c.restore();
};

HR.drawRangerQuiver = (c, cx, cy, flip, sc, sway) => {
  const s = sc || HR.SCALE;
  const ox = flip ? -8 : 6;
  hrDrawRows(c, HR.WEAPONS.quiver, cx + ox, cy - 8 + (sway || 0), flip, s);
};

HR.drawMageRunes = (c, cx, cy, flip, frame, casting) => {
  if (!casting && frame % 3 !== 0) return;
  c.save();
  c.globalAlpha = casting ? 0.7 : 0.25;
  c.fillStyle = casting ? "#c8a8f0" : "#8868b8";
  const t = frame * 0.8;
  [[-8, -14], [8, -12], [0, -18]].forEach(([ox, oy], i) => {
    c.fillRect(cx + ox + Math.sin(t + i) * 2, cy + oy + Math.cos(t + i) * 2, 2, 2);
  });
  c.restore();
};

HR.drawShadow = (c, dx, w, groundY) => {
  c.save();
  c.fillStyle = "rgba(0,0,0,0.38)";
  c.beginPath();
  c.ellipse(dx + w / 2, groundY + 1, w * 0.42, 4.5, 0, 0, Math.PI * 2);
  c.fill();
  c.restore();
};

HR.applyWorldTint = (c, x, y, w, h, world) => {
  if (!world || typeof getCharStyle !== "function") return;
  applyWorldCharTint(c, x, y, w, h, world);
};

HR.draw = (c, opts) => {
  const { x, h, world, atkOff, hurtOff, classKey, aimX, aimY } = opts;
  const flip = h.facing < 0;
  const groundY = opts.groundY != null ? opts.groundY : HR.getGroundY();
  const ds = HR.DISPLAY_SCALE;
  const rawW = HR.NW * HR.SCALE;
  const rawH = (HR.getFootRow() + 1) * HR.SCALE;
  const dispW = HR.displayW();
  const dispH = HR.displayH();

  const leanOff = h.animState === "hurt" ? (h.animFrame || 0) * 1.5 : 0;
  const dx = x + atkOff + hurtOff - leanOff * (flip ? -1 : 1);
  const dy = groundY - dispH;
  const cx = dx + dispW / 2;
  const cy = dy + dispH * 0.4;
  const attacking = h.attackAnim > 0.04;
  const st = h.animState || "idle";
  const frame = h.animFrame || 0;
  const pose = hrPose(classKey, st, frame);
  const body = hrGetBody(classKey, st, frame);

  let angle = Math.atan2(aimY - cy, aimX - cx);
  if (!attacking && Math.abs(aimX - cx) < 12) angle = flip ? 2.4 : -0.7;

  if (typeof drawCharShadow === "function") {
    drawCharShadow(c, cx, groundY, dispW, getCharStyle(world), 0, false);
  }
  HR.drawShadow(c, dx, dispW, groundY);

  c.save();
  c.translate(cx, groundY);
  c.scale(ds, ds);
  c.translate(-cx, -groundY);

  const rawDx = cx - rawW / 2;
  const rawDy = groundY - rawH;
  const icx = cx;
  const icy = rawDy + rawH * 0.38;

  if (classKey === "warrior") HR.drawShield(c, icx, icy, flip, HR.SCALE, pose);
  if (classKey === "ranger") HR.drawRangerQuiver(c, icx, icy, flip, HR.SCALE, pose.sway);
  hrDrawRows(c, body, rawDx, rawDy, flip, HR.SCALE);
  HR.drawWeapon(c, classKey, icx, icy, angle, attacking, flip, HR.SCALE, pose);
  if (classKey === "mage") HR.drawMageRunes(c, icx, icy, flip, frame, attacking);

  c.restore();

  HR.applyWorldTint(c, dx, dy, dispW, dispH, world);
  if (typeof drawCharFeetFog === "function") drawCharFeetFog(c, dx, dy, dispW, dispH, world);
};

HR.drawPreview = (c, classKey, w, h) => {
  c.clearRect(0, 0, w, h);
  const fakeHero = {
    w: HR.displayW(), h: HR.displayH(), facing: 1,
    animState: "idle", animFrame: 0, attackAnim: 0, hurtAnim: 0, deathAnim: false
  };
  const ox = Math.floor((w - HR.displayW()) / 2);
  HR.draw(c, {
    x: ox, h: fakeHero, world: { theme: "forest" },
    atkOff: 0, hurtOff: 0, classKey,
    aimX: ox + HR.displayW() * 0.75, aimY: h * 0.4,
    groundY: h - 8
  });
};
