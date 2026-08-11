/* ============================================
   Dungeon Loop – NG+ Informationsschicht
   Browser: nach ngplus.js
   ============================================ */

const NG_INFO_ICONS = {
  hp: "♥",
  damage: "⚔",
  armor: "🛡",
  difficulty: "☠",
  gold: "🪙",
  elite: "✦",
  corruption: "🌀",
  boss: "♛",
  encounter: "⚡",
  lock: "🔒",
  check: "✓"
};

const NG_ELITE_INFO = {
  berserk: {
    id: "berserk", name: "BERSERKER",
    short: "Mehr Schaden und Angriffstempo, etwas weniger Leben.",
    detail: "Dieser Elite verursacht mehr Schaden und greift schneller an, besitzt dafür etwas weniger Leben.",
    tip: "Kite und Burst – nicht im Nahkampf stehen bleiben.",
    unlockLoop: 1
  },
  armored: {
    id: "armored", name: "GEPANZERT",
    short: "Höhere Rüstung und mehr Leben, langsamer.",
    detail: "Rüstung +20 %, HP +10 %, Bewegung −8 %.",
    tip: "DoTs und kritische Treffer helfen gegen Panzer.",
    unlockLoop: 1
  },
  fast: {
    id: "fast", name: "SCHNELL",
    short: "Deutlich schneller und aggressiver, etwas weniger Schaden.",
    detail: "Bewegung +20 %, Angriffstempo +18 %, Schaden −8 %.",
    tip: "Abstand halten und Beweglichkeit nutzen.",
    unlockLoop: 1
  },
  vampiric: {
    id: "vampiric", name: "VAMPIRISCH",
    short: "Heilt bei Treffern einen Teil seiner Max-HP.",
    detail: "Bei erfolgreichem Treffer: 4 % Max-HP Heilung (ICD 2,5 s).",
    tip: "Unterbrich seine Angriffe – sonst heilt er sich zurück.",
    unlockLoop: 1
  },
  explosive: {
    id: "explosive", name: "EXPLOSIV",
    short: "Explodiert nach dem Tod – Abstand halten!",
    detail: "Nach dem Tod Explosion nach 0,9 s · Radius 70 px · 18 % deiner Max-HP.",
    tip: "Nach dem Kill sofort Abstand halten.",
    unlockLoop: 1
  },
  shielded: {
    id: "shielded", name: "GESCHÜTZT",
    short: "Startet mit einem Schild (kein Regen).",
    detail: "Schild: 25 % Max-HP. Regeneriert nicht.",
    tip: "Schild zuerst knacken, dann Burst.",
    unlockLoop: 1
  }
};

const NG_ENCOUNTER_INFO = {
  haste: {
    id: "haste", name: "HAST",
    short: "Gegner bewegen und greifen schneller an.",
    detail: "Bewegung +10 %, Angriffstempo +8 %. Belohnung +8 %.",
    unlockLoop: 2
  },
  fortified: {
    id: "fortified", name: "VERSTÄRKT",
    short: "Gegner besitzen mehr Leben und Rüstung.",
    detail: "HP +15 %, Rüstung +5 %. Belohnung +10 %.",
    unlockLoop: 2
  },
  deadly: {
    id: "deadly", name: "TÖDLICH",
    short: "Gegner verursachen mehr Schaden.",
    detail: "Schaden +12 %. Belohnung +12 %.",
    unlockLoop: 2
  },
  swarm: {
    id: "swarm", name: "SCHWARM",
    short: "Mehr Gegner, aber etwas weniger HP.",
    detail: "Encounter-Budget +18 %, HP −8 %. Belohnung +15 %.",
    unlockLoop: 2
  },
  ranged_pressure: {
    id: "ranged_pressure", name: "FERNDRUCK",
    short: "Mehr Fernkämpfer in der Welle.",
    detail: "Ranged-Gewicht +50 % (max. 3). Belohnung +12 %.",
    unlockLoop: 2
  }
};

