# Blast Off — Powerwash Drone Minigame

## Context

Spinoff #1 from the Flappy Drone game. The company's drones include powerwashing capability — this game turns that into a side-scrolling arcade game where the water jet is both your weapon (cleaning buildings) AND your movement system (recoil thrust). Built with the same zero-dependency vanilla JS + Canvas 2D approach as Flappy Drone.

## Core Concept

**The jet IS your thrust.** There is no flap button. You aim a water jet with your mouse/finger and hold to fire. The recoil pushes the drone in the opposite direction (Newton's third law). Spray down = fly up. Spray left = drift right. This creates a natural tension: cleaning buildings (aiming sideways/up) makes flying harder, while staying aloft (aiming down) doesn't earn points.

### Gameplay Loop
1. Drone auto-scrolls right through a cyberpunk city (same aesthetic as Flappy Drone)
2. Buildings scroll past with **grime patches** (dirty rectangles) on their facades
3. Player aims water jet with mouse/touch, holds click to fire
4. Water stream cleans grime on contact → score points
5. Jet recoil pushes drone opposite to aim → movement system
6. Gravity pulls drone down constantly
7. Crash into building/ground/ceiling → death
8. Progressive difficulty: faster scrolling, more grime to clean, tighter spaces

### Why It Works
- **Risk/reward**: Spray buildings = points but destabilizes flight. Spray down = stable flight but no points
- **Skill ceiling**: Expert players learn to chain spray patterns that clean AND navigate simultaneously
- **Satisfying**: Powerwashing is inherently satisfying. Grime disappearing in real-time feels great

## Scrolling & Layout

**Horizontal scroll** (same as Flappy Drone). Buildings come from the right. But instead of pipe-pairs with gaps, buildings are wider and have open sky between them. The drone flies in the airspace and sprays building facades as they pass.

Building layout per "wave":
```
 ┌──────┐         ┌──────┐
 │GRIME │  open   │GRIME │
 │██░░██│  sky    │░░██░░│
 │░░██░░│ (fly    │██░░██│
 │██░░██│  here)  │░░██░░│
 └──────┘         └──────┘
  ground ─────────── ground
```

Buildings are solid obstacles. The open sky between them is where you fly. Grime patches cover the building facades (the side facing the open area).

## File Structure

Mirror Flappy Drone's modular pattern:

```
blast-off/
├── index.html          # Entry point (same structure as flappy-drone)
├── css/
│   └── game.css        # Styling (copy + adapt from flappy-drone)
└── js/
    ├── config.js       # BO namespace, constants, shared state, pixel font
    ├── background.js   # Reuse: sky, stars, moon, clouds, far city parallax
    ├── buildings.js    # Adapted: wider buildings with grime patches
    ├── drones.js       # Reuse: drone renderers (subset or all 15)
    ├── effects.js      # Adapted: water particles + reuse explosions/fireworks
    ├── ui.js           # Reuse: menu, death sequence, score screen
    └── game.js         # New: jet physics, grime collision, game loop
```

## Detailed Design

### 1. Namespace: `BO` (Blast Off)
Same pattern as `FD`. Global object holding constants, state, and drawing functions.

Key constants:
- `W: 620, H: 640` (same canvas size)
- `GRAVITY: 0.15` (lighter than Flappy's 0.26 — jet needs to counteract it)
- `JET_FORCE: 0.35` (recoil acceleration per frame while firing)
- `MAX_SPEED: 6` (terminal velocity in any direction)
- `SCROLL_SPEED: 1.5` (starting horizontal scroll, ramps up)
- `BUILDING_MIN_W: 80, BUILDING_MAX_W: 160` (wider than Flappy's 56px)
- `GAP_MIN: 140, GAP_MAX: 220` (open sky between buildings)
- `GRIME_SIZE: 20` (each grime patch is ~20x20px)

### 2. Water Jet System (new)

**Aiming**: Jet direction = vector from drone center to mouse/touch position, normalized.

**Firing**: While mouse/touch is held down:
- Spawn water particles along the jet direction (4-6 per frame)
- Apply recoil force to drone: `drone.vx -= dir.x * JET_FORCE`, `drone.vy -= dir.y * JET_FORCE`
- Water particles travel in jet direction with slight spread
- Particles check collision with grime patches and building surfaces

**Water Particles**:
- Color: Cyan/blue with white highlights
- Speed: 8-12 px/frame in aim direction
- Lifespan: 20-30 frames
- Spread: ±5 degrees random
- Trail: Short streak (reuse existing streak particle renderer)

**Jet Visual**: A translucent cone/stream from drone to ~100px out, plus individual water droplet particles.

### 3. Grime System (new)

**Generation**: Each building gets grime patches on its inner facade (the side facing open sky).

```javascript
// Per building, generate grime grid
const cols = Math.floor(building.w / GRIME_SIZE);
const rows = Math.floor(building.h / GRIME_SIZE);
// ~60-80% of cells start as grimy
grimeGrid[col][row] = hash(buildingSeed, col, row) < 0.7;
```

**Cleaning**: When a water particle overlaps a grimy cell:
- Mark cell as clean (instant or fade over ~10 frames for visual satisfaction)
- Spawn small splash particles (white/blue)
- Add to score: +1 per patch cleaned
- Play subtle satisfaction feedback (screen flash or small particle burst)

**Visual**:
- Grimy: Dark brownish-green overlay on building surface
- Clean: Original building color shows through
- Partially clean: Could do opacity fade for extra polish

**Scoring**:
- +1 per grime patch cleaned
- Bonus: Clean an entire building face = "SPOTLESS" bonus (+10)
- Combo: Consecutive patches cleaned without stopping = multiplier

### 4. Building Generation (adapted from Flappy Drone)

Instead of pipe pairs, buildings are:
- Wider (80-160px)
- Full height from ground up to a random top
- Spaced with open-sky gaps (140-220px)
- Have the existing window/neon/ledge details on non-facade sides
- Facade (gap-facing side) has grime grid overlay

The existing `drawBuilding` function can be reused for the base building rendering. Grime is drawn on top as colored overlay rectangles.

### 5. Drone Physics (adapted)

```javascript
// Each frame:
drone.vy += GRAVITY;  // gravity pulls down

if (firing) {
    const dx = mouseX - drone.x;
    const dy = mouseY - drone.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const dirX = dx / dist;
    const dirY = dy / dist;

    // Recoil (opposite direction)
    drone.vx -= dirX * JET_FORCE;
    drone.vy -= dirY * JET_FORCE;
}

// Clamp velocity
drone.vx = clamp(drone.vx, -MAX_SPEED, MAX_SPEED);
drone.vy = clamp(drone.vy, -MAX_SPEED, MAX_SPEED);

// Damping (air resistance)
drone.vx *= 0.98;
drone.vy *= 0.98;

// Apply
drone.x += drone.vx;
drone.y += drone.vy;
```

Drone tilts based on horizontal velocity (visual feedback for recoil direction).

### 6. Collision

- Same AABB hitbox approach as Flappy Drone (20x12 px)
- Check against building rectangles
- Check against ground and ceiling
- Death triggers same sequence: red flash, "YOU DIED", score screen

### 7. Reused Code (direct copy or minimal adaptation)

| Module | Reuse Level | Notes |
|--------|------------|-------|
| `background.js` | ~95% copy | Same sky/stars/moon/clouds/far-city. Change namespace FD→BO |
| `drones.js` | ~90% copy | Same renderers. Maybe start with 3-5 drones + powerwash attachment |
| `effects.js` | ~70% adapt | Reuse particle system, explosions, fireworks. Add water particles |
| `ui.js` | ~80% adapt | Same death sequence, menu, score screen. New HUD for grime % |
| `config.js` | ~60% adapt | New constants, same pixel font, same namespace pattern |
| `buildings.js` | ~50% adapt | Wider buildings, add grime grid rendering |
| `game.js` | ~30% new | New physics (jet), new scoring, new building layout. Same state machine |

### 8. HUD

- **Score**: Top-left, grime patches cleaned count
- **Combo**: Below score, multiplier if active (fades when combo breaks)
- **Water pressure gauge**: Optional — could limit jet usage for resource management (stretch goal)
- **Building progress**: Small bar showing % cleaned on current building (stretch goal)

### 9. Difficulty Progression

| Score | Scroll Speed | Gap Size | Grime Density | Building Width |
|-------|-------------|----------|---------------|----------------|
| 0-10  | 1.5         | 220px    | 60%           | 80-120px       |
| 10-25 | 2.0         | 190px    | 70%           | 100-140px      |
| 25-50 | 2.5         | 160px    | 75%           | 120-160px      |
| 50+   | 3.0         | 140px    | 80%           | 120-160px      |

### 10. Menu

Same structure as Flappy Drone:
- Large hero drone (with powerwash attachment visible)
- Drone picker (left/right arrows)
- Game title: "BLAST OFF" in neon style
- Subtitle: "POWERWASH DRONE"
- Click/tap/space to start
- Mode picker: CLASSIC (endless) vs maybe a timed mode later

### 11. Visual Polish (matches Flappy Drone's quality bar)

- **Water jet glow**: Radial gradient bloom at nozzle point
- **Splash particles**: White/cyan bursts when water hits surfaces
- **Clean shimmer**: Brief sparkle when grime patch is cleaned
- **Wet surface**: Cleaned areas briefly appear darker (wet) then lighten
- **Screen shake**: Light shake when firing jet (amplitude 1-2px)
- **Neon signs**: Same procedural signs on buildings (reused)
- **Fireworks**: Same celebration system at score milestones

## Implementation Plan

### Phase 1: Skeleton (get something on screen)
1. Create `blast-off/` directory structure
2. Copy `index.html`, adapt title and script refs
3. Copy `css/game.css` as-is
4. Create `config.js` with BO namespace and new constants
5. Copy `background.js` (FD→BO namespace swap)
6. Create minimal `buildings.js` — wide buildings, no grime yet
7. Copy one drone renderer into `drones.js`
8. Create minimal `effects.js` — just particle system basics
9. Create minimal `ui.js` — menu + death screen
10. Create `game.js` — state machine, basic scrolling, gravity, jet physics

**Milestone**: Drone flies with jet thrust, buildings scroll, can crash and die.

### Phase 2: Grime System
1. Add grime grid generation to buildings
2. Render grime overlay on building facades
3. Water particle → grime collision detection
4. Cleaning animation (grime fades, splash particles)
5. Score tracking for cleaned patches

**Milestone**: Can clean buildings, score goes up, grime visually disappears.

### Phase 3: Polish & Juice
1. Add remaining drone renderers (with powerwash nozzle attachment)
2. Jet visual effects (glow, stream, splash)
3. Combo system
4. Difficulty ramping
5. Death sequence (reuse Flappy Drone's)
6. Score screen with stats
7. HUD elements
8. Fireworks at milestones

**Milestone**: Complete, polished game matching Flappy Drone's quality.

## Verification

1. Start dev server: `npx serve` from project root or `open blast-off/index.html`
2. Test jet physics: aim in all directions, verify recoil pushes correctly
3. Test grime cleaning: spray buildings, verify patches disappear and score increments
4. Test collision: crash into building/ground/ceiling, verify death sequence plays
5. Test difficulty: play to score 25+, verify speed/gap changes
6. Test mobile: touch input for aim + fire
7. Visual check: cyberpunk aesthetic matches Flappy Drone's quality
