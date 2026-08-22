/* Dungeon Loop – Enemy Renderer (Asset-Pack Bitmaps) */

const VisualEnemies = {
  themeFromKey(spriteKey) {
    const k = String(spriteKey || "");
    if (k.startsWith("forest_") || k.includes("forest")) return "forest";
    if (k.startsWith("swamp_") || k.includes("swamp")) return "swamp";
    if (k.startsWith("snow_") || k.includes("frost") || k.includes("ice") || k.includes("yeti")) return "frost";
    if (k.startsWith("volcano_") || k.includes("fire") || k.includes("lava") || k.includes("hell")) return "fire";
    if (k.startsWith("ruins_") || k.includes("ruins") || k.includes("mummy") || k.includes("skeleton")) return "ruins";
    if (k.startsWith("boss_")) return k.replace("boss_", "");
    return null;
  },

  resolveImage(spriteKey, isBoss) {
    if (typeof PackAssets === "undefined" || !PackAssets.ready) return null;
    const key = String(spriteKey || "");
    if (isBoss || key.startsWith("boss_")) {
      const theme = key.startsWith("boss_") ? key.slice(5) : (this.themeFromKey(key) || "forest");
      return PackAssets.boss(theme) || PackAssets.enemy(theme, PackAssets.listEnemySlugs(theme)[0]);
    }
    // Direct slug lookup across themes
    const themes = ["forest", "swamp", "frost", "fire", "ruins"];
    for (const t of themes) {
      const img = PackAssets.enemy(t, key);
      if (img) return img;
    }
    // Fallback: first enemy of inferred theme
    const theme = this.themeFromKey(key) || "forest";
    const slugs = PackAssets.listEnemySlugs(theme);
    return slugs.length ? PackAssets.enemy(theme, slugs[0]) : null;
  },

  getSize(spriteKey, isBoss, fallbackW, fallbackH) {
    const img = this.resolveImage(spriteKey, isBoss);
    if (img) return { w: img.width, h: img.height };
    return { w: fallbackW || (isBoss ? 80 : 52), h: fallbackH || (isBoss ? 120 : 78) };
  },

  _tintBuf: null,
  _tintCtx: null,

  tintBuffer(w, h) {
    if (!this._tintBuf) {
      this._tintBuf = document.createElement("canvas");
      this._tintCtx = this._tintBuf.getContext("2d");
    }
    if (this._tintBuf.width !== w || this._tintBuf.height !== h) {
      this._tintBuf.width = w;
      this._tintBuf.height = h;
    }
    return this._tintCtx;
  },

  drawTinted(c, img, dx, y, flash) {
    const w = img.width;
    const h = img.height;
    const a = Math.max(0.12, Math.min(0.48, 0.18 + flash * 0.04));
    const tc = this.tintBuffer(w, h);
    tc.imageSmoothingEnabled = false;
    tc.clearRect(0, 0, w, h);
    tc.globalCompositeOperation = "source-over";
    tc.drawImage(img, 0, 0);
    tc.globalCompositeOperation = "source-atop";
    tc.fillStyle = "rgba(255, 236, 220, " + a + ")";
    tc.fillRect(0, 0, w, h);
    // Rot ebenfalls nur auf Figur-Pixel ("lighter" würde den transparenten
    // Bereich aufhellen und ein sichtbares Rechteck um das Sprite erzeugen)
    tc.fillStyle = "rgba(255, 70, 50, " + (a * 0.3) + ")";
    tc.fillRect(0, 0, w, h);
    tc.globalCompositeOperation = "source-over";
    c.drawImage(this._tintBuf, dx, y);
  },

  drawAtFeet(c, spriteKey, footX, footY, flip, world, bob, big, boxW, boxH, hitFlash, gaitLean) {
    const img = this.resolveImage(spriteKey, big);
    if (!img) return false;
    const w = img.width;
    const h = img.height;
    const bobY = bob || 0;
    c.save();
    c.imageSmoothingEnabled = false;
    c.fillStyle = "rgba(0,0,0,0.45)";
    c.beginPath();
    c.ellipse(footX, footY + 1, Math.max(10, w * 0.28), 4, 0, 0, Math.PI * 2);
    c.fill();
    const flash = Math.max(0, hitFlash || 0);
    // Wie beim Held: um die feste Fußlinie drehen, nie vertikal schweben.
    c.translate(Math.round(footX), Math.round(footY));
    c.rotate(gaitLean || 0);
    c.scale(flip ? -1 : 1, 1);
    const dx = -Math.round(w / 2);
    const y = -h + Math.round(bobY);
    if (flash > 0) {
      this.drawTinted(c, img, dx, y, flash);
    } else {
      c.drawImage(img, dx, y);
    }
    c.restore();
    return true;
  },

  draw(c, spriteKey, x, y, w, h, flip, world, bob, big) {
    return this.drawAtFeet(c, spriteKey, x + w / 2, y + h, flip, world, bob, big, w, h);
  },

  getBoundsAtFeet(spriteKey, footX, footY, isBoss, _alive, fallbackW, fallbackH) {
    const sz = this.getSize(spriteKey, isBoss, fallbackW, fallbackH);
    return {
      x: footX - sz.w / 2,
      y: footY - sz.h,
      w: sz.w,
      h: sz.h,
      cx: footX,
      footY
    };
  }
};

if (typeof window !== "undefined") window.VisualEnemies = VisualEnemies;
