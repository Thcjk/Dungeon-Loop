/* Dungeon Loop – Hero Renderer (Asset-Pack Bitmaps)
   Keine Lauf-Animation: Bewegung nutzt die Idle-Pose.
   Treffer: Tint am Sprite, nie weiße Box. */

const HR = {
  W: 52,
  H: 96,
  FOOT_Y: 2,
  DISPLAY_SCALE: 1,
  MENU_FILL: 0.9,
  ANIM: {
    idle: { n: 1, t: 0.35 },
    attack: { n: 1, t: 0.1 },
    cast: { n: 1, t: 0.12 },
    hurt: { n: 1, t: 0.16 },
    death: { n: 1, t: 0.28 }
  }
};

HR.displayW = () => HR.W;
HR.displayH = () => HR.H;
HR.getGroundY = () => (typeof GROUND !== "undefined" ? GROUND : 288);
HR.getDrawY = () => HR.getGroundY() - HR.H;

HR.getAnimState = (h) => {
  if (typeof game !== "undefined" && (game.isDead || h.deathAnim)) return "death";
  if ((h.hurtAnim || 0) > 0.05) return "hurt";
  if (typeof game !== "undefined" && game.abilityCastLock > 0) return "cast";
  if ((h.attackAnim || 0) > 0.04) return "attack";
  return "idle";
};

HR.updateAnim = (h, dt, moving) => {
  const state = HR.getAnimState(h);
  if (h.animState !== state) {
    h.animState = state;
    h.animFrame = 0;
    h.animTime = 0;
  }
  const cfg = HR.ANIM[state] || HR.ANIM.idle;
  h.animTime = (h.animTime || 0) + dt;
  if (h.animTime >= cfg.t) {
    h.animTime -= cfg.t;
    h.animFrame = ((h.animFrame || 0) + 1) % cfg.n;
  }

  // Eigene Laufbewegung ohne die unpassenden Walk/Run-Assets:
  // Die Figur kippt minimal um die feste Fußlinie statt nach oben zu hüpfen.
  if (moving && state === "idle") {
    h.gaitPhase = (h.gaitPhase || 0) + dt * 12;
  } else {
    h.gaitPhase = (h.gaitPhase || 0) + dt * 2;
  }
};

