const HR = {
  W: 34,
  H: 48,
  DISPLAY_SCALE: 0.7,
  MENU_FILL: 0.78,
  ANIM: {
    idle: { n: 4, t: 0.28 },
    walk: { n: 4, t: 0.09 },
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
  if (h.hurtAnim > 0.05) return "hurt";
  if (h.attackAnim > 0.04) return "attack";
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
    h.animFrame = (h.animFrame + 1) % cfg.n;
  }
};

function px(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function outlineRect(ctx, x, y, w, h, color) {
  px(ctx, x - 1, y, 1, h, "#120d12");
  px(ctx, x + w, y, 1, h, "#120d12");
  px(ctx, x, y - 1, w, 1, "#120d12");
  px(ctx, x, y + h, w, 1, "#120d12");
  px(ctx, x, y, w, h, color);
}

function drawShadow(ctx, cx, groundY, scale) {
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.42)";
  ctx.beginPath();
  ctx.ellipse(cx, groundY + 2 * scale, 15 * scale, 4 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawHumanBase(ctx, colors, frame, attacking) {
  const bob = frame === 1 ? -1 : frame === 3 ? 1 : 0;
  const legShift = frame % 2 === 0 ? 0 : 1;

  // Beine: kurz, kräftig, mit Füßen
  outlineRect(ctx, -8, -22 + bob, 6, 15, colors.leg);
  outlineRect(ctx, 2, -22 - bob, 6, 15, colors.leg);
  px(ctx, -9, -7 + bob, 8, 3, colors.boot);
  px(ctx, 1, -7 - bob, 8, 3, colors.boot);

  // Hüfte
  outlineRect(ctx, -9, -27, 18, 6, colors.belt);

  // Torso
  outlineRect(ctx, -11, -41, 22, 16, colors.body);
  px(ctx, -8, -38, 16, 3, colors.highlight);
  px(ctx, -10, -29, 20, 3, colors.shadow);

  // Hals
  outlineRect(ctx, -3, -45, 6, 5, colors.skin);

  // Kopf
  outlineRect(ctx, -7, -55, 14, 12, colors.skin);
  px(ctx, -5, -57, 10, 4, colors.hair);
  px(ctx, -4, -51, 2, 2, "#19120e");
  px(ctx, 3, -51, 2, 2, "#19120e");

  // Arme sichtbar neben Körper
  const armY = attacking ? -39 : -37;
  outlineRect(ctx, -16, armY, 5, 14, colors.arm);
  outlineRect(ctx, 11, armY, 5, 14, colors.arm);

  // Hände
  px(ctx, -16, armY + 13, 5, 4, colors.skin);
  px(ctx, 11, armY + 13, 5, 4, colors.skin);

  return {
    rightHand: { x: 14, y: armY + 15 },
    leftHand: { x: -14, y: armY + 15 }
  };
}

function drawWarrior(ctx, frame, attacking) {
  const colors = {
    skin: "#d6a77b",
    hair: "#4b2f22",
    body: "#6f7783",
    highlight: "#c4cbd4",
    shadow: "#343940",
    arm: "#7f8792",
    leg: "#555d66",
    boot: "#2b2522",
    belt: "#6b4a2e"
  };

  const hands = drawHumanBase(ctx, colors, frame, attacking);

  // Schild am linken Unterarm, nicht vor Gesicht
  outlineRect(ctx, -22, -39, 9, 15, "#8a6540");
  px(ctx, -20, -37, 5, 10, "#c79b55");
  px(ctx, -18, -34, 2, 4, "#f3d88c");

  // Schwert seitlich rechts
  ctx.save();
  ctx.translate(hands.rightHand.x, hands.rightHand.y);
  ctx.rotate(attacking ? -0.9 : -0.45);
  px(ctx, 0, -20, 3, 20, "#d7e1e8");
  px(ctx, 1, -18, 1, 15, "#ffffff");
  px(ctx, -3, -2, 9, 3, "#c89a47");
  px(ctx, 1, 0, 2, 7, "#5b3422");
  ctx.restore();
}

function drawRanger(ctx, frame, attacking) {
  const colors = {
    skin: "#c99a70",
    hair: "#2f241d",
    body: "#3d6b45",
    highlight: "#79a96f",
    shadow: "#263b2a",
    arm: "#5f7b50",
    leg: "#4d5a39",
    boot: "#2b241b",
    belt: "#6a4a2d"
  };

  const hands = drawHumanBase(ctx, colors, frame, attacking);

  // Kapuze
  outlineRect(ctx, -8, -58, 16, 8, "#2f5c39");
  px(ctx, -6, -55, 12, 3, "#5f9b5d");

  // Köcher hinten
  outlineRect(ctx, -13, -43, 5, 20, "#5c3d25");
  px(ctx, -12, -45, 1, 5, "#d4c08a");
  px(ctx, -10, -46, 1, 6, "#d4c08a");

  // Bogen seitlich, nicht vor Körper
  ctx.save();
  ctx.translate(18, -35);
  ctx.strokeStyle = "#b98645";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -13);
  ctx.quadraticCurveTo(7, 0, 0, 13);
  ctx.stroke();
  ctx.strokeStyle = "#e5d9b5";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -13);
  ctx.lineTo(0, 13);
  ctx.stroke();
  if (attacking) {
    px(ctx, -11, -1, 16, 2, "#d8c282");
    px(ctx, 5, -2, 4, 4, "#f0e0a0");
  }
  ctx.restore();
}

