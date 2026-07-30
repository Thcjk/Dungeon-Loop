#!/usr/bin/env python3
"""Genau zwei sichtbare Weltebenen – nichts dazwischen:

  1. scene.png  – das einzige Hintergrundbild der Welt
  2. lane.png   – nur die Steinmauer darunter (komplette Lane = Mauerwerk)

Die Mauer wird als unregelmäßiges Mauerwerk aus den Stein-/Fundament-
Assets der jeweiligen Welt gebaut und mit welttypischen Akzenten
versehen (Moos, Schleim, Schnee/Eis, Lava, Sandstein).

Geometrie bleibt unverändert: Hintergrund 1290x288, Mauer 1290x72,
Fußlinie der Figuren genau auf der Mauerkrone (GROUND = 288).
"""
from __future__ import annotations

import hashlib
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
WORLDS = ("forest", "swamp", "frost", "fire", "ruins")
CANVAS_W = 1290
SCENE_H = 288
LANE_H = 72

# Stein-/Fundament-Quellen pro Welt (keine Pflanzen, Figuren, Feuerstellen).
WALL_SOURCES = {
    "forest": (11, 12, 15, 16, 18, 19, 20, 21, 22, 23, 24),
    "swamp":  (0, 2, 8, 13, 15, 16, 18),
    "frost":  (0, 2, 5, 6, 18, 19),
    "fire":   (1, 2, 5, 10, 15, 17, 20),
    "ruins":  (1, 2, 3, 5, 6, 8, 13, 16, 18),
}

# Helligkeit / Sättigung – lesbares Mauerwerk, Farben der Welt.
WALL_TONE = {
    "forest": (1.28, 1.12),
    "swamp":  (1.12, 1.28),
    "frost":  (1.2, 1.0),
    "fire":   (1.38, 1.18),
    "ruins":  (1.22, 1.12),
}

GLOW_WORLDS = ("fire",)

WALL_CAP = {
    "forest": (104, 128, 74),
    "swamp":  (86, 104, 66),
    "frost":  (214, 230, 242),
    "fire":   (225, 96, 40),
    "ruins":  (208, 172, 118),
}

MORTAR = {
    "forest": (26, 28, 22),
    "swamp":  (18, 22, 16),
    "frost":  (40, 50, 62),
    "fire":   (14, 9, 8),
    "ruins":  (70, 52, 34),
}


def load(path: Path) -> Image.Image | None:
    return Image.open(path).convert("RGBA") if path.exists() else None


def opaque(img: Image.Image) -> Image.Image:
    out = img.convert("RGBA")
    out.putalpha(255)
    return out


def scene_bottom_tint(theme: str) -> np.ndarray:
    """Mittlere Farbe am unteren Rand der Szene – für harmonische Mauerfarbe."""
    scene = load(ROOT / "assets" / "pack" / "worlds" / theme / "scene.png")
    if not scene:
        return np.array(MORTAR[theme], dtype=np.float32)
    data = np.asarray(scene.convert("RGB"), dtype=np.float32)
    return data[-18:, :, :].mean(axis=(0, 1))


def stone_patches(theme: str) -> list[np.ndarray]:
    """Sammelt deckende Steinflächen in mehreren Blockgrößen."""
    props_dir = ROOT / "assets" / "pack" / "props" / theme
    patches: list[np.ndarray] = []
    sizes = ((14, 36, 3, 5), (16, 48, 4, 7), (12, 28, 3, 4), (18, 42, 5, 6))
    for index in WALL_SOURCES[theme]:
        img = load(props_dir / f"prop_{index:02d}.png")
        if not img:
            continue
        data = np.asarray(img)
        alpha = data[:, :, 3]
        h, w = alpha.shape
        for bh, bw, step_y, step_x in sizes:
            if h <= bh or w <= bw:
                continue
            for y in range(0, h - bh, step_y):
                for x in range(0, w - bw, step_x):
                    window_alpha = alpha[y:y + bh, x:x + bw]
                    if window_alpha.min() < 245:
                        continue
                    patch = data[y:y + bh, x:x + bw, :3].astype(np.float32)
                    mean = float(patch.mean())
                    if mean < 20 or mean > 205:
                        continue
                    r, g, b = patch.mean(axis=(0, 1))
                    # Reine Glut / reines Laub auslassen (außer Feuerwelt-Glut)
                    if theme != "fire" and (r - b) > 75 and r > 145:
                        continue
                    if theme == "forest" and g > r + 48 and g > b + 40 and g > 95:
                        continue
                    std = float(patch.std())
                    if std < 3.5 or std > 58:
                        continue
                    patches.append(patch)
    if not patches:
        raise RuntimeError(f"keine Steinflächen für {theme} gefunden")
    return patches


