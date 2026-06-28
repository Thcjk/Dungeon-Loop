/* Hero Renderer – kompakt wie Gegner (14×14 Grid, 3× Skalierung → ~42×42 px) */
const HR = {
  NW: 14,
  NH: 14,
  SCALE: 3,
  PAL: {
    ".": null,
    "0": "#14100e", "1": "#2a221c", "2": "#3d342c",
    "3": "#c4a078", "4": "#9a7858", "5": "#dcc8a8",
    "6": "#3a2a20", "7": "#5c4030", "8": "#7a5840",
    "9": "#2a3238", "a": "#3d4850", "b": "#586068",
    "c": "#8a949e", "d": "#b0bac4", "e": "#dce4ec",
    "f": "#4a3828", "g": "#6a5038", "h": "#8a6848",
    "i": "#505860", "j": "#788490", "k": "#a0a8b0",
    "l": "#2a2018", "m": "#403028", "n": "#584838",
    "o": "#283848", "p": "#406080", "q": "#6090b8",
    "r": "#88b8d8", "s": "#3a2818", "t": "#5a3820",
    "u": "#7a5030", "v": "#285838", "w": "#408858",
    "x": "#60a878", "y": "#382820", "z": "#201810",
    "A": "#484038", "B": "#686058", "C": "#887868",
    "D": "#a89070", "E": "#c8b090", "F": "#686048"
  },
  ANIM: {
    idle:  { n: 4, t: 0.38 },
    walk:  { n: 6, t: 0.09 },
    attack:{ n: 4, t: 0.07 },
    hurt:  { n: 2, t: 0.14 },
    death: { n: 4, t: 0.22 }
  }
};

HR._footRow = null;

HR.getFootRow = () => {
  if (HR._footRow != null) return HR._footRow;
  let last = 0;
  ["warrior", "ranger", "mage"].forEach((cls) => {
    Object.keys(HR.ANIM).forEach((st) => {
      for (let f = 0; f < HR.ANIM[st].n; f++) {
        hrGetBody(cls, st, f).forEach((row, r) => {
          if (/[^.]/.test(row)) last = Math.max(last, r);
        });
      }
    });
  });
  HR._footRow = last;
  return last;
};

HR.displayW = () => HR.NW * HR.SCALE;
HR.displayH = () => (HR.getFootRow() + 1) * HR.SCALE;
HR.getFootOffset = () => HR.displayH();
HR.getGroundY = () => (typeof GROUND !== "undefined" ? GROUND : 308);
HR.getDrawY = () => HR.getGroundY() - HR.displayH();

function hrDrawRows(c, rows, x, y, flip, sc) {
  const s = sc || HR.SCALE;
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    for (let col = 0; col < row.length; col++) {
      const ch = row[col];
      const colr = HR.PAL[ch];
      if (!colr) continue;
      const dc = flip ? row.length - 1 - col : col;
      c.fillStyle = colr;
      c.fillRect(Math.floor(x + dc * s), Math.floor(y + r * s), s, s);
    }
  }
}

function hrBlank() {
  return Array(HR.NH).fill(null).map(() => ".".repeat(HR.NW).split(""));
}

function hrSet(g, x, y, ch) {
  if (y < 0 || y >= HR.NH || x < 0 || x >= HR.NW) return;
  g[y][x] = ch;
}

function hrFill(g, x0, y0, x1, y1, ch) {
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) hrSet(g, x, y, ch);
}

function hrRow(g, y, xs, s) {
  for (let i = 0; i < s.length; i++) hrSet(g, xs + i, y, s[i]);
}

function hrGrid(g) {
  return g.map((r) => r.join(""));
}

function hrHead(g, cx, y, skin, hair, cls) {
  hrFill(g, cx - 2, y, cx + 2, y, "0");
  hrFill(g, cx - 3, y + 1, cx + 3, y + 2, hair);
  hrFill(g, cx - 2, y + 2, cx + 2, y + 4, skin);
  hrSet(g, cx - 1, y + 3, "z"); hrSet(g, cx + 1, y + 3, "z");
  hrSet(g, cx, y + 4, "4");
  if (cls === "warrior") {
    hrRow(g, y + 1, cx - 1, "878");
    hrSet(g, cx, y + 4, "6");
  }
  if (cls === "ranger") {
    hrFill(g, cx - 3, y + 1, cx + 3, y + 2, "v");
    hrSet(g, cx - 1, y + 3, "4"); hrSet(g, cx + 1, y + 3, "4");
  }
  if (cls === "mage") {
    hrFill(g, cx - 3, y, cx + 3, y + 2, "o");
    hrFill(g, cx - 2, y + 1, cx + 2, y + 3, "p");
    hrSet(g, cx, y + 3, "x");
  }
}