const NG_CORRUPTION_INFO = {
  blood_moon: {
    id: "blood_moon", name: "BLUTMOND",
    short: "Mehr Gegnerschaden, mehr Gold.",
    detail: "Gegner +15 % Schaden. Gold +20 %.",
    tip: "Defensive Builds können das Risiko für mehr Gold nutzen.",
    unlockLoop: 5
  },
  darkness: {
    id: "darkness", name: "FINSTERNIS",
    short: "Kürzere Telegraphs, bessere Belohnung.",
    detail: "Telegraph-Dauer −10 %. Belohnung +15 %.",
    tip: "Reagiere früher auf Angriffsanzeigen.",
    unlockLoop: 5
  },
  scarcity: {
    id: "scarcity", name: "MANGEL",
    short: "Weniger Gold, bessere Loot-Qualität.",
    detail: "Gold −15 %. Rare+ Chance +25 % relativ.",
    tip: "Gut für Builds, die Loot-Qualität brauchen.",
    unlockLoop: 5
  },
  overgrowth: {
    id: "overgrowth", name: "WUCHER",
    short: "Mehr Tanks/Support und etwas mehr HP.",
    detail: "Tank/Support-Gewicht +40 %. HP +8 %. Belohnung +12 %.",
    tip: "Priorisiere Support und Tanks früh.",
    unlockLoop: 5
  },
  warpath: {
    id: "warpath", name: "KRIEGSPFAD",
    short: "Härtere Wellen, weniger Erholung, mehr Gold.",
    detail: "Budget +20 %. Recovery −50 %. Gold +18 %.",
    tip: "Spare Ressourcen für dichte Wellen.",
    unlockLoop: 5
  },
  frail_power: {
    id: "frail_power", name: "ZERBRECHLICHE MACHT",
    short: "Du machst mehr Schaden, hast aber weniger Max-HP.",
    detail: "Spieler-Schaden +15 %. Max-HP −18 %.",
    tip: "Aggressiv spielen, Treffer vermeiden.",
    unlockLoop: 5
  }
};

