const HR = {
  W: 40,
  H: 52,
  DISPLAY_SCALE: 1.08,
  MENU_FILL: 0.82,
  ANIM: {
    idle: { n: 4, t: 0.28 },
    walk: { n: 4, t: 0.10 },
    attack: { n: 3, t: 0.08 },
    hurt: { n: 1, t: 0.14 },
    death: { n: 2, t: 0.22 }
  }
};

HR.displayW = () => HR.W;
HR.displayH = () => HR.H;
HR.getGroundY = () => (typeof GROUND !== "undefined" ? GROUND : 308);
HR.getDrawY = () => HR.getGroundY() - HR.H;

HR.getAnimState = (h, moving) => {
  if (typeof game !== "undefined" && (game.isDead || h.deathAnim)) return "death";
  if ((h.hurtAnim || 0) > 0.05) return "hurt";
  if ((h.attackAnim || 0) > 0.04) return "attack";
  if (moving && typeof game !== "undefined" && game.isRunning && !game.isPaused) return "walk";
  return "idle";
};

HR.updateAnim = (h, dt, moving) => {
  const state = HR.getAnimState(h, moving);
  if (h.animState !== state) {
    h.animState = state;
    h.animFrame = 0;
    h.animTime = 0;
  }
  const cfg = HR.ANIM[state] || HR.ANIM.idle;
  h.animTime = (h.animTime || 0) + dt;
  if (h.animTime >= cfg.t) {
    h.animTime = 0;
    h.animFrame = ((h.animFrame || 0) + 1) % cfg.n;
  }
};

