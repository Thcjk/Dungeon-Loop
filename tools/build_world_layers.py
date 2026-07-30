#!/usr/bin/env python3
"""Build 2-layer world assets from preview.png (scene + lane, no baked characters)."""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
WORLDS = ("forest", "swamp", "frost", "fire", "ruins")
CANVAS_W = 1290
BG_H = 268
LANE_H = 92


def load_rgba(path: Path) -> Image.Image:
    return Image.open(path).convert("RGBA")


def patch_fill_center(arr: np.ndarray, x0: int, x1: int, src_x0: int, src_x1: int, y0: int = 0) -> np.ndarray:
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


def overlay_path(lane_arr: np.ndarray, world_dir: Path) -> np.ndarray:
    path_file = world_dir / "path.png"
    if not path_file.exists():
        return lane_arr
    path = np.array(Image.open(path_file).convert("RGBA"))
    if path.shape[0] > path.shape[1]:
        path = np.rot90(path, k=-1)
    ph, pw = path.shape[:2]
    y_off = max(0, (LANE_H - ph) // 2 - 6)
    for py in range(min(ph, LANE_H - y_off)):
        ty = y_off + py
        for x in range(CANVAS_W):
            px = path[py, x % pw]
            a = px[3] / 255.0
            if a <= 0.02:
                continue
            out = lane_arr[ty, x].astype(float)
            src = px[:3].astype(float)
            lane_arr[ty, x, :3] = (out[:3] * (1 - a) + src * a).astype(np.uint8)
            lane_arr[ty, x, 3] = 255
    return lane_arr


def build_scene_lane(preview: Image.Image, world_dir: Path) -> tuple[Image.Image, Image.Image]:
    if preview.size != (CANVAS_W, 360):
        preview = preview.resize((CANVAS_W, 360), Image.NEAREST)

    x0, x1 = int(CANVAS_W * 0.30), int(CANVAS_W * 0.70)
    src0, src1 = 90, 360
    top_h = 168
    bottom_h = BG_H - top_h

    top_arr = np.array(preview.crop((0, 0, CANVAS_W, top_h)))

    mid_path = world_dir / "midband.png"
    if mid_path.exists():
        mid = Image.open(mid_path).convert("RGBA")
        mw, mh = mid.size
        scale = CANVAS_W / mw
        mid_scaled = mid.resize((CANVAS_W, max(bottom_h, int(mh * scale))), Image.NEAREST)
        mid_arr = np.array(mid_scaled)
        src_y = max(0, mid_arr.shape[0] - bottom_h)
        bottom_arr = mid_arr[src_y:src_y + bottom_h, :, :]
        if bottom_arr.shape[0] < bottom_h:
            pad = np.zeros((bottom_h - bottom_arr.shape[0], CANVAS_W, 4), dtype=np.uint8)
            bottom_arr = np.vstack([pad, bottom_arr])
    else:
        bottom_arr = np.array(preview.crop((0, top_h, CANVAS_W, BG_H)))
        bottom_arr = patch_fill_center(bottom_arr, x0, x1, src0, src1, int(bottom_h * 0.35))

    bg_arr = np.vstack([top_arr, bottom_arr[:, :, :4] if bottom_arr.shape[2] == 4 else bottom_arr])
    scene = Image.fromarray(bg_arr.astype(np.uint8))

    lane_arr = np.array(preview.crop((0, BG_H, CANVAS_W, BG_H + LANE_H)))
    lane_arr = patch_fill_center(lane_arr, x0, x1, src0, src1, 0)
    lane_arr = overlay_path(lane_arr, world_dir)
    lane = Image.fromarray(lane_arr)

    return scene, lane


def process_world(theme: str) -> None:
    world_dir = ROOT / "assets" / "pack" / "worlds" / theme
    preview_path = world_dir / "preview.png"
    if not preview_path.exists():
        print("skip", theme, "- no preview")
        return

    preview = load_rgba(preview_path)
    scene, lane = build_scene_lane(preview, world_dir)
    scene.save(world_dir / "scene.png", optimize=True)
    lane.save(world_dir / "lane.png", optimize=True)
    print(theme, "scene", scene.size, "lane", lane.size)


def main() -> None:
    for theme in WORLDS:
        process_world(theme)


if __name__ == "__main__":
    main()
