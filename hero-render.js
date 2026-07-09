/* Dungeon Loop – Hero Renderer (Redesign nach Design-Vorlage)
   Ziel: kleiner, schlanker, klar lesbar. 3 Klassen mit eigener Silhouette,
   detaillierte Waffen, helle Akzente + Outline für Kontrast auf dunklem Grund.
   Gameplay-Hooks (HR.draw, HR.drawHeroCard, updateAnim, Maße) bleiben stabil. */

const HR = {
  W: 26,
  H: 38,
  /** Fuß-Unterkante in lokalen Koordinaten (y=0 = Bodenlinie) */
  FOOT_Y: 3,
  DISPLAY_SCALE: 1.45,
  MENU_FILL: 0.82,
  ANIM: {
    idle: { n: 4, t: 0.3 },
    walk: { n: 4, t: 0.12 },
    run: { n: 4, t: 0.09 },
    attack: { n: 3, t: 0.08 },
    cast: { n: 3, t: 0.1 },
    hurt: { n: 1, t: 0.14 },
    death: { n: 2, t: 0.22 }
  }
};

const HERO_OUTLINE = "#0a090d";

HR.displayW = () => HR.W;
HR.displayH = () => HR.H;
HR.getGroundY = () => (typeof GROUND !== "undefined" ? GROUND : 308);
HR.getDrawY = () => HR.getGroundY() - HR.H;

