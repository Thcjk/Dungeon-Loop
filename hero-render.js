/* ==========================================================================
   Dungeon Loop – Hero Renderer (Modular Compositor)
   Zeichnet Layer aus hero-modules.js · Körper + Ausrüstung getrennt
   ========================================================================== */

const HR = {
  NW: 22,
  NH: 28,
  SCALE: 2,
  DISPLAY_SCALE: 0.84,
  CX: 11,

  ANIM: {
    idle:   { n: 6, t: 0.32 },
    walk:   { n: 8, t: 0.075 },
    attack: { n: 5, t: 0.065 },
    hurt:   { n: 3, t: 0.11 },
    death:  { n: 6, t: 0.2 }
  },

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

  THEMES: {
    forest: { rim: "rgba(82,183,136,0.12)" },
    swamp:  { rim: "rgba(82,183,136,0.1)" },
    frost:  { rim: "rgba(168,216,232,0.18)" },
    fire:   { rim: "rgba(243,156,18,0.14)" },
    ruins:  { rim: "rgba(187,134,252,0.12)" }
  }
};

HR._footRow = null;
HR._cache = {};

HR.getFootRow = () => {
  if (HR._footRow != null) return HR._footRow;
  HR._footRow = HR.NH - 1;
  return HR._footRow;
};

HR.displayW = () => Math.ceil(HR.NW * HR.SCALE * HR.DISPLAY_SCALE);
HR.displayH = () => Math.ceil((HR.getFootRow() + 1) * HR.SCALE * HR.DISPLAY_SCALE);
HR.getFootOffset = () => HR.displayH();
HR.getGroundY = () => (typeof GROUND !== "undefined" ? GROUND : 308);
HR.getDrawY = () => HR.getGroundY() - HR.displayH();

/** Loadout eines Helden (später: hero.equipment Overrides) */
HR.getHeroLoadout = (classKey, hero) => {
  const overrides = hero?.equipment || null;
  return typeof HM !== "undefined" ? HM.getLoadout(classKey, overrides) : null;
};

/* ---- Zeichen-Hilfen ---- */

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