function hrTorso(g, cx, y, cls, breath) {
  const by = breath | 0;
  if (cls === "warrior") {
    hrFill(g, cx - 3, y + by, cx + 3, y + 1 + by, "0");
    hrFill(g, cx - 2, y + 1 + by, cx + 2, y + 4 + by, "c");
    hrFill(g, cx - 1, y + 2 + by, cx + 1, y + 3 + by, "e");
    hrRow(g, y + 4 + by, cx - 2, "fgf");
  } else if (cls === "ranger") {
    hrFill(g, cx - 2, y + by, cx + 2, y + 1 + by, "0");
    hrFill(g, cx - 2, y + 1 + by, cx + 2, y + 4 + by, "g");
    hrFill(g, cx - 1, y + 2 + by, cx + 1, y + 3 + by, "h");
    hrRow(g, y + 4 + by, cx - 1, "fff");
    hrSet(g, cx + 3, y + 2 + by, "t");
  } else {
    hrFill(g, cx - 2, y + by, cx + 2, y + 1 + by, "0");
    hrFill(g, cx - 3, y + 1 + by, cx + 3, y + 4 + by, "o");
    hrFill(g, cx - 2, y + 2 + by, cx + 2, y + 3 + by, "q");
    hrRow(g, y + 3 + by, cx - 1, "wx");
  }
}

function hrArm(g, cx, y, side, swing, cls) {
  const s = side < 0 ? -1 : 1;
  const ax = cx + s * 3 + (swing * s | 0);
  const ay = y + 1 - Math.abs(swing);
  const col = cls === "warrior" ? "c" : cls === "ranger" ? "g" : "p";
  const hand = cls === "warrior" ? "d" : "h";
  hrFill(g, ax, ay, ax, ay + 2, "0");
  hrSet(g, ax, ay + 1, col);
  hrSet(g, ax + (s > 0 ? 0 : 0), ay + 2, hand);
}

function hrLeg(g, cx, y, side, phase, cls) {
  const s = side < 0 ? -1 : 1;
  const px = cx + s * 1 + (phase * s | 0);
  const py = y + (phase > 0 ? 1 : 0);
  const boot = cls === "mage" ? "o" : "l";
  const thigh = cls === "warrior" ? "a" : cls === "ranger" ? "f" : "o";
  hrSet(g, px, py, "0");
  hrSet(g, px, py + 1, thigh);
  hrSet(g, px, py + 2, boot);
}

function hrCape(g, cx, y, sway, cls) {
  if (cls === "warrior") {
    hrSet(g, cx - 4, y + 2 + sway, "q");
    hrSet(g, cx + 4, y + 2 - sway, "q");
  }
  if (cls === "mage") {
    hrSet(g, cx - 4, y + 1 + sway, "n");
    hrSet(g, cx + 4, y + 1 - sway, "n");
  }
}

function hrBuildBody(cls, pose) {
  const g = hrBlank();
  const cx = 7;
  const headY = 0 + (pose.death > 0 ? pose.death : 0);
  const torsoY = 5 + (pose.death > 1 ? 2 : 0);
  const legY = 10 + (pose.death > 2 ? 1 : 0);
  const skin = "3", hair = cls === "mage" ? "o" : cls === "ranger" ? "7" : "6";
  hrHead(g, cx, headY, skin, hair, cls);
  hrTorso(g, cx, torsoY, cls, pose.breath);
  hrCape(g, cx, torsoY, pose.sway, cls);
  hrArm(g, cx, torsoY, -1, pose.armL, cls);
  hrArm(g, cx, torsoY, 1, pose.armR, cls);
  hrLeg(g, cx, legY, -1, pose.legL, cls);
  hrLeg(g, cx, legY, 1, pose.legR, cls);
  if (cls === "ranger") {
    hrSet(g, cx + 3, torsoY + 2, "s");
    hrSet(g, cx + 3, torsoY + 3, "t");
  }
  if (cls === "mage") {
    hrSet(g, cx - 4, torsoY + 3, "f");
    hrSet(g, cx - 4, torsoY + 4, "x");
  }
  return hrGrid(g);
}

function hrPose(cls, state, frame) {
  const f = frame;
  const p = { breath: 0, sway: 0, armL: 0, armR: 0, legL: 0, legR: 0, hurt: 0, death: 0 };
  if (state === "idle") {
    p.breath = f % 2;
    p.sway = (f % 4) < 2 ? 0 : 1;
    p.armL = -1; p.armR = 1;
  } else if (state === "walk") {
    const w = [0, 1, 1, 0, -1, -1];
    p.legL = w[f % 6]; p.legR = -w[f % 6];
    p.armL = -w[f % 6]; p.armR = w[f % 6];
    p.sway = f % 2;
  } else if (state === "attack") {
    p.armR = 1 + f;
    p.armL = -1 - f;
    p.legL = 1; p.legR = 0;
  } else if (state === "hurt") {
    p.hurt = 1;
    p.armL = -1; p.armR = 1;
  } else if (state === "death") {
    p.death = f + 1;
    p.armL = 2; p.armR = 2;
  }
  return p;
}

