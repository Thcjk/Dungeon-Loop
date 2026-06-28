/* ==========================================================================
   Dungeon Loop – Hero Renderer
   Ziel: leicht größer als Gegner (~33 px), gut lesbar, Menü füllt Rahmen
   ========================================================================== */

const HR = {
  NW: 22,
  NH: 28,
  SCALE: 2,
  /** Gegner (Goblin) ≈ 11×3 = 33 px – Held ~14 % größer ≈ 38 px */
  ENEMY_REF_PX: 33,
  HERO_VS_ENEMY: 1.14,
  DISPLAY_SCALE: 0.68,
  /** Menü: Held füllt ~86 % der Kartenhöhe */
  MENU_FILL: 0.86,
  OUTLINE: "rgba(6,4,10,0.95)",
  CX: 11,

  ANIM: {
    idle:   { n: 8, t: 0.28 },
    walk:   { n: 6, t: 0.07 },
    attack: { n: 5, t: 0.065 },
    hurt:   { n: 3, t: 0.11 },
    death:  { n: 6, t: 0.2 }
  },

  /** Helle Akzente – Lesbarkeit im dunklen Wald ohne Neon */
  PAL: {
    ".": null,
    "0": "#201810", "1": "#2a2218", "2": "#3a3228", "3": "#4a4034",
    "4": "#d8b890", "5": "#b89070", "6": "#f0e0c0", "7": "#987050",
    "8": "#785038", "9": "#483020",
    "a": "#788490", "b": "#98a8b8", "c": "#c0d0e0", "d": "#e0ecf8",
    "e": "#f4f8ff", "f": "#ffffff",
    "g": "#5a7a58", "h": "#6a9a68", "i": "#7aba78", "j": "#8ada88",
    "k": "#4a5a48", "l": "#3a4a38",
    "m": "#806848", "n": "#a08868", "o": "#c0a888", "p": "#e0c8a8",
    "q": "#584830", "r": "#786040", "s": "#987850",
    "t": "#485868", "u": "#587888", "v": "#7098a8", "w": "#90b8d0",
    "x": "#a8d8f0", "y": "#c8f0ff",
    "z": "#584878", "A": "#705898", "B": "#8870b0", "C": "#a890d0",
    "D": "#c8b0f0", "E": "#e8d0ff",
    "F": "#907038", "G": "#b08848", "H": "#d0a850", "I": "#f0c860",
    "J": "#684830", "K": "#886040", "L": "#a87850",
    "M": "#403830", "N": "#584840", "O": "#705850", "P": "#907868",
    "Q": "#b0a890", "R": "#d0c8b0",
    "S": "#282018", "T": "#505050", "U": "#686868", "V": "#909090",
    "W": "#b0b0b0", "X": "#d0d0d0", "Y": "#e8e8e8", "Z": "#ffffff",
    "!": "#486858", "@": "#588868", "#": "#68a878", "$": "#78c088",
    "%": "#88d898", "^": "#98e8a8",
    "&": "#683020", "*": "#884830", "(": "#a86040", ")": "#c87850",
    "-": "#e89868", "_": "#ffb080",
    "+": "#581818", "=": "#782828", "[": "#983838", "]": "#b84848",
    "{": "#d85858", "}": "#f87878",
    "|": "#201828", ";": "#302840", ":": "#403858", "'": "#505070",
    "<": "#606088", ">": "#7070a0",
    ",": "#483028", "`": "#684838", "~": "#885848", "?": "#b07058"
  },

  CLASS_ACCENT: {
    warrior: "rgba(255,220,160,0.38)",
    ranger:  "rgba(180,240,150,0.32)",
    mage:    "rgba(210,180,255,0.34)"
  }
};

HR._footRow = null;
HR._cache = {};

HR.getFootRow = () => {
  if (HR._footRow != null) return HR._footRow;
  HR._footRow = HR.NH - 1;
  return HR._footRow;
};

HR.displayW = (scale) => Math.ceil(HR.NW * HR.SCALE * (scale ?? HR.DISPLAY_SCALE));
HR.displayH = (scale) => Math.ceil((HR.getFootRow() + 1) * HR.SCALE * (scale ?? HR.DISPLAY_SCALE));
HR.getFootOffset = () => HR.displayH();
HR.getGroundY = () => (typeof GROUND !== "undefined" ? GROUND : 308);
HR.getDrawY = () => HR.getGroundY() - HR.displayH();
HR.getMenuScale = (canvasH, canvasW) => {
  const baseH = (HR.getFootRow() + 1) * HR.SCALE;
  const baseW = HR.NW * HR.SCALE;
  return Math.min((canvasH * HR.MENU_FILL) / baseH, (canvasW * 0.84) / baseW);
};