const NG_LOOP_INTROS = {
  1: {
    title: "DER DUNGEON ERWACHT",
    feature: "ELITE-MODIFIKATOREN",
    featureIcon: "elite",
    body: "Elite-Gegner können jetzt besondere Eigenschaften besitzen.",
    examples: [
      { name: "BERSERKER", text: "mehr Schaden und Angriffstempo" },
      { name: "GEPANZERT", text: "höhere Rüstung" },
      { name: "EXPLOSIV", text: "Explosion nach dem Tod" }
    ]
  },
  2: {
    title: "DER DUNGEON PASST SICH AN",
    feature: "ENCOUNTER-MODIFIKATOREN",
    featureIcon: "encounter",
    body: "Manche Wellen können besondere Eigenschaften besitzen. Gefährlichere Begegnungen geben bessere Belohnungen.",
    examples: [
      { name: "HAST", text: "Gegner bewegen sich schneller" },
      { name: "VERSTÄRKT", text: "mehr Leben und Rüstung" },
      { name: "TÖDLICH", text: "mehr Schaden" }
    ]
  },
  3: {
    title: "DIE BOSSE LERNEN",
    feature: "BOSS-EVOLUTION",
    featureIcon: "boss",
    body: "Bosse entwickeln neue Attacken und veränderte Angriffsmuster. Achte nicht nur auf ihre Werte.",
    extras: [
      "Boss-HP +8 % zusätzlich",
      "Boss-Schaden +5 % zusätzlich",
      "Neue Attacken ca. alle 12–18 Sekunden"
    ]
  },
  4: {
    title: "ELITES MUTIEREN",
    feature: "DOPPEL-MODIFIKATOREN",
    featureIcon: "elite",
    body: "Elite-Gegner können jetzt zwei Modifikatoren gleichzeitig besitzen (35 % Chance).",
    examples: [
      { name: "GEPANZERT + EXPLOSIV", text: "Panzer und Explosion" },
      { name: "VAMPIRISCH + SCHNELL", text: "Heilung und Tempo" }
    ],
    note: "Jede zusätzliche Eigenschaft erhöht die Belohnung."
  },
  5: {
    title: "KORRUPTION",
    feature: "WELT-KORRUPTION",
    featureIcon: "corruption",
    body: "Jede Welt kann einen Korruptions-Effekt besitzen. Korruption verändert die Regeln einer gesamten Welt.",
    examples: [
      { name: "BLUTMOND", text: "Gegner +15 % Schaden · Gold +20 %" }
    ],
    note: "Höheres Risiko = höhere Belohnung. Beim Betreten wird der Effekt angezeigt."
  },
  6: {
    title: "DIE BOSSE ERWACHEN",
    feature: "ERWEITERTE BOSS-PHASEN",
    featureIcon: "boss",
    body: "Bosse erhalten zusätzliche Endphasen.",
    extras: [
      "Boss 1–3: neue Phase unter 25 % HP",
      "Spätere Bosse werden in Endphasen aggressiver",
      "Final Boss: Enrage unter 20 % HP"
    ]
  },
  7: {
    title: "ENDGAME",
    feature: "KOMBINATIONEN",
    featureIcon: "difficulty",
    body: "Ab jetzt steigt die Schwierigkeit weniger über reine Werte – sondern über gefährlichere Kombinationen.",
    extras: [
      "Doppelte Korruption möglich",
      "Mehr Elite-Modifikatoren",
      "Stärkere Encounter-Kombinationen",
      "Komplexere Bosse"
    ],
    note: "Ziel: Erreiche den höchsten Loop, den du schaffen kannst."
  }
};

const NG_ROADMAP = [
  { loop: 1, name: "Elite-Modifikatoren", blurb: "Elites erhalten besondere Eigenschaften." },
  { loop: 2, name: "Encounter-Modifikatoren", blurb: "Wellen können mutieren." },
  { loop: 3, name: "Boss-Evolution", blurb: "Bosse lernen neue Muster." },
  { loop: 4, name: "Doppel-Elites", blurb: "Zwei Modifikatoren gleichzeitig." },
  { loop: 5, name: "Korruption", blurb: "Welten können neue Regeln erhalten." },
  { loop: 6, name: "Erweiterte Boss-Phasen", blurb: "Zusätzliche Endphasen und Enrage." },
  { loop: 7, name: "Endgame", blurb: "Kombinationen statt reiner Stat-Kurve." }
];

function ngInfoCreateDiscovery() {
  return {
    seenNgPlusIntro: false,
    seenLoopIntroductions: {},
    discoveredEliteModifiers: {},
    discoveredEncounterModifiers: {},
    discoveredCorruptions: {},
    discoveredBossEvolutions: {},
    seenBossEvolutionInfo: false,
    seenEndgameInfo: false
  };
}

function ngInfoMigrateDiscovery(raw) {
  const base = ngInfoCreateDiscovery();
  const src = raw && typeof raw === "object" ? raw : {};
  base.seenNgPlusIntro = !!src.seenNgPlusIntro;
  base.seenLoopIntroductions = Object.assign({}, src.seenLoopIntroductions || {});
  base.discoveredEliteModifiers = Object.assign({}, src.discoveredEliteModifiers || {});
  base.discoveredEncounterModifiers = Object.assign({}, src.discoveredEncounterModifiers || {});
  base.discoveredCorruptions = Object.assign({}, src.discoveredCorruptions || {});
  base.discoveredBossEvolutions = Object.assign({}, src.discoveredBossEvolutions || {});
  base.seenBossEvolutionInfo = !!src.seenBossEvolutionInfo;
  base.seenEndgameInfo = !!src.seenEndgameInfo;
  return base;
}