def adjust(patch: np.ndarray, brightness: float, saturation: float) -> np.ndarray:
    grey = patch.mean(axis=2, keepdims=True)
    out = grey + (patch - grey) * saturation
    return out * brightness


def flatten(face: np.ndarray) -> np.ndarray:
    """Iso-Beleuchtungsverläufe entfernen, Körnung behalten."""
    base = np.clip(face, 0, 255).astype(np.uint8)
    low = np.asarray(
        Image.fromarray(base, "RGB").filter(ImageFilter.GaussianBlur(5))
    ).astype(np.float32)
    grain = face - low
    return face.mean(axis=(0, 1)) + grain * 0.88


def prepare_blocks(theme: str) -> tuple[list[np.ndarray], list[np.ndarray]]:
    patches = stone_patches(theme)
    brightness, saturation = WALL_TONE[theme]
    tint = scene_bottom_tint(theme)
    # Mauer leicht zur Szenenfarbe ziehen
    stones: list[np.ndarray] = []
    glows: list[np.ndarray] = []
    for patch in patches:
        red = patch[:, :, 0].mean()
        blue = patch[:, :, 2].mean()
        face = flatten(adjust(patch, brightness, saturation))
        # Leichte Harmonisierung – Szenenunterkante ist oft zu dunkel zum Vollmischen
        face = face * 0.9 + tint.reshape(1, 1, 3) * 0.1
        # Mindesthelligkeit, damit die Mauer nicht im Schwarzen verschwindet
        face_mean = float(face.mean())
        if face_mean < 38:
            face = face * (42 / max(1.0, face_mean))
        face = np.clip(face, 0, 255)
        if theme in GLOW_WORLDS and (red - blue) > 45:
            glows.append(face)
        else:
            stones.append(face)
    if not stones:
        stones = glows[:]
    # Ruhigere Blöcke zuerst, aber Vielfalt behalten
    stones.sort(key=lambda p: float(p.std()))
    return stones, glows


