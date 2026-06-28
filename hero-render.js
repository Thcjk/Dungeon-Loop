/* ==========================================================================
   Dungeon Loop – Character Renderer v2
   Vollständige Körper-Sprites + Equipment-Layer (kein Pixel-Zusammenbau)
   ========================================================================== */

const HR = {
  /** Kampf: ~36 px – ca. 10–15 % größer als Gegner (~33 px) */
  DISPLAY_SCALE: 1.0,
  MENU_FILL: 0.86,
  OUTLINE: "rgba(4,2,8,0.95)",

  ANIM: {
    idle:   { n: 4, t: 0.28 },
    walk:   { n: 4, t: 0.075 },
    attack: { n: 3, t: 0.07 },
    hurt:   { n: 1, t: 0.14 },
    death:  { n: 2, t: 0.22 }
  },

  CLASS_ACCENT: {
    warrior: "rgba(255,220,160,0.32)",
    ranger:  "rgba(170,240,140,0.28)",
    mage:    "rgba(210,180,255,0.30)"
  }
};

/* ---- Zeichen-Hilfen ---- */

function hrPxFilled(rows, r, c) {
  if (r < 0 || r >= rows.length || c < 0 || c >= rows[r].length) return false;
  const ch = rows[r][c];
  return ch && ch !== "." && CHR.PAL[ch];
}

function hrDrawRows(c, rows, x, y, flip, pal) {
  const P = pal || CHR.PAL;
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    for (let col = 0; col < row.length; col++) {
      const colr = P[row[col]];
      if (!colr) continue;
      const dc = flip ? row.length - 1 - col : col;
      c.fillStyle = colr;
      c.fillRect(Math.floor(x + dc), Math.floor(y + r), 1, 1);
    }
  }
}

function hrDrawOutlined(c, rows, x, y, flip, pal) {
  const P = pal || CHR.PAL;
  const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, 1], [1, -1], [-1, -1]];
  c.fillStyle = HR.OUTLINE;
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    for (let col = 0; col < row.length; col++) {
      if (!hrPxFilled(rows, r, col)) continue;
      const dc = flip ? row.length - 1 - col : col;
      const px = Math.floor(x + dc);
      const py = Math.floor(y + r);
      for (const [dr, dcol] of dirs) {
        if (!hrPxFilled(rows, r + dr, col + dcol)) {
          c.fillRect(px + dcol, py + dr, 1, 1);
        }
      }
    }
  }
  hrDrawRows(c, rows, x, y, flip, P);
}

function hrFlipGrip(grip, flip, w) {
  if (!flip) return { x: grip.x, y: grip.y };
  return { x: w - 1 - grip.x, y: grip.y };
}

function hrCanvasGrip(rawX, rawY, grip, flip) {
  const g = hrFlipGrip(grip, flip, CHR.W);
  return { x: rawX + g.x, y: rawY + g.y };
}

function hrDrawEquip(c, equipId, anchorX, anchorY, flip, angle, outlined) {
  const eq = CHR.EQUIP[equipId];
  if (!eq) return;
  const off = eq.offset || { x: 0, y: 0 };
  const grip = eq.grip || { x: 0, y: 0 };
  c.save();
  c.translate(anchorX + (flip ? -off.x : off.x), anchorY + off.y);
  if (flip) c.scale(-1, 1);
  if (angle != null) c.rotate(angle);
  const drawFn = outlined ? hrDrawOutlined : hrDrawRows;
  drawFn(c, eq.rows, -grip.x, -grip.y, false);
  c.restore();
}

