/* Dungeon Loop – Hero Renderer (Asset-Pack Bitmaps)
   Nutzt ausschließlich Sprites aus assets/pack/. Gameplay-API bleibt stabil. */

const HR = {
  W: 52,
  H: 96,
  FOOT_Y: 2,
  DISPLAY_SCALE: 1,
  MENU_FILL: 0.9,
  ANIM: {
    idle: { n: 1, t: 0.35 },
    walk: { n: 1, t: 0.16 },
    run: { n: 1, t: 0.12 },
    attack: { n: 1, t: 0.1 },
    cast: { n: 1, t: 0.12 },
    hurt: { n: 1, t: 0.16 },
    death: { n: 1, t: 0.28 }
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
  if (moving && typeof game !== "undefined" && game.isRunning && !game.isPaused) {
    return (Math.abs(h.vx) > 40 || true) ? "run" : "walk";
  }
  if (moving) return "walk";
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

function hrShadow(ctx, cx, groundY, scale) {
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.beginPath();
  ctx.ellipse(cx, groundY + 1, 18 * scale, 5 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function hrDrawBitmap(ctx, img, cx, footY, facing, bobY, flash) {
  if (!img) return false;
  const w = img.width;
  const h = img.height;
  const x = Math.round(cx - w / 2);
  const y = Math.round(footY - h + (bobY || 0));
  ctx.save();
  if (facing < 0) {
    ctx.translate(cx * 2, 0);
    ctx.scale(-1, 1);
  }
  if (flash) {
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(img, facing < 0 ? (cx * 2 - x - w) : x, y);
    ctx.globalCompositeOperation = "source-atop";
    ctx.fillStyle = "rgba(255,220,200,0.35)";
    ctx.fillRect(facing < 0 ? (cx * 2 - x - w) : x, y, w, h);
    ctx.globalCompositeOperation = "source-over";
  } else {
    ctx.drawImage(img, facing < 0 ? (cx * 2 - x - w) : x, y);
  }
  ctx.restore();
  return true;
}

HR.draw = (ctx, opts) => {
  const h = opts.hero || opts.h || opts;
  const classKey = opts.classKey || h.classKey || (typeof game !== "undefined" ? game.classKey : "warrior");
  const groundY = opts.groundY != null ? opts.groundY : HR.getGroundY();
  const facing = h.facing === -1 ? -1 : 1;
  const state = h.animState || "idle";
  const bob = state === "idle" ? Math.sin((h.animTime || 0) * 6) * 1.2 : (state === "run" || state === "walk" ? Math.sin((h.animTime || 0) * 18) * 1.5 : 0);
  const baseX = (opts.x != null ? opts.x : h.x) || 0;
  const cx = baseX + (h.w || HR.W) / 2 + (opts.hurtOff || 0) + (opts.atkOff || 0);
  const pack = typeof PackAssets !== "undefined" ? PackAssets : null;
  const img = pack ? pack.hero(classKey, state) || pack.hero(classKey, "idle") : null;

  hrShadow(ctx, cx, groundY, 1);
  if (!hrDrawBitmap(ctx, img, cx, groundY, facing, bob, (h.hitFlash || 0) > 0)) {
    // Fallback silhouette if pack not ready
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
  if (img) {
    const scale = Math.min((w * 0.78) / img.width, (h * 0.82) / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    const bob = Math.sin((frame || 0) * 0.8) * 3;
    ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2 + bob - 6, dw, dh);
  } else {
    ctx.fillStyle = "#666";
    ctx.fillRect(w * 0.35, h * 0.25, w * 0.3, h * 0.5);
  }
};

if (typeof window !== "undefined") window.HR = HR;