HR.getAnimState = (h, moving) => {
  if (typeof game !== "undefined" && (game.isDead || h.deathAnim)) return "death";
  if ((h.hurtAnim || 0) > 0.05) return "hurt";
  if (typeof game !== "undefined" && game.abilityCastLock > 0) return "cast";
  if ((h.attackAnim || 0) > 0.04) return "attack";
  if (moving && typeof game !== "undefined" && game.isRunning && !game.isPaused) return "run";
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

function hpx(ctx, x, y, w, h, color) {
  if (!color) return;
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function hout(ctx, x, y, w, h, color) {
  hpx(ctx, x - 1, y, 1, h, HERO_OUTLINE);
  hpx(ctx, x + w, y, 1, h, HERO_OUTLINE);
  hpx(ctx, x, y - 1, w, 1, HERO_OUTLINE);
  hpx(ctx, x, y + h, w, 1, HERO_OUTLINE);
  hpx(ctx, x, y, w, h, color);
}

function heroShadow(ctx, cx, groundY, scale) {
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.beginPath();
  ctx.ellipse(cx, groundY + 2 * scale, 10 * scale, 3 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.beginPath();
  ctx.ellipse(cx, groundY + 1 * scale, 6 * scale, 1.6 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Pose je Anim-Zustand (uy = Oberkörper-Hub, step = Beinversatz, lean = Neigung) */
function heroPose(state, frame) {
  const p = { uy: 0, step: 0, lean: 0, arm: 0 };
  if (state === "run" || state === "walk") {
    p.step = frame % 2 === 0 ? -1 : 1;
    p.uy = frame === 1 || frame === 3 ? -1 : 0;
    p.lean = 1;
    p.arm = p.step;
  } else if (state === "idle") {
    p.uy = frame === 1 || frame === 2 ? -1 : 0;
  }
  return p;
}

/* ---------- gemeinsame Körperteile (lokal: y=0 = Boden, oben = negativ) ---------- */

function drawLegs(ctx, c, p) {
  const ll = p.step < 0 ? 1 : 0;
  const rl = p.step > 0 ? 1 : 0;
  hout(ctx, -4, -11 + ll, 3, 7, c.leg);
  hout(ctx, 1, -11 + rl, 3, 7, c.leg);
  hout(ctx, -5, -4 + ll, 4, 3, c.boot);
  hout(ctx, 1, -4 + rl, 4, 3, c.boot);
  hpx(ctx, -5, -4 + ll, 4, 1, c.bootHi || c.boot);
  hpx(ctx, 1, -4 + rl, 4, 1, c.bootHi || c.boot);
}

function drawTorso(ctx, c, p) {
  const uy = p.uy;
  hout(ctx, -4, -20 + uy, 8, 9, c.body);
  hpx(ctx, -3 + p.lean, -19 + uy, 6, 2, c.light);
  hpx(ctx, -4, -14 + uy, 8, 2, c.dark);
  hpx(ctx, -4, -12 + uy, 8, 1, c.belt);
  hpx(ctx, -1, -12 + uy, 2, 1, c.beltHi || c.belt);
}

function drawBackArm(ctx, c, p) {
  const uy = p.uy;
  const a = p.arm;
  hout(ctx, -6, -19 + uy - a, 2, 7, c.armDark || c.arm);
  hpx(ctx, -6, -13 + uy - a, 2, 2, c.skin);
}

function drawFrontArm(ctx, c, p) {
  const uy = p.uy;
  const a = p.arm;
  hout(ctx, 4, -19 + uy + a, 2, 7, c.arm);
  hpx(ctx, 4, -13 + uy + a, 2, 2, c.skin);
  return { x: 5, y: -12 + uy + a };
}

function drawHeadBase(ctx, c, p) {
  const uy = p.uy;
  const hx = p.lean;
  hout(ctx, -3 + hx, -26 + uy, 5, 5, c.skin);
  hpx(ctx, -2 + hx, -25 + uy, 2, 1, c.skinHi || c.skin);
  hpx(ctx, 0 + hx, -24 + uy, 1, 1, c.eye || "#241611");
  hpx(ctx, 2 + hx, -24 + uy, 1, 1, c.eye || "#241611");
}

/* ---------------------------- KRIEGER ---------------------------- */

const WARRIOR_C = {
  skin: "#dcae80", skinHi: "#f2cc98", eye: "#2a1a12",
  body: "#8a95a6", light: "#cfd9e6", dark: "#3a414c",
  arm: "#77828f", armDark: "#4c5560",
  leg: "#4a515b", boot: "#241a14", bootHi: "#4a3728",
  belt: "#6d4a2a", beltHi: "#e8c24e"
};

function drawShield(ctx, p) {
  const uy = p.uy;
  hout(ctx, -9, -19 + uy, 6, 11, "#6e4a2a");
  hpx(ctx, -8, -18 + uy, 4, 9, "#8a5f36");
  hpx(ctx, -7, -17 + uy, 2, 6, "#a5764a");
  hpx(ctx, -9, -19 + uy, 6, 1, "#c7cdd6");
  hpx(ctx, -9, -9 + uy, 6, 1, "#c7cdd6");
  hout(ctx, -7, -15 + uy, 2, 2, "#e8c24e");
}

function drawSword(ctx, hand, attacking, af) {
  const ang = attacking ? [-1.05, -0.25, 0.6][af] ?? -0.5 : -0.5;
  ctx.save();
  ctx.translate(hand.x, hand.y);
  ctx.rotate(ang);
  hpx(ctx, -1, 0, 2, 4, "#5a3a1e");
  hpx(ctx, -1, 1, 1, 2, "#7a4e28");
  hpx(ctx, -3, -1, 6, 2, "#e8c24e");
  hpx(ctx, -3, -1, 6, 1, "#fff0b0");
  hpx(ctx, -1, -14, 2, 13, "#b3bdca");
  hpx(ctx, 0, -14, 1, 13, "#eef4ff");
  hpx(ctx, -1, -14, 1, 4, "#7d8794");
  hpx(ctx, 0, -14, 1, 1, "#ffffff");
  ctx.restore();
}

function drawWarrior(ctx, p, attacking, af, casting) {
  const c = WARRIOR_C;
  drawBackArm(ctx, c, p);
  drawLegs(ctx, c, p);
  drawTorso(ctx, c, p);
  // rotes Wappen-Tabard über der Brust
  hpx(ctx, -2, -19 + p.uy, 4, 7, "#a8302f");
  hpx(ctx, -1, -18 + p.uy, 2, 5, "#c8413c");
  // Schulterplatten mit hellen Kanten
  hout(ctx, -6, -21 + p.uy, 3, 3, "#9aa6b4");
  hout(ctx, 3, -21 + p.uy, 3, 3, "#9aa6b4");
  hpx(ctx, -6, -21 + p.uy, 3, 1, "#dbe4ef");
  hpx(ctx, 3, -21 + p.uy, 3, 1, "#dbe4ef");
  drawHeadBase(ctx, c, p);
  // Helm mit Nasenschutz + heller Kante
  hpx(ctx, -3 + p.lean, -27 + p.uy, 5, 2, "#6d7885");
  hpx(ctx, -3 + p.lean, -27 + p.uy, 5, 1, "#c2ccd8");
  hpx(ctx, -1 + p.lean, -25 + p.uy, 1, 3, "#8b96a3");
  drawShield(ctx, p);
  const hand = drawFrontArm(ctx, c, p);
  drawSword(ctx, hand, attacking && !casting, af);
}

/* ---------------------------- WALDLÄUFER ---------------------------- */

const RANGER_C = {
  skin: "#cf9d6f", skinHi: "#e6b88a", eye: "#221a12",
  body: "#3c6b46", light: "#6fae70", dark: "#20402a",
  arm: "#3a5f42", armDark: "#233f2b",
  leg: "#3a5233", boot: "#22190f", bootHi: "#3d2c18",
  belt: "#6d4626", beltHi: "#cbb98a"
};

function drawQuiver(ctx, p) {
  const uy = p.uy;
  hout(ctx, 3, -20 + uy, 3, 8, "#5a3f24");
  hpx(ctx, 4, -21 + uy, 1, 2, "#cbb98a");
  hpx(ctx, 5, -22 + uy, 1, 3, "#cbb98a");
  hpx(ctx, 4, -22 + uy, 1, 1, "#9aa25c");
  hpx(ctx, 5, -23 + uy, 1, 1, "#9aa25c");
}

function drawBow(ctx, hand, attacking, af) {
  const pull = attacking ? [0.18, 0.72, 0.95][af] ?? 0.4 : 0.16;
  ctx.save();
  ctx.translate(hand.x + 2, hand.y - 1);
  ctx.strokeStyle = "#8a5a2c";
  ctx.lineWidth = 1.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, -9);
  ctx.quadraticCurveTo(6, -4, 1, 0);
  ctx.moveTo(1, 0);
  ctx.quadraticCurveTo(6, 4, 0, 9);
  ctx.stroke();
  hpx(ctx, -1, -1, 2, 3, "#a5764a");
  const sx = -pull * 8;
  ctx.strokeStyle = "#efe4c8";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -9);
  ctx.quadraticCurveTo(sx, 0, 0, 9);
  ctx.stroke();
  if (pull > 0.22) {
    hpx(ctx, sx - 6, -1, 8, 1, "#c49452");
    hpx(ctx, sx + 2, -1, 2, 2, "#c8d0d8");
    hpx(ctx, sx - 6, -1, 2, 1, "#7fae5c");
  }
  if (attacking && af === 2) {
    hpx(ctx, 2, -1, 7, 1, "rgba(255,245,190,0.8)");
  }
  ctx.restore();
}

function drawRanger(ctx, p, attacking, af, casting) {
  const c = RANGER_C;
  drawQuiver(ctx, p);
  drawBackArm(ctx, c, p);
  drawLegs(ctx, c, p);
  drawTorso(ctx, c, p);
  // Lederwams-Riemen + Gürteltasche (beige Akzente)
  hpx(ctx, -3 + p.lean, -19 + p.uy, 1, 7, "#8a6a3c");
  hpx(ctx, -4, -12 + p.uy, 2, 2, "#cbb98a");
  drawHeadBase(ctx, c, p);
  // Kapuze über dem Kopf
  hout(ctx, -4 + p.lean, -27 + p.uy, 7, 4, "#3a5f3f");
  hpx(ctx, -3 + p.lean, -26 + p.uy, 5, 1, "#6fae70");
  hpx(ctx, -4 + p.lean, -24 + p.uy, 2, 3, "#274a30");
  hpx(ctx, -3 + p.lean, -23 + p.uy, 5, 1, "#20402a");
  const hand = drawFrontArm(ctx, c, p);
  drawBow(ctx, hand, attacking && !casting, af);
}

/* ---------------------------- MAGIER ---------------------------- */

const MAGE_C = {
  skin: "#d3a37c", skinHi: "#eabb90", eye: "#241a30",
  body: "#5a3aa0", light: "#9a78e0", dark: "#2c1c50",
  arm: "#4c2f88", armDark: "#2a1a52",
  leg: "#3a2668", boot: "#211636", bootHi: "#3a2a58",
  belt: "#c9a24a", beltHi: "#f0d284"
};

function drawRobeSkirt(ctx, c, p) {
  const uy = p.uy;
  hout(ctx, -5, -12, 10, 9, c.body);
  hpx(ctx, -4, -11, 8, 2, c.dark);
  hpx(ctx, -5, -5, 10, 2, c.light);
  hpx(ctx, -1, -12, 2, 9, "#2a1a48");
}

function drawStaff(ctx, hand, attacking, af, casting) {
  const ang = attacking ? [-0.15, -0.45, -0.78][af] ?? -0.4 : 0.02;
  ctx.save();
  ctx.translate(hand.x, hand.y);
  ctx.rotate(ang);
  hpx(ctx, 0, -3, 2, 15, "#6e4a28");
  hpx(ctx, 0, -3, 1, 15, "#8a5f36");
  const active = attacking || casting;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = active ? 0.85 : 0.5;
  ctx.fillStyle = "#7cc4ff";
  ctx.beginPath();
  ctx.arc(1, -15, active ? 6 : 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  hout(ctx, -1, -17, 4, 4, "#7cc4ff");
  hpx(ctx, 0, -16, 2, 1, "#e2f2ff");
  hpx(ctx, 0, -16, 1, 1, "#ffffff");
  ctx.restore();
}

function drawMage(ctx, p, attacking, af, casting) {
  const c = MAGE_C;
  drawBackArm(ctx, c, p);
  drawLegs(ctx, c, p);
  drawRobeSkirt(ctx, c, p);
  drawTorso(ctx, c, p);
  // goldene Robenborte + Rune
  hpx(ctx, -4, -19 + p.uy, 8, 1, "#c9a24a");
  hpx(ctx, -1, -17 + p.uy, 2, 2, "#7cc4ff");
  drawHeadBase(ctx, c, p);
  // Spitzhut
  hpx(ctx, -4 + p.lean, -27 + p.uy, 7, 2, "#4a2f88");
  hpx(ctx, -2 + p.lean, -30 + p.uy, 4, 3, "#4a2f88");
  hpx(ctx, -1 + p.lean, -32 + p.uy, 2, 2, "#3a2568");
  hpx(ctx, -4 + p.lean, -27 + p.uy, 7, 1, "#8b6fd0");
  hpx(ctx, 0 + p.lean, -30 + p.uy, 1, 1, "#c9a24a");
  const hand = drawFrontArm(ctx, c, p);
  drawStaff(ctx, hand, attacking && !casting, af, casting);
  if (attacking || casting) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.8;
    hpx(ctx, 7, -14 + p.uy, 2, 2, "#d4b0ff");
    hpx(ctx, 9, -10 + p.uy, 1, 1, "#ffffff");
    ctx.restore();
  }
}

function drawHeroFigure(ctx, classKey, p, attacking, af, casting) {
  if (classKey === "ranger") drawRanger(ctx, p, attacking, af, casting);
  else if (classKey === "mage") drawMage(ctx, p, attacking, af, casting);
  else drawWarrior(ctx, p, attacking, af, casting);
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
  const af = attacking ? Math.min(2, frame) : 0;
  const p = heroPose(animState, frame);
  if (animState === "death") p.uy = 3;

  heroShadow(ctx, cx, groundY, scale);

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(cx, groundY);
  ctx.scale(facing * scale, scale);
  ctx.translate(0, HR.FOOT_Y);
  if ((h.hurtAnim || 0) > 0.05) ctx.translate(facing * -2, 0);
  if (animState === "death") ctx.rotate(facing * 0.4);
  drawHeroFigure(ctx, classKey, p, attacking, af, casting);
  ctx.restore();

  // dezenter Klassen-Glow für Lesbarkeit
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const gy = groundY - 18 * scale;
  const glow = ctx.createRadialGradient(cx, gy, 2, cx, gy, 26 * scale);
  const glowColor =
    classKey === "mage" ? "rgba(150,110,255,0.16)"
      : classKey === "ranger" ? "rgba(120,220,130,0.12)"
        : "rgba(255,210,130,0.12)";
  glow.addColorStop(0, glowColor);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(cx - 30 * scale, groundY - 40 * scale, 60 * scale, 50 * scale);
  ctx.restore();
}

HR.draw = (ctx, opts) => {
  renderHero(ctx, { ...opts, menuMode: false });
};

HR.drawHeroCard = (ctx, classKey, w, h, frame = 0) => {
  ctx.clearRect(0, 0, w, h);
  ctx.imageSmoothingEnabled = false;

  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, "#1b2434");
  bg.addColorStop(1, "#0a0e16");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // sanfte Bühnen-Beleuchtung
  const stage = ctx.createRadialGradient(w / 2, h * 0.62, 4, w / 2, h * 0.62, w * 0.6);
  const tint =
    classKey === "mage" ? "rgba(150,110,255,0.22)"
      : classKey === "ranger" ? "rgba(120,220,130,0.2)"
        : "rgba(255,210,130,0.2)";
  stage.addColorStop(0, tint);
  stage.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = stage;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.strokeRect(0.5, 0.5, w - 1, h - 1);

  // Charakter 2–3× größer als im Spiel präsentieren
  const scale = Math.max(2, Math.min(w / 26, (h - 16) / 30));
  const fakeHero = {
    facing: 1,
    animState: "idle",
    animFrame: frame % 4,
    attackAnim: 0,
    hurtAnim: 0,
    w: HR.W,
    h: HR.H
  };

  renderHero(ctx, {
    x: w / 2,
    h: fakeHero,
    classKey,
    groundY: h - 12,
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