HR.getHeroLoadout = (classKey, hero) => {
  const overrides = hero?.equipment || null;
  return typeof HM !== "undefined" ? HM.getLoadout(classKey, overrides) : null;
};

function hrPixelFilled(rows, r, c) {
  if (r < 0 || r >= rows.length || c < 0 || c >= rows[r].length) return false;
  const ch = rows[r][c];
  return ch && ch !== "." && HR.PAL[ch];
}

function hrDrawRows(c, rows, x, y, flip, sc, pal) {
  const s = sc || HR.SCALE;
  const P = pal || HR.PAL;
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    for (let col = 0; col < row.length; col++) {
      const ch = row[col];
      const colr = P[ch];
      if (!colr) continue;
      const dc = flip ? row.length - 1 - col : col;
      c.fillStyle = colr;
      c.fillRect(Math.floor(x + dc * s), Math.floor(y + r * s), s, s);
    }
  }
}

/** 1 px dunkle Outline – Lesbarkeit trotz kleiner Größe */
function hrDrawRowsOutlined(c, rows, x, y, flip, sc, pal) {
  const s = sc || HR.SCALE;
  const P = pal || HR.PAL;
  const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, 1], [1, -1], [-1, -1]];
  c.fillStyle = HR.OUTLINE;
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    for (let col = 0; col < row.length; col++) {
      if (!hrPixelFilled(rows, r, col)) continue;
      const dc = flip ? row.length - 1 - col : col;
      const px = Math.floor(x + dc * s);
      const py = Math.floor(y + r * s);
      for (const [dr, dcol] of dirs) {
        if (!hrPixelFilled(rows, r + dr, col + dcol)) {
          c.fillRect(px + dcol, py + dr, s, s);
        }
      }
    }
  }
  hrDrawRows(c, rows, x, y, flip, s, P);
}

function hrPose(state, frame) {
  const f = frame;
  const p = {
    breath: 0, sway: 0, capeWave: 0, weaponSway: 0,
    armL: 0, armR: 0, legL: 0, legR: 0, drop: 0, death: 0, lean: 0
  };
  if (state === "idle") {
    const t = f / HR.ANIM.idle.n * Math.PI * 2;
    p.breath = Math.sin(t) > 0.2 ? 1 : 0;
    p.sway = Math.round(Math.sin(t * 0.7));
    p.capeWave = Math.round(Math.sin(t * 0.55 + 1) * 1.2);
    p.weaponSway = Math.sin(t * 0.45) * 0.06;
    p.armL = -1;
    p.armR = Math.sin(t * 0.5) > 0 ? 0 : 1;
  } else if (state === "walk") {
    const cycle = [0, 1, 1, 0, -1, -1];
    const ph = cycle[f % 6];
    p.legL = ph; p.legR = -ph;
    p.armL = -ph; p.armR = ph;
    p.sway = f % 2;
    p.breath = f % 3 === 1 ? 1 : 0;
  } else if (state === "attack") {
    p.armR = 1 + f;
    p.armL = -1 - Math.floor(f / 2);
    p.legL = 1; p.legR = -1;
    p.lean = f;
    p.sway = f;
  } else if (state === "hurt") {
    p.lean = 1 + f;
    p.armL = -1; p.armR = 1;
    p.drop = f;
  } else if (state === "death") {
    p.death = f + 1;
    p.drop = f + 1;
    p.armL = 2; p.armR = 2;
    p.legL = 2; p.legR = 2;
  }
  return p;
}

function hrGetBodyGrid(loadout, state, frame) {
  const k = JSON.stringify(loadout) + "|" + state + "|" + frame;
  if (!HR._cache[k]) {
    HR._cache[k] = HM.composeBodyGrid(loadout, hrPose(state, frame));
  }
  return HR._cache[k];
}

function hrDrawItem(c, item, anchor, flip, sc, angle, outlined) {
  const s = sc || HR.SCALE;
  const off = item.offset || { x: 0, y: 0 };
  const grip = item.grip || { x: 0, y: 0 };
  c.save();
  c.translate(anchor.x + off.x, anchor.y + off.y);
  if (flip) c.scale(-1, 1);
  if (angle != null) c.rotate(angle);
  const drawFn = outlined ? hrDrawRowsOutlined : hrDrawRows;
  drawFn(c, item.rows, -grip.x * s, -grip.y * s, false, s);
  c.restore();
}