function drawMage(ctx, frame, attacking) {
  const colors = {
    skin: "#d1a780",
    hair: "#4a3758",
    body: "#5c3e8a",
    highlight: "#a77ee0",
    shadow: "#2d2145",
    arm: "#7052a0",
    leg: "#4a3672",
    boot: "#2b203a",
    belt: "#b08a4b"
  };

  const hands = drawHumanBase(ctx, colors, frame, attacking);

  // Robe breiter machen, Beine bleiben unten sichtbar
  outlineRect(ctx, -13, -34, 26, 22, "#5c3e8a");
  px(ctx, -9, -32, 18, 3, "#9d72d0");
  px(ctx, -3, -34, 6, 22, "#3c2a5f");

  // Hut / Kapuze
  outlineRect(ctx, -9, -62, 18, 8, "#3d2b68");
  px(ctx, -5, -66, 10, 5, "#5d3c98");

  // Stab rechts, außerhalb vom Körper
  ctx.save();
  ctx.translate(18, -32);
  ctx.rotate(attacking ? -0.35 : 0.08);
  px(ctx, 0, -25, 3, 30, "#7a5230");
  outlineRect(ctx, -4, -31, 11, 8, "#8bd8ff");
  px(ctx, -1, -29, 5, 4, "#d8f6ff");
  ctx.restore();

  // Magiepartikel
  ctx.save();
  ctx.globalAlpha = attacking ? 0.9 : 0.45;
  px(ctx, 24, -54, 3, 3, "#caa6ff");
  px(ctx, 17, -61, 2, 2, "#8bd8ff");
  px(ctx, 28, -42, 2, 2, "#ffffff");
  ctx.restore();
}

function drawHeroFigure(ctx, classKey, frame, attacking) {
  if (classKey === "ranger") {
    drawRanger(ctx, frame, attacking);
  } else if (classKey === "mage") {
    drawMage(ctx, frame, attacking);
  } else {
    drawWarrior(ctx, frame, attacking);
  }
}

function renderHero(ctx, opts) {
  const h = opts.h;
  const classKey = opts.classKey || "warrior";
  const groundY = opts.groundY != null ? opts.groundY : HR.getGroundY();
  const scale = opts.menuMode ? opts.scale : HR.DISPLAY_SCALE;
  const cx = opts.menuMode
    ? opts.x
    : opts.x + (h.w ? h.w / 2 : HR.W / 2);
  const facing = h.facing < 0 ? -1 : 1;
  const frame = h.animFrame || 0;
  const attacking = (h.attackAnim || 0) > 0.04;

  drawShadow(ctx, cx, groundY, scale);

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(cx, groundY);
  ctx.scale(facing * scale, scale);
  if (h.hurtAnim > 0.05) {
    ctx.translate(facing * -2, 0);
  }
  drawHeroFigure(ctx, classKey, frame, attacking);
  ctx.restore();

  // dezenter Lichtschein, damit Held vor dunklem Hintergrund sichtbar bleibt
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const glow = ctx.createRadialGradient(cx, groundY - 30 * scale, 2, cx, groundY - 30 * scale, 38 * scale);
  glow.addColorStop(0, "rgba(255,240,190,0.20)");
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
  bg.addColorStop(0, "#17212c");
  bg.addColorStop(1, "#0b1018");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.strokeRect(0.5, 0.5, w - 1, h - 1);

  const scale = Math.min(w / 90, h / 90);
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
