#!/usr/bin/env python3
"""Genau zwei sichtbare Weltebenen – nichts dazwischen:

  1. scene.png  – nur Hintergrundpanorama (bg.png), bis zur Maueroberkante
  2. lane.png   – nur Steinmauer darunter (komplette Lane = Mauerwerk)

Held und Gegner stehen GENAU auf der Maueroberkante (GROUND = SCENE_H).
Kein Grasweg, keine Wurzeln, kein Mittelband, keine Deko-Zwischenlage.
"""
from __future__ import annotations

import hashlib
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
WORLDS = ("forest", "swamp", "frost", "fire", "ruins")
CANVAS_W = 1290
SCENE_H = 288   # Hintergrund endet an der Mauerkrone / Fusslinie
LANE_H = 72     # hohe Steinmauer darunter (komplett unter den Fuesen)
BRICK_W = 40
BRICK_H = 14

# Reine Stein-Paletten (Haupt, Schatten, Licht, Fuge) – keine Waldbodenfarben
STONE = {
    "forest": ((96, 98, 84), (64, 66, 54), (128, 130, 112), (36, 38, 30)),
    "swamp":  ((80, 76, 58), (52, 50, 36), (110, 104, 80), (30, 28, 22)),
    "frost":  ((140, 148, 162), (96, 104, 118), (196, 204, 218), (50, 56, 66)),
    "fire":   ((86, 72, 68), (52, 42, 40), (128, 100, 88), (26, 20, 18)),
    "ruins":  ((134, 112, 84), (92, 74, 54), (176, 150, 114), (50, 40, 30)),
}


def load(path: Path) -> Image.Image | None:
    return Image.open(path).convert("RGBA") if path.exists() else None


def opaque(img: Image.Image) -> Image.Image:
    out = img.convert("RGBA")
    out.putalpha(255)
    return out


def brick_wall(theme: str, width: int, height: int, seed: str) -> np.ndarray:
    main, shade, light, mortar = STONE[theme]
    seed_value = int.from_bytes(hashlib.sha256(seed.encode()).digest()[:4], "big")
    rng = np.random.default_rng(seed_value)
    wall = np.zeros((height, width, 4), dtype=np.uint8)
    wall[:, :, 3] = 255
    wall[:, :, :3] = mortar

    rows = -(-height // BRICK_H)
    for row in range(rows):
        y0 = row * BRICK_H
        offset = (row % 2) * (BRICK_W // 2)
        x0 = -offset
        while x0 < width:
            bx = max(0, x0)
            bw = min(BRICK_W - 1, width - bx)
            bh = min(BRICK_H - 1, height - y0)
            if bw > 0 and bh > 0:
                t = float(rng.uniform(0.0, 1.0))
                if t < 0.22:
                    color = np.array(shade, dtype=np.float32)
                elif t > 0.78:
                    color = np.array(light, dtype=np.float32)
                else:
                    color = np.array(main, dtype=np.float32)
                color *= float(rng.uniform(0.93, 1.07))
                noise = rng.integers(-5, 6, size=(bh, bw, 3), dtype=np.int16)
                patch = np.clip(color + noise, 0, 255).astype(np.uint8)
                wall[y0:y0 + bh, bx:bx + bw, :3] = patch
                wall[y0, bx:bx + bw, :3] = np.clip(
                    wall[y0, bx:bx + bw, :3].astype(np.int16) + 20, 0, 255
                ).astype(np.uint8)
                if bh > 1:
                    wall[y0 + bh - 1, bx:bx + bw, :3] = (
                        wall[y0 + bh - 1, bx:bx + bw, :3] * 0.7
                    ).astype(np.uint8)
            x0 += BRICK_W

    for y in range(height):
        factor = 1.0 - 0.25 * (y / max(1, height - 1))
        wall[y, :, :3] = (wall[y, :, :3] * factor).astype(np.uint8)

    # Scharfe helle Mauerkrone (Oberkante = Laufkante der Figuren)
    wall[0, :, :3] = np.clip(wall[0, :, :3].astype(np.int16) + 40, 0, 255).astype(np.uint8)
    wall[1, :, :3] = np.clip(wall[1, :, :3].astype(np.int16) + 18, 0, 255).astype(np.uint8)
    return wall


def build_world_layers(world_dir: Path) -> tuple[Image.Image, Image.Image]:
    src = world_dir / "_build"
    bg = load(src / "bg.png")
    if not bg:
        raise FileNotFoundError(f"bg.png fehlt in {src}")

    # Ebene 1: nur Hintergrund – endet hart an der Maueroberkante
    scene = opaque(bg).resize((CANVAS_W, SCENE_H), Image.Resampling.NEAREST)

    # Ebene 2: nur Steinmauer – beginnt genau unter den Fuesen
    lane = Image.fromarray(brick_wall(world_dir.name, CANVAS_W, LANE_H, world_dir.name), "RGBA")
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
