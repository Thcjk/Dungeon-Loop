-- ============================================
-- Dungeon Loop – Supabase Datenbank Setup
-- Im Supabase SQL Editor ausführen
-- ============================================

-- Tabelle 1: Spielerfortschritt & Upgrades
CREATE TABLE IF NOT EXISTS dungeon_players (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name          TEXT NOT NULL UNIQUE,
  class_name    TEXT NOT NULL DEFAULT 'warrior',
  total_gold    INTEGER NOT NULL DEFAULT 0,
  upgrade_attack   INTEGER NOT NULL DEFAULT 0,
  upgrade_health   INTEGER NOT NULL DEFAULT 0,
  upgrade_defense  INTEGER NOT NULL DEFAULT 0,
  upgrade_crit     INTEGER NOT NULL DEFAULT 0,
  upgrade_gold     INTEGER NOT NULL DEFAULT 0,
  upgrade_xp       INTEGER NOT NULL DEFAULT 0,
  upgrade_magic    INTEGER NOT NULL DEFAULT 0,
  upgrade_mana     INTEGER NOT NULL DEFAULT 0,
  upgrade_cooldown INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabelle 2: Online-Rangliste
CREATE TABLE IF NOT EXISTS dungeon_scores (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name              TEXT NOT NULL,
  class_name        TEXT NOT NULL,
  score             INTEGER NOT NULL DEFAULT 0,
  dungeon_level     INTEGER NOT NULL DEFAULT 1,
  monsters_defeated INTEGER NOT NULL DEFAULT 0,
  gold              INTEGER NOT NULL DEFAULT 0,
  player_level      INTEGER NOT NULL DEFAULT 1,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row Level Security aktivieren
ALTER TABLE dungeon_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE dungeon_scores ENABLE ROW LEVEL SECURITY;

-- Policies für dungeon_players (anon Zugriff)
CREATE POLICY "Spieler lesen"
  ON dungeon_players FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Spieler erstellen"
  ON dungeon_players FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Spieler aktualisieren"
  ON dungeon_players FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Policies für dungeon_scores (anon Zugriff)
CREATE POLICY "Scores lesen"
  ON dungeon_scores FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Scores erstellen"
  ON dungeon_scores FOR INSERT
  TO anon
  WITH CHECK (true);

-- Index für schnellere Rangliste
CREATE INDEX IF NOT EXISTS idx_scores_score ON dungeon_scores (score DESC);
CREATE INDEX IF NOT EXISTS idx_players_name ON dungeon_players (name);
