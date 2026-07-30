#!/usr/bin/env python3
"""Baut die 2-Ebenen-Welt (Hintergrund + hohe Steinmauer) aus dem Asset-Pack.

Die Preview-Bilder des Packs sind die Vorlage, enthalten aber eingebrannte
Beispiel-Figuren und HUD-Ecken. Deshalb wird die Welt aus den figurfreien
Quellen nachgebaut:

  Ebene 1 (scene.png, 1290x292):
    - ausschliesslich das Hintergrundpanorama

  Ebene 2 (lane.png, 1290x68) - der Weg als Steinmauer im Vordergrund:
    - oben die begehbare Wegoberflaeche (path.png der jeweiligen Welt)
    - darunter eine Mauerfront aus versetzten Steinreihen derselben Textur
    - klare Vorderkante; die Mauer muss nicht mit dem Hintergrund
      verschwimmen, sie ist bewusst als Vordergrund lesbar

Die Fusslinie der Figuren (GROUND = 308) liegt exakt auf der Unterkante der
Mauerkrone: Lane beginnt bei y=292, Oberflaeche 292-308, Mauer darunter.
"""
from __future__ import annotations

from pathlib import Path

import hashlib

import numpy as np
from PIL import Image, ImageEnhance

ROOT = Path(__file__).resolve().parents[1]
WORLDS = ("forest", "swamp", "frost", "fire", "ruins")
CANVAS_W = 1290
SCENE_H = 292
LANE_H = 68
SURFACE_TOP = 0          # Mauerkrone 292-308 -> Fusslinie 308
WALL_TOP = 16

# Helligkeit von Wegoberflaeche und Mauersteinen (Feuerwelt-Textur ist im
# Pack sehr dunkel und braucht eine Anhebung, sonst wirkt die Mauer schwarz).
PATH_LIGHT = {
    "forest": 1.0,
    "swamp": 1.0,
    "frost": 1.05,
    "fire": 2.0,
    "ruins": 1.0,
}

BRICK_W = 43
BRICK_H = 12


def load(path: Path) -> Image.Image | None:
    return Image.open(path).convert("RGBA") if path.exists() else None


def opaque(img: Image.Image) -> Image.Image:
    out = img.convert("RGBA")
    out.putalpha(255)
    return out


def darken(img: Image.Image, factor: float) -> Image.Image:
    """Helligkeit anpassen, Alphakanal unveraendert lassen."""
    rgb = ImageEnhance.Brightness(img.convert("RGB")).enhance(factor)
    out = rgb.convert("RGBA")
    out.putalpha(img.getchannel("A"))
    return out