function px(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function out(ctx, x, y, w, h, color) {
  px(ctx, x - 1, y, 1, h, "#0b0710");
  px(ctx, x + w, y, 1, h, "#0b0710");
  px(ctx, x, y - 1, w, 1, "#0b0710");
  px(ctx, x, y + h, w, 1, "#0b0710");
  px(ctx, x, y, w, h, color);
}

function drawShadow(ctx, cx, groundY, scale) {
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.46)";
  ctx.beginPath();
  ctx.ellipse(cx, groundY + 2 * scale, 17 * scale, 5 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCape(ctx, frame, color1, color2) {
  const sway = frame % 2 === 0 ? 0 : 1;
  out(ctx, -13, -42, 26, 24 + sway, color1);
  px(ctx, -9, -38, 18, 20, color2);
  px(ctx, -5, -18, 10, 3, color1);
}

function drawBase(ctx, colors, frame, attacking) {
  const bob = frame === 1 ? -1 : frame === 3 ? 1 : 0;
  const armSwing = frame % 2 === 0 ? 0 : 2;

  // Beine kompakt, kräftig
  out(ctx, -8, -24 + bob, 7, 16, colors.leg);
  out(ctx, 2, -24 - bob, 7, 16, colors.leg);
  px(ctx, -10, -8 + bob, 9, 4, colors.boot);
  px(ctx, 1, -8 - bob, 9, 4, colors.boot);

  // Hüfte / Gürtel
  out(ctx, -10, -30, 20, 6, colors.belt);
  px(ctx, -2, -30, 4, 6, colors.gold);

  // Torso breiter und heroischer
  out(ctx, -13, -45, 26, 17, colors.body);
  px(ctx, -10, -42, 20, 3, colors.light);
  px(ctx, -12, -32, 24, 4, colors.dark);
  px(ctx, -3, -44, 6, 14, colors.center);

  // Schultern
  out(ctx, -17, -43, 6, 8, colors.shoulder);
  out(ctx, 11, -43, 6, 8, colors.shoulder);

  // Hals + Kopf
  out(ctx, -4, -49, 8, 5, colors.skin);
  out(ctx, -8, -61, 16, 13, colors.skin);

  // Haare / Helm
  px(ctx, -7, -63, 14, 5, colors.hair);
  px(ctx, -9, -59, 4, 7, colors.hair);
  px(ctx, 5, -59, 4, 7, colors.hair);

  // Gesicht
  px(ctx, -4, -55, 2, 2, "#1a1110");
  px(ctx, 3, -55, 2, 2, "#1a1110");
  px(ctx, -1, -52, 3, 1, colors.shadowSkin);

  // Arme sichtbar
  const armY = attacking ? -42 : -39;
  out(ctx, -19, armY + armSwing, 6, 15, colors.arm);
  out(ctx, 13, armY - armSwing, 6, 15, colors.arm);

  // Hände
  px(ctx, -19, armY + 14 + armSwing, 6, 4, colors.skin);
  px(ctx, 13, armY + 14 - armSwing, 6, 4, colors.skin);

  return {
    leftHand: { x: -16, y: armY + 16 + armSwing },
    rightHand: { x: 16, y: armY + 16 - armSwing }
  };
}

function drawWarrior(ctx, frame, attacking) {
  drawCape(ctx, frame, "#5b1d26", "#8f2932");

  const c = {
    skin: "#d5a170",
    shadowSkin: "#8b6045",
    hair: "#2d2019",
    body: "#737b86",
    light: "#d5dde5",
    dark: "#30343a",
    center: "#9aa4ad",
    shoulder: "#8d97a3",
    arm: "#7b8490",
    leg: "#505963",
    boot: "#231d1b",
    belt: "#5c3c23",
    gold: "#d2a94e"
  };

  const hands = drawBase(ctx, c, frame, attacking);

  // Schild seitlich am linken Arm
  out(ctx, -27, -43, 11, 18, "#64412e");
  px(ctx, -25, -41, 7, 14, "#b6823b");
  px(ctx, -23, -37, 3, 6, "#f1d27a");

  // Schwert rechts, seitlich und proportional
  ctx.save();
  ctx.translate(hands.rightHand.x + 1, hands.rightHand.y);
  ctx.rotate(attacking ? -1.05 : -0.42);
  px(ctx, 0, -22, 3, 22, "#dfe8ed");
  px(ctx, 1, -20, 1, 16, "#ffffff");
  px(ctx, -4, -3, 11, 3, "#d4a24b");
  px(ctx, 1, 0, 2, 7, "#50331e");
  ctx.restore();

  // kleine heroische Akzente
  px(ctx, -5, -47, 10, 2, "#e1c060");
}

function drawRanger(ctx, frame, attacking) {
  const c = {
    skin: "#c99368",
    shadowSkin: "#7f5237",
    hair: "#241b16",
    body: "#315f3c",
    light: "#78b16a",
    dark: "#1f3526",
    center: "#406f42",
    shoulder: "#4d7b4c",
    arm: "#5e7449",
    leg: "#455637",
    boot: "#211b17",
    belt: "#704824",
    gold: "#c99c52"
  };

  const hands = drawBase(ctx, c, frame, attacking);

  // Kapuze
  out(ctx, -10, -65, 20, 10, "#234832");
  px(ctx, -7, -62, 14, 4, "#5f9f57");

  // Umhang
  px(ctx, -12, -45, 24, 24, "rgba(31,68,42,0.85)");

  // Köcher hinten
  out(ctx, -15, -45, 6, 23, "#55351f");
  px(ctx, -14, -48, 1, 6, "#dbc084");
  px(ctx, -12, -49, 1, 7, "#dbc084");
  px(ctx, -10, -48, 1, 6, "#dbc084");

  // Bogen rechts, klar neben dem Körper
  ctx.save();
  ctx.translate(22, -37);
  ctx.strokeStyle = "#b77d3d";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -15);
  ctx.quadraticCurveTo(8, 0, 0, 15);
  ctx.stroke();
  ctx.strokeStyle = "#e7d6aa";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -15);
  ctx.lineTo(0, 15);
  ctx.stroke();
  if (attacking) {
    px(ctx, -13, -1, 18, 2, "#e5cf83");
    px(ctx, 5, -2, 4, 4, "#fff0a8");
  }
  ctx.restore();

  // Dolch am Gürtel
  px(ctx, -13, -28, 7, 2, "#dce6ea");
  px(ctx, -8, -29, 2, 4, "#6b3c22");
}