function hrResolveAnchor(item, rawDx, rawDy, pose, flip) {
  const attach = item.attach || "handR";
  if (attach === "handL") {
    const base = HM.getAnchor("handL", rawDx, rawDy, pose, flip);
    return { x: base.x + (flip ? 4 : -4), y: base.y };
  }
  if (attach === "handR") {
    const base = HM.getAnchor("handR", rawDx, rawDy, pose, flip);
    return { x: base.x + (flip ? -4 : 4), y: base.y };
  }
  if (attach === "back") {
    const base = HM.getAnchor("back", rawDx, rawDy, pose, flip);
    return { x: base.x + (flip ? -5 : 5), y: base.y };
  }
  return HM.getAnchor("torso", rawDx, rawDy, pose, flip);
}

function hrDrawLayerList(c, list, rawDx, rawDy, flip, sc, pose, attacking, aimAngle, outlined) {
  list.forEach((layer) => {
    if (layer.kind === "effect") {
      const ax = HM.getAnchor("torso", rawDx, rawDy, pose, flip);
      layer.effect.draw(c, ax.x, ax.y - 6, 0, attacking);
      return;
    }
    const item = layer.item;
    const anchor = hrResolveAnchor(item, rawDx, rawDy, pose, flip);
    let angle = null;
    if (item.slot === "weapon" || item.slot === "weapon_attack") {
      const base = attacking ? aimAngle : (item.idleAngle ?? (flip ? 2.4 : -0.7));
      angle = base + (attacking ? 0 : (pose.weaponSway || 0));
    }
    hrDrawItem(c, item, anchor, flip, sc, angle, outlined);
  });
}