def apply_accents(wall: np.ndarray, theme: str, rng: np.random.Generator) -> None:
    height, width = wall.shape[:2]
    if theme == "forest":
        for _ in range(120):
            x = int(rng.integers(0, width))
            length = int(rng.integers(4, 16))
            for i in range(length):
                y = 3 + i
                if y >= height:
                    break
                moss = np.array(
                    [70 + rng.integers(0, 40), 110 + rng.integers(0, 42), 48 + rng.integers(0, 20)],
                    dtype=np.float32,
                )
                s = 0.55 * (1 - i / length)
                wall[y, x, :3] = np.clip(wall[y, x, :3] * (1 - s) + moss * s, 0, 255)
                if x + 1 < width and rng.random() < 0.4:
                    wall[y, x + 1, :3] = np.clip(
                        wall[y, x + 1, :3] * (1 - s * 0.7) + moss * s * 0.7, 0, 255
                    )
        for _ in range(55):
            x = int(rng.integers(0, width - 8))
            y0 = int(rng.integers(6, height - 7))
            for dy in range(5):
                for dx in range(7):
                    if rng.random() < 0.42:
                        continue
                    moss = np.array([78, 118 + rng.integers(0, 30), 52], dtype=np.float32)
                    wall[y0 + dy, x + dx, :3] = np.clip(
                        wall[y0 + dy, x + dx, :3] * 0.48 + moss * 0.52, 0, 255
                    )
    elif theme == "swamp":
        for _ in range(100):
            x = int(rng.integers(0, width))
            length = int(rng.integers(5, 20))
            for i in range(length):
                y = 3 + i
                if y >= height:
                    break
                slime = np.array([64, 90 + rng.integers(0, 40), 36], dtype=np.float32)
                s = 0.52 * (1 - i / length)
                wall[y, x, :3] = np.clip(wall[y, x, :3] * (1 - s) + slime * s, 0, 255)
        for _ in range(60):
            x = int(rng.integers(0, width - 10))
            y0 = int(rng.integers(10, height - 6))
            for dy in range(4):
                for dx in range(9):
                    wall[y0 + dy, x + dx, :3] = wall[y0 + dy, x + dx, :3] * 0.7
    elif theme == "frost":
        for x in range(width):
            hump = 2 + int(1.7 + np.sin(x * 0.055) * 1.5 + np.sin(x * 0.02) * 1.1)
            for y in range(min(hump, height)):
                snow = np.array(
                    [205 + rng.integers(0, 30), 222 + rng.integers(0, 24), 236 + rng.integers(0, 18)],
                    dtype=np.float32,
                )
                t = 1 - y / max(1, hump)
                wall[y, x, :3] = np.clip(wall[y, x, :3] * (1 - 0.9 * t) + snow * (0.9 * t), 0, 255)
        for _ in range(75):
            x = int(rng.integers(0, width))
            length = int(rng.integers(4, 12))
            for i in range(length):
                y = 4 + i
                if y >= height:
                    break
                ice = np.array([168, 204 + rng.integers(0, 26), 228], dtype=np.float32)
                s = 0.68 * (1 - i / length)
                wall[y, x, :3] = np.clip(wall[y, x, :3] * (1 - s) + ice * s, 0, 255)
        for _ in range(40):
            x = int(rng.integers(0, width - 6))
            y0 = int(rng.integers(12, height - 5))
            ice = np.array([148, 178, 198], dtype=np.float32)
            for dy in range(3):
                for dx in range(5):
                    wall[y0 + dy, x + dx, :3] = np.clip(
                        wall[y0 + dy, x + dx, :3] * 0.48 + ice * 0.52, 0, 255
                    )
    elif theme == "fire":
        for _ in range(110):
            x = int(rng.integers(0, width))
            y0 = int(rng.integers(6, height - 2))
            length = int(rng.integers(5, 18))
            horizontal = rng.random() < 0.58
            for i in range(length):
                xx = x + i if horizontal else x
                yy = y0 if horizontal else y0 + i
                if xx >= width or yy >= height:
                    break
                lava = np.array(
                    [220 + rng.integers(0, 35), 72 + rng.integers(0, 55), 20 + rng.integers(0, 18)],
                    dtype=np.float32,
                )
                wall[yy, xx, :3] = np.clip(lava, 0, 255)
        for _ in range(28):
            x = int(rng.integers(0, width - 20))
            y0 = int(rng.integers(8, height - 12))
            bw = int(rng.integers(12, 22))
            bh = int(rng.integers(8, 12))
            glow = np.array([125, 48, 22], dtype=np.float32)
            for dy in range(bh):
                for dx in range(bw):
                    wall[y0 + dy, x + dx, :3] = np.clip(
                        wall[y0 + dy, x + dx, :3] * 0.42 + glow * 0.58, 0, 255
                    )
    elif theme == "ruins":
        for _ in range(50):
            x = int(rng.integers(0, width))
            y0 = int(rng.integers(4, height - 2))
            length = int(rng.integers(6, 22))
            for i in range(length):
                y = y0 + i
                if y >= height:
                    break
                wall[y, x, :3] = wall[y, x, :3] * 0.56
        sand = np.array([214, 178, 122], dtype=np.float32)
        for x in range(width):
            wall[0, x, :3] = np.clip(wall[0, x, :3] * 0.28 + sand * 0.72, 0, 255)
            wall[1, x, :3] = np.clip(wall[1, x, :3] * 0.48 + sand * 0.52, 0, 255)
            if rng.random() < 0.12:
                wall[2, x, :3] = np.clip(wall[2, x, :3] * 0.65 + sand * 0.35, 0, 255)


