// Art Remake v2 - procedural enemy renderer
// Self-contained pixel-art enemy drawing for Dungeon Loop (no gameplay logic).

(function () {
  "use strict";

  const ART_W = 32;
  const ART_H = 40;
  const BOSS_W = 40;
  const BOSS_H = 50;
  const OUTLINE = "#09070b";

  // ---------------------------------------------------------------------------
  // Pixel helpers
  // ---------------------------------------------------------------------------

  function px(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  function out(ctx, x, y, w, h, color) {
    px(ctx, x - 1, y, 1, h, OUTLINE);
    px(ctx, x + w, y, 1, h, OUTLINE);
    px(ctx, x, y - 1, w, 1, OUTLINE);
    px(ctx, x, y + h, w, 1, OUTLINE);
    px(ctx, x, y, w, h, color);
  }

  function tri(ctx, x1, y1, x2, y2, x3, y3, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(Math.round(x1), Math.round(y1));
    ctx.lineTo(Math.round(x2), Math.round(y2));
    ctx.lineTo(Math.round(x3), Math.round(y3));
    ctx.closePath();
    ctx.fill();
  }

  // ---------------------------------------------------------------------------
  // Color / theme utilities
  // ---------------------------------------------------------------------------

  function hexToRgb(hex) {
    const h = hex.replace("#", "");
    const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function rgbToHex(r, g, b) {
    const c = (v) => Math.max(0, Math.min(255, Math.round(v)));
    return "#" + [c(r), c(g), c(b)].map((v) => v.toString(16).padStart(2, "0")).join("");
  }

  function mix(a, b, t) {
    const A = hexToRgb(a);
    const B = hexToRgb(b);
    return rgbToHex(A.r + (B.r - A.r) * t, A.g + (B.g - A.g) * t, A.b + (B.b - A.b) * t);
  }

  function shiftPalette(pal, theme) {
    const T = THEME_SHIFT[theme] || THEME_SHIFT.forest;
    const out = {};
    for (const k in pal) {
      let c = pal[k];
      if (T.hue) c = mix(c, T.hue, T.hueAmt || 0.22);
      if (T.dark) c = mix(c, T.dark, T.darkAmt || 0.08);
      if (T.light && (k === "accent" || k === "eye" || k === "glow")) {
        c = mix(c, T.light, T.lightAmt || 0.35);
      }
      out[k] = c;
    }
    return out;
  }

  const THEME_SHIFT = {
    forest: { hue: "#3d7a52", hueAmt: 0.18, dark: "#1a2e1f", darkAmt: 0.06 },
    swamp: { hue: "#4a5c32", hueAmt: 0.28, dark: "#1c2410", darkAmt: 0.14, light: "#7ec896", lightAmt: 0.2 },
    frost: { hue: "#8eb8d8", hueAmt: 0.32, dark: "#2a3d52", darkAmt: 0.1, light: "#d4eef8", lightAmt: 0.45 },
    fire: { hue: "#c0392b", hueAmt: 0.26, dark: "#3d1208", darkAmt: 0.12, light: "#f39c12", lightAmt: 0.38 },
    ruins: { hue: "#6c5b7b", hueAmt: 0.2, dark: "#1e1828", darkAmt: 0.1, light: "#d4ac0d", lightAmt: 0.25 }
  };

  const THEME_STYLE = {
    forest: {
      shadow: "rgba(3,12,6,0.52)", contact: "rgba(18,42,24,0.42)",
      tint: "#2d6a4f", tintA: 0.13, fog: "rgba(8,28,18,0.55)", rim: null
    },
    swamp: {
      shadow: "rgba(6,10,4,0.58)", contact: "rgba(30,45,20,0.38)",
      tint: "#354828", tintA: 0.16, fog: "rgba(15,25,10,0.55)", rim: "rgba(82,183,136,0.18)"
    },
    frost: {
      shadow: "rgba(8,16,32,0.52)", contact: "rgba(120,160,200,0.28)",
      tint: "#85c1e9", tintA: 0.12, fog: "rgba(160,200,240,0.35)", rim: "rgba(212,232,248,0.2)"
    },
    fire: {
      shadow: "rgba(22,5,0,0.62)", contact: "rgba(160,50,12,0.48)",
      tint: "#922b21", tintA: 0.19, fog: "rgba(80,20,5,0.45)", rim: "rgba(243,156,18,0.25)"
    },
    ruins: {
      shadow: "rgba(10,8,16,0.52)", contact: "rgba(40,36,48,0.36)",
      tint: "#5a6068", tintA: 0.11, fog: "rgba(25,20,35,0.45)", rim: "rgba(241,196,15,0.14)"
    }
  };

  function themeStyle(world) {
    return THEME_STYLE[world?.theme] || THEME_STYLE.forest;
  }

  // ---------------------------------------------------------------------------
  // Shadow & post effects
  // ---------------------------------------------------------------------------

  function drawShadow(ctx, cx, footY, w, world, bob, big) {
    const style = themeStyle(world);
    const sy = Math.round(footY + 1 - (bob || 0) * 0.25);
    const sw = Math.max(16, w * (big ? 0.52 : 0.44));
    ctx.save();
    ctx.fillStyle = style.shadow;
    ctx.beginPath();
    ctx.ellipse(Math.round(cx), sy, sw, 4.5 + (big ? 2 : 0), 0, 0, Math.PI * 2);
    ctx.fill();
    if (style.contact) {
      ctx.fillStyle = style.contact;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.ellipse(Math.round(cx), sy - 1, sw * 0.62, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function applyThemeTint(ctx, x, y, w, h, world) {
    const style = themeStyle(world);
    if (style.tint && style.tintA > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "multiply";
      ctx.globalAlpha = style.tintA;
      ctx.fillStyle = style.tint;
      ctx.fillRect(Math.round(x - 2), Math.round(y - 1), Math.round(w + 4), Math.round(h + 2));
      ctx.restore();
    }
    if (style.rim) {
      ctx.save();
      const g = ctx.createLinearGradient(x, y, x, y + h * 0.38);
      g.addColorStop(0, style.rim);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = g;
      ctx.fillRect(Math.round(x - 2), Math.round(y - 1), Math.round(w + 4), Math.round(h * 0.35));
      ctx.restore();
    }
  }

  function drawFeetFog(ctx, x, y, w, h, world) {
    const style = themeStyle(world);
    const fogCol = style.fog || "rgba(0,0,0,0.3)";
    ctx.save();
    const g = ctx.createLinearGradient(x, y + h * 0.5, x, y + h + 5);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(0.55, fogCol);
    g.addColorStop(1, fogCol);
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = g;
    ctx.fillRect(Math.round(x - 4), Math.round(y + h * 0.48), Math.round(w + 8), Math.round(h * 0.55 + 6));
    ctx.restore();
  }

  function applyBossGlow(ctx, x, y, w, h, glowColor) {
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 14;
    ctx.fillStyle = glowColor;
    ctx.fillRect(Math.round(x + w * 0.15), Math.round(y + h * 0.1), Math.round(w * 0.7), Math.round(h * 0.75));
    ctx.restore();
  }

  function drawThemeAccents(ctx, theme, bob, big) {
    const b = bob || 0;
    if (theme === "frost") {
      px(ctx, -6, -34 + b, 2, 5, "#d4eef8");
      px(ctx, 5, -30 + b, 2, 4, "#a8cce8");
      if (big) px(ctx, -2, -42 + b, 4, 2, "#e8f4fc");
    } else if (theme === "fire") {
      px(ctx, -8, -28 + b, 3, 4, "#e67e22");
      px(ctx, 6, -32 + b, 2, 5, "#f39c12");
      px(ctx, -3, -36 + b, 2, 3, "#f1c40f");
    } else if (theme === "swamp") {
      px(ctx, -5, -2 + b, 3, 2, "#3d5a28");
      px(ctx, 3, -1 + b, 4, 2, "#4a6b32");
      tri(ctx, -7, -4 + b, -4, -4 + b, -6, -1 + b, "#2d4a1e");
    } else if (theme === "ruins") {
      px(ctx, -7, -22 + b, 2, 2, "#7f8c8d");
      px(ctx, 6, -18 + b, 3, 2, "#95a5a6");
      if (big) px(ctx, -1, -40 + b, 2, 2, "#d4ac0d");
    } else {
      px(ctx, -6, -4 + b, 2, 2, "#2d6a4f");
      px(ctx, 4, -3 + b, 3, 2, "#40916c");
    }
  }

  // ---------------------------------------------------------------------------
  // Enemy silhouettes (local coords: origin = foot center, y grows upward negative)
  // ---------------------------------------------------------------------------

  function drawGoblin(ctx, c, bob, big) {
    const b = bob || 0;
    // Bandit-like forest goblin: hooded scout with dagger
    out(ctx, -10, -28 + b, 20, 8, c.cloak);
    px(ctx, -8, -26 + b, 16, 4, c.cloakHi);
    out(ctx, -7, -36 + b, 14, 10, c.hood);
    px(ctx, -5, -34 + b, 10, 3, c.hoodDark);
    px(ctx, -4, -31 + b, 3, 2, c.eye);
    px(ctx, 2, -31 + b, 3, 2, c.eye);
    out(ctx, -12, -12 + b, 5, 3, c.ear);
    out(ctx, 7, -12 + b, 5, 3, c.ear);
    out(ctx, -8, -20 + b, 16, 12, c.tunic);
    px(ctx, -6, -18 + b, 12, 2, c.belt);
    px(ctx, -2, -18 + b, 4, 2, c.buckle);
    out(ctx, -7, -8 + b, 5, 8, c.leg);
    out(ctx, 2, -8 + b, 5, 8, c.leg);
    px(ctx, -8, -1 + b, 6, 2, c.boot);
    px(ctx, 2, -1 + b, 6, 2, c.boot);
    out(ctx, 6, -22 + b, 4, 10, c.arm);
    out(ctx, 9, -16 + b, 2, 8, c.dagger);
    px(ctx, 9, -8 + b, 2, 2, c.daggerHilt);
    if (big) {
      out(ctx, -11, -38 + b, 22, 3, c.buckle);
      px(ctx, -3, -37 + b, 6, 2, c.accent);
    }
  }

  function drawSkelett(ctx, c, bob, big) {
    const b = bob || 0;
    out(ctx, -6, -38 + b, 12, 10, c.skull);
    px(ctx, -4, -35 + b, 3, 3, c.eye);
    px(ctx, 2, -35 + b, 3, 3, c.eye);
    px(ctx, -2, -30 + b, 4, 2, c.jaw);
    px(ctx, -2, -28 + b, 4, 3, c.spine);
    out(ctx, -9, -25 + b, 18, 14, c.ribs);
    px(ctx, -7, -23 + b, 14, 2, c.ribLine);
    px(ctx, -7, -19 + b, 14, 2, c.ribLine);
    px(ctx, -7, -15 + b, 14, 2, c.ribLine);
    out(ctx, -10, -24 + b, 4, 14, c.arm);
    out(ctx, 6, -24 + b, 4, 14, c.arm);
    px(ctx, -11, -12 + b, 2, 2, c.joint);
    px(ctx, 9, -12 + b, 2, 2, c.joint);
    out(ctx, -6, -11 + b, 5, 11, c.leg);
    out(ctx, 1, -11 + b, 5, 11, c.leg);
    px(ctx, -7, -1 + b, 6, 2, c.foot);
    px(ctx, 1, -1 + b, 6, 2, c.foot);
    if (big) {
      out(ctx, 8, -30 + b, 3, 16, c.weapon);
      px(ctx, 8, -14 + b, 3, 4, c.weaponTip);
    }
  }

  function drawSchleim(ctx, c, bob, big) {
    const b = bob || 0;
    // Spirit slime blob – wobbly dome with inner glow
    const wob = Math.sin((bob || 0) * 2) * 1.5;
    out(ctx, -14 + wob, -22 + b, 28, 16, c.body);
    out(ctx, -11, -30 + b, 22, 10, c.bodyHi);
    px(ctx, -6, -26 + b, 12, 8, c.core);
    px(ctx, -3, -24 + b, 3, 3, c.eye);
    px(ctx, 2, -24 + b, 3, 3, c.eye);
    px(ctx, -8, -8 + b, 4, 6, c.drip);
    px(ctx, 3, -6 + b, 5, 5, c.drip);
    px(ctx, -1, -4 + b, 3, 4, c.drip);
    tri(ctx, -16 + wob, -6 + b, -10 + wob, -6 + b, -13 + wob, -1 + b, c.bodyDark);
    tri(ctx, 10 + wob, -5 + b, 16 + wob, -5 + b, 13 + wob, 0 + b, c.bodyDark);
    if (big) {
      ctx.save();
      ctx.globalAlpha = 0.35;
      out(ctx, -16, -34 + b, 32, 20, c.glow);
      ctx.restore();
      px(ctx, -2, -32 + b, 4, 4, c.accent);
    }
  }

  function drawBandit(ctx, c, bob, big) {
    const b = bob || 0;
    // Corrupted bandit: half-mask, torn cloak, corruption veins
    out(ctx, -11, -34 + b, 22, 12, c.cloak);
    px(ctx, -9, -32 + b, 8, 10, c.corrupt);
    px(ctx, 2, -30 + b, 7, 8, c.cloakHi);
    out(ctx, -7, -38 + b, 14, 8, c.mask);
    px(ctx, -5, -35 + b, 4, 3, c.skin);
    px(ctx, 2, -35 + b, 3, 3, c.eye);
    px(ctx, -1, -33 + b, 5, 1, c.scar);
    out(ctx, -8, -22 + b, 16, 14, c.vest);
    px(ctx, -6, -20 + b, 12, 2, c.belt);
    px(ctx, -8, -14 + b, 3, 8, c.corrupt);
    out(ctx, -7, -8 + b, 5, 8, c.pants);
    out(ctx, 2, -8 + b, 5, 8, c.pants);
    px(ctx, -8, -1 + b, 6, 2, c.boot);
    px(ctx, 2, -1 + b, 6, 2, c.boot);
    out(ctx, -13, -26 + b, 5, 12, c.arm);
    out(ctx, 8, -24 + b, 5, 12, c.arm);
    out(ctx, 9, -18 + b, 2, 12, c.blade);
    px(ctx, 9, -6 + b, 2, 3, c.bladeHilt);
    if (big) {
      px(ctx, -10, -28 + b, 4, 6, c.corrupt);
      out(ctx, -12, -36 + b, 24, 2, c.belt);
    }
  }

  function drawWolf(ctx, c, bob, big) {
    const b = bob || 0;
    // Side-profile wolf quadruped
    out(ctx, -14, -18 + b, 24, 10, c.body);
    out(ctx, 8, -22 + b, 10, 8, c.head);
    px(ctx, 14, -20 + b, 4, 3, c.snout);
    px(ctx, 16, -19 + b, 2, 2, c.nose);
    px(ctx, 11, -23 + b, 2, 2, c.eye);
    out(ctx, 6, -26 + b, 4, 5, c.ear);
    out(ctx, -12, -10 + b, 4, 10, c.leg);
    out(ctx, -4, -10 + b, 4, 10, c.leg);
    out(ctx, 4, -10 + b, 4, 10, c.leg);
    out(ctx, 10, -10 + b, 4, 10, c.leg);
    px(ctx, -13, -1 + b, 5, 2, c.paw);
    px(ctx, -5, -1 + b, 5, 2, c.paw);
    px(ctx, 3, -1 + b, 5, 2, c.paw);
    px(ctx, 9, -1 + b, 5, 2, c.paw);
    out(ctx, -18, -16 + b, 8, 4, c.tail);
    px(ctx, -20, -18 + b, 4, 3, c.tailTip);
    if (big) {
      px(ctx, -8, -20 + b, 16, 2, c.mane);
      px(ctx, 0, -24 + b, 6, 3, c.mane);
    }
  }

  function drawSpinne(ctx, c, bob, big) {
    const b = bob || 0;
    const legWave = Math.sin((bob || 0) * 3) * 1;
    out(ctx, -8, -20 + b, 16, 12, c.abdomen);
    out(ctx, -6, -28 + b, 12, 10, c.cephalo);
    px(ctx, -4, -26 + b, 2, 2, c.eye);
    px(ctx, -1, -26 + b, 2, 2, c.eye);
    px(ctx, 2, -26 + b, 2, 2, c.eye);
    px(ctx, -3, -24 + b, 2, 2, c.eye);
    const legs = [
      [-14, -18 + legWave], [-12, -12 - legWave], [-14, -6 + legWave],
      [10, -18 - legWave], [12, -12 + legWave], [10, -6 - legWave],
      [-10, -8 + legWave], [8, -8 - legWave]
    ];
    legs.forEach(([lx, ly]) => {
      out(ctx, lx, ly + b, 6, 2, c.leg);
    });
    px(ctx, -2, -16 + b, 4, 4, c.mark);
    if (big) {
      out(ctx, -10, -30 + b, 20, 14, c.abdomen);
      px(ctx, -4, -22 + b, 8, 4, c.mark);
    }
  }

  function drawBossOrk(ctx, c, bob, big) {
    const b = bob || 0;
    out(ctx, -16, -42 + b, 32, 10, c.helm);
    px(ctx, -10, -40 + b, 20, 4, c.helmHi);
    px(ctx, -5, -38 + b, 4, 3, c.tusk);
    px(ctx, 2, -38 + b, 4, 3, c.tusk);
    px(ctx, -4, -36 + b, 3, 2, c.eye);
    px(ctx, 2, -36 + b, 3, 2, c.eye);
    out(ctx, -14, -32 + b, 28, 16, c.chest);
    px(ctx, -10, -30 + b, 20, 3, c.plate);
    px(ctx, -2, -28 + b, 4, 6, c.emblem);
    out(ctx, -18, -30 + b, 6, 10, c.shoulder);
    out(ctx, 12, -30 + b, 6, 10, c.shoulder);
    out(ctx, -10, -16 + b, 8, 16, c.leg);
    out(ctx, 2, -16 + b, 8, 16, c.leg);
    px(ctx, -11, -1 + b, 10, 3, c.boot);
    px(ctx, 1, -1 + b, 10, 3, c.boot);
    out(ctx, 14, -28 + b, 4, 18, c.axe);
    px(ctx, 14, -10 + b, 6, 8, c.axeBlade);
    px(ctx, 16, -12 + b, 2, 10, c.axeEdge);
  }

  function drawBossSchatten(ctx, c, bob, big) {
    const b = bob || 0;
    out(ctx, -14, -44 + b, 28, 38, c.cloak);
    px(ctx, -10, -40 + b, 20, 30, c.void);
    out(ctx, -8, -38 + b, 16, 10, c.hood);
    px(ctx, -3, -35 + b, 3, 3, c.eye);
    px(ctx, 1, -35 + b, 3, 3, c.eye);
    px(ctx, -2, -32 + b, 4, 1, c.eyeGlow);
    out(ctx, -12, -28 + b, 24, 14, c.chest);
    px(ctx, -6, -24 + b, 12, 8, c.void);
    out(ctx, -8, -14 + b, 6, 14, c.leg);
    out(ctx, 2, -14 + b, 6, 14, c.leg);
    px(ctx, -16, -36 + b, 6, 20, c.cape);
    px(ctx, 10, -36 + b, 6, 20, c.cape);
    out(ctx, 10, -30 + b, 3, 20, c.blade);
    px(ctx, 10, -10 + b, 3, 4, c.bladeGlow);
    ctx.save();
    ctx.globalAlpha = 0.4;
    px(ctx, -14, -46 + b, 28, 4, c.mist);
    ctx.restore();
  }

  function drawBossFeuer(ctx, c, bob, big) {
    const b = bob || 0;
    px(ctx, -8, -46 + b, 4, 6, c.flame);
    px(ctx, 3, -48 + b, 4, 8, c.flame);
    px(ctx, -2, -50 + b, 4, 5, c.flameHi);
    out(ctx, -10, -40 + b, 20, 12, c.head);
    px(ctx, -6, -38 + b, 4, 3, c.horn);
    px(ctx, 3, -38 + b, 4, 3, c.horn);
    px(ctx, -4, -36 + b, 3, 3, c.eye);
    px(ctx, 2, -36 + b, 3, 3, c.eye);
    out(ctx, -14, -28 + b, 28, 16, c.body);
    px(ctx, -10, -26 + b, 20, 4, c.crack);
    px(ctx, -6, -20 + b, 12, 3, c.lava);
    out(ctx, -10, -12 + b, 8, 12, c.leg);
    out(ctx, 2, -12 + b, 8, 12, c.leg);
    px(ctx, -11, -1 + b, 10, 3, c.foot);
    px(ctx, 1, -1 + b, 10, 3, c.foot);
    out(ctx, -16, -26 + b, 5, 14, c.arm);
    out(ctx, 11, -26 + b, 5, 14, c.arm);
    px(ctx, 12, -16 + b, 4, 4, c.orb);
    ctx.save();
    ctx.globalAlpha = 0.5;
    px(ctx, 11, -17 + b, 6, 6, c.orbGlow);
    ctx.restore();
  }

  function drawBossDrache(ctx, c, bob, big) {
    const b = bob || 0;
    out(ctx, -8, -42 + b, 16, 10, c.head);
    px(ctx, 6, -40 + b, 8, 4, c.snout);
    px(ctx, 12, -39 + b, 3, 2, c.nostril);
    px(ctx, 2, -40 + b, 3, 2, c.eye);
    px(ctx, -4, -44 + b, 4, 4, c.horn);
    out(ctx, -14, -32 + b, 28, 16, c.body);
    px(ctx, -10, -30 + b, 20, 6, c.scale);
    px(ctx, -8, -24 + b, 16, 4, c.scaleHi);
    out(ctx, -18, -30 + b, 8, 12, c.wing);
    out(ctx, 10, -30 + b, 8, 12, c.wing);
    px(ctx, -20, -28 + b, 4, 6, c.wingMem);
    px(ctx, 16, -28 + b, 4, 6, c.wingMem);
    out(ctx, -8, -16 + b, 6, 16, c.leg);
    out(ctx, 2, -16 + b, 6, 16, c.leg);
    px(ctx, -9, -1 + b, 8, 3, c.claw);
    px(ctx, 1, -1 + b, 8, 3, c.claw);
    out(ctx, -20, -18 + b, 10, 4, c.tail);
    px(ctx, -22, -16 + b, 4, 3, c.tailTip);
  }

  function drawBossNekro(ctx, c, bob, big) {
    const b = bob || 0;
    out(ctx, -8, -44 + b, 16, 12, c.hood);
    px(ctx, -5, -42 + b, 10, 6, c.face);
    px(ctx, -3, -40 + b, 2, 2, c.eye);
    px(ctx, 2, -40 + b, 2, 2, c.eye);
    px(ctx, -1, -38 + b, 2, 2, c.skull);
    out(ctx, -12, -32 + b, 24, 18, c.robes);
    px(ctx, -8, -30 + b, 16, 4, c.trim);
    px(ctx, -2, -28 + b, 4, 8, c.rune);
    out(ctx, -7, -14 + b, 6, 14, c.leg);
    out(ctx, 1, -14 + b, 6, 14, c.leg);
    px(ctx, -8, -1 + b, 7, 2, c.shoe);
    px(ctx, 1, -1 + b, 7, 2, c.shoe);
    out(ctx, 8, -42 + b, 3, 38, c.staff);
    out(ctx, 6, -44 + b, 7, 6, c.skullTop);
    px(ctx, 8, -42 + b, 3, 2, c.eye);
    px(ctx, -10, -36 + b, 3, 3, c.bone);
    px(ctx, 12, -30 + b, 3, 3, c.bone);
    ctx.save();
    ctx.globalAlpha = 0.45;
    px(ctx, -2, -26 + b, 4, 4, c.magic);
    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // Palettes per enemy (base colors before theme shift)
  // ---------------------------------------------------------------------------

  const BASE_PALETTES = {
    goblin: {
      cloak: "#3d5c34", cloakHi: "#5a8a4a", hood: "#2a4530", hoodDark: "#1e3224",
      eye: "#f1c40f", ear: "#6abf69", tunic: "#4a6741", belt: "#3d2817", buckle: "#d4ac0d",
      leg: "#354d2e", boot: "#241a14", arm: "#5a7a50", dagger: "#bdc3c7", daggerHilt: "#8b4513",
      accent: "#a8e06c"
    },
    skelett: {
      skull: "#e8e4dc", eye: "#1a1a2e", jaw: "#d5d0c8", spine: "#c8c2b8",
      ribs: "#ddd8d0", ribLine: "#b8b2a8", arm: "#d0cbc3", joint: "#a8a298",
      leg: "#ccc6bc", foot: "#b5afa5", weapon: "#95a5a6", weaponTip: "#ecf0f1"
    },
    schleim: {
      body: "#52b788", bodyHi: "#74c69d", bodyDark: "#2d6a4f", core: "#95d5b2",
      eye: "#1b4332", drip: "#40916c", glow: "#b7e4c7", accent: "#d8f3dc"
    },
    bandit: {
      cloak: "#4a3728", cloakHi: "#6b4c35", corrupt: "#6c3483", mask: "#2c241c",
      skin: "#c9a87c", eye: "#e74c3c", scar: "#922b21", vest: "#5d4037", belt: "#3e2723",
      pants: "#3d3228", boot: "#1a1410", arm: "#8d6e63", blade: "#aab7b8", bladeHilt: "#d4ac0d"
    },
    wolf: {
      body: "#5d4e42", head: "#6d5d4f", snout: "#8d7b6d", nose: "#1a1a1a", eye: "#f39c12",
      ear: "#4a3f36", leg: "#4e4038", paw: "#3d3228", tail: "#5a4a3e", tailTip: "#3d3228",
      mane: "#7f6a55"
    },
    spinne: {
      abdomen: "#4a235a", cephalo: "#5b2c6f", eye: "#f1c40f", leg: "#2c1810",
      mark: "#e74c3c"
    },
    boss_ork: {
      helm: "#566573", helmHi: "#7f8c8d", tusk: "#ecf0f1", eye: "#e74c3c",
      chest: "#6e3b2a", plate: "#8b4513", emblem: "#f1c40f", shoulder: "#5d4037",
      leg: "#4e342e", boot: "#2c1810", axe: "#6d4c41", axeBlade: "#95a5a6", axeEdge: "#ecf0f1"
    },
    boss_schatten: {
      cloak: "#1a1520", void: "#0d0a12", hood: "#2c2438", eye: "#9b59b6", eyeGlow: "#d7bde2",
      chest: "#1f1a28", leg: "#151018", cape: "#120e18", blade: "#566573", bladeGlow: "#bb8fce",
      mist: "#4a235a"
    },
    boss_feuer: {
      flame: "#e67e22", flameHi: "#f1c40f", head: "#641e16", horn: "#1a1a1a",
      eye: "#f39c12", body: "#922b21", crack: "#f39c12", lava: "#e74c3c",
      leg: "#7b241c", foot: "#4a0e0a", arm: "#a93226", orb: "#f1c40f", orbGlow: "#e67e22"
    },
    boss_drache: {
      head: "#1e6f50", snout: "#2d8f66", nostril: "#145a32", eye: "#f1c40f", horn: "#8b7355",
      body: "#196f3d", scale: "#229954", scaleHi: "#52be80", wing: "#117a65", wingMem: "#1abc9c",
      leg: "#145a32", claw: "#1a252f", tail: "#117a65", tailTip: "#e74c3c"
    },
    boss_nekro: {
      hood: "#2c1810", face: "#d5dbdb", eye: "#8e44ad", skull: "#ecf0f1", robes: "#4a235a",
      trim: "#9b59b6", rune: "#e74c3c", leg: "#3d1f4a", shoe: "#1a0a20", staff: "#5d4037",
      skullTop: "#ecf0f1", bone: "#bdc3c7", magic: "#bb8fce"
    }
  };

  const BOSS_GLOW = {
    boss_ork: "#e74c3c",
    boss_schatten: "#9b59b6",
    boss_feuer: "#f39c12",
    boss_drache: "#2ecc71",
    boss_nekro: "#bb8fce"
  };

  const NORMAL_VISUAL_BOOST = 1.22;
  const BOSS_VISUAL_BOOST = 1.45;
  const ENEMY_FOOT_Y = 1;

  function getVisualMetrics(spriteKey, w, h, big) {
    const isBoss = !!big || (spriteKey || "").startsWith("boss_");
    const artW = isBoss ? BOSS_W : ART_W;
    const artH = isBoss ? BOSS_H : ART_H;
    const boost = isBoss ? BOSS_VISUAL_BOOST : NORMAL_VISUAL_BOOST;
    const scale = Math.min(w / artW, h / artH) * boost;
    return {
      isBoss,
      artW,
      artH,
      scale,
      drawW: artW * scale,
      drawH: artH * scale
    };
  }

  function getBounds(spriteKey, x, y, w, h, big) {
    const m = getVisualMetrics(spriteKey, w, h, big);
    return {
      x: Math.round(x + w / 2 - m.drawW / 2),
      y: Math.round(y + h - m.drawH),
      w: Math.round(m.drawW),
      h: Math.round(m.drawH)
    };
  }

  const DRAWERS = {
    goblin: drawGoblin,
    skelett: drawSkelett,
    schleim: drawSchleim,
    bandit: drawBandit,
    wolf: drawWolf,
    spinne: drawSpinne,
    boss_ork: drawBossOrk,
    boss_schatten: drawBossSchatten,
    boss_feuer: drawBossFeuer,
    boss_drache: drawBossDrache,
    boss_nekro: drawBossNekro
  };

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  const VisualEnemies = {
    ART_W,
    ART_H,
    BOSS_W,
    BOSS_H,
    px,
    out,
    drawShadow,
    getBounds,
    getVisualMetrics,
    themes: Object.keys(THEME_STYLE),
    spriteKeys: Object.keys(DRAWERS),

    draw(ctx, spriteKey, x, y, w, h, flip, world, bob, big) {
      const drawer = DRAWERS[spriteKey];
      if (!drawer || !ctx) return false;

      const theme = world?.theme || "forest";
      const paletteKey = spriteKey.startsWith("boss_") ? spriteKey.replace("boss_", "boss_") : spriteKey;
      const basePal = BASE_PALETTES[paletteKey] || BASE_PALETTES[spriteKey];
      if (!basePal) return false;

      const isBoss = !!big || spriteKey.startsWith("boss_");
      const pal = shiftPalette(basePal, theme);
      const bx = Math.round(x);
      const by = Math.round(y);
      const bw = Math.round(w);
      const bh = Math.round(h);
      const bVal = bob || 0;
      const footBase = Math.round(y + h);
      const cx = Math.round(x + w / 2);
      const visualBounds = getBounds(spriteKey, bx, by, bw, bh, isBoss);

      ctx.save();
      ctx.imageSmoothingEnabled = false;

      drawShadow(ctx, cx, footBase, visualBounds.w, world, bVal, isBoss);

      if (isBoss && BOSS_GLOW[spriteKey]) {
        applyBossGlow(ctx, visualBounds.x, visualBounds.y, visualBounds.w, visualBounds.h, BOSS_GLOW[spriteKey]);
      }

      const metrics = getVisualMetrics(spriteKey, bw, bh, isBoss);
      const artW = metrics.artW;
      const artH = metrics.artH;
      const scale = metrics.scale;
      const drawW = metrics.drawW;
      const offsetX = (bw - drawW) / 2;

      ctx.translate(bx + (flip ? bw - offsetX : offsetX), footBase);
      ctx.scale(flip ? -scale : scale, scale);
      ctx.translate(-artW / 2, -ENEMY_FOOT_Y);

      drawer(ctx, pal, bVal, isBoss);
      drawThemeAccents(ctx, theme, bVal, isBoss);

      ctx.restore();

      applyThemeTint(ctx, visualBounds.x, visualBounds.y, visualBounds.w, visualBounds.h, world);
      drawFeetFog(ctx, visualBounds.x, visualBounds.y, visualBounds.w, visualBounds.h, world);

      return true;
    }
  };

  if (typeof window !== "undefined") {
    window.VisualEnemies = VisualEnemies;
  }
  if (typeof globalThis !== "undefined") {
    globalThis.VisualEnemies = VisualEnemies;
  }
})();
