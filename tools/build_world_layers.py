#!/usr/bin/env python3
"""Rebuild 2-layer world assets purely from preview.png – no midband/path/ground stitch."""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
WORLDS = ("forest", "swamp", "frost", "fire", "ruins")
CANVAS_W = 1290
CANVAS_H = 360
BG_H = 268
LANE_H = CANVAS_H - BG_H  # 92


def patch_fill_center(
    arr: np.ndarray,
    x0: int,
    x1: int,
    src_x0: int,
    src_x1: int,
    y0: int = 0,
) -> np.ndarray:
    out = arr.copy()
    h = out.shape[0]
    pw = src_x1 - src_x0
    if pw <= 0:
        return out
    y0 = max(0, min(h, y0))
    for y in range(y0, h):
        for x in range(x0, x1):
            out[y, x] = out[y, src_x0 + (x - x0) % pw]
    return out


def clean_baked_hud(arr: np.ndarray) -> np.ndarray:
    """Preview hat HP-Leisten in den Ecken – durch Wald ersetzen."""
    h, w, _ = arr.shape
    ref_y = 96
    for y in range(0, 58):
        for x in range(0, 220):
            sx = 420 + (x % 140)
            sy = min(h - 1, ref_y + y // 2)
            arr[y, x] = arr[sy, sx]
        for x in range(w - 220, w):
            sx = 730 + (x % 140)
            sy = min(h - 1, ref_y + y // 2)
            arr[y, x] = arr[sy, sx]
    return arr


def build_from_preview(preview: Image.Image) -> tuple[Image.Image, Image.Image]:
    if preview.size != (CANVAS_W, CANVAS_H):
        preview = preview.resize((CANVAS_W, CANVAS_H), Image.NEAREST)

    px = np.array(preview)
    x0, x1 = int(CANVAS_W * 0.22), int(CANVAS_W * 0.78)
    src0, src1 = 55, 310

    scene_arr = px[0:BG_H, :, :].copy()
    scene_arr = clean_baked_hud(scene_arr)
    scene_arr = patch_fill_center(scene_arr, x0, x1, src0, src1, int(BG_H * 0.62))

    lane_arr = px[BG_H:CANVAS_H, :, :].copy()
    lane_arr = patch_fill_center(lane_arr, x0, x1, src0, src1, 0)
    lane_arr[0] = scene_arr[-1]

    return Image.fromarray(scene_arr), Image.fromarray(lane_arr)


def process_world(theme: str) -> None:
    world_dir = ROOT / "assets" / "pack" / "worlds" / theme
    preview_path = world_dir / "preview.png"
    if not preview_path.exists():
        print("skip", theme)
        return
    scene, lane = build_from_preview(Image.open(preview_path).convert("RGBA"))
    scene.save(world_dir / "scene.png", optimize=True)
    lane.save(world_dir / "lane.png", optimize=True)
    print(theme, scene.size, lane.size)


def main() -> None:
    for theme in WORLDS:
        process_world(theme)


if __name__ == "__main__":
    main()
