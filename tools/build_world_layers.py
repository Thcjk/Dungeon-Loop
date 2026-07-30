#!/usr/bin/env python3
"""Build seamless 2-layer strips from character-free pack layers only."""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
WORLDS = ("forest", "swamp", "frost", "fire", "ruins")
CANVAS_W = 1290
SCENE_H = 268
LANE_H = 92
PATH_Y = 30
FG_SKIP_TOP = 18  # foreground.png hat oft eingebackene Füße oben


def load(path: Path) -> Image.Image | None:
    return Image.open(path).convert("RGBA") if path.exists() else None


def tile_width(img: Image.Image, width: int) -> Image.Image:
    if img.width >= width:
        return img.crop((0, 0, width, img.height))
    out = Image.new("RGBA", (width, img.height))
    x = 0
    while x < width:
        out.paste(img, (x, 0), img)
        x += img.width
    return out


def build_scene(world_dir: Path) -> Image.Image:
    src = world_dir / "_build"
    bg = load(src / "bg.png")
    if not bg:
        raise FileNotFoundError(f"bg.png fehlt in {src}")
    bg = tile_width(bg, CANVAS_W)
    scaled = bg.resize((CANVAS_W, SCENE_H), Image.NEAREST)
    return scaled


def build_lane(world_dir: Path, scene: Image.Image) -> Image.Image:
    src = world_dir / "_build"
    path = load(src / "path.png")
    fg = load(src / "foreground.png")

    scene_arr = np.array(scene)
    arr = np.zeros((LANE_H, CANVAS_W, 4), dtype=np.uint8)

    # Untergrund aus letzter Scene-Zeile
    base = scene_arr[-1].astype(np.float32)
    for y in range(LANE_H):
        for x in range(CANVAS_W):
            arr[y, x, :3] = base[x, :3].astype(np.uint8)
            arr[y, x, 3] = 255

    if path:
        path = tile_width(path, CANVAS_W)
        pa = np.array(path)
        ph, pw = pa.shape[:2]
        for y in range(ph):
            ty = PATH_Y + y
            if ty >= LANE_H:
                break
            for x in range(CANVAS_W):
                px = pa[y, x % pw]
                a = px[3] / 255.0
                if a < 0.05:
                    continue
                arr[ty, x, :3] = (
                    arr[ty, x, :3].astype(np.float32) * (1 - a) + px[:3].astype(np.float32) * a
                ).astype(np.uint8)

    if fg:
        fg = tile_width(fg, CANVAS_W)
        fa = np.array(fg)
        fh, fw = fa.shape[:2]
        y0 = min(FG_SKIP_TOP, max(0, fh - 1))
        crop = fa[y0:, :, :]
        ch = crop.shape[0]
        fy = LANE_H - ch
        for y in range(ch):
            ty = fy + y
            if ty < 0 or ty >= LANE_H:
                continue
            for x in range(CANVAS_W):
                px = crop[y, x % fw]
                a = px[3] / 255.0
                if a < 0.05:
                    continue
                arr[ty, x, :3] = (
                    arr[ty, x, :3].astype(np.float32) * (1 - a) + px[:3].astype(np.float32) * a
                ).astype(np.uint8)

    # Weicher Übergang Scene → Lane (obere 8 px)
    for y in range(8):
        t = y / 7
        for x in range(CANVAS_W):
            arr[y, x, :3] = (
                scene_arr[-1, x, :3].astype(np.float32) * (1 - t) + arr[y, x, :3].astype(np.float32) * t
            ).astype(np.uint8)

    return Image.fromarray(arr)


def process_world(theme: str) -> None:
    world_dir = ROOT / "assets" / "pack" / "worlds" / theme
    scene = build_scene(world_dir)
    lane = build_lane(world_dir, scene)
    scene.save(world_dir / "scene.png", optimize=True)
    lane.save(world_dir / "lane.png", optimize=True)
    print(theme, scene.size, lane.size)


def main() -> None:
    for theme in WORLDS:
        process_world(theme)


if __name__ == "__main__":
    main()
