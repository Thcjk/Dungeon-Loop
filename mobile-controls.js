/* ============================================
   Dungeon Loop – Touch-Steuerung (nur mobile.html)
   Nutzt die globalen Objekte/Funktionen aus script.js
   (keys, game, useEquippedAbility, togglePause, toggleUpgrades,
   toggleFullscreen, unlockAudio, getEquippedAbilityAtSlot, ...).
   ============================================ */

(function () {
  function bindHold(el, key) {
    if (!el) return;
    const press = (e) => {
      e.preventDefault();
      if (typeof unlockAudio === "function") unlockAudio();
      keys[key] = true;
      el.classList.add("is-pressed");
    };
    const release = (e) => {
      if (e) e.preventDefault();
      keys[key] = false;
      el.classList.remove("is-pressed");
    };
    el.addEventListener("pointerdown", press);
    el.addEventListener("pointerup", release);
    el.addEventListener("pointercancel", release);
    el.addEventListener("pointerleave", release);
    el.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  function bindTap(el, fn) {
    if (!el) return;
    el.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      if (typeof unlockAudio === "function") unlockAudio();
      fn();
    });
    el.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  function refreshAbilityButtons() {
    for (let slot = 0; slot < 2; slot++) {
      const btn = document.getElementById("touch-ability-" + slot);
      if (!btn) continue;
      const label = btn.querySelector(".touch-ability-label");
      let ab = null;
      try { ab = getEquippedAbilityAtSlot(slot); } catch (_) { ab = null; }
      if (!ab) {
        btn.classList.add("no-ability");
        btn.classList.remove("on-cooldown");
        if (label) label.textContent = "–";
        continue;
      }
      btn.classList.remove("no-ability");
      if (label) {
        const name = ab.name || "?";
        label.textContent = name.length > 9 ? name.slice(0, 8) + "…" : name;
      }
      let ready = true;
      try {
        const h = game.hero;
        if (h) {
          const cd = getEffectiveAbilityCd(ab);
          ready = getAbilitySlotCd(h, slot) >= cd;
        }
      } catch (_) { ready = true; }
      btn.classList.toggle("on-cooldown", !ready);
    }
  }

  function watchGameFrame() {
    const frame = document.getElementById("game-frame");
    if (!frame) return;
    const sync = () => document.body.classList.toggle("in-run", !frame.classList.contains("hidden"));
    sync();
    new MutationObserver(sync).observe(frame, { attributes: true, attributeFilter: ["class"] });
  }

  // Bestes Spielgefühl auf Handys: bei Rungewinn/-fortsetzen (klarer User-Gesture)
  // direkt versuchen, in den echten Fullscreen zu wechseln. Schlägt das fehl
  // (z.B. iPhone-Safari ohne Fullscreen-API), greift trotzdem der CSS-Querformat-
  // Immersivmodus oben (body.in-run + orientation: landscape).
  function enterImmersiveMode() {
    const frame = document.getElementById("game-frame");
    if (!frame || document.fullscreenElement) return;
    if (typeof frame.requestFullscreen !== "function") return;
    try {
      frame.requestFullscreen().catch(() => {});
    } catch (_) { /* Fullscreen-API nicht verfügbar (z.B. iPhone-Safari) – CSS-Immersivmodus greift trotzdem */ }
  }

  function bindImmersiveTriggers() {
    ["btn-menu-continue", "btn-briefing-go", "btn-start-run", "btn-gameover-run", "btn-victory-loop"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener("click", enterImmersiveMode);
    });
  }

  function init() {
    watchGameFrame();
    bindImmersiveTriggers();

    bindHold(document.getElementById("touch-left"), "a");
    bindHold(document.getElementById("touch-right"), "d");

    bindTap(document.getElementById("touch-ability-0"), () => {
      if (typeof useEquippedAbility === "function") useEquippedAbility(0);
    });
    bindTap(document.getElementById("touch-ability-1"), () => {
      if (typeof useEquippedAbility === "function") useEquippedAbility(1);
    });
    bindTap(document.getElementById("touch-pause"), () => {
      if (typeof togglePause === "function") togglePause();
    });
    bindTap(document.getElementById("touch-upgrades"), () => {
      if (typeof toggleUpgrades === "function") toggleUpgrades();
    });

    setInterval(refreshAbilityButtons, 400);

    // Beste Übersicht auf Handys: Querformat einrasten, sobald Vollbild aktiv ist.
    document.addEventListener("fullscreenchange", () => {
      if (!screen.orientation || !screen.orientation.lock) return;
      if (document.fullscreenElement) {
        screen.orientation.lock("landscape").catch(() => {});
      } else if (screen.orientation.unlock) {
        try { screen.orientation.unlock(); } catch (_) {}
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