function hrDrawHeroGroundGlow(c, cx, groundY, w, menuMode) {
  c.save();
  const r = w * (menuMode ? 0.65 : 0.55);
  const g = c.createRadialGradient(cx, groundY, 1, cx, groundY - w * 0.15, r);
  g.addColorStop(0, menuMode ? "rgba(255,245,220,0.35)" : "rgba(255,240,210,0.22)");
  g.addColorStop(0.5, menuMode ? "rgba(255,230,190,0.12)" : "rgba(255,220,180,0.08)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  c.fillStyle = g;
  c.fillRect(cx - r, groundY - w, r * 2, w);
  c.restore();
}

function hrDrawHeroRim(c, dx, dy, w, h, classKey) {
  const cx = dx + w / 2;
  const cy = dy + h * 0.36;
  c.save();
  const accent = HR.CLASS_ACCENT[classKey] || "rgba(240,230,210,0.28)";
  const g = c.createRadialGradient(cx, cy, w * 0.05, cx, cy, w * 0.95);
  g.addColorStop(0, accent);
  g.addColorStop(0.4, "rgba(255,250,235,0.18)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  c.globalCompositeOperation = "screen";
  c.fillStyle = g;
  c.fillRect(dx - 8, dy - 8, w + 16, h + 16);
  c.restore();
}

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

HR.drawShadow = (c, dx, w, groundY, strong) => {
  c.save();
  c.fillStyle = strong ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.35)";
  c.beginPath();
  c.ellipse(dx + w / 2, groundY + 1, w * (strong ? 0.5 : 0.44), strong ? 5 : 3.5, 0, 0, Math.PI * 2);
  c.fill();
  c.restore();
};

function hrRenderHero(c, opts) {
  const {
    x, h, classKey, aimX, aimY, groundY,
    displayScale, menuMode, animFrame, animState
  } = opts;
  const flip = h.facing < 0;
  const ds = displayScale ?? HR.DISPLAY_SCALE;
  const rawW = HR.NW * HR.SCALE;
  const rawH = (HR.getFootRow() + 1) * HR.SCALE;
  const dispW = HR.displayW(ds);
  const dispH = HR.displayH(ds);
  const outlined = true;

  const loadout = HR.getHeroLoadout(classKey, h);
  const leanOff = animState === "hurt" ? (animFrame || 0) * 1.2 : 0;
  const dx = x + (opts.atkOff || 0) + (opts.hurtOff || 0) - leanOff * (flip ? -1 : 1);
  const dy = groundY - dispH;
  const cx = dx + dispW / 2;
  const cy = dy + dispH * 0.4;
  const attacking = (h.attackAnim || 0) > 0.04;
  const st = animState || h.animState || "idle";
  const frame = animFrame != null ? animFrame : (h.animFrame || 0);
  const pose = hrPose(st, frame);
  const body = hrGetBodyGrid(loadout, st, frame);

  let aimAngle = Math.atan2(aimY - cy, aimX - cx);
  if (!attacking && Math.abs(aimX - cx) < 10) aimAngle = flip ? 2.4 : -0.7;

  if (!menuMode && typeof drawCharShadow === "function" && opts.world) {
    drawCharShadow(c, cx, groundY, dispW, getCharStyle(opts.world), 0, false);
  }
  hrDrawHeroGroundGlow(c, cx, groundY, dispW, menuMode);
  HR.drawShadow(c, dx, dispW, groundY, menuMode);

  c.save();
  c.translate(cx, groundY);
  c.scale(ds, ds);
  c.translate(-cx, -groundY);

  const rawDx = cx - rawW / 2;
  const rawDy = groundY - rawH;
  const { back, front, effects } = HM.collectCanvasLayers(loadout, pose, attacking);

  hrDrawLayerList(c, back, rawDx, rawDy, flip, HR.SCALE, pose, attacking, aimAngle, outlined);
  hrDrawRowsOutlined(c, body, rawDx, rawDy, flip, HR.SCALE);
  hrDrawLayerList(c, front, rawDx, rawDy, flip, HR.SCALE, pose, attacking, aimAngle, outlined);
  const fxAnchor = HM.getAnchor("torso", rawDx, rawDy, pose, flip);
  effects.forEach((layer) => layer.effect.draw(c, fxAnchor.x, fxAnchor.y - 8, frame, attacking));

  c.restore();

  hrDrawHeroRim(c, dx, dy, dispW, dispH, classKey);
  /* Kein Welt-Tint auf dem Helden – bleibt im Vordergrund sichtbar */
}

HR.draw = (c, opts) => {
  const h = opts.h;
  hrRenderHero(c, {
    ...opts,
    groundY: opts.groundY != null ? opts.groundY : HR.getGroundY(),
    displayScale: HR.DISPLAY_SCALE,
    menuMode: false,
    animState: h.animState,
    animFrame: h.animFrame
  });
};

/** Heldenkarte – Held füllt den Rahmen (2–3× Spielgröße) */
HR.drawHeroCard = (c, classKey, w, h, frame) => {
  c.clearRect(0, 0, w, h);
  c.imageSmoothingEnabled = false;

  const grad = c.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "#344458");
  grad.addColorStop(0.5, "#3a4a60");
  grad.addColorStop(1, "#283038");
  c.fillStyle = grad;
  c.fillRect(0, 0, w, h);

  c.save();
  c.globalAlpha = 0.75;
  const spot = c.createRadialGradient(w * 0.5, h * 0.5, 4, w * 0.5, h * 0.48, Math.max(w, h) * 0.55);
  spot.addColorStop(0, "rgba(255,252,235,0.75)");
  spot.addColorStop(0.4, "rgba(255,240,200,0.25)");
  spot.addColorStop(1, "rgba(0,0,0,0)");
  c.fillStyle = spot;
  c.fillRect(0, 0, w, h);
  c.restore();

  c.strokeStyle = "rgba(255,255,255,0.12)";
  c.strokeRect(0.5, 0.5, w - 1, h - 1);

  const cardScale = HR.getMenuScale(h, w);
  const dispW = Math.ceil(HR.NW * HR.SCALE * cardScale);
  const dispH = Math.ceil((HR.getFootRow() + 1) * HR.SCALE * cardScale);

  const fakeHero = {
    w: dispW, h: dispH,
    facing: 1, animState: "idle", animFrame: frame || 0,
    attackAnim: 0, hurtAnim: 0, deathAnim: false, equipment: null
  };
  const ox = Math.floor((w - dispW) / 2);
  const groundY = h - Math.max(18, Math.floor(h * 0.04));

  hrRenderHero(c, {
    x: ox, h: fakeHero, classKey,
    aimX: ox + dispW * 0.78, aimY: groundY - dispH * 0.42,
    groundY, displayScale: cardScale, menuMode: true,
    animState: "idle", animFrame: frame || 0
  });
};

HR.drawPreview = (c, classKey, w, h) => {
  HR.drawHeroCard(c, classKey, w, h, 0);
};

HR.invalidateCache = () => { HR._cache = {}; };

HR.registerPart = (id, def) => { HM.registerPart(id, def); HR.invalidateCache(); };
HR.registerItem = (id, def) => { HM.registerItem(id, def); HR.invalidateCache(); };
HR.registerLoadout = (key, loadout) => { HM.registerLoadout(key, loadout); HR.invalidateCache(); };
HR.getLoadout = (classKey, overrides) => HM.getLoadout(classKey, overrides);
