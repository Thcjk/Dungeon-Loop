/* Art Remake v2 – Premium pixel sprites (projectiles, FX, pickups, decor)
   Same keys & dimensions as before – gameplay hitboxes unchanged. */

(function () {
  "use strict";

  /** Overrides applied to global SPRITES after script.js loads (if hook present) */
  const VISUAL_SPRITE_PATCH = {
    projectile_arrow: [
      "........K",".......WK","......WxK",".KYEYEYWK","......WxK",".......WK","..K...K.."
    ],
    projectile_fire: [
      "..K..",".fof.",".fff.",".fef.","..K.."
    ],
    slash: [
      "...K...","..KwK..",".KwwwK.","..KwK..","...K..."
    ],
    enemy_slash: [
      "...o...","..fof..",".foooof.","..fof..","...o..."
    ],
    coin: [
      "..K..",".KwK.","KyWyK",".KwK.","..K.."
    ],
    cross: ["..K..",".KwK.","KwwwK",".KwK.","..K.."],
    moon: ["..KwK.",".KwwwK",".KwwwK","..KwK."],
    firefly: ["..K..",".QyQ.","..K.."],
    smoke_puff: ["..K..",".KXK.","..K.."],
    torch: [
      ".....K.....","....KffK....","...KffffK...","..KffffffK..",
      "...KffffK...","....KyyK....","....KDDK....","....KDDK....","....KDDK...."
    ],
    mushroom: [
      ".....K.....","...KRRRRK...","..KRWwwWRK..",".KRWwwwwWRK.",
      "..KWWWWWWK..","...KWWWWK...","....KWWK....","....KDDK....","....KDDK...."
    ],
    glow_mushroom: [
      ".....K.....","...KQQQQK...","..KQwyywQK..",".KQwyyyywQK.",
      "..KQQQQQQK..","...KQQQQK...","....KQQK....","....KDDK...."
    ],
    crystal: [
      "....KiK....","...KiBiK...","..KiBBiBK..",".KiBBBBiBK..",
      ".KiBiBiBiK.","..KiBBiBK..","...KiBK...."
    ],
    cave_crystal: [
      "....KiK....","...KiBiK...","..KiBBiBK..",".KiBBBBiBK..",
      ".KiBiBiBiK.","..KiBBiBK..","...KiBK...."
    ]
  };

  window.VISUAL_SPRITE_PATCH = VISUAL_SPRITE_PATCH;

  /** Call once after SPRITES exists to apply visual overrides */
  window.applyVisualSpritePatch = function applyVisualSpritePatch() {
    if (typeof SPRITES === "undefined") return;
    Object.keys(VISUAL_SPRITE_PATCH).forEach((k) => {
      SPRITES[k] = VISUAL_SPRITE_PATCH[k];
    });
  };
})();
