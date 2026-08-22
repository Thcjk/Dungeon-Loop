/* Dungeon Loop – Pack FX Renderer
   Nutzt zugeschnittene Sprites aus assets/pack/fx/sprites/
   Fallback auf bestehende Pixel-Sprites, wenn Pack noch lädt. */
(function (global) {
  const FX_MAP = {
    projectile_arrow: "arrow",
    projectile_fire: "fireball",
    projectile_ice: "icebolt",
    projectile_poison: "poison",
    projectile_dagger: "dagger",
    arrow: "arrow",
    fireball: "fireball",
    icebolt: "icebolt",
    poison: "poison",
    dagger: "dagger",
    slash: "slash",
    explosion: "explosion",
    magic_circle: "magic_circle",
    spark: "spark_a",
    spark_a: "spark_a",
    spark_b: "spark_b",
    light_beam: "light_beam"
  };

  function fxImg(key) {
    if (typeof PackAssets === "undefined") return null;
    return PackAssets.fxSprite(key) || PackAssets.fxSprite(FX_MAP[key] || key);
  }

  function drawRotated(ctx, img, x, y, angle, scale, alpha, flipY) {
    if (!img) return false;
    const sc = scale || 1;
    const w = img.width * sc;
    const h = img.height * sc;
    ctx.save();
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.translate(x, y);
    ctx.rotate(angle || 0);
    if (flipY) ctx.scale(1, -1);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
    return true;
  }

  function projectileKey(p) {
    if (p.fxKey) return p.fxKey;
    if (p.sprite === "projectile_fire" || p.magic) return "fireball";
    if (p.sprite === "projectile_arrow") return "arrow";
    if (p.trail && String(p.trail).includes("9b59b6")) return "poison";
    if (p.trail && (String(p.trail).includes("8bd8ff") || String(p.trail).includes("5dade2"))) return "icebolt";
    if (p.owner === "enemy") return "poison";
    if (typeof game !== "undefined" && game.classKey === "mage") return "fireball";
    if (typeof game !== "undefined" && game.classKey === "ranger") return "arrow";
    return "dagger";
  }

  const PackFX = {
    drawProjectile(ctx, p) {
      const key = projectileKey(p);
      const img = fxImg(key);
      if (!img) return false;
      const speed = Math.hypot(p.vx || 0, p.vy || 0) || 1;
      const angle = Math.atan2(p.vy || 0, p.vx || 0);
      const sc = p.big ? 1.35 : (key === "fireball" || key === "icebolt" ? 1.05 : 0.95);
      // Leichter Glow hinter Feuer/Eis
      if (key === "fireball" || key === "icebolt" || key === "poison") {
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        const col = key === "fireball" ? "rgba(255,140,40,0.35)"
          : key === "icebolt" ? "rgba(120,200,255,0.32)"
          : "rgba(120,255,80,0.28)";
        const g = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, p.big ? 26 : 16);
        g.addColorStop(0, col);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(p.x - 30, p.y - 30, 60, 60);
        ctx.restore();
      }
      return drawRotated(ctx, img, p.x, p.y, angle, sc, 1, false);
    },

    drawSlash(ctx, s) {
      const img = fxImg(s.owner === "enemy" ? "slash_b" : "slash") || fxImg("slash");
      if (!img) return false;
      const maxLife = s.maxLife || (s.big ? 20 : 14);
      const t = Math.max(0, Math.min(1, s.life / maxLife));
      const sc = (s.big ? 1.15 : 0.85) * (0.75 + (1 - t) * 0.45);
      return drawRotated(ctx, img, s.x, s.y, s.angle, sc, 0.35 + t * 0.65, false);
    },

    drawEffect(ctx, fx) {
      const t = fx.life / fx.maxLife;
      if (fx.type === "explosion") {
        const img = fxImg("explosion");
        if (!img) return false;
        const sc = (fx.radius || 24) / 40 * (0.7 + (1 - t) * 0.8);
        return drawRotated(ctx, img, fx.x, fx.y, 0, sc, t * 0.95, false);
      }
      if (fx.type === "spark" || fx.type === "ring") {
        const img = fxImg(fx.fxKey || "spark_a");
        if (!img) return false;
        const sc = 0.55 + (1 - t) * 0.7;
        return drawRotated(ctx, img, fx.x, fx.y, (1 - t) * 1.2, sc, t * 0.9, false);
      }
      if (fx.type === "circle") {
        const img = fxImg("magic_circle");
        if (!img) return false;
        return drawRotated(ctx, img, fx.x, fx.y + 8, 0, 0.7 + (1 - t) * 0.25, t * 0.85, false);
      }
      if (fx.type === "beam") {
        const img = fxImg("light_beam");
        if (!img) return false;
        return drawRotated(ctx, img, fx.x, fx.y - 20, 0, 0.65, t * 0.8, false);
      }
      return false;
    },

    spawnSpark(x, y, opts) {
      if (typeof game === "undefined") return;
      const o = opts || {};
      game.attackEffects.push({
        type: "spark",
        fxKey: o.key || "spark_a",
        x, y,
        life: o.life || 12,
        maxLife: o.life || 12,
        radius: o.radius || 16,
        color: o.color || "#f1c40f"
      });
    },

    spawnExplosion(x, y, opts) {
      if (typeof game === "undefined") return;
      const o = opts || {};
      game.attackEffects.push({
        type: "explosion",
        x, y,
        life: o.life || 16,
        maxLife: o.life || 16,
        radius: o.radius || 28,
        color: o.color || "#e67e22"
      });
    },

    spawnMagicCircle(x, y, opts) {
      if (typeof game === "undefined") return;
      const o = opts || {};
      game.attackEffects.push({
        type: "circle",
        x, y,
        life: o.life || 22,
        maxLife: o.life || 22,
        radius: 40,
        color: "#9b59b6"
      });
    }
  };

  global.PackFX = PackFX;
})(typeof window !== "undefined" ? window : globalThis);
