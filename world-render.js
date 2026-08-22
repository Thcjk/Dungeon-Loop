/* Dungeon Loop – 2-Ebenen-Sidescroller (Hintergrund + Weg)
   Keine Tilemaps, keine Prop-Ebenen, keine Preview-Patches. */

const WR = {
  CW: 640,
  CH: 360,
  GROUND: 288,
  transition: null,
  cache: { theme: null },
  particles: [],
  animTime: 0
};

const WORLD_VISUALS = {};
Object.keys(WORLD_CONFIG).forEach((k) => {
  WORLD_VISUALS[k] = { id: k, theme: k, name: WORLD_CONFIG[k].name };
});
WORLD_VISUALS.frozen = WORLD_VISUALS.frost;
WORLD_VISUALS.firelands = WORLD_VISUALS.fire;

const WR_PALETTES = {};
Object.keys(WORLD_CONFIG).forEach((k) => {
  WR_PALETTES[k] = { fog: WORLD_CONFIG[k].palette.fog };
});

function wrTheme(world) {
  return resolveWorldTheme(world);
}

function getWorldVisualConfig(worldId) {
  const cfg = getWorldConfig(worldId);
  return WORLD_VISUALS[cfg.theme] || WORLD_VISUALS.forest;
}

function invalidateParallaxCache() {
  WR.cache.theme = null;
}

function spawnParticles(theme) {
  const cfg = WORLD_CONFIG[theme] || WORLD_CONFIG.forest;
  const kinds = cfg.particles || ["mist"];
  WR.particles = [];
  for (let i = 0; i < 24; i++) {
    WR.particles.push({
      kind: kinds[i % kinds.length],
      x: Math.random() * WR.CW,
      y: 40 + Math.random() * (WR.GROUND - 80),
      v: 0.4 + Math.random() * 1.2,
      a: 0.06 + Math.random() * 0.14
    });
  }
}

function initParallaxBackground(world) {
  const t = wrTheme(world);
  if (WR.cache.theme === t) return;
  WR.cache.theme = t;
  spawnParticles(t);
  WR.animTime = 0;
}

function updateWorldAmbient(dt) {
  WR.animTime += dt;
  WR.particles.forEach((p) => {
    p.x += p.v * dt * 18;
    if (p.kind === "snow" || p.kind === "leaf" || p.kind === "ash") p.y += dt * 12;
    if (p.x > WR.CW + 8) p.x = -8;
  });
}

function updateWorldTransition(dt) {
  if (!WR.transition) return;
  WR.transition.t += dt;
  if (WR.transition.t >= WR.transition.dur) WR.transition = null;
}

function startWorldTransition(world) {
  WR.transition = { t: 0, dur: 0.85, theme: wrTheme(world) };
  initParallaxBackground(world);
}

function packImg(theme, key) {
  if (typeof PackAssets === "undefined") return null;
  return PackAssets.worldImg(theme, key);
}

function drawTiled(ctx, img, scroll, y, speed) {
  if (!img?.width) return;
  const dw = img.width;
  const dh = img.height;
  let x = -Math.floor((scroll * speed) % dw);
  if (x > 0) x -= dw;
  ctx.imageSmoothingEnabled = false;
  while (x < WR.CW + dw) {
    ctx.drawImage(img, Math.round(x), Math.round(y), dw, dh);
    x += dw;
  }
}

function drawBackdrop(ctx, theme, scroll) {
  const cfg = getWorldConfig(theme);
  const scene = packImg(theme, "scene");
  if (scene) {
    drawTiled(ctx, scene, scroll, 0, cfg.scroll.scene);
    return;
  }
  const pal = cfg.palette;
  const g = ctx.createLinearGradient(0, 0, 0, cfg.sceneH);
  g.addColorStop(0, pal.sky);
  g.addColorStop(1, "#000");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, WR.CW, cfg.sceneH);
}

function drawRoad(ctx, theme, scroll) {
  const cfg = getWorldConfig(theme);
  const lane = packImg(theme, "lane");
  if (lane) {
    drawTiled(ctx, lane, scroll, cfg.sceneH, cfg.scroll.lane);
    return;
  }
  ctx.fillStyle = "#1a1208";
  ctx.fillRect(0, cfg.sceneH, WR.CW, cfg.laneH);
}

function drawParticles(ctx, theme) {
  const cfg = getWorldConfig(theme);
  WR.particles.forEach((p) => {
    if (p.y >= WR.GROUND) return;
    ctx.globalAlpha = p.a;
    ctx.fillStyle = cfg.palette.accent;
    ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 1);
  });
  ctx.globalAlpha = 1;
}

function renderParallaxBackground(ctx, world, scrollX) {
  const theme = wrTheme(world);
  initParallaxBackground(world);
  const scroll = scrollX || 0;
  drawBackdrop(ctx, theme, scroll);
  drawRoad(ctx, theme, scroll);
}

function renderWorldForeground(ctx, world) {
  if (!ctx) return;
  drawParticles(ctx, wrTheme(world));
}

function renderWorld(ctx, worldId, camera) {
  renderParallaxBackground(ctx, worldId, camera?.x || 0);
}

function renderWorldTransition(ctx) {
  if (!WR.transition) return;
  const t = WR.transition.t / WR.transition.dur;
  const a = t < 0.4 ? t / 0.4 : (t > 0.7 ? (1 - t) / 0.3 : 1);
  ctx.fillStyle = "rgba(0,0,0," + (a * 0.75) + ")";
  ctx.fillRect(0, 0, WR.CW, WR.CH);
}

if (typeof window !== "undefined") {
  window.WR = WR;
  window.WORLD_VISUALS = WORLD_VISUALS;
  window.WR_PALETTES = WR_PALETTES;
  window.renderWorld = renderWorld;
  window.renderParallaxBackground = renderParallaxBackground;
  window.renderWorldForeground = renderWorldForeground;
  window.initParallaxBackground = initParallaxBackground;
  window.updateWorldAmbient = updateWorldAmbient;
  window.updateWorldTransition = updateWorldTransition;
  window.invalidateParallaxCache = invalidateParallaxCache;
  window.startWorldTransition = startWorldTransition;
  window.renderWorldTransition = renderWorldTransition;
  window.getWorldVisualConfig = getWorldVisualConfig;
}