HR._cache = {};
function hrGetBody(cls, state, frame) {
  const k = cls + state + frame;
  if (!HR._cache[k]) HR._cache[k] = hrBuildBody(cls, hrPose(cls, state, frame));
  return HR._cache[k];
}

/* ---- Ausrüstung (skaliert mit 3×) ---- */
HR.GEAR = {
  sword: [
    "..00..",".0ee0.",".0ee0.",".0dd0.",".0dd0.",".0ff0.",".0tt0.","..00.."
  ],
  sword_swing: [
    "..00..",".0ee0.","0eee0.","0dd0..","0ff0..",".0tt0.","..00.."
  ],
  shield: [
    "..00..",".0gD0.","0gDD0.","0gDD0.",".0gG0.","..00.."
  ],
  bow: [
    "..0..",".0u0.","0u.u0","0u.u0",".0u0.","..0.."
  ],
  bow_draw: [
    "..0..",".0u0.","0ueu0","0ueu0",".0u0.","..0.."
  ],
  staff: [
    "..00..",".0uu0.",".0tt0.",".0qq0.",".0xx0.","..00.."
  ],
  staff_cast: [
    "..00..",".0tt0.","0qrr0","0qrr0",".0xx0.","..00.."
  ],
  spellbook: [
    ".00.","0ff0","0xx0",".00."
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

HR.drawGear = (c, cls, cx, cy, angle, attacking, flip) => {
  const sc = HR.SCALE;
  c.save();
  c.translate(cx, cy);
  if (flip) c.scale(-1, 1);
  c.rotate(angle);
  if (cls === "warrior") {
    hrDrawRows(c, HR.GEAR.shield, -5, -3, false, sc);
    hrDrawRows(c, attacking ? HR.GEAR.sword_swing : HR.GEAR.sword, 1, -10, false, sc);
  } else if (cls === "ranger") {
    hrDrawRows(c, attacking ? HR.GEAR.bow_draw : HR.GEAR.bow, -2, -6, false, sc);
  } else {
    hrDrawRows(c, attacking ? HR.GEAR.staff_cast : HR.GEAR.staff, -1, -10, false, sc);
    if (attacking) {
      c.globalAlpha = 0.4;
      c.fillStyle = "#68d898";
      c.beginPath(); c.arc(0, -12, 3, 0, Math.PI * 2); c.fill();
      c.globalAlpha = 1;
    }
    hrDrawRows(c, HR.GEAR.spellbook, -6, 1, false, sc);
  }
  c.restore();
};

HR.drawShadow = (c, dx, w, groundY) => {
  c.save();
  c.fillStyle = "rgba(0,0,0,0.35)";
  c.beginPath();
  c.ellipse(dx + w / 2, groundY + 1, w * 0.38, 4, 0, 0, Math.PI * 2);
  c.fill();
  c.restore();
};

HR.draw = (c, opts) => {
  const { x, h, world, atkOff, hurtOff, classKey, aimX, aimY } = opts;
  const flip = h.facing < 0;
  const groundY = opts.groundY != null ? opts.groundY : HR.getGroundY();
  const dx = x + atkOff + hurtOff;
  const dy = groundY - HR.displayH();
  const cx = dx + h.w / 2;
  const cy = dy + h.h * 0.42;
  const attacking = h.attackAnim > 0.04;
  const st = h.animState || "idle";
  const frame = h.animFrame || 0;
  const body = hrGetBody(classKey, st, frame);
  let angle = Math.atan2(aimY - cy, aimX - cx);
  if (!attacking && Math.abs(aimX - cx) < 8) angle = flip ? 2.5 : -0.65;

  drawCharShadow(c, cx, groundY, h.w, getCharStyle(world), 0, false);
  HR.drawShadow(c, dx, h.w, groundY);
  if (classKey === "warrior") {
    c.save(); c.translate(cx, cy);
    if (flip) c.scale(-1, 1);
    hrDrawRows(c, HR.GEAR.shield, -7, -2, false, HR.SCALE);
    c.restore();
  }
  hrDrawRows(c, body, dx, dy, flip, HR.SCALE);
  HR.drawGear(c, classKey, cx, cy, angle, attacking, flip);
};

HR.drawPreview = (c, classKey, w, h) => {
  c.clearRect(0, 0, w, h);
  const body = hrGetBody(classKey, "idle", 0);
  const bw = HR.displayW();
  const bh = HR.displayH();
  const ox = Math.floor((w - bw) / 2);
  const oy = Math.floor((h - bh) / 2) + 8;
  const cx = ox + bw / 2;
  const cy = oy + bh * 0.42;
  if (classKey === "warrior") {
    c.save(); c.translate(cx, cy);
    hrDrawRows(c, HR.GEAR.shield, -7, -2, false, HR.SCALE);
    c.restore();
  }
  hrDrawRows(c, body, ox, oy, false, HR.SCALE);
  HR.drawGear(c, classKey, cx, cy, -0.65, false, false);
};
