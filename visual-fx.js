/* ============================================
   Dungeon Loop – Premium Visual FX Layer
   Art Remake v2 – Atmosphere, Weather, Lighting
   Canvas 640×360 · GROUND 288 · Self-contained
   ============================================ */

const VisualFX = (function () {
  "use strict";

  // Art Remake v2 – canvas constants (mirror game + WR)
  const CW = 640;
  const CH = 360;
  const GROUND = 288;

  // Art Remake v2 – internal state
  let theme = "forest";
  let animTime = 0;
  let nightPhase = 0.35; // 0 = day, 1 = deep night (forest cycle)
  let particles = [];
  let fogLayers = [];
  let sunRays = [];
  let auroraBands = [];
  let heatCells = [];
  let stormSwirls = [];
  let torchFlicker = 0;

  // Art Remake v2 – per-world ambient palettes
  const AMBIENT = {
    forest: { warm: [18, 42, 28], cold: [8, 22, 38], fog: "rgba(52,120,88,0.22)", tint: "rgba(120,200,140,0.06)" },
    swamp:  { warm: [28, 38, 18], cold: [12, 28, 22], fog: "rgba(60,80,40,0.32)", tint: "rgba(90,140,70,0.08)" },
    frost:  { warm: [140, 170, 210], cold: [40, 70, 120], fog: "rgba(180,210,240,0.18)", tint: "rgba(200,230,255,0.07)" },
    fire:   { warm: [255, 120, 40], cold: [80, 20, 10], fog: "rgba(120,40,15,0.28)", tint: "rgba(255,140,60,0.09)" },
    ruins:  { warm: [100, 70, 140], cold: [30, 20, 50], fog: "rgba(50,35,70,0.30)", tint: "rgba(180,140,255,0.07)" }
  };

  // Art Remake v2 – weather spawn configs per world
  const WEATHER_CFG = {
    forest: { rain: 90, leaves: 28, rays: 6 },
    swamp:  { mist: 55, fogWisp: 18, firefly: 40 },
    frost:  { snow: 110, aurora: 5 },
    fire:   { ash: 70, shimmer: 14 },
    ruins:  { dust: 65, storm: 35 }
  };

  function getTime() {
    return (typeof WR !== "undefined" && WR.animTime) ? WR.animTime : animTime;
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function pick(arr) {
    return arr[(Math.random() * arr.length) | 0];
  }

  function rgba(r, g, b, a) {
    return "rgba(" + (r | 0) + "," + (g | 0) + "," + (b | 0) + "," + a + ")";
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function wrapX(x) {
    if (x < -20) return CW + 20;
    if (x > CW + 20) return -20;
    return x;
  }

  // Art Remake v2 – volumetric fog layer builder
  function buildFogLayers(t) {
    fogLayers = [];
    const count = t === "swamp" ? 8 : t === "fire" ? 5 : 6;
    for (let i = 0; i < count; i++) {
      fogLayers.push({
        x: rand(0, CW),
        y: GROUND - 20 - i * (t === "swamp" ? 8 : 12),
        w: 80 + i * 22 + rand(0, 40),
        h: 10 + i * 2.5,
        speed: 8 + i * 3 + rand(0, 6),
        alpha: 0.04 + i * 0.018,
        phase: rand(0, Math.PI * 2),
        depth: i / count
      });
    }
  }

  // Art Remake v2 – sun ray columns (forest)
  function buildSunRays() {
    sunRays = [];
    for (let i = 0; i < WEATHER_CFG.forest.rays; i++) {
      sunRays.push({
        x: rand(40, CW - 40),
        width: rand(18, 42),
        angle: rand(-0.08, 0.08),
        alpha: rand(0.04, 0.12),
        phase: rand(0, Math.PI * 2)
      });
    }
  }

  // Art Remake v2 – aurora ribbon bands (frost)
  function buildAurora() {
    auroraBands = [];
    for (let i = 0; i < WEATHER_CFG.frost.aurora; i++) {
      auroraBands.push({
        y: 30 + i * 28,
        amp: rand(18, 36),
        freq: rand(0.004, 0.009),
        speed: rand(0.3, 0.7),
        hue: pick(["#6ef0c8", "#88ccff", "#c8a0ff", "#80ffb0"]),
        phase: rand(0, Math.PI * 2),
        thick: rand(8, 16)
      });
    }
  }

  // Art Remake v2 – heat shimmer cells (fire)
  function buildHeatCells() {
    heatCells = [];
    for (let i = 0; i < WEATHER_CFG.fire.shimmer; i++) {
      heatCells.push({
        x: rand(0, CW),
        y: GROUND - rand(20, 80),
        w: rand(40, 90),
        h: rand(8, 18),
        phase: rand(0, Math.PI * 2),
        speed: rand(0.8, 1.6)
      });
    }
  }

  // Art Remake v2 – storm swirl particles (ruins)
  function buildStormSwirls() {
    stormSwirls = [];
    for (let i = 0; i < 12; i++) {
      stormSwirls.push({
        cx: rand(CW * 0.2, CW * 0.8),
        cy: rand(60, GROUND - 40),
        radius: rand(20, 55),
        angle: rand(0, Math.PI * 2),
        speed: rand(0.6, 1.4),
        size: rand(1, 2.5)
      });
    }
  }

  // Art Remake v2 – spawn themed weather particles
  function spawnParticle(t, kind) {
    const base = { kind, theme: t, phase: rand(0, Math.PI * 2), speed: rand(0.4, 1.2) };

    if (kind === "rain") {
      return Object.assign(base, {
        x: rand(-10, CW + 10), y: rand(-20, GROUND - 40),
        len: rand(6, 14), vy: rand(180, 320), vx: rand(-30, -10), alpha: rand(0.15, 0.45)
      });
    }
    if (kind === "leaf") {
      return Object.assign(base, {
        x: rand(0, CW), y: rand(-10, GROUND * 0.6),
        size: rand(2, 4), vy: rand(18, 45), vx: rand(-15, 15),
        rot: rand(0, Math.PI * 2), rotSpd: rand(-2, 2), col: pick(["#40916c", "#52b788", "#2d6a4f", "#74c69d"])
      });
    }
    if (kind === "mist" || kind === "fogWisp") {
      return Object.assign(base, {
        x: rand(-40, CW), y: rand(GROUND - 90, GROUND - 10),
        w: rand(30, 70), h: rand(6, 14), vx: rand(6, 18), alpha: rand(0.06, 0.16)
      });
    }
    if (kind === "firefly") {
      return Object.assign(base, {
        x: rand(0, CW), y: rand(GROUND - 120, GROUND - 20),
        vx: rand(-12, 12), vy: rand(-8, 8), glow: rand(2, 5),
        col: pick(["#95e1a3", "#7cba6a", "#f1c40f", "#52b788"])
      });
    }
    if (kind === "snow") {
      return Object.assign(base, {
        x: rand(0, CW), y: rand(-10, GROUND * 0.5),
        size: rand(1, 3), vy: rand(25, 70), vx: rand(-20, 20), drift: rand(0.5, 2)
      });
    }
    if (kind === "ash") {
      return Object.assign(base, {
        x: rand(0, CW), y: rand(GROUND - 60, GROUND - 5),
        size: rand(1, 3), vy: rand(-40, -12), vx: rand(-18, 18), alpha: rand(0.2, 0.55)
      });
    }
    if (kind === "dust") {
      return Object.assign(base, {
        x: rand(0, CW), y: rand(40, GROUND - 30),
        size: rand(1, 2.5), vx: rand(-8, 8), vy: rand(-6, 6),
        col: pick(["#bb86fc", "#d4a8ff", "#f1c40f", "#e8daef"]), twinkle: rand(0, Math.PI * 2)
      });
    }
    if (kind === "storm") {
      return Object.assign(base, {
        x: rand(0, CW), y: rand(20, GROUND - 20),
        vx: rand(-60, 60), vy: rand(-20, 20), size: rand(1, 2), life: rand(0.5, 2)
      });
    }
    return base;
  }

  function buildParticles(t) {
    particles = [];
    const cfg = WEATHER_CFG[t] || WEATHER_CFG.forest;
    const kinds = {
      forest: ["rain", "rain", "rain", "leaf"],
      swamp:  ["mist", "fogWisp", "firefly"],
      frost:  ["snow"],
      fire:   ["ash"],
      ruins:  ["dust", "storm"]
    };
    const pool = kinds[t] || kinds.forest;
    const total = cfg.rain || cfg.snow || cfg.ash || cfg.dust || cfg.mist || 60;

    for (let i = 0; i < total; i++) {
      particles.push(spawnParticle(t, pick(pool)));
    }
    // Art Remake v2 – extra fireflies / leaves from dedicated counts
    if (t === "swamp") {
      for (let i = 0; i < cfg.firefly; i++) particles.push(spawnParticle(t, "firefly"));
    }
    if (t === "forest") {
      for (let i = 0; i < cfg.leaves; i++) particles.push(spawnParticle(t, "leaf"));
    }
    if (t === "ruins") {
      for (let i = 0; i < cfg.storm; i++) particles.push(spawnParticle(t, "storm"));
    }
  }

  // Art Remake v2 – init: rebuild all layers for new world
  function init(world) {
    theme = world?.theme || "forest";
    animTime = 0;
    nightPhase = theme === "forest" ? 0.35 : theme === "ruins" ? 0.55 : 0.2;
    torchFlicker = rand(0, Math.PI * 2);
    buildFogLayers(theme);
    buildParticles(theme);
    if (theme === "forest") buildSunRays();
    if (theme === "frost") buildAurora();
    if (theme === "fire") buildHeatCells();
    if (theme === "ruins") buildStormSwirls();
  }

  // Art Remake v2 – particle simulation step
  function updateParticle(p, dt, t) {
    p.phase += dt * p.speed;
    const k = p.kind;

    if (k === "rain") {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.y > GROUND - 5) {
        p.y = rand(-20, -5);
        p.x = rand(-10, CW + 10);
      }
    } else if (k === "leaf") {
      p.x += (p.vx + Math.sin(p.phase) * 12) * dt;
      p.y += p.vy * dt;
      p.rot += p.rotSpd * dt;
      if (p.y > GROUND - 8) { p.y = rand(-10, 20); p.x = rand(0, CW); }
    } else if (k === "mist" || k === "fogWisp") {
      p.x += p.vx * dt;
      p.y += Math.sin(p.phase) * dt * 4;
      if (p.x > CW + 50) { p.x = -50; p.y = rand(GROUND - 90, GROUND - 10); }
    } else if (k === "firefly") {
      p.x += (p.vx + Math.sin(p.phase * 1.3) * 8) * dt;
      p.y += (p.vy + Math.cos(p.phase * 0.9) * 6) * dt;
      p.x = wrapX(p.x);
      if (p.y < 20 || p.y > GROUND - 10) p.vy *= -1;
    } else if (k === "snow") {
      p.x += (p.vx + Math.sin(p.phase * p.drift) * 14) * dt;
      p.y += p.vy * dt;
      if (p.y > GROUND) { p.y = rand(-10, 10); p.x = rand(0, CW); }
    } else if (k === "ash") {
      p.x += (p.vx + Math.sin(p.phase) * 10) * dt;
      p.y += p.vy * dt;
      if (p.y < 5) { p.y = rand(GROUND - 60, GROUND - 10); p.x = rand(0, CW); }
    } else if (k === "dust") {
      p.x += p.vx * dt + Math.sin(p.phase) * dt * 5;
      p.y += p.vy * dt + Math.cos(p.phase * 0.7) * dt * 3;
      p.x = wrapX(p.x);
      p.twinkle += dt * 3;
    } else if (k === "storm") {
      p.x += p.vx * dt;
      p.y += p.vy * dt + Math.sin(p.phase) * dt * 20;
      p.life -= dt;
      if (p.life <= 0) {
        Object.assign(p, spawnParticle(t, "storm"));
      }
    }
  }

  // Art Remake v2 – called from game loop each frame
  function update(dt, world) {
    const t = world?.theme || theme;
    if (t !== theme) init(world);

    animTime += dt;
    torchFlicker += dt * (5 + Math.sin(animTime * 2.1) * 2);

    // Art Remake v2 – forest day/night cycle (~90 s loop)
    if (t === "forest") {
      nightPhase = (Math.sin(animTime * 0.035) + 1) * 0.5;
    } else if (t === "ruins") {
      nightPhase = 0.45 + Math.sin(animTime * 0.05) * 0.15;
    } else {
      nightPhase = lerp(nightPhase, 0.15, dt * 0.5);
    }

    particles.forEach((p) => updateParticle(p, dt, t));

    // Art Remake v2 – drift volumetric fog layers
    fogLayers.forEach((f) => {
      f.phase += dt * (0.3 + f.depth);
      f.x += f.speed * dt;
      if (f.x > CW + f.w) f.x = -f.w;
    });

    if (t === "fire") {
      heatCells.forEach((c) => { c.phase += dt * c.speed; });
    }
    if (t === "ruins") {
      stormSwirls.forEach((s) => {
        s.angle += dt * s.speed;
        s.cx += Math.sin(s.angle) * dt * 8;
      });
    }
  }

  // Art Remake v2 – full-screen ambient colour grade + volumetric fog
  function renderAtmosphere(ctx, world) {
    const t = world?.theme || theme;
    const pal = AMBIENT[t] || AMBIENT.forest;
    const time = getTime();

    // Art Remake v2 – warm/cold ambient blend
    const warmth = t === "fire" ? 0.75 : t === "frost" ? 0.15 : t === "forest" ? lerp(0.4, 0.1, nightPhase) : 0.35;
    const r = lerp(pal.cold[0], pal.warm[0], warmth);
    const g = lerp(pal.cold[1], pal.warm[1], warmth);
    const b = lerp(pal.cold[2], pal.warm[2], warmth);

    ctx.save();
    ctx.globalCompositeOperation = "source-over";

    // Art Remake v2 – subtle top-to-bottom ambient wash
    const ambGrad = ctx.createLinearGradient(0, 0, 0, GROUND);
    ambGrad.addColorStop(0, rgba(r, g, b, 0.07 + warmth * 0.04));
    ambGrad.addColorStop(0.55, rgba(r * 0.6, g * 0.6, b * 0.6, 0.03));
    ambGrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = ambGrad;
    ctx.fillRect(0, 0, CW, GROUND);

    // Art Remake v2 – volumetric fog layers (depth-sorted ellipses)
    fogLayers.forEach((f) => {
      const bob = Math.sin(f.phase + time * 0.25) * 4;
      ctx.globalAlpha = f.alpha * (t === "swamp" ? 1.4 : 1);
      ctx.fillStyle = pal.fog;
      ctx.beginPath();
      ctx.ellipse(f.x, f.y + bob, f.w, f.h, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // Kein Boden-Nebel / Tint mehr: der erzeugte dunkle Streifen zwischen
    // Hintergrund und Mauer. Atmosphaere bleibt nur ueber leichte Partikel.

    ctx.restore();
  }

  // Art Remake v2 – dynamic lighting: torches, lava, moonlight
  function renderLighting(ctx, world, hero) {
    const t = world?.theme || theme;
    const time = getTime();
    ctx.save();
    ctx.globalCompositeOperation = "screen";

    // Art Remake v2 – forest moonlight during night cycle
    if (t === "forest" && nightPhase > 0.35) {
      const moonStrength = (nightPhase - 0.35) / 0.65;
      const moonX = CW * 0.78 + Math.sin(time * 0.08) * 12;
      const moonY = 48 + Math.cos(time * 0.06) * 6;
      const moonGrad = ctx.createRadialGradient(moonX, moonY, 4, moonX, moonY, 180);
      moonGrad.addColorStop(0, rgba(200, 220, 255, 0.22 * moonStrength));
      moonGrad.addColorStop(0.35, rgba(140, 170, 220, 0.08 * moonStrength));
      moonGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = moonGrad;
      ctx.fillRect(0, 0, CW, GROUND);

      // Art Remake v2 – cool moonbeam cone
      ctx.globalAlpha = 0.06 * moonStrength;
      ctx.fillStyle = "rgba(180,210,255,0.5)";
      ctx.beginPath();
      ctx.moveTo(moonX - 30, moonY + 10);
      ctx.lineTo(moonX + 30, moonY + 10);
      ctx.lineTo(CW * 0.55, GROUND);
      ctx.lineTo(CW * 0.35, GROUND);
      ctx.closePath();
      ctx.fill();
    }

    // Art Remake v2 – torch glow near ground (all worlds, stronger in ruins/fire)
    const torchCount = t === "ruins" ? 5 : t === "fire" ? 4 : 3;
    for (let i = 0; i < torchCount; i++) {
      const tx = (CW / (torchCount + 1)) * (i + 1) + Math.sin(time * 0.5 + i * 1.7) * 8;
      const ty = GROUND - 12;
      const flick = 0.7 + Math.sin(torchFlicker + i * 2.1) * 0.3;
      const rad = (t === "fire" ? 55 : 42) * flick;
      const col = t === "frost" ? [255, 200, 120] : t === "swamp" ? [180, 220, 100] : [255, 160, 60];
      const tg = ctx.createRadialGradient(tx, ty, 2, tx, ty, rad);
      tg.addColorStop(0, rgba(col[0], col[1], col[2], 0.35 * flick));
      tg.addColorStop(0.5, rgba(col[0] * 0.7, col[1] * 0.6, col[2] * 0.3, 0.1 * flick));
      tg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = tg;
      ctx.fillRect(tx - rad, ty - rad, rad * 2, rad * 2);
    }

    // Art Remake v2 – lava / ember ground glow (fire world)
    if (t === "fire") {
      for (let i = 0; i < 4; i++) {
        const lx = (time * 20 + i * 160) % (CW + 100) - 50;
        const ly = GROUND - 8 - Math.sin(time + i) * 4;
        const lg = ctx.createRadialGradient(lx, ly, 2, lx, ly, 70);
        lg.addColorStop(0, "rgba(255,80,20,0.45)");
        lg.addColorStop(0.6, "rgba(200,40,0,0.12)");
        lg.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = lg;
        ctx.fillRect(lx - 70, ly - 70, 140, 140);
      }
    }

    // Art Remake v2 – hero rim / fill light
    if (hero && hero.x != null) {
      const hx = hero.x + (hero.w || 16) / 2;
      const hy = hero.y + (hero.h || 24) / 2;
      const heroLight = ctx.createRadialGradient(hx, hy, 4, hx, hy, 55);
      const hc = t === "frost" ? [200, 230, 255] : t === "ruins" ? [200, 160, 255] : [255, 220, 180];
      heroLight.addColorStop(0, rgba(hc[0], hc[1], hc[2], 0.18));
      heroLight.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = heroLight;
      ctx.fillRect(hx - 60, hy - 60, 120, 120);
    }

    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // Art Remake v2 – draw forest sun rays
  function renderForestRays(ctx) {
    const dayAmt = 1 - nightPhase;
    if (dayAmt < 0.2) return;
    ctx.save();
    sunRays.forEach((ray) => {
      const pulse = 0.6 + Math.sin(getTime() * 0.4 + ray.phase) * 0.4;
      ctx.globalAlpha = ray.alpha * dayAmt * pulse;
      ctx.fillStyle = "rgba(255,240,180,0.6)";
      ctx.save();
      ctx.translate(ray.x, 0);
      ctx.rotate(ray.angle);
      ctx.beginPath();
      ctx.moveTo(-ray.width * 0.5, 0);
      ctx.lineTo(ray.width * 0.5, 0);
      ctx.lineTo(ray.width * 1.8, GROUND);
      ctx.lineTo(-ray.width * 1.8, GROUND);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });
    ctx.restore();
  }

  // Art Remake v2 – draw frost aurora ribbons
  function renderAurora(ctx) {
    const time = getTime();
    ctx.save();
    auroraBands.forEach((band) => {
      ctx.globalAlpha = 0.12 + Math.sin(time * 0.5 + band.phase) * 0.06;
      ctx.strokeStyle = band.hue;
      ctx.lineWidth = band.thick;
      ctx.lineCap = "round";
      ctx.beginPath();
      for (let x = 0; x <= CW; x += 8) {
        const y = band.y + Math.sin(x * band.freq + time * band.speed + band.phase) * band.amp;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    });
    ctx.restore();
  }

  // Art Remake v2 – heat shimmer via wavy translucent strips (fire)
  function renderHeatShimmer(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    heatCells.forEach((cell) => {
      const wave = Math.sin(cell.phase + getTime() * 2) * 3;
      ctx.globalAlpha = 0.06 + Math.sin(cell.phase) * 0.03;
      ctx.fillStyle = "rgba(255,120,40,0.4)";
      ctx.beginPath();
      ctx.moveTo(cell.x, cell.y);
      ctx.quadraticCurveTo(cell.x + cell.w * 0.5, cell.y - 6 + wave, cell.x + cell.w, cell.y + wave);
      ctx.quadraticCurveTo(cell.x + cell.w * 0.5, cell.y + cell.h + wave, cell.x, cell.y + cell.h);
      ctx.closePath();
      ctx.fill();
    });
    ctx.globalCompositeOperation = "source-over";
    ctx.restore();
  }

  // Art Remake v2 – ruins storm swirl overlay
  function renderStormSwirls(ctx) {
    const time = getTime();
    ctx.save();
    stormSwirls.forEach((s) => {
      ctx.globalAlpha = 0.08;
      ctx.strokeStyle = "rgba(180,140,255,0.5)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let a = 0; a < Math.PI * 2; a += 0.3) {
        const r = s.radius * (0.6 + a / (Math.PI * 2) * 0.4);
        const px = s.cx + Math.cos(a + s.angle + time * 0.3) * r;
        const py = s.cy + Math.sin(a + s.angle + time * 0.3) * r * 0.4;
        if (a === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    });
    ctx.restore();
  }

  // Art Remake v2 – render individual weather particle
  function drawParticle(ctx, p) {
    const k = p.kind;
    const fx = p.x + Math.sin(p.phase * 1.2) * 3;
    const fy = p.y + Math.cos(p.phase) * 2;

    if (k === "rain") {
      ctx.globalAlpha = p.alpha;
      ctx.strokeStyle = "rgba(180,210,255,0.7)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(fx + p.vx * 0.02, fy + p.len);
      ctx.stroke();
    } else if (k === "leaf") {
      ctx.save();
      ctx.translate(fx, fy);
      ctx.rotate(p.rot);
      ctx.globalAlpha = 0.65;
      ctx.fillStyle = p.col;
      ctx.fillRect(-p.size * 0.5, -p.size * 0.3, p.size, p.size * 0.6);
      ctx.restore();
    } else if (k === "mist" || k === "fogWisp") {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = "rgba(120,150,90,0.5)";
      ctx.beginPath();
      ctx.ellipse(fx, fy, p.w, p.h, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (k === "firefly") {
      const glow = 0.4 + Math.sin(p.phase * 2) * 0.35;
      ctx.globalAlpha = glow;
      ctx.fillStyle = p.col;
      ctx.shadowColor = p.col;
      ctx.shadowBlur = p.glow * 3;
      ctx.fillRect(fx, fy, p.glow * 0.5, p.glow * 0.5);
      ctx.shadowBlur = 0;
    } else if (k === "snow") {
      ctx.globalAlpha = 0.5 + Math.sin(p.phase) * 0.3;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(fx, fy, p.size * 0.8, p.size * 0.8);
    } else if (k === "ash") {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = "#6a4030";
      ctx.fillRect(fx, fy, p.size, p.size);
    } else if (k === "dust") {
      ctx.globalAlpha = 0.3 + Math.sin(p.twinkle) * 0.35;
      ctx.fillStyle = p.col;
      ctx.shadowColor = p.col;
      ctx.shadowBlur = 4;
      ctx.fillRect(fx, fy, p.size, p.size);
      ctx.shadowBlur = 0;
    } else if (k === "storm") {
      ctx.globalAlpha = 0.25 + Math.sin(p.phase * 3) * 0.15;
      ctx.fillStyle = "#bb86fc";
      ctx.fillRect(fx, fy, p.size, p.size * 2);
    }
  }

  // Art Remake v2 – per-world weather pass (called from render)
  function renderWeather(ctx, world) {
    const t = world?.theme || theme;
    ctx.save();

    // Art Remake v2 – theme-specific backdrop effects first
    if (t === "forest") renderForestRays(ctx);
    if (t === "frost") renderAurora(ctx);
    if (t === "fire") renderHeatShimmer(ctx);
    if (t === "ruins") renderStormSwirls(ctx);

    // Art Remake v2 – particle layer
    particles.forEach((p) => drawParticle(ctx, p));

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // Art Remake v2 – public API
  return {
    CW,
    CH,
    GROUND,
    init,
    update,
    renderAtmosphere,
    renderLighting,
    renderWeather,
    get animTime() { return getTime(); },
    get theme() { return theme; },
    get nightPhase() { return nightPhase; }
  };
})();