function hrDrawShadow(c, cx, footY, w, strong) {
  c.save();
  c.fillStyle = strong ? "rgba(0,0,0,0.48)" : "rgba(0,0,0,0.34)";
  c.beginPath();
  c.ellipse(cx, footY + 1, w * 0.44, strong ? 4 : 3, 0, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

function hrDrawGroundGlow(c, cx, footY, w, menu) {
  c.save();
  const r = w * (menu ? 0.7 : 0.58);
  const g = c.createRadialGradient(cx, footY, 1, cx, footY - w * 0.2, r);
  g.addColorStop(0, menu ? "rgba(255,248,225,0.4)" : "rgba(255,240,210,0.24)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  c.fillStyle = g;
  c.fillRect(cx - r, footY - w, r * 2, w);
  c.restore();
}

function hrDrawRim(c, dx, dy, w, h, classKey) {
  const cx = dx + w / 2;
  const cy = dy + h * 0.35;
  c.save();
  const accent = HR.CLASS_ACCENT[classKey] || "rgba(240,230,210,0.2)";
  const g = c.createRadialGradient(cx, cy, 2, cx, cy, w * 0.85);
  g.addColorStop(0, accent);
  g.addColorStop(0.45, "rgba(255,250,235,0.14)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  c.globalCompositeOperation = "screen";
  c.fillStyle = g;
  c.fillRect(dx - 6, dy - 6, w + 12, h + 12);
  c.restore();
}

/* ---- Größe ---- */

HR.displayW = (scale) => Math.ceil(CHR.W * (scale ?? HR.DISPLAY_SCALE));
HR.displayH = (scale) => Math.ceil(CHR.H * (scale ?? HR.DISPLAY_SCALE));
HR.getGroundY = () => (typeof GROUND !== "undefined" ? GROUND : 308);
HR.getDrawY = () => HR.getGroundY() - HR.displayH();
HR.getMenuScale = (canvasH, canvasW) =>
  Math.min((canvasH * HR.MENU_FILL) / CHR.H, (canvasW * 0.84) / CHR.W);

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
  const cfg = HR.ANIM[st] || HR.ANIM.idle;
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

/* ---- Kern-Renderer ---- */

function hrRenderCharacter(c, opts) {
  const {
    x, h, classKey, aimX, aimY, groundY,
    displayScale, menuMode, animFrame, animState
  } = opts;

  const clsDef = CHR.getClassDef(classKey);
  const flip = h.facing < 0;
  const ds = displayScale ?? HR.DISPLAY_SCALE;
  const dispW = HR.displayW(ds);
  const dispH = HR.displayH(ds);
  const attacking = (h.attackAnim || 0) > 0.04;
  const st = animState || h.animState || "idle";
  const fi = animFrame != null ? animFrame : (h.animFrame || 0);
  const frame = CHR.getFrame(classKey, st, fi, attacking);

  const leanOff = st === "hurt" ? (fi || 0) * 1.5 : 0;
  const dx = x + (opts.atkOff || 0) + (opts.hurtOff || 0) - leanOff * (flip ? -1 : 1);
  const dy = groundY - dispH;
  const cx = dx + dispW / 2;
  const cy = dy + dispH * 0.38;

  let aimAngle = Math.atan2(aimY - cy, aimX - cx);
  if (!attacking && Math.abs(aimX - cx) < 14) aimAngle = flip ? 2.3 : -0.65;

  if (!menuMode && typeof drawCharShadow === "function" && opts.world) {
    drawCharShadow(c, cx, groundY, dispW, getCharStyle(opts.world), 0, false);
  }
  hrDrawGroundGlow(c, cx, groundY, dispW, menuMode);
  hrDrawShadow(c, cx, groundY, dispW, menuMode);

  c.save();
  c.translate(cx, groundY);
  c.scale(ds, ds);
  c.translate(-cx, -groundY);

  const rawX = cx - CHR.W / 2;
  const rawY = groundY - CHR.H;
  const grips = frame.grips;
  const gHandR = hrCanvasGrip(rawX, rawY, grips.handR, flip);
  const gHandL = hrCanvasGrip(rawX, rawY, grips.handL, flip);
  const gBack = hrCanvasGrip(rawX, rawY, grips.back || { x: 8, y: 9 }, flip);

  /* Layer 7: Rücken (Köcher) */
  if (clsDef.back) {
    hrDrawEquip(c, clsDef.back, gBack.x, gBack.y, flip, null, true);
  }

  /* Layer 2–6: Vollständiger Körper (Beine+Torso+Arme+Kopf in einem Sprite) */
  hrDrawOutlined(c, frame.rows, rawX, rawY, flip);

  /* Layer 8a: Schild am Unterarm (links, vor Körper aber nicht über Gesicht) */
  if (clsDef.shield && !attacking) {
    hrDrawEquip(c, clsDef.shield, gHandL.x, gHandL.y, flip, null, true);
  }

  /* Layer 8b: Waffe folgt der Hand */
  const weaponId = attacking ? (clsDef.weaponAttack || clsDef.weapon) : clsDef.weapon;
  const weaponDef = CHR.EQUIP[weaponId];
  if (weaponId && weaponDef) {
    const baseAngle = attacking ? aimAngle : (weaponDef.idleAngle ?? (flip ? 2.3 : -0.65));
    hrDrawEquip(c, weaponId, gHandR.x, gHandR.y, flip, baseAngle, true);

    /* Magier: leuchtende Kugel oben am Stab */
    if (clsDef.orb && !attacking) {
      const staffGrip = weaponDef.grip?.y ?? 7;
      const staffTopY = gHandR.y - staffGrip;
      hrDrawEquip(c, clsDef.orb, gHandR.x + (flip ? -1 : 1), staffTopY, flip, null, true);
    }
  }

  /* Zauberbuch linke Hand */
  if (clsDef.offhand && !attacking) {
    hrDrawEquip(c, clsDef.offhand, gHandL.x, gHandL.y, flip, null, true);
  }

  /* Layer 9: Runen (Magier) */
  if (classKey === "mage") {
    c.save();
    c.globalAlpha = attacking ? 0.7 : 0.3;
    c.fillStyle = attacking ? "#d8b8ff" : "#9878c8";
    const t = fi * 0.9;
    [[-5, -10], [5, -8], [0, -14]].forEach(([ox, oy], i) => {
      c.fillRect(gHandR.x + ox + Math.sin(t + i) * 1.5, rawY + 8 + oy, 2, 2);
    });
    c.restore();
  }

  c.restore();

  hrDrawRim(c, dx, dy, dispW, dispH, classKey);
}

HR.draw = (c, opts) => {
  hrRenderCharacter(c, {
    ...opts,
    groundY: opts.groundY != null ? opts.groundY : HR.getGroundY(),
    displayScale: HR.DISPLAY_SCALE,
    menuMode: false,
    animState: opts.h.animState,
    animFrame: opts.h.animFrame
  });
};

HR.drawHeroCard = (c, classKey, w, h, frame) => {
  c.clearRect(0, 0, w, h);
  c.imageSmoothingEnabled = false;

  const grad = c.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "#384858");
  grad.addColorStop(0.5, "#405068");
  grad.addColorStop(1, "#283038");
  c.fillStyle = grad;
  c.fillRect(0, 0, w, h);

  c.save();
  c.globalAlpha = 0.8;
  const spot = c.createRadialGradient(w * 0.5, h * 0.5, 4, w * 0.5, h * 0.46, Math.max(w, h) * 0.52);
  spot.addColorStop(0, "rgba(255,252,238,0.8)");
  spot.addColorStop(0.45, "rgba(255,240,210,0.22)");
  spot.addColorStop(1, "rgba(0,0,0,0)");
  c.fillStyle = spot;
  c.fillRect(0, 0, w, h);
  c.restore();

  c.strokeStyle = "rgba(255,255,255,0.12)";
  c.strokeRect(0.5, 0.5, w - 1, h - 1);

  const cardScale = HR.getMenuScale(h, w);
  const dispW = Math.ceil(CHR.W * cardScale);
  const dispH = Math.ceil(CHR.H * cardScale);
  const fakeHero = {
    w: dispW, h: dispH,
    facing: 1, animState: "idle", animFrame: frame || 0,
    attackAnim: 0, hurtAnim: 0, deathAnim: false
  };
  const ox = Math.floor((w - dispW) / 2);
  const groundY = h - Math.max(16, Math.floor(h * 0.04));

  hrRenderCharacter(c, {
    x: ox, h: fakeHero, classKey,
    aimX: ox + dispW * 0.78, aimY: groundY - dispH * 0.42,
    groundY, displayScale: cardScale, menuMode: true,
    animState: "idle", animFrame: frame || 0
  });
};

HR.drawPreview = (c, classKey, w, h) => HR.drawHeroCard(c, classKey, w, h, 0);

/* Kompatibilität – altes Modul-System nicht mehr verwendet */
HR.registerPart = () => {};
HR.registerItem = () => {};
HR.registerLoadout = () => {};
HR.getLoadout = (classKey) => CHR.getClassDef(classKey);
HR.invalidateCache = () => {};
