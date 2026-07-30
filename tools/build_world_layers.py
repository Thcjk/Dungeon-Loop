#!/usr/bin/env python3
"""Build clean two-layer worlds from the character-free pack source strips.

The previews remain the colour and composition reference, but contain
embedded sample armies in several worlds.  Runtime assets are therefore built
only from `bg.png`, `path.png`, and `foreground.png`: background first, then a
single continuous combat lane.
"""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
WORLDS = ("forest", "swamp", "frost", "fire", "ruins")
CANVAS_W = 1290
SCENE_H = 268
LANE_H = 92
def load(path: Path) -> Image.Image | None:
    return Image.open(path).convert("RGBA") if path.exists() else None


def opaque(img: Image.Image) -> Image.Image:
    """Keep source RGB where the pack uses a transparent fade.

    The old builder preserved that alpha and consequently exposed the black
    canvas beneath the lower background.  Generated scene/lane layers are
    deliberately opaque, so they always cover the complete camera area.
    """
    out = img.convert("RGBA")
    out.putalpha(255)
    return out


def visible_colour(*images: Image.Image) -> tuple[int, int, int]:
    """Return a robust ground colour from opaque source pixels only."""
    pixels = []
    for image in images:
        data = np.asarray(image)
        visible = data[data[:, :, 3] > 180, :3]
        if visible.size:
            pixels.append(visible)
    if not pixels:
        return (36, 31, 22)
    return tuple(np.median(np.concatenate(pixels, axis=0), axis=0).astype(int))


def lane_base(top: tuple[int, int, int], bottom: tuple[int, int, int]) -> Image.Image:
    """Make an opaque, texture-ready path base with no transparent gaps."""
    data = np.zeros((LANE_H, CANVAS_W, 4), dtype=np.uint8)
    for y in range(LANE_H):
        t = y / max(1, LANE_H - 1)
        data[y, :, :3] = np.array(top) * (1 - t) + np.array(bottom) * t
    data[:, :, 3] = 255
    return Image.fromarray(data, "RGBA")


def build_world_layers(world_dir: Path) -> tuple[Image.Image, Image.Image]:
    src = world_dir / "_build"
    bg = load(src / "bg.png")
    path = load(src / "path.png")
    foreground = load(src / "foreground.png")
    if not bg or not path or not foreground:
        raise FileNotFoundError(f"saubere Weltquellen fehlen in {src}")

    # Background: one opaque, character-free panorama — no preview patches.
    ground_colour = visible_colour(path, foreground)
    scene = opaque(bg).resize((CANVAS_W, SCENE_H), Image.Resampling.NEAREST)

    # Combat lane: an opaque terrain-coloured base prevents transparent
    # black gaps.  The native-width path strip defines the actual ground line
    # and the foreground strip joins its lower edge to the surrounding world.
    # Native sizes are retained: stretching the 24px source path produced the
    # vertical barcode artefact visible in the previous build.
    top_colour = tuple(np.asarray(scene)[-1, :, :3].mean(axis=0).astype(int))
    lane = lane_base(top_colour, ground_colour)
    lane.alpha_composite(path, (0, 20))
    lane.alpha_composite(foreground, (0, LANE_H - foreground.height))
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