function ngInfoEnsure(meta) {
  if (!meta) return ngInfoCreateDiscovery();
  if (!meta.discovery || typeof meta.discovery !== "object") {
    meta.discovery = ngInfoMigrateDiscovery(null);
  } else {
    meta.discovery = ngInfoMigrateDiscovery(meta.discovery);
  }
  return meta.discovery;
}

function ngInfoHasSeenLoop(meta, loopIndex) {
  const d = ngInfoEnsure(meta);
  return !!d.seenLoopIntroductions[String(loopIndex | 0)];
}

function ngInfoMarkLoopSeen(meta, loopIndex) {
  const d = ngInfoEnsure(meta);
  d.seenLoopIntroductions[String(loopIndex | 0)] = true;
  if ((loopIndex | 0) >= 3) d.seenBossEvolutionInfo = true;
  if ((loopIndex | 0) >= 7) d.seenEndgameInfo = true;
}

function ngInfoDiscoverElite(meta, modId) {
  const d = ngInfoEnsure(meta);
  const id = String(modId || "");
  if (!id || d.discoveredEliteModifiers[id]) return false;
  d.discoveredEliteModifiers[id] = true;
  return true;
}

function ngInfoDiscoverEncounter(meta, modId) {
  const d = ngInfoEnsure(meta);
  const id = String(modId || "");
  if (!id || d.discoveredEncounterModifiers[id]) return false;
  d.discoveredEncounterModifiers[id] = true;
  return true;
}

function ngInfoDiscoverCorruption(meta, modId) {
  const d = ngInfoEnsure(meta);
  const id = String(modId || "");
  if (!id || d.discoveredCorruptions[id]) return false;
  d.discoveredCorruptions[id] = true;
  return true;
}

function ngInfoIsCorruptionKnown(meta, modId) {
  const d = ngInfoEnsure(meta);
  return !!d.discoveredCorruptions[String(modId || "")];
}

function ngInfoPct(v) {
  const n = Number(v) || 0;
  const sign = n >= 0 ? "+" : "";
  return sign + Math.round(n * 100) + " %";
}

function ngInfoMult(v) {
  return "×" + (Number(v) || 1).toFixed(2);
}

function ngInfoLoopStatRows(loopIndex) {
  const m = typeof ngLoopMult === "function" ? ngLoopMult(loopIndex) : { hp: 1, atk: 1, budget: 1, gold: 1 };
  const prev = typeof ngLoopMult === "function" ? ngLoopMult(Math.max(0, (loopIndex | 0) - 1)) : { hp: 1, atk: 1, budget: 1, gold: 1 };
  return [
    { icon: "hp", label: "Gegner-HP", value: ngInfoPct((m.hp / Math.max(0.01, prev.hp)) - 1), abs: ngInfoMult(m.hp), warn: true },
    { icon: "damage", label: "Gegner-Schaden", value: ngInfoPct((m.atk / Math.max(0.01, prev.atk)) - 1), abs: ngInfoMult(m.atk), warn: true },
    { icon: "difficulty", label: "Encounter-Druck", value: ngInfoPct((m.budget / Math.max(0.01, prev.budget)) - 1), abs: ngInfoPct(m.budget - 1), warn: true },
    { icon: "gold", label: "Gold", value: ngInfoPct((m.gold / Math.max(0.01, prev.gold)) - 1), abs: ngInfoMult(m.gold), positive: true }
  ];
}

function ngInfoActiveSystems(loopIndex) {
  const L = Math.max(0, loopIndex | 0);
  const systems = [
    { loop: 1, name: "Elite-Modifikatoren", icon: "elite" },
    { loop: 2, name: "Encounter-Modifikatoren", icon: "encounter" },
    { loop: 3, name: "Boss-Evolution", icon: "boss" },
    { loop: 4, name: "Doppel-Elites", icon: "elite" },
    { loop: 5, name: "Korruption", icon: "corruption" },
    { loop: 6, name: "Erweiterte Boss-Phasen", icon: "boss" },
    { loop: 7, name: "Endgame-Kombinationen", icon: "difficulty" }
  ];
  return {
    active: systems.filter((s) => L >= s.loop),
    locked: systems.filter((s) => L < s.loop)
  };
}