def brick_wall(theme: str, width: int, height: int) -> np.ndarray:
    """Grobes Zyklop-Mauerwerk aus Welt-Steinen + starke Themenakzente."""
    stones, glows = prepare_blocks(theme)
    seed = int.from_bytes(hashlib.sha256(f"wall-v142c-{theme}".encode()).digest()[:4], "big")
    rng = np.random.default_rng(seed)
    mortar = np.clip(np.array(MORTAR[theme], dtype=np.float32) * 1.35, 0, 255)

    wall = np.zeros((height, width, 4), dtype=np.uint8)
    wall[:, :, 3] = 255
    wall[:, :, :3] = mortar.astype(np.uint8)

    # Wenige hohe Lagen mit großen Blöcken – weniger Ziegelraster
    courses: list[int] = []
    remaining = height
    while remaining > 0:
        if remaining > 28:
            courses.append(int(rng.integers(20, 28)))
        else:
            courses.append(remaining)
        remaining -= courses[-1]

    y = 0
    for row, bh in enumerate(courses):
        x = -int((row % 2) * rng.integers(18, 40))
        while x < width:
            src = stones[int(rng.integers(0, min(len(stones), 120)))]
            if glows and theme in GLOW_WORLDS and rng.random() < 0.12:
                src = glows[int(rng.integers(0, len(glows)))]
            bw = int(rng.integers(52, 96))
            gap = 2
            bx = max(0, x)
            bw_draw = min(bw - gap, width - bx)
            bh_draw = min(bh - gap, height - y)
            if bw_draw <= 4 or bh_draw <= 4:
                x += bw
                continue
            sh, sw = src.shape[:2]
            sy = int(rng.integers(0, max(1, sh)))
            sx = int(rng.integers(0, max(1, sw)))
            face = np.zeros((bh_draw, bw_draw, 3), dtype=np.float32)
            for yy in range(bh_draw):
                for xx in range(bw_draw):
                    face[yy, xx] = src[(sy + yy // 2) % sh, (sx + xx // 2) % sw]
            face = face * float(rng.uniform(0.92, 1.15))
            face = face + rng.integers(-6, 7, size=(bh_draw, bw_draw, 1))
            vy = np.linspace(1.14, 0.78, bh_draw, dtype=np.float32).reshape(bh_draw, 1, 1)
            vx = np.linspace(1.08, 0.9, bw_draw, dtype=np.float32).reshape(1, bw_draw, 1)
            edge = np.ones((bh_draw, bw_draw, 1), dtype=np.float32)
            edge[:2] *= 1.12
            edge[-2:] *= 0.72
            edge[:, :2] *= 1.08
            edge[:, -2:] *= 0.8
            wall[y:y + bh_draw, bx:bx + bw_draw, :3] = np.clip(
                face * vy * vx * edge, 0, 255
            ).astype(np.uint8)
            x += bw
        y += bh

    for yy in range(height):
        wall[yy, :, :3] = (
            wall[yy, :, :3] * (1.0 - 0.16 * (yy / max(1, height - 1)))
        ).astype(np.uint8)

    lift = {
        "forest": 1.4,
        "swamp": 1.32,
        "frost": 1.18,
        "fire": 1.2,
        "ruins": 1.25,
    }.get(theme, 1.0)
    wall[:, :, :3] = np.clip(wall[:, :, :3].astype(np.float32) * lift, 0, 255).astype(np.uint8)

    cap = np.asarray(WALL_CAP[theme], dtype=np.float32)
    for yy in range(5):
        t = (5 - yy) / 5
        wall[yy, :, :3] = np.clip(
            wall[yy, :, :3] * (1 - 0.7 * t) + cap * (0.7 * t), 0, 255
        ).astype(np.uint8)

    apply_accents(wall, theme, rng)

    # Extra welttypische Krone / Flächenidentität
    if theme == "forest":
        for _ in range(160):
            xx = int(rng.integers(0, width))
            length = int(rng.integers(6, 22))
            for i in range(length):
                yy = 2 + i
                if yy >= height:
                    break
                moss = np.array(
                    [68 + rng.integers(0, 45), 115 + rng.integers(0, 45), 46 + rng.integers(0, 22)],
                    dtype=np.float32,
                )
                s = 0.62 * (1 - i / length)
                wall[yy, xx, :3] = np.clip(wall[yy, xx, :3] * (1 - s) + moss * s, 0, 255)
    elif theme == "swamp":
        for _ in range(130):
            xx = int(rng.integers(0, width))
            length = int(rng.integers(7, 24))
            for i in range(length):
                yy = 2 + i
                if yy >= height:
                    break
                slime = np.array([60, 100 + rng.integers(0, 45), 40], dtype=np.float32)
                s = 0.58 * (1 - i / length)
                wall[yy, xx, :3] = np.clip(wall[yy, xx, :3] * (1 - s) + slime * s, 0, 255)
    elif theme == "frost":
        for xx in range(width):
            hump = 3 + int(2.2 + np.sin(xx * 0.04) * 1.8 + np.sin(xx * 0.017) * 1.4)
            for yy in range(min(hump, height)):
                snow = np.array(
                    [215 + rng.integers(0, 30), 228 + rng.integers(0, 22), 240 + rng.integers(0, 15)],
                    dtype=np.float32,
                )
                t = 1 - yy / max(1, hump)
                wall[yy, xx, :3] = np.clip(
                    wall[yy, xx, :3] * (1 - 0.92 * t) + snow * (0.92 * t), 0, 255
                )
    elif theme == "fire":
        for _ in range(90):
            xx = int(rng.integers(0, width))
            yy0 = int(rng.integers(8, height - 2))
            length = int(rng.integers(8, 28))
            horiz = rng.random() < 0.5
            for i in range(length):
                x = xx + (i if horiz else 0)
                y = yy0 + (0 if horiz else i)
                if x >= width or y >= height:
                    break
                lava = np.array(
                    [230 + rng.integers(0, 25), 85 + rng.integers(0, 60), 24], dtype=np.float32
                )
                wall[y, x, :3] = np.clip(lava, 0, 255)
    elif theme == "ruins":
        sand = np.array([218, 182, 126], dtype=np.float32)
        for xx in range(width):
            wall[0, xx, :3] = np.clip(wall[0, xx, :3] * 0.2 + sand * 0.8, 0, 255)
            wall[1, xx, :3] = np.clip(wall[1, xx, :3] * 0.4 + sand * 0.6, 0, 255)
            if rng.random() < 0.08:
                for i in range(int(rng.integers(2, 7))):
                    if 2 + i < height:
                        wall[2 + i, xx, :3] = np.clip(
                            wall[2 + i, xx, :3] * 0.55 + sand * 0.45, 0, 255
                        )

    return wall


def build_world_layers(world_dir: Path) -> tuple[Image.Image, Image.Image]:
    bg = load(world_dir / "scene.png")
    if not bg:
        raise FileNotFoundError(f"scene.png fehlt in {world_dir}")

    scene = opaque(bg).resize((CANVAS_W, SCENE_H), Image.Resampling.NEAREST)
    lane = Image.fromarray(brick_wall(world_dir.name, CANVAS_W, LANE_H), "RGBA")
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
