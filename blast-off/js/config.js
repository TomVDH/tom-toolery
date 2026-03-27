/* config.js — Foundation module for Blast Off
 * Creates the BO namespace and populates all constants + shared mutable state.
 */
window.BO = {};

// --- Canvas dimensions ---
BO.W = 620;
BO.H = 640;

// --- Physics ---
BO.GRAVITY      = 0.15;     // lighter than Flappy (0.26) — jet must counteract
BO.JET_FORCE    = 0.32;     // recoil acceleration per frame while firing
BO.MAX_SPEED    = 6;        // terminal velocity in any direction
BO.DAMPING      = 0.985;    // air resistance
BO.GROUND_H     = 48;
BO.CEILING_Y    = 10;

// --- Scrolling / buildings ---
BO.SCROLL_SPEED   = 1.5;    // starting horizontal scroll speed
BO.BUILDING_MIN_W = 90;     // min building width
BO.BUILDING_MAX_W = 160;    // max building width
BO.GAP_MIN        = 160;    // min open sky between buildings
BO.GAP_MAX        = 240;    // max open sky between buildings
BO.PIPE_WIDTH     = 56;     // legacy compat for building renderer

// --- Grime ---
BO.GRIME_CELL     = 18;     // grime cell size in pixels
BO.GRIME_DENSITY  = 0.65;   // starting % of cells that are grimy

// --- Death sequence timing (frames) ---
BO.DEATH_FLASH_DUR = 15;
BO.DIED_FADE_IN    = 120;
BO.DIED_HOLD       = 190;
BO.DIED_FADE_OUT   = 60;
BO.DIED_TOTAL      = BO.DEATH_FLASH_DUR + BO.DIED_FADE_IN + BO.DIED_HOLD + BO.DIED_FADE_OUT;
BO.SCORE_DELAY     = 20;

// --- Ready countdown ---
BO.READY_MS = 3000; // 3 seconds

// --- Far-city tile width ---
BO.FAR_TILE_W = 320;

// --- Pixel bitmap font (5x5 per character) — same as Flappy Drone ---
BO.PX = {
  A:[0b01110,0b10001,0b11111,0b10001,0b10001],
  B:[0b11110,0b10001,0b11110,0b10001,0b11110],
  C:[0b01111,0b10000,0b10000,0b10000,0b01111],
  D:[0b11110,0b10001,0b10001,0b10001,0b11110],
  E:[0b11111,0b10000,0b11110,0b10000,0b11111],
  F:[0b11111,0b10000,0b11110,0b10000,0b10000],
  G:[0b01111,0b10000,0b10011,0b10001,0b01111],
  H:[0b10001,0b10001,0b11111,0b10001,0b10001],
  I:[0b11111,0b00100,0b00100,0b00100,0b11111],
  J:[0b00111,0b00010,0b00010,0b10010,0b01100],
  K:[0b10001,0b10010,0b11100,0b10010,0b10001],
  L:[0b10000,0b10000,0b10000,0b10000,0b11111],
  M:[0b10001,0b11011,0b10101,0b10001,0b10001],
  N:[0b10001,0b11001,0b10101,0b10011,0b10001],
  O:[0b01110,0b10001,0b10001,0b10001,0b01110],
  P:[0b11110,0b10001,0b11110,0b10000,0b10000],
  Q:[0b01110,0b10001,0b10101,0b10010,0b01101],
  R:[0b11110,0b10001,0b11110,0b10010,0b10001],
  S:[0b01111,0b10000,0b01110,0b00001,0b11110],
  T:[0b11111,0b00100,0b00100,0b00100,0b00100],
  U:[0b10001,0b10001,0b10001,0b10001,0b01110],
  V:[0b10001,0b10001,0b10001,0b01010,0b00100],
  W:[0b10001,0b10001,0b10101,0b11011,0b10001],
  X:[0b10001,0b01010,0b00100,0b01010,0b10001],
  Y:[0b10001,0b01010,0b00100,0b00100,0b00100],
  Z:[0b11111,0b00010,0b00100,0b01000,0b11111],
  '-':[0b00000,0b00000,0b11111,0b00000,0b00000],
  '.':[0b00000,0b00000,0b00000,0b00000,0b00100],
  '!':[0b00100,0b00100,0b00100,0b00000,0b00100],
  ' ':[0b00000,0b00000,0b00000,0b00000,0b00000],
};

// --- Background stars ---
BO.bgStars = Array.from({ length: 55 }, () => ({
  x: Math.random() * BO.W,
  y: Math.random() * (BO.H * 0.6),
  r: Math.random() * 1.1 + 0.3,
  phase: Math.random() * Math.PI * 2
}));

// --- Far-city buildings ---
BO.farBuildings = [
  ...Array.from({ length: 8 }, (_, i) => ({
    x: i * 40 + 5,
    h: 70 + Math.sin(i * 2.1 + 0.5) * 40 + Math.cos(i * 3.7) * 20,
    w: 16 + ((i * 5 + 2) % 4) * 3,
    layer: 'back'
  })),
  ...Array.from({ length: 14 }, (_, i) => ({
    x: i * 23 + ((i * 3) % 7),
    h: 20 + Math.sin(i * 2.9 + 1.1) * 15 + Math.cos(i * 4.3) * 10,
    w: 16 + ((i * 7 + 1) % 6) * 2,
    layer: 'front'
  }))
];

// --- Shared mutable state ---
BO.globalTick   = 0;
BO.particles    = [];
BO.fireworks    = [];
BO.fwTimer      = 0;
BO.screenShake  = 0;
BO.flashAlpha   = 0;
BO.deathText    = 'YOU DIED';

// --- Clouds ---
BO.clouds = Array.from({ length: 5 }, (_, i) => ({
  x: Math.random() * 620,
  y: 50 + Math.random() * 160,
  w: 80 + Math.random() * 100,
  speed: 0.008 + Math.random() * 0.015,
  opacity: 0.015 + Math.random() * 0.02
}));