function ngInfoEliteLabel(modIds) {
  const ids = modIds || [];
  if (!ids.length) return "ELITE";
  if (ids.length >= 3) return "ELITE " + NG_INFO_ICONS.difficulty + "3";
  const names = ids.map((id) => (NG_ELITE_INFO[id] && NG_ELITE_INFO[id].name) || String(id).toUpperCase());
  return "ELITE – " + names.join(" / ");
}

function ngInfoBuildLoopIntroHtml(loopIndex, opts) {
  const L = Math.max(0, loopIndex | 0);
  const o = opts || {};
  const compact = !!o.compact;
  const label = typeof ngDisplayLabel === "function" ? ngDisplayLabel(L) : ("LOOP " + L);
  const intro = NG_LOOP_INTROS[Math.min(7, L)] || NG_LOOP_INTROS[7];
  const rows = ngInfoLoopStatRows(L);
  const systems = ngInfoActiveSystems(L);

  let html = '<div class="ng-info-head">' +
    '<div class="ng-info-kicker">' + label + '</div>' +
    '<h2 class="ng-info-title">' + (intro ? intro.title : "NEUER LOOP") + '</h2>' +
    '</div>';

  html += '<div class="ng-stat-grid">';
  rows.forEach((r) => {
    html += '<div class="ng-stat-row' + (r.warn ? " warn" : "") + (r.positive ? " pos" : "") + '">' +
      '<span class="ng-ico" aria-hidden="true">' + (NG_INFO_ICONS[r.icon] || "") + '</span>' +
      '<span class="ng-stat-label">' + r.label + '</span>' +
      '<span class="ng-stat-val">' + (compact ? r.abs : r.value) + '</span>' +
      '</div>';
  });
  html += '</div>';

  if (compact) {
    html += '<div class="ng-systems"><div class="ng-systems-title">Aktive Systeme</div><ul>';
    systems.active.forEach((s) => {
      html += '<li><span class="ng-ico">' + (NG_INFO_ICONS[s.icon] || NG_INFO_ICONS.check) + '</span> ' + s.name + '</li>';
    });
    html += '</ul></div>';
    return html;
  }

  if (intro) {
    html += '<div class="ng-feature-block">' +
      '<div class="ng-feature-label"><span class="ng-ico">' + (NG_INFO_ICONS[intro.featureIcon] || NG_INFO_ICONS.elite) + '</span> NEU: <strong>' + intro.feature + '</strong></div>' +
      '<p class="ng-feature-body">' + intro.body + '</p>';
    if (intro.examples && intro.examples.length) {
      html += '<ul class="ng-example-list">';
      intro.examples.forEach((ex) => {
        html += '<li><strong>' + ex.name + '</strong> → ' + ex.text + '</li>';
      });
      html += '</ul>';
    }
    if (intro.extras && intro.extras.length) {
      html += '<ul class="ng-example-list">';
      intro.extras.forEach((ex) => { html += '<li>' + ex + '</li>'; });
      html += '</ul>';
    }
    if (intro.note) html += '<p class="ng-note">' + intro.note + '</p>';
    html += '</div>';
  }
  return html;
}

