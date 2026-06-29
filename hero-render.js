const HR = {
  W: 32,
  H: 42,
  DISPLAY_SCALE: 1.05,
  MENU_FILL: 0.82,
  ANIM: {
    idle: { n: 4, t: 0.28 },
    walk: { n: 4, t: 0.1 },
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
  px(ctx, x - 1, y, 1, h, "#09070b");
  px(ctx, x + w, y, 1, h, "#09070b");
  px(ctx, x, y - 1, w, 1, "#09070b");
  px(ctx, x, y + h, w, 1, "#09070b");
  px(ctx, x, y, w, h, color);
}

function drawShadow(ctx, cx, groundY, scale) {
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.beginPath();
  ctx.ellipse(cx, groundY + 2 * scale, 14 * scale, 4 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBase(ctx, c, frame, attacking) {
  const bob = frame === 1 ? -1 : frame === 3 ? 1 : 0;
  const step = frame % 2 === 0 ? 0 : 1;

  // Beine kurz und kräftig
  out(ctx, -7, -20 + bob, 6, 13, c.leg);
  out(ctx, 2, -20 - bob, 6, 13, c.leg);
  px(ctx, -9, -7 + bob, 8, 3, c.boot);
  px(ctx, 1, -7 - bob, 8, 3, c.boot);

  // Hüfte
  out(ctx, -9, -25, 18, 5, c.belt);
  px(ctx, -2, -25, 4, 5, c.gold);

  // Oberkörper
  out(ctx, -11, -39, 22, 15, c.body);
  px(ctx, -8, -36, 16, 3, c.light);
  px(ctx, -10, -28, 20, 3, c.dark);

  // Schultern
  out(ctx, -15, -38, 5, 7, c.shoulder);
  out(ctx, 10, -38, 5, 7, c.shoulder);

  // Hals + Kopf
  out(ctx, -3, -43, 6, 4, c.skin);
  out(ctx, -7, -53, 14, 11, c.skin);

  // Haare / Helm
  px(ctx, -7, -55, 14, 4, c.hair);
  px(ctx, -8, -51, 3, 5, c.hair);
  px(ctx, 5, -51, 3, 5, c.hair);

  // Gesicht
  px(ctx, -4, -49, 2, 2, "#17100d");
  px(ctx, 3, -49, 2, 2, "#17100d");

  // Arme sichtbar
  const armY = attacking ? -38 : -35;
  out(ctx, -18, armY + step, 5, 12, c.arm);
  out(ctx, 13, armY - step, 5, 12, c.arm);
  px(ctx, -18, armY + 12 + step, 5, 3, c.skin);
  px(ctx, 13, armY + 12 - step, 5, 3, c.skin);

  return {
    leftHand: { x: -16, y: armY + 13 + step },
    rightHand: { x: 16, y: armY + 13 - step }
  };
}

function drawWarrior(ctx, frame, attacking) {
  const c = {
    skin: "#d0a070",
    hair: "#2b211c",
    body: "#646d78",
    light: "#c9d1da",
    dark: "#30343a",
    shoulder: "#7b8490",
    arm: "#747d88",
    leg: "#505762",
    boot: "#241f1d",
    belt: "#5c3d25",
    gold: "#d3a84d"
  };

  // Umhang hinten
  out(ctx, -12, -39, 24, 22, "#5a1f26");
  px(ctx, -8, -36, 16, 17, "#8a2931");

  const hands = drawBase(ctx, c, frame, attacking);

  // Schild links, klein und seitlich
  out(ctx, -24, -38, 9, 15, "#6b4b32");
  px(ctx, -22, -36, 5, 11, "#c79a50");
  px(ctx, -20, -33, 2, 5, "#f1d88a");

  // Schwert rechts, proportional
  ctx.save();
  ctx.translate(hands.rightHand.x, hands.rightHand.y);
  ctx.rotate(attacking ? -1.05 : -0.45);
  px(ctx, 0, -19, 3, 19, "#dfe8ef");
  px(ctx, 1, -17, 1, 13, "#ffffff");
  px(ctx, -4, -3, 10, 3, "#d1a24a");
  px(ctx, 1, 0, 2, 6, "#4d3120");
  ctx.restore();
}

function drawRanger(ctx, frame, attacking) {
  const c = {
    skin: "#c9976d",
    hair: "#241c16",
    body: "#315f3d",
    light: "#7aae6a",
    dark: "#203825",
    shoulder: "#487247",
    arm: "#5e774c",
    leg: "#46573a",
    boot: "#241d18",
    belt: "#6d4828",
    gold: "#c99b4d"
  };

  const hands = drawBase(ctx, c, frame, attacking);

  // Kapuze
  out(ctx, -9, -57, 18, 8, "#244b35");
  px(ctx, -6, -54, 12, 3, "#6fa765");

  // Köcher hinten
  out(ctx, -14, -40, 5, 18, "#563720");
  px(ctx, -13, -43, 1, 5, "#d7bd7a");
  px(ctx, -11, -44, 1, 6, "#d7bd7a");

  // Bogen rechts seitlich
  ctx.save();
  ctx.translate(20, -33);
  ctx.strokeStyle = "#b47a3b";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -13);
  ctx.quadraticCurveTo(7, 0, 0, 13);
  ctx.stroke();
  ctx.strokeStyle = "#e6d6aa";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -13);
  ctx.lineTo(0, 13);
  ctx.stroke();
  if (attacking) {
    px(ctx, -12, -1, 17, 2, "#e7cf82");
    px(ctx, 5, -2, 4, 4, "#fff1a0");
  }
  ctx.restore();
}

function drawMage(ctx, frame, attacking) {
  const c = {
    skin: "#d0a17a",
    hair: "#33254a",
    body: "#56327f",
    light: "#a884e8",
    dark: "#2b1c46",
    shoulder: "#6d4a9d",
    arm: "#7050a7",
    leg: "#3d2a62",
    boot: "#22172f",
    belt: "#a77d3b",
    gold: "#d8b25d"
  };

  const hands = drawBase(ctx, c, frame, attacking);

  // Robe
  out(ctx, -13, -34, 26, 24, "#56327f");
  px(ctx, -9, -31, 18, 3, "#a884e8");
  px(ctx, -3, -34, 6, 22, "#2f1f52");

  // Kapuze
  out(ctx, -10, -58, 20, 8, "#382260");
  px(ctx, -5, -62, 10, 5, "#5d39a0");

  // Stab seitlich
  ctx.save();
  ctx.translate(20, -31);
  ctx.rotate(attacking ? -0.4 : 0.05);
  px(ctx, 0, -25, 3, 30, "#74502f");
  out(ctx, -5, -32, 13, 9, "#80dcff");
  px(ctx, -2, -29, 7, 4, "#e4fbff");
  ctx.restore();

  // Magiepartikel
  ctx.save();
  ctx.globalAlpha = attacking ? 0.95 : 0.55;
  px(ctx, 25, -55, 3, 3, "#d4a8ff");
  px(ctx, 16, -60, 2, 2, "#8bd8ff");
  px(ctx, 28, -42, 2, 2, "#ffffff");
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

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const glow = ctx.createRadialGradient(
    cx,
    groundY - 30 * scale,
    2,
    cx,
    groundY - 30 * scale,
    38 * scale
  );
  const glowColor =
    classKey === "mage"
      ? "rgba(150,110,255,0.18)"
      : classKey === "ranger"
      ? "rgba(120,220,130,0.13)"
      : "rgba(255,210,130,0.14)";
  glow.addColorStop(0, glowColor);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(cx - 45 * scale, groundY - 70 * scale, 90 * scale, 80 * scale);
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

  const scale = Math.min(w / 78, h / 78);
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