function drawMage(ctx, frame, attacking) {
  const c = {
    skin: "#d0a07a",
    shadowSkin: "#8b5f47",
    hair: "#36264a",
    body: "#57327f",
    light: "#b18cff",
    dark: "#271a3f",
    center: "#38205f",
    shoulder: "#714aa0",
    arm: "#7050a8",
    leg: "#3a285c",
    boot: "#22182f",
    belt: "#a57a38",
    gold: "#d9b55c"
  };

  const hands = drawBase(ctx, c, frame, attacking);

  // Robe über Körper, aber Füße bleiben sichtbar
  out(ctx, -15, -39, 30, 30, "#563380");
  px(ctx, -10, -36, 20, 4, "#9d70dd");
  px(ctx, -3, -38, 6, 27, "#2f1d51");

  // Magierkapuze
  out(ctx, -11, -66, 22, 10, "#37215f");
  px(ctx, -6, -70, 12, 6, "#5d36a0");

  // Stab rechts außerhalb Körper
  ctx.save();
  ctx.translate(22, -34);
  ctx.rotate(attacking ? -0.45 : 0.05);
  px(ctx, 0, -29, 3, 34, "#72502f");
  out(ctx, -5, -36, 13, 9, "#74d8ff");
  px(ctx, -2, -33, 7, 4, "#e4fbff");
  ctx.restore();

  // Runen / Magie
  ctx.save();
  ctx.globalAlpha = attacking ? 0.95 : 0.55;
  px(ctx, 26, -59, 3, 3, "#d7a8ff");
  px(ctx, 17, -66, 2, 2, "#8bd8ff");
  px(ctx, 30, -45, 2, 2, "#ffffff");
  px(ctx, -20, -50, 2, 2, "#b58cff");
  ctx.restore();
}

function drawHeroFigure(ctx, classKey, frame, attacking) {
  if (classKey === "ranger") drawRanger(ctx, frame, attacking);
  else if (classKey === "mage") drawMage(ctx, frame, attacking);
  else drawWarrior(ctx, frame, attacking);
}

function renderHero(ctx, opts) {
  const h = opts.h;
  const classKey = opts.classKey || "warrior";
  const groundY = opts.groundY != null ? opts.groundY : HR.getGroundY();
  const scale = opts.menuMode ? opts.scale : HR.DISPLAY_SCALE;
  const cx = opts.menuMode ? opts.x : opts.x + (h.w ? h.w / 2 : HR.W / 2);
  const facing = h.facing < 0 ? -1 : 1;
  const frame = h.animFrame || 0;
  const attacking = (h.attackAnim || 0) > 0.04;

  drawShadow(ctx, cx, groundY, scale);

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(cx, groundY);
  ctx.scale(facing * scale, scale);
  if ((h.hurtAnim || 0) > 0.05) {
    ctx.translate(facing * -2, 0);
  }
  drawHeroFigure(ctx, classKey, frame, attacking);
  ctx.restore();

  // dezenter Lichtschein für Lesbarkeit
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const glow = ctx.createRadialGradient(
    cx,
    groundY - 34 * scale,
    2,
    cx,
    groundY - 34 * scale,
    42 * scale
  );
  const glowColor =
    classKey === "mage"
      ? "rgba(150,110,255,0.20)"
      : classKey === "ranger"
      ? "rgba(120,220,130,0.15)"
      : "rgba(255,210,130,0.16)";
  glow.addColorStop(0, glowColor);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(cx - 50 * scale, groundY - 80 * scale, 100 * scale, 90 * scale);
  ctx.restore();
}

HR.draw = (ctx, opts) => {
  renderHero(ctx, {
    ...opts,
    menuMode: false
  });
};

HR.drawHeroCard = (ctx, classKey, w, h, frame = 0) => {
  ctx.clearRect(0, 0, w, h);
  ctx.imageSmoothingEnabled = false;

  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, "#1a2230");
  bg.addColorStop(1, "#090d14");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.strokeRect(0.5, 0.5, w - 1, h - 1);

  const scale = Math.min(w / 92, h / 92);
  const fakeHero = {
    facing: 1,
    animFrame: frame,
    attackAnim: 0,
    hurtAnim: 0,
    w: HR.W,
    h: HR.H
  };

  renderHero(ctx, {
    x: w / 2,
    h: fakeHero,
    classKey,
    groundY: h - 18,
    menuMode: true,
    scale
  });
};

HR.drawPreview = (ctx, classKey, w, h) => {
  HR.drawHeroCard(ctx, classKey, w, h, 0);
};

HR.registerPart = () => {};
HR.registerItem = () => {};
HR.registerLoadout = () => {};
HR.getLoadout = () => null;
HR.invalidateCache = () => {};
