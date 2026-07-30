/* Dungeon Loop – Asset Pack Loader
   Lädt ausschließlich assets/pack/ – keine Preview/Szenen mit eingebackenen Figuren. */
(function (global) {
  const PackAssets = {
    ready: false,
    heroesReady: false,
    loading: null,
    manifest: null,
    images: Object.create(null),
    base: "assets/pack/",
    version: "126",

    loadImage(path) {
      return new Promise((resolve) => {
        if (!path) { resolve(null); return; }
        if (this.images[path]) { resolve(this.images[path]); return; }
        const img = new Image();
        img.decoding = "async";
        img.onload = () => { this.images[path] = img; resolve(img); };
        img.onerror = () => { console.warn("Asset fehlt:", path); resolve(null); };
        const bust = path.includes("?") ? "" : ("?v=" + this.version);
        img.src = path + bust;
      });
    },

    collectPaths(node, out) {
      if (!node) return;
      if (typeof node === "string") { out.add(node); return; }
      if (typeof node === "object") {
        if (typeof node.path === "string") out.add(node.path);
        Object.keys(node).forEach((k) => {
          if (k === "w" || k === "h" || k === "previewW" || k === "previewH" || k === "name") return;
          this.collectPaths(node[k], out);
        });
      }
    },

    async fetchManifest() {
      if (this.manifest) return this.manifest;
      try {
        const res = await fetch(this.base + "manifest.json?v=" + this.version);
        this.manifest = await res.json();
      } catch (err) {
        console.error("manifest.json fehlt", err);
        this.manifest = { heroes: {}, enemies: {}, bosses: {}, worlds: {}, fx: {}, ui: {}, props: {} };
      }
      return this.manifest;
    },

    async loadHeroes() {
      await this.fetchManifest();
      const paths = new Set();
      this.collectPaths(this.manifest.heroes, paths);
      await Promise.all([...paths].map((p) => this.loadImage(p)));
      this.heroesReady = true;
      return this.manifest;
    },

    async loadRest() {
      await this.fetchManifest();
      const paths = new Set();
      ["enemies", "bosses", "fx", "fxSprites", "ui", "props"].forEach((k) => this.collectPaths(this.manifest[k], paths));
      // Welten: bg + terrain (integrierter Boden/Weg, keine Figuren)
      const worlds = this.manifest.worlds || {};
      Object.keys(worlds).forEach((theme) => {
        const w = worlds[theme] || {};
        ["bg", "terrain", "path"].forEach((key) => {
          if (typeof w[key] === "string") paths.add(w[key]);
        });
      });
      await Promise.all([...paths].map((p) => this.loadImage(p)));
      this.ready = true;
      if (typeof invalidateParallaxCache === "function") invalidateParallaxCache();
      return this.manifest;
    },

    async load() {
      if (this.ready) return this.manifest;
      if (this.loading) return this.loading;
      this.loading = (async () => {
        await this.loadHeroes();
        await this.loadRest();
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
    },

    propMeta(theme, index) {
      const list = this.manifest?.props?.[theme];
      if (!list || !list[index]) return null;
      return list[index];
    },

    prop(theme, index) {
      const meta = this.propMeta(theme, index);
      return meta ? this.img(meta.path) : null;
    },

    listPropCount(theme) {
      return (this.manifest?.props?.[theme] || []).length;
    },

    fxSprite(key) {
      const s = this.manifest?.fxSprites?.[key];
      if (!s) return null;
      return this.img(typeof s === "string" ? s : s.path);
    },

    fxMeta(key) {
      return this.manifest?.fxSprites?.[key] || null;
    }
  };

  global.PackAssets = PackAssets;
})(typeof window !== "undefined" ? window : globalThis);
