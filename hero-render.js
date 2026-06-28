/* ==========================================================================
   Dungeon Loop – Hero Renderer (Modular Compositor)
   Lesbarkeit: größer, Kontrast, 1px-Outline, Heldenkarte im Menü
   ========================================================================== */

const HR = {
  NW: 22,
  NH: 28,
  SCALE: 2,
  /** In-Game – gut lesbar, nicht übergroß */
  DISPLAY_SCALE: 1.15,
  /** Startmenü: dynamisch an Kartenrahmen angepasst (Basis 3.5×) */
  PREVIEW_SCALE: 3.5,
  OUTLINE: "rgba(10,8,14,0.88)",
  CX: 11,

  ANIM: {
    idle:   { n: 8, t: 0.28 },
    walk:   { n: 8, t: 0.075 },
    attack: { n: 5, t: 0.065 },
    hurt:   { n: 3, t: 0.11 },
    death:  { n: 6, t: 0.2 }
  },

  /** Aufgehellte Palette – besserer Kontrast im dunklen Wald */
  PAL: {
    ".": null,
    "0": "#181412", "1": "#242018", "2": "#342c26", "3": "#443a32",
    "4": "#c8a888", "5": "#a88868", "6": "#ecd8b8", "7": "#886848",
    "8": "#6a4838", "9": "#3a2a22",
    "a": "#6a727a", "b": "#8894a0", "c": "#b0bcc8", "d": "#d0dce8",
    "e": "#e8f0f8", "f": "#fafcff",
    "g": "#4a5a48", "h": "#5a7258", "i": "#6a8a68", "j": "#7aa878",
    "k": "#3a4838", "l": "#2a3428",
    "m": "#6a5848", "n": "#8a7058", "o": "#aa9070", "p": "#cab090",
    "q": "#483828", "r": "#685040", "s": "#886858",
    "t": "#384858", "u": "#485868", "v": "#607888", "w": "#7898b0",
    "x": "#98c8e0", "y": "#b8e0f0",
    "z": "#483868", "A": "#604880", "B": "#7858a0", "C": "#9878c0",
    "D": "#b898e0", "E": "#d8b8f8",
    "F": "#7a6038", "G": "#9a7848", "H": "#ba9848", "I": "#dab858",
    "J": "#5a4838", "K": "#7a6048", "L": "#9a7858",
    "M": "#383028", "N": "#504838", "O": "#685848", "P": "#887060",
    "Q": "#a8a090", "R": "#c8c0b0",
    "S": "#1a1818", "T": "#404040", "U": "#585858", "V": "#787878",
    "W": "#989898", "X": "#b8b8b8", "Y": "#d8d8d8", "Z": "#f0f0f0",
    "!": "#385848", "@": "#486858", "#": "#587868", "$": "#689878",
    "%": "#78a888", "^": "#88b898",
    "&": "#583020", "*": "#784030", "(": "#985040", ")": "#b86850",
    "-": "#d88860", "_": "#f0a878",
    "+": "#481818", "=": "#682828", "[": "#883838", "]": "#a84848",
    "{": "#c85858", "}": "#e87878",
    "|": "#181828", ";": "#282840", ":": "#383858", "'": "#484870",
    "<": "#585888", ">": "#6868a0",
    ",": "#403028", "`": "#604838", "~": "#805848", "?": "#a06858"
  },

  CLASS_ACCENT: {
    warrior: "rgba(220,200,160,0.22)",
    ranger:  "rgba(140,200,140,0.18)",
    mage:    "rgba(180,160,240,0.20)"
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

HR.getHeroLoadout = (classKey, hero) => {
  const overrides = hero?.equipment || null;
  return typeof HM !== "undefined" ? HM.getLoadout(classKey, overrides) : null;
};

/* ---- Zeichen-Hilfen ---- */

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

/** Dezente 1-Pixel-Outline – 8 Richtungen für bessere Silhouette */
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
    p.sway = Math.round(Math.sin(t * 0.7) * 1.2);
    p.capeWave = Math.round(Math.sin(t * 0.55 + 1) * 1.5);
    p.weaponSway = Math.sin(t * 0.45) * 0.07;
    p.armL = -1;
    p.armR = Math.sin(t * 0.5) > 0 ? 0 : 1;
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
    return { x: base.x + (flip ? 5 : -5), y: base.y };
  }
  if (attach === "handR") {
    const base = HM.getAnchor("handR", rawDx, rawDy, pose, flip);
    return { x: base.x + (flip ? -5 : 5), y: base.y };
  }
  if (attach === "back") {
    const base = HM.getAnchor("back", rawDx, rawDy, pose, flip);
    return { x: base.x + (flip ? -7 : 7), y: base.y };
  }
  return HM.getAnchor("torso", rawDx, rawDy, pose, flip);
}