function ngInfoBuildRoadmapHtml(meta) {
  const reached = Math.max(0, (meta && (meta.highestLoopReached | 0)) || 0);
  let html = '<div class="ng-info-head"><div class="ng-info-kicker">NG+</div><h2 class="ng-info-title">LOOP-ROADMAP</h2>' +
    '<p class="ng-feature-body">Sieh, was als Nächstes freigeschaltet wird.</p></div><ul class="ng-roadmap">';
  NG_ROADMAP.forEach((r) => {
    const unlocked = reached >= r.loop;
    html += '<li class="' + (unlocked ? "unlocked" : "locked") + '">' +
      '<span class="ng-road-mark">' + (unlocked ? NG_INFO_ICONS.check : NG_INFO_ICONS.lock) + '</span>' +
      '<span class="ng-road-loop">LOOP ' + r.loop + '</span>' +
      '<span class="ng-road-name">' + r.name + '</span>' +
      '<span class="ng-road-blurb">' + r.blurb + '</span>' +
      '</li>';
  });
  html += '</ul>';
  return html;
}

function ngInfoBuildCodexHtml(meta, loopIndex, runState) {
  const L = Math.max(0, loopIndex | 0);
  const m = typeof ngLoopMult === "function" ? ngLoopMult(L) : {};
  const systems = ngInfoActiveSystems(L);
  const d = ngInfoEnsure(meta);
  const corr = (runState && runState.activeCorruption) || [];
  let html = '<div class="ng-info-head"><div class="ng-info-kicker">PAUSE</div>' +
    '<h2 class="ng-info-title">' + (typeof ngDisplayLabel === "function" ? ngDisplayLabel(L) : ("LOOP " + L)) + '</h2></div>';

  html += '<div class="ng-stat-grid">';
  [
    { icon: "hp", label: "Gegner HP", value: ngInfoMult(m.hp), warn: true },
    { icon: "damage", label: "Gegner Damage", value: ngInfoMult(m.atk), warn: true },
    { icon: "difficulty", label: "Encounter", value: ngInfoPct((m.budget || 1) - 1), warn: true },
    { icon: "gold", label: "Gold", value: ngInfoMult(m.gold), positive: true }
  ].forEach((r) => {
    html += '<div class="ng-stat-row' + (r.warn ? " warn" : "") + (r.positive ? " pos" : "") + '">' +
      '<span class="ng-ico">' + (NG_INFO_ICONS[r.icon] || "") + '</span>' +
      '<span class="ng-stat-label">' + r.label + '</span>' +
      '<span class="ng-stat-val">' + r.value + '</span></div>';
  });
  html += '</div>';

  html += '<div class="ng-systems"><div class="ng-systems-title">Aktiv</div><ul>';
  systems.active.forEach((s) => {
    html += '<li class="pos"><span class="ng-ico">' + NG_INFO_ICONS.check + '</span> ' + s.name + '</li>';
  });
  html += '</ul><div class="ng-systems-title">Noch gesperrt</div><ul>';
  systems.locked.forEach((s) => {
    html += '<li class="locked"><span class="ng-ico">' + NG_INFO_ICONS.lock + '</span> ' + s.name + ' – Loop ' + s.loop + '</li>';
  });
  html += '</ul></div>';

  if (corr.length) {
    html += '<div class="ng-feature-block corr"><div class="ng-feature-label"><span class="ng-ico">' +
      NG_INFO_ICONS.corruption + '</span> Aktive Korruption</div>';
    corr.forEach((c) => {
      const info = NG_CORRUPTION_INFO[c.id] || {};
      html += '<p><strong>' + (info.name || c.id) + '</strong> – ' + (info.detail || info.short || "") + '</p>';
    });
    html += '</div>';
  }

  html += '<div class="ng-systems"><div class="ng-systems-title">Entdeckte Elite-Modifier</div><ul>';
  const elites = Object.keys(d.discoveredEliteModifiers || {});
  if (!elites.length) html += '<li>Noch keine entdeckt.</li>';
  elites.forEach((id) => {
    const info = NG_ELITE_INFO[id];
    if (!info) return;
    html += '<li><strong>' + info.name + '</strong> – ' + info.detail +
      (info.tip ? ' <em>Tipp: ' + info.tip + '</em>' : '') + '</li>';
  });
  html += '</ul></div>';

  html += '<div class="ng-systems"><div class="ng-systems-title">Entdeckte Encounter</div><ul>';
  const encs = Object.keys(d.discoveredEncounterModifiers || {});
  if (!encs.length) html += '<li>Noch keine entdeckt.</li>';
  encs.forEach((id) => {
    const info = NG_ENCOUNTER_INFO[id];
    if (!info) return;
    html += '<li><strong>' + info.name + '</strong> – ' + info.detail + '</li>';
  });
  html += '</ul></div>';

  html += '<div class="ng-systems"><div class="ng-systems-title">Entdeckte Korruptionen</div><ul>';
  const cors = Object.keys(d.discoveredCorruptions || {});
  if (!cors.length) html += '<li>Noch keine entdeckt.</li>';
  cors.forEach((id) => {
    const info = NG_CORRUPTION_INFO[id];
    if (!info) return;
    html += '<li><strong>' + info.name + '</strong> – ' + info.detail +
      (info.tip ? ' <em>Tipp: ' + info.tip + '</em>' : '') + '</li>';
  });
  html += '</ul></div>';

  return html;
}

