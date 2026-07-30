/* Dungeon Loop – Asset Pack Loader
   Lädt vorverarbeitete Sprites aus assets/pack/ (einziges visuelles Pack). */
(function (global) {
  const PackAssets = {
    ready: false,
    loading: null,
    manifest: null,
    images: Object.create(null),
    base: "assets/pack/",

    loadImage(path) {
      return new Promise((resolve) => {
        if (!path) { resolve(null); return; }
        if (this.images[path]) { resolve(this.images[path]); return; }
        const img = new Image();
        img.decoding = "async";
        img.onload = () => { this.images[path] = img; resolve(img); };
        img.onerror = () => { console.warn("Asset fehlt:", path); resolve(null); };
        img.src = path + (path.includes("?") ? "" : "?v=111");
      });
    },

    async load() {
      if (this.ready) return this.manifest;
      if (this.loading) return this.loading;
      this.loading = (async () => {
        try {
          const res = await fetch(this.base + "manifest.json?v=111");
          this.manifest = await res.json();
        } catch (err) {
          console.error("manifest.json fehlt", err);
          this.manifest = { heroes: {}, enemies: {}, bosses: {}, worlds: {}, fx: {}, ui: {} };
        }
        const paths = new Set();
        const walk = (node) => {
          if (!node) return;
          if (typeof node === "string") { paths.add(node); return; }
          if (typeof node === "object") {
            if (node.path) paths.add(node.path);
            Object.values(node).forEach(walk);
          }
        };
        walk(this.manifest);
        await Promise.all([...paths].map((p) => this.loadImage(p)));
        this.ready = true;
        return this.manifest;
      })();
      return this.loading;
    },

    img(path) {
      return path ? this.images[path] || null : null;
    },

    hero(classKey, anim) {
      const h = this.manifest?.heroes?.[classKey];
      if (!h) return null;
      const path = h[anim] || h.idle;
      return this.img(path);
    },

    heroCard(classKey) {
      const h = this.manifest?.heroes?.[classKey];
      if (!h) return null;
      return this.img(h.idle_card || h.idle);
    },

    enemy(theme, slug) {
      const e = this.manifest?.enemies?.[theme]?.[slug];
      return e ? this.img(e.path) : null;
    },

    enemyMeta(theme, slug) {
      return this.manifest?.enemies?.[theme]?.[slug] || null;
    },

    boss(theme) {
      const b = this.manifest?.bosses?.[theme];
      return b ? this.img(b.path) : null;
    },

    bossMeta(theme) {
      return this.manifest?.bosses?.[theme] || null;
    },

    world(theme) {
      return this.manifest?.worlds?.[theme] || null;
    },

    worldImg(theme, key) {
      const w = this.world(theme);
      return w ? this.img(w[key]) : null;
    },

    listEnemySlugs(theme) {
      const map = this.manifest?.enemies?.[theme] || {};
      return Object.keys(map);
    }
  };

  global.PackAssets = PackAssets;
})(typeof window !== "undefined" ? window : globalThis);
