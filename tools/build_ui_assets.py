#!/usr/bin/env python3
"""Crop HUD UI sprites from asset pack sheets."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
UI_OUT = ROOT / "assets" / "pack" / "ui" / "cropped"
PANEL = ROOT / "assets" / "pack" / "ui" / "ui_panel_excerpt.png"
FRAMES = ROOT / "assets" / "pack" / "ui" / "ui_frames_sheet.png"


def save_crop(src: Image.Image, box: tuple[int, int, int, int], name: str) -> None:
    UI_OUT.mkdir(parents=True, exist_ok=True)
    crop = src.crop(box)
    crop.save(UI_OUT / name, optimize=True)
    print(name, crop.size)


def main() -> None:
    panel = Image.open(PANEL).convert("RGBA")
    save_crop(panel, (0, 8, 640, 118), "hud_hp_frame.png")
    save_crop(panel, (0, 118, 640, 228), "hud_mana_frame.png")
    save_crop(panel, (0, 228, 640, 338), "hud_xp_frame.png")
    save_crop(panel, (0, 338, 640, 426), "hud_slots_row.png")

    if FRAMES.exists():
        frames = Image.open(FRAMES).convert("RGBA")
        w, h = frames.size
        save_crop(frames, (0, 0, min(320, w), min(200, h)), "hud_panel_frame.png")


if __name__ == "__main__":
    main()