function hrPose(state, frame) {
  const f = frame;
  const p = { breath: 0, sway: 0, armL: 0, armR: 0, legL: 0, legR: 0, drop: 0, death: 0, lean: 0 };
  if (state === "idle") {
    p.breath = f % 3 === 1 ? 1 : 0;
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
    p.lean = f; p.sway = f;
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

/** Modulares Körper-Grid (gecacht pro Loadout + Pose) */
function hrGetBodyGrid(loadout, state, frame) {
  const k = JSON.stringify(loadout) + "|" + state + "|" + frame;
  if (!HR._cache[k]) {
    HR._cache[k] = HM.composeBodyGrid(loadout, hrPose(state, frame));
  }
  return HR._cache[k];
}

/** Item an Ankerpunkt zeichnen */
function hrDrawItem(c, item, anchor, flip, sc, angle) {
  const s = sc || HR.SCALE;
  const off = item.offset || { x: 0, y: 0 };
  const grip = item.grip || { x: 0, y: 0 };
  c.save();
  c.translate(anchor.x + off.x, anchor.y + off.y);
  if (flip) c.scale(-1, 1);
  if (angle != null) c.rotate(angle);
  hrDrawRows(c, item.rows, -grip.x * s, -grip.y * s, false, s);
  c.restore();
}

function hrResolveAnchor(item, icy, pose, flip) {
  const attach = item.attach || "handR";
  if (attach === "handL") {
    const base = HM.getAnchor("handL", icy, pose);
    return { x: base.x + (flip ? 4 : -4), y: base.y };
  }
  if (attach === "handR") {
    const base = HM.getAnchor("handR", icy, pose);
    return { x: base.x + (flip ? -4 : 4), y: base.y };
  }
  if (attach === "back") {
    const base = HM.getAnchor("back", icy, pose);
    return { x: base.x + (flip ? -6 : 6), y: base.y };
  }
  return HM.getAnchor("torso", icy, pose);
}

function hrDrawLayerList(c, list, icy, flip, sc, pose, attacking, aimAngle) {
  list.forEach((layer) => {
    if (layer.kind === "effect") {
      layer.effect.draw(c, HR.CX, icy, 0, attacking);
      return;
    }
    const item = layer.item;
    const anchor = hrResolveAnchor(item, icy, pose, flip);
    let angle = null;
    if (item.slot === "weapon" || item.slot === "weapon_attack") {
      angle = attacking ? aimAngle : (item.idleAngle ?? (flip ? 2.4 : -0.7));
    }
    hrDrawItem(c, item, anchor, flip, sc, angle);
  });
}

/* ---- Animation ---- */

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

HR.drawShadow = (c, dx, w, groundY) => {
  c.save();
  c.fillStyle = "rgba(0,0,0,0.38)";
  c.beginPath();
  c.ellipse(dx + w / 2, groundY + 1, w * 0.42, 4.5, 0, 0, Math.PI * 2);
  c.fill();
  c.restore();
};

/** Haupt-Zeichenfunktion – composited aus Modul-Layern */
HR.draw = (c, opts) => {
  const { x, h, world, atkOff, hurtOff, classKey, aimX, aimY } = opts;
  const flip = h.facing < 0;
  const groundY = opts.groundY != null ? opts.groundY : HR.getGroundY();
  const ds = HR.DISPLAY_SCALE;
  const rawW = HR.NW * HR.SCALE;
  const rawH = (HR.getFootRow() + 1) * HR.SCALE;
  const dispW = HR.displayW();
  const dispH = HR.displayH();

  const loadout = HR.getHeroLoadout(classKey, h);
  const leanOff = h.animState === "hurt" ? (h.animFrame || 0) * 1.5 : 0;
  const dx = x + atkOff + hurtOff - leanOff * (flip ? -1 : 1);
  const dy = groundY - dispH;
  const cx = dx + dispW / 2;
  const cy = dy + dispH * 0.4;
  const attacking = h.attackAnim > 0.04;
  const st = h.animState || "idle";
  const frame = h.animFrame || 0;
  const pose = hrPose(st, frame);
  const body = hrGetBodyGrid(loadout, st, frame);

  let aimAngle = Math.atan2(aimY - cy, aimX - cx);
  if (!attacking && Math.abs(aimX - cx) < 12) aimAngle = flip ? 2.4 : -0.7;

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
  const icy = rawDy + rawH * 0.38;
  const { back, front, effects } = HM.collectCanvasLayers(loadout, pose, attacking);

  hrDrawLayerList(c, back, icy, flip, HR.SCALE, pose, attacking, aimAngle);
  hrDrawRows(c, body, rawDx, rawDy, flip, HR.SCALE);
  hrDrawLayerList(c, front, icy, flip, HR.SCALE, pose, attacking, aimAngle);
  effects.forEach((layer) => layer.effect.draw(c, HR.CX, icy, frame, attacking));

  c.restore();

  if (world && typeof applyWorldCharTint === "function") {
    applyWorldCharTint(c, dx, dy, dispW, dispH, world);
  }
  if (typeof drawCharFeetFog === "function") drawCharFeetFog(c, dx, dy, dispW, dispH, world);
};

HR.drawPreview = (c, classKey, w, h) => {
  c.clearRect(0, 0, w, h);
  const fakeHero = {
    w: HR.displayW(), h: HR.displayH(), facing: 1,
    animState: "idle", animFrame: 0, attackAnim: 0, hurtAnim: 0, deathAnim: false,
    equipment: null
  };
  const ox = Math.floor((w - HR.displayW()) / 2);
  HR.draw(c, {
    x: ox, h: fakeHero, world: { theme: "forest" },
    atkOff: 0, hurtOff: 0, classKey,
    aimX: ox + HR.displayW() * 0.75, aimY: h * 0.4,
    groundY: h - 8
  });
};

/** Cache leeren wenn Module/Loadouts geändert werden */
HR.invalidateCache = () => { HR._cache = {}; };

/* ---- Öffentliche Modular-API (Weiterleitung an HM) ---- */
HR.registerPart = (id, def) => { HM.registerPart(id, def); HR.invalidateCache(); };
HR.registerItem = (id, def) => { HM.registerItem(id, def); HR.invalidateCache(); };
HR.registerLoadout = (key, loadout) => { HM.registerLoadout(key, loadout); HR.invalidateCache(); };
HR.getLoadout = (classKey, overrides) => HM.getLoadout(classKey, overrides);
