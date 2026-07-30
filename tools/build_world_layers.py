#!/usr/bin/env python3
"""Genau zwei sichtbare Weltebenen – nichts dazwischen:

  1. scene.png  – das einzige Hintergrundbild der Welt
  2. lane.png   – nur Steinmauer darunter (komplette Lane = Mauerwerk)

Die Mauer wird aus den Stein-/Fundament-Assets der jeweiligen Welt gebaut
(assets/pack/props/<welt>/), damit jede Welt ihr eigenes Mauerwerk hat:
Wald mit Moos, Sumpf nass und dunkel, Berge mit Schnee, Feuerlande mit
Vulkanstein und Glut, Ruinen mit Sandstein.

Geometrie bleibt unveraendert: Hintergrund 1290x288, Mauer 1290x72,
Fusslinie der Figuren genau auf der Mauerkrone (GROUND = 288).
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
BRICK_W = 43
BRICK_H = 15

# Mauerwerk-Quellen pro Welt: nur Assets, die tatsaechlich Steinmauern,
# Fundamente oder Steinbloecke zeigen (keine Pflanzen, Figuren, Fahnen).
WALL_SOURCES = {
    "forest": (12, 16, 18, 20, 21, 22, 24),   # bemooste Ruinenmauern
    "swamp":  (0, 8, 13, 15, 18),             # nasses Fundament, Steinbloecke
    "frost":  (0, 5, 6, 18, 19),              # verschneite Steinplatten
    "fire":   (1, 5, 12, 15, 20),             # Vulkanstein mit Glut
    "ruins":  (3, 5, 8, 13, 16, 18),          # Sandsteinbloecke
}

# Feinabstimmung pro Welt: Helligkeit und Saettigung des Mauerwerks.
WALL_TONE = {
    "forest": (1.06, 0.95),   # bemooster Graustein
    "swamp":  (0.84, 1.25),   # nasser, dunkler Sumpfstein
    "frost":  (1.06, 0.95),   # verschneiter Eisstein
    "fire":   (1.3, 1.1),     # Vulkanstein, sonst fast schwarz
    "ruins":  (1.02, 1.0),    # Sandstein
}

# Nur die Feuerlande erhalten vereinzelte Glutsteine. Sandstein ist ebenfalls
# warm und wuerde sonst faelschlich Glut-Akzente bekommen.
GLOW_WORLDS = ("fire",)


def load(path: Path) -> Image.Image | None:
    return Image.open(path).convert("RGBA") if path.exists() else None


def opaque(img: Image.Image) -> Image.Image:
    out = img.convert("RGBA")
    out.putalpha(255)
    return out


def stone_patches(theme: str) -> np.ndarray:
    """Sammelt vollstaendig deckende Steinflaechen aus den Welt-Assets.

    Nur Fenster ohne transparente Pixel werden genommen, damit keine
    Umrisse oder Loecher der Einzelobjekte im Mauerwerk landen.
    """
    props_dir = ROOT / "assets" / "pack" / "props" / theme
    patches: list[np.ndarray] = []
    for index in WALL_SOURCES[theme]:
        img = load(props_dir / f"prop_{index:02d}.png")
        if not img:
            continue
        data = np.asarray(img)
        alpha = data[:, :, 3]
        h, w = alpha.shape
        for y in range(0, h - BRICK_H, 4):
            for x in range(0, w - BRICK_W, 6):
                window_alpha = alpha[y:y + BRICK_H, x:x + BRICK_W]
                if window_alpha.min() < 250:
                    continue
                patch = data[y:y + BRICK_H, x:x + BRICK_W, :3]
                # Sehr dunkle Flaechen (Innenschatten/Durchgaenge) auslassen
                if patch.mean() < 26:
                    continue
                patches.append(patch)
    if not patches:
        raise RuntimeError(f"keine Steinflaechen fuer {theme} gefunden")
    return np.stack(patches).astype(np.float32)


def adjust(patch: np.ndarray, brightness: float, saturation: float) -> np.ndarray:
    grey = patch.mean(axis=2, keepdims=True)
    out = grey + (patch - grey) * saturation
    return out * brightness


def flatten(face: np.ndarray) -> np.ndarray:
    """Nur die Steinkoernung behalten, grosse Hell-Dunkel-Verlaeufe entfernen.

    Die Assets sind isometrisch beleuchtet. Bleibt dieser Verlauf im Ziegel,
    entstehen beim Kacheln sichtbare Diagonalmuster ueber die ganze Mauer.
    """
    base = np.clip(face, 0, 255).astype(np.uint8)
    low = np.asarray(
        Image.fromarray(base, "RGB").filter(ImageFilter.GaussianBlur(5))
    ).astype(np.float32)
    grain = face - low
    return face.mean(axis=(0, 1)) + grain * 0.9


def brick_material(theme: str, count: int = 40) -> tuple[np.ndarray, np.ndarray | None]:
    """Eine ruhige Ziegelflaeche plus optionale Glutfarbe der Welt.

    Die Assets sind isometrische Objekte: einzelne Ausschnitte bringen
    Schraegkanten, Eiszapfen oder Lavaadern mit und ergeben eine unruhige
    Mosaikmauer. Der Median der gleichmaessigsten Flaechen liefert dagegen
    das reine Material der Welt - Farbe und Koernung bleiben, Fremdformen
    verschwinden.
    """
    patches = stone_patches(theme)
    brightness, saturation = WALL_TONE[theme]

    red = patches[:, :, :, 0].mean(axis=(1, 2))
    blue = patches[:, :, :, 2].mean(axis=(1, 2))
    is_glow = (red - blue) > 45

    stone = patches[~is_glow] if (~is_glow).any() else patches
    order = np.argsort(stone.std(axis=(1, 2, 3)))
    calm = stone[order[:count]]
    face = np.clip(flatten(adjust(np.median(calm, axis=0), brightness, saturation)), 0, 255)

    glow = None
    if theme in GLOW_WORLDS and is_glow.any():
        glow = np.clip(
            flatten(adjust(np.median(patches[is_glow], axis=0), brightness, saturation)), 0, 255
        )
    return face, glow


def brick_wall(theme: str, width: int, height: int) -> np.ndarray:
    face_base, glow = brick_material(theme)
    glow_chance = 0.07 if glow is not None else 0.0
    seed = int.from_bytes(hashlib.sha256(theme.encode()).digest()[:4], "big")
    rng = np.random.default_rng(seed)

    wall = np.zeros((height, width, 4), dtype=np.uint8)
    wall[:, :, 3] = 255
    wall[:, :, :3] = (face_base.mean(axis=(0, 1)) * 0.5).astype(np.uint8)  # Fugenfarbe

    for row in range(-(-height // BRICK_H)):
        y0 = row * BRICK_H
        x0 = -(row % 2) * (BRICK_W // 2)
        while x0 < width:
            bx = max(0, x0)
            bw = min(BRICK_W - 1, width - bx)   # 1px senkrechte Fuge
            bh = min(BRICK_H - 1, height - y0)  # 1px waagerechte Fuge
            if bw <= 0 or bh <= 0:
                x0 += BRICK_W
                continue
            src = face_base
            if glow_chance and rng.random() < glow_chance:
                src = face_base * 0.55 + glow * 0.45   # Glutstein als Akzent
            face = src[:bh, :bw] * float(rng.uniform(0.9, 1.1))
            face = face + rng.integers(-4, 5, size=(bh, bw, 1))
            # Leichte Wölbung im Stein: oben heller, unten dunkler
            shade = np.linspace(1.07, 0.9, bh, dtype=np.float32).reshape(bh, 1, 1)
            wall[y0:y0 + bh, bx:bx + bw, :3] = np.clip(face * shade, 0, 255).astype(np.uint8)

            # Kantenlicht oben, Schattenkante unten – Stein wirkt plastisch
            wall[y0, bx:bx + bw, :3] = np.clip(
                wall[y0, bx:bx + bw, :3].astype(np.int16) + 14, 0, 255
            ).astype(np.uint8)
            if bh > 1:
                wall[y0 + bh - 1, bx:bx + bw, :3] = (
                    wall[y0 + bh - 1, bx:bx + bw, :3] * 0.76
                ).astype(np.uint8)
            x0 += BRICK_W

    # Mauer nach unten leicht abdunkeln (Bodenschatten)
    for y in range(height):
        wall[y, :, :3] = (wall[y, :, :3] * (1.0 - 0.24 * (y / max(1, height - 1)))).astype(np.uint8)

    # Deckplatte: helle Mauerkrone = sichtbare Laufkante der Figuren
    wall[0, :, :3] = np.clip(wall[0, :, :3].astype(np.int16) + 38, 0, 255).astype(np.uint8)
    wall[1, :, :3] = np.clip(wall[1, :, :3].astype(np.int16) + 18, 0, 255).astype(np.uint8)
    return wall


def build_world_layers(world_dir: Path) -> tuple[Image.Image, Image.Image]:
    bg = load(world_dir / "scene.png")
    if not bg:
        raise FileNotFoundError(f"scene.png fehlt in {world_dir}")

    # Ebene 1: nur Hintergrund – endet an der Maueroberkante
    scene = opaque(bg).resize((CANVAS_W, SCENE_H), Image.Resampling.NEAREST)

    # Ebene 2: nur Mauerwerk aus den Assets der Welt
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