def brick_wall(path_strip: Image.Image, width: int, height: int, seed: str) -> np.ndarray:
    """Mauerfront aus versetztem Ziegelraster.

    Jeder Stein erhaelt seine Flaeche aus einem zufaellig gewaehlten Ausschnitt
    der Weg-Textur der jeweiligen Welt (mittlere Zeilen ohne Grasrand), dazu
    Fugen, Kantenlicht und leichte Helligkeitsstreuung pro Stein. So passt
    die Mauer farblich automatisch zu jeder Welt und wirkt wie Mauerwerk,
    nicht wie gekachelte Bildstreifen.
    """
    src = np.asarray(opaque(path_strip))
    src_mid = src[5:19]  # Steinflaeche ohne Grasueberhang
    seed_value = int.from_bytes(hashlib.sha256(seed.encode()).digest()[:4], "big")
    rng = np.random.default_rng(seed_value)
    wall = np.zeros((height, width, 4), dtype=np.uint8)
    wall[:, :, 3] = 255
    # Ziel-Helligkeit: einheitliche Steine (kein Schachbrett aus hellen und
    # dunklen Ziegeln), Mindesthelligkeit gegen komplett schwarze Mauern
    target_lum = max(float(src_mid[:, :, :3].mean()), 58.0)

    rows = -(-height // BRICK_H)
    for row in range(rows):
        y0 = row * BRICK_H
        offset = (row % 2) * (BRICK_W // 2)
        x0 = -offset
        while x0 < width:
            bw = min(BRICK_W, width - x0) if x0 >= 0 else BRICK_W + x0
            bx = max(0, x0)
            bh = min(BRICK_H, height - y0)
            if bw <= 0 or bh <= 0:
                x0 += BRICK_W
                continue
            # Ruhigste Steinflaeche aus mehreren Kandidaten waehlen, damit
            # keine Wurzeln/Kristalle/Objekte in den Ziegeln landen
            best = None
            best_var = None
            for _ in range(10):
                sx = int(rng.integers(0, src.shape[1] - BRICK_W))
                sy = int(rng.integers(0, max(1, src_mid.shape[0] - bh + 1)))
                cand = src_mid[sy:sy + bh, sx:sx + bw, :3].astype(np.float32)
                var = float(cand.var())
                if best_var is None or var < best_var:
                    best, best_var = cand, var
            patch = best
            # Helligkeit auf Zielwert normalisieren + leichte Streuung
            mean = max(1.0, float(patch.mean()))
            patch = patch * (target_lum / mean) * float(rng.uniform(0.88, 1.04))
            wall[y0:y0 + bh, bx:bx + bw, :3] = np.clip(patch, 0, 255).astype(np.uint8)
            # Kantenlicht oben, Schatten unten im Stein
            wall[y0, bx:bx + bw, :3] = np.clip(wall[y0, bx:bx + bw, :3].astype(np.int16) + 16, 0, 255).astype(np.uint8)
            if y0 + bh - 1 < height:
                wall[y0 + bh - 1, bx:bx + bw, :3] = (wall[y0 + bh - 1, bx:bx + bw, :3] * 0.72).astype(np.uint8)
            # senkrechte Fuge
            if bx + bw < width:
                wall[y0:y0 + bh, bx + bw - 1, :3] = (wall[y0:y0 + bh, bx + bw - 1, :3] * 0.62).astype(np.uint8)
            x0 += BRICK_W
        # waagerechte Fuge
        if y0 + BRICK_H - 1 < height:
            wall[y0 + BRICK_H - 1, :, :3] = (wall[y0 + BRICK_H - 1, :, :3] * 0.6).astype(np.uint8)

    # Mauer wird nach unten dunkler (Bodenschatten)
    for y in range(height):
        t = y / max(1, height - 1)
        wall[y, :, :3] = (wall[y, :, :3] * (1.0 - 0.38 * t)).astype(np.uint8)
    return wall


def build_wall_lane(path_strip: Image.Image, scene: Image.Image, theme: str) -> Image.Image:
    """Der Weg als Steinmauer: Oberflaeche oben, Mauerwerk darunter."""
    path_strip = darken(path_strip, PATH_LIGHT.get(theme, 1.0))
    lane = np.zeros((LANE_H, CANVAS_W, 4), dtype=np.uint8)
    lane[:, :, 3] = 255

    # Begehbare Wegoberflaeche (Original-Wegtextur der Welt)
    surface = np.asarray(opaque(path_strip))[:WALL_TOP]
    lane[SURFACE_TOP:WALL_TOP, :, :] = surface

    # Mauerfront
    wall_h = LANE_H - WALL_TOP
    lane[WALL_TOP:, :, :] = brick_wall(path_strip, CANVAS_W, wall_h, theme + "-wall")

    # Mauerkrone: helle Vorderkante unter der Oberflaeche
    lane[WALL_TOP, :, :3] = np.clip(lane[WALL_TOP, :, :3].astype(np.int16) + 30, 0, 255).astype(np.uint8)
    return Image.fromarray(lane, "RGBA")


def build_world_layers(world_dir: Path) -> tuple[Image.Image, Image.Image]:
    src = world_dir / "_build"
    bg = load(src / "bg.png")
    path = load(src / "path.png")
    if not bg or not path:
        raise FileNotFoundError(f"saubere Weltquellen fehlen in {src}")

    # ---- Ebene 1: Hintergrund ------------------------------------------
    # Kein Mittelband, keine Deko und kein Blend: der Hintergrund endet
    # direkt an der hohen Mauerkrone, exakt wie in der Referenz.
    scene = opaque(bg).resize((CANVAS_W, SCENE_H), Image.Resampling.NEAREST)

    # ---- Ebene 2: Weg als Steinmauer ------------------------------------
    lane = build_wall_lane(path, scene, world_dir.name)
    return scene, lane


def process_world(theme: str) -> None:
    world_dir = ROOT / "assets" / "pack" / "worlds" / theme
    scene, lane = build_world_layers(world_dir)
    scene.save(world_dir / "scene.png", optimize=True)
    lane.save(world_dir / "lane.png", optimize=True)
    print(theme, scene.size, lane.size)


def main() -> None:
    for theme in WORLDS:
        process_world(theme)


if __name__ == "__main__":
    main()