function ngInfoBuildNgPlusIntroHtml() {
  return '<div class="ng-info-head">' +
    '<div class="ng-info-kicker">NEUES SPIEL+</div>' +
    '<h2 class="ng-info-title">Du hast Dungeon Loop bezwungen.</h2>' +
    '<p class="ng-feature-body">Aber der Dungeon verändert sich.</p>' +
    '<p class="ng-feature-body">In neuen Loops erwarten dich stärkere Gegner, neue Elite-Eigenschaften, veränderte Begegnungen und später neue Bossmechaniken und Korruption.</p>' +
    '</div>' +
    '<div class="ng-keep-reset">' +
    '<div class="ng-keep"><h3>' + NG_INFO_ICONS.check + ' WAS BLEIBT?</h3><ul>' +
    '<li>permanentes Gold</li><li>Meta-Upgrades</li><li>Account-Level</li>' +
    '<li>Fähigkeiten</li><li>Rekorde</li><li>Entdeckungen</li></ul></div>' +
    '<div class="ng-reset"><h3>✕ WAS WIRD ZURÜCKGESETZT?</h3><ul>' +
    '<li>Run-Upgrades</li><li>Event-Buffs</li><li>Curses</li><li>aktueller Run</li></ul></div>' +
    '</div>';
}

function ngInfoBuildVictoryKeepHtml() {
  return '<div class="ng-keep-reset compact">' +
    '<div class="ng-keep"><strong>' + NG_INFO_ICONS.check + ' Bleibt:</strong> Gold · Meta · Level · Fähigkeiten · Rekorde · Entdeckungen</div>' +
    '<div class="ng-reset"><strong>✕ Reset:</strong> Run-Upgrades · Event-Buffs · Curses · aktueller Run</div>' +
    '</div>';
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    NG_INFO_ICONS,
    NG_ELITE_INFO,
    NG_ENCOUNTER_INFO,
    NG_CORRUPTION_INFO,
    NG_LOOP_INTROS,
    NG_ROADMAP,
    ngInfoCreateDiscovery,
    ngInfoMigrateDiscovery,
    ngInfoEnsure,
    ngInfoHasSeenLoop,
    ngInfoMarkLoopSeen,
    ngInfoDiscoverElite,
    ngInfoDiscoverEncounter,
    ngInfoDiscoverCorruption,
    ngInfoIsCorruptionKnown,
    ngInfoLoopStatRows,
    ngInfoActiveSystems,
    ngInfoEliteLabel,
    ngInfoBuildLoopIntroHtml,
    ngInfoBuildRoadmapHtml,
    ngInfoBuildCodexHtml,
    ngInfoBuildNgPlusIntroHtml,
    ngInfoBuildVictoryKeepHtml
  };
}
