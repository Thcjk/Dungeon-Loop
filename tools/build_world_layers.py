#!/usr/bin/env python3
"""Baut die 2-Ebenen-Welt (Hintergrund + Weg) nach dem Pack-Beispiel.

Die Preview-Bilder des Packs sind die verbindliche Vorlage, enthalten aber
eingebrannte Beispiel-Figuren und HUD-Ecken. Deshalb wird die Welt aus den
figurfreien Quellen nachgebaut:

  Ebene 1 (scene.png, 1290x268):
    - bg.png in nativer Groesse (kein Verzerren)
    - darunter ein texturiertes Wiesen-/Bodenband
    - Deko-Objekte aus props/ (Baeume, Felsen, Stuempfe ...) am hinteren
      Wegrand, wie im Beispielbild - rein visuell, keine Kollision

  Ebene 2 (lane.png, 1290x92):
    - durchgehender texturierter Boden
    - Pflasterweg (path.png)
    - Wegrand-Bewuchs (foreground.png) an der Unterkante
"""
from __future__ import annotations

import random
from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
WORLDS = ("forest", "swamp", "frost", "fire", "ruins")
CANVAS_W = 1290
SCENE_H = 268
LANE_H = 92
BG_H = 200          # native Hoehe von bg.png
VERGE_H = SCENE_H - BG_H  # 68px Mittelband zwischen Panorama und Weg

# Figurfreie, organisch geformte Deko pro Welt (Index in props/<welt>/).
# Bewusst keine quadratischen Tile-Bloecke und kein frost/prop_02
# (enthaelt einen gefallenen Ritter).
SCENERY = {
    "forest": (1, 2, 3, 5, 6, 11, 14),
    "swamp": (3, 7, 11, 13, 14, 17, 19, 20, 21),
    "frost": (3, 5, 6, 10, 13, 14),
    "fire": (3, 6, 11, 12, 13, 17, 20),
    "ruins": (3, 5, 6, 8, 11, 15, 21),
}
SCENERY_MAX_H = 96  # groessere Objekte wirken wie Spielobjekte auf dem Weg

# Bodenhelligkeit (Mittelband, Kampfweg) pro Welt: Schnee bleibt hell,
# Glutboden warm, Wald/Sumpf schattig.
GROUND_LIGHT = {
    "forest": (0.55, 0.8),
    "swamp": (0.55, 0.8),
    "frost": (0.82, 1.0),
    "fire": (1.15, 1.45),
    "ruins": (0.62, 0.88),
}


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


def soft_ground(strip: Image.Image, height: int, brightness: float, seed: str) -> Image.Image:
    """Weiches Bodenfeld aus den Farben der Pack-Textur.

    Direktes vertikales Kacheln der schmalen Streifen erzeugte sichtbare
    Wiederholungsbaender. Stattdessen: Farben stark weichzeichnen und mit
    feinem Rauschen beleben - wirkt wie Erde/Bewuchs statt wie Kacheln.
    """
    base = opaque(strip).resize((CANVAS_W, height), Image.Resampling.BILINEAR)
    base = base.filter(ImageFilter.GaussianBlur(12))
    base = darken(base, brightness)
    data = np.asarray(base).astype(np.int16)
    rng = np.random.default_rng(abs(hash(seed)) % (2**32))
    noise = rng.integers(-7, 8, size=(height, CANVAS_W, 1), dtype=np.int16)
    data[:, :, :3] = np.clip(data[:, :, :3] + noise, 0, 255)
    data[:, :, 3] = 255
    return Image.fromarray(data.astype(np.uint8), "RGBA")


def blend_rows(top: Image.Image, bottom: Image.Image, overlap: int) -> None:
    """Weicher vertikaler Uebergang: letzte overlap-Zeilen von top werden in
    die ersten Zeilen von bottom eingeblendet (in-place auf bottom)."""
    ta = np.asarray(top, dtype=np.float32)
    ba = np.asarray(bottom).copy()
    for i in range(overlap):
        t = (i + 1) / (overlap + 1)
        src = ta[top.height - overlap + i, :, :3]
        ba[i, :, :3] = (src * (1 - t) + ba[i, :, :3].astype(np.float32) * t).astype(np.uint8)
    bottom.paste(Image.fromarray(ba, "RGBA"), (0, 0))


def place_scenery(scene: Image.Image, theme: str) -> None:
    """Setzt Deko aus dem Pack an den hinteren Wegrand (nur Hintergrund)."""
    rng = random.Random(theme)
    props_dir = ROOT / "assets" / "pack" / "props" / theme
    indices = SCENERY.get(theme, ())
    if not indices:
        return
    x = rng.randint(30, 110)
    while x < CANVAS_W - 140:
        idx = rng.choice(indices)
        prop = load(props_dir / f"prop_{idx:02d}.png")
        if prop and prop.height <= SCENERY_MAX_H:
            deco = darken(prop, 0.82)
            if rng.random() < 0.5:
                deco = deco.transpose(Image.FLIP_LEFT_RIGHT)
            foot = SCENE_H - rng.randint(0, 6)
            scene.alpha_composite(deco, (x, foot - deco.height))
        x += rng.randint(170, 330)


def build_world_layers(world_dir: Path) -> tuple[Image.Image, Image.Image]:
    src = world_dir / "_build"
    bg = load(src / "bg.png")
    path = load(src / "path.png")
    foreground = load(src / "foreground.png")
    if not bg or not path or not foreground:
        raise FileNotFoundError(f"saubere Weltquellen fehlen in {src}")

    # ---- Ebene 1: Hintergrund ------------------------------------------
    # Wiesen-/Bodenband aus der ruhigen Weg-Textur (die Randtextur enthaelt
    # markante Objekte und wuerde beim Fuellen sichtbare Streifen bilden).
    verge_light, lane_light = GROUND_LIGHT.get(world_dir.name, (0.55, 0.8))
    scene = Image.new("RGBA", (CANVAS_W, SCENE_H))
    scene.paste(opaque(bg), (0, 0))
    verge = soft_ground(foreground, VERGE_H, verge_light, world_dir.name + "-verge")
    blend_rows(opaque(bg), verge, 20)
    scene.paste(verge, (0, BG_H))
    place_scenery(scene, world_dir.name)

    # ---- Ebene 2: Weg / Kampfebene -------------------------------------
    lane = soft_ground(foreground, LANE_H, lane_light, world_dir.name + "-lane")
    blend_rows(scene, lane, 10)
    lane.alpha_composite(path, (0, 20))
    lane.alpha_composite(foreground, (0, LANE_H - foreground.height))
    lane = opaque(lane)
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
