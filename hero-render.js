/* Art Remake v2 – Premium Hero Canvas Renderer (gameplay hooks unchanged) */
const HR = {
  W: 32,
  H: 42,
  /** Unterkante der Füße in lokalen Koordinaten (y=0 = Boden) */
  FOOT_Y: 4,
  DISPLAY_SCALE: 1.05,
  MENU_FILL: 0.82,
  ANIM: {
    idle: { n: 4, t: 0.28 },
    walk: { n: 4, t: 0.1 },
    attack: { n: 3, t: 0.08 },
    cast: { n: 3, t: 0.09 },
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
  if (typeof game !== "undefined" && game.abilityCastLock > 0) return "cast";
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
  ctx.fillStyle = "rgba(0,0,0,0.52)";
  ctx.beginPath();
  ctx.ellipse(cx, groundY + 2 * scale, 15 * scale, 4.5 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.beginPath();
  ctx.ellipse(cx, groundY + 1 * scale, 10 * scale, 2.5 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBase(ctx, c, frame, attacking) {
  const bob = frame === 1 ? -1 : frame === 3 ? 1 : 0;
  const step = frame % 2 === 0 ? 0 : 1;
  const runLean = frame === 2 ? -1 : 0;

  out(ctx, -7, -20 + bob, 6, 14, c.leg);
  out(ctx, 2, -20 - bob, 6, 14, c.leg);
  px(ctx, -9, -7 + bob, 9, 3, c.boot);
  px(ctx, 1, -7 - bob, 9, 3, c.boot);
  px(ctx, -8, -5 + bob, 2, 2, c.bootHi || c.boot);
  px(ctx, 2, -5 - bob, 2, 2, c.bootHi || c.boot);

  out(ctx, -9, -25, 18, 5, c.belt);
  px(ctx, -2, -25, 4, 5, c.gold);
  px(ctx, -1, -24, 2, 2, c.goldHi || "#fff8d0");

  out(ctx, -11, -39 + runLean, 22, 16, c.body);
  px(ctx, -8, -36 + runLean, 16, 3, c.light);
  px(ctx, -10, -28 + runLean, 20, 3, c.dark);
  px(ctx, -9, -33 + runLean, 3, 8, c.dark);

  out(ctx, -15, -38 + runLean, 6, 8, c.shoulder);
  out(ctx, 10, -38 + runLean, 6, 8, c.shoulder);
  px(ctx, -14, -37 + runLean, 4, 2, c.light);
  px(ctx, 11, -37 + runLean, 4, 2, c.light);

  out(ctx, -3, -43 + runLean, 6, 4, c.skin);
  out(ctx, -7, -53 + runLean, 14, 12, c.skin);
  px(ctx, -6, -51 + runLean, 4, 2, c.skinHi || c.skin);
  px(ctx, -7, -55 + runLean, 14, 4, c.hair);
  px(ctx, -8, -51 + runLean, 3, 5, c.hair);
  px(ctx, 5, -51 + runLean, 3, 5, c.hair);
  px(ctx, -4, -49 + runLean, 2, 2, "#17100d");
  px(ctx, 3, -49 + runLean, 2, 2, "#17100d");

  const armY = attacking ? -38 : -35;
  out(ctx, -18, armY + step, 5, 13, c.arm);
  out(ctx, 13, armY - step, 5, 13, c.arm);
  px(ctx, -18, armY + 13 + step, 5, 3, c.skin);
  px(ctx, 13, armY + 13 - step, 5, 3, c.skin);

  return {
    leftHand: { x: -16, y: armY + 13 + step },
    rightHand: { x: 16, y: armY + 13 - step }
  };
}

function drawWarrior(ctx, frame, attacking, attackFrame) {
  const c = {
    skin: "#d0a070", skinHi: "#e8c090", hair: "#2b211c",
    body: "#5a6270", light: "#b8c4d0", dark: "#2a2e34",
    shoulder: "#707a88", arm: "#646e7c",
    leg: "#484f58", boot: "#1e1816", bootHi: "#3a3028",
    belt: "#5c3d25", gold: "#d3a84d", goldHi: "#f5d878"
  };

  out(ctx, -13, -40, 26, 24, "#4a1820");
  px(ctx, -10, -38, 20, 20, "#7a2530");
  px(ctx, -8, -36, 4, 14, "#5a1820");

  const hands = drawBase(ctx, c, frame, attacking);

  out(ctx, -26, -40, 11, 17, "#4a3020");
  px(ctx, -24, -38, 7, 13, "#a07840");
  px(ctx, -22, -35, 4, 7, "#e8c860");
  px(ctx, -23, -32, 2, 3, "#fff0a0");
  px(ctx, -25, -28, 1, 8, "#6a5030");

  const swordAngles = [-0.45, -0.78, -1.05];
  ctx.save();
  ctx.translate(hands.rightHand.x, hands.rightHand.y);
  ctx.rotate(attacking ? (swordAngles[attackFrame] ?? -1.05) : -0.45);
  px(ctx, 0, -21, 3, 21, "#c8d4e0");
  px(ctx, 1, -19, 1, 15, "#ffffff");
  px(ctx, -1, -14, 1, 10, "#e8f0ff");
  px(ctx, -5, -3, 11, 3, "#c89848");
  px(ctx, -4, -2, 9, 1, "#f0d878");
  px(ctx, 1, 0, 2, 7, "#3a2418");
  ctx.restore();
}

function getBowPull(attacking, attackFrame, attackAnim) {
  if (!attacking) return { pull: 0, releasing: false, releaseAmt: 0 };
  const phasePull = [0.08, 0.58, 0.96][attackFrame] ?? 0.96;
  const releasing = attackFrame === 2;
  const releaseAmt = releasing ? Math.max(0, 1 - (attackAnim || 0) / 0.12) : 0;
  const pull = releasing ? phasePull * (1 - releaseAmt * 0.9) : phasePull;
  return { pull, releasing, releaseAmt };
}

function drawBow(ctx, attacking, attackFrame, attackAnim) {
  const { pull, releasing, releaseAmt } = getBowPull(attacking, attackFrame, attackAnim);
  const bowLift = attacking ? [-0.5, -2, 0.5][attackFrame] ?? 0 : 0;
  const limbFlex = pull * 6;
  const gripX = 18;
  const gripY = -34 + bowLift;

  ctx.save();
  ctx.translate(gripX, gripY);

  // Bogenholz – obere/untere Limbs biegen sich beim Spannen
  ctx.strokeStyle = "#9a6530";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, -14);
  ctx.quadraticCurveTo(8 + limbFlex * 0.35, -4, 1, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(1, 0);
  ctx.quadraticCurveTo(8 - pull * 2.5, 4, 0, 14);
  ctx.stroke();

  // Griff
  px(ctx, -2, -3, 4, 6, "#5c3a1e");
  px(ctx, -1, -2, 2, 4, "#7a4e28");

  // Sehne – zieht beim Spannen deutlich nach hinten
  const stringX = -pull * 15;
  ctx.strokeStyle = "#f0e6cc";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -14);
  ctx.quadraticCurveTo(stringX, 0, 0, 14);
  ctx.stroke();

  // Eingehakter Pfeil (dünner Holzstiel + Eisenspitze)
  const showArrow = pull > 0.18 && (!releasing || releaseAmt < 0.55);
  if (showArrow) {
    const fade = releasing ? Math.max(0, 1 - releaseAmt * 1.8) : 1;
    ctx.globalAlpha = fade;
    const ax = stringX - 11;
    px(ctx, ax, 0, 10, 1, "#b8894a");
    px(ctx, ax + 1, -1, 9, 3, "#c49452");
    px(ctx, ax + 9, -1, 3, 3, "#8a949c");
    px(ctx, ax + 11, 0, 2, 1, "#c8d0d8");
    px(ctx, ax - 2, -1, 2, 3, "#6a9a58");
    ctx.globalAlpha = 1;
  }

  // Loslassen-Blitz
  if (releasing && releaseAmt < 0.65) {
    const flash = 1 - releaseAmt / 0.65;
    px(ctx, 2, -2, 8 + flash * 10, 2, `rgba(255,245,180,${flash * 0.85})`);
    px(ctx, 10 + flash * 6, -1, 4, 2, `rgba(255,255,220,${flash * 0.55})`);
  }

  ctx.restore();
  return { gripX, gripY, pull, stringX: gripX + stringX, stringY: gripY };
}

function drawRangerBowArms(ctx, c, bowPose, frame) {
  if (!bowPose || bowPose.pull < 0.04) return;
  const step = frame % 2 === 0 ? 0 : 1;
  const { gripX, gripY, pull, stringX, stringY } = bowPose;

  // Linker Arm am Bogengriff
  px(ctx, gripX - 8, gripY - 5, 8, 8, c.body);
  out(ctx, gripX - 6, gripY - 4, 5, 11, c.arm);
  px(ctx, gripX - 5, gripY + 7, 4, 3, c.skin);

  // Rechter Arm zieht die Sehne zurück
  const handX = stringX - 3;
  const handY = stringY + 1 + step * 0.5;
  px(ctx, handX - 2, handY - 8, 7, 10, c.body);
  out(ctx, handX - 1, handY - 6, 5, 12, c.arm);
  px(ctx, handX, handY + 5, 4, 3, c.skin);

  // Spann-Muskelspannung / Sehnenhand
  if (pull > 0.35) {
    px(ctx, handX - 1, handY + 2, 3, 2, c.skin);
  }
}

function drawRanger(ctx, frame, attacking, attackFrame, attackAnim) {
  const c = {
    skin: "#c9976d", skinHi: "#ddb088", hair: "#241c16",
    body: "#2a5038", light: "#6a9a62", dark: "#182820",
    shoulder: "#3d6848", arm: "#4a7050",
    leg: "#3a5032", boot: "#1a1410", bootHi: "#3a3028",
    belt: "#6d4828", gold: "#c99b4d"
  };

  out(ctx, -15, -41, 6, 20, "#3a2818");
  px(ctx, -14, -44, 4, 16, "#5a4028");
  px(ctx, -13, -42, 1, 4, "#d8c080");
  px(ctx, -12, -40, 1, 5, "#d8c080");
  px(ctx, -11, -38, 1, 4, "#d8c080");

  drawBase(ctx, c, frame, attacking);

  out(ctx, -10, -58, 20, 10, "#1a3828");
  px(ctx, -7, -56, 14, 6, "#4a8058");
  px(ctx, -5, -54, 10, 2, "#2a5038");

  const bowPose = drawBow(ctx, attacking, attackFrame, attackAnim);
  if (attacking) drawRangerBowArms(ctx, c, bowPose, frame);
}

function drawStaff(ctx, attacking, attackFrame) {
  const staffAngles = [0.05, -0.22, -0.5];
  const angle = attacking ? (staffAngles[attackFrame] ?? -0.5) : 0.05;
  const glowLift = attacking ? attackFrame * -2 : 0;

  ctx.save();
  ctx.translate(20, -31 + glowLift);
  ctx.rotate(angle);
  px(ctx, 0, -25, 3, 30, "#74502f");

  const orbW = attacking ? [11, 13, 15][attackFrame] ?? 15 : 11;
  const orbH = attacking ? [8, 10, 12][attackFrame] ?? 12 : 8;
  out(ctx, -Math.floor(orbW / 2), -32 - (attacking ? attackFrame : 0), orbW, orbH, "#80dcff");
  px(ctx, -3, -29 - (attacking ? attackFrame : 0), 7, 4, "#e4fbff");

  if (attacking && attackFrame === 2) {
    px(ctx, -8, -36, 4, 4, "#c8f0ff");
    px(ctx, 6, -34, 3, 3, "#ffffff");
  }
  ctx.restore();
}

function drawMage(ctx, frame, attacking, attackFrame) {
  const c = {
    skin: "#d0a17a", skinHi: "#e8b890", hair: "#33254a",
    body: "#4a2878", light: "#9870d8", dark: "#241838",
    shoulder: "#603898", arm: "#6840a0",
    leg: "#342058", boot: "#1a1028", bootHi: "#2a2040",
    belt: "#a77d3b", gold: "#d8b25d"
  };

  out(ctx, -14, -35, 28, 26, "#3a2060");
  px(ctx, -10, -32, 20, 4, "#8868c8");
  px(ctx, -4, -34, 8, 24, "#1a1030");
  px(ctx, -2, -30, 4, 3, "#b898f0");

  drawBase(ctx, c, frame, attacking);

  out(ctx, -11, -59, 22, 10, "#281848");
  px(ctx, -6, -63, 12, 6, "#5030a0");
  px(ctx, -3, -61, 6, 2, "#8060d0");

  drawStaff(ctx, attacking, attackFrame);

  ctx.save();
  ctx.globalAlpha = attacking ? [0.65, 0.85, 1][attackFrame] ?? 1 : 0.5;
  ctx.shadowColor = "#a080ff";
  ctx.shadowBlur = attacking ? 8 : 4;
  px(ctx, 24, -56, 3, 3, "#d4a8ff");
  px(ctx, 15, -61, 2, 2, "#8bd8ff");
  px(ctx, 27, -43, 2, 2, "#ffffff");
  if (attacking && attackFrame >= 1) {
    px(ctx, 21, -49, 2, 2, "#ffffff");
    px(ctx, 29, -59, 2, 2, "#b8e8ff");
    px(ctx, 18, -44, 3, 3, "#e8d0ff");
  }
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawHeroFigure(ctx, classKey, frame, attacking, attackFrame, attackAnim, casting) {
  const atkFrame = attacking ? attackFrame : 0;
  if (casting) {
    if (classKey === "ranger") drawRanger(ctx, frame, false, 0, 0);
    else if (classKey === "mage") drawMage(ctx, frame, false, 0);
    else drawWarrior(ctx, frame, false, 0);
    drawCastGlow(ctx, classKey, frame);
    return;
  }
  if (classKey === "ranger") drawRanger(ctx, frame, attacking, atkFrame, attackAnim);
  else if (classKey === "mage") drawMage(ctx, frame, attacking, atkFrame);
  else drawWarrior(ctx, frame, attacking, atkFrame);
}

function drawCastGlow(ctx, classKey, frame) {
  const pulse = frame === 1 ? 1 : frame === 2 ? 0.85 : 0.65;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = 0.55 * pulse;
  if (classKey === "mage") {
    px(ctx, 22, -58, 4, 4, "#e8d0ff");
    px(ctx, 18, -52, 6, 6, "#b388ff");
    px(ctx, 14, -46, 8, 8, "#7c4dff");
    px(ctx, 10, -40, 4, 4, "#ffffff");
    px(ctx, -8, -44, 3, 3, "#8bd8ff");
    px(ctx, 12, -36, 2, 2, "#ffffff");
  } else if (classKey === "ranger") {
    px(ctx, 20, -48, 3, 3, "#a8ffb0");
    px(ctx, 24, -52, 4, 4, "#6ecf78");
    px(ctx, 28, -46, 2, 2, "#ffffff");
    px(ctx, 16, -42, 2, 2, "#d4ffb8");
  } else {
    px(ctx, -20, -46, 4, 4, "#ffd080");
    px(ctx, -16, -50, 5, 5, "#f0a030");
    px(ctx, 12, -52, 3, 8, "#e8f0ff");
    px(ctx, 13, -54, 1, 4, "#ffffff");
  }
  ctx.restore();
}

function renderHero(ctx, opts) {
  const h = opts.h;
  const classKey = opts.classKey || "warrior";
  const groundY = opts.groundY != null ? opts.groundY : HR.getGroundY();
  const scale = opts.menuMode ? opts.scale : HR.DISPLAY_SCALE;
  const cx = opts.menuMode ? opts.x : opts.x + (h.w ? h.w / 2 : HR.W / 2);
  const facing = h.facing < 0 ? -1 : 1;
  const animState = h.animState || "idle";
  const frame = h.animFrame || 0;
  const attackAnimVal = h.attackAnim || 0;
  const casting = animState === "cast";
  const attacking = !casting && (attackAnimVal > 0.04 || animState === "attack");
  const attackFrame = attacking ? frame : 0;

  drawShadow(ctx, cx, groundY, scale);

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(cx, groundY);
  ctx.scale(facing * scale, scale);
  ctx.translate(0, HR.FOOT_Y);
  if ((h.hurtAnim || 0) > 0.05) {
    ctx.translate(facing * -2, 0);
  }
  drawHeroFigure(ctx, classKey, frame, attacking, attackFrame, attackAnimVal, casting);
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