function hrDrawLayerList(c, list, rawDx, rawDy, flip, sc, pose, attacking, aimAngle, outlined) {
  list.forEach((layer) => {
    if (layer.kind === "effect") {
      const ax = HM.getAnchor("torso", rawDx, rawDy, pose, flip);
      layer.effect.draw(c, ax.x, ax.y - 8, 0, attacking);
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

/** Dezente Helden-Randbeleuchtung – hebt vom dunklen Wald ab */
function hrDrawHeroRim(c, dx, dy, w, h, classKey) {
  const cx = dx + w / 2;
  const cy = dy + h * 0.38;
  c.save();
  const accent = HR.CLASS_ACCENT[classKey] || "rgba(200,190,170,0.12)";
  const g = c.createRadialGradient(cx, cy, w * 0.08, cx, cy, w * 0.75);
  g.addColorStop(0, accent);
  g.addColorStop(0.45, "rgba(235,225,210,0.12)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  c.globalCompositeOperation = "screen";
  c.fillStyle = g;
  c.fillRect(dx - 6, dy - 6, w + 12, h + 12);
  c.restore();
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

HR.drawShadow = (c, dx, w, groundY, strong) => {
  c.save();
  c.fillStyle = strong ? "rgba(0,0,0,0.48)" : "rgba(0,0,0,0.38)";
  c.beginPath();
  c.ellipse(dx + w / 2, groundY + 2, w * (strong ? 0.48 : 0.42), strong ? 6 : 4.5, 0, 0, Math.PI * 2);
  c.fill();
  c.restore();
};

/** Kern-Render – In-Game & Menü teilen sich dieselbe Pipeline */
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
  const leanOff = animState === "hurt" ? (animFrame || 0) * 1.5 : 0;
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
  if (!attacking && Math.abs(aimX - cx) < 12) aimAngle = flip ? 2.4 : -0.7;

  if (!menuMode && typeof drawCharShadow === "function" && opts.world) {
    drawCharShadow(c, cx, groundY, dispW, getCharStyle(opts.world), 0, false);
  }
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
  effects.forEach((layer) => layer.effect.draw(c, fxAnchor.x, fxAnchor.y - 10, frame, attacking));

  c.restore();

  hrDrawHeroRim(c, dx, dy, dispW, dispH, classKey);

  if (!menuMode && opts.world) {
    if (typeof applyWorldCharTint === "function") {
      c.save();
      c.globalAlpha = 0.18;
      applyWorldCharTint(c, dx, dy, dispW, dispH, opts.world);
      c.restore();
    }
    if (typeof drawCharFeetFog === "function") {
      c.save();
      c.globalAlpha = 0.08;
      drawCharFeetFog(c, dx, dy, dispW, dispH, opts.world);
      c.restore();
    }
  }
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

/** Heldenkarte im Startmenü – große Idle-Vorschau mit Beleuchtung */
HR.drawHeroCard = (c, classKey, w, h, frame) => {
  c.clearRect(0, 0, w, h);
  c.imageSmoothingEnabled = false;

  const grad = c.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "#243040");
  grad.addColorStop(0.5, "#2a3848");
  grad.addColorStop(1, "#1a2028");
  c.fillStyle = grad;
  c.fillRect(0, 0, w, h);

  c.save();
  c.globalAlpha = 0.55;
  const spot = c.createRadialGradient(w * 0.5, h * 0.46, 4, w * 0.5, h * 0.46, w * 0.62);
  spot.addColorStop(0, "rgba(255,240,210,0.55)");
  spot.addColorStop(0.55, "rgba(255,230,200,0.12)");
  spot.addColorStop(1, "rgba(0,0,0,0)");
  c.fillStyle = spot;
  c.fillRect(0, 0, w, h);
  c.restore();

  c.strokeStyle = "rgba(255,255,255,0.08)";
  c.strokeRect(0.5, 0.5, w - 1, h - 1);

  const baseSpriteH = (HR.getFootRow() + 1) * HR.SCALE;
  const baseSpriteW = HR.NW * HR.SCALE;
  const cardScale = Math.min((h * 0.88) / baseSpriteH, (w * 0.78) / baseSpriteW);
  const dispW = Math.ceil(baseSpriteW * cardScale);
  const dispH = Math.ceil(baseSpriteH * cardScale);

  const fakeHero = {
    w: dispW, h: dispH,
    facing: 1, animState: "idle", animFrame: frame || 0,
    attackAnim: 0, hurtAnim: 0, deathAnim: false, equipment: null
  };
  const ox = Math.floor((w - dispW) / 2);
  const groundY = h - Math.max(14, Math.floor(h * 0.06));

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