function hrShadow(ctx, cx, groundY, scale) {
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.beginPath();
  ctx.ellipse(cx, groundY + 1, 18 * scale, 5 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Offscreen-Canvas für Sprite-Tint (nur Figur-Pixel, nie Hintergrund-Rechteck) */
let _hrTintCanvas = null;
let _hrTintCtx = null;
function hrTintBuffer(w, h) {
  if (!_hrTintCanvas) {
    _hrTintCanvas = document.createElement("canvas");
    _hrTintCtx = _hrTintCanvas.getContext("2d");
  }
  if (_hrTintCanvas.width !== w || _hrTintCanvas.height !== h) {
    _hrTintCanvas.width = w;
    _hrTintCanvas.height = h;
  }
  return _hrTintCtx;
}

/** Treffer-Flash nur auf Sprite-Pixel (kurz, hell/weiß-rot – nie Hitbox-Fläche) */
function hrDrawTintedSprite(ctx, img, dx, y, flashStrength) {
  const w = img.width;
  const h = img.height;
  const a = Math.max(0.12, Math.min(0.5, flashStrength));
  const tc = hrTintBuffer(w, h);
  tc.imageSmoothingEnabled = false;
  tc.clearRect(0, 0, w, h);
  tc.globalCompositeOperation = "source-over";
  tc.drawImage(img, 0, 0);
  tc.globalCompositeOperation = "source-atop";
  tc.fillStyle = "rgba(255, 240, 230, " + a + ")";
  tc.fillRect(0, 0, w, h);
  // Rot ebenfalls nur auf Figur-Pixel ("lighter" würde den transparenten
  // Bereich aufhellen und ein sichtbares Rechteck um das Sprite erzeugen)
  tc.fillStyle = "rgba(255, 70, 55, " + (a * 0.35) + ")";
  tc.fillRect(0, 0, w, h);
  tc.globalCompositeOperation = "source-over";
  ctx.drawImage(_hrTintCanvas, dx, y);
}

function hrDrawBitmap(ctx, img, cx, footY, facing, bobY, flashStrength, lean) {
  if (!img) return false;
  const w = img.width;
  const h = img.height;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  // Drehpunkt liegt auf der Mauerkrone: kein Schweben, keine Höhenänderung.
  ctx.translate(Math.round(cx), Math.round(footY));
  ctx.rotate(lean || 0);
  ctx.scale(facing, 1);
  const dx = -Math.round(w / 2);
  const y = -h + Math.round(bobY || 0);
  if (flashStrength > 0) {
    hrDrawTintedSprite(ctx, img, dx, y, flashStrength);
  } else {
    ctx.drawImage(img, dx, y);
  }
  ctx.restore();
  return true;
}

HR.resolveMoveFrame = (classKey, state, frame, pack) => {
  if (!pack) return null;
  return pack.hero(classKey, state) || pack.hero(classKey, "idle");
};

HR.draw = (ctx, opts) => {
  const h = opts.hero || opts.h || opts;
  const classKey = opts.classKey || h.classKey || (typeof game !== "undefined" ? game.classKey : "warrior");
  const groundY = opts.groundY != null ? opts.groundY : HR.getGroundY();
  const facing = h.facing === -1 ? -1 : 1;
  const state = h.animState || "idle";
  const moving = Math.abs(h.vx || 0) > 4 && state === "idle";
  // Kein vertikales Bobbing: Füße bleiben sichtbar auf der Mauer.
  const bob = 0;
  const gaitLean = moving ? Math.sin(h.gaitPhase || 0) * 0.028 * facing : 0;
  // Der vorhandene Angriffssprite zeigt die Waffe/Bogenpose; der kurze Lean
  // gibt der Bogen-Spannung bzw. dem Hieb einen klaren Ablauf.
  const attackLean = state === "attack" ? -facing * Math.sin((h.attackAnim || 0) * 18) * 0.055 : 0;
  const baseX = (opts.x != null ? opts.x : h.x) || 0;
  const cx = baseX + (h.w || HR.W) / 2 + (opts.hurtOff || 0) + (opts.atkOff || 0);
  const pack = typeof PackAssets !== "undefined" ? PackAssets : null;
  const img = HR.resolveMoveFrame(classKey, state, h.animFrame, pack);

  // Flash-Stärke aus hitFlash – kurz und klar, kein Dauer-Rot
  let flash = 0;
  if ((h.hitFlash || 0) > 0) {
    const t = Math.min(1, h.hitFlash / 10);
    flash = (0.18 + 0.32 * t) * (0.65 + 0.35 * Math.abs(Math.sin(h.hitFlash * 1.4)));
  }

  hrShadow(ctx, cx, groundY, 1);
  if (!hrDrawBitmap(ctx, img, cx, groundY, facing, bob, flash, gaitLean + attackLean)) {
    ctx.fillStyle = "#2a3038";
    ctx.fillRect(cx - 16, groundY - 70, 32, 70);
  }

  if (h.shieldTimer > 0) {
    ctx.save();
    ctx.strokeStyle = "rgba(120,200,255," + Math.min(0.85, h.shieldTimer) + ")";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, groundY - 40, 34, 48, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
};

HR.drawHeroCard = (ctx, classKey, w, h, frame) => {
  ctx.clearRect(0, 0, w, h);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#1a1520");
  g.addColorStop(1, "#0c0a10");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  const pack = typeof PackAssets !== "undefined" ? PackAssets : null;
  const img = pack ? (pack.heroCard(classKey) || pack.hero(classKey, "idle")) : null;
  if (img && img.complete && img.naturalWidth > 0) {
    ctx.imageSmoothingEnabled = false;
    const scale = Math.min((w * 0.78) / img.width, (h * 0.82) / img.height);
    const dw = Math.round(img.width * scale);
    const dh = Math.round(img.height * scale);
    const bob = Math.sin((frame || 0) * 0.8) * 2;
    ctx.drawImage(img, Math.round((w - dw) / 2), Math.round((h - dh) / 2 + bob - 6), dw, dh);
  } else {
    ctx.fillStyle = "#8a7d6c";
    ctx.font = "14px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText(pack && !pack.heroesReady ? "Held wird geladen…" : "Held", w / 2, h / 2);
  }
};

if (typeof window !== "undefined") window.HR = HR;
